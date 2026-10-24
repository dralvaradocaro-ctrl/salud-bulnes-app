import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft, ChevronRight, Download, Copy, Check, Files, Mail, ExternalLink, Printer, PenLine, Eye, CircleCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { setMultiPrefill } from '@/lib/multiTemplatePrefill';
import { FORM_GROUPS, STATIC_FORMS, TEMPLATE_TYPE_META } from '@/lib/workspaceCatalog';
import {
  PATIENT_FIELDS, PATIENT_FIELD_GROUPS, canonicalPatientKey, expandPatientProfile, patientFieldLabel,
} from '@/lib/patientProfile';
import ImageProtocolForm from './ImageProtocolForm';

const IMAGE_TYPE = 'Protocolo Imágenes';

// Formularios con página propia que reciben los datos del paciente. `fields` son las claves de
// patientProfile que cada página lee al abrirse; `next` es lo que queda por completar en ella.
export const EXTERNAL_FORMS = [
  { id: 'ext-receta', name: 'Receta médica', route: 'RecetaMedica', description: 'Medicamentos, presentaciones y posología.',
    fields: ['patient_name', 'patient_rut', 'patient_edad', 'patient_direccion', 'diagnostico'],
    next: 'Agregas los medicamentos, la posología y la firma.' },
  { id: 'ext-certificado', name: 'Certificado médico', route: 'CertificadoMedico', description: 'Certificado editable con firma y verificación.',
    fields: ['patient_name', 'patient_rut', 'servicio', 'cama', 'diagnostico', 'resumen_caso'],
    next: 'Revisas el texto del certificado y decides si va firmado.' },
  { id: 'ext-orden-examenes', name: 'Orden de exámenes', route: 'OrdenExamenes', description: 'Estudios precargados, contraste y creatinina.',
    fields: ['patient_name', 'patient_rut', 'patient_edad', 'patient_direccion', 'diagnostico'],
    next: 'Eliges los estudios y, si corresponde, contraste y creatinina.' },
  { id: 'ext-nota-evolucion', name: 'Nota de evolución', route: 'NotaEvolucion', description: 'Evolución clínica imprimible con firma médica.',
    fields: ['patient_name', 'patient_rut', 'diagnostico'],
    next: 'Escribes anamnesis, examen físico, plan e indicaciones.' },
  { id: 'ext-solicitud-examenes', name: 'Solicitud de Exámenes (COD. 32)', route: 'SolicitudExamenes', description: 'Formulario oficial de laboratorio.',
    fields: ['patient_name', 'patient_rut', 'patient_fecha_nac', 'patient_edad', 'n_ficha', 'prevision', 'servicio', 'cama', 'diagnostico'],
    next: 'Marcas los exámenes de laboratorio.' },
  { id: 'ext-solicitud-microbio', name: 'Exámenes Microbiológicos (C 162)', route: 'SolicitudMicrobiologia', description: 'Cultivos, directos y estudios virológicos.',
    fields: ['patient_name', 'patient_rut', 'patient_fecha_nac', 'prevision', 'servicio', 'cama', 'diagnostico'],
    next: 'Eliges la muestra y los estudios.' },
  { id: 'ext-ira-grave', name: 'IRA grave y 2019-nCoV (ISP)', route: 'FormularioIRAGrave', description: 'Notificación inmediata y envío de muestras al ISP.',
    fields: ['patient_name', 'patient_rut', 'patient_fecha_nac', 'patient_edad', 'patient_direccion', 'patient_comuna', 'patient_telefono', 'prevision'],
    next: 'Completas los datos clínicos y de la muestra.' },
  { id: 'ext-coqueluche', name: 'Notificación de coqueluche', route: 'FormularioCoqueluche', description: 'Investigación y notificación con descarga PDF.',
    fields: ['patient_name', 'patient_rut', 'patient_sexo', 'patient_fecha_nac', 'patient_edad', 'patient_direccion', 'patient_comuna'],
    next: 'Completas síntomas, vacunación y contactos.' },
  { id: 'ext-farmaco-restringido', name: 'Fármaco de Uso Restringido', route: 'SolicitudFarmacoRestringido', description: 'Antibióticos de amplio espectro y fármacos ocasionales.',
    fields: ['patient_name', 'patient_rut', 'patient_fecha_nac', 'patient_edad', 'prevision', 'patient_comuna', 'diagnostico'],
    next: 'Indicas el fármaco, la justificación y la duración.' },
  { id: 'ext-hodom', name: 'Hospitalización Domiciliaria (HODOM)', route: 'FormulariosHODOM', description: 'Derivación y consentimiento informado editables.',
    fields: ['patient_name', 'patient_rut', 'patient_edad', 'patient_telefono', 'patient_direccion', 'diagnostico', 'resumen_caso'],
    next: 'Revisas la derivación y el consentimiento.' },
  { id: 'ext-formulario-ges', name: 'Constancia GES', route: 'FormularioGES', description: 'Constancia de información al paciente GES.',
    fields: ['patient_name', 'patient_rut', 'patient_fecha_nac', 'patient_edad', 'patient_direccion', 'patient_comuna', 'patient_telefono', 'patient_correo'],
    next: 'Eliges el problema de salud GES y firmas.' },
  { id: 'ext-informe-biomedico', name: 'Informe Biomédico Funcional', route: 'InformeBiomedico', description: 'Informe biomédico y funcional editable.',
    fields: ['patient_name', 'patient_rut', 'patient_fecha_nac'],
    next: 'Completas diagnósticos y funcionalidad.' },
];

