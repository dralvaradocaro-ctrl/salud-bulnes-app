import React, { useEffect, useMemo, useState } from 'react';
import { sdmSupabase as supabase, explainSdmWriteError } from './lib/sdmSupabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Minus, Combine, Save, Clock, AlertTriangle } from 'lucide-react';
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

// HH:MM → minutos del día
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
function totalWeekMinutes(pattern) {
  return DAYS.reduce((sum, d) => {
    const slots = pattern?.[d.key] || [];
    return sum + slots.reduce((s, sl) => s + slotMinutes(sl), 0);
  }, 0);
}
function dayCount(pattern) {
  return DAYS.reduce((c, d) => c + ((pattern?.[d.key] || []).length > 0 ? 1 : 0), 0);
}
function fmtHours(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} h`;
  return `${h}h ${m}m`;
}

// "Unificar" — si un día tiene múltiples slots, los junta en uno desde
// el min(from) al max(to).
function unifyDay(slots) {
  if (!Array.isArray(slots) || slots.length <= 1) return slots || [];
  const from = slots.reduce((min, s) => Math.min(min, toMin(s.from)), Infinity);
  const to   = slots.reduce((max, s) => Math.max(max, toMin(s.to)),   -Infinity);
  if (!isFinite(from) || !isFinite(to)) return slots;
  return [{ from: fromMin(from), to: fromMin(to) }];
}

export default function BlockScheduleEditor({ onApplied }) {
  const [blocks, setBlocks] = useState([]);
  const [edits, setEdits] = useState({}); // { blockId: newWeekdayPattern }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('sdm_block_templates')
        .select('*');
      if (!alive) return;
      if (error) toast.error('Error cargando bloques: ' + (explainSdmWriteError(error) || error.message));
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
    // Solo bloques con weekday_pattern definido (regulares).
    return matched
      .filter(b => {
        const wp = b.weekday_pattern || {};
        return Object.values(wp).some(slots => Array.isArray(slots) && slots.length > 0);
      })
      .sort((a, b) => priorityFor(a.id, order) - priorityFor(b.id, order));
  }, [blocks, filter, order]);

  const dirtyCount = Object.keys(edits).length;

  // ── helpers para mutar el pattern de un bloque ─────────────────────────
  const getPattern = (block) => edits[block.id] || block.weekday_pattern || {};
  const setPattern = (blockId, newPattern) => {
    setEdits(prev => ({ ...prev, [blockId]: newPattern }));
  };

  const removeSlot = (block, day, idx) => {
    const wp = { ...getPattern(block) };
    const slots = (wp[day] || []).slice();
    slots.splice(idx, 1);
    if (slots.length === 0) delete wp[day];
    else wp[day] = slots;
    setPattern(block.id, wp);
  };

  const removeDay = (block, day) => {
    const wp = { ...getPattern(block) };
    delete wp[day];
    setPattern(block.id, wp);
  };

  const addDay = (block, day) => {
    const wp = { ...getPattern(block) };
    if (wp[day]?.length) return; // ya existe
    // Default: copia el primer slot de cualquier otro día con datos.
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

  // "Reducir duración" — corta 30 min al final de cada slot.
  const shortenAllSlots = (block) => {
    const wp = { ...getPattern(block) };
    Object.keys(wp).forEach(d => {
      wp[d] = (wp[d] || []).map(s => {
        const to = toMin(s.to) - 30;
        const from = toMin(s.from);
        if (to <= from + 15) return s; // mínimo 15min, no recorto más
        return { ...s, to: fromMin(to) };
      });
    });
    setPattern(block.id, wp);
  };

  // "Unificar" — todos los días que tengan múltiples slots se condensan a uno.
  const unifyAll = (block) => {
    const wp = { ...getPattern(block) };
    Object.keys(wp).forEach(d => { wp[d] = unifyDay(wp[d]); });
    setPattern(block.id, wp);
  };

  const resetBlock = (block) => {
    setEdits(prev => {
      const cp = { ...prev };
      delete cp[block.id];
      return cp;
    });
  };

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
      const { error } = await supabase
        .from('sdm_block_templates')
        .update({ weekday_pattern: edits[id] })
        .eq('id', id);
      if (error) { fail++; toast.error(`✗ ${id}: ${error.message}`); }
      else okCount++;
    }
    setSaving(false);
    if (okCount) toast.success(`${okCount} bloque(s) actualizado(s).`);
    setEdits({});
    // recarga local + propaga al agenda
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
              Edita cuántas veces por semana se repite cada bloqueo, sus horarios, y unifica múltiples slots
              de un mismo día en uno solo más corto.
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
          <div className="space-y-3">
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
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{block.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{block.id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {days} {days === 1 ? 'día' : 'días'}/sem
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {fmtHours(week)}/sem
                      </span>
                      {isDirty && (
                        <button onClick={() => resetBlock(block)} className="text-[10px] text-slate-500 hover:text-red-600 underline underline-offset-2">
                          deshacer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Días + slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {DAYS.map(d => {
                      const slots = pattern[d.key] || [];
                      const present = slots.length > 0;
                      return (
                        <div
                          key={d.key}
                          className={`rounded border px-2 py-1.5 ${present ? 'border-slate-200 bg-slate-50/60' : 'border-dashed border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[11px] font-bold ${present ? 'text-slate-800' : 'text-slate-400'}`}>
                              {d.label}
                            </span>
                            {present ? (
                              <button onClick={() => removeDay(block, d.key)} className="text-slate-400 hover:text-red-600" title="Quitar día completo">
                                <X className="h-3 w-3" />
                              </button>
                            ) : (
                              <button onClick={() => addDay(block, d.key)} className="text-slate-400 hover:text-violet-700" title="Agregar día">
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {present && (
                            <div className="space-y-1">
                              {slots.map((sl, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <Input
                                    value={sl.from || ''}
                                    onChange={e => updateSlot(block, d.key, i, 'from', e.target.value)}
                                    placeholder="HH:MM"
                                    className="h-6 text-[11px] px-1 py-0 w-16 font-mono"
                                  />
                                  <span className="text-slate-400 text-xs">–</span>
                                  <Input
                                    value={sl.to || ''}
                                    onChange={e => updateSlot(block, d.key, i, 'to', e.target.value)}
                                    placeholder="HH:MM"
                                    className="h-6 text-[11px] px-1 py-0 w-16 font-mono"
                                  />
                                  <button
                                    onClick={() => removeSlot(block, d.key, i)}
                                    className="text-slate-400 hover:text-red-600 ml-auto"
                                    title="Quitar slot"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <span className="text-[10px] text-slate-400 block">
                                {fmtHours(slots.reduce((s, sl) => s + slotMinutes(sl), 0))}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => shortenAllSlots(block)}>
                      <Minus className="h-3 w-3" /> Reducir 30 min
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => unifyAll(block)}>
                      <Combine className="h-3 w-3" /> Unificar slots del día
                    </Button>
                    {week > 8 * 60 && (
                      <span className="text-[10px] inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded ml-auto">
                        <AlertTriangle className="h-3 w-3" /> Carga alta ({fmtHours(week)})
                      </span>
                    )}
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
