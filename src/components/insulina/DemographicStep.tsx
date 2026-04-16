import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PatientData } from '@/types/protocol';
import { cn } from '@/lib/utils';

interface DemographicStepProps {
  data: PatientData;
  onUpdate: (field: keyof PatientData, value: number | string) => void;
  onNext: () => void;
}

export function DemographicStep({ data, onUpdate, onNext }: DemographicStepProps) {
  const [altura, setAltura] = useState<number>(0);

  // Calcular IMC automáticamente cuando cambia peso o altura
  useEffect(() => {
    if (data.peso > 0 && altura > 0) {
      const imcCalculado = parseFloat((data.peso / (altura * altura)).toFixed(1));
      onUpdate('imc', imcCalculado);
    }
  }, [data.peso, altura]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Datos Demográficos</h2>
        <p className="text-muted-foreground">Ingrese los datos básicos del paciente</p>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">💡 Nota importante:</span> Complete los campos con la información que dispone. 
          Si no cuenta con datos exactos de peso o talla, realice una estimación para entregar un resultado 
          aproximado al estado del paciente.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edad">Edad (años)</Label>
          <Input
            id="edad"
            type="number"
            value={data.edad || ''}
            onChange={(e) => onUpdate('edad', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 65"
            min="0"
            max="120"
          />
        </div>

        <div className="space-y-2">
          <Label>Sexo</Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={data.sexo === 'masculino' ? 'default' : 'outline'}
              className={cn(
                'flex-1',
                data.sexo === 'masculino' && 'bg-primary hover:bg-primary/90'
              )}
              onClick={() => onUpdate('sexo', 'masculino')}
            >
              Masculino
            </Button>
            <Button
              type="button"
              variant={data.sexo === 'femenino' ? 'default' : 'outline'}
              className={cn(
                'flex-1',
                data.sexo === 'femenino' && 'bg-primary hover:bg-primary/90'
              )}
              onClick={() => onUpdate('sexo', 'femenino')}
            >
              Femenino
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="peso">Peso (kg)</Label>
          <Input
            id="peso"
            type="number"
            value={data.peso || ''}
            onChange={(e) => onUpdate('peso', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 70"
            min="0"
            step="0.1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="altura">Talla (metros)</Label>
          <Input
            id="altura"
            type="number"
            value={altura || ''}
            onChange={(e) => setAltura(parseFloat(e.target.value) || 0)}
            placeholder="Ej: 1.70"
            min="0"
            max="3"
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">
            El IMC se calculará automáticamente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imc">IMC (Índice de Masa Corporal)</Label>
          <Input
            id="imc"
            type="number"
            value={data.imc || ''}
            onChange={(e) => onUpdate('imc', parseFloat(e.target.value) || 0)}
            placeholder="Calculado automáticamente"
            min="0"
            step="0.1"
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            {data.imc > 0 && (
              <span className="font-medium">
                {data.imc < 18.5 && '⚠️ Bajo peso'}
                {data.imc >= 18.5 && data.imc < 25 && '✓ Normal'}
                {data.imc >= 25 && data.imc < 30 && '⚠️ Sobrepeso'}
                {data.imc >= 30 && '⚠️ Obesidad'}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg">
          Siguiente
        </Button>
      </div>
    </div>
  );
}
