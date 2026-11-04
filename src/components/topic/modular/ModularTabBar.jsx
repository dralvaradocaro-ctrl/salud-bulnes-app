import React from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { ArrowRightLeft, BookOpen, Calculator, ClipboardCheck, Gauge, Pill, Workflow } from 'lucide-react';
import { TONES } from './tones';

// Ícono y tono de una pestaña según su nombre: el mismo significado en todos los protocolos.
export function tabVisual(label = '') {
  const text = label.toLowerCase();
  if (/f[aá]rmac|tratamiento|medicament|arsenal|reposici/.test(text)) return { Icon: Pill, tone: 'teal' };
  if (/flujo|algoritmo|diagrama|ruta/.test(text)) return { Icon: Workflow, tone: 'neutral' };
  if (/deriv|referencia|traslado/.test(text)) return { Icon: ArrowRightLeft, tone: 'red' };
  if (/cotejo|checklist|registro|documenta/.test(text)) return { Icon: ClipboardCheck, tone: 'blue' };
  if (/calculadora|decisi[oó]n/.test(text)) return { Icon: Calculator, tone: 'blue' };
  if (/evaluaci|escala|clasific|diagn[oó]st|triage|niveles|criterio|cl[ií]nica|definicion/.test(text)) return { Icon: Gauge, tone: 'amber' };
  return { Icon: BookOpen, tone: 'blue' };
}

// Pestañas repartidas en el ancho, cada una con ícono y lo que contiene. En el teléfono se deslizan.
export default function ModularTabBar({ tabs, active, onSelect, barRef, top, className = 'bg-slate-100/95' }) {
  if (!tabs?.length) return null;
  const equal = tabs.length <= 6;
  return (
    <MotionConfig reducedMotion="user">
    <div ref={barRef} style={{ top }} className={`sticky z-30 -mx-1 scroll-mt-32 px-1 pt-1 backdrop-blur ${className}`}>
      <div
        role="tablist"
        aria-label="Secciones del protocolo"
        className={`flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] ${equal ? 'lg:grid lg:overflow-visible' : ''}`}
        style={equal ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` } : undefined}
      >
        {tabs.map(tab => {
          const { Icon, tone } = tabVisual(tab.label);
          const t = TONES[tone];
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(tab.id)}
              className={`relative -mb-px flex min-h-[52px] min-w-[150px] flex-none items-center gap-3 rounded-t-xl border-b-[3px] border-transparent px-3 py-2 text-left transition-colors duration-300 ease-out lg:min-w-0 ${
                selected ? t.soft : 'hover:bg-white/70'
              }`}
            >
              {/* La línea inferior se desliza de una pestaña a otra. */}
              {selected && <motion.span layoutId="modular-tab-indicator" aria-hidden="true" className={`absolute inset-x-0 -bottom-[3px] h-[3px] rounded-full ${t.solid}`} transition={{ type: 'spring', stiffness: 320, damping: 34 }} />}
              <span aria-hidden="true" className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-colors duration-300 ease-out ${selected ? `${t.solid} text-white` : t.icon}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-[15px] text-slate-900 ${selected ? 'font-bold' : 'font-semibold'}`}>{tab.label}</span>
                {tab.summary && <span className="hidden truncate text-[13px] text-slate-600 sm:block">{tab.summary}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
    </MotionConfig>
  );
}
