import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Calculator, ChevronRight, FileText, GitBranch, Info, Link as LinkIcon, ListChecks, Phone, Workflow } from 'lucide-react';
import ModuleCard from './ModuleCard';
import { TONES, toneFromColor } from './tones';
import ArsenalMatch from '../ArsenalMatch';
import MermaidDiagram from '../MermaidDiagram';
import { groupBySeparators, leadingCode, listCarriesCodes, parseKeyValue, stripStepPrefix } from '@/lib/blockContent';

const DOSE_RE = /\d[\d,.]*\s*(?:mg|mcg|µg|g|UI|mL)\b/i;
const ROUTE_RE = /\b(?:VO|EV|IV|IM|SC)\b|c\/\d|cada \d|infusi[oó]n/i;
const isDose = (text) => DOSE_RE.test(text) && ROUTE_RE.test(text);

const markdownComponents = {
  h2: ({ children }) => <h4 className="mb-1 mt-4 text-[15px] font-bold text-slate-900 first:mt-0">{children}</h4>,
  h3: ({ children }) => <h4 className="mb-1 mt-4 text-[15px] font-bold text-slate-900 first:mt-0">{children}</h4>,
  h4: ({ children }) => <h5 className="mb-1 mt-3 text-sm font-semibold text-slate-800">{children}</h5>,
  p: ({ children }) => <p className="mb-2 text-[15px] leading-relaxed text-slate-800 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  ul: ({ children }) => <ul className="mb-2 space-y-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1.5 pl-5">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[15px] leading-relaxed text-slate-800">
      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-slate-400" />
      <span>{children}</span>
    </li>
  ),
};

function SubGroupTitle({ children }) {
  return <h4 className="text-[15px] font-bold text-slate-900">{children}</h4>;
}

// "+4 Combativo: …" → el puntaje en negrita delante del texto.
function CodedText({ text, renderInline }) {
  const coded = leadingCode(text);
  if (!coded) return renderInline(text);
  return <><strong className="font-bold text-slate-900 [font-variant-numeric:tabular-nums]">{coded.code}</strong>{' '}{renderInline(coded.rest)}</>;
}

