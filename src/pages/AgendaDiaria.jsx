import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, Plus, Trash2,
  Video, GraduationCap, ClipboardList, AlertTriangle, Pencil, BedDouble, Users, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { createPageUrl } from '@/utils';
import { useSdmWeeklyAgenda } from '@/components/sdm/lib/useSdmWeeklyAgenda';
import { getMondayOfWeek, fmtDate, weekDates } from '@/components/sdm/lib/generateAgenda';
import { sdmSupabase, explainSdmWriteError } from '@/components/sdm/lib/sdmSupabase';
import BedMap from '@/components/agenda-diaria/BedMap';
import {
  BED_STATE, NEXT_STATE_CYCLE, ALL_BEDS, defaultBedState, initialBedStatesForDate,
} from '@/components/agenda-diaria/bedCatalog';
import { hashStr, slugifyName, distributeDay } from '@/components/agenda-diaria/distribute';
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
const EMPTY_DOCTOR = '__empty__';
// Valor centinela para un bloqueo que aplica a TODOS los médicos del día
// (salvo urgencias/turnos y refuerzos). Al elegirlo se materializan todos los apellidos.
const ALL_DOCTORS = '__all__';

const newBlock = () => ({
  block_id: `daily-${crypto.randomUUID()}`,
  name: '',
  from: '08:00',
  to: '11:00',
  doctor_id: null,
  doctor_ids: [],
  category: 'manual',
  source: 'daily_edit',
});

const doctorIds = (block) => (
  Array.isArray(block?.doctor_ids) ? block.doctor_ids.filter(Boolean) : (block?.doctor_id ? [block.doctor_id] : [])
);

const normalizeDailyBlock = (block) => {
  const ids = doctorIds(block);
  return {
    ...block,
    block_id: block.block_id || `daily-${crypto.randomUUID()}`,
    name: block.name || 'Bloqueo',
    from: block.from ? String(block.from).slice(0, 5) : null,
    to: block.to ? String(block.to).slice(0, 5) : null,
    doctor_ids: ids,
    doctor_id: ids[0] || null,
    source: block.source || 'daily_edit',
  };
};

const applyDayOverrides = (baseDay, overrides = {}) => {
  if (!baseDay) return null;
  return {
    ...baseDay,
    turnos: overrides.turnos || baseDay.turnos || [],
    posturno: overrides.posturno || baseDay.posturno || [],
    ausencias: overrides.ausencias || baseDay.ausencias || [],
    refuerzos: overrides.refuerzos || baseDay.refuerzos || { am: null, pm: null },
    bloqueos: (overrides.bloqueos || baseDay.bloqueos || []).map(normalizeDailyBlock),
    visita: uniqueVisits(overrides.visita || baseDay.visita || []),
    policlinico: Object.prototype.hasOwnProperty.call(overrides, 'policlinico') ? overrides.policlinico : baseDay.policlinico,
    poli_8am: Object.prototype.hasOwnProperty.call(overrides, 'poli_8am') ? overrides.poli_8am : baseDay.poli_8am,
    external_visitors: overrides.external_visitors || baseDay.external_visitors || [],
  };
};

const idsOf = (rows = []) => rows.map((r) => r.doctor_id).filter(Boolean);
const unique = (arr) => [...new Set(arr.filter(Boolean))];
const uniqueVisits = (visits = []) => {
  const seen = new Set();
  return visits.filter((v) => {
    if (!v?.doctor_id || seen.has(v.doctor_id)) return false;
    seen.add(v.doctor_id);
    return true;
  });
};

