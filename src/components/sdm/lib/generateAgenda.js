/**
 * Lógica pura de generación de agenda semanal SDM.
 * Toma catálogos + ausencias + bloqueos puntuales y devuelve la grilla 5×8.
 */

const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie'];
const DAY_LABELS = { lun: 'LUNES', mar: 'MARTES', mie: 'MIÉRCOLES', jue: 'JUEVES', vie: 'VIERNES' };

export function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dayKeyForDate(date) {
  const dow = new Date(date).getDay(); // 0 dom, 1 lun, ...
  return ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][dow];
}

export function fmtDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function weekDates(monday) {
  const m = new Date(monday);
  return DAYS.map((d, i) => {
    const x = new Date(m);
    x.setDate(m.getDate() + i);
    return { day: d, label: DAY_LABELS[d], date: fmtDate(x), iso: x };
  });
}

function getDoctorsForTurno(turnoNumber, rotation, replacements = []) {
  const turnoDocs = rotation.filter(r => r.turno_number === turnoNumber).map(r => r.doctor_id);
  return turnoDocs.map(docId => {
    const r = replacements.find(rep => rep.doctor_id === docId);
    return r ? { doctor_id: r.replaced_by, original_doctor_id: docId, replaced: true, reason: r.reason } : { doctor_id: docId };
  });
}

function isMonthlyMatch(date, rule) {
  if (!rule) return false;
  const d = new Date(date);
  const dayKey = dayKeyForDate(date);
  if (rule.weekday !== dayKey) return false;
  // semana del mes (1-5) calculada por fecha del mes
  const dayOfMonth = d.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);
  return weekOfMonth === rule.week_of_month;
}

