import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

const items = [
  {
    id: 'age',
    label: 'A — Edad',
    options: [
      { value: 0, label: '0 — Menor de 60 años' },
      { value: 1, label: '1 — 60 años o más' },
    ],
  },
  {
    id: 'bp',
    label: 'B — Presión arterial al debut',
    options: [
      { value: 0, label: '0 — PA < 140/90 mmHg' },
      { value: 1, label: '1 — PA ≥ 140/90 mmHg' },
    ],
  },
  {
    id: 'clinical',
    label: 'C — Características clínicas del AIT',
    options: [
      { value: 0, label: '0 — Otros síntomas' },
      { value: 1, label: '1 — Disartria/afasia sin debilidad' },
      { value: 2, label: '2 — Debilidad unilateral' },
    ],
  },
  {
    id: 'duration',
    label: 'D — Duración de síntomas',
    options: [
      { value: 0, label: '0 — Menos de 10 minutos' },
      { value: 1, label: '1 — 10 a 59 minutos' },
      { value: 2, label: '2 — 60 minutos o más' },
    ],
  },
  {
    id: 'diabetes',
    label: 'D — Diabetes mellitus',
    options: [
      { value: 0, label: '0 — No' },
      { value: 1, label: '1 — Sí (en tratamiento o glicemia ayuno > 126 mg/dL)' },
    ],
  },
];

function getResult(score) {
  if (score <= 3) return {
    risk: 'Bajo riesgo',
    color2d: '~1%',
    color7d: '~1,2%',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    recs: [
      'Evaluación en unidad de AIT o equivalente dentro de 24 h.',
      'Inicio precoz de antiagregación (AAS 300 mg carga).',
      'Estudio de imagen carotídea y cardíaca según clínica.',
      'Optimizar factores de riesgo cardiovascular.',
    ],
  };
  if (score <= 5) return {
    risk: 'Riesgo moderado',
    color2d: '~4%',
    color7d: '~5,9%',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    recs: [
      'Hospitalización o evaluación en unidad AIT el mismo día.',
      'Doble antiagregación (AAS + Clopidogrel) durante 21 días si AIT de alto riesgo embólico.',
      'Estudio etiológico completo urgente (imagen cerebrovascular, ECG, Holter, ecocardiograma).',
      'Inicio de estatinas de alta intensidad.',
    ],
  };
  return {
    risk: 'Alto riesgo',
    color2d: '~8%',
    color7d: '~11,7%',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
    dot: 'bg-red-500',
    recs: [
      'Hospitalización inmediata — no diferir estudio.',
      'Doble antiagregación (AAS + Clopidogrel) si no hay indicación de anticoagulación.',
      'RM cerebral urgente con DWI para descartar infarto establecido.',
      'Neurosonología urgente (doppler carotídeo y transcraneal).',
      'Evaluar estenosis carotídea sintomática: endarterectomía dentro de 48 h si > 50%.',
    ],
  };
}

export default function ABCD2Calculator() {
  const [scores, setScores] = useState({});

  const answered = Object.keys(scores).length;
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  const complete = answered === items.length;
  const result = complete ? getResult(total) : null;

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-white">
        <h2 className="text-lg font-bold">ABCD² — Riesgo de ACV post-AIT</h2>
        <p className="mt-0.5 text-sm text-violet-200">
          Predice riesgo de ACV isquémico a 2 y 7 días tras un AIT
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="px-6 py-4">
            <p className="mb-2 text-sm font-semibold text-slate-800">{item.label}</p>
            <div className="space-y-1.5">
              {item.options.map((opt) => {
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

      {/* Score bar */}
      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Puntuación ABCD²</span>
          <span className="text-2xl font-bold text-slate-900">{complete ? total : '—'} <span className="text-base font-normal text-slate-400">/ 7</span></span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              !complete ? 'bg-slate-300' :
              total <= 3 ? 'bg-emerald-500' :
              total <= 5 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: complete ? `${(total / 7) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`mx-4 mb-4 rounded-2xl border p-4 ${result.bg}`}>
          <div className="mb-3 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${result.dot}`} />
            <span className={`text-base font-bold ${result.text}`}>{result.risk}</span>
            <span className={`ml-auto rounded-full border px-2 py-0.5 text-xs font-semibold ${result.badge}`}>
              Puntos: {total}
            </span>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/70 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Riesgo ACV 2 días</p>
              <p className={`text-xl font-bold ${result.text}`}>{result.color2d}</p>
            </div>
            <div className="rounded-xl bg-white/70 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Riesgo ACV 7 días</p>
              <p className={`text-xl font-bold ${result.text}`}>{result.color7d}</p>
            </div>
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Recomendaciones</p>
          <ul className="space-y-1">
            {result.recs.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${result.dot}`} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!complete && (
        <p className="px-6 pb-4 text-center text-xs text-slate-400">
          Complete todos los ítems para ver el resultado ({answered}/{items.length} respondidos)
        </p>
      )}

      <div className="border-t border-slate-100 px-6 py-3">
        <p className="text-[11px] text-slate-400">
          Ref: Johnston SC et al. Lancet 2007;369:283–92. Validado para estratificación a corto plazo de AIT.
        </p>
      </div>
    </Card>
  );
}
