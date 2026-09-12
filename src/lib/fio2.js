// Estimación de FiO2 según el dispositivo de oxigenoterapia en uso.
//
// En naricera y mascarilla simple la FiO2 no se controla: se estima a partir
// del flujo y varía con el patrón ventilatorio del paciente. En Venturi, cánula
// de alto flujo y ventilación mecánica la FiO2 se programa, así que se toma el
// valor indicado. Las estimaciones son aproximadas y no reemplazan la medición.

export const DISPOSITIVOS_O2 = [
  {
    id: 'ambiental',
    label: 'Aire ambiental',
    tipo: 'fijo',
    fio2: 21,
    nota: 'Sin aporte de oxígeno.',
  },
  {
    id: 'naricera',
    label: 'Naricera (cánula nasal)',
    tipo: 'flujo',
    flujoMin: 0.5,
    flujoMax: 6,
    paso: 0.5,
    estimar: flujo => Math.min(45, 21 + 4 * flujo),
    nota: 'Aproximación clásica: 21% + 4% por cada litro. Sobre 6 L/min no aumenta de forma confiable.',
  },
  {
    id: 'mascarilla',
    label: 'Mascarilla simple',
    tipo: 'flujo',
    flujoMin: 5,
    flujoMax: 10,
    paso: 1,
    estimar: flujo => Math.min(60, 35 + 5 * (flujo - 5)),
    nota: 'Requiere al menos 5 L/min para evitar reinhalación de CO₂.',
  },
  {
    id: 'reservorio',
    label: 'Mascarilla con reservorio',
    tipo: 'flujo',
    flujoMin: 10,
    flujoMax: 15,
    paso: 1,
    estimar: flujo => Math.min(95, 60 + 6 * (flujo - 10)),
    nota: 'El reservorio debe permanecer inflado durante toda la inspiración.',
  },
  {
    id: 'venturi',
    label: 'Mascarilla Venturi',
    tipo: 'opciones',
    opciones: [24, 28, 31, 35, 40, 50],
    nota: 'FiO2 fija según el jet: entrega el valor programado aunque cambie el patrón respiratorio.',
  },
  {
    id: 'cnaf',
    label: 'Cánula nasal de alto flujo (CNAF)',
    tipo: 'directo',
    min: 21,
    max: 100,
    nota: 'FiO2 programada en el equipo.',
  },
  {
    id: 'vm',
    label: 'Ventilación mecánica',
    tipo: 'directo',
    min: 21,
    max: 100,
    nota: 'FiO2 programada en el ventilador.',
  },
];

export const dispositivoPorId = id => DISPOSITIVOS_O2.find(item => item.id === id) || null;

/**
 * Devuelve la FiO2 en porcentaje (21–100) o null si faltan datos.
 * @param {{dispositivo:string, flujo?:number|string, fio2?:number|string}} params
 */
export function estimarFio2({ dispositivo, flujo, fio2 }) {
  const item = dispositivoPorId(dispositivo);
  if (!item) return null;
  if (item.tipo === 'fijo') return item.fio2;

  if (item.tipo === 'flujo') {
    const valor = Number(flujo);
    if (!Number.isFinite(valor) || valor <= 0) return null;
    return Math.round(item.estimar(valor));
  }

  const valor = Number(fio2);
  if (!Number.isFinite(valor) || valor < 21 || valor > 100) return null;
  return Math.round(valor);
}
