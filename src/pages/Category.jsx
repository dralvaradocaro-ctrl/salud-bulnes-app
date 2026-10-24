import { localContentPending } from '@/lib/protocolContent';
const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Sparkles,
  Activity,
  ShieldPlus,
  Pill,
  Package,
  Search,
  ArrowRight,
  Database,
  CheckSquare,
  Check,
  X,
  Calculator,
  Heart,
  Brain,
  Wind,
  Droplet,
  ShieldAlert,
  Utensils,
  HeartPulse,
  Baby,
  Bone,
  Syringe,
} from 'lucide-react';
import { allCalculators, clinicalToolCalculatorId } from '@/components/calculators/catalog';
import { FORM_TONES, FORM_GROUPS, STATIC_FORMS, TEMPLATE_TYPE_META } from '@/lib/workspaceCatalog';
import MultiTemplateGenerator, { EXTERNAL_FORMS, isMultiEligibleTemplate } from '@/components/templates/MultiTemplateGenerator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { isHiddenClinicalTool, isHiddenGesConstanciaTool } from '@/components/utils/hiddenContent';
import { getProtocolValidityStatus } from '@/lib/protocolUtils';
import { getTopicProtocolStatus, hasSsnProtocolBadge, hasMinsalOrdinarioBadge, hasSsnOrdinarioBadge } from '@/lib/topicStatus';
import { filterLocallyAvailableMedications } from '@/lib/localArsenal';
import { supabase } from '@/lib/supabase';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Formularios provenientes de la BD (RequestTemplate) que NO deben mostrarse
// en el tab de Formularios.
const HIDDEN_TEMPLATE_TYPES = ['Estudio Endoscópico', 'Laboratorio Especial'];

