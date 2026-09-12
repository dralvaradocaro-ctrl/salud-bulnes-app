import OrdinalScore from './OrdinalScore';

// SOFA: seis sistemas, cada uno de 0 a 4 puntos.
const ITEMS = [
  {
    id: 'respiratorio',
    label: 'Respiratorio — PaO₂/FiO₂',
    detail: 'Los puntajes 3 y 4 exigen soporte ventilatorio (invasivo o no invasivo)',
    options: [
      { value: 0, label: '≥ 400' },
      { value: 1, label: '< 400' },
      { value: 2, label: '< 300' },
      { value: 3, label: '< 200 con soporte ventilatorio' },
      { value: 4, label: '< 100 con soporte ventilatorio' },
    ],
  },
  {
    id: 'coagulacion',
    label: 'Coagulación — plaquetas (×10³/µL)',
    options: [
      { value: 0, label: '≥ 150' },
      { value: 1, label: '< 150' },
      { value: 2, label: '< 100' },
      { value: 3, label: '< 50' },
      { value: 4, label: '< 20' },
    ],
  },
  {
    id: 'hepatico',
    label: 'Hepático — bilirrubina (mg/dL)',
    options: [
      { value: 0, label: '< 1,2' },
      { value: 1, label: '1,2 – 1,9' },
      { value: 2, label: '2,0 – 5,9' },
      { value: 3, label: '6,0 – 11,9' },
      { value: 4, label: '≥ 12,0' },
    ],
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    detail: 'Dosis de vasoactivos en µg/kg/min por al menos 1 hora',
    options: [
      { value: 0, label: 'PAM ≥ 70 mmHg' },
      { value: 1, label: 'PAM < 70 mmHg' },
      { value: 2, label: 'Dopamina ≤ 5 o dobutamina en cualquier dosis' },
      { value: 3, label: 'Dopamina > 5, adrenalina ≤ 0,1 o noradrenalina ≤ 0,1' },
      { value: 4, label: 'Dopamina > 15, adrenalina > 0,1 o noradrenalina > 0,1' },
    ],
  },
  {
    id: 'neurologico',
    label: 'Neurológico — Glasgow',
    options: [
      { value: 0, label: '15' },
      { value: 1, label: '13 – 14' },
      { value: 2, label: '10 – 12' },
      { value: 3, label: '6 – 9' },
      { value: 4, label: '< 6' },
    ],
  },
  {
    id: 'renal',
    label: 'Renal — creatinina o diuresis',
    options: [
      { value: 0, label: 'Creatinina < 1,2 mg/dL' },
      { value: 1, label: 'Creatinina 1,2 – 1,9' },
      { value: 2, label: 'Creatinina 2,0 – 3,4' },
      { value: 3, label: 'Creatinina 3,5 – 4,9 o diuresis < 500 ml/día' },
      { value: 4, label: 'Creatinina ≥ 5,0 o diuresis < 200 ml/día' },
    ],
  },
];

export function getSofaResult(score) {
  if (score <= 1) return {
    nivel: `SOFA ${score} — sin disfunción orgánica significativa`,
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Mortalidad estimada bajo el 10%.',
    recs: ['Repetir el cálculo si el paciente se deteriora: el cambio en el tiempo predice mejor que un valor aislado.'],
  };
  if (score <= 6) return {
    nivel: `SOFA ${score} — disfunción orgánica`,
    bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900',
    conducta: 'Con infección sospechada y aumento ≥ 2 puntos sobre el basal, se cumple criterio de sepsis.',
    recs: [
      'Mortalidad estimada cercana al 10%.',
      'Cultivos, antibiótico precoz y reevaluación de la perfusión.',
    ],
  };
  if (score <= 9) return {
    nivel: `SOFA ${score} — disfunción moderada a grave`,
    bg: 'bg-orange-50 border-orange-300', badge: 'bg-orange-100 text-orange-900', text: 'text-orange-900',
    conducta: 'Manejo en unidad de mayor complejidad.',
    recs: [
      'Mortalidad estimada entre 15% y 20%.',
      'Monitorización continua y soporte de los órganos comprometidos.',
    ],
  };
  if (score <= 12) return {
    nivel: `SOFA ${score} — disfunción grave`,
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Cuidados intensivos: mortalidad estimada entre 40% y 50%.',
    recs: [
      'Soporte multiorgánico y reevaluación frecuente.',
      'Conversar objetivos de cuidado con el paciente o su familia.',
    ],
  };
  return {
    nivel: `SOFA ${score} — disfunción multiorgánica`,
    bg: 'bg-red-100 border-red-400', badge: 'bg-red-200 text-red-900', text: 'text-red-900',
    conducta: 'Mortalidad estimada sobre el 50%, y sobre el 80% con 15 puntos o más.',
    recs: [
      'Soporte máximo en cuidados intensivos si es concordante con los objetivos de cuidado.',
      'Definir y registrar la adecuación del esfuerzo terapéutico.',
    ],
  };
}

export default function SofaCalculator() {
  return (
    <OrdinalScore
      title="SOFA — Disfunción orgánica secuencial"
      subtitle="Gravedad de la falla de órganos; base del criterio actual de sepsis."
      gradient="from-red-700 to-rose-800"
      accent="rose"
      items={ITEMS}
      maxScore={24}
      interpret={getSofaResult}
      references={[
        { label: 'Vincent JL et al. Intensive Care Med 1996', url: 'https://doi.org/10.1007/BF01709751' },
        { label: 'Singer M et al. Sepsis-3. JAMA 2016', url: 'https://doi.org/10.1001/jama.2016.0287' },
      ]}
      footnote="Sepsis (Sepsis-3): infección sospechada más un aumento de 2 o más puntos sobre el SOFA basal. En pacientes sin disfunción previa conocida, el basal se asume en cero."
    />
  );
}
