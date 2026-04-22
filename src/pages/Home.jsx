const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import CategoryCard from '@/components/home/CategoryCard';
import { createPageUrl } from '@/utils';
import { Activity, Users, FileText, Sparkles, Calculator, Syringe, ArrowRight } from 'lucide-react';
import { countedCalculators } from '@/components/calculators/catalog';

export default function Home() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.entities.Category.list('order'),
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics-count'],
    queryFn: () => db.entities.Topic.list(),
  });

  const protocolCount = topics.filter(t => t.has_local_protocol).length;
  const calculatorCount = countedCalculators.length;
  const categoryEntries = categories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Centro de Consultas Médicas
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Guía Clínica
              <span className="text-blue-600"> Hospital Bulnes</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Protocolos, flujos de atención y herramientas clínicas para el personal de salud
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <GlobalSearch autoFocus />
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{topics.length}</p>
                <p className="text-sm text-slate-500">Temas disponibles</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-2 bg-green-100 rounded-xl">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{protocolCount}</p>
                <p className="text-sm text-slate-500">Protocolos locales</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-2 bg-violet-100 rounded-xl">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
                <p className="text-sm text-slate-500">Categorías</p>
              </div>
            </div>
            <Link
              to={createPageUrl('AllCalculators')}
              className="flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-md hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="p-2 bg-white/20 rounded-xl">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{calculatorCount}</p>
                <p className="text-sm text-purple-100">Calculadoras</p>
              </div>
            </Link>
          </motion.div>

          {/* Protocolo Insulínico - Flashcard destacada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <Link to={createPageUrl('ProtocoloInsulina')}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group">
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/10 rounded-full translate-y-1/2"></div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Syringe className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wider">Protocolo Local</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">Nuevo</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">Corrección Insulínica</h3>
                      <p className="text-sm text-blue-100 mt-0.5">Hiperglicemia preprandial · Calculadora interactiva</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all">
                    <span className="text-sm font-medium hidden sm:block">Abrir</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900">Áreas de Consulta</h2>
          <p className="text-slate-600 mt-1">Seleccione una categoría para explorar</p>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : categoryEntries.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryEntries.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-800">No hay categorías disponibles</p>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="pb-10 px-4 max-w-2xl mx-auto space-y-5">

        {/* Créditos */}
        <div className="text-center text-sm text-slate-500">
          <p>Hospital de Bulnes · Servicio de Salud Ñuble</p>
          <p className="mt-1">Plataforma de consulta interna para personal médico</p>
          <p className="mt-3 text-slate-500">
            Desarrollado en conjunto por Dr. Fernando Alvarado Caro e Ing. Daniel Vargas Quinteros
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Abril 2026 · Última edición: abril 2026</p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Aviso legal y de uso</p>

          <p className="text-xs leading-relaxed text-slate-600">
            Esta plataforma es una herramienta de consulta y apoyo a la gestión clínica, de carácter
            estrictamente referencial, destinada al uso exclusivo de personal de salud del Hospital de Bulnes.
            La información contenida no reemplaza el juicio clínico del profesional ni constituye
            una indicación médica formal. Los desarrolladores no se hacen responsables de errores,
            imprecisiones, posologías, indicaciones farmacológicas, derivaciones o solicitudes de estudios
            realizadas en base al contenido aquí presentado. Para certeza sobre cualquier antecedente,
            remítase a los protocolos institucionales vigentes. En caso de duda, consulte directamente
            con el profesional o especialista a cargo.
          </p>

          <div className="border-t border-slate-200 pt-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500">Marco normativo respetado</p>
            <ul className="space-y-1">
              {[
                { ley: 'Ley 20.584', desc: 'Derechos y Deberes de las Personas en Salud — esta plataforma apoya la atención clínica sin almacenar ni procesar datos de pacientes, resguardando en todo momento la dignidad, privacidad y autonomía de las personas.' },
                { ley: 'Ley 19.628', desc: 'Protección de Datos Personales — la plataforma no recopila, almacena ni procesa datos personales ni datos sensibles de salud de pacientes.' },
                { ley: 'Ley 20.285', desc: 'Acceso a la Información Pública — la plataforma opera con transparencia como herramienta de apoyo institucional.' },
                { ley: 'Ley 19.966 (GES/AUGE)', desc: 'Los contenidos relacionados con garantías GES son de carácter informativo y referencial; las garantías legales vigentes se rigen por los decretos MINSAL correspondientes.' },
              ].map(({ ley, desc }) => (
                <li key={ley} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="mt-0.5 shrink-0 font-semibold text-slate-600">{ley}:</span>
                  <span className="leading-relaxed">{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link
            to={createPageUrl('AdminLogin')}
            className="inline-block text-xs text-slate-300 hover:text-blue-500 transition-colors"
          >
            Ingresar
          </Link>
        </div>
      </div>
    </div>
  );
}
