import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

// HAS-BLED actualizado (ESC 2023)
const items = [
  {
    id: 'hypertension',
    letter: 'H',
    label: 'Hipertensión arterial no controlada',
    detail: 'PAS > 160 mmHg',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'renal',
    letter: 'A',
    label: 'Función renal anormal',
    detail: 'Creatinina > 2,26 mg/dL, diálisis o trasplante renal',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'liver',
    letter: 'A',
    label: 'Función hepática anormal',
    detail: 'Cirrosis o bilirrubina > 2x normal o transaminasas > 3x normal',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'stroke',
    letter: 'S',
    label: 'Antecedente de ACV',
    detail: 'Historia de ACV isquémico o hemorrágico',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'bleeding',
    letter: 'B',
    label: 'Sangrado previo o predisposición',
    detail: 'Historia de sangrado mayor, anemia, trombocitopenia',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'inr',
    letter: 'L',
    label: 'INR lábil (solo para warfarina)',
    detail: 'TTR < 60% o INR fluctuante',
    options: [
      { value: 0, label: 'No aplica / No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'elderly',
    letter: 'E',
    label: 'Edad avanzada',
    detail: 'Mayor de 65 años',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'drugs',
    letter: 'D',
    label: 'Fármacos predisponentes',
    detail: 'Antiagregantes, AINEs, esteroides crónicos',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
  {
    id: 'alcohol',
    letter: 'D',
    label: 'Consumo de alcohol',
    detail: '≥ 8 unidades/semana',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Sí (+1)' },
    ],
  },
];

// Factores modificables para mostrar foco de intervención
const MODIFIABLE = new Set(['hypertension', 'inr', 'drugs', 'alcohol']);

function getResult(score) {
  if (score <= 1) return {
    risk: 'Riesgo bajo de sangrado',
    annualRisk: '< 1%',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    guidance: 'La anticoagulación está recomendada si existe indicación clínica (p. ej. FA con CHA₂DS₂-VASc ≥ 2 en hombres o ≥ 3 en mujeres). No suspender por HAS-BLED bajo.',
    recs: [
      'Mantener anticoagulación según indicación.',
      'Control periódico de factores de riesgo modificables.',
      'Revisión anual de score.',
    ],
  };
  if (score === 2) return {
    risk: 'Riesgo intermedio de sangrado',
    annualRisk: '~1–2%',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    guidance: 'Continuar anticoagulación si indicación establecida. Identificar y corregir factores modificables antes de suspender.',
    recs: [
      'No suspender anticoagulación solo por HAS-BLED 2.',
      'Optimizar PA si hipertensión no controlada.',
      'Revisar necesidad de AINEs o antiagregantes concomitantes.',
      'Control de función renal y hepática.',
    ],
  };
  return {
    risk: 'Riesgo alto de sangrado',
    annualRisk: '> 2%',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
    dot: 'bg-red-500',
    guidance: 'HAS-BLED ≥ 3 NO contraindica la anticoagulación, pero obliga a identificar y corregir factores modificables. El riesgo de ACV por FA no anticoagulada generalmente supera el riesgo de sangrado.',
    recs: [
      'Identificar y corregir TODOS los factores modificables (ver resaltados abajo).',
      'Evaluar causa de sangrado previo antes de reintroducir anticoagulante.',
      'Preferir NACO sobre warfarina si no contraindicado.',
      'Evitar doble antiagregación innecesaria.',
      'Derivar a hematología/cardiología si complejidad alta.',
      'Reevaluar score tras corrección de factores modificables.',
    ],
  };
}

export default function HASBLEDCalculator() {
  const [scores, setScores] = useState({});

  const answered  = Object.keys(scores).length;
  const total     = Object.values(scores).reduce((s, v) => s + v, 0);
  const complete  = answered === items.length;
  const result    = complete ? getResult(total) : null;

  const modifiableActive = complete
    ? items.filter(i => MODIFIABLE.has(i.id) && scores[i.id] === 1).map(i => i.label)
    : [];

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-4 text-white">
        <h2 className="text-lg font-bold">HAS-BLED — Riesgo de sangrado en anticoagulación</h2>
        <p className="mt-0.5 text-sm text-rose-200">
          Estima riesgo de sangrado mayor en pacientes anticoagulados (ej. FA) · ESC 2023
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className={`px-6 py-4 ${MODIFIABLE.has(item.id) ? 'bg-amber-50/30' : ''}`}>
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-100 text-xs font-bold text-rose-700">
                {item.letter}
              </span>
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              {MODIFIABLE.has(item.id) && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Modificable
                </span>
              )}
            </div>
            <p className="mb-2 pl-7 text-xs text-slate-500">{item.detail}</p>
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
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Puntuación HAS-BLED</span>
          <span className="text-2xl font-bold text-slate-900">
            {complete ? total : '—'} <span className="text-base font-normal text-slate-400">/ 9</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              !complete ? 'bg-slate-300' :
              total <= 1 ? 'bg-emerald-500' :
              total === 2 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: complete ? `${(total / 9) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`mx-4 mb-4 rounded-2xl border p-4 ${result.bg}`}>
          <div className="mb-2 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${result.dot}`} />
            <span className={`text-base font-bold ${result.text}`}>{result.risk}</span>
            <span className={`ml-auto rounded-xl border px-3 py-0.5 text-sm font-bold ${result.badge}`}>
              {result.annualRisk} / año
            </span>
          </div>

          <p className="mb-3 text-sm leading-relaxed text-slate-700">{result.guidance}</p>

          {modifiableActive.length > 0 && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">Factores modificables presentes</p>
              <ul className="space-y-0.5">
                {modifiableActive.map((m, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-sm text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
          Ref: Pisters R et al. Chest 2010;138:1093–100. Kirchhof P et al. ESC Guidelines 2023. HAS-BLED ≥3 identifica pacientes de alto riesgo para intervención activa, no para suspensión de anticoagulante.
        </p>
      </div>
    </Card>
  );
}
