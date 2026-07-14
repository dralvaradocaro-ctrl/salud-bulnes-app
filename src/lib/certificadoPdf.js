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
    // Firma manuscrita + timbre, superpuesta sobre la línea de firma.
    firma: '/firma-alvarado.png',
    firmaProporcion: 682 / 1012,
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

// Devuelve el asset como data URL. Se lo pasamos así a jsPDF en vez de un
// elemento <img>: evita el canvas intermedio (y con él el riesgo de canvas
// "tainted") y hace la generación verificable fuera del navegador.
async function loadImage(src) {
  const buf = await (await fetch(src)).arrayBuffer();
  let bin = '';
  new Uint8Array(buf).forEach((b) => { bin += String.fromCharCode(b); });
  const mime = src.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${btoa(bin)}`;
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
  y += BOX_H + 36;

  // Zonas fijas del pie: a la izquierda el recuadro de firma electrónica, a la
  // derecha el espacio en blanco para la firma manuscrita sobre la línea con
  // los datos del médico; abajo, el bloque de verificación con el QR.
  const QR_TOP = H - 136;
  const LINE_Y = QR_TOP - 62;
  const ESPACIO_FIRMA = 62; // aire sobre la línea para firmar a mano
  const SELLO_W = 236;
  const SELLO_H = 74;
  const SELLO_TOP = LINE_Y - 40;

  // ── Cuerpo: texto libre del certificado ──────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  const parrafos = (cert.texto || '').split(/\n{1,}/);
  parrafos.forEach((p) => {
    const lines = doc.splitTextToSize(p.trim() || ' ', CW);
    lines.forEach((line, i) => {
      if (y > LINE_Y - ESPACIO_FIRMA - 24) { doc.addPage(); y = M; }
      // Justificado salvo la última línea del párrafo, que iría con huecos.
      const esUltima = i === lines.length - 1;
      doc.text(line, M, y, esUltima ? { maxWidth: CW } : { maxWidth: CW, align: 'justify' });
      y += 18;
    });
    y += 8;
  });

  // ── Recuadro de firma electrónica ────────────────────────────────────
  doc.setDrawColor(190, 198, 210);
  doc.setLineWidth(0.7);
  doc.rect(M, SELLO_TOP, SELLO_W, SELLO_H);

  const stx = M + 10;
  doc.setTextColor(70, 80, 95);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Firmado electrónicamente por', stx, SELLO_TOP + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(MEDICO.nombre.toUpperCase(), stx, SELLO_TOP + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 80, 95);
  doc.text(`RUT: ${MEDICO.rut}`, stx, SELLO_TOP + 40);
  doc.text(`Fecha: ${cert.emitidoEn || fechaLarga(cert.fecha)}`, stx, SELLO_TOP + 51);
  doc.setFontSize(6.5);
  doc.setTextColor(140, 150, 165);
  doc.text('Firma electrónica simple, sin validez legal de firma', stx, SELLO_TOP + 62);
  doc.text('electrónica avanzada.', stx, SELLO_TOP + 70);
  doc.setTextColor(15, 23, 42);

  // ── Firma manuscrita (si la institución la tiene) + línea con los datos ─
  const FIRMA_CX = W - M - 110; // eje de la columna derecha

  if (centro.firma) {
    try {
      const firma = await loadImage(centro.firma);
      const fw = 190;
      const fh = fw * (centro.firmaProporcion || 0.67);
      // Superpuesta sobre la línea: la firma la cruza y su base queda bajo LINE_Y.
      doc.addImage(firma, 'PNG', FIRMA_CX - fw / 2, LINE_Y + 20 - fh, fw, fh);
    } catch { /* si no carga, queda el espacio en blanco para firmar a mano */ }
  }

  doc.setDrawColor(60, 70, 85);
  doc.setLineWidth(0.8);
  doc.line(FIRMA_CX - 110, LINE_Y, FIRMA_CX + 110, LINE_Y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(MEDICO.nombre, FIRMA_CX, LINE_Y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${MEDICO.titulo} · RUT ${MEDICO.rut}`, FIRMA_CX, LINE_Y + 32, { align: 'center' });
  if (!centro.firma) {
    doc.setFontSize(7.5);
    doc.setTextColor(140, 150, 165);
    doc.text('Firma y timbre', FIRMA_CX, LINE_Y + 44, { align: 'center' });
    doc.setTextColor(15, 23, 42);
  }

  // ── Bloque de verificación: QR + URL + código ────────────────────────
  doc.setDrawColor(200, 208, 218);
  doc.setLineWidth(0.7);
  doc.line(M, QR_TOP - 14, W - M, QR_TOP - 14);

  const QR_SIZE = 76;
  if (cert.qrDataUrl) {
    doc.addImage(cert.qrDataUrl, 'PNG', M, QR_TOP, QR_SIZE, QR_SIZE);
  }
  const tx = M + QR_SIZE + 14;
  const tw = W - M - tx;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Verifique la autenticidad de este documento en:', tx, QR_TOP + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 120);
  doc.text(doc.splitTextToSize(cert.verifyBaseUrl || cert.verifyUrl, tw), tx, QR_TOP + 24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Código de verificación:', tx, QR_TOP + 42);
  doc.setFont('helvetica', 'bold');
  doc.text(cert.code, tx + doc.getTextWidth('Código de verificación: '), QR_TOP + 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 130, 145);
  doc.text(
    doc.splitTextToSize(`${centro.nombre} · ${centro.direccion} · Fono ${centro.fono}`, tw),
    tx,
    QR_TOP + 60,
  );
  doc.setTextColor(15, 23, 42);

  return doc;
}
