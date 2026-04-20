const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import { 
  ChevronLeft, 
  FileText, 
  Stethoscope, 
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  Heart,
  Brain,
  Activity,
  Zap,
  AlertTriangle,
  Thermometer,
  Baby,
  Droplet,
  Eye,
  Bone,
  Pill,
  Wind,
  Scale,
  Radio,
  Users,
  Clock,
  Shield
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

  const [activeTab, setActiveTab] = useState('topics');
  const [activeSubcategory, setActiveSubcategory] = useState('all');

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

  // Get unique subcategories
  const subcategories = [...new Set(topics.map(t => t.subcategory).filter(Boolean))];

  // Filter topics by subcategory
  const filteredTopics = activeSubcategory === 'all' 
    ? topics 
    : topics.filter(t => t.subcategory === activeSubcategory);

  // Group topics by subcategory and sort
  const groupedTopics = filteredTopics.reduce((acc, topic) => {
    const sub = topic.subcategory || 'Otros';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(topic);
    return acc;
  }, {});

  // Sort within each group: by tipo_contenido, then protocol local
  const typeOrder = { protocolo: 0, contenido_medico: 1, herramienta_clinica: 2 };
  Object.keys(groupedTopics).forEach(sub => {
    groupedTopics[sub].sort((a, b) => {
      const aType = a.tipo_contenido?.[0] || 'contenido_medico';
      const bType = b.tipo_contenido?.[0] || 'contenido_medico';
      if (aType !== bType) return (typeOrder[aType] ?? 1) - (typeOrder[bType] ?? 1);
      if (a.has_local_protocol && !b.has_local_protocol) return -1;
      if (!a.has_local_protocol && b.has_local_protocol) return 1;
      return 0;
    });
  });

  // Define subcategory order for better organization
  const subcategoryOrder = ['Protocolos Locales', 'Herramientas Clínicas', 'Patologías Prevalentes', 'Otros'];
  const sortedSubcategories = Object.keys(groupedTopics).sort((a, b) => {
    const indexA = subcategoryOrder.indexOf(a);
    const indexB = subcategoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Get icon for topic based on name/tags
  const getTopicIcon = (topic) => {
    const name = topic.name?.toLowerCase() || '';
    const tags = topic.tags?.map(t => t.toLowerCase()).join(' ') || '';
    const searchText = `${name} ${tags}`;

    if (searchText.includes('acv') || searchText.includes('stroke') || searchText.includes('neurolog')) return Brain;
    if (searchText.includes('lactante') || searchText.includes('suplementación') || searchText.includes('vitamina') || searchText.includes('hierro')) return Baby;
    if (searchText.includes('cuerpo extraño')) return AlertTriangle;
    if (searchText.includes('cie-10') || searchText.includes('código')) return ClipboardList;
    if (searchText.includes('imagen') || searchText.includes('imagenología') || searchText.includes('radiología') || searchText.includes('scanner')) return Radio;
    if (searchText.includes('policlínico') || searchText.includes('atenciones') || searchText.includes('formulario')) return Stethoscope;
    if (searchText.includes('cardio') || searchText.includes('corazón') || searchText.includes('infarto')) return Heart;
    if (searchText.includes('diabetes') || searchText.includes('glicemia')) return Activity;
    if (searchText.includes('urgencia') || searchText.includes('emergencia') || searchText.includes('shock')) return Zap;
    if (searchText.includes('trauma') || searchText.includes('fractura') || searchText.includes('hueso')) return Bone;
    if (searchText.includes('respiratorio') || searchText.includes('pulmon') || searchText.includes('asma') || searchText.includes('epoc')) return Wind;
    if (searchText.includes('pediatr') || searchText.includes('niño') || searchText.includes('neonato')) return Baby;
    if (searchText.includes('hemorragia') || searchText.includes('sangrado') || searchText.includes('hematoma')) return Droplet;
    if (searchText.includes('oftalmo') || searchText.includes('ojo') || searchText.includes('visión')) return Eye;
    if (searchText.includes('fármaco') || searchText.includes('medicamento') || searchText.includes('intoxicación')) return Pill;
    if (searchText.includes('fiebre') || searchText.includes('temperatura')) return Thermometer;
    if (searchText.includes('obesidad') || searchText.includes('peso') || searchText.includes('nutrición')) return Scale;
    if (searchText.includes('gineco') || searchText.includes('embarazo') || searchText.includes('parto')) return Users;
    if (searchText.includes('sepsis') || searchText.includes('infección')) return Shield;
    if (searchText.includes('dolor')) return AlertTriangle;
    
    return FileText;
  };

  // Get icon color for topic
  const getTopicColor = (topic) => {
    const Icon = getTopicIcon(topic);
    if (Icon === Heart) return { bg: 'bg-red-100', text: 'text-red-600' };
    if (Icon === Brain) return { bg: 'bg-purple-100', text: 'text-purple-600' };
    if (Icon === Activity) return { bg: 'bg-blue-100', text: 'text-blue-600' };
    if (Icon === Zap) return { bg: 'bg-yellow-100', text: 'text-yellow-600' };
    if (Icon === Bone) return { bg: 'bg-slate-100', text: 'text-slate-600' };
    if (Icon === Wind) return { bg: 'bg-cyan-100', text: 'text-cyan-600' };
    if (Icon === Baby) return { bg: 'bg-pink-100', text: 'text-pink-600' };
    if (Icon === Droplet) return { bg: 'bg-rose-100', text: 'text-rose-600' };
    if (Icon === Eye) return { bg: 'bg-indigo-100', text: 'text-indigo-600' };
    if (Icon === Pill) return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
    if (Icon === Thermometer) return { bg: 'bg-orange-100', text: 'text-orange-600' };
    if (Icon === Scale) return { bg: 'bg-amber-100', text: 'text-amber-600' };
    if (Icon === Radio) return { bg: 'bg-violet-100', text: 'text-violet-600' };
    if (Icon === Users) return { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' };
    if (Icon === Shield) return { bg: 'bg-red-100', text: 'text-red-600' };
    if (Icon === AlertTriangle) return { bg: 'bg-orange-100', text: 'text-orange-600' };
    return { bg: 'bg-blue-100', text: 'text-blue-600' };
  };

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
            {/* Subcategory filters — only if there are multiple subcategories */}
            {subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveSubcategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeSubcategory === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Todos ({topics.length})
                </button>
                {subcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(sub)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeSubcategory === sub
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {sub} ({topics.filter(t => t.subcategory === sub).length})
                  </button>
                ))}
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
                        const TopicIcon = getTopicIcon(topic);
                        const colors = getTopicColor(topic);
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
                                <div className={`p-3 ${colors.bg} rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                                  <TopicIcon className={`h-7 w-7 ${colors.text}`} />
                                </div>
                                <div className="flex-1">
                                  <h3 className={`font-bold text-slate-900 transition-colors mb-2 line-clamp-2 ${
                                    topic.has_local_protocol ? 'text-base' : 'text-sm'
                                  }`}>
                                    {topic.name}
                                  </h3>
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {(topic.tipo_contenido || []).includes('protocolo') && (
                                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">🟢 Protocolo</Badge>
                                    )}
                                    {(topic.tipo_contenido || []).includes('contenido_medico') && (
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">🔵 Contenido Médico</Badge>
                                    )}
                                    {(topic.tipo_contenido || []).includes('herramienta_clinica') && (
                                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">🟣 Herramienta</Badge>
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
                                    {topic.guarantee_days && (
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
                <p className="text-slate-500">No hay temas en esta categoría aún</p>
              </div>
            )}
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="grid md:grid-cols-2 gap-4">
            {visibleTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={createPageUrl(`ClinicalTools?tool=${tool.id}`)}
                  className="group block bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <Stethoscope className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {tool.name}
                      </h3>
                      <span className="text-xs text-slate-500">{tool.specialty}</span>
                    </div>
                  </div>
                  {tool.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">{tool.description}</p>
                  )}
                </Link>
              </motion.div>
            ))}
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
