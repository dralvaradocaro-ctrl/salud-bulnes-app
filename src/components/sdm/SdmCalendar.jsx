import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2, AlertCircle } from 'lucide-react';
import { sdmSupabase as supabase, explainSdmWriteError } from './lib/sdmSupabase';

const ABSENCE_TYPES = ['FL', 'P', 'A', 'DT', 'LM', 'CAP', 'PAS', 'G', 'OTRO'];
const ABSENCE_LABELS = {
  FL: 'Feriado Legal', P: 'Postnatal', A: 'Administrativo', DT: 'Devolución Tiempo',
  LM: 'Licencia Médica', CAP: 'Capacitación', PAS: 'Pasantía', G: 'Gerencia', OTRO: 'Otro',
};
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
const TURNO_COLOR = [
  'bg-slate-50 border-slate-300 text-slate-700',     // 0 volante
  'bg-rose-50 border-rose-300 text-rose-800',        // 1
  'bg-orange-50 border-orange-300 text-orange-800',  // 2
  'bg-amber-50 border-amber-300 text-amber-800',     // 3
  'bg-lime-50 border-lime-300 text-lime-800',        // 4
  'bg-sky-50 border-sky-300 text-sky-800',           // 5
  'bg-violet-50 border-violet-300 text-violet-800',  // 6
  'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800', // 7
];

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
// Devuelve la fecha del lunes de la semana del día. Domingo se considera fin de semana.
function startOfWeekMon(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0 dom .. 6 sab
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildMonthGrid(monthDate) {
  // 6 filas × 7 columnas que abarcan el mes
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const gridStart = startOfWeekMon(first);
  const cells = [];
  const d = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    cells.push({
      date: new Date(d),
      iso: fmt(d),
      inMonth: d.getMonth() === monthDate.getMonth(),
      isLast: d > last && d.getMonth() !== monthDate.getMonth(),
    });
    d.setDate(d.getDate() + 1);
  }
  // Recortar a 5 o 6 semanas según necesidad
  const lastUsedIdx = cells.findIndex((c, i) => i >= 28 && !c.inMonth && cells.slice(i).every(x => !x.inMonth));
  return lastUsedIdx > 0 ? cells.slice(0, lastUsedIdx) : cells;
}

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function SdmCalendar({ onChanged }) {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [doctors, setDoctors] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [shifts, setShifts] = useState([]);       // sdm_shift_calendar para el mes
  const [absences, setAbsences] = useState([]);   // sdm_absences para el mes
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState(null);

  const rangeStart = fmt(startOfMonth(monthDate));
  const rangeEnd   = fmt(endOfMonth(monthDate));

  async function loadAll() {
    setLoading(true);
    const [d, r, sc, ab] = await Promise.all([
      supabase.from('sdm_doctors').select('*').order('display_name'),
      supabase.from('sdm_shift_rotation').select('*'),
      supabase.from('sdm_shift_calendar').select('*').gte('date', rangeStart).lte('date', rangeEnd),
      supabase.from('sdm_absences').select('*').gte('date', rangeStart).lte('date', rangeEnd),
    ]);
    setDoctors(d.data || []);
    setRotation(r.data || []);
    setShifts(sc.data || []);
    setAbsences(ab.data || []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [rangeStart, rangeEnd]);

  const doctorName = (id) => doctors.find(x => x.id === id)?.display_name || id;

  // Mapas auxiliares
  const rotationByTurno = useMemo(() => {
    const m = {};
    rotation.forEach(r => { (m[r.turno_number] = m[r.turno_number] || []).push(r); });
    Object.values(m).forEach(arr => arr.sort((a, b) => (a.position || 1) - (b.position || 1)));
    return m;
  }, [rotation]);

  const shiftByDate = useMemo(() => Object.fromEntries(shifts.map(s => [s.date, s])), [shifts]);
  const absencesByDate = useMemo(() => {
    const m = {};
    absences.forEach(a => { (m[a.date] = m[a.date] || []).push(a); });
    return m;
  }, [absences]);

  // Aplica replacements: devuelve doctor_id efectivo + flag replaced.
  function effectiveDoctorsForDay(iso) {
    const s = shiftByDate[iso];
    if (!s) return [];
    const base = rotationByTurno[s.turno_number] || [];
    const reps = Array.isArray(s.replacements) ? s.replacements : [];
    return base.map(b => {
      const rep = reps.find(r => r.doctor_id === b.doctor_id);
      return {
        doctor_id: rep ? rep.replaced_by : b.doctor_id,
        original_doctor_id: b.doctor_id,
        replaced: !!rep,
        reason: rep?.reason || null,
      };
    });
  }

  const cells = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  function shiftMonth(delta) {
    setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function notifyChanged() { onChanged?.(); }

  // ─── Editor del día ──────────────────────────────────────────
  const editingShift = editingDate ? shiftByDate[editingDate] : null;
  const editingTurnoNumber = editingShift?.turno_number ?? null;
  const editingReplacements = Array.isArray(editingShift?.replacements) ? editingShift.replacements : [];
  const editingAbsences = (absencesByDate[editingDate] || []).slice().sort((a, b) => a.doctor_id.localeCompare(b.doctor_id));
  const editingBaseDoctors = editingTurnoNumber != null ? (rotationByTurno[editingTurnoNumber] || []) : [];

  async function upsertShift(date, patch) {
    const existing = shiftByDate[date];
    if (existing) {
      const { error } = await supabase.from('sdm_shift_calendar').update(patch).eq('date', date);
      if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return false; }
    } else {
      const payload = { date, turno_number: patch.turno_number ?? 0, replacements: patch.replacements ?? [], is_holiday: patch.is_holiday ?? false, ...patch };
      const { error } = await supabase.from('sdm_shift_calendar').insert(payload);
      if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return false; }
    }
    await loadAll();
    notifyChanged();
    return true;
  }

  async function setHoliday(date, value) {
    await upsertShift(date, { is_holiday: !!value });
  }
  async function setTurnoNumber(date, n) {
    await upsertShift(date, { turno_number: Number(n) });
  }
  async function setReplacement(date, originalDoctorId, replacedBy) {
    const cur = shiftByDate[date];
    const reps = Array.isArray(cur?.replacements) ? cur.replacements.slice() : [];
    const idx = reps.findIndex(r => r.doctor_id === originalDoctorId);
    if (!replacedBy) {
      if (idx >= 0) reps.splice(idx, 1);
    } else {
      if (idx >= 0) reps[idx] = { ...reps[idx], replaced_by: replacedBy };
      else reps.push({ doctor_id: originalDoctorId, replaced_by: replacedBy });
    }
    await upsertShift(date, { replacements: reps });
  }
  async function addAbsence(date, doctorId, type) {
    if (!doctorId || !type) return;
    const { error } = await supabase.from('sdm_absences').insert({ doctor_id: doctorId, date, type });
    if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    await loadAll();
    notifyChanged();
  }
  async function deleteAbsence(id) {
    const { error } = await supabase.from('sdm_absences').delete().eq('id', id);
    if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    await loadAll();
    notifyChanged();
  }

  const [absForm, setAbsForm] = useState({ doctor_id: '', type: 'A' });
  useEffect(() => { setAbsForm({ doctor_id: '', type: 'A' }); }, [editingDate]);

  return (
    <Card className="sdm-print-hide">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-5 w-5" />
          {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setMonthDate(startOfMonth(new Date()))}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={() => shiftMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-slate-500">Cargando…</p> : (
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-[10px] font-bold uppercase tracking-wide text-slate-500 text-center py-1">{h}</div>
            ))}
            {cells.map(cell => {
              const dow = cell.date.getDay(); // 0 dom 6 sab
              const isWeekend = dow === 0 || dow === 6;
              const shift = shiftByDate[cell.iso];
              const isHoliday = !!shift?.is_holiday;
              const eff = effectiveDoctorsForDay(cell.iso);
              const dayAbsences = absencesByDate[cell.iso] || [];
              const turnoColor = shift ? TURNO_COLOR[shift.turno_number] || TURNO_COLOR[0] : 'bg-white border-slate-200';
              return (
                <button
                  key={cell.iso}
                  onClick={() => setEditingDate(cell.iso)}
                  className={`text-left rounded-md border p-1.5 min-h-[110px] hover:ring-2 hover:ring-blue-300 hover:ring-inset transition-shadow ${cell.inMonth ? '' : 'opacity-40'} ${isWeekend ? 'bg-slate-50' : ''} ${turnoColor}`}
                  title="Click para editar este día"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${cell.inMonth ? 'text-slate-900' : 'text-slate-400'}`}>{cell.date.getDate()}</span>
                    {shift && (
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-white/60 rounded px-1">T{shift.turno_number}</span>
                    )}
                  </div>
                  {isHoliday && (
                    <div className="mt-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 rounded px-1 py-0.5 text-center">FERIADO</div>
                  )}
                  {!isHoliday && eff.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {eff.map((e, i) => (
                        <div key={i} className="text-[10px] truncate">
                          <span className={e.replaced ? 'line-through opacity-60' : ''}>{doctorName(e.original_doctor_id)}</span>
                          {e.replaced && <span className="ml-1 text-emerald-700 font-semibold">→ {doctorName(e.doctor_id)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {dayAbsences.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayAbsences.map(a => (
                        <span key={a.id} className={`text-[9px] font-bold rounded border px-1 ${TYPE_COLOR[a.type] || TYPE_COLOR.OTRO}`} title={`${doctorName(a.doctor_id)} · ${ABSENCE_LABELS[a.type] || a.type}`}>
                          {a.type}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
          <span className="font-semibold">Turnos:</span>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
            <span key={n} className={`rounded border px-1.5 py-0.5 ${TURNO_COLOR[n]}`}>T{n}</span>
          ))}
          <span className="mx-2 text-slate-300">|</span>
          <span className="font-semibold">Ausencias:</span>
          {ABSENCE_TYPES.map(t => (
            <span key={t} className={`rounded border px-1 ${TYPE_COLOR[t] || TYPE_COLOR.OTRO}`}>{t}</span>
          ))}
        </div>

        <div className="mt-2 flex items-start gap-2 text-[11px] text-slate-500">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Los cambios se reflejan automáticamente en la Agenda Semanal y el resto de las pestañas (sin necesidad de guardar manualmente).</span>
        </div>
      </CardContent>

      {/* ── Dialog de edición de un día ── */}
      <Dialog open={!!editingDate} onOpenChange={open => !open && setEditingDate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar día · {editingDate}</DialogTitle>
          </DialogHeader>
          {editingDate && (
            <div className="space-y-4">
              {/* Toggle Feriado */}
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <input
                  type="checkbox"
                  id="cal-holiday"
                  checked={!!editingShift?.is_holiday}
                  onChange={e => setHoliday(editingDate, e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="cal-holiday" className="text-sm font-semibold text-amber-900 cursor-pointer">
                  Marcar como feriado
                </label>
                <span className="text-[11px] text-amber-700">
                  (en feriado solo se muestran turnos, posturno y ausencias)
                </span>
              </div>

              {/* Turno number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Turno del día</label>
                <Select value={String(editingTurnoNumber ?? '')} onValueChange={v => setTurnoNumber(editingDate, v)}>
                  <SelectTrigger className="h-9 w-40"><SelectValue placeholder="— elegir turno —" /></SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                      <SelectItem key={n} value={String(n)}>Turno {n}{n === 0 ? ' (volante)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingTurnoNumber == null && (
                  <p className="text-[11px] text-slate-500 italic">Sin turno asignado para este día.</p>
                )}
              </div>

              {/* Médicos del turno + replacements */}
              {editingBaseDoctors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Médicos en turno (reemplazos)</label>
                  <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {editingBaseDoctors.map(b => {
                      const rep = editingReplacements.find(r => r.doctor_id === b.doctor_id);
                      const currentId = rep ? rep.replaced_by : b.doctor_id;
                      return (
                        <div key={b.doctor_id} className="flex items-center gap-2 p-2 text-sm">
                          <span className="w-32 shrink-0 text-slate-600">
                            {doctorName(b.doctor_id)}
                            {rep && <span className="ml-1 text-[10px] text-slate-400">(titular)</span>}
                          </span>
                          <span className="text-slate-400">→</span>
                          <Select value={currentId} onValueChange={v => setReplacement(editingDate, b.doctor_id, v === b.doctor_id ? null : v)}>
                            <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={b.doctor_id}>— sin reemplazo —</SelectItem>
                              {doctors.filter(d => d.id !== b.doctor_id).map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {rep && (
                            <Button size="sm" variant="ghost" onClick={() => setReplacement(editingDate, b.doctor_id, null)} title="Quitar reemplazo">
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ausencias del día */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Ausencias del día ({editingAbsences.length})</label>
                {editingAbsences.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editingAbsences.map(a => (
                      <span key={a.id} className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] ${TYPE_COLOR[a.type] || TYPE_COLOR.OTRO}`}>
                        <span className="font-semibold">{doctorName(a.doctor_id)}</span>
                        <span className="font-bold">{a.type}</span>
                        <button onClick={() => deleteAbsence(a.id)} className="hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-lg border border-dashed border-slate-300 p-2 bg-slate-50">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Médico</label>
                    <Select value={absForm.doctor_id} onValueChange={v => setAbsForm({ ...absForm, doctor_id: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Elegir…" /></SelectTrigger>
                      <SelectContent>
                        {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Tipo</label>
                    <Select value={absForm.type} onValueChange={v => setAbsForm({ ...absForm, type: v })}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ABSENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t} — {ABSENCE_LABELS[t]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { addAbsence(editingDate, absForm.doctor_id, absForm.type); setAbsForm({ doctor_id: '', type: 'A' }); }}
                    disabled={!absForm.doctor_id}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDate(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
