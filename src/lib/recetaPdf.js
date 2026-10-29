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
export async function buildDocumentoClinicoPdf(receta, { titulo, seccion, lineas = [], tablas = [], antecedentes = [] }) {
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
  y += 8; if (seccion) line(seccion, true);
  if (tablas.length) {
    for (const tabla of tablas) {
    const widths = [30, 220, contentWidth - 250];
    const row = (cells, heading = false) => {
      doc.setFont('helvetica', heading ? 'bold' : 'normal'); doc.setFontSize(9);
      const wrapped = cells.map((cell, i) => doc.splitTextToSize(String(cell || '—'), widths[i] - 12));
      const count = Math.max(...wrapped.map(parts => parts.length));
      // Split oversized rows safely across pages, with repeated column headings.
      let offset = 0;
      while (offset < count) {
        if (y + 28 > height - 65) { doc.addPage(); header(); tableTitle(); tableHeader(); }
        const capacity = Math.max(1, Math.floor((height - 65 - y - 12) / 14));
        const take = Math.min(count - offset, capacity);
        const rowHeight = take * 14 + 12;
        let x = margin;
        doc.setFont('helvetica', heading ? 'bold' : 'normal'); doc.setFontSize(9);
        wrapped.forEach((parts, i) => {
          doc.setDrawColor(180, 190, 205); doc.setLineWidth(0.5);
          if (heading) { doc.setFillColor(240, 244, 248); doc.rect(x, y, widths[i], rowHeight, 'FD'); }
          else doc.rect(x, y, widths[i], rowHeight);
          const segment = parts.slice(offset, offset + take);
          segment.forEach((part, j) => doc.text(part, x + 6, y + 16 + j * 14));
          x += widths[i];
        });
        y += rowHeight;
        offset += take;
      }
    };
    const tableTitle = () => line(tabla.titulo, true);
    const tableHeader = () => row(tabla.encabezados, true);
    if (y + 80 > height - 65) { doc.addPage(); header(); }
    tableTitle();
    tableHeader();
    tabla.filas.forEach((cells, index) => row([String(index + 1), ...cells]));
    y += 16;
    }
  } else {
    lineas.forEach((texto, index) => {
      const parts = texto.split('\n');
      const needed = parts.reduce((n, part) => n + doc.splitTextToSize(part, contentWidth).length * 16 + 6, 0);
      if (y + needed > height - 65 && needed < height - 240) { doc.addPage(); header(); }
      line(`${index + 1}. ${parts[0]}`, true);
      parts.slice(1).forEach(part => line(part));
      y += 8;
    });
  }
  if (receta.textoLibre?.trim()) { line('Otras indicaciones:', true); line(receta.textoLibre); }
  if (receta.observaciones.trim()) line(`Indicaciones generales: ${receta.observaciones}`);
  if (y > height - 242) { doc.addPage(); header(); }
  const signatureY = height - 125;
  if (firma) doc.addImage(firma, 'PNG', width / 2 - 75, signatureY - 105, 150, 150 * (centro.firmaProporcion || 2 / 3));
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
