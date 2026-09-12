import { useState } from 'react';
import OrdinalScore from './OrdinalScore';

// Score Pulmonar (SP) del Manual de supervivencia HLCM, para mayores de 3 años.
const FR_MENOR_6A = [
  { value: 0, label: '≤ 30 por minuto' },
  { value: 1, label: '31 – 45 por minuto' },
  { value: 2, label: '46 – 60 por minuto' },
  { value: 3, label: '≥ 61 por minuto' },
];

const FR_MAYOR_6A = [
  { value: 0, label: '≤ 20 por minuto' },
  { value: 1, label: '21 – 35 por minuto' },
  { value: 2, label: '36 – 49 por minuto' },
  { value: 3, label: '≥ 50 por minuto' },
];

const RESTO = [
  {
    id: 'sibilancias',
    label: 'Sibilancias o crépitos',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Al final de la espiración' },
      { value: 2, label: 'Durante toda la espiración, audibles con fonendoscopio' },
      { value: 3, label: 'Espiración e inspiración sin fonendoscopio, o murmullo pulmonar abolido' },
    ],
  },
  {
    id: 'retraccion',
    label: 'Uso de musculatura accesoria',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Retracción intercostal o subcostal leve' },
      { value: 2, label: 'Retracción intercostal o subcostal moderada' },
      { value: 3, label: 'Retracción marcada, supraesternal o cabeceo' },
    ],
  },
];

export function getScorePulmonarResult(score) {
  if (score <= 3) return {
    nivel: 'Obstrucción leve',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-900',
    conducta: 'Manejo ambulatorio con broncodilatador y control.',
    recs: [
      'Salbutamol con aerocámara y control según evolución.',
      'Educar signos de alarma antes del alta.',
    ],
  };
  if (score <= 6) return {
    nivel: 'Obstrucción moderada',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-900',
    conducta: 'Hospitalización abreviada y reevaluación con el mismo puntaje.',
    recs: [
      'Serie de salbutamol con aerocámara y corticoide sistémico según respuesta.',
      'Reevaluar con Score Pulmonar al terminar la serie.',
      'Si no mejora, hospitalizar.',
    ],
  };
  return {
    nivel: 'Obstrucción grave',
    bg: 'bg-red-50 border-red-300',
    badge: 'bg-red-100 text-red-900',
    text: 'text-red-900',
    conducta: 'Oxígeno, corticoide sistémico y hospitalización.',
    recs: [
      'Oxígeno para saturación ≥ 93% y monitorización continua.',
      'Broncodilatador en serie y corticoide sistémico precoz.',
      'Evaluar cánula nasal de alto flujo según protocolo.',
      'Si persiste sobre 6 puntos pese al manejo, presentar a unidad de paciente crítico.',
    ],
  };
}

export default function ScorePulmonarCalculator() {
  const [tramo, setTramo] = useState('');

  const items = [
    {
      id: 'frecuencia',
      label: 'Frecuencia respiratoria',
      detail: tramo === '' ? 'Elige primero el tramo de edad.' : tramo === 'menor' ? 'Tramo menor de 6 años' : 'Tramo 6 años o más',
      options: tramo === 'menor' ? FR_MENOR_6A : FR_MAYOR_6A,
    },
    ...RESTO,
  ];

  return (
    <OrdinalScore
      title="Score Pulmonar — Obstrucción bronquial sobre 3 años"
      subtitle="Equivalente del Tal para el preescolar mayor, el escolar y el adolescente."
      gradient="from-indigo-700 to-sky-700"
      accent="sky"
      items={items}
      maxScore={9}
      interpret={getScorePulmonarResult}
      ready={tramo !== ''}
      readyHint="Selecciona el tramo de edad para puntuar la frecuencia respiratoria."
      extra={
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tramo de edad</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[['menor', 'Menor de 6 años'], ['mayor', '6 años o más']].map(([value, label]) => (
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
        { label: 'Manual de supervivencia — Residencia Pediátrica HLCM', url: '' },
        { label: 'J Pediatr 2018;194:204-210.e3', url: '' },
      ]}
      footnote="Cortes del manual: leve ≤3, moderado 4–6, grave >6. En el protocolo de cánula de alto flujo, una caída de 2 o más puntos a los 60 minutos se considera respuesta favorable; si persiste sobre 6, se presenta a cuidados intensivos. El manual imprime el tramo de 6 años o más como 36–50 y ≥50: aquí se corrigió el traslape a 36–49 y ≥50."
    />
  );
}
