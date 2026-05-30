import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  FileText,
  Files,
  Mail,
  ExternalLink,
  Printer,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { setMultiPrefill } from '@/lib/multiTemplatePrefill';

const EXTERNAL_FORMS = [
  {
    id: 'ext-solicitud-examenes',
    name: 'Solicitud de Exámenes — Hospital de Bulnes',
    type: 'Hospitalizados',
    description: 'Formulario COD. 32 para laboratorio e imagenología.',
    route: 'SolicitudExamenes',
    shared_fields: [
      { field_name: 'patient_name', field_label: 'Nombre del paciente (Apellidos, Nombres)', field_type: 'text' },
      { field_name: 'patient_rut', field_label: 'RUT del paciente', field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento', field_type: 'date' },
      { field_name: 'n_ficha', field_label: 'N° de ficha', field_type: 'text' },
      { field_name: 'prevision', field_label: 'Previsión (Fonasa, Isapre, etc.)', field_type: 'text' },
      { field_name: 'diagnostico', field_label: 'Diagnóstico', field_type: 'textarea' },
    ],
  },
  {
    id: 'ext-formulario-ges',
    name: 'Formulario de Constancia GES',
    type: 'GES',
    description: 'Constancia de información al paciente GES.',
    route: 'FormularioGES',
    shared_fields: [
      { field_name: 'patient_name', field_label: 'Nombre del paciente (Apellidos, Nombres)', field_type: 'text' },
      { field_name: 'patient_rut', field_label: 'RUT del paciente', field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento', field_type: 'date' },
      { field_name: 'patient_direccion', field_label: 'Dirección', field_type: 'text' },
      { field_name: 'patient_comuna', field_label: 'Comuna', field_type: 'text' },
      { field_name: 'patient_telefono', field_label: 'Teléfono', field_type: 'text' },
      { field_name: 'patient_correo', field_label: 'Correo electrónico', field_type: 'text' },
    ],
  },
  {
    id: 'ext-informe-biomedico',
    name: 'Informe Biomédico Funcional',
    type: 'Policlínico',
    description: 'Informe biomédico y funcional editable.',
    route: 'InformeBiomedico',
    shared_fields: [
      { field_name: 'patient_name', field_label: 'Nombre del paciente (Apellidos, Nombres)', field_type: 'text' },
      { field_name: 'patient_rut', field_label: 'RUT del paciente', field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento', field_type: 'date' },
    ],
  },
  {
    id: 'ext-ira-grave',
    name: 'Formulario IRA grave y 2019-nCoV (ISP)',
    type: 'Hospitalizados',
    description: 'Notificación inmediata y envío de muestras al ISP.',
    route: 'FormularioIRAGrave',
    shared_fields: [
      { field_name: 'patient_name', field_label: 'Nombre del paciente (Apellidos, Nombres)', field_type: 'text' },
      { field_name: 'patient_rut', field_label: 'RUT del paciente', field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento', field_type: 'date' },
      { field_name: 'patient_direccion', field_label: 'Dirección', field_type: 'text' },
      { field_name: 'patient_comuna', field_label: 'Comuna', field_type: 'text' },
      { field_name: 'patient_telefono', field_label: 'Teléfono', field_type: 'text' },
      { field_name: 'prevision', field_label: 'Previsión (Fonasa, Isapre, etc.)', field_type: 'text' },
    ],
  },
  {
    id: 'ext-solicitud-microbio',
    name: 'Solicitud de Exámenes Microbiológicos (C 162)',
    type: 'Hospitalizados',
    description: 'Cultivos, directos al fresco y estudios virológicos.',
    route: 'SolicitudMicrobiologia',
    shared_fields: [
      { field_name: 'patient_name', field_label: 'Nombre del paciente', field_type: 'text' },
      { field_name: 'patient_rut', field_label: 'RUT del paciente', field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento', field_type: 'date' },
      { field_name: 'prevision', field_label: 'Previsión', field_type: 'text' },
      { field_name: 'diagnostico', field_label: 'Diagnóstico probable', field_type: 'textarea' },
    ],
  },
  {
    id: 'ext-farmaco-restringido',
    name: 'Solicitud de Fármaco de Uso Restringido',
    type: 'Hospitalizados',
    description: 'Antibióticos de amplio espectro y fármacos ocasionales.',
    route: 'SolicitudFarmacoRestringido',
    shared_fields: [
      { field_name: 'patient_name', field_label: 'Nombre del paciente', field_type: 'text' },
      { field_name: 'patient_rut', field_label: 'RUT del paciente', field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento', field_type: 'date' },
      { field_name: 'prevision', field_label: 'Previsión', field_type: 'text' },
      { field_name: 'patient_comuna', field_label: 'Comuna de origen', field_type: 'text' },
      { field_name: 'n_ficha', field_label: 'N° Ficha', field_type: 'text' },
      { field_name: 'diagnostico', field_label: 'Diagnóstico', field_type: 'textarea' },
    ],
  },
];

const DOC_CATEGORY_ORDER = ['GES', 'Hospitalizados', 'Policlínico', 'Formularios de solicitud', 'Otros'];

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

export default function MultiTemplateGenerator({ open, templates, onClose, embedded = false }) {
  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formData, setFormData] = useState({});
  const [generated, setGenerated] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [activePreviewId, setActivePreviewId] = useState(null);

  const eligibleTemplates = useMemo(
    () => (templates || []).filter(t =>
      !t.external_route &&
      Array.isArray(t.required_fields) &&
      t.required_fields.length > 0 &&
      typeof t.template_content === 'string'
    ),
    [templates]
  );

  const selectedTemplates = useMemo(
    () => eligibleTemplates.filter(t => selectedIds.includes(t.id)),
    [eligibleTemplates, selectedIds]
  );

  const selectedExternal = useMemo(
    () => EXTERNAL_FORMS.filter(f => selectedIds.includes(f.id)),
    [selectedIds]
  );

  const anySelected = selectedTemplates.length + selectedExternal.length;

  const groupedOptions = useMemo(() => {
    const groups = new Map();
    const add = (category, item) => {
      const key = category || 'Otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    };
    EXTERNAL_FORMS.forEach(ext => add(ext.type, { kind: 'external', ...ext }));
    eligibleTemplates.forEach(t => add(t.type || 'Formularios de solicitud', { kind: 'template', ...t }));
    return Array.from(groups.entries()).sort(([a], [b]) => {
      const ai = DOC_CATEGORY_ORDER.indexOf(a);
      const bi = DOC_CATEGORY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b, 'es');
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [eligibleTemplates]);

  const unionFields = useMemo(() => {
    const seen = new Map();
    selectedTemplates.forEach(t => {
      (t.required_fields || []).forEach(f => {
        if (!seen.has(f.field_name)) seen.set(f.field_name, f);
      });
    });
    selectedExternal.forEach(ext => {
      (ext.shared_fields || []).forEach(f => {
        if (!seen.has(f.field_name)) seen.set(f.field_name, f);
      });
    });
    return Array.from(seen.values());
  }, [selectedTemplates, selectedExternal]);

  const toggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const reset = () => {
    setStep(1);
    setSelectedIds([]);
    setFormData({});
    setGenerated([]);
    setActivePreviewId(null);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const generateAll = () => {
    const out = selectedTemplates.map(t => ({
      template: t,
      content: renderTemplate(t, formData),
    }));
    setGenerated(out);
    setActivePreviewId(out[0]?.template.id || selectedExternal[0]?.id || null);
    if (selectedExternal.length > 0) setMultiPrefill(formData);
    setStep(3);
  };

  const copyAll = async () => {
    const text = generated.map(g => `===== ${g.template.name} =====\n\n${g.content}`).join('\n\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${generated.length} documentos copiados al portapapeles.`);
    } catch {
      toast.error('No se pudo copiar al portapapeles.');
    }
  };

  const copyOne = async (g) => {
    try {
      await navigator.clipboard.writeText(g.content);
      setCopiedId(g.template.id);
      setTimeout(() => setCopiedId(null), 1500);
      toast.success(`"${g.template.name}" copiado.`);
    } catch {
      toast.error('No se pudo copiar.');
    }
  };

  const downloadAll = () => {
    generated.forEach((g, i) => setTimeout(() => downloadWord(g.template.name, g.content), i * 200));
    toast.success(`Descargando ${generated.length} documentos...`);
  };

  const updateGeneratedContent = (id, content) => {
    setGenerated(prev => prev.map(g => g.template.id === id ? { ...g, content } : g));
  };

  if (!open) return null;

  const activeGenerated = generated.find(g => g.template.id === activePreviewId);
  const activeExternal = selectedExternal.find(ext => ext.id === activePreviewId);
  const shellClass = embedded
    ? 'bg-white rounded-3xl shadow-xl border border-slate-200 w-full overflow-hidden flex flex-col'
    : 'bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col';
  const bodyClass = embedded ? 'p-6 flex-1' : 'p-6 overflow-y-auto flex-1';

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
            <h2 className="text-xl font-bold">Generar documentos clínicos</h2>
            <p className="text-violet-100 text-sm">
              Paso {step} de 3 · {step === 1 ? 'Elige documentos por categoría' : step === 2 ? 'Completa los datos una sola vez' : 'Documentos listos'}
            </p>
          </div>
        </div>
      </div>

      <div className={bodyClass}>
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Marca los documentos que quieres preparar. Luego llenas los datos del paciente una sola vez y se comparten entre todos los formularios seleccionados.
            </p>

            {groupedOptions.map(([category, items]) => (
              <section key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] uppercase tracking-wide font-bold text-slate-500">{category}</p>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                {items.map(item => {
                  const checked = selectedIds.includes(item.id);
                  const isExternal = item.kind === 'external';
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        checked
                          ? isExternal ? 'border-cyan-400 bg-cyan-50' : 'border-violet-400 bg-violet-50'
                          : isExternal ? 'border-slate-200 bg-white hover:border-cyan-200' : 'border-slate-200 bg-white hover:border-violet-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? isExternal ? 'border-cyan-500 bg-cyan-600 text-white' : 'border-violet-500 bg-violet-600 text-white'
                            : 'border-slate-300 bg-white text-transparent'
                        }`}>✓</span>
                        <div className="flex-1">
                          <p className={`font-semibold ${checked ? (isExternal ? 'text-cyan-800' : 'text-violet-800') : 'text-slate-900'}`}>{item.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isExternal ? item.description : `${item.type || 'Formulario'} · ${item.required_fields?.length || 0} campos`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </section>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {unionFields.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay campos para llenar.</p>
            ) : unionFields.map((field, idx) => (
              <div key={`${field.field_name}-${idx}`}>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  {field.field_label}
                  <span className="ml-2 text-[10px] uppercase text-slate-400">{field.field_type || 'text'}</span>
                </Label>
                {field.field_type === 'textarea' ? (
                  <Textarea
                    value={formData[field.field_name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                    className="min-h-[80px]"
                    placeholder={`Ingrese ${field.field_label.toLowerCase()}`}
                  />
                ) : (
                  <Input
                    type={field.field_type || 'text'}
                    value={formData[field.field_name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                    placeholder={`Ingrese ${field.field_label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
            <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
              {unionFields.length} campos únicos para {anySelected} documentos. Los nombres iguales se llenan una sola vez.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="font-bold text-emerald-900">Documentos listos</p>
              <p className="text-sm text-emerald-800">Selecciona un documento para revisar la vista previa, editarlo si corresponde e imprimirlo.</p>
            </div>

            {generated.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadAll} className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Download className="h-4 w-4" /> Descargar todos (.doc)
                </Button>
                <Button onClick={copyAll} variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" /> Copiar todo
                </Button>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
              <div className="space-y-2">
                {selectedExternal.map(ext => (
                  <button
                    key={ext.id}
                    onClick={() => setActivePreviewId(ext.id)}
                    className={`w-full text-left flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                      activePreviewId === ext.id ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-cyan-700" />
                    <span className="text-sm font-semibold text-slate-800">{ext.name}</span>
                  </button>
                ))}
                {generated.map(g => (
                  <button
                    key={g.template.id}
                    onClick={() => setActivePreviewId(g.template.id)}
                    className={`w-full text-left flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                      activePreviewId === g.template.id ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Edit3 className="h-4 w-4 text-violet-700" />
                    <span className="text-sm font-semibold text-slate-800">{g.template.name}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden min-h-[340px]">
                {activeExternal ? (
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{activeExternal.name}</p>
                      <p className="text-sm text-slate-600 mt-1">Este formulario oficial se abre con los datos compartidos ya cargados para completar sus campos específicos antes de imprimir.</p>
                    </div>
                    <a
                      href={createPageUrl(activeExternal.route)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                    >
                      Abrir formulario editable <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : activeGenerated ? (
                  <div className="flex h-full flex-col">
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="font-semibold text-sm text-slate-800 flex-1">{activeGenerated.template.name}</p>
                      <button onClick={() => copyOne(activeGenerated)} className="text-xs text-slate-600 hover:text-violet-700 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white">
                        {copiedId === activeGenerated.template.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedId === activeGenerated.template.id ? 'Copiado' : 'Copiar'}
                      </button>
                      <button onClick={() => downloadWord(activeGenerated.template.name, activeGenerated.content)} className="text-xs text-slate-600 hover:text-blue-700 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white">
                        <Download className="h-3.5 w-3.5" /> .doc
                      </button>
                      <button onClick={() => printContent(activeGenerated.template.name, activeGenerated.content)} className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white">
                        <Printer className="h-3.5 w-3.5" /> Imprimir
                      </button>
                    </div>
                    <Textarea
                      value={activeGenerated.content}
                      onChange={(e) => updateGeneratedContent(activeGenerated.template.id, e.target.value)}
                      className="min-h-[300px] flex-1 resize-y rounded-none border-0 font-mono text-xs focus-visible:ring-0"
                    />
                    {activeGenerated.template.destination_emails?.length > 0 && (
                      <div className="px-4 py-2 bg-blue-50/40 border-t border-blue-100 flex items-center gap-2 flex-wrap">
                        <Mail className="h-3.5 w-3.5 text-blue-700" />
                        <span className="text-[11px] text-blue-700 font-medium">Enviar a:</span>
                        {activeGenerated.template.destination_emails.map((email, i) => (
                          <a key={i} href={`mailto:${email}?subject=${encodeURIComponent(activeGenerated.template.name)}&body=${encodeURIComponent(activeGenerated.content)}`} className="text-[11px] px-2 py-0.5 bg-white border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100">{email}</a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 text-sm text-slate-500">Selecciona un documento para revisar.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={handleClose}>{embedded ? 'Volver' : 'Cerrar'}</Button>
        <div className="flex gap-2">
          {step > 1 && step < 3 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Atrás
            </Button>
          )}
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={anySelected === 0}
              className="bg-violet-600 hover:bg-violet-700 gap-1"
            >
              Siguiente ({anySelected} {anySelected === 1 ? 'elegido' : 'elegidos'}) <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={generateAll} className="bg-blue-600 hover:bg-blue-700 gap-2">
              {selectedTemplates.length > 0 && selectedExternal.length > 0
                ? `Preparar ${anySelected} documentos`
                : selectedTemplates.length > 0
                  ? `Generar ${selectedTemplates.length} documentos`
                  : 'Preparar formularios'}
            </Button>
          )}
          {step === 3 && (
            <Button onClick={reset} variant="outline">Generar otro lote</Button>
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {content}
    </motion.div>
  );
}
