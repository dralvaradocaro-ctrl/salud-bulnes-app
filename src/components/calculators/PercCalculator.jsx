import OrdinalScore from './OrdinalScore';

// En PERC cada criterio presente suma 1: el descarte exige que todos sean cero.
const SI_NO = [{ value: 0, label: 'No' }, { value: 1, label: 'Sí (+1)' }];

const ITEMS = [
  { id: 'edad', label: 'Edad ≥ 50 años', options: SI_NO },
  { id: 'fc', label: 'Frecuencia cardíaca ≥ 100 lpm', options: SI_NO },
  { id: 'sat', label: 'Saturación de oxígeno < 95% en aire ambiental', options: SI_NO },
  { id: 'edema', label: 'Edema unilateral de extremidad inferior', options: SI_NO },
  { id: 'hemoptisis', label: 'Hemoptisis', options: SI_NO },
  { id: 'cirugia', label: 'Cirugía o trauma con hospitalización en las últimas 4 semanas', options: SI_NO },
  { id: 'previo', label: 'Tromboembolismo o trombosis venosa profunda previa', options: SI_NO },
  { id: 'hormonas', label: 'Uso de estrógenos', detail: 'Anticonceptivos orales, terapia hormonal', options: SI_NO },
];

export function getPercResult(score) {
  if (score === 0) return {
    nivel: 'PERC negativo — los 8 criterios ausentes',
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Se puede descartar tromboembolismo sin dímero D ni imágenes.',
    recs: [
      'Sólo válido si la probabilidad clínica previa ya era baja (menor al 15%).',
      'El riesgo residual de tromboembolismo queda bajo el 2%.',
      'Buscar un diagnóstico alternativo que explique los síntomas.',
    ],
  };
  return {
    nivel: `PERC positivo — ${score} criterio${score === 1 ? '' : 's'} presente${score === 1 ? '' : 's'}`,
    bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900',
    conducta: 'No se puede descartar por PERC: seguir con el algoritmo diagnóstico.',
    recs: [
      'Aplicar Wells y, según el resultado, dímero D o angioTAC.',
      'PERC positivo no significa que haya tromboembolismo: solo que este atajo no aplica.',
    ],
  };
}

export default function PercCalculator() {
  return (
    <OrdinalScore
      title="PERC — Regla de descarte de tromboembolismo"
      subtitle="Permite descartar sin exámenes cuando la probabilidad previa ya es baja."
      gradient="from-emerald-700 to-teal-700"
      accent="teal"
      items={ITEMS}
      maxScore={8}
      interpret={getPercResult}
      references={[
        { label: 'Kline JA et al. J Thromb Haemost 2008', url: 'https://doi.org/10.1111/j.1538-7836.2008.02944.x' },
      ]}
      footnote="Se aplica solo cuando la sospecha clínica ya es baja; en probabilidad intermedia o alta no sirve para descartar. Tampoco se usa en embarazo."
    />
  );
}
