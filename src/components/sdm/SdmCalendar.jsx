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

// Rotación oficial: 2026-04-16 (jue) = T1. Cada día consume 1 slot, sábado 2.
const ROTATION_BASE_ISO = '2026-04-16';
const ROTATION_BASE_TURNO = 1; // 1..7

function parseIsoLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Calcula el turno AM (y PM si es sábado) para un día según la rotación cíclica.
// turnos: 1..7. PM solo aplica sábados.
function computeTurnoForIso(iso) {
  const base = parseIsoLocal(ROTATION_BASE_ISO);
  const target = parseIsoLocal(iso);
  // Slots transcurridos desde base hasta target (sin contar target).
  let slots = 0;
  const cur = new Date(base);
  if (target < base) {
    // Contar hacia atrás
    while (cur > target) {
      cur.setDate(cur.getDate() - 1);
      slots -= cur.getDay() === 6 ? 2 : 1;
    }
  } else {
    while (cur < target) {
      slots += cur.getDay() === 6 ? 2 : 1;
      cur.setDate(cur.getDate() + 1);
    }
  }
  const baseIdx = ROTATION_BASE_TURNO - 1;
  const amIdx = ((baseIdx + slots) % 7 + 7) % 7;
  const am = amIdx + 1;
  const isSaturday = target.getDay() === 6;
  const pm = isSaturday ? ((amIdx + 1) % 7) + 1 : null;
  return { am, pm };
}

