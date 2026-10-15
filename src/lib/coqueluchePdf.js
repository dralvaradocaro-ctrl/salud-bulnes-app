import { jsPDF } from 'jspdf';
import { coquelucheFields, dateParts, FORM_WIDTH, FORM_HEIGHT } from './coquelucheForm.js';

async function loadPage(page) {
  const response = await fetch(`/forms/coqueluche/pagina-${page}.png`);
  if (!response.ok) throw new Error('No se pudo cargar el formulario original.');
  return new Uint8Array(await response.arrayBuffer());
}

export async function buildCoqueluchePdf(data) {
  const images = await Promise.all([loadPage(1), loadPage(2)]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  doc.setProperties({ title: 'Formulario de investigación y notificación para casos de coqueluche' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const sx = w / FORM_WIDTH;
  const sy = h / FORM_HEIGHT;
  const write = (text, x, y, width, size = 8.5) => {
    doc.setFontSize(size);
    const measured = doc.getTextWidth(text);
    if (measured > width * sx) doc.setFontSize(size * width * sx / measured);
    doc.text(text, x * sx, y * sy);
  };
  for (const page of [1, 2]) {
    if (page > 1) doc.addPage();
    doc.addImage(images[page - 1], 'PNG', 0, 0, w, h);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    for (const field of coquelucheFields.filter(f => f.page === page)) {
      const value = data[field.id];
      if (value === '' || value === false || value == null) continue;
      if (field.type === 'choice' || field.type === 'checkbox') {
        const mark = field.type === 'choice' ? field.options.find(o => o.value === value) : field;
        if (mark) write('X', mark.x + 5, mark.y + 18, field.w, 9);
      } else if (field.type === 'date') {
        dateParts(value).forEach((part, i) => {
          doc.setFontSize(8);
          doc.text(part, (field.x + field.w * [0.135, 0.5, 0.875][i]) * sx, (field.y + 17) * sy, { align: 'center' });
        });
      } else {
        write(String(value), field.x + 2, field.y + 17, field.w - 4);
      }
    }
  }
  return doc;
}
