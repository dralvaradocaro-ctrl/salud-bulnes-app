import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Baby,
  Brain,
  ClipboardCheck,
  Building2,
  ChevronDown,
  ClipboardList,
  Ear,
  ExternalLink,
  HeartPulse,
  History,
  Megaphone,
  MessageCircle,
  Pill,
  ScanLine,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const RECENT_DAYS = 10;
const NEWS_BUTTON_COLLAPSED_KEY = 'salud_bulnes_news_button_collapsed';
const NEWS_BUTTON_AUTO_COLLAPSE_MS = 15_000;

const FREQUENT_QUERIES = [
  {
    id: 'faq-flujograma-fonoaudiologia',
    title: 'Derivación a Fonoaudiología',
    area: 'policlinico',
    summary: 'Flujo local HB 2026 para derivar a Fonoaudiología según edad, programa y motivo.',
    highlight: 'Elegir ruta por edad/programa y motivo principal. No marcarlo como protocolo: es solo flujo local de derivación.',
    orders: [
      { label: 'CHCC', value: 'Fono CHCC' },
      { label: 'General', value: 'Fonoaudiología' },
      { label: 'Ley TEA', value: 'Fono Ley TEA' },
    ],
    routes: [
      {
        icon: Baby,
        title: '0 a 4 años 11 meses',
        subtitle: 'Chile Crece Contigo',
        order: 'Fono CHCC',
        items: ['Inicio tardío del lenguaje', 'EEDP / TEPSI descendido sin diagnóstico neurológico'],
      },
      {
        icon: MessageCircle,
        title: 'Hasta 20 años 11 meses',
        subtitle: 'Infanto-juvenil',
        order: 'Fonoaudiología',
        items: ['Trastorno del lenguaje', 'Selectividad alimentaria', 'Dislalia o baja inteligibilidad', 'Lectoescritura / dislexia'],
      },
      {
        icon: Stethoscope,
        title: 'Odonto / ORL',
        subtitle: 'Motivos orofaciales',
        order: 'Fonoaudiología',
        items: ['Anquiloglosia', 'Deglución atípica', 'Interposición lingual', 'Respirador oral'],
      },
      {
        icon: Brain,
        title: 'Autismo confirmado',
        subtitle: 'Programa Ley TEA',
        order: 'Fono Ley TEA',
        items: ['Certificado diagnóstico', 'Lenguaje y comunicación asociado a autismo'],
      },
      {
        icon: UserRound,
        title: 'NANEAS',
        subtitle: 'Con diagnóstico de base',
        order: 'Según ruta interna',
        items: ['TDAH', 'Discapacidad intelectual', 'Trastorno del lenguaje', 'Otras condiciones de base'],
      },
      {
        icon: Ear,
        title: 'Adultos',
        subtitle: 'Audición / vestibular / neuro',
        order: 'Fonoaudiología adultos',
        items: ['Hipoacusia o vértigo', 'Disfagia o disfonía', 'ACV, Parkinson, demencias u otras neurológicas'],
      },
    ],
    link_url: createPageUrl('TopicDetail?id=49239ba8-b658-4295-aac6-90acd9da882a'),
  },
  {
    id: 'faq-derivaciones-rehabilitacion',
    title: 'Derivaciones a Terapia Ocupacional',
    area: 'policlinico',
    summary: 'Patologías y talleres disponibles para apoyar derivaciones a rehabilitación.',
    highlight: 'Derivar a Terapia Ocupacional cuando la patología o lesión dificulte el desempeño en actividades de la vida diaria.',
    orders: [
      { label: 'Ingreso talleres', value: 'Derivación médica previa' },
      { label: 'Inicio', value: 'Tras evaluación clínica' },
    ],
    routes: [
      {
        icon: Brain,
        title: 'Neurorehabilitación',
        subtitle: 'TO',
        order: 'Terapia Ocupacional',
        items: ['ACV', 'TEC', 'Parkinson', 'Lesión medular', 'Esclerosis múltiple', 'ELA', 'Neuropatías periféricas'],
      },
      {
        icon: HeartPulse,
        title: 'Reumatología y dolor',
        subtitle: 'TO',
        order: 'Terapia Ocupacional',
        items: ['Fibromialgia', 'Artritis reumatoide', 'Artrosis de manos', 'Lupus eritematoso sistémico'],
      },
      {
        icon: UserRound,
        title: 'Mano y extremidades',
        subtitle: 'TO',
        order: 'Terapia Ocupacional',
        items: ['Amputaciones EEII/EESS', 'Lesiones de dedos', 'Dedo en gatillo', 'Dupuytren', 'Fracturas', 'Túnel carpiano', 'Quervain'],
      },
      {
        icon: ClipboardCheck,
        title: 'Funcionalidad / órtesis',
        subtitle: 'AVD',
        order: 'Terapia Ocupacional',
        items: ['Confección de férulas', 'Otras lesiones que limiten actividades de la vida diaria'],
      },
    ],
    sections: [
      {
        title: 'Talleres disponibles',
        items: [
          { label: 'ACV', value: 'TO o Kinesiología' },
          { label: 'Parkinson', value: 'TO o Kinesiología' },
          { label: 'Fibromialgia', value: 'TO o Kinesiología' },
          { label: 'Artritis reumatoide', value: 'TO y Kinesiología' },
          { label: 'Artrosis', value: 'Kinesiología' },
        ],
      },
    ],
  },
  {
    id: 'faq-atenciones-policlinico',
    title: 'Atenciones Policlínico: actividad y formulario',
    area: 'policlinico',
    summary: 'Tabla rápida para elegir actividad REM/formulario en registros frecuentes.',
    highlight: 'Usar la actividad exacta indicada y evitar AG_ o actividades marcadas como “No contabilizada en REM”.',
    orders: [
      { label: 'REM', value: 'Actividad exacta' },
      { label: 'Formulario', value: 'Según programa' },
    ],
    link_url: createPageUrl('TopicDetail?id=ac8e1455-7cc9-4265-8933-8fe893217201'),
    routes: [
      {
        icon: HeartPulse,
        title: 'Cardiovascular',
        subtitle: 'Control / ingreso',
        order: 'Salud cardiovascular integral',
        items: ['Control salud cardiovascular', 'Ingreso HEARTS si corresponde', 'Orden interna nutricionista 3-4 meses'],
      },
      {
        icon: Stethoscope,
        title: 'ERA / IRA',
        subtitle: 'Sala respiratoria',
        order: 'Otros programas de salud',
        items: ['Control sala ERA/IRA/mixta', 'Ingreso ERA: encuesta calidad de vida', 'Ingreso IRA: PedsQL por edad'],
      },
      {
        icon: Brain,
        title: 'Salud mental',
        subtitle: 'Ingreso / control / egreso',
        order: 'Control de salud mental',
        items: ['Plan de cuidado integral', 'Clasificación N', 'Goldberg si ingreso/egreso'],
      },
      {
        icon: Baby,
        title: 'Niño sano 1 y 3 meses',
        subtitle: 'Control sano',
        order: 'Crecimiento y desarrollo',
        items: ['Guías anticipatorias', 'Score IRA', '3 meses: GES displasia cadera + RX pelvis'],
      },
      {
        icon: Pill,
        title: 'Morbilidad / recetas',
        subtitle: 'Registro simple',
        order: 'Consulta otras morbilidades',
        items: ['Morbilidad general sin formulario', 'Receta sin paciente: actividad abreviada y confección de recetas'],
      },
      {
        icon: UserRound,
        title: 'Paliativos / dependencia severa',
        subtitle: 'Continuidad',
        order: 'Según atención',
        items: ['Paliativos: otros problemas + cuidados paliativos', 'Dependencia severa: visita domiciliaria no oncológica'],
      },
      {
        icon: ScanLine,
        title: 'Telemedicina',
        subtitle: 'Nueva / control',
        order: 'Especialidad ambulatoria por telemedicina',
        items: ['Cardiología con ECG', 'Dermatología con fotos', 'Diabetología con perfil glicémico'],
      },
    ],
  },
  {
    id: 'faq-demencia-ingreso',
    title: 'Atenciones para usuarios con demencia',
    area: 'policlinico',
    summary: 'Ingreso: actividades y formularios requeridos para salud mental.',
    highlight: 'Para ingreso de usuarios con demencia, registrar actividades de salud mental y completar formularios asociados.',
    orders: [
      { label: 'Actividad', value: 'Control salud mental' },
      { label: 'Riesgo', value: 'Clasificación N' },
    ],
    routes: [
      {
        icon: Brain,
        title: 'Ingreso',
        subtitle: 'Salud mental',
        order: 'Control salud mental',
        items: ['Plan de cuidado integral elaborado', 'Riesgo de salud mental (N)'],
      },
      {
        icon: ClipboardList,
        title: 'Formularios',
        subtitle: 'Registro obligatorio',
        order: 'Formulario Salud Mental',
        items: ['Goldberg', 'Formulario Salud Mental'],
      },
    ],
  },
];

