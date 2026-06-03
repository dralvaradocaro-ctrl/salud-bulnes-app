import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, Plus, Trash2,
  Video, GraduationCap, ClipboardList, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { useSdmWeeklyAgenda } from '@/components/sdm/lib/useSdmWeeklyAgenda';
import { getMondayOfWeek, fmtDate, weekDates } from '@/components/sdm/lib/generateAgenda';
import { sdmSupabase, explainSdmWriteError } from '@/components/sdm/lib/sdmSupabase';
import BedMap from '@/components/agenda-diaria/BedMap';
import {
  BED_STATE, NEXT_STATE_CYCLE, ALL_BEDS, defaultBedState,
} from '@/components/agenda-diaria/bedCatalog';
import { isLimited, hashStr, slugifyName, distributeDay } from '@/components/agenda-diaria/distribute';
import DailyDistribution from '@/components/agenda-diaria/DailyDistribution';
import { exportDailyAgendaPdf } from '@/components/agenda-diaria/exportPdf';
import { buildRoster } from '@/components/agenda-diaria/roster';

// Min de un "HH:MM"
const toMin = (t) => (t ? parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3, 5), 10) : 0);
// ¿El bloqueo extra ocupa la mañana clínica (08:00–11:00)? → saca al médico de la visita.
const blocksMorning = (b) => b.from && b.to && toMin(b.from) < 11 * 60 && toMin(b.to) > 8 * 60;

// ── helpers ────────────────────────────────────────────────────────────────
const todayIso = () => fmtDate(new Date());

const DAY_SHORT = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie' };

const STEPS = [
  { key: 'agenda', label: 'Agenda del día', icon: ClipboardList },
  { key: 'telemed', label: 'Telemedicinas', icon: Video },
  { key: 'internos', label: 'Internos', icon: GraduationCap },
];

