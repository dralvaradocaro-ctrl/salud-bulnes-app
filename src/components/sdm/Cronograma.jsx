import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Save, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { generateAgenda, getMondayOfWeek, fmtDate, weekDates } from './lib/generateAgenda';
import CellEditor from './CellEditor';

/**
 * Vista de cronograma con franjas horarias.
 * - Vista semanal: tabla franjas (30min) × 5 días
 * - Vista zoom diaria: 1 día con franjas más altas
 * - Drag & drop para mover bloqueos entre franjas/días
 * - Click en chip → CellEditor para edición fina
 */

const SLOT_MINUTES = 30;
const DAY_START = '08:00';
const DAY_END = '17:00';
const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie'];
const DAY_LABELS = { lun: 'LUNES', mar: 'MARTES', mie: 'MIÉRCOLES', jue: 'JUEVES', vie: 'VIERNES' };

const CAT_COLORS = {
  clinico:        'bg-blue-100 border-blue-400 text-blue-900',
  gestion:        'bg-amber-100 border-amber-400 text-amber-900',
  reunion:        'bg-violet-100 border-violet-400 text-violet-900',
  visita_radio:   'bg-pink-100 border-pink-400 text-pink-900',
  judicial:       'bg-red-100 border-red-400 text-red-900',
  administrativo: 'bg-slate-100 border-slate-400 text-slate-700',
  otro:           'bg-slate-100 border-slate-400 text-slate-700',
};

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function buildSlots() {
  const out = [];
  for (let m = timeToMinutes(DAY_START); m < timeToMinutes(DAY_END); m += SLOT_MINUTES) {
    out.push({ from: minutesToTime(m), to: minutesToTime(m + SLOT_MINUTES), minutes: m });
  }
  return out;
}

