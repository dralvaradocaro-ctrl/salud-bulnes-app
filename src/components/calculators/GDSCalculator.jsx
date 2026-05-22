import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

const stages = [
  {
    value: 1,
    label: 'GDS 1 — Sin deterioro cognitivo',
    summary: 'Sin déficit subjetivo ni objetivo.',
    features: [
      'No refiere ni demuestra dificultades cognitivas.',
      'Funcionalidad y memoria preservadas.',
    ],
    color: 'emerald',
    action: 'Sin demencia. Seguimiento habitual de factores de riesgo cardiovascular y depresión.',
  },
  {
    value: 2,
    label: 'GDS 2 — Deterioro cognitivo muy leve',
    summary: 'Olvido subjetivo (forgetfulness benigna).',
    features: [
      'Olvido de nombres familiares u objetos cotidianos referido por el paciente.',
      'Sin déficit objetivo en evaluación clínica o tests breves.',
      'No interfiere con actividades laborales ni sociales.',
    ],
    color: 'emerald',
    action: 'Sin demencia. Seguimiento de factores de riesgo cardiovascular y depresión.',
  },
  {
    value: 3,
    label: 'GDS 3 — Deterioro cognitivo leve',
    summary: 'Déficit demostrable en evaluación cuidadosa (MCI).',
    features: [
      'Desempeño disminuido en escenarios laborales/sociales exigentes.',
      'Dificultad para recordar nombres recién aprendidos, palabras durante la lectura.',
      'Puede aparecer ansiedad sutil; el paciente niega o disimula el déficit.',
      'Tests neuropsicológicos detectan alteración (no demencia aún).',
    ],
    color: 'amber',
    action: 'Deterioro cognitivo leve. Solicitar evaluación neuropsicológica e iniciar estimulación cognitiva.',
  },
  {
    value: 4,
    label: 'GDS 4 — Demencia leve',
    summary: 'Déficit claro en entrevista clínica.',
    features: [
      'Disminución del conocimiento de hechos recientes y actualidad.',
      'Dificultad en cálculo concentrado (restas seriadas).',
      'Reducción de capacidad de viajar solo, manejar finanzas.',
      'Habitualmente niega el problema; aplanamiento afectivo y retraimiento social.',
    ],
    color: 'amber',
    action: 'Demencia leve. Iniciar tratamiento farmacológico (IAChE: donepezilo/rivastigmina) + derivación a neurología.',
  },
  {
    value: 5,
    label: 'GDS 5 — Demencia moderada',
    summary: 'No puede sobrevivir sin asistencia.',
    features: [
      'Incapaz de recordar aspectos relevantes de su vida actual (dirección, teléfono, nombres de familiares).',
      'Frecuente desorientación temporal o espacial.',
      'Necesita ayuda para elegir vestimenta adecuada a estación/ocasión.',
      'Conserva alimentación e higiene básica; recuerda nombre propio y familiares cercanos.',
    ],
    color: 'amber',
    action: 'Demencia moderada. Optimizar IAChE; considerar agregar memantina. Derivación a neurología.',
  },
  {
    value: 6,
    label: 'GDS 6 — Demencia moderadamente severa',
    summary: 'Requiere asistencia para AVD básicas.',
    features: [
      'Olvido ocasional del nombre del cónyuge/cuidador; depende totalmente para sobrevivir.',
      'Desorientación temporo-espacial constante.',
      'Cambios de personalidad y conducta: ansiedad, agitación, delirio, conductas obsesivas.',
      'Incontinencia urinaria, luego fecal; necesita asistencia para vestirse, higiene y baño.',
    ],
    color: 'red',
    action: 'Demencia severa. Manejo sintomático, considerar memantina + IAChE. Apoyo familiar intensivo, cuidador.',
  },
  {
    value: 7,
    label: 'GDS 7 — Demencia muy severa',
    summary: 'Pérdida del habla y de la deambulación.',
    features: [
      'Capacidades verbales muy limitadas (palabras únicas) o ausentes.',
      'Incontinencia urinaria/fecal; pérdida de la deambulación.',
      'Pérdida progresiva de habilidades psicomotoras básicas (sentarse, sostener la cabeza, sonreír).',
      'Reflejos primitivos presentes; dependencia total.',
    ],
    color: 'red',
    action: 'Demencia terminal. Cuidados paliativos, prevención de complicaciones (UPP, broncoaspiración), apoyo familiar.',
  },
];

const colorMap = {
  emerald: { bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-800' },
  amber:   { bg: 'bg-amber-50 border-amber-200',     badge: 'bg-amber-100 text-amber-800',     text: 'text-amber-800'   },
  red:     { bg: 'bg-red-50 border-red-200',         badge: 'bg-red-100 text-red-800',         text: 'text-red-800'     },
};

export default function GDSCalculator() {
  const [selected, setSelected] = useState(null);
  const stage = stages.find(s => s.value === selected);
  const c = stage ? colorMap[stage.color] : null;

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">GDS — Global Deterioration Scale (Reisberg)</h2>
            <p className="mt-0.5 text-sm text-violet-200">Estratificación de severidad de la demencia · Protocolo Local HCSFB 117</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold">
            {selected ?? '—'}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {stages.map(s => {
          const active = selected === s.value;
          const sc = colorMap[s.color];
          return (
            <button
              key={s.value}
              onClick={() => setSelected(s.value)}
              className={`w-full text-left px-6 py-4 transition-colors ${active ? sc.bg : 'bg-white hover:bg-slate-50'}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? sc.badge : 'bg-slate-100 text-slate-600'}`}>
                  {s.value}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${active ? sc.text : 'text-slate-900'}`}>{s.label}</p>
                  <p className="text-xs text-slate-500 italic mt-0.5">{s.summary}</p>
                  {active && (
                    <ul className="mt-2 list-disc pl-5 space-y-0.5 text-xs text-slate-700">
                      {s.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {stage && (
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div className={`rounded-xl border-2 px-4 py-3 ${c.bg}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>Estadío seleccionado</span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${c.badge}`}>GDS {stage.value}</span>
            </div>
            <p className={`text-sm font-medium ${c.text}`}>{stage.action}</p>
          </div>

          <button onClick={() => setSelected(null)} className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 mt-3">
            Reiniciar
          </button>
        </div>
      )}

      <div className="px-6 pb-4 pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-slate-200">
        Reisberg B, et al. <i>The Global Deterioration Scale for assessment of primary degenerative dementia.</i> Am J Psychiatry 1982. Herramienta de estadificación clínica — complementaria a evaluación neuropsicológica formal.
      </div>
    </Card>
  );
}
