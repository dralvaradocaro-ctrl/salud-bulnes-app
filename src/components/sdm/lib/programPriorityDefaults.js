export const PROTECTED_PRIORITY_BLOCK_IDS = new Set([
  'subdireccion_medica',
  'poli_taco',
  'selector_demanda',
]);

export const DEFAULT_PROGRAM_PRIORITIES = {
  regulacion_ic: [
    { doctor_id: 'enriquez', priority: 1 },
    { doctor_id: 'sandoval', priority: 1 },
    { doctor_id: 'sbarbaro', priority: 1 },
  ],
  cp_y_ad: [
    { doctor_id: 'santibanez', priority: 1 },
  ],
  ecicep: [
    { doctor_id: 'ruf', priority: 1 },
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
