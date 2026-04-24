import { Clock, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  extractGuaranteeStages,
  hasGuaranteeContent,
} from '@/lib/guarantees';
import { getGesTopicMeta } from '@/lib/ges';

// URL del formulario GES desplegado — actualizar cuando esté en Vercel
const GES_FORM_URL = 'https://formulario-ges-hb.vercel.app';

const ONCOLOGY_FALLBACK_STAGES = [
  {
    label: 'Confirmación diagnóstica',
    timeframe: '45 días',
    description: 'Desde sospecha fundada hasta confirmación histológica o citológica.',
  },
  {
    label: 'Inicio de tratamiento',
    timeframe: '45 días',
    description: 'Desde indicación médica (cirugía, quimioterapia o radioterapia).',
  },
  {
    label: 'Seguimiento',
    timeframe: '15 días',
    description: 'Desde indicación médica para control y continuidad asistencial.',
  },
];

export default function GESGuarantee({ topic }) {
  const isGesTopic = topic?.clasificacion_ges === 'GES';
  const hasSpecificGuaranteeInfo = hasGuaranteeContent(topic);
  const guaranteeStages = extractGuaranteeStages(topic);
  const { area } = getGesTopicMeta(topic?.name ?? '');
  const isOncology = area === 'Oncología';

  if (!isGesTopic && !hasSpecificGuaranteeInfo) return null;

  const stagesToShow =
    guaranteeStages.length > 0
      ? guaranteeStages
      : isOncology
        ? ONCOLOGY_FALLBACK_STAGES
        : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3"
    >
      {/* Compact header */}
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-600" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
          Garantía de oportunidad
        </p>
        {isOncology && (
          <span className="ml-auto flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            <AlertCircle className="h-3 w-3" />
            Oncológica
          </span>
        )}
      </div>

      {/* Stages */}
      {(() => {
        const GRP_STYLES = [
          { pill: 'bg-amber-100 border-amber-200 text-amber-800', dot: 'bg-amber-400' },
          { pill: 'bg-orange-100 border-orange-200 text-orange-800', dot: 'bg-orange-400' },
          { pill: 'bg-yellow-100 border-yellow-200 text-yellow-800', dot: 'bg-yellow-500' },
          { pill: 'bg-red-100 border-red-200 text-red-800', dot: 'bg-red-400' },
        ];
        /** @type {{ label: string; items: typeof stagesToShow }[]} */
        const groups = stagesToShow.reduce((acc, s) => {
          const g = acc.find(x => x.label === s.label);
          if (g) g.items.push(s); else acc.push({ label: s.label, items: [s] });
          return acc;
        }, /** @type {{ label: string; items: typeof stagesToShow }[]} */ ([]));
        return groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map(({ label, items }, gi) => {
              const st = GRP_STYLES[gi % GRP_STYLES.length];
              return (
                <div key={label}>
                  <div className={`mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${st.pill}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {label}
                  </div>
                  <div className="space-y-1">
                    {items.map((item, ii) => (
                      <div key={ii} className="flex items-center justify-between gap-3 rounded-lg bg-amber-50/60 px-3 py-1.5">
                        <p className="text-xs leading-relaxed text-slate-700">{item.description}</p>
                        {item.timeframe && (
                          <span className="shrink-0 rounded-md border border-amber-200 bg-white px-2 py-0.5 text-xs font-bold text-amber-800">
                            {item.timeframe}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Plazos específicos pendientes de carga para esta ficha.</p>
        );
      })()}

      {/* Footer */}
      <p className="mt-3 text-[11px] text-amber-600/70">
        Acceso · Calidad · Protección financiera: también garantizados en todas las prestaciones GES.
      </p>

      {/* Formulario GES */}
      <a
        href={GES_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 transition-all hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-sm group"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
          <FileText className="h-4 w-4 text-emerald-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900">Formulario de Notificación GES</p>
          <p className="text-xs text-emerald-700">Certificación Art. 24 · Ley 19.966</p>
        </div>
        <ExternalLink className="h-4 w-4 text-emerald-500 group-hover:text-emerald-700 transition-colors shrink-0" />
      </a>
    </motion.div>
  );
}
