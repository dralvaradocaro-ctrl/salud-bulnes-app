import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ChevronLeft,
  ClipboardList,
  FileSpreadsheet,
  ShieldPlus,
  Users,
} from 'lucide-react';

const moduleCardClass = 'group block h-full rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md';

export default function GestionPROA() {
  const modules = [
    {
      title: 'Formato de evolución PROA',
      description: 'Registro imprimible para evolucionar la visita del Programa de Optimización del Uso de Antimicrobianos.',
      icon: ClipboardList,
      color: 'teal',
      status: 'Disponible',
      to: createPageUrl('VisitaPROA'),
    },
    {
      title: 'Plantillas de pacientes',
      description: 'Espacio para listados, plantillas Excel y seguimiento de pacientes PROA.',
      icon: Users,
      color: 'slate',
      status: 'Próximamente',
    },
    {
      title: 'Tablas de seguimiento',
      description: 'Módulo pensado para cargar tablas clínicas, antibioterapia, cultivos y estado de revisión.',
      icon: FileSpreadsheet,
      color: 'slate',
      status: 'Próximamente',
    },
  ];

  const renderCard = (mod, index) => {
    const Icon = mod.icon;
    const available = Boolean(mod.to);
    const colors = mod.color === 'teal'
      ? {
          border: 'border-teal-200 hover:border-teal-300',
          icon: 'bg-teal-600',
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          action: 'text-teal-700',
        }
      : {
          border: 'border-slate-200 border-dashed',
          icon: 'bg-slate-100',
          iconText: 'text-slate-500',
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          action: 'text-slate-500',
        };

    const inner = (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className={`${moduleCardClass} ${colors.border}`}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
            <Icon className={`h-5 w-5 ${colors.iconText || 'text-white'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-900">{mod.title}</p>
              <Badge className={colors.badge}>{mod.status}</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{mod.description}</p>
            <div className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${colors.action}`}>
              {available ? 'Abrir módulo' : 'Preparado para integrar'}
              {available && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </div>
          </div>
        </div>
      </motion.div>
    );

    return available ? (
      <Link key={mod.title} to={mod.to} className="block">
        {inner}
      </Link>
    ) : (
      <div key={mod.title}>{inner}</div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600">
                <ShieldPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Gestión PROA</h1>
                <p className="text-sm text-slate-500">Módulos administrativos y clínicos del programa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/80 p-5"
        >
          <p className="text-lg font-bold text-slate-900">PROA</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Esta gestión agrupa el formato de evolución actual y queda preparada para incorporar plantillas de pacientes, tablas Excel y seguimiento operativo del programa.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {modules.map(renderCard)}
        </div>
      </main>
    </div>
  );
}
