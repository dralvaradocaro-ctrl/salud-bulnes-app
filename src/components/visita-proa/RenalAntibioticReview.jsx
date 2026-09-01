import { useMemo, useState } from 'react';
import { AlertTriangle, BedDouble, CheckCircle2, Droplets, ExternalLink, Plus, Search, Trash2, UserRound, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateEgfrCkdEpi2021 } from '@/lib/renalFunction';
import { getLatestProaForm } from '@/lib/proaRegistry';
import { calculateCockcroftGault, renalDoseRecommendation, RENAL_ANTIMICROBIALS, RENAL_DOSING_SOURCES } from '@/lib/renalAntimicrobialDosing';

const emptyPatient = { patientKey: '', nombre: '', edad: '', sexo: '', peso: '', talla: '', creatinina: '', fechaCreatinina: '', dialysis: false, aki: false };
const numberValue = value => Number(String(value ?? '').replace(',', '.'));
const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').trim();
const latestCreatinine = form => {
  const candidates = [
    ...(form.parametros_inflamatorios || []).map(item => ({ fecha: item.fecha, valor: item.crea || item.creatinina })),
    ...(form.examenes_sangre || []).map(item => ({ fecha: item.fecha, valor: item.crea || item.creatinina })),
    ...(form.creatininas || []).map(item => ({ fecha: item.fecha, valor: item.valor })),
    { fecha: form.fecha_creatinina || form.fecha, valor: form.creatinina },
  ].filter(item => numberValue(item.valor) > 0).sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  return candidates[0] || null;
};
const isCurrentAntibiotic = item => item?.nombre && !item?.termino && !/suspend|terminad|finaliz/i.test(`${item.estado || ''} ${item.status || ''}`);

