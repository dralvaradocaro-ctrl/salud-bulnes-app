import { useState } from 'react';
import ScoreShell from './ScoreShell';

// Clinical Frailty Scale (Rockwood), versión 2.0.
const NIVELES = [
  { valor: 1, titulo: 'En muy buena forma', detalle: 'Robusto, activo, con energía y motivación. Hace ejercicio con regularidad y está entre los más en forma para su edad.' },
  { valor: 2, titulo: 'En buena forma', detalle: 'Sin síntomas de enfermedad activa, pero menos en forma que la categoría 1. Hace ejercicio ocasional o estacional.' },
  { valor: 3, titulo: 'Bien mantenido', detalle: 'Problemas de salud controlados. No hace actividad física regular más allá de caminar.' },
  { valor: 4, titulo: 'Vulnerable', detalle: 'No depende de otros para el día a día, pero los síntomas limitan sus actividades. Se queja de lentitud o cansancio.' },
  { valor: 5, titulo: 'Fragilidad leve', detalle: 'Enlentecimiento evidente. Necesita ayuda en actividades instrumentales: finanzas, transporte, tareas domésticas pesadas, medicamentos.' },
  { valor: 6, titulo: 'Fragilidad moderada', detalle: 'Necesita ayuda en todas las actividades fuera de casa y en las tareas del hogar. Dificultad con escaleras, baño y vestirse.' },
  { valor: 7, titulo: 'Fragilidad grave', detalle: 'Dependiente para el cuidado personal por causa física o cognitiva. Estable, sin alto riesgo de morir en los próximos 6 meses.' },
  { valor: 8, titulo: 'Fragilidad muy grave', detalle: 'Totalmente dependiente y acercándose al final de la vida. No se recupera de una enfermedad menor.' },
  { valor: 9, titulo: 'Enfermedad terminal', detalle: 'Expectativa de vida menor a 6 meses, sin fragilidad evidente por otra causa.' },
];

export function getFrailtyResult(valor) {
  if (valor <= 3) return {
    nivel: `CFS ${valor} — sin fragilidad`,
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Manejo habitual según la patología aguda.',
    recs: ['Mantener movilización y evitar el reposo innecesario durante la hospitalización.'],
  };
  if (valor <= 5) return {
    nivel: `CFS ${valor} — vulnerable o fragilidad leve`,
    bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900',
    conducta: 'Prevenir el deterioro funcional asociado a la hospitalización.',
    recs: [
      'Movilización precoz, evaluación por kinesiología y prevención de delirium.',
      'Revisar polifarmacia y riesgo de caídas.',
      'Planificar el alta con la red de apoyo desde el ingreso.',
    ],
  };
  if (valor <= 7) return {
    nivel: `CFS ${valor} — fragilidad moderada a grave`,
    bg: 'bg-orange-50 border-orange-300', badge: 'bg-orange-100 text-orange-900', text: 'text-orange-900',
    conducta: 'Ajustar la intensidad del tratamiento a los objetivos del paciente.',
    recs: [
      'Evaluación geriátrica integral y participación de la familia en las decisiones.',
      'Sopesar la carga de cada intervención frente al beneficio esperado.',
      'Conversar objetivos de cuidado y preferencias antes de que haya una crisis.',
    ],
  };
  return {
    nivel: `CFS ${valor} — fragilidad muy grave o enfermedad terminal`,
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Priorizar confort y objetivos de cuidado acordados.',
    recs: [
      'Definir con la familia la adecuación del esfuerzo terapéutico y dejarla registrada.',
      'Evaluar ingreso a cuidados paliativos.',
      'Evitar intervenciones que no cambien el pronóstico ni el bienestar.',
    ],
  };
}

export default function ClinicalFrailtyScaleCalculator() {
  const [valor, setValor] = useState(null);
  const result = valor ? { ...getFrailtyResult(valor), valor: `${valor}/9` } : null;

  return (
    <ScoreShell
      title="Clinical Frailty Scale — Escala de fragilidad"
      subtitle="Fragilidad basal, según el estado dos semanas antes de enfermar."
      gradient="from-amber-700 to-orange-700"
      badge={valor ?? '—'}
      result={result}
      pending={!valor ? 'Selecciona el nivel que mejor describe al paciente antes de esta enfermedad.' : null}
      onReset={valor ? () => setValor(null) : null}
      references={[
        { label: 'Rockwood K et al. CMAJ 2005 · CFS versión 2.0 (2020)', url: 'https://doi.org/10.1503/cmaj.050051' },
      ]}
      footnote="Se puntúa el estado basal, no el del episodio agudo. Validada desde los 65 años; no se aplica en discapacidad estable desde joven, como parálisis cerebral. En demencia, el grado suele corresponder al de fragilidad."
    >
      <div className="space-y-1.5">
        {NIVELES.map(item => {
          const activo = valor === item.valor;
          return (
            <button
              key={item.valor}
              type="button"
              onClick={() => setValor(item.valor)}
              aria-pressed={activo}
              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                activo ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                activo ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>{item.valor}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">{item.titulo}</span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500">{item.detalle}</span>
              </span>
            </button>
          );
        })}
      </div>
    </ScoreShell>
  );
}
