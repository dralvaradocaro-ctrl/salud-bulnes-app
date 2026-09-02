import { useMemo, useState } from 'react';
import { AlertTriangle, BedDouble, CheckCircle2, Droplets, ExternalLink, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateEgfrCkdEpi2021 } from '@/lib/renalFunction';
import { getLatestProaForm } from '@/lib/proaRegistry';
import { antimicrobialUsualDose, calculateCockcroftGault, getRenalAntimicrobialScenarios, renalDoseRecommendation, RENAL_ANTIMICROBIALS, RENAL_DOSING_SOURCES } from '@/lib/renalAntimicrobialDosing';

const emptyPatient = { patientKey: '', nombre: '', edad: '', sexo: '', peso: '', talla: '', creatinina: '', fechaCreatinina: '', renalReplacement: 'none', aki: false };
const emptyAntibiotic = () => ({ name: '', scenario: 'general' });
const antibioticWithDefaultScenario = name => ({ name, scenario: getRenalAntimicrobialScenarios(name)[0]?.id || 'general' });
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
const inferRenalReplacement = form => {
  const explicit = String(form.renalReplacement || form.reemplazoRenal || form.terapiaReemplazoRenal || form.terapia_reemplazo_renal || '').toLowerCase();
  const currentSupport = [form.soporteClinico, form.soporte_clinico, form.otrosSoportes, form.otros_soportes].filter(Boolean).join(' ').toLowerCase();
  const value = `${explicit} ${currentSupport}`;
  if (/trrc|terapia continua|hemofiltraci[oó]n continua|hemodiafiltraci[oó]n continua/.test(value)) return 'crrt';
  if (/di[aá]lisis peritoneal|peritoneodi[aá]lisis/.test(value)) return 'pd';
  if (/hemodi[aá]lisis|trisemanal|tres veces (a|por) la semana|\bihd\b/.test(value)) return 'ihd';
  return 'none';
};

