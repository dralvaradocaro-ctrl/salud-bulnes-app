import { useEffect, useMemo, useState } from 'react';
import { Eye, FileCheck2, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const textarea = `${input} min-h-24 resize-y`;
const today = () => new Date().toISOString().slice(0, 10);
const currentTime = () => new Date().toTimeString().slice(0, 5);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const lines = value => escapeHtml(value || '—').replace(/\n/g, '<br>');
const checked = value => value ? '☒' : '☐';
const formatDate = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : escapeHtml(value || '');
};

const PLAN_OPTIONS = [
  ['aet', 'Adecuación del esfuerzo terapéutico (AET)'],
  ['noRcp', 'No reanimar (no iniciar RCP)'],
  ['noIot', 'No intubar / no iniciar ventilación mecánica invasiva'],
  ['noUci', 'No trasladar a UCI'],
  ['confort', 'Priorizar confort y control sintomático'],
];

const SUPPORT_OPTIONS = [
  ['vni', 'Ventilación no invasiva'], ['altoFlujo', 'Cánula nasal de alto flujo'], ['vasoactivos', 'Drogas vasoactivas'],
  ['dialisis', 'Diálisis / reemplazo renal'], ['invasivos', 'Procedimientos invasivos mayores'],
];

function initialForm(patient, bed) {
  return {
    establecimiento: 'Hospital Comunitario de Salud Familiar de Bulnes', servicio: bed?.serviceShort || '', unidad: bed?.salaLabel || '', cama: bed?.cell || '',
    nombre: patient?.nombre || '', rut: patient?.rut || '', fechaNacimiento: patient?.fechaNacimiento || '', edad: patient?.edad || '', ficha: patient?.nFicha || '',
    fecha: today(), hora: currentTime(), diagnosticos: [patient?.diagnosticoPrincipal, patient?.diagnostico].filter(Boolean).join('\n'),
    resumen: [patient?.resumenCaso, patient?.antecedentes].filter(Boolean).join('\n'),
    plans: {
      aet: patient?.letIndicacion === 'Sí', noRcp: patient?.rcpIndicacion === 'No', noIot: patient?.iotIndicacion === 'No',
      noUci: false, confort: false,
    },
    supports: { vni: 'caso', altoFlujo: 'si', vasoactivos: 'caso', dialisis: 'caso', invasivos: 'caso' },
    objetivo: 'reversibles', otrasLimitaciones: '',
    cuidados: 'Oxigenoterapia, analgesia, manejo de disnea y otros síntomas, higiene y cuidados básicos, hidratación/alimentación clínicamente apropiadas, tratamiento de condiciones reversibles concordantes con los objetivos de cuidado, acompañamiento y cuidados paliativos.',
    capacidad: 'directa', incapacidadMotivo: '', representanteNombre: '', representanteRut: '', representanteRelacion: '', representanteTelefono: '', conversacion: '',
    pacienteNombre: patient?.nombre || '', medicoNombre: patient?.medicoTratante || '', medicoRut: '', segundoNombre: '', segundoProfesion: '', observaciones: '',
  };
}

const supportLabel = value => ({ si: 'Puede utilizarse', no: 'No utilizar', caso: 'Evaluar caso a caso / prueba limitada' }[value] || 'No consignado');
const objectiveLabel = value => ({ recuperacion: 'Recuperación dentro de límites terapéuticos definidos', reversibles: 'Manejo de condiciones reversibles sin escalamiento invasivo', confort: 'Prioridad de confort y control sintomático', exclusivo: 'Cuidados exclusivamente orientados al confort' }[value] || value);

