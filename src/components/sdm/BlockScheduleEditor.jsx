import React, { useEffect, useMemo, useState } from 'react';
import { sdmSupabase as supabase, explainSdmWriteError } from './lib/sdmSupabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Minus, Combine, Save, AlertTriangle, GripHorizontal, MoveRight } from 'lucide-react';
import { toast } from 'sonner';
import { getBuildPriorityOrder, priorityFor } from './lib/buildPriorityOrder';

const DAYS = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' },
  { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' },
  { key: 'sab', label: 'Sáb' },
];

function toMin(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10) || 0);
  return h * 60 + m;
}
function fromMin(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}
function slotMinutes(slot) {
  if (!slot?.from || !slot?.to) return 0;
  return Math.max(0, toMin(slot.to) - toMin(slot.from));
}
function dayMinutes(slots) {
  return (slots || []).reduce((s, sl) => s + slotMinutes(sl), 0);
}
function totalWeekMinutes(pattern) {
  return DAYS.reduce((sum, d) => sum + dayMinutes(pattern?.[d.key]), 0);
}
function dayCount(pattern) {
  return DAYS.reduce((c, d) => c + ((pattern?.[d.key] || []).length > 0 ? 1 : 0), 0);
}
function fmtHours(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

// Une todos los slots de un día en uno solo desde el inicio mas temprano
// al final mas tardio. Si los slots no se solapan deja huecos: alarga el
// tramo final para cubrir el total. Heurística simple: usa min(from) y
// (from + suma_de_minutos) como nuevo from-to.
function unifyDay(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  if (slots.length === 1) return slots;
  const from = slots.reduce((min, s) => Math.min(min, toMin(s.from)), Infinity);
  const total = dayMinutes(slots);
  return [{ from: fromMin(from), to: fromMin(from + total) }];
}

// Merge: copia los slots de srcDay al dstDay y elimina srcDay. Si autoUnify
// es true (default), unifica el día destino al final.
function mergeDays(pattern, srcDay, dstDay, autoUnify = true) {
  if (srcDay === dstDay) return pattern;
  const out = { ...pattern };
  const srcSlots = out[srcDay] || [];
  const dstSlots = out[dstDay] || [];
  if (srcSlots.length === 0) return out;
  const merged = [...dstSlots, ...srcSlots];
  out[dstDay] = autoUnify ? unifyDay(merged) : merged;
  delete out[srcDay];
  return out;
}

// Move: traslada los slots de srcDay tal cual a dstDay (asume vacío) y
// elimina srcDay. No concatena ni unifica — preserva los slots
// exactamente como estaban.
function moveDay(pattern, srcDay, dstDay) {
  if (srcDay === dstDay) return pattern;
  const out = { ...pattern };
  const srcSlots = out[srcDay] || [];
  if (srcSlots.length === 0) return out;
  out[dstDay] = srcSlots.map(s => ({ ...s }));
  delete out[srcDay];
  return out;
}

export default function BlockScheduleEditor({ onApplied }) {
  const [blocks, setBlocks] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [drag, setDrag] = useState(null); // { blockId, day }
  const [dragOver, setDragOver] = useState(null); // { blockId, day }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('sdm_block_templates').select('*');
      if (!alive) return;
      if (error) toast.error('Error: ' + (explainSdmWriteError(error) || error.message));
      else setBlocks(data || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const order = getBuildPriorityOrder();
  const sortedBlocks = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const matched = f
      ? blocks.filter(b => b.name.toLowerCase().includes(f) || b.id.includes(f))
      : blocks;
    return matched
      .filter(b => Object.values(b.weekday_pattern || {}).some(s => Array.isArray(s) && s.length > 0))
      .sort((a, b) => priorityFor(a.id, order) - priorityFor(b.id, order));
  }, [blocks, filter, order]);

  const dirtyCount = Object.keys(edits).length;
  const getPattern = (block) => edits[block.id] || block.weekday_pattern || {};
  const setPattern = (blockId, newPattern) => setEdits(prev => ({ ...prev, [blockId]: newPattern }));

  const removeSlot = (block, day, idx) => {
    const wp = { ...getPattern(block) };
    const slots = (wp[day] || []).slice();
    slots.splice(idx, 1);
    if (slots.length === 0) delete wp[day]; else wp[day] = slots;
    setPattern(block.id, wp);
  };
  const removeDay = (block, day) => {
    const wp = { ...getPattern(block) };
    delete wp[day];
    setPattern(block.id, wp);
  };
  const addDay = (block, day) => {
    const wp = { ...getPattern(block) };
    if (wp[day]?.length) return;
    const sample = Object.values(wp).find(s => Array.isArray(s) && s.length > 0)?.[0]
      || { from: '14:00', to: '17:00' };
    wp[day] = [{ ...sample }];
    setPattern(block.id, wp);
  };
  const updateSlot = (block, day, idx, field, value) => {
    const wp = { ...getPattern(block) };
    const slots = (wp[day] || []).slice();
    slots[idx] = { ...slots[idx], [field]: value };
    wp[day] = slots;
    setPattern(block.id, wp);
  };
  const shortenAllSlots = (block) => {
    const wp = { ...getPattern(block) };
    Object.keys(wp).forEach(d => {
      wp[d] = (wp[d] || []).map(s => {
        const to = toMin(s.to) - 30;
        const from = toMin(s.from);
        if (to <= from + 15) return s;
        return { ...s, to: fromMin(to) };
      });
    });
    setPattern(block.id, wp);
  };
  const unifyAllDays = (block) => {
    const wp = { ...getPattern(block) };
    Object.keys(wp).forEach(d => { wp[d] = unifyDay(wp[d]); });
    setPattern(block.id, wp);
  };
  const resetBlock = (block) => {
    setEdits(prev => { const cp = { ...prev }; delete cp[block.id]; return cp; });
  };

  // ── Drag & drop entre días del mismo bloque ────────────────────────────
  const onDragStart = (e, blockId, day) => {
    setDrag({ blockId, day });
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', `${blockId}|${day}`); } catch { /* noop */ }
  };
  const onDragOver = (e, blockId, day) => {
    if (!drag || drag.blockId !== blockId || drag.day === day) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOver || dragOver.blockId !== blockId || dragOver.day !== day) {
      setDragOver({ blockId, day });
    }
  };
  const onDragLeave = (blockId, day) => {
    if (dragOver?.blockId === blockId && dragOver?.day === day) setDragOver(null);
  };
  const onDrop = (e, block, dstDay) => {
    e.preventDefault();
    if (!drag || drag.blockId !== block.id || drag.day === dstDay) return;
    const wp = getPattern(block);
    const dstHasSlots = (wp[dstDay] || []).length > 0;
    const next = dstHasSlots
      ? mergeDays(wp, drag.day, dstDay, true)
      : moveDay(wp, drag.day, dstDay);
    setPattern(block.id, next);
    setDrag(null);
    setDragOver(null);
    toast.success(
      dstHasSlots
        ? `${drag.day.toUpperCase()} fusionado en ${dstDay.toUpperCase()} — ${block.name}`
        : `${drag.day.toUpperCase()} movido a ${dstDay.toUpperCase()} — ${block.name}`
    );
  };
  const onDragEnd = () => { setDrag(null); setDragOver(null); };

  const saveAll = async () => {
    const ids = Object.keys(edits);
    if (!ids.length) return;
    const ok = window.confirm(
      `Vas a actualizar ${ids.length} bloque(s). Estos cambios afectan la agenda generada de la semana actual y siguientes.\n\n¿Continuar?`
    );
    if (!ok) return;
    setSaving(true);
    let okCount = 0, fail = 0;
    for (const id of ids) {
      const { error } = await supabase.from('sdm_block_templates').update({ weekday_pattern: edits[id] }).eq('id', id);
      if (error) { fail++; toast.error(`✗ ${id}: ${error.message}`); }
      else okCount++;
    }
    setSaving(false);
    if (okCount) toast.success(`${okCount} bloque(s) actualizado(s).`);
    setEdits({});
    const { data } = await supabase.from('sdm_block_templates').select('*');
    setBlocks(data || []);
    await onApplied?.();
  };

  if (loading) return <Card><CardContent className="py-6 text-sm text-slate-500">Cargando bloques…</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Frecuencia y duración de bloques</CardTitle>
            <CardDescription>
              Edita días, horarios y duración. Arrastra un día <strong>sobre otro con horario</strong> para
              <strong> fusionarlos</strong> (suma de tiempo). Arrástralo <strong>sobre un día vacío</strong> para
              <strong> moverlo</strong> allí sin sumar. Los demás días no se tocan.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Buscar bloque…" value={filter} onChange={e => setFilter(e.target.value)} className="h-8 w-44 text-sm" />
            <Button size="sm" onClick={saveAll} disabled={!dirtyCount || saving} className="bg-violet-600 hover:bg-violet-700 gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {dirtyCount ? `Guardar ${dirtyCount}` : 'Guardar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedBlocks.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No hay bloques con horario regular.</p>
        ) : (
          <div className="space-y-2.5">
            {sortedBlocks.map(block => {
              const pattern = getPattern(block);
              const days = dayCount(pattern);
              const week = totalWeekMinutes(pattern);
              const isDirty = !!edits[block.id];
              return (
                <div
                  key={block.id}
                  className={`rounded-lg border px-3 py-2.5 ${isDirty ? 'border-violet-300 bg-violet-50/50' : 'border-slate-200 bg-white'}`}
                >
                  {/* Linea 1: nombre + stats + acciones */}
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{block.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{block.id}</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                      {days} {days === 1 ? 'día' : 'días'}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${
                      week > 8 * 60
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {fmtHours(week)}/sem
                    </span>
                    {week > 8 * 60 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> carga alta
                      </span>
                    )}
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => shortenAllSlots(block)}>
                      <Minus className="h-3 w-3" /> −30min
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => unifyAllDays(block)}>
                      <Combine className="h-3 w-3" /> Unificar slots
                    </Button>
                    {isDirty && (
                      <button onClick={() => resetBlock(block)} className="text-[10px] text-slate-500 hover:text-red-600 underline underline-offset-2">
                        deshacer
                      </button>
                    )}
                  </div>

                  {/* Hint contextual durante drag: explica las dos operaciones disponibles */}
                  {drag?.blockId === block.id && (
                    <div className="mb-1.5 text-[10px] text-violet-700 font-medium inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded px-2 py-1">
                      <MoveRight className="h-3 w-3" /> soltar en día vacío → <strong>mover</strong>
                      <span className="text-violet-400">·</span>
                      <Combine className="h-3 w-3" /> soltar en día con horario → <strong>fusionar</strong>
                    </div>
                  )}

                  {/* Linea 2: chips de dias (draggable + dropzones) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DAYS.map(d => {
                      const slots = pattern[d.key] || [];
                      const present = slots.length > 0;
                      const dragActiveHere = drag?.blockId === block.id && drag?.day !== d.key;
                      const isDropTarget = dragOver?.blockId === block.id && dragOver?.day === d.key;

                      if (!present) {
                        // Chip vacío. En estado normal funciona como botón "+ día".
                        // Durante drag activo del MISMO bloque, se convierte en dropzone
                        // visual de "MOVER aquí".
                        return (
                          <div
                            key={d.key}
                            onClick={() => { if (!drag) addDay(block, d.key); }}
                            onDragOver={(e) => onDragOver(e, block.id, d.key)}
                            onDragLeave={() => onDragLeave(block.id, d.key)}
                            onDrop={(e) => onDrop(e, block, d.key)}
                            className={`inline-flex items-center gap-1 rounded border-dashed border px-2 py-1 text-[11px] transition-colors ${
                              dragActiveHere
                                ? (isDropTarget
                                    ? 'border-violet-500 bg-violet-100 ring-2 ring-violet-400 text-violet-800 border-solid cursor-copy'
                                    : 'border-violet-400 bg-violet-50/60 text-violet-700 cursor-copy')
                                : 'border-slate-300 text-slate-400 hover:text-violet-700 hover:border-violet-300 cursor-pointer'
                            }`}
                            title={dragActiveHere ? `Mover a ${d.label}` : `Agregar ${d.label}`}
                          >
                            {dragActiveHere ? <MoveRight className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                            {d.label}
                          </div>
                        );
                      }
                      const isDragging = drag?.blockId === block.id && drag?.day === d.key;
                      return (
                        <div
                          key={d.key}
                          // El chip completo es la dropzone, pero NO es draggable.
                          // Sólo el "handle" interno (gripón ancho con la etiqueta del día) inicia el drag.
                          // Eso evita el problema de que los <Input> capturen el mousedown y bloqueen el drag.
                          onDragOver={(e) => onDragOver(e, block.id, d.key)}
                          onDragLeave={() => onDragLeave(block.id, d.key)}
                          onDrop={(e) => onDrop(e, block, d.key)}
                          className={`relative inline-flex items-center gap-1 rounded border pr-1.5 py-0.5 text-[11px] transition-colors overflow-hidden ${
                            isDragging
                              ? 'opacity-40 border-violet-300 bg-violet-50'
                              : isDropTarget
                                ? 'border-violet-500 bg-violet-100 ring-2 ring-violet-300'
                                : dragActiveHere
                                  ? 'border-slate-400 bg-white shadow-sm'
                                  : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                          }`}
                          title={dragActiveHere ? `Fusionar en ${d.label}` : ''}
                        >
                          {dragActiveHere && !isDragging && (
                            <span className="absolute -top-2 left-1 text-[8px] font-bold tracking-wide bg-violet-600 text-white rounded px-1 py-px leading-none pointer-events-none z-10">
                              ⊕ fusionar
                            </span>
                          )}
                          {/* Drag handle ancho — solo este elemento es draggable.
                              Cubre toda la zona del nombre del día y el grip,
                              da ~52px de superficie agarrable garantizada. */}
                          <div
                            draggable
                            onDragStart={(e) => onDragStart(e, block.id, d.key)}
                            onDragEnd={onDragEnd}
                            className="inline-flex items-center gap-1 self-stretch px-1.5 mr-1 bg-slate-200/70 hover:bg-slate-300/70 active:bg-slate-300 cursor-grab active:cursor-grabbing select-none"
                            title="Arrastra para mover o fusionar"
                          >
                            <GripHorizontal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="font-bold text-slate-800 text-[11px]">{d.label}</span>
                          </div>
                          {slots.map((sl, i) => (
                            <span key={i} className="inline-flex items-center gap-0.5">
                              <Input
                                value={sl.from || ''}
                                onChange={e => updateSlot(block, d.key, i, 'from', e.target.value)}
                                className="h-5 text-[10px] px-1 py-0 w-12 font-mono border-slate-200"
                              />
                              <span className="text-slate-400">–</span>
                              <Input
                                value={sl.to || ''}
                                onChange={e => updateSlot(block, d.key, i, 'to', e.target.value)}
                                className="h-5 text-[10px] px-1 py-0 w-12 font-mono border-slate-200"
                              />
                              {slots.length > 1 && (
                                <button
                                  onClick={(ev) => { ev.stopPropagation(); removeSlot(block, d.key, i); }}
                                  className="text-slate-300 hover:text-red-500"
                                  title="Quitar este slot"
                                ><X className="h-3 w-3" /></button>
                              )}
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-500 ml-0.5">{fmtHours(dayMinutes(slots))}</span>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); removeDay(block, d.key); }}
                            className="text-slate-300 hover:text-red-600 ml-0.5"
                            title="Quitar día"
                          ><X className="h-3.5 w-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
