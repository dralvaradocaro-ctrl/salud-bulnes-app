import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronLeft, Download, Copy, Check, Mail, ExternalLink, Printer, PenLine, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { setMultiPrefill } from '@/lib/multiTemplatePrefill';
import { FORM_GROUPS, STATIC_FORMS, TEMPLATE_TYPE_META } from '@/lib/workspaceCatalog';
import { PATIENT_FIELDS, canonicalPatientKey, expandPatientProfile } from '@/lib/patientProfile';
import { DIAGNOSTICOS_FRECUENTES, PREVISIONES, SERVICIOS, salaCamaDelServicio } from '@/lib/hospitalSuggestions';
import ImageProtocolForm from './ImageProtocolForm';

const IMAGE_TYPE = 'Protocolo Imágenes';

// Las mismas listas que ofrecen los formularios originales (se elige o se escribe).
const FIELD_SUGGESTIONS = {
  servicio: SERVICIOS,
  prevision: PREVISIONES,
  patient_comuna: ['Bulnes', 'Santa Clara', 'Quillón', 'San Ignacio', 'Pemuco', 'Chillán', 'Chillán Viejo'],
};
// Valores que los formularios originales ya traen por defecto.
const FIELD_DEFAULTS = { patient_comuna: 'Bulnes' };

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
  { id: 'ext-adecuacion', name: 'Adecuación y límites terapéuticos', route: 'AdecuacionTerapeutica', description: 'AET, no RCP, no IOT, no UCI y confort.',
    fields: ['patient_name', 'patient_rut', 'patient_edad', 'diagnostico', 'resumen_caso'],
    next: 'Marcas el plan terapéutico, las medidas de soporte y quién participa.' },
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

// Hoja con los datos que llevará el documento.
function PaperPreview({ title, children }) {
  return (
    <div className="mx-auto w-full max-w-[680px] rounded-md border border-slate-200 bg-white p-8 shadow-md">
      <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hospital Comunitario de Salud Familiar de Bulnes</p>
      <p className="mt-1 border-b border-slate-200 pb-3 text-center text-base font-bold text-slate-900">{title}</p>
      <div className="pt-4">{children}</div>
    </div>
  );
}

