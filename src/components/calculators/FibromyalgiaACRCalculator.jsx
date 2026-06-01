import React, { useMemo, useState } from 'react';
import { Bone, CheckCircle2, XCircle } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';

// Criterios diagnósticos ACR 2016 de Fibromialgia.
// IDG (Índice de Dolor Generalizado / WPI): 0-19 áreas, agrupadas en 5 regiones.
// El diagnóstico exige dolor en >=4 de las 5 regiones, además del umbral IDG/ESS.
const REGIONS = [
  {
    id: 'r1',
    label: 'Región superior izquierda',
    areas: [
      { id: 'mandibula_izq', label: 'Mandíbula izquierda' },
      { id: 'escapular_izq', label: 'Cintura escapular izquierda' },
      { id: 'brazo_izq', label: 'Brazo izquierdo' },
      { id: 'antebrazo_izq', label: 'Antebrazo izquierdo' },
    ],
  },
  {
    id: 'r2',
    label: 'Región superior derecha',
    areas: [
      { id: 'mandibula_der', label: 'Mandíbula derecha' },
      { id: 'escapular_der', label: 'Cintura escapular derecha' },
      { id: 'brazo_der', label: 'Brazo derecho' },
      { id: 'antebrazo_der', label: 'Antebrazo derecho' },
    ],
  },
  {
    id: 'r3',
    label: 'Región inferior izquierda',
    areas: [
      { id: 'cadera_izq', label: 'Cadera (glúteo/trocánter) izquierda' },
      { id: 'muslo_izq', label: 'Muslo izquierdo' },
      { id: 'pierna_izq', label: 'Pierna izquierda' },
    ],
  },
  {
    id: 'r4',
    label: 'Región inferior derecha',
    areas: [
      { id: 'cadera_der', label: 'Cadera (glúteo/trocánter) derecha' },
      { id: 'muslo_der', label: 'Muslo derecho' },
      { id: 'pierna_der', label: 'Pierna derecha' },
    ],
  },
  {
    id: 'r5',
    label: 'Región axial',
    areas: [
      { id: 'cuello', label: 'Cuello' },
      { id: 'espalda_alta', label: 'Espalda alta' },
      { id: 'espalda_baja', label: 'Espalda baja' },
      { id: 'torax', label: 'Tórax' },
      { id: 'abdomen', label: 'Abdomen' },
    ],
  },
];

const ALL_AREAS = REGIONS.flatMap((region) => region.areas);

// ESS (Escala de Severidad de Síntomas): 3 síntomas cardinales 0-3 + 3 somáticos 0-1 = 0-12.
const CARDINAL_SYMPTOMS = [
  { id: 'fatiga', label: 'Fatiga' },
  { id: 'sueno', label: 'Sueño no reparador' },
  { id: 'cognitivo', label: 'Trastornos cognitivos' },
];

const SEVERITY_OPTIONS = [
  { value: 0, label: '0 — Ningún problema' },
  { value: 1, label: '1 — Leve/intermitente' },
  { value: 2, label: '2 — Moderado y frecuente' },
  { value: 3, label: '3 — Severo, persistente' },
];

const SOMATIC_SYMPTOMS = [
  { id: 'cefalea', label: 'Cefalea' },
  { id: 'abdomen_sx', label: 'Dolor o cólicos abdominales' },
  { id: 'depresion', label: 'Depresión' },
];

const references = [
  {
    label: 'Wolfe F, et al. 2016 Revisions to the 2010/2011 fibromyalgia diagnostic criteria. Semin Arthritis Rheum. 2016;46(3):319-329.',
    url: 'https://doi.org/10.1016/j.semarthrit.2016.08.012',
  },
  {
    label: 'Minsal. Orientación Técnica Abordaje de la Fibromialgia. Santiago: 2016.',
    url: 'https://rehabilitacion.minsal.cl/wp-content/uploads/2016/06/OT-Fibromialgia-2016.pdf',
  },
];

