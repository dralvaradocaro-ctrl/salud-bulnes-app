import { useRef } from 'react';

export default function FormToolbar({ formData, onNew, onDuplicate, onLoad }) {
  const fileRef = useRef(null);

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
      <button type="button" className="toolbar-btn-primary" onClick={() => window.print()}>
        🖨️ Imprimir
      </button>
    </div>
  );
}