// Herramientas del catálogo que aplican a cada categoría, agrupadas por área temática. Los ids
// son los del catálogo (calculators/catalog.js); uno que no exista se ignora.
const CATEGORY_TOOL_SETS = {
  hospitalizados: {
    subtitle: 'Scores y correcciones de uso frecuente en sala, por área temática.',
    groups: [
      { id: 'sepsis', title: 'Sepsis y gravedad', tone: 'rose', Icon: ShieldAlert,
        subtitle: 'Reconocimiento precoz y disfunción orgánica', calcs: ['qsofa', 'sofa', 'shock-index', 'curb-65'] },
      { id: 'cardio', title: 'Cardiovascular', tone: 'rose', Icon: Heart,
        subtitle: 'Síndrome coronario, FA, anticoagulación', calcs: ['heart', 'grace', 'cha2ds2vasc', 'has-bled'] },
      { id: 'trombo', title: 'Tromboembolismo y profilaxis', tone: 'indigo', Icon: Activity,
        subtitle: 'Sospecha de TEP y riesgo trombótico del hospitalizado', calcs: ['wells-tep', 'perc', 'padua', 'caprini'] },
      { id: 'resp', title: 'Respiratorio', tone: 'cyan', Icon: Wind,
        subtitle: 'Oxigenación, alto flujo y derrame pleural', calcs: ['pafi', 'rox', 'light-criteria'] },
      { id: 'electro', title: 'Electrolitos, renal y metabólico', tone: 'blue', Icon: Droplet,
        subtitle: 'Función renal, sodio y potasio, crisis hiperglicémica',
        calcs: ['renal-function', 'hyponatremia-correction', 'hypernatremia-correction', 'hypokalemia-correction', 'hyperkalemia-management', 'hyperglycemic-crisis', 'hypoglycemia-treatment'] },
      { id: 'neuro', title: 'Neurología', tone: 'violet', Icon: Brain,
        subtitle: 'ACV, compromiso de conciencia y cognición', calcs: ['nihss', 'glasgow', 'abcd2', 'moca', 'gds'] },
      { id: 'digestivo', title: 'Digestivo y Hepatología', tone: 'amber', Icon: Pill,
        subtitle: 'Hemorragia digestiva, daño hepático crónico y ascitis',
        calcs: ['glasgow-blatchford', 'meld', 'child-pugh', 'maddrey', 'lille', 'ascitic-fluid', 'r-factor'] },
      { id: 'nutricion', title: 'Nutrición y fragilidad', tone: 'emerald', Icon: Utensils,
        subtitle: 'Tamizaje al ingreso y valoración geriátrica', calcs: ['nrs2002', 'clinical-frailty-scale'] },
      { id: 'analgesia', title: 'Analgesia y paliativos', tone: 'teal', Icon: HeartPulse,
        subtitle: 'Rotación de opioides y sedoanalgesia', calcs: ['opioid-conversion', 'procedural-sedoanalgesia'] },
      { id: 'mental', title: 'Salud Mental', tone: 'slate', Icon: Brain,
        subtitle: 'Evaluación de riesgo en sala', calcs: ['sad-persons'] },
    ],
  },
  urgencias: {
    subtitle: 'Scores de decisión rápida y manejo inicial, por área temática.',
    groups: [
      { id: 'sepsis', title: 'Sepsis y shock', tone: 'rose', Icon: ShieldAlert,
        subtitle: 'Reconocimiento precoz y gravedad', calcs: ['qsofa', 'sofa', 'shock-index'] },
      { id: 'torax', title: 'Dolor torácico y TEP', tone: 'rose', Icon: Heart,
        subtitle: 'Estratificación y descarte', calcs: ['heart', 'wells-tep', 'perc'] },
      { id: 'neuro', title: 'Trauma y neurología', tone: 'violet', Icon: Brain,
        subtitle: 'Conciencia, TEC y ACV', calcs: ['glasgow', 'pecarn', 'nihss', 'abcd2'] },
      { id: 'abdomen', title: 'Abdomen', tone: 'amber', Icon: Pill,
        subtitle: 'Apendicitis y hemorragia digestiva', calcs: ['alvarado', 'glasgow-blatchford'] },
      { id: 'resp', title: 'Respiratorio', tone: 'cyan', Icon: Wind,
        subtitle: 'Neumonía, faringoamigdalitis y oxigenación', calcs: ['curb-65', 'centor-mcisaac', 'pafi'] },
      { id: 'pediatria', title: 'Urgencia pediátrica', tone: 'teal', Icon: Baby,
        subtitle: 'Obstrucción bronquial, crup y dosis', calcs: ['tal', 'score-pulmonar', 'westley', 'pediatric-dose'] },
      { id: 'metabolico', title: 'Metabólico y electrolitos', tone: 'blue', Icon: Droplet,
        subtitle: 'Crisis hiperglicémica, hipoglicemia y potasio', calcs: ['hyperglycemic-crisis', 'hypoglycemia-treatment', 'hyperkalemia-management'] },
      { id: 'procedimientos', title: 'Procedimientos', tone: 'indigo', Icon: Syringe,
        subtitle: 'Intubación y sedoanalgesia', calcs: ['sri', 'procedural-sedoanalgesia'] },
      { id: 'mental', title: 'Salud Mental', tone: 'slate', Icon: Brain,
        subtitle: 'Riesgo suicida', calcs: ['sad-persons'] },
    ],
  },
  policlinico: {
    subtitle: 'Scores y apoyos para el control ambulatorio, por área temática.',
    groups: [
      { id: 'cardio', title: 'Cardiovascular y renal', tone: 'rose', Icon: Heart,
        subtitle: 'Anticoagulación, adherencia y función renal', calcs: ['cha2ds2vasc', 'has-bled', 'morisky-mmas8', 'renal-function'] },
      { id: 'mental', title: 'Salud mental y cognición', tone: 'violet', Icon: Brain,
        subtitle: 'Antidepresivos, riesgo suicida y deterioro cognitivo', calcs: ['antidepressant-switch', 'sad-persons', 'moca', 'gds'] },
      { id: 'resp', title: 'Respiratorio', tone: 'cyan', Icon: Wind,
        subtitle: 'Faringoamigdalitis', calcs: ['centor-mcisaac'] },
      { id: 'reuma', title: 'Reumatología y dolor', tone: 'amber', Icon: Bone,
        subtitle: 'Fibromialgia y funcionalidad', calcs: ['fibromyalgia-acr', 'fiq-r', 'psfs'] },
      { id: 'digestivo', title: 'Digestivo y Hepatología', tone: 'amber', Icon: Pill,
        subtitle: 'Daño hepático crónico y patrón de daño', calcs: ['meld', 'child-pugh', 'r-factor'] },
      { id: 'geriatria', title: 'Geriatría y nutrición', tone: 'emerald', Icon: Utensils,
        subtitle: 'Fragilidad y riesgo nutricional', calcs: ['clinical-frailty-scale', 'nrs2002'] },
      { id: 'pediatria', title: 'Pediatría', tone: 'teal', Icon: Baby,
        subtitle: 'Dosis y alimentación del lactante', calcs: ['pediatric-dose', 'pediatric-nutrition'] },
      { id: 'lactancia', title: 'Lactancia', tone: 'rose', Icon: HeartPulse,
        subtitle: 'Compatibilidad de fármacos con la lactancia', calcs: ['lactation-drugs'] },
    ],
  },
  gyo: {
    subtitle: 'Apoyos para el parto, el puerperio y la cirugía ginecológica.',
    groups: [
      { id: 'obstetricia', title: 'Obstetricia', tone: 'rose', Icon: Baby,
        subtitle: 'Evaluación cervical para inducción', calcs: ['bishop'] },
      { id: 'lactancia', title: 'Puerperio y lactancia', tone: 'rose', Icon: HeartPulse,
        subtitle: 'Compatibilidad de fármacos con la lactancia', calcs: ['lactation-drugs'] },
      { id: 'trombo', title: 'Profilaxis tromboembólica', tone: 'indigo', Icon: Activity,
        subtitle: 'Riesgo trombótico en cirugía ginecológica', calcs: ['caprini'] },
    ],
  },
  ges: {
    subtitle: 'Scores que apoyan el manejo de problemas de salud GES frecuentes.',
    groups: [
      { id: 'cardio', title: 'Cardiovascular (HTA, DM, IAM)', tone: 'rose', Icon: Heart,
        subtitle: 'Riesgo, anticoagulación, adherencia y función renal', calcs: ['heart', 'grace', 'cha2ds2vasc', 'has-bled', 'morisky-mmas8', 'renal-function'] },
      { id: 'neuro', title: 'ACV y demencia', tone: 'violet', Icon: Brain,
        subtitle: 'Severidad del ACV, riesgo post-AIT y cognición', calcs: ['nihss', 'abcd2', 'moca', 'gds'] },
      { id: 'resp', title: 'Respiratorio (NAC, asma, IRA)', tone: 'cyan', Icon: Wind,
        subtitle: 'Gravedad de neumonía y obstrucción bronquial', calcs: ['curb-65', 'tal', 'score-pulmonar'] },
      { id: 'mental', title: 'Depresión', tone: 'slate', Icon: Brain,
        subtitle: 'Cambio de antidepresivo y riesgo suicida', calcs: ['antidepressant-switch', 'sad-persons'] },
      { id: 'paliativos', title: 'Alivio del dolor y cuidados paliativos', tone: 'teal', Icon: HeartPulse,
        subtitle: 'Rotación de opioides', calcs: ['opioid-conversion'] },
    ],
  },
};

