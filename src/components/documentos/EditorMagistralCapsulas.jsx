import { ChevronDown, FileText } from 'lucide-react';
import { textoMedicamento } from '@/lib/recetaCatalogo';

const estilo = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const numeroCapsulas = texto => /^(\d+) cápsulas?$/.exec(texto || '')?.[1] ?? '';
const capsulas = n => n ? `${n} ${n === '1' ? 'cápsula' : 'cápsulas'}` : '';
const chip = activo => `rounded-full border px-2.5 py-1 text-xs transition-colors ${activo ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-slate-900'}`;
const resumen = 'flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 [&::-webkit-details-marker]:hidden';

function Campo({ label, value, onChange, ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input {...props} className={estilo} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
function Opciones({ label, value, opciones, onChange }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<select className={estilo} value={value} onChange={e => onChange(e.target.value)}><option value="">Seleccionar</option>{[...new Set([value, ...opciones])].filter(Boolean).map(v => <option key={v}>{v}</option>)}</select></label>;
}

export default function EditorMagistralCapsulas({ item, onChange }) {
  const editar = (campo, valor) => onChange({ [campo]: valor });
  const fijarCantidad = n => onChange({ cantidad: capsulas(n), vehiculo: n ? `En cápsulas c.s.p. ${capsulas(n)}` : '' });
  const cantidad = numeroCapsulas(item.cantidad);
  return <div className="space-y-4">
    <div className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-700">Composición por cápsula</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-violet-950">{item.formula || 'Sin composición'}</p>
    </div>
    <div className="space-y-3 rounded-lg bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Preparación y posología</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Campo label="Cápsulas a preparar *" type="number" min="1" step="1" value={cantidad} onChange={n => { if (!n || /^[1-9]\d*$/.test(n)) fijarCantidad(n); }} />
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Cantidad rápida">{['30', '40', '60', '90'].map(n => <button key={n} type="button" aria-pressed={cantidad === n} className={chip(cantidad === n)} onClick={() => fijarCantidad(n)}>{n}</button>)}</div>
        </div>
        {numeroCapsulas(item.dosis) || !item.dosis ? <Campo label="Cápsulas por toma *" type="number" min="1" step="1" value={numeroCapsulas(item.dosis)} onChange={n => { if (!n || /^[1-9]\d*$/.test(n)) editar('dosis', capsulas(n)); }} /> : <Campo label="Dosis *" value={item.dosis} onChange={v => editar('dosis', v)} />}
        <Opciones label="Frecuencia *" value={item.frecuencia} opciones={['Una vez al día', 'Cada 12 horas', 'Cada 8 horas', 'Cada 48 horas']} onChange={v => editar('frecuencia', v)} />
        <Opciones label="Duración *" value={item.duracion} opciones={['15 días', '30 días', '2 meses', '3 meses', '6 meses', '12 meses']} onChange={v => editar('duracion', v)} />
      </div>
    </div>
    <Campo label="Instrucciones adicionales / autorización de repetición" value={item.indicaciones} onChange={v => editar('indicaciones', v)} placeholder="Ej.: Autorizo repetir por 6 meses" />
    <details className="group text-sm"><summary className={resumen}><ChevronDown className="h-4 w-4 -rotate-90 transition-transform duration-150 group-open:rotate-0" />Editar composición, vía u otra pauta</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">
      <Campo label="Nombre" value={item.nombre} onChange={v => editar('nombre', v)} />
      <label className="block text-sm font-medium text-slate-700">Composición y concentraciones *<textarea className={estilo} rows={3} value={item.formula} onChange={e => editar('formula', e.target.value)} /></label>
      {['presentacion', 'via', 'dosis', 'frecuencia', 'duracion'].map((campo, i) => <Campo key={campo} label={['Presentación', 'Vía *', 'Dosis personalizada *', 'Frecuencia personalizada *', 'Duración personalizada *'][i]} value={item[campo]} onChange={v => editar(campo, v)} />)}
    </div></details>
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><FileText className="h-3.5 w-3.5" />Así se imprime</p>
      <p className="mt-1.5 whitespace-pre-line font-serif text-sm leading-relaxed text-slate-700">{textoMedicamento(item)}</p>
    </div>
  </div>;
}
