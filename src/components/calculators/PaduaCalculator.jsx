import OrdinalScore from './OrdinalScore';

const opcion = puntos => [{ value: 0, label: 'No' }, { value: puntos, label: `Sí (+${puntos})` }];

const ITEMS = [
  { id: 'cancer', label: 'Cáncer activo', detail: 'Metástasis, o quimioterapia o radioterapia en los últimos 6 meses', options: opcion(3) },
  { id: 'tev', label: 'Tromboembolismo venoso previo', detail: 'Excluye trombosis superficial', options: opcion(3) },
  { id: 'movilidad', label: 'Movilidad reducida', detail: 'Reposo en cama con baño asistido por al menos 3 días', options: opcion(3) },
  { id: 'trombofilia', label: 'Trombofilia conocida', options: opcion(3) },
  { id: 'trauma', label: 'Trauma o cirugía en el último mes', options: opcion(2) },
  { id: 'edad', label: 'Edad ≥ 70 años', options: opcion(1) },
  { id: 'cardioresp', label: 'Insuficiencia cardíaca o respiratoria', options: opcion(1) },
  { id: 'iamacv', label: 'Infarto agudo al miocardio o accidente cerebrovascular isquémico', options: opcion(1) },
  { id: 'infeccion', label: 'Infección aguda o enfermedad reumatológica', options: opcion(1) },
  { id: 'obesidad', label: 'Obesidad (IMC ≥ 30)', options: opcion(1) },
  { id: 'hormonal', label: 'Tratamiento hormonal en curso', options: opcion(1) },
];

export function getPaduaResult(score) {
  if (score < 4) return {
    nivel: `Bajo riesgo (${score})`,
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'No se recomienda profilaxis farmacológica de rutina.',
    recs: [
      'Movilización precoz y medidas generales.',
      'Reevaluar si cambia la situación clínica o se prolonga el reposo.',
    ],
  };
  return {
    nivel: `Alto riesgo (${score})`,
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Indicar tromboprofilaxis farmacológica, salvo contraindicación.',
    recs: [
      'Heparina de bajo peso molecular en dosis profiláctica, ajustada a función renal y peso.',
      'Si hay sangrado activo o alto riesgo hemorrágico, usar profilaxis mecánica.',
      'Reevaluar a diario mientras dure la hospitalización.',
    ],
  };
}

export default function PaduaCalculator() {
  return (
    <OrdinalScore
      title="Padua — Riesgo trombótico en paciente médico"
      subtitle="Define la necesidad de tromboprofilaxis en hospitalizados no quirúrgicos."
      gradient="from-blue-700 to-indigo-700"
      accent="sky"
      items={ITEMS}
      maxScore={20}
      interpret={getPaduaResult}
      references={[
        { label: 'Barbar S et al. J Thromb Haemost 2010', url: 'https://doi.org/10.1111/j.1538-7836.2010.04044.x' },
      ]}
      footnote="Corte de alto riesgo: 4 puntos o más. Para pacientes quirúrgicos se usa Caprini. Evaluar siempre el riesgo de sangrado antes de indicar profilaxis."
    />
  );
}
