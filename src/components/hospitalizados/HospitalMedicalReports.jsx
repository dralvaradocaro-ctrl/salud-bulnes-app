import { useEffect, useMemo, useState } from 'react';
import { Eye, FileText, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const textarea = `${input} min-h-28 resize-y`;
const today = () => new Date().toISOString().slice(0, 10);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const lines = value => escapeHtml(value || 'Sin información registrada.').replace(/\n/g, '<br>');
const formatDate = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : escapeHtml(value || '');
};

const REPORT_TYPES = {
  estado: {
    label: 'Informe del estado de salud',
    description: 'Situación actual, tratamiento e indicaciones.',
    sections: [
      ['diagnosticos', 'Diagnósticos'],
      ['resumen', 'Resumen actual del cuadro'],
      ['estadoActual', 'Descripción del estado actual'],
      ['planes', 'Plan de tratamiento'],
      ['indicaciones', 'Indicaciones'],
    ],
  },
  traslado: {
    label: 'Resumen de traslado',
    description: 'Síntesis clínica para continuidad asistencial.',
    sections: [
      ['diagnosticos', 'Diagnósticos'],
      ['historiaClinica', 'Historia clínica'],
      ['anamnesis', 'Anamnesis y antecedentes relevantes'],
      ['estudios', 'Estudios complementarios'],
      ['planes', 'Planes'],
      ['indicaciones', 'Indicaciones'],
    ],
  },
  clinico: {
    label: 'Resumen clínico',
    description: 'Resumen estructurado de la hospitalización.',
    sections: [
      ['diagnosticos', 'Diagnósticos'],
      ['historiaClinica', 'Historia clínica'],
      ['anamnesis', 'Anamnesis y antecedentes relevantes'],
      ['estudios', 'Estudios complementarios'],
      ['planes', 'Planes'],
      ['indicaciones', 'Indicaciones'],
    ],
  },
};

function treatmentSummary(patient) {
  return [
    patient?.antibioterapia && `Tratamiento antimicrobiano: ${patient.antibioterapia}`,
    patient?.aislamiento && `Precauciones / aislamiento: ${patient.aislamiento}`,
    patient?.planesPendientes,
  ].filter(Boolean).join('\n');
}

function indicationSummary(patient) {
  return [
    patient?.antibioterapia,
    patient?.letIndicacion && `Adecuación del esfuerzo terapéutico: ${patient.letIndicacion}`,
    patient?.iotIndicacion && `Intubación orotraqueal: ${patient.iotIndicacion}`,
    patient?.rcpIndicacion && `Reanimación cardiopulmonar: ${patient.rcpIndicacion}`,
    patient?.observaciones,
  ].filter(Boolean).join('\n');
}

function initialForm(patient, bed) {
  const diagnoses = [patient?.diagnosticoPrincipal, patient?.diagnostico].filter(Boolean).join('\n');
  const studies = [patient?.estudiosComplementarios, patient?.ultimoLaboratorio && `Último laboratorio: ${patient.ultimoLaboratorio}`].filter(Boolean).join('\n');
  return {
    type: 'estado', fecha: today(), nombre: patient?.nombre || '', rut: patient?.rut || '', ficha: patient?.nFicha || '', edad: patient?.edad || '',
    fechaNacimiento: patient?.fechaNacimiento || '', fechaIngreso: patient?.fechaIngreso || '', servicio: bed?.serviceShort || '', unidad: bed?.salaLabel || '', cama: bed?.cell || '',
    medico: patient?.medicoTratante || '', rutMedico: '', destino: '',
    diagnosticos: diagnoses,
    resumen: patient?.resumenCaso || patient?.ultimaEvolucion || '',
    estadoActual: [patient?.ultimaEvolucion, patient?.resumenCaso].filter(Boolean).join('\n'),
    historiaClinica: [patient?.resumenCaso, patient?.ultimaEvolucion].filter(Boolean).join('\n'),
    anamnesis: patient?.antecedentes || '', estudios,
    planes: treatmentSummary(patient), indicaciones: indicationSummary(patient),
  };
}

