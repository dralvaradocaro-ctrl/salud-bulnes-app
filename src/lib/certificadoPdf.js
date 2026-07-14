// PDF del certificado médico de INALAB CENTRO MÉDICO.
// Tipografía Helvetica: es la fuente base del PDF metricamente equivalente a Arial
// (los visores la sustituyen por Arial), evita embeber una fuente con licencia.
import { jsPDF } from 'jspdf';

export const CENTRO = {
  nombre: 'INALAB CENTRO MÉDICO',
  direccion: 'Rosa Eguigurén 813, Oficina 86-61, Santiago Centro',
  fono: '26324285',
  logo: '/logo-inalab.jpg',
};

export const MEDICO = {
  nombre: 'Fernando Alvarado Caro',
  rut: '20.238.504-4',
  titulo: 'Médico Cirujano',
  firma: '/firma-alvarado.png', // firma manuscrita + timbre
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function fechaLarga(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `Santiago, ${d} de ${MESES[m - 1]} de ${y}`;
}

async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

/**
 * @param {{ code: string, paciente: string, rut: string, fecha: string,
 *           texto: string, verifyUrl: string, qrDataUrl: string }} cert
 * @returns {Promise<jsPDF>}
 */
export async function buildCertificadoPdf(cert) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  const CW = W - 2 * M; // ancho útil
  let y = M;

  // ── Encabezado: logo + datos del centro ──────────────────────────────
  try {
    const logo = await loadImage(CENTRO.logo);
    doc.addImage(logo, 'JPEG', M, y, 58, 58);
  } catch { /* sin logo el documento sigue siendo válido */ }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(CENTRO.nombre, M + 72, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 80, 95);
  doc.text(CENTRO.direccion, M + 72, y + 36);
  doc.text(`Fono: ${CENTRO.fono}`, M + 72, y + 50);
  doc.setTextColor(15, 23, 42);
  y += 74;

  doc.setDrawColor(30, 64, 120);
  doc.setLineWidth(1.4);
  doc.line(M, y, W - M, y);
  y += 34;

  // ── Título ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CERTIFICADO MÉDICO', W / 2, y, { align: 'center' });
  y += 26;

  // ── Cuadro con la información del paciente ───────────────────────────
  const BOX_H = 74;
  doc.setDrawColor(150, 160, 175);
  doc.setLineWidth(0.9);
  doc.setFillColor(244, 247, 251);
  doc.rect(M, y, CW, BOX_H, 'FD');

  const labelX = M + 14;
  const valueX = M + 100;
  let by = y + 22;
  const fila = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(label, labelX, by);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || '—'), valueX, by);
    by += 18;
  };
  fila('Paciente:', cert.paciente);
  fila('RUT:', cert.rut);
  fila('Fecha:', fechaLarga(cert.fecha));
  y += BOX_H + 32;

  // ── Cuerpo del certificado ───────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  const intro = `Certifico que ${cert.paciente || 'el/la paciente'}, RUT ${cert.rut || '—'}:`;
  doc.setFont('helvetica', 'bold');
  doc.text(doc.splitTextToSize(intro, CW), M, y);
  y += 26;

  // Zonas fijas del pie: firma/timbre sobre el bloque QR.
  const QR_TOP = H - 150;
  const FIRMA_W = 200;
  const FIRMA_H = Math.round(FIRMA_W * (682 / 1012)); // proporción de la imagen
  const FIRMA_TOP = QR_TOP - FIRMA_H - 20;

  doc.setFont('helvetica', 'normal');
  const parrafos = (cert.texto || '').split(/\n{1,}/);
  parrafos.forEach((p) => {
    const lines = doc.splitTextToSize(p.trim() || ' ', CW);
    lines.forEach((line) => {
      if (y > FIRMA_TOP - 20) { doc.addPage(); y = M; }
      doc.text(line, M, y, { maxWidth: CW });
      y += 17;
    });
    y += 6;
  });

  // ── Firma y timbre ───────────────────────────────────────────────────
  try {
    const firma = await loadImage(MEDICO.firma);
    doc.addImage(firma, 'PNG', W / 2 - FIRMA_W / 2, FIRMA_TOP, FIRMA_W, FIRMA_H);
  } catch {
    // Sin la imagen, se cae al bloque de firma en texto.
    const sy = FIRMA_TOP + FIRMA_H - 26;
    doc.setDrawColor(60, 70, 85);
    doc.setLineWidth(0.8);
    doc.line(W / 2 - 90, sy, W / 2 + 90, sy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(MEDICO.nombre, W / 2, sy + 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`${MEDICO.titulo} · RUT ${MEDICO.rut}`, W / 2, sy + 29, { align: 'center' });
  }

  // ── Pie: QR de verificación + código único ───────────────────────────
  doc.setDrawColor(200, 208, 218);
  doc.setLineWidth(0.7);
  doc.line(M, QR_TOP - 16, W - M, QR_TOP - 16);

  if (cert.qrDataUrl) {
    doc.addImage(cert.qrDataUrl, 'PNG', M, QR_TOP, 84, 84);
  }
  const tx = M + 98;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Verifique la autenticidad de este documento escaneando este código QR.', tx, QR_TOP + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Código único: ${cert.code}`, tx, QR_TOP + 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 145);
  doc.text(`${CENTRO.nombre} · ${CENTRO.direccion} · Fono ${CENTRO.fono}`, tx, QR_TOP + 76);
  doc.setTextColor(15, 23, 42);

  return doc;
}