export default function Cronograma() {
  const [monday, setMonday] = useState(getMondayOfWeek(new Date()));
  const [zoomDay, setZoomDay] = useState(null); // null = vista semanal, sino 'lun'/'mar'/...
  const [doctors, setDoctors] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [shiftCalendar, setShiftCalendar] = useState([]);
  const [blockTemplates, setBlockTemplates] = useState([]);
  const [programAssignments, setProgramAssignments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [oneoffBlocks, setOneoffBlocks] = useState([]);
  const [reinforcements, setReinforcements] = useState({});
  const [bloqueosOverrides, setBloqueosOverrides] = useState({});
  const [savedAgendaId, setSavedAgendaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const [draggedBlock, setDraggedBlock] = useState(null);

  const weekStart = fmtDate(monday);
  const weekDays = useMemo(() => weekDates(monday), [monday]);
  const weekEnd = weekDays[4].date;
  const slots = useMemo(buildSlots, []);
  const visibleDays = zoomDay ? weekDays.filter(d => d.day === zoomDay) : weekDays;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [d1, d2, d3, d4, d5] = await Promise.all([
        supabase.from('sdm_doctors').select('*').eq('active', true).order('display_name'),
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
      const [a, o, ag] = await Promise.all([
        supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd),
        supabase.from('sdm_oneoff_blocks').select('*').eq('week_start', weekStart),
        supabase.from('sdm_weekly_agendas').select('*').eq('week_start', weekStart).maybeSingle(),
      ]);
      if (!alive) return;
      setAbsences(a.data || []);
      setOneoffBlocks(o.data || []);
      if (ag.data?.data) {
        setReinforcements(ag.data.data.reinforcements || {});
        setBloqueosOverrides(ag.data.data.bloqueosOverrides || {});
      } else {
        setReinforcements({});
        setBloqueosOverrides({});
      }
      setSavedAgendaId(ag.data?.id || null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [weekStart, weekEnd]);

  const agenda = useMemo(() => {
    if (loading) return [];
    const generated = generateAgenda({
      weekStart: monday, doctors, rotation, shiftCalendar, blockTemplates,
      programAssignments, absences, oneoffBlocks, manualReinforcements: reinforcements,
    });
    return generated.map(d => bloqueosOverrides[d.date]
      ? { ...d, bloqueos: bloqueosOverrides[d.date] }
      : d);
  }, [loading, monday, doctors, rotation, shiftCalendar, blockTemplates, programAssignments, absences, oneoffBlocks, reinforcements, bloqueosOverrides]);

  const doctorName = id => doctors.find(d => d.id === id)?.display_name || id;

  function shiftWeek(delta) {
    const d = new Date(monday);
    d.setDate(d.getDate() + delta);
    setMonday(d);
  }

  // Bloqueos por (date, slotMin) — incluye los que arrancan ANTES del slot y duran hasta él
  const blocksByCell = useMemo(() => {
    const m = {};
    agenda.forEach(d => {
      d.bloqueos.forEach(b => {
        if (!b.from || !b.to) return;
        const fromMin = timeToMinutes(b.from);
        const toMin = timeToMinutes(b.to);
        slots.forEach(slot => {
          if (slot.minutes >= fromMin && slot.minutes < toMin) {
            const key = `${d.date}|${slot.minutes}`;
            (m[key] = m[key] || []).push({ ...b, _date: d.date, _isStart: slot.minutes === fromMin });
          }
        });
      });
    });
    return m;
  }, [agenda, slots]);

  // Drag & drop handlers
  function onDragStart(e, block, fromDate) {
    setDraggedBlock({ ...block, fromDate });
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function onDrop(e, targetDate, targetSlotMin) {
    e.preventDefault();
    if (!draggedBlock) return;
    const { fromDate, ...block } = draggedBlock;
    const oldFromMin = timeToMinutes(block.from);
    const oldToMin = timeToMinutes(block.to);
    const duration = oldToMin - oldFromMin;
    const newFrom = minutesToTime(targetSlotMin);
    const newTo = minutesToTime(targetSlotMin + duration);

    // Quitar de fromDate y agregar a targetDate (con nuevo horario)
    setBloqueosOverrides(prev => {
      const next = { ...prev };
      // From day: remover por block_id + horario original
      const fromBloqueos = (prev[fromDate] || agenda.find(d => d.date === fromDate)?.bloqueos || [])
        .filter(b => !(b.block_id === block.block_id && b.from === block.from && b.to === block.to));
      next[fromDate] = fromBloqueos;
      // To day: agregar
      const toBloqueos = [...(prev[targetDate] || agenda.find(d => d.date === targetDate)?.bloqueos || [])];
      toBloqueos.push({ ...block, from: newFrom, to: newTo });
      next[targetDate] = toBloqueos;
      return next;
    });
    setDraggedBlock(null);
  }

  function onCellSave(date, nuevosBloqueos) {
    setBloqueosOverrides(prev => ({ ...prev, [date]: nuevosBloqueos }));
  }

  async function saveAgenda() {
    const payload = {
      week_start: weekStart,
      data: { agenda, reinforcements, bloqueosOverrides, generated_at: new Date().toISOString() },
      status: 'editada', updated_at: new Date().toISOString(),
    };
    if (savedAgendaId) {
      const { error } = await supabase.from('sdm_weekly_agendas').update(payload).eq('id', savedAgendaId);
      if (error) alert('Error: ' + error.message); else alert('Cronograma guardado.');
    } else {
      const { data, error } = await supabase.from('sdm_weekly_agendas').insert(payload).select('id').single();
      if (error) alert('Error: ' + error.message); else { setSavedAgendaId(data.id); alert('Cronograma guardado.'); }
    }
  }

  function regenerar() {
    if (!confirm('Descartar ediciones de cronograma y volver al template?')) return;
    setBloqueosOverrides({});
  }

  if (loading) return <div className="p-6 text-slate-500">Cargando…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => shiftWeek(-7)}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="font-semibold text-slate-700 text-sm">
          Semana del {weekDays[0].date} al {weekDays[4].date}
        </div>
        <Button variant="outline" size="sm" onClick={() => shiftWeek(7)}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setMonday(getMondayOfWeek(new Date()))}>Hoy</Button>
        <div className="w-px h-6 bg-slate-300 mx-2" />
        <Select value={zoomDay || '__all__'} onValueChange={v => setZoomDay(v === '__all__' ? null : v)}>
          <SelectTrigger className="h-9 w-44 gap-1">
            {zoomDay ? <ZoomIn className="h-4 w-4" /> : <ZoomOut className="h-4 w-4" />}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Vista semanal completa</SelectItem>
            {DAYS.map(d => <SelectItem key={d} value={d}>Zoom — {DAY_LABELS[d]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={regenerar} className="gap-1.5"><RefreshCw className="h-4 w-4" /> Regenerar</Button>
        <Button size="sm" onClick={saveAgenda} className="gap-1.5"><Save className="h-4 w-4" /> Guardar</Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Cronograma {zoomDay ? `· ${DAY_LABELS[zoomDay]}` : 'semanal'}</CardTitle>
          <CardDescription className="text-xs">
            Arrastrá los bloqueos para reasignar día u horario · Click para editar detalles · Las superposiciones aparecen lado a lado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[70vh]">
            <table className="border-collapse w-full" style={{ tableLayout: zoomDay ? 'auto' : 'fixed' }}>
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  <th className="border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 w-20">HORA</th>
                  {visibleDays.map(d => {
                    const day = agenda.find(a => a.date === d.date);
                    return (
                      <th key={d.date} className="border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700">
                        {d.label}
                        <div className="text-[10px] font-normal text-slate-500">{d.date} · T{day?.turnoNumber ?? '–'}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.minutes} className={slot.minutes % 60 === 0 ? 'border-t border-slate-300' : ''}>
                    <td className="border border-slate-200 px-2 py-1 text-[11px] text-slate-500 font-mono align-top text-center">
                      {slot.minutes % 60 === 0 ? slot.from : <span className="text-slate-300">{slot.from}</span>}
                    </td>
                    {visibleDays.map(d => {
                      const cellBlocks = blocksByCell[`${d.date}|${slot.minutes}`] || [];
                      const isOver = cellBlocks.length > 1;
                      return (
                        <td
                          key={d.date}
                          onDragOver={onDragOver}
                          onDrop={e => onDrop(e, d.date, slot.minutes)}
                          className={`border border-slate-200 align-top p-0.5 ${isOver ? 'bg-yellow-50' : ''}`}
                          style={{ minHeight: zoomDay ? '50px' : '32px', height: zoomDay ? '50px' : '32px' }}
                        >
                          <div className="flex gap-0.5 h-full overflow-x-auto">
                            {cellBlocks.map((b, i) => (
                              <div
                                key={`${b.block_id}-${i}`}
                                draggable={b._isStart}
                                onDragStart={e => b._isStart && onDragStart(e, b, d.date)}
                                onClick={() => setEditingDay(agenda.find(a => a.date === d.date))}
                                title={`${b.name} · ${b.from}–${b.to} · ${b.doctor_id ? doctorName(b.doctor_id) : 'Sin asignar'}`}
                                className={`flex-1 min-w-[80px] border-l-2 rounded px-1 py-0.5 cursor-move text-[10px] leading-tight ${
                                  b.unassigned
                                    ? 'border-red-500 bg-red-100 text-red-900'
                                    : (CAT_COLORS[b.category] || CAT_COLORS.otro)
                                } ${!b._isStart ? 'opacity-60' : ''} hover:ring-2 hover:ring-blue-400`}
                              >
                                {b._isStart && (
                                  <>
                                    <div className="font-semibold truncate">{b.doctor_id ? doctorName(b.doctor_id) : '⚠'}</div>
                                    <div className="truncate text-[9px]">{b.name}</div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.entries(CAT_COLORS).map(([k, cls]) => (
          <span key={k} className={`px-2 py-0.5 border-l-2 rounded ${cls}`}>{k}</span>
        ))}
        <span className="px-2 py-0.5 border-l-2 border-red-500 bg-red-100 text-red-900 rounded">sin asignar</span>
        <span className="px-2 py-0.5 bg-yellow-50 rounded border border-yellow-200">superposición</span>
      </div>

      <CellEditor
        open={!!editingDay}
        onOpenChange={open => { if (!open) setEditingDay(null); }}
        day={editingDay}
        bloqueos={editingDay ? agenda.find(d => d.date === editingDay.date)?.bloqueos || [] : []}
        doctors={doctors}
        onSave={nuevos => onCellSave(editingDay.date, nuevos)}
      />
    </div>
  );
}
