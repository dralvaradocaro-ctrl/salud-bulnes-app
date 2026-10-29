import { useState } from 'react';
import { Check, UserRound } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePacienteGeneral } from '@/lib/PacienteGeneral';
import { formatRut, validateRut } from '@/lib/rut-ges';
import { ageFromBirthDate } from '@/lib/patientProfile';
import { DIAGNOSTICOS_FRECUENTES } from '@/lib/hospitalSuggestions';

const VACIO = { nombre: '', rut: '', diagnostico: '', fechaNacimiento: '' };
const CAMPOS = Object.keys(VACIO);

// Va justo encima de la campana de Novedades (abajo a la derecha).
export default function PacienteGeneralButton() {
  const general = usePacienteGeneral();
  const [draft, setDraft] = useState(VACIO);
  const [saved, setSaved] = useState(false);
  if (!general) return null;
  const paciente = { ...VACIO, ...general.paciente };
  const dirty = CAMPOS.some(campo => draft[campo] !== paciente[campo]);
  const edad = ageFromBirthDate(draft.fechaNacimiento);
  const cambiar = (campo, valor) => { setSaved(false); setDraft(old => ({ ...old, [campo]: valor })); };
  const guardar = () => { general.actualizar(draft); setSaved(true); };
  const limpiar = () => { setDraft(VACIO); general.actualizar(VACIO); setSaved(false); };
  return <div className="fixed bottom-[8.5rem] right-3 z-[65] md:bottom-[4.5rem] md:right-5 print:hidden">
    <Popover onOpenChange={open => { if (open) { setDraft(Object.fromEntries(CAMPOS.map(campo => [campo, paciente[campo]]))); setSaved(false); } }}>
      <PopoverTrigger asChild><button type="button" aria-label="Datos del paciente" title={paciente.nombre ? `Paciente: ${paciente.nombre}` : 'Datos del paciente'} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white/95 text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur hover:bg-blue-50"><UserRound className="h-4 w-4" />{paciente.nombre && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-blue-600" />}</button></PopoverTrigger>
      <PopoverContent side="top" align="end" className="z-[70] w-72 max-w-[calc(100vw-2rem)] space-y-3 bg-white text-slate-900">
        <h2 className="text-sm font-semibold">Paciente actual</h2>
        <label className="block text-xs text-slate-600">Nombre<input className="mt-1 w-full rounded-lg border p-2 text-sm text-slate-900" autoComplete="off" value={draft.nombre} onChange={e => cambiar('nombre', e.target.value)} /></label>
        <label className="block text-xs text-slate-600">RUT<input className="mt-1 w-full rounded-lg border p-2 text-sm text-slate-900" autoComplete="off" placeholder="12.345.678-9" value={draft.rut} onChange={e => cambiar('rut', formatRut(e.target.value))} onKeyDown={e => { if (e.key === 'Enter' && dirty) guardar(); }} /></label>
        {draft.rut && !validateRut(draft.rut) && <p role="status" className="text-xs text-red-700">Revisa el RUT y su dígito verificador.</p>}
        <label className="block text-xs text-slate-600"><span className="flex justify-between">Fecha de nacimiento{edad && <span className="font-medium text-slate-800">{edad} años</span>}</span><input type="date" className="mt-1 w-full rounded-lg border p-2 text-sm text-slate-900" value={draft.fechaNacimiento} onChange={e => cambiar('fechaNacimiento', e.target.value)} /></label>
        <label className="block text-xs text-slate-600">Diagnóstico<textarea rows={2} className="mt-1 w-full resize-y rounded-lg border p-2 text-sm text-slate-900" value={draft.diagnostico} onChange={e => cambiar('diagnostico', e.target.value)} /></label>
        <select aria-label="Agregar diagnóstico frecuente" value="" onChange={e => e.target.value && cambiar('diagnostico', draft.diagnostico.trim() ? `${draft.diagnostico.trim()}\n${e.target.value}` : e.target.value)} className="-mt-2 h-8 w-full rounded-md border bg-white px-2 text-xs text-slate-600">
          <option value="">+ Diagnóstico frecuente…</option>
          {DIAGNOSTICOS_FRECUENTES.map(dx => <option key={dx} value={dx}>{dx}</option>)}
        </select>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={limpiar} className="text-xs text-slate-500 underline hover:text-slate-700">Limpiar</button>
          {saved && !dirty
            ? <span role="status" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" />Guardado</span>
            : <button type="button" onClick={guardar} disabled={!dirty} className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400">Guardar</button>}
        </div>
      </PopoverContent>
    </Popover>
  </div>;
}
