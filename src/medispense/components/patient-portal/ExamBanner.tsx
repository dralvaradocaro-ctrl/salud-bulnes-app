import { useState } from 'react';
import { FlaskConical, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/medispense/components/ui/badge';
import { Card, CardContent } from '@/medispense/components/ui/card';
import {
  type ExamInfo,
  EXAM_STATUS_LABELS,
  EXAM_STATUS_COLORS,
  formatExamDate,
  hasAnyExpiredExam,
} from '@/medispense/lib/exam-vigency';

interface ExamBannerProps {
  exams: ExamInfo[];
  showExamDates: boolean;
  nextControlProfessional?: string | null;
  nextControlDate?: string | null;
}

/**
 * Check if exams are technically "vigente" but will expire within 2 months,
 * while the next control with médico is within 1 month.
 */
/**
 * Check if any vigente exam will expire BEFORE the next control with médico.
 * E.g. control in June, exam expires in May → "Próximo a vencer"
 */
function hasNearExpiryForDoctor(
  exams: ExamInfo[],
  nextControlProfessional: string | null | undefined,
  nextControlDate: string | null | undefined,
): boolean {
  if (nextControlProfessional !== 'medico' || !nextControlDate) return false;
  const controlDate = new Date(nextControlDate + 'T12:00:00');
  return exams.some(exam => examExpiresBeforeDate(exam, controlDate));
}

/** Returns true if this specific exam is vigente but expires before the given date */
function examExpiresBeforeDate(exam: ExamInfo, beforeDate: Date): boolean {
  if (exam.status !== 'vigente' || !exam.expiryDate) return false;
  const expiryDate = new Date(exam.expiryDate + 'T12:00:00');
  return expiryDate.getTime() <= beforeDate.getTime();
}

export function ExamBanner({ exams, showExamDates, nextControlProfessional, nextControlDate }: ExamBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!showExamDates) return null;

  const hasIssues = hasAnyExpiredExam(exams);
  const nearExpiryWarning = hasNearExpiryForDoctor(exams, nextControlProfessional, nextControlDate);

  return (
    <div className="space-y-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full rounded-lg px-3 py-2.5 flex items-center justify-between transition-colors border ${
          hasIssues || nearExpiryWarning
            ? 'bg-warning/5 border-warning/30 hover:bg-warning/10'
            : 'bg-accent/30 border-border hover:bg-accent/50'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate text-muted-foreground">
            Exámenes vigentes para el próximo control médico.
          </span>
          {(hasIssues || nearExpiryWarning) && (
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <Card className="rounded-t-none border-t-0">
          <CardContent className="pt-4 space-y-3">
            <h4 className="text-sm font-medium">Últimos exámenes registrados</h4>
            <div className="space-y-2">
              {exams.map((exam) => {
                const controlDate = (nextControlProfessional === 'medico' && nextControlDate)
                  ? new Date(nextControlDate + 'T12:00:00')
                  : null;
                const willExpireBeforeControl = controlDate && examExpiresBeforeDate(exam, controlDate);
                const displayLabel = willExpireBeforeControl ? 'Próximo a vencer' : EXAM_STATUS_LABELS[exam.status];
                const displayColor = willExpireBeforeControl ? 'bg-warning text-warning-foreground' : EXAM_STATUS_COLORS[exam.status];

                return (
                  <div
                    key={exam.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-accent/20 text-sm"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Realizado: {formatExamDate(exam.lastDate)}
                      </p>
                      {exam.expiryDate && (
                        <p className="text-xs text-muted-foreground">
                          Vigente hasta: {formatExamDate(exam.expiryDate)}
                        </p>
                      )}
                    </div>
                    <Badge className={displayColor}>
                      {displayLabel}
                    </Badge>
                  </div>
                );
              })}
            </div>
            {nearExpiryWarning && (
              <p className="text-xs text-warning font-medium">
                ⚠️ Algunos de sus exámenes están próximos a vencer antes de su próximo control médico. Consulte en SOME o laboratorio si necesita repetirlos.
              </p>
            )}
            {hasIssues && !nearExpiryWarning && (
              <p className="text-xs text-muted-foreground italic">
                Algunos de sus exámenes pueden estar vencidos. Consulte en SOME o laboratorio si necesita repetirlos antes de su próximo control.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
