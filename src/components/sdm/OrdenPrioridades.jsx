import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, RotateCcw, AlertCircle, ListOrdered, Save } from 'lucide-react';
import {
  DEFAULT_BLOCK_ORDER,
  PHASE_LABELS,
  FIXED_PHASES,
  getBuildPriorityOrder,
  setBuildPriorityOrder,
  resetBuildPriorityOrder,
} from './lib/buildPriorityOrder';
import { toast } from 'sonner';

// Agrupa items por phase preservando el orden original.
function groupByPhase(order) {
  const groups = {};
  order.forEach((it, idx) => {
    const k = it.phase || 'otro';
    if (!groups[k]) groups[k] = [];
    groups[k].push({ ...it, _idx: idx });
  });
  return groups;
}

export default function OrdenPrioridades({ onApplied }) {
  const [order, setOrder] = useState(() => getBuildPriorityOrder());
  const [dirty, setDirty] = useState(false);
  const [scope, setScope] = useState('current'); // 'current' | 'next'

  useEffect(() => { setOrder(getBuildPriorityOrder()); }, []);

  const move = (idx, delta) => {
    const target = idx + delta;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setOrder(next);
    setDirty(true);
  };

  const handleReset = () => {
    if (!window.confirm('Restaurar el orden por defecto?')) return;
    resetBuildPriorityOrder();
    setOrder(DEFAULT_BLOCK_ORDER);
    setDirty(false);
    toast.success('Orden restaurado al default clínico.');
  };

  const handleSave = async () => {
    if (scope === 'current') {
      const ok = window.confirm(
        '¿Aplicar este orden a la agenda DE ESTA SEMANA?\n\n' +
        'Los bloques se reasignan inmediatamente respetando el nuevo orden. ' +
        'Las edits manuales que ya hiciste se mantienen.'
      );
      if (!ok) return;
      setBuildPriorityOrder(order);
      await onApplied?.();
      setDirty(false);
      toast.success('Orden aplicado a la semana actual.');
    } else {
      const ok = window.confirm(
        '¿Aplicar este orden DESDE LA PRÓXIMA SEMANA?\n\n' +
        'La agenda actual queda intacta. La próxima semana en adelante usará el nuevo orden.'
      );
      if (!ok) return;
      // Persistimos igual; las semanas anteriores ya están guardadas con su
      // distribución antigua, así que el nuevo orden solo afecta semanas
      // que aún no se hayan generado.
      setBuildPriorityOrder(order);
      setDirty(false);
      const t = new Date();
      const offset = t.getDay() === 0 ? 1 : (8 - t.getDay());
      const nm = new Date(t); nm.setDate(t.getDate() + offset);
      toast.success(`Orden agendado a partir del lunes ${nm.toLocaleDateString('es-CL')}.`);
    }
  };

  const groups = groupByPhase(order);
  const phaseKeys = Object.keys(PHASE_LABELS).filter(k => groups[k]?.length);

  return (
    <div className="space-y-4">
      {/* Banner pregunta de alcance */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-3 text-violet-900">
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold mb-1">¿Estos cambios de prioridad afectan la estructura de la agenda?</p>
            <p>Sí — al subir un bloque, será resuelto antes que los demás y se quedará con el médico preferido cuando haya conflicto de horario. Elige desde cuándo entra en vigor:</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input type="radio" name="scope" value="current" checked={scope === 'current'} onChange={() => setScope('current')} />
            <span><strong>Desde esta agenda</strong> (cambia la semana en curso)</span>
          </label>
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input type="radio" name="scope" value="next" checked={scope === 'next'} onChange={() => setScope('next')} />
            <span><strong>Desde la próxima semana</strong> (la actual queda igual)</span>
          </label>
          <Button size="sm" variant="outline" onClick={handleReset} className="ml-auto gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar default
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty} className="bg-violet-600 hover:bg-violet-700 gap-1.5">
            <Save className="h-3.5 w-3.5" /> Guardar y aplicar
          </Button>
        </div>
      </div>

      {/* Fases fijas (referencia) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Fases de construcción de la agenda
          </CardTitle>
          <CardDescription>
            La agenda se arma en este orden secuencial. Las fases marcadas como <em>fijas</em> son operativas
            (vienen de la rotación o del calendario) y no se reordenan. Los bloqueos individuales sí se pueden
            reordenar abajo dentro de cada categoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-1.5 text-sm">
            {FIXED_PHASES.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{i + 1}</span>
                <span className="text-slate-800">{p.label}</span>
                {p.fixed && <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-slate-50 border border-slate-200 px-1.5 rounded">fija</span>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Lista editable de bloqueos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Orden de bloqueos / programas</CardTitle>
          <CardDescription>
            El bloque que está más arriba se resuelve primero cuando dos bloques compiten por un mismo médico en
            horarios superpuestos. Usa las flechas para subir/bajar. Las categorías son referenciales — puedes
            mover ítems entre ellas (cambia el orden global).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {phaseKeys.map(phaseKey => (
              <div key={phaseKey}>
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  {PHASE_LABELS[phaseKey] || phaseKey}
                </h3>
                <div className="space-y-1">
                  {groups[phaseKey].map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-slate-100 hover:border-slate-300 hover:bg-slate-50/60 transition-colors"
                    >
                      <span className="inline-flex h-6 w-7 items-center justify-center rounded bg-slate-100 text-slate-600 text-[11px] font-mono font-bold">
                        {it._idx + 1}
                      </span>
                      <span className="flex-1 text-sm text-slate-800">{it.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{it.id}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => move(it._idx, -1)} disabled={it._idx === 0}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => move(it._idx, 1)} disabled={it._idx === order.length - 1}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
