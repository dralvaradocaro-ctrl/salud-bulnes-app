import { Card } from '@/components/ui/card';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';

export const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

export function NumberField({ label, unit, value, onChange, ...props }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {unit && <span className="font-normal text-slate-400">({unit})</span>}
      <input type="number" value={value} onChange={event => onChange(event.target.value)} className={inputClass} placeholder={unit} {...props} />
    </label>
  );
}

/**
 * Envoltorio común de las calculadoras: encabezado con el valor destacado,
 * cuerpo con los controles y bloque de resultado con su conducta.
 */
export default function ScoreShell({
  title,
  subtitle,
  gradient = 'from-teal-700 to-cyan-700',
  badge,
  children,
  highlight,
  result,
  pending,
  references = [],
  footnote,
  onReset,
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-white/75">{subtitle}</p>}
          </div>
          <span className="flex h-12 min-w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 px-2 text-lg font-bold">
            {badge ?? '—'}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-6">{children}</div>

      {highlight}

      <div className="space-y-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        {pending && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">{pending}</p>
        )}

        {result && (
          <div className={`rounded-xl border-2 px-4 py-3 ${result.bg}`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${result.text}`}>{result.nivel}</span>
              {result.valor !== undefined && (
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${result.badge}`}>{result.valor}</span>
              )}
            </div>
            {result.detalle && <p className={`text-sm font-medium ${result.text}`}>{result.detalle}</p>}
            {result.conducta && <p className={`mt-1 text-sm font-bold ${result.text}`}>{result.conducta}</p>}
            {result.recs?.length > 0 && (
              <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${result.text}`}>
                {result.recs.map(item => <li key={item}>{item}</li>)}
              </ul>
            )}
          </div>
        )}

        {onReset && (
          <button type="button" onClick={onReset} className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700">
            Reiniciar
          </button>
        )}

        {references.length > 0 && <CalculatorReferences references={references} />}
        {footnote && <p className="border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-slate-500">{footnote}</p>}
      </div>
    </Card>
  );
}