export default function RenalAntibioticReview({ open, onClose, records = [] }) {
  const [patient, setPatient] = useState(emptyPatient);
  const [antibiotics, setAntibiotics] = useState([emptyAntibiotic()]);
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
    if (!key) { setPatient(emptyPatient); setAntibiotics([emptyAntibiotic()]); setPatientSearch(''); setPatientPickerOpen(false); return; }
    const selected = patientOptions.find(item => String(item.key) === String(key));
    if (!selected) return;
    const { form } = selected;
    const creatinine = latestCreatinine(form);
    setPatient({ patientKey: key, nombre: form.paciente || '', edad: form.edad || '', sexo: form.sexo || '', peso: form.peso || '', talla: form.talla || '', creatinina: creatinine?.valor || '', fechaCreatinina: creatinine?.fecha || '', renalReplacement: inferRenalReplacement(form), aki: false });
    setPatientSearch(selected.name);
    setPatientPickerOpen(false);
    const current = (form.antibioticos || []).filter(isCurrentAntibiotic).map(item => item.nombre);
    setAntibiotics(current.length ? current.map(antibioticWithDefaultScenario) : [emptyAntibiotic()]);
  };
  const updatePatient = (key, value) => setPatient(current => ({ ...current, [key]: value }));
  const egfr = calculateEgfrCkdEpi2021({ creatinina: patient.creatinina, edad: patient.edad, sexo: patient.sexo });
  const crcl = calculateCockcroftGault({ creatinine: patient.creatinina, age: patient.edad, sex: patient.sexo, weight: patient.peso });
  const renalValue = crcl || egfr;
  const nearThreshold = renalValue && [10, 15, 20, 30, 40, 50, 60].some(value => Math.abs(renalValue - value) <= 3);
  const results = antibiotics.filter(item => item.name).map((item, index) => {
    const scenarios = getRenalAntimicrobialScenarios(item.name);
    return {
      ...item,
      index,
      scenarioLabel: scenarios.find(option => option.id === item.scenario)?.label || scenarios[0]?.label || 'Indicación habitual',
      usualDose: antimicrobialUsualDose(item.name, item.scenario, patient.peso),
      ...renalDoseRecommendation(item.name, renalValue, item.scenario, { weight: patient.peso, aki: patient.aki, renalReplacement: patient.renalReplacement }),
    };
  });
  const renalContextLabel = patient.renalReplacement === 'ihd' ? 'hemodiálisis intermitente' : patient.renalReplacement === 'crrt' ? 'TRRC' : patient.renalReplacement === 'pd' ? 'diálisis peritoneal' : renalValue ? `CrCl/VFG ${renalValue} mL/min` : 'función renal pendiente';
  const hasRenalReplacement = patient.renalReplacement !== 'none';
  const statusStyle = status => status.startsWith('Sin ajuste') ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : status.startsWith('Evitar') ? 'border-red-200 bg-red-50 text-red-900' : status.startsWith('Individualizar') ? 'border-amber-200 bg-amber-50 text-amber-950' : /Hemodiálisis|TRRC|Diálisis peritoneal/.test(status) ? 'border-indigo-200 bg-indigo-50 text-indigo-950' : 'border-orange-200 bg-orange-50 text-orange-950';

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label="Antibióticos y función renal">
    <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-4 sm:px-6"><div><div className="flex items-center gap-2"><Droplets className="h-6 w-6 text-teal-700" /><h2 className="text-xl font-black text-teal-950">Antibióticos y función renal</h2></div><p className="mt-1 text-sm text-teal-800">Seleccione paciente, modalidad renal y antimicrobiano para obtener la pauta aplicable.</p></div><Button type="button" variant="outline" size="sm" onClick={onClose}>Cerrar</Button></header>
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
            <label className="flex min-w-[280px] items-center gap-2 text-sm font-semibold text-slate-700">
              Terapia de reemplazo renal
              <select className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-sm" value={patient.renalReplacement} onChange={event => updatePatient('renalReplacement', event.target.value)}>
                <option value="none">No</option>
                <option value="ihd">Hemodiálisis intermitente (trisemanal)</option>
                <option value="crrt">TRRC / terapia continua</option>
                <option value="pd">Diálisis peritoneal</option>
              </select>
            </label>
          </div>
        </section>

        {hasRenalReplacement ? <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-indigo-700">Modalidad seleccionada</p><p className="mt-1 text-xl font-black text-indigo-950">{renalContextLabel}</p><p className="mt-1 text-xs text-indigo-700">La pauta se calcula para esta modalidad; CrCl y VFG no sustituyen el protocolo de diálisis.</p></section> : <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-cyan-800">VFG CKD‑EPI 2021</p><p className="mt-1 text-2xl font-black text-cyan-950">{egfr ? `${egfr} mL/min/1,73 m²` : 'Pendiente'}</p><p className="mt-1 text-xs text-cyan-800">Estimación de función renal.</p></div><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-indigo-800">CrCl Cockcroft–Gault</p><p className="mt-1 text-2xl font-black text-indigo-950">{crcl ? `${crcl} mL/min` : 'Falta peso u otro dato'}</p><p className="mt-1 text-xs text-indigo-800">Valor priorizado para el ajuste farmacológico.</p></div></section>}
        {(patient.aki || nearThreshold || (!crcl && egfr)) && !hasRenalReplacement && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div>{patient.aki && <p><strong>Función renal inestable:</strong> las ecuaciones basadas en creatinina pueden ser engañosas.</p>}{nearThreshold && <p><strong>Cercano a un punto de corte:</strong> confirme creatinina y tendencia.</p>}{!crcl && egfr && <p><strong>Falta peso:</strong> complete el dato para calcular Cockcroft–Gault.</p>}</div></div></div>}

        <section className="rounded-xl border border-teal-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-black text-slate-950">Antimicrobianos a revisar</h3><p className="text-xs text-slate-500">Seleccione el fármaco y el escenario clínico: el foco y la gravedad pueden cambiar la pauta.</p></div>
            <Button type="button" variant="outline" size="sm" onClick={() => setAntibiotics(items => [...items, emptyAntibiotic()])}><Plus className="mr-1 h-4 w-4" />Agregar</Button>
          </div>
          <div className="space-y-3">
            {antibiotics.map((antibiotic, index) => {
              const scenarios = getRenalAntimicrobialScenarios(antibiotic.name);
              return <div key={index} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 sm:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)_40px]">
                <div>
                  <Label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Antimicrobiano</Label>
                  <select
                    className="h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={antibiotic.name}
                    onChange={event => setAntibiotics(items => items.map((item, itemIndex) => itemIndex === index ? antibioticWithDefaultScenario(event.target.value) : item))}
                  >
                    <option value="">Seleccionar antimicrobiano</option>
                    {RENAL_ANTIMICROBIALS.map(item => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">Escenario clínico / modalidad</Label>
                  <select
                    className="h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-100"
                    value={antibiotic.scenario}
                    disabled={!antibiotic.name}
                    onChange={event => setAntibiotics(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, scenario: event.target.value } : item))}
                  >
                    {scenarios.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end justify-center">
                  <Button type="button" size="icon" variant="ghost" onClick={() => setAntibiotics(items => items.length === 1 ? [emptyAntibiotic()] : items.filter((_, itemIndex) => itemIndex !== index))} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>;
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div><h3 className="font-black text-slate-950">Pauta sugerida</h3><p className="text-xs text-slate-500">Resultado correspondiente a los datos y a la modalidad seleccionada.</p></div>
          {results.length ? results.map(result => <article key={`${result.name}-${result.index}`} className={`rounded-xl border p-4 ${statusStyle(result.status)}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h4 className="text-base font-black">{result.name}</h4><p className="mt-0.5 text-xs font-semibold opacity-80">{result.scenarioLabel}</p></div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">{result.status}</span>
            </div>
            {result.steps?.length ? <div className="mt-3 grid gap-2 md:grid-cols-3">{result.steps.map(step => <div key={step.label} className="rounded-lg border border-white bg-white p-3 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wide opacity-65">{step.label}</p><p className="mt-1 text-sm font-black leading-snug">{step.value}</p></div>)}</div> : <div className={`mt-3 grid gap-3 ${hasRenalReplacement ? '' : 'md:grid-cols-2'}`}>
              {!hasRenalReplacement && <div className="rounded-lg border border-white/70 bg-white/65 p-3"><p className="text-[10px] font-black uppercase tracking-wide opacity-70">Pauta habitual</p><p className="mt-1 text-sm font-bold">{result.usualDose}</p></div>}
              <div className="rounded-lg border border-white bg-white p-3 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wide opacity-70">Dosis · {renalContextLabel}</p><p className="mt-1 whitespace-pre-wrap text-sm font-black">{result.recommendation}</p></div>
            </div>}
            {result.name === 'Vancomicina' && patient.renalReplacement === 'ihd' && <details className="mt-3 rounded-lg bg-white/70 p-2.5 text-xs"><summary className="cursor-pointer font-black">Ver redosis post-HD según nivel pre-HD</summary><div className="mt-2 grid gap-1 sm:grid-cols-2"><p>&lt;10 mg/L: 10–15 mg/kg</p><p>10–15 mg/L: 7,5–10 mg/kg</p><p>15–20 mg/L: 5 mg/kg</p><p>20–25 mg/L: suspender una dosis o 2,5 mg/kg</p><p className="sm:col-span-2">&gt;25 mg/L: suspender hasta volver a rango; repetir el algoritmo antes de la siguiente HD.</p></div></details>}
            {result.notes && <p className="mt-2 text-xs font-semibold opacity-80">{result.notes}</p>}
          </article>) : <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Seleccione al menos un antimicrobiano.</div>}
        </section>

        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-black text-slate-700">Seguridad y fuentes clínicas</summary><p className="mt-2 text-xs text-slate-600">Confirmar indicación, alergias, última dosis, nivel previo, horario de diálisis y protocolo local antes de administrar.</p><div className="mt-2 flex flex-wrap gap-2">{RENAL_DOSING_SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50">{source.label}<ExternalLink className="h-3 w-3" /></a>)}</div></details>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6"><p className="flex items-center gap-1 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Los datos manuales no se guardan automáticamente en la ficha.</p><Button type="button" onClick={onClose} className="bg-teal-700 hover:bg-teal-800">Cerrar revisión</Button></footer>
    </div>
  </div>;
}
