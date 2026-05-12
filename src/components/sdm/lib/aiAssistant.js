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
export async function suggestFixForError(error, agenda, doctors, blockTemplates = []) {
  const docName = id => doctors.find(d => d.id === id)?.display_name || id;
  const day = agenda.find(d => d.date === error.date);
  const template = blockTemplates.find(bt => bt.id === error.blockId);
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
            medico: b.doctor_id ? docName(b.doctor_id) : 'SIN ASIGNAR',
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

REGLAS:
- Proponé agregar el bloqueo faltante en un día no feriado.
- Preferí un día donde todavía no exista ese mismo bloqueo.
- Si el template tiene horario para ese día, usar ese día es mejor.
- Si hay muchos bloqueos activos ese día, preferí otro día con menos carga.
- La acción debe ser "add".
- Usá swap_with_day para indicar la fecha destino YYYY-MM-DD.
- doctor_id puede ser null si conviene dejarlo para asignación manual.

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
        medico: b.doctor_id ? docName(b.doctor_id) : 'SIN ASIGNAR',
        auto_asignado: !!b.auto_assigned,
      })),
  };

  // Carga semanal por médico (cuántos bloqueos activos tiene cada uno en la semana)
  const cargaSemanal = {};
  agenda.forEach(d => {
    d.bloqueos.filter(b => !b.suspended && b.doctor_id).forEach(b => {
      cargaSemanal[b.doctor_id] = (cargaSemanal[b.doctor_id] || 0) + 1;
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
      bloqueos_hoy: day.bloqueos.filter(b => !b.suspended && b.doctor_id === d.id).map(b => `${b.from}-${b.to} ${b.name}`),
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
${block ? `BLOQUEO PROBLEMÁTICO: "${block.name}" (${block.from || '?'}-${block.to || '?'}), médico actual: ${block.doctor_id ? docName(block.doctor_id) : 'SIN ASIGNAR'}` : ''}

ESTADO DEL DÍA ${day.label} (${day.date}):
${JSON.stringify(dayCtx, null, 2)}

MÉDICOS DISPONIBLES HOY (con carga semanal):
${JSON.stringify(disponiblesHoy, null, 2)}

RESUMEN DE LA SEMANA:
${JSON.stringify(semana, null, 2)}

REGLAS:
- Un médico no puede estar en turno/posturno/ausencia y simultáneamente en un bloqueo.
- Quien hace "poli_full_day" cubre policlínico 08:00–17:00 y NO puede tomar bloqueos.
- Urgenciólogos solo participan en VISITA con cupos fijos, no en bloqueos.
- Preferir médicos con menor carga semanal para balancear.
- "swap" mueve el bloqueo a OTRO día donde el titular original esté disponible.
- "suspend" difiere el bloqueo a próxima semana (no cubrirlo esta semana).

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