function documentMarkup(form) {
  const patientCannotConsent = form.capacidad === 'sin_capacidad';
  const patientSignature = patientCannotConsent
    ? `<div class="unable-sign"><b>Paciente</b><span>${escapeHtml(form.pacienteNombre || form.nombre || '')}</span><small>No firma: no se encuentra en condiciones de otorgar consentimiento ni expresar válidamente su voluntad al momento de este registro.</small></div>`
    : `<div><i></i><b>Paciente</b><span>${escapeHtml(form.pacienteNombre || form.nombre || '')}</span><small>Firma</small></div>`;
  return `<article class="clinical-document">
    <header class="doc-header"><img src="/logo-hospital.png" alt="Logo Hospital"><div><strong>HOSPITAL COMUNITARIO DE SALUD FAMILIAR DE BULNES</strong><span>Servicio de Salud Ñuble</span></div><aside>Documento clínico<br>Ficha N.º ${escapeHtml(form.ficha || '__________')}</aside></header>
    <h1>CONSTANCIA DE ADECUACIÓN Y LÍMITES TERAPÉUTICOS</h1><p class="subtitle">Decisión clínica compartida y plan de cuidados</p>
    <section><h2>1. Identificación del paciente</h2><div class="doc-grid"><p><b>Nombre:</b> ${escapeHtml(form.nombre || '________________________________')}</p><p><b>RUT / documento:</b> ${escapeHtml(form.rut || '________________')}</p><p><b>Fecha de nacimiento:</b> ${formatDate(form.fechaNacimiento) || '____/____/______'}</p><p><b>Edad:</b> ${escapeHtml(form.edad || '______')}</p><p><b>Servicio / unidad:</b> ${escapeHtml([form.servicio, form.unidad].filter(Boolean).join(' · ') || '________________')}</p><p><b>Cama:</b> ${escapeHtml(form.cama || '______')}</p></div><p><b>Fecha y hora:</b> ${formatDate(form.fecha)} · ${escapeHtml(form.hora || '____:____')} h</p></section>
    <section><h2>2. Diagnósticos y fundamento clínico</h2><p><b>Diagnósticos relevantes:</b><br>${lines(form.diagnosticos)}</p><p><b>Situación clínica, evolución, comorbilidades, funcionalidad previa y pronóstico:</b><br>${lines(form.resumen)}</p><p>Considerando la situación clínica, el pronóstico global, las posibilidades razonables de recuperación y la proporcionalidad entre beneficios y cargas, se establece el plan individualizado señalado a continuación. Esta decisión <b>no implica abandono de atención</b>.</p></section>
    <section><h2>3. Plan terapéutico seleccionado</h2><div class="plan-box">${PLAN_OPTIONS.map(([key, label]) => `<p class="${form.plans[key] ? 'selected' : ''}">${checked(form.plans[key])} <b>${label}</b></p>`).join('')}</div><p class="note">Las opciones son independientes y pueden seleccionarse conjuntamente. Solo se consideran vigentes las casillas marcadas.</p></section>
    <section><h2>4. Alcance de otras medidas de soporte</h2><table><tbody>${SUPPORT_OPTIONS.map(([key, label]) => `<tr><th>${label}</th><td>${checked(form.supports[key] === 'si')} Puede utilizarse &nbsp; ${checked(form.supports[key] === 'no')} No utilizar &nbsp; ${checked(form.supports[key] === 'caso')} Evaluar caso a caso / prueba limitada</td></tr>`).join('')}</tbody></table><p><b>Otras limitaciones o precisiones:</b><br>${lines(form.otrasLimitaciones)}</p></section>
    <section><h2>5. Objetivo y cuidados que se mantienen</h2><p><b>Objetivo principal:</b> ${escapeHtml(objectiveLabel(form.objetivo))}</p><p>${lines(form.cuidados)}</p><p>Se mantendrán las medidas proporcionadas de alivio de síntomas, confort, dignidad y acompañamiento, además del tratamiento de condiciones reversibles cuando sea concordante con los objetivos definidos.</p></section>
    <section><h2>6. Participación e información entregada</h2><p>${checked(form.capacidad === 'directa')} Paciente participa directamente &nbsp; ${checked(form.capacidad === 'parcial')} Paciente participa junto a familia &nbsp; ${checked(form.capacidad === 'representante')} Participa representante/familia &nbsp; ${checked(patientCannotConsent)} Paciente sin capacidad actual para consentir o expresar válidamente su voluntad</p>${patientCannotConsent ? `<p class="capacity-notice"><b>Constancia de imposibilidad de consentimiento y firma:</b> Al momento de este registro, el/la paciente no se encuentra en condiciones clínicas de comprender suficientemente la información, expresar válidamente su voluntad ni otorgar su firma. <b>Motivo:</b> ${lines(form.incapacidadMotivo)}</p>` : ''}<p><b>Representante:</b> ${escapeHtml(form.representanteNombre || '—')} · <b>RUT:</b> ${escapeHtml(form.representanteRut || '—')} · <b>Relación:</b> ${escapeHtml(form.representanteRelacion || '—')} · <b>Teléfono:</b> ${escapeHtml(form.representanteTelefono || '—')}</p><p>Se explicó la condición clínica, el pronóstico, las alternativas disponibles, los beneficios y cargas de las intervenciones, la continuidad de los cuidados y la posibilidad de reevaluar la decisión ante cambios clínicos relevantes.</p><p><b>Registro de la conversación:</b><br>${lines(form.conversacion)}</p></section>
    <section class="signatures"><h2>7. Firmas y registro</h2><div class="signature-grid">${patientSignature}<div><i></i><b>Representante / familiar</b><span>${escapeHtml(form.representanteNombre || '')}</span><small>Firma y relación</small></div><div><i></i><b>Médico/a tratante</b><span>${escapeHtml(form.medicoNombre || '')}</span><small>Firma y RUT: ${escapeHtml(form.medicoRut || '')}</small></div><div><i></i><b>Segundo profesional</b><span>${escapeHtml(form.segundoNombre || '')}</span><small>${escapeHtml(form.segundoProfesion || 'Firma y profesión')}</small></div></div><p><b>Observaciones:</b> ${lines(form.observaciones)}</p><p class="reevaluation">Decisión clínica individualizada. Reevaluar ante cambios relevantes en la condición, el pronóstico o los objetivos de cuidado.</p></section>
  </article>`;
}

