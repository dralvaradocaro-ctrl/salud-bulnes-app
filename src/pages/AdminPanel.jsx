const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  FileText, Calculator, Home, BookOpen, Plus,
  CheckCircle2, Clock, LayoutDashboard, LogOut, ChevronRight, Folder
} from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();

  const { data: topics = [] } = useQuery({
    queryKey: ['admin-panel-topics'],
    queryFn: () => db.entities.Topic.list()
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-panel-categories'],
    queryFn: () => db.entities.Category.list('order')
  });

  const published = topics.filter(t => t.status === 'published').length;
  const drafts = topics.filter(t => t.status === 'draft').length;
  const protocols = topics.filter(t => t.has_local_protocol).length;

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    navigate(createPageUrl('Home'));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Guía Médica — Admin</p>
              <p className="text-xs text-slate-400">Hospital de Bulnes</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Home className="h-3.5 w-3.5" />
                Ver sitio
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-xs text-slate-500">
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total temas', value: topics.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Publicados', value: published, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Borradores', value: drafts, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Protocolos locales', value: protocols, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Acciones rápidas</p>
          <div className="flex flex-wrap gap-2">
            <Link to={createPageUrl('AdminAddTopic')}>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Nuevo tema
              </Button>
            </Link>
            <Link to={createPageUrl('AdminDashboard')}>
              <Button size="sm" variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Gestionar temas
              </Button>
            </Link>
            <Link to={createPageUrl('ToolsManager')}>
              <Button size="sm" variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Herramientas
              </Button>
            </Link>
          </div>
        </div>

        {/* Content by category */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contenido por categoría</p>
            <Link to={createPageUrl('AdminDashboard')}>
              <span className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
          <div className="space-y-2">
            {categories.map(cat => {
              const count = topics.filter(t => t.category_id === cat.id).length;
              const pubCount = topics.filter(t => t.category_id === cat.id && t.status === 'published').length;
              return (
                <Link
                  key={cat.id}
                  to={createPageUrl('AdminDashboard')}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{pubCount}/{count} publicados</span>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full"
                        style={{ width: count > 0 ? `${(pubCount / count) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
            {categories.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Sin categorías aún</p>
            )}
          </div>
        </div>

        {/* Recent drafts */}
        {drafts > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">{drafts} temas en borrador</p>
              </div>
              <Link to={createPageUrl('AdminDashboard')}>
                <span className="text-xs text-amber-700 hover:underline">Revisar →</span>
              </Link>
            </div>
            <div className="space-y-1">
              {topics.filter(t => t.status === 'draft').slice(0, 4).map(t => (
                <Link
                  key={t.id}
                  to={createPageUrl(`AdminEditTopic?id=${t.id}`)}
                  className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 hover:underline py-0.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {t.name}
                </Link>
              ))}
              {drafts > 4 && (
                <p className="text-xs text-amber-500 ml-3">y {drafts - 4} más...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
