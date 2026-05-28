import React, { useMemo } from 'react';
import { Lock } from 'lucide-react';
import { BED_CATALOG, BED_STATE, defaultBedState } from './bedCatalog';

const STATE_STYLE = {
  [BED_STATE.VISIT]: 'bg-blue-50 border-blue-300 text-blue-800',
  [BED_STATE.NOVISIT]: 'bg-amber-50 border-amber-300 text-amber-700 line-through decoration-amber-400 decoration-2',
  [BED_STATE.BLOCKED]: 'bg-slate-200 border-slate-400 text-slate-600 line-through decoration-slate-500 decoration-2',
  [BED_STATE.EMPTY]: 'bg-slate-50 border-dashed border-slate-300 text-slate-400 italic',
};

/**
 * Vista gráfica de servicios → salas → camas, estilo planilla de gestión.
 * bedStates: { [code]: 'visit'|'novisit'|'blocked'|'empty' }
 *            (default = defaultBedState(code): bloqueada si es social, si no visita)
 * onToggle(code): cicla el estado de una cama.
 */
export default function BedMap({ bedStates, onToggle }) {
  const stateOf = (code) => bedStates[code] || defaultBedState(code);

  return (
    <div className="space-y-4">
      <Legend />
      <div className="grid gap-4 md:grid-cols-2">
        {BED_CATALOG.map((svc) => (
          <ServiceCard key={svc.id} svc={svc} stateOf={stateOf} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ svc, stateOf, onToggle }) {
  const counts = useMemo(() => {
    const c = { visit: 0, novisit: 0, blocked: 0, empty: 0 };
    svc.salas.forEach((s) =>
      s.beds.forEach((b) => {
        const st = stateOf(b.code);
        if (st === BED_STATE.VISIT) c.visit++;
        else if (st === BED_STATE.NOVISIT) c.novisit++;
        else if (st === BED_STATE.BLOCKED) c.blocked++;
        else c.empty++;
      }),
    );
    return c;
  }, [svc, stateOf]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800 text-sm">{svc.name}</span>
          <span className="ml-2 text-xs text-slate-400">{svc.short}</span>
        </div>
        <span className="text-xs text-slate-500">
          {counts.visit} visita{counts.visit !== 1 ? 's' : ''}
          {counts.blocked > 0 && ` · ${counts.blocked} bloq.`}
          {counts.novisit > 0 && ` · ${counts.novisit} sin`}
          {counts.empty > 0 && ` · ${counts.empty} vacía${counts.empty !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="p-3 space-y-2.5">
        {svc.salas.map((sala) => (
          <div key={sala.id}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
              {sala.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sala.beds.map((b) => {
                const st = stateOf(b.code);
                return (
                  <button
                    key={b.code}
                    onClick={() => onToggle(b.code)}
                    title={`${b.code} — click para cambiar estado`}
                    className={`px-2 py-1 rounded border text-xs font-mono transition-colors inline-flex items-center gap-1 ${STATE_STYLE[st]}`}
                  >
                    {st === BED_STATE.BLOCKED && <Lock className="h-3 w-3" />}
                    {b.code}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { st: BED_STATE.VISIT, label: 'Ocupada — con visita' },
    { st: BED_STATE.NOVISIT, label: 'Ocupada — sin visita' },
    { st: BED_STATE.BLOCKED, label: 'Bloqueada (social)' },
    { st: BED_STATE.EMPTY, label: 'Vacía' },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
      {items.map((it) => (
        <span key={it.st} className="inline-flex items-center gap-1.5">
          <span className={`inline-block w-4 h-4 rounded border ${STATE_STYLE[it.st]}`} />
          {it.label}
        </span>
      ))}
      <span className="text-slate-400">· Click en una cama para cambiar su estado</span>
    </div>
  );
}
