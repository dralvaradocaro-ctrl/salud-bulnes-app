import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Button } from '@/medispense/components/ui/button';
import { Badge } from '@/medispense/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/medispense/components/ui/tooltip';
import { ArrowLeft, Plus, Clock, Pill, Calendar, QrCode, User, Printer, Info, ChevronDown, ChevronUp, Pencil, BookOpen, Trash2, HeartPulse, ExternalLink, Sunrise, Sun, Sunset, Moon, type LucideIcon } from 'lucide-react';
import { routes } from '@/medispense/lib/routes';
import { QRCodeSVG } from 'qrcode.react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/medispense/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/medispense/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/medispense/components/ui/alert-dialog";
import { supabase } from '@/medispense/integrations/supabase/client';
import { PrescriptionActions } from '@/medispense/components/prescription/PrescriptionActions';
import { EditPatientDialog } from '@/medispense/components/patient/EditPatientDialog';
import { useToast } from '@/medispense/hooks/use-toast';
import { cn } from '@/medispense/lib/utils';
import { DIAGNOSIS_LABELS } from '@/medispense/lib/diagnosis-options';
import { RiskWarnings } from '@/medispense/components/prescription/RiskWarnings';
import { useUserRole } from '@/medispense/hooks/useUserRole';
import { CardiovascularControlSection } from '@/medispense/components/cardiovascular/CardiovascularControlSection';
import {
  shouldDefaultToCardiovascularProgram,
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
import { Switch } from '@/medispense/components/ui/switch';
import { Label } from '@/medispense/components/ui/label';
import { useAuth } from '@/medispense/contexts/AuthContext';
import { logAudit } from '@/medispense/lib/audit';
import { AuditHistory } from '@/medispense/components/patient-portal/AuditHistory';

const DAY_DISPLAY = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'];
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const getDayOfWeekIndex = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const isWeeklyMed = (frequency: string): boolean => {
  return frequency?.includes('7d') || frequency?.includes('semanal') || false;
};

const formatTablets = (tablets: number): string => {
  if (tablets === 0.5) return '½';
  if (tablets === 1.5) return '1½';
  if (Number.isInteger(tablets)) return tablets.toString();
  return tablets.toString();
};

const getWeeklyDoseForDay = (fractionation: string | null, dayIndex: number): number => {
  if (!fractionation) return 1;
  const parts = fractionation.split('-').map(Number);
  return parts[dayIndex] ?? 0;
};

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  age: number | null;
  diagnoses: string[] | null;
  email: string | null;
  phone: string | null;
  education_tools?: string[] | null;
  cardiovascular_risk?: string | null;
  last_cv_control_date?: string | null;
  last_cv_control_professional?: string | null;
  next_cv_control_date?: string | null;
  next_cv_control_professional?: string | null;
  last_cv_control_notes?: string | null;
  cv_followup_status?: string | null;
  show_exam_reminder?: boolean;
  last_ecg_date?: string | null;
  last_fundoscopy_date?: string | null;
  last_lab_review_date?: string | null;
  manual_override_next_control?: boolean;
  manual_override_reason?: string | null;
  has_diabetic_retinopathy?: boolean;
  show_exam_dates_to_patient?: boolean;
  is_cardiovascular_program?: boolean;
}

interface PrescriptionItem {
  id: string;
  medication_name: string;
  medication_id: string | null;
  prescribed_dose: number;
  prescribed_unit: string;
  frequency: string;
  schedule: string[] | null;
  ai_description: string | null;
  fractionation: string | null;
  is_annulled: boolean;
  is_sos: boolean;
  sos_reason: string | null;
}

interface Prescription {
  id: string;
  issue_date: string;
  expiry_date: string;
  notes: string | null;
  items: PrescriptionItem[];
}

type CalendarSlot = 'Mañana' | 'Mediodía' | 'Tarde' | 'Noche';

interface PrintableDailyMed {
  uid: string;
  medicationName: string;
  doseText: string | null;
  frequency: string;
  time: string;
  slot: CalendarSlot;
}

interface WeeklyMedicationNote {
  uid: string;
  medicationName: string;
  day: string;
  doseText: string;
  frequency: string;
}

interface SosMedicationNote {
  uid: string;
  medicationName: string;
  doseText: string;
  frequencyText: string;
  reason: string | null;
}

const CALENDAR_SLOTS: { id: CalendarSlot; label: string; range: string; icon: LucideIcon; printIcon: string }[] = [
  { id: 'Mañana', label: 'Mañana', range: '06:00 - 11:59', icon: Sunrise, printIcon: '☀' },
  { id: 'Mediodía', label: 'Mediodía', range: '12:00 - 15:59', icon: Sun, printIcon: '◎' },
  { id: 'Tarde', label: 'Tarde', range: '16:00 - 19:59', icon: Sunset, printIcon: '◒' },
  { id: 'Noche', label: 'Noche', range: '20:00 - 05:59', icon: Moon, printIcon: '☾' },
];

const isDailyCalendarMed = (frequency: string): boolean => {
  const value = (frequency || '').toLowerCase();
  if (isWeeklyMed(value)) return false;
  if (value.includes('48h') || value.includes('48 h') || value.includes('cada 2')) return false;
  return ['c/6h', 'c/8h', 'c/12h', 'c/24h', 'bid', 'tid', 'qid', 'diario', 'día', 'dia'].some((token) => value.includes(token));
};

const getSlotForTime = (time: string): CalendarSlot => {
  const hour = Number.parseInt((time || '08:00').split(':')[0] || '8', 10);
  if (hour >= 6 && hour < 12) return 'Mañana';
  if (hour >= 12 && hour < 16) return 'Mediodía';
  if (hour >= 16 && hour < 20) return 'Tarde';
  return 'Noche';
};

