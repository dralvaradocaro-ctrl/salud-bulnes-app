import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BedDouble, ChevronDown, ChevronLeft, ChevronUp, ClipboardList, FileText, FlaskConical, Image, Microscope, Pill, Plus, Printer, Save, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { ALL_BEDS } from '@/components/agenda-diaria/bedCatalog';
import { setMultiPrefill } from '@/lib/multiTemplatePrefill';
import { fetchProaRecords, getLatestProaForm, isHistoricalProaRecord, saveProaRecord } from '@/lib/proaRegistry';
import { createPageUrl } from '@/utils';

const STORAGE_KEY = 'vista_general_hospitalizados_v1';
const SELECTED_BED_KEY = 'vista_general_hospitalizados_selected_bed';
const EMPTY = {
  nombre: '', rut: '', fechaNacimiento: '', edad: '', sexo: '', nFicha: '', prevision: '', telefono: '', direccion: '', comuna: '',
  fechaIngreso: '', diagnostico: '', antecedentes: '', antibioterapia: '', antibioticos: [], aislamiento: '', medicoTratante: '', observaciones: '',
  resumenCaso: '', ultimaEvolucion: '', planesPendientes: '', estudiosComplementarios: '', estudiosDetalle: [], patogenoAislado: '', ultimoLaboratorio: '',
  letIndicacion: '', iotIndicacion: '', rcpIndicacion: '', historialActualizaciones: [],
};

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100';
const textarea = `${input} min-h-24 resize-y`;
const EMPTY_QUICK_ATB = { nombre: '', presentacion: '', dosis_cantidad: '', dosis_unidad: 'mg', intervalo_horas: '', via: 'EV', inicio: '', termino: '' };

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

function treatmentDays(startDate, endDate) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : new Date(new Date().setHours(0, 0, 0, 0));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

const SNAPSHOT_FIELDS = ['diagnostico', 'resumenCaso', 'ultimaEvolucion', 'planesPendientes', 'estudiosComplementarios', 'antibioterapia', 'patogenoAislado', 'ultimoLaboratorio', 'letIndicacion', 'iotIndicacion', 'rcpIndicacion', 'observaciones'];
function clinicalSnapshot(record) {
  return SNAPSHOT_FIELDS.reduce((snapshot, key) => ({ ...snapshot, [key]: record[key] || '' }), {});
}

function withHistorySnapshot(record) {
  const snapshot = clinicalSnapshot(record);
  if (!Object.values(snapshot).some(value => String(value).trim())) return record;
  const history = Array.isArray(record.historialActualizaciones) ? record.historialActualizaciones : [];
  const previous = history[0] ? clinicalSnapshot(history[0]) : null;
  if (previous && JSON.stringify(previous) === JSON.stringify(snapshot)) return record;
  const now = new Date();
  return { ...record, historialActualizaciones: [{ ...snapshot, fecha: now.toISOString().slice(0, 10), guardadoEn: now.toISOString() }, ...history].slice(0, 60) };
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

function structuredAntibioticSummary(items) {
  return (items || []).filter(item => item?.nombre).map(item => [item.nombre, item.presentacion && `(${item.presentacion})`, item.dosis || [item.dosis_cantidad, item.dosis_unidad].filter(Boolean).join(' '), item.intervalo_horas && `c/${item.intervalo_horas} h`, item.via, item.inicio && `desde ${item.inicio}`, item.termino && `hasta ${item.termino}`].filter(Boolean).join(' ')).join('\n');
}

function antibioticVisitSummary(record) {
  const items = (record.antibioticos || []).filter(item => item?.nombre);
  if (!items.length) return record.antibioterapia || '';
  return items.map(item => {
    const days = treatmentDays(item.inicio, item.termino);
    const treatment = [item.nombre, item.presentacion && `(${item.presentacion})`, item.dosis || [item.dosis_cantidad, item.dosis_unidad].filter(Boolean).join(' '), item.intervalo_horas && `c/${item.intervalo_horas} h`, item.via].filter(Boolean).join(' ');
    return `${treatment}${days ? ` (Día ${days})` : ''}`;
  }).join('\n');
}

function pathogenSummary(form) {
  if (form.diagnostico_microbiologico) return form.diagnostico_microbiologico;
  return (form.estudios_micro || []).filter(item => item?.patogeno).map(item => [item.patogeno, item.tipo_muestra].filter(Boolean).join(' · ')).join('\n');
}

function latestLabSummary(form) {
  const rows = Array.isArray(form.parametros_inflamatorios) ? form.parametros_inflamatorios : [];
  const latest = rows.slice().sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))[0];
  const renal = form.funcion_renal || [form.creatinina && `Creatinina ${form.creatinina} mg/dL`, form.vfg_estimada && `VFG estimada ${form.vfg_estimada} mL/min/1,73 m²`].filter(Boolean).join(' · ');
  if (!latest) return [form.fecha_creatinina, renal].filter(Boolean).join(' · ');
  return [latest.fecha, latest.pcr && `PCR ${latest.pcr}`, latest.pct && `PCT ${latest.pct}`, (latest.leucocitos || latest.blancos) && `Leu ${latest.leucocitos || latest.blancos}`, (latest.crea || latest.creatinina) && `Creatinina ${latest.crea || latest.creatinina} mg/dL`, renal && !latest.crea && !latest.creatinina ? renal : ''].filter(Boolean).join(' · ');
}

function isAutoRenalText(value) {
  return /^\s*Creatinina\s+[\d,.]+\s*mg\/dL\s*·\s*VFG\s+estimada/i.test(String(value || ''));
}

