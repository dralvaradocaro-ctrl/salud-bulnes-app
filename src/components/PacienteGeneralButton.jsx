import { UserRound } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePacienteGeneral } from '@/lib/PacienteGeneral';
import { formatRut, validateRut } from '@/lib/rut-ges';

export default function PacienteGeneralButton() {
  const general = usePacienteGeneral();
  if (!general) return null;
  const paciente = general.paciente || { nombre: '', rut: '' };
  const cambiar = (campo, valor) => general.actualizar({ ...paciente, [campo]: valor });
  return <div className="fixed right-4 top-3 z-[65] print:hidden">
    <Popover>
      <PopoverTrigger asChild><button type="button" aria-label="Datos del paciente" title={paciente.nombre ? `Paciente: ${paciente.nombre}` : 'Datos del paciente'} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-700 shadow-lg hover:bg-blue-50"><UserRound className="h-5 w-5" />{paciente.nombre && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-blue-600" />}</button></PopoverTrigger>
      <PopoverContent align="end" className="z-[70] w-80 max-w-[calc(100vw-2rem)] space-y-3 bg-white text-slate-900">
        <h2 className="font-semibold">Paciente actual</h2>
        <p className="text-xs text-slate-500">Nombre y RUT para documentos y calculadoras de esta pestaña. Los cambios se aplican automáticamente.</p>
        <label className="block text-sm">Nombre<input className="mt-1 w-full rounded-lg border p-2" autoComplete="off" value={paciente.nombre} onChange={e => cambiar('nombre', e.target.value)} /></label>
        <label className="block text-sm">RUT<input className="mt-1 w-full rounded-lg border p-2" autoComplete="off" placeholder="12.345.678-9" value={paciente.rut} onChange={e => cambiar('rut', formatRut(e.target.value))} /></label>
        {paciente.rut && !validateRut(paciente.rut) && <p role="status" className="text-xs text-red-700">Revisa el RUT y su dígito verificador.</p>}
        <button type="button" onClick={() => general.actualizar({ nombre: '', rut: '' })} className="text-sm font-semibold text-blue-700 underline">Limpiar nombre y RUT</button>
      </PopoverContent>
    </Popover>
  </div>;
}
