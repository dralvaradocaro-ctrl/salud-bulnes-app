// ─────────────────────────────────────────────────────────────────────────
// Catálogo de servicios / salas / camas del Hospital de Bulnes.
// Hardcodeado desde la planilla de distribución de camas (gestión de camas).
// MQ2 = Médico Quirúrgico MC. Verde/rojo de la planilla NO aplica aquí.
//
// EDITABLE: para corregir camas, agregar o renombrar salas, edita este archivo.
//
// aggregateBy:
//   'sala'    → la vista final cuenta por sala: "MQ1 SALA 2 (2)"
//   'service' → la vista final cuenta por servicio: "PED (2)", "GINE (1)"
// ─────────────────────────────────────────────────────────────────────────

const beds = (...codes) => codes.map((code) => ({ code }));

export const BED_CATALOG = [
  {
    id: 'gine',
    name: 'Gineco-Obstetricia HB',
    short: 'GINE',
    aggregateBy: 'service',
    salas: [
      { id: 'gine', label: 'GINE', beds: beds('08MB-1', '08MB-2', '08MB-3', 'SNC-1', 'SNC-2', 'SNC-3') },
    ],
  },
  {
    id: 'mq2',
    name: 'Médico Quirúrgico MC',
    short: 'MQ2',
    aggregateBy: 'sala',
    salas: [
      { id: 'mq2-s2', label: 'SALA 2', beds: beds('S2MQMCHB-1', 'S2MQMCHB-2', 'S2MQMCHB-3', 'S2MQMCHB-4', 'S2MQMCHB-5') },
      { id: 'mq2-s3', label: 'SALA 3', beds: beds('S3MQMCHB-1', 'S3MQMCHB-2', 'S3MQMCHB-3', 'S3MQMCHB-4', 'S3MQMCHB-5') },
      { id: 'mq2-s4', label: 'SALA 4', beds: beds('S4MQMCHB-1', 'S4MQMCHB-2', 'S4MQMCHB-3', 'S4MQMCHB-4', 'S4MQMCHB-5') },
      { id: 'mq2-a1', label: 'AISLAMIENTO 1', beds: beds('MQ2-AISL-1') },
      { id: 'mq2-a2', label: 'AISLAMIENTO 2', beds: beds('MQ2-AISL-2') },
    ],
  },
  {
    id: 'mq1',
    name: 'Médico-Quirúrgico HB',
    short: 'MQ1',
    aggregateBy: 'sala',
    salas: [
      { id: 'mq1-s1', label: 'SALA 1', beds: beds('01MQB-01', '01MQB-02', '01MQB-03', '01MQB-04', '01MQB-05') },
      { id: 'mq1-s2', label: 'SALA 2', beds: beds('02MQB-01', '02MQB-02', '02MQB-03', '02MQB-04', '02MQB-05') },
      { id: 'mq1-s3', label: 'SALA 3', beds: beds('03MQB-01', '03MQB-02', '03MQB-03', '03MQB-04', '03MQB-05') },
      { id: 'mq1-s4', label: 'SALA 4', beds: beds('04MQB-1', '04MQB-2', '04MQB-3', '04MQB-4', '04MQB-5') },
      { id: 'mq1-a5', label: 'AISL 5', beds: beds('05AMQB-5P', '05AMQB-5V') },
      { id: 'mq1-a6', label: 'AISL 6', beds: beds('06AMQB-01') },
      { id: 'mq1-a7', label: 'AISL 7', beds: beds('07AMQB-01') },
      { id: 'mq1-a8', label: 'AISL 8', beds: beds('08AMQB-01', '08AMQB-8P', '08AMQB-8V') },
    ],
  },
  {
    id: 'ped',
    name: 'Pediatría HB',
    short: 'PED',
    aggregateBy: 'service',
    salas: [
      { id: 'ped-s3', label: 'SALA 03', beds: beds('03PED-01', '03PED-02', '03PED-03') },
      { id: 'ped-s4', label: 'SALA 04', beds: beds('04PED-01', '04PED-02') },
      { id: 'ped-s5', label: 'SALA 05', beds: beds('05PED-01', '05PED-03') },
      { id: 'ped-s6', label: 'SALA 06', beds: beds('06PED-01', '06PED-03') },
    ],
  },
];

