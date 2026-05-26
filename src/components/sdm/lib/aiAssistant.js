/**
 * Asistente IA para sugerencias de corrección en agenda SDM.
 * Usa invokeLLM (Groq llama-3.3-70b-versatile) vía src/lib/gemini.js.
 *
 * Para un error/warning del validator + el estado del día, pide a la IA
 * 2-3 opciones razonadas de corrección, cada una con acción concreta
 * (assign/swap/suspend), reasoning humano y side_effects.
 */
import { invokeLLM } from '@/lib/gemini';

const ABSENCE_LABELS = {
  FL: 'Feriado Legal', P: 'Postnatal', A: 'Administrativo', DT: 'Devolución Tiempo',
  LM: 'Licencia Médica', CAP: 'Capacitación', PAS: 'Pasantía', G: 'Gerencia/Gestión', OTRO: 'Otro',
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['assign', 'swap', 'suspend', 'add'] },
          doctor_id: { type: 'string', nullable: true },
          swap_with_day: { type: 'string', nullable: true },
          reasoning: { type: 'string' },
          side_effects: { type: 'string', nullable: true },
        },
        required: ['action', 'reasoning'],
      },
    },
  },
};

/**
 * @param error  - objeto del validator: { kind, date, label, blockId, doctorId, message }
 * @param agenda - array completo de días de la semana (cada uno con turnos/posturno/ausencias/bloqueos/etc.)
 * @param doctors - catálogo completo de sdm_doctors
 * @returns { options: [{ action, doctor_id?, swap_with_day?, reasoning, side_effects? }] }
 */
