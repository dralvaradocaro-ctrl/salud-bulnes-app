// Bloques cuyas asignaciones se manejan FUERA del priority pool del default
// (vía assignments explícitos en sdm_program_assignments o titular único).
//
// Nota: `selector_demanda` SE QUITÓ de aquí (antes estaba) porque queremos que
// rote entre el pool de 6 médicos definido abajo. Manteniéndolo en este set
// hacía que el algoritmo lo asignara siempre al primer titular disponible
// (Cordero, por ser primero alfabéticamente disponible), sin rotación.
export const PROTECTED_PRIORITY_BLOCK_IDS = new Set([
  'subdireccion_medica',
  'poli_taco',
]);

// Bloqueos donde el TITULAR tiene prioridad absoluta y se respeta estrictamente
// la priority (paliativos a Santibañez, gestion_ges a R. Aguilera, regulacion
// de IC a Enriquez/Sandoval/Sbarbaro/Correa). Estos no ceden ante overlap.
export const STRICT_TITULAR_BLOCKS = new Set([
  'cp_y_ad',
  'dependencia_severa',
  'gestion_dep_severa',
  'gestion_ges',
  'regulacion_ic',
]);

// Bloqueos flexibles: si el candidato preferido ya está en otra cosa al mismo
// horario, se prueba el siguiente del pool. La motivación: ECICEP, Gestión TM
// y Telesalud pueden moverse y los hace cualquiera del pool capacitado.
export const FLEXIBLE_BLOCKS = new Set([
  'ecicep',
  'gestion_tm',
  'telesalud',
]);

