/**
 * Lógica pura de generación de agenda semanal SDM.
 * Toma catálogos + ausencias + bloqueos puntuales y devuelve la grilla 5×8.
 */
import { BLOCK_SPECS, isDailyBlock } from './blockSpec';

const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie'];
const DAY_LABELS = { lun: 'LUNES', mar: 'MARTES', mie: 'MIÉRCOLES', jue: 'JUEVES', vie: 'VIERNES' };
const EMPTY_EXTERNAL_VISITORS_OVERRIDE = '__empty_external_visitors_override';

export function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
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

function sandovalTargetDate(days, calByDate) {
  const thursday = days.find(d => d.day === 'jue');
  const friday = days.find(d => d.day === 'vie');
  if (!thursday || !friday) return thursday?.date || null;
  return calByDate[thursday.date]?.is_holiday ? friday.date : thursday.date;
}

function defaultExternalVisitorsForDay(day, days, calByDate) {
  const sandovalDate = sandovalTargetDate(days, calByDate);
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
  if (day.date === sandovalDate) {
    add({
      name: 'Dr. R. Sandoval',
      specialty: 'Internista',
      notes: day.day === 'vie' ? 'Movido desde jueves por feriado/bloqueo' : 'Visita habitual de jueves',
      moved_from: day.day === 'vie' ? days.find(d => d.day === 'jue')?.date : null,
    });
  }
  if (day.day === 'mie') add({ name: 'Dra. Rissi', specialty: 'Pediatría' });
  if (day.day === 'jue') add({ name: 'Dra. Riquelme', specialty: 'Neurología' });
  if (day.day === 'vie') add({ name: 'Dra. Figueroa', specialty: 'Neurología infantil' });
  return defaults;
}

