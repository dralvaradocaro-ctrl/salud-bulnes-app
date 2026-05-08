import { useState } from 'react';
import { HeartPulse, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/medispense/components/ui/badge';
import { Card, CardContent } from '@/medispense/components/ui/card';
import { Button } from '@/medispense/components/ui/button';
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

interface CompactCardiovascularProps {
  lastControlDate: string | null;
  lastControlProfessional: string | null;
  nextControlDate: string | null;
  nextControlProfessional: string | null;
  cardiovascularRisk: string | null;
  diagnoses: string[] | null;
}

export function CompactCardiovascular({
  lastControlDate,
  lastControlProfessional,
  nextControlDate,
  nextControlProfessional,
  cardiovascularRisk,
  diagnoses,
}: CompactCardiovascularProps) {
  const [expanded, setExpanded] = useState(false);

  if (!lastControlDate) return null;

  const risk = (cardiovascularRisk as CardiovascularRisk) || 'bajo';
  const status = calculateFollowUpStatus(nextControlDate);
  const lastProf = CV_PROFESSIONAL_LABELS[(lastControlProfessional as CVProfessional)] || lastControlProfessional;
  const nextProf = CV_PROFESSIONAL_LABELS[(nextControlProfessional as CVProfessional)] || nextControlProfessional;
  const riskBadgeClass = `${CV_RISK_COLORS[risk]} border-transparent hover:opacity-90`;
  const statusBadgeClass = `${CV_STATUS_COLORS[status]} border-transparent hover:opacity-90`;

  return (
    <div id="cv-section">
      <Card className="border-border/70 bg-background/60 shadow-none">
        <CardContent className="space-y-2 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <HeartPulse className="h-4 w-4 shrink-0 text-primary" />
              <p className="truncate text-sm font-semibold">Control cardiovascular</p>
              <Badge className={`${riskBadgeClass} hidden sm:inline-flex`}>{CV_RISK_LABELS[risk]}</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className={`${riskBadgeClass} sm:hidden`}>
                {CV_RISK_LABELS[risk]}
              </Badge>
              <Badge className={statusBadgeClass}>
                {CV_STATUS_LABELS[status]}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? 'Ocultar detalle cardiovascular' : 'Ver detalle cardiovascular'}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
            <p className="truncate text-muted-foreground">
              Último: <span className="font-medium text-foreground">{formatDateES(lastControlDate)}</span>
              {lastProf ? <span> · {lastProf}</span> : null}
            </p>
            <p className="truncate text-muted-foreground">
              Próximo: <span className="font-medium text-foreground">{formatDateES(nextControlDate)}</span>
              {nextProf ? <span> · {nextProf}</span> : null}
            </p>
          </div>

          {expanded && (
            <div className="rounded-md border bg-card px-3 py-2 text-sm">
              <div className="space-y-2">
                <p>
                  Su último control fue con <strong>{lastProf}</strong> el <strong>{formatDateES(lastControlDate)}</strong>.
                </p>
                <p>
                  Su próximo control estimado será con <strong>{nextProf}</strong> el <strong>{formatDateES(nextControlDate)}</strong>.
                </p>
                {(status === 'control_vencido' || status === 'perdido_seguimiento') && (
                  <p className="text-xs font-medium text-destructive">
                    ⚠️ La fecha estimada ya pasó. Acuda a su centro de salud para reagendar.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
