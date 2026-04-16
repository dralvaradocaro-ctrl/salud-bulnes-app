import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PatientData } from '@/types/protocol';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface ClinicalStepProps {
  data: PatientData;
  sexo: 'masculino' | 'femenino' | '';
  onUpdate: (field: keyof PatientData, value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ClinicalStep({ data, sexo, onUpdate, onNext, onBack }: ClinicalStepProps) {
  const allQuestions = [
    { key: 'corticoidesSistemicos' as keyof PatientData, label: '¿Uso de corticoides sistémicos (actual o reciente)?' },
    { key: 'infeccionActiva' as keyof PatientData, label: '¿Infección activa o sepsis?' },
    { key: 'postoperatorioMayor' as keyof PatientData, label: '¿Postoperatorio mayor (cirugía abdominal, cardíaca o traumatológica compleja)?' },
    { key: 'sop' as keyof PatientData, label: '¿Síndrome de Ovario Poliquístico (SOP)?' },
    { key: 'hepatopatia' as keyof PatientData, label: '¿Hepatopatía crónica o aguda avanzada?' },
    { key: 'nefropatia' as keyof PatientData, label: '¿Nefropatía crónica (VFG < 60 ml/min, etapa ≥ 3)?' },
  ];

  const questions = allQuestions.filter(
    (q) => q.key !== 'sop' || sexo === 'femenino'
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Criterios Clínicos</h2>
        <p className="text-muted-foreground">Responda las siguientes preguntas sobre el estado clínico del paciente</p>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.key} className="p-6">
            <Label className="text-base font-medium mb-4 block">{question.label}</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={data[question.key] === true ? 'default' : 'outline'}
                className={cn(
                  'flex-1',
                  data[question.key] === true && 'bg-primary hover:bg-primary/90'
                )}
                onClick={() => onUpdate(question.key, true)}
              >
                Sí
              </Button>
              <Button
                type="button"
                variant={data[question.key] === false ? 'default' : 'outline'}
                className={cn(
                  'flex-1',
                  data[question.key] === false && 'bg-primary hover:bg-primary/90'
                )}
                onClick={() => onUpdate(question.key, false)}
              >
                No
              </Button>
            </div>
            
            {question.key === 'corticoidesSistemicos' && data[question.key] === true && (
              <Alert className="mt-4 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-sm text-green-900 dark:text-green-100">
                  <strong>Nota sobre uso transitorio:</strong> Si el uso de corticoides es transitorio, valorar repetir el esquema tras su suspensión, 
                  ya que los corticoides afectan la insulinosensibilidad solo transitoriamente.
                </AlertDescription>
              </Alert>
            )}
            
            {question.key === 'infeccionActiva' && data[question.key] === true && (
              <Alert className="mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Criterio aplicable:</strong> Infección con repercusión sistémica significativa, como:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Fiebre alta (≥38.5°C) persistente</li>
                    <li>Leucocitosis significativa (&gt;15,000/µL) o leucopenia (&lt;4,000/µL)</li>
                    <li>Signos de disfunción orgánica (hipotensión, taquicardia, alteración mental)</li>
                    <li>Marcadores inflamatorios elevados (PCR, procalcitonina)</li>
                    <li>Sepsis o shock séptico</li>
                  </ul>
                  <p className="mt-2 italic">No aplica para: resfríos leves, gastroenteritis sin complicaciones, infecciones localizadas sin repercusión sistémica.</p>
                </AlertDescription>
              </Alert>
            )}
            
            {question.key === 'hepatopatia' && data[question.key] === true && (
              <Alert className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>Clasificar como "hepatopatía avanzada"</strong> si se cumple al menos 2 de los 5 criterios siguientes, o existe diagnóstico clínico documentado de cirrosis (compensada o descompensada) o hepatitis aguda grave.
                  
                  <p className="mt-3 font-semibold">Criterios cuantificables:</p>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li><strong>Función sintética:</strong> Albúmina sérica &lt; 3,0 g/dL</li>
                    <li><strong>Coagulación:</strong> INR ≥ 1,5 o Tiempo de Protrombina (TP) &lt; 60%</li>
                    <li><strong>Colestasis:</strong> Bilirrubina total &gt; 2,0 mg/dL</li>
                    <li><strong>Daño hepatocelular activo:</strong> AST o ALT &gt; 3× el valor normal (VN) o GGT &gt; 2× VN, persistente ≥72 h</li>
                    <li><strong>Clínico/imagen:</strong> Presencia de ascitis, ictericia franca o hígado nodular / estigmas de cirrosis en ecografía</li>
                  </ul>
                  
                  <p className="mt-3 font-semibold">Notas operativas:</p>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Si coexisten INR ≥1,5 + bilirrubina &gt;2,0 mg/dL → clasificar directamente como "avanzada"</li>
                    <li>En hepatitis aguda sin datos de falla sintética, reevaluar en 48–72 h; si persisten ≥2 criterios, clasificar</li>
                    <li>Pacientes con Child-Pugh B o C son "avanzados" automáticamente</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {question.key === 'nefropatia' && data[question.key] === true && (
              <Alert className="mt-4 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800">
                <Info className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <AlertDescription className="text-sm text-purple-900 dark:text-purple-100">
                  <strong>Nefropatía crónica (ERC Etapa ≥3)</strong>
                  
                  <p className="mt-3 font-semibold">Criterios de ingreso:</p>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li><strong>ERC etapa 3 o superior:</strong> VFG &lt;60 mL/min/1.73 m²</li>
                    <li><strong>Pacientes en hemodiálisis o diálisis peritoneal:</strong> Clasificar como "insulinosensibles"</li>
                  </ul>
                  
                  <p className="mt-3 font-semibold">Clasificación según VFG:</p>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li><strong>VFG 30-60 mL/min:</strong> Paciente clasificado como <strong>INTERMEDIO</strong></li>
                    <li><strong>VFG &lt;30 mL/min:</strong> Paciente clasificado como <strong>SENSIBLE</strong> (insulinosensible)</li>
                  </ul>
                  
                  <p className="mt-3 italic text-purple-800 dark:text-purple-200">
                    ℹ️ Si no se conoce la VFG, el sistema clasificará automáticamente al paciente como <strong>INTERMEDIO</strong>.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="outline" size="lg">
          Anterior
        </Button>
        <Button onClick={onNext} size="lg">
          Siguiente
        </Button>
      </div>
    </div>
  );
}
