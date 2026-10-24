const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import RequestForm from '@/components/templates/RequestForm';
import MultiTemplateGenerator from '@/components/templates/MultiTemplateGenerator';
import { ChevronLeft, ClipboardList, Files, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DOCUMENT_FORMS, FORM_GROUPS, FORM_TONES, TEMPLATE_TYPE_META } from '@/lib/workspaceCatalog';

// Tipos de RequestTemplate que no se ofrecen en Documentos.
const HIDDEN_TYPES = ['Estudio Endoscópico'];

// Documentos con página propia + plantillas de la BD, en una sola lista agrupada por área.
function buildDocumentItems(rawTemplates) {
  const forms = DOCUMENT_FORMS.map(form => ({
    id: form.route, group: form.group, title: form.title, description: form.description,
    Icon: form.Icon, tone: form.tone, route: form.route, restricted: /restringido/i.test(form.description),
  }));
  const dbTemplates = rawTemplates
    .filter(template => !HIDDEN_TYPES.includes(template.type))
    .map(template => {
      const meta = TEMPLATE_TYPE_META[template.type] || TEMPLATE_TYPE_META.default;
      return {
        id: template.id, group: meta.group, title: template.name, description: template.instructions,
        Icon: meta.Icon, tone: meta.tone, template, fields: template.required_fields?.length || 0,
      };
    });
  return [...forms, ...dbTemplates];
}

export default function Templates() {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedTemplateId = urlParams.get('id');
  const openMultiOnLoad = urlParams.get('multi') === '1';
  const requestedGroup = urlParams.get('group');
  const openImageOnLoad = urlParams.get('image') === '1';

  const [activeTemplate, setActiveTemplate] = useState(null);
  const [activeGroup, setActiveGroup] = useState(requestedGroup || 'all');

  const { data: rawTemplates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.RequestTemplate.list('type'),
  });
  const items = buildDocumentItems(rawTemplates);

  // Open template from URL param
  useEffect(() => {
    if (selectedTemplateId && rawTemplates.length > 0) {
      const template = rawTemplates.find(t => t.id === selectedTemplateId);
      if (template) setActiveTemplate(template);
    }
  }, [selectedTemplateId, rawTemplates]);

  useEffect(() => {
    if (!openImageOnLoad || rawTemplates.length === 0) return;
    const imageTemplate = rawTemplates.find(template => template.type === 'Protocolo Imágenes');
    if (imageTemplate) setActiveTemplate(imageTemplate);
  }, [openImageOnLoad, rawTemplates]);

  const groups = FORM_GROUPS
    .map(group => ({ ...group, items: items.filter(item => item.group === group.id) }))
    .filter(group => group.items.length > 0);
  const visibleGroups = activeGroup === 'all' ? groups : groups.filter(group => group.id === activeGroup);

  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('Home'));
  };

  const exitMultiMode = () => {
    window.history.pushState({}, '', createPageUrl('Templates'));
  };

  const chipClass = active => `px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
    active ? 'bg-violet-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
  }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={goBack} title="Volver">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Documentos clínicos</h1>
              <p className="text-sm text-slate-500">Todo lo que se llena e imprime: recetas, certificados, órdenes, solicitudes y notificaciones</p>
            </div>
          </div>
          <GlobalSearch />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {openMultiOnLoad ? (
          <MultiTemplateGenerator
            open
            embedded
            templates={rawTemplates.filter(t => !HIDDEN_TYPES.includes(t.type))}
            onClose={exitMultiMode}
          />
        ) : (
        <>
        {/* Multi-template generator launcher */}
        <Link
          to={createPageUrl('Templates?multi=1')}
          className="group mb-6 block w-full rounded-2xl border-2 border-dashed border-violet-300 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 text-left transition-all hover:border-violet-400 hover:from-violet-100 hover:to-indigo-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shrink-0">
              <Files className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                Solicitar varios formularios para el mismo paciente
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Elige documentos por categoría, llena los datos una sola vez y revisa una vista previa editable antes de imprimir.
              </p>
            </div>
            <span className="text-xs font-medium text-violet-700 group-hover:translate-x-1 transition-transform shrink-0">
              Abrir →
            </span>
          </div>
        </Link>

        {/* Filtro por área */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <button onClick={() => setActiveGroup('all')} className={chipClass(activeGroup === 'all')}>
              Todos ({items.length})
            </button>
            {groups.map(group => (
              <button key={group.id} onClick={() => setActiveGroup(group.id)} className={chipClass(activeGroup === group.id)}>
                <group.Icon className="h-4 w-4" />
                {group.title}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <p className="mb-4 text-xs text-slate-500">Cargando plantillas e interconsultas…</p>
        )}

        <div className="space-y-8">
          {visibleGroups.map(group => (
            <section key={group.id}>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-slate-900 p-2">
                  <group.Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{group.title}</h2>
                  <p className="text-xs text-slate-500">{group.subtitle}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map((item, index) => {
                  const tone = FORM_TONES[item.tone] || FORM_TONES.slate;
                  const cardInner = (
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 rounded-xl p-3 shadow-sm ${tone.icon}`}>
                        <item.Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-violet-600">{item.title}</h3>
                        {item.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description}</p>}
                        {item.restricted && (
                          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700"><Lock className="h-3 w-3" />Requiere ingreso</p>
                        )}
                        {item.fields > 0 && <p className="mt-2 text-xs text-slate-500">{item.fields} campos requeridos</p>}
                      </div>
                    </div>
                  );
                  const motionProps = {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: Math.min(index, 8) * 0.04 },
                    className: `group block rounded-2xl border p-5 text-left transition-all hover:shadow-lg ${tone.card}`,
                  };
                  return item.route ? (
                    <motion.div key={item.id} {...motionProps}>
                      <Link to={createPageUrl(item.route)} className="block">{cardInner}</Link>
                    </motion.div>
                  ) : (
                    <motion.button key={item.id} {...motionProps} onClick={() => setActiveTemplate(item.template)}>
                      {cardInner}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {visibleGroups.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <ClipboardList className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No hay documentos en esta área</h3>
          </div>
        )}
        </>
        )}
      </div>

      {/* Request Form Modal */}
      {activeTemplate && (
        <RequestForm
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </div>
  );
}