const AREA_META = {
  administracion: { label: 'Administración', icon: Building2, className: 'bg-slate-100 text-slate-700 border-slate-200' },
  policlinico: { label: 'Policlínico', icon: Stethoscope, className: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  hospitalizados: { label: 'Hospitalizados', icon: ClipboardList, className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  urgencias: { label: 'Urgencias', icon: Megaphone, className: 'bg-rose-50 text-rose-700 border-rose-100' },
  transversal: { label: 'Transversal', icon: Bell, className: 'bg-blue-50 text-blue-700 border-blue-100' },
  general: { label: 'General', icon: Bell, className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

function tenDaysAgoIso() {
  const date = new Date();
  date.setDate(date.getDate() - RECENT_DAYS);
  return date.toISOString();
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(new Date(value));
}

function normalizeArea(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('admin')) return 'administracion';
  if (raw.includes('poli')) return 'policlinico';
  if (raw.includes('hosp')) return 'hospitalizados';
  if (raw.includes('urg')) return 'urgencias';
  if (raw.includes('trans')) return 'transversal';
  return AREA_META[raw] ? raw : 'general';
}

function inferTopicArea(topic, categoryName) {
  return normalizeArea(`${categoryName || ''} ${topic.subcategory || ''} ${topic.name || ''}`);
}

async function fetchNewsData() {
  const cutoff = tenDaysAgoIso();

  const newsPromise = supabase
    .from('news_updates')
    .select('*')
    .neq('status', 'archived')
    .order('published_at', { ascending: false })
    .limit(80);

  const topicsPromise = supabase
    .from('topics')
    .select('id,created_at,name,description,category_id,subcategory,has_local_protocol,status')
    .eq('status', 'published')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  const categoriesPromise = supabase
    .from('categories')
    .select('id,name');

  const fimosisPromise = supabase
    .from('topics')
    .select('id,created_at,name,description')
    .ilike('name', '%Fimosis%')
    .order('created_at', { ascending: false })
    .limit(1);

  const [newsResult, topicsResult, categoriesResult, fimosisResult] = await Promise.allSettled([
    newsPromise,
    topicsPromise,
    categoriesPromise,
    fimosisPromise,
  ]);

  const manualNews = newsResult.status === 'fulfilled' && !newsResult.value.error
    ? newsResult.value.data ?? []
    : [];

  const topics = topicsResult.status === 'fulfilled' && !topicsResult.value.error
    ? topicsResult.value.data ?? []
    : [];

  const categories = categoriesResult.status === 'fulfilled' && !categoriesResult.value.error
    ? categoriesResult.value.data ?? []
    : [];

  const newsTableMissing = newsResult.status === 'fulfilled' && newsResult.value.error?.code === 'PGRST205';
  const fimosisTopic = newsTableMissing && fimosisResult.status === 'fulfilled' && !fimosisResult.value.error
    ? fimosisResult.value.data?.[0]
    : null;

  const categoryById = new Map(categories.map((category) => [category.id, category.name]));

  const fallbackNews = newsTableMissing ? [
    ...(fimosisTopic ? [{
      id: 'fallback-fimosis-minsal',
      published_at: new Date().toISOString(),
      title: 'Ordinario MINSAL: Fimosis pediátrica',
      summary: 'Se incorporó la Orientación Técnica MINSAL 2025 para manejo de fimosis pediátrica.',
      details: 'Disponible en Policlínico / Pediatría. Incluye evaluación clínica, manejo conservador con corticoide tópico, signos de alarma, criterios de derivación y contrarreferencia según Orientación Técnica MINSAL 2025.',
      area: 'policlinico',
      type: 'protocolo',
      status: 'published',
      topic_id: fimosisTopic.id,
      link_url: createPageUrl(`TopicDetail?id=${fimosisTopic.id}`),
    }] : []),
  ] : [];

  const effectiveManualNews = [...fallbackNews, ...manualNews];
  const manualTopicIds = new Set(effectiveManualNews.map((item) => item.topic_id).filter(Boolean));

  const topicNews = topics.filter((topic) => !manualTopicIds.has(topic.id)).map((topic) => {
    const categoryName = categoryById.get(topic.category_id);
    return {
      id: `topic-${topic.id}`,
      published_at: topic.created_at,
      title: topic.name,
      summary: topic.has_local_protocol
        ? 'Nuevo protocolo local disponible en la guía.'
        : 'Nuevo tema publicado en la guía.',
      details: topic.description || 'Disponible para consulta en su ficha clínica dentro de la plataforma.',
      area: inferTopicArea(topic, categoryName),
      type: 'protocolo',
      link_url: createPageUrl(`TopicDetail?id=${topic.id}`),
      source: 'topic',
    };
  });

  return { manualNews: effectiveManualNews, topicNews };
}

function areaMeta(area) {
  return AREA_META[normalizeArea(area)] || AREA_META.general;
}

function typeLabel(type) {
  if (type === 'protocolo') return 'Protocolo';
  if (type === 'consulta') return 'Consulta';
  if (type === 'operativo') return 'Operativo';
  return 'Novedad';
}

function RouteQuickView({ item }) {
  if (!item.highlight && !item.orders?.length && !item.routes?.length && !item.sections?.length) return null;

  return (
    <div className="mt-2 space-y-2">
      {item.highlight && (
        <div className="rounded-md border border-sky-100 bg-sky-50 px-2.5 py-2 text-[11px] font-medium leading-relaxed text-sky-800">
          {item.highlight}
        </div>
      )}

      {item.orders?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.orders.map((order) => (
            <span key={order.label} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">{order.label}</span>
              <span className="text-slate-300">/</span>
              <span>{order.value}</span>
            </span>
          ))}
        </div>
      )}

      {item.routes?.length > 0 && (
        <div className="space-y-1.5">
          {item.routes.map((route) => {
            const RouteIcon = route.icon || ClipboardList;
            return (
              <div key={`${route.title}-${route.order}`} className="rounded-md border border-slate-200 bg-white p-2">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                    <RouteIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-bold leading-snug text-slate-800">{route.title}</p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{route.subtitle}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-cyan-700">Orden interna: {route.order}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {route.items.map((routeItem) => (
                        <span key={routeItem} className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] leading-relaxed text-slate-600">
                          {routeItem}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {item.sections?.length > 0 && (
        <div className="space-y-1.5">
          {item.sections.map((section) => (
            <div key={section.title} className="rounded-md border border-slate-200 bg-slate-50 p-2">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">{section.title}</p>
              <div className="flex flex-wrap gap-1">
                {section.items.map((sectionItem) => (
                  <span key={`${section.title}-${sectionItem.label}`} className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[10px] leading-relaxed text-slate-600 ring-1 ring-slate-200">
                    <span className="font-semibold text-slate-800">{sectionItem.label}</span>
                    <span className="text-slate-300">/</span>
                    <span>{sectionItem.value}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsItem({ item }) {
  const [open, setOpen] = useState(false);
  const details = item.details || item.summary;
  const hasDetails = details && details !== item.summary;
  const meta = areaMeta(item.area);
  const AreaIcon = meta.icon;
  const dateLabel = formatDate(item.published_at || item.created_at);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 text-left">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className={cn('inline-flex h-5 items-center gap-1 rounded-md border px-1.5 text-[10px] font-semibold', meta.className)}>
                <AreaIcon className="h-3 w-3" />
                {meta.label}
              </span>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {typeLabel(item.type)}
              </Badge>
              {dateLabel && <span className="text-[11px] text-slate-400">{dateLabel}</span>}
            </div>
            <p className="text-sm font-semibold leading-snug text-slate-800">{item.title}</p>
            {item.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.summary}</p>}
          </div>
          <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 border-t border-slate-100 pt-2">
            {hasDetails && <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600">{details}</p>}
            <RouteQuickView item={item} />
            {item.table && (
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {item.table.headers.map((header) => (
                        <th key={header} className="border-b border-slate-200 px-2 py-1.5 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {item.table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="align-top">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className={cn('px-2 py-1.5 leading-relaxed text-slate-600', cellIndex === 0 && 'font-semibold text-slate-700')}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {item.link_url && (
              <Button asChild variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs text-blue-600 hover:text-blue-700">
                <Link to={item.link_url}>
                  Abrir relacionado <ExternalLink className="ml-1.5 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function FrequentQueryItem({ item }) {
  return (
    <NewsItem
      item={{
        ...item,
        published_at: null,
        type: 'consulta',
      }}
    />
  );
}

function TimelineNewsList({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item) => <NewsItem key={item.id} item={item} />)}
    </div>
  );
}

export default function FloatingNewsButton({ currentPageName }) {
  const [view, setView] = useState('recent');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(NEWS_BUTTON_COLLAPSED_KEY) === 'true';
  });
  const hiddenInAdmin = currentPageName?.startsWith('Admin') || currentPageName === 'WelcomeLogin';

  useEffect(() => {
    window.localStorage.setItem(NEWS_BUTTON_COLLAPSED_KEY, isCollapsed ? 'true' : 'false');
  }, [isCollapsed]);

  useEffect(() => {
    if (hiddenInAdmin || isCollapsed) return undefined;
    const timeout = window.setTimeout(() => {
      setIsCollapsed(true);
    }, NEWS_BUTTON_AUTO_COLLAPSE_MS);
    return () => window.clearTimeout(timeout);
  }, [hiddenInAdmin, isCollapsed]);

  const { data, isLoading } = useQuery({
    queryKey: ['floating-news'],
    queryFn: fetchNewsData,
    staleTime: 1000 * 60 * 5,
  });

  const { recentItems, historyItems, recentCount } = useMemo(() => {
    const cutoff = new Date(tenDaysAgoIso()).getTime();
    const manualNews = data?.manualNews ?? [];
    const topicNews = data?.topicNews ?? [];

    const publishedManual = manualNews.filter((item) => item.status !== 'draft');
    const activeManual = publishedManual.filter((item) => {
      const date = new Date(item.published_at || item.created_at).getTime();
      const expiresAt = item.expires_at ? new Date(item.expires_at).getTime() : null;
      return date >= cutoff && (!expiresAt || expiresAt >= Date.now());
    });

    const recentItems = [...activeManual, ...topicNews].sort((a, b) => {
      const dateDelta = new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
      if (dateDelta !== 0) return dateDelta;
      return String(a.title || '').localeCompare(String(b.title || ''), 'es');
    });

    const historyItems = publishedManual.sort((a, b) => {
      const dateDelta = new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
      if (dateDelta !== 0) return dateDelta;
      return String(a.title || '').localeCompare(String(b.title || ''), 'es');
    });

    return {
      recentItems,
      historyItems,
      recentCount: recentItems.length,
    };
  }, [data]);

  if (hiddenInAdmin) return null;

  return (
    <Sheet>
      <div className="fixed bottom-20 right-3 z-40 flex items-center gap-1 md:bottom-5 md:right-5 print:hidden">
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center rounded-full border border-blue-100 bg-white/95 text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
              isCollapsed ? 'h-11 w-11 justify-center' : 'gap-2 px-3 py-2'
            )}
            aria-label="Abrir novedades"
          >
            <span className="relative">
              <Bell className="h-4 w-4" />
              {recentCount > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500" />}
            </span>
            {!isCollapsed && (
              <>
                <span>Novedades</span>
                {recentCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">{recentCount}</span>
                )}
              </>
            )}
          </button>
        </SheetTrigger>
      </div>

      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-base">Novedades</SheetTitle>
                <SheetDescription className="text-xs">
                  Últimos {RECENT_DAYS} días y protocolos recién agregados.
                </SheetDescription>
              </div>
            </div>
            {isCollapsed && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => setIsCollapsed(false)}
              >
                Mostrar texto
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="border-b border-slate-200 px-5 py-3">
          <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setView('recent')}
              className={cn('rounded-md px-3 py-1.5 text-xs font-semibold transition', view === 'recent' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')}
            >
              Recientes
            </button>
            <button
              type="button"
              onClick={() => setView('history')}
              className={cn('rounded-md px-3 py-1.5 text-xs font-semibold transition', view === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')}
            >
              Historial
            </button>
            <button
              type="button"
              onClick={() => setView('frequent')}
              className={cn('rounded-md px-3 py-1.5 text-xs font-semibold transition', view === 'frequent' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')}
            >
              Consultas frecuentes
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : view === 'recent' && recentItems.length > 0 ? (
            <TimelineNewsList items={recentItems} />
          ) : view === 'history' && historyItems.length > 0 ? (
            <TimelineNewsList items={historyItems} />
          ) : view === 'frequent' && FREQUENT_QUERIES.length > 0 ? (
            <div className="space-y-2">
              {FREQUENT_QUERIES.map((item) => <FrequentQueryItem key={item.id} item={item} />)}
            </div>
          ) : (
            <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              {view === 'history' ? <History className="mb-3 h-8 w-8 text-slate-300" /> : <BookOpen className="mb-3 h-8 w-8 text-slate-300" />}
              <p className="text-sm font-semibold text-slate-700">
                {view === 'history' ? 'Sin historial registrado todavía' : 'Sin novedades recientes'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {view === 'history'
                  ? 'Las novedades manuales publicadas quedarán guardadas acá para revisión posterior.'
                  : `Se mostrarán avisos publicados o protocolos agregados durante los últimos ${RECENT_DAYS} días.`}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