export function generateAgenda({
  weekStart,
  doctors = [],
  rotation = [],
  shiftCalendar = [],          // [{date, turno_number, replacements}]
  blockTemplates = [],
  programAssignments = [],     // [{block_template_id, doctor_id, role_type}]
  absences = [],               // [{doctor_id, date, type, duration_hours}]
  oneoffBlocks = [],           // [{date, doctor_id, time_from, time_to, description, category}]
  manualReinforcements = {},   // { '2026-05-04': { am: 'doctor_id', pm: 'doctor_id' } }
  manualPoli8am = {},          // { '2026-05-04': 'doctor_id' } — override del médico full-day
}) {
  const days = weekDates(weekStart);
  const doctorById = Object.fromEntries(doctors.map(d => [d.id, d]));

  // Mapas auxiliares
  const calByDate = Object.fromEntries(shiftCalendar.map(c => [c.date, c]));
  const absencesByDate = absences.reduce((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});
  // Múltiples subrogantes ordenados por priority (cascada de fallback)
  const titularByBlock = {}, subrogantesByBlock = {};
  programAssignments.forEach(p => {
    if (p.role_type === 'titular') titularByBlock[p.block_template_id] = p.doctor_id;
    if (p.role_type === 'subrogante') {
      (subrogantesByBlock[p.block_template_id] = subrogantesByBlock[p.block_template_id] || [])
        .push({ doctor_id: p.doctor_id, priority: p.priority || 1 });
    }
  });
  // Ordenar subrogantes por priority
  Object.values(subrogantesByBlock).forEach(arr => arr.sort((a, b) => a.priority - b.priority));

  // ID del subdirector (regla operativa: puede acumular bloqueos)
  const SUBDIRECTOR_ID = 'alvarado';

  // Día calendario anterior al lunes (para posturno del lunes = turno del DOMINGO)
  const prevDayDate = new Date(days[0].iso);
  prevDayDate.setDate(prevDayDate.getDate() - 1); // domingo
  const prevDayKey = fmtDate(prevDayDate);

  return days.map((d, idx) => {
    const cal = calByDate[d.date];
    const turnoNumber = cal ? cal.turno_number : null;
    const turnos = turnoNumber != null
      ? getDoctorsForTurno(turnoNumber, rotation, cal.replacements || [])
      : [];

    // Posturno: turno del día anterior
    const prevDate = idx === 0 ? prevDayKey : days[idx - 1].date;
    const prevCal = calByDate[prevDate];
    const posturno = prevCal
      ? getDoctorsForTurno(prevCal.turno_number, rotation, prevCal.replacements || [])
      : [];

    const ausencias = (absencesByDate[d.date] || []).map(a => ({
      doctor_id: a.doctor_id,
      type: a.type,
      duration_hours: a.duration_hours,
    }));

    const refuerzos = manualReinforcements[d.date] || {};

    // Bloqueos del día: del template (weekday_pattern) + monthly que aplica + oneoff
    const bloqueos = [];
    const dayKey = dayKeyForDate(d.date);

    // Árbol de razonamiento: TURNOS → POSTURNO → AUSENCIAS → resto.
    // Resolver médico por bloque con cascada T → S₁ → S₂ → S₃ ...
    // Excluye médicos en turno, posturno o ausentes.
    const turnoIds_inner = new Set(turnos.map(t => t.doctor_id));
    const postIds_inner = new Set(posturno.map(t => t.doctor_id));
    const ausIds_inner = new Set((absencesByDate[d.date] || []).map(a => a.doctor_id));
    const resolveDoctor = (blockId) => {
      const t = titularByBlock[blockId];
      const subs = subrogantesByBlock[blockId] || [];
      const candidates = [t, ...subs.map(s => s.doctor_id)].filter(Boolean);
      // Primero intentar uno disponible (no en turno/posturno/ausencia)
      const available = candidates.find(id =>
        !ausIds_inner.has(id) && !turnoIds_inner.has(id) && !postIds_inner.has(id));
      // Si nadie disponible, devolver el primero (mejor que nada, marcará error)
      return available || candidates[0] || null;
    };

    for (const bt of blockTemplates) {
      // semanal regular
      const slots = bt.weekday_pattern?.[dayKey];
      if (slots && slots.length) {
        slots.forEach(slot => {
          const docId = resolveDoctor(bt.id);
          bloqueos.push({
            block_id: bt.id,
            name: bt.name,
            from: slot.from,
            to: slot.to,
            doctor_id: docId,
            unassigned: !docId,
            category: bt.category,
            source: 'template',
          });
        });
      }
      // mensual
      if (bt.is_monthly && isMonthlyMatch(d.date, bt.monthly_rule)) {
        const docId = resolveDoctor(bt.id);
        bloqueos.push({
          block_id: bt.id,
          name: bt.name,
          from: bt.monthly_rule?.from || null,
          to: bt.monthly_rule?.to || null,
          doctor_id: docId,
          unassigned: !docId,
          category: bt.category,
          source: 'monthly',
        });
      }
    }
    // oneoff
    oneoffBlocks
      .filter(o => o.date === d.date)
      .forEach(o => bloqueos.push({
        block_id: `oneoff-${o.id}`,
        name: o.description,
        from: o.time_from,
        to: o.time_to,
        doctor_id: o.doctor_id,
        unassigned: !o.doctor_id,
        category: o.category,
        source: 'oneoff',
      }));

    // VISITA: médicos disponibles para visita matinal MQ
    // Excluir: turno, postturno, ausencias, refuerzos
    const turnoIds = new Set(turnos.map(t => t.doctor_id));
    const postIds = new Set(posturno.map(t => t.doctor_id));
    const ausIds = new Set(ausencias.map(a => a.doctor_id));
    const refIds = new Set([refuerzos.am, refuerzos.pm].filter(Boolean));
    const visita = doctors
      .filter(doc => doc.active !== false)
      .filter(doc => !turnoIds.has(doc.id) && !postIds.has(doc.id) && !ausIds.has(doc.id) && !refIds.has(doc.id))
      .filter(doc => {
        // Excluir si está asignado a bloqueo en horario matinal (08:00–13:00)
        const hasMorningBlock = bloqueos.some(b =>
          b.doctor_id === doc.id && b.from && b.from < '13:00'
        );
        return !hasMorningBlock;
      })
      .map(doc => ({ doctor_id: doc.id }));

    // Policlínico full-day: override manual > BELTRÁN si está disponible > null (editable)
    const POLI_FULLDAY_DEFAULT = 'beltran';
    const beltranAusente = ausIds.has(POLI_FULLDAY_DEFAULT) || postIds.has(POLI_FULLDAY_DEFAULT) || turnoIds.has(POLI_FULLDAY_DEFAULT);
    const poliFullDayOverride = manualPoli8am[d.date];
    const poliFullDay = poliFullDayOverride || (beltranAusente ? null : POLI_FULLDAY_DEFAULT);
    const poliFullDayEditable = beltranAusente && !poliFullDayOverride;

    // Refuerzo PM: lun-jue 11-13, viernes 12-13 (jornada acortada)
    const isViernes = d.day === 'vie';
    const refPmFrom = isViernes ? '12:00' : '11:00';
    const refPmTo   = '13:00';

    return {
      day: d.day,
      label: d.label,
      date: d.date,
      turnoNumber,
      turnos,
      refuerzos: {
        am: refuerzos.am || null,
        pm: refuerzos.pm || null,
      },
      posturno,
      ausencias,
      bloqueos,
      visita,
      // POLICLÍNICO column: refuerzo AM hace policlínico AM 8-10
      policlinico: refuerzos.am
        ? { doctor_id: refuerzos.am, from: '08:00', to: '10:00', label: 'Poli AM' }
        : null,
      // POLI 8 AM column: médico full-day (default BELTRÁN) + refuerzo PM
      poli_8am: {
        full_day: poliFullDay
          ? { doctor_id: poliFullDay, from: '08:00', to: isViernes ? '16:00' : '17:00', label: 'Full día', isOverride: !!poliFullDayOverride, isDefault: poliFullDay === POLI_FULLDAY_DEFAULT }
          : null,
        full_day_editable: poliFullDayEditable,
        ref_pm: refuerzos.pm
          ? { doctor_id: refuerzos.pm, from: refPmFrom, to: refPmTo, label: 'Ref PM' }
          : null,
      },
      jornada_fin: isViernes ? '16:00' : '17:00',
    };
  });
}

