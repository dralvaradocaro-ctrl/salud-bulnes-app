import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Label } from '@/medispense/components/ui/label';
import { Switch } from '@/medispense/components/ui/switch';
import { Button } from '@/medispense/components/ui/button';
import { Input } from '@/medispense/components/ui/input';
import { Textarea } from '@/medispense/components/ui/textarea';
import { Badge } from '@/medispense/components/ui/badge';
import { Calendar } from '@/medispense/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/medispense/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/medispense/components/ui/select';
import { HeartPulse, CalendarIcon, AlertCircle, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/medispense/lib/utils';
import { supabase } from '@/medispense/integrations/supabase/client';
import { useAuth } from '@/medispense/contexts/AuthContext';
import { useToast } from '@/medispense/hooks/use-toast';
import {
  calculateCardiovascularRisk,
  calculateNextControlDate,
  getNextCardiovascularProfessional,
  calculateFollowUpStatus,
  formatDateES,
  shouldDefaultToCardiovascularProgram,
  CV_PROFESSIONAL_LABELS,
  CV_RISK_LABELS,
  CV_RISK_COLORS,
  CV_STATUS_LABELS,
  CV_STATUS_COLORS,
  OVERRIDE_REASONS,
  type CVProfessional,
  type CardiovascularRisk,
} from '@/medispense/lib/cardiovascular';
import {
  getAllExams,
  EXAM_STATUS_LABELS,
  EXAM_STATUS_COLORS,
  formatExamDate,
} from '@/medispense/lib/exam-vigency';
import { logAudit } from '@/medispense/lib/audit';

interface CardiovascularControlSectionProps {
  patientId: string;
  diagnoses: string[] | null;
  lastCvControlDate: string | null;
  lastCvControlProfessional: string | null;
  nextCvControlDate: string | null;
  nextCvControlProfessional: string | null;
  lastCvControlNotes: string | null;
  cardiovascularRisk: string | null;
  showExamReminder: boolean;
  lastEcgDate: string | null;
  lastFundoscopyDate: string | null;
  lastLabReviewDate: string | null;
  manualOverrideNextControl: boolean;
  manualOverrideReason: string | null;
  hasDiabeticRetinopathy?: boolean;
  showExamDatesToPatient?: boolean;
  /** Role of the logged-in user: 'admin' (médico) or 'nurse' (enfermera) */
  userRole?: 'admin' | 'nurse' | null;
  /** Whether this specific visit is a CV control (from PSCV modal) */
  isCvControl?: boolean | null;
  onSaved: () => void;
}

/**
 * Parse a date string in dd-mm-yyyy or yyyy-mm-dd format.
 * Returns null if invalid.
 */
function parseDateInput(value: string): Date | null {
  if (!value) return null;
  // Try dd-mm-yyyy
  const dmy = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const d = new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
    if (!isNaN(d.getTime())) return d;
  }
  // Try yyyy-mm-dd
  const ymd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const d = new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function DateInputWithCalendar({
  value,
  onChange,
  label,
  size = 'default',
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  label: string;
  size?: 'default' | 'sm';
}) {
  const [textValue, setTextValue] = useState(
    value ? value.toLocaleDateString('es-CL') : ''
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    setTextValue(value ? value.toLocaleDateString('es-CL') : '');
    setError(false);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTextValue(v);
    const parsed = parseDateInput(v);
    if (parsed) {
      setError(false);
      onChange(parsed);
    } else if (v === '') {
      setError(false);
      onChange(undefined);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        value={textValue}
        onChange={handleTextChange}
        placeholder="dd-mm-aaaa"
        className={cn(
          size === 'sm' ? 'h-7 text-xs w-28' : 'h-8 text-sm w-32',
          error && 'border-destructive'
        )}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className={size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'}>
            <CalendarIcon className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => d && onChange(d)}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CardiovascularControlSection({
  patientId,
  diagnoses,
  lastCvControlDate,
  lastCvControlProfessional,
  nextCvControlDate,
  nextCvControlProfessional,
  lastCvControlNotes,
  cardiovascularRisk,
  showExamReminder,
  lastEcgDate,
  lastFundoscopyDate,
  lastLabReviewDate,
  manualOverrideNextControl,
  manualOverrideReason,
  hasDiabeticRetinopathy = false,
  showExamDatesToPatient = true,
  userRole,
  isCvControl = null,
  onSaved,
}: CardiovascularControlSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const sectionRef = useRef<HTMLDivElement>(null);

  const defaultProfessional: CVProfessional = userRole === 'nurse' ? 'enfermera' : 'medico';

  // Toggle: is this a CV control? Controlled by parent if provided, else default ON
  const [isCV, setIsCV] = useState(isCvControl !== null ? isCvControl : true);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(isCvControl !== null ? !isCvControl : true);

  // Sync with parent when isCvControl changes, scroll into view on activation
  useEffect(() => {
    if (isCvControl !== null) {
      setIsCV(isCvControl);
      setCollapsed(!isCvControl);
      if (isCvControl) {
        setTimeout(() => {
          sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [isCvControl]);

  const [professional, setProfessional] = useState<CVProfessional>(defaultProfessional);
  const [controlDate, setControlDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  // Manual override state
  const [editingNextControl, setEditingNextControl] = useState(manualOverrideNextControl);
  const [manualNextDate, setManualNextDate] = useState<Date | undefined>(
    nextCvControlDate ? new Date(nextCvControlDate + 'T12:00:00') : undefined
  );
  const [manualNextProfessional, setManualNextProfessional] = useState<CVProfessional>(
    (nextCvControlProfessional as CVProfessional) || 'medico'
  );
  const [overrideReason, setOverrideReason] = useState(manualOverrideReason || '');

  const [ecgDate, setEcgDate] = useState<Date | undefined>(
    lastEcgDate ? new Date(lastEcgDate + 'T12:00:00') : undefined
  );
  const [fundoscopyDate, setFundoscopyDate] = useState<Date | undefined>(
    lastFundoscopyDate ? new Date(lastFundoscopyDate + 'T12:00:00') : undefined
  );
  const [labDate, setLabDate] = useState<Date | undefined>(
    lastLabReviewDate ? new Date(lastLabReviewDate + 'T12:00:00') : undefined
  );
  const [examReminder, setExamReminder] = useState(showExamReminder);
  const [showExamToPatient, setShowExamToPatient] = useState(showExamDatesToPatient);
  const [retinopathy, setRetinopathy] = useState(hasDiabeticRetinopathy);

  const calculatedRisk = calculateCardiovascularRisk(diagnoses);
  const nextDate = editingNextControl && manualNextDate
    ? manualNextDate
    : calculateNextControlDate(controlDate, calculatedRisk);
  const nextProfessional = editingNextControl
    ? manualNextProfessional
    : getNextCardiovascularProfessional(professional);

  const currentStatus = calculateFollowUpStatus(nextCvControlDate);
  const hasExistingControl = !!lastCvControlDate;

  const hasDM2 = diagnoses?.includes('diabetes_tipo2') ?? false;
  const exams = getAllExams(lastLabReviewDate, lastEcgDate, lastFundoscopyDate, hasDM2, retinopathy);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      const patientUpdate: Record<string, any> = {
        cardiovascular_risk: calculatedRisk,
        last_cv_control_date: formatDate(controlDate),
        last_cv_control_professional: professional,
        next_cv_control_date: formatDate(nextDate),
        next_cv_control_professional: nextProfessional,
        last_cv_control_notes: notes || null,
        cv_followup_status: calculateFollowUpStatus(formatDate(nextDate)),
        show_exam_reminder: examReminder,
        last_ecg_date: ecgDate ? formatDate(ecgDate) : null,
        last_fundoscopy_date: fundoscopyDate ? formatDate(fundoscopyDate) : null,
        last_lab_review_date: labDate ? formatDate(labDate) : null,
        manual_override_next_control: editingNextControl,
        manual_override_reason: editingNextControl ? overrideReason : null,
        has_diabetic_retinopathy: retinopathy,
        show_exam_dates_to_patient: showExamToPatient,
      };
      const { error: patientError } = await supabase.from('patients').update(patientUpdate).eq('id', patientId);
      if (patientError) throw patientError;

      const { error: historyError } = await supabase.from('cardiovascular_controls').insert({
        patient_id: patientId,
        control_date: formatDate(controlDate),
        professional,
        cardiovascular_risk: calculatedRisk,
        next_control_date: formatDate(nextDate),
        next_control_professional: nextProfessional,
        notes: notes || null,
        event_type: editingNextControl ? 'cardiovascular_followup_overridden' : 'cardiovascular_control_recorded',
        manual_override: editingNextControl,
        manual_override_reason: editingNextControl ? overrideReason : null,
        created_by: user.id,
      });
      if (historyError) throw historyError;

      toast({ title: 'Control cardiovascular registrado' });
      await logAudit({
        patientId: patientId,
        entityType: 'cardiovascular_control',
        actionType: hasExistingControl ? 'update' : 'create',
        description: `Registró control cardiovascular (RCV: ${CV_RISK_LABELS[calculatedRisk]}, profesional: ${CV_PROFESSIONAL_LABELS[professional]})`,
      });
      setIsCV(false);
      onSaved();
    } catch (error) {
      console.error('Error saving CV control:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el control', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExamsOnly = async () => {
    setSaving(true);
    try {
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      const { error } = await supabase.from('patients').update({
        show_exam_reminder: examReminder,
        last_ecg_date: ecgDate ? formatDate(ecgDate) : null,
        last_fundoscopy_date: fundoscopyDate ? formatDate(fundoscopyDate) : null,
        last_lab_review_date: labDate ? formatDate(labDate) : null,
        has_diabetic_retinopathy: retinopathy,
        show_exam_dates_to_patient: showExamToPatient,
      }).eq('id', patientId);
      if (error) throw error;
      toast({ title: 'Exámenes actualizados' });
      onSaved();
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card ref={sectionRef} className="border-primary/20">
      {/* Collapsible Header with Toggle */}
      <div className="flex items-center gap-2 p-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <HeartPulse className="h-5 w-5 text-primary shrink-0" />
          <span className="text-base font-semibold">Control Cardiovascular</span>
          <Badge className={CV_RISK_COLORS[calculatedRisk]} variant="secondary">
            {CV_RISK_LABELS[calculatedRisk]}
          </Badge>
          {hasExistingControl && (
            <Badge className={CV_STATUS_COLORS[currentStatus]} variant="secondary">
              {CV_STATUS_LABELS[currentStatus]}
            </Badge>
          )}
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          )}
        </button>
        <Switch
          checked={isCV}
          onCheckedChange={setIsCV}
          aria-label="Marcar como control cardiovascular"
        />
      </div>

      {!collapsed && (
        <CardContent className="space-y-4 pt-0">
          {/* Previous control info */}
          {hasExistingControl && (
            <div className={cn(
              'p-3 rounded-lg border text-sm space-y-1',
              currentStatus === 'al_dia' ? 'bg-success/10 border-success/30' :
              currentStatus === 'proximo_cercano' ? 'bg-warning/10 border-warning/30' :
              'bg-destructive/10 border-destructive/30'
            )}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-medium">
                  Último control con {CV_PROFESSIONAL_LABELS[lastCvControlProfessional as CVProfessional] || lastCvControlProfessional} el {formatDateES(lastCvControlDate)}
                </span>
                <Badge className={CV_STATUS_COLORS[currentStatus]}>
                  {CV_STATUS_LABELS[currentStatus]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={CV_RISK_COLORS[cardiovascularRisk as CardiovascularRisk || 'bajo']}>
                  RCV: {CV_RISK_LABELS[cardiovascularRisk as CardiovascularRisk || 'bajo']}
                </Badge>
                <span className="text-muted-foreground">
                  Próximo con {CV_PROFESSIONAL_LABELS[nextCvControlProfessional as CVProfessional] || nextCvControlProfessional}: {formatDateES(nextCvControlDate)}
                </span>
              </div>
              {lastCvControlNotes && (
                <p className="text-xs text-muted-foreground italic">📝 {lastCvControlNotes}</p>
              )}
            </div>
          )}

          {/* CV Control Fields — only when toggle is ON */}
          {isCV && (
            <div className="space-y-4">
              {/* Professional & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Profesional</Label>
                  <Select value={professional} onValueChange={(v) => setProfessional(v as CVProfessional)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medico">Médico/a</SelectItem>
                      <SelectItem value="enfermera">Enfermero/a</SelectItem>
                      <SelectItem value="nutricionista">Nutricionista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Fecha del control</Label>
                  <DateInputWithCalendar
                    value={controlDate}
                    onChange={(d) => d && setControlDate(d)}
                    label="Fecha"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-sm">Observaciones</Label>
                <Textarea
                  placeholder="Observaciones opcionales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[50px]"
                />
              </div>

              {/* Next Control Box with inline edit */}
              <div className="p-3 bg-accent/30 rounded-lg space-y-2 text-sm relative">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Próximo control:</p>
                  <Button
                    variant={editingNextControl ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingNextControl(!editingNextControl)}
                    title="Editar próximo control manualmente"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {!editingNextControl ? (
                  <p>📅 {formatDateES(nextDate)} con {CV_PROFESSIONAL_LABELS[nextProfessional]}</p>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Fecha</Label>
                        <DateInputWithCalendar
                          value={manualNextDate}
                          onChange={setManualNextDate}
                          label="Próximo"
                          size="sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Profesional</Label>
                        <Select value={manualNextProfessional} onValueChange={(v) => setManualNextProfessional(v as CVProfessional)}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medico">Médico/a</SelectItem>
                            <SelectItem value="enfermera">Enfermero/a</SelectItem>
                            <SelectItem value="nutricionista">Nutricionista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Motivo de edición</Label>
                      <Select value={overrideReason} onValueChange={setOverrideReason}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Seleccionar motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {OVERRIDE_REASONS.map(reason => (
                            <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Exam Tracking Section */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Vigencia de Exámenes
            </Label>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Laboratorio:</span>
                  <Badge className={EXAM_STATUS_COLORS[exams[0]?.status || 'sin_registro']} variant="secondary">
                    {EXAM_STATUS_LABELS[exams[0]?.status || 'sin_registro']}
                  </Badge>
                </div>
                <DateInputWithCalendar value={labDate} onChange={setLabDate} label="Lab" size="sm" />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">ECG:</span>
                  <Badge className={EXAM_STATUS_COLORS[exams[1]?.status || 'sin_registro']} variant="secondary">
                    {EXAM_STATUS_LABELS[exams[1]?.status || 'sin_registro']}
                  </Badge>
                </div>
                <DateInputWithCalendar value={ecgDate} onChange={setEcgDate} label="ECG" size="sm" />
              </div>

              {hasDM2 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Fondo de ojo:</span>
                    <Badge className={EXAM_STATUS_COLORS[exams.find(e => e.name === 'Fondo de ojo')?.status || 'sin_registro']} variant="secondary">
                      {EXAM_STATUS_LABELS[exams.find(e => e.name === 'Fondo de ojo')?.status || 'sin_registro']}
                    </Badge>
                  </div>
                  <DateInputWithCalendar value={fundoscopyDate} onChange={setFundoscopyDate} label="Fondo" size="sm" />
                </div>
              )}

              {hasDM2 && (
                <div className="flex items-center justify-between text-sm">
                  <Label className="text-xs text-warning italic">⚠️ Paciente con DM2</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Retinopatía diabética</Label>
                    <Switch checked={retinopathy} onCheckedChange={setRetinopathy} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Mostrar recordatorio al paciente</Label>
              <Switch checked={examReminder} onCheckedChange={setExamReminder} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Mostrar fechas de exámenes al paciente</Label>
              <Switch checked={showExamToPatient} onCheckedChange={setShowExamToPatient} />
            </div>
          </div>

          {/* Single unified save button */}
          <Button
            onClick={isCV ? handleSave : handleSaveExamsOnly}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Guardando...' : 'Actualizar registro'}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}