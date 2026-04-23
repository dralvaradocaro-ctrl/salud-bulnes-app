import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

const items = [
  {
    id: 'chf',
    letter: 'C',
    label: 'Insuficiencia cardíaca / disfunción VI',
    detail: 'ICC sintomática o evidencia de disfunción sistólica del VI',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'hypertension',
    letter: 'H',
    label: 'Hipertensión arterial',
    detail: 'En tratamiento o PA > 140/90 mmHg en ≥ 2 mediciones',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'age',
    letter: 'A₂',
    label: 'Edad',
    detail: '< 65 años = 0 pts · 65–74 años = +1 · ≥ 75 años = +2',
    options: [
      { value: 0, label: '< 65 años' },
      { value: 1, label: '65–74 años (+1)' },
      { value: 2, label: '≥ 75 años (+2)' },
    ],
  },
  {
    id: 'diabetes',
    letter: 'D',
    label: 'Diabetes mellitus',
    detail: 'Glucosa en ayuno > 125 mg/dL o tratamiento hipoglucemiante',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'stroke',
    letter: 'S₂',
    label: 'ACV / AIT / tromboembolismo previo',
    detail: 'Antecedente de ACV isquémico, AIT o tromboembolia sistémica',
    options: [
      { value: 0, label: 'No' },
      { value: 2, label: 'Sí (+2)' },
    ],
  },
  {
    id: 'vascular',
    letter: 'V',
    label: 'Enfermedad vascular',
    detail: 'IAM previo, enfermedad arterial periférica o placa aórtica',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'sex',
    letter: 'Sc',
    label: 'Sexo femenino',
    detail: 'El sexo femenino añade 1 punto (no cuenta si es el único factor de riesgo)',
    options: [
      { value: 0, label: 'Masculino' },
      { value: 1, label: 'Femenino (+1)' },
    ],
  },
];

// Annual stroke risk % by score (ESC / Lip GY et al. Chest 2010)
const ANNUAL_RISK = [0, 1.3, 2.2, 3.2, 4.0, 6.7, 9.8, 9.6, 12.5, 15.2];

function getResult(score, isFemale) {
  // Net clinical benefit: subtract sex category from effective score for decision
  const effectiveScore = isFemale ? score - 1 : score;
  const annualRisk = ANNUAL_RISK[Math.min(score, 9)];

  if (effectiveScore <= 0) return {
    risk: 'Riesgo bajo',
    color: 'emerald',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    guidance: 'No se recomienda anticoagulación (beneficio clínico neto no demostrado).',
    recs: [
      'No iniciar anticoagulación oral.',
      'Reevaluar periódicamente ante nuevos factores de riesgo.',
      'Educación al paciente sobre síntomas de FA y ACV.',
    ],
    annualRisk,
  };

  if (effectiveScore === 1) return {
    risk: 'Riesgo bajo-moderado',
    color: 'amber',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    guidance: 'Se puede considerar anticoagulación. Evaluar preferencias del paciente y riesgo de sangrado (HAS-BLED).',
    recs: [
      'Considerar NACO (anticoagulante oral directo) si se decide tratar.',
      'Calcular HAS-BLED para estimar riesgo de sangrado.',
      'Discutir riesgo-beneficio con el paciente.',
      'Reevaluar en 3–6 meses.',
    ],
    annualRisk,
  };

  return {
    risk: 'Riesgo alto',
    color: 'red',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
    dot: 'bg-red-500',
    bar: 'bg-red-500',
    guidance: 'Anticoagulación oral recomendada. Preferir NACO sobre warfarina salvo contraindicación específica.',
    recs: [
      'Iniciar NACO (apixabán, rivaroxabán, dabigatrán o edoxabán).',
      'Usar warfarina solo si NACO contraindicado (estenosis mitral severa, válvula mecánica).',
      'Calcular HAS-BLED para identificar factores de sangrado modificables.',
      'No suspender anticoagulación por HAS-BLED alto — corregir factores modificables.',
      'Control clínico a los 30 días y luego cada 3–6 meses.',
    ],
    annualRisk,
  };
}

export default function CHA2DS2VAScCalculator() {
  const [scores, setScores] = useState({});

  const answered = Object.keys(scores).length;
  const total    = Object.values(scores).reduce((s, v) => s + v, 0);
  const complete = answered === items.length;
  const isFemale = scores['sex'] === 1;
  const result   = complete ? getResult(total, isFemale) : null;

  const barPct = complete ? Math.min((total / 9) * 100, 100) : 0;

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-4 text-white">
        <h2 className="text-lg font-bold">CHA₂DS₂-VASc — Riesgo de ACV en FA</h2>
        <p className="mt-0.5 text-sm text-rose-100">
          Estratifica riesgo tromboembólico en fibrilación auricular no valvular · ESC 2020
        </p>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="px-6 py-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-md bg-rose-100 px-1.5 text-xs font-bold text-rose-700">
                {item.letter}
              </span>
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            </div>
            <p className="mb-2 pl-8 text-xs text-slate-500">{item.detail}</p>
            <div className="flex gap-2">
              {item.options.map((opt) => {
                const active = scores[item.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setScores(prev => ({ ...prev, [item.id]: opt.value }))}
                    className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-all ${
                      active
                        ? opt.value === 0
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : 'border-rose-400 bg-rose-50 text-rose-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Puntuación CHA₂DS₂-VASc
          </span>
          <span className="text-2xl font-bold text-slate-900">
            {complete ? total : '—'}
            <span className="text-base font-normal text-slate-400"> / 9</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${result?.bar ?? 'bg-slate-300'}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        {complete && (
          <p className="mt-1.5 text-right text-xs text-slate-500">
            Riesgo anual estimado de ACV: <span className="font-semibold">{result.annualRisk}%</span>
          </p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`mx-4 mb-4 rounded-2xl border p-4 ${result.bg}`}>
          <div className="mb-2 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${result.dot}`} />
            <span className={`text-base font-bold ${result.text}`}>{result.risk}</span>
            <span className={`ml-auto rounded-xl border px-3 py-0.5 text-sm font-bold ${result.badge}`}>
              Score {total}
            </span>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">{result.guidance}</p>
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
          Ref: Lip GY et al. Chest 2010;137:263–72. Hindricks G et al. ESC Guidelines for AF 2020.
          El sexo femenino no cuenta como factor de riesgo independiente; se considera solo en presencia de al menos otro factor.
        </p>
      </div>
    </Card>
  );
}
