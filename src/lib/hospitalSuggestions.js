// Sugerencias precargadas (datalists) usadas en los formularios oficiales
// del Hospital Comunitario de Salud Familiar de Bulnes.

// Servicios clínicos del hospital.
export const SERVICIOS = [
  'MQ1',
  'MQ2',
  'Pediatría',
  'Ginecología Obstetricia',
  'Urgencias',
];

const buildRoomBeds = (room, count = 5, prefix = '') =>
  Array.from({ length: count }, (_, i) => `${prefix}${room}-${i + 1}`);

export const PROA_BED_MAP = [
  {
    servicio: 'MQ1',
    groups: [
      { label: 'Sala 1', beds: buildRoomBeds(1) },
      { label: 'Sala 2', beds: buildRoomBeds(2) },
      { label: 'Sala 3', beds: buildRoomBeds(3) },
      { label: 'Sala 4', beds: buildRoomBeds(4) },
      { label: 'Aislamientos', beds: ['Aisl 5-1', 'Aisl 5-2', 'Aisl 6', 'Aisl 7', 'Aisl 8-1', 'Aisl 8-2'] },
    ],
  },
  {
    servicio: 'MQ2',
    groups: [
      { label: 'Sala 2', beds: buildRoomBeds(2, 5, 'MQ2-') },
      { label: 'Sala 3', beds: buildRoomBeds(3, 5, 'MQ2-') },
      { label: 'Sala 4', beds: buildRoomBeds(4, 5, 'MQ2-') },
      { label: 'Sala 5', beds: buildRoomBeds(5, 1, 'MQ2-') },
      { label: 'Aislamientos', beds: ['MQ2-Aislamiento 1', 'MQ2-Aislamiento 2'] },
    ],
  },
  {
    servicio: 'Pediatría',
    groups: [{ label: 'Pediatría', beds: Array.from({ length: 9 }, (_, i) => `PED-${i + 1}`) }],
  },
  {
    servicio: 'Ginecología Obstetricia',
    groups: [
      { label: 'Ginecología', beds: Array.from({ length: 3 }, (_, i) => `GINE-${i + 1}`) },
      { label: 'Obstetricia', beds: Array.from({ length: 3 }, (_, i) => `OBS-${i + 1}`) },
    ],
  },
  {
    servicio: 'Urgencias',
    groups: [{ label: 'Servicio', beds: ['Urgencias'] }],
  },
];

const MQ1_SALAS = ['MQ1 - Sala 1', 'MQ1 - Sala 2', 'MQ1 - Sala 3', 'MQ1 - Sala 4'];
const MQ1_CAMAS = [
  ...buildRoomBeds(1),
  ...buildRoomBeds(2),
  ...buildRoomBeds(3),
  ...buildRoomBeds(4),
  'Aisl 5-1',
  'Aisl 5-2',
  'Aisl 6',
  'Aisl 7',
  'Aisl 8-1',
  'Aisl 8-2',
];

const MQ2_SALAS = ['MQ2 - Sala 2', 'MQ2 - Sala 3', 'MQ2 - Sala 4'];
const MQ2_AISLAMIENTO_SALAS = ['MQ2 - Aislamiento 1', 'MQ2 - Aislamiento 2'];
const MQ2_AISLAMIENTOS = ['MQ2-Aislamiento 1', 'MQ2-Aislamiento 2'];
const MQ2_CAMAS = [
  ...buildRoomBeds(2, 5, 'MQ2-'),
  ...buildRoomBeds(3, 5, 'MQ2-'),
  ...buildRoomBeds(4, 5, 'MQ2-'),
  ...buildRoomBeds(5, 1, 'MQ2-'),
  ...MQ2_AISLAMIENTOS,
];

export const SALAS = [
  ...MQ1_SALAS,
  ...MQ2_SALAS,
  ...MQ2_AISLAMIENTO_SALAS,
  'Pediatría',
  'Ginecología Obstetricia',
  'Urgencias',
];

export const CAMAS = [
  ...MQ1_CAMAS,
  ...MQ2_CAMAS,
  ...Array.from({ length: 9 }, (_, i) => `PED-${i + 1}`),
  ...Array.from({ length: 3 }, (_, i) => `GINE-${i + 1}`),
  ...Array.from({ length: 3 }, (_, i) => `OBS-${i + 1}`),
  'Urgencias',
];

export const SALA_CAMA_SUGGESTIONS = [
  ...MQ1_SALAS.flatMap((sala) => {
    const room = sala.match(/Sala (\d+)/)?.[1];
    return buildRoomBeds(room).map((cama) => `${sala} / Cama ${cama}`);
  }),
  'MQ1 - Aisl 5 / Cama Aisl 5-1',
  'MQ1 - Aisl 5 / Cama Aisl 5-2',
  'MQ1 - Aisl 6 / Cama Aisl 6',
  'MQ1 - Aisl 7 / Cama Aisl 7',
  'MQ1 - Aisl 8 / Cama Aisl 8-1',
  'MQ1 - Aisl 8 / Cama Aisl 8-2',
  ...MQ2_SALAS.flatMap((sala) => {
    const room = sala.match(/Sala (\d+)/)?.[1];
    return buildRoomBeds(room, 5, 'MQ2-').map((cama) => `${sala} / Cama ${cama}`);
  }),
  'MQ2 - Aislamiento 1 / Cama MQ2-Aislamiento 1',
  'MQ2 - Aislamiento 2 / Cama MQ2-Aislamiento 2',
  ...Array.from({ length: 9 }, (_, i) => `Pediatría / Cama PED-${i + 1}`),
  ...Array.from({ length: 3 }, (_, i) => `Ginecología Obstetricia / Cama GINE-${i + 1}`),
  ...Array.from({ length: 3 }, (_, i) => `Ginecología Obstetricia / Cama OBS-${i + 1}`),
  'Urgencias',
];

// Previsiones más comunes (para formularios que tengan campo texto libre).
export const PREVISIONES = [
  'Fonasa A',
  'Fonasa B',
  'Fonasa C',
  'Fonasa D',
  'Isapre',
  'Particular',
  'Acc. Tránsito',
  'Acc. Escolar',
  'Acc. Mutual',
];
