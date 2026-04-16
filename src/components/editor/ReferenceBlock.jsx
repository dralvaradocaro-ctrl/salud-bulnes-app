const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, Calculator } from 'lucide-react';

const CALCULATORS = [
  { id: 'nrs2002', name: 'NRS-2002 - Riesgo Nutricional' },
  { id: 'sri', name: 'SRI - Intubación Rápida' },
  { id: 'heart', name: 'HEART Score' },
  { id: 'nihss', name: 'NIHSS - Escala ACV' },
  { id: 'moca', name: 'MoCA - Cognición' },
  { id: 'insulin', name: 'Corrección de Insulina' }
];

export default function ReferenceBlock({ block, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: topics = [] } = useQuery({
    queryKey: ['topics-for-reference'],
    queryFn: () => db.entities.Topic.list()
  });

  const filteredTopics = topics.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
      <div>
        <Label className="text-xs mb-2 block">Tipo de Referencia</Label>
        <Select 
          value={block.reference_type || ''} 
          onValueChange={(val) => {
            onUpdate('reference_type', val);
            onUpdate('reference_id', '');
            onUpdate('reference_label', '');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="topic">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                <span>Otro Topic / Protocolo</span>
              </div>
            </SelectItem>
            <SelectItem value="calculator">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Calculadora / Herramienta</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {block.reference_type === 'topic' && (
        <div>
          <Label className="text-xs mb-2 block">Buscar Topic</Label>
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredTopics.slice(0, 10).map(topic => (
              <button
                key={topic.id}
                onClick={() => {
                  onUpdate('reference_id', topic.id);
                  onUpdate('reference_label', topic.name);
                  setSearchTerm('');
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 ${
                  block.reference_id === topic.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                {topic.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {block.reference_type === 'calculator' && (
        <div>
          <Label className="text-xs mb-2 block">Seleccionar Calculadora</Label>
          <div className="space-y-1">
            {CALCULATORS.map(calc => (
              <button
                key={calc.id}
                onClick={() => {
                  onUpdate('reference_id', calc.id);
                  onUpdate('reference_label', calc.name);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 ${
                  block.reference_id === calc.id ? 'bg-purple-50 border border-purple-200' : ''
                }`}
              >
                <Calculator className="h-3 w-3 inline mr-2" />
                {calc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {block.reference_label && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 font-semibold mb-1">Referencia Seleccionada:</p>
          <p className="text-sm text-green-900">{block.reference_label}</p>
        </div>
      )}

      <div>
        <Label className="text-xs mb-2 block">Texto del Enlace (opcional)</Label>
        <Input
          placeholder="Ej: Ver protocolo completo"
          value={block.reference_label || ''}
          onChange={(e) => onUpdate('reference_label', e.target.value)}
        />
      </div>
    </div>
  );
}