const documentCss = `
  *{box-sizing:border-box}body{margin:0}.medical-report{font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:10.5pt;line-height:1.42;background:#fff}.report-header{display:grid;grid-template-columns:82px 1fr 150px;gap:14px;align-items:center;border-bottom:2px solid #17365d;padding-bottom:9px;margin-bottom:20px}.report-header img{max-width:78px;max-height:58px;object-fit:contain}.report-header strong{display:block;color:#17365d;font-size:11pt}.report-header span{font-size:9pt}.report-header aside{text-align:right;font-size:8.5pt}.medical-report h1{text-align:center;color:#17365d;font-size:15pt;margin:0 0 18px;text-transform:uppercase}.patient-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:3px 20px;border:1px solid #94a3b8;background:#f8fafc;padding:9px 12px;margin-bottom:16px}.patient-grid p{margin:2px 0}.medical-report section{margin:0 0 14px;break-inside:avoid}.medical-report h2{font-size:10.5pt;color:#17365d;background:#edf3f8;border-left:4px solid #376a94;padding:5px 8px;margin:0 0 7px}.medical-report section p{margin:0;white-space:normal}.destination{border:1px solid #94a3b8;padding:7px 10px;margin-bottom:14px}.signature{width:270px;margin:54px 0 0 auto;text-align:center}.signature i{display:block;border-top:1px solid #334155}.signature b,.signature span,.signature small{display:block}.signature small{font-size:8pt;color:#475569}.report-footer{margin-top:24px;border-top:1px solid #94a3b8;padding-top:6px;font-size:8pt;color:#64748b}
`;

function documentMarkup(form) {
  const config = REPORT_TYPES[form.type];
  return `<article class="medical-report">
    <header class="report-header"><img src="/logo-hospital.png" alt="Logo Hospital"><div><strong>HOSPITAL COMUNITARIO DE SALUD FAMILIAR DE BULNES</strong><span>Servicio de Salud Ñuble</span></div><aside>Documento clínico<br>Ficha N.º ${escapeHtml(form.ficha || '__________')}</aside></header>
    <h1>${escapeHtml(config.label)}</h1>
    <div class="patient-grid"><p><b>Paciente:</b> ${escapeHtml(form.nombre || '—')}</p><p><b>RUT:</b> ${escapeHtml(form.rut || '—')}</p><p><b>Edad:</b> ${escapeHtml(form.edad || '—')}</p><p><b>Fecha de nacimiento:</b> ${formatDate(form.fechaNacimiento) || '—'}</p><p><b>Servicio / unidad:</b> ${escapeHtml([form.servicio, form.unidad].filter(Boolean).join(' · ') || '—')}</p><p><b>Cama:</b> ${escapeHtml(form.cama || '—')}</p><p><b>Fecha de ingreso:</b> ${formatDate(form.fechaIngreso) || '—'}</p><p><b>Fecha de emisión:</b> ${formatDate(form.fecha)}</p></div>
    ${form.type === 'traslado' ? `<p class="destination"><b>Destino del traslado:</b> ${escapeHtml(form.destino || 'No consignado')}</p>` : ''}
    ${config.sections.map(([key, label]) => `<section><h2>${escapeHtml(label)}</h2><p>${lines(form[key])}</p></section>`).join('')}
    <div class="signature"><i></i><b>${escapeHtml(form.medico || 'Médico/a tratante')}</b><span>RUT: ${escapeHtml(form.rutMedico || '________________')}</span><small>Firma y timbre</small></div>
    <footer class="report-footer">Documento emitido desde la ficha hospitalaria. Su contenido debe ser revisado y validado por el profesional responsable antes de su firma.</footer>
  </article>`;
}

