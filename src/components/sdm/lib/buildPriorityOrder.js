// Orden de construcción de la agenda — el usuario lo edita en la pestaña
// "Ordenar prioridades" y se persiste en localStorage. generateAgenda lo
// consulta para ordenar el iterador de blockTemplates (los bloques con
// menor `order` se resuelven primero, ganando el conflicto por médicos en
// horarios superpuestos).
//
// Hay dos niveles:
//
// 1) PHASES — fases generales de la agenda. Algunas son fijas (turnos,
//    posturno, refuerzos) y se documentan para que el usuario entienda el
//    orden de procesamiento. Otras (bloqueos, reuniones) tienen sub-orden
//    editable.
//
// 2) BLOCKS — orden específico de cada block_template_id / categoría. Es
//    el que más impacto tiene en la agenda generada.

const STORAGE_KEY = 'sdm_build_priority_v1';

// Orden por defecto basado en la lógica clínica que dictó el usuario:
// 1) Bloqueos jerárquicos (Subdirección, Tribunal, Selector de Demanda) —
//    siempre primero, ya están en PROTECTED_PRIORITY_BLOCK_IDS.
// 2) Bloqueos con titular estricto (paliativos, gestion_ges, regulacion IC,
//    dependencia severa) — críticos, no ceden ante overlap.
// 3) Programas con 1 bloqueo semanal (más fáciles de calzar).
// 4) Programas con múltiples bloqueos semanales.
// 5) Reuniones (más flexibles).
//
// Cualquier bloque no listado entra al final con un orden por defecto.
export const DEFAULT_BLOCK_ORDER = [
  // Jerárquicos / protegidos
  { id: 'subdireccion_medica',  label: 'Subdirección Médica',            phase: 'jerarquico' },
  { id: 'poli_taco',            label: 'Poli TACO',                       phase: 'jerarquico' },
  { id: 'selector_demanda',     label: 'Selector de Demanda',             phase: 'jerarquico' },

  // Titular estricto
  { id: 'cp_y_ad',              label: 'Cuidados Paliativos / AD',        phase: 'titular_estricto' },
  { id: 'dependencia_severa',   label: 'Dependencia Severa',              phase: 'titular_estricto' },
  { id: 'gestion_dep_severa',   label: 'Gestión Dependencia Severa',      phase: 'titular_estricto' },
  { id: 'gestion_ges',          label: 'Gestión GES',                     phase: 'titular_estricto' },
  { id: 'regulacion_ic',        label: 'Regulación IC',                   phase: 'titular_estricto' },

  // Críticos clínicos (un bloqueo semanal típico)
  { id: 'gestion_pscv',         label: 'Gestión PSCV',                    phase: 'critico_semanal' },
  { id: 'gestion_acv',          label: 'Gestión ACV',                     phase: 'critico_semanal' },
  { id: 'gestion_mq',           label: 'Gestión MQ',                      phase: 'critico_semanal' },
  { id: 'gestion_urgencias',    label: 'Gestión Urgencias',               phase: 'critico_semanal' },
  { id: 'chcc',                 label: 'CHCC',                            phase: 'critico_semanal' },

  // Programas con múltiples bloqueos (más flexibles, pero importantes)
  { id: 'gestion_iaas',         label: 'Gestión IAAS',                    phase: 'multi_semanal' },
  { id: 'gestion_proa',         label: 'Gestión PROA',                    phase: 'multi_semanal' },
  { id: 'visita_proa',          label: 'Visita PROA',                     phase: 'multi_semanal' },
  { id: 'ecicep',               label: 'ECICEP',                          phase: 'multi_semanal' },
  { id: 'telesalud',            label: 'Telesalud',                       phase: 'multi_semanal' },
  { id: 'gestion_tm',           label: 'Gestión Telemedicina',            phase: 'multi_semanal' },
  { id: 'gestion_policlinico',  label: 'Gestión Policlínico',             phase: 'multi_semanal' },

  // Reuniones (más flexibles, ceden ante todo lo anterior)
  { id: 'reunion_maternidad',   label: 'Reunión Maternidad',              phase: 'reunion' },
  { id: 'reunion_sala_era',     label: 'Reunión Sala ERA',                phase: 'reunion' },
  { id: 'reunion_equipo_mq',    label: 'Reunión Equipo MQ',               phase: 'reunion' },
  { id: 'comite_iaas',          label: 'Comité IAAS',                     phase: 'reunion' },
];

export const PHASE_LABELS = {
  jerarquico:        'Bloqueos jerárquicos (SDM, Tribunal, Selector)',
  titular_estricto:  'Titular estricto (paliativos, GES, reg. IC, dep. severa)',
  critico_semanal:   'Críticos semanales (PSCV/ACV/MQ/urgencias/CHCC)',
  multi_semanal:     'Programas con múltiples bloqueos semanales',
  reunion:           'Reuniones (más flexibles)',
  otro:              'Otros bloques',
};

// Fases fijas de la agenda (no se reordenan, son secuencia operativa).
export const FIXED_PHASES = [
  { id: 'turnos',         label: 'Turnos rotación',                       fixed: true },
  { id: 'posturno',       label: 'Posturno (turno del día previo)',       fixed: true },
  { id: 'ausencias',      label: 'Ausencias / licencias / feriados',      fixed: true },
  { id: 'jerarquico',     label: 'Bloqueos jerárquicos (SDM, etc.)',       fixed: true },
  { id: 'refuerzos',      label: 'Refuerzos AM/PM',                        fixed: false }, // posición editable
  { id: 'bloqueos',       label: 'Bloqueos / programas',                   fixed: false }, // posición editable
];

export function getBuildPriorityOrder() {
  if (typeof window === 'undefined') return DEFAULT_BLOCK_ORDER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BLOCK_ORDER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_BLOCK_ORDER;
    return parsed;
  } catch {
    return DEFAULT_BLOCK_ORDER;
  }
}

export function setBuildPriorityOrder(order) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch { /* noop */ }
}

export function resetBuildPriorityOrder() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

// Helper que devuelve el priority numérico (0..N) para un block_id según
// el orden configurado. Bloques desconocidos reciben un valor alto (999).
export function priorityFor(blockId, order = null) {
  const list = order || getBuildPriorityOrder();
  const idx = list.findIndex(it => it.id === blockId);
  return idx === -1 ? 999 : idx;
}
