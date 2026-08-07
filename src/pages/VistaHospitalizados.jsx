import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BedDouble, ChevronLeft, ClipboardList, FileText, FlaskConical, Image, Microscope, Pill, Plus, Save, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { ALL_BEDS } from '@/components/agenda-diaria/bedCatalog';
import { setMultiPrefill } from '@/lib/multiTemplatePrefill';
import { fetchProaRecords, getLatestProaForm, isHistoricalProaRecord } from '@/lib/proaRegistry';
import { createPageUrl } from '@/utils';

const STORAGE_KEY = 'vista_general_hospitalizados_v1';
const EMPTY = {
  nombre: '', rut: '', fechaNacimiento: '', nFicha: '', prevision: '', telefono: '', direccion: '', comuna: '',
  fechaIngreso: '', diagnostico: '', antecedentes: '', antibioterapia: '', aislamiento: '', medicoTratante: '', observaciones: '',
};

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100';
const textarea = `${input} min-h-24 resize-y`;

function readRegistry() {
  try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; }
}

function formatRut(value) {
  const clean = String(value || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  if (clean.length === 1) return clean;
  return `${clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${clean.slice(-1)}`;
}

function hospitalDays(date) {
  if (!date) return 0;
  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max(1, Math.floor((new Date().setHours(0, 0, 0, 0) - start.getTime()) / 86400000) + 1);
}

function catalogToProaBed(bed) {
  if (bed.serviceShort === 'MQ1') {
    if (/^\d+-\d+$/.test(bed.cell)) return bed.cell;
    const isolation = /^Aisl(\d+)-(\d+)$/.exec(bed.cell);
    if (isolation) return Number(isolation[2]) === 1 && !['5', '8'].includes(isolation[1])
      ? `Aisl ${isolation[1]}` : `Aisl ${isolation[1]}-${isolation[2]}`;
  }
  if (bed.serviceShort === 'MQ2') {
    const isolation = /^Aislamiento\s+(\d+)$/i.exec(bed.cell);
    return isolation ? `MQ2-Aislamiento ${isolation[1]}` : `MQ2-${bed.cell}`;
  }
  if (bed.serviceShort === 'GINE') {
    const gine = /^08MB-(\d+)$/.exec(bed.code);
    const obs = /^SNC-(\d+)$/.exec(bed.code);
    return gine ? `GINE-${gine[1]}` : obs ? `OBS-${obs[1]}` : null;
  }
  if (bed.serviceShort === 'PED') {
    const pediatricBeds = ALL_BEDS.filter(item => item.serviceShort === 'PED');
    const index = pediatricBeds.findIndex(item => item.code === bed.code);
    return index >= 0 ? `PED-${index + 1}` : null;
  }
  return null;
}

const PROA_TO_CATALOG = new Map(ALL_BEDS.map(bed => [catalogToProaBed(bed), bed.code]).filter(([key]) => key));

function antibioticSummary(form) {
  if (form.antibioterapia_preingreso) return form.antibioterapia_preingreso;
  return (form.antibioticos || []).filter(item => item?.nombre).map(item => [
    item.nombre,
    item.dosis || [item.dosis_cantidad, item.dosis_unidad].filter(Boolean).join(' '),
    item.intervalo_horas && `c/${item.intervalo_horas} h`,
    item.via,
    item.inicio && `desde ${item.inicio}`,
  ].filter(Boolean).join(' ')).join('\n');
}

function proaToPatient(record) {
  const form = getLatestProaForm(record) || {};
  return {
    nombre: form.paciente || '', rut: formatRut(form.rut), fechaNacimiento: form.fecha_nacimiento || '',
    nFicha: form.n_ficha || '', prevision: form.prevision || '', telefono: form.telefono || '',
    direccion: form.direccion || '', comuna: form.comuna || '', fechaIngreso: form.fecha_ingreso || '',
    diagnostico: form.diagnostico_actual || form.diagnostico || '',
    antecedentes: form.antecedentes || form.funcion_renal || '', antibioterapia: antibioticSummary(form),
    aislamiento: form.aislamiento || '', medicoTratante: form.medico || form.medico_tratante || '',
    observaciones: form.evolucion || (form.recomendaciones || []).join(' · '),
    proaRecordId: record.id, proaUpdatedAt: record.updatedAt,
  };
}

function mergePatient(base, local) {
  const merged = { ...base };
  Object.entries(local || {}).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) merged[key] = value;
  });
  return merged;
}