function proaToPatient(record) {
  const form = getLatestProaForm(record) || {};
  return {
    nombre: form.paciente || '', rut: formatRut(form.rut), fechaNacimiento: form.fecha_nacimiento || '', edad: form.edad || '', sexo: form.sexo || '',
    nFicha: form.n_ficha || '', prevision: form.prevision || '', telefono: form.telefono || '',
    direccion: form.direccion || '', comuna: form.comuna || '', fechaIngreso: form.fecha_ingreso || '',
    diagnostico: form.diagnostico_actual || form.diagnostico || '',
    antecedentes: form.antecedentes || '', antibioterapia: antibioticSummary(form), antibioticos: (form.antibioticos || []).filter(item => item?.nombre),
    aislamiento: form.aislamiento || '', medicoTratante: form.medico || form.medico_tratante || '',
    observaciones: (form.recomendaciones || []).join(' · '),
    resumenCaso: form.resumen_caso || '',
    planesPendientes: [form.plan_duracion, ...(form.recomendaciones || []), form.recomendaciones_otra].filter(Boolean).join(' · '),
    estudiosComplementarios: [form.estudios_imagen, form.diagnostico_microbiologico].filter(Boolean).join(' · '),
    patogenoAislado: pathogenSummary(form), ultimoLaboratorio: latestLabSummary(form),
    letIndicacion: form.let_indicacion || form.let || '', iotIndicacion: form.iot_indicacion || form.iot || '', rcpIndicacion: form.rcp_indicacion || form.rcp || '',
    historialActualizaciones: form.evolucion ? [{
      fecha: String(record.updatedAt || '').slice(0, 10), guardadoEn: record.updatedAt,
      diagnostico: form.diagnostico_actual || '', resumenCaso: form.evolucion,
      planesPendientes: [form.plan_duracion, ...(form.recomendaciones || [])].filter(Boolean).join(' · '),
      estudiosComplementarios: form.estudios_imagen || '', antibioterapia: antibioticSummary(form),
      patogenoAislado: pathogenSummary(form), ultimoLaboratorio: latestLabSummary(form), observaciones: '',
      letIndicacion: form.let_indicacion || form.let || '', iotIndicacion: form.iot_indicacion || form.iot || '', rcpIndicacion: form.rcp_indicacion || form.rcp || '',
    }] : [],
    proaRecordId: record.id, proaBedCode: record.bedCode, proaUpdatedAt: record.updatedAt,
  };
}

function mergePatient(base, local) {
  const merged = { ...base };
  Object.entries(local || {}).forEach(([key, value]) => {
    if (key === 'antecedentes' && isAutoRenalText(value)) return;
    if (value !== '' && value !== null && value !== undefined) merged[key] = value;
  });
  return merged;
}

function Field({ label, children, wide = false }) {
  return <label className={wide ? 'block sm:col-span-2' : 'block'}><span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}

function VisitTable({ rows, service }) {
  return <>
    <div className="hospital-print-header"><div><h1>Visita médica — Hospitalizados</h1><p>{service === 'all' ? 'Todos los servicios' : service} · {new Date().toLocaleDateString('es-CL')}</p></div><p>{rows.length} paciente{rows.length === 1 ? '' : 's'}</p></div>
    <table><thead><tr><th>Cama / paciente</th><th>Día / diagnóstico</th><th>Resumen</th><th>Última evolución</th><th>Estudios</th><th>ATB / patógeno</th><th>Últ. lab.</th><th>LET/IOT/RCP</th><th>Planes pendientes</th></tr></thead><tbody>
      {rows.map(({ bed, record }) => <tr key={bed.code}>
        <td><strong>{bed.serviceShort} · {bed.cell}</strong><br />{record.nombre || 'Sin nombre'}<br /><span>{record.rut || ''}</span></td>
        <td><strong>Día {hospitalDays(record.fechaIngreso)}</strong><br />{record.diagnostico || '—'}</td>
        <td>{record.resumenCaso || '—'}</td>
        <td>{record.ultimaEvolucion || '—'}</td>
        <td>{record.estudiosComplementarios || '—'}</td>
        <td>{record.antibioterapia ? <><strong>ATB:</strong> <span className="whitespace-pre-wrap">{antibioticVisitSummary(record)}</span></> : 'Sin ATB'}{record.patogenoAislado && <><br /><strong>Patógeno:</strong> {record.patogenoAislado}</>}</td>
        <td>{record.ultimoLaboratorio || '—'}</td>
        <td><strong>LET:</strong> {record.letIndicacion || 'NC'}<br /><strong>IOT:</strong> {record.iotIndicacion || 'NC'}<br /><strong>RCP:</strong> {record.rcpIndicacion || 'NC'}</td>
        <td>{record.planesPendientes || '—'}</td>
      </tr>)}
    </tbody></table>
  </>;
}