export default function AgendaDiaria() {
  const navigate = useNavigate();
  const monday = useMemo(() => getMondayOfWeek(new Date()), []);
  const weekDays = useMemo(() => weekDates(monday), [monday]);
  const { agenda, doctors, loading } = useSdmWeeklyAgenda(monday);

  const docName = (id) =>
    doctors.find((d) => d.id === id)?.display_name || (id === 'rubilar' ? 'RUBILAR' : id);

  // Día seleccionado: hoy si es un día laboral de la semana vigente; si no, el primero disponible.
  const [selectedDate, setSelectedDate] = useState(() => {
    const t = todayIso();
    return weekDays.some((d) => d.date === t) ? t : weekDays[0]?.date;
  });

  const day = useMemo(
    () => agenda.find((d) => d.date === selectedDate) || null,
    [agenda, selectedDate],
  );

  // ── estado del wizard ──────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [wizardDone, setWizardDone] = useState(false);

  // Step 1: confirmación de visitantes externos (Sandoval, Rubilar, etc.)
  const [externalConfirm, setExternalConfirm] = useState({}); // { name: boolean(presente) }
  // Bloqueos extra del día (ad-hoc): { id, from, to, doctorId, cause }
  const [extraBlocks, setExtraBlocks] = useState([]);
  // Step 2: telemedicinas del día
  const [telemed, setTelemed] = useState([]); // { id, specialty, time, doctor }
  // Step 3: internos
  const [internos, setInternos] = useState([]); // { id, name, isNew }
  // Estado de camas: { [code]: 'visit'|'novisit'|'blocked'|'empty' } (default = defaultBedState)
  const [bedStates, setBedStates] = useState({});
  const toggleBed = (code) =>
    setBedStates((p) => ({
      ...p,
      [code]: NEXT_STATE_CYCLE[p[code] || defaultBedState(code)],
    }));
  // Reparto: semilla de médicos (cambia al redistribuir) y overrides manuales.
  const [doctorSeed, setDoctorSeed] = useState(0);
  const [bedOverrides, setBedOverrides] = useState({});
  const [supervisorOverrides, setSupervisorOverrides] = useState({});
  // Continuidad: asignaciones heredadas (del día guardado o del día anterior).
  const [priorAssignments, setPriorAssignments] = useState({});
  // Persistencia
  const [savedExists, setSavedExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const skipDirty = useRef(false);

  // Internos con identidad estable (slug por nombre) para reparto/continuidad.
  const effInterns = useMemo(
    () => internos
      .filter((i) => (i.name || '').trim())
      .map((i) => ({ id: slugifyName(i.name), name: i.name.trim() })),
    [internos],
  );
  // Semilla de internos: estable salvo cambio en el set de internos (rotación).
  const internSeed = useMemo(
    () => hashStr(effInterns.map((i) => i.id).sort().join('|')) || 1,
    [effInterns],
  );

  // Médicos en visita: del array `visita` de la agenda, descontando a quien
  // marcó ausente (externo) o tiene un bloqueo extra que ocupa su mañana.
  const blockedMorningDocs = useMemo(() => {
    const s = new Set();
    // Las ecografías NO sacan al médico de la visita: solo le restan ~30 min c/u.
    extraBlocks.forEach((b) => { if (b.doctorId && !b.eco && blocksMorning(b)) s.add(b.doctorId); });
    return s;
  }, [extraBlocks]);

  const visitDocs = useMemo(
    () => (day?.visita || []).filter(
      (v) => (v.doctor_id !== 'rubilar' || externalConfirm.RUBILAR !== false)
        && !blockedMorningDocs.has(v.doctor_id),
    ),
    [day, externalConfirm, blockedMorningDocs],
  );

  const visitBedCodes = useMemo(
    () => ALL_BEDS
      .filter((b) => (bedStates[b.code] || defaultBedState(b.code)) === BED_STATE.VISIT)
      .map((b) => b.code),
    [bedStates],
  );

  const result = useMemo(
    () => distributeDay({
      visitBedCodes, visitDocs, interns: effInterns,
      internSeed, doctorSeed, bedOverrides, supervisorOverrides, priorAssignments,
    }),
    [visitBedCodes, visitDocs, effInterns, internSeed, doctorSeed, bedOverrides, supervisorOverrides, priorAssignments],
  );

  const roster = useMemo(
    () => (day ? buildRoster({ day, result, extraBlocks, docName }) : { rows: [], interns: [] }),
    [day, result, extraBlocks, doctors],
  );

  // ── carga: estado guardado del día, o continuidad desde el día anterior ──
  useEffect(() => {
    let alive = true;
    setHydrating(true);
    setStep(0);
    (async () => {
      let row = null;
      try {
        const { data } = await sdmSupabase
          .from('sdm_daily_agendas').select('*').eq('date', selectedDate).maybeSingle();
        row = data;
      } catch { /* tabla puede no existir aún */ }
      if (!alive) return;

      if (row?.data) {
        const dd = row.data;
        setBedStates(dd.bedStates || {});
        setTelemed(dd.telemed || []);
        setInternos(dd.internos || []);
        setExtraBlocks(dd.extraBlocks || []);
        setDoctorSeed(dd.doctorSeed || 0);
        setBedOverrides(dd.bedOverrides || {});
        setSupervisorOverrides(dd.supervisorOverrides || {});
        setPriorAssignments(dd.assigned || {}); // reproduce el reparto guardado
        setSavedExists(true);
        setWizardDone(true);
      } else {
        // Día nuevo: heredar del último día guardado anterior (continuidad).
        let prev = null;
        try {
          const { data } = await sdmSupabase
            .from('sdm_daily_agendas').select('*')
            .lt('date', selectedDate).order('date', { ascending: false }).limit(1).maybeSingle();
          prev = data;
        } catch { /* noop */ }
        if (!alive) return;
        const pd = prev?.data || {};
        setBedStates(pd.bedStates || {});           // hereda bloqueos/ocupación
        setTelemed([]);                              // las telemedicinas son del día
        setInternos((pd.internos || []).map((i) => ({ ...i, isNew: false }))); // misma rotación
        setExtraBlocks([]);
        setDoctorSeed(0);
        setBedOverrides({});
        setSupervisorOverrides(pd.supervisorOverrides || {});
        setPriorAssignments(pd.assigned || {});     // seguimiento médico↔paciente
        setSavedExists(false);
        setWizardDone(false);
      }
      setDirty(false);
      skipDirty.current = true; // ignora el re-run de efectos por la hidratación
      setHydrating(false);
    })();
    return () => { alive = false; };
  }, [selectedDate]);

  // Inicializar confirmación de externos al cargar el día (no se persiste).
  useEffect(() => {
    if (!day) return;
    const init = {};
    (day.external_visitors || []).forEach((v) => { if (v?.name) init[v.name] = !v.no_show; });
    setExternalConfirm(init);
  }, [day]);

  // Marcar cambios sin guardar.
  useEffect(() => {
    if (hydrating) return;
    if (skipDirty.current) { skipDirty.current = false; return; }
    setDirty(true);
  }, [bedStates, telemed, internos, extraBlocks, doctorSeed, bedOverrides, supervisorOverrides, hydrating]);

  // Redistribuir: re-aleatoriza médicos pero los internos conservan sus camas
  // (se mantiene la herencia de las camas asignadas a internos).
  const onRedistribute = useCallback(() => {
    const internIds = new Set(effInterns.map((i) => i.id));
    setPriorAssignments((prev) => {
      const next = {};
      Object.entries(prev).forEach(([code, who]) => { if (internIds.has(who)) next[code] = who; });
      return next;
    });
    setBedOverrides((prev) => {
      const internIds2 = new Set(effInterns.map((i) => i.id));
      const next = {};
      Object.entries(prev).forEach(([code, who]) => { if (internIds2.has(who)) next[code] = who; });
      return next;
    });
    setDoctorSeed((s) => s + 1);
  }, [effInterns]);

  const onSave = useCallback(async () => {
    setSaving(true);
    const payload = {
      date: selectedDate,
      data: {
        bedStates, telemed, internos, extraBlocks,
        doctorSeed, bedOverrides, supervisorOverrides,
        assigned: result.assigned,
        saved_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };
    const { error } = await sdmSupabase
      .from('sdm_daily_agendas').upsert(payload, { onConflict: 'date' });
    setSaving(false);
    if (error) {
      toast.error('Error al guardar: ' + (explainSdmWriteError(error) || error.message));
      return;
    }
    setSavedExists(true);
    setDirty(false);
    setPriorAssignments(result.assigned); // fija el reparto guardado
    toast.success('Agenda diaria guardada');
  }, [selectedDate, bedStates, telemed, internos, extraBlocks, doctorSeed, bedOverrides, supervisorOverrides, result]);

  const onExportPdf = useCallback(() => {
    if (!day) return;
    try {
      exportDailyAgendaPdf({ date: selectedDate, day, result, telemed, extraBlocks, docName });
    } catch (e) {
      toast.error('No se pudo generar el PDF: ' + e.message);
    }
  }, [day, selectedDate, result, telemed, extraBlocks, doctors]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={() => { if (window.history.length > 1) navigate(-1); else navigate(createPageUrl('Home')); }}
              title="Volver"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="p-2 bg-blue-100 rounded-xl">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Agenda Diaria</h1>
              <p className="text-sm text-slate-500">
                Se nutre de la agenda semanal vigente · Subdirección Médica
              </p>
            </div>
          </div>

          {/* Selector de día */}
          <div className="mt-4 flex flex-wrap gap-2">
            {weekDays.map((d) => {
              const active = d.date === selectedDate;
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {DAY_SHORT[d.day]} {d.date.slice(8, 10)}/{d.date.slice(5, 7)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!day ? (
          <EmptyDay onSubdireccion={() => navigate(createPageUrl('SubdireccionMedica'))} />
        ) : wizardDone ? (
          <PostWizard
            docName={docName}
            telemed={telemed}
            internos={internos}
            bedStates={bedStates}
            onToggleBed={toggleBed}
            result={result}
            roster={roster}
            visitBedCodes={visitBedCodes}
            visitDocs={visitDocs}
            interns_={effInterns}
            onRedistribute={onRedistribute}
            bedOverrides={bedOverrides}
            setBedOverrides={setBedOverrides}
            supervisorOverrides={supervisorOverrides}
            setSupervisorOverrides={setSupervisorOverrides}
            onSave={onSave}
            saving={saving}
            savedExists={savedExists}
            dirty={dirty}
            onExportPdf={onExportPdf}
            onReabrir={() => { setWizardDone(false); setStep(0); }}
          />
        ) : (
          <>
            <Stepper step={step} />
            <div className="mt-6">
              {step === 0 && (
                <StepAgenda
                  day={day}
                  docName={docName}
                  doctors={doctors}
                  externalConfirm={externalConfirm}
                  setExternalConfirm={setExternalConfirm}
                  extraBlocks={extraBlocks}
                  setExtraBlocks={setExtraBlocks}
                />
              )}
              {step === 1 && <StepTelemed telemed={telemed} setTelemed={setTelemed} />}
              {step === 2 && (
                <StepInternos internos={internos} setInternos={setInternos} />
              )}
            </div>

            {/* Navegación del wizard */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)}>
                  Continuar <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => setWizardDone(true)}>
                  <Check className="h-4 w-4 mr-1" /> Confirmar y continuar
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────
function Stepper({ step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === step;
        const done = i < step;
        return (
          <React.Fragment key={s.key}>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                active
                  ? 'bg-blue-600 text-white'
                  : done
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: Agenda del día ─────────────────────────────────────────────────
function StepAgenda({ day, docName, doctors, externalConfirm, setExternalConfirm, extraBlocks, setExtraBlocks }) {
  const turnos = day.turnos || [];
  const posturno = day.posturno || [];
  const bloqueos = (day.bloqueos || []).filter((b) => !b.suspended);
  const externals = day.external_visitors || [];

  const addExtra = () =>
    setExtraBlocks((p) => [...p, { id: crypto.randomUUID(), from: '', to: '', doctorId: '', cause: '' }]);
  const updateExtra = (id, field, value) =>
    setExtraBlocks((p) => p.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  const removeExtra = (id) => setExtraBlocks((p) => p.filter((b) => b.id !== id));

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">
        ¿Están correctos los turnos, bloqueos y refuerzos de hoy?
      </h2>
      <p className="text-sm text-slate-500 -mt-3">
        Revisa la información cargada desde la agenda semanal. Confirma la presencia de los
        especialistas visitantes.
      </p>

      <InfoCard title="Turno">
        {turnos.length
          ? turnos.map((t) => (
              <Chip key={t.doctor_id}>{docName(t.doctor_id)}</Chip>
            ))
          : <Muted>Sin turno asignado</Muted>}
      </InfoCard>

      <InfoCard title="Posturno">
        {posturno.length
          ? posturno.map((t) => <Chip key={t.doctor_id} tone="slate">{docName(t.doctor_id)}</Chip>)
          : <Muted>—</Muted>}
      </InfoCard>

      <InfoCard title="Refuerzos">
        <div className="flex flex-wrap gap-2">
          <Chip tone="amber">AM: {day.refuerzos?.am ? docName(day.refuerzos.am) : '—'}</Chip>
          <Chip tone="amber">PM: {day.refuerzos?.pm ? docName(day.refuerzos.pm) : '—'}</Chip>
        </div>
      </InfoCard>

      <InfoCard title="Especialistas visitantes">
        {externals.length === 0 ? (
          <Muted>No hay especialistas visitantes agendados hoy.</Muted>
        ) : (
          <div className="space-y-2">
            {externals.map((v) => (
              <label
                key={v.name}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={externalConfirm[v.name] ?? !v.no_show}
                  onChange={(e) =>
                    setExternalConfirm((p) => ({ ...p, [v.name]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  <span className="font-medium">{v.name}</span>
                  {v.specialty ? ` · ${v.specialty}` : ''}
                </span>
              </label>
            ))}
          </div>
        )}
      </InfoCard>

      <InfoCard title="Bloqueos del día">
        {bloqueos.length === 0 ? (
          <Muted>Sin bloqueos.</Muted>
        ) : (
          <ul className="w-full space-y-1 text-sm text-slate-600">
            {bloqueos.map((b, i) => {
              const hhmm = (t) => (t || '').slice(0, 5);
              const horario = b.from ? `${hhmm(b.from)}${b.to ? `–${hhmm(b.to)}` : ''}` : '';
              return (
                <li key={i} className="flex items-baseline gap-2">
                  {horario && <span className="shrink-0 font-semibold tabular-nums text-slate-700">{horario}</span>}
                  <span>{b.name}{b.doctor_id ? ` · ${docName(b.doctor_id)}` : ''}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Bloqueos extra del día (ad-hoc) */}
        {extraBlocks.length > 0 && (
          <ul className="space-y-2 mt-3 pt-3 border-t border-slate-100">
            {extraBlocks.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2">
                <Input
                  type="time" value={b.from}
                  onChange={(e) => updateExtra(b.id, 'from', e.target.value)}
                  className="w-28 h-8 text-xs"
                />
                <span className="text-slate-400 text-xs">–</span>
                <Input
                  type="time" value={b.to}
                  onChange={(e) => updateExtra(b.id, 'to', e.target.value)}
                  className="w-28 h-8 text-xs"
                />
                <select
                  value={b.doctorId}
                  onChange={(e) => updateExtra(b.id, 'doctorId', e.target.value)}
                  className="h-8 text-xs rounded-md border border-slate-200 bg-white px-2 min-w-[140px]"
                >
                  <option value="">Médico…</option>
                  {(doctors || []).map((d) => (
                    <option key={d.id} value={d.id}>{d.display_name}</option>
                  ))}
                </select>
                <Input
                  placeholder="Causa (ej. reunión, permiso)"
                  value={b.cause}
                  onChange={(e) => updateExtra(b.id, 'cause', e.target.value)}
                  className="flex-1 min-w-[160px] h-8 text-xs"
                />
                <Button variant="ghost" size="icon" onClick={() => removeExtra(b.id)}>
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" className="mt-3" onClick={addExtra}>
          <Plus className="h-4 w-4 mr-1" /> Agregar bloqueo extra
        </Button>
        <p className="text-xs text-slate-400 mt-2 w-full">
          Un bloqueo extra que ocupe la mañana (08:00–11:00) saca al médico de la visita del día.
        </p>
      </InfoCard>

      <EcografiasCard doctors={doctors} extraBlocks={extraBlocks} setExtraBlocks={setExtraBlocks} docName={docName} />

      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700">
        Médicos que harán visita hoy:{' '}
        <span className="font-medium">
          {(day.visita || []).length
            ? (day.visita || [])
                .map((v) => isLimited(v.capacity)
                  ? `${docName(v.doctor_id)} (máx ${v.capacity})`
                  : docName(v.doctor_id))
                .join(', ')
            : '—'}
        </span>
        <span className="block text-xs text-blue-500/80 mt-1">
          El número entre paréntesis es un tope solo para médicos con limitación horaria; el resto
          asume más visitas según su jornada.
        </span>
      </div>
    </div>
  );
}

// Ecografías ambulatorias: se realizan el mismo día (no se planifican), duran
// 30 min y solo las hacen Dra. Fasani o Dra. Sbarbaro. No sacan al médico de la
// visita: solo le restan ~30 min por cada una. Se agregan como bloque (eco:true).
function EcografiasCard({ doctors, extraBlocks, setExtraBlocks, docName }) {
  const ecoDoctors = (doctors || []).filter((d) => /fasani|sbarbaro/i.test(d.display_name || ''));
  const [doctorId, setDoctorId] = useState('');
  const [from, setFrom] = useState('08:00');

  const ecos = (extraBlocks || []).filter((b) => b.eco);
  const ecoCountByDoctor = ecos.reduce((acc, b) => { acc[b.doctorId] = (acc[b.doctorId] || 0) + 1; return acc; }, {});

  const addEco = () => {
    if (!doctorId) return;
    const [h, m] = (from || '08:00').split(':').map(Number);
    const total = h * 60 + m + 30;
    const to = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    const n = (extraBlocks || []).filter((b) => b.eco && b.doctorId === doctorId).length + 1;
    setExtraBlocks((p) => [...p, { id: crypto.randomUUID(), from, to, doctorId, cause: `Ecografía (${n})`, eco: true }]);
  };
  const removeEco = (id) => setExtraBlocks((p) => p.filter((b) => b.id !== id));

  return (
    <InfoCard title="Ecografías ambulatorias (hoy)">
      <p className="text-xs text-slate-500 w-full mb-2">
        Se realizan el mismo día (no se planifican). Duran 30 min y solo las hacen Dra. Fasani o Dra. Sbarbaro.
        No las sacan de la visita: cada ecografía les resta ~30 min de tiempo de visita.
      </p>
      {ecoDoctors.length === 0 ? (
        <Muted>No se encontró a Fasani/Sbarbaro en la lista de médicos.</Muted>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="h-8 text-xs rounded-md border border-slate-200 bg-white px-2 min-w-[160px]"
            >
              <option value="">Médico…</option>
              {ecoDoctors.map((d) => <option key={d.id} value={d.id}>{d.display_name}</option>)}
            </select>
            <Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="w-28 h-8 text-xs" />
            <Button variant="outline" size="sm" onClick={addEco} disabled={!doctorId}>
              <Plus className="h-4 w-4 mr-1" /> Agregar ecografía (30 min)
            </Button>
          </div>
          {ecos.length > 0 && (
            <ul className="mt-3 w-full space-y-1.5 border-t border-slate-100 pt-3">
              {ecos.map((b) => (
                <li key={b.id} className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="font-semibold tabular-nums">{(b.from || '').slice(0, 5)}–{(b.to || '').slice(0, 5)}</span>
                  <span className="flex-1">Ecografía · {docName(b.doctorId)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeEco(b.id)}>
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {Object.keys(ecoCountByDoctor).length > 0 && (
            <p className="mt-2 w-full text-[11px] text-amber-600">
              {Object.entries(ecoCountByDoctor).map(([id, n]) => `${docName(id)}: ${n} eco → −${n * 30} min de visita`).join(' · ')}
            </p>
          )}
        </>
      )}
    </InfoCard>
  );
}

// ── Step 2: Telemedicinas ──────────────────────────────────────────────────
function StepTelemed({ telemed, setTelemed }) {
  const add = () =>
    setTelemed((p) => [...p, { id: crypto.randomUUID(), specialty: '', time: '', doctor: '' }]);
  const update = (id, field, value) =>
    setTelemed((p) => p.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  const remove = (id) => setTelemed((p) => p.filter((t) => t.id !== id));

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">¿Hay telemedicinas agendadas?</h2>
      <p className="text-sm text-slate-500 -mt-3">
        Ej: Teleginecología 14:30 (Dra. Toledo). Agrega las que correspondan.
      </p>

      <div className="space-y-3">
        {telemed.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-slate-200"
          >
            <Input
              placeholder="Especialidad (ej. Teleginecología)"
              value={t.specialty}
              onChange={(e) => update(t.id, 'specialty', e.target.value)}
              className="flex-1 min-w-[180px]"
            />
            <Input
              type="time"
              value={t.time}
              onChange={(e) => update(t.id, 'time', e.target.value)}
              className="w-32"
            />
            <Input
              placeholder="Médico (opcional)"
              value={t.doctor}
              onChange={(e) => update(t.id, 'doctor', e.target.value)}
              className="flex-1 min-w-[140px]"
            />
            <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
              <Trash2 className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={add}>
        <Plus className="h-4 w-4 mr-1" /> Agregar telemedicina
      </Button>
    </div>
  );
}

// ── Step 3: Internos ───────────────────────────────────────────────────────
function StepInternos({ internos, setInternos }) {
  const add = () =>
    setInternos((p) => [...p, { id: crypto.randomUUID(), name: '', isNew: true }]);
  const update = (id, field, value) =>
    setInternos((p) => p.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  const remove = (id) => setInternos((p) => p.filter((t) => t.id !== id));

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">¿Qué internos hay hoy?</h2>
      <p className="text-sm text-slate-500 -mt-3">
        Marca si son nuevos. Los internos nuevos gatillan una redistribución; los que continúan
        mantienen sus pacientes durante la rotación.
      </p>

      <div className="space-y-3">
        {internos.map((it) => (
          <div
            key={it.id}
            className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-slate-200"
          >
            <Input
              placeholder="Nombre del interno (ej. C. Muñoz)"
              value={it.name}
              onChange={(e) => update(it.id, 'name', e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 px-2">
              <input
                type="checkbox"
                checked={it.isNew}
                onChange={(e) => update(it.id, 'isNew', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Nuevo
            </label>
            <Button variant="ghost" size="icon" onClick={() => remove(it.id)}>
              <Trash2 className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={add}>
        <Plus className="h-4 w-4 mr-1" /> Agregar interno
      </Button>
    </div>
  );
}

// ── Vista posterior al wizard: distribución de camas + reparto ───────────────
function PostWizard({
  docName, telemed, internos, bedStates, onToggleBed,
  result, roster, visitBedCodes, visitDocs, interns_,
  onRedistribute, bedOverrides, setBedOverrides,
  supervisorOverrides, setSupervisorOverrides,
  onSave, saving, savedExists, dirty, onExportPdf,
  onReabrir,
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-green-50 border border-green-100 p-4 flex items-start gap-3">
        <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-green-800">Confirmación completada</p>
          <p className="text-sm text-green-700">
            {visitDocs.length} médicos en visita · {telemed.length} telemedicinas ·{' '}
            {interns_.length} internos
          </p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={onReabrir}>
          Reabrir
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Distribución de camas</h2>
        <p className="text-sm text-slate-500 mb-4">
          Marca las camas <span className="font-medium">sin visita</span>, las{' '}
          <span className="font-medium">bloqueadas</span> (sociales) y las{' '}
          <span className="font-medium">vacías</span>. Quedan{' '}
          <span className="font-semibold text-blue-700">{visitBedCodes.length} pacientes con visita</span>{' '}
          para repartir entre {visitDocs.length} médicos.
        </p>
        <BedMap bedStates={bedStates} onToggle={onToggleBed} />
      </div>

      <DailyDistribution
        result={result}
        roster={roster}
        visitBedCodes={visitBedCodes}
        visitDocs={visitDocs}
        interns={interns_}
        docName={docName}
        onRedistribute={onRedistribute}
        bedOverrides={bedOverrides}
        setBedOverrides={setBedOverrides}
        supervisorOverrides={supervisorOverrides}
        setSupervisorOverrides={setSupervisorOverrides}
        onSave={onSave}
        saving={saving}
        savedExists={savedExists}
        dirty={dirty}
        onExportPdf={onExportPdf}
      />
    </div>
  );
}

// ── primitivos de UI ─────────────────────────────────────────────────────
function InfoCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2 items-center">{children}</div>
    </div>
  );
}

function Chip({ children, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${tones[tone]}`}>{children}</span>
  );
}

function Muted({ children }) {
  return <span className="text-sm text-slate-400">{children}</span>;
}

function EmptyDay({ onSubdireccion }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
      <p className="font-medium text-amber-800">No hay agenda para este día</p>
      <p className="text-sm text-amber-700 mt-1">
        El día seleccionado no tiene agenda semanal generada (puede ser feriado o fin de semana).
      </p>
      <Button variant="outline" className="mt-4" onClick={onSubdireccion}>
        Ir a Subdirección Médica
      </Button>
    </div>
  );
}
