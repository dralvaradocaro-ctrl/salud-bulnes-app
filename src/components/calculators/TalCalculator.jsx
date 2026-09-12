import { useState } from 'react';
import OrdinalScore from './OrdinalScore';

// Puntaje de Tal modificado: gravedad del síndrome bronquial obstructivo en
// el menor de 3 años. La frecuencia respiratoria puntúa según el tramo etario.
const FR_MENOR_6M = [
  { value: 0, label: '≤ 40 por minuto' },
  { value: 1, label: '41 – 55 por minuto' },
  { value: 2, label: '56 – 70 por minuto' },
  { value: 3, label: '> 70 por minuto' },
];

const FR_MAYOR_6M = [
  { value: 0, label: '≤ 30 por minuto' },
  { value: 1, label: '31 – 45 por minuto' },
  { value: 2, label: '46 – 60 por minuto' },
  { value: 3, label: '> 60 por minuto' },
];

const RESTO = [
  {
    id: 'sibilancias',
    label: 'Sibilancias',
    options: [
      { value: 0, label: 'No se auscultan' },
      { value: 1, label: 'Al final de la espiración', detail: 'Con fonendoscopio' },
      { value: 2, label: 'En inspiración y espiración', detail: 'Con fonendoscopio' },
      { value: 3, label: 'Audibles a distancia o tórax silente', detail: 'La ausencia por tórax silente también puntúa 3' },
    ],
  },
  {
    id: 'cianosis',
    label: 'Cianosis',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Perioral al llorar' },
      { value: 2, label: 'Perioral en reposo' },
      { value: 3, label: 'Generalizada en reposo' },
    ],
  },
  {
    id: 'retraccion',
    label: 'Retracción / uso de musculatura accesoria',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Subcostal (+)' },
      { value: 2, label: 'Sub e intercostal (++)' },
      { value: 3, label: 'Supraesternal, sub e intercostal (+++)' },
    ],
  },
];

export function getTalResult(score) {
  if (score <= 5) return {
    nivel: 'Obstrucción leve',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-900',
    conducta: 'Manejo ambulatorio con broncodilatador y control.',
    recs: [
      'Salbutamol 2 puff con aerocámara cada 4–6 h según evolución.',
      'Educar signos de alarma y controlar en 24 h o antes si empeora.',
      'Indicar kinesioterapia respiratoria si hay hipersecreción.',
    ],
  };
  if (score <= 8) return {
    nivel: 'Obstrucción moderada',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-900',
    conducta: 'Hospitalización abreviada y reevaluación con puntaje.',
    recs: [
      'Salbutamol 2 puff cada 10 minutos por 5 veces, con aerocámara.',
      'Reevaluar con puntaje de Tal al terminar la serie.',
      'Si baja a leve: alta con indicaciones. Si se mantiene, repetir la serie y agregar corticoide sistémico.',
      'Si sube a grave o no responde tras la segunda serie: hospitalizar.',
    ],
  };
  return {
    nivel: 'Obstrucción grave',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-900',
    conducta: 'Oxígeno, corticoide sistémico y hospitalización.',
    recs: [
      'Oxígeno para saturación ≥ 93% y monitorización continua.',
      'Salbutamol en serie y corticoide sistémico precoz.',
      'Hospitalizar; avisar a pediatría y evaluar traslado si no responde.',
      'Reevaluar con puntaje tras cada intervención.',
    ],
  };
}

export default function TalCalculator() {
  const [tramo, setTramo] = useState('');

  const items = [
    {
      id: 'frecuencia',
      label: 'Frecuencia respiratoria',
      detail: tramo === '' ? 'Elige primero el tramo de edad.' : tramo === 'menor' ? 'Tramo menor de 6 meses' : 'Tramo 6 meses o más',
      options: tramo === 'menor' ? FR_MENOR_6M : FR_MAYOR_6M,
    },
    ...RESTO,
  ];

  return (
    <OrdinalScore
      title="Puntaje de Tal modificado — Obstrucción bronquial"
      subtitle="Gravedad del síndrome bronquial obstructivo en el menor de 3 años."
      gradient="from-sky-700 to-cyan-700"
      accent="sky"
      items={items}
      maxScore={12}
      interpret={getTalResult}
      ready={tramo !== ''}
      readyHint="Selecciona el tramo de edad para puntuar la frecuencia respiratoria."
      extra={
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tramo de edad</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[['menor', 'Menor de 6 meses'], ['mayor', '6 meses o más']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTramo(value)}
                aria-pressed={tramo === value}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  tramo === value ? 'border-sky-500 bg-sky-50 text-slate-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      }
      references={[
        { label: 'MINSAL — Guía clínica IRA baja de manejo ambulatorio en menores de 5 años', url: 'https://www.minsal.cl' },
      ]}
      footnote="Cortes: 0–5 leve, 6–8 moderado, 9–12 grave. Reevaluar siempre con el mismo puntaje tras cada intervención. Herramienta de apoyo: no reemplaza el juicio clínico."
    />
  );
}
