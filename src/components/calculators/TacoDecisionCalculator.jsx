import { useState } from 'react';
import { Calculator, AlertTriangle, Copy, Check } from 'lucide-react';
import { decideTaco, numberInput, TACO_SOURCE } from '@/utils/taco/decision';
import { doseOptions, practicalRange, formatNumber as fmt, tabletText, controlDates, addDays, displayDate, prescriptionText } from '@/utils/taco/prescription';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const initial = { inr: '', previous: '', weekly: '', trt: '', count: '', bleeding: '', drug: 'acenocoumarol', target: '2-3', phase: 'maintenance', adherence: false, interactions: false, special: false };
const fieldClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
const requiredFieldClass = 'mt-1 w-full rounded-lg border-2 border-cyan-600 bg-white px-3 py-2 text-base font-semibold text-slate-900';
const range = values => values[0] === values[1] ? fmt(values[0]) : `${fmt(values[0])}–${fmt(values[1])}`;
const tabletRange = values => values[0] === values[1] ? tabletText(values[0]) : `${tabletText(values[0])}–${tabletText(values[1])}`;
const adjustment = percent => percent === 0 ? 'Mantener' : `${percent < 0 ? 'Bajar' : 'Subir'} ${fmt(Math.abs(percent))}%`;

export default function TacoDecisionCalculator() {
  const [values, setValues] = useState(initial);
  const [date, setDate] = useState(today);
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState(null);
  const [controlDay, setControlDay] = useState('');
  const [copyState, setCopyState] = useState('');
  const result = submitted ? decideTaco(values) : null;
  const isAceno = values.drug === 'acenocoumarol';
  const weeklyNow = numberInput(values.weekly);
  const weeklyIsQuarter = Number.isFinite(weeklyNow) && weeklyNow > 0 && Math.abs(weeklyNow - Math.round(weeklyNow)) < 1e-8;
  const practical = practicalRange(values.weekly, result?.percent, values.drug);
  const options = doseOptions(values.weekly, result?.percent, values.drug);
  const option = options.find(item => item.practicalMg === selected);
  const selectedDay = Number(controlDay);
  const validDay = result?.days && controlDay !== '' && Number.isInteger(selectedDay) && selectedDay >= result.days[0] && selectedDay <= result.days[1];
  const controlDate = validDay ? addDays(date, selectedDay) : null;
  const rx = prescriptionText({ drug: values.drug, option, hold: result?.hold, controlDate });
  const resetSelection = () => { setSelected(null); setControlDay(''); setCopyState(''); };
  const set = (key, value) => { setValues(old => ({ ...old, [key]: value })); resetSelection(); };
  const choose = item => {
    setSelected(item.practicalMg);
    setControlDay(result.days[0] === result.days[1] ? String(result.days[0]) : '');
    setCopyState('');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(rx); setCopyState('copied'); }
    catch { setCopyState('failed'); }
  };
  const numberField = (key, label, hint, required = false) => <label className={`block text-sm font-medium ${required ? 'text-cyan-900' : 'text-slate-700'}`}>{label}<input className={required ? requiredFieldClass : fieldClass} inputMode="decimal" required={required} value={values[key]} onChange={e => set(key, e.target.value)} placeholder={hint} /></label>;
  const selectField = (key, label, opts, required = false) => <label className={`block text-sm font-medium ${required ? 'text-cyan-900' : 'text-slate-700'}`}>{label}<select className={required ? requiredFieldClass : fieldClass} required={required} value={values[key]} onChange={e => set(key, e.target.value)}>{opts.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
  return <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-sm">
    <div className="bg-cyan-800 p-5 text-white"><h2 className="flex items-center gap-2 text-lg font-bold"><Calculator className="h-5 w-5" />Decisión clínica TACO</h2><p className="mt-1 text-sm text-cyan-50">Dosis semanal, comprimidos de acenocumarol 4 mg y próximo control</p></div>
    <div className="space-y-5 p-5">
      <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
        <fieldset className="space-y-3 rounded-xl border-2 border-cyan-600 bg-cyan-50 p-4">
          <legend className="px-2 text-base font-bold text-cyan-900">Datos obligatorios</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {numberField('inr', 'INR actual *', 'Ej. 2,5', true)}
            <div>
              {numberField('weekly', 'DTS actual (mg/semana) *', 'Total de los 7 días', true)}
              {Number.isFinite(weeklyNow) && weeklyNow > 0 && isAceno && <p className={`mt-1 text-sm font-semibold ${weeklyIsQuarter ? 'text-cyan-900' : 'text-amber-800'}`}>= {tabletText(weeklyNow / 4)} comprimidos de 4 mg/semana{weeklyIsQuarter ? '' : ' · no corresponde a cuartos de comprimido; revisa la DTS (¼ = 1 mg)'}</p>}
            </div>
            {selectField('bleeding', 'Sangrado activo *', [['', 'Seleccionar'], ['no', 'No'], ['yes', 'Sí — cualquier intensidad']], true)}
          </div>
        </fieldset>
        <details className="rounded-xl border border-slate-200 p-4" open>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Datos complementarios (opcionales)</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {numberField('previous', 'INR previo', 'Ej. 2,2')}
            {numberField('trt', 'TRT: tiempo en rango terapéutico (%)', '0 a 100')}
            {numberField('count', 'Controles consecutivos en la condición actual', 'Incluye el actual')}
            {selectField('drug', 'Anticoagulante', [['acenocoumarol', 'Acenocumarol 4 mg'], ['warfarin', 'Warfarina'], ['other', 'Otro anticoagulante']])}
            {selectField('target', 'Rango INR objetivo indicado', [['2-3', '2,0–3,0'], ['other', 'Otro rango / no confirmado']])}
            {selectField('phase', 'Etapa del tratamiento', [['maintenance', 'Mantención ambulatoria'], ['initial', 'Inicio / ajuste inicial']])}
            <label className="block text-sm font-medium text-slate-700">Fecha del INR actual<input type="date" className={fieldClass} value={date} onChange={e => { setDate(e.target.value); setCopyState(''); }} /></label>
          </div>
          <p className="mt-2 text-xs text-slate-500">Los controles consecutivos se refieren a controles en rango si el INR actual está entre 2 y 3, o fuera de rango si está fuera. El TRT se ingresa desde el registro clínico; no se estima con solo dos INR.</p>
          <div className="mt-3 space-y-2">{[['adherence', 'Dosis omitidas, duplicadas o dificultades de adherencia'], ['interactions', 'Cambio de fármacos (ATB/AINEs), alcohol, dieta o enfermedad intercurrente'], ['special', 'Embarazo o procedimiento/cirugía próxima']].map(([key, label]) => <label key={key} className="flex items-start gap-2 text-sm text-slate-700"><input className="mt-1" type="checkbox" checked={values[key]} onChange={e => set(key, e.target.checked)} />{label}</label>)}</div>
        </details>
        <div className="flex gap-3"><button type="submit" className="rounded-lg bg-cyan-800 px-4 py-2 font-semibold text-white hover:bg-cyan-900">Evaluar conducta</button><button type="button" className="rounded-lg border px-4 py-2 text-slate-700" onClick={() => { setValues(initial); setDate(today()); setSubmitted(false); resetSelection(); }}>Limpiar</button></div>
      </form>
      {((values.bleeding === 'yes' || numberInput(values.inr) >= 8) && !submitted) && <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-800">Sangrado activo o INR ≥ 8: suspender TACO y derivar a urgencias.</p>}
      {result && <div aria-live="polite" className={`space-y-4 rounded-xl border p-4 ${result.urgent ? 'border-red-300 bg-red-50 text-red-900' : 'border-cyan-200 bg-cyan-50 text-slate-800'}`}>
        {result.errors ? <ul className="list-disc space-y-1 pl-5">{result.errors.map(error => <li key={error}>{error}</li>)}</ul> : <>
          <h3 className="flex items-center gap-2 text-lg font-bold">{result.urgent && <AlertTriangle className="h-5 w-5" />}{result.action}</h3>
          <p className="text-sm">{result.reason}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-3"><p className="text-xs font-semibold uppercase text-slate-500">Ajuste de DTS</p><p className="mt-1 font-bold">{result.percent ? (result.percent[0] === 0 ? 'Sin cambio' : `${result.percent[0] < 0 ? 'Bajar' : 'Subir'} ${range(result.percent.map(Math.abs).sort((a, b) => a - b))}%`) : 'Requiere valoración'}</p>{result.percent && result.percent[0] !== 0 && <p className="mt-1 text-sm">Desde {fmt(weeklyNow)} mg/semana{isAceno ? ` (${tabletText(weeklyNow / 4)} comp.)` : ''}</p>}</div>
            <div className="rounded-lg bg-white p-3"><p className="text-xs font-semibold uppercase text-slate-500">Nueva DTS</p><p className="mt-1 text-xl font-bold">{practical ? `${range(practical.range)} mg/semana` : 'No calculada'}</p>{practical && isAceno && <p className="mt-1 text-sm font-semibold">{tabletRange(practical.range.map(mg => mg / 4))} comprimidos de 4 mg/semana</p>}{practical && isAceno && (Math.abs(practical.exact[0] - practical.range[0]) > 1e-8 || Math.abs(practical.exact[1] - practical.range[1]) > 1e-8) && <p className="mt-1 text-xs text-slate-500">Cálculo exacto {range(practical.exact)} mg, ajustado a cuartos de comprimido (¼ = 1 mg).</p>}</div>
            <div className="rounded-lg bg-white p-3"><p className="text-xs font-semibold uppercase text-slate-500">Próximo INR</p><p className="mt-1 font-bold">{result.urgent ? 'Evaluación urgente' : result.days ? `En ${range(result.days)} días` : 'Definir por equipo tratante'}</p>{result.days && <p className="mt-1 text-sm">{controlDates(date, result.days) || 'Ingresa la fecha del INR actual para ver las fechas de control.'}</p>}</div>
          </div>
          {result.hold && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Durante las {result.hold} horas de suspensión: 0 mg (0 comprimidos). La nueva DTS corresponde a la mantención posterior.</p>}
          {options.length > 0 && result.days && <div className="space-y-3">
            <h4 className="font-bold">{options.length === 1 ? 'Dosis para la receta' : 'Elegir la dosis dentro del rango'}</h4>
            <div className="flex flex-wrap gap-2">{options.map(item => <button key={item.practicalMg} type="button" aria-pressed={selected === item.practicalMg} onClick={() => choose(item)} className={`rounded-lg border px-3 py-2 text-left text-sm ${selected === item.practicalMg ? 'border-cyan-700 bg-cyan-700 text-white' : 'border-cyan-700 bg-white text-cyan-900 hover:bg-cyan-100'}`}>
              <span className="block font-bold">{fmt(item.practicalMg)} mg/semana{item.tablets !== null ? ` · ${tabletText(item.tablets)} comp.` : ''}</span>
              <span className="block text-xs opacity-80">{adjustment(item.actualPercent)}{item.deltaMg !== 0 ? ` (${item.deltaMg > 0 ? '+' : '−'}${fmt(Math.abs(item.deltaMg))} mg)` : ''}</span>
            </button>)}</div>
          </div>}
          {option && result.days && <div className="space-y-3 rounded-lg border border-cyan-300 bg-white p-4">
            <h4 className="font-bold">Texto para receta · {fmt(option.practicalMg)} mg/semana{option.tablets !== null ? ` (${tabletText(option.tablets)} comprimidos)` : ''}</h4>
            <p className="text-sm font-medium">Próximo control INR (plazo {range(result.days)} días)</p>
            <div className="flex flex-wrap gap-2">{Array.from({ length: result.days[1] - result.days[0] + 1 }, (_, index) => result.days[0] + index).map(day => <button key={day} type="button" aria-pressed={controlDay === String(day)} onClick={() => { setControlDay(String(day)); setCopyState(''); }} className={`rounded-lg border px-3 py-2 text-left text-sm ${controlDay === String(day) ? 'border-cyan-700 bg-cyan-700 text-white' : 'border-cyan-700 bg-white text-cyan-900 hover:bg-cyan-100'}`}>
              <span className="block font-bold">{day} días</span>
              {addDays(date, day) && <span className="block text-xs opacity-80">{displayDate(addDays(date, day))}</span>}
            </button>)}</div>
            {rx ? <><textarea aria-label="Texto de dosis semanal para receta" readOnly value={rx} rows={result.hold ? 4 : 3} className={`${fieldClass} resize-y`} /><p className="text-xs text-slate-500">Total semanal; completa la distribución diaria en la receta.</p><button type="button" onClick={copy} className="flex items-center gap-2 rounded-lg bg-cyan-800 px-4 py-2 text-sm font-semibold text-white">{copyState === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copyState === 'copied' ? 'Copiado' : 'Copiar dosis y control'}</button>{copyState === 'failed' && <p role="status" className="text-sm">No se pudo copiar automáticamente. Selecciona y copia el texto del recuadro.</p>}</> : <p className="text-sm text-slate-600">Elige el día de control (y una fecha de INR válida) para generar el texto.</p>}
          </div>}
          <ul className="list-disc space-y-1 pl-5 text-sm">{result.notes.map(note => <li key={note}>{note}</li>)}</ul>
        </>}
      </div>}
      <details className="text-sm text-slate-600"><summary className="cursor-pointer font-semibold">Fuente y criterios utilizados</summary><div className="mt-2 space-y-2"><p>{TACO_SOURCE}</p><p>INR &lt; 1,5: +10–20%, 10–14 días · 1,5–1,9: +5–10%, 14–21 días · 2–3: mantener, 30 días · 3,1–3,5: −5–10%, 14–21 días · 3,6–4,5: suspender 24 h, −10–20%, 7–14 días · &gt;4,5–&lt;5,5: suspender 48 h, −25–50%, 3–5 días · ≥5,5–&lt;8: suspender 72 h y seguimiento estricto; el reinicio usa como referencia −25–50% y control a 3–5 días (tramo adyacente, no cuantificado en el flujograma) · ≥8 o sangrado: urgencias.</p><p>En rango: 3 o más controles consecutivos permiten 45 días; TRT &gt;90% permite 60 días. No se prolonga el intervalo ante mala adherencia, interacciones o TRT &lt;60%. Para INR 4,5 se aplica suspensión 24 h y reducción 10–20%, según aclaración del profesional solicitante.</p><p>Acenocumarol: 4 mg biranurado; ¼ comprimido = 1 mg. Cada extremo del intervalo porcentual se redondea al mg (cuarto de comprimido) más cercano; si el redondeo dejara la dosis igual a la actual cuando corresponde cambiarla, se mueve 1 mg en la dirección indicada. No se genera automáticamente una distribución diaria.</p><p>El PDF GCL 1.13, cuarta edición, marzo 2026 (página impresa 17), confirma la presentación. Su página 20 remite al flujograma D, ausente en el archivo enlazado. El resumen guardado en la aplicación tiene otros tramos; para esta calculadora se conserva la imagen aportada.</p><a className="block text-cyan-800 underline" href="https://drive.google.com/file/d/1XfqTAYEO5Zy8ADY88KzfwdSVC7c11_mL/view" target="_blank" rel="noreferrer">Protocolo TACO GCL 1.13 — PDF fuente</a><a className="block text-cyan-800 underline" href="https://www.sps.nhs.uk/monitorings/warfarin-monitoring/" target="_blank" rel="noreferrer">Referencia complementaria de seguridad: NHS SPS, monitorización de warfarina</a></div></details>
    </div>
  </section>;
}
