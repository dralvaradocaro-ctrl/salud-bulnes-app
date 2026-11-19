import { textoMedicamento } from '@/lib/recetaCatalogo';

const estilo = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const numeroCapsulas = texto => /^(\d+) cápsulas?$/.exec(texto || '')?.[1] ?? '';
const capsulas = n => n ? `${n} ${n === '1' ? 'cápsula' : 'cápsulas'}` : '';

function Campo({ label, value, onChange, ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input {...props} className={estilo} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
function Opciones({ label, value, opciones, onChange }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<select className={estilo} value={value} onChange={e => onChange(e.target.value)}><option value="">Seleccionar</option>{[...new Set([value, ...opciones])].filter(Boolean).map(v => <option key={v}>{v}</option>)}</select></label>;
}

export default function EditorMagistralCapsulas({ item, onChange }) {
  const editar = (campo, valor) => onChange({ [campo]: valor });
  return <div className="space-y-4">
    <p className="whitespace-pre-line rounded-lg bg-violet-50 p-3 text-sm text-violet-900">{item.formula}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <Campo label="Cápsulas a preparar *" type="number" min="1" step="1" value={numeroCapsulas(item.cantidad)} onChange={n => {
        if (n && !/^[1-9]\d*$/.test(n)) return;
        onChange({ cantidad: capsulas(n), vehiculo: n ? `En cápsulas c.s.p. ${capsulas(n)}` : '' });
      }} />
      {numeroCapsulas(item.dosis) || !item.dosis ? <Campo label="Cápsulas por toma *" type="number" min="1" step="1" value={numeroCapsulas(item.dosis)} onChange={n => {
        if (n && !/^[1-9]\d*$/.test(n)) return;
        editar('dosis', capsulas(n));
      }} /> : <Campo label="Dosis *" value={item.dosis} onChange={v => editar('dosis', v)} />}
      <Opciones label="Frecuencia *" value={item.frecuencia} opciones={['Una vez al día', 'Cada 12 horas', 'Cada 8 horas', 'Cada 48 horas']} onChange={v => editar('frecuencia', v)} />
      <Opciones label="Duración *" value={item.duracion} opciones={['15 días', '30 días', '2 meses', '3 meses', '6 meses', '12 meses']} onChange={v => editar('duracion', v)} />
    </div>
    <div className="flex flex-wrap items-center gap-2 text-sm"><span>Cantidad rápida:</span>{['30', '40', '60', '90'].map(n => <button key={n} type="button" aria-pressed={numeroCapsulas(item.cantidad) === n} className={`rounded-full border px-3 py-1.5 ${numeroCapsulas(item.cantidad) === n ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white'}`} onClick={() => onChange({ cantidad: capsulas(n), vehiculo: `En cápsulas c.s.p. ${capsulas(n)}` })}>{n} cápsulas</button>)}</div>
    <Campo label="Instrucciones adicionales / autorización de repetición" value={item.indicaciones} onChange={v => editar('indicaciones', v)} />
    <details className="text-sm"><summary className="cursor-pointer text-slate-600">Editar composición, vía u otra pauta</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">
      <Campo label="Nombre" value={item.nombre} onChange={v => editar('nombre', v)} />
      <label className="block font-medium text-slate-700">Composición y concentraciones *<textarea className={estilo} rows={3} value={item.formula} onChange={e => editar('formula', e.target.value)} /></label>
      {['presentacion', 'via', 'dosis', 'frecuencia', 'duracion'].map((campo, i) => <Campo key={campo} label={['Presentación', 'Vía *', 'Dosis personalizada *', 'Frecuencia personalizada *', 'Duración personalizada *'][i]} value={item[campo]} onChange={v => editar(campo, v)} />)}
    </div></details>
    <details className="text-sm" open><summary className="cursor-pointer font-medium text-slate-700">Texto de la receta</summary><p className="mt-2 whitespace-pre-line rounded-lg border bg-white p-3 text-slate-600">{textoMedicamento(item)}</p></details>
  </div>;
}
