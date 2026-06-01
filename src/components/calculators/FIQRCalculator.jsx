import React, { useMemo, useState } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';

// Anexo N°6 del protocolo SSÑ de Fibromialgia (PRO-074): FIQ-R.
// 21 ítems en 3 dominios; cada ítem de 0 a 10. Puntaje total 0-100 (mayor = mayor impacto).
const DOMAIN_1 = [
  'Peinarse',
  'Caminar 20 minutos sin necesidad de pararse',
  'Preparar la comida',
  'Barrer, fregar o pasar la aspiradora',
  'Levantar y transportar una bolsa de la compra llena',
  'Subir escaleras',
  'Cambiar la ropa de la cama',
  'Estar sentada en una silla durante 45 minutos',
  'Hacer la compra',
];
const DOMAIN_2 = [
  'La fibromialgia me impidió hacer lo que tenía proyectado esta semana',
  'Los síntomas de mi fibromialgia me tuvieron totalmente abrumada',
];
const DOMAIN_3 = [
  'Dolor',
  'Falta de energía',
  'Rigidez',
  'Mala calidad del sueño',
  'Depresión',
  'Problemas de memoria',
  'Ansiedad',
  'Dolor al tacto',
  'Problemas de equilibrio',
  'Sensibilidad al ruido, la luz, los olores o el frío',
];

const references = [
  {
    label: 'Salgueiro M, et al. Validación de la versión española del FIQ-R (FIQ-R). Health Qual Life Outcomes. 2013.',
    url: 'https://doi.org/10.1186/1477-7525-11-132',
  },
  {
    label: 'Protocolo de Abordaje Clínico de Fibromialgia, Servicio de Salud Ñuble (PRO-074), Anexo N°6.',
  },
];

const round = (value, digits = 1) => Number(Number(value).toFixed(digits));

export default function FIQRCalculator() {
  const [d1, setD1] = useState(() => DOMAIN_1.map(() => 0));
  const [d2, setD2] = useState(() => DOMAIN_2.map(() => 0));
  const [d3, setD3] = useState(() => DOMAIN_3.map(() => 0));
  const [result, setResult] = useState(null);

  const metrics = useMemo(() => {
    const sum = (arr) => arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
    const dom1 = sum(d1) / 3;        // 9 ítems / 3 → 0-30
    const dom2 = sum(d2);            // 2 ítems → 0-20
    const dom3 = sum(d3) / 2;        // 10 ítems / 2 → 0-50
    const total = dom1 + dom2 + dom3; // 0-100
    return { dom1, dom2, dom3, total };
  }, [d1, d2, d3]);

  const setItem = (setter) => (index, value) => {
    const num = Math.max(0, Math.min(10, Number(value) || 0));
    setter((prev) => prev.map((v, i) => (i === index ? num : v)));
  };

  const printableInputs = useMemo(() => [
    { label: 'Dominio 1 · Funcionalidad física (0-30)', value: round(metrics.dom1).toString() },
    { label: 'Dominio 2 · Impacto global (0-20)', value: round(metrics.dom2).toString() },
    { label: 'Dominio 3 · Síntomas (0-50)', value: round(metrics.dom3).toString() },
  ], [metrics]);

  const handleCalculate = () => {
    const total = round(metrics.total);
    const calcResult = {
      score: total,
      label: `FIQ-R total /100 · D1 ${round(metrics.dom1)} · D2 ${round(metrics.dom2)} · D3 ${round(metrics.dom3)}`,
      color: total >= 60 ? 'bg-rose-50 border-rose-200' : total >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200',
      interpretation: `Puntaje total ${total}/100 (a mayor puntaje, mayor impacto de la fibromialgia). ${total >= 60 ? 'Impacto severo.' : total >= 40 ? 'Impacto moderado.' : 'Impacto leve.'} Útil para seguir la evolución entre controles.`,
      recommendations: [
        'Cambio mínimo clínicamente importante: 14% (≈14 puntos) entre evaluaciones.',
        'Registrar el puntaje basal y de seguimiento en la ficha; es una de las escalas requeridas para fundamentar la derivación a Fisiatría.',
        'Dominios: Funcionalidad física (suma de 9 ítems ÷ 3), Impacto global (suma de 2 ítems), Síntomas (suma de 10 ítems ÷ 2).',
      ],
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setD1(DOMAIN_1.map(() => 0));
    setD2(DOMAIN_2.map(() => 0));
    setD3(DOMAIN_3.map(() => 0));
    setResult(null);
  };

  const renderDomain = (title, hint, items, values, setter) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-700">{item}</span>
            <input
              type="number"
              min={0}
              max={10}
              value={values[index]}
              onChange={(e) => setItem(setter)(index, e.target.value)}
              className="h-9 w-16 shrink-0 rounded-md border border-slate-300 bg-white px-2 text-center text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <CalculatorWrapper
      title="FIQ-R — Impacto de la fibromialgia"
      description="Cuestionario revisado de impacto de la fibromialgia (Anexo 6). Cada ítem de 0 (ninguna dificultad/intensidad) a 10 (máxima)."
      icon={Activity}
      gradientFrom="blue"
      gradientTo="violet"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={true}
    >
      <div className="grid gap-4">
        {renderDomain('Dominio 1 · Funcionalidad física', 'Dificultad en la última semana (0 ninguna → 10 máxima). 9 ítems.', DOMAIN_1, d1, setD1)}
        {renderDomain('Dominio 2 · Impacto global', 'Influencia en los últimos 7 días (0 nunca → 10 siempre). 2 ítems.', DOMAIN_2, d2, setD2)}
        {renderDomain('Dominio 3 · Síntomas', 'Intensidad en los últimos 7 días (0 → 10). 10 ítems.', DOMAIN_3, d3, setD3)}
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-4xl font-black text-slate-900">{result.score}<span className="text-xl text-slate-500">/100</span></div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>
          <div className="mt-4 rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-sm leading-relaxed text-slate-700">{result.interpretation}</p>
          </div>
          <div className="mt-4 space-y-2">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CalculatorReferences references={references} note="Escala de apoyo; interpretar junto con la evaluación clínica. Registrar basal y seguimiento." />
    </CalculatorWrapper>
  );
}