const documentCss = `
  *{box-sizing:border-box}.clinical-document{color:#111827;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.36}.doc-header{display:grid;grid-template-columns:86px 1fr 150px;align-items:center;gap:14px;border-bottom:2px solid #1e3a5f;padding-bottom:9px;margin-bottom:18px}.doc-header img{max-width:80px;max-height:58px;object-fit:contain}.doc-header strong{display:block;color:#17365d;font-size:11pt}.doc-header span{font-size:9pt}.doc-header aside{text-align:right;font-size:8.5pt}.clinical-document h1{text-align:center;font-size:15pt;color:#17365d;margin:0 0 2px}.subtitle{text-align:center;font-size:10pt;margin:0 0 17px;color:#475569}.clinical-document section{break-inside:avoid;margin:0 0 13px}.clinical-document h2{font-size:10.5pt;color:#17365d;background:#edf3f8;border-left:4px solid #376a94;padding:4px 7px;margin:0 0 7px}.doc-grid{display:grid;grid-template-columns:1.7fr 1fr;gap:2px 18px}.clinical-document p{margin:5px 0}.plan-box{border:1px solid #94a3b8;padding:6px 10px}.plan-box p{padding:3px 5px}.plan-box .selected{background:#edf3f8;color:#17365d}.note{font-size:8.5pt;color:#475569}.capacity-notice{border:1px solid #b45309;background:#fffbeb;padding:7px}.clinical-document table{width:100%;border-collapse:collapse;font-size:9pt}.clinical-document th,.clinical-document td{border:1px solid #94a3b8;padding:5px;text-align:left;vertical-align:top}.clinical-document th{width:31%;background:#f8fafc}.signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px 32px;margin-top:18px}.signature-grid div{text-align:center;min-height:70px}.signature-grid i{display:block;border-top:1px solid #334155;margin-top:32px}.signature-grid b,.signature-grid span,.signature-grid small{display:block}.signature-grid small{font-size:8pt;color:#475569}.signature-grid .unable-sign{display:flex;flex-direction:column;justify-content:flex-end;border:1px dashed #b45309;background:#fffbeb;padding:8px}.signature-grid .unable-sign small{color:#92400e}.reevaluation{border-top:1px solid #94a3b8;padding-top:7px;font-size:8.5pt;font-weight:bold}
`;

