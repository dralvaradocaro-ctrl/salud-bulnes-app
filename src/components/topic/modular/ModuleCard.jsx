import React from 'react';
import { TONES } from './tones';

// Tarjeta común de la vista modular: ícono, título, descripción y un dato a la derecha.
export default function ModuleCard({ icon: Icon, tone = 'neutral', title, description, meta, children, className = '' }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <div className={`h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {(title || Icon) && (
        <div className="flex items-start gap-3">
          {Icon && (
            <span aria-hidden="true" className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${t.icon}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-lg font-bold leading-snug text-slate-900">{title}</h3>}
            {description && <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{description}</p>}
          </div>
          {meta && (
            <span className="flex-none rounded-full bg-slate-100 px-2.5 py-1 text-[13px] font-semibold text-slate-700">{meta}</span>
          )}
        </div>
      )}
      {children && <div className={title || Icon ? 'mt-4' : ''}>{children}</div>}
    </div>
  );
}