export default function FibromyalgiaACRCalculator() {
  const [areas, setAreas] = useState({});
  const [cardinal, setCardinal] = useState({ fatiga: 0, sueno: 0, cognitivo: 0 });
  const [somatic, setSomatic] = useState({ cefalea: 0, abdomen_sx: 0, depresion: 0 });
  const [durationOk, setDurationOk] = useState(false);
  const [result, setResult] = useState(null);

  const toggleArea = (id) => setAreas((prev) => ({ ...prev, [id]: !prev[id] }));

  const metrics = useMemo(() => {
    const idg = ALL_AREAS.filter((a) => areas[a.id]).length;
    const regionsWithPain = REGIONS.filter((region) => region.areas.some((a) => areas[a.id])).length;
    const essCardinal = CARDINAL_SYMPTOMS.reduce((sum, s) => sum + Number(cardinal[s.id] || 0), 0);
    const essSomatic = SOMATIC_SYMPTOMS.reduce((sum, s) => sum + Number(somatic[s.id] || 0), 0);
    const ess = essCardinal + essSomatic;
    const fs = idg + ess;

    const cond1 = regionsWithPain >= 4;
    const cond2 = (idg >= 7 && ess >= 5) || (idg >= 4 && idg <= 6 && ess >= 9);
    const cond3 = durationOk;
    const meetsCriteria = cond1 && cond2 && cond3;

    return { idg, regionsWithPain, ess, fs, cond1, cond2, cond3, meetsCriteria };
  }, [areas, cardinal, somatic, durationOk]);

  const handleCalculate = () => {
    const { idg, regionsWithPain, ess, fs, cond1, cond2, cond3, meetsCriteria } = metrics;

    const calcResult = {
      score: meetsCriteria ? 'Cumple criterios ACR 2016' : 'No cumple criterios ACR 2016',
      label: `IDG ${idg}/19 · ESS ${ess}/12 · FS ${fs}/31 · ${regionsWithPain}/5 regiones`,
      color: meetsCriteria ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
      interpretation: meetsCriteria
        ? 'El paciente cumple las condiciones ACR 2016 para diagnóstico de fibromialgia. El diagnóstico es válido exista o no otra patología asociada e iniciar manejo integral (3 pilares) en APS.'
        : 'No se cumplen todas las condiciones ACR 2016. Reevaluar evolución, descartar diagnósticos diferenciales y repetir la evaluación según criterio clínico; un resultado negativo no excluye fibromialgia en seguimiento.',
      conditions: [
        { met: cond1, text: `Dolor en >=4 de 5 regiones (actual: ${regionsWithPain}/5)` },
        { met: cond2, text: `IDG >=7 y ESS >=5, o IDG 4-6 y ESS >=9 (actual IDG ${idg}, ESS ${ess})` },
        { met: cond3, text: 'Síntomas presentes por al menos 3 meses' },
      ],
      recommendations: [
        `Escala de Severidad de Fibromialgia (FS = IDG + ESS): ${fs}/31. Útil para seguir evolución entre controles.`,
        meetsCriteria
          ? 'Iniciar tratamiento integral en APS: manejo farmacológico, rehabilitación/ejercicio y salud mental.'
          : 'Si persiste sospecha, aplicar lista de chequeo de pesquisa y reevaluar; considerar derivación a Reumatología solo si hay signos de mesenquimopatía.',
      ],
    };

    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setAreas({});
    setCardinal({ fatiga: 0, sueno: 0, cognitivo: 0 });
    setSomatic({ cefalea: 0, abdomen_sx: 0, depresion: 0 });
    setDurationOk(false);
    setResult(null);
  };

  const printableInputs = [
    { label: 'IDG (áreas con dolor)', value: `${metrics.idg}/19` },
    { label: 'Regiones con dolor', value: `${metrics.regionsWithPain}/5` },
    { label: 'ESS', value: `${metrics.ess}/12` },
    { label: 'FS (IDG + ESS)', value: `${metrics.fs}/31` },
    { label: 'Síntomas >=3 meses', value: durationOk ? 'Sí' : 'No' },
  ];

  return (
    <CalculatorWrapper
      title="Criterios diagnósticos ACR 2016 — Fibromialgia"
      description="Calcula IDG, ESS y FS, y verifica las condiciones diagnósticas ACR 2016."
      icon={Bone}
      gradientFrom="rose"
      gradientTo="purple"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={true}
    >
      {/* IDG / WPI */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">1. Índice de Dolor Generalizado (IDG / WPI)</h4>
          <span className="text-xs font-semibold text-rose-700">{metrics.idg}/19 áreas · {metrics.regionsWithPain}/5 regiones</span>
        </div>
        <p className="mb-3 text-xs text-slate-500">Marque las áreas con dolor en la última semana.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {REGIONS.map((region) => {
            const regionActive = region.areas.some((a) => areas[a.id]);
            return (
              <div key={region.id} className={`rounded-xl border p-3 ${regionActive ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200 bg-slate-50'}`}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">{region.label}</p>
                <div className="space-y-1.5">
                  {region.areas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => toggleArea(area.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-all ${
                        areas[area.id]
                          ? 'border-rose-300 bg-white font-semibold text-slate-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                        areas[area.id] ? 'border-rose-500 bg-rose-600 text-white' : 'border-slate-300 bg-white text-transparent'
                      }`}>✓</span>
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ESS */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">2. Escala de Severidad de Síntomas (ESS)</h4>
          <span className="text-xs font-semibold text-rose-700">{metrics.ess}/12</span>
        </div>
        <div className="space-y-2">
          {CARDINAL_SYMPTOMS.map((symptom) => (
            <div key={symptom.id} className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-slate-800">{symptom.label}</span>
              <select
                value={cardinal[symptom.id]}
                onChange={(e) => setCardinal((prev) => ({ ...prev, [symptom.id]: Number(e.target.value) }))}
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-rose-400 focus:outline-none"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="mb-2 mt-4 text-xs font-semibold text-slate-600">Síntomas somáticos en los últimos 6 meses (presencia = 1 punto):</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {SOMATIC_SYMPTOMS.map((symptom) => (
            <button
              key={symptom.id}
              type="button"
              onClick={() => setSomatic((prev) => ({ ...prev, [symptom.id]: prev[symptom.id] ? 0 : 1 }))}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                somatic[symptom.id]
                  ? 'border-rose-300 bg-rose-50 font-semibold text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                somatic[symptom.id] ? 'border-rose-500 bg-rose-600 text-white' : 'border-slate-300 bg-white text-transparent'
              }`}>✓</span>
              {symptom.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duración */}
      <button
        type="button"
        onClick={() => setDurationOk((prev) => !prev)}
        className={`mb-5 flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
          durationOk ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        }`}
      >
        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
          durationOk ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-transparent'
        }`}>✓</span>
        <span>3. Síntomas presentes con intensidad similar por al menos 3 meses.</span>
      </button>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{result.score}</div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>

          <div className="mt-5 space-y-2">
            {result.conditions.map((cond, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-white/80 bg-white/80 px-3 py-2 text-sm">
                {cond.met
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
                <span className={cond.met ? 'text-slate-800' : 'text-slate-600'}>{cond.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-white/80 bg-white/80 p-4">
            <h4 className="mb-2 text-sm font-bold text-slate-900">Interpretación</h4>
            <p className="break-words text-sm leading-relaxed text-slate-700">{result.interpretation}</p>
          </div>

          <div className="mt-4 space-y-2">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CalculatorReferences
        references={references}
        note="El diagnóstico de fibromialgia es clínico. Esta calculadora apoya la aplicación de los criterios ACR 2016 y no sustituye el juicio clínico ni el descarte de diagnósticos diferenciales."
      />
    </CalculatorWrapper>
  );
}