function printDocument(form) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.opener = null;
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Constancia de adecuación y límites terapéuticos</title><style>@page{size:A4;margin:14mm 15mm}body{margin:0}${documentCss}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${documentMarkup(form)}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`);
  win.document.close();
}

function Field({ label, children, wide }) { return <label className={wide ? 'block sm:col-span-2' : 'block'}><span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>{children}</label>; }

export function HospitalCareDocumentButtons({ onOpen }) {
  return <button type="button" onClick={onOpen} className="mb-3 flex w-full items-center gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-100"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-700 text-white"><FileCheck2 className="h-5 w-5" /></span><span><b className="block text-sm text-slate-950">Adecuación y límites terapéuticos</b><small className="block text-xs text-slate-600">Documento único · AET, no reanimar, no intubar y combinaciones</small></span><Eye className="ml-auto h-5 w-5 text-indigo-600" /></button>;
}

export default function HospitalCareDocuments({ open, patient, bed, onClose }) {
  const [form, setForm] = useState(() => initialForm(patient, bed));
  const [preview, setPreview] = useState(true);
  useEffect(() => { if (open) { setForm(initialForm(patient, bed)); setPreview(true); } }, [open, patient, bed]);
  const previewMarkup = useMemo(() => documentMarkup(form), [form]);
  if (!open) return null;
  const canPrint = form.capacidad !== 'sin_capacidad' || form.incapacidadMotivo.trim().length > 0;
  const update = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const togglePlan = key => setForm(old => ({ ...old, plans: { ...old.plans, [key]: !old.plans[key] } }));
  const updateSupport = (key, value) => setForm(old => ({ ...old, supports: { ...old.supports, [key]: value } }));
  return <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="flex h-[97vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3"><div className="flex items-center gap-3"><img src="/logo-hospital.png" alt="Logo Hospital de Bulnes" className="h-11 w-16 object-contain" /><div><h2 className="font-black text-slate-950">Adecuación y límites terapéuticos</h2><p className="text-xs text-slate-500">Documento único con selección múltiple y previsualización A4</p></div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPreview(value => !value)} className="lg:hidden"><Eye className="mr-1 h-4 w-4" />{preview ? 'Formulario' : 'Preview'}</Button><Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar"><X className="h-5 w-5" /></Button></div></header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(440px,0.82fr)_minmax(620px,1.18fr)]">
        <div className={`${preview ? 'hidden lg:block' : 'block'} min-h-0 overflow-y-auto p-5`}>
          <section><h3 className="mb-3 text-sm font-black text-indigo-950">Paciente y fundamento</h3><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre completo" wide><input className={input} value={form.nombre} onChange={e => update('nombre', e.target.value)} /></Field><Field label="RUT / documento"><input className={input} value={form.rut} onChange={e => update('rut', e.target.value)} /></Field><Field label="N.º ficha clínica"><input className={input} value={form.ficha} onChange={e => update('ficha', e.target.value)} /></Field><Field label="Fecha"><input type="date" className={input} value={form.fecha} onChange={e => update('fecha', e.target.value)} /></Field><Field label="Hora"><input type="time" className={input} value={form.hora} onChange={e => update('hora', e.target.value)} /></Field><Field label="Diagnósticos relevantes" wide><textarea className={textarea} value={form.diagnosticos} onChange={e => update('diagnosticos', e.target.value)} /></Field><Field label="Situación clínica, evolución, funcionalidad y pronóstico" wide><textarea className={textarea} value={form.resumen} onChange={e => update('resumen', e.target.value)} /></Field></div></section>
          <section className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4"><h3 className="text-sm font-black text-indigo-950">Plan terapéutico · selección múltiple</h3><p className="mb-3 text-[11px] text-indigo-700">Marca todas las decisiones que correspondan. AET, no reanimar y no intubar pueden combinarse libremente.</p><div className="space-y-2">{PLAN_OPTIONS.map(([key, label]) => <label key={key} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${form.plans[key] ? 'border-indigo-400 bg-white font-bold text-indigo-950' : 'border-indigo-100 bg-white/60 text-slate-700'}`}><input type="checkbox" checked={form.plans[key]} onChange={() => togglePlan(key)} className="mt-0.5 h-4 w-4 accent-indigo-700" />{label}</label>)}</div></section>
          <section className="mt-5"><h3 className="mb-3 text-sm font-black text-indigo-950">Otras medidas de soporte</h3><div className="space-y-3">{SUPPORT_OPTIONS.map(([key, label]) => <Field key={key} label={label}><select className={input} value={form.supports[key]} onChange={e => updateSupport(key, e.target.value)}><option value="si">Puede utilizarse</option><option value="no">No utilizar</option><option value="caso">Evaluar caso a caso / prueba limitada</option></select></Field>)}<Field label="Otras limitaciones o precisiones"><textarea className={textarea} value={form.otrasLimitaciones} onChange={e => update('otrasLimitaciones', e.target.value)} /></Field><Field label="Objetivo principal"><select className={input} value={form.objetivo} onChange={e => update('objetivo', e.target.value)}><option value="recuperacion">Recuperación dentro de límites definidos</option><option value="reversibles">Tratar reversibles sin escalamiento invasivo</option><option value="confort">Prioridad de confort</option><option value="exclusivo">Cuidados exclusivamente de confort</option></select></Field><Field label="Cuidados que se mantienen"><textarea className={textarea} value={form.cuidados} onChange={e => update('cuidados', e.target.value)} /></Field></div></section>
          <section className="mt-5"><h3 className="mb-3 text-sm font-black text-indigo-950">Conversación y profesionales</h3><div className="grid gap-3 sm:grid-cols-2"><Field label="Participación y capacidad para consentir" wide><select className={input} value={form.capacidad} onChange={e => update('capacidad', e.target.value)}><option value="directa">Paciente participa y firma directamente</option><option value="parcial">Paciente participa junto a familia</option><option value="representante">Participa representante / familia</option><option value="sin_capacidad">Paciente no está en condiciones de consentir ni firmar</option></select></Field>{form.capacidad === 'sin_capacidad' && <div className="sm:col-span-2 rounded-xl border border-amber-300 bg-amber-50 p-3"><Field label="Motivo clínico de la imposibilidad de consentir o firmar"><textarea className={textarea} value={form.incapacidadMotivo} onChange={e => update('incapacidadMotivo', e.target.value)} placeholder="Ej.: compromiso de conciencia, delirium, deterioro cognitivo avanzado, sedación u otra condición clínica." /></Field><p className="mt-2 text-[11px] text-amber-800">El documento reemplazará la línea de firma del paciente por una constancia formal.</p></div>}<Field label="Representante / familiar"><input className={input} value={form.representanteNombre} onChange={e => update('representanteNombre', e.target.value)} /></Field><Field label="RUT representante"><input className={input} value={form.representanteRut} onChange={e => update('representanteRut', e.target.value)} /></Field><Field label="Relación"><input className={input} value={form.representanteRelacion} onChange={e => update('representanteRelacion', e.target.value)} /></Field><Field label="Teléfono representante"><input className={input} value={form.representanteTelefono} onChange={e => update('representanteTelefono', e.target.value)} /></Field><Field label="Médico/a tratante"><input className={input} value={form.medicoNombre} onChange={e => update('medicoNombre', e.target.value)} /></Field><Field label="RUT profesional"><input className={input} value={form.medicoRut} onChange={e => update('medicoRut', e.target.value)} /></Field><Field label="Registro de la conversación" wide><textarea className={textarea} value={form.conversacion} onChange={e => update('conversacion', e.target.value)} /></Field><Field label="Segundo profesional"><input className={input} value={form.segundoNombre} onChange={e => update('segundoNombre', e.target.value)} /></Field><Field label="Profesión"><input className={input} value={form.segundoProfesion} onChange={e => update('segundoProfesion', e.target.value)} /></Field></div></section>
        </div>
        <div className={`${preview ? 'block' : 'hidden lg:block'} min-h-0 overflow-auto bg-slate-300 p-3 sm:p-6`}><div className="mx-auto min-h-[1123px] w-[794px] origin-top bg-white p-[56px] shadow-xl max-lg:scale-[.72] max-sm:scale-[.44]" style={{ fontFamily: 'Arial, sans-serif' }}><style>{documentCss}</style><div dangerouslySetInnerHTML={{ __html: previewMarkup }} /></div></div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3"><p className={`text-[11px] ${canPrint ? 'text-slate-500' : 'font-bold text-amber-700'}`}>{canPrint ? 'Revise la previsualización antes de firmar. Ajuste el contenido al caso y a la normativa institucional vigente.' : 'Debe registrar el motivo clínico por el cual el paciente no puede consentir ni firmar.'}</p><div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cerrar</Button><Button onClick={() => printDocument(form)} disabled={!canPrint} className="gap-2 bg-indigo-700 hover:bg-indigo-800"><Printer className="h-4 w-4" />Imprimir / guardar PDF</Button></div></footer>
    </div>
  </div>;
}
