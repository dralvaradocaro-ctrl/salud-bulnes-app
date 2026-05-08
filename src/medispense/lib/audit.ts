import { supabase } from '@/medispense/integrations/supabase/client';

interface AuditLogEntry {
  patientId?: string;
  patientCode?: string;
  entityType: string;
  actionType: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

    await supabase.from('audit_logs' as any).insert({
      user_id: user.id,
      user_name: userName,
      patient_id: entry.patientId || null,
      patient_code: entry.patientCode || null,
      entity_type: entry.entityType,
      action_type: entry.actionType,
      field_changed: entry.fieldChanged || null,
      old_value: entry.oldValue || null,
      new_value: entry.newValue || null,
      description: entry.description || null,
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}
