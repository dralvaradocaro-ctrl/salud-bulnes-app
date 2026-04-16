import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, Target, Download } from 'lucide-react';

export default function ProtocolHeader({ topic }) {
  const handleDownload = () => {
    if (topic.protocol_file_url) {
      window.open(topic.protocol_file_url, '_blank');
    } else {
      alert('Archivo de protocolo no disponible');
    }
  };

  if (!topic.protocol_code && !topic.protocol_authors?.length) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 p-6 mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Protocolo Institucional</h2>
              {topic.protocol_code && (
                <p className="text-sm text-slate-600">Código: {topic.protocol_code}</p>
              )}
            </div>
          </div>
        </div>
        <Button 
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar Protocolo
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {topic.protocol_edition && (
          <div className="flex items-start gap-3 bg-white rounded-xl p-4">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Edición</p>
              <p className="text-sm font-semibold text-slate-900">{topic.protocol_edition}</p>
            </div>
          </div>
        )}
        
        {topic.protocol_date && (
          <div className="flex items-start gap-3 bg-white rounded-xl p-4">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Fecha de Elaboración</p>
              <p className="text-sm font-semibold text-slate-900">{topic.protocol_date}</p>
            </div>
          </div>
        )}

        {topic.protocol_validity && (
          <div className="flex items-start gap-3 bg-white rounded-xl p-4">
            <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Vigencia</p>
              <p className="text-sm font-semibold text-slate-900">{topic.protocol_validity}</p>
            </div>
          </div>
        )}
      </div>

      {topic.protocol_objective && (
        <div className="bg-white rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Objetivo Principal</p>
              <p className="text-sm text-slate-700 leading-relaxed">{topic.protocol_objective}</p>
            </div>
          </div>
        </div>
      )}

      {topic.protocol_authors?.length > 0 && (
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 mb-3">Autores y Responsables</p>
              <div className="space-y-2">
                {topic.protocol_authors.map((author, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                      {author.role}
                    </Badge>
                    <span className="text-sm text-slate-700">{author.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {topic.protocol_participants?.length > 0 && (
        <div className="bg-white rounded-xl p-4 mt-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 mb-3">Responsables de la Ejecución</p>
              <div className="flex flex-wrap gap-2">
                {topic.protocol_participants.map((participant, idx) => (
                  <Badge key={idx} className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {participant}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}