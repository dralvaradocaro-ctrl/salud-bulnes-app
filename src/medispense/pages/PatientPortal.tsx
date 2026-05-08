import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Badge } from '@/medispense/components/ui/badge';
import { Button } from '@/medispense/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/medispense/components/ui/tooltip';
import { Clock, Pill, Calendar, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronUp, BookOpen, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/medispense/components/ui/dialog';
import { supabase } from '@/medispense/integrations/supabase/client';
import { ExpiryBanner } from '@/medispense/components/patient-portal/ExpiryBanner';
import { ExpiredPrescriptionAlert } from '@/medispense/components/patient-portal/ExpiredPrescriptionAlert';
import { DiagnosesCard } from '@/medispense/components/patient-portal/DiagnosesCard';
import { MedicationInfoDialog } from '@/medispense/components/patient-portal/MedicationInfoDialog';
import { NotificationSettings } from '@/medispense/components/patient-portal/NotificationSettings';
import { CompactCardiovascular } from '@/medispense/components/patient-portal/CompactCardiovascular';
import { ExamBanner } from '@/medispense/components/patient-portal/ExamBanner';
import { ExamDetailsCard } from '@/medispense/components/patient-portal/ExamDetailsCard';
import { FloatingNav } from '@/medispense/components/patient-portal/FloatingNav';
import { AccessibilityButton } from '@/medispense/components/patient-portal/AccessibilityButton';
import { TextToSpeechControls } from '@/medispense/components/patient-portal/TextToSpeechControls';
import { getAllExams } from '@/medispense/lib/exam-vigency';
import { shouldDefaultToCardiovascularProgram } from '@/medispense/lib/cardiovascular';
import { useSpeechSynthesis, type SpeechSection } from '@/medispense/hooks/useSpeechSynthesis';
import { cn } from '@/medispense/lib/utils';
import { DIAGNOSIS_LABELS } from '@/medispense/lib/diagnosis-options';

interface EducationPage {
  id: string;
  title: string;
}

interface PrescriptionItem {
  id: string;
  medication_name: string;
  prescribed_dose: number;
  prescribed_unit: string;
  frequency: string;
  schedule: string[] | null;
  ai_description: string | null;
  fractionation: string | null;
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

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  age: number | null;
  diagnoses: string[] | null;
  education_tools: string[] | null;
  cardiovascular_risk?: string | null;
  last_cv_control_date?: string | null;
  last_cv_control_professional?: string | null;
  next_cv_control_date?: string | null;
  next_cv_control_professional?: string | null;
  show_exam_reminder?: boolean;
  last_ecg_date?: string | null;
  last_fundoscopy_date?: string | null;
  last_lab_review_date?: string | null;
  has_diabetic_retinopathy?: boolean;
  show_exam_dates_to_patient?: boolean;
  is_cardiovascular_program?: boolean;
}

const DAY_LABELS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const DAY_DISPLAY = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'];
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const getDayOfWeekIndex = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const formatTablets = (tablets: number): string => {
  if (tablets === 0.5) return '½';
  if (tablets === 1.5) return '1½';
  if (tablets === 0.25) return '¼';
  if (tablets === 0.75) return '¾';
  if (Number.isInteger(tablets)) return tablets.toString();
  return tablets.toString();
};

const isWeeklyMed = (item: PrescriptionItem): boolean => {
  return item.frequency?.includes('7d') || item.frequency?.includes('semanal') || false;
};

const getWeeklyDoseForDay = (item: PrescriptionItem, dayIndex: number): number => {
  if (!item.fractionation) return 1;
  const parts = item.fractionation.split('-').map(Number);
  return parts[dayIndex] ?? 0;
};

function extractSpecificIndication(aiDescription: string | null): string | null {
  if (!aiDescription) return null;
  const match = aiDescription.match(/💊\s*(.+?)(?:\s*\||\s*$)/);
  return match ? match[1].trim() : null;
}

function extractTabletDisplay(aiDescription: string | null): string | null {
  if (!aiDescription) return null;
  const match = aiDescription.match(/(½|¼|¾|\d+½|\d+)\s*comprimido/i);
  return match ? match[0] : null;
}

function extractTabletInfo(aiDescription: string | null, hour: number): string | null {
  if (!aiDescription) return null;
  const hourStr = hour.toString().padStart(2, '0');
  const regex = new RegExp(`(½|¼|¾|\\d+½|\\d+)\\s*comp\\s*a\\s*las\\s*${hourStr}:\\d+`, 'i');
  const match = aiDescription.match(regex);
  return match ? match[0].replace(/a las \d+:\d+/i, '').trim() : null;
}

export default function PatientPortal() {
  const { patientCode } = useParams<{ patientCode: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<PrescriptionItem | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(getDayOfWeekIndex(new Date()));
  const [showArchived, setShowArchived] = useState(false);
  const [educationPages, setEducationPages] = useState<EducationPage[]>([]);
  const [showEducation, setShowEducation] = useState(false);
  const expiringRef = useRef<HTMLDivElement>(null);
  const currentHourRef = useRef<HTMLDivElement>(null);
  const [showSosDialog, setShowSosDialog] = useState(false);
  const tts = useSpeechSynthesis();

  useEffect(() => {
    if (patientCode) fetchPatientData();
  }, [patientCode]);

  useEffect(() => {
    if (!loading && currentHourRef.current) {
      setTimeout(() => {
        currentHourRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [loading, selectedDayIndex]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, patient_code, full_name, age, diagnoses, education_tools, cardiovascular_risk, last_cv_control_date, last_cv_control_professional, next_cv_control_date, next_cv_control_professional, show_exam_reminder, last_ecg_date, last_fundoscopy_date, last_lab_review_date, has_diabetic_retinopathy, show_exam_dates_to_patient, is_cardiovascular_program')
        .ilike('patient_code', patientCode || '')
        .maybeSingle();

      if (patientError || !patientData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPatient(patientData as Patient);

      if (patientData.education_tools && (patientData.education_tools as string[]).length > 0) {
        const { data: eduData } = await supabase
          .from('education_pages')
          .select('id, title')
          .in('id', patientData.education_tools as string[]);
        if (eduData) setEducationPages(eduData as EducationPage[]);
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
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const todayDayIndex = getDayOfWeekIndex(new Date());
  const isToday = selectedDayIndex === todayDayIndex;

  const activePrescriptions = prescriptions.filter(p => getDaysUntilExpiry(p.expiry_date) > 0);
  const recentlyExpiredPrescriptions = prescriptions.filter(p => {
    const days = getDaysUntilExpiry(p.expiry_date);
    return days <= 0 && days > -30;
  });
  const archivedPrescriptions = prescriptions.filter(p => getDaysUntilExpiry(p.expiry_date) <= -30);
  const hasExpiredPrescriptions = recentlyExpiredPrescriptions.length > 0;

  const sosMeds = activePrescriptions.flatMap(p =>
    p.items.filter(item => item.is_sos && !('is_annulled' in item && (item as any).is_annulled))
  );

  const allScheduledMeds = activePrescriptions
    .flatMap(p =>
      p.items.filter(item => {
        if ((item as any).is_annulled) return false;
        if (item.is_sos) return false;
        if (isWeeklyMed(item)) {
          return getWeeklyDoseForDay(item, selectedDayIndex) > 0;
        }
        return true;
      }).flatMap(item => {
        const isInsulin = item.medication_name.toLowerCase().includes('insulina') || item.medication_name.toLowerCase().includes('nph');
        
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
          displayDose: isWeeklyMed(item)
            ? `${formatTablets(getWeeklyDoseForDay(item, selectedDayIndex))} comp.`
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

  const soonestExpiryDays = activePrescriptions
    .map(p => getDaysUntilExpiry(p.expiry_date))
    .filter(d => d > 0)
    .sort((a, b) => a - b)[0] || Infinity;

  const prescriptionsExpiringSoon = activePrescriptions.filter(
    p => getDaysUntilExpiry(p.expiry_date) <= 30 && getDaysUntilExpiry(p.expiry_date) > 0
  ).length;

  const scrollToExpiringPrescription = () => {
    expiringRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const firstExpiringPrescription = activePrescriptions.find(
    p => getDaysUntilExpiry(p.expiry_date) <= 30 && getDaysUntilExpiry(p.expiry_date) > 0
  );

  const buildSpeechSections = useCallback((): SpeechSection[] => {
    if (!patient) return [];
    const sections: SpeechSection[] = [];

    // 1. Patient name
    sections.push({
      id: 'patient-name',
      label: 'Paciente',
      text: `Plan de medicamentos de ${patient.full_name}. ${patient.age ? `${patient.age} años.` : ''}`,
    });

    // 2. Alerts
    if (hasExpiredPrescriptions) {
      sections.push({
        id: 'alert-expired',
        label: 'Alerta',
        text: 'Atención: tiene recetas vencidas. Contacte a su médico para renovarlas.',
      });
    }

    // 3. Daily schedule
    const todayMeds = allScheduledMeds.filter(m => m.schedule?.length);
    if (todayMeds.length > 0) {
      const medsByHour: Record<number, string[]> = {};
      todayMeds.forEach(med => {
        med.schedule?.forEach(s => {
          const h = parseInt(s.split(':')[0]);
          if (!medsByHour[h]) medsByHour[h] = [];
          const dose = med.displayDose ? `, ${med.displayDose}` : '';
          medsByHour[h].push(`${med.medication_name}${dose}`);
        });
      });
      const scheduleText = Object.entries(medsByHour)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([hour, meds]) => `A las ${hour} horas: ${meds.join(', ')}`)
        .join('. ');
      sections.push({
        id: 'schedule-section',
        label: 'Horario del día',
        text: `Horario de medicamentos para hoy, ${DAY_FULL[selectedDayIndex]}. ${scheduleText}.`,
      });
    } else {
      sections.push({
        id: 'schedule-section',
        label: 'Horario del día',
        text: `No hay medicamentos programados para hoy ${DAY_FULL[selectedDayIndex]}.`,
      });
    }

    // 4. SOS medications
    if (sosMeds.length > 0) {
      const sosText = sosMeds.map(m => {
        const reason = m.sos_reason ? `, ${m.sos_reason}` : '';
        return `${m.medication_name}, ${m.frequency}${reason}`;
      }).join('. ');
      sections.push({
        id: 'sos-section',
        label: 'Medicamentos SOS',
        text: `Medicamentos de uso a demanda: ${sosText}.`,
      });
    }

    // 5. Cardiovascular info
    const isInPSCV = patient.is_cardiovascular_program ?? shouldDefaultToCardiovascularProgram(patient.diagnoses);
    if (isInPSCV && patient.next_cv_control_date) {
      const nextDate = new Date(patient.next_cv_control_date).toLocaleDateString('es-CL');
      sections.push({
        id: 'cv-section',
        label: 'Control cardiovascular',
        text: `Próximo control cardiovascular estimado: ${nextDate}, con ${patient.next_cv_control_professional || 'profesional de salud'}.`,
      });
    }

    // 6. Diagnoses
    if (patient.diagnoses && patient.diagnoses.length > 0) {
      const diagNames = patient.diagnoses.map(d => DIAGNOSIS_LABELS[d] || d).join(', ');
      sections.push({
        id: 'diagnoses-section',
        label: 'Diagnósticos',
        text: `Diagnósticos: ${diagNames}.`,
      });
    }

    // 7. Prescription validity
    activePrescriptions.forEach((p, i) => {
      const days = getDaysUntilExpiry(p.expiry_date);
      const medsText = p.items.map(it => it.medication_name).join(', ');
      const validityText = days <= 7
        ? `Atención, vence en ${days} días`
        : `Válida por ${days} días más`;
      sections.push({
        id: `prescription-${i}`,
        label: `Receta ${i + 1}`,
        text: `Receta del ${new Date(p.issue_date).toLocaleDateString('es-CL')}: ${medsText}. ${validityText}.`,
      });
    });

    return sections;
  }, [patient, allScheduledMeds, sosMeds, activePrescriptions, hasExpiredPrescriptions, selectedDayIndex]);

  const handlePlayAll = useCallback(() => {
    const sections = buildSpeechSections();
    tts.speak(sections);
  }, [buildSpeechSections, tts]);

  // Exam vigency calculations
  const hasDM2 = patient?.diagnoses?.includes('diabetes_tipo2') ?? false;
  const hasDiabeticRetinopathy = patient?.has_diabetic_retinopathy ?? false;
  const showExamDates = patient?.show_exam_dates_to_patient ?? true;
  const exams = patient ? getAllExams(
    patient.last_lab_review_date || null,
    patient.last_ecg_date || null,
    patient.last_fundoscopy_date || null,
    hasDM2,
    hasDiabeticRetinopathy,
  ) : [];
  const isInCardiovascularProgram = patient.is_cardiovascular_program ?? shouldDefaultToCardiovascularProgram(patient.diagnoses);
  const visiblePrescriptions = [...activePrescriptions, ...recentlyExpiredPrescriptions];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft flex flex-col items-center gap-4">
          <Pill className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground">Cargando tu plan de medicamentos...</p>
        </div>
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Código no encontrado</h2>
            <p className="text-muted-foreground">
              El código de paciente "{patientCode}" no existe en el sistema.
              Verifica que el código sea correcto o contacta a tu médico.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pill className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Mi Plan de Medicamentos</h1>
                <p className="text-sm text-muted-foreground">
                  {patient.age ? `${patient.age} años` : ''} • Código: {patient.patient_code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TextToSpeechControls
                isSupported={tts.isSupported}
                status={tts.status}
                speed={tts.speed}
                onSpeedChange={tts.setSpeed}
                onPlay={handlePlayAll}
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
              />
              <AccessibilityButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 space-y-3">
        {/* 1️⃣ Expired prescription alert - TOP PRIORITY */}
        <ExpiredPrescriptionAlert hasExpiredPrescriptions={hasExpiredPrescriptions} />

        {/* Expiry soon banner (existing) */}
        <ExpiryBanner
          daysUntilExpiry={soonestExpiryDays}
          prescriptionsExpiringSoon={prescriptionsExpiringSoon}
          onClickPrescription={scrollToExpiringPrescription}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] xl:items-start">
          <section className="space-y-4 xl:min-w-0">
            <div className="space-y-3" id="prescriptions-section">
              <Card className="border-primary/20 bg-card/95">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        Mis Recetas
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Recetas visibles primero para acceso clínico rápido.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{activePrescriptions.length} vigentes</Badge>
                      {recentlyExpiredPrescriptions.length > 0 && (
                        <Badge className="bg-warning text-warning-foreground">{recentlyExpiredPrescriptions.length} por renovar</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {visiblePrescriptions.length > 0 ? (
                visiblePrescriptions.map((prescription) => {
              const daysUntilExpiry = getDaysUntilExpiry(prescription.expiry_date);
              const isExpired = daysUntilExpiry <= 0;
              const isFirstExpiring = prescription.id === firstExpiringPrescription?.id;

              return (
                <Card
                  key={prescription.id}
                  ref={isFirstExpiring ? expiringRef : undefined}
                  className={isExpired ? 'opacity-70 border-destructive/50' : ''}
                >
                      <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base">
                        Receta del {new Date(prescription.issue_date).toLocaleDateString('es-CL')}
                      </CardTitle>
                      <Badge
                        className={`${
                          isExpired
                            ? 'bg-destructive text-destructive-foreground'
                            : daysUntilExpiry <= 7
                            ? 'bg-destructive text-destructive-foreground'
                            : daysUntilExpiry <= 30
                            ? 'bg-warning text-warning-foreground'
                            : 'bg-success text-success-foreground'
                        }`}
                      >
                        {isExpired
                          ? '⚠️ VENCIDA - Renovar'
                          : daysUntilExpiry <= 7
                          ? `⚠️ Vence en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? '' : 's'}`
                          : `Válida ${daysUntilExpiry} días más`}
                      </Badge>
                    </div>
                  </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1.5">
                      {prescription.items.map((item) => {
                        const specificIndication = extractSpecificIndication(item.ai_description);
                        const tabletDisplay = extractTabletDisplay(item.ai_description);
                        return (
                          <div
                            key={item.id}
                                className="flex items-start justify-between rounded-lg bg-accent/30 p-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => setSelectedMedication(item)}
                          >
                            <div className="flex items-start gap-2 flex-1">
                              <Pill className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{item.medication_name}</span>
                                  {tabletDisplay && (
                                    <Badge variant="secondary" className="text-xs">
                                      {tabletDisplay}
                                    </Badge>
                                  )}
                                  {item.is_sos && (
                                    <Badge className="text-[10px] bg-warning text-warning-foreground font-semibold">
                                      🆘 SOS
                                    </Badge>
                                  )}
                                </div>
                                {specificIndication && (
                                  <p className="text-xs text-primary/80 mt-0.5 italic">💊 {specificIndication}</p>
                                )}
                                {item.ai_description && !specificIndication && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{item.ai_description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 ml-2">
                              <span>{item.frequency}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                        {prescription.notes && (
                          <p className="mt-2 text-sm text-muted-foreground italic">📝 {prescription.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
                  <CardContent className="py-8 text-center">
                <Pill className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No tienes recetas activas</p>
              </CardContent>
            </Card>
          )}
            </div>

            <Card id="schedule-section">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Horario del Día
                    </CardTitle>
                    <CardDescription>
                      {DAY_FULL[selectedDayIndex]} - {isToday ? 'Hoy' : 'Ver medicamentos de este día'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {sosMeds.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-warning bg-warning text-warning-foreground font-semibold hover:bg-warning/90"
                        onClick={() => setShowSosDialog(true)}
                      >
                        <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                        SOS ({sosMeds.length})
                      </Button>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Horarios referenciales</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-left" side="left">
                        <p className="font-semibold mb-1">Horarios Referenciales</p>
                        <p className="text-xs leading-relaxed">La posología y horarios indicados son referenciales. En caso de discrepancia, respete la indicación de su médico tratante.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
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

                <div className="relative max-h-[42vh] overflow-y-auto rounded-lg border border-border/60">
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                    const isCurrentHour = isToday && hour === currentHour;
                    const isPast = isToday && hour < currentHour;
                    const medications = allScheduledMeds.filter(item =>
                      item.schedule?.some(s => parseInt(s.split(':')[0]) === hour)
                    );
                    const hasMeds = medications.length > 0;

                    return (
                      <div
                        key={hour}
                        ref={isCurrentHour ? currentHourRef : undefined}
                        className="relative"
                      >
                        {isCurrentHour && (
                          <div
                            className="absolute left-0 right-0 z-10 pointer-events-none"
                            style={{ top: `${(currentMinute / 60) * 100}%` }}
                          >
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-destructive shrink-0" />
                              <div className="flex-1 h-0.5 bg-destructive" />
                            </div>
                          </div>
                        )}
                        <div className={`flex items-start gap-3 py-2 px-2 border-b border-border/50 transition-colors ${
                          isCurrentHour
                            ? 'bg-warning/10'
                            : hasMeds && !isPast
                            ? 'bg-accent/30'
                            : ''
                        }`}>
                          <div className="flex items-center gap-2 min-w-[70px] pt-0.5">
                            {hasMeds && isPast ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : hasMeds && isCurrentHour ? (
                              <AlertCircle className="h-4 w-4 text-warning animate-pulse" />
                            ) : (
                              <span className="w-4" />
                            )}
                            <span className={`font-mono text-sm ${
                              isPast ? 'text-muted-foreground' : isCurrentHour ? 'font-bold text-foreground' : 'text-foreground'
                            }`}>
                              {hour.toString().padStart(2, '0')}:00
                            </span>
                          </div>
                          <div className="flex-1 flex flex-wrap gap-1 min-h-[28px]">
                            {medications.map((med, idx) => {
                              const tabletInfo = extractTabletInfo(med.ai_description, hour);
                              const indication = extractSpecificIndication(med.ai_description);
                              return (
                                <div key={idx} className="flex flex-col gap-0.5">
                                  <Badge
                                    className={`text-xs py-0.5 cursor-pointer hover:opacity-80 transition-opacity ${
                                      isCurrentHour
                                        ? 'bg-warning text-warning-foreground'
                                        : isPast
                                        ? 'bg-muted text-muted-foreground line-through'
                                        : 'bg-primary text-primary-foreground'
                                    }`}
                                    onClick={() => setSelectedMedication(med)}
                                  >
                                    <Pill className="h-3 w-3 mr-1" />
                                    {med.medication_name}
                                    {med.displayDose && ` (${med.displayDose})`}
                                    {tabletInfo && ` · ${tabletInfo}`}
                                  </Badge>
                                  {indication && (
                                    <span className="text-[10px] text-muted-foreground italic ml-1">
                                      {indication}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-3 xl:sticky xl:top-4">
            {isInCardiovascularProgram && (
              <CompactCardiovascular
                lastControlDate={patient.last_cv_control_date || null}
                lastControlProfessional={patient.last_cv_control_professional || null}
                nextControlDate={patient.next_cv_control_date || null}
                nextControlProfessional={patient.next_cv_control_professional || null}
                cardiovascularRisk={patient.cardiovascular_risk || null}
                diagnoses={patient.diagnoses}
              />
            )}

            {isInCardiovascularProgram && (
              <ExamBanner
                exams={exams}
                showExamDates={showExamDates}
                nextControlProfessional={patient.next_cv_control_professional || null}
                nextControlDate={patient.next_cv_control_date || null}
              />
            )}

            <DiagnosesCard diagnoses={patient.diagnoses} />

            {isInCardiovascularProgram && (
              <ExamDetailsCard
                exams={exams}
                showExamDates={showExamDates}
                hasDM2={hasDM2}
              />
            )}
          </aside>
        </div>

        {/* Archived Prescriptions */}
        {archivedPrescriptions.length > 0 && (
          <div className="space-y-3">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="font-medium">Recetas Antiguas ({archivedPrescriptions.length})</span>
              <span className="text-xs">(vencidas hace más de 30 días)</span>
            </button>
            {showArchived && (
              <div className="space-y-3 opacity-60">
                {archivedPrescriptions.map((prescription) => (
                  <Card key={prescription.id} className="border-muted">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm text-muted-foreground">
                          Receta del {new Date(prescription.issue_date).toLocaleDateString('es-CL')}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs text-muted-foreground">Archivada</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {prescription.items.map((item) => (
                          <p key={item.id} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Pill className="h-3 w-3" />
                            {item.medication_name} · {item.frequency}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {educationPages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Herramientas Educativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {educationPages.map((page) => (
                  <a
                    key={page.id}
                    href={`/educacion/${page.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                  >
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{page.title}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {patient && <NotificationSettings patientId={patient.id} />}
        </div>

        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>Si tienes dudas sobre tu medicación, consulta a tu médico</p>
          <p className="text-xs mt-1">Toca cualquier medicamento para ver más información</p>
        </div>
      </main>

      {/* Floating navigation */}
      <FloatingNav />

      {/* SOS Dialog */}
      <Dialog open={showSosDialog} onOpenChange={setShowSosDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-warning" />
              Medicamentos SOS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Estos medicamentos están indicados solo cuando los necesites, según las instrucciones de tu médico.
            </p>
            {sosMeds.map((med) => {
              const tabletDisplay = extractTabletDisplay(med.ai_description);
              return (
                <div
                  key={med.id}
                  className="p-3 rounded-lg border border-warning/30 bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors"
                  onClick={() => { setShowSosDialog(false); setSelectedMedication(med); }}
                >
                  <div className="flex items-start gap-2">
                    <Pill className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{med.medication_name}</span>
                        {tabletDisplay && (
                          <Badge variant="secondary" className="text-xs">{tabletDisplay}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {med.frequency} • Máx. {med.prescribed_dose}{med.prescribed_unit} por toma
                      </p>
                      {med.sos_reason && (
                        <p className="text-xs text-foreground mt-1 font-semibold">
                          🆘 {med.sos_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <MedicationInfoDialog
        open={!!selectedMedication}
        onOpenChange={(open) => !open && setSelectedMedication(null)}
        medication={selectedMedication}
      />
    </div>
  );
}
