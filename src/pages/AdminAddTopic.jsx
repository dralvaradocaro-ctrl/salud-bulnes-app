const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import TopicEditorFull from '@/components/editor/TopicEditorFull';

export default function AdminAddTopic() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draftTopic, setDraftTopic] = useState(null);
  
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.entities.Category.list('order')
  });

  useEffect(() => {
    const createDraft = async () => {
      if (categories.length === 0) return;
      if (draftTopic) return;
      
      try {
        const draft = await db.entities.Topic.create({
          name: 'Nuevo Tema (Borrador)',
          category_id: categories[0].id,
          status: 'draft',
          layout_mode: 'auto',
          content_blocks: []
        });
        setDraftTopic(draft);
      } catch (error) {
        console.error('Error creating draft:', error);
        toast.error('Error al crear borrador');
      }
    };
    
    createDraft();
  }, [categories]);

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Topic.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Tema guardado exitosamente');
      navigate(createPageUrl('AdminDashboard'));
    },
    onError: () => {
      toast.error('Error al guardar el tema');
    }
  });

  const handleSave = (data) => {
    if (!draftTopic) {
      toast.error('Error: No se pudo crear el borrador');
      return;
    }
    updateTopicMutation.mutate({ id: draftTopic.id, data });
  };

  const handleDelete = async () => {
    if (draftTopic && confirm('¿Cancelar la creación de este tema?')) {
      await db.entities.Topic.delete(draftTopic.id);
      navigate(createPageUrl('AdminDashboard'));
    }
  };

  if (!categories.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  if (!draftTopic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Preparando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Nuevo tema</p>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Crear tema</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <TopicEditorFull
          topicData={draftTopic}
          onSave={handleSave}
          onDelete={handleDelete}
          isNew={true}
          categories={categories}
        />
      </div>
    </div>
  );
}