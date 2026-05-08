import { useState } from 'react';
import { AlertTriangle, ChevronDown, X } from 'lucide-react';
import { Button } from '@/medispense/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/medispense/components/ui/collapsible';

interface ExpiredPrescriptionAlertProps {
  hasExpiredPrescriptions: boolean;
}

export function ExpiredPrescriptionAlert({ hasExpiredPrescriptions }: ExpiredPrescriptionAlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!hasExpiredPrescriptions || dismissed) return null;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="relative rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 rounded-full p-1 transition-colors hover:bg-destructive/20"
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4 text-destructive" />
        </button>

        <div className="flex items-center gap-2 pr-8">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
            Su receta médica se encuentra vencida. Solicite renovación en su centro de salud.
          </p>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive">
              {expanded ? 'Ocultar' : 'Ver detalle'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <p className="pt-2 text-xs text-muted-foreground">
            Comuníquese con su centro de salud para renovarla o consulte en SOME. Las renovaciones de receta no se realizan mediante urgencias.
          </p>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