const getMedicationDoseText = (item: PrescriptionItem, overrideDose?: string | number | null): string | null => {
  if (overrideDose !== undefined && overrideDose !== null && `${overrideDose}` !== '') {
    return `${overrideDose} UI`;
  }
  const isInsulin = item.medication_name.toLowerCase().includes('insulina') || item.medication_name.toLowerCase().includes('nph');
  if (isInsulin) return `${item.prescribed_dose} UI`;
  const tabletMatch = item.ai_description?.match(/(½|¼|¾|\d+½|\d+(?:\.\d+)?)\s*(?:comprimidos?|cápsulas?|capsulas?|tabletas?|comp\.?)/i);
  if (tabletMatch) return `${tabletMatch[1]} comp.`;
  if (item.prescribed_dose && item.prescribed_unit) return `${item.prescribed_dose}${item.prescribed_unit}`;
  return null;
};

const normalizeMedicationText = (value: string | null | undefined): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getLogicalSosMedicationText = (item: PrescriptionItem): { doseText: string; frequencyText: string } => {
  const name = normalizeMedicationText(item.medication_name);
  const baseDose = getMedicationDoseText(item) || `${item.prescribed_dose}${item.prescribed_unit}`;

  if (name.includes('paracetamol') && item.prescribed_unit?.toLowerCase() === 'mg' && item.prescribed_dose <= 500) {
    return { doseText: '2 comp.', frequencyText: 'cada 8 horas' };
  }

  if (name.includes('celecoxib')) {
    return { doseText: '1 comp.', frequencyText: 'cada 24 horas' };
  }

  return { doseText: baseDose, frequencyText: formatFrequencyText(item.frequency) };
};

const formatFrequencyText = (frequency: string): string => {
  const value = (frequency || '').toLowerCase();
  if (value.includes('c/6h')) return 'cada 6 horas';
  if (value.includes('c/8h')) return 'cada 8 horas';
  if (value.includes('c/12h')) return 'cada 12 horas';
  if (value.includes('c/24h')) return 'cada 24 horas';
  if (value.includes('c/48h')) return 'cada 48 horas';
  if (value.includes('c/7d') || value.includes('semanal')) return 'semanal';
  return frequency;
};

const buildPrintableDailyMeds = (prescriptions: Prescription[]): PrintableDailyMed[] => {
  return prescriptions.flatMap((prescription) =>
    prescription.items
      .filter((item) => !item.is_annulled && !item.is_sos && isDailyCalendarMed(item.frequency))
      .flatMap((item) => {
        const isInsulin = item.medication_name.toLowerCase().includes('insulina') || item.medication_name.toLowerCase().includes('nph');
        const schedule = item.schedule?.length ? item.schedule : ['08:00'];

        if (isInsulin && item.fractionation && schedule.length >= 2) {
          const parts = item.fractionation.split('-').map(Number);
          if (parts.length >= 2 && parts.every((part) => !Number.isNaN(part))) {
            return schedule.map((time, idx) => ({
              uid: `${item.id}-${time}-${idx}`,
              medicationName: item.medication_name,
              doseText: getMedicationDoseText(item, parts[idx] ?? parts[0]),
              frequency: item.frequency,
              time,
              slot: getSlotForTime(time),
            }));
          }
        }

        return schedule.map((time, idx) => ({
          uid: `${item.id}-${time}-${idx}`,
          medicationName: item.medication_name,
          doseText: getMedicationDoseText(item),
          frequency: item.frequency,
          time,
          slot: getSlotForTime(time),
        }));
      })
  );
};

const buildWeeklyMedicationNotes = (prescriptions: Prescription[]): WeeklyMedicationNote[] => {
  return prescriptions.flatMap((prescription) =>
    prescription.items
      .filter((item) => !item.is_annulled && !item.is_sos && isWeeklyMed(item.frequency))
      .flatMap((item) =>
        DAY_FULL.map((day, dayIndex) => {
          const dose = getWeeklyDoseForDay(item.fractionation, dayIndex);
          if (dose <= 0) return null;
          return {
            uid: `${item.id}-${dayIndex}`,
            medicationName: item.medication_name,
            day,
            doseText: `${formatTablets(dose)} comp.`,
            frequency: item.frequency,
          };
        }).filter(Boolean) as WeeklyMedicationNote[]
      )
  );
};

const buildSosMedicationNotes = (prescriptions: Prescription[]): SosMedicationNote[] => {
  return prescriptions.flatMap((prescription) =>
    prescription.items
      .filter((item) => !item.is_annulled && item.is_sos)
      .map((item) => {
        const logical = getLogicalSosMedicationText(item);
        return {
          uid: item.id,
          medicationName: item.medication_name,
          doseText: logical.doseText,
          frequencyText: logical.frequencyText,
          reason: item.sos_reason,
        };
      })
  );
};

