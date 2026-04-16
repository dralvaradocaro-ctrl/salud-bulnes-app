import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PatientData } from '@/types/protocol';
import { calcularVFG } from '@/utils/insulina/vfgCalculator';

interface MetabolicStepProps {
  data: PatientData;
  peso: number;
  edad: number;
  sexo: 'masculino' | 'femenino' | '';
  onUpdate: (field: keyof PatientData, value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MetabolicStep({ data, peso, edad, sexo, onUpdate, onNext, onBack }: MetabolicStepProps) {
  const [nphTotal, setNphTotal] = useState<number>(0);

  // Calcular U/kg automáticamente cuando cambia la dosis total de NPH
  useEffect(() => {
    if (nphTotal > 0 && peso > 0) {
      const uKg = parseFloat((nphTotal / peso).toFixed(2));
      onUpdate('usoPrevioNPH', uKg);
    } else if (nphTotal === 0) {
      onUpdate('usoPrevioNPH', 0);
    }
  }, [nphTotal, peso]);

  // Calcular VFG automáticamente cuando cambia la creatinina
  useEffect(() => {
    if (data.creatinina > 0 && edad > 0 && sexo) {
      const vfgCalculada = calcularVFG(data.creatinina, edad, sexo);
      onUpdate('vfg', vfgCalculada);
    }
  }, [data.creatinina, edad, sexo]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Datos Metabólicos</h2>
        <p className="text-muted-foreground">Ingrese los valores de laboratorio del paciente</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="glicemia">Glicemia de ingreso (mg/dL)</Label>
          <Input
            id="glicemia"
            type="number"
            value={data.glicemiaIngreso || ''}
            onChange={(e) => onUpdate('glicemiaIngreso', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 220"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hba1c">HbA1c (%)</Label>
          <Input
            id="hba1c"
            type="number"
            value={data.hba1c || ''}
            onChange={(e) => onUpdate('hba1c', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 7.5"
            min="0"
            max="20"
            step="0.1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trigliceridos">Triglicéridos (mg/dL)</Label>
          <Input
            id="trigliceridos"
            type="number"
            value={data.trigliceridos || ''}
            onChange={(e) => onUpdate('trigliceridos', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 180"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="creatinina">Creatinina sérica (mg/dL)</Label>
          <Input
            id="creatinina"
            type="number"
            value={data.creatinina || ''}
            onChange={(e) => onUpdate('creatinina', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 1.2"
            min="0"
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">
            La VFG se calculará automáticamente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vfg">VFG - Velocidad de Filtración Glomerular (ml/min/1.73 m²)</Label>
          <Input
            id="vfg"
            type="number"
            value={data.vfg || ''}
            onChange={(e) => onUpdate('vfg', parseFloat(e.target.value) || 0)}
            placeholder="Calculado automáticamente o ingrese valor conocido"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-muted-foreground">
            Se calcula automáticamente con la creatinina, o puede ingresar el valor si lo conoce.
            {data.vfg > 0 && (
              <span className="font-medium block mt-1">
                {data.vfg >= 90 && '✓ Normal (≥90)'}
                {data.vfg >= 60 && data.vfg < 90 && '⚠️ ERC Etapa 2 (60-89)'}
                {data.vfg >= 30 && data.vfg < 60 && '⚠️ ERC Etapa 3 (30-59) - Intermedio'}
                {data.vfg < 30 && '🔴 ERC Etapa 4-5 (<30) - Sensible'}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nphTotal">Dosis total de Insulina NPH previa (Unidades)</Label>
          <Input
            id="nphTotal"
            type="number"
            value={nphTotal || ''}
            onChange={(e) => setNphTotal(parseFloat(e.target.value) || 0)}
            placeholder="Ej: 24"
            min="0"
            step="1"
          />
          <p className="text-xs text-muted-foreground">
            Si no usa insulina, deje en 0. Las U/kg se calcularán automáticamente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nph">Uso previo de Insulina NPH (U/kg)</Label>
          <Input
            id="nph"
            type="number"
            value={data.usoPrevioNPH || ''}
            onChange={(e) => onUpdate('usoPrevioNPH', parseFloat(e.target.value) || 0)}
            placeholder="Calculado automáticamente"
            min="0"
            step="0.01"
            className="bg-muted"
            readOnly
          />
          <p className="text-xs text-muted-foreground">
            {data.usoPrevioNPH > 0 && (
              <span className="font-medium">
                {data.usoPrevioNPH > 0.5 ? '⚠️ Dosis alta (> 0.5 U/kg)' : '✓ Dosis estándar'}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="outline" size="lg">
          Anterior
        </Button>
        <Button onClick={onNext} size="lg">
          Ver Resultado
        </Button>
      </div>
    </div>
  );
}