export default function SdmCalendar({ onChanged }) {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [doctors, setDoctors] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [shifts, setShifts] = useState([]);       // sdm_shift_calendar para el mes
  const [absences, setAbsences] = useState([]);   // sdm_absences para el mes
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState(null);
  const [view, setView] = useState('turnos'); // 'turnos' | 'ausencias'
  // ─── Selección múltiple (para ausencias en rango) ─────────────────────
  // Cuando multiSelectMode=true, los clicks en los días no abren el editor
  // sino que toggle al date en selectedDates. La barra flotante permite
  // luego aplicar una ausencia (médico + tipo) a todos los días seleccionados.
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [dragSelecting, setDragSelecting] = useState(false); // boolean — true mientras user arrastra
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchForm, setBatchForm] = useState({ doctor_id: '', type: 'A' });

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
  // turnoNumber permite forzar un turno distinto (ej. PM en sábados o rotación
  // automática cuando aún no hay entrada en sdm_shift_calendar).
  function effectiveDoctorsForDay(iso, turnoNumber = null) {
    const s = shiftByDate[iso];
    const tn = turnoNumber != null ? turnoNumber : s?.turno_number;
    if (tn == null) return [];
    const base = rotationByTurno[tn] || [];
    const reps = Array.isArray(s?.replacements) ? s.replacements : [];
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
  async function setTurnoNumberPm(date, n) {
    await upsertShift(date, { turno_number_pm: n === '' || n === null ? null : Number(n) });
  }

  async function applyRotationToMonth() {
    const days = buildMonthGrid(monthDate).filter(c => c.inMonth);
    const toInsert = [];
    const toUpdate = [];
    days.forEach(c => {
      const existing = shiftByDate[c.iso];
      const auto = computeTurnoForIso(c.iso);
      const isSat = c.date.getDay() === 6;
      const payload = { turno_number: auto.am, turno_number_pm: isSat ? auto.pm : null };
      if (existing) {
        if (existing.turno_number !== payload.turno_number || (existing.turno_number_pm ?? null) !== payload.turno_number_pm) {
          toUpdate.push({ date: c.iso, ...payload });
        }
      } else {
        toInsert.push({ date: c.iso, ...payload, replacements: [], is_holiday: false });
      }
    });
    if (toInsert.length === 0 && toUpdate.length === 0) {
      toast.info('La rotación del mes ya está aplicada.');
      return;
    }
    if (toInsert.length) {
      const { error } = await supabase.from('sdm_shift_calendar').insert(toInsert);
      if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    }
    for (const u of toUpdate) {
      const { date, ...patch } = u;
      const { error } = await supabase.from('sdm_shift_calendar').update(patch).eq('date', date);
      if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    }
    toast.success(`Rotación aplicada: ${toInsert.length} día${toInsert.length === 1 ? '' : 's'} nuevo${toInsert.length === 1 ? '' : 's'}, ${toUpdate.length} actualizado${toUpdate.length === 1 ? '' : 's'}.`);
    await loadAll();
    notifyChanged();
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

  // Insert masivo: una ausencia (doctor + tipo) en cada fecha del array.
  async function addAbsenceBatch(dates, doctorId, type) {
    if (!doctorId || !type || !dates.length) return;
    const rows = dates.map(date => ({ doctor_id: doctorId, date, type }));
    const { error } = await supabase.from('sdm_absences').insert(rows);
    if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    toast.success(`${rows.length} día(s) marcados con ${type} para ${doctorName(doctorId)}.`);
    await loadAll();
    notifyChanged();
  }

  // Devuelve [from..to] inclusive como ISO strings (YYYY-MM-DD).
  function expandDateRange(fromIso, toIso) {
    if (!fromIso || !toIso) return [fromIso].filter(Boolean);
    const a = new Date(fromIso + 'T12:00:00');
    const b = new Date(toIso + 'T12:00:00');
    if (b < a) return [];
    const out = [];
    for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  // Toggle un date en selectedDates (selección múltiple).
  function toggleDateSelection(iso) {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso); else next.add(iso);
      return next;
    });
  }

  // Drag select: extender la selección desde el último día clickeado al
  // actual mientras el usuario arrastra con el botón presionado.
  function extendSelectionDuringDrag(iso) {
    if (!dragSelecting) return;
    setSelectedDates(prev => {
      const next = new Set(prev);
      next.add(iso);
      return next;
    });
  }

  function clearSelection() {
    setSelectedDates(new Set());
  }

  function exitMultiSelect() {
    setMultiSelectMode(false);
    setSelectedDates(new Set());
    setShowBatchDialog(false);
    setBatchForm({ doctor_id: '', type: 'A' });
  }

  async function applyBatchAbsence() {
    const dates = Array.from(selectedDates).sort();
    await addAbsenceBatch(dates, batchForm.doctor_id, batchForm.type);
    exitMultiSelect();
  }

  const [absForm, setAbsForm] = useState({ doctor_id: '', type: 'A', until: '' });
  useEffect(() => { setAbsForm({ doctor_id: '', type: 'A', until: '' }); }, [editingDate]);

  return (
    <Card className="sdm-print-hide">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-5 w-5" />
          {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={applyRotationToMonth} title="Crea/actualiza las entradas del mes según la rotación oficial (base 2026-04-16 = T1, sábados AM/PM)">
            Aplicar rotación al mes
          </Button>
          <Button
            variant={multiSelectMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (multiSelectMode) exitMultiSelect();
              else setMultiSelectMode(true);
            }}
            className={multiSelectMode ? 'bg-violet-600 hover:bg-violet-700' : ''}
            title="Selecciona varios días con click/arrastre para aplicar una ausencia a todos a la vez"
          >
            {multiSelectMode ? `Seleccionando (${selectedDates.size})` : 'Seleccionar varios días'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setMonthDate(startOfMonth(new Date()))}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={() => shiftMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Toggle entre vista de Turnos y vista de Ausencias */}
        <div className="flex items-center gap-1 mb-3 rounded-lg bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setView('turnos')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'turnos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Turnos
          </button>
          <button
            onClick={() => setView('ausencias')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'ausencias' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Ausencias
          </button>
        </div>

        {loading ? <p className="text-sm text-slate-500">Cargando…</p> : (
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-[10px] font-bold uppercase tracking-wide text-slate-500 text-center py-1">{h}</div>
            ))}
            {cells.map(cell => {
              const dow = cell.date.getDay(); // 0 dom 6 sab
              const isWeekend = dow === 0 || dow === 6;
              const isSaturday = dow === 6;
              const shift = shiftByDate[cell.iso];
              const isHoliday = !!shift?.is_holiday;
              // Turno explícito si existe; si no, calculado según rotación.
              const auto = computeTurnoForIso(cell.iso);
              const effAmTurno = shift ? shift.turno_number : auto.am;
              const effPmTurno = isSaturday ? (shift && shift.turno_number_pm != null ? shift.turno_number_pm : auto.pm) : null;
              const isAuto = !shift; // ningún override → es la rotación automática
              const eff = effectiveDoctorsForDay(cell.iso, effAmTurno);
              const effPm = isSaturday && effPmTurno != null ? effectiveDoctorsForDay(cell.iso, effPmTurno) : [];
              const dayAbsences = absencesByDate[cell.iso] || [];
              const turnoColor = TURNO_COLOR[effAmTurno] || TURNO_COLOR[0];
              const showTurnos = view === 'turnos';
              const isSelected = multiSelectMode && selectedDates.has(cell.iso);
              return (
                <button
                  key={cell.iso}
                  onClick={() => {
                    if (multiSelectMode) toggleDateSelection(cell.iso);
                    else setEditingDate(cell.iso);
                  }}
                  onMouseDown={() => {
                    if (multiSelectMode) {
                      setDragSelecting(true);
                      toggleDateSelection(cell.iso);
                    }
                  }}
                  onMouseEnter={() => extendSelectionDuringDrag(cell.iso)}
                  onMouseUp={() => setDragSelecting(false)}
                  className={`text-left rounded-md border p-1.5 min-h-[110px] hover:ring-2 hover:ring-blue-300 hover:ring-inset transition-shadow ${cell.inMonth ? '' : 'opacity-40'} ${isWeekend ? 'bg-slate-50' : ''} ${showTurnos ? turnoColor : 'bg-white border-slate-200'} ${isSelected ? 'ring-2 ring-violet-500 ring-inset bg-violet-50/70' : ''}`}
                  title={multiSelectMode ? 'Click o arrastra para seleccionar varios días' : 'Click para editar este día'}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${cell.inMonth ? 'text-slate-900' : 'text-slate-400'}`}>{cell.date.getDate()}</span>
                    {showTurnos && (
                      <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1 ${isAuto ? 'bg-white/40 text-slate-500 italic' : 'bg-white/60'}`} title={isAuto ? 'Turno calculado por rotación automática (sin override)' : 'Turno explícito'}>
                        T{effAmTurno}{isSaturday && effPmTurno != null ? ` / T${effPmTurno}` : ''}
                      </span>
                    )}
                    {!showTurnos && dayAbsences.length > 0 && (
                      <span className="text-[9px] font-bold rounded-full bg-red-500 text-white px-1.5">{dayAbsences.length}</span>
                    )}
                  </div>
                  {isHoliday && (
                    <div className="mt-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 rounded px-1 py-0.5 text-center">FERIADO</div>
                  )}
                  {showTurnos ? (
                    <>
                      {eff.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {isSaturday && effPm.length > 0 && (
                            <div className="text-[8px] font-bold uppercase tracking-wide text-slate-500">AM</div>
                          )}
                          {eff.map((e, i) => (
                            <div key={i} className="text-[10px] truncate">
                              <span className={e.replaced ? 'line-through opacity-60' : ''}>{doctorName(e.original_doctor_id)}</span>
                              {e.replaced && <span className="ml-1 text-emerald-700 font-semibold">→ {doctorName(e.doctor_id)}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {isSaturday && effPm.length > 0 && (
                        <div className="mt-0.5 space-y-0.5 border-t border-slate-300/50 pt-0.5">
                          <div className="text-[8px] font-bold uppercase tracking-wide text-slate-500">PM</div>
                          {effPm.map((e, i) => (
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
                    </>
                  ) : (
                    /* Vista AUSENCIAS — destaca quién está ausente y por qué */
                    <div className="mt-1 space-y-0.5">
                      {dayAbsences.length === 0 ? (
                        <div className="text-[10px] italic text-slate-300">—</div>
                      ) : (
                        dayAbsences.map(a => (
                          <div
                            key={a.id}
                            className={`text-[10px] rounded border px-1 py-0.5 ${TYPE_COLOR[a.type] || TYPE_COLOR.OTRO}`}
                            title={`${doctorName(a.doctor_id)} · ${ABSENCE_LABELS[a.type] || a.type}${a.notes ? ' · ' + a.notes : ''}`}
                          >
                            <div className="font-bold truncate">{doctorName(a.doctor_id)}</div>
                            <div className="opacity-80">{a.type} · {ABSENCE_LABELS[a.type] || ''}</div>
                          </div>
                        ))
                      )}
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
              {(() => {
                const isSat = editingDate ? new Date(editingDate + 'T12:00:00').getDay() === 6 : false;
                return (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {isSat ? 'Turnos del día (AM y PM)' : 'Turno del día'}
                    </label>
                    <div className="flex items-center gap-3">
                      <div>
                        {isSat && <div className="text-[10px] font-bold text-slate-500 mb-0.5">AM</div>}
                        <Select value={String(editingTurnoNumber ?? '')} onValueChange={v => setTurnoNumber(editingDate, v)}>
                          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="— elegir turno —" /></SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                              <SelectItem key={n} value={String(n)}>Turno {n}{n === 0 ? ' (volante)' : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {isSat && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 mb-0.5">PM</div>
                          <Select value={String(editingShift?.turno_number_pm ?? '__none__')} onValueChange={v => setTurnoNumberPm(editingDate, v === '__none__' ? null : v)}>
                            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="— elegir turno PM —" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— sin turno PM —</SelectItem>
                              {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                                <SelectItem key={n} value={String(n)}>Turno {n}{n === 0 ? ' (volante)' : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    {editingTurnoNumber == null && (
                      <p className="text-[11px] text-slate-500 italic">Sin turno asignado para este día.</p>
                    )}
                  </div>
                );
              })()}

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
                <div className="rounded-lg border border-dashed border-slate-300 p-2 bg-slate-50 space-y-2">
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
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
                  </div>
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                        Hasta (opcional) — para rangos
                      </label>
                      <input
                        type="date"
                        value={absForm.until}
                        min={editingDate || undefined}
                        onChange={e => setAbsForm({ ...absForm, until: e.target.value })}
                        className="w-full h-8 rounded-md border border-slate-300 px-2 text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={async () => {
                        const dates = absForm.until && absForm.until > editingDate
                          ? expandDateRange(editingDate, absForm.until)
                          : [editingDate];
                        if (dates.length > 1) {
                          await addAbsenceBatch(dates, absForm.doctor_id, absForm.type);
                        } else {
                          await addAbsence(editingDate, absForm.doctor_id, absForm.type);
                        }
                        setAbsForm({ doctor_id: '', type: 'A', until: '' });
                      }}
                      disabled={!absForm.doctor_id}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {absForm.until && absForm.until > editingDate
                        ? `Agregar ${expandDateRange(editingDate, absForm.until).length} días`
                        : 'Agregar'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Para feriados legales o pasantías largas: ingresa fecha "hasta" y se aplicará la ausencia a cada día del rango.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDate(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barra flotante de selección múltiple */}
      {multiSelectMode && selectedDates.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-violet-300 bg-white shadow-2xl px-4 py-2.5 flex items-center gap-3 flex-wrap max-w-[95vw]">
          <span className="text-sm font-semibold text-violet-800">
            {selectedDates.size} día{selectedDates.size === 1 ? '' : 's'} seleccionado{selectedDates.size === 1 ? '' : 's'}
          </span>
          <Button size="sm" variant="outline" onClick={clearSelection}>Limpiar</Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 gap-1.5"
            onClick={() => setShowBatchDialog(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Aplicar ausencia
          </Button>
          <Button size="sm" variant="ghost" onClick={exitMultiSelect}>Salir del modo</Button>
        </div>
      )}

      {/* Diálogo para aplicar ausencia a los días seleccionados */}
      <Dialog open={showBatchDialog} onOpenChange={open => !open && setShowBatchDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar ausencia a {selectedDates.size} día{selectedDates.size === 1 ? '' : 's'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 text-[11px] text-violet-800 max-h-32 overflow-y-auto">
              <strong>Días: </strong>
              {Array.from(selectedDates).sort().map(d => d.slice(5)).join(', ')}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Médico</label>
              <Select value={batchForm.doctor_id} onValueChange={v => setBatchForm({ ...batchForm, doctor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Elegir…" /></SelectTrigger>
                <SelectContent>
                  {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Tipo de ausencia</label>
              <Select value={batchForm.type} onValueChange={v => setBatchForm({ ...batchForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ABSENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t} — {ABSENCE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Se creará una entrada en cada día seleccionado. Para feriados legales largos, pasantías o licencias prolongadas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>Cancelar</Button>
            <Button onClick={applyBatchAbsence} disabled={!batchForm.doctor_id} className="bg-violet-600 hover:bg-violet-700">
              Aplicar a {selectedDates.size} día{selectedDates.size === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
