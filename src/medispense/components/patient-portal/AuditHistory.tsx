import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Badge } from '@/medispense/components/ui/badge';
import { ScrollArea } from '@/medispense/components/ui/scroll-area';
import { Button } from '@/medispense/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/medispense/components/ui/collapsible';
import { History, User, FileText, HeartPulse, Pill, Edit, ChevronDown } from 'lucide-react';
import { supabase } from '@/medispense/integrations/supabase/client';

interface AuditLog {
  id: string;
  user_name: string;
  entity_type: string;
  action_type: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Creado',
  update: 'Modificado',
  delete: 'Eliminado',
  activate: 'Activado',
  deactivate: 'Desactivado',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-success/10 text-success border-success/30',
  update: 'bg-primary/10 text-primary border-primary/30',
  delete: 'bg-destructive/10 text-destructive border-destructive/30',
  activate: 'bg-success/10 text-success border-success/30',
  deactivate: 'bg-warning/10 text-warning border-warning/30',
};

const ENTITY_ICONS: Record<string, any> = {
  prescription: Pill,
  prescription_item: Pill,
  diagnosis: FileText,
  cardiovascular_control: HeartPulse,
  patient: User,
  user: User,
};

const ENTITY_LABELS: Record<string, string> = {
  prescription: 'Receta',
  prescription_item: 'Medicamento',
  diagnosis: 'Diagnóstico',
  cardiovascular_control: 'Control CV',
  patient: 'Paciente',
  exam: 'Exámenes',
  user: 'Usuario',
};

interface AuditHistoryProps {
  patientId?: string;
  limit?: number;
}

export function AuditHistory({ patientId, limit = 50 }: AuditHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [patientId]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('audit_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data } = await query;
    setLogs((data as any) || []);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">Cargando historial...</CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No hay cambios registrados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Historial de Cambios
              <Badge variant="secondary">{logs.length}</Badge>
            </CardTitle>

            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Ocultar detalles del historial' : 'Mostrar detalles del historial'}
                className="shrink-0"
              >
                {isOpen ? 'Ocultar detalles' : 'Ver detalles'}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-[320px]">
              <div className="space-y-2">
                {logs.map((log) => {
                  const Icon = ENTITY_ICONS[log.entity_type] || Edit;
                  return (
                    <div key={log.id} className="flex gap-3 rounded-lg border bg-card p-2 text-sm">
                      <div className="mt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{log.user_name}</span>
                          <Badge variant="outline" className={ACTION_COLORS[log.action_type] || ''}>
                            {ACTION_LABELS[log.action_type] || log.action_type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {ENTITY_LABELS[log.entity_type] || log.entity_type}
                          </Badge>
                        </div>
                        {log.description && (
                          <p className="mt-1 text-muted-foreground">{log.description}</p>
                        )}
                        {log.field_changed && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Campo: <span className="font-medium">{log.field_changed}</span>
                            {log.old_value && <> · Anterior: <span className="line-through">{log.old_value}</span></>}
                            {log.new_value && <> · Nuevo: <span className="font-medium">{log.new_value}</span></>}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
