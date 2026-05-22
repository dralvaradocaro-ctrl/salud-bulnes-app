import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

const items = [
  {
    id: 'eye',
    label: 'Apertura ocular (E)',
    options: [
      { value: 4, label: '4 — Espontánea' },
      { value: 3, label: '3 — Al estímulo verbal' },
      { value: 2, label: '2 — Al estímulo doloroso' },
      { value: 1, label: '1 — Sin respuesta' },
    ],
  },
  {
    id: 'verbal',
    label: 'Respuesta verbal (V)',
    options: [
      { value: 5, label: '5 — Orientado' },
      { value: 4, label: '4 — Confuso' },
      { value: 3, label: '3 — Palabras inapropiadas' },
      { value: 2, label: '2 — Sonidos incomprensibles' },
      { value: 1, label: '1 — Sin respuesta' },
    ],
  },
  {
    id: 'motor',
    label: 'Respuesta motora (M)',
    options: [
      { value: 6, label: '6 — Obedece órdenes' },
      { value: 5, label: '5 — Localiza el dolor' },
      { value: 4, label: '4 — Retira al dolor' },
      { value: 3, label: '3 — Flexión anormal (decorticación)' },
      { value: 2, label: '2 — Extensión anormal (descerebración)' },
      { value: 1, label: '1 — Sin respuesta' },
    ],
  },
];

function getSeverity(score) {
  if (score >= 13) return {
    level: 'TEC leve',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-800',
    recs: [
      'GCS 14-15 sin factores de riesgo: observación 2 h con reevaluación documentada.',
      'GCS 15 con factores de riesgo o GCS 14: indicación de TC y/o derivación para neuroimagen.',
      'Educar al paciente y al acompañante con hoja de signos de alarma al alta.',
    ],
  };
  if (score >= 9) return {
    level: 'TEC moderado',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-800',
    recs: [
      'Hospitalizar — observación neurológica horaria por al menos 24 h.',
      'TC de cerebro sin contraste de urgencia y derivación a neurocirugía si hay lesión.',
      'Asegurar vía aérea si deterioro progresivo; PAM mayor a 80 mmHg.',
      'Reevaluar GCS cada hora; un descenso ≥ 2 puntos exige nueva imagen.',
    ],
  };
  return {
    level: 'TEC grave',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
    recs: [
      'Vía aérea avanzada (intubación) — GCS ≤ 8 = no protege vía aérea.',
      'Activación trauma / contacto inmediato con HHM neurocirugía.',
      'PAM objetivo > 80 mmHg, SpO₂ > 94%, normoglicemia, normotermia.',
      'Cabecera 30°, evitar Trendelenburg; ETT con sedación + analgesia.',
      'TC de cerebro de urgencia post-reanimación; traslado en condiciones óptimas.',
    ],
  };
}

export default function GlasgowCalculator() {
  const [scores, setScores] = useState({});
  const answered = Object.keys(scores).length;
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  const complete = answered === items.length;
  const result = complete ? getSeverity(total) : null;

  const reset = () => setScores({});

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Glasgow Coma Scale (GCS)</h2>
            <p className="mt-0.5 text-sm text-violet-200">Evaluar después de manejar ABC y reanimar adecuadamente.</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold">
            {complete ? total : '—'}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map(item => (
          <div key={item.id} className="px-6 py-4">
            <p className="mb-2 text-sm font-semibold text-slate-800">{item.label}</p>
            <div className="space-y-1.5">
              {item.options.map(opt => {
                const active = scores[item.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setScores(prev => ({ ...prev, [item.id]: opt.value }))}
                    className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                      active
                        ? 'border-violet-400 bg-violet-50 font-semibold text-violet-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Puntuación GCS</span>
          <span className="text-2xl font-bold text-slate-900">
            {complete ? `${total}` : '—'} <span className="text-base font-normal text-slate-400">/ 15</span>
          </span>
        </div>

        {result && (
          <div className={`rounded-xl border-2 px-4 py-3 ${result.bg}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${result.text}`}>{result.level}</span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${result.badge}`}>
                E{scores.eye} V{scores.verbal} M{scores.motor} = {total}
              </span>
            </div>
            <ul className={`list-disc pl-5 space-y-1 text-sm ${result.text}`}>
              {result.recs.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {complete && (
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">
            Reiniciar
          </button>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-2 mt-2">
          Teasdale G, Jennett B. Lancet 1974. Severidad: TEC leve 13–15, moderado 9–12, grave ≤ 8. GCS ≤ 8 indica considerar intubación orotraqueal.
        </p>
      </div>
    </Card>
  );
}
