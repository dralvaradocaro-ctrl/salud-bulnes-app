import { useState } from 'react';
import { Card } from '@/components/ui/card';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';

// GRACE 1.0 — mortalidad intrahospitalaria en síndrome coronario agudo.
// Tablas de puntaje del Global Registry of Acute Coronary Events.
const TRAMOS = {
  edad: [
    [30, 0], [40, 8], [50, 25], [60, 41], [70, 58], [80, 75], [90, 91], [Infinity, 100],
  ],
  frecuencia: [
    [50, 0], [70, 3], [90, 9], [110, 15], [150, 24], [200, 38], [Infinity, 46],
  ],
  // La presión sistólica puntúa al revés: mientras más baja, más riesgo.
  presion: [
    [80, 58], [100, 53], [120, 43], [140, 34], [160, 24], [200, 10], [Infinity, 0],
  ],
  creatinina: [
    [0.4, 1], [0.8, 4], [1.2, 7], [1.6, 10], [2, 13], [4, 21], [Infinity, 28],
  ],
};

const KILLIP = [
  { value: 0, label: 'I', detail: 'Sin insuficiencia cardíaca' },
  { value: 20, label: 'II', detail: 'Crépitos, ingurgitación yugular o tercer ruido' },
  { value: 39, label: 'III', detail: 'Edema pulmonar agudo' },
  { value: 59, label: 'IV', detail: 'Shock cardiogénico' },
];

const BINARIOS = [
  { id: 'paro', label: 'Paro cardíaco al ingreso', puntos: 39 },
  { id: 'desnivelST', label: 'Desnivel del segmento ST', puntos: 28 },
  { id: 'enzimas', label: 'Marcadores de necrosis miocárdica elevados', puntos: 14 },
];

const NUMERICOS = [
  { id: 'edad', label: 'Edad', unidad: 'años', min: 0, max: 120, step: 1 },
  { id: 'frecuencia', label: 'Frecuencia cardíaca', unidad: 'lpm', min: 0, max: 300, step: 1 },
  { id: 'presion', label: 'Presión arterial sistólica', unidad: 'mmHg', min: 0, max: 300, step: 1 },
  { id: 'creatinina', label: 'Creatinina', unidad: 'mg/dL', min: 0, max: 20, step: 0.01 },
];

const puntosDe = (tramos, valor) => tramos.find(([tope]) => valor < tope)?.[1] ?? 0;

export function getGraceResult(score) {
  if (score <= 108) return {
    riesgo: 'Riesgo bajo',
    mortalidad: 'Mortalidad intrahospitalaria < 1%',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-900',
    conducta: 'Estrategia invasiva selectiva, guiada por isquemia.',
    recs: [
      'Manejo médico optimizado y estratificación no invasiva según evolución.',
      'Coronariografía si aparece isquemia recurrente, inestabilidad o prueba de esfuerzo positiva.',
      'Monitorización y control seriado de troponinas y electrocardiograma.',
    ],
  };
  if (score <= 140) return {
    riesgo: 'Riesgo intermedio',
    mortalidad: 'Mortalidad intrahospitalaria 1–3%',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-900',
    conducta: 'Estrategia invasiva dentro de 72 horas.',
    recs: [
      'Coordinar traslado a centro con hemodinamia dentro del plazo.',
      'Antiagregación y anticoagulación según protocolo local, salvo contraindicación.',
      'Vigilar cambios electrocardiográficos y recurrencia del dolor.',
    ],
  };
  return {
    riesgo: 'Riesgo alto',
    mortalidad: 'Mortalidad intrahospitalaria > 3%',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-900',
    conducta: 'Estrategia invasiva precoz, dentro de 24 horas.',
    recs: [
      'Contactar de inmediato a cardiología y coordinar traslado a hemodinamia.',
      'Monitorización continua en unidad de mayor complejidad.',
      'Antiagregación y anticoagulación según protocolo, salvo contraindicación.',
      'Reevaluar Killip y función renal, que pesan fuerte en el puntaje.',
    ],
  };
}

