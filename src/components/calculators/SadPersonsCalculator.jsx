import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

const items = [
  { id: 's1', letter: 'S', label: 'Sexo masculino', help: 'Mayor letalidad en el intento.' },
  { id: 'a',  letter: 'A', label: 'Edad menor a 20 o mayor a 45 años' },
  { id: 'd',  letter: 'D', label: 'Depresión o desesperanza marcada' },
  { id: 'p',  letter: 'P', label: 'Tentativa de suicidio previa' },
  { id: 'e',  letter: 'E', label: 'Abuso de alcohol o drogas' },
  { id: 'r',  letter: 'R', label: 'Pérdida de pensamiento racional (psicosis, delirio)' },
  { id: 's2', letter: 'S', label: 'Sin apoyo social o familiar adecuado' },
  { id: 'o',  letter: 'O', label: 'Plan suicida organizado y específico' },
  { id: 'n',  letter: 'N', label: 'Sin pareja estable o viudo/a reciente' },
  { id: 's3', letter: 'S', label: 'Enfermedad somática grave o crónica' },
];

function getResult(score) {
  if (score <= 2) return {
    risk: 'Bajo riesgo',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-800',
    action: 'Manejo ambulatorio — derivar a PROSAM con prioridad.',
    recs: [
      'Asegurar red de apoyo familiar identificable y comprometida.',
      'Educación sobre signos de alarma; entregar contactos de urgencia (SAMU 131, Salud Responde 600 360 7777).',
      'Control con salud mental dentro de 7 días.',
    ],
  };
  if (score <= 6) return {
    risk: 'Riesgo moderado',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-800',
    action: 'Hospitalizar en MQ o Pediatría con dupla psicosocial.',
    recs: [
      'Indicación de hospitalización en cama de observación con vigilancia continua.',
      'Evaluación por dupla psicosocial (psicólogo + asistente social) dentro de las 24 h.',
      'Retiro de objetos de riesgo del entorno; acompañante permanente.',
      'Plantear interconsulta a psiquiatría infanto-adolescente o de adulto según corresponda.',
    ],
  };
  return {
    risk: 'Riesgo alto',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
    action: 'Hospitalizar y evaluar criterios de derivación a HCHM.',
    recs: [
      'Hospitalización inmediata con vigilancia 1:1 — no firmar alta voluntaria.',
      'Derivación urgente a unidad de psiquiatría (HCHM o Hospital Herminda Martín) según disponibilidad.',
      'Evitar entrega de medicamentos sin control de terceros.',
      'Coordinar continuidad de seguimiento con red ambulatoria al alta.',
    ],
  };
}

export default function SadPersonsCalculator() {
  const [checked, setChecked] = useState({});

  const score = items.reduce((sum, it) => sum + (checked[it.id] ? 1 : 0), 0);
  const answered = Object.keys(checked).length > 0;
  const result = answered ? getResult(score) : null;
  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const reset = () => setChecked({});

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">SAD PERSONS — Riesgo Suicida</h2>
            <p className="mt-0.5 text-sm text-violet-200">Marcar los ítems presentes (1 punto cada uno).</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold">{score}</span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`w-full flex items-start gap-3 px-6 py-3 text-left transition-colors ${
              checked[item.id] ? 'bg-violet-50' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
              checked[item.id] ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-300 bg-white text-transparent'
            }`}>✓</span>
            <span className="flex-1">
              <span className={`inline-block w-6 mr-1 text-sm font-bold ${checked[item.id] ? 'text-violet-700' : 'text-slate-400'}`}>{item.letter}</span>
              <span className={`text-sm ${checked[item.id] ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{item.label}</span>
              {item.help && <span className="block text-xs text-slate-500 mt-0.5 ml-7">{item.help}</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Puntaje SAD PERSONS</span>
          <span className="text-2xl font-bold text-slate-900">{score} <span className="text-base font-normal text-slate-400">/ 10</span></span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" style={{ width: `${(score / 10) * 100}%` }} />
        </div>

        {result && (
          <div className={`rounded-xl border-2 px-4 py-3 ${result.bg}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${result.text}`}>{result.risk}</span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${result.badge}`}>{score}/10</span>
            </div>
            <p className={`text-sm font-medium mb-2 ${result.text}`}>{result.action}</p>
            <ul className={`list-disc pl-5 space-y-1 text-sm ${result.text}`}>
              {result.recs.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {answered && (
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">
            Reiniciar
          </button>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-2 mt-2">
          Patterson WM, Dohn HH, et al. <i>SAD PERSONS scale</i>. Psychosomatics 1983. Herramienta de tamizaje — no reemplaza la evaluación clínica psiquiátrica.
        </p>
      </div>
    </Card>
  );
}