// Qué set corresponde a la categoría: primero por su nombre y, si no, por las subcategorías de sus temas.
function categoryToolSetKey(category, flags) {
  const name = (category?.name || '').toLowerCase();
  if (name.includes('hospitaliz')) return 'hospitalizados';
  if (name.includes('urgenc')) return 'urgencias';
  if (name.includes('policl')) return 'policlinico';
  if (name.includes('ginec') || name.includes('obstet')) return 'gyo';
  if (/\bges\b/.test(name)) return 'ges';
  if (flags.hasHospitalizados) return 'hospitalizados';
  if (flags.hasUrgencias) return 'urgencias';
  if (flags.hasPolicinico) return 'policlinico';
  return null;
}

const CALCULATOR_INDEX = Object.fromEntries(allCalculators.map(c => [c.id, c]));

const FORM_ICON_CLASS = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl';
const SSN2026_TAG = '[SSÑ-2026]';
const CATEGORY_TABS = ['topics', 'tools', 'templates', 'gestiones'];

// Tarjeta compacta de una herramienta del catálogo (tab Herramientas).
function CalcCard({ calc, tone, index }) {
  const t = FORM_TONES[tone] || FORM_TONES.slate;
  const Icon = calc.icon || Calculator;
  const [name, hint] = calc.name.split(' — ');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.03 }}
      className="h-full"
    >
      <Link
        to={createPageUrl(`AllCalculators?calc=${calc.id}`)}
        className={`group flex h-full items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${t.card}`}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.icon}`}>
          <Icon className="h-[18px] w-[18px] text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
          {hint && <p className="truncate text-xs text-slate-500">{hint}</p>}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </Link>
    </motion.div>
  );
}

// Tarjeta de formulario: forma uniforme; al pasar el mouse (o enfocar con
// teclado) despliega la lista de lo que se puede solicitar.
function FormCard({ form, index, selectable = false, selected = false, onToggle }) {
  const tone = FORM_TONES[form.tone] || FORM_TONES.slate;
  const Icon = form.Icon;
  const canSelect = selectable && !!form.multiId;
  const body = (
    <div className={`relative flex h-full flex-col rounded-2xl border p-4 transition-all duration-200 ${
      selectable
        ? canSelect
          ? `cursor-pointer ${selected ? 'ring-2 ring-violet-500 border-violet-400 bg-violet-50/60' : tone.card}`
          : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-50'
        : `hover:-translate-y-0.5 hover:shadow-md ${tone.card}`
    }`}>
      {selectable && canSelect && (
        <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
          selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white text-transparent'
        }`}>
          <Check className="h-4 w-4" />
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className={`${FORM_ICON_CLASS} ${tone.icon}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold leading-snug text-slate-900 ${selectable ? 'pr-6' : ''}`}>{form.title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{form.description}</p>
          {selectable && !canSelect && (
            <p className="mt-1 text-[11px] font-medium text-slate-400">No admite datos compartidos</p>
          )}
        </div>
        {!selectable && (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
        )}
      </div>
      {!selectable && form.details?.length > 0 && (
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="mt-3 border-t border-slate-900/5 pt-3">
              <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wider ${tone.label}`}>Puedes solicitar</p>
              <div className="flex flex-wrap gap-1.5">
                {form.details.map(d => (
                  <span key={d} className={`rounded-md px-2 py-0.5 text-xs font-medium ${tone.chip}`}>{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  if (selectable) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }} className="h-full">
        <button
          type="button"
          disabled={!canSelect}
          aria-pressed={selected}
          onClick={() => canSelect && onToggle?.(form.multiId)}
          className="block h-full w-full rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          {body}
        </button>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      className="h-full"
    >
      <Link to={form.href} className="group block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
        {body}
      </Link>
    </motion.div>
  );
}

export default function Category() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');
  const initialTopicFilter = urlParams.get('topicFilter') || 'all';
  const initialSubcategory = urlParams.get('topicArea') || 'all';
  const initialTab = CATEGORY_TABS.includes(urlParams.get('tab')) ? urlParams.get('tab') : 'topics';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory);
  const [activeTopicFilter, setActiveTopicFilter] = useState(initialTopicFilter);
  const [gestionesTab, setGestionesTab] = useState('programas');
  const [arsenalSearch, setArsenalSearch] = useState('');
  const [arsenalSource, setArsenalSource] = useState('all'); // all | bulnes | ssn
  // Selección múltiple de formularios (tab Formularios)
  const [multiMode, setMultiMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState([]);
  const [multiOpen, setMultiOpen] = useState(false);
  const toggleMulti = (id) => setMultiSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const exitMultiMode = () => { setMultiMode(false); setMultiSelected([]); setMultiOpen(false); };
  const didRestoreReturnPoint = useRef(false);
  const pendingRestoreScroll = useRef(null);

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

  const categoryTools = tools.filter(tool => !isHiddenClinicalTool(tool));

  // El Formulario de Constancia GES llega como ClinicalTool en algunas
  // categorías; se muestra como formulario (tab Formularios), no como
  // herramienta.
  const hasGesConstancia = tools.some(tool => isHiddenGesConstanciaTool(tool?.name));

  const hasPolicinico = topics.some(t => t.subcategory === 'Policlínico') ||
    category?.slug?.includes('policlin') ||
    category?.name?.toLowerCase().includes('policl');
  const hasHospitalizados = topics.some(t => t.subcategory === 'Hospitalizados') ||
    category?.slug?.includes('hospitaliz') ||
    category?.name?.toLowerCase().includes('hospitaliz');
  const hasUrgencias = topics.some(t => t.subcategory?.toLowerCase().includes('urgenc')) ||
    category?.slug?.includes('urgenc') ||
    category?.name?.toLowerCase().includes('urgenc');

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', categoryId],
    queryFn: () => db.entities.RequestTemplate.filter({ category_id: categoryId }),
    enabled: !!categoryId
  });
  const visibleTemplates = templates.filter(template => !HIDDEN_TEMPLATE_TYPES.includes(template.type));

  const toolSet = CATEGORY_TOOL_SETS[categoryToolSetKey(category, { hasHospitalizados, hasUrgencias, hasPolicinico })] || null;
  const toolSetSections = useMemo(() => (toolSet?.groups || [])
    .map(g => ({ ...g, calcs: g.calcs.map(id => CALCULATOR_INDEX[id]).filter(Boolean) }))
    .filter(g => g.calcs.length > 0), [toolSet]);
  const toolSetCount = toolSetSections.reduce((n, g) => n + g.calcs.length, 0);
  // No se repiten las herramientas de la BD que ya están en el set de la categoría.
  const toolSetCalcIds = new Set(toolSetSections.flatMap(g => g.calcs.map(c => c.id)));
  const visibleTools = categoryTools.filter(tool => !toolSetCalcIds.has(clinicalToolCalculatorId(tool)));

  const { data: medications = [], isLoading: loadingMedications } = useQuery({
    queryKey: ['category-arsenal-medications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('id,name,active_ingredient,presentation,dose_value,dose_unit,category,restrictions,is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return filterLocallyAvailableMedications(data);
    },
    enabled: activeTab === 'gestiones' && hasHospitalizados,
  });

  const matchesTopicFilter = (topic) => {
    if (activeTopicFilter === 'local') return getTopicProtocolStatus(topic) === 'local';
    if (activeTopicFilter === 'checklist') return getTopicProtocolStatus(topic) === 'checklist';
    if (activeTopicFilter === 'none') return getTopicProtocolStatus(topic) === 'none';
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
    // Especialidades clínicas
    'Cardiovascular',
    'Neurología',
    'Salud Mental',
    'Traumatología y Rehabilitación',
    'Respiratorio',
    'Endocrinología y Metabólico',
    'Nefrología y Electrolitos',
    'Nefrología y Urología',
    'Hematología',
    'Infectología',
    'Nutrición',
    'Pediatría',
    'Pediatría y Neonatología',
    'Oftalmología',
    'Oncología',
    'Ginecología y Obstetricia',
    'Digestivo y Hepatología',
    'Reumatología e Inmunología',
    'Otorrinolaringología',
    'Odontología y Salud Oral',
    // Transversales
    'Urgencias y Emergencias',
    'Procedimientos',
    'Cuidados Paliativos',
    'Seguridad del Paciente',
    'Herramientas Clínicas',
    'GES General',
    'Patologías Prevalentes',
    'Protocolos Locales',
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

  const localCount = topics.filter(t => getTopicProtocolStatus(t) === 'local').length;
  const checklistCount = topics.filter(t => getTopicProtocolStatus(t) === 'checklist').length;
  const noneCount = topics.filter(t => getTopicProtocolStatus(t) === 'none').length;
  const gesCount = topics.filter(t => t.clasificacion_ges === 'GES').length;
  const isGesCategory = (category?.name || '').toLowerCase().includes('ges');

  const topicFilterOptions = [
    { value: 'all', count: topics.length, label: `Todos (${topics.length})` },
    { value: 'local', count: localCount, label: `Con protocolo local (${localCount})` },
    // 'Pauta de cotejo' aplica solo a la categoría GES
    ...(isGesCategory ? [{ value: 'checklist', count: checklistCount, label: `Solo pauta de cotejo (${checklistCount})` }] : []),
    { value: 'none', count: noneCount, label: `Sin protocolo${isGesCategory ? ' ni pauta' : ''} (${noneCount})` },
    ...(isGesCategory ? [] : [{ value: 'ges', count: gesCount, label: `GES (${gesCount})` }]),
  ];
  const meaningfulTopicFilterOptions = topicFilterOptions.filter((option) =>
    option.value === 'all' || (option.count > 0 && option.count < topics.length)
  );
  const shouldShowTopicFilters = meaningfulTopicFilterOptions.length > 1;
  const shouldShowAreaFilters = subcategories.length > 1;
  const shouldShowFilterPanel = shouldShowTopicFilters || shouldShowAreaFilters;

  const arsenalCounts = useMemo(() => {
    let ssn = 0;
    medications.forEach((med) => { if ((med.restrictions || '').includes(SSN2026_TAG)) ssn += 1; });
    return { total: medications.length, ssn, bulnes: medications.length - ssn };
  }, [medications]);

  const filteredMedications = useMemo(() => {
    const q = arsenalSearch.trim().toLowerCase();
    return medications.filter((med) => {
      const isSsn = (med.restrictions || '').includes(SSN2026_TAG);
      if (arsenalSource === 'bulnes' && isSsn) return false;
      if (arsenalSource === 'ssn' && !isSsn) return false;
      if (!q) return true;
      const haystack = [
        med.name,
        med.active_ingredient,
        med.presentation,
        med.category,
        med.restrictions,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [arsenalSearch, arsenalSource, medications]);

  const medicationCategories = useMemo(() => {
    const counts = new Map();
    medications.forEach((med) => {
      const key = med.category || 'Sin categoría';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .slice(0, 8);
  }, [medications]);

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
    if (activeTab !== 'topics') nextParams.set('tab', activeTab);
    else nextParams.delete('tab');
    if (activeTopicFilter !== 'all') nextParams.set('topicFilter', activeTopicFilter);
    else nextParams.delete('topicFilter');
    if (activeSubcategory !== 'all') nextParams.set('topicArea', activeSubcategory);
    else nextParams.delete('topicArea');

    const nextSearch = nextParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [activeTab, activeSubcategory, activeTopicFilter, categoryId]);

  const saveCategoryReturnPoint = useCallback(() => {
    if (!categoryId) return;
    const nextParams = new URLSearchParams(window.location.search);
    if (categoryId) nextParams.set('id', categoryId);
    if (activeTab !== 'topics') nextParams.set('tab', activeTab);
    else nextParams.delete('tab');
    if (activeTopicFilter !== 'all') nextParams.set('topicFilter', activeTopicFilter);
    else nextParams.delete('topicFilter');
    if (activeSubcategory !== 'all') nextParams.set('topicArea', activeSubcategory);
    else nextParams.delete('topicArea');
    const search = nextParams.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ''}`;
    try {
      sessionStorage.setItem(`category-return:${categoryId}`, JSON.stringify({
        categoryId,
        url,
        activeTab,
        activeSubcategory,
        activeTopicFilter,
        gestionesTab,
        arsenalSearch,
        arsenalSource,
        scrollY: window.scrollY,
        savedAt: Date.now(),
      }));
    } catch {
      // Best-effort navigation memory.
    }
  }, [activeTab, activeSubcategory, activeTopicFilter, arsenalSearch, arsenalSource, categoryId, gestionesTab]);

  useEffect(() => {
    if (!categoryId || didRestoreReturnPoint.current) return;
    didRestoreReturnPoint.current = true;
    try {
      const saved = JSON.parse(sessionStorage.getItem(`category-return:${categoryId}`) || 'null');
      if (!saved || saved.categoryId !== categoryId) return;
      const params = new URLSearchParams(window.location.search);
      if (!params.has('tab') && CATEGORY_TABS.includes(saved.activeTab)) setActiveTab(saved.activeTab);
      if (!params.has('topicArea') && saved.activeSubcategory) setActiveSubcategory(saved.activeSubcategory);
      if (!params.has('topicFilter') && saved.activeTopicFilter) setActiveTopicFilter(saved.activeTopicFilter);
      if (saved.gestionesTab) setGestionesTab(saved.gestionesTab);
      if (saved.arsenalSearch) setArsenalSearch(saved.arsenalSearch);
      if (saved.arsenalSource) setArsenalSource(saved.arsenalSource);
      pendingRestoreScroll.current = saved.scrollY || 0;
      window.setTimeout(() => window.scrollTo({ top: pendingRestoreScroll.current || 0, behavior: 'auto' }), 120);
    } catch {
      sessionStorage.removeItem(`category-return:${categoryId}`);
    }
  }, [categoryId]);

  useEffect(() => {
    if (loadingCategory || loadingTopics || pendingRestoreScroll.current === null) return;
    const target = pendingRestoreScroll.current;
    window.setTimeout(() => {
      window.scrollTo({ top: target, behavior: 'auto' });
      pendingRestoreScroll.current = null;
    }, 80);
  }, [loadingCategory, loadingTopics, topics.length]);

  useEffect(() => {
    const handlePageHide = () => saveCategoryReturnPoint();
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      handlePageHide();
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [saveCategoryReturnPoint]);

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
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit max-w-full overflow-x-auto [&>*]:shrink-0 [&>*]:whitespace-nowrap">
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
          {(visibleTools.length > 0 || toolSetCount > 0) && (
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'tools'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              Herramientas ({visibleTools.length + toolSetCount})
            </button>
          )}
          {(templates.length > 0 || hasPolicinico || hasHospitalizados || hasUrgencias || hasGesConstancia) && (
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'templates'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              {hasPolicinico ? 'Documentos' : 'Formularios'}
            </button>
          )}
          {(hasHospitalizados || hasPolicinico) && (
            <button
              onClick={() => setActiveTab('gestiones')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'gestiones'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="h-4 w-4" />
              Gestiones
            </button>
          )}
          <Link
            to={createPageUrl('PrescripcionInteligente')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 hover:shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            Prescripción Inteligente
          </Link>
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
                              state={{ fromCategoryUrl: `${window.location.pathname}${window.location.search}` }}
                              onClick={saveCategoryReturnPoint}
                              className={`group block bg-white rounded-2xl p-6 border transition-all h-full ${
                                (topic.tipo_contenido || []).includes('flujo_local')
                                  ? 'border-sky-100 hover:border-sky-300 hover:shadow-xl ring-2 ring-sky-50'
                                  : topic.has_local_protocol
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
                                    {(topic.tipo_contenido || []).includes('protocolo') && !topic.has_local_protocol && !hasMinsalOrdinarioBadge(topic) && !hasSsnOrdinarioBadge(topic) && (
                                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Protocolo</Badge>
                                    )}
                                    {(topic.tipo_contenido || []).includes('contenido_medico') && (
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Contenido Médico</Badge>
                                    )}
                                    {(topic.tipo_contenido || []).includes('tema_complementario') && (
                                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Tema Complementario</Badge>
                                    )}
                                    {(topic.tipo_contenido || []).includes('herramienta_clinica') && (
                                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Herramienta</Badge>
                                    )}
                                    {(topic.tipo_contenido || []).includes('flujo_local') && (
                                      <Badge className="bg-sky-100 text-sky-700 border-sky-200 flex items-center gap-1 text-xs font-semibold">
                                        <ClipboardList className="h-3 w-3" />
                                        Flujo local
                                      </Badge>
                                    )}
                                    {localContentPending(topic) && <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs">Contenido local pendiente</Badge>}
                                    {getTopicProtocolStatus(topic) === 'local' && (
                                      <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1 text-xs font-semibold">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Protocolo Local
                                      </Badge>
                                    )}
                                    {hasSsnProtocolBadge(topic) && (
                                      <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-1 text-xs font-semibold">
                                        Protocolo SSÑ
                                      </Badge>
                                    )}
                                    {hasMinsalOrdinarioBadge(topic) && (
                                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 text-xs font-semibold">
                                        Ordinario MINSAL
                                      </Badge>
                                    )}
                                    {hasSsnOrdinarioBadge(topic) && (
                                      <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-1 text-xs font-semibold">
                                        Ordinario SSÑ
                                      </Badge>
                                    )}
                                    {getTopicProtocolStatus(topic) === 'checklist' && (
                                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1 text-xs font-semibold">
                                        <ClipboardList className="h-3 w-3" />
                                        Pauta de cotejo
                                      </Badge>
                                    )}
                                    {(() => {
                                      const vs = getProtocolValidityStatus(topic.protocol_validity);
                                      if (!vs) return null;
                                      const styles = {
                                        vigente:  'bg-emerald-50 text-emerald-700 border-emerald-200',
                                        proximo:  'bg-amber-50 text-amber-700 border-amber-200',
                                        vencido:  'bg-red-50 text-red-700 border-red-200',
                                      };
                                      const labels = { vigente: 'Vigente', proximo: 'Próx. a vencer', vencido: 'Vencido' };
                                      return (
                                        <Badge className={`${styles[vs]} flex items-center gap-1 text-xs`}>
                                          {labels[vs]}
                                        </Badge>
                                      );
                                    })()}
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
                                  (topic.tipo_contenido || []).includes('flujo_local') ? 'text-sky-600'
                                  : (topic.tipo_contenido || []).includes('protocolo') ? 'text-green-600'
                                  : (topic.tipo_contenido || []).includes('herramienta_clinica') ? 'text-purple-600'
                                  : 'text-blue-600'
                                }`}>
                                  {(topic.tipo_contenido || []).includes('flujo_local') ? 'Ver flujo'
                                    : (topic.tipo_contenido || []).includes('protocolo') ? 'Ver protocolo'
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
          <div className="space-y-8">
            {visibleTools.length > 0 && (
              <section className="space-y-3">
                {hasHospitalizados && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-600">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Recursos de la categoría</h2>
                      <p className="text-xs text-slate-500">Guías, protocolos y recursos propios</p>
                    </div>
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{visibleTools.length}</span>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
            {visibleTools.map((tool, index) => {
              const isExternal = tool.reference_url && tool.reference_url.startsWith('http');
              const isInternal = tool.reference_url && !isExternal;
              const cardClass = "group block h-full bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-lg transition-all";
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
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                          Externo ↗
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
                  ) : isInternal ? (
                    <Link to={tool.reference_url} className={cardClass}>
                      {inner}
                    </Link>
                  ) : (
                    <Link to={createPageUrl(`ClinicalTools?tool=${tool.id}`)} className={cardClass}>
                      {inner}
                    </Link>
                  )}
                </motion.div>
              );
            })}
                </div>
              </section>
            )}

            {/* Herramientas del catálogo que aplican a la categoría, por área */}
            {toolSetCount > 0 && (() => {
              let counter = 0;
              return (
                <div className={`space-y-8 ${visibleTools.length > 0 ? 'border-t border-slate-200/80 pt-6' : ''}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <Stethoscope className="h-4 w-4 text-violet-600" />
                        Herramientas
                      </h2>
                      <p className="text-xs text-slate-500">{toolSet.subtitle}</p>
                    </div>
                    <Link to={createPageUrl('AllCalculators')} className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline">
                      Ver todas <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {toolSetSections.map(section => {
                    const GroupIcon = section.Icon;
                    return (
                      <section key={section.id} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-600">
                            <GroupIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{section.title}</h3>
                            <p className="text-xs text-slate-500">{section.subtitle}</p>
                          </div>
                          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{section.calcs.length}</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {section.calcs.map(calc => <CalcCard key={calc.id} calc={calc} tone={section.tone} index={counter++} />)}
                        </div>
                      </section>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (() => {
          const ctx = { hasHospitalizados, hasPolicinico, hasUrgencias, hasGesConstancia };
          const staticForms = STATIC_FORMS
            .filter(f => f.show(ctx))
            .map(f => ({ ...f, key: f.route, href: createPageUrl(f.route), multiId: EXTERNAL_FORMS.find(e => e.route === f.route)?.id || null }));
          const dbForms = visibleTemplates.map(t => {
            const meta = TEMPLATE_TYPE_META[t.type] || TEMPLATE_TYPE_META.default;
            return {
              key: t.id, group: meta.group, tone: meta.tone, Icon: meta.Icon,
              title: t.name,
              description: t.instructions || t.type,
              details: t.instructions ? [t.type] : [],
              href: createPageUrl(`Templates?id=${t.id}`),
              multiId: isMultiEligibleTemplate(t) ? t.id : null,
            };
          });
          const all = [...staticForms, ...dbForms];
          const sections = FORM_GROUPS
            .map(g => ({ ...g, forms: all.filter(f => f.group === g.id) }))
            .filter(g => g.forms.length > 0);
          let counter = 0;
          const selectableCount = all.filter(f => f.multiId).length;
          return (
            <div className="space-y-8">
              {selectableCount > 1 && (
                <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 transition-colors ${multiMode ? 'border-violet-300 bg-violet-50' : 'border-dashed border-violet-200 bg-white'}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${multiMode ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'}`}>
                    <CheckSquare className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {multiMode ? 'Marca los documentos para este paciente' : 'Varios documentos para el mismo paciente'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {multiMode
                        ? `${multiSelected.length} ${multiSelected.length === 1 ? 'seleccionado' : 'seleccionados'} · los datos del paciente se piden una sola vez`
                        : 'Selecciona varios, llena los datos una vez y abre cada documento para verlo y editarlo.'}
                    </p>
                  </div>
                  {multiMode ? (
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={exitMultiMode} className="gap-1 text-slate-600">
                        <X className="h-4 w-4" /> Cancelar
                      </Button>
                      <Button type="button" size="sm" disabled={multiSelected.length === 0} onClick={() => setMultiOpen(true)} className="gap-1 bg-violet-600 hover:bg-violet-700">
                        Continuar <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => setMultiMode(true)} className="gap-1 border-violet-300 text-violet-700 hover:bg-violet-50">
                      <CheckSquare className="h-4 w-4" /> Seleccionar varios
                    </Button>
                  )}
                </div>
              )}
              {sections.map(section => {
                const GroupIcon = section.Icon;
                return (
                  <section key={section.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-600">
                        <GroupIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">{section.title}</h2>
                        <p className="text-xs text-slate-500">{section.subtitle}</p>
                      </div>
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {section.forms.length}
                      </span>
                    </div>
                    <div className="grid items-start gap-3 sm:grid-cols-2">
                      {section.forms.map(form => (
                        <FormCard
                          key={form.key}
                          form={form}
                          index={counter++}
                          selectable={multiMode}
                          selected={!!form.multiId && multiSelected.includes(form.multiId)}
                          onToggle={toggleMulti}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
              {sections.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Esta categoría no tiene formularios disponibles.
                </p>
              )}
              {multiMode && multiSelected.length > 0 && !multiOpen && (
                <div className="sticky bottom-4 z-30 flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-violet-700">{multiSelected.length}</span> {multiSelected.length === 1 ? 'documento seleccionado' : 'documentos seleccionados'}
                  </p>
                  <Button type="button" onClick={() => setMultiOpen(true)} className="gap-1 bg-violet-600 hover:bg-violet-700">
                    Continuar con los datos <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {multiOpen && (
                <MultiTemplateGenerator
                  open
                  handoff
                  templates={visibleTemplates}
                  initialSelectedIds={multiSelected}
                  onClose={exitMultiMode}
                />
              )}
            </div>
          );
        })()}

        {activeTab === 'gestiones' && hasPolicinico && (
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to={createPageUrl(`GestionCardiovascular?categoryId=${encodeURIComponent(categoryId)}`)}
              className="group rounded-2xl border border-teal-200 bg-teal-50/80 p-5 transition-all hover:border-teal-400 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Programa de Salud Cardiovascular</h2>
                  <p className="mt-1 text-sm text-slate-600">Espacio de trabajo con gestiones, agenda anual, nóminas, arsenal y protocolos integrados.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
                    Abrir gestión <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Gestiones Tab — Hospitalizados */}
        {activeTab === 'gestiones' && hasHospitalizados && (
          <motion.div
            key="gestiones-panel"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="flex flex-wrap gap-2 rounded-2xl border border-teal-100 bg-teal-50/70 p-1.5 w-fit">
              <button
                type="button"
                onClick={() => setGestionesTab('programas')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  gestionesTab === 'programas'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-teal-700 hover:bg-white/60'
                }`}
              >
                <Activity className="h-4 w-4" />
                Programas
              </button>
              <button
                type="button"
                onClick={() => setGestionesTab('arsenal')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  gestionesTab === 'arsenal'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-teal-700 hover:bg-white/60'
                }`}
              >
                <Pill className="h-4 w-4" />
                Arsenal farmacológico
              </button>
            </div>

            {gestionesTab === 'programas' && (
              <motion.div
                key="gestiones-programas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="grid md:grid-cols-2 gap-4"
              >
                <Link to={createPageUrl('GestionPROA')} className="group block">
                  <div className="h-full rounded-2xl border border-teal-200 bg-teal-50/80 p-5 transition-all hover:border-teal-300 hover:bg-teal-50 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 transition-transform group-hover:scale-105">
                        <ShieldPlus className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">PROA</p>
                          <Badge className="bg-teal-100 text-teal-800 border-teal-200">Disponible</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Herramientas del Programa de Optimización del Uso de Antimicrobianos: plantillas y seguimiento operativo.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
                          Abrir gestión <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link to={createPageUrl('VistaHospitalizados')} className="group block">
                  <div className="h-full rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 transition-all hover:border-emerald-400 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 transition-transform group-hover:scale-105">
                        <Database className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900">Vista general</p>
                          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">Acceso protegido</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Panel operativo protegido para coordinación hospitalaria y generación de documentos.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                          Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {gestionesTab === 'arsenal' && (
              <motion.div
                key="gestiones-arsenal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
                        <Pill className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">Arsenal farmacológico HCSFB</p>
                        <p className="text-sm text-slate-500">
                          {arsenalCounts.total} medicamentos activos · {arsenalCounts.bulnes} de Bulnes · {arsenalCounts.ssn} de Ñuble (SSÑ-2026).
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/PrescripcionInteligente/arsenal"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                    >
                      Administrar arsenal <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr),auto] lg:items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={arsenalSearch}
                        onChange={(event) => setArsenalSearch(event.target.value)}
                        placeholder="Buscar por medicamento, principio activo, presentación o categoría"
                        className="pl-10"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {medicationCategories.slice(0, 4).map(([name, count]) => (
                        <Badge key={name} variant="outline" className="bg-slate-50 text-slate-600">
                          {name} ({count})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Separación por arsenal: Bulnes vs Ñuble (SSÑ-2026) */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: `Todos (${arsenalCounts.total})` },
                      { key: 'bulnes', label: `Arsenal Bulnes (${arsenalCounts.bulnes})` },
                      { key: 'ssn', label: `Arsenal Ñuble · SSÑ-2026 (${arsenalCounts.ssn})` },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setArsenalSource(opt.key)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          arsenalSource === opt.key
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingMedications ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                    Cargando arsenal farmacológico...
                  </div>
                ) : filteredMedications.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                    <Pill className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No se encontraron medicamentos con ese filtro.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredMedications.slice(0, 18).map((med) => {
                      const cleanRestrictions = (med.restrictions || '').replace(SSN2026_TAG, '').trim();
                      const isSsn2026 = (med.restrictions || '').includes(SSN2026_TAG);
                      return (
                        <div key={med.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-200 hover:shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                              <Pill className="h-4 w-4 text-emerald-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 leading-snug">{med.name}</p>
                              <p className="text-xs text-slate-500 truncate">{med.active_ingredient}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <Package className="h-3 w-3" />
                              {med.presentation}
                            </Badge>
                            <Badge variant="outline">{med.dose_value} {med.dose_unit}</Badge>
                            {med.category && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">{med.category}</Badge>
                            )}
                            {isSsn2026 && (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-300">SSÑ-2026</Badge>
                            )}
                          </div>
                          {cleanRestrictions && (
                            <p className="mt-2 text-xs leading-relaxed text-slate-500">{cleanRestrictions}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredMedications.length > 18 && (
                  <p className="text-xs text-slate-500">
                    Mostrando 18 de {filteredMedications.length} resultados. Usa el buscador para acotar la lista o abre la administración completa.
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