export const DEFAULT_PROGRAM_PRIORITIES = {
  // Selector de Demanda: rota entre el pool fijo en orden semanal.
  // El propósito es que ningún médico cargue Selector más de 1 vez por
  // semana (idealmente), y que la rotación cubra a 6 personas distintas.
  selector_demanda: [
    { doctor_id: 'alvarado',   priority: 1 },
    { doctor_id: 'r_aguilera', priority: 1 },
    { doctor_id: 'cordero',    priority: 1 },
    { doctor_id: 'fasani',     priority: 1 },
    { doctor_id: 'santibanez', priority: 1 },
    { doctor_id: 'ruf',        priority: 1 },
  ],
  regulacion_ic: [
    { doctor_id: 'enriquez', priority: 1 },
    { doctor_id: 'sandoval', priority: 1 },
    { doctor_id: 'sbarbaro', priority: 1 },
    { doctor_id: 'correa', priority: 2 },
  ],
  cp_y_ad: [
    { doctor_id: 'santibanez', priority: 1 },
  ],
  // ECICEP es un bloque flexible: cualquiera del pool puede hacerlo.
  // Ruf queda como titular pero se cede ante superposición horaria.
  ecicep: [
    { doctor_id: 'ruf', priority: 1 },
    { doctor_id: 'sandoval', priority: 2 },
    { doctor_id: 'alvarado', priority: 2 },
    { doctor_id: 'v_aguilera', priority: 2 },
    { doctor_id: 'sbarbaro', priority: 2 },
    { doctor_id: 'correa', priority: 2 },
    { doctor_id: 'gil', priority: 2 },
    { doctor_id: 'r_aguilera', priority: 2 },
    { doctor_id: 'san_martin', priority: 2 },
    { doctor_id: 'santibanez', priority: 2 },
    { doctor_id: 'cordero', priority: 2 },
  ],
  gestion_ges: [
    { doctor_id: 'r_aguilera', priority: 1 },
    { doctor_id: 'sbarbaro', priority: 1 },
    { doctor_id: 'correa', priority: 2 },
    { doctor_id: 'v_aguilera', priority: 3 },
  ],
  gestion_pscv: [
    { doctor_id: 'alvarado', priority: 1 },
    { doctor_id: 'ruf', priority: 2 },
  ],
  gestion_acv: [
    { doctor_id: 'alvarado', priority: 1 },
    { doctor_id: 'ruf', priority: 2 },
  ],
  gestion_mq: [
    { doctor_id: 'san_martin', priority: 1 },
    { doctor_id: 'ruf', priority: 2 },
    { doctor_id: 'v_aguilera', priority: 3 },
  ],
  gestion_urgencias: [
    { doctor_id: 'sandoval', priority: 1 },
    { doctor_id: 'cordero', priority: 1 },
  ],
  gestion_iaas: [
    { doctor_id: 'sbarbaro', priority: 1 },
    { doctor_id: 'alvarado', priority: 2 },
    { doctor_id: 'correa', priority: 2 },
  ],
  gestion_proa: [
    { doctor_id: 'sbarbaro', priority: 1 },
    { doctor_id: 'alvarado', priority: 2 },
    { doctor_id: 'correa', priority: 2 },
    { doctor_id: 'carreno', priority: 2 },
  ],
  visita_proa: [
    { doctor_id: 'sbarbaro', priority: 1 },
    { doctor_id: 'alvarado', priority: 2 },
    { doctor_id: 'correa', priority: 3 },
    { doctor_id: 'carreno', priority: 3 },
  ],
  dependencia_severa: [
    { doctor_id: 'santibanez', priority: 1 },
  ],
  gestion_dep_severa: [
    { doctor_id: 'santibanez', priority: 1 },
  ],
  chcc: [
    { doctor_id: 'cordero', priority: 1 },
    { doctor_id: 'v_aguilera', priority: 1 },
  ],
  telesalud: [
    { doctor_id: 'sandoval', priority: 1 },
    { doctor_id: 'r_aguilera', priority: 2 },
    { doctor_id: 'alvarado', priority: 2 },
    { doctor_id: 'ruf', priority: 2 },
  ],
  gestion_tm: [
    { doctor_id: 'sandoval', priority: 1 },
    { doctor_id: 'r_aguilera', priority: 1 },
    { doctor_id: 'ruf', priority: 2 },
    { doctor_id: 'correa', priority: 3 },
  ],
  gestion_policlinico: [
    { doctor_id: 'beltran', priority: 1 },
    { doctor_id: 'correa', priority: 2 },
    { doctor_id: 'ruf', priority: 2 },
  ],
  reunion_maternidad: [
    { doctor_id: 'carreno', priority: 1 },
    { doctor_id: 'cordero', priority: 2 },
    { doctor_id: 'correa', priority: 3 },
    { doctor_id: 'gil', priority: 3 },
  ],
  reunion_sala_era: [
    { doctor_id: 'san_martin', priority: 1 },
    { doctor_id: 'correa', priority: 2 },
    { doctor_id: 'rivas', priority: 2 },
  ],
  reunion_equipo_mq: [
    { doctor_id: 'san_martin', priority: 1 },
    { doctor_id: 'alvarado', priority: 2 },
    { doctor_id: 'v_aguilera', priority: 3 },
  ],
  comite_iaas: [
    { doctor_id: 'sbarbaro', priority: 1 },
  ],
};

export function defaultAssignmentsForBlock(blockId) {
  const defaults = DEFAULT_PROGRAM_PRIORITIES[blockId] || [];
  return defaults.map((item, index) => ({
    block_template_id: blockId,
    doctor_id: item.doctor_id,
    role_type: index === 0 ? 'titular' : 'subrogante',
    priority: item.priority,
    source: 'plantilla',
  }));
}

export function buildEffectiveProgramAssignments(assignments = [], blockTemplates = []) {
  const explicitBlocks = new Set(assignments.map(a => a.block_template_id));
  const effective = [...assignments];
  blockTemplates.forEach(block => {
    if (!block?.id || explicitBlocks.has(block.id) || PROTECTED_PRIORITY_BLOCK_IDS.has(block.id)) return;
    effective.push(...defaultAssignmentsForBlock(block.id));
  });
  return effective;
}
