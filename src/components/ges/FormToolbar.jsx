import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function FormToolbar({ formRef, formData, onNew, onDuplicate, onLoad }) {
  const fileRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExportPdf = async () => {
    if (!formRef.current || exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      if (imgH <= pageH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH);
      } else {
        // Multi-page if content overflows
        let yOffset = 0;
        while (yOffset < imgH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageW, imgH);
          yOffset += pageH;
        }
      }

      pdf.save(`formulario_ges_${Date.now()}.pdf`);
    } catch (err) {
      console.error('[PDF Export]', err);
      setExportError('Error al generar PDF. Intente nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  const handleSave = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borrador_ges_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result);
        onLoad(data);
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-[210mm] mx-auto mb-3 flex flex-wrap gap-2 print:hidden">
      <button type="button" className="toolbar-btn" onClick={onNew}>📄 Nuevo</button>
      <button type="button" className="toolbar-btn" onClick={onDuplicate}>📋 Duplicar</button>
      <button type="button" className="toolbar-btn" onClick={handleSave}>💾 Guardar borrador</button>
      <button type="button" className="toolbar-btn" onClick={() => fileRef.current?.click()}>📂 Cargar borrador</button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleLoad} />
      <div className="flex-1" />
      <button
        type="button"
        className="toolbar-btn-primary"
        onClick={handleExportPdf}
        disabled={exporting}
      >
        {exporting ? '⏳ Generando...' : '📥 Exportar PDF'}
      </button>
    </div>
  );
}
