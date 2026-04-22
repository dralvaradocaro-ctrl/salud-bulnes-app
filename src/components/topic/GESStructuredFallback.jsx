import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import ResponsiveTopicLayout from '@/components/topic/ResponsiveTopicLayout';
import { buildGesFallbackBlocks, getGesTopicMeta } from '@/lib/ges';
import { extractGuaranteeStages } from '@/lib/guarantees';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

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

const SOFT_EASE = [0.22, 1, 0.36, 1];

const heroVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: SOFT_EASE },
  },
};

const surfaceVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, delay: 0.1, ease: SOFT_EASE },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: SOFT_EASE },
  },
};

export default function GESStructuredFallback({ topic }) {
  const { area, theme } = getGesTopicMeta(topic.name);
  const fallbackBlocks = buildGesFallbackBlocks(topic);
  const gesLabel = topic.order ? `GES N.°${topic.order}` : 'Tema GES';
  const isOncology = area === 'Oncología';
  const rawStages = extractGuaranteeStages(topic);
  const guaranteeStages = rawStages.length > 0
    ? rawStages.slice(0, 4)
    : isOncology
      ? ONCOLOGY_FALLBACK_STAGES
      : [];

  return (
    <div className="space-y-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.hero} p-6 md:p-8 text-white shadow-2xl`}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
        </div>

        <div className="relative space-y-5">
          {/* Badges + title */}
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className={`border ${theme.softBadge}`}>{gesLabel}</Badge>
              <Badge className={`border ${theme.softBadge}`}>{area}</Badge>
              <Badge className={`border ${theme.softBadge}`}>
                {topic.has_local_protocol ? 'Con protocolo local' : 'Sin protocolo local'}
              </Badge>
            </div>
            {topic.description && (
              <h2 className="text-xl font-bold leading-snug tracking-tight text-white md:text-2xl">
                {topic.description}
              </h2>
            )}
          </div>
          {/* Guarantee — full width, categories as horizontal grid */}
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/80" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Garantía de oportunidad
              </p>
              {isOncology && (
                <span className="ml-auto flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
                  <AlertCircle className="h-3 w-3" />
                  Oncológica
                </span>
              )}
            </div>
            {(() => {
              const GRP_STYLES = [
                { pill: 'bg-sky-400/20 border-sky-300/30',      dot: 'bg-sky-300'    },
                { pill: 'bg-violet-400/20 border-violet-300/30', dot: 'bg-violet-300' },
                { pill: 'bg-teal-400/20 border-teal-300/30',    dot: 'bg-teal-300'   },
                { pill: 'bg-amber-400/20 border-amber-300/30',  dot: 'bg-amber-300'  },
              ];
              const groups = guaranteeStages.reduce((acc, s) => {
                const g = acc.find(x => x.label === s.label);
                if (g) g.items.push(s); else acc.push({ label: s.label, items: [s] });
                return acc;
              }, []);
              return groups.length > 0 ? (
                <div className="space-y-2">
                  {groups.map(({ label, items }, gi) => {
                    const st = GRP_STYLES[gi % GRP_STYLES.length];
                    return (
                      <div key={label}>
                        <div className={`mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 ${st.pill}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {label}
                        </div>
                        <div className="space-y-1">
                          {items.map((item, ii) => (
                            <div key={ii} className="flex items-center justify-between gap-4 rounded-lg bg-white/10 px-3 py-2">
                              <p className="text-sm leading-relaxed text-white/85">{item.description}</p>
                              {item.timeframe && (
                                <span className="shrink-0 rounded-lg border border-white/20 bg-white/15 px-3 py-1 text-sm font-bold text-white">
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
                <p className="text-sm text-white/70">Plazos específicos pendientes de carga para esta ficha.</p>
              );
            })()}
            <p className="mt-3 text-[11px] text-white/50">
              Acceso · Calidad · Protección financiera: también garantizados en todas las prestaciones GES.
            </p>
          </div>
          {topic.has_local_protocol && (
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white/80" />
                <p className="text-xs font-semibold text-white">Protocolo local activo</p>
                <p className="text-xs text-white/70">— Esta vista actúa como apoyo visual complementario al protocolo institucional.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={surfaceVariants}
        className={`rounded-[2rem] border border-slate-200 bg-gradient-to-br ${theme.surface} p-3 md:p-4`}
      >
        <ResponsiveTopicLayout
          blocks={fallbackBlocks}
          layoutMode="two-panel-6040"
          relatedTopics={topic.related_topics}
          relatedTools={topic.related_tools}
        />
      </motion.div>
    </div>
  );
}
