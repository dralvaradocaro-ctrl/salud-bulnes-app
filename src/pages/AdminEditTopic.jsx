const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Eye } from 'lucide-react';
import { toast } from 'sonner';
import TopicEditorFull from '@/components/editor/TopicEditorFull';

export default function AdminEditTopic() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const topicId = urlParams.get('id');

  const { data: topic, isLoading } = useQuery({
    queryKey: ['admin-topic', topicId],
    queryFn: async () => {
      const topics = await db.entities.Topic.filter({ id: topicId });
      return topics[0];
    },
    enabled: !!topicId
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.entities.Category.list('order')
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await db.entities.Topic.update(topicId, { ...data, last_updated: new Date().toISOString() });
      
      const versions = await db.entities.TopicVersion.filter({ topic_id: topicId }, '-version_number');
      const versionNumber = (versions.length > 0 ? versions[0].version_number : 0) + 1;
      await db.entities.TopicVersion.create({
        topic_id: topicId,
        version_number: versionNumber,
        changed_by: 'admin',
        change_description: `v${versionNumber} — ${new Date().toLocaleString('es-CL')}`,
        content_snapshot: data
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-topic', topicId] });
      toast.success('Tema guardado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al guardar');
    }
  });

  const handleSave = (data) => {
    updateMutation.mutate(data);
  };

  const handleDelete = async () => {
    if (confirm('¿Eliminar este tema?')) {
      await db.entities.Topic.delete(topicId);
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      toast.success('Tema eliminado');
      navigate(createPageUrl('AdminDashboard'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Tema no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Editar tema</p>
                <h1 className="text-base font-bold text-slate-900 leading-tight">{topic.name}</h1>
              </div>
            </div>
            <a href={createPageUrl(`TopicDetail?id=${topicId}`)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Eye className="h-3.5 w-3.5" />
                Ver publicado
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <TopicEditorFull
          topicData={topic}
          onSave={handleSave}
          onDelete={handleDelete}
          isNew={false}
          categories={categories}
        />
      </div>
    </div>
  );
}