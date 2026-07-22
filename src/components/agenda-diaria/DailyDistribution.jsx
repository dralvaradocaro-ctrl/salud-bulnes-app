import React, { useState } from 'react';
import { Shuffle, Pencil, X, Save, FileDown, Printer, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  date, day, telemed = [],
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
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Guardando…' : savedExists ? (dirty ? 'Guardar cambios' : 'Guardado') : 'Guardar'}
          </Button>
        </div>
      </div>

      <PrintPreview roster={roster} date={date} day={day} telemed={telemed} />

      {Object.keys(bedOverrides).length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-violet-50 border border-violet-100 px-3 py-2 text-sm text-violet-700">
          <span>{Object.keys(bedOverrides).length} cama(s) asignadas manualmente.</span>
          <button onClick={clearOverrides} className="text-violet-600 hover:underline flex items-center gap-1">
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        </div>
      )}

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

export function DoctorLoadPanel({
  result, roster, visitDocs, doctors, docName, selectedDoctor, onSelectDoctor,
  visitBedCodes, onAssignSala, onAssignBed, onToggleDoctor,
}) {
  const [assignmentChoice, setAssignmentChoice] = useState('');
  const activeIds = new Set(visitDocs.map(item => item.doctor_id));
  const resultByDoctor = Object.fromEntries(result.doctors.map(item => [item.doctor_id, item]));
  const doctorById = Object.fromEntries(doctors.map(doctor => [doctor.id, doctor]));
  const rosterByDoctor = Object.fromEntries(roster.rows.map(row => [row.id, row]));
  const inactiveDoctors = doctors.filter(doctor => !activeIds.has(doctor.id));
  const visitSet = new Set(visitBedCodes);
  const salas = [];
  const seenSalas = new Set();
  ALL_BEDS.forEach(bed => {
    if (seenSalas.has(bed.salaId)) return;
    seenSalas.add(bed.salaId);
    const codes = ALL_BEDS.filter(item => item.salaId === bed.salaId && visitSet.has(item.code)).map(item => item.code);
    if (codes.length) salas.push({ id: bed.salaId, label: `${bed.serviceShort} ${bed.salaLabel}`, count: codes.length, codes });
  });

  return (
    <aside className="no-print space-y-3 xl:sticky xl:top-20">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <UserCheck className="h-4 w-4" /> Médicos activos
          </p>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">{visitDocs.length}</span>
        </div>
        <div className="space-y-2">
          {visitDocs.map(item => {
            const distribution = resultByDoctor[item.doctor_id];
            const selected = selectedDoctor === item.doctor_id;
            return (
              <div
                key={item.doctor_id}
                onClick={() => onSelectDoctor(item.doctor_id)}
                className={`w-full cursor-pointer rounded-lg border p-2.5 text-left transition ${selected ? 'border-emerald-600 bg-white ring-2 ring-emerald-200' : 'border-emerald-100 bg-white/80 hover:border-emerald-300'}`}
              >
                <span className="block truncate text-sm font-bold text-slate-900">{doctorById[item.doctor_id]?.display_name || doctorById[item.doctor_id]?.name || docName(item.doctor_id)}</span>
                <span className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Potencial: <strong className="text-slate-700">{item.capacity ?? 'sin tope'}</strong></span>
                  <span className="text-emerald-700">Propuesta: <strong>{distribution?.total ?? 0}</strong></span>
                </span>
                {distribution?.supervised?.length > 0 && (
                  <span className="mt-1 block text-[11px] text-slate-500">Incluye {distribution.supervised.length} interno(s) supervisado(s)</span>
                )}
                <span className="mt-2 flex items-center justify-between border-t border-emerald-100 pt-2 text-[11px] font-semibold text-emerald-800">
                  Activo para visita
                  <Switch
                    checked
                    aria-label={`Desactivar a ${docName(item.doctor_id)}`}
                    onClick={event => event.stopPropagation()}
                    onCheckedChange={() => onToggleDoctor?.(item.doctor_id, false)}
                  />
                </span>
                {selected && (
                  <div className="mt-2 border-t border-violet-100 pt-2" onClick={event => event.stopPropagation()}>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700">Fijar asignación</p>
                    <Select
                      value={assignmentChoice}
                      onValueChange={value => {
                        setAssignmentChoice(value);
                        if (value.startsWith('sala:')) onAssignSala(value.slice(5), item.doctor_id);
                        if (value.startsWith('cama:')) onAssignBed(value.slice(5), item.doctor_id);
                        setTimeout(() => setAssignmentChoice(''), 0);
                      }}
                    >
                      <SelectTrigger className="h-8 w-full bg-white text-xs">
                        <SelectValue placeholder="Elegir sala o cama…" />
                      </SelectTrigger>
                      <SelectContent>
                        {salas.map(sala => (
                          <React.Fragment key={sala.id}>
                            <SelectItem value={`sala:${sala.id}`} className="font-semibold">
                              {sala.label} completa ({sala.count})
                            </SelectItem>
                            {sala.codes.map(code => {
                              const bed = ALL_BEDS.find(candidate => candidate.code === code);
                              return (
                                <SelectItem key={code} value={`cama:${code}`}>
                                  ↳ {sala.label} · Cama {bed?.cell || code}
                                </SelectItem>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1.5 text-[10px] leading-snug text-violet-600">La selección queda fija sobre la propuesta automática.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <UserX className="h-4 w-4" /> Médicos inactivos
          </p>
          <span className="rounded-full bg-slate-300 px-2 py-0.5 text-xs font-bold text-slate-700">{inactiveDoctors.length}</span>
        </div>
        {inactiveDoctors.length ? (
          <div className="space-y-1.5">
            {inactiveDoctors.map(doctor => {
              const row = rosterByDoctor[doctor.id];
              const reason = row?.parts.filter(part => part.kind !== 'visita').map(part => part.text).join(' · ') || 'Sin visita asignada';
              return (
                <div key={doctor.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-700">{doctor.display_name || doctor.name || docName(doctor.id)}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{reason}</p>
                  </div>
                  <Switch
                    checked={false}
                    aria-label={`Reactivar a ${doctor.display_name || doctor.name || docName(doctor.id)}`}
                    onCheckedChange={() => onToggleDoctor?.(doctor.id, true)}
                  />
                </div>
              );
            })}
          </div>
        ) : <p className="text-xs text-slate-400">No hay médicos inactivos registrados.</p>}
      </div>

    </aside>
  );
}

const fmtDmy = (iso) => iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : '';
const hhmm = (t) => (t || '').slice(0, 5);
const blockDoctorIds = (b) =>
  Array.isArray(b?.doctor_ids) && b.doctor_ids.length ? b.doctor_ids.filter(Boolean) : (b?.doctor_id ? [b.doctor_id] : []);

function PrintPreview({ roster, date, day, telemed }) {
  const bloqueos = (day?.bloqueos || []).filter((b) => !b.suspended && b.category !== 'feriado');
  const doctorName = (id) => roster.rows.find((r) => r.id === id)?.name || String(id || '').toUpperCase();
  const blockDoctors = (b) => (b?.all_doctors ? 'Todos' : blockDoctorIds(b).map(doctorName).join(' + '));
  return (
    <section className="print-preview rounded-lg border border-slate-300 bg-white p-5 shadow-sm print:block print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="mb-4 flex items-start gap-3">
        <img src="/logo-hospital.png" alt="Hospital de Bulnes" className="h-14 w-auto object-contain" />
        <div>
          <p className="text-lg font-bold tracking-wide text-slate-900">AGENDA {fmtDmy(date)}</p>
          <p className="text-xs font-semibold uppercase text-slate-500">Hospital Comunitario de Salud Familiar de Bulnes</p>
        </div>
      </div>
      <div className="overflow-hidden border border-slate-300">
        {roster.rows.map((r) => (
          <PrintRosterRow key={r.id} name={r.name} parts={r.parts} num={r.num} />
        ))}
        {roster.interns.map((it) => (
          <PrintRosterRow
            key={it.id}
            name={`INT ${it.name || 'Interno'}`}
            parts={[{ text: it.label, kind: 'visita' }]}
            num={it.num}
          />
        ))}
      </div>
      {bloqueos.length > 0 && (
        <div className="mt-4 text-[12px] leading-snug">
          <p className="mb-1 font-bold text-slate-900">BLOQUEOS:</p>
          {bloqueos.map((b, i) => (
            <p key={b.block_id || i} className="text-slate-700">
              <span className="font-semibold tabular-nums">{b.from ? `${hhmm(b.from)}${b.to ? `-${hhmm(b.to)}` : ''}` : ''}</span>
              {' '}{blockDoctors(b) ? `${blockDoctors(b)} ` : ''}{b.name}
            </p>
          ))}
        </div>
      )}
      {telemed.length > 0 && (
        <div className="mt-4 text-[12px] leading-snug">
          <p className="mb-1 font-bold text-slate-900">TELEMEDICINA:</p>
          {telemed.map((t) => (
            <p key={t.id} className="text-slate-700">
              {t.specialty || 'Telemedicina'}{t.time ? ` ${t.time}` : ''}{t.doctor ? ` ${t.doctor}` : ''}
            </p>
          ))}
        </div>
      )}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-preview, .print-preview * { visibility: visible; }
          .print-preview { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: letter; margin: 0.55in; }
        }
      `}</style>
    </section>
  );
}

function PrintRosterRow({ name, parts, num }) {
  return (
    <div className="grid min-h-8 grid-cols-[150px_1fr_36px] border-b border-slate-300 text-[12px] last:border-b-0">
      <div className="border-r border-slate-300 bg-slate-50 px-2 py-1.5 font-bold text-slate-900">
        {(name || '').toUpperCase()}
      </div>
      <div className="px-2 py-1.5 leading-snug">
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-400"> + </span>}
            <span className={KIND_CLASS[p.kind] || 'text-slate-700'}>{p.text}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="border-l border-slate-300 px-2 py-1.5 text-right font-bold text-slate-900">
        {num ?? ''}
      </div>
    </div>
  );
}
