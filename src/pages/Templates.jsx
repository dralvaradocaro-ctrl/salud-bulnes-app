const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import RequestForm from '@/components/templates/RequestForm';
import MultiTemplateGenerator from '@/components/templates/MultiTemplateGenerator';
import {
  ChevronLeft,
  ClipboardList,
  Image,
  FlaskConical,
  Microscope,
  FileText,
  MessageSquare,
  Files
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const typeIcons = {
  'Protocolo Imágenes': Image,
  'Laboratorio Especial': FlaskConical,
  'Estudio Endoscópico': Microscope,
  'Interconsulta': MessageSquare,
  'Formulario Oficial': FileText,
  'Otro': FileText
};

const typeColors = {
  'Protocolo Imágenes': 'from-blue-500 to-blue-600',
  'Laboratorio Especial': 'from-violet-500 to-violet-600',
  'Estudio Endoscópico': 'from-emerald-500 to-emerald-600',
  'Interconsulta': 'from-amber-500 to-amber-600',
  'Formulario Oficial': 'from-cyan-500 to-blue-600',
  'Otro': 'from-slate-500 to-slate-600'
};

// Formularios que viven como paginas standalone (no en RequestTemplate). Se
// inyectan en la grilla con external_route — al hacer click se navega al
// page builder dedicado en vez de abrir el RequestForm generico.
export const EXTERNAL_TEMPLATES = [
  {
    id: 'ext-solicitud-examenes',
    name: 'Solicitud de Exámenes — Hospital de Bulnes',
    type: 'Formulario Oficial',
    instructions: 'Selecciona exámenes con buscador e imprime el formulario oficial (COD. 32).',
    external_route: 'SolicitudExamenes',
  },
  {
    id: 'ext-formulario-ges',
    name: 'Formulario de Constancia GES',
    type: 'Formulario Oficial',
    instructions: 'Artículo 24° Ley 19.966 — Constancia GES para patologías cubiertas.',
    external_route: 'FormularioGES',
  },
  {
    id: 'ext-informe-biomedico',
    name: 'Informe Biomédico Funcional',
    type: 'Formulario Oficial',
    instructions: 'Informe biomédico y funcional para credencial de discapacidad / pensión.',
    external_route: 'InformeBiomedico',
  },
  {
    id: 'ext-ira-grave',
    name: 'Formulario IRA grave y 2019-nCoV (ISP)',
    type: 'Formulario Oficial',
    instructions: 'PR-244.00-007 — Notificación inmediata y envío de muestras al ISP. Genera PDF imprimible.',
    external_route: 'FormularioIRAGrave',
  },
  {
    id: 'ext-solicitud-microbio',
    name: 'Solicitud de Exámenes Microbiológicos',
    type: 'Formulario Oficial',
    instructions: 'Formulario C 162 — Cultivos, directos al fresco, virológicos. Imprime PDF.',
    external_route: 'SolicitudMicrobiologia',
  },
  {
    id: 'ext-farmaco-restringido',
    name: 'Solicitud de Fármaco de Uso Restringido',
    type: 'Formulario Oficial',
    instructions: 'Comité de Farmacia / MPJC — Antibióticos amplio espectro, fármacos de uso ocasional.',
    external_route: 'SolicitudFarmacoRestringido',
  },
];

export default function Templates() {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedTemplateId = urlParams.get('id');
  const openMultiOnLoad = urlParams.get('multi') === '1';

  const [activeTemplate, setActiveTemplate] = useState(null);
  const [activeType, setActiveType] = useState('all');

  const HIDDEN_TYPES = ['Estudio Endoscópico'];

  const { data: rawTemplates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.RequestTemplate.list('type'),
  });
  const templates = [
    ...rawTemplates.filter(t => !HIDDEN_TYPES.includes(t.type)),
    ...EXTERNAL_TEMPLATES,
  ];

  // Open template from URL param
  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) setActiveTemplate(template);
    }
  }, [selectedTemplateId, templates]);

  // Get unique types
  const types = [...new Set(templates.map(t => t.type).filter(Boolean))];

  // Filter templates
  const filteredTemplates = activeType === 'all'
    ? templates
    : templates.filter(t => t.type === activeType);

  // Group by type
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const type = template.type || 'Otro';
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {});

  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('Home'));
  };

  const exitMultiMode = () => {
    window.history.pushState({}, '', createPageUrl('Templates'));
  };

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
              <p className="text-sm text-slate-500">Formularios categorizados y generación múltiple</p>
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
            templates={templates}
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

        {/* Type Filters */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveType('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeType === 'all'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todas ({templates.length})
            </button>
            {types.map(type => {
              const Icon = typeIcons[type] || FileText;
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activeType === type
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates List */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTemplates).map(([type, typeTemplates]) => {
              const Icon = typeIcons[type] || FileText;
              const colorClass = typeColors[type] || typeColors['Otro'];

              return (
                <div key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClass}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">{type}</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {typeTemplates.map((template, index) => {
                      const cardInner = (
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} shadow-lg`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                              {template.name}
                            </h3>
                            {template.instructions && (
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                {template.instructions}
                              </p>
                            )}
                            {template.required_fields?.length > 0 && (
                              <p className="text-xs text-slate-500 mt-2">
                                {template.required_fields.length} campos requeridos
                              </p>
                            )}
                            {template.external_route && (
                              <p className="text-xs text-cyan-700 mt-2 font-medium">Abrir formulario oficial →</p>
                            )}
                          </div>
                        </div>
                      );
                      const motionProps = {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: index * 0.05 },
                        className: 'group bg-white rounded-2xl p-5 border border-slate-100 hover:border-violet-200 hover:shadow-lg transition-all text-left block',
                      };
                      return template.external_route ? (
                        <motion.div key={template.id} {...motionProps}>
                          <Link to={createPageUrl(template.external_route)} className="block">
                            {cardInner}
                          </Link>
                        </motion.div>
                      ) : (
                        <motion.button
                          key={template.id}
                          {...motionProps}
                          onClick={() => setActiveTemplate(template)}
                        >
                          {cardInner}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredTemplates.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <ClipboardList className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              No hay formularios disponibles
            </h3>
            <p className="text-slate-500">
              Los formularios están siendo configurados
            </p>
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
