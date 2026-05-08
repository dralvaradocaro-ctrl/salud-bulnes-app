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

  return (
    <div id="cv-section">
      <Card className="border-border/80">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-semibold">Control Cardiovascular (PSCV)</p>
              </div>
              <p className="text-xs text-muted-foreground">Resumen clínico del seguimiento cardiovascular.</p>
            </div>
            <Badge className={CV_RISK_COLORS[risk]}>{CV_RISK_LABELS[risk]}</Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border bg-accent/15 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Último control</p>
              <p className="mt-1 text-sm font-medium">{formatDateES(lastControlDate)}</p>
              <p className="text-xs text-muted-foreground">{lastProf}</p>
            </div>
            <div className="rounded-lg border bg-accent/15 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Próximo control</p>
              <p className="mt-1 text-sm font-medium">{formatDateES(nextControlDate)}</p>
              <p className="text-xs text-muted-foreground">{nextProf}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Badge className={CV_STATUS_COLORS[status]} variant="secondary">
              {CV_STATUS_LABELS[status]}
            </Badge>
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Ocultar detalle' : 'Ver detalle'}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </Button>
          </div>

          {expanded && (
            <div className="rounded-lg border bg-card px-3 py-3 text-sm">
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
