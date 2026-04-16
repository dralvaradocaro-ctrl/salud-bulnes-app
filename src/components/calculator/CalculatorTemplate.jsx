import React, { useState } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

/**
 * Template genérico para crear calculadoras rápidamente
 * 
 * Ejemplo de uso:
 * 
 * const myCalculator = {
 *   title: "IMC Calculator",
 *   description: "Calcula índice de masa corporal",
 *   inputs: [
 *     { id: 'weight', label: 'Peso', type: 'number', unit: 'kg', required: true, min: 0, max: 300 },
 *     { id: 'height', label: 'Altura', type: 'number', unit: 'cm', required: true, min: 0, max: 250 }
 *   ],
 *   calculate: (inputs) => {
 *     const bmi = inputs.weight / Math.pow(inputs.height / 100, 2);
 *     return {
 *       score: bmi.toFixed(2),
 *       label: 'IMC',
 *       interpretation: bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Normal' : 'Sobrepeso',
 *       recommendations: ['Consultar con nutricionista']
 *     };
 *   }
 * };
 */

export default function CalculatorTemplate({ config }) {
  const [inputValues, setInputValues] = useState(() => {
    const initial = {};
    config.inputs.forEach(input => {
      initial[input.id] = input.default || '';
    });
    return initial;
  });
  
  const [result, setResult] = useState(null);

  const handleInputChange = (id, value) => {
    setInputValues(prev => ({ ...prev, [id]: value }));
  };

  const handleCalculate = () => {
    // Validate required fields
    const missingFields = config.inputs
      .filter(input => input.required && !inputValues[input.id])
      .map(input => input.label);
    
    if (missingFields.length > 0) {
      alert(`Campos requeridos: ${missingFields.join(', ')}`);
      return null;
    }

    const calcResult = config.calculate(inputValues);
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    const initial = {};
    config.inputs.forEach(input => {
      initial[input.id] = input.default || '';
    });
    setInputValues(initial);
    setResult(null);
  };

  const renderInput = (input) => {
    switch (input.type) {
      case 'number':
        return (
          <div key={input.id}>
            <Label className="text-sm mb-2 block">
              {input.label} {input.unit && <span className="text-slate-500">({input.unit})</span>}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={inputValues[input.id]}
              onChange={(e) => handleInputChange(input.id, parseFloat(e.target.value))}
              placeholder={input.placeholder || ''}
              min={input.min}
              max={input.max}
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={input.id}>
            <Label className="text-sm mb-2 block">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select 
              value={inputValues[input.id]} 
              onValueChange={(val) => handleInputChange(input.id, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={input.placeholder || 'Seleccionar'} />
              </SelectTrigger>
              <SelectContent>
                {input.options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'text':
        return (
          <div key={input.id}>
            <Label className="text-sm mb-2 block">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="text"
              value={inputValues[input.id]}
              onChange={(e) => handleInputChange(input.id, e.target.value)}
              placeholder={input.placeholder || ''}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <CalculatorWrapper
      title={config.title}
      description={config.description}
      icon={config.icon}
      gradientFrom={config.gradientFrom || 'blue'}
      gradientTo={config.gradientTo || 'purple'}
      inputs={inputValues}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={config.showPatientInfo !== false}
    >
      <div className="space-y-4 mb-6">
        {config.inputs.map(renderInput)}
      </div>

      {result && (
        <div className={`mt-6 p-5 rounded-xl border-2 ${
          result.color || 'bg-blue-50 border-blue-200'
        }`}>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-slate-900">{result.score}</div>
            {result.label && <p className="text-sm text-slate-600 mt-2">{result.label}</p>}
          </div>
          
          {result.interpretation && (
            <div className="mb-4">
              <h4 className="font-bold text-slate-900 mb-2">Interpretación:</h4>
              <p className="text-sm text-slate-700">{result.interpretation}</p>
            </div>
          )}
          
          {result.recommendations?.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Recomendaciones:</h4>
              <div className="space-y-1">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span>•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </CalculatorWrapper>
  );
}