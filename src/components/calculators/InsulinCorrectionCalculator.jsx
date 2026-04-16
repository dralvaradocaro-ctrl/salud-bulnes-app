import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function InsulinCorrectionCalculator() {
  const [dailyDose, setDailyDose] = useState('');
  const [currentGlycemia, setCurrentGlycemia] = useState('');
  const [targetGlycemia, setTargetGlycemia] = useState('140');

  const sensitivityFactor = dailyDose ? Math.round(1800 / parseFloat(dailyDose)) : 0;
  
  const correctionDose = (dailyDose && currentGlycemia && targetGlycemia) 
    ? Math.round((parseFloat(currentGlycemia) - parseFloat(targetGlycemia)) / sensitivityFactor)
    : 0;

  return (
    <Card className="p-6 bg-amber-50 border-amber-200">
      <h4 className="font-semibold text-amber-900 mb-4">Calculadora de Corrección Insulínica</h4>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="dailyDose" className="text-sm font-medium mb-2 block">
            Dosis Total Diaria de Insulina (unidades)
          </Label>
          <Input
            id="dailyDose"
            type="number"
            value={dailyDose}
            onChange={(e) => setDailyDose(e.target.value)}
            placeholder="ej: 60"
            className="bg-white"
          />
        </div>

        {dailyDose && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm font-medium text-slate-700">Factor de Sensibilidad</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {sensitivityFactor} mg/dL
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Cada unidad de insulina baja {sensitivityFactor} mg/dL
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="currentGlycemia" className="text-sm font-medium mb-2 block">
            Glicemia Actual (mg/dL)
          </Label>
          <Input
            id="currentGlycemia"
            type="number"
            value={currentGlycemia}
            onChange={(e) => setCurrentGlycemia(e.target.value)}
            placeholder="ej: 250"
            className="bg-white"
          />
        </div>

        <div>
          <Label htmlFor="targetGlycemia" className="text-sm font-medium mb-2 block">
            Meta Glicémica (mg/dL)
          </Label>
          <Input
            id="targetGlycemia"
            type="number"
            value={targetGlycemia}
            onChange={(e) => setTargetGlycemia(e.target.value)}
            placeholder="ej: 140"
            className="bg-white"
          />
          <p className="text-xs text-slate-500 mt-1">
            Recomendado hospitalizado: 140-180 mg/dL
          </p>
        </div>

        {dailyDose && currentGlycemia && targetGlycemia && correctionDose > 0 && (
          <div className="bg-amber-100 rounded-xl p-4 border-2 border-amber-300">
            <p className="text-sm font-medium text-amber-900 mb-2">Dosis de Corrección:</p>
            <p className="text-3xl font-bold text-amber-900">
              {correctionDose} unidades
            </p>
            <p className="text-xs text-amber-700 mt-2">
              ({currentGlycemia} - {targetGlycemia}) / {sensitivityFactor} = {correctionDose}U
            </p>
          </div>
        )}

        <a
          href="https://hola-verse-greeting.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
            <ExternalLink className="h-4 w-4 mr-2" />
            Protocolo Correccional Completo
          </Button>
        </a>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => {
            setDailyDose('');
            setCurrentGlycemia('');
            setTargetGlycemia('140');
          }}
        >
          Limpiar
        </Button>
      </div>
    </Card>
  );
}