/**
 * Lógica pura de generación de agenda semanal SDM.
 * Toma catálogos + ausencias + bloqueos puntuales y devuelve la grilla 5×8.
 */
import { BLOCK_SPECS, isDailyBlock } from './blockSpec';
import { PROTECTED_PRIORITY_BLOCK_IDS, STRICT_TITULAR_BLOCKS, buildEffectiveProgramAssignments } from './programPriorityDefaults';
import { priorityFor as buildPriorityFor } from './buildPriorityOrder';

const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie'];
const DAY_LABELS = { lun: 'LUNES', mar: 'MARTES', mie: 'MIÉRCOLES', jue: 'JUEVES', vie: 'VIERNES' };
const EMPTY_EXTERNAL_VISITORS_OVERRIDE = '__empty_external_visitors_override';
const JORNADA_INICIO = '08:00';
const JORNADA_FIN = '17:00';
const VIERNES_JORNADA_FIN = '16:00';

export function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Devuelve el lunes de la semana de `dateStr` (YYYY-MM-DD) como YYYY-MM-DD local.
 * Evita el bug timezone: parsear "2026-05-18" como UTC → en GMT-4 cae el
 * domingo previo, y getDay() devuelve 0 → se calcula el lunes -7 dias.
 * Esta funcion siempre parsea como FECHA LOCAL.
 */
export function getMondayDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const m = dateStr.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  const [, y, mo, da] = m;
  const local = new Date(Number(y), Number(mo) - 1, Number(da));
  const dow = local.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  local.setDate(local.getDate() + diff);
  const yy = local.getFullYear();
  const mm = String(local.getMonth() + 1).padStart(2, '0');
  const dd = String(local.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function dayKeyForDate(date) {
  // Parsear YYYY-MM-DD como fecha LOCAL (no UTC) para evitar desfase de día en TZ Chile.
  // `new Date('2026-05-04')` se interpreta como UTC midnight → en GMT-4 cae el domingo previo.
  let local;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [y, m, d] = date.slice(0, 10).split('-').map(Number);
    local = new Date(y, m - 1, d);
  } else {
    local = new Date(date);
  }
  const dow = local.getDay(); // 0 dom, 1 lun, ...
  return ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][dow];
}

