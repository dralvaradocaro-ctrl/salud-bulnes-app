import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  LinkIcon, Calculator, ExternalLink,
  Eye, Stethoscope, FlaskConical, Scissors,
  AlertTriangle, ChevronDown,
} from 'lucide-react';
import { isHiddenCalculatorId, isHiddenCalculatorName } from '@/components/utils/hiddenContent';
import MermaidDiagram from './MermaidDiagram';

const FLOW_COLORS = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   circle: 'bg-blue-600',   badge: 'bg-blue-100 text-blue-700',   bar: 'from-blue-500 to-indigo-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', circle: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700', bar: 'from-purple-500 to-indigo-500' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  circle: 'bg-green-600',  badge: 'bg-green-100 text-green-700',  bar: 'from-green-500 to-emerald-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', circle: 'bg-orange-600', badge: 'bg-orange-100 text-orange-700', bar: 'from-orange-500 to-amber-500' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    circle: 'bg-red-600',    badge: 'bg-red-100 text-red-700',    bar: 'from-rose-500 to-red-500' },
};

const CLINICAL_SECTIONS_META = [
  { key: 0, icon: Eye,          color: 'amber',  bg: 'bg-amber-50',   border: 'border-amber-100',  label_color: 'text-amber-800',  icon_bg: 'bg-amber-100',  icon_color: 'text-amber-700' },
  { key: 1, icon: Stethoscope,  color: 'blue',   bg: 'bg-blue-50',    border: 'border-blue-100',   label_color: 'text-blue-800',   icon_bg: 'bg-blue-100',   icon_color: 'text-blue-700'  },
  { key: 2, icon: FlaskConical, color: 'emerald',bg: 'bg-emerald-50', border: 'border-emerald-100',label_color: 'text-emerald-800',icon_bg: 'bg-emerald-100',icon_color: 'text-emerald-700'},
  { key: 3, icon: Scissors,     color: 'violet', bg: 'bg-violet-50',  border: 'border-violet-100', label_color: 'text-violet-800', icon_bg: 'bg-violet-100', icon_color: 'text-violet-700'},
];

const markdownComponents = {
  h3: ({ children }) => (
    <h3 className="text-base font-bold text-slate-800 mt-5 mb-2 first:mt-0 border-b border-slate-100 pb-1">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-700 mt-3 mb-1">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-slate-700 mb-2">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1 mb-3">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-slate-700">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
      <span className="leading-relaxed">{children}</span>
    </li>
  ),
};

