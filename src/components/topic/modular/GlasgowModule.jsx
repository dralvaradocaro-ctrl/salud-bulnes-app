import React, { useState } from 'react';
import { Gauge, Minus, Plus } from 'lucide-react';
import ModuleCard from './ModuleCard';
import { GCS_COMPONENTS, GCS_NORMAL, clampGcsValue, gcsTotal, gcsSeverity } from '@/lib/glasgow';

const SEVERITY = {
  leve: { text: 'text-green-800', soft: 'bg-green-50', bar: '#15803d' },
  moderado: { text: 'text-amber-800', soft: 'bg-amber-50', bar: '#b45309' },
  grave: { text: 'text-red-800', soft: 'bg-red-50', bar: '#b91c1c' },
};

// Glasgow del adulto en la tarjeta común: clasifica el TEC; la conducta sigue en el protocolo.
export default function GlasgowModule() {
  const [values, setValues] = useState(GCS_NORMAL);
  const total = gcsTotal(values);
  const severity = gcsSeverity(total);
  const tone = SEVERITY[severity.id];
  const step = (key, delta) => setValues(prev => ({ ...prev, [key]: clampGcsValue(key, prev[key] + delta) }));

  return (
    <ModuleCard icon={Gauge} tone="amber" title="Escala de Glasgow" description="Clasificación del TEC según la mejor respuesta">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div aria-live="polite" className={`rounded-xl p-4 ${tone.soft}`}>
          <p className="[font-variant-numeric:tabular-nums]"><span className="text-5xl font-extrabold tracking-tight text-slate-900">{total}</span><span className="text-sm text-slate-600"> de 15</span></p>
          <p className={`mt-1 text-lg font-bold ${tone.text}`}>{severity.label}</p>
          <p className="text-sm text-slate-600 [font-variant-numeric:tabular-nums]">Glasgow {severity.range}</p>
          {severity.id === 'grave' && <p className="mt-1 text-sm font-semibold text-slate-900">Glasgow 8 o menos: asegurar la vía aérea.</p>}
          <div aria-hidden="true" className="mt-3 h-2 rounded-full bg-white">
            <div className="h-2 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${(total / 15) * 100}%`, background: tone.bar }} />
          </div>
          <button type="button" onClick={() => setValues(GCS_NORMAL)} className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900">Reiniciar</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {GCS_COMPONENTS.map(component => {
            const value = values[component.key];
            const max = component.options.length;
            return (
              <div key={component.key} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[13px] font-semibold text-slate-600">{component.label}</p>
                <p className="mt-0.5 min-h-[44px] text-[15px] font-semibold text-slate-900">{component.options[value - 1]}</p>
                <div className="mt-2 flex items-center justify-between">
                  <button type="button" onClick={() => step(component.key, -1)} disabled={value <= 1} aria-label={`Bajar ${component.label}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition-transform active:scale-95 disabled:opacity-40 motion-reduce:active:scale-100">
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="text-xl font-extrabold text-slate-900 [font-variant-numeric:tabular-nums]">{value}<span className="text-sm font-medium text-slate-500"> / {max}</span></span>
                  <button type="button" onClick={() => step(component.key, 1)} disabled={value >= max} aria-label={`Subir ${component.label}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition-transform active:scale-95 disabled:opacity-40 motion-reduce:active:scale-100">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModuleCard>
  );
}
