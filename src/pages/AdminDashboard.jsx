const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, FileText, LogOut, Folder, Settings, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    if (!isLoggedIn) {
      navigate(createPageUrl('AdminLogin'));
    }
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => db.entities.Category.list('order')
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: () => db.entities.Topic.list()
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    navigate(createPageUrl('Home'));
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || topic.category_id === selectedCategory;
    const matchesStatus = statusFilter === 'all' || topic.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const groupedTopics = categories.map(cat => ({
    ...cat,
    topics: filteredTopics.filter(t => t.category_id === cat.id)
  })).filter(cat => cat.topics.length > 0);

  const publishedCount = topics.filter(t => t.status === 'published').length;
  const draftCount = topics.filter(t => t.status === 'draft').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">Guía Médica — Admin</h1>
                <p className="text-xs text-slate-400">{topics.length} temas · {publishedCount} publicados · {draftCount} borradores</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl('AdminAddTopic')}>
                <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Nuevo tema
                </Button>
              </Link>
              <Link to={createPageUrl('AdminPanel')}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Settings className="h-3.5 w-3.5" />
                  Ajustes
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-xs text-slate-500">
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar temas..."
                className="pl-9 h-8 text-sm"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { value: 'all', label: `Todos (${topics.length})` },
                { value: 'published', label: `✓ ${publishedCount}` },
                { value: 'draft', label: `⏳ ${draftCount}` },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    statusFilter === value
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {groupedTopics.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No se encontraron temas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTopics.map(category => (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Folder className="h-4 w-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{category.name}</h2>
                  <span className="text-xs text-slate-400">({category.topics.length})</span>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.topics.map(topic => (
                    <Link
                      key={topic.id}
                      to={createPageUrl(`AdminEditTopic?id=${topic.id}`)}
                      className="group bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm mb-1">
                            {topic.name}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {topic.status === 'draft' && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Borrador</span>
                            )}
                            {topic.has_local_protocol && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Protocolo</span>
                            )}
                            {topic.clasificacion_ges === 'GES' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">GES</span>
                            )}
                          </div>
                        </div>
                        <Edit className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2 mt-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}