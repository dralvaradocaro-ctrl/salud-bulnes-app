import OrdinalScore from './OrdinalScore';

const opcion = puntos => [{ value: 0, label: 'No' }, { value: puntos, label: `Sí (+${puntos})` }];

const ITEMS = [
  { id: 'tvp', label: 'Signos clínicos de trombosis venosa profunda', detail: 'Edema de extremidad y dolor a la palpación del trayecto venoso', options: opcion(3) },
  { id: 'alternativa', label: 'Tromboembolismo pulmonar es el diagnóstico más probable', detail: 'No hay una alternativa que explique mejor el cuadro', options: opcion(3) },
  { id: 'fc', label: 'Frecuencia cardíaca > 100 lpm', options: opcion(1.5) },
  { id: 'inmovilizacion', label: 'Inmovilización ≥ 3 días o cirugía en las últimas 4 semanas', options: opcion(1.5) },
  { id: 'previo', label: 'Trombosis venosa profunda o tromboembolismo previo', options: opcion(1.5) },
  { id: 'hemoptisis', label: 'Hemoptisis', options: opcion(1) },
  { id: 'cancer', label: 'Cáncer activo', detail: 'En tratamiento, tratado en los últimos 6 meses o paliativo', options: opcion(1) },
];

export function getWellsTepResult(score) {
  if (score <= 4) return {
    nivel: `Tromboembolismo improbable (${score})`,
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Solicitar dímero D: si es negativo, se descarta sin imágenes.',
    recs: [
      'Con dímero D negativo (ajustado por edad sobre los 50 años) no se requiere angioTAC.',
      'Con dímero D positivo, continuar con angioTAC de tórax.',
      'En el esquema de tres niveles: 0–1 bajo, 2–6 intermedio.',
    ],
  };
  return {
    nivel: `Tromboembolismo probable (${score})`,
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Ir directo a imagen: angioTAC de tórax, sin dímero D.',
    recs: [
      'El dímero D no sirve para descartar en esta categoría.',
      'Considerar anticoagulación empírica mientras se confirma, si el riesgo de sangrado es bajo.',
      'Si hay inestabilidad hemodinámica, evaluar ecocardiograma y trombólisis.',
    ],
  };
}

export default function WellsTepCalculator() {
  return (
    <OrdinalScore
      title="Wells — Probabilidad de tromboembolismo pulmonar"
      subtitle="Define si corresponde dímero D o pasar directo a imagen."
      gradient="from-indigo-700 to-violet-700"
      accent="violet"
      items={ITEMS}
      maxScore={12.5}
      interpret={getWellsTepResult}
      references={[
        { label: 'Wells PS et al. Thromb Haemost 2000', url: 'https://doi.org/10.1055/s-0037-1613830' },
        { label: 'ESC 2019 — Guía de tromboembolismo pulmonar agudo', url: 'https://doi.org/10.1093/eurheartj/ehz405' },
      ]}
      footnote="Esquema dicotómico: ≤4 improbable, >4 probable. No aplica en embarazo, donde se usan algoritmos específicos (YEARS o Ginebra adaptado)."
    />
  );
}
