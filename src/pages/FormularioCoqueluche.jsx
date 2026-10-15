import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, FilePenLine, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CoquelucheField from '@/components/coqueluche/CoquelucheField';
import { coquelucheFields, initialCoqueluche, sections, updateCoqueluche, pendingPriorityFields, COQUELUCHE_SOURCE } from '@/lib/coquelucheForm';
import { buildCoqueluchePdf } from '@/lib/coqueluchePdf';
import regiones from '@/data/chile_regiones.json';
import './FormularioCoqueluche.css';

function SectionFields({ section, data, onChange }) {
  const fields = coquelucheFields.filter(f => f.section === section);
  const groups = [...new Set(fields.map(f => f.group || ''))];
  return groups.map(group => <fieldset key={group} className="mb-4 min-w-0">
    {group && <legend className="mb-2 text-sm font-semibold text-blue-800">{group}</legend>}
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.filter(f => (f.group || '') === group).map(field => <CoquelucheField key={field.id} field={field} data={data} onChange={onChange} />)}
    </div>
  </fieldset>);
}

export default function FormularioCoqueluche() {
  const [data, setData] = useState(initialCoqueluche);
  const [open, setOpen] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageError, setImageError] = useState(false);
  const pending = pendingPriorityFields(data);
  const update = (id, value) => setData(previous => updateCoqueluche(previous, id, value, regiones));
  const download = async () => {
    setBusy(true);
    try {
      const pdf = await buildCoqueluchePdf(data);
      pdf.save(`Notificacion_coqueluche_${data.fechaNotificacion || 'sin-fecha'}.pdf`);
    } catch (error) {
      toast.error(error.message || 'No se pudo generar el PDF. Intenta nuevamente.');
    } finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-slate-100 pb-12">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/Templates" aria-label="Volver a plantillas"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="mr-auto"><h1 className="font-bold text-slate-900">Notificación de coqueluche</h1><p className="text-xs text-slate-500">Investigación y notificación · 2 páginas</p></div>
        <Button variant="outline" onClick={() => setOpen(true)} className="gap-2"><FilePenLine className="h-4 w-4" />Completar datos</Button>
        <Button variant="outline" onClick={() => setResetOpen(true)} className="gap-2"><RotateCcw className="h-4 w-4" />Nuevo</Button>
        <Button disabled={busy} onClick={download} className="gap-2"><Download className="h-4 w-4" />{busy ? 'Generando…' : 'Descargar PDF'}</Button>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6">
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        Haz clic en los campos azules para editar directamente el documento. También puedes volver a «Completar datos».
        <p className="mt-1 text-xs">En pantallas pequeñas, desliza el documento horizontalmente o usa el popup. El PDF incluye ambas páginas y puede imprimirse. La descarga no envía la notificación.</p>
      </div>
      <div id="coq-priority-help" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        <p>Los campos marcados con * son obligatorios como guía de llenado hasta Laboratorio. Puedes descargar e imprimir aunque falten datos. Desde Vacunación, los campos son opcionales.</p>
        <p className="mt-1 font-medium">{pending.length ? `${pending.length} campos obligatorios pendientes (resaltados en ámbar).` : 'Datos obligatorios completados.'}</p>
        {pending.length > 0 && <details className="mt-1"><summary className="cursor-pointer">Ver campos pendientes</summary><ul className="mt-2 list-disc pl-5">{pending.map(field => <li key={field.id}>{field.label}</li>)}</ul></details>}
      </div>
      <a href={COQUELUCHE_SOURCE} target="_blank" rel="noreferrer" className="mb-3 inline-block text-sm text-blue-700 underline">Ver formulario original</a>
      {imageError && <p role="alert" className="mb-3 text-sm text-red-700">No se pudo cargar la imagen del formulario. Recarga la página para volver a intentarlo.</p>}
      <div className="overflow-x-auto pb-4" aria-label="Vista previa editable">
        <div className="min-w-[760px] space-y-6">
          {[1, 2].map(page => <section key={page} aria-label={`Página ${page} del formulario`}>
            <p className="mb-2 text-xs font-medium text-slate-500">Página {page} de 2</p>
            <div className="coq-page">
              <img src={`/forms/coqueluche/pagina-${page}.png`} alt={`Formulario original de coqueluche, página ${page}`} draggable={false} onError={() => setImageError(true)} />
              {coquelucheFields.filter(field => field.page === page).map(field => <CoquelucheField key={field.id} field={field} data={data} onChange={update} inline />)}
            </div>
          </section>)}
        </div>
      </div>
    </main>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="z-[70] flex max-h-[92dvh] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6">
          <DialogTitle>Completar notificación de coqueluche</DialogTitle>
          <DialogDescription>Los campos con * son obligatorios como guía de llenado hasta Laboratorio. Puedes pasar a la vista previa, descargar e imprimir aunque estén incompletos. Desde Vacunación, todo es opcional.</DialogDescription>
        </DialogHeader>
        <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={e => { e.preventDefault(); setOpen(false); }}>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-2 sm:px-6">
            {sections.map((title, section) => <details key={title} open={section < 2} className="rounded-lg border border-slate-200 px-4">
              <summary className="cursor-pointer py-3 text-sm font-semibold text-slate-900">{section + 1}. {title}{section >= 5 && <span className="ml-2 text-xs font-normal text-slate-500">Opcional</span>}</summary>
              <SectionFields section={section} data={data} onChange={update} />
            </details>)}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-white p-4"><p className="text-xs text-amber-800">{pending.length} obligatorios pendientes · Puedes continuar</p><Button type="submit">Ver vista previa editable</Button></div>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={resetOpen} onOpenChange={setResetOpen}>
      <DialogContent className="z-[70]"><DialogHeader><DialogTitle>Nuevo formulario</DialogTitle><DialogDescription>Se borrarán los datos ingresados y se restablecerán los datos institucionales y la fecha de hoy.</DialogDescription></DialogHeader>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setResetOpen(false)}>Cancelar</Button><Button onClick={() => {setData(initialCoqueluche()); setResetOpen(false); setOpen(true);}}>Crear nuevo formulario</Button></div>
      </DialogContent>
    </Dialog>
  </div>;
}