const SUBDIRECTOR_ID = 'alvarado';
const JORNADA_INICIO = '08:00';
const JORNADA_FIN = '17:00';

/**
 * Bloques JERÁRQUICOS: el rol no se puede ceder. El médico asignado queda
 * EXCLUIDO del pool de refuerzos del día. (Subdirección, asistencia a tribunales)
 */
export const HIERARCHICAL_BLOCK_IDS = new Set([
  'subdireccion_medica',
  'citacion_tribunales',
]);

/**
 * Devuelve, para un médico en un día dado, su compromiso nominal (si existe):
 *   { hasNominal, hierarchical, blockId, blockName, blockIndex }
 * Si tiene varios bloques, devuelve el primero (basta para el filtro).
 */
export function getNominalCommitment(doctorId, dayBloqueos = []) {
  for (let i = 0; i < dayBloqueos.length; i++) {
    const b = dayBloqueos[i];
    if (b.doctor_id !== doctorId) continue;
    return {
      hasNominal: true,
      hierarchical: HIERARCHICAL_BLOCK_IDS.has(b.block_id),
      blockId: b.block_id,
      blockName: b.name,
      blockIndex: i,
    };
  }
  return { hasNominal: false, hierarchical: false };
}

/**
 * Resuelve el primer subrogante DISPONIBLE para reemplazar a `excludeDoctorId`
 * en un bloque, considerando turno/posturno/ausencia del día.
 */
export function findReplacementForBlock({ blockId, excludeDoctorId, day, programAssignments }) {
  const titular = programAssignments.find(p => p.block_template_id === blockId && p.role_type === 'titular')?.doctor_id;
  const subs = programAssignments
    .filter(p => p.block_template_id === blockId && p.role_type === 'subrogante')
    .sort((a, b) => (a.priority || 1) - (b.priority || 1))
    .map(p => p.doctor_id);
  const turnoIds = new Set(day.turnos.map(t => t.doctor_id));
  const postIds = new Set(day.posturno.map(t => t.doctor_id));
  const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
  const candidates = [titular, ...subs].filter(Boolean);
  return candidates.find(id =>
    id !== excludeDoctorId &&
    !turnoIds.has(id) && !postIds.has(id) && !ausIds.has(id)
  ) || null;
}

/**
 * Calcula varianza simple de un array (para medir homogeneidad de carga).
 */
function variance(arr) {
  if (arr.length === 0) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
}

/**
 * Equilibra la carga de bloqueos entre días: mueve bloques de días sobrecargados
 * a días con menos carga, respetando weekday_pattern del template (si está
 * presente) y sin pisar turno/posturno/ausencia. Bloques mensuales y oneoff
 * NO se mueven. Retorna { agenda, moves }.
 */
