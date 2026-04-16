import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const mocaDomains = [
  { id: 'visuospatial', label: 'Visuoespacial/Ejecutivo', max: 5 },
  { id: 'naming', label: 'Denominación', max: 3 },
  { id: 'attention', label: 'Atención', max: 6 },
  { id: 'language', label: 'Lenguaje', max: 3 },
  { id: 'abstraction', label: 'Abstracción', max: 2 },
  { id: 'memory', label: 'Memoria Diferida', max: 5 },
  { id: 'orientation', label: 'Orientación', max: 6 }
];

export default function MOCACalculator() {
  const [scores, setScores] = useState({});
  const [lowEducation, setLowEducation] = useState(false);

  const rawTotal = Object.values(scores).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const adjustedTotal = rawTotal + (lowEducation ? 1 : 0);

  const getInterpretation = (score) => {
    if (score >= 26) return { 
      text: 'Normal', 
      color: 'text-green-700', 
      bg: 'bg-green-50' 
    };
    return { 
      text: 'Deterioro Cognitivo', 
      color: 'text-red-700', 
      bg: 'bg-red-50' 
    };
  };

  const interpretation = getInterpretation(adjustedTotal);

  return (
    <Card className="p-6 bg-violet-50 border-violet-200">
      <h4 className="font-semibold text-violet-900 mb-4">Calculadora MoCA</h4>
      
      <div className="space-y-4">
        {mocaDomains.map((domain) => (
          <div key={domain.id} className="bg-white rounded-lg p-3">
            <Label className="text-sm font-medium mb-2 block">
              {domain.label} (máx: {domain.max})
            </Label>
            <Input
              type="number"
              min="0"
              max={domain.max}
              value={scores[domain.id] || ''}
              onChange={(e) => {
                const val = Math.min(parseFloat(e.target.value) || 0, domain.max);
                setScores({ ...scores, [domain.id]: val });
              }}
              className="max-w-24"
            />
          </div>
        ))}

        <div className="bg-white rounded-lg p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={lowEducation}
              onCheckedChange={setLowEducation}
            />
            <span className="text-sm font-medium">
              Escolaridad ≤12 años (agregar 1 punto)
            </span>
          </label>
        </div>

        <div className={`p-4 rounded-xl ${interpretation.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-900">Puntaje Crudo:</span>
            <span className="text-xl font-bold text-slate-900">{rawTotal}/30</span>
          </div>
          {lowEducation && (
            <div className="flex items-center justify-between mb-2 text-sm text-slate-600">
              <span>Ajuste por escolaridad:</span>
              <span>+1</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-slate-300">
            <span className="font-semibold text-slate-900">Puntaje Ajustado:</span>
            <span className="text-2xl font-bold text-slate-900">{adjustedTotal}/30</span>
          </div>
          <div className={`mt-2 font-medium ${interpretation.color}`}>
            {interpretation.text}
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => {
            setScores({});
            setLowEducation(false);
          }}
        >
          Limpiar
        </Button>
      </div>
    </Card>
  );
}