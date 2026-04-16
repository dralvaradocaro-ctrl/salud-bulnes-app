import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const heartItems = [
  { id: 'history', label: 'Historia (H)', options: [
    { value: 0, label: '0 - Poco sospechoso' },
    { value: 1, label: '1 - Moderadamente sospechoso' },
    { value: 2, label: '2 - Altamente sospechoso' }
  ]},
  { id: 'ecg', label: 'ECG (E)', options: [
    { value: 0, label: '0 - Normal' },
    { value: 1, label: '1 - Alteraciones no específicas' },
    { value: 2, label: '2 - Desviación ST significativa' }
  ]},
  { id: 'age', label: 'Edad (A)', options: [
    { value: 0, label: '0 - <45 años' },
    { value: 1, label: '1 - 45-64 años' },
    { value: 2, label: '2 - ≥65 años' }
  ]},
  { id: 'risk', label: 'Factores de Riesgo (R)', options: [
    { value: 0, label: '0 - Ninguno' },
    { value: 1, label: '1 - 1-2 factores' },
    { value: 2, label: '2 - ≥3 o enfermedad aterosclerótica' }
  ]},
  { id: 'troponin', label: 'Troponina (T)', options: [
    { value: 0, label: '0 - Normal' },
    { value: 1, label: '1 - 1-3x límite superior' },
    { value: 2, label: '2 - >3x límite superior' }
  ]}
];

export default function HEARTScoreCalculator() {
  const [scores, setScores] = useState({});

  const total = Object.values(scores).reduce((sum, val) => sum + val, 0);

  const getInterpretation = (score) => {
    if (score <= 3) return { 
      text: 'Bajo riesgo - Alta segura', 
      color: 'text-green-700', 
      bg: 'bg-green-50',
      detail: 'Riesgo de eventos adversos <2%'
    };
    if (score <= 6) return { 
      text: 'Riesgo intermedio - Observación', 
      color: 'text-yellow-700', 
      bg: 'bg-yellow-50',
      detail: 'Considerar observación y prueba de esfuerzo'
    };
    return { 
      text: 'Alto riesgo - Ingreso/Intervención', 
      color: 'text-red-700', 
      bg: 'bg-red-50',
      detail: 'Ingreso hospitalario e intervención precoz'
    };
  };

  const interpretation = getInterpretation(total);

  return (
    <Card className="p-6 bg-rose-50 border-rose-200">
      <h4 className="font-semibold text-rose-900 mb-4 flex items-center justify-between">
        <span>Calculadora HEART Score</span>
        <Button variant="outline" size="sm" onClick={() => setScores({})}>
          Limpiar
        </Button>
      </h4>
      
      <div className="space-y-4">
        {heartItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg p-3">
            <Label className="text-sm font-medium mb-2 block">{item.label}</Label>
            <div className="space-y-1">
              {item.options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                >
                  <input
                    type="radio"
                    name={item.id}
                    value={option.value}
                    checked={scores[item.id] === option.value}
                    onChange={() => setScores({ ...scores, [item.id]: option.value })}
                    className="text-rose-600"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-4 p-4 rounded-xl ${interpretation.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-900">Puntaje Total:</span>
          <span className="text-2xl font-bold text-slate-900">{total}</span>
        </div>
        <div className={`font-medium ${interpretation.color}`}>
          {interpretation.text}
        </div>
        <p className="text-sm text-slate-600 mt-1">{interpretation.detail}</p>
      </div>
    </Card>
  );
}