export function balanceLoad({ agenda, blockTemplates }) {
  const tplById = Object.fromEntries(blockTemplates.map(t => [t.id, t]));
  const newAgenda = agenda.map(d => ({ ...d, bloqueos: d.bloqueos.slice() }));
  const moves = [];

  const isFree = (day, doctorId, fromTime, toTime) => {
    const turnoIds = new Set(day.turnos.map(t => t.doctor_id));
    const postIds = new Set(day.posturno.map(t => t.doctor_id));
    const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
    if (turnoIds.has(doctorId) || postIds.has(doctorId) || ausIds.has(doctorId)) return false;
    if (doctorId === SUBDIRECTOR_ID) return true;
    return !day.bloqueos.some(b => b.doctor_id === doctorId &&
      b.from && b.to && b.from < toTime && fromTime < b.to);
  };

  // Hasta N pasadas o hasta que no haya mejora.
  for (let pass = 0; pass < 10; pass++) {
    const counts = newAgenda.map(d => d.bloqueos.length);
    const v0 = variance(counts);
    if (v0 < 0.5) break;

    // Ordenar días de mayor a menor carga
    const idxByLoad = newAgenda.map((_, i) => i).sort((a, b) => counts[b] - counts[a]);
    const heavy = idxByLoad[0];
    const light = idxByLoad[idxByLoad.length - 1];
    if (counts[heavy] - counts[light] <= 1) break;

    // Buscar un bloque movible en heavy → light
    const heavyDay = newAgenda[heavy];
    const lightDay = newAgenda[light];
    let moved = false;
    for (let i = 0; i < heavyDay.bloqueos.length; i++) {
      const blk = heavyDay.bloqueos[i];
      const tpl = tplById[blk.block_id];
      // No mover: monthly, oneoff, jerárquico, sin horario, o template con weekday_pattern fijo distinto al destino
      if (!tpl || tpl.is_monthly || blk.source === 'oneoff' || blk.source === 'monthly') continue;
      if (HIERARCHICAL_BLOCK_IDS.has(blk.block_id)) continue;
      if (!blk.from || !blk.to) continue;
      // Si el template tiene slot fijo en el día destino, OK; si NO lo tiene, igual permitimos
      // mover (es flexibilidad operativa). Mantener simple.
      if (!isFree(lightDay, blk.doctor_id, blk.from, blk.to)) continue;
      // Probar que mejore varianza
      const c2 = counts.slice();
      c2[heavy]--; c2[light]++;
      if (variance(c2) >= v0) continue;
      // Mover
      lightDay.bloqueos.push({ ...blk, source: 'balanced' });
      heavyDay.bloqueos.splice(i, 1);
      moves.push({ from: heavyDay.date, to: lightDay.date, block: blk.name, doctor: blk.doctor_id });
      moved = true;
      break;
    }
    if (!moved) break;
  }
  return { agenda: newAgenda, moves };
}

/**
 * Para cada bloque cuyo médico asignado preliminar NO es el titular original,
 * intenta moverlo a otro día de la semana donde el titular SÍ esté disponible.
 * Devuelve nuevo array de agenda + lista de moves aplicados.
 *
 * No mueve bloques mensuales (se respeta su día específico) ni bloques
 * que ya están con titular asignado.
 *
 * Ejemplo: Alvarado titular de Gestión PSCV (miércoles habitual). Si miércoles
 * está en posturno → se intenta mover a lunes/martes/jueves/viernes donde
 * Alvarado esté libre.
 */