export default function GRACECalculator() {
  const [valores, setValores] = useState({});
  const [killip, setKillip] = useState(null);
  const [binarios, setBinarios] = useState({});

  const numero = id => {
    const valor = Number(valores[id]);
    return valores[id] !== '' && valores[id] !== undefined && Number.isFinite(valor) && valor > 0 ? valor : null;
  };

  const faltantes = [
    ...NUMERICOS.filter(campo => numero(campo.id) === null).map(campo => campo.label),
    ...(killip === null ? ['Clase Killip'] : []),
  ];
  const completo = faltantes.length === 0;

  const desglose = completo
    ? [
      ...NUMERICOS.map(campo => ({ label: campo.label, puntos: puntosDe(TRAMOS[campo.id], numero(campo.id)) })),
      { label: `Killip ${KILLIP.find(item => item.value === killip)?.label}`, puntos: killip },
      ...BINARIOS.filter(item => binarios[item.id]).map(item => ({ label: item.label, puntos: item.puntos })),
    ]
    : [];

  const score = desglose.reduce((total, item) => total + item.puntos, 0);
  const result = completo ? getGraceResult(score) : null;

  const reset = () => { setValores({}); setKillip(null); setBinarios({}); };

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-rose-700 to-red-700 px-6 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">GRACE — Riesgo en síndrome coronario agudo</h2>
            <p className="mt-0.5 text-sm text-rose-200">Mortalidad intrahospitalaria y urgencia de la estrategia invasiva.</p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl font-bold">
            {completo ? score : '—'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-100 p-6 sm:grid-cols-2">
        {NUMERICOS.map(campo => (
          <label key={campo.id} className="text-sm font-semibold text-slate-700">
            {campo.label} <span className="font-normal text-slate-400">({campo.unidad})</span>
            <input
              type="number"
              min={campo.min}
              max={campo.max}
              step={campo.step}
              value={valores[campo.id] ?? ''}
              onChange={event => setValores(current => ({ ...current, [campo.id]: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              placeholder={campo.unidad}
            />
          </label>
        ))}
      </div>

      <div className="border-b border-slate-100 px-6 py-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Clase Killip</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {KILLIP.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => setKillip(item.value)}
              aria-pressed={killip === item.value}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                killip === item.value ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <strong className="text-sm text-slate-900">Killip {item.label}</strong>
                <span className="text-xs font-bold text-slate-500">+{item.value}</span>
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">{item.detail}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {BINARIOS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setBinarios(current => ({ ...current, [item.id]: !current[item.id] }))}
            aria-pressed={Boolean(binarios[item.id])}
            className={`flex w-full items-center gap-3 px-6 py-3 text-left transition-colors ${
              binarios[item.id] ? 'bg-rose-50' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
              binarios[item.id] ? 'border-rose-500 bg-rose-600 text-white' : 'border-slate-300 bg-white text-transparent'
            }`}>✓</span>
            <span className={`flex-1 text-sm ${binarios[item.id] ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{item.label}</span>
            <span className="text-xs font-bold text-slate-500">+{item.puntos}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Puntaje GRACE</span>
          <span className="text-2xl font-bold text-slate-900">{completo ? score : '—'}</span>
        </div>

        {!completo && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
            Faltan: {faltantes.join(', ')}.
          </p>
        )}

        {result && (
          <>
            <div className={`rounded-xl border-2 px-4 py-3 ${result.bg}`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${result.text}`}>{result.riesgo}</span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${result.badge}`}>{score} pts</span>
              </div>
              <p className={`text-sm font-medium ${result.text}`}>{result.mortalidad}</p>
              <p className={`mt-1 text-sm font-bold ${result.text}`}>{result.conducta}</p>
              <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${result.text}`}>
                {result.recs.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <details className="rounded-xl border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-xs font-bold text-slate-600">Ver cómo se compone el puntaje</summary>
              <ul className="mt-2 space-y-1 text-sm">
                {desglose.map(item => (
                  <li key={item.label} className="flex justify-between gap-3 border-b border-slate-100 pb-1 last:border-0">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-bold text-slate-900">+{item.puntos}</span>
                  </li>
                ))}
              </ul>
            </details>

            <button type="button" onClick={reset} className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700">
              Reiniciar
            </button>
          </>
        )}

        <CalculatorReferences
          references={[
            { label: 'Granger CB et al. Predictors of hospital mortality in the GRACE. Arch Intern Med 2003', url: 'https://doi.org/10.1001/archinte.163.19.2345' },
            { label: 'ESC 2023 — Guía de síndromes coronarios agudos', url: 'https://doi.org/10.1093/eurheartj/ehad191' },
          ]}
        />

        <p className="border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-slate-500">
          Cortes de mortalidad intrahospitalaria: ≤108 bajo, 109–140 intermedio, &gt;140 alto. Herramienta de apoyo: no reemplaza la evaluación clínica ni la decisión de cardiología.
        </p>
      </div>
    </Card>
  );
}
