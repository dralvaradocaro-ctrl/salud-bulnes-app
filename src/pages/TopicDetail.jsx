const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import FlowTimeline from '@/components/topic/FlowTimeline';
import GESGuarantee from '@/components/topic/GESGuarantee';
import ClinicalInfo from '@/components/topic/ClinicalInfo';
import SRICalculator from '@/components/calculators/SRICalculator';
import NRS2002Calculator from '@/components/calculators/NRS2002Calculator';
import ProtocolHeader from '@/components/topic/ProtocolHeader';
import ProtocolFlowchart from '@/components/topic/ProtocolFlowchart';
import MedicationCard from '@/components/topic/MedicationCard';
import PolicinicTable from '@/components/topic/PolicinicTable';
import FlowDiagram from '@/components/topic/FlowDiagram';
import PolicinicGuide from '@/components/topic/PolicinicGuide';
import ResponsiveTopicLayout from '@/components/topic/ResponsiveTopicLayout';
import GESStructuredFallback from '@/components/topic/GESStructuredFallback';
import { getTopicVisual } from '@/lib/topicVisuals';
import { hasGuaranteeContent, extractGuaranteeStages } from '@/lib/guarantees';
import { getGesTopicMeta, buildGesClinicalBlock } from '@/lib/ges';
import ReactMarkdown from 'react-markdown';
import {
  ChevronLeft,
  CheckCircle2,
  FileText,
  GitBranch,
  Tag,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Helper functions for special content rendering
const shouldRenderSpecial = (topic) => {
  const name = topic.name.toLowerCase();
  return name.includes('flujo de acv') || 
         name.includes('suplementación') || 
         name.includes('cuerpo extraño') ||
         name.includes('códigos cie-10') ||
         name.includes('imagenología') ||
         name.includes('guía de atenciones');
};

const renderSpecialContent = (topic) => {
  const name = topic.name.toLowerCase();

  // Flujo ACV en Policlínico
  if (name.includes('flujo de acv')) {
    const acvSteps = [
      {
        title: "1. Evaluación Inicial en Policlínico",
        description: "Primera evaluación del paciente con antecedente de ACV o AIT",
        actions: [
          "Identificación de paciente con secuelas de ACV o AIT",
          "Evaluación clínica del estado neurológico actual",
          "Revisión de factores de riesgo cardiovascular"
        ]
      },
      {
        title: "2. Solicitud de Interconsulta a Neurología (No GES)",
        actions: [
          "Completar SIC (Solicitud de Interconsulta) para neurología",
          "Especificar motivo de derivación y antecedentes relevantes",
          "La SIC debe ser descargada del sistema"
        ]
      },
      {
        title: "3. Envío de Documentación",
        description: "Coordinación con especialista",
        actions: [
          "Enviar SIC por correo electrónico a: roberto.aguilera.96@hotmail.com",
          "Adjuntar exámenes complementarios si están disponibles",
          "Incluir resumen clínico del paciente"
        ]
      },
      {
        title: "4. Gestión con Servicio de Salud Ñuble",
        description: "Coordinación de exámenes y evaluación especializada",
        actions: [
          "Asignación de hora para TC cerebral (si corresponde)",
          "Asignación de hora con médico neurólogo",
          "El paciente será contactado con las horas asignadas"
        ]
      },
      {
        title: "5. Seguimiento",
        description: "Control mientras se espera evaluación neurológica",
        actions: [
          "Mantener control en policlínico",
          "Asegurar adherencia a tratamiento actual",
          "Educar sobre signos de alarma"
        ]
      }
    ];

    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-blue-600" />
          Flujo de Derivación ACV No Agudo
        </h2>
        <div className="relative">
          {/* Línea conectora vertical */}
          <div className="absolute left-6 top-12 bottom-12 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200"></div>
          
          <div className="space-y-6">
            {acvSteps.map((step, index) => (
              <div key={index} className="relative pl-16">
                {/* Círculo numerado */}
                <div className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                  index === 0 ? 'bg-blue-600' :
                  index === 1 ? 'bg-purple-600' :
                  index === 2 ? 'bg-indigo-600' :
                  index === 3 ? 'bg-violet-600' :
                  'bg-green-600'
                }`}>
                  {index + 1}
                </div>
                
                {/* Contenido */}
                <div className={`p-6 rounded-2xl border-2 ${
                  index === 0 ? 'bg-blue-50 border-blue-200' :
                  index === 1 ? 'bg-purple-50 border-purple-200' :
                  index === 2 ? 'bg-indigo-50 border-indigo-200' :
                  index === 3 ? 'bg-violet-50 border-violet-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="text-sm text-slate-700 mb-3">{step.description}</p>
                  )}
                  <div className="space-y-2">
                    {step.actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-white/60 rounded-lg p-3">
                        <span className="text-blue-600 font-bold">•</span>
                        <span className="text-slate-800">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Suplementación en Lactantes
  if (name.includes('suplementación')) {
    return (
      <div className="mb-10 space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Guía de Suplementación</h3>
          <ReactMarkdown 
            className="prose prose-slate max-w-none"
            components={{
              h3: ({children}) => <h3 className="text-lg font-bold text-blue-900 mt-6 mb-3">{children}</h3>,
              h4: ({children}) => <h4 className="text-base font-semibold text-slate-800 mt-4 mb-2">{children}</h4>,
              ul: ({children}) => <ul className="space-y-2 ml-4">{children}</ul>,
              li: ({children}) => <li className="text-slate-700">{children}</li>,
              strong: ({children}) => <strong className="text-blue-700 font-bold">{children}</strong>
            }}
          >
            {topic.clinical_summary}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Cuerpo Extraño - Flowchart
  if (name.includes('cuerpo extraño')) {
    const steps = [
      {
        title: "Evaluación Inicial del Riesgo",
        description: "Clasificar el cuerpo extraño según ubicación y características",
        type: "decision",
        options: ["Alto Riesgo (punta afilada, batería, imán)", "Bajo Riesgo (objeto romo, pequeño)"]
      },
      {
        title: "Cuerpo Extraño de ALTO RIESGO",
        description: "Requiere manejo prioritario y vigilancia estrecha",
        type: "alert",
        actions: [
          "Evaluación endoscópica urgente",
          "Control radiográfico cada 12-24 horas",
          "Considerar hospitalización",
          "Si no elimina en 7 días → Cirugía"
        ]
      },
      {
        title: "Cuerpo Extraño de BAJO RIESGO - Ubicación Esofágica",
        actions: [
          "Extracción endoscópica",
          "Observación post-procedimiento",
          "Control radiográfico según evolución"
        ]
      },
      {
        title: "Cuerpo Extraño de BAJO RIESGO - Ubicación Gástrica",
        actions: [
          "Observación ambulatoria",
          "Control radiográfico en 72 horas",
          "Si no progresa → re-evaluación endoscópica"
        ]
      },
      {
        title: "Cuerpo Extraño de BAJO RIESGO - Ubicación Intestinal",
        actions: [
          "Observación ambulatoria",
          "Control radiográfico cada 7 días",
          "Evaluar cirugía si no elimina en tiempo esperado"
        ]
      },
      {
        title: "Signos de Alarma - Derivación Inmediata",
        description: "Paciente sintomático requiere evaluación quirúrgica urgente",
        type: "alert",
        actions: [
          "Dolor abdominal intenso",
          "Vómitos persistentes",
          "Signos de perforación",
          "Obstrucción intestinal"
        ]
      }
    ];
    
    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-blue-600" />
          Algoritmo de Manejo
        </h2>
        <FlowDiagram steps={steps} />
      </div>
    );
  }

  // Códigos CIE-10
  if (name.includes('códigos cie-10')) {
    const cieData = {
      headers: ["Código", "Descripción"],
      rows: [
        { cells: ["K70.3", "Cirrosis hepática alcohólica"], details: "Patología hepática crónica relacionada con consumo de alcohol" },
        { cells: ["K71.7", "Enfermedad tóxica del hígado con cirrosis y fibrosis"], details: "Daño hepático causado por sustancias tóxicas" },
        { cells: ["K72.9", "Insuficiencia hepática, no especificada"], details: "Falla hepática sin especificación de causa" },
        { cells: ["K74.0 - K74.6", "Fibrosis y cirrosis hepática (varios tipos)"], details: "Incluye cirrosis biliar primaria, secundaria, y otras" },
        { cells: ["K76.1", "Congestión pasiva crónica del hígado"], details: "Congestión hepática por insuficiencia cardíaca" },
        { cells: ["K76.6", "Hipertensión portal"], details: "Aumento de presión en vena porta" },
        { cells: ["K76.7", "Síndrome hepatorrenal"], details: "Insuficiencia renal secundaria a enfermedad hepática" },
        { cells: ["I85.0 / I85.9", "Várices esofágicas (con/sin hemorragia)"], details: "Várices esofágicas asociadas a hipertensión portal" },
        { cells: ["F32.2 / F32.3", "Episodio depresivo grave"], details: "Con o sin síntomas psicóticos" },
        { cells: ["F33.2 / F33.3", "Trastorno depresivo recurrente grave"], details: "Con o sin síntomas psicóticos" },
        { cells: ["F17.1 - F17.3", "Trastornos por uso de tabaco"], details: "Uso nocivo, dependencia, abstinencia" }
      ]
    };
    
    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Códigos CIE-10 Vigentes</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <PolicinicTable data={cieData} />
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> Estos códigos están aprobados oficialmente para el programa cardiovascular. 
              Utilizar únicamente los códigos listados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Guía de Atenciones Policlínico
  if (name.includes('guía de atenciones')) {
    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Guía Completa de Atenciones</h2>
        <PolicinicGuide />
      </div>
    );
  }

  return null;
};

export default function TopicDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicId = urlParams.get('id');

  const { data: topic, isLoading: loadingTopic } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const topics = await db.entities.Topic.filter({ id: topicId });
      return topics[0];
    },
    enabled: !!topicId
  });

  const { data: category } = useQuery({
    queryKey: ['topic-category', topic?.category_id],
    queryFn: async () => {
      const categories = await db.entities.Category.filter({ id: topic.category_id });
      return categories[0];
    },
    enabled: !!topic?.category_id
  });

  const { data: flowSteps = [] } = useQuery({
    queryKey: ['flow-steps', topicId],
    queryFn: () => db.entities.FlowStep.filter({ topic_id: topicId }, 'step_number'),
    enabled: !!topicId
  });

  if (loadingTopic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Tema no encontrado</p>
          <Link to={createPageUrl('Home')}>
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasContentBlocks = topic.content_blocks?.length > 0;
  const hasClinicalInfo = Boolean(
    topic.clinical_summary ||
    topic.diagnostic_orientation ||
    topic.complementary_studies ||
    topic.initial_treatment
  );
  const hasProtocolFlowchart = topic.protocol_flowchart?.length > 0;
  const hasProtocolMedications = topic.protocol_medications?.length > 0;
  const hasSpecialContent = shouldRenderSpecial(topic);
  const isSriTopic = topic.name.includes('Secuencia Rápida de Intubación');
  const showGesFallback = (
    topic.clasificacion_ges === 'GES' &&
    !isSriTopic &&
    !hasContentBlocks &&
    !hasClinicalInfo &&
    !hasProtocolFlowchart &&
    !hasProtocolMedications &&
    !hasSpecialContent &&
    flowSteps.length === 0
  );
  const topicVisual = getTopicVisual(topic);
  const TopicIcon = topicVisual.icon;
  const isGesTopic = topic.clasificacion_ges === 'GES';
  const { area: gesArea, theme: gesTheme } = isGesTopic ? getGesTopicMeta(topic.name) : { area: null, theme: null };

  // For GES topics with existing content_blocks: prepend clinical block if not already present
  const hasClinicalBlock = topic.content_blocks?.some(b => b.type === 'clinical');
  const enhancedBlocks = isGesTopic && hasContentBlocks && !hasClinicalBlock
    ? [buildGesClinicalBlock(topic), ...(topic.content_blocks || [])]
    : (topic.content_blocks || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={category ? createPageUrl(`Category?id=${category.id}`) : createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                {category && (
                  <>
                    <span>{category.name}</span>
                    {topic.subcategory && (
                      <>
                        <span>/</span>
                        <span>{topic.subcategory}</span>
                      </>
                    )}
                  </>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 truncate">{topic.name}</h1>
            </div>
          </div>
          <GlobalSearch />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Topic Header — GES gradient for GES topics, generic for others, hidden when fallback renders its own */}
        {!showGesFallback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {isGesTopic && gesTheme ? (() => {
                const gesGuaranteeStages = extractGuaranteeStages(topic);
                const isOncologyTopic = gesArea === 'Oncología';
                const oncologyFallback = [
                  { label: 'Confirmación diagnóstica', timeframe: '45 días', description: 'Desde sospecha fundada hasta confirmación histológica o citológica.' },
                  { label: 'Inicio de tratamiento',    timeframe: '45 días', description: 'Desde indicación médica (cirugía, quimioterapia o radioterapia).' },
                  { label: 'Seguimiento',              timeframe: '15 días', description: 'Desde indicación médica para control y continuidad asistencial.' },
                ];
                const stagesToShow = gesGuaranteeStages.length > 0 ? gesGuaranteeStages : (isOncologyTopic ? oncologyFallback : []);
                return (
                  <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${gesTheme.hero} p-6 md:p-8 text-white shadow-xl`}>
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute -top-12 -right-8 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
                      <div className="absolute bottom-0 left-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
                    </div>
                    <div className="relative space-y-5">
                      {/* Badges + title */}
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {topic.order && <Badge className={`border ${gesTheme.softBadge}`}>GES N.°{topic.order}</Badge>}
                          {gesArea && <Badge className={`border ${gesTheme.softBadge}`}>{gesArea}</Badge>}
                          <Badge className={`border ${gesTheme.softBadge}`}>
                            {topic.has_local_protocol ? 'Con protocolo local' : 'Sin protocolo local'}
                          </Badge>
                        </div>
                        {topic.description && (
                          <h2 className="text-xl font-bold leading-snug tracking-tight text-white md:text-2xl">
                            {topic.description}
                          </h2>
                        )}
                      </div>
                      {/* Guarantee — full width, categories as horizontal grid */}
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                        <div className="mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-white/80" />
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                            Garantía de oportunidad
                          </p>
                          {isOncologyTopic && (
                            <span className="ml-auto flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
                              <AlertCircle className="h-3 w-3" />
                              Oncológica
                            </span>
                          )}
                        </div>
                        {(() => {
                          const GRP_STYLES = [
                            { pill: 'bg-sky-400/20 border-sky-300/30',      dot: 'bg-sky-300'    },
                            { pill: 'bg-violet-400/20 border-violet-300/30', dot: 'bg-violet-300' },
                            { pill: 'bg-teal-400/20 border-teal-300/30',    dot: 'bg-teal-300'   },
                            { pill: 'bg-amber-400/20 border-amber-300/30',  dot: 'bg-amber-300'  },
                          ];
                          const groups = stagesToShow.reduce((acc, s) => {
                            const g = acc.find(x => x.label === s.label);
                            if (g) g.items.push(s); else acc.push({ label: s.label, items: [s] });
                            return acc;
                          }, []);
                          return groups.length > 0 ? (
                            <div className="space-y-2">
                              {groups.map(({ label, items }, gi) => {
                                const st = GRP_STYLES[gi % GRP_STYLES.length];
                                return (
                                  <div key={label}>
                                    <div className={`mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 ${st.pill}`}>
                                      <div className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                      {label}
                                    </div>
                                    <div className="space-y-1">
                                      {items.map((item, ii) => (
                                        <div key={ii} className="flex items-center justify-between gap-4 rounded-lg bg-white/10 px-3 py-2">
                                          <p className="text-sm leading-relaxed text-white/85">{item.description}</p>
                                          {item.timeframe && (
                                            <span className="shrink-0 rounded-lg border border-white/20 bg-white/15 px-3 py-1 text-sm font-bold text-white">
                                              {item.timeframe}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-white/70">Plazos específicos pendientes de carga para esta ficha.</p>
                          );
                        })()}
                        <p className="mt-3 text-[11px] text-white/50">
                          Acceso · Calidad · Protección financiera: también garantizados en todas las prestaciones GES.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })() : (
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br ${topicVisual.gradient} shadow-lg shadow-slate-200`}>
                  <TopicIcon className="h-8 w-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {topic.has_local_protocol && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1 px-3 py-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Protocolo local establecido
                      </Badge>
                    )}
                    {topic.tags?.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {topic.description && (
                    <p className="text-lg text-slate-600 leading-relaxed">
                      {topic.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* GES Guarantee — only for non-GES topics with guarantee content (GES topics show it inside the hero) */}
        {!showGesFallback && !isGesTopic && hasGuaranteeContent(topic) && (
          <div className="mb-8">
            <GESGuarantee topic={topic} />
          </div>
        )}

        {/* Protocol Header - For protocols with protocol_code or protocol_authors */}
        <ProtocolHeader topic={topic} />

        {/* SRI Calculator - Special Case */}
        {topic.name.includes('Secuencia Rápida de Intubación') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <SRICalculator />
          </motion.div>
        )}

        {/* NRS-2002 Calculator - Special Case */}
        {topic.name.toLowerCase().includes('nrs') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <NRS2002Calculator />
          </motion.div>
        )}

        {/* New Content Blocks System - If content_blocks exists */}
        {hasContentBlocks && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <ResponsiveTopicLayout
              blocks={enhancedBlocks}
              layoutMode={topic.layout_mode || 'auto'}
              relatedTopics={topic.related_topics}
              relatedTools={topic.related_tools}
            />
          </motion.div>
        )}

        {/* Protocol Flowchart - If protocol_flowchart exists */}
        {hasProtocolFlowchart && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              Flujograma Operativo
            </h2>
            <ProtocolFlowchart flowchart={topic.protocol_flowchart} />
          </motion.div>
        )}

        {/* Medications - If protocol_medications exists */}
        {hasProtocolMedications && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <MedicationCard medications={topic.protocol_medications} />
          </motion.div>
        )}

        {/* Special Rendering for Specific Topics */}
        {renderSpecialContent(topic)}

        {/* Clinical Orientation block — for GES topics using ClinicalInfo (no content_blocks) */}
        {isGesTopic && !hasContentBlocks && hasClinicalInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ResponsiveTopicLayout
              blocks={[buildGesClinicalBlock(topic)]}
              layoutMode="single"
            />
          </motion.div>
        )}

        {/* Clinical Information */}
        {!isSriTopic && !hasSpecialContent && hasClinicalInfo && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Información Clínica
            </h2>
            <ClinicalInfo topic={topic} />
          </div>
        )}

        {/* Flow Timeline */}
        {!isSriTopic && flowSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              Flujo de Atención
            </h2>
            <FlowTimeline steps={flowSteps} />
          </motion.div>
        )}

        {/* Structured GES fallback */}
        {showGesFallback && (
          <div className="mb-10">
            <GESStructuredFallback topic={topic} />
          </div>
        )}

        {/* Empty state if no content */}
        {!isSriTopic && !hasSpecialContent && !showGesFallback && !hasClinicalInfo && !hasContentBlocks && !hasProtocolFlowchart && !hasProtocolMedications && flowSteps.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Contenido en desarrollo
            </h3>
            <p className="text-slate-500">
              El protocolo y flujo para este tema está siendo elaborado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
