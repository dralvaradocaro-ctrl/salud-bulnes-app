const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Plus, Copy, Edit, Trash2, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function ToolsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['clinical-tools'],
    queryFn: () => db.entities.ClinicalTool.list()
  });

  const deleteToolMutation = useMutation({
    mutationFn: (id) => db.entities.ClinicalTool.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-tools'] });
      toast.success('Herramienta eliminada');
    }
  });

  const cloneToolMutation = useMutation({
    mutationFn: async (tool) => {
      const cloned = { ...tool };
      delete cloned.id;
      delete cloned.created_date;
      delete cloned.updated_date;
      cloned.name = `${tool.name} (Copia)`;
      cloned.status = 'draft';
      return db.entities.ClinicalTool.create(cloned);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-tools'] });
      toast.success('Herramienta clonada');
    }
  });

  const filteredTools = tools.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedBySpecialty = filteredTools.reduce((acc, tool) => {
    const specialty = tool.specialty || 'Otro';
    if (!acc[specialty]) acc[specialty] = [];
    acc[specialty].push(tool);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Gestión de Herramientas</h1>
                <p className="text-sm text-slate-500">Calculadoras y herramientas clínicas</p>
              </div>
            </div>
            <Link to={createPageUrl('CreateTool')}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Herramienta
              </Button>
            </Link>
          </div>
          
          <div className="mt-4">
            <Input
              placeholder="Buscar herramienta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedBySpecialty).map(([specialty, specTools]) => (
              <div key={specialty}>
                <h2 className="text-lg font-bold text-slate-900 mb-4">{specialty}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {specTools.map((tool) => (
                    <Card key={tool.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-slate-900">{tool.name}</h3>
                            {tool.status === 'draft' && (
                              <span className="text-xs text-amber-600">Borrador</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {tool.description}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cloneToolMutation.mutate(tool)}
                          disabled={cloneToolMutation.isPending}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Link to={createPageUrl(`EditTool?id=${tool.id}`)} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('¿Eliminar esta herramienta?')) {
                              deleteToolMutation.mutate(tool.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
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