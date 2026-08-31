import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, ChevronLeft, Eye, Printer, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { formatRut } from '@/lib/rut-ges';
import { getMultiPrefill } from '@/lib/multiTemplatePrefill';
import { PROA_BED_MAP } from '@/lib/hospitalSuggestions';
import { fetchProaRecords, getLatestProaForm, readProaRegistry, saveProaRecord } from '@/lib/proaRegistry';
import FirmaDigital from '@/components/ges/FirmaDigital';

function nowForInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date).replace(',', '');
}

const emptyForm = () => ({
  pacienteNombre: '',
  pacienteRut: '',
  fechaHora: nowForInput(),
  diagnostico: '',
  anamnesis: '',
  examenFisico: '',
  indicaciones: '',
  medico: '',
  firma: '',
  servicio: '',
  cama: '',
  esVisitaServicio: false,
});

const SECTIONS = [
  { key: 'anamnesis', label: 'Anamnesis', placeholder: 'Antecedentes y evolución clínica relevante…' },
  { key: 'examenFisico', label: 'Examen físico', placeholder: 'Hallazgos del examen físico…' },
  { key: 'indicaciones', label: 'Indicaciones', placeholder: 'Plan e indicaciones médicas…' },
];

export default function NotaEvolucion() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [showBedSelector, setShowBedSelector] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedService, setSelectedService] = useState(PROA_BED_MAP[0]?.servicio || '');
  const [bedRecords, setBedRecords] = useState(() => readProaRegistry());
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    const prefill = getMultiPrefill();
    if (!prefill) return;
    setForm(prev => ({
      ...prev,
      pacienteNombre: prefill.patient_name || prev.pacienteNombre,
      pacienteRut: prefill.patient_rut ? formatRut(prefill.patient_rut) : prev.pacienteRut,
      diagnostico: prefill.diagnostico_principal || prefill.diagnostico || prev.diagnostico,
      servicio: prefill.servicio || prev.servicio,
      cama: prefill.cama || prev.cama,
    }));
    if (prefill.servicio && prefill.cama) {
      setSelectedService(prefill.servicio);
      setShowBedSelector(false);
    }
  }, []);

  useEffect(() => {
    fetchProaRecords().then(setBedRecords);
  }, []);

  useEffect(() => {
    if (!form.cama) return;
    const current = bedRecords.find(item => item.bedCode === form.cama);
    const patient = getLatestProaForm(current);
    if (!patient) return;
    setForm(prev => ({ ...prev, pacienteNombre: prev.pacienteNombre || patient.paciente || '', pacienteRut: prev.pacienteRut || formatRut(patient.rut || ''), diagnostico: prev.diagnostico || patient.diagnostico_principal || patient.diagnostico_actual || '' }));
  }, [bedRecords, form.cama]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('Home'));
  };

  const chooseBed = (servicio, cama) => {
    const record = bedRecords.find(item => item.bedCode === cama);
    const patient = getLatestProaForm(record) || {};
    setForm(prev => ({ ...prev, servicio, cama, pacienteNombre: patient.paciente || prev.pacienteNombre, pacienteRut: patient.rut ? formatRut(patient.rut) : prev.pacienteRut, diagnostico: patient.diagnostico_principal || patient.diagnostico_actual || prev.diagnostico }));
    setShowBedSelector(false);
  };

  const newNote = () => {
    setForm(emptyForm());
    setSelectedService(PROA_BED_MAP[0]?.servicio || '');
    setShowBedSelector(true);
  };

  const occupiedBeds = new Set(bedRecords.map(record => record.bedCode));

  const saveEvolution = async () => {
    const record = bedRecords.find(item => item.bedCode === form.cama);
    if (!record) { setSaveMessage('No se encontró un paciente hospitalizado en esta cama.'); return; }
    if (![form.anamnesis, form.examenFisico, form.indicaciones].some(value => value.trim())) { setSaveMessage('Completa al menos una sección clínica antes de guardar.'); return; }
    const latest = getLatestProaForm(record) || {};
    const narrative = [form.diagnostico && `DIAGNÓSTICO(S):\n${form.diagnostico.trim()}`, form.anamnesis && `ANAMNESIS:\n${form.anamnesis.trim()}`, form.examenFisico && `EXAMEN FÍSICO:\n${form.examenFisico.trim()}`, form.indicaciones && `INDICACIONES:\n${form.indicaciones.trim()}`].filter(Boolean).join('\n\n');
    setSaving(true); setSaveMessage('');
    try {
      await saveProaRecord({
        ...latest,
        paciente: form.pacienteNombre || latest.paciente || '', rut: form.pacienteRut || latest.rut || '', servicio: form.servicio, cama: form.cama,
        fecha: String(form.fechaHora || '').slice(0, 10), hora: String(form.fechaHora || '').slice(11, 16),
        proa_enrolled: latest.proa_enrolled !== false,
        proa_entry_type: form.esVisitaServicio ? 'visita_servicio' : 'nota_evolucion_hospitalaria',
        evolucion: narrative, vista_ultima_evolucion: narrative,
        nota_evolucion: { diagnostico: form.diagnostico, anamnesis: form.anamnesis, examen_fisico: form.examenFisico, indicaciones: form.indicaciones, medico: form.medico, fecha_hora: form.fechaHora, visita_servicio: form.esVisitaServicio, titulo: form.esVisitaServicio ? 'Visita servicio Dr. Rubilar' : 'Nota de evolución' },
      });
      const refreshed = await fetchProaRecords();
      setBedRecords(refreshed);
      setSaveMessage(form.esVisitaServicio ? 'Visita servicio Dr. Rubilar guardada en el historial.' : 'Nota de evolución guardada en el historial hospitalario.');
    } catch (error) {
      console.error('Error guardando nota de evolución:', error);
      setSaveMessage('No fue posible guardar la nota. Intenta nuevamente.');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 print:min-h-0 print:bg-white">
      <Dialog open={showBedSelector} onOpenChange={open => { if (!open && form.cama) setShowBedSelector(false); }}>
        <DialogContent className="no-print max-h-[88vh] max-w-3xl overflow-y-auto" onEscapeKeyDown={e => { if (!form.cama) e.preventDefault(); }} onPointerDownOutside={e => { if (!form.cama) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-slate-700" /> Seleccionar cama para evolucionar
            </DialogTitle>
            <DialogDescription>
              Elige primero el servicio y la cama. Ambos datos quedarán registrados en la nota de evolución.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={selectedService} onValueChange={setSelectedService} className="space-y-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-slate-100 p-1.5">
              {PROA_BED_MAP.map(service => {
                const beds = service.groups.flatMap(group => group.beds);
                const occupied = beds.filter(bed => occupiedBeds.has(bed)).length;
                return (
                  <TabsTrigger
                    key={service.servicio}
                    value={service.servicio}
                    className="gap-2 rounded-lg px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-teal-800"
                  >
                    {service.servicio}
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {occupied}/{beds.length}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {PROA_BED_MAP.map(service => (
              <TabsContent key={service.servicio} value={service.servicio} className="mt-0">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-bold text-slate-800">{service.servicio}</p>
                    <Badge className="border-slate-200 bg-white text-slate-600">
                      {service.groups.reduce((total, group) => total + group.beds.length, 0)} camas
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {service.groups.map(group => (
                      <section key={`${service.servicio}-${group.label}`}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                          {group.beds.map(bed => {
                            const occupied = occupiedBeds.has(bed);
                            return (
                              <button
                                key={bed}
                                type="button"
                                onClick={() => chooseBed(service.servicio, bed)}
                                className={`min-h-[62px] rounded-xl border px-3 py-2 text-left transition ${
                                  occupied
                                    ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
                                    : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="block text-base font-bold text-slate-900">{bed}</span>
                                  {occupied && <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Ocupada</span>}
                                </div>
                                <span className={`mt-1 block text-xs ${occupied ? 'font-semibold text-emerald-800' : 'text-slate-400'}`}>
                                  {occupied ? 'Con registro' : 'Libre'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="no-print max-h-[94vh] max-w-5xl overflow-y-auto bg-slate-200 p-3 sm:p-6">
          <DialogHeader className="rounded-xl bg-white px-4 py-3">
            <DialogTitle>Vista previa editable</DialogTitle>
            <DialogDescription>Edita directamente los campos de la hoja y luego imprime el resultado.</DialogDescription>
          </DialogHeader>
          <div className="evolution-live-preview mx-auto w-full max-w-[210mm] bg-white shadow-xl">
            <div className="evolution-preview-heading">
              <img src="/logo-hospital.png" alt="Hospital de Bulnes" />
              <h1>{form.esVisitaServicio ? 'VISITA SERVICIO DR. RUBILAR' : 'NOTA DE EVOLUCIÓN'}</h1>
            </div>
            <div className="evolution-preview-grid">
              <label className="col-span-2"><strong>Nombre:</strong><input value={form.pacienteNombre} onChange={e => update('pacienteNombre', e.target.value)} /></label>
              <label><strong>RUT:</strong><input value={form.pacienteRut} onChange={e => update('pacienteRut', formatRut(e.target.value))} /></label>
              <label><strong>Fecha y hora:</strong><input type="datetime-local" value={form.fechaHora} onChange={e => update('fechaHora', e.target.value)} /></label>
              <label><strong>Servicio:</strong><input value={form.servicio} readOnly /></label>
              <label><strong>Cama:</strong><input value={form.cama} readOnly /></label>
            </div>
            <section className="evolution-preview-section">
              <h2>Diagnóstico(s)</h2>
              <textarea value={form.diagnostico} onChange={e => update('diagnostico', e.target.value)} placeholder="Diagnósticos del paciente" />
            </section>
            {SECTIONS.map(section => (
              <section key={section.key} className="evolution-preview-section">
                <h2>{section.label}</h2>
                <textarea
                  value={form[section.key]}
                  onChange={e => update(section.key, e.target.value)}
                  placeholder={`${section.label} (se omitirá al imprimir si queda en blanco)`}
                />
              </section>
            ))}
            <div className="evolution-preview-signature">
              <FirmaDigital value={form.firma} onSave={value => update('firma', value)} />
              <input value={form.medico} onChange={e => update('medico', e.target.value)} placeholder="Médico que firma" />
              <span>Firma</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 rounded-xl bg-white p-3">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Seguir editando</Button>
            <Button variant="outline" onClick={saveEvolution} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Guardando…' : 'Guardar nota'}</Button>
            <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={goBack} title="Volver">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold text-slate-900">Nota de evolución</h1>
              <p className="text-xs text-slate-500">Documento clínico para pacientes hospitalizados</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={newNote}>
              <RotateCcw className="mr-2 h-4 w-4" /> Nueva
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!form.cama}>
              <Eye className="mr-2 h-4 w-4" /> Vista previa
            </Button>
            <Button onClick={saveEvolution} disabled={saving || !form.cama} className="bg-teal-700 hover:bg-teal-800">
              <Save className="mr-2 h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>
      </header>

      <main className="evolution-editor no-print mx-auto max-w-4xl space-y-5 px-4 py-6">
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-300 bg-slate-800 p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Ubicación seleccionada</p>
            <p className="mt-1 text-lg font-bold">{form.servicio} · Cama {form.cama}</p>
          </div>
          <Button variant="secondary" onClick={() => { setSelectedService(form.servicio); setShowBedSelector(true); }}>
            <Bed className="mr-2 h-4 w-4" /> Cambiar cama
          </Button>
        </section>

        <section className={`rounded-2xl border p-4 shadow-sm ${form.esVisitaServicio ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-bold text-slate-900">Visita servicio Dr. Rubilar</p><p className="text-xs text-slate-500">Al activarlo, la nota se guarda y se imprime con este título como visita de servicio.</p></div>
            <button type="button" role="switch" aria-checked={form.esVisitaServicio} onClick={() => update('esVisitaServicio', !form.esVisitaServicio)} className={`relative h-8 w-14 rounded-full transition ${form.esVisitaServicio ? 'bg-teal-600' : 'bg-slate-300'}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${form.esVisitaServicio ? 'left-7' : 'left-1'}`} /></button>
          </div>
          {saveMessage && <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${saveMessage.startsWith('No ') || saveMessage.startsWith('Completa') ? 'bg-red-50 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>{saveMessage}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              Nombre del paciente
              <Input value={form.pacienteNombre} onChange={e => update('pacienteNombre', e.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              RUT del paciente
              <Input value={form.pacienteRut} onChange={e => update('pacienteRut', formatRut(e.target.value))} />
            </label>
            <div className="space-y-1.5 text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span>Fecha y hora</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => update('fechaHora', nowForInput())}
                  className="h-6 px-2 text-xs text-teal-700 hover:bg-teal-50"
                >
                  Hoy
                </Button>
              </div>
              <Input type="datetime-local" value={form.fechaHora} onChange={e => update('fechaHora', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Diagnóstico(s)
            <Textarea value={form.diagnostico} onChange={e => update('diagnostico', e.target.value)} placeholder="Diagnósticos del paciente" className="min-h-24" />
          </label>
        </section>

        {SECTIONS.map(section => (
          <section key={section.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              {section.label}
              <Textarea
                value={form[section.key]}
                onChange={e => update(section.key, e.target.value)}
                placeholder={section.placeholder}
                className="min-h-36 resize-y font-sans font-normal leading-7"
              />
            </label>
            <p className="mt-2 text-xs font-normal text-slate-400">Si queda en blanco, esta sección no aparecerá al imprimir.</p>
          </section>
        ))}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Médico que firma
            <Input value={form.medico} onChange={e => update('medico', e.target.value)} placeholder="Nombre del médico" />
          </label>
          <div className="mt-5 border-t border-slate-200 pt-5">
            <p className="mb-3 text-sm font-medium text-slate-700">Firma manuscrita</p>
            <FirmaDigital value={form.firma} onSave={value => update('firma', value)} />
          </div>
        </section>
      </main>

      <article className="evolution-print-sheet">
        <div className="evolution-print-heading">
          <img src="/logo-hospital.png" alt="Hospital de Bulnes" />
          <h1>{form.esVisitaServicio ? 'VISITA SERVICIO DR. RUBILAR' : 'NOTA DE EVOLUCIÓN'}</h1>
        </div>
        <div className="evolution-patient-grid">
          <p><strong>Nombre:</strong> {form.pacienteNombre}</p>
          <p><strong>RUT:</strong> {form.pacienteRut}</p>
          <p><strong>Fecha y hora:</strong> {formatDateTime(form.fechaHora)}</p>
          <p><strong>Servicio:</strong> {form.servicio}</p>
          <p><strong>Cama:</strong> {form.cama}</p>
        </div>

        {form.diagnostico.trim() && <section className="evolution-print-section"><h2>Diagnóstico(s)</h2><div className="evolution-ruled-text">{form.diagnostico.trim()}</div></section>}

        {SECTIONS.filter(section => form[section.key].trim()).map(section => (
          <section key={section.key} className="evolution-print-section">
            <h2>{section.label}</h2>
            <div className="evolution-ruled-text">{form[section.key].trim()}</div>
          </section>
        ))}

        <footer className="evolution-signature">
          <div className="evolution-signature-space" />
          {form.firma && <img src={form.firma} alt="Firma del médico" />}
          <div className="evolution-signature-line" />
          <strong>{form.medico || 'Médico que firma'}</strong>
          <span>Firma</span>
        </footer>
      </article>
    </div>
  );
}