// Un RequestTemplate de la BD puede entrar al lote si trae campos y contenido.
export const isMultiEligibleTemplate = (t) =>
  !!t && !t.external_route &&
  Array.isArray(t.required_fields) && t.required_fields.length > 0 &&
  typeof t.template_content === 'string';

const ROUTE_GROUP = Object.fromEntries(STATIC_FORMS.map(form => [form.route, form.group]));

// Campos propios de una plantilla de la BD: los que no son datos del paciente ni la fecha.
const ownFields = template => (template.required_fields || [])
  .filter(field => field.field_name !== 'fecha' && !canonicalPatientKey(field.field_name));
const sharedKeys = template => [...new Set((template.required_fields || [])
  .map(field => canonicalPatientKey(field.field_name)).filter(Boolean))];

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function downloadWord(name, content) {
  const bodyHtml = (content || '').split('\n')
    .map(line => line.trim() === '' ? '<p style="margin:0;">&nbsp;</p>' : `<p style="margin:0;">${escapeHtml(line)}</p>`)
    .join('');
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(name)}</title></head>
<body style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color:#000;">
${bodyHtml}
</body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (name || 'plantilla').replace(/[^\w\sáéíóúñ-]/gi, '').trim() || 'plantilla';
  a.download = `${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printContent(title, content) {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    toast.error('No se pudo abrir la vista de impresión.');
    return;
  }
  const bodyHtml = (content || '').split('\n')
    .map(line => line.trim() === '' ? '<p>&nbsp;</p>' : `<p>${escapeHtml(line)}</p>`)
    .join('');
  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; font-size: 12pt; line-height: 1.35; }
  h1 { font-size: 16pt; margin: 0 0 18px; }
  p { margin: 0 0 7px; white-space: pre-wrap; }
</style></head><body><h1>${escapeHtml(title)}</h1>${bodyHtml}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

function renderTemplate(template, data) {
  let content = template.template_content || '';
  (template.required_fields || []).forEach(field => {
    const re = new RegExp(`\\{\\{${field.field_name}\\}\\}`, 'g');
    content = content.replace(re, data[field.field_name] || '___________');
  });
  return content;
}

// Hoja en miniatura con los datos que llevará el documento.
function PaperPreview({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 sm:p-5">
      <div className="mx-auto max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-md">
        <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">Hospital Comunitario de Salud Familiar de Bulnes</p>
        <p className="mt-1 border-b border-slate-200 pb-2 text-center text-sm font-bold text-slate-900">{title}</p>
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}

function FieldRows({ keys, data }) {
  return (
    <dl className="space-y-1 text-[11px]">
      {keys.map(key => {
        const value = String(data[key] || '').trim();
        return (
          <div key={key} className="grid grid-cols-[42%_1fr] gap-2 border-b border-dotted border-slate-200 pb-1">
            <dt className="text-slate-500">{patientFieldLabel(key)}</dt>
            <dd className={value ? 'font-medium text-slate-900' : 'italic text-slate-300'}>{value || 'sin dato'}</dd>
          </div>
        );
      })}
    </dl>
  );
}

// Props opcionales para el flujo "selección múltiple" desde el tab Formularios:
//   initialSelectedIds → documentos ya elegidos (se salta el paso 1)
// Todos los documentos se abren en pestaña nueva para no perder el lote al volver (la antigua
// prop `handoff` ya no cambia nada y se ignora).
export default function MultiTemplateGenerator({ open, templates, onClose, embedded = false, initialSelectedIds = null }) {
  const skipPick = Array.isArray(initialSelectedIds) && initialSelectedIds.length > 0;
  const firstStep = skipPick ? 2 : 1;
  const [step, setStep] = useState(firstStep);
  const [selectedIds, setSelectedIds] = useState(skipPick ? initialSelectedIds : []);
  const [formData, setFormData] = useState({});
  const [contents, setContents] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [opened, setOpened] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const eligibleTemplates = useMemo(() => (templates || []).filter(isMultiEligibleTemplate), [templates]);

  // Todos los documentos posibles, con la misma forma: externos (página propia) y de la BD.
  const allDocs = useMemo(() => [
    ...EXTERNAL_FORMS.map(form => ({
      kind: 'external', id: form.id, name: form.name, description: form.description, group: ROUTE_GROUP[form.route] || 'otros',
      keys: form.fields, own: [], form,
    })),
    ...eligibleTemplates.map(template => ({
      kind: template.type === IMAGE_TYPE ? 'image' : 'template', id: template.id, name: template.name,
      description: template.instructions || template.type, group: (TEMPLATE_TYPE_META[template.type] || TEMPLATE_TYPE_META.default).group,
      keys: sharedKeys(template), own: template.type === IMAGE_TYPE ? [] : ownFields(template), template,
    })),
  ], [eligibleTemplates]);

  // Respeta el orden en que se eligieron.
  const selectedDocs = useMemo(
    () => selectedIds.map(id => allDocs.find(doc => doc.id === id)).filter(Boolean),
    [allDocs, selectedIds]
  );

  const groupedOptions = useMemo(() => FORM_GROUPS
    .map(group => ({ ...group, docs: allDocs.filter(doc => doc.group === group.id) }))
    .filter(group => group.docs.length > 0), [allDocs]);

  // Cuántos documentos usan cada dato del paciente (solo se piden los que alguno usa).
  const usage = useMemo(() => {
    const map = {};
    selectedDocs.forEach(doc => doc.keys.forEach(key => { map[key] = [...(map[key] || []), doc.name]; }));
    return map;
  }, [selectedDocs]);
  const sharedFieldGroups = PATIENT_FIELD_GROUPS
    .map(group => ({ ...group, fields: PATIENT_FIELDS.filter(field => field.group === group.id && usage[field.key]) }))
    .filter(group => group.fields.length > 0);
  const docsWithOwnFields = selectedDocs.filter(doc => doc.own.length > 0);

  const expanded = useMemo(() => expandPatientProfile(formData), [formData]);
  const activeDoc = selectedDocs.find(doc => doc.id === activeId) || selectedDocs[0] || null;

  const toggle = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const reset = () => {
    setStep(firstStep);
    setSelectedIds(skipPick ? initialSelectedIds : []);
    setFormData({});
    setContents({});
    setOpened([]);
    setActiveId(null);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const prepare = () => {
    const data = expandPatientProfile(formData);
    setContents(Object.fromEntries(selectedDocs
      .filter(doc => doc.kind === 'template')
      .map(doc => [doc.id, renderTemplate(doc.template, data)])));
    // Comparte los datos con los formularios que tienen su propia página.
    setMultiPrefill(formData);
    setActiveId(selectedDocs[0]?.id || null);
    setEditing(false);
    setStep(3);
  };

  const markOpened = id => setOpened(prev => prev.includes(id) ? prev : [...prev, id]);
  const textDocs = selectedDocs.filter(doc => doc.kind === 'template');

  const copyText = async (doc) => {
    try {
      await navigator.clipboard.writeText(contents[doc.id] || '');
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(null), 1500);
      toast.success(`"${doc.name}" copiado.`);
    } catch {
      toast.error('No se pudo copiar.');
    }
  };

  const downloadAll = () => {
    textDocs.forEach((doc, i) => setTimeout(() => downloadWord(doc.name, contents[doc.id]), i * 200));
    toast.success(`Descargando ${textDocs.length} documentos...`);
  };

  if (!open) return null;

  const shellClass = embedded
    ? 'bg-white rounded-3xl shadow-xl border border-slate-200 w-full overflow-hidden flex flex-col'
    : 'bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col';
  const bodyClass = embedded ? 'p-6 flex-1' : 'p-6 overflow-y-auto flex-1';
  const stepLabel = step === 1 ? 'Elige los documentos' : step === 2 ? 'Completa los datos del paciente una sola vez' : 'Elige qué documento generar';

  const renderField = field => {
    const value = formData[field.key] || '';
    const used = usage[field.key] || [];
    const control = field.type === 'textarea' ? (
      <Textarea value={value} onChange={e => setField(field.key, e.target.value)} className="min-h-[72px]" placeholder={field.placeholder} />
    ) : field.type === 'select' ? (
      <select value={value} onChange={e => setField(field.key, e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
        <option value="">Sin indicar</option>
        {field.options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    ) : (
      <Input type={field.type || 'text'} value={value} onChange={e => setField(field.key, e.target.value)}
        placeholder={field.key === 'patient_edad' && expanded.patient_edad ? `${expanded.patient_edad} (calculada)` : field.placeholder} />
    );
    return (
      <label key={field.key} className={`block ${field.wide ? 'sm:col-span-2' : ''}`}>
        <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-slate-700">
          {field.label}
          <span className="text-[10px] font-normal text-slate-400" title={used.join(' · ')}>
            {used.length} {used.length === 1 ? 'documento' : 'documentos'}
          </span>
        </span>
        {control}
      </label>
    );
  };

  const docPreview = doc => {
    if (doc.kind === 'image') {
      return (
        <div className="rounded-xl border border-indigo-200 bg-white p-4">
          <p className="mb-3 text-sm text-slate-600">Selecciona los estudios y descarga el documento. Los datos del paciente ya están cargados.</p>
          <ImageProtocolForm embedded />
        </div>
      );
    }
    if (doc.kind === 'template') {
      return (
        <PaperPreview title={doc.name}>
          {editing ? (
            <Textarea value={contents[doc.id] || ''} onChange={e => setContents(prev => ({ ...prev, [doc.id]: e.target.value }))}
              className="min-h-[280px] resize-y font-mono text-[11px]" />
          ) : (
            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-800">{contents[doc.id]}</div>
          )}
        </PaperPreview>
      );
    }
    return (
      <PaperPreview title={doc.name}>
        <FieldRows keys={doc.keys} data={expanded} />
        <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
          <strong className="font-semibold text-slate-600">En el formulario:</strong> {doc.form.next}
        </p>
      </PaperPreview>
    );
  };

  const docActions = doc => {
    if (doc.kind === 'external') {
      return (
        <a href={createPageUrl(doc.form.route)} target="_blank" rel="noopener noreferrer" onClick={() => markOpened(doc.id)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
          <ExternalLink className="h-4 w-4" /> Abrir y generar este documento
        </a>
      );
    }
    if (doc.kind === 'template') {
      return (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { printContent(doc.name, contents[doc.id]); markOpened(doc.id); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          <Button variant="outline" onClick={() => { downloadWord(doc.name, contents[doc.id]); markOpened(doc.id); }} className="gap-2">
            <Download className="h-4 w-4" /> .doc
          </Button>
          <Button variant="outline" onClick={() => copyText(doc)} className="gap-2">
            {copiedId === doc.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} Copiar
          </Button>
          <Button variant="ghost" onClick={() => setEditing(value => !value)} className="gap-2">
            {editing ? <Eye className="h-4 w-4" /> : <PenLine className="h-4 w-4" />} {editing ? 'Ver' : 'Editar'}
          </Button>
          {doc.template.destination_emails?.map(email => (
            <a key={email} href={`mailto:${email}?subject=${encodeURIComponent(doc.name)}&body=${encodeURIComponent(contents[doc.id] || '')}`}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50">
              <Mail className="h-3.5 w-3.5" /> {email}
            </a>
          ))}
        </div>
      );
    }
    return null;
  };

  const content = (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
      className={shellClass}
    >
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <Files className="h-6 w-6" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">Varios documentos para el mismo paciente</h2>
            <p className="text-violet-100 text-sm">
              Paso {skipPick ? step - 1 : step} de {skipPick ? 2 : 3} · {stepLabel}
            </p>
          </div>
        </div>
      </div>

      <div className={bodyClass}>
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Marca los documentos que necesitas. Después escribes los datos del paciente una sola vez y se reparten a todos.
            </p>
            {groupedOptions.map(group => (
              <section key={group.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <group.Icon className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[11px] uppercase tracking-wide font-bold text-slate-500">{group.title}</p>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.docs.map(doc => {
                    const checked = selectedIds.includes(doc.id);
                    return (
                      <button key={doc.id} type="button" onClick={() => toggle(doc.id)}
                        className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${checked ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200'}`}>
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>✓</span>
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold ${checked ? 'text-violet-800' : 'text-slate-900'}`}>{doc.name}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{doc.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-1.5">
              {selectedDocs.map(doc => (
                <span key={doc.id} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">{doc.name}</span>
              ))}
            </div>
            {sharedFieldGroups.map(group => (
              <section key={group.id}>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{group.title}</p>
                <div className="grid gap-4 sm:grid-cols-2">{group.fields.map(renderField)}</div>
              </section>
            ))}
            {docsWithOwnFields.map(doc => (
              <section key={doc.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Solo para {doc.name}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {doc.own.map(field => (
                    <label key={field.field_name} className={`block ${field.field_type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">{field.field_label}</span>
                      {field.field_type === 'textarea' ? (
                        <Textarea value={formData[field.field_name] || ''} onChange={e => setField(field.field_name, e.target.value)} className="min-h-[72px] bg-white" />
                      ) : (
                        <Input type={field.field_type || 'text'} value={formData[field.field_name] || ''} onChange={e => setField(field.field_name, e.target.value)} className="bg-white" />
                      )}
                    </label>
                  ))}
                </div>
              </section>
            ))}
            {sharedFieldGroups.length === 0 && docsWithOwnFields.length === 0 && (
              <p className="text-sm italic text-slate-500">Estos documentos no necesitan datos previos.</p>
            )}
            <p className="border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500">
              Solo se piden los datos que usa al menos uno de los {selectedDocs.length} documentos elegidos. Ninguno es obligatorio: lo que falte se completa en cada documento.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div>
                <p className="font-bold text-emerald-900">Datos cargados{formData.patient_name ? ` para ${formData.patient_name}` : ''}</p>
                <p className="text-sm text-emerald-800">Elige un documento, revisa la vista previa y genéralo. Puedes volver por el siguiente.</p>
              </div>
              {textDocs.length > 1 && (
                <Button onClick={downloadAll} variant="outline" className="gap-2 bg-white">
                  <Download className="h-4 w-4" /> Descargar los {textDocs.length} de texto
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-[240px_1fr]">
              <ol className="space-y-1.5">
                {selectedDocs.map((doc, idx) => {
                  const active = activeDoc?.id === doc.id;
                  const done = opened.includes(doc.id);
                  return (
                    <li key={doc.id}>
                      <button type="button" onClick={() => { setActiveId(doc.id); setEditing(false); }}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${active ? 'border-violet-400 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'}`}>
                        {done
                          ? <CircleCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                          : <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>}
                        <span className="min-w-0 flex-1 truncate font-medium">{doc.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              {activeDoc && (
                <div className="min-w-0 space-y-3">
                  <div>
                    <p className="text-base font-bold text-slate-900">{activeDoc.name}</p>
                    <p className="text-xs text-slate-500">Vista previa de lo que saldrá con los datos cargados.</p>
                  </div>
                  {docPreview(activeDoc)}
                  {docActions(activeDoc)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={handleClose}>{embedded ? 'Volver' : 'Cerrar'}</Button>
        <div className="flex gap-2">
          {step > firstStep && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> {step === 3 ? 'Editar datos' : 'Atrás'}
            </Button>
          )}
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={selectedDocs.length === 0} className="bg-violet-600 hover:bg-violet-700 gap-1">
              Siguiente ({selectedDocs.length} {selectedDocs.length === 1 ? 'elegido' : 'elegidos'}) <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={prepare} className="bg-violet-600 hover:bg-violet-700 gap-1">
              Ver documentos <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={reset} variant="outline">Otro paciente</Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (embedded) return content;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {content}
    </motion.div>
  );
}
