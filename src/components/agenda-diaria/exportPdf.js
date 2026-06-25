// Genera el PDF de la Agenda Diaria como TABLA con colores por tipo de actividad,
// con el formato de la planilla institucional:
//   AGENDA DD-MM-YYYY
//   [MÉDICO] | [TURNO / POST TURNO / REFUERZO / gestión@08:00 / MQ1 SALA 2 (2) …] | [Nº]
import { jsPDF } from 'jspdf';
import { buildRoster, KIND_RGB } from './roster';

const fmtDmy = (iso) => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;
const hhmm = (t) => (t || '').slice(0, 5);
const blockDoctorIds = (b) =>
  Array.isArray(b?.doctor_ids) && b.doctor_ids.length ? b.doctor_ids.filter(Boolean) : (b?.doctor_id ? [b.doctor_id] : []);

async function loadLogo() {
  const img = new Image();
  img.src = '/logo-hospital.png';
  await img.decode();
  return img;
}

export async function exportDailyAgendaPdf({ date, day, result, telemed = [], extraBlocks = [], docName }) {
  const { rows, interns } = buildRoster({ day, result, extraBlocks, docName });
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const M = 40;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const NAME_X = M + 8;
  const TEXT_X = M + 150;
  const NUM_X = W - M - 8;
  const TEXT_W = NUM_X - TEXT_X - 16;
  const COL_NUM_X = W - M - 40; // borde izq de la columna número
  let y = M;

  // Título + logo institucional
  try {
    const logo = await loadLogo();
    doc.addImage(logo, 'PNG', M, y - 8, 48, 48);
  } catch { /* si el asset no carga, el PDF sigue siendo usable */ }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text(`AGENDA  ${fmtDmy(date)}`, M + 58, y + 8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text('HOSPITAL COMUNITARIO DE SALUD FAMILIAR DE BULNES', M + 58, y + 22);
  doc.setTextColor(15, 23, 42);
  y += 50;

  const drawRow = (name, parts, num, { bold = false } = {}) => {
    doc.setFontSize(10);
    // calcular alto según wrap de la asignación
    const segs = parts.map((p) => p.text).join('   ');
    const lines = doc.splitTextToSize(segs, TEXT_W);
    const rowH = Math.max(20, lines.length * 12 + 8);
    if (y + rowH > H - M) { doc.addPage(); y = M; }

    // borde y fondo de columna nombre
    doc.setDrawColor(210); doc.setLineWidth(0.5);
    doc.rect(M, y, W - 2 * M, rowH);
    doc.setFillColor(245, 247, 250);
    doc.rect(M, y, TEXT_X - M - 6, rowH, 'F');
    doc.line(TEXT_X - 6, y, TEXT_X - 6, y + rowH);
    if (num != null) doc.line(COL_NUM_X, y, COL_NUM_X, y + rowH);

    const ty = y + 14;
    // nombre
    doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
    doc.text((name || '').toUpperCase(), NAME_X, ty, { maxWidth: TEXT_X - NAME_X - 10 });

    // asignación: escribir cada parte con su color, separando por " + "
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    let lx = TEXT_X;
    let ly = ty;
    const sep = '  +  ';
    parts.forEach((p, i) => {
      const chunk = (i > 0 ? sep : '') + p.text;
      const w = doc.getTextWidth(chunk);
      if (lx + w > TEXT_X + TEXT_W && lx > TEXT_X) { ly += 12; lx = TEXT_X; }
      const rgb = KIND_RGB[p.kind] || [15, 23, 42];
      // separador en gris
      if (i > 0) {
        doc.setTextColor(150, 150, 150);
        doc.text(sep, lx, ly); lx += doc.getTextWidth(sep);
      }
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text(p.text, lx, ly); lx += doc.getTextWidth(p.text);
    });

    // número
    if (num != null) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.setFontSize(11);
      doc.text(String(num), NUM_X, ty, { align: 'right' });
    }
    doc.setTextColor(15, 23, 42);
    y += rowH;
  };

  rows.forEach((r) => drawRow(r.name, r.parts, r.num));
  interns.forEach((it) =>
    drawRow(`INT ${it.name || 'Interno'}`, [{ text: it.label, kind: 'visita' }], it.num));

  // ── BLOQUEOS ───────────────────────────────────────────────────────────────
  const bloqueos = (day?.bloqueos || []).filter((b) => !b.suspended && b.category !== 'feriado');
  if (bloqueos.length) {
    y += 16;
    if (y > H - M - 40) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
    doc.text('BLOQUEOS:', M, y); y += 16;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    bloqueos.forEach((b) => {
      if (y > H - M) { doc.addPage(); y = M; }
      const doctors = blockDoctorIds(b).map(docName).join(' + ');
      const line = `${b.from ? `${hhmm(b.from)}-${hhmm(b.to)}` : ''}  ${doctors ? `${doctors} ` : ''}${b.name || 'Bloqueo'}`;
      doc.text(line, M, y); y += 14;
    });
  }

  // ── TELEMEDICINA ────────────────────────────────────────────────────────────
  if (telemed.length) {
    y += 16;
    if (y > H - M - 40) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
    doc.text('TELEMEDICINA:', M, y); y += 16;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    telemed.forEach((t) => {
      if (y > H - M) { doc.addPage(); y = M; }
      const line = `•  ${t.specialty || 'Telemedicina'}${t.time ? `  ${t.time}` : ''}${t.doctor ? `  (${t.doctor})` : ''}`;
      doc.text(line, M, y); y += 14;
    });
  }

  doc.save(`agenda-diaria-${date}.pdf`);
}