export function fmtDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function timeToMinutes(time) {
  if (!time || !/^\d{2}:\d{2}/.test(time)) return null;
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Multi-médico por bloqueo: `doctor_ids: string[]` es la fuente de verdad.
// `doctor_id` se conserva como espejo del primer id (legacy / lectores no migrados).
export function blockDoctorIds(b) {
  if (!b) return [];
  if (Array.isArray(b.doctor_ids)) return b.doctor_ids.filter(Boolean);
  return b.doctor_id ? [b.doctor_id] : [];
}
export function blockHasDoctor(b, id) {
  if (!b || !id) return false;
  if (Array.isArray(b.doctor_ids)) return b.doctor_ids.includes(id);
  return b.doctor_id === id;
}
// Normaliza un bloqueo: doctor_ids + doctor_id espejo + hora HH:MM (sin segundos).
// Es importante normalizar las horas tambien aca porque los overrides viejos
// guardados en sdm_weekly_agendas conservan strings tipo "15:00:00" (heredados
// de la columna TIME de Postgres) y se reusan al renderizar.
export function normalizeBlock(b) {
  if (!b) return b;
  const ids = blockDoctorIds(b);
  const from = typeof b.from === 'string' && b.from.length > 5 ? b.from.slice(0, 5) : (b.from || null);
  const to   = typeof b.to === 'string' && b.to.length > 5 ? b.to.slice(0, 5) : (b.to || null);
  return { ...b, doctor_ids: ids, doctor_id: ids[0] || null, from, to };
}

function fitBlockInsideJornada(block, dayEnd = JORNADA_FIN) {
  if (!block?.from || !block?.to) return block;
  const start = timeToMinutes(block.from);
  const end = timeToMinutes(block.to);
  const limit = timeToMinutes(dayEnd);
  if (start == null || end == null || limit == null || end <= limit) return block;
  const duration = Math.max(0, end - start);
  if (duration <= 0) return { ...block, to: dayEnd, adjusted_jornada_end: true };
  const shiftedStart = Math.max(timeToMinutes(JORNADA_INICIO), limit - duration);
  return {
    ...block,
    from: minutesToTime(shiftedStart),
    to: dayEnd,
    adjusted_jornada_end: true,
  };
}

export function normalizeBlockLabel(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function buildBlockTemplateLookup(blockTemplates = []) {
  const validIds = new Set(blockTemplates.map(t => t.id).filter(Boolean));
  const byName = new Map();
  blockTemplates.forEach(t => {
    if (!t?.id || !t?.name) return;
    byName.set(normalizeBlockLabel(t.name), t.id);
    const compact = t.name.replace(/^Gestión\s+/i, '').trim();
    if (compact && compact !== t.name) byName.set(normalizeBlockLabel(compact), t.id);
  });
  if (validIds.has('gestion_pscv')) {
    byName.set(normalizeBlockLabel('Cardiovascular'), 'gestion_pscv');
    byName.set(normalizeBlockLabel('PSCV'), 'gestion_pscv');
  }
  return { validIds, byName };
}

export function resolveBlockTemplateId(block, blockTemplates = [], lookup = buildBlockTemplateLookup(blockTemplates)) {
  if (!block) return null;
  if (lookup.validIds.has(block.block_id)) return block.block_id;
  return lookup.byName.get(normalizeBlockLabel(block.name)) || block.block_id || null;
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

function getCalendarVisitors(cal) {
  const visitors = Array.isArray(cal?.external_visitors) ? cal.external_visitors : [];
  if (visitors.some(v => v?.[EMPTY_EXTERNAL_VISITORS_OVERRIDE])) return { hasOverride: true, visitors: [] };
  if (visitors.length > 0) return { hasOverride: true, visitors };
  return { hasOverride: false, visitors: [] };
}

function defaultExternalVisitorsForDay(day, calByDate) {
  const defaults = [];
  const add = (visitor) => {
    defaults.push({
      source: 'default',
      editable_default: true,
      holiday_pending: !!calByDate[day.date]?.is_holiday,
      ...visitor,
    });
  };

  if (day.day === 'jue' || day.day === 'vie') {
    add({
      name: 'Dr. Rubilar',
      specialty: 'Internista',
      no_show: !!calByDate[day.date]?.is_holiday,
      notes: calByDate[day.date]?.is_holiday
        ? 'No viene por feriado; mover si corresponde'
      : '3 visitas por defecto; resto del tiempo a criterio del especialista',
    });
  }
  if (day.day === 'mie') add({ name: 'Dra. Rissi', specialty: 'Pediatría' });
  if (day.day === 'jue') add({ name: 'Dra. Riquelme', specialty: 'Neurología' });
  if (day.day === 'vie') add({ name: 'Dra. Figueroa', specialty: 'Neurología infantil' });
  return defaults;
}

export function isMonthlyMatch(date, rule) {
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
  visitaOverrides = {},        // { '2026-05-04': { add: ['doc_id'], remove: ['doc_id'] } } — excepciones manuales en visita
  externalVisitorOverrides = {}, // { '2026-05-04': [{name, specialty}] } — visitantes editados/movidos manualmente
  bloqueosOverrides = {},      // { '2026-05-04': [bloqueo, ...] } — bloqueos editados manualmente (drag-drop / CellEditor)
  poliDisabled = {},           // { '2026-05-04': { am: bool, pm: bool } } — poli AM/PM apagado para un día (refuerzo sigue activo)
}) {
  const days = weekDates(weekStart);

  // Reglas operativas que se introdujeron en mayo 2026 y solo deben aplicar
  // prospectivamente, sin alterar agendas históricas ya generadas/guardadas.
  // Cambios afectados:
  //   - Rubilar +3 visitas en cualquier día donde sea visitante (no solo jue/vie).
  //   - Auto-llenado por defecto de refuerzos AM/PM faltantes.
  //   - Titular con prioridad absoluta sobre el priority pool en resolveDoctor.
  const PROSPECTIVE_CUTOFF = '2026-05-25';
  const weekStartIso = typeof weekStart === 'string' ? String(weekStart).slice(0, 10) : fmtDate(weekStart);
  const useProspectiveRules = weekStartIso >= PROSPECTIVE_CUTOFF;
  const doctorById = Object.fromEntries(doctors.map(d => [d.id, d]));

  // Mapas auxiliares
  const calByDate = Object.fromEntries(shiftCalendar.map(c => [c.date, c]));
  const absencesByDate = absences.reduce((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});
  const effectiveProgramAssignments = buildEffectiveProgramAssignments(programAssignments, blockTemplates);

  // Múltiples subrogantes ordenados por priority (cascada de fallback)
  const titularByBlock = {}, subrogantesByBlock = {};
  effectiveProgramAssignments.forEach(p => {
    if (p.role_type === 'titular') titularByBlock[p.block_template_id] = p.doctor_id;
    if (p.role_type === 'subrogante') {
      (subrogantesByBlock[p.block_template_id] = subrogantesByBlock[p.block_template_id] || [])
        .push({ doctor_id: p.doctor_id, priority: p.priority || 1 });
    }
  });
  Object.values(subrogantesByBlock).forEach(arr => arr.sort((a, b) => a.priority - b.priority));
  const priorityPeopleByBlock = {};
  effectiveProgramAssignments.forEach(p => {
    if (!p.block_template_id || !p.doctor_id) return;
    const priority = p.priority || (p.role_type === 'titular' ? 0 : 1);
    const arr = priorityPeopleByBlock[p.block_template_id] || [];
    if (!arr.some(x => x.doctor_id === p.doctor_id)) {
      arr.push({ doctor_id: p.doctor_id, priority });
    }
    priorityPeopleByBlock[p.block_template_id] = arr;
  });
  Object.values(priorityPeopleByBlock).forEach(arr => arr.sort((a, b) => a.priority - b.priority));
  const weeklyBlockDoctorCount = {};
  const weeklyDoctorLoad = {};

  // ID del subdirector (regla operativa: puede acumular bloqueos)
  const SUBDIRECTOR_ID = 'alvarado';

  // Día calendario anterior al lunes (para posturno del lunes = turno del DOMINGO)
  const prevDayDate = new Date(days[0].iso);
  prevDayDate.setDate(prevDayDate.getDate() - 1); // domingo
  const prevDayKey = fmtDate(prevDayDate);

  const result = days.map((d, idx) => {
    const cal = calByDate[d.date];
    const turnoNumber = cal ? cal.turno_number : null;
    const isHoliday = !!(cal && cal.is_holiday);
    const savedVisitors = getCalendarVisitors(cal);
    let externalVisitors = Object.prototype.hasOwnProperty.call(externalVisitorOverrides, d.date)
      ? externalVisitorOverrides[d.date]
      : savedVisitors.hasOverride
      ? savedVisitors.visitors
      : defaultExternalVisitorsForDay(d, calByDate);
    
    if (d.day === 'jue' && isHoliday && !externalVisitors.some(v => /rubilar/i.test(v?.name || ''))) {
      const rubilarMoved = Object.values(externalVisitorOverrides).flat().some(v => 
        /rubilar/i.test(v?.name || '') && v.moved_from === d.date
      );
      if (!rubilarMoved) {
        externalVisitors = [
          ...externalVisitors,
          {
            name: 'Dr. Rubilar',
            specialty: 'Internista',
            source: 'default',
            editable_default: true,
            holiday_pending: true,
            no_show: true,
            notes: 'No viene por feriado; mover si corresponde',
          },
        ];
      }
    }

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

    // FERIADO: turnos + posturno + ausencias se mantienen; resto vacío.
    if (isHoliday) {
      return {
        day: d.day, label: d.label, date: d.date,
        turnoNumber, turnos, posturno, ausencias,
        refuerzos: { am: null, pm: null },
        bloqueos: [{ block_id: 'holiday', name: 'FERIADO', from: null, to: null, doctor_id: null, unassigned: false, category: 'feriado', source: 'holiday' }],
        visita: [],
        policlinico: null,
        poli_8am: { full_day: null, full_day_editable: false, ref_pm: null },
        jornada_fin: null,
        is_holiday: true,
        external_visitors: externalVisitors,
      };
    }

    const rawRefuerzos = manualReinforcements[d.date] || {};

    // Bloqueos del día: del template (weekday_pattern) + monthly que aplica + oneoff
    let bloqueos = [];
    const dayKey = dayKeyForDate(d.date);

    // Árbol de razonamiento: TURNOS → POSTURNO → AUSENCIAS → POLI FULL-DAY → resto.
    const turnoIds_inner = new Set(turnos.map(t => t.doctor_id));
    const postIds_inner = new Set(posturno.map(t => t.doctor_id));
    const ausIds_inner = new Set((absencesByDate[d.date] || []).map(a => a.doctor_id));
    // Urgenciólogos: solo participan en visita (con cupos fijos). Excluirlos del resto.
    const urgentologistIds = new Set(doctors.filter(doc => doc.is_urgentologist).map(doc => doc.id));

    // Médico de Policlínico full-day (default Beltrán o override manual): si está cubriendo
    // policlínico 08:00–17:00, NO puede entrar a bloqueos, visita ni refuerzos.
    const POLI_FULLDAY_DEFAULT = 'beltran';
    const beltranBusy = ausIds_inner.has(POLI_FULLDAY_DEFAULT) || postIds_inner.has(POLI_FULLDAY_DEFAULT) || turnoIds_inner.has(POLI_FULLDAY_DEFAULT);
    const poliFullDayOverride = manualPoli8am[d.date];
    const poliFullDay = poliFullDayOverride || (beltranBusy ? null : POLI_FULLDAY_DEFAULT);
    const poliFullDayEditable = beltranBusy && !poliFullDayOverride;
    const poliIds = new Set(poliFullDay ? [poliFullDay] : []);

    // Saneamiento de refuerzos guardados: si el médico quedó en turno/posturno/ausencia/poli-fullday,
    // se anula automáticamente (evita arrastrar refuerzos obsoletos tras cambios de rotación).
    const refuerzoInvalido = id =>
      id && (turnoIds_inner.has(id) || postIds_inner.has(id) || ausIds_inner.has(id) || poliIds.has(id));
    const refuerzos = {
      am: refuerzoInvalido(rawRefuerzos.am) ? null : (rawRefuerzos.am || null),
      pm: refuerzoInvalido(rawRefuerzos.pm) ? null : (rawRefuerzos.pm || null),
    };

    const resolveDoctor = (blockId, slotFrom = null, slotTo = null) => {
      const t = titularByBlock[blockId];
      const subs = subrogantesByBlock[blockId] || [];
      const isAvailable = id =>
        id && !ausIds_inner.has(id) && !turnoIds_inner.has(id) && !postIds_inner.has(id)
        && !urgentologistIds.has(id) && !poliIds.has(id);
      const currentDayLoad = id => bloqueos.filter(b => !b.suspended && blockHasDoctor(b, id)).length;
      // Para bloques flexibles (ECICEP, Gestión TM, Telesalud): rechazar
      // candidato si ya tiene otro bloqueo que solapa este horario. Para
      // STRICT_TITULAR_BLOCKS y PROTECTED se mantiene la prioridad y se
      // tolera la superposición (el sistema reporta el conflicto y el
      // usuario decide). Para el resto, también se intenta evitar overlap.
      const overlapsExistingBlock = (id) => {
        if (!useProspectiveRules || !slotFrom || !slotTo || !id) return false;
        if (STRICT_TITULAR_BLOCKS.has(blockId)) return false; // estricto: no cede
        return bloqueos.some(b =>
          !b.suspended && b.from && b.to && blockHasDoctor(b, id) &&
          b.from < slotTo && b.to > slotFrom
        );
      };
      const isSlotFree = id => isAvailable(id) && !overlapsExistingBlock(id);
      const register = (id, auto = false) => {
        if (!id) return { id: null, auto };
        weeklyBlockDoctorCount[blockId] = weeklyBlockDoctorCount[blockId] || {};
        weeklyBlockDoctorCount[blockId][id] = (weeklyBlockDoctorCount[blockId][id] || 0) + 1;
        weeklyDoctorLoad[id] = (weeklyDoctorLoad[id] || 0) + 1;
        return { id, auto };
      };

      // 0) TITULAR primero (regla prospectiva ≥ 2026-05-25): solo para
      //    bloques en STRICT_TITULAR_BLOCKS (paliativos, gestion_ges,
      //    regulacion_ic, dependencia_severa). En esos casos el titular
      //    tiene prioridad absoluta aunque ya haya hecho el bloque en la
      //    semana o tenga más carga.
      if (useProspectiveRules && STRICT_TITULAR_BLOCKS.has(blockId) && isAvailable(t)) {
        return register(t, false);
      }

      // 1) Priority pool con preferencia por candidato SIN superposición.
      if (!PROTECTED_PRIORITY_BLOCK_IDS.has(blockId)) {
        const priorityAvail = (priorityPeopleByBlock[blockId] || []).filter(p => isAvailable(p.doctor_id));
        if (priorityAvail.length > 0) {
          const countForBlock = weeklyBlockDoctorCount[blockId] || {};
          const sortFn = (a, b) =>
            (a.priority || 1) - (b.priority || 1) ||
            (countForBlock[a.doctor_id] || 0) - (countForBlock[b.doctor_id] || 0) ||
            currentDayLoad(a.doctor_id) - currentDayLoad(b.doctor_id) ||
            (weeklyDoctorLoad[a.doctor_id] || 0) - (weeklyDoctorLoad[b.doctor_id] || 0);
          // 1a) Primero intentar dentro de los "untouched" sin superposición.
          const untouchedFree = priorityAvail.filter(p => !countForBlock[p.doctor_id] && !overlapsExistingBlock(p.doctor_id));
          if (untouchedFree.length > 0) {
            untouchedFree.sort(sortFn);
            return register(untouchedFree[0].doctor_id, false);
          }
          // 1b) Si no, cualquier untouched (acepta overlap si no queda otra).
          const untouched = priorityAvail.filter(p => !countForBlock[p.doctor_id]);
          if (untouched.length > 0) {
            untouched.sort(sortFn);
            return register(untouched[0].doctor_id, false);
          }
          // 1c) Reintentar con todo el pool sin superposición.
          const allFree = priorityAvail.filter(p => !overlapsExistingBlock(p.doctor_id));
          if (allFree.length > 0) {
            allFree.sort(sortFn);
            return register(allFree[0].doctor_id, false);
          }
          // 1d) Último recurso: todo el pool aunque haya overlap.
          priorityAvail.sort(sortFn);
          return register(priorityAvail[0].doctor_id, false);
        }
      }

      // 2) Titular disponible (en blocks protegidos como SDM/TACO/SELECTOR)
      if (isAvailable(t)) return register(t, false);
      // 3) Subrogantes disponibles: si todos tienen la misma priority, desempatar por menor carga del día.
      //     Si tienen priority distinta, respetar el orden.
      const subsAvail = subs.filter(s => isAvailable(s.doctor_id));
      if (subsAvail.length > 0) {
        const allSamePriority = subsAvail.every(s => (s.priority || 1) === (subsAvail[0].priority || 1));
        if (allSamePriority) {
          subsAvail.sort((a, b) => currentDayLoad(a.doctor_id) - currentDayLoad(b.doctor_id));
        }
        // Preferir subrogantes sin superposición horaria
        const subsFree = subsAvail.filter(s => !overlapsExistingBlock(s.doctor_id));
        if (subsFree.length > 0) return register(subsFree[0].doctor_id, false);
        return register(subsAvail[0].doctor_id, false);
      }
      // 2) Fallback genérico: cualquier médico activo no-urgenciólogo, libre del día y no en poli full-day.
      //    Preferir doctores con menor carga del día (menos bloqueos activos).
      const pool = doctors
        .filter(doc => doc.active !== false && !doc.is_urgentologist)
        .filter(doc => !ausIds_inner.has(doc.id) && !turnoIds_inner.has(doc.id) && !postIds_inner.has(doc.id) && !poliIds.has(doc.id))
        .map(doc => doc.id);
      if (pool.length > 0) {
        pool.sort((a, b) =>
          currentDayLoad(a) - currentDayLoad(b) ||
          (weeklyDoctorLoad[a] || 0) - (weeklyDoctorLoad[b] || 0)
        );
        return register(pool[0], true);
      }
      // 3) Nada → unassigned (último recurso, normalmente solo si TODOS los médicos están bloqueados ese día).
      return register(null, false);
    };

    // Orden de construcción: el usuario lo configura en la pestaña
    // "Ordenar prioridades". Los bloques con priority menor se resuelven
    // primero y se quedan con el médico preferido cuando hay overlap.
    const sortedBlockTemplates = [...blockTemplates].sort((a, b) =>
      buildPriorityFor(a.id) - buildPriorityFor(b.id)
    );
    for (const bt of sortedBlockTemplates) {
      // semanal regular
      const slots = bt.weekday_pattern?.[dayKey];
      if (slots && slots.length) {
        slots.forEach(slot => {
          const res = resolveDoctor(bt.id, slot.from, slot.to);
          bloqueos.push(normalizeBlock({
            block_id: bt.id,
            name: bt.name,
            from: slot.from,
            to: slot.to,
            doctor_ids: res.id ? [res.id] : [],
            unassigned: !res.id,
            auto_assigned: !!res.auto,
            category: bt.category,
            source: 'template',
          }));
        });
      }
      // mensual
      if (bt.is_monthly && isMonthlyMatch(d.date, bt.monthly_rule)) {
        const res = resolveDoctor(bt.id, bt.monthly_rule?.from || null, bt.monthly_rule?.to || null);
        bloqueos.push(normalizeBlock({
          block_id: bt.id,
          name: bt.name,
          from: bt.monthly_rule?.from || null,
          to: bt.monthly_rule?.to || null,
          doctor_ids: res.id ? [res.id] : [],
          unassigned: !res.id,
          auto_assigned: !!res.auto,
          category: bt.category,
          source: 'monthly',
        }));
      }
    }
    // oneoff
    oneoffBlocks
      .filter(o => o.date === d.date)
      .forEach(o => {
        const ids = Array.isArray(o.doctor_ids) && o.doctor_ids.length
          ? o.doctor_ids.filter(Boolean)
          : (o.doctor_id ? [o.doctor_id] : []);
        bloqueos.push(normalizeBlock({
          block_id: `oneoff-${o.id}`,
          name: o.description,
          from: o.time_from ? String(o.time_from).slice(0, 5) : null,
          to: o.time_to ? String(o.time_to).slice(0, 5) : null,
          doctor_ids: ids,
          // Las reuniones internas SDM no requieren médico individual asignado
          unassigned: o.category === 'sdm_interna' ? false : ids.length === 0,
          category: o.category,
          source: 'oneoff',
          sdm_internal: o.category === 'sdm_interna',
        }));
      });

    // Post-pass SDM (regla prospectiva ≥ 2026-06-01):
    //  - Titulares SDM = Alvarado · Cordero · Fasani.
    //  - Si los 3 están en posturno/feriado/ausencia/admin/licencia, se SUSPENDE
    //    el bloque "subdireccion_medica" ese día (no se reasigna a subrogantes).
    //  - Si SDM quedó asignado a un no-titular pero al menos un titular SDM
    //    tiene SÓLO turno (no posturno/ausencia), se reasigna SDM al titular y
    //    se busca un reemplazante para su turno (preferentemente urgentólogo,
    //    si no, médico con menor carga semanal).
    const SDM_COVERAGE_CUTOFF = '2026-06-01';
    const useSdmCoverageRules = weekStartIso >= SDM_COVERAGE_CUTOFF;
    if (useSdmCoverageRules && !bloqueosOverrides[d.date]) {
      const SDM_TITULARES = ['alvarado', 'cordero', 'fasani'];
      // La salvedad "titular en turno cubre SDM + bloque Urgencias" SÓLO
      // aplica a Fasani y Cordero. Alvarado en turno NO asume SDM —
      // queda como "unavailable" igual que si estuviera en posturno.
      const TURNO_COVERS_SDM = new Set(['fasani', 'cordero']);
      const sdmBlk = bloqueos.find(b => b.block_id === 'subdireccion_medica');
      if (sdmBlk && !sdmBlk.suspended) {
        const ausById = Object.fromEntries((absencesByDate[d.date] || []).map(a => [a.doctor_id, a]));
        const titularState = SDM_TITULARES.map(id => {
          if (ausById[id])              return { id, kind: 'unavailable' }; // ausencia (FL/A/P/LM/CAP…)
          if (postIds_inner.has(id))    return { id, kind: 'unavailable' }; // posturno
          if (turnoIds_inner.has(id))   return { id, kind: TURNO_COVERS_SDM.has(id) ? 'turno' : 'unavailable' };
          return { id, kind: 'free' };
        });
        const allUnavailable = titularState.every(s => s.kind === 'unavailable');
        if (allUnavailable) {
          sdmBlk.suspended = true;
          sdmBlk.suspended_reason = 'Sin titular SDM (todos en posturno/feriado/admin)';
          sdmBlk.unassigned = false;
        } else {
          const currentIds = blockDoctorIds(sdmBlk);
          const currentIsTitular = currentIds.some(id => SDM_TITULARES.includes(id));
          const freeTitular = titularState.find(s => s.kind === 'free');
          const turnoTitular = titularState.find(s => s.kind === 'turno');
          let chosenTitular = null;
          if (!currentIsTitular) {
            chosenTitular = freeTitular || turnoTitular;
            if (chosenTitular) {
              sdmBlk.originalDoctor = currentIds[0] || null;
              sdmBlk.doctor_ids = [chosenTitular.id];
              sdmBlk.doctor_id = chosenTitular.id;
              sdmBlk.unassigned = false;
              sdmBlk.auto_assigned = false;
              sdmBlk.reassigned = true;
            }
          } else {
            chosenTitular = titularState.find(s => currentIds.includes(s.id) && s.kind !== 'unavailable')
              || titularState.find(s => currentIds.includes(s.id));
          }
          if (chosenTitular && chosenTitular.kind === 'turno') {
            // El titular SDM sigue en su turno (ej. Fasani queda en turnos[]),
            // pero de 08:00 a 17:00 cubre SDM. Se crea un bloqueo "Urgencias"
            // 08:00–17:00 asignado a otro médico para cubrir la jornada de
            // urgencias del titular. Tras las 17:00 el titular vuelve a turno.
            const urgenciasFrom = sdmBlk.from || '08:00';
            const urgenciasTo   = sdmBlk.to   || '17:00';
            const alreadyHasUrgencias = bloqueos.some(b =>
              b.block_id === 'urgencias_cobertura_sdm' && !b.suspended
            );
            if (!alreadyHasUrgencias) {
              const candidates = doctors.filter(doc =>
                doc.active !== false &&
                !turnoIds_inner.has(doc.id) &&
                !postIds_inner.has(doc.id) &&
                !ausIds_inner.has(doc.id) &&
                !poliIds.has(doc.id) &&
                !SDM_TITULARES.includes(doc.id)
              );
              candidates.sort((a, b) => {
                const aU = a.is_urgentologist ? 0 : 1;
                const bU = b.is_urgentologist ? 0 : 1;
                if (aU !== bU) return aU - bU;
                return (weeklyDoctorLoad[a.id] || 0) - (weeklyDoctorLoad[b.id] || 0);
              });
              const coverDoc = candidates[0];
              bloqueos.push(normalizeBlock({
                block_id: 'urgencias_cobertura_sdm',
                name: `Urgencias (cubre a ${(doctorById[chosenTitular.id]?.display_name) || chosenTitular.id} en SDM)`,
                from: urgenciasFrom,
                to: urgenciasTo,
                doctor_ids: coverDoc ? [coverDoc.id] : [],
                unassigned: !coverDoc,
                auto_assigned: false,
                category: 'urgencias',
                source: 'sdm_coverage',
              }));
              if (coverDoc) {
                weeklyDoctorLoad[coverDoc.id] = (weeklyDoctorLoad[coverDoc.id] || 0) + 1;
              }
            }
          }
        }
      }
    }

    // Post-pass: Poli TACO toma por default al médico de Subdirección Médica del día,
    // salvo que tenga otro bloqueo conflictivo en el horario de TACO.
    // Si SDM tiene varios médicos, se toma el primero como "principal".
    const sdmBlock  = bloqueos.find(b => b.block_id === 'subdireccion_medica' && blockDoctorIds(b).length);
    const tacoBlock = bloqueos.find(b => b.block_id === 'poli_taco');
    if (sdmBlock && tacoBlock && tacoBlock.from && tacoBlock.to) {
      const sdmId = blockDoctorIds(sdmBlock)[0];
      const tacoIds = blockDoctorIds(tacoBlock);
      if (sdmId && !tacoIds.includes(sdmId)) {
        const hasConflict = bloqueos.some(b =>
          b !== sdmBlock && b !== tacoBlock && !b.suspended &&
          blockHasDoctor(b, sdmId) && b.from && b.to &&
          b.from < tacoBlock.to && b.to > tacoBlock.from
        );
        if (!hasConflict) {
          tacoBlock.originalDoctor = tacoIds[0] || null;
          tacoBlock.doctor_ids = [sdmId];
          tacoBlock.doctor_id = sdmId;
          tacoBlock.unassigned = false;
          tacoBlock.auto_assigned = false;
          tacoBlock.reassigned = true;
        }
      }
    }

    // Reemplazo manual de bloqueos (drag-drop / CellEditor): si el día tiene override,
    // se usa ese array completo en lugar del calculado por template. Aplica ANTES de
    // computar visita para que las reglas de exclusión (Selector, bloqueo matinal pesado)
    // funcionen sobre los bloqueos editados, no los del template.
    if (bloqueosOverrides[d.date]) {
      // Normalizamos: cada bloqueo del override debe tener doctor_ids (overrides
      // viejos guardados con `doctor_id` solo se convierten automáticamente).
      const overrideBlocks = bloqueosOverrides[d.date].map(normalizeBlock);
      // Los oneoff blocks recien creados (sdm_oneoff_blocks) deben aparecer
      // SIEMPRE en la agenda, incluso si el día tiene un override guardado
      // anteriormente. Sin esta fusión, un bloqueo de Radio/Judicial que se
      // crea después de haber editado el día se pierde porque el override
      // viejo no lo contiene.
      const overrideBlockIds = new Set(overrideBlocks.map(b => b.block_id));
      const missingOneoffs = oneoffBlocks
        .filter(o => o.date === d.date && !overrideBlockIds.has(`oneoff-${o.id}`))
        .map(o => {
          const ids = Array.isArray(o.doctor_ids) && o.doctor_ids.length
            ? o.doctor_ids.filter(Boolean)
            : (o.doctor_id ? [o.doctor_id] : []);
          return normalizeBlock({
            block_id: `oneoff-${o.id}`,
            name: o.description,
            from: o.time_from ? String(o.time_from).slice(0, 5) : null,
            to: o.time_to ? String(o.time_to).slice(0, 5) : null,
            doctor_ids: ids,
            unassigned: o.category === 'sdm_interna' ? false : ids.length === 0,
            category: o.category,
            source: 'oneoff',
            sdm_internal: o.category === 'sdm_interna',
          });
        });
      bloqueos = [...overrideBlocks, ...missingOneoffs];
    }

    // Regla operativa: nadie sale después del cierre de jornada. Si un bloqueo
    // se pasa, se corre hacia atrás manteniendo duración; viernes cierra 16:00.
    const dayEnd = d.day === 'vie' ? VIERNES_JORNADA_FIN : JORNADA_FIN;
    bloqueos = bloqueos
      .filter(b => !b.from || b.from < dayEnd)
      .map(b => fitBlockInsideJornada(b, dayEnd));

    // VISITA: médicos disponibles para visita matinal MQ
    // Excluir: turno, postturno, ausencias, refuerzos, médico de Poli full-day.
    // Urgenciólogos SÍ aparecen siempre con su cupo fijo.
    const turnoIds = turnoIds_inner;
    const postIds = postIds_inner;
    const ausIds = ausIds_inner;
    const refIds = new Set([refuerzos.am, refuerzos.pm].filter(Boolean));
    // Capacity por médico: busca el primer assignment con capacity para este doctor en cualquier bloqueo
    // visita-like (categoría visita o template id que incluya 'visita'). Como fallback, null.
    const capacityByDoctor = {};
    programAssignments.forEach(p => {
      if (p.capacity != null) {
        const bt = blockTemplates.find(t => t.id === p.block_template_id);
        if (bt && (bt.category === 'visita_radio' || /visita/i.test(bt.id) || /visita/i.test(bt.name || ''))) {
          if (capacityByDoctor[p.doctor_id] == null) capacityByDoctor[p.doctor_id] = p.capacity;
        }
      }
    });
    // "Bloqueo matinal real" = solapa con la franja de visita 08:00–11:00.
    // Un bloqueo que empieza ≥11:00 NO afecta la capacidad de visita.
    // Las reuniones internas SDM no se cuentan (son administrativas, no clínicas).
    const overlapsVisitWindow = (b) =>
      !b.suspended && !b.sdm_internal && b.from && b.to && b.from < '11:00' && b.to > '08:00';
    // Selector de Demanda: por convención operativa, quien lo cubre NO entra en visita por defecto.
    // Match robusto ante variantes de seed: id o nombre que contengan "selector".
    const isSelectorBlock = (b) => {
      if (b.suspended || blockDoctorIds(b).length === 0) return false;
      const id = (b.block_id || '').toLowerCase();
      const name = (b.name || '').toLowerCase();
      return /selector/.test(id) || /selector/.test(name);
    };
    const selectorDemandaIds = new Set();
    bloqueos.filter(isSelectorBlock).forEach(b => blockDoctorIds(b).forEach(id => selectorDemandaIds.add(id)));
    // Regla operativa: bloqueo que parte 08:00 y dura >2h (termina >10:00) ocupa la mañana clínica
    // → el médico no entra a visita por defecto (puede agregarse manualmente como excepción).
    const morningHeavyIds = new Set();
    bloqueos
      .filter(b => !b.suspended && !b.sdm_internal && b.from === '08:00' && b.to && b.to > '10:00')
      .forEach(b => blockDoctorIds(b).forEach(id => morningHeavyIds.add(id)));
    const visita = doctors
      .filter(doc => doc.active !== false)
      .filter(doc => !turnoIds.has(doc.id) && !postIds.has(doc.id) && !ausIds.has(doc.id) && !refIds.has(doc.id) && !poliIds.has(doc.id))
      .filter(doc => !selectorDemandaIds.has(doc.id))
      .filter(doc => !morningHeavyIds.has(doc.id))
      .filter(doc => {
        if (doc.id === 'rubilar') return true;
        if (doc.is_urgentologist) return true;
        const morningBlocks = bloqueos.filter(b => blockHasDoctor(b, doc.id) && overlapsVisitWindow(b));
        if (morningBlocks.length === 0) return true;
        // Excluir de visita si el bloqueo cubre toda la franja matinal
        const fullMorning = morningBlocks.some(b => b.from <= '08:30' && b.to >= '11:00');
        return !fullMorning;
      })
      .map(doc => {
        // Capacity dinámica según tiempo matinal disponible (08:00–11:00).
        // Cada visita dura 30 min y la primera tiene 30 min de handoff/entrega de info.
        // Fórmula: floor(available / 30) - 1
        // - 180 min libres → 5 visitas
        // -  90 min libres → 2 visitas (ej. Sandoval con Gestión TM 09:30–11:00)
        // -  60 min libres → 1 visita
        // -  30 min libres → 0 (no aparece en visita)
        const toMin = (t) => parseInt(t.slice(0,2), 10) * 60 + parseInt(t.slice(3,5), 10);
        const MORNING_START = 8 * 60, MORNING_END = 11 * 60;
        const computeCapacityFromBlocks = () => {
          const morningBusy = bloqueos
            .filter(b => blockHasDoctor(b, doc.id) && overlapsVisitWindow(b))
            .reduce((sum, b) => {
              const from = Math.max(toMin(b.from), MORNING_START);
              const to = Math.min(toMin(b.to), MORNING_END);
              return sum + Math.max(0, to - from);
            }, 0);
          const available = (MORNING_END - MORNING_START) - morningBusy;
          return Math.max(0, Math.floor(available / 30) - 1);
        };
        let capacity = capacityByDoctor[doc.id] ?? null;
        if (capacity == null) {
          capacity = (doc.id === 'rubilar' || doc.is_urgentologist) ? 3 : computeCapacityFromBlocks();
        }
        return { doctor_id: doc.id, capacity };
      })
      .filter(v => v.capacity !== 0); // si la franja matinal quedó sin ventana útil, no se cuenta

    // Aplicar overrides manuales de visita (excepciones: subdirector / selector de demanda agregados a mano)
    // Rubilar (regla prospectiva ≥ 2026-05-25): aparece automáticamente con
    // capacidad 3 cuando está como visitante externo del día (incluido si se
    // lo movió manualmente desde jue/vie). En semanas anteriores se mantiene
    // la regla histórica (solo jueves/viernes).
    const rubilarVisitsToday = useProspectiveRules
      ? (Array.isArray(externalVisitors)
          && externalVisitors.some(v => v && !v.no_show && /rubilar/i.test(v?.name || ''))
          && !isHoliday)
      : (d.day === 'jue' || d.day === 'vie');
    const visitaBase = rubilarVisitsToday && !visita.some(v => v.doctor_id === 'rubilar')
      ? [...visita, { doctor_id: 'rubilar', capacity: 3, external_default: true }]
      : visita;
    const visitaOv = visitaOverrides[d.date] || {};
    const removeSet = new Set(visitaOv.remove || []);
    // Rubilar viene dirigido por el pill de externalVisitors. Si está presente
    // como visitante externo hoy, ignorar el remove persistido (puede quedar
    // de un drag previo) — para ocultarlo se usa el pill (no_show / mover).
    if (rubilarVisitsToday) removeSet.delete('rubilar');
    let visitaFinal = visitaBase.filter(v => !removeSet.has(v.doctor_id));
    (visitaOv.add || []).forEach(docId => {
      if (visitaFinal.some(v => v.doctor_id === docId)) return;
      // hard-stops siguen aplicando incluso en override manual
      if (turnoIds.has(docId) || postIds.has(docId) || ausIds.has(docId)) return;
      if (selectorDemandaIds.has(docId)) return;
      const doc = doctorById[docId];
      if (docId !== 'rubilar' && (!doc || doc.active === false)) return;
      let cap = capacityByDoctor[docId] ?? null;
      if (cap == null && (doc?.is_urgentologist || docId === 'rubilar')) cap = 3;
      visitaFinal.push({ doctor_id: docId, capacity: cap, manual: true });
    });

    // Cap operacional: idealmente 5-7 médicos haciendo visita por día. Prioridad
    // para conservar (en orden de no-tocar): manual, externo (Rubilar),
    // urgentólogo, mayor capacidad. Solo se aplica en semanas con reglas
    // prospectivas para no alterar agendas históricas ya construidas.
    const VISITA_CAP = 7;
    if (useProspectiveRules && visitaFinal.length > VISITA_CAP) {
      const keepPriority = (v) => {
        if (v.manual) return 0;
        if (v.external_default) return 1; // Rubilar
        const doc = doctorById[v.doctor_id];
        if (doc?.is_urgentologist) return 2;
        return 3;
      };
      visitaFinal.sort((a, b) => {
        const pa = keepPriority(a), pb = keepPriority(b);
        if (pa !== pb) return pa - pb;
        // dentro del mismo nivel: capacidad descendente (más útil para visita)
        return (b.capacity ?? 0) - (a.capacity ?? 0);
      });
      visitaFinal = visitaFinal.slice(0, VISITA_CAP);
    }

    // (poliFullDay ya se calculó arriba — antes de bloqueos/visita — para usarlo en exclusiones)

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
      visita: visitaFinal,
      // POLICLÍNICO column: refuerzo AM hace policlínico AM 8-10, salvo que
      // este día tenga poliDisabled.am = true (ej. quitado manualmente).
      policlinico: refuerzos.am && !poliDisabled?.[d.date]?.am
        ? { doctor_id: refuerzos.am, from: '08:00', to: '10:00', label: 'Poli AM' }
        : null,
      // POLI 8 AM column: médico full-day (default BELTRÁN) + refuerzo PM
      poli_8am: {
        full_day: poliFullDay
          ? { doctor_id: poliFullDay, from: '08:00', to: isViernes ? '16:00' : '17:00', label: 'Full día', isOverride: !!poliFullDayOverride, isDefault: poliFullDay === POLI_FULLDAY_DEFAULT }
          : null,
        full_day_editable: poliFullDayEditable,
        // El poli PM se separa del refuerzo PM: si el día tiene poliDisabled.pm
        // = true, el médico sigue siendo refuerzo pero NO hace poli.
        ref_pm: refuerzos.pm && !poliDisabled?.[d.date]?.pm
          ? { doctor_id: refuerzos.pm, from: refPmFrom, to: refPmTo, label: 'Ref PM' }
          : null,
      },
      jornada_fin: isViernes ? '16:00' : '17:00',
      is_holiday: false,
      external_visitors: externalVisitors,
    };
  });

  // Post-pass: auto-reubicación de bloqueos SEMANALES (no monthly) cuyo día normal cayó en feriado.
  // Se intenta agregar otra instancia en un día disponible de la misma semana.
  // No aplica a is_monthly (esos solo generan warning en validateAgenda).
  // No tocan días con bloqueosOverrides (el usuario ya gestionó manualmente esos).
  applyHolidayRelocation({
    result, days, blockTemplates, programAssignments, doctors,
    bloqueosOverrides, calByDate, absencesByDate, rotation,
  });

  // Post-pass (regla prospectiva ≥ 2026-05-25): auto-rellenar refuerzos AM/PM
  // que quedaron vacíos. Por defecto todo refuerzo debe estar asignado; el
  // usuario puede ajustar luego. Se elige al médico elegible con menor carga
  // semanal de refuerzos para balancear. En semanas anteriores los refuerzos
  // vacíos se respetan tal cual (sin auto-rellenado).
  if (useProspectiveRules) {
  const refuerzoLoad = {};
  result.forEach(day => {
    if (day.refuerzos?.am) refuerzoLoad[day.refuerzos.am] = (refuerzoLoad[day.refuerzos.am] || 0) + 1;
    if (day.refuerzos?.pm) refuerzoLoad[day.refuerzos.pm] = (refuerzoLoad[day.refuerzos.pm] || 0) + 1;
  });
  const SUBDIRECTOR = 'alvarado';
  const POLI_FULLDAY_ID = 'beltran';
  result.forEach(day => {
    if (day.is_holiday) return;
    const turnoSet = new Set((day.turnos || []).map(t => t.doctor_id));
    const postSet = new Set((day.posturno || []).map(t => t.doctor_id));
    const ausSet = new Set((day.ausencias || []).map(a => a.doctor_id));
    // Doctores con bloqueo jerárquico (Subdirección Médica, citación tribunales)
    // — el dropdown de refuerzos de la UI los excluye, así que el autofill
    // tampoco los debe elegir o el Select quedaría sin valor visible.
    const hierarchicalSet = new Set();
    (day.bloqueos || []).forEach(b => {
      if (HIERARCHICAL_BLOCK_IDS.has(b.block_id)) {
        const ids = Array.isArray(b.doctor_ids) && b.doctor_ids.length
          ? b.doctor_ids : (b.doctor_id ? [b.doctor_id] : []);
        ids.forEach(id => hierarchicalSet.add(id));
      }
    });
    const poliFullId = day.poli_8am?.full_day?.doctor_id;
    const eligible = doctors.filter(d =>
      d.active !== false &&
      !d.is_urgentologist &&
      d.is_reinforcement_eligible !== false &&
      d.id !== SUBDIRECTOR &&
      d.id !== POLI_FULLDAY_ID &&
      d.id !== poliFullId &&
      !turnoSet.has(d.id) && !postSet.has(d.id) && !ausSet.has(d.id) &&
      !hierarchicalSet.has(d.id)
    );
    // Médicos con al menos 1 bloque clínico no-jerárquico ese día — los
    // dejamos como fallback, pero solo si no hay libres.
    const busyToday = (id) => (day.bloqueos || []).some(b =>
      !HIERARCHICAL_BLOCK_IDS.has(b.block_id) && blockHasDoctor(b, id)
    );
    ['am', 'pm'].forEach(slot => {
      const current = day.refuerzos[slot];
      // Si el valor guardado ya no es elegible (médico quedó en turno, posturno,
      // ausencia o con bloqueo jerárquico ese día), lo limpiamos para que el
      // autofill elija un reemplazo válido — si no, el Select de la UI queda
      // en blanco porque su dropdown lo excluye.
      if (current) {
        if (eligible.some(d => d.id === current)) return;
        day.refuerzos[slot] = null;
        refuerzoLoad[current] = Math.max(0, (refuerzoLoad[current] || 0) - 1);
      }
      const otherSlot = slot === 'am' ? day.refuerzos.pm : day.refuerzos.am;
      const pool = eligible.filter(d => d.id !== otherSlot);
      if (pool.length === 0) return;
      // Regla dura: si hay médicos libres (sin bloqueos ese día), elegir solo
      // entre ellos. Si nadie está libre, fallback al pool completo.
      const freePool = pool.filter(d => !busyToday(d.id));
      const usePool = freePool.length > 0 ? freePool : pool;
      usePool.sort((a, b) => (refuerzoLoad[a.id] || 0) - (refuerzoLoad[b.id] || 0));
      const chosen = usePool[0].id;
      day.refuerzos[slot] = chosen;
      refuerzoLoad[chosen] = (refuerzoLoad[chosen] || 0) + 1;
      // Reflejar en policlínico/poli_8am.ref_pm si no está apagado manualmente
      if (slot === 'am' && !poliDisabled?.[day.date]?.am) {
        day.policlinico = { doctor_id: chosen, from: '08:00', to: '10:00', label: 'Poli AM' };
      }
      if (slot === 'pm' && !poliDisabled?.[day.date]?.pm) {
        const refPmFrom = day.day === 'vie' ? '12:00' : '11:00';
        day.poli_8am.ref_pm = { doctor_id: chosen, from: refPmFrom, to: '13:00', label: 'Ref PM' };
      }
    });
  });
  } // end if (useProspectiveRules)

  // ── Post-pass: redistribuir días para STRICT_TITULAR_BLOCKS ────────────
  // Si un bloque de titular estricto quedó asignado a un subrogante (porque
  // la titular no estaba libre ese día), buscar otro día de la semana donde
  // sí esté disponible y MOVER el bloque allí. Aplica solo con reglas
  // prospectivas, ignora días con bloqueosOverrides manuales (edits del
  // usuario), y respeta que no se duplique el bloque en el día destino.
  if (useProspectiveRules) {
    const titularsByBlock = {};
    const effective = buildEffectiveProgramAssignments(programAssignments, blockTemplates);
    effective.forEach(p => {
      if (p.role_type === 'titular') titularsByBlock[p.block_template_id] = p.doctor_id;
    });
    const hasOverlapOnDay = (d, titular, b) => (d.bloqueos || []).some(bb =>
      !bb.suspended && bb.from && bb.to && b.from && b.to &&
      blockHasDoctor(bb, titular) && bb.from < b.to && bb.to > b.from
    );
    const dayBusy = (d, titular) => {
      const turnoIds = new Set((d.turnos || []).map(t => t.doctor_id));
      const postIds  = new Set((d.posturno || []).map(t => t.doctor_id));
      const ausIds   = new Set((d.ausencias || []).map(a => a.doctor_id));
      return turnoIds.has(titular) || postIds.has(titular) || ausIds.has(titular);
    };
    result.forEach(day => {
      if (day.is_holiday) return;
      // No tocar días que el usuario editó manualmente.
      if (bloqueosOverrides && bloqueosOverrides[day.date]) return;
      day.bloqueos = day.bloqueos.filter(b => {
        if (!STRICT_TITULAR_BLOCKS.has(b.block_id)) return true;
        const titular = titularsByBlock[b.block_id];
        if (!titular) return true;
        if (blockHasDoctor(b, titular)) return true; // ya está la titular
        // Buscar otro día donde la titular esté libre y sin overlap horario.
        const candidate = result.find(d => {
          if (d.date === day.date || d.is_holiday) return false;
          if (bloqueosOverrides && bloqueosOverrides[d.date]) return false;
          if ((d.bloqueos || []).some(bb => bb.block_id === b.block_id)) return false;
          if (dayBusy(d, titular)) return false;
          if (hasOverlapOnDay(d, titular, b)) return false;
          return true;
        });
        if (!candidate) return true; // no se encontró → dejar como está
        // Mover el bloque al día candidato con el titular asignado.
        candidate.bloqueos = candidate.bloqueos || [];
        candidate.bloqueos.push({
          ...b,
          doctor_id: titular,
          doctor_ids: [titular],
          unassigned: false,
          auto_assigned: false,
          reassigned: true,
          originalDoctor: blockDoctorIds(b)[0] || null,
          source: 'moved_to_titular',
          reassigned_from_date: day.date,
        });
        return false; // remover del día actual
      });
    });
  }

  return result;
}

/**
 * Para cada blockTemplate semanal (no monthly): si por feriado quedó con menos instancias
 * que las esperadas según su weekday_pattern, intentar agregar la instancia faltante
 * en otro día de la semana donde el titular/subrogante esté disponible.
 */
function applyHolidayRelocation({ result, days, blockTemplates, programAssignments, doctors, bloqueosOverrides, calByDate, absencesByDate, rotation }) {
  const titularByBlock = {}, subrogantesByBlock = {};
  const effectiveProgramAssignments = buildEffectiveProgramAssignments(programAssignments, blockTemplates);
  effectiveProgramAssignments.forEach(p => {
    if (p.role_type === 'titular') titularByBlock[p.block_template_id] = p.doctor_id;
    if (p.role_type === 'subrogante') {
      (subrogantesByBlock[p.block_template_id] = subrogantesByBlock[p.block_template_id] || [])
        .push({ doctor_id: p.doctor_id, priority: p.priority || 1 });
    }
  });
  Object.values(subrogantesByBlock).forEach(arr => arr.sort((a, b) => a.priority - b.priority));

  const holidayDates = new Set(days.filter(d => calByDate[d.date]?.is_holiday).map(d => d.date));
  if (holidayDates.size === 0) return;

  for (const bt of blockTemplates) {
    if (bt.is_monthly) continue;
    // Bloques diarios (corren los 5 días): NO se reubican. El día feriado simplemente
    // queda sin instancia esa semana — comportamiento esperado, no es error.
    if (isDailyBlock(bt)) continue;
    const slotsPerDay = bt.weekday_pattern || {};
    // Días esperados según template (que caigan en lun-vie con slot definido)
    const expectedDays = days.filter(d => Array.isArray(slotsPerDay[d.day]) && slotsPerDay[d.day].length > 0);
    // ¿Hay días esperados que cayeron en feriado?
    const missedDays = expectedDays.filter(d => holidayDates.has(d.date));
    if (missedDays.length === 0) continue;

    for (const missed of missedDays) {
      // Slot a relocar (toma el primero del día perdido)
      const slot = slotsPerDay[missed.day][0];
      // Candidatos: días no-feriado, sin override manual, sin ya tener el bloque
      const candidateDays = result.filter(r =>
        !r.is_holiday &&
        !bloqueosOverrides[r.date] &&
        !r.bloqueos.some(b => b.block_id === bt.id)
      );
      // Aplicar regla de viernes 16:00 al horario propuesto
      let proposedFrom = slot.from, proposedTo = slot.to;
      const fits = (day) => {
        const isVie = day.day === 'vie';
        const to = isVie && proposedTo > '16:00' ? '16:00' : proposedTo;
        if (proposedFrom >= to) return null;
        // Doctor disponible (titular o subrogante o cualquier activo)
        const turnoIds = new Set(day.turnos.map(t => t.doctor_id));
        const postIds = new Set(day.posturno.map(t => t.doctor_id));
        const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
        const isAvailable = (id) => id && !turnoIds.has(id) && !postIds.has(id) && !ausIds.has(id);
        const titular = titularByBlock[bt.id];
        const subs = subrogantesByBlock[bt.id] || [];
        const noOverlap = (id) => !day.bloqueos.some(b =>
          b.doctor_id === id && !b.suspended && b.from && b.to &&
          b.from < to && proposedFrom < b.to
        );
        const trySelect = (id) => isAvailable(id) && noOverlap(id) ? id : null;
        const chosen = trySelect(titular) || subs.map(s => trySelect(s.doctor_id)).find(Boolean);
        if (!chosen) return null;
        return { doctor_id: chosen, from: proposedFrom, to, isAuto: chosen !== titular && !subs.some(s => s.doctor_id === chosen) };
      };
      let placed = null;
      for (const cand of candidateDays) {
        const fit = fits(cand);
        if (fit) {
          placed = { day: cand, fit };
          break;
        }
      }
      if (placed) {
        placed.day.bloqueos.push({
          block_id: bt.id,
          name: bt.name,
          from: placed.fit.from,
          to: placed.fit.to,
          doctor_id: placed.fit.doctor_id,
          unassigned: false,
          auto_assigned: !!placed.fit.isAuto,
          category: bt.category,
          source: 'relocated_holiday',
          relocated_from: missed.date,
        });
      }
      // si no se pudo: queda el déficit, validateAgenda lo reporta
    }
  }
}

const SUBDIRECTOR_ID = 'alvarado';

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
  // Doctores excluidos de la rotación de refuerzos por política operativa:
  // Fasani siempre está en SDM (no se la asigna a refuerzo); el SUBDIRECTOR
  // y POLI_FULLDAY también quedan fuera por defecto. Cuando Cordero o
  // Alvarado están de Subdirección Médica ese día, quedan excluidos vía
  // hierarchicalSet por día (más abajo).
  const EXCLUIDOS_REFUERZO = new Set(['fasani']);

  const carga = {};        // total de refuerzos por médico (AM+PM acumulado)
  const cargaPM = {};      // total PM (para equidad PM específica)
  const cargaViernesPM = {};
  doctors.forEach(d => {
    carga[d.id] = 0;
    cargaPM[d.id] = 0;
    cargaViernesPM[d.id] = 0;
  });

  // Pre-contar carga de los existentes (manual asignados o de semanas previas)
  Object.values(existingReinforcements).forEach(weekData => {
    Object.entries(weekData || {}).forEach(([date, slots]) => {
      const isVie = new Date(date).getDay() === 5;
      if (slots?.am) carga[slots.am] = (carga[slots.am] || 0) + 1;
      if (slots?.pm) {
        carga[slots.pm] = (carga[slots.pm] || 0) + 1;
        cargaPM[slots.pm] = (cargaPM[slots.pm] || 0) + 1;
        if (isVie) cargaViernesPM[slots.pm] = (cargaViernesPM[slots.pm] || 0) + 1;
      }
    });
  });

  const result = JSON.parse(JSON.stringify(existingReinforcements));

  // Cantidad de bloqueos clínicos (no jerárquicos) de un médico ese día.
  // Lo usamos como segundo criterio de orden: a menos bloqueos, mayor
  // prioridad para refuerzo (libre = ideal). Bloques jerárquicos
  // (Subdirección, Tribunal) descalifican totalmente (más abajo).
  const blockLoadForDay = (day, doctorId) => {
    let n = 0;
    (day.bloqueos || []).forEach(b => {
      if (HIERARCHICAL_BLOCK_IDS.has(b.block_id)) return;
      if (blockHasDoctor(b, doctorId)) n++;
    });
    return n;
  };

  // Doctores que ese día tienen un bloque jerárquico (SDM, Tribunal).
  // Quedan fuera del pool de refuerzo automáticamente.
  const hierarchicalSetForDay = (day) => {
    const s = new Set();
    (day.bloqueos || []).forEach(b => {
      if (!HIERARCHICAL_BLOCK_IDS.has(b.block_id)) return;
      blockDoctorIds(b).forEach(id => s.add(id));
    });
    return s;
  };

  for (const w of weeks) {
    const weekKey = w.weekStart;
    result[weekKey] = result[weekKey] || {};

    // Saneamiento previo: descartar refuerzos guardados que pisen turno/posturno/ausencia
    // o que estén en jerárquico ese día (incluye Cordero/Alvarado cuando asumen SDM).
    for (const day of w.days) {
      const slot = result[weekKey][day.date];
      if (!slot) continue;
      const turnoIds = new Set((day.turnos || []).map(t => t.doctor_id));
      const postIds = new Set((day.posturno || []).map(t => t.doctor_id));
      const ausIds = new Set((day.ausencias || []).map(a => a.doctor_id));
      const hierSet = hierarchicalSetForDay(day);
      const invalido = id => id && (
        turnoIds.has(id) || postIds.has(id) || ausIds.has(id) ||
        hierSet.has(id) || EXCLUIDOS_REFUERZO.has(id) ||
        id === SUBDIRECTOR || id === POLI_FULLDAY
      );
      const isVie = new Date(day.date).getDay() === 5;
      if (invalido(slot.am)) {
        carga[slot.am] = Math.max(0, (carga[slot.am] || 0) - 1);
        slot.am = null;
      }
      if (invalido(slot.pm)) {
        carga[slot.pm] = Math.max(0, (carga[slot.pm] || 0) - 1);
        cargaPM[slot.pm] = Math.max(0, (cargaPM[slot.pm] || 0) - 1);
        if (isVie) cargaViernesPM[slot.pm] = Math.max(0, (cargaViernesPM[slot.pm] || 0) - 1);
        slot.pm = null;
      }
    }

    // PM ya asignados en esta semana (manuales o ya re-sorteados) — para evitar 2 PM/semana
    const pmThisWeek = new Set();
    Object.values(result[weekKey]).forEach(s => { if (s?.pm) pmThisWeek.add(s.pm); });

    for (const day of w.days) {
      result[weekKey][day.date] = result[weekKey][day.date] || {};

      const turnoIds = new Set((day.turnos || []).map(t => t.doctor_id));
      const postIds = new Set((day.posturno || []).map(t => t.doctor_id));
      const ausIds = new Set((day.ausencias || []).map(a => a.doctor_id));
      const hierSet = hierarchicalSetForDay(day);

      const eligible = doctors.filter(d =>
        d.is_reinforcement_eligible !== false &&
        d.active !== false &&
        !d.is_urgentologist &&
        !EXCLUIDOS_REFUERZO.has(d.id) &&
        d.id !== SUBDIRECTOR &&
        d.id !== POLI_FULLDAY &&
        !turnoIds.has(d.id) &&
        !postIds.has(d.id) &&
        !ausIds.has(d.id) &&
        !hierSet.has(d.id) // ← Cordero/Alvarado quedan excluidos cuando asumen SDM
      );

      const isVie = day.day === 'vie';

      // Comparador con equidad ponderada:
      //   1) Quienes tienen MENOS bloqueos clínicos ese día (= más libres).
      //   2) Quienes tienen MENOS carga total acumulada.
      // En PM se agrega además: menos cargaPM previo (equidad de PM
      // específica para que nadie se cargue de PMs); en viernes PM también
      // se pondera la cargaViernesPM (carga sensible).
      const cmpAM = (a, b) => {
        const bA = blockLoadForDay(day, a.id);
        const bB = blockLoadForDay(day, b.id);
        if (bA !== bB) return bA - bB;
        return (carga[a.id] || 0) - (carga[b.id] || 0);
      };
      const cmpPM = (a, b) => {
        const bA = blockLoadForDay(day, a.id);
        const bB = blockLoadForDay(day, b.id);
        if (bA !== bB) return bA - bB;
        if (isVie) {
          const dv = (cargaViernesPM[a.id] || 0) - (cargaViernesPM[b.id] || 0);
          if (dv !== 0) return dv;
        }
        const dp = (cargaPM[a.id] || 0) - (cargaPM[b.id] || 0);
        if (dp !== 0) return dp;
        return (carga[a.id] || 0) - (carga[b.id] || 0);
      };

      // Regla dura: nunca elegir como refuerzo a alguien que ya tiene un
      // bloqueo clínico ese día si hay otros libres. Solo si todos los
      // elegibles están ocupados se permite el fallback (preferiendo el
      // de menor carga). Esto evita conflictos del tipo "Cordero tiene
      // Selector de Demanda 08-11 y aparece como refuerzo AM".
      const splitFreeBusy = (pool) => {
        const free = pool.filter(d => blockLoadForDay(day, d.id) === 0);
        return free.length > 0 ? free : pool;
      };

      // AM
      if (!result[weekKey][day.date].am && eligible.length > 0) {
        const sorted = splitFreeBusy(eligible).slice().sort(cmpAM);
        const chosen = sorted[0];
        result[weekKey][day.date].am = chosen.id;
        carga[chosen.id]++;
      }

      // PM (excluir AM del día y a quien YA tenga PM esta semana)
      const amChosen = result[weekKey][day.date].am;
      let pmEligible = eligible.filter(d => d.id !== amChosen && !pmThisWeek.has(d.id));
      if (pmEligible.length === 0) pmEligible = eligible.filter(d => d.id !== amChosen);
      if (!result[weekKey][day.date].pm && pmEligible.length > 0) {
        const sorted = splitFreeBusy(pmEligible).slice().sort(cmpPM);
        const chosen = sorted[0];
        result[weekKey][day.date].pm = chosen.id;
        carga[chosen.id]++;
        cargaPM[chosen.id]++;
        pmThisWeek.add(chosen.id);
        if (isVie) cargaViernesPM[chosen.id]++;
      }
    }
  }

  return result;
}