const block = (name, from, to, doctorIds, extra = {}) => ({
  block_id: `initial-2026-06-25-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  name,
  from,
  to,
  doctor_ids: doctorIds,
  doctor_id: doctorIds[0] || null,
  category: extra.category || 'manual',
  source: 'initial_agenda_2026_06_25',
  ...extra,
});

const INITIAL_DAILY_AGENDAS = {
  '2026-06-25': {
    dayOverrides: {
      turnos: [{ doctor_id: 'r_aguilera' }, { doctor_id: 'rivas' }],
      posturno: [{ doctor_id: 'carreno' }, { doctor_id: 'sbarbaro' }],
      refuerzos: { am: 'santibanez', pm: 'v_aguilera' },
      ausencias: [
        { doctor_id: 'cordero', type: 'FL' },
        { doctor_id: 'san_martin', type: 'FL' },
        { doctor_id: 'correa', type: 'A' },
      ],
      bloqueos: [
        block('Selector de demanda', '08:00', '11:00', ['ruf']),
        block('SDM + Poli TACO', '08:00', '17:00', ['fasani']),
        block('Telesalud', '08:00', '10:30', ['sandoval']),
        block('Gestión telemedicina', '10:30', '13:30', ['sandoval']),
        block('Gestión dependencia severa', '12:00', '13:30', ['toledo']),
        block('Paliativos', '14:00', '17:00', ['sandoval']),
        block('HODOM', '14:00', '17:00', ['troncoso']),
        block('Visita PROA', '12:50', '13:30', ['alvarado']),
        block('Dependencia severa', '14:00', '17:00', ['toledo']),
        block('Gestión PSCV', '14:00', '17:00', ['alvarado']),
        block('Visita de servicio - Dr. R. Sandoval', '14:00', '16:00', ['gil', 'sandoval']),
        block('Regulación IC', '15:20', '16:40', ['enriquez']),
      ],
      visita: [
        { doctor_id: 'alvarado', capacity: 5, manual: true },
        { doctor_id: 'enriquez', capacity: 5, manual: true },
        { doctor_id: 'gil', capacity: 5, manual: true },
        { doctor_id: 'toledo', capacity: 4, manual: true },
        { doctor_id: 'troncoso', capacity: 4, manual: true },
      ],
    },
    telemed: [
      { id: 'initial-psiquiatria-2026-06-25', specialty: 'Psiquiatría - Luz Fernández (hospitalizada)', time: '10:00', doctor: 'ENRIQUEZ' },
      { id: 'initial-reumatologia-2026-06-25', specialty: 'Reumatología - Lucía Vargas (ambulatorio)', time: '12:30', doctor: 'GIL' },
    ],
    internos: [
      { id: 'initial-yasna-quezada', name: 'Yasna Quezada', isNew: false },
      { id: 'initial-javiera-munoz', name: 'Javiera Muñoz', isNew: false },
      { id: 'initial-vale-albornoz', name: 'Vale Albornoz', isNew: false },
      { id: 'initial-maria-molina', name: 'María Molina', isNew: false },
    ],
  },
};

const initialDailyAgendaForDate = (date) => INITIAL_DAILY_AGENDAS[String(date || '').slice(0, 10)] || {};

// ── Rotaciones de internos ───────────────────────────────────────────────────
// Los internos rotan por bloques de ~2 semanas. Se precargan (nombre + camas
// fijas de la captura) para TODO su período; pasado el rango dejan de aparecer
// automáticamente (se retiran de la herencia día-a-día).
const INTERN_ROTATIONS = [
  {
    from: '2026-07-06',
    to: '2026-07-17', // 2 semanas: lun 6 → vie 17 jul 2026
    interns: [
      { name: 'María J. Molina', beds: ['03MQB-03', '03MQB-04', '03MQB-05'] }, // MQ1 SALA 3
      { name: 'Catalina Soto', beds: ['S2MQMCHB-1', 'S2MQMCHB-4', 'S2MQMCHB-5'] }, // MQ2 SALA 2
      { name: 'Juan Hollander', beds: ['02MQB-01', '02MQB-04', '02MQB-05'] }, // MQ1 SALA 2
    ],
  },
];
// Todos los nombres que alguna vez rotaron (para retirarlos al expirar su rango).
const ROTATION_INTERN_NAMES = new Set(
  INTERN_ROTATIONS.flatMap((r) => r.interns.map((i) => i.name)),
);
// Rotación activa para una fecha (o null si ninguna la cubre).
const internRotationForDate = (date) => {
  const d = String(date || '').slice(0, 10);
  return INTERN_ROTATIONS.find((r) => d >= r.from && d <= r.to) || null;
};
// Internos ({id,name,isNew}) y bedOverrides ({code:internId}) de la fecha.
const rotationInternsForDate = (date) => {
  const rot = internRotationForDate(date);
  if (!rot) return { internos: [], bedOverrides: {} };
  const internos = rot.interns.map((i) => ({ id: slugifyName(i.name), name: i.name, isNew: false }));
  const bedOverrides = {};
  rot.interns.forEach((i) => i.beds.forEach((c) => { bedOverrides[c] = slugifyName(i.name); }));
  return { internos, bedOverrides };
};

function buildVisitaOverride(baseDay, editedDay) {
  const base = new Set(idsOf(baseDay?.visita || []));
  const edited = idsOf(editedDay?.visita || []);
  return {
    add: edited.filter((id) => !base.has(id)),
    remove: [...base].filter((id) => !edited.includes(id)),
  };
}

const STEPS = [
  { key: 'agenda', label: 'Agenda del día', icon: ClipboardList },
  { key: 'telemed', label: 'Telemedicinas', icon: Video },
  { key: 'internos', label: 'Internos', icon: GraduationCap },
  { key: 'camas', label: 'Camas', icon: BedDouble },
  { key: 'visita', label: 'Médicos visita', icon: Users },
  { key: 'final', label: 'Agenda final', icon: FileText },
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

  const baseDay = useMemo(
    () => agenda.find((d) => d.date === selectedDate) || null,
    [agenda, selectedDate],
  );
  const [dayOverrides, setDayOverrides] = useState({});
  const day = useMemo(() => applyDayOverrides(baseDay, dayOverrides), [baseDay, dayOverrides]);

  // ── estado del wizard ──────────────────────────────────────────────────
  const [step, setStep] = useState(0);

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
        const initial = initialDailyAgendaForDate(selectedDate);
        const rotation = rotationInternsForDate(selectedDate);
        setDayOverrides(Object.keys(dd.dayOverrides || {}).length ? dd.dayOverrides : (initial.dayOverrides || {}));
        setBedStates(Object.keys(dd.bedStates || {}).length ? dd.bedStates : initialBedStatesForDate(selectedDate));
        setTelemed((dd.telemed || []).length ? dd.telemed : (initial.telemed || []));
        // Si el día guardado no trae internos, usa la rotación vigente (o la plantilla).
        setInternos((dd.internos || []).length ? dd.internos : (rotation.internos.length ? rotation.internos : (initial.internos || [])));
        setExtraBlocks(dd.extraBlocks || []);
        setDoctorSeed(dd.doctorSeed || 0);
        setBedOverrides(Object.keys(dd.bedOverrides || {}).length ? dd.bedOverrides : rotation.bedOverrides);
        setSupervisorOverrides(dd.supervisorOverrides || {});
        setPriorAssignments(dd.assigned || {}); // reproduce el reparto guardado
        setSavedExists(true);
        setStep(5);
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
        const initial = initialDailyAgendaForDate(selectedDate);
        const initialBeds = initialBedStatesForDate(selectedDate);
        const rotation = rotationInternsForDate(selectedDate);
        // Internos: rotación vigente > plantilla de fecha > herencia (sin internos
        // de rotaciones ya expiradas, que quedan fuera automáticamente).
        const baseInterns = rotation.internos.length
          ? rotation.internos
          : (initial.internos || (pd.internos || []).filter((i) => !ROTATION_INTERN_NAMES.has(i.name)));
        setDayOverrides(initial.dayOverrides || {});
        setBedStates(Object.keys(initialBeds).length ? initialBeds : (pd.bedStates || {})); // plantilla vigente o herencia
        setTelemed(initial.telemed || []);             // telemedicinas del día si hay plantilla
        setInternos(baseInterns.map((i) => ({ ...i, isNew: false })));
        setExtraBlocks([]);
        setDoctorSeed(0);
        setBedOverrides(rotation.bedOverrides); // camas fijas de los internos de rotación
        setSupervisorOverrides(pd.supervisorOverrides || {});
        setPriorAssignments(pd.assigned || {});     // seguimiento médico↔paciente
        setSavedExists(false);
        setStep(0);
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
  }, [dayOverrides, bedStates, telemed, internos, extraBlocks, doctorSeed, bedOverrides, supervisorOverrides, hydrating]);

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
    const editedDay = applyDayOverrides(baseDay, dayOverrides);
    const payload = {
      date: selectedDate,
      data: {
        dayOverrides,
        bedStates, telemed, internos, extraBlocks,
        doctorSeed, bedOverrides, supervisorOverrides,
        assigned: result.assigned,
        saved_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };
    const { error } = await sdmSupabase
      .from('sdm_daily_agendas').upsert(payload, { onConflict: 'date' });
    if (error) {
      setSaving(false);
      toast.error('Error al guardar: ' + (explainSdmWriteError(error) || error.message));
      return;
    }

    const weeklyOk = await saveDailyIntoWeekly({
      weekStart: fmtDate(monday),
      baseDay,
      editedDay,
      dayOverrides,
      currentAgenda: agenda,
    });
    setSaving(false);
    if (!weeklyOk) return;
    setSavedExists(true);
    setDirty(false);
    setPriorAssignments(result.assigned); // fija el reparto guardado
    toast.success('Agenda diaria guardada y reflejada en Subdirección');
  }, [selectedDate, monday, baseDay, dayOverrides, agenda, bedStates, telemed, internos, extraBlocks, doctorSeed, bedOverrides, supervisorOverrides, result]);

  const onExportPdf = useCallback(async () => {
    if (!day) return;
    try {
      await exportDailyAgendaPdf({ date: selectedDate, day, result, telemed, extraBlocks, docName });
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
        ) : (
          <>
            <Stepper step={step} onStepChange={setStep} />
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
                  setDayOverrides={setDayOverrides}
                />
              )}
              {step === 1 && <StepTelemed telemed={telemed} setTelemed={setTelemed} doctors={doctors} />}
              {step === 2 && (
                <StepInternos internos={internos} setInternos={setInternos} />
              )}
              {step >= 3 && (
                <PostWizard
                  section={STEPS[step].key}
                  docName={docName}
                  telemed={telemed}
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
                  date={selectedDate}
                  day={day}
                  doctors={doctors}
                  setDayOverrides={setDayOverrides}
                />
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
              {(savedExists || dirty) && step < STEPS.length - 1 && (
                <Button variant="outline" onClick={onSave} disabled={saving || !dirty}>
                  <Check className="h-4 w-4 mr-1" />
                  {saving ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Guardado'}
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)}>
                  Continuar <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={onSave} disabled={saving}>
                  <Check className="h-4 w-4 mr-1" />
                  {saving ? 'Guardando…' : savedExists ? (dirty ? 'Guardar cambios' : 'Guardado') : 'Guardar agenda'}
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
function Stepper({ step, onStepChange }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === step;
        const done = i < step;
        return (
          <React.Fragment key={s.key}>
            <button
              type="button"
              onClick={() => onStepChange(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : done
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: Agenda del día ─────────────────────────────────────────────────
async function saveDailyIntoWeekly({ weekStart, baseDay, editedDay, dayOverrides, currentAgenda }) {
  if (!baseDay || !editedDay) return true;

  const { data: row, error: readError } = await sdmSupabase
    .from('sdm_weekly_agendas')
    .select('*')
    .eq('week_start', weekStart)
    .maybeSingle();
  if (readError) {
    toast.error('Guardado diario OK, pero no se pudo leer la agenda semanal: ' + (explainSdmWriteError(readError) || readError.message));
    return false;
  }

  const previous = row?.data || {};
  const previousAgenda = Array.isArray(previous.agenda) ? previous.agenda : currentAgenda;
  const nextAgenda = previousAgenda.map((d) => (d.date === editedDay.date ? editedDay : d));
  const nextReinforcements = {
    ...(previous.reinforcements || {}),
    [editedDay.date]: editedDay.refuerzos || { am: null, pm: null },
  };
  const nextBloqueosOverrides = {
    ...(previous.bloqueosOverrides || {}),
    [editedDay.date]: (editedDay.bloqueos || []).map(normalizeDailyBlock),
  };
  const visitaOverride = buildVisitaOverride(baseDay, editedDay);
  const nextVisitaOverrides = { ...(previous.visitaOverrides || {}) };
  if (visitaOverride.add.length || visitaOverride.remove.length) nextVisitaOverrides[editedDay.date] = visitaOverride;
  else delete nextVisitaOverrides[editedDay.date];

  const nextDailyOverrides = {
    ...(previous.dailyOverrides || {}),
    [editedDay.date]: dayOverrides,
  };

  const payload = {
    week_start: weekStart,
    data: {
      ...previous,
      agenda: nextAgenda,
      reinforcements: nextReinforcements,
      bloqueosOverrides: nextBloqueosOverrides,
      visitaOverrides: nextVisitaOverrides,
      dailyOverrides: nextDailyOverrides,
      generated_at: new Date().toISOString(),
    },
    status: 'editada',
    updated_at: new Date().toISOString(),
  };

  const write = row?.id
    ? await sdmSupabase.from('sdm_weekly_agendas').update(payload).eq('id', row.id)
    : await sdmSupabase.from('sdm_weekly_agendas').insert(payload);
  if (write.error) {
    toast.error('Guardado diario OK, pero no se pudo actualizar Subdirección: ' + (explainSdmWriteError(write.error) || write.error.message));
    return false;
  }

  if (dayOverrides?.turnos) {
    const baseTurnos = idsOf(baseDay.turnos || []);
    const editedTurnos = idsOf(editedDay.turnos || []);
    const replacements = baseTurnos
      .map((doctorId, index) => ({ doctor_id: doctorId, replaced_by: editedTurnos[index], reason: 'Agenda diaria' }))
      .filter((r) => r.replaced_by && r.replaced_by !== r.doctor_id);
    const { error } = await sdmSupabase
      .from('sdm_shift_calendar')
      .update({ replacements })
      .eq('date', editedDay.date);
    if (error) {
      toast.warning('La semana quedó actualizada, pero el calendario de turnos no aceptó el reemplazo: ' + (explainSdmWriteError(error) || error.message));
    }
  }
  return true;
}

function StepAgenda({ day, docName, doctors, externalConfirm, setExternalConfirm, extraBlocks, setExtraBlocks, setDayOverrides }) {
  const turnos = day.turnos || [];
  const posturno = day.posturno || [];
  const ausencias = day.ausencias || [];
  const bloqueos = (day.bloqueos || []).filter((b) => !b.suspended);
  const externals = day.external_visitors || [];

  const addExtra = () =>
    setExtraBlocks((p) => [...p, { id: crypto.randomUUID(), from: '', to: '', doctorId: '', cause: '' }]);
  const updateExtra = (id, field, value) =>
    setExtraBlocks((p) => p.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  const removeExtra = (id) => setExtraBlocks((p) => p.filter((b) => b.id !== id));
  const updateDay = (field, value) => setDayOverrides((p) => ({ ...p, [field]: value }));
  const updateDoctorList = (field, index, doctorId) => {
    const current = day[field] || [];
    updateDay(field, current.map((row, i) => (i === index ? { ...row, doctor_id: doctorId } : row)));
  };
  const addDoctorToList = (field) => updateDay(field, [...(day[field] || []), { doctor_id: doctors[0]?.id || '' }]);
  const removeDoctorFromList = (field, index) => updateDay(field, (day[field] || []).filter((_, i) => i !== index));
  const setRefuerzo = (slot, doctorId) => updateDay('refuerzos', { ...(day.refuerzos || {}), [slot]: doctorId === EMPTY_DOCTOR ? null : doctorId });
  const updateAusencia = (index, field, value) => updateDay('ausencias', ausencias.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const addAusencia = () => updateDay('ausencias', [...ausencias, { doctor_id: doctors[0]?.id || '', type: 'A' }]);
  const removeAusencia = (index) => updateDay('ausencias', ausencias.filter((_, i) => i !== index));
  const updateBlock = (index, patch) => {
    updateDay('bloqueos', bloqueos.map((b, i) => {
      if (i !== index) return b;
      const next = { ...b, ...patch };
      return normalizeDailyBlock(next);
    }));
  };
  // "Todos los médicos": todos los apellidos de la agenda salvo urgencias (turnos) y refuerzos.
  const excludedFromAll = new Set([
    ...idsOf(turnos),
    day.refuerzos?.am,
    day.refuerzos?.pm,
  ].filter(Boolean));
  const allBlockDoctorIds = (doctors || []).map((d) => d.id).filter((id) => !excludedFromAll.has(id));
  const blockTargetsAll = (b) => b?.all_doctors === true;
  const setBlockDoctor = (index, doctorId) => {
    if (doctorId === ALL_DOCTORS) {
      updateBlock(index, { doctor_ids: allBlockDoctorIds, doctor_id: allBlockDoctorIds[0] || null, all_doctors: true });
      return;
    }
    updateBlock(index, {
      doctor_ids: doctorId === EMPTY_DOCTOR ? [] : [doctorId],
      doctor_id: doctorId === EMPTY_DOCTOR ? null : doctorId,
      all_doctors: false,
    });
  };
  // Agrega/quita un médico del bloqueo (selección múltiple). Al tocar uno se
  // deja de considerar "todos": el bloqueo pasa a la lista explícita de apellidos.
  const toggleBlockDoctor = (index, doctorId) => {
    const ids = new Set(doctorIds(bloqueos[index]));
    if (ids.has(doctorId)) ids.delete(doctorId); else ids.add(doctorId);
    const next = [...ids];
    updateBlock(index, { doctor_ids: next, doctor_id: next[0] || null, all_doctors: false });
  };
  const addBlock = () => updateDay('bloqueos', [...bloqueos, newBlock()]);
  const removeBlock = (index) => updateDay('bloqueos', bloqueos.filter((_, i) => i !== index));

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
          ? turnos.map((t, i) => (
              <DoctorSelectRow key={`${t.doctor_id}-${i}`} value={t.doctor_id} doctors={doctors} onChange={(v) => updateDoctorList('turnos', i, v)} onRemove={() => removeDoctorFromList('turnos', i)} />
            ))
          : <Muted>Sin turno asignado</Muted>}
        <MiniButton onClick={() => addDoctorToList('turnos')}>Agregar</MiniButton>
      </InfoCard>

      <InfoCard title="Posturno">
        {posturno.length
          ? posturno.map((t, i) => (
              <DoctorSelectRow key={`${t.doctor_id}-${i}`} value={t.doctor_id} doctors={doctors} onChange={(v) => updateDoctorList('posturno', i, v)} onRemove={() => removeDoctorFromList('posturno', i)} />
            ))
          : <Muted>—</Muted>}
        <MiniButton onClick={() => addDoctorToList('posturno')}>Agregar</MiniButton>
      </InfoCard>

      <InfoCard title="Refuerzos">
        <div className="flex flex-wrap gap-2">
          <DoctorPick label="AM" value={day.refuerzos?.am || EMPTY_DOCTOR} doctors={doctors} onChange={(v) => setRefuerzo('am', v)} allowEmpty />
          <DoctorPick label="PM" value={day.refuerzos?.pm || EMPTY_DOCTOR} doctors={doctors} onChange={(v) => setRefuerzo('pm', v)} allowEmpty />
        </div>
      </InfoCard>

      <InfoCard title="Ausencias">
        {ausencias.length === 0 ? (
          <Muted>Sin ausencias anotadas.</Muted>
        ) : ausencias.map((a, i) => (
          <span key={`${a.doctor_id}-${i}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
            <DoctorPick value={a.doctor_id} doctors={doctors} onChange={(v) => updateAusencia(i, 'doctor_id', v)} />
            <select
              value={a.type || 'A'}
              onChange={(e) => updateAusencia(i, 'type', e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
            >
              <option value="FL">Feriado legal</option>
              <option value="A">Administrativo</option>
              <option value="LM">Licencia médica</option>
              <option value="P">Permiso</option>
              <option value="DT">Devolución tiempo</option>
              <option value="CAP">Capacitación</option>
              <option value="PAS">Pasantía</option>
              <option value="OTRO">Otro</option>
            </select>
            <button type="button" onClick={() => removeAusencia(i)} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <MiniButton onClick={addAusencia}>Agregar</MiniButton>
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
          <ul className="w-full space-y-2 text-sm text-slate-600">
            {bloqueos.map((b, i) => {
              return (
                <li key={b.block_id || i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 p-2">
                  <Input type="time" value={b.from || ''} onChange={(e) => updateBlock(i, { from: e.target.value })} className="w-28 h-8 text-xs" />
                  <Input type="time" value={b.to || ''} onChange={(e) => updateBlock(i, { to: e.target.value })} className="w-28 h-8 text-xs" />
                  <Input value={b.name || ''} onChange={(e) => updateBlock(i, { name: e.target.value })} className="min-w-[180px] flex-1 h-8 text-xs" />
                  <BlockDoctorMultiPick
                    doctors={doctors}
                    selectedIds={doctorIds(b)}
                    allSelected={blockTargetsAll(b)}
                    onToggleAll={(checked) => setBlockDoctor(i, checked ? ALL_DOCTORS : EMPTY_DOCTOR)}
                    onToggleDoctor={(id) => toggleBlockDoctor(i, id)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeBlock(i)}>
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <Button variant="outline" size="sm" className="mt-3 mr-2" onClick={addBlock}>
          <Plus className="h-4 w-4 mr-1" /> Agregar bloqueo a agenda
        </Button>

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
const TELEMED_DEFAULT_DOCTORS = ['ALVARADO', 'CARREÑO', 'CORDERO', 'TOLEDO', 'SBARBARO', 'FASANI', 'SANDOVAL'];

function StepTelemed({ telemed, setTelemed, doctors = [] }) {
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
      <div className="flex flex-wrap gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <span className="w-full text-xs font-semibold uppercase tracking-wide text-blue-700">Pool habitual</span>
        {TELEMED_DEFAULT_DOCTORS.map((name) => (
          <Chip key={name}>{name}</Chip>
        ))}
      </div>

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
              list="telemed-doctor-pool"
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
      <datalist id="telemed-doctor-pool">
        {unique([...TELEMED_DEFAULT_DOCTORS, ...doctors.map((d) => d.display_name)]).map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
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
  section, docName, telemed, bedStates, onToggleBed,
  result, roster, visitBedCodes, visitDocs, interns_,
  onRedistribute, bedOverrides, setBedOverrides,
  supervisorOverrides, setSupervisorOverrides,
  onSave, saving, savedExists, dirty, onExportPdf,
  date, day, doctors, setDayOverrides,
}) {
  return (
    <div className="space-y-5">
      {section === 'camas' && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Distribución de camas</h2>
          <p className="text-sm text-slate-500 mb-4">
            Todas las camas nacen <span className="font-medium text-red-700">ocupadas</span>: haz click en las que estén{' '}
            <span className="font-medium text-emerald-700">libres</span> para liberarlas. Deja en{' '}
            <span className="font-medium text-violet-700">morado</span> las sociales y con{' '}
            <span className="font-medium">línea suspensiva</span> las no disponibles. Quedan{' '}
            <span className="font-semibold text-blue-700">{visitBedCodes.length} pacientes con visita</span>{' '}
            para repartir entre {visitDocs.length} médicos.
          </p>
          <BedMap bedStates={bedStates} onToggle={onToggleBed} />
        </div>
      )}

      {section === 'visita' && (
        <VisitDoctorsPanel day={day} doctors={doctors} setDayOverrides={setDayOverrides} />
      )}

      {section === 'final' && (
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
          date={date}
          day={day}
          telemed={telemed}
        />
      )}
    </div>
  );
}

function VisitDoctorsPanel({ day, doctors, setDayOverrides }) {
  const visitas = day?.visita || [];
  const used = new Set(visitas.map((v) => v.doctor_id).filter(Boolean));
  const updateVisita = (next) => setDayOverrides((p) => ({ ...p, visita: uniqueVisits(next) }));
  const update = (index, field, value) => {
    if (field === 'doctor_id' && visitas.some((v, i) => i !== index && v.doctor_id === value)) {
      toast.warning('Ese médico ya está en la visita del día.');
      return;
    }
    updateVisita(visitas.map((v, i) => (i === index ? { ...v, [field]: field === 'capacity' ? (value === '' ? null : Number(value)) : value } : v)));
  };
  const add = () => {
    const nextDoctor = doctors.find((d) => !used.has(d.id))?.id || doctors[0]?.id || '';
    if (!nextDoctor) return;
    updateVisita([...visitas, { doctor_id: nextDoctor, capacity: null, manual: true }]);
  };
  const remove = (index) => updateVisita(visitas.filter((_, i) => i !== index));

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
      <h2 className="mb-4 text-lg font-semibold text-blue-700">Médicos que harán visita hoy</h2>
      <div className="space-y-3">
        {visitas.map((v, i) => (
          <div key={`${v.doctor_id}-${i}`} className="flex flex-wrap items-center gap-3">
            <DoctorPick value={v.doctor_id} doctors={doctors} onChange={(value) => update(i, 'doctor_id', value)} />
            <Input
              type="number"
              min="1"
              placeholder="Sin tope"
              value={v.capacity ?? ''}
              onChange={(e) => update(i, 'capacity', e.target.value)}
              className="w-28 bg-white text-blue-700"
            />
            <Button variant="ghost" size="icon" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4 text-blue-400" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" className="mt-4 bg-white" onClick={add}>
        <Plus className="h-4 w-4 mr-1" /> Agregar visita
      </Button>
      <p className="mt-3 text-sm text-blue-500">
        El número entre paréntesis es un tope solo para médicos con limitación horaria; el resto asume más visitas según su jornada.
      </p>
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

function MiniButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
      <Plus className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function DoctorPick({ label, value, doctors, onChange, allowEmpty = false, allowAll = false }) {
  return (
    <label className="inline-flex items-center gap-1 text-xs text-slate-500">
      {label && <span className="font-semibold">{label}</span>}
      <select
        value={value || (allowEmpty ? EMPTY_DOCTOR : '')}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
      >
        {allowEmpty && <option value={EMPTY_DOCTOR}>—</option>}
        {allowAll && <option value={ALL_DOCTORS}>Todos los médicos</option>}
        {(doctors || []).map((d) => (
          <option key={d.id} value={d.id}>{d.display_name}</option>
        ))}
      </select>
    </label>
  );
}

// Selector de médicos de un bloqueo con selección MÚLTIPLE + opción "Todos".
function BlockDoctorMultiPick({ doctors, selectedIds = [], allSelected = false, onToggleAll, onToggleDoctor }) {
  const [open, setOpen] = useState(false);
  const nameOf = (id) => (doctors || []).find((d) => d.id === id)?.display_name || String(id || '').toUpperCase();
  const summary = allSelected
    ? 'Todos los médicos'
    : selectedIds.length === 0
      ? 'Médico…'
      : selectedIds.length <= 2
        ? selectedIds.map(nameOf).join(', ')
        : `${selectedIds.length} médicos`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-8 min-w-[150px] max-w-[240px] truncate rounded-md border bg-white px-2 text-left text-xs ${allSelected || selectedIds.length ? 'border-slate-300 text-slate-700' : 'border-slate-200 text-slate-400'}`}
        >
          {summary}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-60 overflow-auto p-1">
        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs font-medium hover:bg-slate-50">
          <Checkbox checked={allSelected} onCheckedChange={(c) => onToggleAll(!!c)} />
          Todos los médicos
        </label>
        <div className="my-1 border-t border-slate-100" />
        {(doctors || []).map((d) => (
          <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
            <Checkbox
              checked={allSelected || selectedIds.includes(d.id)}
              onCheckedChange={() => onToggleDoctor(d.id)}
            />
            {d.display_name}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function DoctorSelectRow({ value, doctors, onChange, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
      <Pencil className="h-3.5 w-3.5 text-slate-400" />
      <DoctorPick value={value} doctors={doctors} onChange={onChange} />
      <button type="button" onClick={onRemove} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
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