export async function suggestFixForError(error, agenda, doctors, blockTemplates = [], programAssignments = []) {
  const docName = id => doctors.find(d => d.id === id)?.display_name || id;
  const day = agenda.find(d => d.date === error.date);
  const template = blockTemplates.find(bt => bt.id === error.blockId);

  // Para sugerencias de reubicación: necesitamos saber, para el bloque en
  // cuestión, quién es el titular y los subrogantes en orden de prioridad,
  // y en cada día de la semana cuál de ellos está disponible.
  function buildPrincipalAvailability(blockId) {
    if (!blockId) return null;
    const titular = programAssignments.find(p => p.block_template_id === blockId && p.role_type === 'titular')?.doctor_id || null;
    const subrogantes = programAssignments
      .filter(p => p.block_template_id === blockId && p.role_type === 'subrogante')
      .sort((a, b) => (a.priority || 1) - (b.priority || 1))
      .map(p => ({ id: p.doctor_id, priority: p.priority || 1 }));
    const principales = [
      ...(titular ? [{ id: titular, rol: 'titular' }] : []),
      ...subrogantes.map(s => ({ id: s.id, rol: `subrogante p${s.priority}` })),
    ];
    if (!principales.length) return null;
    const disponibilidadPorDia = agenda.map(d => {
      const turnoIds = new Set(d.turnos.map(t => t.doctor_id));
      const postIds = new Set(d.posturno.map(t => t.doctor_id));
      const ausIds = new Set(d.ausencias.map(a => a.doctor_id));
      const isHoliday = !!d.is_holiday;
      const lib = principales
        .filter(p => !turnoIds.has(p.id) && !postIds.has(p.id) && !ausIds.has(p.id))
        .map(p => ({ id: p.id, nombre: docName(p.id), rol: p.rol }));
      return {
        fecha: d.date,
        dia: d.label,
        feriado: isHoliday,
        principales_disponibles: lib,
        titular_disponible: lib.some(p => p.rol === 'titular'),
      };
    });
    return {
      titular: titular ? { id: titular, nombre: docName(titular) } : null,
      subrogantes_orden: subrogantes.map(s => ({ id: s.id, nombre: docName(s.id), priority: s.priority })),
      disponibilidad_por_dia: disponibilidadPorDia,
    };
  }
  const principalAvailability = buildPrincipalAvailability(error.blockId);
  const isWeeklyCountIssue = ['weekly_count_short', 'weekly_count_short_unrelocatable'].includes(error.kind);

  if (!day && isWeeklyCountIssue) {
    const availableDays = agenda
      .filter(d => !d.is_holiday)
      .map(d => ({
        fecha: d.date,
        dia: d.label,
        ya_tiene_bloque: d.bloqueos.some(b => !b.suspended && b.block_id === error.blockId),
        bloqueos_activos: d.bloqueos
          .filter(b => !b.suspended)
          .map(b => ({
            nombre: b.name,
            desde: b.from,
            hasta: b.to,
            medico: (Array.isArray(b.doctor_ids) && b.doctor_ids.length
              ? b.doctor_ids.map(docName).join(' + ')
              : (b.doctor_id ? docName(b.doctor_id) : 'SIN ASIGNAR')),
          })),
        ausencias: d.ausencias.map(a => `${docName(a.doctor_id)} (${ABSENCE_LABELS[a.type] || a.type})`),
      }));

    const prompt = `Sos un asistente experto en agendas médicas hospitalarias. El validador detectó un déficit semanal:

ALERTA: ${error.message}
TIPO: ${error.kind}
BLOQUE FALTANTE: ${template?.name || error.blockId}
HORARIOS ESPERADOS DEL TEMPLATE:
${JSON.stringify(template?.weekday_pattern || template?.monthly_rule || {}, null, 2)}

DÍAS DISPONIBLES DE ESTA SEMANA:
${JSON.stringify(availableDays, null, 2)}

${principalAvailability ? `TITULAR Y SUBROGANTES DEL BLOQUEO (orden de preferencia para asignación):
${JSON.stringify(principalAvailability, null, 2)}

` : ''}REGLAS (orden estricto de prioridad):
1) COMPLETAR LA DISTRIBUCIÓN SEMANAL es obligatorio salvo imposibilidad técnica. Si la semana exige más instancias, hay que agregarlas — no se acepta déficit mientras haya un día hábil viable.
2) EVITAR SUPERPOSICIONES con el titular: preferir el día donde el TITULAR del bloqueo esté disponible (campo "titular_disponible: true" en "disponibilidad_por_dia"); ese día es la solución correcta aunque el template original sugiera otro.
3) Si el titular no está disponible en ningún día razonable, recién entonces caer al subrogante con menor priority disponible — manteniendo el día del template si el bloqueo es inamovible (horario fijo institucional).
4) Proponé agregar el bloqueo faltante en un día no feriado.
5) Preferí un día donde todavía no exista ese mismo bloqueo.
6) Si hay muchos bloqueos activos ese día y existe otro día con menos carga donde el titular esté libre, elegir ese otro día.
7) Si ningún principal está disponible en ningún día, dejar doctor_id en null y explicar por qué en reasoning.
- La acción debe ser "add".
- Usá swap_with_day para indicar la fecha destino YYYY-MM-DD.

Devuelve un JSON con esta forma EXACTA:
{
  "options": [
    {
      "action": "add",
      "doctor_id": "<id del médico o null>",
      "swap_with_day": "<YYYY-MM-DD>",
      "reasoning": "<explicación humana, 1-2 oraciones>",
      "side_effects": "<consecuencias o null>"
    }
  ]
}

Devuelve 2 o 3 opciones, ordenadas de mejor a peor.`;

    const result = await invokeLLM({ prompt, response_json_schema: RESPONSE_SCHEMA });
    return result;
  }

  if (!day) throw new Error(`Día ${error.date} no encontrado en la agenda`);

  const block = day.bloqueos.find(b => b.block_id === error.blockId);
  if (!block && error.kind !== 'missing_am' && error.kind !== 'missing_pm') {
    throw new Error(`Bloqueo ${error.blockId} no encontrado en ${error.date}`);
  }

  // Resumen del día
  const dayCtx = {
    fecha: day.date,
    dia_semana: day.label,
    turno: day.turnos.map(t => docName(t.doctor_id)),
    posturno: day.posturno.map(t => docName(t.doctor_id)),
    ausencias: day.ausencias.map(a => `${docName(a.doctor_id)} (${ABSENCE_LABELS[a.type] || a.type})`),
    refuerzo_am: day.refuerzos.am ? docName(day.refuerzos.am) : null,
    refuerzo_pm: day.refuerzos.pm ? docName(day.refuerzos.pm) : null,
    poli_full_day: day.poli_8am?.full_day ? docName(day.poli_8am.full_day.doctor_id) : null,
    bloqueos_activos: day.bloqueos
      .filter(b => !b.suspended)
      .map(b => ({
        nombre: b.name, desde: b.from, hasta: b.to,
        medico: (Array.isArray(b.doctor_ids) && b.doctor_ids.length
          ? b.doctor_ids.map(docName).join(' + ')
          : (b.doctor_id ? docName(b.doctor_id) : 'SIN ASIGNAR')),
        auto_asignado: !!b.auto_assigned,
      })),
  };

  // Carga semanal por médico (cuántos bloqueos activos tiene cada uno en la semana)
  const cargaSemanal = {};
  agenda.forEach(d => {
    d.bloqueos.filter(b => !b.suspended).forEach(b => {
      const ids = Array.isArray(b.doctor_ids) && b.doctor_ids.length
        ? b.doctor_ids
        : (b.doctor_id ? [b.doctor_id] : []);
      ids.forEach(id => { cargaSemanal[id] = (cargaSemanal[id] || 0) + 1; });
    });
  });

  // Pool de médicos disponibles HOY (no turno/posturno/ausencia/poli)
  const ocupadosHoy = new Set([
    ...day.turnos.map(t => t.doctor_id),
    ...day.posturno.map(t => t.doctor_id),
    ...day.ausencias.map(a => a.doctor_id),
    day.poli_8am?.full_day?.doctor_id,
  ].filter(Boolean));
  const disponiblesHoy = doctors
    .filter(d => d.active !== false && !d.is_urgentologist && !ocupadosHoy.has(d.id))
    .map(d => ({
      id: d.id,
      nombre: d.display_name,
      carga_semanal: cargaSemanal[d.id] || 0,
      bloqueos_hoy: day.bloqueos.filter(b => {
        if (b.suspended) return false;
        const ids = Array.isArray(b.doctor_ids) && b.doctor_ids.length
          ? b.doctor_ids
          : (b.doctor_id ? [b.doctor_id] : []);
        return ids.includes(d.id);
      }).map(b => `${b.from}-${b.to} ${b.name}`),
    }));

  // Para opción "swap": resumen breve por día de la semana
  const semana = agenda.map(d => ({
    fecha: d.date,
    dia: d.label,
    ausentes: d.ausencias.length,
    bloqueos_activos: d.bloqueos.filter(b => !b.suspended).length,
    sin_asignar: d.bloqueos.filter(b => !b.suspended && b.unassigned).length,
  }));

  const prompt = `Sos un asistente experto en agendas médicas hospitalarias. El validador detectó este problema en la agenda semanal del Hospital Comunitario de Bulnes:

ERROR: ${error.message}
TIPO: ${error.kind}
${block ? `BLOQUEO PROBLEMÁTICO: "${block.name}" (${block.from || '?'}-${block.to || '?'}), médico actual: ${(() => {
  const ids = Array.isArray(block.doctor_ids) && block.doctor_ids.length
    ? block.doctor_ids
    : (block.doctor_id ? [block.doctor_id] : []);
  return ids.length ? ids.map(docName).join(' + ') : 'SIN ASIGNAR';
})()}` : ''}

ESTADO DEL DÍA ${day.label} (${day.date}):
${JSON.stringify(dayCtx, null, 2)}

MÉDICOS DISPONIBLES HOY (con carga semanal):
${JSON.stringify(disponiblesHoy, null, 2)}

RESUMEN DE LA SEMANA:
${JSON.stringify(semana, null, 2)}

${principalAvailability ? `TITULAR Y SUBROGANTES DEL BLOQUEO (orden de preferencia):
${JSON.stringify(principalAvailability, null, 2)}

` : ''}REGLAS (orden estricto de prioridad):
1) EVITAR SUPERPOSICIÓN es preferible a cambiar al titular. Si el conflicto es porque el TITULAR está ocupado este día y otro día de la semana SÍ está libre, la acción correcta es "swap" hacia ese día con el titular — NO "assign" a otra persona el día del conflicto.
2) Sólo si el bloqueo es inamovible (horario fijo institucional, reunión con calendario propio) o ningún día alterno tiene al titular libre, se acepta dejarlo el día original y "assign" a otra persona.
3) COMPLETAR LA DISTRIBUCIÓN SEMANAL: no "suspend" mientras quede un día hábil viable. Sólo suspender cuando ningún día razonable lo permita.
4) Un médico no puede estar en turno/posturno/ausencia y simultáneamente en un bloqueo, CON UNA EXCEPCIÓN: si el bloqueo es "subdireccion_medica" y el conflicto es con TURNO (urgencias) — no posturno ni ausencia — y el médico es uno de los titulares SDM (Alvarado/Cordero/Fasani), entonces SE PUEDE dejar al titular en SDM y reasignar su turno a otro médico libre y habilitado para urgencias. SDM tiene prioridad sobre el turno de urgencias en ese escenario.
5) Quien hace "poli_full_day" cubre policlínico 08:00–17:00 y NO puede tomar bloqueos.
6) Urgenciólogos solo participan en VISITA con cupos fijos, no en bloqueos.
7) Preferir médicos con menor carga semanal para balancear.
- PRIORIDAD AL REUBICAR ("swap"): elegir el día donde el TITULAR esté disponible (campo "titular_disponible: true" en "disponibilidad_por_dia"). Si no, el día donde haya algún subrogante de menor priority disponible. Si en ningún día hay titular ni subrogantes disponibles, mencionar esto en "side_effects" y proponer fallback a otro médico con baja carga.
- OBLIGATORIO: una opción "swap" SIEMPRE debe traer doctor_id NO NULO — el id del médico que hará el bloqueo en el día destino. Tomar el id del array "principales_disponibles" del día propuesto (campo "id"). Si ningún principal está disponible, elegir un médico de la lista "MÉDICOS DISPONIBLES HOY" del día destino con menor carga.
- PRIORIDAD AL ASIGNAR ("assign") en el mismo día: priorizar titular si está disponible; si no, subrogantes en orden de priority; recién después caer a cualquier médico libre con baja carga.
- "suspend" SOLO si no hay otra opción viable (último recurso).

Devuelve un JSON con esta forma EXACTA:
{
  "options": [
    {
      "action": "assign" | "swap" | "suspend",
      "doctor_id": "<id del médico si action=assign, sino null>",
      "swap_with_day": "<YYYY-MM-DD si action=swap, sino null>",
      "reasoning": "<explicación humana, 1-2 oraciones>",
      "side_effects": "<consecuencias o null>"
    }
  ]
}

Devuelve 2 o 3 opciones, ordenadas de mejor a peor. Si no hay solución razonable, devuelve una sola opción con action="suspend" explicando por qué.`;

  const result = await invokeLLM({ prompt, response_json_schema: RESPONSE_SCHEMA });
  return result;
}
