import OrdinalScore from './OrdinalScore';

const SI_NO = puntos => [{ value: 0, label: 'No' }, { value: puntos, label: `Sí (+${puntos})` }];

const ITEMS = [
  { id: 'fr', label: 'Frecuencia respiratoria ≥ 22 por minuto', options: SI_NO(1) },
  { id: 'conciencia', label: 'Alteración del estado mental', detail: 'Glasgow menor de 15', options: SI_NO(1) },
  { id: 'pas', label: 'Presión arterial sistólica ≤ 100 mmHg', options: SI_NO(1) },
];

export function getQsofaResult(score) {
  if (score < 2) return {
    nivel: 'qSOFA negativo',
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'No descarta sepsis: si la sospecha es alta, seguir el estudio igual.',
    recs: [
      'Reevaluar si el paciente se deteriora o aparece un nuevo foco.',
      'La sensibilidad del qSOFA es baja: sirve para alertar, no para excluir.',
    ],
  };
  return {
    nivel: 'qSOFA positivo (≥ 2)',
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Mayor riesgo de mortalidad: activar manejo de sepsis y avisar al médico.',
    recs: [
      'Tomar lactato, hemocultivos antes del antibiótico y evaluar foco.',
      'Antibiótico precoz y reanimación con fluidos según la perfusión.',
      'Calcular SOFA completo y considerar unidad de mayor complejidad.',
    ],
  };
}

export default function QsofaCalculator() {
  return (
    <OrdinalScore
      title="qSOFA — Sospecha rápida de sepsis"
      subtitle="Tamizaje junto a la cama en pacientes con infección sospechada."
      gradient="from-rose-700 to-red-700"
      accent="rose"
      items={ITEMS}
      maxScore={3}
      interpret={getQsofaResult}
      references={[
        { label: 'Singer M et al. Sepsis-3. JAMA 2016', url: 'https://doi.org/10.1001/jama.2016.0287' },
      ]}
      footnote="Un qSOFA negativo no descarta sepsis. Las guías actuales desaconsejan usarlo como tamizaje único: es una señal de alarma que obliga a evaluar mejor."
    />
  );
}