export function validateAgenda(agenda, doctors = [], blockTemplates = []) {
  const warnings = [];
  const errors = [];
  const doctorName = id => doctors.find(d => d.id === id)?.display_name || id;

  agenda.forEach(day => {
    // Bloqueos sin asignar (skip suspended)
    day.bloqueos.filter(b => !b.suspended && b.unassigned).forEach(b => {
      errors.push({ date: day.date, label: day.label, kind: 'unassigned', blockId: b.block_id, doctorId: null,
        message: `${day.label}: bloqueo "${b.name}" sin médico asignado` });
    });
    // Auto-asignados — pedir revisar / formalizar
    day.bloqueos.filter(b => !b.suspended && b.auto_assigned).forEach(b => {
      const ids = blockDoctorIds(b);
      const namesStr = ids.map(doctorName).join(' + ') || '—';
      warnings.push({ date: day.date, label: day.label, kind: 'auto_assigned', blockId: b.block_id, doctorId: ids[0] || null,
        message: `${day.label}: "${b.name}" auto-asignado a ${namesStr} — revisar y formalizar como subrogante en el template` });
    });
    // Médico ausente asignado: si CUALQUIERA de los médicos del bloque está ausente, error.
    const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
    day.bloqueos.filter(b => !b.suspended).forEach(b => {
      const ids = blockDoctorIds(b);
      const absent = ids.filter(id => ausIds.has(id));
      if (absent.length) {
        errors.push({ date: day.date, label: day.label, kind: 'absent_assigned', blockId: b.block_id, doctorId: absent[0],
          message: `${day.label}: ${absent.map(doctorName).join(', ')} ausente${absent.length>1?'s':''} pero asignado${absent.length>1?'s':''} a "${b.name}"` });
      }
    });
    // Refuerzos no definidos
    if (!day.refuerzos.am) warnings.push({ date: day.date, label: day.label, kind: 'missing_am', message: `${day.label}: falta refuerzo AM` });
    if (!day.refuerzos.pm) warnings.push({ date: day.date, label: day.label, kind: 'missing_pm', message: `${day.label}: falta refuerzo PM` });
    // Superposición horaria — algún médico compartido en dos bloques cuya
    // franja se cruza. Con multi-doctor: revisamos por cada id del array.
    const slots = day.bloqueos.filter(b => !b.suspended && b.from && b.to && blockDoctorIds(b).length);
    for (let i = 0; i < slots.length; i++) {
      const a = slots[i];
      const aIds = blockDoctorIds(a);
      for (let j = i + 1; j < slots.length; j++) {
        const b = slots[j];
        if (!(a.from < b.to && b.from < a.to)) continue;
        const bIds = blockDoctorIds(b);
        const shared = aIds.filter(id => bIds.includes(id) && id !== SUBDIRECTOR_ID);
        if (shared.length === 0) continue;
        errors.push({
          date: day.date, label: day.label, kind: 'overlap',
          blockId: a.block_id, blockId2: b.block_id, doctorId: shared[0],
          message: `${day.label}: ${shared.map(doctorName).join(', ')} con superposición "${a.name}" vs "${b.name}"`,
        });
      }
    }
    // Posturno asignado (warning): si CUALQUIERA de los médicos del bloque está en posturno.
    const postIds = new Set(day.posturno.map(t => t.doctor_id));
    day.bloqueos.filter(b => !b.suspended).forEach(b => {
      const ids = blockDoctorIds(b);
      const inPost = ids.filter(id => postIds.has(id));
      if (inPost.length) {
        warnings.push({ date: day.date, label: day.label, kind: 'posturno_assigned', blockId: b.block_id, doctorId: inPost[0],
          message: `${day.label}: ${inPost.map(doctorName).join(', ')} en posturno asignado a "${b.name}"` });
      }
    });
    // Refuerzo en conflicto con turno/posturno/ausencia (error)
    const turnoIdsDay = new Set(day.turnos.map(t => t.doctor_id));
    const ausIdsDay = new Set(day.ausencias.map(a => a.doctor_id));
    ['am', 'pm'].forEach(slot => {
      const rid = day.refuerzos?.[slot];
      if (!rid) return;
      let motivo = null;
      if (turnoIdsDay.has(rid)) motivo = 'turno';
      else if (postIds.has(rid)) motivo = 'posturno';
      else if (ausIdsDay.has(rid)) motivo = 'ausencia';
      if (motivo) {
        errors.push({ date: day.date, label: day.label, kind: `refuerzo_${motivo}`, doctorId: rid,
          message: `${day.label}: ${doctorName(rid)} no puede ser refuerzo ${slot.toUpperCase()} (está en ${motivo})` });
      }
    });
    // Bloqueos fuera de jornada (warning)
    day.bloqueos.filter(b => !b.suspended && b.from && (b.from < JORNADA_INICIO || b.to > JORNADA_FIN)).forEach(b => {
      warnings.push({ date: day.date, label: day.label, kind: 'outside_jornada', blockId: b.block_id,
        message: `${day.label}: "${b.name}" fuera de jornada laboral (${b.from}–${b.to})` });
    });
  });

  // Warning crítico: nadie debería hacer ≥2 refuerzos PM
  const pmCount = {};
  agenda.forEach(day => {
    if (day.refuerzos?.pm) pmCount[day.refuerzos.pm] = (pmCount[day.refuerzos.pm] || 0) + 1;
  });
  Object.entries(pmCount).forEach(([docId, n]) => {
    if (n >= 2) warnings.push({ kind: 'too_many_pm', doctorId: docId, message: `${doctorName(docId)} tiene ${n} refuerzos PM esta semana — redistribuir (los PM son los más sensibles)` });
  });

  // Cumplimiento semanal vs spec canónico (BLOCK_SPECS) + bloqueos mensuales en feriado
  const holidayDates = agenda.filter(d => d.is_holiday).map(d => d.date);
  const blockLookup = buildBlockTemplateLookup(blockTemplates);
  const countByBlock = {};
  agenda.forEach(day => {
    if (day.is_holiday) return;
    day.bloqueos.forEach(b => {
      if (b.suspended) return;
      const blockId = resolveBlockTemplateId(b, blockTemplates, blockLookup);
      if (!blockId) return;
      countByBlock[blockId] = (countByBlock[blockId] || 0) + 1;
    });
  });
  // Para mensuales: detectar si la fecha objetivo cae en feriado
  blockTemplates.forEach(bt => {
    if (!bt.is_monthly) return;
    const matchingDay = agenda.find(d => isMonthlyMatch(d.date, bt.monthly_rule));
    if (!matchingDay) return;
    // Si la fecha objetivo está dentro de la semana y es feriado → warning
    if (matchingDay.is_holiday) {
      warnings.push({
        date: matchingDay.date, label: matchingDay.label,
        kind: 'monthly_holiday_skipped', blockId: bt.id,
        message: `${matchingDay.label}: "${bt.name}" no se agendó porque ${matchingDay.date} es feriado — reubicar manualmente si corresponde`,
      });
    }
  });
  // Para semanales: verificar count vs BLOCK_SPECS
  const semWarnings = checkWeeklyCounts(countByBlock, blockTemplates, holidayDates);
  warnings.push(...semWarnings);

  return { warnings, errors };
}

