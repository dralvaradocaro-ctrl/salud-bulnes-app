import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  History,
  Megaphone,
  Stethoscope,
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

const AREA_META = {
  administracion: { label: 'Administración', icon: Building2, className: 'bg-slate-100 text-slate-700 border-slate-200' },
  policlinico: { label: 'Policlínico', icon: Stethoscope, className: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  hospitalizados: { label: 'Hospitalizados', icon: ClipboardList, className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  urgencias: { label: 'Urgencias', icon: Megaphone, className: 'bg-rose-50 text-rose-700 border-rose-100' },
  transversal: { label: 'Transversal', icon: Bell, className: 'bg-blue-50 text-blue-700 border-blue-100' },
  general: { label: 'General', icon: Bell, className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const AREA_ORDER = ['administracion', 'policlinico', 'hospitalizados', 'urgencias', 'transversal', 'general'];

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

  const topicNews = topics.map((topic) => {
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

  const fallbackNews = fimosisTopic ? [{
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
  }] : [];

  return { manualNews: [...fallbackNews, ...manualNews], topicNews };
}

function groupByArea(items) {
  const grouped = items.reduce((acc, item) => {
    const area = normalizeArea(item.area);
    if (!acc[area]) acc[area] = [];
    acc[area].push({ ...item, area });
    return acc;
  }, {});

  return AREA_ORDER
    .filter((area) => grouped[area]?.length)
    .map((area) => ({ area, items: grouped[area] }));
}

function NewsItem({ item }) {
  const [open, setOpen] = useState(false);
  const details = item.details || item.summary;
  const hasDetails = details && details !== item.summary;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 text-left">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {item.type === 'protocolo' ? 'Protocolo' : 'Novedad'}
              </Badge>
              <span className="text-[11px] text-slate-400">{formatDate(item.published_at || item.created_at)}</span>
            </div>
            <p className="text-sm font-semibold leading-snug text-slate-800">{item.title}</p>
            {item.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.summary}</p>}
          </div>
          <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 border-t border-slate-100 pt-2">
            {hasDetails && <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600">{details}</p>}
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

function NewsGroup({ area, items }) {
  const meta = AREA_META[area] || AREA_META.general;
  const Icon = meta.icon;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg border', meta.className)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-bold text-slate-800">{meta.label}</h3>
        </div>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => <NewsItem key={item.id} item={item} />)}
      </div>
    </section>
  );
}

export default function FloatingNewsButton({ currentPageName }) {
  const [view, setView] = useState('recent');
  const hiddenInAdmin = currentPageName?.startsWith('Admin') || currentPageName === 'WelcomeLogin';

  const { data, isLoading } = useQuery({
    queryKey: ['floating-news'],
    queryFn: fetchNewsData,
    staleTime: 1000 * 60 * 5,
  });

  const { recentGroups, historyGroups, recentCount } = useMemo(() => {
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
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
    });

    const historyItems = publishedManual.sort((a, b) => {
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
    });

    return {
      recentGroups: groupByArea(recentItems),
      historyGroups: groupByArea(historyItems),
      recentCount: recentItems.length,
    };
  }, [data]);

  if (hiddenInAdmin) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="fixed bottom-20 right-3 z-40 flex items-center gap-2 rounded-full border border-blue-100 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:bottom-5 md:right-5 print:hidden"
          aria-label="Abrir novedades"
        >
          <span className="relative">
            <Bell className="h-4 w-4" />
            {recentCount > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500" />}
          </span>
          <span>Novedades</span>
          {recentCount > 0 && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">{recentCount}</span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b border-slate-200 px-5 py-4">
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
        </SheetHeader>

        <div className="border-b border-slate-200 px-5 py-3">
          <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
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
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : view === 'recent' && recentGroups.length > 0 ? (
            <div className="space-y-5">
              {recentGroups.map((group) => <NewsGroup key={group.area} {...group} />)}
            </div>
          ) : view === 'history' && historyGroups.length > 0 ? (
            <div className="space-y-5">
              {historyGroups.map((group) => <NewsGroup key={group.area} {...group} />)}
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
