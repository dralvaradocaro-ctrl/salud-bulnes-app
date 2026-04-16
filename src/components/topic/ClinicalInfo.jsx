import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Stethoscope, 
  FlaskConical, 
  Pill,
  ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ClinicalInfo({ topic }) {
  const sections = [
    {
      key: 'clinical_summary',
      title: 'Resumen Clínico',
      icon: FileText,
      content: topic.clinical_summary,
      color: 'blue'
    },
    {
      key: 'diagnostic_orientation',
      title: 'Orientación Diagnóstica',
      icon: Stethoscope,
      content: topic.diagnostic_orientation,
      color: 'violet'
    },
    {
      key: 'complementary_studies',
      title: 'Estudios Complementarios',
      icon: FlaskConical,
      content: topic.complementary_studies,
      color: 'emerald'
    },
    {
      key: 'initial_treatment',
      title: 'Tratamiento Inicial',
      icon: Pill,
      content: topic.initial_treatment,
      color: 'amber'
    }
  ].filter(s => s.content);

  if (sections.length === 0) return null;

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700'
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {sections.map((section, index) => (
        <motion.div
          key={section.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className={`p-4 border-b ${colorClasses[section.color]}`}>
            <div className="flex items-center gap-3">
              <section.icon className="h-5 w-5" />
              <h3 className="font-semibold">{section.title}</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="prose prose-sm prose-slate max-w-none">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}