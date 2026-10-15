import { useMemo, useState } from 'react';
import { ArrowLeft, CircleCheck, ExternalLink, Milk, OctagonX, Search, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import lactationData from '@/data/lactationDrugs.json';
import { findDrugByName, searchDrugs } from '@/lib/lactationSearch';

const { drugs: DRUGS, meta: META } = lactationData;

// Los 4 niveles de riesgo de e-lactancia, con una lectura en lenguaje simple para la consulta.
export const LACTATION_LEVELS = [
  {
    level: 0,
    label: 'Compatible',
    short: 'Riesgo muy bajo',
    plain: 'Seguro. Se puede usar manteniendo la lactancia.',
    icon: CircleCheck,
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-100 text-emerald-800',
    banner: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    chip: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  {
    level: 1,
    label: 'Probablemente compatible',
    short: 'Riesgo bajo',
    plain: 'Bastante seguro. Efectos leves o poco probables: observar al lactante.',
    icon: ShieldCheck,
    dot: 'bg-yellow-400',
    pill: 'bg-yellow-100 text-yellow-800',
    banner: 'bg-yellow-50 border-yellow-300 text-yellow-900',
    chip: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  },
  {
    level: 2,
    label: 'Compatibilidad limitada',
    short: 'Riesgo alto',
    plain: 'Poco seguro. Preferir una alternativa más segura; si se usa, vigilar al lactante o suspender temporalmente.',
    icon: TriangleAlert,
    dot: 'bg-orange-500',
    pill: 'bg-orange-100 text-orange-800',
    banner: 'bg-orange-50 border-orange-300 text-orange-900',
    chip: 'border-orange-300 bg-orange-50 text-orange-800',
  },
  {
    level: 3,
    label: 'Incompatible',
    short: 'Riesgo muy alto',
    plain: 'Muy inseguro. Usar una alternativa; si no la hay, suspender la lactancia.',
    icon: OctagonX,
    dot: 'bg-red-600',
    pill: 'bg-red-100 text-red-800',
    banner: 'bg-red-50 border-red-300 text-red-900',
    chip: 'border-red-300 bg-red-50 text-red-800',
  },
];

// Accesos rápidos a lo más consultado en puerperio y consulta ginecológica.
const QUICK_PICKS = [
  'Paracetamol', 'Ibuprofeno', 'Ketorolaco', 'Metamizol', 'Tramadol', 'Cefadroxilo',
  'Amoxicilina + ácido clavulánico', 'Nitrofurantoína', 'Metronidazol', 'Fluconazol', 'Sertralina',
  'Domperidona', 'Enoxaparina', 'Labetalol', 'Nifedipino', 'Levonorgestrel (oral, implante, DIU)',
  'Medroxiprogesterona', 'Etinilestradiol + levonorgestrel', 'Hierro (sales ferrosas orales)',
].map(name => DRUGS.find(drug => drug.name === name)).filter(Boolean);

const PAGE = 40;

function LevelPill({ level, className = '' }) {
  const info = LACTATION_LEVELS[level];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.pill} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${info.dot}`} aria-hidden="true" />
      {info.label}
    </span>
  );
}

function DrugDetail({ drug, onSelect, onClose }) {
  const info = LACTATION_LEVELS[drug.level];
  const Icon = info.icon;
  const alternatives = (drug.alts || []).map(alt => ({ ...alt, match: findDrugByName(DRUGS, alt.name, alt.level) }));

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`flex items-start gap-3 border-b-2 px-5 py-4 ${info.banner}`}>
        <Icon className="mt-0.5 h-8 w-8 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">{info.short}</p>
          <p className="text-xl font-bold leading-tight">{info.label}</p>
          <p className="mt-1 text-sm font-medium">{info.plain}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 opacity-70 hover:bg-white/50 hover:opacity-100" aria-label="Cerrar ficha">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{drug.name}</h3>
          {drug.source && <p className="text-xs text-slate-500">Ficha e-lactancia: {drug.source}</p>}
          {drug.aliases?.length > 0 && <p className="text-xs text-slate-500">También: {drug.aliases.join(', ')}</p>}
        </div>

        {drug.what && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Qué es</h4>
            <p className="mt-1 text-sm text-slate-700">{drug.what}</p>
          </section>
        )}

        {drug.points?.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lactancia: puntos clave</h4>
            <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {drug.points.map(point => <li key={point}>{point}</li>)}
            </ul>
          </section>
        )}

        {drug.level > 0 && alternatives.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Alternativas más seguras</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {alternatives.map(alt => {
                const altInfo = LACTATION_LEVELS[alt.level] || LACTATION_LEVELS[0];
                const content = (
                  <>
                    <span className={`h-2 w-2 rounded-full ${altInfo.dot}`} aria-hidden="true" />
                    {alt.match?.name || alt.name}
                  </>
                );
                return alt.match ? (
                  <button key={alt.name} type="button" onClick={() => onSelect(alt.match)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold hover:shadow-sm ${altInfo.chip}`}>
                    {content}
                  </button>
                ) : (
                  <span key={alt.name} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${altInfo.chip}`}>
                    {content}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Ficha actualizada en e-lactancia: {drug.updated || 'sin fecha'}</span>
          <a href={drug.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-pink-700 underline-offset-2 hover:underline">
            Ver ficha completa <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function LactationSafetyTool() {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [visible, setVisible] = useState(PAGE);

  const results = useMemo(() => searchDrugs(DRUGS, query, levelFilter), [query, levelFilter]);
  const counts = useMemo(() => LACTATION_LEVELS.map(({ level }) => DRUGS.filter(drug => drug.level === level).length), []);
  const searching = query.trim() !== '' || levelFilter !== null;

  const select = drug => {
    setSelected(drug);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };
  const updateQuery = value => { setQuery(value); setVisible(PAGE); };
  const toggleLevel = level => { setLevelFilter(current => (current === level ? null : level)); setVisible(PAGE); };

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Fármacos y lactancia</h2>
            <p className="mt-0.5 text-sm text-white/80">Compatibilidad con la lactancia materna según e-lactancia.org (APILAM).</p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20" aria-hidden="true">
            <Milk className="h-6 w-6" />
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {selected && (
          <div className="space-y-2">
            <button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al listado
            </button>
            <DrugDetail drug={selected} onSelect={select} onClose={() => setSelected(null)} />
          </div>
        )}

        <label className="relative block">
          <span className="sr-only">Buscar fármaco</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={event => updateQuery(event.target.value)}
            placeholder="Buscar fármaco (ej. sertralina, dipirona, ACO)…"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LACTATION_LEVELS.map(info => {
            const active = levelFilter === info.level;
            return (
              <button key={info.level} type="button" onClick={() => toggleLevel(info.level)} aria-pressed={active}
                className={`rounded-xl border px-3 py-2 text-left transition ${active ? `${info.chip} ring-2 ring-offset-1 ring-current` : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className={`h-2.5 w-2.5 rounded-full ${info.dot}`} aria-hidden="true" />
                  {info.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500">{info.short} · {counts[info.level]}</span>
              </button>
            );
          })}
        </div>

        {!searching && QUICK_PICKS.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Frecuentes en puerperio y ginecología</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PICKS.map(drug => (
                <button key={drug.id} type="button" onClick={() => select(drug)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <span className={`h-2 w-2 rounded-full ${LACTATION_LEVELS[drug.level].dot}`} aria-hidden="true" />
                  {drug.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs text-slate-500">
            {searching ? `${results.length} resultado${results.length === 1 ? '' : 's'}` : `${DRUGS.length} fármacos y productos`}
          </p>
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              No está en este listado. Consulta directamente en{' '}
              <a href="https://www.e-lactancia.org/" target="_blank" rel="noopener noreferrer" className="font-semibold text-pink-700 underline">e-lactancia.org</a>
              , que incluye más de 30.000 términos.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {results.slice(0, visible).map(drug => (
                <li key={drug.id}>
                  <button type="button" onClick={() => select(drug)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 ${selected?.id === drug.id ? 'bg-slate-50' : ''}`}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{drug.name}</span>
                      {drug.what && <span className="block truncate text-xs text-slate-500">{drug.what}</span>}
                    </span>
                    <LevelPill level={drug.level} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results.length > visible && (
            <button type="button" onClick={() => setVisible(count => count + PAGE)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Mostrar más ({results.length - visible} restantes)
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-[11px] leading-relaxed text-slate-500">
        Fuente: <a href="https://www.e-lactancia.org/" target="_blank" rel="noopener noreferrer" className="underline">e-lactancia.org</a>,
        APILAM ({META.license}). Niveles de riesgo y resúmenes tomados de sus fichas el {META.extracted}; cada ficha enlaza a la versión vigente.
        Orienta la decisión, no reemplaza el juicio clínico: la dosis, la vía, la edad y la prematurez del lactante pueden cambiar la conducta.
      </div>
    </Card>
  );
}
