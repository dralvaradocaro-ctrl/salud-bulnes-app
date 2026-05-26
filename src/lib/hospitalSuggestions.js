// Sugerencias precargadas (datalists) usadas en los formularios oficiales
// del Hospital Comunitario de Salud Familiar de Bulnes.

// Servicios clínicos del hospital.
export const SERVICIOS = [
  'MQ1',
  'MQ2',
  'Pediatría',
  'Ginecología/Obstetricia',
  'Urgencias',
  'Policlínico',
];

// Salas: MQ1 tiene salas 1-8, MQ2 tiene salas 1-5. Pediatría y Gineco no
// están subdivididas por sala numerada. Urgencias y Policlínico son
// espacios únicos.
const MQ1_SALAS = Array.from({ length: 8 }, (_, i) => `MQ1 - Sala ${i + 1}`);
const MQ2_SALAS = Array.from({ length: 5 }, (_, i) => `MQ2 - Sala ${i + 1}`);

export const SALAS = [
  ...MQ1_SALAS,
  ...MQ2_SALAS,
  'Pediatría',
  'Ginecología/Obstetricia',
  'Urgencias',
  'Policlínico',
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
