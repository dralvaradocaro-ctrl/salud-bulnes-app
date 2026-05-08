import { Badge } from '@/medispense/components/ui/badge';
import { Card, CardContent } from '@/medispense/components/ui/card';
import { HeartPulse, Calendar, Stethoscope, FlaskConical } from 'lucide-react';
import { cn } from '@/medispense/lib/utils';
import {
  calculateFollowUpStatus,
  formatDateES,
  CV_PROFESSIONAL_LABELS,
  CV_RISK_LABELS,
  CV_RISK_COLORS,
  CV_STATUS_LABELS,
  CV_STATUS_COLORS,
  type CVProfessional,
  type CardiovascularRisk,
} from '@/medispense/lib/cardiovascular';

interface CardiovascularBannerProfessionalProps {
  lastControlDate: string | null;
  lastControlProfessional: string | null;
  nextControlDate: string | null;
  nextControlProfessional: string | null;
  cardiovascularRisk: string | null;
  notes: string | null;
}

export function CardiovascularBannerProfessional({
  lastControlDate,
  lastControlProfessional,
  nextControlDate,
  nextControlProfessional,
  cardiovascularRisk,
  notes,
}: CardiovascularBannerProfessionalProps) {
  if (!lastControlDate) return null;

  const status = calculateFollowUpStatus(nextControlDate);
  const risk = (cardiovascularRisk as CardiovascularRisk) || 'bajo';
  const lastProf = CV_PROFESSIONAL_LABELS[(lastControlProfessional as CVProfessional)] || lastControlProfessional;
  const nextProf = CV_PROFESSIONAL_LABELS[(nextControlProfessional as CVProfessional)] || nextControlProfessional;

  return (
    <Card className={cn(
      'border-l-4',
      status === 'al_dia' ? 'border-l-success' :
      status === 'proximo_cercano' ? 'border-l-warning' :
      'border-l-destructive'
    )}>
      <CardContent className="py-3 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <HeartPulse className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium">
            Último control con {lastProf} el {formatDateES(lastControlDate)}.
          </span>
          <Badge className={CV_RISK_COLORS[risk]} variant="secondary">
            RCV: {CV_RISK_LABELS[risk]}
          </Badge>
          <Badge className={CV_STATUS_COLORS[status]}>
            {CV_STATUS_LABELS[status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Próximo control con {nextProf}: {formatDateES(nextControlDate)}.
        </p>
        {notes && (
          <p className="text-xs text-muted-foreground italic">📝 {notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface CardiovascularBannerPatientProps {
  lastControlDate: string | null;
  lastControlProfessional: string | null;
  nextControlDate: string | null;
  nextControlProfessional: string | null;
  cardiovascularRisk: string | null;
  showExamReminder: boolean;
  diagnoses: string[] | null;
  lastEcgDate: string | null;
  lastFundoscopyDate: string | null;
  lastLabReviewDate: string | null;
}

export function CardiovascularBannerPatient({
  lastControlDate,
  lastControlProfessional,
  nextControlDate,
  nextControlProfessional,
  cardiovascularRisk,
  showExamReminder,
  diagnoses,
  lastEcgDate,
  lastFundoscopyDate,
  lastLabReviewDate,
}: CardiovascularBannerPatientProps) {
  if (!lastControlDate) return null;

  const risk = (cardiovascularRisk as CardiovascularRisk) || 'bajo';
  const lastProf = CV_PROFESSIONAL_LABELS[(lastControlProfessional as CVProfessional)] || lastControlProfessional;
  const nextProf = CV_PROFESSIONAL_LABELS[(nextControlProfessional as CVProfessional)] || nextControlProfessional;
  const status = calculateFollowUpStatus(nextControlDate);
  const nextIsMedico = nextControlProfessional === 'medico';
  const hasDM2 = diagnoses?.includes('diabetes_tipo2');

  return (
    <div className="space-y-3">
      <Card className={cn(
        'border-l-4',
        risk === 'bajo' ? 'border-l-success' :
        risk === 'moderado' ? 'border-l-warning' :
        'border-l-destructive'
      )}>
        <CardContent className="py-4 space-y-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Control Cardiovascular</span>
          </div>
          <p className="text-sm">
            Su último control fue con <strong>{lastProf}</strong> el <strong>{formatDateES(lastControlDate)}</strong>.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm">Su riesgo cardiovascular actual es:</span>
            <Badge className={CV_RISK_COLORS[risk]}>
              {CV_RISK_LABELS[risk]}
            </Badge>
          </div>
          <p className="text-sm">
            Su próximo control estimado será con <strong>{nextProf}</strong> el <strong>{formatDateES(nextControlDate)}</strong>.
          </p>
          {(status === 'control_vencido' || status === 'perdido_seguimiento') && (
            <p className="text-xs text-destructive font-medium">
              ⚠️ Su fecha de control ya pasó. Acuda a su centro de salud para reagendar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Exam reminder banner */}
      {showExamReminder && nextIsMedico && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Recordatorio para su próximo control médico</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recuerde que para su próximo control médico es importante acudir con sus exámenes realizados y disponibles para revisión. 
              Además, puede requerirse electrocardiograma y/o fondo de ojo si no se encuentran vigentes. 
              Si tiene dudas sobre la vigencia de estos exámenes, acérquese a laboratorio o consulte en SOME.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Exam vigency indicators */}
      <Card>
        <CardContent className="py-3 space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Vigencia de Exámenes</span>
          </div>
          <div className="grid gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Últimos exámenes de laboratorio:</span>
              <span className={lastLabReviewDate ? 'font-medium' : 'text-muted-foreground'}>
                {formatDateES(lastLabReviewDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Último ECG:</span>
              <span className={lastEcgDate ? 'font-medium' : 'text-muted-foreground'}>
                {formatDateES(lastEcgDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Último fondo de ojo:</span>
              <span className={lastFundoscopyDate ? 'font-medium' : 'text-muted-foreground'}>
                {formatDateES(lastFundoscopyDate)}
              </span>
            </div>
            {hasDM2 && (
              <p className="text-warning italic mt-1">
                ⚠️ Paciente con Diabetes: el fondo de ojo puede ser requerido.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