function checkWeeklyCounts(countByBlock, blockTemplates, holidayDates) {
  const out = [];
  const nHolidays = holidayDates.length;
  for (const bt of blockTemplates) {
    if (bt.is_monthly) continue;
    const spec = BLOCK_SPECS[bt.id];
    if (!spec || spec.manual) continue;
    const actual = countByBlock[bt.id] || 0;

    // Bloques diarios: esperan 5, descontando feriados. Solo warning si el déficit excede los feriados.
    if (isDailyBlock(bt)) {
      const expectedAdjusted = 5 - nHolidays;
      if (actual < expectedAdjusted) {
        out.push({
          kind: 'weekly_count_short',
          blockId: bt.id,
          message: `"${bt.name}" esperado ${expectedAdjusted} (5 − ${nHolidays} feriado(s)), actual ${actual} — revisar`,
        });
      }
      continue;
    }

    // Rango min/max (ej. Visita PROA 2-3)
    if (typeof spec.expected_count_min === 'number') {
      if (actual < spec.expected_count_min) {
        const motivoFeriado = nHolidays > 0 && (spec.expected_count_min - actual) <= nHolidays;
        out.push({
          kind: motivoFeriado ? 'weekly_count_short_unrelocatable' : 'weekly_count_short',
          blockId: bt.id,
          message: motivoFeriado
            ? `"${bt.name}" esperado ${spec.expected_count_min}-${spec.expected_count_max || '?'}, actual ${actual} — no se pudo reubicar (sin titular/subrogante disponible)`
            : `"${bt.name}" esperado ${spec.expected_count_min}-${spec.expected_count_max || '?'}, actual ${actual} — revisar`,
        });
      }
      continue;
    }

    // Conteo fijo (ej. ECICEP x2)
    if (typeof spec.expected_count === 'number' && spec.expected_count >= 1) {
      if (actual < spec.expected_count) {
        const motivoFeriado = nHolidays > 0 && (spec.expected_count - actual) <= nHolidays;
        out.push({
          kind: motivoFeriado ? 'weekly_count_short_unrelocatable' : 'weekly_count_short',
          blockId: bt.id,
          message: motivoFeriado
            ? `"${bt.name}" esperado ${spec.expected_count}, actual ${actual} — no se pudo reubicar (sin titular/subrogante disponible)`
            : `"${bt.name}" esperado ${spec.expected_count}, actual ${actual} — revisar (posible edición manual)`,
        });
      }
    }
  }
  return out;
}
