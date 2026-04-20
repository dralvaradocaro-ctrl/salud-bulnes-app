import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

const INCLUSION_CRITERIA = [
  'Edad igual o mayor a 18 años',
  'Hospitalización en cualquiera de las unidades del Servicio de Medicina',
  'Diabetes mellitus tipo 2 conocida, o hiperglicemia intrahospitalaria con indicación médica de corrección*',
  'Condición clínica compatible con manejo subcutáneo en sala no crítica',
  'Indicación de control de glicemia capilar y corrección insulínica preprandial',
];

const EXCLUSION_CRITERIA = [
  'Paciente con diagnóstico de diabetes tipo 1',
  'Paciente con esquema basal y correccional definido por especialista al ingreso o durante hospitalización',
  'Paciente ingresado en contexto de hipoglucemia sintomática o con antecedente previo según criterio clínico (≤70 mg/dL)',
  'Paciente ingresado en contexto de síndrome diabético agudo (SHH, CAD)',
  'Paciente con contraindicación para uso de insulina correctora',
  'Paciente con hiperglicemia persistente actual o reciente sin diagnóstico etiológico claro',
  'Paciente embarazada',
  'Paciente con indicación clínica actual de esquema basal-bolo, basal-bolo-plus o similares, sin indicación de correccional aislado',
];

interface ExclusionModalProps {
  open: boolean;
  onContinue: (hasExclusions: boolean) => void;
}

export const ExclusionModal = ({ open, onContinue }: ExclusionModalProps) => {
  const [step, setStep] = useState<'inclusion' | 'exclusion'>('inclusion');
  const [inclusionMet, setInclusionMet] = useState<boolean[]>(Array.from({ length: INCLUSION_CRITERIA.length }, () => true));
  const [checked, setChecked] = useState<boolean[]>(Array.from({ length: EXCLUSION_CRITERIA.length }, () => false));
  const [skipSession, setSkipSession] = useState(false);

  const anyInclusionNotMet = inclusionMet.some((v) => !v);
  const anyExclusionChecked = checked.some(Boolean);

  const handleContinue = () => {
    if (skipSession) {
      localStorage.setItem('exclusion-modal-dismissed', 'true');
    }
    onContinue(anyExclusionChecked || anyInclusionNotMet);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-xl max-h-[90vh] overflow-y-auto [&>button]:hidden theme-blue"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === 'inclusion' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <DialogTitle className="text-lg">Criterios de inclusión</DialogTitle>
              </div>
              <DialogDescription className="text-sm">
                Confirme que el paciente cumple con los siguientes criterios para ingresar al protocolo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {INCLUSION_CRITERIA.map((criterion, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
                >
                  <span className="text-sm leading-snug flex-1">{criterion}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${inclusionMet[i] ? 'text-primary' : 'text-destructive'}`}>
                      {inclusionMet[i] ? 'Sí' : 'No'}
                    </span>
                    <Switch
                      checked={inclusionMet[i]}
                      onCheckedChange={(v) => {
                        const next = [...inclusionMet];
                        next[i] = v;
                        setInclusionMet(next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground leading-tight mt-1">
              * Operativamente se considera hiperglicemia con requerimientos correccionales: cualquier toma aislada de glicemia ≥ 200 mg/dL, glicemia de ayuno ≥ 140 mg/dL, hiperglicemias preprandiales ≥ 160 mg/dL en tres o más tomas separadas, o hiperglicemias preprandiales ≥ 180 mg/dL en dos o más tomas separadas.
            </p>

            {anyInclusionNotMet && (
              <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                  El paciente podría <strong>no verse beneficiado</strong> de la aplicación de este protocolo. Valorar indicación según criterio médico.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button onClick={() => setStep('exclusion')} className="w-full sm:w-auto">
                Continuar a criterios de exclusión
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <DialogTitle className="text-lg">Verificación: criterios de exclusión</DialogTitle>
              </div>
              <DialogDescription className="text-sm">
                Confirme que el paciente no presenta ninguno de los siguientes criterios de exclusión.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {EXCLUSION_CRITERIA.map((criterion, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={checked[i]}
                    onCheckedChange={(v) => {
                      const next = [...checked];
                      next[i] = v === true;
                      setChecked(next);
                    }}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-snug">{criterion}</span>
                </label>
              ))}
            </div>

            {anyExclusionChecked && (
              <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                  Este protocolo <strong>no aplica en este momento</strong>. Reevaluar la indicación clínica. De todas formas, podrá utilizar la plataforma bajo su criterio médico.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="skip-session"
                checked={skipSession}
                onCheckedChange={(v) => setSkipSession(v === true)}
              />
              <Label htmlFor="skip-session" className="text-xs text-muted-foreground cursor-pointer">
                No volver a mostrar durante esta sesión
              </Label>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep('inclusion')}>
                Volver a inclusión
              </Button>
              {anyExclusionChecked ? (
                <Button onClick={handleContinue} variant="secondary">
                  Continuar bajo criterio médico
                </Button>
              ) : (
                <Button onClick={handleContinue}>
                  Continuar al protocolo
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