function ClinicalBlock({ block }) {
  const [open, setOpen] = useState(!block.defaultCollapsed);
  const sections = block.sections || [];
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-left transition-colors hover:bg-slate-100"
      >
        <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="flex-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {block.title || 'Orientación Clínica'}
        </h3>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="divide-y divide-slate-100">
          {sections.map((section, idx) => {
            const meta = CLINICAL_SECTIONS_META[idx] || CLINICAL_SECTIONS_META[0];
            const Icon = meta.icon;
            const bullets = section.content
              ? section.content.split('. ').filter(Boolean).map(s => s.endsWith('.') ? s : `${s}.`)
              : [];
            return (
              <div key={idx} className="px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.icon_bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${meta.icon_color}`} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-[0.12em] ${meta.label_color}`}>
                    {section.label}
                  </span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      <span className="text-sm leading-relaxed text-slate-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ResponsiveTopicLayout({ blocks = [], layoutMode = 'auto', relatedTopics, relatedTools }) {
  const safeRelatedTopics = relatedTopics || [];
  const safeRelatedTools = relatedTools || [];
  const visibleRelatedTools = safeRelatedTools.filter(ref =>
    !isHiddenCalculatorId(ref.tool_id) && !isHiddenCalculatorName(ref.label)
  );

  const renderBlock = (block) => {
    const colorConfig = FLOW_COLORS[block.color] || FLOW_COLORS.blue;

    switch (block.type) {

      case 'clinical':
        return <ClinicalBlock key={block.id} block={block} />;

      case 'text':
        return (
          <div key={block.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {block.title && (
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
                  {block.title}
                </h3>
              </div>
            )}
            <div className="px-5 py-4">
              <ReactMarkdown components={markdownComponents}>
                {block.content}
              </ReactMarkdown>
            </div>
          </div>
        );

      case 'flowchart':
      case 'algorithm':
        return (
          <div key={block.id} className={`relative overflow-hidden rounded-2xl border-2 ${colorConfig.bg} ${colorConfig.border} shadow-sm`}>
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colorConfig.bar}`} />
            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  {block.title && (
                    <h3 className="text-base font-bold text-slate-900">{block.title}</h3>
                  )}
                  {block.description && (
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">{block.description}</p>
                  )}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colorConfig.badge}`}>
                  {block.type === 'algorithm' ? 'Algoritmo' : 'Flujo'}
                </span>
              </div>
              {block.details?.length > 0 && (
                <div className="space-y-2.5">
                  {block.details.map((detail, idx) => {
                    const lines = detail.split('\n');
                    const mainText = lines.filter(l => !l.startsWith('~')).join(' ').trim();
                    const subItems = lines.filter(l => l.startsWith('~')).map(l => l.slice(1).trim());
                    return (
                    <div key={idx} className="relative rounded-xl border border-white/70 bg-white/85 p-3.5 pl-14 shadow-sm">
                      <div className={`absolute left-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white ${colorConfig.circle}`}>
                        {idx + 1}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-800">
                        {mainText.includes('→') ? (
                          <>
                            <strong className="font-semibold">{mainText.split('→')[0].trim()}</strong>
                            {' → ' + mainText.split('→').slice(1).join('→').trim()}
                          </>
                        ) : mainText}
                      </p>
                      {subItems.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {subItems.map((item, i) => (
                            <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-1.5 ${colorConfig.bg} border ${colorConfig.border}`}>
                              <span className="mt-0.5 shrink-0 text-xs font-bold text-slate-400">—</span>
                              <span className="text-xs leading-relaxed text-slate-700">
                                {item.includes(':') ? (
                                  <>
                                    <strong className="font-semibold text-slate-800">{item.split(':')[0]}</strong>
                                    {':' + item.split(':').slice(1).join(':')}
                                  </>
                                ) : item}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'reference': {
        if (!block.reference_id || !block.reference_label) return null;
        const isCalculator = block.reference_type === 'calculator';
        if (isCalculator && (
          isHiddenCalculatorId(block.reference_id) ||
          isHiddenCalculatorName(block.reference_label)
        )) return null;
        const linkUrl = isCalculator
          ? createPageUrl(`AllCalculators?calc=${block.reference_id}`)
          : createPageUrl(`TopicDetail?id=${block.reference_id}`);
        return (
          <Link key={block.id} to={linkUrl}>
            <div className={`rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
              isCalculator
                ? 'bg-purple-50 border-purple-200 hover:border-purple-300'
                : 'bg-blue-50 border-blue-200 hover:border-blue-300'
            }`}>
              <div className="mb-2 flex items-center gap-3">
                {isCalculator
                  ? <Calculator className="h-4 w-4 text-purple-600" />
                  : <LinkIcon className="h-4 w-4 text-blue-600" />
                }
                <h4 className="font-bold text-slate-900">{block.title || 'Referencia'}</h4>
              </div>
              <p className="mb-3 text-sm text-slate-700">{block.reference_label}</p>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3 w-3" />
                {isCalculator ? 'Abrir calculadora' : 'Ver protocolo'}
              </Button>
            </div>
          </Link>
        );
      }

      case 'mermaid':
        return (
          <div key={block.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {block.title && (
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
                  {block.title}
                </h3>
                {block.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{block.description}</p>
                )}
              </div>
            )}
            <div className="p-4">
              <MermaidDiagram chart={block.content} />
            </div>
          </div>
        );

      case 'alert':
        return (
          <div key={block.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            {block.title && (
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <h4 className="text-sm font-bold text-amber-900">{block.title}</h4>
              </div>
            )}
            {block.content && (
              <p className="text-sm leading-relaxed text-amber-800">{block.content}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const safeBlocks = blocks || [];
  const tabValues = [...new Set(safeBlocks.map(b => b.tab).filter(Boolean))];
  const hasTabs = tabValues.length > 0;
  const [activeTab, setActiveTab] = useState(hasTabs ? tabValues[0] : null);

  const TAB_LABELS = { hiper: 'Hiperkalemia', hipo: 'Hipokalemia' };

  const visibleBlocks = hasTabs
    ? safeBlocks.filter(b => !b.tab || b.tab === activeTab)
    : safeBlocks;

  const mainBlocks = visibleBlocks.filter(b => !b.layout_position || b.layout_position === 'main' || b.layout_position === 'full');
  const sidebarBlocks = visibleBlocks.filter(b => b.layout_position === 'sidebar');

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      {hasTabs && (
        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
          {tabValues.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {TAB_LABELS[tab] || tab}
            </button>
          ))}
        </div>
      )}
      {/* Main blocks — full width */}
      <div className="space-y-5">
        {mainBlocks.map(renderBlock).filter(Boolean)}
      </div>
      {/* Sidebar blocks — below main, in 2-col grid if multiple */}
      {sidebarBlocks.length > 0 && (
        <div className={sidebarBlocks.length > 1 ? 'grid gap-5 sm:grid-cols-2' : ''}>
          {sidebarBlocks.map(renderBlock).filter(Boolean)}
        </div>
      )}

      {(safeRelatedTopics.length > 0 || visibleRelatedTools.length > 0) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Contenido relacionado</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {safeRelatedTopics.map((ref, idx) => (
              <Link key={idx} to={createPageUrl(`TopicDetail?id=${ref.topic_id}`)}>
                <div className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Protocolo relacionado</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{ref.label}</p>
                </div>
              </Link>
            ))}
            {visibleRelatedTools.map((ref, idx) => (
              <Link key={idx} to={createPageUrl(`AllCalculators?calc=${ref.tool_id}`)}>
                <div className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-purple-300 hover:shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Calculator className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">Calculadora</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{ref.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
