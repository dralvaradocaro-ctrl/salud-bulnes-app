import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const nihssItems = [
  { id: 'loc', label: '1a. Nivel de Conciencia', options: [
    { value: 0, label: '0 - Alerta' },
    { value: 1, label: '1 - Somnoliento' },
    { value: 2, label: '2 - Estuporoso' },
    { value: 3, label: '3 - Coma' }
  ]},
  { id: 'loc_questions', label: '1b. Preguntas LOC', options: [
    { value: 0, label: '0 - Ambas correctas' },
    { value: 1, label: '1 - Una correcta' },
    { value: 2, label: '2 - Ninguna correcta' }
  ]},
  { id: 'loc_commands', label: '1c. Comandos LOC', options: [
    { value: 0, label: '0 - Obedece ambos' },
    { value: 1, label: '1 - Obedece uno' },
    { value: 2, label: '2 - No obedece' }
  ]},
  { id: 'gaze', label: '2. Mirada', options: [
    { value: 0, label: '0 - Normal' },
    { value: 1, label: '1 - Parálisis parcial' },
    { value: 2, label: '2 - Desviación forzada' }
  ]},
  { id: 'visual', label: '3. Campos Visuales', options: [
    { value: 0, label: '0 - Sin pérdida visual' },
    { value: 1, label: '1 - Hemianopsia parcial' },
    { value: 2, label: '2 - Hemianopsia completa' },
    { value: 3, label: '3 - Hemianopsia bilateral' }
  ]},
  { id: 'facial', label: '4. Parálisis Facial', options: [
    { value: 0, label: '0 - Normal' },
    { value: 1, label: '1 - Paresia menor' },
    { value: 2, label: '2 - Paresia parcial' },
    { value: 3, label: '3 - Parálisis completa' }
  ]},
  { id: 'motor_arm_left', label: '5a. Motor Brazo Izquierdo', options: [
    { value: 0, label: '0 - Sin caída' },
    { value: 1, label: '1 - Cae antes de 10 seg' },
    { value: 2, label: '2 - Esfuerzo contra gravedad' },
    { value: 3, label: '3 - Sin esfuerzo' },
    { value: 4, label: '4 - Sin movimiento' }
  ]},
  { id: 'motor_arm_right', label: '5b. Motor Brazo Derecho', options: [
    { value: 0, label: '0 - Sin caída' },
    { value: 1, label: '1 - Cae antes de 10 seg' },
    { value: 2, label: '2 - Esfuerzo contra gravedad' },
    { value: 3, label: '3 - Sin esfuerzo' },
    { value: 4, label: '4 - Sin movimiento' }
  ]},
  { id: 'motor_leg_left', label: '6a. Motor Pierna Izquierda', options: [
    { value: 0, label: '0 - Sin caída' },
    { value: 1, label: '1 - Cae antes de 5 seg' },
    { value: 2, label: '2 - Esfuerzo contra gravedad' },
    { value: 3, label: '3 - Sin esfuerzo' },
    { value: 4, label: '4 - Sin movimiento' }
  ]},
  { id: 'motor_leg_right', label: '6b. Motor Pierna Derecha', options: [
    { value: 0, label: '0 - Sin caída' },
    { value: 1, label: '1 - Cae antes de 5 seg' },
    { value: 2, label: '2 - Esfuerzo contra gravedad' },
    { value: 3, label: '3 - Sin esfuerzo' },
    { value: 4, label: '4 - Sin movimiento' }
  ]},
  { id: 'ataxia', label: '7. Ataxia', options: [
    { value: 0, label: '0 - Ausente' },
    { value: 1, label: '1 - Presente en 1 extremidad' },
    { value: 2, label: '2 - Presente en 2 extremidades' }
  ]},
  { id: 'sensory', label: '8. Sensibilidad', options: [
    { value: 0, label: '0 - Normal' },
    { value: 1, label: '1 - Pérdida leve/moderada' },
    { value: 2, label: '2 - Pérdida severa/completa' }
  ]},
  { id: 'language', label: '9. Lenguaje', options: [
    { value: 0, label: '0 - Sin afasia' },
    { value: 1, label: '1 - Afasia leve/moderada' },
    { value: 2, label: '2 - Afasia severa' },
    { value: 3, label: '3 - Mudo/afasia global' }
  ]},
  { id: 'dysarthria', label: '10. Disartria', options: [
    { value: 0, label: '0 - Normal' },
    { value: 1, label: '1 - Leve/moderada' },
    { value: 2, label: '2 - Severa' }
  ]},
  { id: 'extinction', label: '11. Extinción/Inatención', options: [
    { value: 0, label: '0 - Sin negligencia' },
    { value: 1, label: '1 - Inatención parcial' },
    { value: 2, label: '2 - Negligencia completa' }
  ]}
];

export default function NIHSSCalculator() {
  const [scores, setScores] = useState({});

  const total = Object.values(scores).reduce((sum, val) => sum + val, 0);

  const getInterpretation = (score) => {
    if (score === 0) return { text: 'Sin déficit', color: 'text-green-700', bg: 'bg-green-50' };
    if (score <= 4) return { text: 'ACV menor', color: 'text-blue-700', bg: 'bg-blue-50' };
    if (score <= 15) return { text: 'ACV moderado', color: 'text-yellow-700', bg: 'bg-yellow-50' };
    if (score <= 20) return { text: 'ACV moderado-severo', color: 'text-orange-700', bg: 'bg-orange-50' };
    return { text: 'ACV severo', color: 'text-red-700', bg: 'bg-red-50' };
  };

  const interpretation = getInterpretation(total);

  const handleReset = () => {
    setScores({});
  };

  return (
    <Card className="p-6 bg-violet-50 border-violet-200">
      <h4 className="font-semibold text-violet-900 mb-4 flex items-center justify-between">
        <span>Calculadora NIHSS</span>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Limpiar
        </Button>
      </h4>
      
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {nihssItems.map((item) => (
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
                    className="text-violet-600"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-4 p-4 rounded-xl ${interpretation.bg}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Puntaje Total:</span>
          <span className="text-2xl font-bold text-slate-900">{total}</span>
        </div>
        <div className={`mt-2 font-medium ${interpretation.color}`}>
          {interpretation.text}
        </div>
      </div>
    </Card>
  );
}