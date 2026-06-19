const db = globalThis.__B44_DB__ || { entities:new Proxy({}, { get:()=>({ list:async()=>[], create:async()=>({}), update:async()=>({}) }) }) };

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle2, Clock, Home, Plus, Save } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const AREA_OPTIONS = [
  { value: 'administracion', label: 'Administración' },
  { value: 'policlinico', label: 'Policlínico' },
  { value: 'hospitalizados', label: 'Hospitalizados' },
  { value: 'urgencias', label: 'Urgencias' },
  { value: 'transversal', label: 'Transversal' },
  { value: 'general', label: 'General' },
];

const TYPE_OPTIONS = [
  { value: 'actualizacion', label: 'Actualización' },
  { value: 'protocolo', label: 'Protocolo' },
  { value: 'aviso', label: 'Aviso' },
  { value: 'operativo', label: 'Operativo' },
];

const EMPTY_FORM = {
  title: '',
  summary: '',
  details: '',
  area: 'general',
  type: 'actualizacion',
  status: 'published',
  published_at: new Date().toISOString().slice(0, 10),
  link_url: '',
  expires_at: '',
};

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function AdminNewsUpdates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['admin-news-updates'],
    queryFn: () => db.entities.NewsUpdate.list('-published_at'),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        published_at: form.published_at ? new Date(`${form.published_at}T09:00:00`).toISOString() : new Date().toISOString(),
        expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null,
        link_url: form.link_url || null,
      };
      if (editingId) return db.entities.NewsUpdate.update(editingId, payload);
      return db.entities.NewsUpdate.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news-updates'] });
      queryClient.invalidateQueries({ queryKey: ['floating-news'] });
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const publishedCount = useMemo(() => news.filter((item) => item.status === 'published').length, [news]);

  const handleChange = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      summary: item.summary || '',
      details: item.details || '',
      area: item.area || 'general',
      type: item.type || 'actualizacion',
      status: item.status || 'published',
      published_at: toDateInput(item.published_at || item.created_at),
      link_url: item.link_url || '',
      expires_at: toDateInput(item.expires_at),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(createPageUrl('AdminPanel'))}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900">Novedades</h1>
              <p className="text-xs text-slate-400">{news.length} registradas · {publishedCount} publicadas</p>
            </div>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Home className="h-3.5 w-3.5" />
              Ver sitio
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">{editingId ? 'Editar novedad' : 'Nueva novedad'}</p>
              <p className="text-xs text-slate-400">Aparece en “Recientes” por 10 días y queda en historial.</p>
            </div>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
                className="h-8 text-xs"
              >
                Limpiar
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Título</label>
            <Input value={form.title} onChange={(event) => handleChange('title', event.target.value)} placeholder="Ej: Cambio transitorio en toma de muestras" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Resumen comprimido</label>
            <Textarea value={form.summary} onChange={(event) => handleChange('summary', event.target.value)} rows={2} placeholder="Versión corta que se ve antes de desplegar." />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Más información</label>
            <Textarea value={form.details} onChange={(event) => handleChange('details', event.target.value)} rows={5} placeholder="Detalle, contexto, vigencia o pasos a seguir." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Área</label>
              <select value={form.area} onChange={(event) => handleChange('area', event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                {AREA_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Tipo</label>
              <select value={form.type} onChange={(event) => handleChange('type', event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Publicación</label>
              <Input type="date" value={form.published_at} onChange={(event) => handleChange('published_at', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Expira</label>
              <Input type="date" value={form.expires_at} onChange={(event) => handleChange('expires_at', event.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Enlace opcional</label>
            <Input value={form.link_url} onChange={(event) => handleChange('link_url', event.target.value)} placeholder="/TopicDetail?id=..." />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <select value={form.status} onChange={(event) => handleChange('status', event.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs">
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
            <Button type="submit" disabled={!form.title.trim() || mutation.isPending} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {mutation.isPending ? 'Guardando...' : editingId ? 'Guardar' : 'Publicar'}
            </Button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Historial</p>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : news.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Sin novedades todavía</p>
              <p className="mt-1 text-xs text-slate-500">Cuando publiques una, quedará acá para revisión posterior.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {news.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleEdit(item)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-800">{item.title}</p>
                    <Badge variant="outline" className="shrink-0 text-[10px] uppercase text-slate-500">{item.status}</Badge>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{item.summary || item.details || 'Sin resumen'}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{AREA_OPTIONS.find((area) => area.value === item.area)?.label || 'General'}</span>
                    <span>·</span>
                    <span>{formatDate(item.published_at || item.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
