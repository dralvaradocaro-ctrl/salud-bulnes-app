export default function FormToolbar({ onNew }) {
  const handleReset = () => {
    if (confirm('¿Borrar todos los datos del formulario?')) onNew();
  };

  return (
    <div className="max-w-[210mm] mx-auto mb-3 flex gap-2 print:hidden">
      <button type="button" className="toolbar-btn" onClick={handleReset}>🗑️ Limpiar formulario</button>
      <div className="flex-1" />
      <button type="button" className="toolbar-btn-primary" onClick={() => window.print()}>
        🖨️ Imprimir
      </button>
    </div>
  );
}