export function optimizeForTitulars({ agenda, blockTemplates, programAssignments }) {
  const titularByBlock = {};
  programAssignments.filter(p => p.role_type === 'titular')
    .forEach(p => titularByBlock[p.block_template_id] = p.doctor_id);
  const tplById = Object.fromEntries(blockTemplates.map(t => [t.id, t]));

  // Clone agenda
  const newAgenda = agenda.map(d => ({ ...d, bloqueos: d.bloqueos.slice() }));
  const moves = [];

  // Función: ¿está el médico libre en este día? (no en turno/posturno/ausencia y sin bloqueo solapado)
  const isFree = (day, doctorId, fromTime, toTime) => {
    const turnoIds = new Set(day.turnos.map(t => t.doctor_id));
    const postIds = new Set(day.posturno.map(t => t.doctor_id));
    const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
    if (turnoIds.has(doctorId) || postIds.has(doctorId) || ausIds.has(doctorId)) return false;
    // No tiene otro bloqueo en el mismo horario (excepto subdirector)
    if (doctorId === 'alvarado') return true; // subdirector exento
    return !day.bloqueos.some(b => b.doctor_id === doctorId &&
      b.from && b.to && b.from < toTime && fromTime < b.to);
  };

  for (let dayIdx = 0; dayIdx < newAgenda.length; dayIdx++) {
    const day = newAgenda[dayIdx];
    for (let blkIdx = 0; blkIdx < day.bloqueos.length; blkIdx++) {
      const blk = day.bloqueos[blkIdx];
      const titular = titularByBlock[blk.block_id];
      const tpl = tplById[blk.block_id];
      // Skip: sin titular conocido, ya asignado al titular, mensual, o sin horario
      if (!titular || blk.doctor_id === titular || tpl?.is_monthly || !blk.from || !blk.to) continue;
      // ¿El titular está disponible este día mismo? Sí → reasignar acá
      if (isFree(day, titular, blk.from, blk.to)) {
        moves.push({ from: day.date, to: day.date, block: blk.name, doctor: titular });
        day.bloqueos[blkIdx] = { ...blk, doctor_id: titular, unassigned: false };
        continue;
      }
      // Buscar otro día donde el titular esté libre
      const otherDay = newAgenda.find((d, i) => i !== dayIdx && isFree(d, titular, blk.from, blk.to));
      if (otherDay) {
        moves.push({ from: day.date, to: otherDay.date, block: blk.name, doctor: titular });
        // Mover el bloque
        otherDay.bloqueos.push({ ...blk, doctor_id: titular, unassigned: false, source: 'optimized' });
        day.bloqueos.splice(blkIdx, 1);
        blkIdx--;
      }
    }
  }
  return { agenda: newAgenda, moves };
}

/**
 * Sortea refuerzos AM y PM equilibrando carga entre médicos elegibles
 * para una secuencia de semanas (típicamente 1 mes = 4-5 semanas).
 *
 * Reglas:
 *  - Excluye médicos en turno/posturno/ausencia ese día
 *  - Excluye al subdirector (alvarado, ocupado en SDM) y al poli full-day (beltran)
 *  - Excluye a quien is_reinforcement_eligible=false
 *  - Prioriza médicos con MENOS refuerzos asignados hasta el momento (load balancing)
 *  - Trata el viernes PM como slot "premium" (a nadie le gusta) — distribución más estricta
 *
 * @param weeks: array de { weekStart, days: [{date, day, turnos, posturno, ausencias}] }
 * @param doctors: catálogo de médicos
 * @param existingReinforcements: { weekStart: { date: { am, pm } } } — respeta los ya asignados manualmente
 * @returns { weekStart: { date: { am, pm } } }
 */
export function sortReinforcements({ weeks, doctors, existingReinforcements = {} }) {
  const SUBDIRECTOR = 'alvarado';
  const POLI_FULLDAY = 'beltran';
  const carga = {};
  const cargaViernesPM = {};
  doctors.forEach(d => { carga[d.id] = 0; cargaViernesPM[d.id] = 0; });

  // Pre-contar carga de los existentes (manual asignados)
  Object.values(existingReinforcements).forEach(weekData => {
    Object.entries(weekData || {}).forEach(([date, slots]) => {
      const isVie = new Date(date).getDay() === 5;
      if (slots?.am) carga[slots.am] = (carga[slots.am] || 0) + 1;
      if (slots?.pm) {
        carga[slots.pm] = (carga[slots.pm] || 0) + 1;
        if (isVie) cargaViernesPM[slots.pm] = (cargaViernesPM[slots.pm] || 0) + 1;
      }
    });
  });

  const result = JSON.parse(JSON.stringify(existingReinforcements));

  for (const w of weeks) {
    const weekKey = w.weekStart;
    result[weekKey] = result[weekKey] || {};

    // PM ya asignados en esta semana (manuales o de pasadas previas) — para evitar 2 PM/semana
    const pmThisWeek = new Set();
    Object.values(result[weekKey]).forEach(s => { if (s?.pm) pmThisWeek.add(s.pm); });

    for (const day of w.days) {
      result[weekKey][day.date] = result[weekKey][day.date] || {};

      const turnoIds = new Set((day.turnos || []).map(t => t.doctor_id));
      const postIds = new Set((day.posturno || []).map(t => t.doctor_id));
      const ausIds = new Set((day.ausencias || []).map(a => a.doctor_id));

      const eligible = doctors.filter(d =>
        d.is_reinforcement_eligible !== false &&
        d.active !== false &&
        d.id !== SUBDIRECTOR &&
        d.id !== POLI_FULLDAY &&
        !turnoIds.has(d.id) &&
        !postIds.has(d.id) &&
        !ausIds.has(d.id)
      );

      const isVie = day.day === 'vie';

      // AM
      if (!result[weekKey][day.date].am && eligible.length > 0) {
        const sorted = eligible.slice().sort((a, b) => carga[a.id] - carga[b.id]);
        const chosen = sorted[0];
        result[weekKey][day.date].am = chosen.id;
        carga[chosen.id]++;
      }

      // PM (excluir AM del día y a quien YA tenga PM esta semana)
      const amChosen = result[weekKey][day.date].am;
      let pmEligible = eligible.filter(d => d.id !== amChosen && !pmThisWeek.has(d.id));
      // Si nadie quedó libre (semana muy ajustada), permitir repetir
      if (pmEligible.length === 0) pmEligible = eligible.filter(d => d.id !== amChosen);
      if (!result[weekKey][day.date].pm && pmEligible.length > 0) {
        const sorted = pmEligible.slice().sort((a, b) => {
          // Para viernes PM, priorizar quienes menos viernes PM han hecho
          if (isVie) {
            const dv = cargaViernesPM[a.id] - cargaViernesPM[b.id];
            if (dv !== 0) return dv;
          }
          return carga[a.id] - carga[b.id];
        });
        const chosen = sorted[0];
        result[weekKey][day.date].pm = chosen.id;
        carga[chosen.id]++;
        pmThisWeek.add(chosen.id);
        if (isVie) cargaViernesPM[chosen.id]++;
      }
    }
  }

  return result;
}

