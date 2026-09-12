import OrdinalScore from './OrdinalScore';

// Score de Westley: gravedad del crup (laringitis obstructiva).
const ITEMS = [
  {
    id: 'conciencia',
    label: 'Nivel de conciencia',
    options: [
      { value: 0, label: 'Normal, incluso dormido' },
      { value: 5, label: 'Desorientado o comprometido' },
    ],
  },
  {
    id: 'cianosis',
    label: 'Cianosis',
    options: [
      { value: 0, label: 'Ninguna' },
      { value: 4, label: 'Con la agitación' },
      { value: 5, label: 'En reposo' },
    ],
  },
  {
    id: 'estridor',
    label: 'Estridor',
    options: [
      { value: 0, label: 'Ninguno' },
      { value: 1, label: 'Con la agitación' },
      { value: 2, label: 'En reposo' },
    ],
  },
  {
    id: 'entradaAire',
    label: 'Entrada de aire',
    options: [
      { value: 0, label: 'Normal' },
      { value: 1, label: 'Disminuida' },
      { value: 2, label: 'Muy disminuida' },
    ],
  },
  {
    id: 'retraccion',
    label: 'Retracción',
    options: [
      { value: 0, label: 'Ninguna' },
      { value: 1, label: 'Leve' },
      { value: 2, label: 'Moderada' },
      { value: 3, label: 'Severa' },
    ],
  },
];

export function getWestleyResult(score) {
  if (score <= 2) return {
    nivel: 'Crup leve',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-900',
    conducta: 'Corticoide en dosis única y manejo ambulatorio.',
    recs: [
      'Dexametasona 0,15–0,6 mg/kg por vía oral, dosis única (máximo 10 mg).',
      'Mantener al niño tranquilo: el llanto empeora la obstrucción.',
      'Educar signos de alarma y control si aparece estridor en reposo.',
    ],
  };
  if (score <= 7) return {
    nivel: 'Crup moderado',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-900',
    conducta: 'Corticoide más adrenalina nebulizada y observación.',
    recs: [
      'Dexametasona 0,15–0,6 mg/kg, dosis única.',
      'Adrenalina nebulizada; observar al menos 2–4 h por el efecto rebote.',
      'Alta si queda sin estridor en reposo y con buena entrada de aire.',
      'Hospitalizar si requiere una segunda dosis de adrenalina o no mejora.',
    ],
  };
  if (score <= 11) return {
    nivel: 'Crup grave',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-900',
    conducta: 'Adrenalina nebulizada, corticoide, oxígeno y hospitalización.',
    recs: [
      'Adrenalina nebulizada, repetible según respuesta, con monitorización continua.',
      'Dexametasona 0,6 mg/kg; considerar vía parenteral si no tolera la oral.',
      'Oxígeno para mantener la saturación; manipular lo mínimo posible.',
      'Hospitalizar y avisar a pediatría; evaluar traslado a mayor complejidad.',
    ],
  };
  return {
    nivel: 'Falla respiratoria inminente',
    bg: 'bg-red-100 border-red-400',
    badge: 'bg-red-200 text-red-900',
    text: 'text-red-900',
    conducta: 'Emergencia: manejo de vía aérea y traslado a cuidados intensivos.',
    recs: [
      'Llamar de inmediato al equipo de reanimación y preparar vía aérea avanzada.',
      'Adrenalina nebulizada continua, oxígeno y corticoide parenteral.',
      'Intubación por el operador más experimentado, con tubo de menor calibre.',
      'Coordinar traslado urgente a unidad de cuidados intensivos pediátricos.',
    ],
  };
}

export default function WestleyCalculator() {
  return (
    <OrdinalScore
      title="Score de Westley — Crup"
      subtitle="Gravedad de la laringitis obstructiva y conducta según puntaje."
      gradient="from-violet-700 to-indigo-700"
      accent="violet"
      items={ITEMS}
      maxScore={17}
      interpret={getWestleyResult}
      references={[
        { label: 'Westley CR, Cotton EK, Brooks JG. Nebulized racemic epinephrine in croup. Am J Dis Child 1978', url: 'https://doi.org/10.1001/archpedi.1978.02120290056006' },
      ]}
      footnote="Cortes: ≤2 leve, 3–7 moderado, 8–11 grave, ≥12 falla respiratoria inminente. Evitar procedimientos que agiten al niño mientras haya estridor en reposo."
    />
  );
}
