import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { sdmSupabase as supabase, explainSdmWriteError, insertOneoffBlock } from './lib/sdmSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, RefreshCw, Save, Printer, Plus, Trash2, Edit3, Sparkles, Download, FileText } from 'lucide-react';
import { generateAgenda, validateAgenda, getMondayOfWeek, fmtDate, dayKeyForDate, sortReinforcements, optimizeForTitulars, balanceLoad, HIERARCHICAL_BLOCK_IDS, findReplacementForBlock, blockDoctorIds, blockHasDoctor } from './lib/generateAgenda';
import AIFixModal from './AIFixModal';
import { Shuffle, Wand2, Scale } from 'lucide-react';
import CellEditor from './CellEditor';
import SdmInternalMeetings from './SdmInternalMeetings';
import SdmHistoryDialog from './SdmHistoryDialog';
import TimeInput24h from './TimeInput24h';
import DateInputDdmm from './DateInputDdmm';
import { getSdmEditor } from './lib/sdmEditHistory';

const ABSENCE_TYPES = ['FL', 'P', 'A', 'DT', 'LM', 'CAP', 'PAS', 'G', 'OTRO'];

// Formato DD-MM-AAAA a partir de YYYY-MM-DD
function ddmm(d) {
  if (!d) return '';
  const m = String(d).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}
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
    poliDisabled,
    setPoliDisabled,
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
  const [showHistory, setShowHistory] = useState(false);        // modal de historial de ediciones
  const [editingVisitor, setEditingVisitor] = useState(null);   // { name } — pill clickeado para editar semana
  // Stats de refuerzos del año en curso, para alertar en el dropdown cuando un médico
  // supera 15% del total acumulado. Se carga una vez al montar/cambiar de semana.
  const [yearReinfStats, setYearReinfStats] = useState({ totalPM: 0, totalPMVie: 0, perDoctor: {} });

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

  // Para destacar visualmente cada bloque con conflicto/warning en la columna
  // Bloqueos sin abrir el editor. Las claves son `${date}|${blockId}`.
  // Los issues acknowledged/dismissed se ignoran (el usuario ya los archivó).
  const { blockErrorKeys, blockWarningKeys } = useMemo(() => {
    const errs = new Set();
    const warns = new Set();
    const archivedKeys = new Set([...dismissedErrors, ...acknowledgedErrors]);
    const addBlocks = (target, e) => {
      if (!e.date || archivedKeys.has(errorKey(e))) return;
      if (e.blockId)  target.add(`${e.date}|${e.blockId}`);
      if (e.blockId2) target.add(`${e.date}|${e.blockId2}`);
    };
    validation.errors.forEach(e => addBlocks(errs, e));
    validation.warnings
      .filter(w => ['overlap', 'posturno_assigned', 'outside_jornada'].includes(w.kind))
      .forEach(w => addBlocks(warns, w));
    return { blockErrorKeys: errs, blockWarningKeys: warns };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation, dismissedErrors, acknowledgedErrors]);
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

  // Carga el histórico anual de refuerzos para calcular porcentajes por
  // médico (PM y PM viernes). Se usa en el dropdown del refuerzo para
  // marcar en rojo los que ya superan 15% del total.
  useEffect(() => {
    let alive = true;
    (async () => {
      const yearStart = `${monday.getFullYear()}-01-01`;
      const yearEnd = `${monday.getFullYear()}-12-31`;
      const { data, error } = await supabase
        .from('sdm_weekly_agendas')
        .select('week_start, data')
        .gte('week_start', yearStart)
        .lte('week_start', yearEnd);
      if (!alive || error) return;
      let totalPM = 0;
      let totalPMVie = 0;
      const perDoctor = {};
      (data || []).forEach(row => {
        const reinf = row?.data?.reinforcements || {};
        Object.entries(reinf).forEach(([date, slots]) => {
          if (!slots?.pm) return;
          const isVie = new Date(date + 'T12:00:00').getDay() === 5;
          totalPM++;
          if (isVie) totalPMVie++;
          if (!perDoctor[slots.pm]) perDoctor[slots.pm] = { pm: 0, pmVie: 0 };
          perDoctor[slots.pm].pm++;
          if (isVie) perDoctor[slots.pm].pmVie++;
        });
      });
      setYearReinfStats({ totalPM, totalPMVie, perDoctor });
    })();
    return () => { alive = false; };
  }, [weekStart, monday]);

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

  // Construye el HTML de la tabla de agenda (con colores y estructura) que se
  // usa tanto para descargar .doc como para copiar al portapapeles y pegar
  // en Google Docs. Devuelve { table, doc, plain } —
  //   table: solo la tabla (ideal para Clipboard API → pegar en Doc existente)
  //   doc:   HTML completo con shell (para .doc / Word)
  //   plain: versión texto plano como fallback del portapapeles
  // Si un bloque cubre a todos los medicos elegibles del dia (excluye los
  // que estan en turno/posturno/ausencia/refuerzos/poli full-day), mostrarlo
  // como "TODOS" en vez de listar nombres uno por uno.
  function isAllDoctorsBlock(block, day) {
    const ids = blockDoctorIds(block);
    if (ids.length < 4) return false; // umbral minimo para evitar falsos positivos
    const refAm = day?.refuerzos?.am;
    const refPm = day?.refuerzos?.pm;
    const poliFull = day?.poli_8am?.full_day?.doctor_id;
    const turnoIds = new Set((day?.turnos || []).map(t => t.doctor_id));
    const postIds = new Set((day?.posturno || []).map(t => t.doctor_id));
    const ausIds = new Set((day?.ausencias || []).map(a => a.doctor_id));
    const eligible = (doctors || []).filter(d =>
      d.active !== false && !d.is_urgentologist &&
      !turnoIds.has(d.id) && !postIds.has(d.id) && !ausIds.has(d.id) &&
      d.id !== refAm && d.id !== refPm && d.id !== poliFull
    );
    if (eligible.length === 0) return false;
    return eligible.every(d => ids.includes(d.id));
  }

  function buildAgendaHtml() {
    const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const ddmm = (iso) => iso ? `${iso.slice(8,10)}-${iso.slice(5,7)}-${iso.slice(0,4)}` : '';
    const cellStyle = 'border:1px solid #cbd5e1; padding:4px 6px; vertical-align:top; font-size:9pt;';
    const colStyle = {
      refuerzos: 'color:#c2410c; font-weight:600;',
      posturno:  'color:#0284c7; font-weight:600;',
      ausencias: 'color:#b91c1c; font-weight:600;',
    };
    const headStyle = 'background:#047857; color:#ffffff; padding:6px 6px; border:1px solid #065f46; font-size:9pt; text-align:left;';
    const rows = (agenda || []).map(d => {
      const turnos = (d.turnos || [])
        .map(t => `${esc(doctorName(t.doctor_id))}${t.replaced ? ` (←${esc(doctorName(t.original_doctor_id))})` : ''}`)
        .join('<br/>');
      const refuerzos = `<div><b>AM</b> ${d.refuerzos?.am ? esc(doctorName(d.refuerzos.am)) : '—'}</div>` +
                       `<div><b>PM</b> ${d.refuerzos?.pm ? esc(doctorName(d.refuerzos.pm)) : '—'}</div>`;
      const posturno = (d.posturno || []).map(t => esc(doctorName(t.doctor_id))).join('<br/>');
      const ausencias = (d.ausencias || []).map(a => `${esc(doctorName(a.doctor_id))} (${esc(a.type)})`).join('<br/>');
      const bloqueos = d.is_holiday
        ? '<b>FERIADO</b>'
        : (d.bloqueos || [])
            .slice()
            .sort((x, y) => (x.from || '').localeCompare(y.from || ''))
            .map(b => {
              if (b.suspended) return null;
              const ids = Array.isArray(b.doctor_ids) && b.doctor_ids.length
                ? b.doctor_ids : (b.doctor_id ? [b.doctor_id] : []);
              let docs;
              if (!ids.length) docs = '⚠ SIN ASIGNAR';
              else if (isAllDoctorsBlock(b, d)) docs = '<b>TODOS</b>';
              else docs = ids.map(id => esc(doctorName(id))).join(' + ');
              const hora = b.from && b.to ? `${b.from}–${b.to} ` : '';
              return `${hora}${docs} <span style="color:#475569;">${esc(b.name)}</span>`;
            })
            .filter(Boolean)
            .join('<br/>');
      const visita = d.is_holiday
        ? '—'
        : (d.visita || [])
            .map(v => `${esc(doctorName(v.doctor_id))}${v.capacity != null && v.capacity < 5 ? ` (${v.capacity})` : ''}`)
            .join('<br/>');
      const poli8amFullDay = d.poli_8am?.full_day
        ? `<div>${esc(doctorName(d.poli_8am.full_day.doctor_id))} <span style="color:#475569;">${d.poli_8am.full_day.from}–${d.poli_8am.full_day.to}</span></div>`
        : '';
      const poli8amRefPm = d.poli_8am?.ref_pm
        ? `<div>${esc(doctorName(d.poli_8am.ref_pm.doctor_id))} <span style="color:#475569;">${d.poli_8am.ref_pm.from}–${d.poli_8am.ref_pm.to}</span></div>`
        : '';
      const poli8am = d.is_holiday ? '—' : (poli8amFullDay + poli8amRefPm) || '—';
      const policlinico = d.is_holiday
        ? '—'
        : d.policlinico
          ? `${esc(doctorName(d.policlinico.doctor_id))} <span style="color:#475569;">${d.policlinico.from}–${d.policlinico.to}</span>`
          : '—';
      const visitorsList = (Array.isArray(d.external_visitors) ? d.external_visitors : [])
        .filter(v => v && !v.no_show && !v.holiday_pending && !v[EMPTY_EXTERNAL_VISITORS_OVERRIDE])
        .map(v => `<div style="font-weight:normal; color:#334155; font-size:7.5pt; margin-top:2px;">${esc(v.name || '')}${v.specialty ? ` <span style="color:#64748b;">${esc(v.specialty)}</span>` : ''}</div>`)
        .join('');
      return `<tr>
        <td style="${cellStyle} font-weight:bold; background:#f8fafc; width:88px;">${esc(d.label)}<br/><span style="font-weight:normal; color:#475569; font-size:8pt;">${ddmm(d.date)}</span>${d.is_holiday ? '<div style="font-weight:bold; color:#64748b; font-size:7.5pt; margin-top:2px;">FERIADO</div>' : ''}${visitorsList}</td>
        <td style="${cellStyle}">${turnos}</td>
        <td style="${cellStyle} ${colStyle.refuerzos}">${refuerzos}</td>
        <td style="${cellStyle} ${colStyle.posturno}">${posturno}</td>
        <td style="${cellStyle} ${colStyle.ausencias}">${ausencias}</td>
        <td style="${cellStyle} min-width:220px;">${bloqueos}</td>
        <td style="${cellStyle}">${visita}</td>
        <td style="${cellStyle}">${poli8am}</td>
        <td style="${cellStyle}">${policlinico}</td>
      </tr>`;
    }).join('');
    const titulo = `Agenda Semanal · ${ddmm(weekDays[0]?.date)} al ${ddmm(weekDays[4]?.date)}`;
    const table = `<h2 style="text-align:center; margin:0 0 8px 0; font-family: Calibri, Arial, sans-serif;">${titulo}</h2>
<table style="border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif;">
  <thead>
    <tr>
      <th style="${headStyle}">DÍA</th>
      <th style="${headStyle}">TURNOS</th>
      <th style="${headStyle}">REFUERZOS</th>
      <th style="${headStyle}">POSTURNO</th>
      <th style="${headStyle}">AUSENCIAS</th>
      <th style="${headStyle}">BLOQUEOS</th>
      <th style="${headStyle}">VISITA</th>
      <th style="${headStyle}">POLI 8 AM</th>
      <th style="${headStyle}">POLICLÍNICO</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
    const doc = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<title>${titulo}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page { size: A4 landscape; margin: 1.2cm; } table { border-collapse: collapse; width: 100%; }</style>
</head>
<body style="font-family: Calibri, Arial, sans-serif; font-size: 10pt; color:#000;">
${table}
</body></html>`;
    // Plain text fallback simple para clipboard
    const plain = (agenda || []).map(d => {
      const turnos = (d.turnos || []).map(t => doctorName(t.doctor_id)).join(', ');
      const refuerzos = `AM ${d.refuerzos?.am ? doctorName(d.refuerzos.am) : '—'} | PM ${d.refuerzos?.pm ? doctorName(d.refuerzos.pm) : '—'}`;
      const ausencias = (d.ausencias || []).map(a => `${doctorName(a.doctor_id)} (${a.type})`).join(', ');
      return `${d.label} ${ddmm(d.date)}\n  Turnos: ${turnos}\n  Refuerzos: ${refuerzos}\n  Ausencias: ${ausencias || '—'}`;
    }).join('\n\n');
    return { table, doc, plain };
  }

  // Copia la tabla de la agenda al portapapeles como HTML (text/html). El
  // usuario abre un Google Doc en blanco y con Cmd/Ctrl+V la tabla queda
  // pegada con colores, header verde, formato y todo. Sin OAuth, sin setup.
  async function copyAgendaForGoogleDocs() {
    try {
      const { table, plain } = buildAgendaHtml();
      // Envolvemos la tabla en un body básico para que el target reciba HTML válido.
      const htmlBlob = new Blob([`<meta charset="utf-8">${table}`], { type: 'text/html' });
      const plainBlob = new Blob([plain], { type: 'text/plain' });
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': plainBlob,
        })]);
      } else {
        // Fallback antiguo: copiamos solo texto plano
        await navigator.clipboard.writeText(plain);
      }
      toast.success('Copiado. Abrí un Google Doc y pegá con Cmd/Ctrl+V.', { duration: 4000 });
    } catch (e) {
      console.error('[copyAgendaForGoogleDocs]', e);
      toast.error('No se pudo copiar al portapapeles: ' + (e?.message || e));
    }
  }

  // Exporta la agenda semanal como .doc (HTML-Word). Se abre en Word y se
  // sube directo a Google Docs. Mantiene el header verde+blanco y los
  // colores de columna (refuerzos naranjo, posturno celeste, ausencias rojo).
  function downloadAgendaWord() {
    const { doc } = buildAgendaHtml();
    const blob = new Blob(['﻿', doc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenda-sdm-${weekDays[0]?.date || 'semana'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Word descargado — listo para subir a Google Docs');
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
    // El editor se toma automaticamente de la sesion logueada
    // (admin_profile_name → fallback de getSdmEditor). No requiere paso extra.
    const editorName = getSdmEditor() || 'Sesión sin nombre';
    await saveWeeklyAgenda({ hasErrors: visibleErrors.length > 0, editorName });
  }

  async function addAbsence() {
    const missing = [];
    if (!newAbs.doctor_id) missing.push('médico');
    if (!newAbs.date) missing.push('fecha');
    if (missing.length) {
      console.warn('[addAbsence] bloqueado — estado actual:', newAbs, 'faltan:', missing);
      toast.error('Falta: ' + missing.join(', ') + '. (En Mac la fecha tipeada manualmente a veces no se guarda — usá el calendario del campo)');
      return;
    }
    const { error } = await supabase.from('sdm_absences').insert(newAbs);
    if (error) { toast.error("Error: " + (explainSdmWriteError(error) || error.message)); return; }
    const { data } = await supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd);
    setAbsences(data || []);
    setShowAbsenceDialog(false);
    setNewAbs({ doctor_id: '', date: '', type: 'A', notes: '' });
    toast.success('Ausencia agregada');
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

  function togglePoliDisabled(date, slot, value) {
    setPoliDisabled(prev => {
      const next = { ...prev, [date]: { ...(prev[date] || {}), [slot]: value } };
      // Limpiar si no queda nada que apague
      if (!next[date].am && !next[date].pm) delete next[date];
      return next;
    });
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

  // Sortea refuerzos AM/PM SOLO para la semana actual, usando como historial
  // de carga acumulada todas las agendas guardadas desde el 1 de enero del
  // año en curso. Sobrescribe los refuerzos actuales de la semana (queda
  // sin guardar hasta que el usuario apriete Guardar).
  async function sortearRefuerzosSemana() {
    if (!confirm('Sorteará los refuerzos AM/PM de esta semana, balanceando con el historial desde el 1 de enero. Los refuerzos actuales de la semana se reemplazan. ¿Continuar?')) return;

    const yearStart = `${monday.getFullYear()}-01-01`;
    // Cargar refuerzos históricos (semanas anteriores a la actual, dentro del año)
    const { data: pastAgendas, error } = await supabase
      .from('sdm_weekly_agendas')
      .select('week_start, data')
      .gte('week_start', yearStart)
      .lt('week_start', weekStart);
    if (error) {
      toast.error('Error cargando historial: ' + (explainSdmWriteError(error) || error.message));
      return;
    }
    const existingReinf = {};
    (pastAgendas || []).forEach(a => {
      if (a?.data?.reinforcements) existingReinf[a.week_start] = a.data.reinforcements;
    });
    // No incluyo la semana actual en existing → se sortea desde cero
    const sorteado = sortReinforcements({
      weeks: [{ weekStart, days: agenda }],
      doctors,
      existingReinforcements: existingReinf,
    });
    const nuevos = sorteado[weekStart] || {};
    setReinforcements(nuevos);
    const semanas = Object.keys(existingReinf).length;
    toast.success(`Refuerzos sorteados para esta semana${semanas ? ` (considerando ${semanas} semana${semanas > 1 ? 's' : ''} previa${semanas > 1 ? 's' : ''} del año)` : ''}. Apretá Guardar para persistir.`);
  }

  // Persistir external_visitors de una fecha — usado por el editor de pill.
  async function persistVisitorsForDate(date, visitors) {
    const list = Array.isArray(visitors) ? visitors : [];
    const visitorsForStorage = list.length > 0 ? list : [{ [EMPTY_EXTERNAL_VISITORS_OVERRIDE]: true }];
    setExternalVisitorOverrides(prev => ({ ...prev, [date]: list }));
    const existing = shiftCalendar.find(c => c.date === date);
    if (existing) {
      const { error } = await supabase.from('sdm_shift_calendar')
        .update({ external_visitors: visitorsForStorage })
        .eq('date', date);
      if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
      setShiftCalendar(prev => prev.map(c => c.date === date ? { ...c, external_visitors: visitorsForStorage } : c));
    }
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
        .sdm-print-only { display: none; }
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body * { visibility: hidden; }
          .sdm-print-area, .sdm-print-area * { visibility: visible; }
          .sdm-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .sdm-print-hide { display: none !important; }
          .sdm-print-only { display: block !important; }
          .sdm-print-area table { font-size: 9px; width: 100%; }
          .sdm-print-area th, .sdm-print-area td { padding: 3px 4px !important; }
          .sdm-print-area, .sdm-print-area * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          .sdm-print-area thead { background: #047857 !important; }
          .sdm-print-area thead th { color: #ffffff !important; font-weight: bold; }
          .sdm-print-area td.sdm-col-refuerzos { color: #c2410c !important; font-weight: 600; }
          .sdm-print-area td.sdm-col-posturno  { color: #0284c7 !important; font-weight: 600; }
          .sdm-print-area td.sdm-col-ausencias { color: #b91c1c !important; font-weight: 600; }
          .sdm-print-area td.sdm-col-bloqueos,
          .sdm-print-area td.sdm-col-bloqueos * { color: #0f172a !important; }
          .sdm-print-area td.sdm-col-bloqueos .bg-violet-50,
          .sdm-print-area td.sdm-col-bloqueos .bg-red-50,
          .sdm-print-area td.sdm-col-bloqueos .bg-amber-50,
          .sdm-print-area td.sdm-col-bloqueos .bg-blue-50,
          .sdm-print-area td.sdm-col-bloqueos .bg-emerald-50 { background: transparent !important; }
          .sdm-print-area .sdm-conflict-error,
          .sdm-print-area .sdm-conflict-warn,
          .sdm-print-area [class*="ring-"] { box-shadow: none !important; }
        }
      `}</style>
      {/* Selector semana + acciones */}
      <div className="flex items-center gap-3 flex-wrap sdm-print-hide">
        <Button variant="outline" size="sm" onClick={() => shiftWeek(-7)}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="font-semibold text-slate-700 flex items-center gap-2">
          Semana del {ddmm(weekDays[0].date)} al {ddmm(weekDays[4].date)}
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
        <Button onClick={saveAgenda} className="gap-1.5" title={visibleErrors.length > 0 ? `⚠ ${visibleErrors.length} error(es) sin resolver` : 'Guardar agenda'}>
          <Save className="h-4 w-4" /> Guardar
          {visibleErrors.length > 0 && <span className="ml-1 bg-white text-red-700 text-[10px] font-bold rounded-full px-1.5">{visibleErrors.length}</span>}
        </Button>
      </div>

      {/* Acciones agrupadas: automáticas / exportar / extras (todas operan sobre la semana visible) */}
      <div className="sdm-print-hide flex flex-wrap items-center gap-3 -mt-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Esta semana</span>
          <Button variant="outline" size="sm" onClick={sortearRefuerzosSemana} className="gap-1.5" title="Sortea refuerzos AM/PM de esta semana, balanceando carga con todas las semanas del año ya guardadas"><Shuffle className="h-4 w-4" /> Sortear refuerzos</Button>
          <Button variant="outline" size="sm" onClick={optimizarTitulares} className="gap-1.5" title="Reasigna bloques de esta semana al médico titular si está disponible"><Wand2 className="h-4 w-4" /> Optimizar titulares</Button>
          <Button variant="outline" size="sm" onClick={equilibrarCarga} className="gap-1.5" title="Distribuye los bloques de esta semana de forma homogénea entre los días"><Scale className="h-4 w-4" /> Equilibrar carga</Button>
          <Button variant="outline" size="sm" onClick={regenerarPreliminar} className="gap-1.5" title="Descarta las ediciones manuales de esta semana y vuelve al template"><RefreshCw className="h-4 w-4" /> Regenerar</Button>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Exportar</span>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5"><Printer className="h-4 w-4" /> Imprimir</Button>
          <Button variant="outline" size="sm" onClick={downloadAgendaWord} className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50" title="Descarga la agenda como .doc — abre en Word o se sube directo a Google Docs"><Download className="h-4 w-4" /> Word</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await copyAgendaForGoogleDocs();
              window.open('https://docs.google.com/document/u/0/create', '_blank', 'noopener');
            }}
            className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            title="Copia la tabla al portapapeles y abre un Google Doc nuevo. Pegá con Cmd/Ctrl+V."
          >
            <FileText className="h-4 w-4" /> Google Docs
          </Button>
        </div>

        <SdmInternalMeetings monday={monday} onChanged={reloadOneoff} />
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
      {/* Panel de ausencias — agrupado por médico, con pills compactos por día */}
      <Card className="sdm-print-hide">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Ausencias de la semana ({absences.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAbsenceDialog(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Agregar ausencia
          </Button>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <p className="text-sm text-slate-500">Sin ausencias registradas para la semana.</p>
          ) : (() => {
            // Agrupar por DÍA: cada columna es un día de la semana con la
            // lista de médicos ausentes ese día.
            const byDate = {};
            absences.forEach(a => {
              (byDate[a.date] = byDate[a.date] || []).push(a);
            });
            const TYPE_COLOR = {
              FL: 'bg-purple-100 text-purple-800 border-purple-300',
              P: 'bg-pink-100 text-pink-800 border-pink-300',
              A: 'bg-blue-100 text-blue-800 border-blue-300',
              DT: 'bg-emerald-100 text-emerald-800 border-emerald-300',
              LM: 'bg-red-100 text-red-800 border-red-300',
              CAP: 'bg-cyan-100 text-cyan-800 border-cyan-300',
              PAS: 'bg-orange-100 text-orange-800 border-orange-300',
              G: 'bg-amber-100 text-amber-800 border-amber-300',
              OTRO: 'bg-slate-100 text-slate-800 border-slate-300',
            };
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {weekDays.map(d => {
                  const items = (byDate[d.date] || [])
                    .slice()
                    .sort((x, y) => doctorName(x.doctor_id).localeCompare(doctorName(y.doctor_id)));
                  return (
                    <div key={d.date} className="rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-2">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">{d.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-[10px] italic text-slate-300 py-1">Sin ausencias</p>
                      ) : (
                        <div className="space-y-1">
                          {items.map(a => {
                            const cls = TYPE_COLOR[a.type] || TYPE_COLOR.OTRO;
                            return (
                              <div
                                key={a.id}
                                className={`relative rounded border px-1.5 py-1 ${cls}`}
                                title={`${doctorName(a.doctor_id)} · ${ABSENCE_LABELS[a.type] || a.type}${a.notes ? ' · ' + a.notes : ''}`}
                              >
                                <div className="text-[11px] font-bold truncate pr-3">{doctorName(a.doctor_id)}</div>
                                <div className="text-[9px] font-semibold opacity-80">{a.type} · {ABSENCE_LABELS[a.type] || a.type}</div>
                                <button
                                  onClick={() => deleteAbsence(a.id)}
                                  className="absolute top-0.5 right-0.5 opacity-40 hover:opacity-100 hover:text-red-700"
                                  title="Eliminar ausencia"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
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
		                          onClick={(e) => {
		                            e.stopPropagation();
		                            setEditingVisitor({ name: v.name });
		                          }}
		                          className={`sdm-visitor-pill text-[9px] leading-tight rounded border px-1.5 py-0.5 cursor-pointer active:cursor-grabbing ${
		                            v.holiday_pending || v.no_show
			                              ? 'sdm-print-hide bg-amber-100 text-amber-900 border-amber-300'
			                              : /neuro/i.test(v.specialty || '') ? 'bg-green-100 text-green-900 border-green-300'
			                              : /pediatr/i.test(v.specialty || '') ? 'bg-pink-100 text-pink-900 border-pink-300'
			                              : (/internista/i.test(v.specialty || '') || /sandoval/i.test(v.name || '')) ? 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300'
			                              : (/urgenc/i.test(v.specialty || '') || /rubilar/i.test(v.name || '')) ? 'bg-purple-100 text-purple-900 border-purple-300'
			                              : 'bg-blue-100 text-blue-900 border-blue-300'
		                          }`}
			                          title={v.no_show ? 'Especialista marcado como no viene. No se imprime.' : v.holiday_pending ? 'Arrastrar para mover desde feriado. No se imprime.' : 'Arrastrar para mover especialista a otro día'}
			                        >
		                          <div className="font-bold">{v.name}</div>{v.specialty && <div className="opacity-80">{v.specialty}</div>}
		                          {v.no_show ? <span className="ml-1 font-semibold">no viene</span> : v.holiday_pending && <span className="ml-1 font-semibold">feriado/revisar</span>}
		                        </div>
	                      ))}
	                    </div>
                  )}
                </td>
                <td className="px-2 py-2">{day.turnos.map((t, i) => <div key={i}>{doctorName(t.doctor_id)}{t.replaced && <span className="text-amber-600 sdm-print-hide"> (←{doctorName(t.original_doctor_id)})</span>}</div>)}</td>
                <td className="px-2 py-2 space-y-1 sdm-col-refuerzos">
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
                    const isVie = day.day === 'vie';

                    // % PM y PM-viernes acumulado del año por médico — solo
                    // se aplica al dropdown del slot PM (no al AM). Si supera
                    // 15% del total anual se marca en rojo con tag de alerta.
                    const pmPctFor = (id) => {
                      const stats = yearReinfStats.perDoctor[id];
                      if (!stats || yearReinfStats.totalPM === 0) return 0;
                      return (stats.pm / yearReinfStats.totalPM) * 100;
                    };
                    const pmViePctFor = (id) => {
                      const stats = yearReinfStats.perDoctor[id];
                      if (!stats || yearReinfStats.totalPMVie === 0) return 0;
                      return (stats.pmVie / yearReinfStats.totalPMVie) * 100;
                    };

                    const renderItem = (slot) => (d) => {
                      const isPM = slot === 'pm';
                      const pmPct = isPM ? pmPctFor(d.id) : 0;
                      const pmViePct = isPM && isVie ? pmViePctFor(d.id) : 0;
                      const refPct = Math.max(pmPct, pmViePct);
                      const overloaded = refPct > 15;
                      const hasNominal = nominalDocs.has(d.id);
                      const itemClass = overloaded
                        ? 'text-red-700 font-medium'
                        : (hasNominal ? 'text-amber-700' : '');
                      return (
                        <SelectItem key={d.id} value={d.id} className={itemClass}>
                          {d.display_name}
                          {overloaded && (
                            <span className="text-[10px] ml-2 text-red-600">
                              ⚠ {refPct.toFixed(0)}% refuerzos {pmViePct > pmPct ? 'PM vie' : 'PM'} — revisar
                            </span>
                          )}
                          {!overloaded && hasNominal && (
                            <span className="text-[10px] ml-2 text-amber-600">(tiene {nominalDocs.get(d.id)})</span>
                          )}
                        </SelectItem>
                      );
                    };
                    return (
                      <>
                        <div className="flex items-center gap-1 sdm-print-hide">
                          <span className="text-[9px] font-bold text-slate-500 w-5">AM</span>
                          <Select value={day.refuerzos.am || ''} onValueChange={v => updateReinforcement(day.date, 'am', v)}>
                            <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-28"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>{eligibleAM.map(renderItem('am'))}</SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1 sdm-print-hide">
                          <span className="text-[9px] font-bold text-slate-500 w-5">PM</span>
                          <Select value={day.refuerzos.pm || ''} onValueChange={v => updateReinforcement(day.date, 'pm', v)}>
                            <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-28"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>{eligiblePM.map(renderItem('pm'))}</SelectContent>
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
                <td className="px-2 py-2 text-slate-600 sdm-col-posturno">{day.posturno.map((t, i) => <div key={i}>{doctorName(t.doctor_id)}</div>)}</td>
                <td className="px-2 py-2 sdm-col-ausencias">{day.ausencias.map((a, i) => <div key={i} className="text-red-700">{doctorName(a.doctor_id)} ({a.type})</div>)}</td>
                <td
                  className={`sdm-col-bloqueos px-2 py-2 group cursor-pointer transition-colors ${dragOverDate === day.date ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' : 'hover:bg-blue-50/50'}`}
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
                          const blockKey = `${day.date}|${b.block_id}`;
                          const isError = blockErrorKeys.has(blockKey);
                          const isWarn  = !isError && blockWarningKeys.has(blockKey);
                          const conflictClass = isError
                            ? 'sdm-conflict-error bg-red-50 ring-1 ring-red-300 rounded px-1'
                            : isWarn
                              ? 'sdm-conflict-warn bg-amber-50 ring-1 ring-amber-300 rounded px-1'
                              : '';
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
                              className={`text-[11px] ${colorClass} ${conflictClass} ${extraClass} ${!b.suspended && !b.sdm_internal ? 'cursor-grab active:cursor-grabbing rounded hover:bg-blue-100/40 px-0.5 -mx-0.5' : ''}`}
                              title={b.sdm_internal ? 'Reunión interna SDM (no se imprime)' : isError ? 'Bloqueo con error — click para editar' : isWarn ? 'Bloqueo con superposición — click para editar' : !b.suspended ? 'Arrastrar a otro día para mover este bloqueo' : undefined}
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
                                    if (!ids.length) return b.suspended ? '' : '⚠ SIN ASIGNAR';
                                    if (isAllDoctorsBlock(b, day)) return <span className="font-bold">TODOS</span>;
                                    return ids.map(doctorName).join(' + ');
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
                      ? (
                        <div className="flex items-center gap-1">
                          <div className="flex-1">
                            <span className="font-semibold">{doctorName(day.policlinico.doctor_id)}</span>{' '}
                            <span className="text-slate-500">{day.policlinico.from}–{day.policlinico.to}</span>
                          </div>
                          <button
                            onClick={() => togglePoliDisabled(day.date, 'am', true)}
                            className="sdm-print-hide text-[10px] text-red-600 hover:bg-red-100 rounded px-1"
                            title="Quitar policlínico AM (el refuerzo AM se mantiene)"
                          >✕</button>
                        </div>
                      )
                      : poliDisabled?.[day.date]?.am
                        ? (
                          <div className="flex items-center gap-1">
                            <span className="flex-1 text-slate-400 italic">Poli AM apagado</span>
                            <button
                              onClick={() => togglePoliDisabled(day.date, 'am', false)}
                              className="sdm-print-hide text-[10px] text-emerald-700 hover:bg-emerald-100 rounded px-1"
                              title="Reactivar policlínico AM"
                            >↺</button>
                          </div>
                        )
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
                    <div className="flex items-center gap-1">
                      <div className="flex-1">
                        <span className="font-semibold">{doctorName(day.poli_8am.ref_pm.doctor_id)}</span>{' '}
                        <span className="text-slate-500">{day.poli_8am.ref_pm.from}–{day.poli_8am.ref_pm.to}</span>
                      </div>
                      <button
                        onClick={() => togglePoliDisabled(day.date, 'pm', true)}
                        className="sdm-print-hide text-[10px] text-red-600 hover:bg-red-100 rounded px-1"
                        title="Quitar policlínico PM (el refuerzo PM se mantiene)"
                      >✕</button>
                    </div>
                  )}
                  {!day.poli_8am.ref_pm && poliDisabled?.[day.date]?.pm && (
                    <div className="flex items-center gap-1">
                      <span className="flex-1 text-slate-400 italic">Poli PM apagado</span>
                      <button
                        onClick={() => togglePoliDisabled(day.date, 'pm', false)}
                        className="sdm-print-hide text-[10px] text-emerald-700 hover:bg-emerald-100 rounded px-1"
                        title="Reactivar policlínico PM"
                      >↺</button>
                    </div>
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
              <label className="text-xs font-medium text-slate-600">Fecha (DD-MM-AAAA)</label>
              <DateInputDdmm value={newAbs.date} onChange={v => setNewAbs({ ...newAbs, date: v })} />
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

      {/* Editor de visitante externo: presencia por día de la semana + no-show global */}
      {editingVisitor && (() => {
        const matches = (v) => v?.name && editingVisitor?.name && v.name.toLowerCase() === editingVisitor.name.toLowerCase();
        const sample = agenda.flatMap(d => d.external_visitors || []).find(matches) || { name: editingVisitor.name };
        const presentDates = new Set(
          agenda.filter(d => (d.external_visitors || []).some(v => matches(v) && !v.no_show)).map(d => d.date)
        );
        const togglePresence = (date, present) => {
          const day = agenda.find(d => d.date === date);
          if (!day) return;
          const current = (day.external_visitors || []).filter(v => !matches(v));
          const next = present
            ? [...current, { ...sample, no_show: false, holiday_pending: !!day.is_holiday }]
            : current;
          persistVisitorsForDate(date, next);
        };
        const markNoShowAll = async () => {
          for (const day of agenda) {
            const list = day.external_visitors || [];
            if (!list.some(matches)) continue;
            const next = list.map(v => matches(v) ? { ...v, no_show: true } : v);
            await persistVisitorsForDate(day.date, next);
          }
          toast.success(`${sample.name} marcado como no viene esta semana.`);
        };
        const removeFromWeek = async () => {
          for (const day of agenda) {
            const list = day.external_visitors || [];
            if (!list.some(matches)) continue;
            await persistVisitorsForDate(day.date, list.filter(v => !matches(v)));
          }
          toast.success(`${sample.name} quitado de la semana.`);
          setEditingVisitor(null);
        };
        return (
          <Dialog open onOpenChange={(o) => !o && setEditingVisitor(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{sample.name}{sample.specialty && <span className="text-sm font-normal text-slate-500 ml-2">{sample.specialty}</span>}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Días que asiste esta semana</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {agenda.map(day => (
                      <label key={day.date} className={`flex items-center gap-2 px-2 py-1 rounded border ${day.is_holiday ? 'opacity-60' : ''}`}>
                        <input
                          type="checkbox"
                          checked={presentDates.has(day.date)}
                          disabled={day.is_holiday}
                          onChange={e => togglePresence(day.date, e.target.checked)}
                        />
                        <span className="text-sm">{day.label} <span className="text-slate-400 text-xs">{day.date}</span></span>
                        {day.is_holiday && <span className="text-[10px] uppercase text-slate-500 ml-auto">feriado</span>}
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">El total muestra cuántas veces a la semana viene. Editar marca/desmarca los días.</p>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={markNoShowAll} className="text-amber-700 border-amber-300 hover:bg-amber-50">No viene esta semana</Button>
                <Button variant="outline" onClick={removeFromWeek} className="text-red-700 border-red-300 hover:bg-red-50">Quitar de la semana</Button>
                <Button onClick={() => setEditingVisitor(null)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Link discreto al historial de modificaciones de la semana */}
      <div className="sdm-print-hide text-center pt-2 pb-4">
        <button
          onClick={() => setShowHistory(true)}
          className="text-[11px] text-slate-400 hover:text-slate-700 hover:underline"
        >
          Historial de modificaciones
        </button>
      </div>
      <SdmHistoryDialog open={showHistory} onOpenChange={setShowHistory} weekStart={weekStart} />
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
      <TimeInput24h
        value={from}
        onChange={setFrom}
        className="h-6 text-[10px] px-1 py-0 w-20"
      />
      <TimeInput24h
        value={to}
        onChange={setTo}
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
        <Select
          value=""
          onValueChange={v => {
            if (!v) return;
            if (v === '__all__') {
              setDoctorIds(doctors.filter(d => d.active !== false && !d.is_urgentologist).map(d => d.id));
              return;
            }
            if (!doctorIds.includes(v)) setDoctorIds([...doctorIds, v]);
          }}
        >
          <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-24"><SelectValue placeholder={doctorIds.length ? '+ Otro' : 'Médico'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="font-semibold text-blue-700">★ Todos los médicos</SelectItem>
            {doctors.filter(d => !doctorIds.includes(d.id)).map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
          </SelectContent>
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