function hasDefaultSandovalServiceVisit(day, days, calByDate) {
  return day.date === sandovalTargetDate(days, calByDate) && !calByDate[day.date]?.is_holiday;
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

  const result = days.map((d, idx) => {
    const cal = calByDate[d.date];
    const turnoNumber = cal ? cal.turno_number : null;
    const isHoliday = !!(cal && cal.is_holiday);
    const savedVisitors = getCalendarVisitors(cal);
    let externalVisitors = Object.prototype.hasOwnProperty.call(externalVisitorOverrides, d.date)
      ? externalVisitorOverrides[d.date]
      : savedVisitors.hasOverride
      ? savedVisitors.visitors
      : defaultExternalVisitorsForDay(d, days, calByDate);
    
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

    const resolveDoctor = (blockId) => {
      const t = titularByBlock[blockId];
      const subs = subrogantesByBlock[blockId] || [];
      const isAvailable = id =>
        id && !ausIds_inner.has(id) && !turnoIds_inner.has(id) && !postIds_inner.has(id)
        && !urgentologistIds.has(id) && !poliIds.has(id);
      // 1a) Titular disponible (prioridad absoluta sobre subrogantes)
      if (isAvailable(t)) return { id: t, auto: false };
      // 1b) Subrogantes disponibles: si todos tienen la misma priority, desempatar por menor carga del día.
      //     Si tienen priority distinta, respetar el orden.
      const subsAvail = subs.filter(s => isAvailable(s.doctor_id));
      if (subsAvail.length > 0) {
        const allSamePriority = subsAvail.every(s => (s.priority || 1) === (subsAvail[0].priority || 1));
        if (allSamePriority) {
          const cargaHoy = {};
          subsAvail.forEach(s => { cargaHoy[s.doctor_id] = 0; });
          bloqueos.forEach(b => { if (b.doctor_id && !b.suspended && cargaHoy[b.doctor_id] != null) cargaHoy[b.doctor_id]++; });
          subsAvail.sort((a, b) => cargaHoy[a.doctor_id] - cargaHoy[b.doctor_id]);
        }
        return { id: subsAvail[0].doctor_id, auto: false };
      }
      // 2) Fallback genérico: cualquier médico activo no-urgenciólogo, libre del día y no en poli full-day.
      //    Preferir doctores con menor carga del día (menos bloqueos activos).
      const pool = doctors
        .filter(doc => doc.active !== false && !doc.is_urgentologist)
        .filter(doc => !ausIds_inner.has(doc.id) && !turnoIds_inner.has(doc.id) && !postIds_inner.has(doc.id) && !poliIds.has(doc.id))
        .map(doc => doc.id);
      if (pool.length > 0) {
        const cargaHoy = Object.fromEntries(pool.map(id => [id, 0]));
        bloqueos.forEach(b => { if (b.doctor_id && !b.suspended && cargaHoy[b.doctor_id] != null) cargaHoy[b.doctor_id]++; });
        pool.sort((a, b) => cargaHoy[a] - cargaHoy[b]);
        return { id: pool[0], auto: true };
      }
      // 3) Nada → unassigned (último recurso, normalmente solo si TODOS los médicos están bloqueados ese día).
      return { id: null, auto: false };
    };

    for (const bt of blockTemplates) {
      // semanal regular
      const slots = bt.weekday_pattern?.[dayKey];
      if (slots && slots.length) {
        slots.forEach(slot => {
          const res = resolveDoctor(bt.id);
          bloqueos.push({
            block_id: bt.id,
            name: bt.name,
            from: slot.from,
            to: slot.to,
            doctor_id: res.id,
            unassigned: !res.id,
            auto_assigned: !!res.auto,
            category: bt.category,
            source: 'template',
          });
        });
      }
      // mensual
      if (bt.is_monthly && isMonthlyMatch(d.date, bt.monthly_rule)) {
        const res = resolveDoctor(bt.id);
        bloqueos.push({
          block_id: bt.id,
          name: bt.name,
          from: bt.monthly_rule?.from || null,
          to: bt.monthly_rule?.to || null,
          doctor_id: res.id,
          unassigned: !res.id,
          auto_assigned: !!res.auto,
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
        // Las reuniones internas SDM no requieren médico individual asignado
        unassigned: o.category === 'sdm_interna' ? false : !o.doctor_id,
        category: o.category,
        source: 'oneoff',
        sdm_internal: o.category === 'sdm_interna',
      }));

    if (hasDefaultSandovalServiceVisit(d, days, calByDate)) {
      const isViernesSandoval = d.day === 'vie';
      const sandovalId = doctorById.sandoval ? 'sandoval' : null;
      bloqueos.push({
        block_id: `external_sandoval_service_visit_${d.date}`,
        name: 'Visita de servicio - Dr. R. Sandoval',
        from: isViernesSandoval ? '14:00' : '15:00',
        to: isViernesSandoval ? '16:00' : '17:00',
        doctor_id: sandovalId,
        unassigned: !sandovalId,
        category: 'clinico',
        source: 'external_default',
        external_visitor: true,
      });
    }

    // Post-pass: Poli TACO toma por default al médico de Subdirección Médica del día,
    // salvo que tenga otro bloqueo conflictivo en el horario de TACO.
    const sdmBlock  = bloqueos.find(b => b.block_id === 'subdireccion_medica' && b.doctor_id);
    const tacoBlock = bloqueos.find(b => b.block_id === 'poli_taco');
    if (sdmBlock && tacoBlock && tacoBlock.from && tacoBlock.to && sdmBlock.doctor_id !== tacoBlock.doctor_id) {
      const sdmId = sdmBlock.doctor_id;
      const hasConflict = bloqueos.some(b =>
        b !== sdmBlock && b !== tacoBlock && !b.suspended &&
        b.doctor_id === sdmId && b.from && b.to &&
        b.from < tacoBlock.to && b.to > tacoBlock.from
      );
      if (!hasConflict) {
        tacoBlock.originalDoctor = tacoBlock.doctor_id;
        tacoBlock.doctor_id = sdmId;
        tacoBlock.unassigned = false;
        tacoBlock.auto_assigned = false;
        tacoBlock.reassigned = true;
      }
    }

    // Reemplazo manual de bloqueos (drag-drop / CellEditor): si el día tiene override,
    // se usa ese array completo en lugar del calculado por template. Aplica ANTES de
    // computar visita para que las reglas de exclusión (Selector, bloqueo matinal pesado)
    // funcionen sobre los bloqueos editados, no los del template.
    if (bloqueosOverrides[d.date]) {
      bloqueos = bloqueosOverrides[d.date];
    }

    // Regla operativa viernes: jornada termina 16:00. Ningún bloqueo puede correr 16:00–17:00.
    // - Si arranca >= 16:00 → se descarta del array (no debería existir).
    // - Si arranca antes pero termina >16:00 → se trunca a 16:00.
    if (d.day === 'vie') {
      bloqueos = bloqueos
        .filter(b => !b.from || b.from < '16:00')
        .map(b => (b.to && b.to > '16:00') ? { ...b, to: '16:00', truncated_friday: true } : b);
    }

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
      if (b.suspended || !b.doctor_id) return false;
      const id = (b.block_id || '').toLowerCase();
      const name = (b.name || '').toLowerCase();
      return /selector/.test(id) || /selector/.test(name);
    };
    const selectorDemandaIds = new Set(bloqueos.filter(isSelectorBlock).map(b => b.doctor_id));
    // Regla operativa: bloqueo que parte 08:00 y dura >2h (termina >10:00) ocupa la mañana clínica
    // → el médico no entra a visita por defecto (puede agregarse manualmente como excepción).
    const morningHeavyIds = new Set(
      bloqueos
        .filter(b => !b.suspended && !b.sdm_internal && b.doctor_id && b.from === '08:00' && b.to && b.to > '10:00')
        .map(b => b.doctor_id)
    );
    const visita = doctors
      .filter(doc => doc.active !== false)
      .filter(doc => !turnoIds.has(doc.id) && !postIds.has(doc.id) && !ausIds.has(doc.id) && !refIds.has(doc.id) && !poliIds.has(doc.id))
      .filter(doc => !selectorDemandaIds.has(doc.id))
      .filter(doc => !morningHeavyIds.has(doc.id))
      .filter(doc => {
        if (doc.id === 'rubilar') return true;
        if (doc.is_urgentologist) return true;
        const morningBlocks = bloqueos.filter(b => b.doctor_id === doc.id && overlapsVisitWindow(b));
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
            .filter(b => b.doctor_id === doc.id && overlapsVisitWindow(b))
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
    const visitaBase = (d.day === 'jue' || d.day === 'vie') && !visita.some(v => v.doctor_id === 'rubilar')
      ? [...visita, { doctor_id: 'rubilar', capacity: 3, external_default: true }]
      : visita;
    const visitaOv = visitaOverrides[d.date] || {};
    const removeSet = new Set(visitaOv.remove || []);
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
  return result;
}

/**
 * Para cada blockTemplate semanal (no monthly): si por feriado quedó con menos instancias
 * que las esperadas según su weekday_pattern, intentar agregar la instancia faltante
 * en otro día de la semana donde el titular/subrogante esté disponible.
 */
function applyHolidayRelocation({ result, days, blockTemplates, programAssignments, doctors, bloqueosOverrides, calByDate, absencesByDate, rotation }) {
  const titularByBlock = {}, subrogantesByBlock = {};
  programAssignments.forEach(p => {
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

    // Saneamiento previo: descartar refuerzos guardados que pisen turno/posturno/ausencia,
    // así sortReinforcements los re-asigna en vez de preservar entradas obsoletas.
    for (const day of w.days) {
      const slot = result[weekKey][day.date];
      if (!slot) continue;
      const turnoIds = new Set((day.turnos || []).map(t => t.doctor_id));
      const postIds = new Set((day.posturno || []).map(t => t.doctor_id));
      const ausIds = new Set((day.ausencias || []).map(a => a.doctor_id));
      const invalido = id => id && (
        turnoIds.has(id) || postIds.has(id) || ausIds.has(id) ||
        id === SUBDIRECTOR || id === POLI_FULLDAY
      );
      if (invalido(slot.am)) {
        carga[slot.am] = Math.max(0, (carga[slot.am] || 0) - 1);
        slot.am = null;
      }
      if (invalido(slot.pm)) {
        carga[slot.pm] = Math.max(0, (carga[slot.pm] || 0) - 1);
        if (new Date(day.date).getDay() === 5) {
          cargaViernesPM[slot.pm] = Math.max(0, (cargaViernesPM[slot.pm] || 0) - 1);
        }
        slot.pm = null;
      }
    }

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
      warnings.push({ date: day.date, label: day.label, kind: 'auto_assigned', blockId: b.block_id, doctorId: b.doctor_id,
        message: `${day.label}: "${b.name}" auto-asignado a ${doctorName(b.doctor_id)} — revisar y formalizar como subrogante en el template` });
    });
    // Médico ausente asignado
    const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
    day.bloqueos.filter(b => !b.suspended && b.doctor_id && ausIds.has(b.doctor_id)).forEach(b => {
      errors.push({ date: day.date, label: day.label, kind: 'absent_assigned', blockId: b.block_id, doctorId: b.doctor_id,
        message: `${day.label}: ${doctorName(b.doctor_id)} ausente pero asignado a "${b.name}"` });
    });
    // Refuerzos no definidos
    if (!day.refuerzos.am) warnings.push({ date: day.date, label: day.label, kind: 'missing_am', message: `${day.label}: falta refuerzo AM` });
    if (!day.refuerzos.pm) warnings.push({ date: day.date, label: day.label, kind: 'missing_pm', message: `${day.label}: falta refuerzo PM` });
    // Superposición horaria mismo médico en bloqueos
    const slots = day.bloqueos.filter(b => !b.suspended && b.doctor_id && b.from && b.to);
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[i].doctor_id === slots[j].doctor_id &&
            slots[i].from < slots[j].to && slots[j].from < slots[i].to) {
          if (slots[i].doctor_id === SUBDIRECTOR_ID) continue;
          errors.push({ date: day.date, label: day.label, kind: 'overlap', blockId: slots[i].block_id, blockId2: slots[j].block_id, doctorId: slots[i].doctor_id,
            message: `${day.label}: ${doctorName(slots[i].doctor_id)} con superposición "${slots[i].name}" vs "${slots[j].name}"` });
        }
      }
    }
    // Posturno asignado (warning)
    const postIds = new Set(day.posturno.map(t => t.doctor_id));
    day.bloqueos.filter(b => !b.suspended && b.doctor_id && postIds.has(b.doctor_id)).forEach(b => {
      warnings.push({ date: day.date, label: day.label, kind: 'posturno_assigned', blockId: b.block_id, doctorId: b.doctor_id,
        message: `${day.label}: ${doctorName(b.doctor_id)} en posturno asignado a "${b.name}"` });
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
  const countByBlock = {};
  agenda.forEach(day => {
    if (day.is_holiday) return;
    day.bloqueos.forEach(b => {
      if (b.suspended) return;
      countByBlock[b.block_id] = (countByBlock[b.block_id] || 0) + 1;
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