// Vista dividida: a la izquierda se eligen los documentos y se llenan los datos (solo los que
// usa al menos uno de los elegidos); a la derecha, la vista previa del documento activo con
// sus botones. `allowedRoutes` limita los formularios con página propia (p. ej. por categoría).
export default function MultiTemplateGenerator({ templates, allowedRoutes = null, initialSelectedIds = [], initialData = {}, onClose }) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [formData, setFormData] = useState(() => ({ ...FIELD_DEFAULTS, ...initialData }));
  const [frameVersion, setFrameVersion] = useState({});
  const [frameData, setFrameData] = useState({});
  const [edited, setEdited] = useState({});
  const [activeId, setActiveId] = useState(initialSelectedIds[0] || null);
  const [editing, setEditing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(initialSelectedIds.length === 0);

  const eligibleTemplates = useMemo(() => (templates || []).filter(isMultiEligibleTemplate), [templates]);

  const allDocs = useMemo(() => [
    ...EXTERNAL_FORMS
      .filter(form => !allowedRoutes || allowedRoutes.includes(form.route))
      .map(form => ({ kind: 'external', id: form.id, name: form.name, group: ROUTE_GROUP[form.route] || 'otros', keys: form.fields, own: [], form })),
    ...eligibleTemplates.map(template => ({
      kind: template.type === IMAGE_TYPE ? 'image' : 'template', id: template.id, name: template.name,
      group: (TEMPLATE_TYPE_META[template.type] || TEMPLATE_TYPE_META.default).group,
      keys: sharedKeys(template), own: template.type === IMAGE_TYPE ? [] : ownFields(template), template,
    })),
  ], [eligibleTemplates, allowedRoutes]);

  const selectedDocs = useMemo(
    () => selectedIds.map(id => allDocs.find(doc => doc.id === id)).filter(Boolean),
    [allDocs, selectedIds]
  );
  const groupedOptions = useMemo(() => FORM_GROUPS
    .map(group => ({ ...group, docs: allDocs.filter(doc => doc.group === group.id) }))
    .filter(group => group.docs.length > 0), [allDocs]);

  const usage = useMemo(() => {
    const map = {};
    selectedDocs.forEach(doc => doc.keys.forEach(key => { map[key] = [...(map[key] || []), doc.name]; }));
    return map;
  }, [selectedDocs]);
  const sharedFields = PATIENT_FIELDS.filter(field => usage[field.key]);
  const docsWithOwnFields = selectedDocs.filter(doc => doc.own.length > 0);

  const expanded = useMemo(() => expandPatientProfile(formData), [formData]);
  const activeDoc = selectedDocs.find(doc => doc.id === activeId) || selectedDocs[0] || null;

  // Los formularios con página propia leen estos datos al abrirse.
  useEffect(() => { setMultiPrefill(formData); }, [formData]);

  const contentOf = doc => edited[doc.id] ?? renderTemplate(doc.template, expanded);
  const toggle = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (!selectedIds.includes(id)) { setActiveId(id); setEditing(false); }
  };
  const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const copyText = async doc => {
    try {
      await navigator.clipboard.writeText(contentOf(doc));
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error('No se pudo copiar.');
    }
  };

  const renderField = field => {
    const value = formData[field.key] || '';
    const suggestions = field.key === 'cama' ? salaCamaDelServicio(formData.servicio) : FIELD_SUGGESTIONS[field.key];
    const control = field.type === 'textarea' ? (
      <>
        <Textarea value={value} onChange={e => setField(field.key, e.target.value)} className="min-h-[64px] bg-white" placeholder={field.placeholder} />
        {field.key === 'diagnostico' && (
          <select value="" onChange={e => e.target.value && setField('diagnostico', value ? `${value}\n${e.target.value}` : e.target.value)}
            className="mt-1 h-8 w-full rounded-md border border-input bg-white px-2 text-xs text-slate-600">
            <option value="">+ Diagnóstico frecuente…</option>
            {DIAGNOSTICOS_FRECUENTES.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        )}
      </>
    ) : field.type === 'select' ? (
      <select value={value} onChange={e => setField(field.key, e.target.value)} className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm">
        <option value="">Sin indicar</option>
        {field.options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    ) : (
      <>
        <Input type={field.type || 'text'} value={value} onChange={e => setField(field.key, e.target.value)} className="h-9 bg-white"
          list={suggestions ? `multi-${field.key}` : undefined}
          placeholder={field.key === 'patient_edad' && expanded.patient_edad ? `${expanded.patient_edad} (calculada)` : field.placeholder} />
        {suggestions && <datalist id={`multi-${field.key}`}>{suggestions.map(option => <option key={option} value={option} />)}</datalist>}
      </>
    );
    return (
      <label key={field.key} className={`block ${field.wide ? 'sm:col-span-2' : ''}`} title={(usage[field.key] || []).join(' · ')}>
        <span className="mb-1 block text-xs font-medium text-slate-600">{field.label}</span>
        {control}
      </label>
    );
  };

  const preview = doc => {
    if (doc.kind === 'image') {
      return <div className="mx-auto w-full max-w-[680px] rounded-xl border border-slate-200 bg-white p-4"><ImageProtocolForm key={doc.id} embedded /></div>;
    }
    if (doc.kind === 'template') {
      return (
        <PaperPreview title={doc.name}>
          {editing
            ? <Textarea value={contentOf(doc)} onChange={e => setEdited(prev => ({ ...prev, [doc.id]: e.target.value }))} className="min-h-[420px] resize-y font-mono text-xs" />
            : <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-800">{contentOf(doc)}</div>}
        </PaperPreview>
      );
    }
    // El formulario original, embebido y prellenado. Se recarga solo a pedido para no borrar
    // lo que se haya escrito dentro de él.
    const version = frameVersion[doc.id] || 0;
    const stale = JSON.stringify(frameData[doc.id] ?? formData) !== JSON.stringify(formData);
    return (
      <div className="flex h-full min-h-[70vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
          <span className="flex-1">{doc.form.next}</span>
          {stale && <button type="button" onClick={() => { setMultiPrefill(formData); setFrameData(prev => ({ ...prev, [doc.id]: formData })); setFrameVersion(prev => ({ ...prev, [doc.id]: version + 1 })); }}
            className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800 hover:bg-amber-200">Cargar datos nuevos</button>}
          <a href={createPageUrl(doc.form.route)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"><ExternalLink className="h-3.5 w-3.5" /> Pestaña nueva</a>
        </div>
        <iframe key={`${doc.id}-${version}`} title={doc.name} src={createPageUrl(`${doc.form.route}?embed=1`)} className="min-h-0 w-full flex-1"
          onLoad={() => setFrameData(prev => (prev[doc.id] ? prev : { ...prev, [doc.id]: formData }))} />
      </div>
    );
  };

  const actions = doc => {
    if (doc.kind === 'template') {
      return (
        <>
          <Button size="sm" onClick={() => printContent(doc.name, contentOf(doc))} className="gap-1.5 bg-violet-600 hover:bg-violet-700"><Printer className="h-4 w-4" /> Imprimir</Button>
          <Button size="sm" variant="outline" onClick={() => downloadWord(doc.name, contentOf(doc))} className="gap-1.5"><Download className="h-4 w-4" /> .doc</Button>
          <Button size="sm" variant="outline" onClick={() => copyText(doc)} className="gap-1.5">{copiedId === doc.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} Copiar</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(value => !value)} className="gap-1.5">{editing ? <Eye className="h-4 w-4" /> : <PenLine className="h-4 w-4" />} {editing ? 'Ver' : 'Editar'}</Button>
          {doc.template.destination_emails?.map(email => (
            <a key={email} href={`mailto:${email}?subject=${encodeURIComponent(doc.name)}&body=${encodeURIComponent(contentOf(doc))}`}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"><Mail className="h-3.5 w-3.5" /> {email}</a>
          ))}
        </>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onClose} title="Volver"><ChevronLeft className="h-5 w-5" /></Button>
        <h1 className="flex-1 truncate text-lg font-bold text-slate-900">Varios documentos{formData.patient_name ? ` · ${formData.patient_name}` : ''}</h1>
        {selectedDocs.length > 0 && <Button variant="ghost" size="sm" onClick={() => { setSelectedIds([]); setFormData({}); setEdited({}); }} className="text-slate-500">Otro paciente</Button>}
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[420px_1fr]">
        <aside className="min-h-0 space-y-5 overflow-y-auto border-r border-slate-200 bg-white p-4 md:pb-24">
          <section className="rounded-xl border border-slate-200">
            <button type="button" onClick={() => setPickerOpen(open => !open)} aria-expanded={pickerOpen}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
              <span className="flex-1 text-sm font-semibold text-slate-800">
                Documentos{selectedDocs.length > 0 && <span className="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">{selectedDocs.length}</span>}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {!pickerOpen && selectedDocs.length > 0 && (
              <p className="px-3 pb-2.5 text-xs text-slate-500">{selectedDocs.map(doc => doc.name).join(' · ')}</p>
            )}
            {pickerOpen && (
              <div className="space-y-3 border-t border-slate-100 px-3 py-3">
                {groupedOptions.map(group => (
                  <div key={group.id}>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{group.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.docs.map(doc => {
                        const checked = selectedIds.includes(doc.id);
                        return (
                          <button key={doc.id} type="button" onClick={() => toggle(doc.id)} aria-pressed={checked}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${checked ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'}`}>
                            {checked && <Check className="h-3 w-3" />}{doc.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {selectedDocs.length > 0 && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setPickerOpen(false)} className="bg-violet-600 hover:bg-violet-700">Listo</Button>
                  </div>
                )}
              </div>
            )}
          </section>

          {selectedDocs.length > 0 && (
            <section className="space-y-4" onFocusCapture={() => setPickerOpen(false)}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Datos del paciente</p>
              {sharedFields.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{sharedFields.map(renderField)}</div>}
              {docsWithOwnFields.map(doc => (
                <div key={doc.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">{doc.name}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {doc.own.map(field => (
                      <label key={field.field_name} className={`block ${field.field_type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                        <span className="mb-1 block text-xs font-medium text-slate-600">{field.field_label}</span>
                        {field.field_type === 'textarea'
                          ? <Textarea value={formData[field.field_name] || ''} onChange={e => setField(field.field_name, e.target.value)} className="min-h-[64px] bg-white" />
                          : <Input type={field.field_type || 'text'} value={formData[field.field_name] || ''} onChange={e => setField(field.field_name, e.target.value)} className="h-9 bg-white" />}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </aside>

        <main className="flex min-h-[70vh] min-w-0 flex-col lg:min-h-0">
          {activeDoc ? (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {selectedDocs.map(doc => (
                    <button key={doc.id} type="button" onClick={() => { setActiveId(doc.id); setEditing(false); }}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${activeDoc.id === doc.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                      {doc.name}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">{actions(activeDoc)}</div>
              </div>
              <div className={`min-h-0 flex-1 p-4 sm:p-6 md:pb-24 ${activeDoc.kind === 'external' ? 'flex flex-col' : 'overflow-y-auto'}`}>{preview(activeDoc)}</div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-sm text-slate-400">Elige uno o más documentos a la izquierda.</div>
          )}
        </main>
      </div>
    </div>
  );
}
