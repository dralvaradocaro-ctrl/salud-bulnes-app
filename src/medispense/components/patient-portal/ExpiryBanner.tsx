import { useState } from 'react';
import { AlertTriangle, ChevronDown, Stethoscope } from 'lucide-react';
import { Button } from '@/medispense/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/medispense/components/ui/collapsible';

interface ExpiryBannerProps {
  daysUntilExpiry: number;
  prescriptionsExpiringSoon: number;
  onClickPrescription?: () => void;
}

export function ExpiryBanner({ daysUntilExpiry, prescriptionsExpiringSoon, onClickPrescription }: ExpiryBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (prescriptionsExpiringSoon === 0 || daysUntilExpiry > 30) return null;

  const isUrgent = daysUntilExpiry <= 7;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div
        className={`rounded-xl border px-3 py-2.5 ${
          isUrgent
            ? 'border-destructive/40 bg-destructive/10'
            : 'border-warning/40 bg-warning/10'
        }`}
      >
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          ) : (
            <Stethoscope className="h-4 w-4 shrink-0 text-warning" />
          )}
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {prescriptionsExpiringSoon === 1
              ? `Tiene 1 receta por vencer en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? '' : 's'}`
              : `Tiene ${prescriptionsExpiringSoon} recetas por vencer`}
          </p>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onClickPrescription}>
            Ir a recetas
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
              {expanded ? 'Ocultar' : 'Ver detalle'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <p className="pt-2 text-xs text-muted-foreground">
            Si no tiene control crónico prontamente, solicite hora para renovación según protocolo local. Las renovaciones no se realizan por urgencias.
          </p>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
