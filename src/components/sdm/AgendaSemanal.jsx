import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { sdmSupabase as supabase, explainSdmWriteError, insertOneoffBlock } from './lib/sdmSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, RefreshCw, Save, Printer, Plus, Trash2, Edit3, Sparkles } from 'lucide-react';
import { generateAgenda, validateAgenda, getMondayOfWeek, fmtDate, dayKeyForDate, sortReinforcements, optimizeForTitulars, balanceLoad, HIERARCHICAL_BLOCK_IDS, findReplacementForBlock, blockDoctorIds, blockHasDoctor } from './lib/generateAgenda';
import AIFixModal from './AIFixModal';
import { Shuffle, Wand2, Scale } from 'lucide-react';
import CellEditor from './CellEditor';
import SdmInternalMeetings from './SdmInternalMeetings';

const ABSENCE_TYPES = ['FL', 'P', 'A', 'DT', 'LM', 'CAP', 'PAS', 'G', 'OTRO'];
const ABSENCE_LABELS = {
  FL: 'Feriado Legal', P: 'Postnatal', A: 'Administrativo', DT: 'Devolución Tiempo',
  LM: 'Licencia Médica', CAP: 'Capacitación', PAS: 'Pasantía', OTRO: 'Otro'
};
const EMPTY_EXTERNAL_VISITORS_OVERRIDE = '__empty_external_visitors_override';
const LUNCH_START = 13 * 60 + 30;
const LUNCH_END = 14 * 60;

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function clinicalDurationMinutes(block) {
  const from = timeToMinutes(block.from);
  const to = timeToMinutes(block.to);
  if (from == null || to == null || to <= from) return 0;
  const lunchOverlap = Math.max(0, Math.min(to, LUNCH_END) - Math.max(from, LUNCH_START));
  return (to - from) - lunchOverlap;
}

function addClinicalMinutesSkippingLunch(startMin, clinicalMinutes) {
  let cursor = startMin;
  let remaining = clinicalMinutes;
  while (remaining > 0) {
    if (cursor >= LUNCH_START && cursor < LUNCH_END) {
      cursor = LUNCH_END;
      continue;
    }
    const nextBreak = cursor < LUNCH_START ? LUNCH_START : Infinity;
    const available = Math.max(1, nextBreak - cursor);
    const step = Math.min(remaining, available);
    cursor += step;
    remaining -= step;
  }
  return cursor;
}

