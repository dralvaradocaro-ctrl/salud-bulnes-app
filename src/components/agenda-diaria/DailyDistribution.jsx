import React, { useState } from 'react';
import { Shuffle, Pencil, X, Save, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ALL_BEDS } from './bedCatalog';
import { KIND_CLASS } from './roster';

/**
 * Vista final del reparto (estilo planilla de agenda) + edición manual.
 *
 * Props:
 *  - visitBedCodes: códigos de cama con visita
 *  - visitDocs: [{ doctor_id, capacity }]
 *  - interns: [{ id, name }]
 *  - docName(id)
 *  - doctorSeed, onRedistribute()  → re-aleatoriza médicos (internos conservan salas)
 *  - internSeed
 *  - bedOverrides, setBedOverrides
 *  - supervisorOverrides, setSupervisorOverrides
 */
export default function DailyDistribution({
  result, roster, visitBedCodes, visitDocs, interns, docName,
  onRedistribute,
  bedOverrides, setBedOverrides,
  supervisorOverrides, setSupervisorOverrides,
  onSave, saving, savedExists, dirty, onExportPdf,
}) {
  const [editMode, setEditMode] = useState(false);

  const setBedAssignee = (code, assigneeId) =>
    setBedOverrides((p) => {
      const next = { ...p };
      if (!assigneeId) delete next[code];
      else next[code] = assigneeId;
      return next;
    });

  const clearOverrides = () => setBedOverrides({});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Reparto del día</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditMode((e) => !e)}>
            <Pencil className="h-4 w-4 mr-1" /> {editMode ? 'Terminar edición' : 'Editar'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRedistribute}>
            <Shuffle className="h-4 w-4 mr-1" /> Redistribuir
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPdf}>
            <FileDown className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Guardando…' : savedExists ? (dirty ? 'Guardar cambios' : 'Guardado') : 'Guardar'}
          </Button>
        </div>
      </div>

      {Object.keys(bedOverrides).length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-violet-50 border border-violet-100 px-3 py-2 text-sm text-violet-700">
          <span>{Object.keys(bedOverrides).length} cama(s) asignadas manualmente.</span>
          <button onClick={clearOverrides} className="text-violet-600 hover:underline flex items-center gap-1">
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        </div>
      )}

      {/* Tabla tipo planilla institucional */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {roster.rows.map((r) => (
          <RosterRow key={r.id} name={r.name} parts={r.parts} num={r.num} />
        ))}
        {roster.interns.map((it) => (
          <RosterRow
            key={it.id}
            name={`INT ${it.name || 'Interno'}`}
            parts={[{ text: it.label, kind: 'visita' }]}
            num={it.num}
            muted
          />
        ))}
        {roster.rows.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Aún no hay actividades para mostrar.
          </p>
        )}
      </div>

      {/* Edición manual */}
      {editMode && (
        <div className="space-y-4">
          {interns.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Supervisor de cada interno
              </p>
              <div className="space-y-2">
                {result.interns.map((it) => (
                  <div key={it.id} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-40 truncate">INT {it.name || 'Interno'}</span>
                    <Select
                      value={it.supervisorId || ''}
                      onValueChange={(v) => setSupervisorOverrides((p) => ({ ...p, [it.id]: v }))}
                    >
                      <SelectTrigger className="w-56"><SelectValue placeholder="Médico supervisor" /></SelectTrigger>
                      <SelectContent>
                        {visitDocs.map((v) => (
                          <SelectItem key={v.doctor_id} value={v.doctor_id}>{docName(v.doctor_id)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Asignar camas puntuales (override)
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Por defecto el reparto es automático. Aquí puedes fijar una cama a un médico o interno
              concreto (ej. sumar una visita a una doctora).
            </p>
            <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-auto pr-1">
              {visitBedCodes
                .slice()
                .sort((a, b) => ALL_BEDS.findIndex((x) => x.code === a) - ALL_BEDS.findIndex((x) => x.code === b))
                .map((code) => {
                  const current = result.assigned[code];
                  return (
                    <div key={code} className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500 w-28 shrink-0">{code}</span>
                      <Select
                        value={current || ''}
                        onValueChange={(v) => setBedAssignee(code, v)}
                      >
                        <SelectTrigger className="flex-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {visitDocs.map((v) => (
                            <SelectItem key={v.doctor_id} value={v.doctor_id}>{docName(v.doctor_id)}</SelectItem>
                          ))}
                          {result.interns.map((it) => (
                            <SelectItem key={it.id} value={it.id}>INT {it.name || 'Interno'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {bedOverrides[code] && (
                        <button onClick={() => setBedAssignee(code, null)} title="Quitar override">
                          <X className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RosterRow({ name, parts, num, muted }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <span className={`font-bold text-sm w-40 shrink-0 ${muted ? 'text-slate-500' : 'text-slate-900'}`}>
        {(name || '').toUpperCase()}
      </span>
      <span className="flex-1 text-sm leading-snug">
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300"> + </span>}
            <span className={KIND_CLASS[p.kind] || 'text-slate-700'}>{p.text}</span>
          </React.Fragment>
        ))}
      </span>
      {num != null && <span className="font-bold text-sm text-slate-900 w-6 text-right">{num}</span>}
    </div>
  );
}