function PrintableMedicationCalendarDialog({
  open,
  onOpenChange,
  patient,
  dailyMeds,
  weeklyNotes,
  sosNotes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  dailyMeds: PrintableDailyMed[];
  weeklyNotes: WeeklyMedicationNote[];
  sosNotes: SosMedicationNote[];
}) {
  const [items, setItems] = useState<PrintableDailyMed[]>(dailyMeds);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setItems(dailyMeds);
      setSelectedUid(null);
    }
  }, [open]);

  const moveItemToSlot = (uid: string, slot: CalendarSlot) => {
    setItems((current) => current.map((item) => item.uid === uid ? { ...item, slot } : item));
    setSelectedUid(null);
  };

  const handlePrint = () => {
    const html = buildCalendarPrintHtml(patient, items, weeklyNotes, sosNotes);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-6xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendario imprimible de medicamentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
            <div>
              <p className="text-sm font-semibold">{patient.full_name}</p>
              <p className="text-xs text-muted-foreground">ID: {patient.patient_code} · Solo medicamentos diarios</p>
            </div>
            <Button onClick={handlePrint} disabled={items.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Para editar: arrastra un medicamento a otro bloque horario. En móvil también puedes tocar un medicamento y luego tocar el bloque destino.
          </p>

          <div id="printable-med-calendar" className="rounded-xl border bg-white">
            <div className="grid gap-0 md:grid-cols-4">
              {CALENDAR_SLOTS.map((slot) => (
                (() => {
                  const SlotIcon = slot.icon;
                  return (
                    <section
                      key={slot.id}
                      className={cn(
                        'min-h-[260px] border-b p-3 md:border-b-0 md:border-r md:last:border-r-0',
                        selectedUid && 'bg-primary/5'
                      )}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        const uid = event.dataTransfer.getData('text/plain');
                        if (uid) moveItemToSlot(uid, slot.id);
                      }}
                      onClick={() => selectedUid && moveItemToSlot(selectedUid, slot.id)}
                    >
                      <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                          <SlotIcon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-base font-bold text-slate-900">{slot.label}</p>
                          <p className="text-xs text-slate-500">{slot.range}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {items.filter((item) => item.slot === slot.id).map((item) => (
                          <button
                            key={item.uid}
                            draggable
                            onDragStart={(event) => event.dataTransfer.setData('text/plain', item.uid)}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedUid((current) => current === item.uid ? null : item.uid);
                            }}
                            className={cn(
                              'w-full rounded-lg border px-3 py-2.5 text-left text-sm leading-tight shadow-sm transition',
                              selectedUid === item.uid
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-blue-100 bg-blue-50 text-blue-950 hover:border-primary/60'
                            )}
                          >
                            <span className="block font-semibold">{item.medicationName}</span>
                            <span className="text-xs opacity-80">{item.doseText || item.frequency}</span>
                          </button>
                        ))}
                        {items.filter((item) => item.slot === slot.id).length === 0 && (
                          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                            Sin medicamentos diarios
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })()
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-amber-50 p-3">
            <p className="mb-2 text-sm font-bold text-amber-950">Medicamentos fuera del calendario diario</p>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-900">Semanales</p>
                {weeklyNotes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {weeklyNotes.map((note) => (
                      <Badge key={note.uid} variant="outline" className="border-amber-300 bg-white text-amber-950">
                        {note.medicationName}: {note.doseText} · {note.day}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-900/80">No hay medicamentos semanales activos.</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-900">SOS / a demanda</p>
                {sosNotes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sosNotes.map((note) => (
                      <Badge key={note.uid} variant="outline" className="border-amber-300 bg-white text-amber-950">
                        {note.medicationName}: {note.doseText} · {note.frequencyText}{note.reason ? ` · ${note.reason}` : ''}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-900/80">No hay medicamentos SOS activos.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildCalendarPrintHtml(
  patient: Patient,
  items: PrintableDailyMed[],
  weeklyNotes: WeeklyMedicationNote[],
  sosNotes: SosMedicationNote[]
) {
  const medForSlot = (slot: CalendarSlot) => items.filter((item) => item.slot === slot);
  const weeklyHtml = weeklyNotes.length
    ? weeklyNotes.map((note) => `<span class="weekly">${note.medicationName}: ${note.doseText} · ${note.day}</span>`).join('')
    : '<span class="muted">Sin medicamentos semanales activos.</span>';
  const sosHtml = sosNotes.length
    ? sosNotes.map((note) => `<span class="weekly">${note.medicationName}: ${note.doseText} · ${note.frequencyText}${note.reason ? ` · ${note.reason}` : ''}</span>`).join('')
    : '<span class="muted">Sin medicamentos SOS activos.</span>';

  return `
    <html>
      <head>
        <title>Calendario medicamentos - ${patient.patient_code}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
          .header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 8px; }
          h1 { margin: 0; font-size: 18px; }
          .meta { font-size: 11px; color: #475569; margin-top: 2px; }
          .tag { border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 8px; font-size: 10px; color: #334155; white-space: nowrap; }
          .day-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; }
          .slot { min-height: 128mm; border-right: 1px solid #cbd5e1; padding: 8px; }
          .slot:last-child { border-right: 0; }
          .slot-head { background: #f1f5f9; border-radius: 8px; padding: 8px; margin-bottom: 8px; display: flex; gap: 8px; align-items: center; }
          .slot-icon { width: 24px; height: 24px; border-radius: 999px; background: #fff; border: 1px solid #cbd5e1; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; color: #2563eb; flex: 0 0 auto; }
          .slot-title { font-weight: 700; font-size: 15px; }
          .slot-range { color: #64748b; font-size: 10px; margin-top: 2px; }
          .med { border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 8px; padding: 8px; margin-bottom: 7px; break-inside: avoid; }
          .med-name { display: block; font-weight: 700; font-size: 13px; line-height: 1.2; }
          .med-dose { display: block; color: #334155; font-size: 11px; margin-top: 3px; }
          .empty { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; color: #64748b; font-size: 11px; text-align: center; }
          .weekly-box { margin-top: 8px; border: 1px solid #fcd34d; background: #fffbeb; border-radius: 8px; padding: 7px; }
          .weekly-title { margin: 0 0 5px; font-weight: 700; font-size: 11px; }
          .weekly-subtitle { margin: 5px 0 3px; font-weight: 700; font-size: 9px; text-transform: uppercase; color: #92400e; }
          .weekly { display: inline-block; border: 1px solid #fbbf24; background: white; border-radius: 999px; padding: 3px 7px; margin: 2px; font-size: 10px; }
          .muted { color: #64748b; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Calendario diario de medicamentos</h1>
            <div class="meta">${patient.full_name} · ID ${patient.patient_code}${patient.age ? ` · ${patient.age} años` : ''}</div>
          </div>
          <div class="tag">Solo medicamentos diarios</div>
        </div>
        <div class="day-grid">
          ${CALENDAR_SLOTS.map((slot) => {
            const meds = medForSlot(slot.id);
            return `
              <section class="slot">
                <div class="slot-head">
                  <span class="slot-icon">${slot.printIcon}</span>
                  <div>
                    <div class="slot-title">${slot.label}</div>
                    <div class="slot-range">${slot.range}</div>
                  </div>
                </div>
                ${meds.length > 0 ? meds.map((item) => `
                  <div class="med">
                    <span class="med-name">${item.medicationName}</span>
                    <span class="med-dose">${item.doseText || item.frequency}</span>
                  </div>
                `).join('') : '<div class="empty">Sin medicamentos diarios</div>'}
              </section>
            `;
          }).join('')}
        </div>
        <div class="weekly-box">
          <p class="weekly-title">Medicamentos fuera del calendario diario</p>
          <p class="weekly-subtitle">Semanales</p>
          ${weeklyHtml}
          <p class="weekly-subtitle">SOS / a demanda</p>
          ${sosHtml}
        </div>
      </body>
    </html>
  `;
}

export default function PatientDetail() {
  const { canDelete, role } = useUserRole();
  const { user } = useAuth();
  const { patientCode } = useParams<{ patientCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(getDayOfWeekIndex(new Date()));
  const [showArchived, setShowArchived] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [educationPages, setEducationPages] = useState<{ id: string; title: string }[]>([]);
  const [showEduQR, setShowEduQR] = useState<{ id: string; title: string } | null>(null);
  const [showDeletePatient, setShowDeletePatient] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);
  const [renewingPrescription, setRenewingPrescription] = useState(false);
  const [showPscvModal, setShowPscvModal] = useState(false);
  const [showMedicationCalendar, setShowMedicationCalendar] = useState(false);

  // Use sessionStorage to persist PSCV modal state across navigations within the same session
  const pscvSessionKey = `pscv_shown_${patientCode}`;
  const cvControlSessionKey = `cv_control_${patientCode}`;
  const [pscvModalShown, setPscvModalShown] = useState(() => {
    return sessionStorage.getItem(pscvSessionKey) === 'true';
  });
  const [isThisCvControl, setIsThisCvControl] = useState<boolean | null>(() => {
    const stored = sessionStorage.getItem(cvControlSessionKey);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return null;
  });

  useEffect(() => {
    if (patientCode) fetchPatientData();
  }, [patientCode]);

  // Show PSCV confirmation modal when opening a PSCV patient
  useEffect(() => {
    if (patient && !loading && !pscvModalShown) {
      const isInPSCV = patient.is_cardiovascular_program ?? shouldDefaultToCardiovascularProgram(patient.diagnoses);
      if (isInPSCV) {
        setShowPscvModal(true);
        setPscvModalShown(true);
        sessionStorage.setItem(pscvSessionKey, 'true');
      }
    }
  }, [patient, loading]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_code', patientCode)
        .single();

      if (patientError || !patientData) {
        setPatient(null);
        setLoading(false);
        return;
      }

      setPatient(patientData as Patient);

      // Fetch education pages assigned to this patient
      if (patientData.education_tools && (patientData.education_tools as string[]).length > 0) {
        const { data: eduData } = await supabase
          .from('education_pages')
          .select('id, title')
          .in('id', patientData.education_tools as string[]);
        if (eduData) setEducationPages(eduData as { id: string; title: string }[]);
      } else {
        setEducationPages([]);
      }

      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('issue_date', { ascending: false });

      if (prescriptionsData && prescriptionsData.length > 0) {
        const prescriptionsWithItems = await Promise.all(
          prescriptionsData.map(async (prescription) => {
            const { data: items } = await supabase
              .from('prescription_items')
              .select('*')
              .eq('prescription_id', prescription.id);
            
            return {
              ...prescription,
              items: (items || []).map(item => ({
                ...item,
                schedule: item.schedule as string[] | null,
              })),
            };
          })
        );
        setPrescriptions(prescriptionsWithItems);
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setPatient(null);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPatientPortalUrl = () => `${window.location.origin}${routes.portal(patientCode!)}`;

  const handleDeletePatient = async () => {
    if (!patient) return;
    setDeletingPatient(true);
    try {
      // Delete prescription items for all prescriptions
      const prescriptionIds = prescriptions.map(p => p.id);
      if (prescriptionIds.length > 0) {
        await supabase.from('prescription_items').delete().in('prescription_id', prescriptionIds);
        await supabase.from('prescriptions').delete().eq('patient_id', patient.id);
      }
      // Delete notifications
      await supabase.from('patient_notifications').delete().eq('patient_id', patient.id);
      // Delete patient
      const { error } = await supabase.from('patients').delete().eq('id', patient.id);
      if (error) throw error;
      await logAudit({
        patientId: patient.id,
        patientCode: patient.patient_code,
        entityType: 'patient',
        actionType: 'delete',
        description: `Eliminó paciente ${patient.full_name} (${patient.patient_code})`,
      });
      toast({ title: 'Paciente eliminado' });
      navigate(routes.dashboard());
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el paciente', variant: 'destructive' });
    } finally {
      setDeletingPatient(false);
      setShowDeletePatient(false);
    }
  };

  const handleRenewOnly = async (prescriptionId: string) => {
    if (!patient || !user) return;
    setRenewingPrescription(true);
    try {
      const { data: sourceItems } = await supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', prescriptionId)
        .eq('is_annulled', false);

      if (!sourceItems || sourceItems.length === 0) {
        toast({ title: 'Error', description: 'No hay medicamentos para renovar', variant: 'destructive' });
        return;
      }

      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(expiryDate.getDate() + 365);

      const { data: newPrescription, error: prescError } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patient.id,
          prescribed_by: user.id,
          issue_date: today.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          notes: 'Renovación de receta',
        })
        .select()
        .single();

      if (prescError) throw prescError;

      const newItems = sourceItems.map(item => ({
        prescription_id: newPrescription.id,
        medication_id: item.medication_id,
        medication_name: item.medication_name,
        prescribed_dose: item.prescribed_dose,
        prescribed_unit: item.prescribed_unit,
        frequency: item.frequency,
        duration_days: item.duration_days,
        fractionation: item.fractionation,
        schedule: item.schedule,
        ai_description: item.ai_description,
        is_sos: item.is_sos,
        sos_reason: item.sos_reason,
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(newItems);

      if (itemsError) throw itemsError;

      toast({ title: 'Receta renovada exitosamente' });
      await logAudit({
        patientId: patient.id,
        patientCode: patient.patient_code,
        entityType: 'prescription',
        actionType: 'create',
        description: `Renovó receta con ${sourceItems.length} medicamento(s)`,
      });
      fetchPatientData();
    } catch (error) {
      console.error('Error renewing:', error);
      toast({ title: 'Error', description: 'No se pudo renovar la receta', variant: 'destructive' });
    } finally {
      setRenewingPrescription(false);
    }
  };

  const normalizeMedName = (name: string): string => {
    return name.toLowerCase().replace(/\s*\d+[\.,]?\d*\s*(mg|mcg|ml|ui|g|%)\s*/gi, '').trim();
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse-soft flex flex-col items-center gap-4">
          <Pill className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground">Cargando paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(routes.dashboard())}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Paciente no encontrado</h1>
            <p className="text-muted-foreground">El código {patientCode} no existe</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">¿Deseas crear este paciente?</p>
            <Button onClick={() => navigate(routes.newPatient(patientCode))}>
              <Plus className="h-4 w-4 mr-2" /> Crear Paciente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayDayIndex = getDayOfWeekIndex(new Date());
  const isToday = selectedDayIndex === todayDayIndex;
  const currentHour = new Date().getHours();

  // Prescription groups
  const activePrescriptions = prescriptions.filter(p => getDaysUntilExpiry(p.expiry_date) > 0);
  const recentlyExpiredPrescriptions = prescriptions.filter(p => {
    const d = getDaysUntilExpiry(p.expiry_date);
    return d <= 0 && d > -30;
  });
  const archivedPrescriptions = prescriptions.filter(p => getDaysUntilExpiry(p.expiry_date) <= -30);
  const printableDailyMeds = buildPrintableDailyMeds(activePrescriptions);
  const weeklyMedicationNotes = buildWeeklyMedicationNotes(activePrescriptions);
  const sosMedicationNotes = buildSosMedicationNotes(activePrescriptions);

  // Meds for selected day (only from active prescriptions)
  const allScheduledMeds = activePrescriptions.flatMap(p =>
    p.items.filter(item => {
      if (item.is_annulled) return false;
      if (item.is_sos) return false;
      if (isWeeklyMed(item.frequency)) {
        return getWeeklyDoseForDay(item.fractionation, selectedDayIndex) > 0;
      }
      return true;
    }).flatMap(item => {
      const isInsulin = item.medication_name.toLowerCase().includes('insulina') || item.medication_name.toLowerCase().includes('nph');
      
      // For insulin with AM/PM fractionation, split into separate entries per schedule time
      if (isInsulin && item.fractionation && item.schedule && item.schedule.length >= 2) {
        const parts = item.fractionation.split('-').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return item.schedule.map((time, idx) => ({
            ...item,
            schedule: [time],
            prescriptionExpiry: p.expiry_date,
            displayDose: `${parts[idx] ?? parts[0]} UI`,
          }));
        }
      }

      return [{
        ...item,
        prescriptionExpiry: p.expiry_date,
        displayDose: isWeeklyMed(item.frequency)
          ? `${formatTablets(getWeeklyDoseForDay(item.fractionation, selectedDayIndex))} comp.`
          : isInsulin
            ? `${item.prescribed_dose} UI`
            : (() => {
                const tabletMatch = item.ai_description?.match(/(½|¼|¾|\d+½|\d+(?:\.\d+)?)\s*(?:comprimido|cápsula|tableta)/i);
                if (tabletMatch) {
                  const num = tabletMatch[1];
                  return `${num} comp.`;
                }
                return null;
              })(),
      }];
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(routes.dashboard())}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{patient.full_name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>ID: {patient.patient_code}</span>
              {patient.age && <span>• {patient.age} años</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => setShowDeletePatient(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowEditPatient(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowQR(true)}>
            <QrCode className="h-4 w-4 mr-2" /> Ver QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(routes.portal(patientCode!), '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" /> Ver Portal Paciente
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowMedicationCalendar(true)} disabled={activePrescriptions.length === 0}>
            <Calendar className="h-4 w-4 mr-2" /> Calendario diario
          </Button>
          {educationPages.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" /> Educación ({educationPages.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {educationPages.map((page) => (
                  <DropdownMenuItem key={page.id} onClick={() => setShowEduQR(page)}>
                    <QrCode className="h-3 w-3 mr-2" />
                    {page.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="sm" onClick={() => navigate(routes.newPrescription(patientCode!))}>
            <Plus className="h-4 w-4 mr-2" /> Nueva Receta
          </Button>
        </div>
      </div>

      {/* Diagnoses */}
      {patient.diagnoses && patient.diagnoses.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Diagnósticos:</span>
              {patient.diagnoses.map((d) => (
                <Badge key={d} variant="secondary">{DIAGNOSIS_LABELS[d] || d}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PSCV Card: Toggle + Last Control Info combined */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2 cursor-pointer">
              <HeartPulse className="h-4 w-4 text-primary" />
              Programa Cardiovascular (PSCV)
            </Label>
            <Switch
              checked={patient.is_cardiovascular_program ?? shouldDefaultToCardiovascularProgram(patient.diagnoses)}
              onCheckedChange={async (checked) => {
                await supabase.from('patients').update({ is_cardiovascular_program: checked }).eq('id', patient.id);
                setPatient({ ...patient, is_cardiovascular_program: checked });
                toast({ title: checked ? 'Paciente ingresado al PSCV' : 'Paciente excluido del PSCV' });
              }}
            />
          </div>
          {(patient.is_cardiovascular_program ?? shouldDefaultToCardiovascularProgram(patient.diagnoses)) && patient.last_cv_control_date ? (
            (() => {
              const status = calculateFollowUpStatus(patient.next_cv_control_date || null);
              const risk = (patient.cardiovascular_risk as CardiovascularRisk) || 'bajo';
              const lastProf = CV_PROFESSIONAL_LABELS[(patient.last_cv_control_professional as CVProfessional)] || patient.last_cv_control_professional;
              const nextProf = CV_PROFESSIONAL_LABELS[(patient.next_cv_control_professional as CVProfessional)] || patient.next_cv_control_professional;
              return (
                <div className={cn(
                  'rounded-lg p-3 space-y-1 border-l-4',
                  status === 'al_dia' ? 'border-l-success bg-success/5' :
                  status === 'proximo_cercano' ? 'border-l-warning bg-warning/5' :
                  'border-l-destructive bg-destructive/5'
                )}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">
                      Último control: <strong>{lastProf}</strong> — {formatDateES(patient.last_cv_control_date)}
                    </span>
                    <Badge className={CV_RISK_COLORS[risk]} variant="secondary">
                      RCV: {CV_RISK_LABELS[risk]}
                    </Badge>
                    <Badge className={CV_STATUS_COLORS[status]}>
                      {CV_STATUS_LABELS[status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Próximo control: {nextProf} — {formatDateES(patient.next_cv_control_date)}
                  </p>
                  {patient.last_cv_control_notes && (
                    <p className="text-xs text-muted-foreground italic">📝 {patient.last_cv_control_notes}</p>
                  )}
                </div>
              );
            })()
          ) : !(patient.is_cardiovascular_program ?? shouldDefaultToCardiovascularProgram(patient.diagnoses)) ? (
            <p className="text-xs text-muted-foreground">El paciente no está en el programa cardiovascular.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Risk Warnings - Clinical Safety Alerts */}
      {activePrescriptions.length > 0 && (
        <RiskWarnings
          diagnoses={patient.diagnoses}
          age={patient.age}
          medicationNames={activePrescriptions.flatMap(p => p.items.map(i => i.medication_name))}
        />
      )}

      {/* Cardiovascular Control Section */}
      {(patient.is_cardiovascular_program ?? shouldDefaultToCardiovascularProgram(patient.diagnoses)) && (
          <CardiovascularControlSection
          patientId={patient.id}
          diagnoses={patient.diagnoses}
          lastCvControlDate={patient.last_cv_control_date || null}
          lastCvControlProfessional={patient.last_cv_control_professional || null}
          nextCvControlDate={patient.next_cv_control_date || null}
          nextCvControlProfessional={patient.next_cv_control_professional || null}
          lastCvControlNotes={patient.last_cv_control_notes || null}
          cardiovascularRisk={patient.cardiovascular_risk || null}
          showExamReminder={patient.show_exam_reminder ?? true}
          lastEcgDate={patient.last_ecg_date || null}
          lastFundoscopyDate={patient.last_fundoscopy_date || null}
          lastLabReviewDate={patient.last_lab_review_date || null}
          manualOverrideNextControl={patient.manual_override_next_control ?? false}
          manualOverrideReason={patient.manual_override_reason || null}
          hasDiabeticRetinopathy={patient.has_diabetic_retinopathy ?? false}
          showExamDatesToPatient={patient.show_exam_dates_to_patient ?? true}
          userRole={role}
          isCvControl={isThisCvControl}
          onSaved={fetchPatientData}
        />
      )}

      {/* Audit History */}
      <AuditHistory patientId={patient.id} />

      {/* Education QR Dialog */}
      <Dialog open={!!showEduQR} onOpenChange={(open) => !open && setShowEduQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> {showEduQR?.title}
            </DialogTitle>
          </DialogHeader>
          {showEduQR && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-white rounded-lg" id="edu-qr-print">
                <QRCodeSVG value={`${window.location.origin}/educacion/${showEduQR.id}`} size={200} level="H" includeMargin />
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded break-all text-center">
                {`${window.location.origin}/educacion/${showEduQR.id}`}
              </code>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/educacion/${showEduQR.id}`)}>
                  Copiar enlace
                </Button>
                <Button onClick={() => {
                  const pw = window.open('', '_blank');
                  if (pw) {
                    pw.document.write(`<html><head><title>QR - ${showEduQR.title}</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;"><h2>${showEduQR.title}</h2><p style="color:#666;">Herramienta Educativa</p><div id="qr-container"></div><p style="margin-top:16px;font-size:12px;color:#999;">Escanea con la cámara de tu celular</p></body></html>`);
                    const qrSvg = document.querySelector('#edu-qr-print svg');
                    if (qrSvg) pw.document.getElementById('qr-container')!.innerHTML = qrSvg.outerHTML;
                    pw.document.close();
                    setTimeout(() => { pw.print(); pw.close(); }, 300);
                  }
                }}>
                  <Printer className="h-4 w-4 mr-2" /> Imprimir QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PSCV Confirmation Modal */}
      <AlertDialog open={showPscvModal} onOpenChange={setShowPscvModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-primary" />
              ¿Corresponde a control cardiovascular?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este paciente está en el Programa de Salud Cardiovascular (PSCV). ¿Esta atención corresponde a un control cardiovascular?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsThisCvControl(false);
                sessionStorage.setItem(cvControlSessionKey, 'false');
                toast({
                  title: 'No es control cardiovascular',
                  description: 'Esta atención se ha marcado como no correspondiente a control cardiovascular.',
                });
              }}
            >
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsThisCvControl(true);
                sessionStorage.setItem(cvControlSessionKey, 'true');
                // Record who activated it and when
                const userName = user?.user_metadata?.full_name || user?.email || 'Usuario';
                const now = new Date();
                const formattedDate = now.toLocaleDateString('es-CL');
                const formattedTime = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                toast({
                  title: 'Control cardiovascular activado',
                  description: `Activado por: ${userName} el ${formattedDate} a las ${formattedTime}`,
                });
              }}
            >
              Sí, es control CV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Patient Dialog */}
      <AlertDialog open={showDeletePatient} onOpenChange={setShowDeletePatient}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a {patient.full_name} ({patient.patient_code}) y todas sus recetas asociadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPatient}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={deletingPatient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingPatient ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Patient Dialog */}
      {patient && (
        <EditPatientDialog
          open={showEditPatient}
          onOpenChange={setShowEditPatient}
          patient={patient}
          onSaved={fetchPatientData}
        />
      )}

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Portal del Paciente
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-lg" id="qr-print-source">
              <QRCodeSVG value={getPatientPortalUrl()} size={200} level="H" includeMargin />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                El paciente puede escanear este código para ver su plan
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                {getPatientPortalUrl()}
              </code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(getPatientPortalUrl())}>
                Copiar enlace
              </Button>
              <Button onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html><head><title>QR - ${patient?.patient_code}</title>
                    <style>
                      @page { margin: 10mm; }
                      body { margin: 0; padding: 0; font-family: sans-serif; }
                    </style>
                    </head>
                    <body>
                      <div style="display:flex;align-items:flex-start;gap:12px;">
                        <div id="qr-container"></div>
                        <div style="padding-top:4px;">
                          <p style="margin:0;font-size:14px;font-weight:bold;">Plan de Medicamentos</p>
                          <p style="margin:4px 0;font-size:12px;color:#666;">Código: ${patient?.patient_code}</p>
                          <p style="margin:4px 0;font-size:10px;color:#999;">Escanea con la cámara de tu celular</p>
                        </div>
                      </div>
                    </body></html>
                  `);
                  const qrSvg = document.querySelector('#qr-print-source svg');
                  if (qrSvg) printWindow.document.getElementById('qr-container')!.innerHTML = qrSvg.outerHTML;
                  printWindow.document.close();
                  setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
                }
              }}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      {patient && (
        <PrintableMedicationCalendarDialog
          open={showMedicationCalendar}
          onOpenChange={setShowMedicationCalendar}
          patient={patient}
          dailyMeds={printableDailyMeds}
          weeklyNotes={weeklyMedicationNotes}
          sosNotes={sosMedicationNotes}
        />
      )}

      {prescriptions.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Timeline with day selector */}
          <Card className="order-2 lg:order-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Cronograma
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left" side="left">
                    <p className="font-semibold mb-1">Horarios Referenciales</p>
                    <p className="text-xs leading-relaxed">La posología y horarios indicados son referenciales. En casos de discrepancia, respete siempre la indicación del médico tratante.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>{DAY_FULL[selectedDayIndex]} {isToday ? '(Hoy)' : ''}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Day selector */}
              <div className="flex justify-center gap-1 mb-4">
                {DAY_DISPLAY.map((label, i) => (
                  <Button
                    key={i}
                    variant={selectedDayIndex === i ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "w-9 h-9 p-0 rounded-full text-xs font-medium",
                      i === todayDayIndex && selectedDayIndex !== i && "border-primary/50"
                    )}
                    onClick={() => setSelectedDayIndex(i)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              <div className="relative max-h-[50vh] overflow-y-auto">
                <div className="space-y-0.5">
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                    const isCurrentHour = isToday && hour === currentHour;
                    const isPast = isToday && hour < currentHour;
                    const medications = allScheduledMeds.filter(item =>
                      item.schedule?.some(s => parseInt(s.split(':')[0]) === hour)
                    );

                    return (
                      <div key={hour} className="relative">
                        {isCurrentHour && (
                          <div className="absolute -left-2 right-0 h-0.5 bg-destructive z-10 flex items-center">
                            <Badge variant="destructive" className="absolute -left-1 text-[10px] px-1 py-0">AHORA</Badge>
                          </div>
                        )}
                        <div className={`flex items-start gap-3 py-1.5 px-2 rounded-lg transition-colors ${
                          isCurrentHour ? 'bg-warning/10' : medications.length > 0 ? 'bg-accent/50' : ''
                        }`}>
                          <span className={`text-xs font-mono w-11 shrink-0 pt-0.5 ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {hour.toString().padStart(2, '0')}:00
                          </span>
                          <div className="flex-1 flex flex-wrap gap-1">
                            {medications.map((med, idx) => (
                              <Badge
                                key={idx}
                                className={`text-xs ${
                                  isCurrentHour
                                    ? 'bg-warning text-warning-foreground'
                                    : isPast
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-success text-success-foreground'
                                }`}
                              >
                                <Pill className="h-3 w-3 mr-1" />
                                {med.medication_name}
                                {med.displayDose && ` (${med.displayDose})`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Prescriptions */}
          <div className="space-y-4 order-1 lg:order-2">
            {[...activePrescriptions, ...recentlyExpiredPrescriptions].map((prescription) => {
              const daysUntilExpiry = getDaysUntilExpiry(prescription.expiry_date);
              const isExpired = daysUntilExpiry <= 0;

              return (
                <Card key={prescription.id} className={isExpired ? 'opacity-70 border-destructive/40' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Receta del {new Date(prescription.issue_date).toLocaleDateString('es-CL')}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`font-semibold text-xs ${
                            daysUntilExpiry <= 0
                              ? 'bg-destructive text-destructive-foreground'
                              : daysUntilExpiry <= 7
                              ? 'bg-destructive text-destructive-foreground'
                              : daysUntilExpiry <= 30
                              ? 'bg-warning text-warning-foreground'
                              : 'bg-success text-success-foreground'
                          }`}
                        >
                          {daysUntilExpiry <= 0 ? '⚠️ VENCIDA' : daysUntilExpiry <= 7 ? `⚠️ ${daysUntilExpiry}d` : `${daysUntilExpiry}d`}
                        </Badge>
                        <PrescriptionActions
                          prescriptionId={prescription.id}
                          prescriptionDate={prescription.issue_date}
                          onDeleted={() => fetchPatientData()}
                          onEdit={() => navigate(routes.editPrescription(patientCode!, prescription.id))}
                          onRenewOnly={() => handleRenewOnly(prescription.id)}
                          onRenewAndEdit={() => navigate(routes.renewPrescription(patientCode!, prescription.id))}
                          canDelete
                        />
                      </div>
                    </div>
                    <CardDescription>
                      Válida hasta: {new Date(prescription.expiry_date).toLocaleDateString('es-CL')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {prescription.items.filter(i => !i.is_annulled).length > 0 ? (
                      <>
                        {prescription.items.filter(i => !i.is_annulled).map((item) => (
                          <div key={item.id} className="p-3 rounded-lg border bg-card">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                              <h4 className="font-semibold flex items-center gap-1 text-sm">
                                  <Pill className="h-4 w-4 text-primary shrink-0" />
                                  {item.medication_name}
                                  {item.is_sos && (
                                    <Badge className="text-[10px] bg-warning text-warning-foreground font-semibold ml-1">
                                      🆘 SOS{item.sos_reason ? `: ${item.sos_reason}` : ''}
                                    </Badge>
                                  )}
                                </h4>
                                {item.ai_description && (
                                  <p className="text-xs text-muted-foreground mt-1 ml-5">{item.ai_description}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">{item.prescribed_dose}{item.prescribed_unit}</Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-2 flex-wrap ml-5">
                              <span className="text-xs text-muted-foreground">{item.frequency}:</span>
                              {item.schedule?.map((time, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{time}</Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                        {prescription.items.filter(i => i.is_annulled).length > 0 && (
                          <div className="pt-1">
                            <p className="text-xs text-muted-foreground mb-1">Medicamentos anulados (reemplazados por nueva receta):</p>
                            {prescription.items.filter(i => i.is_annulled).map((item) => (
                              <div key={item.id} className="p-2 rounded border border-dashed border-muted opacity-50">
                                <p className="text-xs text-muted-foreground line-through flex items-center gap-1">
                                  <Pill className="h-3 w-3" />
                                  {item.medication_name} · {item.frequency}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No hay medicamentos en esta receta</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Archived prescriptions */}
            {archivedPrescriptions.length > 0 && (
              <div className="space-y-2">
                <button
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  <span>Recetas Antiguas ({archivedPrescriptions.length}) — vencidas hace +30 días</span>
                </button>
                {showArchived && (
                  <div className="space-y-2 opacity-50">
                    {archivedPrescriptions.map((prescription) => (
                      <Card key={prescription.id} className="border-muted">
                        <CardHeader className="pb-1 pt-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xs text-muted-foreground">
                              Receta del {new Date(prescription.issue_date).toLocaleDateString('es-CL')}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px]">Archivada</Badge>
                              <PrescriptionActions
                                prescriptionId={prescription.id}
                                prescriptionDate={prescription.issue_date}
                                onDeleted={() => fetchPatientData()}
                                onEdit={() => navigate(routes.editPrescription(patientCode!, prescription.id))}
                                canDelete
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-1 pb-3">
                          {prescription.items.map(item => (
                            <p key={item.id} className="text-xs text-muted-foreground flex items-center gap-1">
                              <Pill className="h-3 w-3" />{item.medication_name} · {item.frequency}
                            </p>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Sin prescripciones</h3>
            <p className="text-muted-foreground mb-4">Este paciente no tiene recetas</p>
            <Button onClick={() => navigate(routes.newPrescription(patientCode!))}>
              <Plus className="h-4 w-4 mr-2" /> Agregar Primera Receta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
