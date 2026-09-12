import OrdinalScore from './OrdinalScore';

const SI_NO = [{ value: 0, label: 'No' }, { value: 1, label: 'Sí (+1)' }];

const ITEMS = [
  { id: 'confusion', label: 'Confusión', detail: 'Desorientación en tiempo, espacio o persona, o test mental abreviado ≤ 8', options: SI_NO },
  { id: 'urea', label: 'Nitrógeno ureico > 19 mg/dL', detail: 'Equivale a urea > 42 mg/dL o > 7 mmol/L', options: SI_NO },
  { id: 'fr', label: 'Frecuencia respiratoria ≥ 30 por minuto', options: SI_NO },
  { id: 'pa', label: 'Presión sistólica < 90 o diastólica ≤ 60 mmHg', options: SI_NO },
  { id: 'edad', label: 'Edad ≥ 65 años', options: SI_NO },
];

export function getCurb65Result(score) {
  if (score <= 1) return {
    nivel: score === 0 ? 'Riesgo bajo (0)' : 'Riesgo bajo (1)',
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Manejo ambulatorio, salvo que otro factor lo impida.',
    recs: [
      'Mortalidad a 30 días cercana al 1,5%.',
      'Considerar igual hospitalización por hipoxemia, comorbilidad descompensada, intolerancia oral o red de apoyo insuficiente.',
      'Control clínico en 48–72 horas.',
    ],
  };
  if (score === 2) return {
    nivel: 'Riesgo intermedio (2)',
    bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900',
    conducta: 'Hospitalización breve u observación supervisada.',
    recs: [
      'Mortalidad a 30 días cercana al 9%.',
      'Iniciar antibiótico precoz y evaluar oxigenación.',
    ],
  };
  return {
    nivel: `Riesgo alto (${score})`,
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Hospitalizar; con 4 o 5 puntos evaluar unidad de paciente crítico.',
    recs: [
      'Mortalidad a 30 días del 15% o más, y hasta 40% con 4–5 puntos.',
      'Antibiótico precoz, hemocultivos y evaluación de la oxigenación.',
      'Buscar criterios de neumonía grave y avisar a médico tratante.',
    ],
  };
}

export default function Curb65Calculator() {
  return (
    <OrdinalScore
      title="CURB-65 — Gravedad de la neumonía comunitaria"
      subtitle="Decide el lugar de manejo en el adulto con neumonía adquirida en la comunidad."
      gradient="from-sky-700 to-blue-700"
      accent="sky"
      items={ITEMS}
      maxScore={5}
      interpret={getCurb65Result}
      references={[
        { label: 'Lim WS et al. Thorax 2003', url: 'https://doi.org/10.1136/thorax.58.5.377' },
      ]}
      footnote="Validado en adultos con neumonía comunitaria; no aplica a neumonía intrahospitalaria ni a inmunosuprimidos. El puntaje orienta, pero la saturación, la comorbilidad y la situación social pueden justificar hospitalizar igual."
    />
  );
}
