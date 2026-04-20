const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronLeft,
  Stethoscope,
  Brain,
  Heart,
  Baby,
  Pill,
  Activity,
  ExternalLink,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NIHSSCalculator from '@/components/calculators/NIHSSCalculator';
import HEARTScoreCalculator from '@/components/calculators/HEARTScoreCalculator';
import MOCACalculator from '@/components/calculators/MOCACalculator';
import { isHiddenClinicalTool } from '@/components/utils/hiddenContent';

const specialtyIcons = {
  'Neurología': Brain,
  'Cardiología': Heart,
  'Pediatría': Baby,
  'Diabetes': Pill,
  'Nefrología': Activity,
  'Gastroenterología': Activity,
  'Respiratorio': Activity,
  'Infectología': Activity,
  'Otro': Stethoscope
};

const specialtyColors = {
  'Neurología': 'from-violet-500 to-violet-600',
  'Cardiología': 'from-rose-500 to-rose-600',
  'Pediatría': 'from-pink-500 to-pink-600',
  'Diabetes': 'from-amber-500 to-amber-600',
  'Nefrología': 'from-blue-500 to-blue-600',
  'Gastroenterología': 'from-emerald-500 to-emerald-600',
  'Respiratorio': 'from-cyan-500 to-cyan-600',
  'Infectología': 'from-red-500 to-red-600',
  'Otro': 'from-slate-500 to-slate-600'
};

export default function ClinicalTools() {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedToolId = urlParams.get('tool');
  
  const [activeSpecialty, setActiveSpecialty] = useState('all');
  const [expandedTool, setExpandedTool] = useState(selectedToolId);

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['clinical-tools'],
    queryFn: () => db.entities.ClinicalTool.list('specialty'),
  });

  const visibleTools = tools.filter(tool => !isHiddenClinicalTool(tool));

  // Get unique specialties
  const specialties = [...new Set(visibleTools.map(t => t.specialty).filter(Boolean))];

  // Filter tools
  const filteredTools = activeSpecialty === 'all'
    ? visibleTools
    : visibleTools.filter(t => t.specialty === activeSpecialty);

  // Group by specialty
  const groupedTools = filteredTools.reduce((acc, tool) => {
    const specialty = tool.specialty || 'Otro';
    if (!acc[specialty]) acc[specialty] = [];
    acc[specialty].push(tool);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
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
              <h1 className="text-xl font-bold text-slate-900">Herramientas Clínicas</h1>
              <p className="text-sm text-slate-500">Escalas, scores y calculadoras</p>
            </div>
          </div>
          <GlobalSearch />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Specialty Filters */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveSpecialty('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeSpecialty === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todas ({visibleTools.length})
            </button>
            {specialties.map(specialty => {
              const Icon = specialtyIcons[specialty] || Stethoscope;
              return (
                <button
                  key={specialty}
                  onClick={() => setActiveSpecialty(specialty)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activeSpecialty === specialty
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {specialty}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTools).map(([specialty, specialtyTools]) => {
              const Icon = specialtyIcons[specialty] || Stethoscope;
              const colorClass = specialtyColors[specialty] || specialtyColors['Otro'];

              return (
                <div key={specialty}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClass}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">{specialty}</h2>
                    <span className="text-sm text-slate-500">({specialtyTools.length})</span>
                  </div>

                  <div className="space-y-3">
                    {specialtyTools.map((tool, index) => (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all"
                      >
                        <button
                          onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
                          className="w-full p-5 text-left flex items-center justify-between gap-4"
                        >
                          <div>
                            <h3 className="font-semibold text-slate-900">{tool.name}</h3>
                            {tool.description && (
                              <p className="text-sm text-slate-600 mt-1">{tool.description}</p>
                            )}
                          </div>
                          <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${
                            expandedTool === tool.id ? 'rotate-90' : ''
                          }`} />
                        </button>

                        <AnimatePresence>
                          {expandedTool === tool.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-0 border-t border-slate-100">
                                {/* Calculadora interactiva si existe */}
                                {tool.name.includes('NIHSS') && (
                                  <div className="mb-4">
                                    <NIHSSCalculator />
                                  </div>
                                )}
                                {tool.name.includes('HEART') && (
                                  <div className="mb-4">
                                    <HEARTScoreCalculator />
                                  </div>
                                )}
                                {tool.name.includes('MoCA') && (
                                  <div className="mb-4">
                                    <MOCACalculator />
                                  </div>
                                )}
                                {tool.content && (
                                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Calculator className="h-4 w-4 text-slate-600" />
                                      <h4 className="font-medium text-slate-800">Información de Referencia</h4>
                                    </div>
                                    <div className="prose prose-sm prose-slate max-w-none">
                                      <ReactMarkdown>{tool.content}</ReactMarkdown>
                                    </div>
                                  </div>
                                )}

                                {tool.interpretation && (
                                  <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200">
                                    <h4 className="font-medium text-emerald-800 mb-2">Interpretación</h4>
                                    <div className="prose prose-sm prose-slate max-w-none text-emerald-900">
                                      <ReactMarkdown>{tool.interpretation}</ReactMarkdown>
                                    </div>
                                  </div>
                                )}

                                {tool.reference_url && (
                                  <a
                                    href={tool.reference_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Ver referencia completa
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredTools.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Stethoscope className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              No hay herramientas disponibles
            </h3>
            <p className="text-slate-500">
              Las herramientas clínicas están siendo agregadas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
