import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, RefreshCw, Save, Printer, Plus, Trash2, Edit3, Sparkles } from 'lucide-react';
import { generateAgenda, validateAgenda, getMondayOfWeek, fmtDate, weekDates, sortReinforcements, optimizeForTitulars, balanceLoad, HIERARCHICAL_BLOCK_IDS, findReplacementForBlock } from './lib/generateAgenda';
import AIFixModal from './AIFixModal';
import { Shuffle, Wand2, Scale } from 'lucide-react';
import CellEditor from './CellEditor';

const ABSENCE_TYPES = ['FL', 'P', 'A', 'DT', 'LM', 'CAP', 'PAS', 'G', 'OTRO'];
const ABSENCE_LABELS = {
  FL: 'Feriado Legal', P: 'Postnatal', A: 'Administrativo', DT: 'Devolución Tiempo',
  LM: 'Licencia Médica', CAP: 'Capacitación', PAS: 'Pasantía', OTRO: 'Otro'
};

export default function AgendaSemanal() {
  const [monday, setMonday] = useState(getMondayOfWeek(new Date()));
  const [doctors, setDoctors] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [shiftCalendar, setShiftCalendar] = useState([]);
  const [blockTemplates, setBlockTemplates] = useState([]);
  const [programAssignments, setProgramAssignments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [oneoffBlocks, setOneoffBlocks] = useState([]);
  const [reinforcements, setReinforcements] = useState({});
  const [loading, setLoading] = useState(true);
  const [savedAgendaId, setSavedAgendaId] = useState(null);
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [newAbs, setNewAbs] = useState({ doctor_id: '', date: '', type: 'A', notes: '' });
  const [editingDay, setEditingDay] = useState(null);
  const [aiError, setAiError] = useState(null); // error que se está corrigiendo con IA
  const [bloqueosOverrides, setBloqueosOverrides] = useState({}); // { '2026-05-04': [bloqueo, ...] }
  const [dismissedErrors, setDismissedErrors] = useState([]); // array de keys descartadas por el usuario
  const [showDismissed, setShowDismissed] = useState(false);   // mostrar las descartadas con opción de restaurar
  const [dragOverDate, setDragOverDate] = useState(null);      // celda BLOQUEOS resaltada durante drag
  const [poli8amOverrides, setPoli8amOverrides] = useState({}); // { '2026-05-04': 'doctor_id' }
  const [savedData, setSavedData] = useState(null); // data guardada de sdm_weekly_agendas

  const weekStart = fmtDate(monday);
  const weekDays = useMemo(() => weekDates(monday), [monday]);
  const weekEnd = weekDays[4].date;

  // Carga de catálogos + datos de la semana
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [d1, d2, d3, d4, d5] = await Promise.all([
        supabase.from('sdm_doctors').select('*').order('display_name'),
        supabase.from('sdm_shift_rotation').select('*'),
        supabase.from('sdm_block_templates').select('*'),
        supabase.from('sdm_program_assignments').select('*'),
        supabase.from('sdm_shift_calendar').select('*').gte('date', fmtDate(new Date(monday.getTime() - 7*86400000))).lte('date', weekEnd),
      ]);
      if (!alive) return;
      setDoctors(d1.data || []);
      setRotation(d2.data || []);
      setBlockTemplates(d3.data || []);
      setProgramAssignments(d4.data || []);
      setShiftCalendar(d5.data || []);

      // Carga ausencias y oneoff de la semana
      const [a, o, ag] = await Promise.all([
        supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd),
        supabase.from('sdm_oneoff_blocks').select('*').eq('week_start', weekStart),
        supabase.from('sdm_weekly_agendas').select('*').eq('week_start', weekStart).maybeSingle(),
      ]);
      if (!alive) return;
      setAbsences(a.data || []);
      setOneoffBlocks(o.data || []);
      if (ag.data?.data) {
        setSavedData(ag.data.data);
        setReinforcements(ag.data.data.reinforcements || {});
        setBloqueosOverrides(ag.data.data.bloqueosOverrides || {});
        setPoli8amOverrides(ag.data.data.poli8amOverrides || {});
        setDismissedErrors(Array.isArray(ag.data.data.dismissedErrors) ? ag.data.data.dismissedErrors : []);
      } else {
        setSavedData(null);
        setReinforcements({});
        setBloqueosOverrides({});
        setPoli8amOverrides({});
        setDismissedErrors([]);
      }
      setSavedAgendaId(ag.data?.id || null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [weekStart, weekEnd]);

  const agenda = useMemo(() => {
    if (loading) return [];
    const generated = generateAgenda({
      weekStart: monday,
      doctors, rotation, shiftCalendar, blockTemplates,
      programAssignments, absences, oneoffBlocks,
      manualReinforcements: reinforcements,
      manualPoli8am: poli8amOverrides,
    });
    // Aplicar overrides por día (edición manual desde CellEditor)
    return generated.map(d => bloqueosOverrides[d.date]
      ? { ...d, bloqueos: bloqueosOverrides[d.date] }
      : d);
  }, [loading, monday, doctors, rotation, shiftCalendar, blockTemplates, programAssignments, absences, oneoffBlocks, reinforcements, bloqueosOverrides, poli8amOverrides]);

  const validation = useMemo(() => validateAgenda(agenda, doctors), [agenda, doctors]);
  const errorKey = (e) => {
    if (!e) return '';
    if (e.kind === 'overlap') {
      const pair = [e.blockId, e.blockId2].filter(Boolean).sort().join('+');
      return `${e.kind}:${e.date}:${e.doctorId || ''}:${pair}`;
    }
    return `${e.kind}:${e.date || ''}:${e.blockId || ''}:${e.doctorId || ''}`;
  };
  const dismissedSet = useMemo(() => new Set(dismissedErrors), [dismissedErrors]);
  const visibleErrors = validation.errors.filter(e => !dismissedSet.has(errorKey(e)));
  const visibleWarnings = validation.warnings.filter(w => !dismissedSet.has(errorKey(w)));
  const hiddenIssues = [...validation.errors, ...validation.warnings].filter(e => dismissedSet.has(errorKey(e)));
  const dismissError = (e) => {
    const k = errorKey(e);
    setDismissedErrors(prev => prev.includes(k) ? prev : [...prev, k]);
  };
  const restoreError = (k) => setDismissedErrors(prev => prev.filter(x => x !== k));
  const doctorName = id => doctors.find(d => d.id === id)?.display_name || id;

  function shiftWeek(deltaDays) {
    const d = new Date(monday);
    d.setDate(d.getDate() + deltaDays);
    setMonday(d);
  }

  async function saveAgenda() {
    const payload = {
      week_start: weekStart,
      data: { agenda, reinforcements, bloqueosOverrides, poli8amOverrides, dismissedErrors, generated_at: new Date().toISOString() },
      status: 'editada',
      updated_at: new Date().toISOString(),
    };
    if (savedAgendaId) {
      const { error } = await supabase.from('sdm_weekly_agendas').update(payload).eq('id', savedAgendaId);
      if (error) alert('Error: ' + error.message);
      else alert('Agenda actualizada.');
    } else {
      const { data, error } = await supabase.from('sdm_weekly_agendas').insert(payload).select('id').single();
      if (error) alert('Error: ' + error.message);
      else { setSavedAgendaId(data.id); alert('Agenda guardada.'); }
    }
  }

  async function addAbsence() {
    if (!newAbs.doctor_id || !newAbs.date) return;
    const { error } = await supabase.from('sdm_absences').insert(newAbs);
    if (error) { alert('Error: ' + error.message); return; }
    const { data } = await supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd);
    setAbsences(data || []);
    setShowAbsenceDialog(false);
    setNewAbs({ doctor_id: '', date: '', type: 'A', notes: '' });
  }

  async function deleteAbsence(id) {
    await supabase.from('sdm_absences').delete().eq('id', id);
    setAbsences(absences.filter(a => a.id !== id));
  }

  function updateReinforcement(date, slot, doctorId) {
    setReinforcements(prev => ({ ...prev, [date]: { ...(prev[date] || {}), [slot]: doctorId || null } }));

    // Si el médico elegido tiene un bloque nominal reasignable ese día → reasignar al subrogante
    if (!doctorId) return;
    const day = agenda.find(d => d.date === date);
    if (!day) return;
    const blkIdx = day.bloqueos.findIndex(b => b.doctor_id === doctorId && !HIERARCHICAL_BLOCK_IDS.has(b.block_id));
    if (blkIdx === -1) return;
    const blk = day.bloqueos[blkIdx];
    const replacement = findReplacementForBlock({
      blockId: blk.block_id,
      excludeDoctorId: doctorId,
      day,
      programAssignments,
    });
    if (!replacement) {
      alert(`⚠ ${doctorName(doctorId)} tiene "${blk.name}" ese día pero no hay subrogante disponible. Revisá manualmente.`);
      return;
    }
    const nuevos = day.bloqueos.slice();
    nuevos[blkIdx] = { ...blk, doctor_id: replacement, reassigned: true, originalDoctor: doctorId };
    setBloqueosOverrides(prev => ({ ...prev, [date]: nuevos }));
    alert(`✓ "${blk.name}" reasignado a ${doctorName(replacement)} porque ${doctorName(doctorId)} pasa a refuerzo ${slot.toUpperCase()}.`);
  }

  function equilibrarCarga() {
    if (!confirm('Moverá bloques de días sobrecargados a días con menos carga (respetando turnos/posturnos/ausencias). ¿Continuar?')) return;
    const { agenda: balanced, moves } = balanceLoad({ agenda, blockTemplates });
    if (moves.length === 0) {
      alert('La carga ya está bien distribuida o no hay movimientos seguros disponibles.');
      return;
    }
    const overrides = {};
    balanced.forEach(d => { overrides[d.date] = d.bloqueos; });
    setBloqueosOverrides(overrides);
    const summary = moves.slice(0, 10).map(m => `• ${m.block}: ${m.from} → ${m.to}`).join('\n');
    alert(`Movidos ${moves.length} bloques:\n\n${summary}${moves.length > 10 ? `\n…y ${moves.length - 10} más` : ''}`);
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
    alert(`Sorteado refuerzos en ${saved} semanas. Carga balanceada por médicos disponibles.`);
  }

  async function onCellSave(date, payload) {
    // Compatibilidad: si payload es array (formato legacy), tratar como bloqueos puros.
    if (Array.isArray(payload)) {
      setBloqueosOverrides(prev => ({ ...prev, [date]: payload }));
      return;
    }
    const { bloqueos, is_holiday, external_visitors } = payload;
    setBloqueosOverrides(prev => ({ ...prev, [date]: bloqueos }));
    // Persistir is_holiday y external_visitors en sdm_shift_calendar
    const existing = shiftCalendar.find(c => c.date === date);
    if (existing) {
      const { error } = await supabase.from('sdm_shift_calendar')
        .update({ is_holiday, external_visitors })
        .eq('date', date);
      if (error) { alert('Error al guardar feriado/visitantes: ' + error.message); return; }
      setShiftCalendar(prev => prev.map(c => c.date === date ? { ...c, is_holiday, external_visitors } : c));
    } else {
      console.warn(`No hay entrada en sdm_shift_calendar para ${date}; feriado/visitantes no persistidos.`);
    }
  }

  function applyAiOption(error, opt) {
    if (!error || !opt) return;
    const day = agenda.find(d => d.date === error.date);
    if (!day) return;
    const currentBloqueos = bloqueosOverrides[error.date] ?? day.bloqueos;
    const idx = currentBloqueos.findIndex(b => b.block_id === error.blockId);
    if (idx === -1 && opt.action !== 'suspend') return;

    if (opt.action === 'assign' && opt.doctor_id) {
      const nuevos = currentBloqueos.map((b, i) =>
        i === idx ? { ...b, doctor_id: opt.doctor_id, unassigned: false, auto_assigned: false, ai_assigned: true } : b
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
      if (!targetDay) { alert(`Día destino ${opt.swap_with_day} no encontrado en esta semana`); return; }
      const original = currentBloqueos[idx];
      const sourceWithout = currentBloqueos.filter((_, i) => i !== idx);
      const targetCurrent = bloqueosOverrides[opt.swap_with_day] ?? targetDay.bloqueos;
      const moved = { ...original, source: 'optimized', auto_assigned: false, ai_assigned: true };
      setBloqueosOverrides(prev => ({
        ...prev,
        [error.date]: sourceWithout,
        [opt.swap_with_day]: [...targetCurrent, moved],
      }));
      return;
    }

    alert('Acción no reconocida o incompleta: ' + opt.action);
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
    const moved = { ...block, source: 'moved', auto_assigned: false };
    setBloqueosOverrides(prev => ({
      ...prev,
      [fromDate]: fromNext,
      [toDate]: [...toCurrent, moved],
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
      alert('No hubo cambios — los titulares ya están donde corresponde o no hay día disponible alternativo.');
    } else {
      const summary = moves.slice(0, 10).map(m =>
        m.from === m.to
          ? `• ${m.block}: ${m.doctor} (${m.from})`
          : `• ${m.block}: movido ${m.from} → ${m.to} (${m.doctor})`
      ).join('\n');
      alert(`Optimizadas ${moves.length} asignaciones:\n\n${summary}${moves.length > 10 ? `\n…y ${moves.length - 10} más` : ''}`);
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
        <div className="font-semibold text-slate-700">
          Semana del {weekDays[0].date} al {weekDays[4].date}
        </div>
        <Button variant="outline" size="sm" onClick={() => shiftWeek(7)}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setMonday(getMondayOfWeek(new Date()))}>Hoy</Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={sortearRefuerzosMes} className="gap-1.5" title="Sortea refuerzos AM/PM para próximas 4 semanas, balanceando carga"><Shuffle className="h-4 w-4" /> Sortear refuerzos</Button>
        <Button variant="outline" onClick={optimizarTitulares} className="gap-1.5" title="Reasigna bloques al titular si está disponible otro día"><Wand2 className="h-4 w-4" /> Optimizar titulares</Button>
        <Button variant="outline" onClick={equilibrarCarga} className="gap-1.5" title="Distribuye los bloques de manera más homogénea entre los días"><Scale className="h-4 w-4" /> Equilibrar carga</Button>
        <Button variant="outline" onClick={regenerarPreliminar} className="gap-1.5" title="Descarta ediciones y vuelve al template"><RefreshCw className="h-4 w-4" /> Regenerar</Button>
        <Button onClick={saveAgenda} className="gap-1.5"><Save className="h-4 w-4" /> Guardar</Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-1.5"><Printer className="h-4 w-4" /> Imprimir</Button>
      </div>

      {/* Banners de validación — clickeables: abren el editor del día problemático */}
      {(visibleErrors.length > 0 || visibleWarnings.length > 0 || hiddenIssues.length > 0) && (
        <Card className={`sdm-print-hide ${visibleErrors.length ? 'border-red-300 bg-red-50' : visibleWarnings.length ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
          <CardContent className="pt-4 text-sm space-y-1">
            {visibleErrors.map((e, i) => {
              const targetDay = e.date ? agenda.find(d => d.date === e.date) : null;
              const isClickable = !!targetDay;
              const aiCapable = isClickable && ['unassigned', 'absent_assigned', 'overlap', 'auto_assigned'].includes(e.kind);
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
              const aiCapable = isClickable && ['auto_assigned', 'posturno_assigned', 'outside_jornada'].includes(w.kind);
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
                  {showDismissed ? '▼' : '▶'} {hiddenIssues.length} alerta(s) descartada(s)
                </button>
                {showDismissed && (
                  <div className="mt-1 space-y-0.5">
                    {hiddenIssues.map((d, i) => (
                      <div key={'d' + i} className="flex items-center gap-2 text-[11px] text-slate-500 line-through">
                        <span className="flex-1">{d.message}</span>
                        <button
                          onClick={() => restoreError(errorKey(d))}
                          className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-1.5 py-0.5 rounded no-underline"
                        >
                          ↺ Restaurar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <th className="px-2 py-2 text-left">POLICLÍNICO</th>
              <th className="px-2 py-2 text-left">POLI 8 AM</th>
            </tr>
          </thead>
          <tbody>
            {agenda.map(day => (
              <tr key={day.date} className="border-b border-slate-200 align-top hover:bg-slate-50">
                <td className="px-2 py-2 font-bold text-slate-800">
                  {day.label}
                  <div className="text-[10px] font-normal text-slate-500">{day.date}<br/>T{day.turnoNumber ?? '–'}</div>
                  {day.is_holiday && (
                    <div className="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-slate-200 text-slate-700">Feriado</div>
                  )}
                  {Array.isArray(day.external_visitors) && day.external_visitors.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {day.external_visitors.map((v, i) => (
                        <div key={i} className="text-[9px] font-normal text-blue-700 leading-tight">
                          <span className="font-semibold">{v.name}</span>{v.specialty ? ` · ${v.specialty}` : ''}
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
                    const hierarchicalDocs = new Set(
                      day.bloqueos.filter(b => HIERARCHICAL_BLOCK_IDS.has(b.block_id)).map(b => b.doctor_id));
                    const nominalDocs = new Map();
                    day.bloqueos.filter(b => !HIERARCHICAL_BLOCK_IDS.has(b.block_id))
                      .forEach(b => { if (!nominalDocs.has(b.doctor_id)) nominalDocs.set(b.doctor_id, b.name); });
                    const eligible = doctors.filter(doc =>
                      !turnoIds.has(doc.id) && !postIds.has(doc.id) && !ausIds.has(doc.id) && !hierarchicalDocs.has(doc.id));
                    const renderItem = d => (
                      <SelectItem key={d.id} value={d.id} className={nominalDocs.has(d.id) ? 'text-amber-700' : ''}>
                        {d.display_name}
                        {nominalDocs.has(d.id) && <span className="text-[10px] ml-2 text-amber-600">(tiene {nominalDocs.get(d.id)})</span>}
                      </SelectItem>
                    );
                    return (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-500 w-5">AM</span>
                          <Select value={day.refuerzos.am || ''} onValueChange={v => updateReinforcement(day.date, 'am', v)}>
                            <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-28"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>{eligible.map(renderItem)}</SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-500 w-5">PM</span>
                          <Select value={day.refuerzos.pm || ''} onValueChange={v => updateReinforcement(day.date, 'pm', v)}>
                            <SelectTrigger className="h-6 text-[10px] px-1.5 py-0 w-28"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>{eligible.map(renderItem)}</SelectContent>
                          </Select>
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
                          const colorClass = b.suspended
                            ? 'text-slate-400 line-through opacity-70'
                            : b.unassigned
                              ? 'text-red-600 font-semibold'
                              : b.auto_assigned
                                ? 'text-blue-700'
                                : b.reassigned
                                  ? 'text-amber-700'
                                  : 'text-slate-700';
                          return (
                            <div
                              key={i}
                              draggable={!b.suspended}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('application/sdm-block', JSON.stringify({ fromDate: day.date, blockId: b.block_id }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-[11px] ${colorClass} ${!b.suspended ? 'cursor-grab active:cursor-grabbing rounded hover:bg-blue-100/40 px-0.5 -mx-0.5' : ''}`}
                              title={!b.suspended ? 'Arrastrar a otro día para mover este bloqueo' : undefined}
                            >
                              {b.from && b.to ? `${b.from}–${b.to} ` : ''}
                              {b.doctor_id ? doctorName(b.doctor_id) : (b.suspended ? '' : '⚠ SIN ASIGNAR')} <span className={b.suspended ? '' : 'text-slate-500'}>{b.name}</span>
                              {b.suspended && (
                                <span className="ml-1 text-[9px] bg-slate-200 text-slate-700 border border-slate-400 px-1 rounded no-underline" title={b.suspended_reason || 'Bloqueo suspendido / diferido'}>diferido</span>
                              )}
                              {!b.suspended && b.auto_assigned && (
                                <span className="ml-1 text-[9px] bg-blue-100 text-blue-800 px-1 rounded" title="Asignado automáticamente porque titular y subrogantes no están disponibles — revisar y formalizar.">auto</span>
                              )}
                              {!b.suspended && b.reassigned && (
                                <span className="ml-1 text-[9px] bg-amber-100 text-amber-800 px-1 rounded" title={`Originalmente: ${doctorName(b.originalDoctor)}`}>reasig</span>
                              )}
                            </div>
                          );
                        })
                      }
                    </div>
                    <Edit3 className="h-3 w-3 text-slate-300 group-hover:text-blue-500 mt-1 flex-shrink-0" />
                  </div>
                </td>
                <td className="px-2 py-2 text-[11px]">
                  {day.is_holiday
                    ? <span className="text-slate-300 italic">–</span>
                    : day.visita.slice(0, 8).map((v, i) => (
                        <div key={i}>
                          {doctorName(v.doctor_id)}
                          {v.capacity != null && <span className="ml-1 text-slate-500">({v.capacity})</span>}
                        </div>
                      ))
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
        onSave={nuevos => onCellSave(editingDay.date, nuevos)}
      />

      {/* Modal IA — Sugerencias para corregir errores */}
      <AIFixModal
        open={!!aiError}
        onOpenChange={open => { if (!open) setAiError(null); }}
        error={aiError}
        agenda={agenda}
        doctors={doctors}
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