// Estados posibles de una cama en la agenda del día.
export const BED_STATE = {
  VISIT: 'visit', // ocupada, entra al reparto/visita del día
  NOVISIT: 'novisit', // no disponible para reparto
  BLOCKED: 'blocked', // social: no entra al reparto diario habitual
  EMPTY: 'empty', // disponible
};

// Ciclo al hacer click: disponible → ocupada → no disponible → social → disponible.
export const NEXT_STATE_CYCLE = {
  [BED_STATE.VISIT]: BED_STATE.NOVISIT,
  [BED_STATE.NOVISIT]: BED_STATE.BLOCKED,
  [BED_STATE.BLOCKED]: BED_STATE.EMPTY,
  [BED_STATE.EMPTY]: BED_STATE.VISIT,
};

// ─── Camas SOCIALES ────────────────────────────────────────────────────────
// Pacientes sociales: NO tienen visita diaria (se visitan ~cada 2 semanas).
// Aparecen pre-bloqueadas por defecto; se pueden desbloquear el día de su
// visita social y volver a bloquear luego.
// PROVISIONAL: pendiente la lista completa de camas sociales del usuario.
// Por ahora se marcan 2 camas de Pediatría como ejemplo — EDITAR aquí.
export const SOCIAL_BED_CODES = new Set([
  '05PED-03',
  '06PED-03',
]);

// Estado por defecto de una cama (cuando no hay estado guardado ni heredado).
export function defaultBedState(code) {
  return SOCIAL_BED_CODES.has(code) ? BED_STATE.BLOCKED : BED_STATE.EMPTY;
}

// Plantilla inicial cargada desde la agenda vigente enviada el 25-06-2026.
// Cuando la agenda trae solo "SALA X (n)" sin números de cama, se pre-marcan
// las primeras n camas de esa sala; el usuario puede corregirlas en el mapa.
export const INITIAL_BED_STATES_BY_DATE = {
  '2026-06-25': {
    '08MB-1': BED_STATE.VISIT, // MATER (1)
    '01MQB-01': BED_STATE.VISIT,
    '01MQB-02': BED_STATE.VISIT,
    '01MQB-03': BED_STATE.VISIT,
    '02MQB-01': BED_STATE.VISIT,
    '02MQB-02': BED_STATE.VISIT,
    '03MQB-01': BED_STATE.VISIT,
    '03MQB-02': BED_STATE.VISIT,
    '04MQB-1': BED_STATE.VISIT,
    '04MQB-2': BED_STATE.VISIT,
    '05AMQB-5P': BED_STATE.VISIT,
    '07AMQB-01': BED_STATE.VISIT,
    'S2MQMCHB-1': BED_STATE.VISIT,
    'S2MQMCHB-2': BED_STATE.VISIT,
    'S2MQMCHB-3': BED_STATE.VISIT,
    'S2MQMCHB-4': BED_STATE.VISIT,
    'S3MQMCHB-2': BED_STATE.VISIT,
    'S3MQMCHB-3': BED_STATE.VISIT,
    'S3MQMCHB-4': BED_STATE.VISIT,
    'S3MQMCHB-5': BED_STATE.VISIT,
    'S4MQMCHB-1': BED_STATE.VISIT,
    'MQ2-AISL-1': BED_STATE.VISIT,
    'MQ2-AISL-2': BED_STATE.VISIT,
  },
};

export function initialBedStatesForDate(date) {
  return INITIAL_BED_STATES_BY_DATE[String(date || '').slice(0, 10)] || {};
}

// Lista plana de todas las camas con su servicio y sala (para distribución).
export const ALL_BEDS = BED_CATALOG.flatMap((svc) =>
  svc.salas.flatMap((sala) =>
    sala.beds.map((b) => ({
      code: b.code,
      serviceId: svc.id,
      serviceShort: svc.short,
      salaId: sala.id,
      salaLabel: sala.label,
      aggregateBy: svc.aggregateBy,
    })),
  ),
);

export const bedByCode = (() => {
  const m = {};
  ALL_BEDS.forEach((b) => { m[b.code] = b; });
  return m;
})();

// Etiqueta de la unidad de agregación para la vista final.
// 'sala'    → "MQ1 SALA 2"
// 'service' → "PED"
export function aggregationLabel(bed) {
  return bed.aggregateBy === 'service' ? bed.serviceShort : `${bed.serviceShort} ${bed.salaLabel}`;
}
