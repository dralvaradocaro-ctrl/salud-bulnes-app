const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, FileText, Search, Eye } from 'lucide-react';

export default function ChangeHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['all-versions'],
    queryFn: () => db.entities.TopicVersion.list('-created_date', 100)
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics-for-history'],
    queryFn: () => db.entities.Topic.list()
  });

  const filteredVersions = versions.filter(version => {
    const topic = topics.find(t => t.id === version.topic_id);
    return !searchQuery ||
      topic?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      version.change_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      version.changed_by?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getTopicName = (topicId) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || 'Tema desconocido';
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex-1 w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar en historial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Version Detail Modal */}
      {selectedVersion && (
        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Detalle de la Versión</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(null)}>
              Cerrar
            </Button>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-slate-600">Tema</Label>
              <p className="text-slate-900">{getTopicName(selectedVersion.topic_id)}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-600">Versión</Label>
              <p className="text-slate-900">v{selectedVersion.version_number}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-600">Cambios Realizados</Label>
              <p className="text-slate-900">{selectedVersion.change_description}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-600">Modificado por</Label>
              <p className="text-slate-900">{selectedVersion.changed_by}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-600">Fecha</Label>
              <p className="text-slate-900">{new Date(selectedVersion.created_date).toLocaleString('es-CL')}</p>
            </div>
          </div>
        </Card>
      )}

      {/* History List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredVersions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">No hay historial de cambios</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredVersions.map(version => (
            <Card key={version.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">
                      {getTopicName(version.topic_id)}
                    </span>
                    <Badge variant="outline">v{version.version_number}</Badge>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{version.change_description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.changed_by}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(version.created_date).toLocaleDateString('es-CL')} - {new Date(version.created_date).toLocaleTimeString('es-CL')}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVersion(version)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Label({ children, className = '' }) {
  return <label className={`block text-sm font-medium mb-1 ${className}`}>{children}</label>;
}