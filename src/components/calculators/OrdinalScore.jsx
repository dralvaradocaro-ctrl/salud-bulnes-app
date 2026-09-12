import { useState } from 'react';
import { Card } from '@/components/ui/card';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';

/**
 * Base para puntajes clínicos que suman ítems ordinales (Tal, Westley y
 * similares): cada ítem ofrece opciones con puntaje y el total define una
 * categoría con su conducta.
 *
 * @param {object} props
 * @param {Array<{id:string,label:string,detail?:string,options:Array<{value:number,label:string,detail?:string}>}>} props.items
 * @param {(score:number)=>object} props.interpret Devuelve {nivel, bg, badge, text, conducta, recs[]}.
 * @param {React.ReactNode} [props.extra] Controles previos a los ítems (p. ej. tramo de edad).
 */
// Tailwind purga las clases construidas por interpolación, así que la variante
// seleccionada se elige de un mapa con nombres completos.
const SELECTED = {
  teal: 'border-teal-500 bg-teal-50',
  sky: 'border-sky-500 bg-sky-50',
  violet: 'border-violet-500 bg-violet-50',
  rose: 'border-rose-500 bg-rose-50',
};

export default function OrdinalScore({
  title,
  subtitle,
  gradient = 'from-teal-700 to-cyan-700',
  accent = 'teal',
  items,
  interpret,
  maxScore,
  extra = null,
  ready = true,
  readyHint = '',
  references = [],
  footnote,
}) {
  const [scores, setScores] = useState({});

  const answered = items.filter(item => scores[item.id] !== undefined).length;
  const complete = ready && answered === items.length;
  const score = items.reduce((total, item) => total + (scores[item.id] ?? 0), 0);
  const result = complete ? interpret(score) : null;
  const reset = () => setScores({});

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-white/75">{subtitle}</p>}
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl font-bold">
            {complete ? score : '—'}
          </span>
        </div>
      </div>

      {extra && <div className="border-b border-slate-100 px-6 py-4">{extra}</div>}

      <div className="divide-y divide-slate-100">
        {items.map(item => (
          <div key={item.id} className="px-6 py-4">
            <p className="text-sm font-bold text-slate-900">{item.label}</p>
            {item.detail && <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>}
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {item.options.map(option => {
                const selected = scores[item.id] === option.value;
                return (
                  <button
                    key={`${item.id}-${option.value}-${option.label}`}
                    type="button"
                    onClick={() => setScores(current => ({ ...current, [item.id]: option.value }))}
                    aria-pressed={selected}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? `${SELECTED[accent] || SELECTED.teal} font-semibold text-slate-900`
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span>{option.label}</span>
                      <span className="shrink-0 text-xs font-bold text-slate-500">{option.value}</span>
                    </span>
                    {option.detail && <span className="mt-0.5 block text-xs leading-snug text-slate-500">{option.detail}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Respondidos {answered}/{items.length}
          </span>
          <span className="text-2xl font-bold text-slate-900">
            {complete ? score : '—'} <span className="text-base font-normal text-slate-400">/ {maxScore}</span>
          </span>
        </div>

        {!complete && readyHint && !ready && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">{readyHint}</p>
        )}

        {result && (
          <div className={`rounded-xl border-2 px-4 py-3 ${result.bg}`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${result.text}`}>{result.nivel}</span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${result.badge}`}>{score}/{maxScore}</span>
            </div>
            <p className={`text-sm font-bold ${result.text}`}>{result.conducta}</p>
            <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${result.text}`}>
              {result.recs.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}

        {answered > 0 && (
          <button type="button" onClick={reset} className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700">
            Reiniciar
          </button>
        )}

        {references.length > 0 && <CalculatorReferences references={references} />}
        {footnote && <p className="border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-slate-500">{footnote}</p>}
      </div>
    </Card>
  );
}
