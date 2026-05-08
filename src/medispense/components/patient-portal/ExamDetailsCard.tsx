import { useState } from 'react';
import { FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/medispense/components/ui/badge';
import { Card, CardContent } from '@/medispense/components/ui/card';
import {
  type ExamInfo,
  EXAM_STATUS_LABELS,
  EXAM_STATUS_COLORS,
  formatExamDate,
  hasAnyExpiredExam,
} from '@/medispense/lib/exam-vigency';

interface ExamDetailsCardProps {
  exams: ExamInfo[];
  showExamDates: boolean;
  hasDM2: boolean;
}

export function ExamDetailsCard({ exams, showExamDates, hasDM2 }: ExamDetailsCardProps) {
  const hasExpired = hasAnyExpiredExam(exams);
  const [expanded, setExpanded] = useState(hasExpired);

  if (!showExamDates) return null;

  return (
    <div id="exams-section">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full rounded-lg p-3 flex items-center justify-between transition-colors border ${
          hasExpired
            ? 'bg-destructive/5 border-destructive/30 hover:bg-destructive/10'
            : 'bg-accent/20 hover:bg-accent/40'
        }`}
      >
        <div className="flex items-center gap-2 text-sm">
          <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Registro de Exámenes</span>
          {hasExpired && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">Exámenes vencidos</Badge>
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
          <CardContent className="pt-4 space-y-2">
            {exams.map((exam) => (
              <div
                key={exam.name}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/20 text-sm"
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
                <Badge className={EXAM_STATUS_COLORS[exam.status]}>
                  {EXAM_STATUS_LABELS[exam.status]}
                </Badge>
              </div>
            ))}
            {hasDM2 && (
              <p className="text-xs text-warning italic mt-1">
                ⚠️ Paciente con Diabetes: el fondo de ojo puede ser requerido en el seguimiento.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