export default function AgendaSemanal({ weeklyAgenda, setMonday }) {
  const {
    monday,
    weekStart,
    weekDays,
    weekEnd,
    doctors,
    rotation,
    shiftCalendar,
    setShiftCalendar,
    blockTemplates,
    programAssignments,
    absences,
    setAbsences,
    reinforcements,
    setReinforcements,
    loading,
    bloqueosOverrides,
    setBloqueosOverrides,
    dismissedErrors,
    setDismissedErrors,
    acknowledgedErrors,
    setAcknowledgedErrors,
    poli8amOverrides,
    setPoli8amOverrides,
    visitaOverrides,
    setVisitaOverrides,
    setExternalVisitorOverrides,
    isDirty,
    agenda,
    blockSuggestions,
    reloadOneoff,
    saveAgenda: saveWeeklyAgenda,
  } = weeklyAgenda;
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [newAbs, setNewAbs] = useState({ doctor_id: '', date: '', type: 'A', notes: '' });
  const [editingDay, setEditingDay] = useState(null);
  const [aiError, setAiError] = useState(null); // error que se está corrigiendo con IA
  const [showIssuePanel, setShowIssuePanel] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);   // mostrar las descartadas con opción de restaurar
  const [dragOverDate, setDragOverDate] = useState(null);      // celda BLOQUEOS resaltada durante drag
  const [visitorDragOverDate, setVisitorDragOverDate] = useState(null);
  const [draggedVisitor, setDraggedVisitor] = useState(null);
  const [expandedAddDay, setExpandedAddDay] = useState(null);   // fecha del día con el form (+) expandido

  const confirmIfDirty = (msg = 'Tenés cambios sin guardar en esta semana. ¿Continuar y descartarlos?') => {
    if (!isDirty) return true;
    return window.confirm(msg);
  };

  const validation = useMemo(() => validateAgenda(agenda, doctors, blockTemplates), [agenda, doctors, blockTemplates]);
  const errorKey = (e) => {
    if (!e) return '';
    if (e.kind === 'overlap') {
      const pair = [e.blockId, e.blockId2].filter(Boolean).sort().join('+');
      return `${e.kind}:${e.date}:${e.doctorId || ''}:${pair}`;
    }
    return `${e.kind}:${e.date || ''}:${e.blockId || ''}:${e.doctorId || ''}`;
  };
  const activeIssueKeys = useMemo(() => new Set([...validation.errors, ...validation.warnings].map(errorKey)), [validation]);
  const activeDismissedErrors = useMemo(
    () => dismissedErrors.filter(k => activeIssueKeys.has(k)),
    [dismissedErrors, activeIssueKeys]
  );
  const activeAcknowledgedErrors = useMemo(
    () => acknowledgedErrors.filter(k => activeIssueKeys.has(k)),
    [acknowledgedErrors, activeIssueKeys]
  );
  const acknowledgedSet = useMemo(() => new Set(activeAcknowledgedErrors), [activeAcknowledgedErrors]);
  const hiddenSet = useMemo(() => new Set([...activeDismissedErrors, ...activeAcknowledgedErrors]), [activeDismissedErrors, activeAcknowledgedErrors]);
  const visibleErrors = validation.errors.filter(e => !hiddenSet.has(errorKey(e)));
  const visibleWarnings = validation.warnings.filter(w => !hiddenSet.has(errorKey(w)));
  const hiddenIssues = [...validation.errors, ...validation.warnings].filter(e => hiddenSet.has(errorKey(e)));
  const totalIssues = visibleErrors.length + visibleWarnings.length + hiddenIssues.length;
  const dismissError = (e) => {
    const k = errorKey(e);
    setDismissedErrors(prev => prev.includes(k) ? prev : [...prev, k]);
    setAcknowledgedErrors(prev => prev.filter(x => x !== k));
  };
  const acknowledgeError = (e) => {
    const k = errorKey(e);
    setAcknowledgedErrors(prev => prev.includes(k) ? prev : [...prev, k]);
    setDismissedErrors(prev => prev.filter(x => x !== k));
  };
  const restoreError = (k) => {
    setDismissedErrors(prev => prev.filter(x => x !== k));
    setAcknowledgedErrors(prev => prev.filter(x => x !== k));
  };
  const doctorName = id => doctors.find(d => d.id === id)?.display_name || (id === 'rubilar' ? 'RUBILAR' : id);

  // Auto-prune: si el usuario corrigió el problema, la entrada queda obsoleta
  // en dismissedErrors/acknowledgedErrors. Se eliminan las keys que ya no
  // aparecen en validación activa.
  useEffect(() => {
    setDismissedErrors(prev => {
      const next = prev.filter(k => activeIssueKeys.has(k));
      return next.length === prev.length ? prev : next;
    });
    setAcknowledgedErrors(prev => {
      const next = prev.filter(k => activeIssueKeys.has(k));
      return next.length === prev.length ? prev : next;
    });
  }, [activeIssueKeys, setDismissedErrors, setAcknowledgedErrors]);

  useEffect(() => {
    if (totalIssues === 0) {
      setShowIssuePanel(false);
      setShowDismissed(false);
    }
  }, [totalIssues]);

  function shiftWeek(deltaDays) {
    if (!confirmIfDirty()) return;
    const d = new Date(monday);
    d.setDate(d.getDate() + deltaDays);
    setMonday(d);
  }
  function goToWeek(dateStr) {
    if (!confirmIfDirty()) return;
    setMonday(getMondayOfWeek(new Date(dateStr + 'T12:00:00')));
  }

  async function saveAgenda() {
    // C3: bloquear si hay errores rojos no descartados
    if (visibleErrors.length > 0) {
      const proceed = window.confirm(
        `Hay ${visibleErrors.length} error(es) sin resolver en la agenda:\n\n` +
        visibleErrors.slice(0, 4).map(e => '• ' + e.message).join('\n') +
        (visibleErrors.length > 4 ? `\n• … y ${visibleErrors.length - 4} más` : '') +
        '\n\n¿Guardar de todos modos? (recomendado: corregir o descartar las alertas antes)'
      );
      if (!proceed) return;
    }
    await saveWeeklyAgenda({ hasErrors: visibleErrors.length > 0 });
  }

  async function addAbsence() {
    if (!newAbs.doctor_id || !newAbs.date) return;
    const { error } = await supabase.from('sdm_absences').insert(newAbs);
    if (error) { toast.error("Error: " + (explainSdmWriteError(error) || error.message)); return; }
    const { data } = await supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd);
    setAbsences(data || []);
    setShowAbsenceDialog(false);
    setNewAbs({ doctor_id: '', date: '', type: 'A', notes: '' });
  }

  async function deleteAbsence(id) {
    await supabase.from('sdm_absences').delete().eq('id', id);
    setAbsences(absences.filter(a => a.id !== id));
  }

  async function moveHolidayBlockToNextWeek(issue) {
    const template = blockTemplates.find(bt => bt.id === issue.blockId);
    if (!template || !issue.date) return;
    const sourceDate = new Date(issue.date + 'T12:00:00');
    const targetDate = new Date(sourceDate);
    targetDate.setDate(targetDate.getDate() + 7);
    const dayKey = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][targetDate.getDay()];
    const slot = template.weekday_pattern?.[dayKey]?.[0] || template.monthly_rule || {};
    const payload = {
      week_start: fmtDate(getMondayOfWeek(targetDate)),
      date: fmtDate(targetDate),
      doctor_id: null,
      time_from: slot.from || null,
      time_to: slot.to || null,
      description: `${template.name} (diferido por feriado ${issue.date})`,
      category: template.category || 'otro',
    };
    const { error } = await insertOneoffBlock(payload);
    if (error) {
      toast.error('Error al diferir: ' + (explainSdmWriteError(error) || error.message));
      return;
    }
    dismissError(issue);
    toast.success(`"${template.name}" diferido a ${payload.date}.`);
  }

  function updateReinforcement(date, slot, doctorId) {
    setReinforcements(prev => ({ ...prev, [date]: { ...(prev[date] || {}), [slot]: doctorId || null } }));

    // Si el médico elegido tiene un bloque nominal reasignable ese día → reasignar al subrogante
    if (!doctorId) return;
    const day = agenda.find(d => d.date === date);
    if (!day) return;
    const blkIdx = day.bloqueos.findIndex(b => {
      const ids = Array.isArray(b.doctor_ids) ? b.doctor_ids : (b.doctor_id ? [b.doctor_id] : []);
      return ids.includes(doctorId) && !HIERARCHICAL_BLOCK_IDS.has(b.block_id);
    });
    if (blkIdx === -1) return;
    const blk = day.bloqueos[blkIdx];
    const replacement = findReplacementForBlock({
      blockId: blk.block_id,
      excludeDoctorId: doctorId,
      day,
      programAssignments,
    });
    if (!replacement) {
      toast.warning(`⚠ ${doctorName(doctorId)} tiene "${blk.name}" ese día pero no hay subrogante disponible. Revisá manualmente.`);
      return;
    }
    const prevIds = Array.isArray(blk.doctor_ids) ? blk.doctor_ids : (blk.doctor_id ? [blk.doctor_id] : []);
    const newIds = prevIds.map(id => id === doctorId ? replacement : id);
    if (!newIds.includes(replacement)) newIds.push(replacement);
    const nuevos = day.bloqueos.slice();
    nuevos[blkIdx] = { ...blk, doctor_ids: newIds, doctor_id: newIds[0] || null, reassigned: true, originalDoctor: doctorId };
    setBloqueosOverrides(prev => ({ ...prev, [date]: nuevos }));
    toast.success(`✓ "${blk.name}" reasignado a ${doctorName(replacement)} porque ${doctorName(doctorId)} pasa a refuerzo ${slot.toUpperCase()}.`);
  }

  function equilibrarCarga() {
    if (!confirm('Moverá bloques de días sobrecargados a días con menos carga (respetando turnos/posturnos/ausencias). ¿Continuar?')) return;
    const { agenda: balanced, moves } = balanceLoad({ agenda, blockTemplates });
    if (moves.length === 0) {
      toast.info("La carga ya está bien distribuida o no hay movimientos seguros disponibles.");
      return;
    }
    const overrides = {};
    balanced.forEach(d => { overrides[d.date] = d.bloqueos; });
    setBloqueosOverrides(overrides);
    const summary = moves.slice(0, 5).map(m => `• ${m.block}: ${m.from} → ${m.to}`).join('\n');
    toast.success(`Movidos ${moves.length} bloque(s)`, { description: summary });
  }

  function regenerarPreliminar() {
    if (!confirm('¿Descartar ediciones manuales de bloqueos y volver al template? Los refuerzos AM/PM se mantienen.')) return;
    setBloqueosOverrides({});
  }

  async function sortearRefuerzosMes() {
    if (!confirm('Sorteará refuerzos AM/PM para las próximas 4 semanas, balanceando carga (especialmente viernes PM). ¿Continuar?')) return;
    // Generar 4 semanas a partir del lunes actual
    const semanas = [];
    for (let i = 0; i < 4; i++) {
      const m = new Date(monday);
      m.setDate(monday.getDate() + i * 7);
      const ws = fmtDate(m);
      const we = fmtDate(new Date(m.getTime() + 4 * 86400000));
      const [{ data: cal }, { data: abs }, { data: existAg }] = await Promise.all([
        supabase.from('sdm_shift_calendar').select('*').gte('date', fmtDate(new Date(m.getTime() - 86400000))).lte('date', we),
        supabase.from('sdm_absences').select('*').gte('date', ws).lte('date', we),
        supabase.from('sdm_weekly_agendas').select('data').eq('week_start', ws).maybeSingle(),
      ]);
      const existingReinf = existAg?.data?.reinforcements || {};
      const generated = generateAgenda({
        weekStart: m, doctors, rotation,
        shiftCalendar: cal || [],
        blockTemplates, programAssignments,
        absences: abs || [],
        oneoffBlocks: [],
        manualReinforcements: existingReinf,
      });
      semanas.push({
        weekStart: ws,
        days: generated,
        existingReinforcements: existingReinf,
      });
    }
    // Construir map existing acumulado
    const existing = {};
    semanas.forEach(s => existing[s.weekStart] = s.existingReinforcements);
    const sorteado = sortReinforcements({
      weeks: semanas.map(s => ({ weekStart: s.weekStart, days: s.days })),
      doctors,
      existingReinforcements: existing,
    });
    // Guardar en cada semana afectada
    let saved = 0;
    for (const s of semanas) {
      const newReinf = sorteado[s.weekStart];
      const payload = {
        week_start: s.weekStart,
        data: { reinforcements: newReinf, generated_at: new Date().toISOString() },
        status: 'preliminar',
        updated_at: new Date().toISOString(),
      };
      const { data: existing } = await supabase.from('sdm_weekly_agendas').select('id, data').eq('week_start', s.weekStart).maybeSingle();
      if (existing) {
        await supabase.from('sdm_weekly_agendas').update({
          data: { ...(existing.data || {}), reinforcements: newReinf, updated_at: new Date().toISOString() },
        }).eq('id', existing.id);
      } else {
        await supabase.from('sdm_weekly_agendas').insert(payload);
      }
      if (s.weekStart === weekStart) setReinforcements(newReinf);
      saved++;
    }
    toast.success(`Sorteado refuerzos en  semanas.`);
  }

  async function onCellSave(date, payload) {
    // Compatibilidad: si payload es array (formato legacy), tratar como bloqueos puros.
    if (Array.isArray(payload)) {
      setBloqueosOverrides(prev => ({ ...prev, [date]: payload }));
      toast.success('Cambios aplicados. Guardá la agenda para dejarlos persistidos.');
      return;
    }
    const { bloqueos, is_holiday, external_visitors } = payload;
    const visitorsForStorage = external_visitors.length > 0
      ? external_visitors
      : [{ [EMPTY_EXTERNAL_VISITORS_OVERRIDE]: true }];
    setBloqueosOverrides(prev => ({ ...prev, [date]: bloqueos }));
    setExternalVisitorOverrides(prev => ({ ...prev, [date]: external_visitors }));
    // Persistir is_holiday y external_visitors en sdm_shift_calendar
    const existing = shiftCalendar.find(c => c.date === date);
    if (existing) {
      const { error } = await supabase.from('sdm_shift_calendar')
        .update({ is_holiday, external_visitors: visitorsForStorage })
        .eq('date', date);
      if (error) { toast.error("Error: " + (explainSdmWriteError(error) || error.message)); return; }
      setShiftCalendar(prev => prev.map(c => c.date === date ? { ...c, is_holiday, external_visitors: visitorsForStorage } : c));
    } else {
      console.warn(`No hay entrada en sdm_shift_calendar para ${date}; feriado/visitantes no persistidos.`);
    }
    toast.success('Cambios aplicados. Guardá la agenda para dejarlos persistidos.');
  }

  function moveExternalVisitor(targetDate) {
    if (!draggedVisitor || draggedVisitor.fromDate === targetDate) {
      setDraggedVisitor(null);
      setVisitorDragOverDate(null);
      return;
    }
    const sourceDay = agenda.find(d => d.date === draggedVisitor.fromDate);
    const targetDay = agenda.find(d => d.date === targetDate);
    if (!sourceDay || !targetDay) return;
    const sourceVisitors = Array.isArray(sourceDay.external_visitors) ? sourceDay.external_visitors : [];
    const targetVisitors = Array.isArray(targetDay.external_visitors) ? targetDay.external_visitors : [];
    let sourceNext = sourceVisitors.filter((_, index) => index !== draggedVisitor.index);
    const isRubilar = /rubilar/i.test(draggedVisitor.visitor?.name || '');
    
    const moved = {
      ...draggedVisitor.visitor,
      source: 'manual',
      moved_from: draggedVisitor.fromDate,
      no_show: false,
      holiday_pending: !!targetDay.is_holiday,
    };
    
    const isAlreadyInTarget = targetVisitors.some(v => v.name === moved.name);
    const targetNext = isAlreadyInTarget
      ? [...targetVisitors.filter(v => v.name !== moved.name), moved]
      : [...targetVisitors, moved];

    setExternalVisitorOverrides(prev => ({
      ...prev,
      [draggedVisitor.fromDate]: sourceNext,
      [targetDate]: targetNext,
    }));

    if (isRubilar) {
      setVisitaOverrides(prev => {
        let updated = { ...prev };
        
        // Remove from source day
        const curSource = updated[draggedVisitor.fromDate] || {};
        const removeSource = [...new Set([...(curSource.remove || []), 'rubilar'])];
        const addSource = (curSource.add || []).filter(x => x !== 'rubilar');
        if (addSource.length === 0 && removeSource.length === 0) {
          delete updated[draggedVisitor.fromDate];
        } else {
          updated[draggedVisitor.fromDate] = { add: addSource, remove: removeSource };
        }

        // Add to target day if not holiday
        if (!targetDay.is_holiday) {
          const curTarget = updated[targetDate] || {};
          const addTarget = [...new Set([...(curTarget.add || []), 'rubilar'])];
          const removeTarget = (curTarget.remove || []).filter(x => x !== 'rubilar');
          if (addTarget.length === 0 && removeTarget.length === 0) {
            delete updated[targetDate];
          } else {
            updated[targetDate] = { add: addTarget, remove: removeTarget };
          }
        }

        return updated;
      });
    }

    setDraggedVisitor(null);
    setVisitorDragOverDate(null);
    toast.success(`Especialista movido a ${targetDay.label}. Guardá la agenda para dejarlo persistido.`);
  }

  function applyAiOption(error, opt) {
    if (!error || !opt) return;
    if (opt.action === 'add' && opt.swap_with_day) {
      const targetDay = agenda.find(d => d.date === opt.swap_with_day);
      const template = blockTemplates.find(bt => bt.id === error.blockId);
      if (!targetDay || !template) {
        toast.error('No se pudo encontrar el día o template para agregar el bloqueo.');
        return;
      }
      if (targetDay.is_holiday) {
        toast.error('No se puede agregar en feriado. Elegí otro día.');
        return;
      }
      const targetKey = dayKeyForDate(targetDay.date);
      const slot = template.weekday_pattern?.[targetKey]?.[0]
        || Object.values(template.weekday_pattern || {}).flat()[0]
        || template.monthly_rule
        || {};
      const current = bloqueosOverrides[targetDay.date] ?? targetDay.bloqueos;
      const aiIds = opt.doctor_id ? [opt.doctor_id] : [];
      const newBlock = {
        block_id: template.id,
        name: template.name,
        from: slot.from || null,
        to: slot.to || null,
        doctor_ids: aiIds,
        doctor_id: aiIds[0] || null,
        unassigned: aiIds.length === 0,
        category: template.category || 'otro',
        source: 'ai_added',
        ai_assigned: true,
      };
      setBloqueosOverrides(prev => ({ ...prev, [targetDay.date]: [...current, newBlock] }));
      toast.success(`IA agregó "${template.name}" el ${targetDay.label}. Guardá la agenda para dejarlo persistido.`);
      return;
    }

    const day = agenda.find(d => d.date === error.date);
    if (!day) return;
    const currentBloqueos = bloqueosOverrides[error.date] ?? day.bloqueos;
    const idx = currentBloqueos.findIndex(b => b.block_id === error.blockId);
    if (idx === -1 && opt.action !== 'suspend') return;

    if (opt.action === 'assign' && opt.doctor_id) {
      const nuevos = currentBloqueos.map((b, i) =>
        i === idx ? { ...b, doctor_ids: [opt.doctor_id], doctor_id: opt.doctor_id, unassigned: false, auto_assigned: false, ai_assigned: true } : b
      );
      setBloqueosOverrides(prev => ({ ...prev, [error.date]: nuevos }));
      return;
    }

    if (opt.action === 'suspend') {
      const nuevos = currentBloqueos.map((b, i) =>
        i === idx ? { ...b, suspended: true, suspended_reason: opt.reasoning?.slice(0, 80) || 'Diferido por IA' } : b
      );
      setBloqueosOverrides(prev => ({ ...prev, [error.date]: nuevos }));
      return;
    }

    if (opt.action === 'swap' && opt.swap_with_day) {
      const targetDay = agenda.find(d => d.date === opt.swap_with_day);
      if (!targetDay) { toast.error(`Día destino  no está en esta semana`); return; }
      const original = currentBloqueos[idx];
      const sourceWithout = currentBloqueos.filter((_, i) => i !== idx);
      const targetCurrent = bloqueosOverrides[opt.swap_with_day] ?? targetDay.bloqueos;
      // Si la IA propuso un médico para el nuevo día, aplicarlo; si no, mantener el original.
      const moved = opt.doctor_id
        ? { ...original, doctor_ids: [opt.doctor_id], doctor_id: opt.doctor_id, unassigned: false, source: 'optimized', auto_assigned: false, ai_assigned: true, reassigned: original.doctor_id && original.doctor_id !== opt.doctor_id ? true : original.reassigned, originalDoctor: original.doctor_id && original.doctor_id !== opt.doctor_id ? original.doctor_id : original.originalDoctor }
        : { ...original, source: 'optimized', auto_assigned: false, ai_assigned: true };
      setBloqueosOverrides(prev => ({
        ...prev,
        [error.date]: sourceWithout,
        [opt.swap_with_day]: [...targetCurrent, moved],
      }));
      return;
    }

    toast.error("Acción IA no reconocida: " + opt.action);
  }

  // Agregar bloqueo manual rápido desde el form (+) inline.
  function addBlockInline(date, blk) {
    const day = agenda.find(d => d.date === date);
    if (!day) return;
    const current = bloqueosOverrides[date] ?? day.bloqueos;
    const blkIds = Array.isArray(blk.doctor_ids) && blk.doctor_ids.length
      ? blk.doctor_ids.filter(Boolean)
      : (blk.doctor_id ? [blk.doctor_id] : []);
    const newBlock = {
      block_id: blk.block_id || `oneoff-inline-${Date.now()}`,
      name: blk.name.trim(),
      from: blk.from,
      to: blk.to,
      doctor_ids: blkIds,
      doctor_id: blkIds[0] || null,
      unassigned: blkIds.length === 0,
      category: blk.category || 'otro',
      source: 'manual',
    };
    setBloqueosOverrides(prev => ({ ...prev, [date]: [...current, newBlock] }));
    toast.success('Bloqueo agregado. Guardá la agenda para dejarlo persistido.');
  }

  // Drag-and-drop de bloqueos entre días
  function moveBloqueoBetweenDays(fromDate, blockId, toDate) {
    if (!fromDate || !toDate || fromDate === toDate || !blockId) return;
    const fromDay = agenda.find(d => d.date === fromDate);
    const toDay   = agenda.find(d => d.date === toDate);
    if (!fromDay || !toDay) return;
    const fromCurrent = bloqueosOverrides[fromDate] ?? fromDay.bloqueos;
    const idx = fromCurrent.findIndex(b => b.block_id === blockId);
    if (idx === -1) return;
    const block = fromCurrent[idx];
    const fromNext = fromCurrent.filter((_, i) => i !== idx);
    const toCurrent = bloqueosOverrides[toDate] ?? toDay.bloqueos;
    let moved = { ...block, source: 'moved', auto_assigned: false };
    const sameBlockInstances = toCurrent.filter(b => b.block_id === block.block_id && !b.suspended && b.from && b.to);
    const sameBlockCount = sameBlockInstances.length;
    const blockIds = blockDoctorIds(block);
    const sameDoctorBlocks = toCurrent.filter(b =>
      !b.suspended && b.block_id !== block.block_id &&
      blockIds.some(id => blockHasDoctor(b, id))
    );

    if (sameDoctorBlocks.length > 0) {
      const conflictDoctor = blockIds.find(id => sameDoctorBlocks.some(b => blockHasDoctor(b, id))) || blockIds[0];
      const detail = sameDoctorBlocks
        .slice()
        .sort((a, b) => (a.from || '').localeCompare(b.from || ''))
        .map(b => `• ${b.from || '—'}-${b.to || '—'} ${b.name}`)
        .join('\n');
      const replacement = findReplacementForBlock({
        blockId: block.block_id,
        excludeDoctorId: conflictDoctor,
        day: toDay,
        programAssignments,
      });
      const choice = window.prompt(
        `${doctorName(conflictDoctor)} ya tiene otro bloqueo el ${toDate}:\n\n${detail}\n\n` +
        `Elige una opción:\n` +
        `1 = Mover igual / sumar todo en ese día\n` +
        `2 = Cambiar "${block.name}" a ${replacement ? doctorName(replacement) : 'titular/subrogante disponible (no hay disponible)'}\n` +
        `3 = No hacer el cambio`,
        '1'
      );
      if (choice === null || choice.trim() === '3') return;
      if (choice.trim() === '2') {
        if (!replacement) {
          toast.error('No hay titular/subrogante disponible para ese bloqueo en el día destino.');
          return;
        }
        const newIds = blockIds.map(id => id === conflictDoctor ? replacement : id);
        if (!newIds.includes(replacement)) newIds.push(replacement);
        moved = {
          ...moved,
          doctor_ids: newIds,
          doctor_id: newIds[0] || null,
          unassigned: false,
          reassigned: true,
          originalDoctor: conflictDoctor,
        };
      }
    } else if (sameBlockCount > 0) {
      toast.info(`"${block.name}" ya existe ese día; se sumará la duración saltando almuerzo 13:30-14:00.`);
    }

    // Si el bloque tiene titular y está disponible en el día destino, ofrecer reasignar al titular.
    const titular = programAssignments.find(p => p.block_template_id === blockId && p.role_type === 'titular')?.doctor_id;
    const movedIds = blockDoctorIds(moved);
    if (titular && !movedIds.includes(titular) && !moved.reassigned) {
      const turnoIds = new Set(toDay.turnos.map(t => t.doctor_id));
      const postIds = new Set(toDay.posturno.map(t => t.doctor_id));
      const ausIds = new Set(toDay.ausencias.map(a => a.doctor_id));
      const titularDisponible = !turnoIds.has(titular) && !postIds.has(titular) && !ausIds.has(titular);
      if (titularDisponible) {
        const currentNames = movedIds.map(doctorName).join(' + ') || 'nadie';
        const useTitular = window.confirm(
          `El titular de "${block.name}" (${doctorName(titular)}) está disponible el ${toDate}.\n\n` +
          `Aceptar → ${doctorName(titular)} lo hace (titular)\n` +
          `Cancelar → ${currentNames} lo sigue haciendo`
        );
        if (useTitular) {
          moved = {
            ...moved,
            doctor_ids: [titular],
            doctor_id: titular,
            originalDoctor: movedIds[0] || null,
            reassigned: true,
          };
        }
      }
    }

    const toNext = sameBlockCount > 0
      ? (() => {
          const blocksToMerge = [...sameBlockInstances, moved];
          const earliestStart = Math.min(...blocksToMerge.map(b => timeToMinutes(b.from)).filter(v => v != null));
          const totalClinicalMinutes = blocksToMerge.reduce((sum, b) => sum + clinicalDurationMinutes(b), 0);
          const merged = {
            ...sameBlockInstances[0],
            ...moved,
            from: minutesToTime(earliestStart),
            to: minutesToTime(addClinicalMinutesSkippingLunch(earliestStart, totalClinicalMinutes)),
            merged_duration: true,
            merged_count: blocksToMerge.length,
            source: 'moved',
          };
          return [...toCurrent.filter(b => b.block_id !== block.block_id || b.suspended), merged];
        })()
      : [...toCurrent, moved];

    setBloqueosOverrides(prev => ({
      ...prev,
      [fromDate]: fromNext,
      [toDate]: toNext,
    }));
  }

  function optimizarTitulares() {
    if (!confirm('Reasignará bloques al médico TITULAR cuando esté disponible (mueve a otro día si hace falta). ¿Continuar?')) return;
    const { agenda: optimized, moves } = optimizeForTitulars({
      agenda, blockTemplates, programAssignments,
    });
    const overrides = {};
    optimized.forEach(d => { overrides[d.date] = d.bloqueos; });
    setBloqueosOverrides(overrides);
    if (moves.length === 0) {
      toast.info("Sin cambios — titulares ya están donde corresponde.");
    } else {
      const summary = moves.slice(0, 10).map(m =>
        m.from === m.to
          ? `• ${m.block}: ${m.doctor} (${m.from})`
          : `• ${m.block}: movido ${m.from} → ${m.to} (${m.doctor})`
      ).join('\n');
      toast.success(`Optimizadas ${moves.length} asignaciones`, { description: summary.split('\n').slice(0, 5).join('\n') });
    }
  }

  if (loading) return <div className="p-6 text-slate-500">Cargando catálogos...</div>;
  if (doctors.length === 0) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader><CardTitle className="text-amber-900">Configuración pendiente</CardTitle></CardHeader>
        <CardContent className="text-sm text-amber-900 space-y-2">
          <p>No hay médicos en la BD. Para inicializar:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Ejecutar <code className="bg-amber-100 px-1">supabase/migrations/20260509120000_create_sdm_tables.sql</code> en Supabase Studio.</li>
            <li>Correr <code className="bg-amber-100 px-1">node scripts/seed-sdm-v1.mjs --apply</code></li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body * { visibility: hidden; }
          .sdm-print-area, .sdm-print-area * { visibility: visible; }
          .sdm-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .sdm-print-hide { display: none !important; }
          .sdm-print-only { display: block !important; }
          .sdm-print-area table { font-size: 9px; width: 100%; }
          .sdm-print-area th, .sdm-print-area td { padding: 3px 4px !important; }
        }
        .sdm-print-only { display: none; }
      `}</style>
      {/* Selector semana + acciones */}
      <div className="flex items-center gap-3 flex-wrap sdm-print-hide">
        <Button variant="outline" size="sm" onClick={() => shiftWeek(-7)}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="font-semibold text-slate-700 flex items-center gap-2">
          Semana del {weekDays[0].date} al {weekDays[4].date}
          {isDirty && (
            <span title="Tenés cambios sin guardar" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-800 border border-orange-300 px-1.5 py-0.5 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" /> sin guardar
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => shiftWeek(7)}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => { if (confirmIfDirty()) setMonday(getMondayOfWeek(new Date())); }}>Hoy</Button>
        <Input type="date" className="h-8 w-36 text-xs" value={weekStart} onChange={(e) => e.target.value && goToWeek(e.target.value)} title="Ir a una semana específica" />
        <div className="flex-1" />
        <Button variant="outline" onClick={sortearRefuerzosMes} className="gap-1.5" title="Sortea refuerzos AM/PM para próximas 4 semanas, balanceando carga"><Shuffle className="h-4 w-4" /> Sortear refuerzos</Button>
        <Button variant="outline" onClick={optimizarTitulares} className="gap-1.5" title="Reasigna bloques al titular si está disponible otro día"><Wand2 className="h-4 w-4" /> Optimizar titulares</Button>
        <Button variant="outline" onClick={equilibrarCarga} className="gap-1.5" title="Distribuye los bloques de manera más homogénea entre los días"><Scale className="h-4 w-4" /> Equilibrar carga</Button>
        <Button variant="outline" onClick={regenerarPreliminar} className="gap-1.5" title="Descarta ediciones y vuelve al template"><RefreshCw className="h-4 w-4" /> Regenerar</Button>
        <Button onClick={saveAgenda} className="gap-1.5" title={visibleErrors.length > 0 ? `⚠ ${visibleErrors.length} error(es) sin resolver` : 'Guardar agenda'}>
          <Save className="h-4 w-4" /> Guardar
          {visibleErrors.length > 0 && <span className="ml-1 bg-white text-red-700 text-[10px] font-bold rounded-full px-1.5">{visibleErrors.length}</span>}
        </Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-1.5"><Printer className="h-4 w-4" /> Imprimir</Button>
      </div>

	      {/* Banners de validación — clickeables: abren el editor del día problemático */}
	      {(visibleErrors.length > 0 || visibleWarnings.length > 0 || hiddenIssues.length > 0) && (
	        <Card className={`sdm-print-hide ${visibleErrors.length ? 'border-red-300 bg-red-50' : visibleWarnings.length ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
	          <CardContent className="pt-3 text-sm space-y-2">
	            <div className="flex flex-wrap items-center gap-2">
	              <button
	                onClick={() => setShowIssuePanel(s => !s)}
	                className="inline-flex items-center gap-2 rounded px-1.5 py-1 text-left font-semibold text-slate-800 hover:bg-white/70"
	              >
	                <span className="text-[12px]">{showIssuePanel ? '▼' : '▶'}</span>
	                Alertas de agenda
	              </button>
	              {visibleErrors.length > 0 && (
	                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800 border border-red-200">
	                  {visibleErrors.length} error(es)
	                </span>
	              )}
	              {visibleWarnings.length > 0 && (
	                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
	                  {visibleWarnings.length} aviso(s)
	                </span>
	              )}
	              {hiddenIssues.length > 0 && (
	                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
	                  {hiddenIssues.length} descartada(s)
	                </span>
	              )}
	              <span className="text-xs text-slate-500">
	                {showIssuePanel ? 'Click en una alerta para corregir.' : 'Contraído para dejar más espacio al cronograma.'}
	              </span>
	            </div>
	            {showIssuePanel && (
	              <div className="space-y-1 border-t border-white/60 pt-2">
            {visibleErrors.map((e, i) => {
              const targetDay = e.date ? agenda.find(d => d.date === e.date) : null;
              const isClickable = !!targetDay;
              const aiCapable = (isClickable && ['unassigned', 'absent_assigned', 'overlap', 'auto_assigned'].includes(e.kind))
                || ['weekly_count_short', 'weekly_count_short_unrelocatable'].includes(e.kind);
              return (
                <div key={'e' + i} className="flex items-center gap-2 text-red-800 px-1 -mx-1 hover:bg-red-100 rounded transition-colors">
                  <span
                    onClick={() => isClickable && setEditingDay(targetDay)}
                    className={isClickable ? 'cursor-pointer flex-1' : 'flex-1'}
                    title={isClickable ? 'Click para corregir en el editor del día' : undefined}
                  >
                    ⛔ {e.message}
                    {isClickable && <span className="ml-2 text-[10px] uppercase tracking-wide text-red-500">corregir →</span>}
                  </span>
                  {aiCapable && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); setAiError(e); }}
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700 hover:text-violet-900 hover:bg-violet-100 px-1.5 py-0.5 rounded"
                      title="Pedir sugerencia razonada a la IA"
                    >
                      <Sparkles className="h-3 w-3" /> Sugerir IA
                    </button>
                  )}
                  {e.kind === 'monthly_holiday_skipped' && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); moveHolidayBlockToNextWeek(e); }}
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-1.5 py-0.5 rounded"
                      title="Crear este bloqueo como puntual en la misma jornada de la próxima semana"
                    >
                      Próxima semana
                    </button>
                  )}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); acknowledgeError(e); }}
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 hover:text-amber-900 hover:bg-amber-100 px-1.5 py-0.5 rounded"
                    title="Confirmar igual — entiendo la alerta pero archivo la agenda así. Se persiste al guardar."
                  >
                    ✓ Confirmar igual
                  </button>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); dismissError(e); }}
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-1.5 py-0.5 rounded"
                    title="Descartar alerta (compatible / falso positivo). Se persiste al guardar."
                  >
                    ✕ Descartar
                  </button>
                </div>
              );
            })}
            {visibleWarnings.map((w, i) => {
              const targetDay = w.date ? agenda.find(d => d.date === w.date) : null;
              const isClickable = !!targetDay;
              const aiCapable = (isClickable && ['auto_assigned', 'posturno_assigned', 'outside_jornada'].includes(w.kind))
                || ['weekly_count_short', 'weekly_count_short_unrelocatable'].includes(w.kind);
              return (
                <div key={'w' + i} className="flex items-center gap-2 text-amber-800 px-1 -mx-1 hover:bg-amber-100 rounded transition-colors">
                  <span
                    onClick={() => isClickable && setEditingDay(targetDay)}
                    className={isClickable ? 'cursor-pointer flex-1' : 'flex-1'}
                    title={isClickable ? 'Click para corregir en el editor del día' : undefined}
                  >
                    ⚠️ {w.message}
                    {isClickable && <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-600">corregir →</span>}
                  </span>
                  {aiCapable && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); setAiError(w); }}
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700 hover:text-violet-900 hover:bg-violet-100 px-1.5 py-0.5 rounded"
                      title="Pedir sugerencia razonada a la IA"
                    >
                      <Sparkles className="h-3 w-3" /> Sugerir IA
                    </button>
                  )}
                  {w.kind === 'monthly_holiday_skipped' && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); moveHolidayBlockToNextWeek(w); }}
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-1.5 py-0.5 rounded"
                      title="Crear este bloqueo como puntual en la misma jornada de la próxima semana"
                    >
                      Próxima semana
                    </button>
                  )}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); acknowledgeError(w); }}
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 hover:text-amber-900 hover:bg-amber-100 px-1.5 py-0.5 rounded"
                    title="Confirmar igual — entiendo la alerta pero archivo la agenda así. Se persiste al guardar."
                  >
                    ✓ Confirmar igual
                  </button>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); dismissError(w); }}
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-1.5 py-0.5 rounded"
                    title="Descartar alerta (compatible / falso positivo). Se persiste al guardar."
                  >
                    ✕ Descartar
                  </button>
                </div>
              );
            })}

            {hiddenIssues.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-200">
                <button
                  onClick={() => setShowDismissed(s => !s)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold"
                >
                  {showDismissed ? '▼' : '▶'} {hiddenIssues.length} alerta(s) archivada(s)
                </button>
                {showDismissed && (
                  <div className="mt-1 space-y-0.5">
                    {hiddenIssues.map((d, i) => {
                      const k = errorKey(d);
                      const isAck = acknowledgedSet.has(k);
                      return (
                        <div key={'d' + i} className={`flex items-center gap-2 text-[11px] ${isAck ? 'text-amber-700' : 'text-slate-500 line-through'}`}>
                          <span className="flex-1">{d.message}</span>
                          <span className={`shrink-0 inline-block text-[9px] font-bold uppercase tracking-wide px-1 rounded ${isAck ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-300'} no-underline`}>
                            {isAck ? 'Confirmada igual' : 'Descartada'}
                          </span>
                          <button
                            onClick={() => restoreError(k)}
                            className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-1.5 py-0.5 rounded no-underline"
                          >
                            ↺ Restaurar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
	              </div>
	            )}
	              </div>
	            )}
	          </CardContent>
	        </Card>
	      )}

      {/* Panel de reuniones internas SDM (no se imprimen en agenda final) */}
      <SdmInternalMeetings monday={monday} onChanged={reloadOneoff} />

      {/* Panel de ausencias */}
      <Card className="sdm-print-hide">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Ausencias de la semana ({absences.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAbsenceDialog(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <p className="text-sm text-slate-500">Sin ausencias registradas para la semana.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {absences.map(a => (
                <Badge key={a.id} variant="secondary" className="gap-1.5">
                  {doctorName(a.doctor_id)} · {a.date} · {a.type}
                  <button onClick={() => deleteAbsence(a.id)} className="hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla agenda 5x8 */}
      <div className="sdm-print-area">
      <div className="sdm-print-only mb-2 text-center">
        <h2 className="text-base font-bold text-slate-900">Agenda Semanal · {weekDays[0].date} al {weekDays[4].date}</h2>
      </div>
      <div className="overflow-x-auto rounded-lg border border-emerald-300 print:border-black">
        <table className="min-w-full text-xs">
          <thead className="bg-emerald-700 text-white print:bg-emerald-900">
            <tr>
              <th className="px-2 py-2 text-left">DÍA</th>
              <th className="px-2 py-2 text-left">TURNOS</th>
              <th className="px-2 py-2 text-left">REFUERZOS</th>
              <th className="px-2 py-2 text-left">POSTTURNO</th>
              <th className="px-2 py-2 text-left">AUSENCIAS</th>
              <th className="px-2 py-2 text-left w-72">BLOQUEOS</th>
              <th className="px-2 py-2 text-left">VISITA</th>
              <th className="px-2 py-2 text-left">POLI 8 AM</th>
              <th className="px-2 py-2 text-left">POLICLÍNICO</th>
            </tr>
          </thead>
          <tbody>
            {agenda.map(day => (
              <tr key={day.date} className="border-b border-slate-200 align-top hover:bg-slate-50">
	                <td
	                  className={`px-2 py-2 font-bold text-slate-800 transition-colors ${visitorDragOverDate === day.date ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : ''}`}
	                  onDragOver={(e) => {
	                    if (!draggedVisitor) return;
	                    e.preventDefault();
	                    e.dataTransfer.dropEffect = 'move';
	                    setVisitorDragOverDate(day.date);
	                  }}
	                  onDragLeave={() => {
	                    if (visitorDragOverDate === day.date) setVisitorDragOverDate(null);
	                  }}
	                  onDrop={(e) => {
	                    if (!draggedVisitor) return;
	                    e.preventDefault();
	                    moveExternalVisitor(day.date);
	                  }}
	                >
	                  {day.label}
	                  <div className="text-[10px] font-normal text-slate-500">{day.date}<br/>T{day.turnoNumber ?? '–'}</div>
                  {day.is_holiday && (
                    <div className="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-slate-200 text-slate-700">Feriado</div>
                  )}
	                  {Array.isArray(day.external_visitors) && day.external_visitors.length > 0 && (
	                    <div className="mt-1 space-y-0.5">
		                      {day.external_visitors.map((v, i) => (
		                        <div
		                          key={i}
		                          draggable
		                          onDragStart={(e) => {
		                            e.stopPropagation();
		                            setDraggedVisitor({ fromDate: day.date, index: i, visitor: v });
		                            e.dataTransfer.effectAllowed = 'move';
		                            e.dataTransfer.setData('application/sdm-external-visitor', JSON.stringify({ fromDate: day.date, index: i }));
		                          }}
		                          onDragEnd={() => {
		                            setDraggedVisitor(null);
		                            setVisitorDragOverDate(null);
		                          }}
		                          className={`text-[9px] font-normal leading-tight rounded px-1 py-0.5 -mx-1 cursor-grab active:cursor-grabbing ${
		                            v.holiday_pending || v.no_show
			                              ? 'sdm-print-hide bg-amber-100 text-amber-900 border border-amber-200'
			                              : 'text-blue-700 hover:bg-blue-50'
		                          }`}
			                          title={v.no_show ? 'Especialista marcado como no viene. No se imprime.' : v.holiday_pending ? 'Arrastrar para mover desde feriado. No se imprime.' : 'Arrastrar para mover especialista a otro día'}
			                        >
		                          <span className="font-semibold">{v.name}</span>{v.specialty ? ` · ${v.specialty}` : ''}
		                          {v.no_show ? <span className="ml-1 font-semibold">no viene</span> : v.holiday_pending && <span className="ml-1 font-semibold">feriado/revisar</span>}
		                        </div>
	                      ))}
	                    </div>
                  )}
                </td>
                <td className="px-2 py-2">{day.turnos.map((t, i) => <div key={i}>{doctorName(t.doctor_id)}{t.replaced && <span className="text-amber-600 sdm-print-hide"> (←{doctorName(t.original_doctor_id)})</span>}</div>)}</td>
                <td className="px-2 py-2 space-y-1">
                  {day.is_holiday ? <span className="text-slate-300 italic text-[11px]">–</span> : (() => {
                    const turnoIds = new Set(day.turnos.map(t => t.doctor_id));
                    const postIds = new Set(day.posturno.map(t => t.doctor_id));
                    const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
                    const hierarchicalDocs = new Set();
                    day.bloqueos.filter(b => HIERARCHICAL_BLOCK_IDS.has(b.block_id))
                      .forEach(b => blockDoctorIds(b).forEach(id => hierarchicalDocs.add(id)));
                    const nominalDocs = new Map();
                    day.bloqueos.filter(b => !HIERARCHICAL_BLOCK_IDS.has(b.block_id))
                      .forEach(b => blockDoctorIds(b).forEach(id => { if (!nominalDocs.has(id)) nominalDocs.set(id, b.name); }));
                    const eligible = doctors.filter(doc =>
                      !turnoIds.has(doc.id) && !postIds.has(doc.id) && !ausIds.has(doc.id) && !hierarchicalDocs.has(doc.id));
                    // AM/PM mutuamente excluyentes: el médico ya elegido en un slot no aparece en el otro.
                    const eligibleAM = eligible.filter(d => d.id !== day.refuerzos.pm);
                    const eligiblePM = eligible.filter(d => d.id !== day.refuerzos.am);
                    const renderItem = d => (
                      <SelectItem key={d.id} value={d.id} className={nominalDocs.has(d.id) ? 'text-amber-700' : ''}>
                        {d.display_name}
                        {nominalDocs.has(d.id) && <span className="text-[10px] ml-2 text-amber-600">(tiene {nominalDocs.get(d.id)})</span>}
                      </SelectItem>
                    );
                    return (
                      <>
                        <div className="flex items-center gap-1 sdm-print-hide">
                          <span className="text-[9px] font-bold text-slate-500 w-5">AM</span>
                          <Select value={day.refuerzos.am || ''} onValueChange={v => updateReinforcement(day.date, 'am', v)}>
                            <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-28"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>{eligibleAM.map(renderItem)}</SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1 sdm-print-hide">
                          <span className="text-[9px] font-bold text-slate-500 w-5">PM</span>
                          <Select value={day.refuerzos.pm || ''} onValueChange={v => updateReinforcement(day.date, 'pm', v)}>
                            <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-28"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>{eligiblePM.map(renderItem)}</SelectContent>
                          </Select>
                        </div>
                        {/* Versión print: solo texto */}
                        <div className="sdm-print-only">
                          <div><span className="font-bold mr-1">AM</span>{day.refuerzos.am ? doctorName(day.refuerzos.am) : '—'}</div>
                          <div><span className="font-bold mr-1">PM</span>{day.refuerzos.pm ? doctorName(day.refuerzos.pm) : '—'}</div>
                        </div>
                      </>
                    );
                  })()}
                </td>
                <td className="px-2 py-2 text-slate-600">{day.posturno.map((t, i) => <div key={i}>{doctorName(t.doctor_id)}</div>)}</td>
                <td className="px-2 py-2">{day.ausencias.map((a, i) => <div key={i} className="text-red-700">{doctorName(a.doctor_id)} ({a.type})</div>)}</td>
                <td
                  className={`px-2 py-2 group cursor-pointer transition-colors ${dragOverDate === day.date ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' : 'hover:bg-blue-50/50'}`}
                  onClick={() => setEditingDay(day)}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverDate(day.date); }}
                  onDragLeave={(e) => { if (dragOverDate === day.date) setDragOverDate(null); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDate(null);
                    try {
                      const payload = JSON.parse(e.dataTransfer.getData('application/sdm-block'));
                      moveBloqueoBetweenDays(payload.fromDate, payload.blockId, day.date);
                    } catch (_) { /* drop inválido */ }
                  }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 space-y-0.5">
                      {day.is_holiday ? (
                        <span className="inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-slate-200 text-slate-700">FERIADO</span>
                      ) : day.bloqueos.length === 0 ? <span className="text-slate-400 italic">Sin bloqueos · click para agregar</span> :
                        day.bloqueos.slice().sort((x, y) => (x.from || '').localeCompare(y.from || '')).map((b, i) => {
                          const colorClass = b.sdm_internal
                            ? 'text-violet-700'
                            : b.suspended
                              ? 'text-slate-400 line-through opacity-70'
                              : b.unassigned
                                ? 'text-red-600 font-semibold'
                                : b.auto_assigned
                                  ? 'text-blue-700'
                                  : b.reassigned
                                    ? 'text-amber-700'
                                    : 'text-slate-700';
                          const extraClass = b.sdm_internal ? 'sdm-print-hide bg-violet-50 rounded px-1 -mx-0.5' : '';
                          return (
                            <div
                              key={i}
                              draggable={!b.suspended && !b.sdm_internal}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('application/sdm-block', JSON.stringify({ fromDate: day.date, blockId: b.block_id }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-[11px] ${colorClass} ${extraClass} ${!b.suspended && !b.sdm_internal ? 'cursor-grab active:cursor-grabbing rounded hover:bg-blue-100/40 px-0.5 -mx-0.5' : ''}`}
                              title={b.sdm_internal ? 'Reunión interna SDM (no se imprime)' : !b.suspended ? 'Arrastrar a otro día para mover este bloqueo' : undefined}
                            >
                              {b.from && b.to ? `${b.from}–${b.to} ` : ''}
                              {b.sdm_internal ? (
                                <>
                                  <span className="inline-block text-[8px] font-bold uppercase tracking-wide bg-violet-200 text-violet-900 rounded px-1 mr-1">SDM</span>
                                  <span>{b.name}</span>
                                </>
                              ) : (
                                <>
                                  {(() => {
                                    const ids = blockDoctorIds(b);
                                    return ids.length ? ids.map(doctorName).join(' + ') : (b.suspended ? '' : '⚠ SIN ASIGNAR');
                                  })()} <span className={b.suspended ? '' : 'text-slate-500'}>{b.name}</span>
                                </>
                              )}
                              {b.suspended && (
                                <span className="ml-1 text-[9px] bg-slate-200 text-slate-700 border border-slate-400 px-1 rounded no-underline" title={b.suspended_reason || 'Bloqueo suspendido / diferido'}>diferido</span>
                              )}
                              {!b.suspended && b.auto_assigned && (
                                <span className="ml-1 text-[9px] bg-blue-100 text-blue-800 px-1 rounded sdm-print-hide" title="Asignado automáticamente porque titular y subrogantes no están disponibles — revisar y formalizar.">auto</span>
                              )}
                              {!b.suspended && b.reassigned && (
                                <span className="ml-1 text-[9px] bg-amber-100 text-amber-800 px-1 rounded sdm-print-hide" title={`Originalmente: ${doctorName(b.originalDoctor)}`}>reasig</span>
                              )}
                            </div>
                          );
                        })
                      }
                      {/* Botón (+) inline para agregar un bloqueo rápido sin abrir el modal */}
                      {!day.is_holiday && (
                        <div className="sdm-print-hide mt-1.5" onClick={(e) => e.stopPropagation()}>
                          {expandedAddDay === day.date ? (
                            <QuickAddBlockForm
                              doctors={doctors}
                              blockSuggestions={blockSuggestions}
                              onSave={(blk) => { addBlockInline(day.date, blk); setExpandedAddDay(null); }}
                              onCancel={() => setExpandedAddDay(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setExpandedAddDay(day.date)}
                              className="text-[10px] text-slate-400 hover:text-blue-600 hover:underline"
                              title="Agregar un bloqueo manual para este día"
                            >+ Agregar bloqueo</button>
                          )}
                        </div>
                      )}
                    </div>
                    <Edit3 className="h-3 w-3 text-slate-300 group-hover:text-blue-500 mt-1 flex-shrink-0 sdm-print-hide" />
                  </div>
                </td>
                <td className="px-2 py-2 text-[11px]">
                  {day.is_holiday
                    ? <span className="text-slate-300 italic">–</span>
                    : (() => {
                        const turnoIds = new Set(day.turnos.map(t => t.doctor_id));
                        const postIds = new Set(day.posturno.map(t => t.doctor_id));
                        const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
                        const visitaIds = new Set(day.visita.map(v => v.doctor_id));
                        const addibles = doctors.filter(d =>
                          d.active !== false && !visitaIds.has(d.id) &&
                          !turnoIds.has(d.id) && !postIds.has(d.id) && !ausIds.has(d.id)
                        );
                        const cleanupEmpty = (prev, next) => {
                          if (!(next.add?.length) && !(next.remove?.length)) {
                            const { [day.date]: _, ...rest } = prev;
                            return rest;
                          }
                          return { ...prev, [day.date]: next };
                        };
                        const removeManual = (docId) => setVisitaOverrides(prev => {
                          const cur = prev[day.date] || {};
                          const next = { ...cur, add: (cur.add || []).filter(x => x !== docId) };
                          return cleanupEmpty(prev, next);
                        });
                        const addManual = (docId) => setVisitaOverrides(prev => {
                          const cur = prev[day.date] || {};
                          const add = [...(cur.add || []), docId];
                          // si estaba en remove, sacarlo de ahí
                          const remove = (cur.remove || []).filter(x => x !== docId);
                          return { ...prev, [day.date]: { ...cur, add, remove } };
                        });
                        const hideAuto = (docId) => setVisitaOverrides(prev => {
                          const cur = prev[day.date] || {};
                          const remove = [...new Set([...(cur.remove || []), docId])];
                          const next = { ...cur, remove };
                          return cleanupEmpty(prev, next);
                        });
                        return (
                          <>
                            {day.visita.slice(0, 8).map((v, i) => (
                              <div key={i} className="flex items-center gap-1 group/v">
                                <span>
                                  {doctorName(v.doctor_id)}
                                  {v.capacity != null && v.capacity < 5 && <span className="ml-1 text-slate-500">({v.capacity})</span>}
                                </span>
                                {v.manual ? (
                                  <>
                                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded sdm-print-hide">manual</span>
                                    <button
                                      onClick={() => removeManual(v.doctor_id)}
                                      className="sdm-print-hide text-red-500 hover:text-red-700 text-[11px] leading-none"
                                      title="Quitar excepción manual"
                                    >×</button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => hideAuto(v.doctor_id)}
                                    className="sdm-print-hide text-slate-300 hover:text-red-600 text-[11px] leading-none opacity-0 group-hover/v:opacity-100"
                                    title="Eliminar de la visita de este día"
                                  >×</button>
                                )}
                              </div>
                            ))}
                            {addibles.length > 0 && (
                              <div className="sdm-print-hide mt-1">
                                <Select value="" onValueChange={v => v && addManual(v)}>
                                  <SelectTrigger className="h-5 text-[9px] px-1 py-0 w-28 border-dashed border-slate-300 text-slate-500">
                                    <SelectValue placeholder="+ Agregar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {addibles.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </>
                        );
                      })()
                  }
                </td>
                <td className="px-2 py-2 text-[11px]">
                  {day.is_holiday
                    ? <span className="text-slate-300 italic">–</span>
                    : day.policlinico
                      ? <div><span className="font-semibold">{doctorName(day.policlinico.doctor_id)}</span> <span className="text-slate-500">{day.policlinico.from}–{day.policlinico.to}</span></div>
                      : <span className="text-slate-400 italic">Sin refuerzo AM</span>}
                </td>
                <td className="px-2 py-2 text-[11px] space-y-0.5">
                  {day.is_holiday ? <span className="text-slate-300 italic">–</span> : <>
                  {day.poli_8am.full_day && (
                    <div className={day.poli_8am.full_day.isOverride ? 'text-amber-700' : ''}>
                      <span className="font-semibold">{doctorName(day.poli_8am.full_day.doctor_id)}</span>{' '}
                      <span className="text-slate-500">{day.poli_8am.full_day.from}–{day.poli_8am.full_day.to}</span>
                      {day.poli_8am.full_day.isOverride && <span className="ml-1 text-[9px] bg-amber-100 text-amber-800 px-1 rounded sdm-print-hide">manual</span>}
                    </div>
                  )}
                  {day.poli_8am.full_day_editable && !day.poli_8am.full_day && (() => {
                    const turnoIds = new Set(day.turnos.map(t => t.doctor_id));
                    const postIds = new Set(day.posturno.map(t => t.doctor_id));
                    const ausIds = new Set(day.ausencias.map(a => a.doctor_id));
                    const eligible = doctors.filter(d => !turnoIds.has(d.id) && !postIds.has(d.id) && !ausIds.has(d.id));
                    return (
                      <div className="sdm-print-hide">
                        <Select value="" onValueChange={v => setPoli8amOverrides(prev => ({ ...prev, [day.date]: v }))}>
                          <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-28 border-amber-300 bg-amber-50">
                            <SelectValue placeholder="Beltrán ausente · elegir" />
                          </SelectTrigger>
                          <SelectContent>{eligible.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    );
                  })()}
                  {day.poli_8am.full_day?.isOverride && (
                    <button onClick={() => setPoli8amOverrides(prev => { const n = { ...prev }; delete n[day.date]; return n; })}
                      className="text-[9px] text-slate-400 hover:text-red-600 sdm-print-hide">limpiar</button>
                  )}
                  {day.poli_8am.ref_pm && (
                    <div><span className="font-semibold">{doctorName(day.poli_8am.ref_pm.doctor_id)}</span> <span className="text-slate-500">{day.poli_8am.ref_pm.from}–{day.poli_8am.ref_pm.to}</span></div>
                  )}
                  {!day.poli_8am.full_day && !day.poli_8am.ref_pm && !day.poli_8am.full_day_editable && <span className="text-slate-400 italic">–</span>}
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* CellEditor de bloqueos */}
      <CellEditor
        open={!!editingDay}
        onOpenChange={open => { if (!open) setEditingDay(null); }}
        day={editingDay}
        bloqueos={editingDay ? agenda.find(d => d.date === editingDay.date)?.bloqueos || [] : []}
        doctors={doctors}
        blockSuggestions={blockSuggestions}
        onSave={nuevos => onCellSave(editingDay.date, nuevos)}
      />

      {/* Modal IA — Sugerencias para corregir errores */}
      <AIFixModal
        open={!!aiError}
        onOpenChange={open => { if (!open) setAiError(null); }}
        error={aiError}
        agenda={agenda}
        doctors={doctors}
        blockTemplates={blockTemplates}
        programAssignments={programAssignments}
        onApply={(opt) => applyAiOption(aiError, opt)}
      />

      {/* Dialog agregar ausencia */}
      <Dialog open={showAbsenceDialog} onOpenChange={setShowAbsenceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agregar ausencia</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Médico</label>
              <Select value={newAbs.doctor_id} onValueChange={v => setNewAbs({ ...newAbs, doctor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Elegir…" /></SelectTrigger>
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Fecha</label>
              <Input type="date" value={newAbs.date} onChange={e => setNewAbs({ ...newAbs, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Tipo</label>
              <Select value={newAbs.type} onValueChange={v => setNewAbs({ ...newAbs, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ABSENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t} — {ABSENCE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Notas (opcional)</label>
              <Input value={newAbs.notes} onChange={e => setNewAbs({ ...newAbs, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbsenceDialog(false)}>Cancelar</Button>
            <Button onClick={addAbsence}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Form inline expandible para agregar un bloqueo rápido a un día sin abrir CellEditor.
 * Renderiza una fila compacta: nombre + desde + hasta + médico + ✓ + ×.
 */
function QuickAddBlockForm({ doctors, blockSuggestions = [], onSave, onCancel }) {
  const [blockId, setBlockId] = useState('');
  const [name, setName] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [doctorIds, setDoctorIds] = useState([]);
  const [category, setCategory] = useState('otro');
  const valid = name.trim() && from && to && from < to;
  const disabledReason = !name.trim()
    ? 'Escribe un programa'
    : !from || !to
      ? 'Completa desde y hasta'
      : from >= to
        ? 'La hora de inicio debe ser anterior a la hora de término'
        : '';
  const updateName = (value) => {
    const suggestion = blockSuggestions.find(s => s.matchValue === value.trim().toLowerCase());
    setName(suggestion?.name || value);
    setBlockId(suggestion?.blockId || '');
    setCategory(suggestion?.category || 'otro');
  };
  const save = () => {
    if (!valid) return;
    onSave({
      block_id: blockId,
      name: name.trim(),
      from, to,
      doctor_ids: doctorIds,
      doctor_id: doctorIds[0] || null,
      category,
    });
  };
  return (
    <div className="flex flex-wrap items-center gap-1 rounded border border-blue-300 bg-blue-50/40 px-1.5 py-1">
      <Input
        value={name}
        onChange={e => updateName(e.target.value)}
        placeholder="ECICEP, Cardiovascular"
        className="h-6 text-[10px] px-1.5 py-0 w-28"
        list="sdm-quick-block-suggestions"
        autoFocus
      />
      <Input
        type="time"
        value={from}
        onChange={e => setFrom(e.target.value)}
        className="h-6 text-[10px] px-1 py-0 w-20"
      />
      <Input
        type="time"
        value={to}
        onChange={e => setTo(e.target.value)}
        className="h-6 text-[10px] px-1 py-0 w-20"
      />
      <div className="flex flex-wrap items-center gap-1">
        {doctorIds.map(id => {
          const d = doctors.find(x => x.id === id);
          return (
            <span key={id} className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 rounded px-1 inline-flex items-center gap-0.5">
              {d?.display_name || id}
              <button type="button" onClick={() => setDoctorIds(doctorIds.filter(x => x !== id))} className="hover:bg-blue-200 rounded leading-none">×</button>
            </span>
          );
        })}
        <Select value="" onValueChange={v => { if (v && !doctorIds.includes(v)) setDoctorIds([...doctorIds, v]); }}>
          <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-24"><SelectValue placeholder={doctorIds.length ? '+ Otro' : 'Médico'} /></SelectTrigger>
          <SelectContent>{doctors.filter(d => !doctorIds.includes(d.id)).map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <button
        onClick={save}
        disabled={!valid}
        className={`text-[12px] leading-none px-1.5 py-0.5 rounded ${valid ? 'text-emerald-700 hover:bg-emerald-100' : 'text-slate-300 cursor-not-allowed'}`}
        title={valid ? 'Guardar bloqueo' : disabledReason}
      >✓</button>
      <button
        onClick={onCancel}
        className="text-[12px] leading-none px-1.5 py-0.5 rounded text-red-600 hover:bg-red-100"
        title="Cancelar"
      >×</button>
      {from && to && from >= to && (
        <span className="basis-full text-[10px] leading-tight text-red-700">
          Desde debe ser menor que Hasta.
        </span>
      )}
      <datalist id="sdm-quick-block-suggestions">
        {blockSuggestions.map(s => <option key={s.key} value={s.value} />)}
      </datalist>
    </div>
  );
}