export default function RenalAntibioticReview({ open, onClose, records = [] }) {
  const [patient, setPatient] = useState(emptyPatient);
  const [antibiotics, setAntibiotics] = useState(['']);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('Todos');
  const patientOptions = useMemo(() => records.map(record => {
    const form = getLatestProaForm(record) || {};
    const name = form.paciente || 'Sin nombre';
    const rut = form.rut || '';
    const service = form.servicio || '';
    const bed = form.cama || record.bedCode || '';
    return {
      record,
      form,
      key: record.id || record.bedCode,
      name,
      rut,
      service,
      bed,
      searchText: normalizeSearch([name, rut, service, bed].join(' ')),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es')), [records]);
  const patientServices = useMemo(() => ['Todos', ...new Set(patientOptions.map(item => item.service).filter(Boolean))], [patientOptions]);
  const filteredPatients = useMemo(() => {
    const query = normalizeSearch(patientSearch);
    return patientOptions
      .filter(item => serviceFilter === 'Todos' || item.service === serviceFilter)
      .filter(item => !query || item.searchText.includes(query))
      .slice(0, 8);
  }, [patientOptions, patientSearch, serviceFilter]);
  const selectedPatientOption = patientOptions.find(item => String(item.key) === String(patient.patientKey));
  if (!open) return null;

  const selectPatient = key => {
    if (!key) { setPatient(emptyPatient); setAntibiotics(['']); setPatientSearch(''); setPatientPickerOpen(false); return; }
    const selected = patientOptions.find(item => String(item.key) === String(key));
    if (!selected) return;
    const { form } = selected;
    const creatinine = latestCreatinine(form);
    setPatient({ patientKey: key, nombre: form.paciente || '', edad: form.edad || '', sexo: form.sexo || '', peso: form.peso || '', talla: form.talla || '', creatinina: creatinine?.valor || '', fechaCreatinina: creatinine?.fecha || '', dialysis: false, aki: false });
    setPatientSearch(selected.name);
    setPatientPickerOpen(false);
    const current = (form.antibioticos || []).filter(isCurrentAntibiotic).map(item => item.nombre);
    setAntibiotics(current.length ? current : ['']);
  };
  const updatePatient = (key, value) => setPatient(current => ({ ...current, [key]: value }));
  const egfr = calculateEgfrCkdEpi2021({ creatinina: patient.creatinina, edad: patient.edad, sexo: patient.sexo });
  const crcl = calculateCockcroftGault({ creatinine: patient.creatinina, age: patient.edad, sex: patient.sexo, weight: patient.peso });
  const renalValue = crcl || egfr;
  const nearThreshold = renalValue && [10, 15, 20, 30, 40, 50, 60].some(value => Math.abs(renalValue - value) <= 3);
  const results = antibiotics.filter(Boolean).map(name => ({ name, ...renalDoseRecommendation(name, renalValue) }));
  const statusStyle = status => status.startsWith('Sin ajuste') ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : status.startsWith('Evitar') ? 'border-red-200 bg-red-50 text-red-900' : status.startsWith('Individualizar') ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-orange-200 bg-orange-50 text-orange-950';

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label="Antibióticos y función renal">
    <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-4 sm:px-6"><div><div className="flex items-center gap-2"><Droplets className="h-6 w-6 text-teal-700" /><h2 className="text-xl font-black text-teal-950">Antibióticos y función renal</h2></div><p className="mt-1 text-sm text-teal-800">Revisión orientativa de dosis en adultos sin reemplazo renal, basada en función renal y antimicrobianos seleccionados.</p></div><Button type="button" variant="outline" size="sm" onClick={onClose}>Cerrar</Button></header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-950">Datos para el cálculo</h3>
              <p className="text-xs text-slate-500">Busque un paciente por nombre, RUT, cama o servicio, o ingrese datos manuales.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={patient.patientKey ? 'outline' : 'default'}
              className={patient.patientKey ? '' : 'bg-slate-800 hover:bg-slate-900'}
              onClick={() => selectPatient('')}
            >
              <UserRound className="mr-1.5 h-4 w-4" />
              Modo libre
            </Button>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,1.8fr)_repeat(4,minmax(120px,1fr))]">
            <div className="space-y-2">
              <Label htmlFor="renal-patient-search">Paciente hospitalizado</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="renal-patient-search"
                  className="bg-white pl-9 pr-9"
                  value={patientSearch}
                  placeholder="Nombre, RUT, cama o servicio..."
                  autoComplete="off"
                  onFocus={() => setPatientPickerOpen(true)}
                  onChange={event => {
                    setPatientSearch(event.target.value);
                    setPatientPickerOpen(true);
                  }}
                />
                {patientSearch && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Limpiar búsqueda"
                    onClick={() => {
                      setPatientSearch('');
                      setPatientPickerOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              {selectedPatientOption && !patientPickerOpen && (
                <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-950">
                  <BedDouble className="h-4 w-4 shrink-0 text-teal-700" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{selectedPatientOption.name}</p>
                    <p className="truncate text-teal-700">
                      {[selectedPatientOption.rut, selectedPatientOption.service, selectedPatientOption.bed].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="font-bold text-teal-700 hover:underline"
                    onClick={() => {
                      setPatientSearch('');
                      setPatientPickerOpen(true);
                    }}
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {patientPickerOpen && (
                <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                    {patientServices.map(service => (
                      <button
                        key={service}
                        type="button"
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${serviceFilter === service ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        onClick={() => setServiceFilter(service)}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {filteredPatients.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
                        onClick={() => selectPatient(item.key)}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700"><UserRound className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-slate-900">{item.name}</span>
                          <span className="block truncate text-xs text-slate-500">{[item.rut, item.service, item.bed].filter(Boolean).join(' · ') || 'Sin ubicación registrada'}</span>
                        </span>
                      </button>
                    ))}
                    {!filteredPatients.length && <p className="px-3 py-5 text-center text-sm text-slate-500">No hay pacientes que coincidan con la búsqueda.</p>}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-2 pt-2 text-[11px] text-slate-500">
                    <span>{Math.min(filteredPatients.length, 8)} resultados visibles</span>
                    <button type="button" className="font-bold text-teal-700 hover:underline" onClick={() => setPatientPickerOpen(false)}>Cerrar</button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5"><Label>Edad</Label><Input type="number" min="18" value={patient.edad} onChange={event => updatePatient('edad', event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Sexo</Label><select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={patient.sexo} onChange={event => updatePatient('sexo', event.target.value)}><option value="">Seleccionar</option><option value="femenino">Femenino</option><option value="masculino">Masculino</option></select></div>
            <div className="space-y-1.5"><Label>Peso actual (kg)</Label><Input type="number" min="1" step="0.1" value={patient.peso} onChange={event => updatePatient('peso', event.target.value)} placeholder="Para Cockcroft–Gault" /></div>
            <div className="space-y-1.5"><Label>Creatinina (mg/dL)</Label><Input type="number" min="0.1" step="0.01" value={patient.creatinina} onChange={event => updatePatient('creatinina', event.target.value)} /></div>
          </div>
          {patient.fechaCreatinina && <p className="mt-2 text-xs text-slate-500">Creatinina precargada del {patient.fechaCreatinina}.</p>}
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={patient.aki} onChange={event => updatePatient('aki', event.target.checked)} />Función renal inestable / lesión renal aguda</label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={patient.dialysis} onChange={event => updatePatient('dialysis', event.target.checked)} />Hemodiálisis, diálisis peritoneal o TRRC</label>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-cyan-800">VFG CKD‑EPI 2021</p><p className="mt-1 text-2xl font-black text-cyan-950">{egfr ? `${egfr} mL/min/1,73 m²` : 'Pendiente'}</p><p className="mt-1 text-xs text-cyan-800">Útil para estimar función renal; se calcula aun sin peso.</p></div><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-indigo-800">CrCl Cockcroft–Gault</p><p className="mt-1 text-2xl font-black text-indigo-950">{crcl ? `${crcl} mL/min` : 'Falta peso u otro dato'}</p><p className="mt-1 text-xs text-indigo-800">Se prioriza para las tablas de este módulo cuando está disponible.</p></div></section>
        {(patient.aki || patient.dialysis || nearThreshold || (!crcl && egfr)) && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div className="space-y-1">{patient.aki && <p><strong>Función renal inestable:</strong> las ecuaciones basadas en creatinina pueden ser engañosas; use tendencia, diuresis y evaluación clínica.</p>}{patient.dialysis && <p><strong>Reemplazo renal:</strong> no aplicar las pautas mostradas. Se requiere tabla específica según modalidad, sesión y función residual.</p>}{nearThreshold && <p><strong>Valor cercano a un punto de corte:</strong> confirme creatinina, tendencia y método antes de cambiar la pauta.</p>}{!crcl && egfr && <p><strong>Sin peso:</strong> la orientación usa CKD‑EPI como aproximación; complete peso para CrCl Cockcroft–Gault.</p>}</div></div></div>}

        <section className="rounded-xl border border-teal-200 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black text-slate-950">Antimicrobianos a revisar</h3><p className="text-xs text-slate-500">Puede cargar los tratamientos vigentes del paciente y agregar alternativas.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setAntibiotics(items => [...items, ''])}><Plus className="mr-1 h-4 w-4" />Agregar</Button></div><div className="space-y-2">{antibiotics.map((name, index) => <div key={index} className="flex gap-2"><select className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm" value={name} onChange={event => setAntibiotics(items => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}><option value="">Seleccionar antimicrobiano</option>{RENAL_ANTIMICROBIALS.map(item => <option key={item}>{item}</option>)}</select><Button type="button" size="icon" variant="ghost" onClick={() => setAntibiotics(items => items.length === 1 ? [''] : items.filter((_, itemIndex) => itemIndex !== index))} className="text-red-600"><Trash2 className="h-4 w-4" /></Button></div>)}</div></section>

        <section className="space-y-3"><h3 className="font-black text-slate-950">Revisión sugerida</h3>{results.length ? results.map(result => <article key={result.name} className={`rounded-xl border p-4 ${statusStyle(result.status)}`}><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-base font-black">{result.name}</h4><span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">{result.status}</span></div><p className="mt-3 whitespace-pre-wrap text-sm font-semibold">{result.recommendation}</p>{result.notes && <p className="mt-2 text-xs opacity-90"><strong>Precauciones / otras indicaciones:</strong> {result.notes}</p>}</article>) : <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Seleccione al menos un antimicrobiano.</div>}</section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-2"><XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><div><h3 className="font-black text-slate-900">Límites de seguridad</h3><p className="mt-1 text-xs leading-relaxed text-slate-600">No usar este resultado como prescripción automática. Confirmar foco, gravedad, vía, peso de dosificación, alergias, interacciones, función hepática, microbiología, modalidad de infusión y protocolo local. Vancomicina, aminoglucósidos, diálisis/TRRC, embarazo, pediatría, obesidad extrema y función renal inestable requieren individualización.</p></div></div><div className="mt-3 flex flex-wrap gap-2">{RENAL_DOSING_SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50">{source.label}<ExternalLink className="h-3 w-3" /></a>)}</div></section>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6"><p className="flex items-center gap-1 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Los datos manuales no se guardan automáticamente en la ficha.</p><Button type="button" onClick={onClose} className="bg-teal-700 hover:bg-teal-800">Cerrar revisión</Button></footer>
    </div>
  </div>;
}
