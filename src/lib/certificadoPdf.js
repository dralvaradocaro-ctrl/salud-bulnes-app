// PDF del certificado médico.
// Tipografía Helvetica: es la fuente base del PDF metricamente equivalente a Arial
// (los visores la sustituyen por Arial), evita embeber una fuente con licencia.
import { jsPDF } from 'jspdf';

export const INSTITUCIONES = {
  inalab: {
    id: 'inalab',
    nombre: 'INALAB CENTRO MÉDICO',
    direccion: 'Rosa Eguigurén 813, Oficina 86-61, Santiago Centro',
    fono: '26324285',
    ciudad: 'Santiago',
    logo: '/logo-inalab.jpg',
    logoFormato: 'JPEG',
  },
  bulnes: {
    id: 'bulnes',
    nombre: 'HOSPITAL COMUNITARIO DE SALUD FAMILIAR DE BULNES',
    direccion: 'Balmaceda N° 431, Bulnes, Región de Ñuble',
    fono: '42-2585960',
    ciudad: 'Bulnes',
    logo: '/logo-hospital.png',
    logoFormato: 'PNG',
  },
};

export const INSTITUCION_POR_DEFECTO = 'inalab';

export const getInstitucion = (id) => INSTITUCIONES[id] || INSTITUCIONES[INSTITUCION_POR_DEFECTO];

export const MEDICO = {
  nombre: 'Fernando Alvarado Caro',
  rut: '20.238.504-4',
  titulo: 'Médico Cirujano',
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function fechaLarga(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
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

  // ── Encabezado: logo + datos de la institución ───────────────────────
  const centro = getInstitucion(cert.institucion);
  const TEXT_X = M + 72;
  const TEXT_W = W - M - TEXT_X;

  try {
    const logo = await loadImage(centro.logo);
    doc.addImage(logo, centro.logoFormato, M, y, 58, 58);
  } catch { /* sin logo el documento sigue siendo válido */ }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(centro.nombre.length > 32 ? 12 : 15);
  const nombreLineas = doc.splitTextToSize(centro.nombre, TEXT_W);
  let hy = y + 18;
  nombreLineas.forEach((linea) => {
    doc.text(linea, TEXT_X, hy);
    hy += 15;
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 80, 95);
  hy += 2;
  doc.text(centro.direccion, TEXT_X, hy);
  hy += 14;
  doc.text(`Fono: ${centro.fono}`, TEXT_X, hy);
  doc.setTextColor(15, 23, 42);
  y = Math.max(y + 58, hy + 8) + 12;

  doc.setDrawColor(30, 64, 120);
  doc.setLineWidth(1.4);
  doc.line(M, y, W - M, y);
  y += 34;

  // ── Título ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CERTIFICADO MÉDICO', W / 2, y, { align: 'center', charSpace: 1.4 });
  y += 30;

  // ── Cuadro con la información del paciente ───────────────────────────
  const BOX_H = 78;
  doc.setDrawColor(180, 190, 205);
  doc.setLineWidth(0.8);
  doc.rect(M, y, CW, BOX_H); // sólo contorno, sin relleno

  const COL1_X = M + 18;
  const COL2_X = M + Math.round(CW * 0.62);
  const dato = (label, value, x, ly) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 145);
    doc.text(label.toUpperCase(), x, ly, { charSpace: 0.6 });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(String(value || '—'), x, ly + 14);
  };
  dato('Paciente', cert.paciente, COL1_X, y + 20);
  dato('RUT', cert.rut, COL2_X, y + 20);
  dato('Fecha de emisión', `${centro.ciudad}, ${fechaLarga(cert.fecha)}`, COL1_X, y + 52);
  dato('Código único', cert.code, COL2_X, y + 52);
  y += BOX_H + 36;

  // Zonas fijas del pie: sello de firma electrónica sobre la línea con los
  // datos del médico, y ésta sobre el bloque QR.
  const QR_TOP = H - 150;
  const LINE_Y = QR_TOP - 66;
  const SELLO_W = 250;
  const SELLO_H = 54;
  const SELLO_TOP = LINE_Y - SELLO_H - 10;

  // ── Cuerpo: texto libre del certificado ──────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  const parrafos = (cert.texto || '').split(/\n{1,}/);
  parrafos.forEach((p) => {
    const lines = doc.splitTextToSize(p.trim() || ' ', CW);
    lines.forEach((line) => {
      if (y > SELLO_TOP - 24) { doc.addPage(); y = M; }
      doc.text(line, M, y, { maxWidth: CW });
      y += 18;
    });
    y += 8;
  });

  // ── Sello de firma electrónica ───────────────────────────────────────
  const sx = W / 2 - SELLO_W / 2;
  doc.setDrawColor(30, 64, 120);
  doc.setLineWidth(0.9);
  doc.setFillColor(240, 245, 252);
  doc.roundedRect(sx, SELLO_TOP, SELLO_W, SELLO_H, 5, 5, 'FD');
  doc.setTextColor(30, 64, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FIRMADO ELECTRÓNICAMENTE', W / 2, SELLO_TOP + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${MEDICO.nombre} · RUT ${MEDICO.rut}`, W / 2, SELLO_TOP + 29, { align: 'center' });
  doc.text(`${cert.code} · ${cert.emitidoEn || fechaLarga(cert.fecha)}`, W / 2, SELLO_TOP + 41, {
    align: 'center',
  });
  doc.setTextColor(15, 23, 42);

  doc.setDrawColor(60, 70, 85);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 130, LINE_Y, W / 2 + 130, LINE_Y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(MEDICO.nombre, W / 2, LINE_Y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${MEDICO.titulo} · RUT ${MEDICO.rut}`, W / 2, LINE_Y + 33, { align: 'center' });

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
  const pie = doc.splitTextToSize(
    `${centro.nombre} · ${centro.direccion} · Fono ${centro.fono}`,
    W - tx - M,
  );
  doc.text(pie, tx, QR_TOP + 70);
  doc.setTextColor(15, 23, 42);

  return doc;
}
