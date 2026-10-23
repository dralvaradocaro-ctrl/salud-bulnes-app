import { jsPDF } from 'jspdf';
import { sanitizeJsPdf } from '@/lib/pdfText';
import { getInstitucion, MEDICO, fechaLarga } from '@/lib/certificadoPdf';
import { textoMedicamento } from '@/lib/recetaCatalogo';

async function imagen(src) {
  const response = await fetch(src);
  if (!response.ok) throw new Error('No se pudo cargar la imagen del documento.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return `data:image/${src.endsWith('.png') ? 'png' : 'jpeg'};base64,${btoa(binary)}`;
}
export async function buildDocumentoClinicoPdf(receta, { titulo, seccion, lineas, antecedentes = [] }) {
  const doc = sanitizeJsPdf(new jsPDF({ unit: 'pt', format: 'a4' }));
  const centro = getInstitucion(receta.institucion);
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = width - margin * 2;
  const logo = await imagen(centro.logo);
  // Si se solicita firma y no carga, no emitir silenciosamente un documento sin ella.
  const firma = receta.firma && centro.firma ? await imagen(centro.firma) : null;
  let y;
  const header = () => {
    doc.addImage(logo, centro.logoFormato, margin, 35, 48, 48);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(centro.nombre, contentWidth - 65), margin + 65, 47);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(centro.direccion, margin + 65, 76);
    doc.text(`Fono ${centro.fono}`, margin + 65, 90);
    doc.setDrawColor(30, 64, 120); doc.line(margin, 104, width - margin, 104);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(titulo, width / 2, 131, { align: 'center' });
    y = 158;
  };
  const line = (text, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(10.5);
    for (const part of doc.splitTextToSize(text || ' ', contentWidth)) {
      if (y > height - 65) {
        doc.addPage(); header();
        doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(10.5);
      }
      doc.text(part, margin, y); y += 16;
    }
    y += 6;
  };
  header();
  line(`Paciente: ${receta.paciente}`, true);
  line(`RUT: ${receta.rut}    Edad: ${receta.edad} años    Fecha: ${fechaLarga(receta.fecha)}`);
  line(`Dirección: ${receta.direccion}`);
  if (receta.diagnostico.trim()) line(`Dg.: ${receta.diagnostico}`);
  antecedentes.filter(Boolean).forEach(texto => line(texto));
  y += 8; line(seccion, true);
  lineas.forEach((texto, index) => { line(`${index + 1}. ${texto}`); y += 8; });
  if (receta.observaciones.trim()) line(`Indicaciones generales: ${receta.observaciones}`);
  if (y > height - 215) { doc.addPage(); header(); }
  const signatureY = height - 125;
  if (firma) doc.addImage(firma, 'PNG', width / 2 - 75, signatureY - 105, 150, 100);
  doc.setDrawColor(100); doc.line(width / 2 - 130, signatureY, width / 2 + 130, signatureY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(MEDICO.nombre, width / 2, signatureY + 17, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`${MEDICO.titulo} · RUT ${MEDICO.rut}`, width / 2, signatureY + 32, { align: 'center' });
  doc.text(receta.firma ? 'Firma electrónica simple · No constituye firma electrónica avanzada' : 'Firma y timbre', width / 2, signatureY + 48, { align: 'center' });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFontSize(8);
    doc.text(`RUT paciente: ${receta.rut} · ${receta.fecha}`, margin, height - 25);
    doc.text(`Página ${page} de ${pages}`, width - margin, height - 25, { align: 'right' });
  }
  return doc;
}

export function buildRecetaPdf(receta) {
  return buildDocumentoClinicoPdf(receta, {
    titulo: 'RECETA MÉDICA', seccion: 'Rp.', lineas: receta.medicamentos.map(textoMedicamento),
  });
}
