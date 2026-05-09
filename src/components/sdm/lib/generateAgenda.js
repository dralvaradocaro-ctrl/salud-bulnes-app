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

  // Día anterior al lunes (para postturno del lunes — mira el viernes de la semana pasada)
  const prevDayDate = new Date(days[0].iso);
  prevDayDate.setDate(prevDayDate.getDate() - 3); // viernes
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

    // Resolver médico por bloque con cascada T → S₁ → S₂ → S₃ ...
    // Excluye médicos en postturno o ausentes (preferir disponibles)
    const resolveDoctor = (blockId) => {
      const t = titularByBlock[blockId];
      const subs = subrogantesByBlock[blockId] || [];
      const candidates = [t, ...subs.map(s => s.doctor_id)].filter(Boolean);
      // Primero intentar uno disponible
      const ausIds = new Set(absencesByDate[d.date]?.map(a => a.doctor_id) || []);
      const available = candidates.find(id => !ausIds.has(id));
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

    // Policlínico full-day: default BELTRÁN si está disponible
    const POLI_FULLDAY_DEFAULT = 'beltran';
    const beltranAusente = ausIds.has(POLI_FULLDAY_DEFAULT) || postIds.has(POLI_FULLDAY_DEFAULT);
    const poliFullDay = beltranAusente ? null : POLI_FULLDAY_DEFAULT;

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
          ? { doctor_id: poliFullDay, from: '08:00', to: isViernes ? '16:00' : '17:00', label: 'Full día' }
          : null,
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
  return { warnings, errors };
}