function printDocument(form) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.opener = null;
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(REPORT_TYPES[form.type].label)}</title><style>@page{size:A4;margin:14mm 16mm}${documentCss}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${documentMarkup(form)}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`);
  win.document.close();
}

function Field({ label, children, wide }) {
  return <label className={wide ? 'block sm:col-span-2' : 'block'}><span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>{children}</label>;
}

export default function HospitalMedicalReports({ open, patient, bed, onClose }) {
  const [form, setForm] = useState(() => initialForm(patient, bed));
  const [preview, setPreview] = useState(true);
  useEffect(() => { if (open) { setForm(initialForm(patient, bed)); setPreview(true); } }, [open, patient, bed]);
  const markup = useMemo(() => documentMarkup(form), [form]);
  if (!open) return null;
  const config = REPORT_TYPES[form.type];
  const update = (key, value) => setForm(old => ({ ...old, [key]: value }));
  return <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Generador de informes médicos">
    <div className="flex h-[97vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-700 text-white"><FileText className="h-5 w-5" /></span><div><h2 className="font-black text-slate-950">Generador de informes médicos</h2><p className="text-xs text-slate-500">Datos precargados desde la ficha · revisión profesional obligatoria</p></div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPreview(value => !value)} className="lg:hidden"><Eye className="mr-1 h-4 w-4" />{preview ? 'Formulario' : 'Vista previa'}</Button><Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar"><X className="h-5 w-5" /></Button></div></header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(430px,.82fr)_minmax(620px,1.18fr)]">
        <div className={`${preview ? 'hidden lg:block' : 'block'} min-h-0 overflow-y-auto p-5`}>
          <section className="mb-5"><h3 className="mb-2 text-sm font-black text-emerald-950">Tipo de informe</h3><div className="grid gap-2">{Object.entries(REPORT_TYPES).map(([key, option]) => <button key={key} type="button" onClick={() => update('type', key)} className={`rounded-xl border p-3 text-left transition ${form.type === key ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 hover:bg-slate-50'}`}><b className="block text-sm text-slate-900">{option.label}</b><span className="text-xs text-slate-500">{option.description}</span></button>)}</div></section>
          <section className="mb-5 grid gap-3 sm:grid-cols-2"><Field label="Nombre del paciente" wide><input className={input} value={form.nombre} onChange={e => update('nombre', e.target.value)} /></Field><Field label="RUT"><input className={input} value={form.rut} onChange={e => update('rut', e.target.value)} /></Field><Field label="N.º ficha"><input className={input} value={form.ficha} onChange={e => update('ficha', e.target.value)} /></Field><Field label="Fecha de emisión"><input type="date" className={input} value={form.fecha} onChange={e => update('fecha', e.target.value)} /></Field><Field label="Médico/a responsable"><input className={input} value={form.medico} onChange={e => update('medico', e.target.value)} /></Field><Field label="RUT profesional"><input className={input} value={form.rutMedico} onChange={e => update('rutMedico', e.target.value)} /></Field>{form.type === 'traslado' && <Field label="Destino del traslado" wide><input className={input} value={form.destino} onChange={e => update('destino', e.target.value)} placeholder="Establecimiento, servicio y/o unidad receptora" /></Field>}</section>
          <section><h3 className="mb-3 text-sm font-black text-emerald-950">Contenido clínico</h3><div className="space-y-3">{config.sections.map(([key, label]) => <Field key={key} label={label}><textarea className={textarea} value={form[key]} onChange={e => update(key, e.target.value)} /></Field>)}</div></section>
        </div>
        <div className={`${preview ? 'block' : 'hidden lg:block'} min-h-0 overflow-auto bg-slate-300 p-3 sm:p-6`}><div className="mx-auto min-h-[1123px] w-[794px] origin-top bg-white p-[56px] shadow-xl max-lg:scale-[.72] max-sm:scale-[.44]"><style>{documentCss}</style><div dangerouslySetInnerHTML={{ __html: markup }} /></div></div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3"><p className="text-[11px] text-slate-500">Revise diagnósticos, tratamientos e indicaciones antes de imprimir o guardar como PDF.</p><div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cerrar</Button><Button onClick={() => printDocument(form)} disabled={!form.nombre.trim()} className="gap-2 bg-emerald-700 hover:bg-emerald-800"><Printer className="h-4 w-4" />Imprimir / guardar PDF</Button></div></footer>
    </div>
  </div>;
}
