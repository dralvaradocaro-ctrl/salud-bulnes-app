const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import { getTopicVisual } from '@/lib/topicVisuals';
import { hasVisibleGuaranteeDays } from '@/lib/guarantees';
import { 
  ChevronLeft, 
  FileText, 
  Stethoscope, 
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isHiddenClinicalTool } from '@/components/utils/hiddenContent';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Category() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');
  const initialTopicFilter = urlParams.get('topicFilter') || 'all';
  const initialSubcategory = urlParams.get('topicArea') || 'all';

  const [activeTab, setActiveTab] = useState('topics');
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory);
  const [activeTopicFilter, setActiveTopicFilter] = useState(initialTopicFilter);

  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const categories = await db.entities.Category.filter({ id: categoryId });
      return categories[0];
    },
    enabled: !!categoryId
  });

  const { data: topics = [], isLoading: loadingTopics } = useQuery({
    queryKey: ['topics', categoryId],
    queryFn: () => db.entities.Topic.filter({ category_id: categoryId }, 'order'),
    enabled: !!categoryId
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['tools', categoryId],
    queryFn: () => db.entities.ClinicalTool.filter({ category_id: categoryId }),
    enabled: !!categoryId
  });

  const visibleTools = tools.filter(tool => !isHiddenClinicalTool(tool));

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', categoryId],
    queryFn: () => db.entities.RequestTemplate.filter({ category_id: categoryId }),
    enabled: !!categoryId
  });

  const matchesTopicFilter = (topic) => {
    if (activeTopicFilter === 'local') return !!topic.has_local_protocol;
    if (activeTopicFilter === 'ges') return topic.clasificacion_ges === 'GES';
    return true;
  };

  const filteredByTopicType = topics.filter(matchesTopicFilter);

  // Get unique subcategories
  const subcategories = [...new Set(filteredByTopicType.map(t => t.subcategory).filter(Boolean))];

  // Filter topics by subcategory
  const filteredTopics = activeSubcategory === 'all' 
    ? filteredByTopicType 
    : filteredByTopicType.filter(t => t.subcategory === activeSubcategory);

  // Group topics by subcategory and sort
  const groupedTopics = filteredTopics.reduce((acc, topic) => {
    const sub = topic.subcategory || 'Otros';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(topic);
    return acc;
  }, {});

  const hasMeaningfulTopicContent = (topic) => {
    const textFields = [
      topic.clinical_summary,
      topic.diagnostic_orientation,
      topic.complementary_studies,
      topic.initial_treatment,
      topic.protocol_objective,
      topic.protocol_file_url,
      topic.guarantee_details,
    ];

    const hasTextContent = textFields.some((value) => typeof value === 'string' && value.trim().length > 0);
    const hasStructuredContent = [
      topic.content_blocks,
      topic.protocol_flowchart,
      topic.protocol_algorithm,
      topic.protocol_medications,
      topic.protocol_authors,
      topic.protocol_participants,
      topic.related_topics,
      topic.related_tools,
    ].some((value) => Array.isArray(value) && value.length > 0);

    return hasTextContent || hasStructuredContent;
  };

  // Sort within each group:
  // 1) protocolo local con contenido real
  // 2) protocolo local
  // 3) contenido real
  // 4) tipo de contenido
  // 5) orden / nombre
  const typeOrder = { protocolo: 0, contenido_medico: 1, herramienta_clinica: 2 };
  Object.keys(groupedTopics).forEach(sub => {
    groupedTopics[sub].sort((a, b) => {
      const aFeatured = a.has_local_protocol && hasMeaningfulTopicContent(a);
      const bFeatured = b.has_local_protocol && hasMeaningfulTopicContent(b);
      if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;

      if (a.has_local_protocol && !b.has_local_protocol) return -1;
      if (!a.has_local_protocol && b.has_local_protocol) return 1;

      const aHasContent = hasMeaningfulTopicContent(a);
      const bHasContent = hasMeaningfulTopicContent(b);
      if (aHasContent !== bHasContent) return aHasContent ? -1 : 1;

      const aType = a.tipo_contenido?.[0] || 'contenido_medico';
      const bType = b.tipo_contenido?.[0] || 'contenido_medico';
      if (aType !== bType) return (typeOrder[aType] ?? 1) - (typeOrder[bType] ?? 1);

      const orderDiff = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
      if (orderDiff !== 0) return orderDiff;

      return (a.name || '').localeCompare(b.name || '', 'es');
    });
  });

  // Define subcategory order for better organization
  const subcategoryOrder = [
    'Cardiovascular',
    'Neurología',
    'Respiratorio',
    'Endocrinología y Metabólico',
    'Nefrología y Urología',
    'Oftalmología',
    'Oncología',
    'Ginecología y Obstetricia',
    'Salud Mental',
    'Digestivo y Hepatología',
    'Pediatría y Neonatología',
    'Traumatología y Rehabilitación',
    'Reumatología e Inmunología',
    'Otorrinolaringología',
    'Odontología y Salud Oral',
    'GES General',
    'Protocolos Locales',
    'Herramientas Clínicas',
    'Patologías Prevalentes',
    'Otros'
  ];
  const sortedSubcategories = Object.keys(groupedTopics).sort((a, b) => {
    const indexA = subcategoryOrder.indexOf(a);
    const indexB = subcategoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const topicFilterOptions = [
    { value: 'all', count: topics.length, label: `Todos (${topics.length})` },
    { value: 'local', count: topics.filter(topic => topic.has_local_protocol).length, label: `Protocolo local (${topics.filter(topic => topic.has_local_protocol).length})` },
    { value: 'ges', count: topics.filter(topic => topic.clasificacion_ges === 'GES').length, label: `GES (${topics.filter(topic => topic.clasificacion_ges === 'GES').length})` },
  ];
  const meaningfulTopicFilterOptions = topicFilterOptions.filter((option) =>
    option.value === 'all' || (option.count > 0 && option.count < topics.length)
  );
  const shouldShowTopicFilters = meaningfulTopicFilterOptions.length > 1;
  const shouldShowAreaFilters = subcategories.length > 1;
  const shouldShowFilterPanel = shouldShowTopicFilters || shouldShowAreaFilters;

  useEffect(() => {
    if (activeSubcategory !== 'all' && (!shouldShowAreaFilters || !subcategories.includes(activeSubcategory))) {
      setActiveSubcategory('all');
    }
  }, [activeSubcategory, shouldShowAreaFilters, subcategories]);

  useEffect(() => {
    if (activeTopicFilter !== 'all' && !meaningfulTopicFilterOptions.some((option) => option.value === activeTopicFilter)) {
      setActiveTopicFilter('all');
    }
  }, [activeTopicFilter, meaningfulTopicFilterOptions]);

  useEffect(() => {
    const nextParams = new URLSearchParams(window.location.search);
    if (categoryId) nextParams.set('id', categoryId);
    if (activeTopicFilter !== 'all') nextParams.set('topicFilter', activeTopicFilter);
    else nextParams.delete('topicFilter');
    if (activeSubcategory !== 'all') nextParams.set('topicArea', activeSubcategory);
    else nextParams.delete('topicArea');

    const nextSearch = nextParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [activeSubcategory, activeTopicFilter, categoryId]);

  if (loadingCategory) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
              <h1 className="text-xl font-bold text-slate-900">{category?.name}</h1>
              <p className="text-sm text-slate-500">{category?.description}</p>
            </div>
          </div>
          <GlobalSearch />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
          {topics.length > 0 && (
            <button
              onClick={() => setActiveTab('topics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'topics'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              Temas ({topics.length})
            </button>
          )}
          {visibleTools.length > 0 && (
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'tools'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              Herramientas ({visibleTools.length})
            </button>
          )}
          {templates.length > 0 && (
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'templates'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Plantillas ({templates.length})
            </button>
          )}
        </div>

        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <div>
            {shouldShowFilterPanel && (
              <div className="mb-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                {shouldShowTopicFilters && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                      Filtro de contenido
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {meaningfulTopicFilterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setActiveTopicFilter(option.value)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            activeTopicFilter === option.value
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {shouldShowAreaFilters && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Filtrar por área o tema
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveSubcategory('all')}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        activeSubcategory === 'all'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Todas las áreas ({filteredByTopicType.length})
                    </button>
                    {subcategories.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubcategory(sub)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          activeSubcategory === sub
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {sub} ({filteredByTopicType.filter(t => t.subcategory === sub).length})
                      </button>
                    ))}
                  </div>
                </div>
                )}
              </div>
            )}

            {loadingTopics ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="w-14 h-14 bg-slate-200 rounded-2xl mb-4"></div>
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : filteredTopics.length > 0 ? (
              <div className="space-y-10">
                {sortedSubcategories.map(subcategory => (
                  <div key={subcategory}>
                    {activeSubcategory === 'all' && (
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                        <h3 className="text-base font-bold text-slate-700 uppercase tracking-wide px-4 py-2 bg-slate-100 rounded-full">
                          {subcategory}
                        </h3>
                        <div className="flex-1 h-px bg-gradient-to-l from-slate-200 to-transparent"></div>
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedTopics[subcategory].map((topic, index) => {
                        const topicVisual = getTopicVisual(topic);
                        const TopicIcon = topicVisual.icon;
                        return (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link
                              to={createPageUrl(`TopicDetail?id=${topic.id}`)}
                              className={`group block bg-white rounded-2xl p-6 border transition-all h-full ${
                                topic.has_local_protocol
                                  ? 'border-green-200 shadow-md hover:shadow-2xl ring-2 ring-green-100'
                                  : (topic.tipo_contenido || []).includes('protocolo')
                                    ? 'border-green-100 hover:border-green-300 hover:shadow-xl'
                                    : (topic.tipo_contenido || []).includes('herramienta_clinica')
                                      ? 'border-purple-100 hover:border-purple-300 hover:shadow-xl'
                                      : 'border-slate-100 hover:border-blue-200 hover:shadow-xl'
                              }`}
                            >
                              <div className="flex flex-col h-full">
                                <div className={`p-3 ${topicVisual.bg} rounded-2xl w-fit mb-4 ring-1 ${topicVisual.ring} group-hover:scale-110 transition-transform`}>
                                  <TopicIcon className={`h-7 w-7 ${topicVisual.text}`} />
                                </div>
                                <div className="flex-1">
                                  <h3 className={`font-bold text-slate-900 transition-colors mb-2 line-clamp-2 ${
                                    topic.has_local_protocol ? 'text-base' : 'text-sm'
                                  }`}>
                                    {topic.name}
                                  </h3>
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {(topic.tipo_contenido || []).includes('protocolo') && (
                                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Protocolo</Badge>
                                    )}
                                    {(topic.tipo_contenido || []).includes('contenido_medico') && (
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Contenido Médico</Badge>
                                    )}
                                    {(topic.tipo_contenido || []).includes('herramienta_clinica') && (
                                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Herramienta</Badge>
                                    )}
                                    {topic.has_local_protocol && (
                                      <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1 text-xs font-semibold">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Prot. Local
                                      </Badge>
                                    )}
                                    {topic.clasificacion_ges === 'GES' && (
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">GES</Badge>
                                    )}
                                    {hasVisibleGuaranteeDays(topic.guarantee_days) && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge className="bg-sky-100 text-sky-700 border-sky-200 flex items-center gap-1 cursor-help text-xs">
                                              <Clock className="h-3 w-3" />
                                              {topic.guarantee_days}d garantía
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p className="font-semibold mb-1">Garantía GES</p>
                                            <p className="text-sm">{topic.guarantee_details || `Tratamiento garantizado en ${topic.guarantee_days} días`}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                  {topic.description && (
                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                      {topic.description}
                                    </p>
                                  )}
                                </div>
                                <div className={`flex items-center text-xs font-semibold mt-4 group-hover:gap-2 transition-all ${
                                  (topic.tipo_contenido || []).includes('protocolo') ? 'text-green-600'
                                  : (topic.tipo_contenido || []).includes('herramienta_clinica') ? 'text-purple-600'
                                  : 'text-blue-600'
                                }`}>
                                  {(topic.tipo_contenido || []).includes('protocolo') ? 'Ver protocolo'
                                    : (topic.tipo_contenido || []).includes('herramienta_clinica') ? 'Ver herramienta'
                                    : 'Ver contenido'}
                                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No hay temas que coincidan con los filtros actuales</p>
              </div>
            )}
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="grid md:grid-cols-2 gap-4">
            {visibleTools.map((tool, index) => {
              const isExternal = !!tool.reference_url;
              const cardClass = "group block bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-lg transition-all";
              const inner = (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug">
                        {tool.name}
                      </h3>
                      {isExternal && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          Externo
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{tool.specialty}</span>
                    {tool.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mt-1">{tool.description}</p>
                    )}
                  </div>
                </div>
              );
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {isExternal ? (
                    <a href={tool.reference_url} target="_blank" rel="noopener noreferrer" className={cardClass}>
                      {inner}
                    </a>
                  ) : (
                    <Link to={createPageUrl(`ClinicalTools?tool=${tool.id}`)} className={cardClass}>
                      {inner}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={createPageUrl(`Templates?id=${template.id}`)}
                  className="group block bg-white rounded-2xl p-5 border border-slate-100 hover:border-violet-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-violet-100 rounded-xl">
                      <ClipboardList className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                        {template.name}
                      </h3>
                      <span className="text-xs text-slate-500">{template.type}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