export function validateAgenda(agenda, doctors = []) {
  const warnings = [];
  const errors = [];
  const doctorName = id => doctors.find(d => d.id === id)?.display_name || id;

  agenda.forEach(day => {
    // Bloqueos sin asignar
    day.bloqueos.filter(b => b.unassigned).forEach(b => {
      errors.push(`${day.label}: bloqueo "${b.name}" sin médico asignado`);
    });
    // Médico ausente asignado a algo
    const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
    day.bloqueos.filter(b => b.doctor_id && ausIds.has(b.doctor_id)).forEach(b => {
      errors.push(`${day.label}: ${doctorName(b.doctor_id)} ausente pero asignado a "${b.name}"`);
    });
    // Refuerzos no definidos
    if (!day.refuerzos.am) warnings.push(`${day.label}: falta refuerzo AM`);
    if (!day.refuerzos.pm) warnings.push(`${day.label}: falta refuerzo PM`);
    // Superposición horaria mismo médico en bloqueos
    // EXCEPCIÓN: subdirector puede acumular dentro de su jornada
    const slots = day.bloqueos.filter(b => b.doctor_id && b.from && b.to);
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[i].doctor_id === slots[j].doctor_id &&
            slots[i].from < slots[j].to && slots[j].from < slots[i].to) {
          if (slots[i].doctor_id === SUBDIRECTOR_ID) continue; // exento
          errors.push(`${day.label}: ${doctorName(slots[i].doctor_id)} con superposición "${slots[i].name}" vs "${slots[j].name}"`);
        }
      }
    }
    // Posturno asignado a bloqueo (warning, no error)
    const postIds = new Set(day.posturno.map(t => t.doctor_id));
    day.bloqueos.filter(b => b.doctor_id && postIds.has(b.doctor_id)).forEach(b => {
      warnings.push(`${day.label}: ${doctorName(b.doctor_id)} en posturno asignado a "${b.name}"`);
    });
    // Bloqueos fuera de jornada laboral 8-17 (warning)
    day.bloqueos.filter(b => b.from && (b.from < JORNADA_INICIO || b.to > JORNADA_FIN)).forEach(b => {
      warnings.push(`${day.label}: "${b.name}" fuera de jornada laboral (${b.from}–${b.to})`);
    });
  });

  // Warning crítico: nadie debería hacer ≥2 refuerzos PM en una misma semana
  const pmCount = {};
  agenda.forEach(day => {
    if (day.refuerzos?.pm) pmCount[day.refuerzos.pm] = (pmCount[day.refuerzos.pm] || 0) + 1;
  });
  Object.entries(pmCount).forEach(([docId, n]) => {
    if (n >= 2) warnings.push(`${doctorName(docId)} tiene ${n} refuerzos PM esta semana — redistribuir (los PM son los más sensibles)`);
  });

  return { warnings, errors };
}
