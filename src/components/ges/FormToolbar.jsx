import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function FormToolbar({ formRef, formData, onNew, onDuplicate, onLoad }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState('');

  const handleCapture = async () => {
    if (capturing || !formRef?.current) return;
    setCapturing(true);
    setCaptureError('');
    try {
      const el = formRef.current;

      // Temporarily expose overflow so toPng captures all content (no right-side clipping)
      const prevOverflow = el.style.overflow;
      const prevMaxW = el.style.maxWidth;
      el.style.overflow = 'visible';
      el.style.maxWidth = 'none';
      await new Promise(r => requestAnimationFrame(r));

      const captureW = el.scrollWidth;
      const captureH = el.scrollHeight;

      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: captureW,
        height: captureH,
        cacheBust: true,
      });

      // Restore styles
      el.style.overflow = prevOverflow;
      el.style.maxWidth = prevMaxW;

      setPreview({ dataUrl, captureW, captureH });
    } catch (err) {
      console.error('[Capture]', err);
      setCaptureError(`Error: ${err?.message ?? 'No se pudo capturar el formulario.'}`);
    } finally {
      setCapturing(false);
    }
  };

  const handlePrint = () => {
    if (!preview) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><style>
      *{margin:0;padding:0;box-sizing:border-box}
      @page{size:A4 portrait;margin:0}
      body{background:#fff}
      img{width:100%;display:block}
    </style></head><body><img src="${preview.dataUrl}" /></body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const handleDownloadPdf = () => {
    if (!preview) return;
    const { dataUrl, captureW, captureH } = preview;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (captureH / captureW) * pageW;

    if (imgH <= pageH) {
      pdf.addImage(dataUrl, 'PNG', 0, 0, pageW, imgH);
    } else {
      let yOffset = 0;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, -yOffset, pageW, imgH);
        yOffset += pageH;
      }
    }
    pdf.save(`formulario_ges_${Date.now()}.pdf`);
    setPreview(null);
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
    <>
      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mt-4 mb-4">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <span className="font-semibold text-gray-800">Vista previa del formulario</span>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-3 bg-gray-100 max-h-[65vh] overflow-y-auto">
              <img
                src={preview.dataUrl}
                alt="Vista previa"
                className="w-full border border-gray-300 shadow-sm"
              />
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t">
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setPreview(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={handlePrint}
              >
                🖨️ Imprimir
              </button>
              <button
                type="button"
                className="toolbar-btn-primary"
                onClick={handleDownloadPdf}
              >
                📥 Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
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
          onClick={handleCapture}
          disabled={capturing}
        >
          {capturing ? '⏳ Generando...' : '📄 Vista previa / PDF'}
        </button>
        {captureError && (
          <div className="w-full text-red-600 text-xs mt-1">{captureError}</div>
        )}
      </div>
    </>
  );
}
