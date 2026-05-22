import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Download, Copy, Check, FileText, Files, Mail, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { setMultiPrefill } from '@/lib/multiTemplatePrefill';

// Formularios oficiales externos (páginas dedicadas). Cada uno declara qué
// campos comunes del paciente sabe prellenar — entran al wizard como una
// "pseudo-plantilla" que el usuario puede marcar junto con las demás.
const EXTERNAL_FORMS = [
  {
    id: 'ext-solicitud-examenes',
    name: 'Solicitud de Exámenes — Hospital de Bulnes',
    type: 'Formulario Oficial',
    route: 'SolicitudExamenes',
    shared_fields: [
      { field_name: 'patient_name',      field_label: 'Nombre del paciente (Apellidos, Nombres)', field_type: 'text' },
      { field_name: 'patient_rut',       field_label: 'RUT del paciente',                          field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento',                       field_type: 'date' },
      { field_name: 'n_ficha',           field_label: 'N° de ficha',                               field_type: 'text' },
      { field_name: 'prevision',         field_label: 'Previsión (Fonasa, Isapre, etc.)',          field_type: 'text' },
      { field_name: 'diagnostico',       field_label: 'Diagnóstico',                               field_type: 'textarea' },
    ],
  },
  {
    id: 'ext-formulario-ges',
    name: 'Formulario de Constancia GES',
    type: 'Formulario Oficial',
    route: 'FormularioGES',
    shared_fields: [
      { field_name: 'patient_name',      field_label: 'Nombre del paciente (Apellidos, Nombres)', field_type: 'text' },
      { field_name: 'patient_rut',       field_label: 'RUT del paciente',                          field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento',                       field_type: 'date' },
      { field_name: 'patient_direccion', field_label: 'Dirección',                                 field_type: 'text' },
      { field_name: 'patient_comuna',    field_label: 'Comuna',                                    field_type: 'text' },
      { field_name: 'patient_telefono',  field_label: 'Teléfono',                                  field_type: 'text' },
      { field_name: 'patient_correo',    field_label: 'Correo electrónico',                        field_type: 'text' },
    ],
  },
  {
    id: 'ext-informe-biomedico',
    name: 'Informe Biomédico Funcional',
    type: 'Formulario Oficial',
    route: 'InformeBiomedico',
    shared_fields: [
      { field_name: 'patient_name',      field_label: 'Nombre del paciente (Apellidos, Nombres)', field_type: 'text' },
      { field_name: 'patient_rut',       field_label: 'RUT del paciente',                          field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento',                       field_type: 'date' },
    ],
  },
  {
    id: 'ext-ira-grave',
    name: 'Formulario IRA grave y 2019-nCoV (ISP)',
    type: 'Formulario Oficial',
    route: 'FormularioIRAGrave',
    shared_fields: [
      { field_name: 'patient_name',      field_label: 'Nombre del paciente (Apellidos, Nombres)', field_type: 'text' },
      { field_name: 'patient_rut',       field_label: 'RUT del paciente',                          field_type: 'text' },
      { field_name: 'patient_fecha_nac', field_label: 'Fecha de nacimiento',                       field_type: 'date' },
      { field_name: 'patient_direccion', field_label: 'Dirección',                                 field_type: 'text' },
      { field_name: 'patient_comuna',    field_label: 'Comuna',                                    field_type: 'text' },
      { field_name: 'patient_telefono',  field_label: 'Teléfono',                                  field_type: 'text' },
      { field_name: 'prevision',         field_label: 'Previsión (Fonasa, Isapre, etc.)',          field_type: 'text' },
    ],
  },
];

// Genera un .doc (HTML-Word) descargable a partir de un texto plano. Cada
// salto de linea se convierte en parrafo. Mismo motor que RequestForm.
function downloadWord(name, content) {
  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const bodyHtml = (content || '').split('\n')
    .map(line => line.trim() === ''
      ? '<p style="margin:0;">&nbsp;</p>'
      : `<p style="margin:0;">${escapeHtml(line)}</p>`)
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

function renderTemplate(template, data) {
  let content = template.template_content || '';
  (template.required_fields || []).forEach(field => {
    const re = new RegExp(`\\{\\{${field.field_name}\\}\\}`, 'g');
    content = content.replace(re, data[field.field_name] || '___________');
  });
  return content;
}

export default function MultiTemplateGenerator({ open, templates, onClose }) {
  // 3 pasos: 1) elegir plantillas  2) llenar datos  3) ver/descargar resultados
  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formData, setFormData] = useState({});
  const [generated, setGenerated] = useState([]);   // [{template, content}]
  const [copiedId, setCopiedId] = useState(null);

  const eligibleTemplates = useMemo(
    () => (templates || []).filter(t =>
      !t.external_route &&
      Array.isArray(t.required_fields) && t.required_fields.length > 0 &&
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

  // Union de required_fields (templates DB) + shared_fields (formularios
  // externos), dedup por field_name. Conserva la primera definicion vista.
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

  const toggle = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const reset = () => {
    setStep(1);
    setSelectedIds([]);
    setFormData({});
    setGenerated([]);
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
    // Disponibiliza los datos compartidos para los formularios oficiales
    // externos: cuando el usuario abra Solicitud de Exámenes / GES / Informe
    // Biomedico desde la sección de resultados, esas paginas leen el payload
    // y prellenan sus campos.
    if (selectedExternal.length > 0) setMultiPrefill(formData);
    setStep(3);
  };

  const copyAll = async () => {
    const text = generated
      .map(g => `═════════ ${g.template.name} ═════════\n\n${g.content}`)
      .join('\n\n\n');
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
    toast.success(`Descargando ${generated.length} documentos…`);
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <Files className="h-6 w-6" />
            <div className="flex-1">
              <h2 className="text-xl font-bold">Generar varias solicitudes para el mismo paciente</h2>
              <p className="text-violet-100 text-sm">
                Paso {step} de 3 · {step === 1 ? 'Elige las plantillas' : step === 2 ? 'Completa los datos una sola vez' : 'Documentos generados'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-2">
                Marca las plantillas que quieres generar. Luego llenas los datos del paciente una sola vez y se rellenan todas.
              </p>

              {/* Formularios oficiales (paginas externas con prefill) */}
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wide font-bold text-cyan-700">Formularios oficiales</p>
                {EXTERNAL_FORMS.map(ext => {
                  const checked = selectedIds.includes(ext.id);
                  return (
                    <button
                      key={ext.id}
                      onClick={() => toggle(ext.id)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        checked ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-white hover:border-cyan-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked ? 'border-cyan-500 bg-cyan-600 text-white' : 'border-slate-300 bg-white text-transparent'
                        }`}>✓</span>
                        <div className="flex-1">
                          <p className={`font-semibold ${checked ? 'text-cyan-800' : 'text-slate-900'}`}>{ext.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Formulario Oficial · se abre prellenado en pestaña nueva</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Plantillas DB tradicionales */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] uppercase tracking-wide font-bold text-violet-700">Plantillas de solicitud</p>
                {eligibleTemplates.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No hay plantillas con campos disponibles.</p>
                ) : eligibleTemplates.map(t => {
                  const checked = selectedIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle(t.id)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        checked ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-300 bg-white text-transparent'
                        }`}>✓</span>
                        <div className="flex-1">
                          <p className={`font-semibold ${checked ? 'text-violet-800' : 'text-slate-900'}`}>{t.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.type} · {t.required_fields?.length || 0} campos</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
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
                {unionFields.length} campos únicos de {selectedTemplates.length} plantillas. Los nombres iguales se llenan una sola vez.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {generated.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <Button onClick={downloadAll} className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Download className="h-4 w-4" /> Descargar todos (.doc)
                  </Button>
                  <Button onClick={copyAll} variant="outline" className="gap-2">
                    <Copy className="h-4 w-4" /> Copiar todo
                  </Button>
                </div>
              )}

              {selectedExternal.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide font-bold text-cyan-700">Formularios oficiales prellenados</p>
                  {selectedExternal.map(ext => (
                    <a
                      key={ext.id}
                      href={createPageUrl(ext.route)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50/40 hover:bg-cyan-50 px-4 py-3 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-cyan-600">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900">{ext.name}</p>
                        <p className="text-xs text-slate-600">Se abre en una pestaña nueva con los datos del paciente ya completados.</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-cyan-700" />
                    </a>
                  ))}
                </div>
              )}

              {generated.map(g => (
                <div key={g.template.id} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-600" />
                    <span className="font-semibold text-sm text-slate-800 flex-1">{g.template.name}</span>
                    <button
                      onClick={() => copyOne(g)}
                      className="text-xs text-slate-600 hover:text-violet-700 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white"
                    >
                      {copiedId === g.template.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === g.template.id ? 'Copiado' : 'Copiar'}
                    </button>
                    <button
                      onClick={() => downloadWord(g.template.name, g.content)}
                      className="text-xs text-slate-600 hover:text-blue-700 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white"
                    >
                      <Download className="h-3.5 w-3.5" /> .doc
                    </button>
                  </div>
                  <pre className="px-4 py-3 text-xs whitespace-pre-wrap font-mono text-slate-700 max-h-48 overflow-y-auto">
                    {g.content}
                  </pre>
                  {g.template.destination_emails?.length > 0 && (
                    <div className="px-4 py-2 bg-blue-50/40 border-t border-blue-100 flex items-center gap-2 flex-wrap">
                      <Mail className="h-3.5 w-3.5 text-blue-700" />
                      <span className="text-[11px] text-blue-700 font-medium">Enviar a:</span>
                      {g.template.destination_emails.map((email, i) => (
                        <a
                          key={i}
                          href={`mailto:${email}?subject=${encodeURIComponent(g.template.name)}&body=${encodeURIComponent(g.content)}`}
                          className="text-[11px] px-2 py-0.5 bg-white border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100"
                        >{email}</a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={handleClose}>Cerrar</Button>
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
                Siguiente ({anySelected} {anySelected === 1 ? 'elegida' : 'elegidas'}) <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (
              <Button onClick={generateAll} className="bg-blue-600 hover:bg-blue-700 gap-2">
                {selectedTemplates.length > 0 && selectedExternal.length > 0
                  ? `Generar ${selectedTemplates.length} + abrir ${selectedExternal.length}`
                  : selectedTemplates.length > 0
                    ? `Generar ${selectedTemplates.length} documentos`
                    : `Continuar a formularios`}
              </Button>
            )}
            {step === 3 && (
              <Button onClick={reset} variant="outline">Generar otro lote</Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
