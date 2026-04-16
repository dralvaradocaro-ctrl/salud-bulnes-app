const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import CategoryCard from '@/components/home/CategoryCard';
import { createPageUrl } from '@/utils';
import { Activity, Users, FileText, Sparkles, Calculator } from 'lucide-react';

export default function Home() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.entities.Category.list('order'),
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics-count'],
    queryFn: () => db.entities.Topic.list(),
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['tools-count'],
    queryFn: () => db.entities.ClinicalTool.list(),
  });

  const protocolCount = topics.filter(t => t.has_local_protocol).length;
  const calculatorCount = tools.length;

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
            className="flex flex-wrap justify-center gap-4 mb-16"
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
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="text-center pb-8 text-sm text-slate-500">
        <p>Hospital de Bulnes - Servicio de Salud Ñuble</p>
        <p className="mt-1">Plataforma de consulta interna para personal médico</p>
        <Link 
          to={createPageUrl('AdminLogin')}
          className="inline-block mt-4 text-xs text-slate-400 hover:text-blue-600 transition-colors"
        >
          Ingresar
        </Link>
      </div>
    </div>
  );
}