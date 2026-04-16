const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import RequestForm from '@/components/templates/RequestForm';
import { 
  ChevronLeft,
  ClipboardList,
  Image,
  FlaskConical,
  Microscope,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const typeIcons = {
  'Protocolo Imágenes': Image,
  'Laboratorio Especial': FlaskConical,
  'Estudio Endoscópico': Microscope,
  'Interconsulta': MessageSquare,
  'Otro': FileText
};

const typeColors = {
  'Protocolo Imágenes': 'from-blue-500 to-blue-600',
  'Laboratorio Especial': 'from-violet-500 to-violet-600',
  'Estudio Endoscópico': 'from-emerald-500 to-emerald-600',
  'Interconsulta': 'from-amber-500 to-amber-600',
  'Otro': 'from-slate-500 to-slate-600'
};

export default function Templates() {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedTemplateId = urlParams.get('id');
  
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [activeType, setActiveType] = useState('all');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.RequestTemplate.list('type'),
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Plantillas de Solicitud</h1>
              <p className="text-sm text-slate-500">Genera documentos con los datos del paciente</p>
            </div>
          </div>
          <GlobalSearch />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
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
                    {typeTemplates.map((template, index) => (
                      <motion.button
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setActiveTemplate(template)}
                        className="group bg-white rounded-2xl p-5 border border-slate-100 hover:border-violet-200 hover:shadow-lg transition-all text-left"
                      >
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
                          </div>
                        </div>
                      </motion.button>
                    ))}
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
              No hay plantillas disponibles
            </h3>
            <p className="text-slate-500">
              Las plantillas están siendo configuradas
            </p>
          </div>
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