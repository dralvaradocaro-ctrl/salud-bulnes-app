import { INSTITUCIONES } from '@/lib/certificadoPdf';

export default function InstitucionSelector({ value, onChange }) {
  return <fieldset>
    <legend className="mb-1 text-sm font-semibold text-slate-700">Institución</legend>
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.values(INSTITUCIONES).map(inst => <button key={inst.id} type="button" onClick={() => onChange(inst.id)} aria-pressed={value === inst.id} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${value === inst.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
        <img src={inst.logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
        <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{inst.id === 'bulnes' ? 'Hospital de Bulnes' : 'Inalab Centro Médico'}</span><span className="block text-xs text-slate-500">Fono {inst.fono}</span></span>
      </button>)}
    </div>
  </fieldset>;
}