// Una línea de lista: teléfono, par "Clave: valor", dosis (con su match de arsenal) o viñeta.
function ListLine({ text, tone, wide, renderInline }) {
  const t = TONES[tone] || TONES.neutral;
  const clean = text.replace(/^[•·]\s*/, '');
  const lines = clean.split('\n');
  const main = lines.filter(l => !l.trim().startsWith('~')).join(' ').trim();
  const subs = lines.filter(l => l.trim().startsWith('~')).map(l => l.trim().slice(1).trim());

  if (/^[📞📱☎]/.test(main)) {
    const label = main.replace(/^[📞📱☎]\s*/, '').trim();
    const number = label.match(/\d[\d\s\-.]{3,}\d/);
    return (
      <li>
        <a href={number ? `tel:${number[0].replace(/[\s\-.]/g, '')}` : undefined} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-slate-50 px-3 text-[15px] font-medium text-slate-800 hover:bg-slate-100">
          <Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />{label}
        </a>
      </li>
    );
  }

  const pair = parseKeyValue(main);
  return (
    <li className="py-1">
      {pair ? (
        // En bloques anchos clave y valor van en columnas; en angostos la clave va sobre el valor.
        <div className={wide ? 'grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-3 text-[15px] leading-relaxed' : 'text-[15px] leading-relaxed'}>
          <span className={`font-semibold text-slate-900 ${wide ? '' : 'block'}`}>{pair.key}</span>
          <span className={`text-slate-800 [font-variant-numeric:tabular-nums] ${wide ? '' : 'block'}`}>{renderInline(pair.value)}{isDose(pair.value) && <ArsenalMatch text={pair.value} />}</span>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 text-[15px] leading-relaxed text-slate-800">
          <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${t.dot}`} />
          <span className="[font-variant-numeric:tabular-nums]"><CodedText text={main} renderInline={renderInline} />{isDose(main) && <ArsenalMatch text={main} />}</span>
        </div>
      )}
      {subs.length > 0 && (
        <ul className="mt-1 space-y-0.5 pl-4">
          {subs.map((sub, i) => <li key={i} className="text-sm leading-relaxed text-slate-600">{renderInline(sub)}</li>)}
        </ul>
      )}
    </li>
  );
}

function Criteria({ block, tone, wide, renderInline }) {
  const groups = groupBySeparators(block.items || []);
  const count = groups.reduce((n, g) => n + g.items.length, 0);
  const layout = wide && groups.length >= 2 ? 'grid gap-x-8 gap-y-5 sm:grid-cols-2' : 'space-y-5';
  return (
    <ModuleCard icon={tone === 'red' ? AlertTriangle : ListChecks} tone={tone} title={block.title || 'Criterios'} description={block.content || block.description} meta={groups.length <= 1 && count > 0 ? `${count}` : null}>
      <div className={layout}>
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.title && <SubGroupTitle>{group.title}</SubGroupTitle>}
            <ul className={group.title ? 'mt-1.5' : ''}>
              {group.items.map((item, i) => <ListLine key={i} text={item} tone={tone} wide={wide && groups.length < 2} renderInline={renderInline} />)}
            </ul>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}

// Pasos de un flujo: "~" o "→" al inicio cuelgan del paso anterior; la numeración reinicia en cada subgrupo.
function toSteps(items) {
  const steps = [];
  for (const raw of items) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('~') || trimmed.startsWith('→')) {
      const sub = trimmed.startsWith('~') ? trimmed.slice(1).trim() : trimmed;
      if (steps.length > 0) steps[steps.length - 1].subs.push(sub);
      else steps.push({ text: '', subs: [sub] });
      continue;
    }
    const lines = trimmed.split('\n');
    steps.push({
      text: stripStepPrefix(lines.filter(l => !l.startsWith('~')).join(' ').trim()),
      subs: lines.filter(l => l.startsWith('~')).map(l => l.slice(1).trim()),
    });
  }
  return steps;
}

// Varios subgrupos en un bloque ancho van lado a lado: dos grupos en 2/3 + 1/3, tres o más en dos columnas.
const groupsLayout = (wide, count) => {
  if (!wide || count < 2) return 'space-y-5';
  return count === 2 ? 'grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : 'grid gap-x-8 gap-y-5 sm:grid-cols-2';
};

function Flow({ block, tone, wide, renderInline }) {
  const t = TONES[tone] || TONES.blue;
  // Solo la secuencia sin título se numera; los subgrupos con título son categorías (principios, vías…)
  // y una lista cuyos ítems ya traen su puntaje (+4, −1 a −3…) tampoco se numera.
  const groups = groupBySeparators(block.details || []).map(g => ({ ...g, steps: toSteps(g.items), numbered: g.title === null && !listCarriesCodes(g.items) }));
  const total = groups.filter(g => g.numbered).reduce((n, g) => n + g.steps.length, 0);
  return (
    <ModuleCard
      icon={block.type === 'algorithm' ? GitBranch : Workflow}
      tone={tone}
      title={block.title}
      description={block.description || block.content}
      meta={total > 0 ? `${block.type === 'algorithm' ? 'Algoritmo' : 'Flujo'} · ${total} ${total === 1 ? 'paso' : 'pasos'}` : null}
    >
      <div className={groupsLayout(wide, groups.length)}>
        {groups.map((group, gi) => {
          const List = group.numbered ? 'ol' : 'ul';
          return (
          <div key={gi}>
            {group.title && <SubGroupTitle>{group.title}</SubGroupTitle>}
            <List className={group.title ? 'mt-1.5' : ''}>
              {group.steps.map((step, i) => {
                const [lead, ...rest] = step.text.split('→');
                return (
                  <li key={i} className={`flex gap-3 ${group.numbered ? 'py-2' : 'py-1'} ${group.numbered && i > 0 ? 'border-t border-slate-100' : ''}`}>
                    {group.numbered
                      ? <span aria-hidden="true" className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white ${t.solid}`}>{i + 1}</span>
                      : <span aria-hidden="true" className={`mt-2.5 h-1.5 w-1.5 flex-none rounded-full ${t.dot}`} />}
                    <div className={`min-w-0 ${group.numbered ? 'pt-0.5' : ''}`}>
                      {step.text && (
                        <p className="text-[15px] leading-relaxed text-slate-800">
                          {rest.length > 0 && !block.links
                            ? <><strong className="font-semibold text-slate-900">{lead.trim()}</strong>{' → '}{rest.join('→').trim()}</>
                            : <CodedText text={step.text} renderInline={renderInline} />}
                        </p>
                      )}
                      {step.subs.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {step.subs.map((sub, si) => {
                            const pair = parseKeyValue(sub);
                            return (
                              <li key={si} className="text-sm leading-relaxed text-slate-600">
                                {pair ? <><span className="font-semibold text-slate-800">{pair.key}:</span> {renderInline(pair.value)}</> : renderInline(sub)}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </List>
          </div>
          );
        })}
      </div>
    </ModuleCard>
  );
}

const ALERT_ICONS = { red: AlertTriangle, amber: AlertTriangle, teal: ArrowRight, blue: Info, neutral: Info };

function Alert({ block, renderInline }) {
  const tone = toneFromColor(block.color, 'amber');
  const t = TONES[tone];
  const Icon = ALERT_ICONS[tone];
  return (
    <div role="note" className={`h-full rounded-2xl p-5 ${t.soft}`}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/70 ${t.ink}`}><Icon className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0">
          {block.title && <h3 className={`text-lg font-bold leading-snug ${t.ink}`}>{block.title}</h3>}
          {block.content && <p className="mt-0.5 text-[15px] leading-relaxed text-slate-800">{renderInline(block.content)}</p>}
        </div>
      </div>
    </div>
  );
}

// Referencia a otro protocolo, herramienta o página: una fila enlazada con la misma tarjeta.
export function ModularReference({ block, to, kind, onNavigate }) {
  const Icon = kind === 'calculator' ? Calculator : kind === 'page' ? FileText : LinkIcon;
  const label = kind === 'calculator' ? 'Herramienta' : kind === 'page' ? 'Solicitud' : 'Ver también';
  return (
    <Link to={to} onClick={onNavigate} className="group flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-slate-300 hover:bg-slate-50">
      <span aria-hidden="true" className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Icon className="h-[18px] w-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-600">{block.title && block.title !== 'Ver también' ? block.title : label}</span>
        <span className="block text-[15px] font-semibold text-blue-700 group-hover:text-blue-900">{block.reference_label}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-none text-slate-400" aria-hidden="true" />
    </Link>
  );
}

// Devuelve el bloque con el diseño común, o undefined para que el layout use el renderizado propio del tipo.
// Se llama como función (no como componente) para poder devolver undefined.
export function renderModularBlock({ block, wide = false, renderInline = (text) => text }) {
  switch (block.type) {
    case 'text':
      return (
        <ModuleCard icon={FileText} tone="neutral" title={block.title} description={block.description}>
          <ReactMarkdown components={markdownComponents}>{block.content || ''}</ReactMarkdown>
        </ModuleCard>
      );
    case 'flowchart':
    case 'algorithm':
      return <Flow block={block} tone={toneFromColor(block.color, 'blue')} wide={wide} renderInline={renderInline} />;
    case 'criteria':
      return <Criteria block={block} tone={toneFromColor(block.color, 'blue')} wide={wide} renderInline={renderInline} />;
    case 'alert':
      return <Alert block={block} renderInline={renderInline} />;
    case 'mermaid':
      return (
        <ModuleCard icon={Workflow} tone="neutral" title={block.title || 'Flujograma'} description={block.description}>
          <MermaidDiagram chart={block.content || block.diagram || block.chart || ''} />
        </ModuleCard>
      );
    default:
      return undefined;
  }
}