function Field({ label, children, wide = false }) {
  return <label className={wide ? 'block sm:col-span-2' : 'block'}><span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}

const ACTIONS = [
  { label: 'Nota de evolución', route: 'NotaEvolucion', icon: ClipboardList, color: 'text-slate-700 bg-slate-100' },
  { label: 'Solicitud de exámenes', route: 'SolicitudExamenes', icon: FlaskConical, color: 'text-blue-700 bg-blue-50' },
  { label: 'Microbiología', route: 'SolicitudMicrobiologia', icon: Microscope, color: 'text-cyan-700 bg-cyan-50' },
  { label: 'Fármaco restringido', route: 'SolicitudFarmacoRestringido', icon: Pill, color: 'text-amber-700 bg-amber-50' },
  { label: 'HODOM / consentimientos', route: 'FormulariosHODOM', icon: FileText, color: 'text-indigo-700 bg-indigo-50' },
  { label: 'Formulario / Constancia GES', route: 'FormularioGES', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50' },
  { label: 'IRA grave / ISP', route: 'FormularioIRAGrave', icon: Activity, color: 'text-rose-700 bg-rose-50' },
  { label: 'Protocolos de imágenes y otros', route: 'Templates?multi=1', icon: Image, color: 'text-violet-700 bg-violet-50' },
];

function VistaHospitalizados() {
  const navigate = useNavigate();
  const [registry, setRegistry] = useState(readRegistry);
  const [selectedCode, setSelectedCode] = useState('');
  const [draft, setDraft] = useState(EMPTY);
  const [service, setService] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const [syncState, setSyncState] = useState('loading');

  useEffect(() => {
    let active = true;
    fetchProaRecords().then(records => {
      if (!active) return;
      setRegistry(current => {
        const fromProa = {};
        records.filter(record => !isHistoricalProaRecord(record)).forEach(record => {
          const catalogCode = PROA_TO_CATALOG.get(record.bedCode)
            || (ALL_BEDS.some(bed => bed.code === record.bedCode) ? record.bedCode : null);
          if (catalogCode) fromProa[catalogCode] = proaToPatient(record);
        });
        const merged = { ...fromProa };
        Object.entries(current).forEach(([bedCode, local]) => {
          merged[bedCode] = mergePatient(fromProa[bedCode] || {}, local);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
      setSyncState('ready');
    }).catch(() => { if (active) setSyncState('offline'); });
    return () => { active = false; };
  }, []);

  const services = [...new Set(ALL_BEDS.map(b => b.serviceShort))];
  const selectedBed = ALL_BEDS.find(b => b.code === selectedCode);
  const occupied = Boolean(draft.nombre || draft.rut || draft.fechaIngreso || draft.diagnostico);
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const visibleBeds = useMemo(() => ALL_BEDS.filter(b => {
    const record = registry[b.code] || {};
    const isOccupied = Boolean(record.nombre || record.rut || record.fechaIngreso || record.diagnostico);
    if (service !== 'all' && b.serviceShort !== service) return false;
    if (status === 'occupied' && !isOccupied) return false;
    if (status === 'free' && isOccupied) return false;
    if (!normalizedQuery) return true;
    return [b.code, b.cell, b.serviceShort, b.salaLabel, record.nombre, record.rut, record.diagnostico]
      .some(value => String(value || '').toLocaleLowerCase('es').includes(normalizedQuery));
  }), [registry, service, status, normalizedQuery]);

  const totals = useMemo(() => {
    const occupiedCount = ALL_BEDS.filter(b => { const r = registry[b.code] || {}; return r.nombre || r.rut || r.fechaIngreso || r.diagnostico; }).length;
    return { occupied: occupiedCount, free: ALL_BEDS.length - occupiedCount };
  }, [registry]);

  const openBed = (bed) => {
    setSelectedCode(bed.code);
    setDraft({ ...EMPTY, ...(registry[bed.code] || {}) });
    setSaved(false);
  };

  const update = (key, value) => { setDraft(old => ({ ...old, [key]: value })); setSaved(false); };
  const save = () => {
    const next = { ...registry, [selectedCode]: { ...draft, updatedAt: new Date().toISOString() } };
    setRegistry(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
  };

  const prefill = () => {
    const data = {
      patient_name: draft.nombre, patient_rut: draft.rut, patient_fecha_nac: draft.fechaNacimiento,
      patient_direccion: draft.direccion, patient_comuna: draft.comuna, patient_telefono: draft.telefono,
      prevision: draft.prevision, diagnostico: draft.diagnostico, n_ficha: draft.nFicha,
      servicio: selectedBed?.serviceShort || '', cama: selectedBed?.cell || selectedBed?.code || '',
    };
    setMultiPrefill(data);
    return data;
  };

  const openAction = (route) => {
    save();
    prefill();
    const [page, search] = route.split('?');
    navigate(`${createPageUrl(page)}${search ? `?${search}` : ''}`);
  };

  return <div className="min-h-screen bg-slate-100">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-black text-slate-950">Vista general</h1><p className="text-xs text-slate-500">{syncState === 'loading' ? 'Sincronizando pacientes desde PROA…' : syncState === 'offline' ? 'Mostrando última información disponible' : 'Camas, situación clínica y documentos del paciente'}</p></div>
        <div className="hidden items-center gap-2 sm:flex"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{totals.occupied} ocupadas</span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{totals.free} libres</span></div>
      </div>
    </header>

    <main className="mx-auto grid max-w-[1500px] gap-4 p-4 xl:grid-cols-[minmax(480px,0.9fr)_minmax(560px,1.1fr)]">
      <section className="min-w-0">
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} className={`${input} pl-9`} placeholder="Buscar cama, paciente, RUT o diagnóstico" /></label>
            <select className={input} value={service} onChange={e => setService(e.target.value)}><option value="all">Todos los servicios</option>{services.map(s => <option key={s}>{s}</option>)}</select>
            <select className={input} value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todas</option><option value="occupied">Ocupadas</option><option value="free">Libres</option></select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleBeds.map(bed => {
            const record = registry[bed.code] || {};
            const isOccupied = Boolean(record.nombre || record.rut || record.fechaIngreso || record.diagnostico);
            const active = selectedCode === bed.code;
            return <button key={bed.code} onClick={() => openBed(bed)} className={`min-h-36 rounded-xl border p-3 text-left transition ${active ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200' : isOccupied ? 'border-emerald-200 bg-white hover:border-emerald-400' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
              <div className="flex items-start justify-between gap-2"><div><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{bed.serviceShort} · {bed.salaLabel}</span><span className="block text-lg font-black text-slate-950">Cama {bed.cell}</span></div><BedDouble className={`h-5 w-5 ${isOccupied ? 'text-emerald-600' : 'text-slate-300'}`} /></div>
              {isOccupied ? <><p className="mt-2 truncate text-sm font-bold text-slate-900">{record.nombre || 'Paciente sin nombre'}</p><p className="truncate text-xs text-slate-500">{record.diagnostico || 'Sin diagnóstico registrado'}</p><p className="mt-2 text-[11px] font-bold text-emerald-700">Día {hospitalDays(record.fechaIngreso)} de hospitalización</p>{record.antibioterapia && <p className="mt-1 truncate text-[10px] font-semibold text-amber-700">ATB: {record.antibioterapia}</p>}</> : <><span className="mt-5 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">LIBRE / SIN INFORMACIÓN</span><p className="mt-2 text-[10px] text-slate-400">Abrir para ingresar paciente</p></>}
            </button>;
          })}
        </div>
      </section>

      <aside className="min-w-0 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
        {!selectedBed ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><BedDouble className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-4 font-bold text-slate-800">Selecciona una cama</h2><p className="mt-1 text-sm text-slate-500">Podrás registrar al paciente y generar todos sus documentos desde una sola ficha.</p></div> : <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">{selectedBed.serviceShort} · {selectedBed.salaLabel}</p><h2 className="text-2xl font-black text-slate-950">Cama {selectedBed.cell}</h2>{occupied && <p className="text-xs font-semibold text-emerald-700">Ingreso {draft.fechaIngreso || 'sin fecha'} · Día {hospitalDays(draft.fechaIngreso)}</p>}</div><Button onClick={save} className="gap-2 bg-teal-700 hover:bg-teal-800"><Save className="h-4 w-4" />{saved ? 'Guardado' : 'Guardar ficha'}</Button></div>
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>Información clínica protegida por código de acceso. Los datos se reutilizan únicamente al abrir documentos desde esta ficha.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre completo" wide><input className={input} value={draft.nombre} onChange={e => update('nombre', e.target.value)} /></Field>
              <Field label="RUT"><input className={input} value={draft.rut} onChange={e => update('rut', formatRut(e.target.value))} placeholder="12.345.678-9" /></Field>
              <Field label="Fecha de nacimiento"><input type="date" className={input} value={draft.fechaNacimiento} onChange={e => update('fechaNacimiento', e.target.value)} /></Field>
              <Field label="N° ficha"><input className={input} value={draft.nFicha} onChange={e => update('nFicha', e.target.value)} /></Field>
              <Field label="Previsión"><input className={input} value={draft.prevision} onChange={e => update('prevision', e.target.value)} placeholder="Fonasa A, B, C, D…" /></Field>
              <Field label="Teléfono"><input className={input} value={draft.telefono} onChange={e => update('telefono', e.target.value)} /></Field>
              <Field label="Dirección"><input className={input} value={draft.direccion} onChange={e => update('direccion', e.target.value)} /></Field>
              <Field label="Comuna"><input className={input} value={draft.comuna} onChange={e => update('comuna', e.target.value)} /></Field>
              <Field label="Fecha de ingreso"><input type="date" className={input} value={draft.fechaIngreso} onChange={e => update('fechaIngreso', e.target.value)} /></Field>
              <Field label="Médico tratante"><input className={input} value={draft.medicoTratante} onChange={e => update('medicoTratante', e.target.value)} /></Field>
              <Field label="Diagnóstico(s)" wide><textarea className={textarea} value={draft.diagnostico} onChange={e => update('diagnostico', e.target.value)} /></Field>
              <Field label="Antecedentes relevantes" wide><textarea className={textarea} value={draft.antecedentes} onChange={e => update('antecedentes', e.target.value)} /></Field>
              <Field label="Antibioterapia" wide><textarea className={textarea} value={draft.antibioterapia} onChange={e => update('antibioterapia', e.target.value)} placeholder="Fármaco, dosis, vía, intervalo y fecha de inicio" /></Field>
              <Field label="Aislamiento / precauciones"><input className={input} value={draft.aislamiento} onChange={e => update('aislamiento', e.target.value)} /></Field>
              <Field label="Observaciones"><input className={input} value={draft.observaciones} onChange={e => update('observaciones', e.target.value)} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-teal-700" /><div><h3 className="font-black text-slate-900">Documentos y solicitudes</h3><p className="text-xs text-slate-500">La ficha se guarda y los datos compatibles se cargan automáticamente.</p></div></div>
            <div className="grid gap-2 sm:grid-cols-2">{ACTIONS.map(action => { const Icon = action.icon; return <button key={action.label} onClick={() => openAction(action.route)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-teal-300 hover:shadow-sm"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${action.color}`}><Icon className="h-4 w-4" /></span><span className="text-sm font-semibold text-slate-800">{action.label}</span></button>; })}</div>
          </section>
        </div>}
      </aside>
    </main>
  </div>;
}

export default conPuertaAcceso(VistaHospitalizados, {
  storageKey: 'acceso_vista_hospitalizados',
  titulo: 'Vista general',
  descripcion: 'Ingresa el código BULNESMEDICO para acceder a camas y fichas de pacientes hospitalizados.',
});
