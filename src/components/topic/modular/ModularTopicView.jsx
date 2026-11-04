import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Clock, FileText, ScrollText } from 'lucide-react';
import { createPageUrl } from '@/utils';
import GlobalSearch from '@/components/search/GlobalSearch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TONES } from './tones';
import GlasgowModule from './GlasgowModule';
import ModuleCard from './ModuleCard';
import ProtocolFicha, { hasFichaContent } from './ProtocolFicha';

const VALIDITY_CHIP = {
  vigente: { label: 'Vigente', chip: 'bg-green-100 text-green-900', dot: 'bg-green-700' },
  proximo: { label: 'Próximo a vencer', chip: 'bg-amber-100 text-amber-900', dot: 'bg-amber-600' },
  vencido: { label: 'Vencido', chip: 'bg-red-100 text-red-900', dot: 'bg-red-700' },
};

// Vista modular del detalle de protocolo: barra fija arriba (data-sticky-header ancla las pestañas debajo),
// identidad del protocolo y "Lo esencial"; el contenido clínico llega como children, igual que en la vista clásica.
export default function ModularTopicView({
  topic,
  category,
  icon: TopicIcon = FileText,
  statusItems = [],
  validityStatus,
  keyFacts = [],
  documentBlocks = [],
  gesStages = [],
  showGlasgow = false,
  pdfUrl,
  onBack,
  onUseClassic,
  children,
}) {
  const validity = VALIDITY_CHIP[validityStatus];
  const showFicha = hasFichaContent(topic) || pdfUrl || documentBlocks.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header data-sticky-header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <button type="button" onClick={onBack} aria-label="Volver" className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-slate-900 hover:bg-slate-100">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          {category && (
            <nav aria-label="Ruta" className="hidden min-w-0 items-center gap-2 text-sm text-slate-600 md:flex">
              <Link className="truncate hover:underline" to={createPageUrl(`Category?id=${category.id}`)}>{category.name}</Link>
              {topic.subcategory && (<><span aria-hidden="true">/</span><span className="truncate text-slate-900">{topic.subcategory}</span></>)}
            </nav>
          )}
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold md:hidden">{topic.name}</p>
          <span className="hidden flex-1 md:block" />
          <GlobalSearch className="hidden w-60 md:block lg:w-72" />
          <button type="button" onClick={onUseClassic} className="hidden h-9 flex-none rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:block">
            Vista clásica
          </button>
          {showFicha && (
            <Sheet>
              <SheetTrigger asChild>
                <button type="button" className="flex h-9 flex-none items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                  <ScrollText className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Ficha del documento</span>
                  <span className="sm:hidden">Ficha</span>
                </button>
              </SheetTrigger>
              <SheetContent className="z-[80] w-full overflow-y-auto sm:max-w-md" overlayClassName="z-[80] bg-slate-950/50">
                <SheetHeader>
                  <SheetTitle>Ficha del documento</SheetTitle>
                  <SheetDescription>{topic.name}</SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <ProtocolFicha topic={topic} validityStatus={validityStatus} pdfUrl={pdfUrl} documentBlocks={documentBlocks} />
                </div>
              </SheetContent>
            </Sheet>
          )}
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="hidden h-9 flex-none items-center gap-2 rounded-xl bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800 lg:flex">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Abrir PDF
            </a>
          )}
        </div>
      </header>

      {/* Identidad del protocolo y lo esencial */}
      <section aria-labelledby="protocolo-titulo" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="hidden h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl bg-slate-900 text-white sm:flex">
              <TopicIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 id="protocolo-titulo" className="text-xl font-bold leading-tight tracking-tight sm:text-2xl" style={{ textWrap: 'balance' }}>{topic.name}</h1>
              {(validity || statusItems.length > 0) && (
                <ul aria-label="Estado del protocolo" className="mt-2 flex flex-wrap gap-1.5">
                  {validity && (
                    <li className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold ${validity.chip}`}>
                      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${validity.dot}`} />
                      {validity.label}{topic.protocol_validity ? ` hasta ${topic.protocol_validity.toLowerCase()}` : ''}
                    </li>
                  )}
                  {statusItems.map(item => (
                    <li key={item} className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-[13px] font-semibold text-slate-700">{item}</li>
                  ))}
                </ul>
              )}
              {topic.description && <p className="mt-2 max-w-4xl text-[15px] leading-relaxed text-slate-700">{topic.description}</p>}
            </div>
          </div>

          {keyFacts.length > 0 && (
            <ul
              aria-label="Lo esencial"
              className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:overflow-visible md:px-0"
              style={{ gridTemplateColumns: `repeat(${keyFacts.length}, minmax(0, 1fr))` }}
            >
              {keyFacts.map((fact, idx) => {
                const t = TONES[fact.tone] || TONES.neutral;
                return (
                  <li key={idx} className={`w-[220px] flex-none rounded-2xl px-4 py-3 md:w-auto ${t.soft}`}>
                    {fact.label && <p className={`text-xs font-semibold ${t.ink}`}>{fact.label}</p>}
                    <p className="mt-0.5 text-lg font-bold leading-snug text-slate-900 [font-variant-numeric:tabular-nums]">{fact.value}</p>
                    {fact.note && <p className="text-[13px] text-slate-600 [font-variant-numeric:tabular-nums]">{fact.note}</p>}
                  </li>
                );
              })}
            </ul>
          )}

          <GlobalSearch className="mt-4 md:hidden" />
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pb-28 pt-5">
        {(showGlasgow || gesStages.length > 0) && (
          <div className="grid gap-4 lg:grid-cols-12">
            {showGlasgow && <div className={gesStages.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}><GlasgowModule /></div>}
            {gesStages.length > 0 && (
              <div className={showGlasgow ? 'lg:col-span-4' : 'lg:col-span-12'}>
                <ModuleCard icon={Clock} tone="blue" title="Garantía de oportunidad" description="Plazos GES">
                  <ul className="space-y-2.5">
                    {gesStages.map((stage, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold">{stage.label}</span>
                          {stage.description && <span className="block text-sm text-slate-600">{stage.description}</span>}
                        </span>
                        {stage.timeframe && <span className="flex-none text-[15px] font-bold [font-variant-numeric:tabular-nums]">{stage.timeframe}</span>}
                      </li>
                    ))}
                  </ul>
                </ModuleCard>
              </div>
            )}
          </div>
        )}
        {children}
        <button type="button" onClick={onUseClassic} className="w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 sm:hidden">
          Volver a la vista clásica
        </button>
      </main>
    </div>
  );
}
