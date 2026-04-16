const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function TopicsManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.entities.Category.list('order')
  });

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: () => db.entities.Topic.list('-updated_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Topic.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      toast.success('Tema eliminado');
    }
  });

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = !searchQuery || 
      topic.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || topic.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedByCategory = filteredTopics.reduce((acc, topic) => {
    const cat = categories.find(c => c.id === topic.category_id);
    const catName = cat?.name || 'Sin categoría';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(topic);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar temas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <Button onClick={() => navigate(createPageUrl('AdminAddTopic'))}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tema
          </Button>
        </div>
      </div>

      {/* Topics List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredTopics.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">No se encontraron temas</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([categoryName, categoryTopics]) => (
            <div key={categoryName}>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                {categoryName}
                <Badge variant="outline">{categoryTopics.length}</Badge>
              </h3>
              <div className="grid gap-3">
                {categoryTopics.map(topic => (
                  <Card key={topic.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 mb-1">{topic.name}</h4>
                        {topic.description && (
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{topic.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {topic.has_local_protocol && (
                            <Badge className="bg-green-100 text-green-700">Protocolo local</Badge>
                          )}
                          {topic.subcategory && (
                            <Badge variant="outline">{topic.subcategory}</Badge>
                          )}
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(topic.updated_date).toLocaleDateString('es-CL')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(createPageUrl(`TopicDetail?id=${topic.id}`))}
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(createPageUrl(`AdminEditTopic?id=${topic.id}`))}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`¿Eliminar "${topic.name}"?`)) {
                              deleteMutation.mutate(topic.id);
                            }
                          }}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}