function ProaQuickModal({ bed, hasRecord, value, setValue, saving, onClose, onFull, onSave }) {
  const updateAtb = (index, key, nextValue) => setValue(old => ({ ...old, antibioticos: old.antibioticos.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: nextValue } : item) }));
  const updateCulture = (index, key, nextValue) => setValue(old => ({ ...old, cultivos: old.cultivos.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: nextValue } : item) }));
  return <div className="fixed inset-0 z-[86] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-2xl">
    <div className="mb-4 rounded-xl bg-emerald-100/80 p-3"><h2 className="text-lg font-black text-teal-950">PROA — Cama {bed?.cell}</h2><p className="text-xs text-emerald-800">Consulta y actualización rápida de aislamiento, antimicrobianos y cultivos.</p></div>
    {hasRecord ? <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
      <Field label="Aislamiento / precauciones"><input className={input} value={value.aislamiento} onChange={e => setValue(old => ({ ...old, aislamiento: e.target.value }))} placeholder="Contacto, gotitas, aéreo…" /></Field>
      <section><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">Antibioterapia actual</h3><Button type="button" size="sm" variant="outline" onClick={() => setValue(old => ({ ...old, antibioticos: [...old.antibioticos, { ...EMPTY_QUICK_ATB }] }))}><Plus className="mr-1 h-3.5 w-3.5" />Agregar ATB</Button></div>
        <div className="space-y-2">{value.antibioticos.map((atb, index) => <div key={index} className="grid gap-2 rounded-xl border bg-slate-50 p-3 sm:grid-cols-12">
          <div className="sm:col-span-3"><Field label="Antibiótico"><input className={input} value={atb.nombre || ''} onChange={e => updateAtb(index, 'nombre', e.target.value)} /></Field></div>
          <div className="sm:col-span-3"><Field label="Presentación"><input className={input} value={atb.presentacion || ''} onChange={e => updateAtb(index, 'presentacion', e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label="Dosis"><input className={input} value={atb.dosis_cantidad || atb.dosis || ''} onChange={e => { updateAtb(index, 'dosis_cantidad', e.target.value); updateAtb(index, 'dosis', ''); }} /></Field></div>
          <div className="sm:col-span-1"><Field label="Unidad"><select className={input} value={atb.dosis_unidad || 'mg'} onChange={e => updateAtb(index, 'dosis_unidad', e.target.value)}>{['mg','g','UI','MUI','comprimido','ampolla'].map(unit => <option key={unit}>{unit}</option>)}</select></Field></div>
          <div className="sm:col-span-1"><Field label="Cada h"><input className={input} value={atb.intervalo_horas || ''} onChange={e => updateAtb(index, 'intervalo_horas', e.target.value)} /></Field></div>
          <div className="sm:col-span-1"><Field label="Vía"><select className={input} value={atb.via || 'EV'} onChange={e => updateAtb(index, 'via', e.target.value)}>{['EV','VO','IM','SC'].map(via => <option key={via}>{via}</option>)}</select></Field></div>
          <div className="sm:col-span-2"><Field label="Inicio"><input type="date" className={input} value={atb.inicio || ''} onChange={e => updateAtb(index, 'inicio', e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label="Término"><input type="date" className={input} value={atb.termino || ''} onChange={e => updateAtb(index, 'termino', e.target.value)} /></Field></div>
          <div className="flex items-end sm:col-span-1"><Button type="button" variant="ghost" size="sm" onClick={() => setValue(old => ({ ...old, antibioticos: old.antibioticos.length === 1 ? [{ ...EMPTY_QUICK_ATB }] : old.antibioticos.filter((_, itemIndex) => itemIndex !== index) }))} className="text-red-600">Quitar</Button></div>
        </div>)}</div>
      </section>
      <section><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">Cultivos</h3><Button type="button" size="sm" variant="outline" onClick={() => setValue(old => ({ ...old, cultivos: [...old.cultivos, { fecha: '', tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }] }))}><Plus className="mr-1 h-3.5 w-3.5" />Agregar cultivo</Button></div>
        <div className="space-y-2">{value.cultivos.map((culture, index) => <div key={index} className="grid gap-2 rounded-xl border bg-slate-50 p-3 sm:grid-cols-[140px_1fr_1fr_150px_auto]"><input type="date" className={input} value={culture.fecha || ''} onChange={e => updateCulture(index, 'fecha', e.target.value)} /><input className={input} value={culture.tipo_muestra || ''} onChange={e => updateCulture(index, 'tipo_muestra', e.target.value)} placeholder="Muestra" /><input className={input} value={culture.patogeno || ''} onChange={e => updateCulture(index, 'patogeno', e.target.value)} placeholder="Patógeno" /><select className={input} value={culture.sensibilidad || 'Pendiente'} onChange={e => updateCulture(index, 'sensibilidad', e.target.value)}><option>Pendiente</option><option>Sensible</option><option>Resistente</option><option>Sin desarrollo</option></select><Button type="button" variant="ghost" size="sm" onClick={() => setValue(old => ({ ...old, cultivos: old.cultivos.length === 1 ? [{ fecha: '', tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }] : old.cultivos.filter((_, itemIndex) => itemIndex !== index) }))} className="text-red-600">Quitar</Button></div>)}</div>
      </section>
    </div> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Este paciente todavía no tiene registro PROA. Puedes abrir la evolución completa para crearlo.</div>}
    <div className="mt-5 flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onClose}>Cerrar</Button><Button variant="outline" onClick={onFull} className="border-teal-300 text-teal-800">Abrir evolución PROA completa</Button>{hasRecord && <Button onClick={onSave} disabled={saving} className="bg-teal-700 hover:bg-teal-800">{saving ? 'Guardando…' : 'Guardar actualización PROA'}</Button>}</div>
  </div></div>;
}

const ACTIONS = [
  { label: 'Nota de evolución', route: 'NotaEvolucion', icon: ClipboardList, color: 'text-slate-700 bg-slate-100' },
  { label: 'Evolución PROA', route: 'GestionPROA', proa: true, icon: ShieldCheck, color: 'text-teal-800 bg-teal-50' },
  { label: 'Solicitud de exámenes', route: 'SolicitudExamenes', icon: FlaskConical, color: 'text-blue-700 bg-blue-50' },
  { label: 'Microbiología', route: 'SolicitudMicrobiologia', icon: Microscope, color: 'text-cyan-700 bg-cyan-50' },
  { label: 'Fármaco restringido', route: 'SolicitudFarmacoRestringido', icon: Pill, color: 'text-amber-700 bg-amber-50' },
  { label: 'HODOM / consentimientos', route: 'FormulariosHODOM', icon: FileText, color: 'text-indigo-700 bg-indigo-50' },
  { label: 'Formulario / Constancia GES', route: 'FormularioGES', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50' },
  { label: 'IRA grave / ISP', route: 'FormularioIRAGrave', icon: Activity, color: 'text-rose-700 bg-rose-50' },
  { label: 'Solicitar protocolo de imágenes', route: 'Templates?image=1', icon: Image, color: 'text-violet-700 bg-violet-50' },
];

function VistaHospitalizados() {
  const navigate = useNavigate();
  const [registry, setRegistry] = useState(readRegistry);
  const [selectedCode, setSelectedCode] = useState(() => sessionStorage.getItem(SELECTED_BED_KEY) || '');
  const [draft, setDraft] = useState(() => {
    const savedCode = sessionStorage.getItem(SELECTED_BED_KEY) || '';
    return { ...EMPTY, ...(savedCode ? readRegistry()[savedCode] : {}) };
  });
  const [service, setService] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const [syncState, setSyncState] = useState('loading');
  const [printPreview, setPrintPreview] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [labOpen, setLabOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [generalDraft, setGeneralDraft] = useState(EMPTY);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [evolutionDraft, setEvolutionDraft] = useState('');
  const [studiesOpen, setStudiesOpen] = useState(false);
  const [studiesRows, setStudiesRows] = useState([]);
  const [proaOpen, setProaOpen] = useState(false);
  const [proaSaving, setProaSaving] = useState(false);
  const [proaQuick, setProaQuick] = useState({ aislamiento: '', antibioticos: [{ ...EMPTY_QUICK_ATB }], cultivos: [{ fecha: '', tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }] });
  const [labSaving, setLabSaving] = useState(false);
  const emptyLabRow = () => ({ fecha: new Date().toISOString().slice(0, 10), pcr: '', pct: '', blancos: '', crea: '', vhs: '', temp: '' });
  const [labRows, setLabRows] = useState(() => [emptyLabRow()]);

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

  const printRows = useMemo(() => visibleBeds.map(bed => ({ bed, record: registry[bed.code] || {} }))
    .filter(({ record }) => record.nombre || record.rut || record.fechaIngreso || record.diagnostico), [registry, visibleBeds]);

  const openBed = (bed) => {
    setSelectedCode(bed.code);
    sessionStorage.setItem(SELECTED_BED_KEY, bed.code);
    setDraft({ ...EMPTY, ...(registry[bed.code] || {}) });
    setHistoryOpen(false);
    setDetailsOpen(true);
    setSaved(false);
  };

  const update = (key, value) => { setDraft(old => ({ ...old, [key]: value })); setSaved(false); };
  const save = () => {
    const savedDraft = withHistorySnapshot({ ...draft, updatedAt: new Date().toISOString() });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft);
    setRegistry(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
  };
  const openGeneral = () => { setGeneralDraft({ ...draft }); setGeneralOpen(true); };
  const updateGeneral = (key, value) => setGeneralDraft(old => ({ ...old, [key]: value }));
  const saveGeneral = () => {
    const savedDraft = withHistorySnapshot({ ...generalDraft, updatedAt: new Date().toISOString() });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setGeneralOpen(false); setSaved(true);
  };
  const openLatestEvolution = () => { setEvolutionDraft(draft.ultimaEvolucion || ''); setEvolutionOpen(true); };
  const saveLatestEvolution = () => {
    const savedDraft = withHistorySnapshot({ ...draft, ultimaEvolucion: evolutionDraft, updatedAt: new Date().toISOString() });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setEvolutionOpen(false); setSaved(true);
  };

  const prefill = () => {
    const data = {
      patient_name: draft.nombre, patient_rut: draft.rut, patient_fecha_nac: draft.fechaNacimiento,
      patient_direccion: draft.direccion, patient_comuna: draft.comuna, patient_telefono: draft.telefono,
      prevision: draft.prevision, diagnostico: draft.diagnostico, n_ficha: draft.nFicha,
      aislamiento: draft.aislamiento, clinical_text: [draft.resumenCaso, draft.antecedentes].filter(Boolean).join('\n'),
      servicio: selectedBed?.serviceShort || '', cama: selectedBed?.cell || selectedBed?.code || '',
    };
    setMultiPrefill(data);
    return data;
  };

  const openAction = (route, isProa = false) => {
    save();
    prefill();
    if (isProa) {
      const proaBed = draft.proaBedCode || catalogToProaBed(selectedBed);
      navigate(`${createPageUrl('GestionPROA')}?bed=${encodeURIComponent(proaBed || selectedBed.code)}&action=evolve`);
      return;
    }
    const [page, search] = route.split('?');
    navigate(`${createPageUrl(page)}${search ? `?${search}` : ''}`);
  };

  const goToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const saveLab = async () => {
    if (!draft.proaRecordId) return;
    setLabSaving(true);
    try {
      const records = await fetchProaRecords();
      const record = records.find(item => item.id === draft.proaRecordId);
      const latest = getLatestProaForm(record) || {};
      const rows = labRows.filter(row => Object.entries(row).some(([key, value]) => key !== 'fecha' && value));
      const latestRow = rows.slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))[0] || rows[0];
      await saveProaRecord({
        ...latest, fecha: latestRow.fecha, hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'laboratorio_vista_general',
        parametros_inflamatorios: [...rows, ...(latest.parametros_inflamatorios || [])],
        creatinina: latestRow.crea || latest.creatinina || '', fecha_creatinina: latestRow.crea ? latestRow.fecha : latest.fecha_creatinina || '',
      });
      const summary = [latestRow.fecha, latestRow.pcr && `PCR ${latestRow.pcr}`, latestRow.pct && `PCT ${latestRow.pct}`, latestRow.blancos && `Leu ${latestRow.blancos}`, latestRow.crea && `Crea ${latestRow.crea}`, latestRow.vhs && `VHS ${latestRow.vhs}`].filter(Boolean).join(' · ');
      const nextDraft = { ...draft, ultimoLaboratorio: summary, updatedAt: new Date().toISOString() };
      const nextRegistry = { ...registry, [selectedCode]: nextDraft };
      setDraft(nextDraft);
      setRegistry(nextRegistry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry));
      setLabOpen(false);
      setLabRows([emptyLabRow()]);
    } finally { setLabSaving(false); }
  };
  const saveStats = async () => {
    const nextDraft = { ...draft, updatedAt: new Date().toISOString() };
    const nextRegistry = { ...registry, [selectedCode]: nextDraft };
    setRegistry(nextRegistry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry));
    if (draft.proaRecordId) {
      const records = await fetchProaRecords();
      const record = records.find(item => item.id === draft.proaRecordId);
      const latest = getLatestProaForm(record) || {};
      await saveProaRecord({ ...latest, paciente: draft.nombre, rut: draft.rut, edad: draft.edad, sexo: draft.sexo, fecha_nacimiento: draft.fechaNacimiento, prevision: draft.prevision, fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'datos_vista_general' });
    }
    setStatsOpen(false);
    setSaved(true);
  };
  const openStudies = () => {
    setStudiesRows((draft.estudiosDetalle || []).length ? draft.estudiosDetalle : [{ fecha: '', tipo: 'Imagenología', estudio: draft.estudiosComplementarios || '', estado: 'Pendiente' }]);
    setStudiesOpen(true);
  };
  const saveStudies = async () => {
    const rows = studiesRows.filter(item => item.estudio || item.fecha);
    const summary = rows.map(item => [item.tipo, item.fecha, item.estudio, item.estado].filter(Boolean).join(' · ')).join('\n');
    const nextDraft = { ...draft, estudiosDetalle: rows, estudiosComplementarios: summary, updatedAt: new Date().toISOString() };
    const nextRegistry = { ...registry, [selectedCode]: nextDraft };
    setDraft(nextDraft); setRegistry(nextRegistry); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry));
    if (draft.proaRecordId) {
      const records = await fetchProaRecords();
      const latest = getLatestProaForm(records.find(item => item.id === draft.proaRecordId)) || {};
      const byType = type => rows.filter(item => item.tipo === type).map(item => [item.fecha, item.estudio, item.estado].filter(Boolean).join(' · ')).join('\n');
      await saveProaRecord({ ...latest, estudios_imagen: byType('Imagenología'), estudios_funcionales: byType('Estudio funcional'), estudios_anatomopatologicos: byType('Anatomía patológica'), estudios_otros: byType('Otro'), fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'estudios_vista_general' });
    }
    setStudiesOpen(false); setSaved(true);
  };
  const openProaPopup = async () => {
    let latest = {};
    if (draft.proaRecordId) {
      const records = await fetchProaRecords();
      latest = getLatestProaForm(records.find(item => item.id === draft.proaRecordId)) || {};
    }
    const storedAntibiotics = (latest.antibioticos || []).filter(item => item?.nombre);
    setProaQuick({
      aislamiento: latest.aislamiento || draft.aislamiento || '',
      antibioticos: storedAntibiotics.length ? storedAntibiotics : [{ ...EMPTY_QUICK_ATB, nombre: antibioticSummary(latest) || draft.antibioterapia || '' }],
      cultivos: (latest.estudios_micro || []).length ? latest.estudios_micro : [{ fecha: '', tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }],
    });
    setProaOpen(true);
  };
  const saveProaQuick = async () => {
    if (!draft.proaRecordId) return;
    setProaSaving(true);
    try {
      const records = await fetchProaRecords();
      const record = records.find(item => item.id === draft.proaRecordId);
      const latest = getLatestProaForm(record) || {};
      const cultures = proaQuick.cultivos.filter(item => item.fecha || item.tipo_muestra || item.patogeno);
      const antibiotics = proaQuick.antibioticos.filter(item => item.nombre);
      const antibioticText = structuredAntibioticSummary(antibiotics);
      await saveProaRecord({
        ...latest, aislamiento: proaQuick.aislamiento, antibioticos: antibiotics, antibioterapia_preingreso: antibioticText,
        estudios_micro: cultures, diagnostico_microbiologico: cultures.map(item => item.patogeno).filter(Boolean).join(', '),
        fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'actualizacion_vista_general',
      });
      const pathogen = cultures.map(item => item.patogeno).filter(Boolean).join(', ');
      const nextDraft = { ...draft, aislamiento: proaQuick.aislamiento, antibioterapia: antibioticText, antibioticos: antibiotics, patogenoAislado: pathogen, updatedAt: new Date().toISOString() };
      const nextRegistry = { ...registry, [selectedCode]: nextDraft };
      setDraft(nextDraft); setRegistry(nextRegistry); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry));
      setProaOpen(false); setSaved(true);
    } finally { setProaSaving(false); }
  };

  return <div className="min-h-screen bg-slate-100">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-black text-slate-950">Vista general</h1><p className="text-xs text-slate-500">{syncState === 'loading' ? 'Sincronizando pacientes desde PROA…' : syncState === 'offline' ? 'Mostrando última información disponible' : 'Camas, situación clínica y documentos del paciente'}</p></div>
        <Button variant="outline" size="sm" onClick={() => setPrintPreview(true)} className="gap-2"><Printer className="h-4 w-4" /><span className="hidden sm:inline">Tabla de visita</span></Button>
        <div className="hidden items-center gap-2 sm:flex"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{totals.occupied} ocupadas</span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{totals.free} libres</span></div>
      </div>
    </header>

    <main className="mx-auto grid max-w-[1500px] gap-4 p-4 pb-32 xl:grid-cols-[minmax(480px,0.9fr)_minmax(560px,1.1fr)]">
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

      <aside className="min-w-0 pb-20 xl:sticky xl:top-20 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
        {!selectedBed ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><BedDouble className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-4 font-bold text-slate-800">Selecciona una cama</h2><p className="mt-1 text-sm text-slate-500">Podrás registrar al paciente y generar todos sus documentos desde una sola ficha.</p></div> : <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex flex-wrap items-start justify-between gap-3 ${detailsOpen ? 'mb-4' : ''}`}><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">{selectedBed.serviceShort} · {selectedBed.salaLabel}</p><h2 className="text-2xl font-black text-slate-950">Cama {selectedBed.cell}</h2>{draft.nombre && <p className="font-bold text-slate-800">{draft.nombre} {draft.rut && <span className="font-normal text-slate-500">· {draft.rut}</span>}</p>}{occupied && <p className="text-xs font-semibold text-emerald-700">Ingreso {draft.fechaIngreso || 'sin fecha'} · Día {hospitalDays(draft.fechaIngreso)}</p>}</div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setDetailsOpen(open => !open)} className="gap-2">{detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{detailsOpen ? 'Ocultar ficha' : 'Ver ficha'}</Button><Button onClick={openGeneral} className="gap-2 bg-teal-700 hover:bg-teal-800"><Save className="h-4 w-4" />Editar ficha general</Button></div></div>
            {detailsOpen && <>
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>Información clínica protegida por código de acceso. Los datos se reutilizan únicamente al abrir documentos desde esta ficha.</p></div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={openGeneral} className="border-sky-300 bg-sky-50 text-sky-800 shadow-[0_0_0_3px_rgba(125,211,252,0.18)] hover:bg-sky-100"><ClipboardList className="mr-1 h-3.5 w-3.5" />Resumen actual</Button>
              <Button type="button" size="sm" variant="outline" onClick={openGeneral} className="border-amber-300 bg-amber-50 text-amber-800 shadow-[0_0_0_3px_rgba(252,211,77,0.18)] hover:bg-amber-100"><FileText className="mr-1 h-3.5 w-3.5" />Planes</Button>
              <Button type="button" size="sm" variant="outline" onClick={openStudies} className="border-cyan-300 bg-cyan-50 text-cyan-800 shadow-[0_0_0_3px_rgba(103,232,249,0.18)] hover:bg-cyan-100"><Image className="mr-1 h-3.5 w-3.5" />Estudios</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setLabOpen(true)} className="border-blue-300 bg-blue-50 text-blue-700 shadow-[0_0_0_3px_rgba(147,197,253,0.2)] hover:bg-blue-100"><FlaskConical className="mr-1 h-3.5 w-3.5" />Laboratorio</Button>
              <Button type="button" size="sm" variant="outline" onClick={openProaPopup} className="border-teal-400 bg-teal-50 font-bold text-teal-800 shadow-[0_0_0_3px_rgba(45,212,191,0.2)] hover:bg-teal-100"><ShieldCheck className="mr-1 h-3.5 w-3.5" />PROA</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setStatsOpen(true)} className="border-violet-300 bg-violet-50 text-violet-700 shadow-[0_0_0_3px_rgba(196,181,253,0.2)] hover:bg-violet-100"><Activity className="mr-1 h-3.5 w-3.5" />Datos / estadísticas</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => goToSection('hospital-documentos')} className="border-indigo-300 bg-indigo-50 text-indigo-700 shadow-[0_0_0_3px_rgba(165,180,252,0.2)] hover:bg-indigo-100"><FileText className="mr-1 h-3.5 w-3.5" />Documentos y solicitudes</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre completo" wide><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.nombre} readOnly /></Field>
              <Field label="RUT"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.rut} readOnly /></Field>
              <Field label="Dirección"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.direccion} readOnly /></Field>
              <Field label="Comuna"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.comuna} readOnly /></Field>
              <Field label="Fecha de ingreso"><input type="date" className={`${input} cursor-not-allowed bg-slate-50`} value={draft.fechaIngreso} readOnly /></Field>
              <Field label="Diagnóstico(s)" wide><textarea className={`${textarea} cursor-not-allowed bg-slate-50`} value={draft.diagnostico} readOnly /></Field>
              <Field label="Antecedentes relevantes" wide><textarea className={`${textarea} cursor-not-allowed bg-slate-50`} value={draft.antecedentes} readOnly /></Field>
              <div className="sm:col-span-2 rounded-xl border border-teal-200 bg-teal-50/60 p-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-black text-teal-950">Información PROA</p><p className="text-xs text-teal-700">Antibioterapia, aislamiento, precauciones y cultivos se editan exclusivamente desde PROA.</p></div><Button type="button" size="sm" variant="outline" onClick={openProaPopup} className="border-teal-400 bg-white font-bold text-teal-800"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Editar en PROA</Button></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Antibioterapia" wide><textarea className={`${textarea} cursor-not-allowed bg-white/70 text-slate-600`} value={draft.antibioterapia} readOnly aria-readonly="true" placeholder="Sin antibioterapia registrada en PROA" /></Field><Field label="Aislamiento / precauciones"><input className={`${input} cursor-not-allowed bg-white/70 text-slate-600`} value={draft.aislamiento} readOnly aria-readonly="true" placeholder="Sin indicación registrada" /></Field><Field label="Patógeno / cultivos"><input className={`${input} cursor-not-allowed bg-white/70 text-slate-600`} value={draft.patogenoAislado} readOnly aria-readonly="true" placeholder="Sin aislamiento registrado" /></Field></div></div>
              <Field label="Observaciones"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.observaciones} readOnly /></Field>
              <div id="hospital-resumen" className="sm:col-span-2"><Field label="Resumen breve del caso" wide><textarea className={`${textarea} cursor-not-allowed bg-slate-50`} value={draft.resumenCaso} readOnly placeholder="Sin resumen registrado" /></Field></div>
              <div className="sm:col-span-2 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-cyan-900">Última evolución</p><p className="mt-1 whitespace-pre-line text-sm text-slate-700">{draft.ultimaEvolucion || 'Sin evolución breve registrada'}</p></div><Button type="button" size="sm" variant="outline" onClick={openLatestEvolution} className="shrink-0 border-cyan-300 bg-white text-cyan-800">Editar</Button></div></div>
              <div id="hospital-planes" className="sm:col-span-2"><Field label="Planes pendientes" wide><textarea className={`${textarea} cursor-not-allowed bg-slate-50`} value={draft.planesPendientes} readOnly placeholder="Sin planes registrados" /></Field></div>
              <div id="hospital-estudios" className="sm:col-span-2"><div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-700">Estudios complementarios</p><p className="mt-1 whitespace-pre-line text-xs text-slate-600">{draft.estudiosComplementarios || 'Sin estudios registrados'}</p></div><Button type="button" size="sm" variant="outline" onClick={openStudies} className="shrink-0">Agregar / ver</Button></div></div></div>
              <Field label="Último laboratorio"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.ultimoLaboratorio} readOnly placeholder="Sin laboratorio registrado" /></Field>
              <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3"><p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-900">Decisiones y adecuación del esfuerzo terapéutico</p><div className="grid grid-cols-3 gap-2"><Field label="LET"><input className={`${input} cursor-not-allowed bg-white/70`} value={draft.letIndicacion || 'No consignado'} readOnly /></Field><Field label="IOT"><input className={`${input} cursor-not-allowed bg-white/70`} value={draft.iotIndicacion || 'No consignado'} readOnly /></Field><Field label="RCP"><input className={`${input} cursor-not-allowed bg-white/70`} value={draft.rcpIndicacion || 'No consignado'} readOnly /></Field></div></div>
            </div>
            <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-black text-teal-950">Historial de actualizaciones</h3><p className="text-xs text-teal-700">Fotografías fechadas de la situación clínica guardada.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setHistoryOpen(open => !open)} className="border-teal-300 bg-white text-teal-800 hover:bg-teal-50">{historyOpen ? 'Ocultar histórico' : `Ver histórico (${(draft.historialActualizaciones || []).length})`}</Button></div>
              {historyOpen && <div className="mt-3">{(draft.historialActualizaciones || []).length > 0 ? <div className="space-y-2">{draft.historialActualizaciones.map((item, index) => <details key={`${item.guardadoEn || item.fecha}-${index}`} className="rounded-lg border border-teal-100 bg-white px-3 py-2" open={index === 0}><summary className="cursor-pointer text-xs font-bold text-teal-800">{item.fecha || 'Sin fecha'}{item.guardadoEn ? ` · ${new Date(item.guardadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : ''} — {item.resumenCaso || item.diagnostico || 'Actualización clínica'}</summary><div className="mt-2 grid gap-1 text-xs text-slate-700"><p><strong>Resumen:</strong> {item.resumenCaso || '—'}</p><p><strong>Planes:</strong> {item.planesPendientes || '—'}</p><p><strong>Estudios:</strong> {item.estudiosComplementarios || '—'}</p><p><strong>ATB:</strong> {item.antibioterapia || 'No registrada'}</p><p><strong>Patógeno:</strong> {item.patogenoAislado || '—'}</p><p><strong>Último lab.:</strong> {item.ultimoLaboratorio || '—'}</p><p><strong>LET / IOT / RCP:</strong> {item.letIndicacion || 'NC'} / {item.iotIndicacion || 'NC'} / {item.rcpIndicacion || 'NC'}</p></div></details>)}</div> : <p className="rounded-lg border border-dashed border-teal-200 bg-white/70 px-3 py-4 text-center text-xs text-slate-500">Todavía no hay actualizaciones guardadas.</p>}</div>}
            </div>
            </>}
          </section>

          <section id="hospital-documentos" className="scroll-mt-24 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-teal-700" /><div><h3 className="font-black text-slate-900">Documentos y solicitudes</h3><p className="text-xs text-slate-500">La ficha se guarda y los datos compatibles se cargan automáticamente.</p></div></div>
            <div className="grid gap-2 sm:grid-cols-2">{ACTIONS.map(action => { const Icon = action.icon; return <button key={action.label} onClick={() => openAction(action.route, action.proa)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-teal-300 hover:shadow-sm"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${action.color}`}><Icon className="h-4 w-4" /></span><span className="text-sm font-semibold text-slate-800">{action.label}</span></button>; })}</div>
          </section>
        </div>}
      </aside>
    </main>
    {evolutionOpen && <div className="fixed inset-0 z-[87] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-5 shadow-2xl"><div className="mb-4 rounded-xl bg-cyan-100/80 p-3"><h2 className="text-lg font-black text-cyan-950">Última evolución — Cama {selectedBed?.cell}</h2><p className="text-xs text-cyan-700">Solo esta síntesis breve aparecerá en la columna “Última evolución” de la tabla de visita.</p></div><Field label="Síntesis de la última evolución"><textarea className={textarea} value={evolutionDraft} onChange={e => setEvolutionDraft(e.target.value)} placeholder="Ej.: Afebril, hemodinámicamente estable, con menor requerimiento de oxígeno." /></Field><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setEvolutionOpen(false)}>Cancelar</Button><Button onClick={saveLatestEvolution} className="bg-cyan-700 hover:bg-cyan-800">Guardar evolución breve</Button></div></div></div>}
    {generalOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 shadow-2xl"><div className="border-b border-teal-200 bg-teal-100/80 px-5 py-4"><h2 className="text-lg font-black text-teal-950">Ficha general — Cama {selectedBed?.cell}</h2><p className="text-xs text-teal-700">Al guardar se crea un registro fechado con toda la información vigente del paciente.</p></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre completo" wide><input className={input} value={generalDraft.nombre} onChange={e => updateGeneral('nombre', e.target.value)} /></Field><Field label="RUT"><input className={input} value={generalDraft.rut} onChange={e => updateGeneral('rut', formatRut(e.target.value))} placeholder="12.345.678-9" /></Field><Field label="Dirección"><input className={input} value={generalDraft.direccion} onChange={e => updateGeneral('direccion', e.target.value)} /></Field><Field label="Comuna"><input className={input} value={generalDraft.comuna} onChange={e => updateGeneral('comuna', e.target.value)} /></Field><Field label="Fecha de ingreso"><input type="date" className={input} value={generalDraft.fechaIngreso} onChange={e => updateGeneral('fechaIngreso', e.target.value)} /></Field><Field label="Diagnóstico(s)" wide><textarea className={textarea} value={generalDraft.diagnostico} onChange={e => updateGeneral('diagnostico', e.target.value)} /></Field><Field label="Antecedentes relevantes" wide><textarea className={textarea} value={generalDraft.antecedentes} onChange={e => updateGeneral('antecedentes', e.target.value)} /></Field><Field label="Resumen breve del caso" wide><textarea className={textarea} value={generalDraft.resumenCaso} onChange={e => updateGeneral('resumenCaso', e.target.value)} placeholder="Situación clínica actual en pocas líneas" /></Field><Field label="Observaciones" wide><input className={input} value={generalDraft.observaciones} onChange={e => updateGeneral('observaciones', e.target.value)} /></Field><div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-900">Decisiones terapéuticas</p><div className="grid grid-cols-3 gap-2">{[['letIndicacion','LET'],['iotIndicacion','IOT'],['rcpIndicacion','RCP']].map(([key, label]) => <Field key={key} label={label}><select className={input} value={generalDraft[key]} onChange={e => updateGeneral(key, e.target.value)}><option value="">No consignado</option><option value="Sí">Sí</option><option value="No">No</option></select></Field>)}</div></div><Field label="Planes pendientes" wide><textarea className={textarea} value={generalDraft.planesPendientes} onChange={e => updateGeneral('planesPendientes', e.target.value)} placeholder="Conductas o decisiones por completar" /></Field></div></div><div className="flex justify-end gap-2 border-t border-teal-200 bg-white/80 px-5 py-4"><Button variant="outline" onClick={() => setGeneralOpen(false)}>Cancelar</Button><Button onClick={saveGeneral} className="bg-teal-700 hover:bg-teal-800"><Save className="mr-1 h-4 w-4" />Guardar actualización general</Button></div></div></div>}
    {proaOpen && <ProaQuickModal bed={selectedBed} hasRecord={Boolean(draft.proaRecordId)} value={proaQuick} setValue={setProaQuick} saving={proaSaving} onClose={() => setProaOpen(false)} onFull={() => { setProaOpen(false); openAction("GestionPROA", true); }} onSave={saveProaQuick} />}
    {studiesOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-5 shadow-2xl"><div className="mb-4 rounded-xl bg-teal-100/80 p-3"><h2 className="text-lg font-black text-teal-950">Estudios complementarios — Cama {selectedBed?.cell}</h2><p className="text-xs text-teal-700">Registra varias fechas y clasifica cada estudio para mantener un resumen clínico breve.</p></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">{studiesRows.map((row, index) => <div key={index} className="rounded-xl border border-teal-100 bg-white/80 p-3"><div className="mb-2 flex items-center justify-between"><strong className="text-xs text-slate-700">Estudio {index + 1}</strong>{studiesRows.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setStudiesRows(rows => rows.filter((_, rowIndex) => rowIndex !== index))} className="text-red-600">Quitar</Button>}</div><div className="grid gap-3 sm:grid-cols-[150px_190px_1fr_150px]"><Field label="Fecha"><input type="date" className={input} value={row.fecha} onChange={e => setStudiesRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, fecha: e.target.value } : item))} /></Field><Field label="Tipo"><select className={input} value={row.tipo} onChange={e => setStudiesRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, tipo: e.target.value } : item))}><option>Imagenología</option><option>Estudio funcional</option><option>Anatomía patológica</option><option>Otro</option></select></Field><Field label="Estudio / resultado"><input className={input} value={row.estudio} onChange={e => setStudiesRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, estudio: e.target.value } : item))} placeholder="Ej.: TAC tórax solicitado" /></Field><Field label="Estado"><select className={input} value={row.estado} onChange={e => setStudiesRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, estado: e.target.value } : item))}><option>Pendiente</option><option>Solicitado</option><option>Informado</option><option>Suspendido</option></select></Field></div></div>)}<Button type="button" variant="outline" onClick={() => setStudiesRows(rows => [...rows, { fecha: '', tipo: 'Imagenología', estudio: '', estado: 'Pendiente' }])} className="w-full border-dashed border-teal-300 bg-white/70 text-teal-700"><Plus className="mr-1 h-4 w-4" />Agregar otro estudio / fecha</Button></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setStudiesOpen(false)}>Cancelar</Button><Button onClick={saveStudies} disabled={!studiesRows.some(row => row.estudio || row.fecha)} className="bg-teal-700 hover:bg-teal-800">Guardar estudios</Button></div></div></div>}
    {statsOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-4"><h2 className="text-lg font-black text-slate-900">Datos del paciente</h2><p className="text-xs text-slate-500">Identificación y variables estadísticas que no se muestran permanentemente en la ficha.</p></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre completo" wide><input className={input} value={draft.nombre} onChange={e => update('nombre', e.target.value)} /></Field><Field label="RUT"><input className={input} value={draft.rut} onChange={e => update('rut', formatRut(e.target.value))} placeholder="12.345.678-9" /></Field><Field label="Fecha de nacimiento"><input type="date" className={input} value={draft.fechaNacimiento} onChange={e => update('fechaNacimiento', e.target.value)} /></Field><Field label="Edad"><input type="number" min="0" max="130" className={input} value={draft.edad} onChange={e => update('edad', e.target.value)} /></Field><Field label="Sexo clínico"><select className={input} value={draft.sexo} onChange={e => update('sexo', e.target.value)}><option value="">No consignado</option><option value="F">Femenino</option><option value="M">Masculino</option><option value="Otro">Otro</option></select></Field><Field label="Previsión"><input className={input} value={draft.prevision} onChange={e => update('prevision', e.target.value)} placeholder="Fonasa A, B, C, D…" /></Field></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setStatsOpen(false)}>Cancelar</Button><Button onClick={saveStats} className="bg-violet-700 hover:bg-violet-800">Guardar datos</Button></div></div></div>}
    {labOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-4"><h2 className="text-lg font-black text-slate-900">Agregar laboratorio — Cama {selectedBed?.cell}</h2><p className="text-xs text-slate-500">Puedes ingresar varias fechas; se incorporarán a Visita PROA y Curva de exámenes.</p></div>{draft.proaRecordId ? <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">{labRows.map((row, index) => <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-2 flex items-center justify-between"><strong className="text-xs text-slate-700">Control {index + 1}</strong>{labRows.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setLabRows(rows => rows.filter((_, rowIndex) => rowIndex !== index))} className="text-red-600">Quitar</Button>}</div><div className="grid gap-3 sm:grid-cols-4"><Field label="Fecha"><input type="date" className={input} value={row.fecha} onChange={e => setLabRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, fecha: e.target.value } : item))} /></Field>{[['pcr','PCR'],['pct','PCT'],['blancos','Leucocitos'],['crea','Creatinina'],['vhs','VHS'],['temp','Temperatura']].map(([key, label]) => <Field key={key} label={label}><input className={input} value={row[key]} onChange={e => setLabRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, [key]: e.target.value } : item))} /></Field>)}</div></div>)}<Button type="button" variant="outline" onClick={() => setLabRows(rows => [...rows, emptyLabRow()])} className="w-full border-dashed border-blue-300 text-blue-700"><Plus className="mr-1 h-4 w-4" />Agregar otra fecha</Button></div> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Este paciente aún no tiene registro PROA asociado. Créalo primero desde “Evolución PROA”.</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setLabOpen(false)}>Cancelar</Button><Button onClick={saveLab} disabled={!draft.proaRecordId || labSaving || !labRows.some(row => Object.entries(row).some(([key, value]) => key !== 'fecha' && value))} className="bg-blue-700 hover:bg-blue-800">{labSaving ? 'Guardando…' : `Guardar ${labRows.filter(row => Object.entries(row).some(([key, value]) => key !== 'fecha' && value)).length} control(es)`}</Button></div></div></div>}
    {printPreview && <div className="hospital-preview-overlay" role="dialog" aria-modal="true" aria-label="Vista previa de tabla de visita">
      <div className="hospital-preview-dialog">
        <div className="hospital-preview-toolbar"><div><h2>Vista previa — Tabla de visita</h2><p>A4 horizontal · se respetan los filtros activos</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setPrintPreview(false)}>Cerrar</Button><Button onClick={() => window.print()} className="gap-2 bg-teal-700 hover:bg-teal-800"><Printer className="h-4 w-4" />Imprimir</Button></div></div>
        <div className="hospital-preview-canvas"><div className="hospital-preview-page"><VisitTable rows={printRows} service={service} /></div></div>
      </div>
    </div>}
    <section className="hospital-print-sheet">
      <VisitTable rows={printRows} service={service} />
    </section>
    <style>{`
      .hospital-print-sheet{display:none}
      .hospital-preview-overlay{position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.72);padding:18px;backdrop-filter:blur(4px)}
      .hospital-preview-dialog{display:flex;height:100%;flex-direction:column;overflow:hidden;border-radius:16px;background:#fff;box-shadow:0 24px 80px rgba(15,23,42,.35)}
      .hospital-preview-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e2e8f0;padding:14px 18px}.hospital-preview-toolbar h2{font-size:16px;font-weight:800;color:#0f172a}.hospital-preview-toolbar p{font-size:11px;color:#64748b}
      .hospital-preview-canvas{flex:1;overflow:auto;background:#cbd5e1;padding:22px}.hospital-preview-page{box-sizing:border-box;width:1120px;min-height:792px;margin:0 auto;background:#fff;padding:28px;box-shadow:0 5px 24px rgba(15,23,42,.25);color:#000;font-family:Arial,sans-serif}
      .hospital-preview-page .hospital-print-header{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:6px;margin-bottom:10px}.hospital-preview-page .hospital-print-header h1{font-size:18px;font-weight:800}.hospital-preview-page .hospital-print-header p{font-size:10px;margin-top:2px}.hospital-preview-page table{width:100%;height:auto!important;border-collapse:collapse;table-layout:fixed;font-size:9px;line-height:1.2}.hospital-preview-page thead,.hospital-preview-page thead tr,.hospital-preview-page th{height:auto!important;min-height:0!important}.hospital-preview-page th,.hospital-preview-page td{border:1px solid #64748b;padding:4px;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}.hospital-preview-page th{background:#e2e8f0;font-size:7.5px;line-height:1.1;text-transform:uppercase;text-align:left}.hospital-preview-page th:nth-child(1){width:10%}.hospital-preview-page th:nth-child(2){width:11%}.hospital-preview-page th:nth-child(3){width:15%}.hospital-preview-page th:nth-child(4){width:15%}.hospital-preview-page th:nth-child(5){width:8%}.hospital-preview-page th:nth-child(6){width:12%}.hospital-preview-page th:nth-child(7){width:7%}.hospital-preview-page th:nth-child(8){width:6%}.hospital-preview-page th:nth-child(9){width:16%}
      @media print{
        @page{size:A4 landscape;margin:7mm}
        html,body,#root{background:#fff!important}
        body *{visibility:hidden!important}
        .hospital-print-sheet,.hospital-print-sheet *{visibility:visible!important}
        .hospital-print-sheet{display:block!important;position:absolute;inset:0;width:100%;color:#000;font-family:Arial,sans-serif}
        .hospital-print-header{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:4px;margin-bottom:7px}
        .hospital-print-header h1{font-size:14px;font-weight:800;margin:0}.hospital-print-header p{font-size:8px;margin:2px 0 0}
        .hospital-print-sheet table{width:100%;height:auto!important;border-collapse:collapse;table-layout:fixed;font-size:7px;line-height:1.18}
        .hospital-print-sheet thead,.hospital-print-sheet thead tr,.hospital-print-sheet th{height:auto!important;min-height:0!important}
        .hospital-print-sheet th,.hospital-print-sheet td{border:1px solid #64748b;padding:3px;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}
        .hospital-print-sheet th{background:#e2e8f0;font-size:6.5px;line-height:1.05;text-transform:uppercase;text-align:left}
        .hospital-print-sheet th:nth-child(1){width:10%}.hospital-print-sheet th:nth-child(2){width:11%}.hospital-print-sheet th:nth-child(3){width:15%}.hospital-print-sheet th:nth-child(4){width:15%}.hospital-print-sheet th:nth-child(5){width:8%}.hospital-print-sheet th:nth-child(6){width:12%}.hospital-print-sheet th:nth-child(7){width:7%}.hospital-print-sheet th:nth-child(8){width:6%}.hospital-print-sheet th:nth-child(9){width:16%}
        .hospital-print-sheet tr{break-inside:avoid}
      }
    `}</style>
  </div>;
}

export default conPuertaAcceso(VistaHospitalizados, {
  storageKey: 'acceso_vista_hospitalizados',
  titulo: 'Vista general',
  descripcion: 'Ingresa el código BULNESMEDICO para acceder a camas y fichas de pacientes hospitalizados.',
});
