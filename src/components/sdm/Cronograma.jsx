import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Save, RefreshCw, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import { findReplacementForBlock, getMondayOfWeek, blockDoctorIds, blockHasDoctor } from './lib/generateAgenda';
import { sdmSupabase as supabase } from './lib/sdmSupabase';
import CellEditor from './CellEditor';

const SLOT_MINUTES = 30;
const DAY_START = '08:00';
const DAY_END = '17:00';
const HOUR_HEIGHT = 72;
const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie'];
const DAY_LABELS = { lun: 'LUNES', mar: 'MARTES', mie: 'MIÉRCOLES', jue: 'JUEVES', vie: 'VIERNES' };
const EMPTY_EXTERNAL_VISITORS_OVERRIDE = '__empty_external_visitors_override';
const LUNCH_START = 13 * 60 + 30;
const LUNCH_END = 14 * 60;

const CAT_COLORS = {
  clinico:        'bg-blue-50 border-blue-500 text-blue-950',
  gestion:        'bg-amber-50 border-amber-500 text-amber-950',
  reunion:        'bg-violet-50 border-violet-500 text-violet-950',
  visita_radio:   'bg-pink-50 border-pink-500 text-pink-950',
  judicial:       'bg-red-50 border-red-500 text-red-950',
  administrativo: 'bg-slate-50 border-slate-500 text-slate-800',
  otro:           'bg-slate-50 border-slate-500 text-slate-800',
};

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(min) {
  const clamped = Math.max(timeToMinutes(DAY_START), Math.min(timeToMinutes(DAY_END), min));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildSlots() {
  const out = [];
  for (let m = timeToMinutes(DAY_START); m <= timeToMinutes(DAY_END); m += SLOT_MINUTES) {
    out.push({ minutes: m, label: minutesToTime(m) });
  }
  return out;
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

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

function layoutDayBlocks(day) {
  const blocks = (day?.bloqueos || [])
    .filter(b => !b.suspended && b.from && b.to && timeToMinutes(b.to) > timeToMinutes(b.from))
    .map((b, index) => ({
      ...b,
      _index: index,
      start: timeToMinutes(b.from),
      end: timeToMinutes(b.to),
      lane: 0,
      laneCount: 1,
      hasConflict: false,
      hasParallel: false,
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const clusters = [];
  blocks.forEach(block => {
    const cluster = clusters.find(c => c.some(other => overlaps(block, other)));
    if (cluster) cluster.push(block);
    else clusters.push([block]);
  });

  clusters.forEach(cluster => {
    const lanes = [];
    cluster.forEach(block => {
      let lane = lanes.findIndex(end => end <= block.start);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(block.end);
      } else {
        lanes[lane] = block.end;
      }
      block.lane = lane;
    });
    const laneCount = Math.max(1, lanes.length);
    cluster.forEach(block => {
      block.laneCount = laneCount;
      block.hasParallel = cluster.length > 1;
      const blockIds = Array.isArray(block.doctor_ids) && block.doctor_ids.length
        ? block.doctor_ids
        : (block.doctor_id ? [block.doctor_id] : []);
      block.hasConflict = block.unassigned || cluster.some(other => {
        if (other === block) return false;
        const otherIds = Array.isArray(other.doctor_ids) && other.doctor_ids.length
          ? other.doctor_ids
          : (other.doctor_id ? [other.doctor_id] : []);
        return blockIds.some(id => otherIds.includes(id)) && overlaps(block, other);
      });
    });
  });

  return blocks;
}

export default function Cronograma({ weeklyAgenda, setMonday }) {
  const {
    monday,
    weekStart,
    weekDays,
    doctors,
    shiftCalendar,
    setShiftCalendar,
    programAssignments,
    agenda,
    loading,
    isDirty,
    bloqueosOverrides,
    setBloqueosOverrides,
    blockSuggestions,
    saveAgenda,
  } = weeklyAgenda;
  const [zoomDay, setZoomDay] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [draggedBlock, setDraggedBlock] = useState(null);

  const slots = useMemo(buildSlots, []);
  const visibleDays = zoomDay ? weekDays.filter(d => d.day === zoomDay) : weekDays;
  const timelineStart = timeToMinutes(DAY_START);
  const timelineEnd = timeToMinutes(DAY_END);
  const timelineHeight = ((timelineEnd - timelineStart) / 60) * HOUR_HEIGHT;

  const blocksByDate = useMemo(() => {
    const out = {};
    agenda.forEach(day => { out[day.date] = layoutDayBlocks(day); });
    return out;
  }, [agenda]);

  const doctorName = id => doctors.find(d => d.id === id)?.display_name || (id === 'rubilar' ? 'RUBILAR' : id);
  const allBlocks = useMemo(() => Object.values(blocksByDate).flat(), [blocksByDate]);
  const realConflicts = allBlocks.filter(b => b.hasConflict).length;
  const parallelBlocks = allBlocks.filter(b => b.hasParallel && !b.hasConflict).length;

  function shiftWeek(deltaDays) {
    if (isDirty && !window.confirm('Tenés cambios sin guardar en esta semana. ¿Continuar y descartarlos?')) return;
    const d = new Date(monday);
    d.setDate(d.getDate() + deltaDays);
    setMonday(d);
  }

  function blockKey(block) {
    return `${block.block_id || 'block'}|${block.from}|${block.to}|${block.doctor_id || ''}|${block.name || ''}`;
  }

  function onDragStart(e, block, date) {
    setDraggedBlock({ ...block, fromDate: date });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockKey(block));
  }

  function onDrop(e, targetDate) {
    e.preventDefault();
    if (!draggedBlock) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = Math.max(0, Math.min(timelineHeight, e.clientY - rect.top));
    const rawMinutes = timelineStart + Math.round((y / HOUR_HEIGHT) * 60 / SLOT_MINUTES) * SLOT_MINUTES;
    const duration = timeToMinutes(draggedBlock.to) - timeToMinutes(draggedBlock.from);
    const newFromMin = Math.max(timelineStart, Math.min(timelineEnd - duration, rawMinutes));
    const moved = {
      ...draggedBlock,
      from: minutesToTime(newFromMin),
      to: minutesToTime(newFromMin + duration),
      source: draggedBlock.source === 'template' ? 'moved' : draggedBlock.source,
      auto_assigned: false,
    };
    delete moved.fromDate;
    delete moved.start;
    delete moved.end;
    delete moved.lane;
    delete moved.laneCount;
    delete moved.hasConflict;
    delete moved.hasParallel;
    delete moved._index;

    let didMove = false;
    setBloqueosOverrides(prev => {
      const fromDay = agenda.find(d => d.date === draggedBlock.fromDate);
      const targetDay = agenda.find(d => d.date === targetDate);
      const fromCurrent = prev[draggedBlock.fromDate] ?? fromDay?.bloqueos ?? [];
      const toCurrent = prev[targetDate] ?? targetDay?.bloqueos ?? [];
      const fromNext = fromCurrent.filter(b => blockKey(b) !== blockKey(draggedBlock));
      const targetBase = draggedBlock.fromDate === targetDate ? fromNext : toCurrent;
      const sameBlockInstances = targetBase.filter(b => b.block_id === moved.block_id && !b.suspended && b.from && b.to);
      const movedIds = blockDoctorIds(moved);
      const sameDoctorBlocks = targetBase.filter(b =>
        !b.suspended && b.block_id !== moved.block_id &&
        movedIds.some(id => blockHasDoctor(b, id))
      );
      let movedNext = moved;
      if (sameDoctorBlocks.length > 0) {
        const conflictDoctor = movedIds.find(id => sameDoctorBlocks.some(b => blockHasDoctor(b, id))) || movedIds[0];
        const detail = sameDoctorBlocks
          .slice()
          .sort((a, b) => (a.from || '').localeCompare(b.from || ''))
          .map(b => `• ${b.from || '—'}-${b.to || '—'} ${b.name}`)
          .join('\n');
        const replacement = findReplacementForBlock({
          blockId: moved.block_id,
          excludeDoctorId: conflictDoctor,
          day: targetDay,
          programAssignments,
        });
        const choice = window.prompt(
          `${doctorName(conflictDoctor)} ya tiene otro bloqueo el ${targetDate}:\n\n${detail}\n\n` +
          `Elige una opción:\n` +
          `1 = Mover igual / sumar todo en ese día\n` +
          `2 = Cambiar "${moved.name}" a ${replacement ? doctorName(replacement) : 'titular/subrogante disponible (no hay disponible)'}\n` +
          `3 = No hacer el cambio`,
          '1'
        );
        if (choice === null || choice.trim() === '3') return prev;
        if (choice.trim() === '2') {
          if (!replacement) {
            toast.error('No hay titular/subrogante disponible para ese bloqueo en el día destino.');
            return prev;
          }
          const newIds = movedIds.map(id => id === conflictDoctor ? replacement : id);
          if (!newIds.includes(replacement)) newIds.push(replacement);
          movedNext = { ...movedNext, doctor_ids: newIds, doctor_id: newIds[0] || null, unassigned: false, reassigned: true, originalDoctor: conflictDoctor };
        }
      }
      const targetNext = sameBlockInstances.length > 0
        ? (() => {
            const blocksToMerge = [...sameBlockInstances, movedNext];
            const earliestStart = Math.min(...blocksToMerge.map(b => timeToMinutes(b.from)).filter(v => v != null));
            const totalClinicalMinutes = blocksToMerge.reduce((sum, b) => sum + clinicalDurationMinutes(b), 0);
            const merged = {
              ...sameBlockInstances[0],
              ...movedNext,
              from: minutesToTime(earliestStart),
              to: minutesToTime(addClinicalMinutesSkippingLunch(earliestStart, totalClinicalMinutes)),
              merged_duration: true,
              merged_count: blocksToMerge.length,
              source: 'moved',
            };
            toast.info(`"${moved.name}" ya existe ese día; se sumó la duración saltando almuerzo 13:30-14:00.`);
            return [...targetBase.filter(b => b.block_id !== moved.block_id || b.suspended), merged];
          })()
        : [...targetBase, movedNext];
      didMove = true;
      return {
        ...prev,
        [draggedBlock.fromDate]: fromNext,
        [targetDate]: targetNext,
      };
    });
    setDraggedBlock(null);
    if (didMove) toast.success('Bloqueo movido. Guardá la agenda para dejarlo persistido.');
  }

  async function onCellSave(date, payload) {
    const nextBlocks = Array.isArray(payload) ? payload : payload.bloqueos;
    setBloqueosOverrides(prev => ({ ...prev, [date]: nextBlocks }));
    if (!Array.isArray(payload)) {
      const visitorsForStorage = payload.external_visitors.length > 0
        ? payload.external_visitors
        : [{ [EMPTY_EXTERNAL_VISITORS_OVERRIDE]: true }];
      const existing = shiftCalendar.find(c => c.date === date);
      if (existing) {
        const { error } = await supabase.from('sdm_shift_calendar')
          .update({ is_holiday: payload.is_holiday, external_visitors: visitorsForStorage })
          .eq('date', date);
        if (!error) {
          setShiftCalendar(prev => prev.map(c => c.date === date
            ? { ...c, is_holiday: payload.is_holiday, external_visitors: visitorsForStorage }
            : c));
        }
      }
    }
    toast.success('Cambios aplicados. Guardá la agenda para dejarlos persistidos.');
  }

  function regenerar() {
    if (!confirm('¿Descartar ediciones manuales de bloqueos y volver al template?')) return;
    setBloqueosOverrides({});
  }

  if (loading) return <div className="p-6 text-slate-500">Cargando…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => shiftWeek(-7)}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="font-semibold text-slate-700 text-sm">
          Semana del {weekDays[0].date} al {weekDays[4].date}
          {isDirty && <span className="ml-2 rounded border border-orange-300 bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-800">sin guardar</span>}
        </div>
        <Button variant="outline" size="sm" onClick={() => shiftWeek(7)}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setMonday(getMondayOfWeek(new Date()))}>Hoy</Button>
        <input
          type="date"
          className="h-8 w-36 rounded border border-slate-200 px-2 text-xs"
          value={weekStart}
          onChange={(e) => e.target.value && setMonday(getMondayOfWeek(new Date(e.target.value + 'T12:00:00')))}
        />
        <div className="w-px h-6 bg-slate-300 mx-2" />
        <Select value={zoomDay || '__all__'} onValueChange={v => setZoomDay(v === '__all__' ? null : v)}>
          <SelectTrigger className="h-9 w-48 gap-1">
            {zoomDay ? <ZoomIn className="h-4 w-4" /> : <ZoomOut className="h-4 w-4" />}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semana completa</SelectItem>
            {DAYS.map(d => <SelectItem key={d} value={d}>Zoom — {DAY_LABELS[d]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={regenerar} className="gap-1.5"><RefreshCw className="h-4 w-4" /> Regenerar</Button>
        <Button size="sm" onClick={() => saveAgenda({ hasErrors: realConflicts > 0 })} className="gap-1.5"><Save className="h-4 w-4" /> Guardar</Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Cronograma {zoomDay ? `· ${DAY_LABELS[zoomDay]}` : 'semanal'}</CardTitle>
              <CardDescription className="text-xs">
                Los bloques se dibujan por duración real. Paralelos normales van lado a lado; conflictos reales quedan marcados en rojo.
              </CardDescription>
            </div>
            <div className="flex flex-wrap justify-end gap-2 text-[11px]">
              <span className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-600">{parallelBlocks} paralelos</span>
              <span className={`rounded border px-2 py-1 ${realConflicts ? 'border-red-300 bg-red-50 text-red-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>
                {realConflicts} conflictos
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[72vh]">
            <div className="min-w-[980px]">
              <div className={`grid sticky top-0 z-20 bg-slate-50 border-y border-slate-200`} style={{ gridTemplateColumns: `88px repeat(${visibleDays.length}, minmax(${zoomDay ? '560px' : '210px'}, 1fr))` }}>
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hora</div>
                {visibleDays.map(d => {
                  const day = agenda.find(a => a.date === d.date);
                  return (
                    <button key={d.date} onClick={() => setZoomDay(zoomDay ? null : d.day)} className="border-l border-slate-200 px-3 py-2 text-left hover:bg-white">
                      <div className="text-xs font-bold text-slate-800">{d.label}</div>
                      <div className="text-[10px] text-slate-500">{d.date} · T{day?.turnoNumber ?? '–'}</div>
                      {day?.external_visitors?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {day.external_visitors.map((v, i) => (
                            <span
                              key={i}
                              className={`rounded px-1 py-0.5 text-[9px] font-semibold ${
                                v.holiday_pending
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border border-blue-100'
                              }`}
                            >
                              {v.name}{v.holiday_pending ? ' · revisar' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid" style={{ gridTemplateColumns: `88px repeat(${visibleDays.length}, minmax(${zoomDay ? '560px' : '210px'}, 1fr))` }}>
                <div className="relative border-r border-slate-200 bg-slate-50" style={{ height: timelineHeight }}>
                  {slots.map(slot => (
                    <div
                      key={slot.minutes}
                      className={`absolute left-0 right-0 px-3 text-[11px] font-mono ${slot.minutes % 60 === 0 ? 'text-slate-600' : 'text-slate-300'}`}
                      style={{ top: ((slot.minutes - timelineStart) / 60) * HOUR_HEIGHT - 7 }}
                    >
                      {slot.label}
                    </div>
                  ))}
                </div>

                {visibleDays.map(d => {
                  const day = agenda.find(a => a.date === d.date);
                  const blocks = blocksByDate[d.date] || [];
                  return (
                    <div
                      key={d.date}
                      className="relative border-r border-slate-200 bg-white"
                      style={{ height: timelineHeight }}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                      onDrop={(e) => onDrop(e, d.date)}
                    >
                      {slots.map(slot => (
                        <div
                          key={slot.minutes}
                          className={`absolute left-0 right-0 border-t ${slot.minutes % 60 === 0 ? 'border-slate-200' : 'border-slate-100'}`}
                          style={{ top: ((slot.minutes - timelineStart) / 60) * HOUR_HEIGHT }}
                        />
                      ))}
                      {blocks.map(block => {
                        const top = ((block.start - timelineStart) / 60) * HOUR_HEIGHT + 3;
                        const height = Math.max(28, ((block.end - block.start) / 60) * HOUR_HEIGHT - 6);
                        const gap = 4;
                        const width = `calc(${100 / block.laneCount}% - ${gap + 2}px)`;
                        const left = `calc(${(100 / block.laneCount) * block.lane}% + ${gap}px)`;
                        const colors = block.hasConflict
                          ? 'bg-red-50 border-red-500 text-red-950'
                          : block.sdm_internal
                            ? 'bg-violet-50 border-violet-500 text-violet-950'
                            : (CAT_COLORS[block.category] || CAT_COLORS.otro);
                        return (
                          <button
                            key={blockKey(block)}
                            draggable={!block.sdm_internal}
                            onDragStart={(e) => onDragStart(e, block, d.date)}
                            onClick={() => setEditingDay(day)}
                            className={`absolute rounded-md border-l-4 border border-slate-200 px-2 py-1 text-left text-[11px] leading-tight shadow-sm hover:ring-2 hover:ring-blue-400 ${colors}`}
                            style={{ top, height, left, width }}
                            title={`${block.from}-${block.to} · ${block.name} · ${blockDoctorIds(block).length ? blockDoctorIds(block).map(doctorName).join(' + ') : 'Sin asignar'}`}
                          >
                            <div className="flex items-center gap-1 font-bold">
                              {block.hasConflict && <AlertTriangle className="h-3 w-3 shrink-0" />}
                              <span className="truncate">{blockDoctorIds(block).length ? blockDoctorIds(block).map(doctorName).join(' + ') : 'SIN ASIGNAR'}</span>
                            </div>
                            <div className="truncate">{block.name}</div>
                            <div className="mt-0.5 text-[10px] opacity-70">{block.from}-{block.to}</div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.entries(CAT_COLORS).map(([k, cls]) => (
          <span key={k} className={`px-2 py-0.5 border-l-4 rounded ${cls}`}>{k}</span>
        ))}
        <span className="px-2 py-0.5 border-l-4 border-red-500 bg-red-50 text-red-900 rounded">conflicto / sin asignar</span>
      </div>

      <CellEditor
        open={!!editingDay}
        onOpenChange={open => { if (!open) setEditingDay(null); }}
        day={editingDay}
        bloqueos={editingDay ? agenda.find(d => d.date === editingDay.date)?.bloqueos || [] : []}
        doctors={doctors}
        blockSuggestions={blockSuggestions}
        onSave={payload => onCellSave(editingDay.date, payload)}
      />
    </div>
  );
}
