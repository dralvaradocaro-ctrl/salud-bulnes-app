import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Input } from '@/medispense/components/ui/input';
import { Button } from '@/medispense/components/ui/button';
import { Badge } from '@/medispense/components/ui/badge';
import { Label } from '@/medispense/components/ui/label';
import { Textarea } from '@/medispense/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/medispense/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/medispense/components/ui/popover';
import { Checkbox } from '@/medispense/components/ui/checkbox';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Pill, 
  Trash2,
  AlertCircle,
  Calendar,
  CalendarIcon,
  Clock,
  Sparkles,
  Loader2,
  Info,
  Copy,
  X,
  RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/medispense/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/medispense/components/ui/tooltip";
import { supabase } from '@/medispense/integrations/supabase/client';
import { useAuth } from '@/medispense/contexts/AuthContext';
import { useToast } from '@/medispense/hooks/use-toast';
import { getDefaultSchedule } from '@/medispense/lib/medication-schedules';
import { cn } from '@/medispense/lib/utils';
import { RiskWarnings } from '@/medispense/components/prescription/RiskWarnings';
import { PresentationSelector } from '@/medispense/components/prescription/PresentationSelector';
import { logAudit } from '@/medispense/lib/audit';

interface Medication {
  id: string;
  name: string;
  active_ingredient: string;
  presentation: string;
  dose_value: number;
  dose_unit: string;
  category: string | null;
}

const DAY_LABELS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const;
const DAY_DISPLAY = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'];

interface WeeklyDays {
  lun: number;
  mar: number;
  mie: number;
  jue: number;
  vie: number;
  sab: number;
  dom: number;
}

interface DoseBySchedule {
  time: string;
  tablets: number;
}

interface PrescriptionItemInput {
  tempId: string;
  medication_id: string | null;
  medication_name: string;
  prescribed_dose: number;
  prescribed_unit: string;
  frequency: string;
  duration_days: number | null;
  fractionation: string | null;
  schedule: string[];
  scheduleReason: string | null;
  isInsulin: boolean;
  insulinAm: number | null;
  insulinPm: number | null;
  isWeekly: boolean;
  weeklyDays: WeeklyDays;
  tabletsPerDose: number | null;
  arsenalDoseValue: number | null;
  arsenalDoseUnit: string | null;
  arsenalPresentation: string | null;
  specificIndication: string | null;
  dosesBySchedule: DoseBySchedule[] | null;
  useCustomPresentation: boolean;
  customPresentation: string;
  isSos: boolean;
  sosReason: string | null;
}

interface PrescriptionGroup {
  id: string;
  label: string;
  items: PrescriptionItemInput[];
  issueDate: Date;
  expiryDays: number;
  notes: string;
}

const FREQUENCY_OPTIONS = [
  { value: 'c/8h', label: 'Cada 8 horas' },
  { value: 'c/12h', label: 'Cada 12 horas' },
  { value: 'c/24h', label: 'Cada 24 horas' },
  { value: 'c/7d', label: 'Cada 7 días (semanal)' },
  { value: 'c/48h', label: 'Cada 48 horas' },
  { value: 'otro', label: 'Otro' },
];

const isInsulinMedication = (name: string): boolean => {
  const insulinKeywords = ['insulina', 'nph', 'glargina', 'lispro', 'aspart', 'detemir', 'degludec', 'cristalina'];
  return insulinKeywords.some(keyword => name.toLowerCase().includes(keyword));
};

const isWeeklyFrequency = (frequency: string): boolean => {
  return frequency.includes('7d') || frequency.includes('semanal') || frequency.includes('semana');
};

const emptyWeeklyDays = (): WeeklyDays => ({ lun: 0, mar: 0, mie: 0, jue: 0, vie: 0, sab: 0, dom: 0 });

const formatTablets = (tablets: number | null | undefined): string => {
  if (tablets == null) return '1';
  if (tablets === 0.5) return '½';
  if (tablets === 1.5) return '1½';
  if (tablets === 0.25) return '¼';
  if (tablets === 0.75) return '¾';
  if (Number.isInteger(tablets)) return tablets.toString();
  return tablets.toString();
};

const createEmptyGroup = (index: number): PrescriptionGroup => ({
  id: `group-${Date.now()}-${index}`,
  label: `Receta ${index + 1}`,
  items: [],
  issueDate: new Date(),
  expiryDays: 365,
  notes: '',
});

export default function NewPrescription() {
  const { patientCode } = useParams<{ patientCode: string }>();
  const [searchParams] = useSearchParams();
  const editPrescriptionId = searchParams.get('edit');
  const renewPrescriptionId = searchParams.get('renew');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<{ id: string; full_name: string; age: number | null; diagnoses: string[] | null } | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<PrescriptionGroup[]>([createEmptyGroup(0)]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiText, setAiText] = useState('');
  const [parsingAi, setParsingAi] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const activeGroup = groups[activeGroupIndex];

  useEffect(() => {
    fetchData();
  }, [patientCode]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: patientData } = await supabase
      .from('patients')
      .select('id, full_name, age, diagnoses')
      .eq('patient_code', patientCode)
      .single();

    if (patientData) setPatient(patientData);

    const { data: medsData } = await supabase
      .from('medications')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (medsData) setMedications(medsData);

    // Load existing prescription for edit mode
    if (editPrescriptionId && patientData) {
      const { data: prescriptionData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', editPrescriptionId)
        .single();

      if (prescriptionData) {
        const { data: itemsData } = await supabase
          .from('prescription_items')
          .select('*')
          .eq('prescription_id', editPrescriptionId);

        const issueDate = new Date(prescriptionData.issue_date + 'T12:00:00');
        const expiryDate = new Date(prescriptionData.expiry_date + 'T12:00:00');
        const expiryDays = Math.round((expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));

        const loadedItems: PrescriptionItemInput[] = (itemsData || []).map((item, idx) => {
          const matchingMed = medsData?.find(m => m.id === item.medication_id) || null;
          const isInsulin = isInsulinMedication(item.medication_name);
          const isWeekly = isWeeklyFrequency(item.frequency);
          
          let insulinAm: number | null = null;
          let insulinPm: number | null = null;
          let weeklyDays = emptyWeeklyDays();

          if (item.fractionation) {
            const parts = item.fractionation.split('-').map(Number);
            if (isInsulin && parts.length === 2) {
              insulinAm = parts[0];
              insulinPm = parts[1];
            } else if (isWeekly && parts.length === 7) {
              DAY_LABELS.forEach((d, i) => {
                weeklyDays[d] = parts[i] || 0;
              });
            }
          }

          const schedule = (item.schedule as string[]) || [];
          const tabletMatch = item.ai_description?.match(/(½|¼|¾|\d+½|\d+(?:\.\d+)?)\s*(?:comprimido|cápsula|tableta|comp)/i);
          const tabletsPerDose = tabletMatch ? parseFloat(tabletMatch[1].replace('½', '.5').replace('¼', '.25').replace('¾', '.75')) : 1;

          // Detect custom presentation from ai_description
          const presMatch = item.ai_description?.match(/Presentación:\s*(.+?)(?:\s*\||$)/);
          const hasCustomPresentation = !!presMatch;

          return {
            tempId: `edit-${Date.now()}-${idx}`,
            medication_id: item.medication_id,
            medication_name: item.medication_name,
            prescribed_dose: item.prescribed_dose,
            prescribed_unit: item.prescribed_unit,
            frequency: item.frequency,
            duration_days: item.duration_days,
            fractionation: item.fractionation,
            schedule,
            scheduleReason: null,
            isInsulin,
            insulinAm,
            insulinPm,
            isWeekly,
            weeklyDays,
            tabletsPerDose,
            arsenalDoseValue: matchingMed?.dose_value || null,
            arsenalDoseUnit: matchingMed?.dose_unit || null,
            arsenalPresentation: matchingMed?.presentation || null,
            specificIndication: null,
            dosesBySchedule: null,
            useCustomPresentation: hasCustomPresentation,
            customPresentation: presMatch ? presMatch[1].trim() : '',
            isSos: false,
            sosReason: null,
          };
        });

        setGroups([{
          id: `group-edit-${editPrescriptionId}`,
          label: 'Receta 1',
          items: loadedItems,
          issueDate,
          expiryDays: expiryDays > 0 ? expiryDays : 365,
          notes: prescriptionData.notes || '',
        }]);
        setIsEditMode(true);
      }
    }

    // Load prescription for renew mode (pre-load items as new prescription)
    if (renewPrescriptionId && patientData && !editPrescriptionId) {
      const { data: itemsData } = await supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', renewPrescriptionId)
        .eq('is_annulled', false);

      if (itemsData && itemsData.length > 0) {
        const loadedItems: PrescriptionItemInput[] = itemsData.map((item, idx) => {
          const matchingMed = medsData?.find(m => m.id === item.medication_id) || null;
          const isInsulin = isInsulinMedication(item.medication_name);
          const isWeekly = isWeeklyFrequency(item.frequency);
          
          let insulinAm: number | null = null;
          let insulinPm: number | null = null;
          let weeklyDays = emptyWeeklyDays();

          if (item.fractionation) {
            const parts = item.fractionation.split('-').map(Number);
            if (isInsulin && parts.length === 2) {
              insulinAm = parts[0];
              insulinPm = parts[1];
            } else if (isWeekly && parts.length === 7) {
              DAY_LABELS.forEach((d, i) => {
                weeklyDays[d] = parts[i] || 0;
              });
            }
          }

          const schedule = (item.schedule as string[]) || [];
          const tabletMatch = item.ai_description?.match(/(½|¼|¾|\d+½|\d+(?:\.\d+)?)\s*(?:comprimido|cápsula|tableta|comp)/i);
          const tabletsPerDose = tabletMatch ? parseFloat(tabletMatch[1].replace('½', '.5').replace('¼', '.25').replace('¾', '.75')) : 1;

          const presMatch = item.ai_description?.match(/Presentación:\s*(.+?)(?:\s*\||$)/);
          const hasCustomPresentation = !!presMatch;

          return {
            tempId: `renew-${Date.now()}-${idx}`,
            medication_id: item.medication_id,
            medication_name: item.medication_name,
            prescribed_dose: item.prescribed_dose,
            prescribed_unit: item.prescribed_unit,
            frequency: item.frequency,
            duration_days: item.duration_days,
            fractionation: item.fractionation,
            schedule,
            scheduleReason: null,
            isInsulin,
            insulinAm,
            insulinPm,
            isWeekly,
            weeklyDays,
            tabletsPerDose,
            arsenalDoseValue: matchingMed?.dose_value || null,
            arsenalDoseUnit: matchingMed?.dose_unit || null,
            arsenalPresentation: matchingMed?.presentation || null,
            specificIndication: null,
            dosesBySchedule: null,
            useCustomPresentation: hasCustomPresentation,
            customPresentation: presMatch ? presMatch[1].trim() : '',
            isSos: false,
            sosReason: null,
          };
        });

        setGroups([{
          id: `group-renew-${renewPrescriptionId}`,
          label: 'Receta 1',
          items: loadedItems,
          issueDate: new Date(),
          expiryDays: 365,
          notes: 'Renovación de receta',
        }]);
      }
    }

    setLoading(false);
  };

  const updateActiveGroup = (updates: Partial<PrescriptionGroup>) => {
    setGroups(prev => prev.map((g, i) => i === activeGroupIndex ? { ...g, ...updates } : g));
  };

  const setItems = (items: PrescriptionItemInput[]) => {
    updateActiveGroup({ items });
  };

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.active_ingredient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const findMatchingMedication = (name: string, dose: number, unit: string, matchedId?: string | null): Medication | null => {
    if (matchedId) {
      const byId = medications.find(m => m.id === matchedId);
      if (byId) return byId;
    }
    
    const searchName = name.toLowerCase()
      .replace('potásico', '').replace('sódico', '').replace('ácido', '')
      .replace('acetilsalicílico', 'aspirina')
      .replace('humana', '').replace('isófana', 'nph')
      .trim();
    
    const exactMatch = medications.find(med => {
      const medName = med.name.toLowerCase();
      const activeIngredient = med.active_ingredient.toLowerCase();
      const nameMatch = medName.includes(searchName) || searchName.includes(medName) ||
                       activeIngredient.includes(searchName) || searchName.includes(activeIngredient);
      const doseMatch = Math.abs(med.dose_value - dose) < 0.01;
      const unitMatch = med.dose_unit.toLowerCase() === unit.toLowerCase();
      return nameMatch && doseMatch && unitMatch;
    });
    
    if (exactMatch) return exactMatch;
    
    return medications.find(med => {
      const medName = med.name.toLowerCase();
      const activeIngredient = med.active_ingredient.toLowerCase();
      return medName.includes(searchName) || searchName.includes(medName) ||
             activeIngredient.includes(searchName) || searchName.includes(activeIngredient);
    }) || null;
  };

  const parseWithAI = async () => {
    if (!aiText.trim()) {
      toast({ title: 'Error', description: 'Escribe el texto de la prescripción', variant: 'destructive' });
      return;
    }

    setParsingAi(true);

    try {
      const { parsePrescriptionWithGemini } = await import('@/medispense/lib/geminiParse');
      let data: { medications: any[] };
      try {
        data = await parsePrescriptionWithGemini(
          aiText,
          medications.slice(0, 150).map(m => ({
            id: m.id,
            name: m.name,
            dose_value: m.dose_value,
            dose_unit: m.dose_unit,
            active_ingredient: m.active_ingredient,
            presentation: m.presentation,
          }))
        );
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'No se pudo procesar el texto', variant: 'destructive' });
        return;
      }

      if (data.medications && data.medications.length > 0) {
        const newItems: PrescriptionItemInput[] = data.medications.map((med: any, idx: number) => {
          const matchingMed = findMatchingMedication(
            med.matched_medication_name || med.name, 
            med.arsenal_dose_value || med.dose, 
            med.arsenal_dose_unit || med.unit,
            med.matched_medication_id
          );
          const isInsulin = med.is_insulin || isInsulinMedication(med.name);
          const isWeekly = med.is_weekly || isWeeklyFrequency(med.frequency || 'c/24h');
          const frequency = med.frequency || 'c/24h';

          const medicationName = matchingMed?.name || med.name;
          const aiSchedule = med.default_schedule && med.default_schedule.length > 0 ? med.default_schedule : null;
          const dosesBySchedule: DoseBySchedule[] | null = med.doses_by_schedule || null;
          const localSchedule = getDefaultSchedule(medicationName, frequency);
          const schedule = dosesBySchedule
            ? dosesBySchedule.map((d: DoseBySchedule) => d.time)
            : aiSchedule || localSchedule.schedule;
          const scheduleReason = med.schedule_reason || localSchedule.reason;

          let tabletsPerDose = med.tablets_per_dose || null;
          if (!tabletsPerDose && matchingMed && med.dose && !isInsulin) {
            tabletsPerDose = med.dose / matchingMed.dose_value;
          }

          let weeklyDays = emptyWeeklyDays();
          if (med.weekly_days) {
            weeklyDays = { ...emptyWeeklyDays(), ...med.weekly_days };
          }

          const displayName = matchingMed 
            ? `${matchingMed.name} ${matchingMed.dose_value}${matchingMed.dose_unit}`
            : med.matched_medication_name || `${med.name} ${med.dose}${med.unit}`;

          return {
            tempId: `ai-${Date.now()}-${idx}`,
            medication_id: matchingMed?.id || null,
            medication_name: displayName,
            prescribed_dose: med.dose,
            prescribed_unit: med.unit,
            frequency,
            duration_days: med.duration_days || activeGroup.expiryDays,
            fractionation: null,
            schedule,
            scheduleReason,
            isInsulin,
            insulinAm: med.insulin_am || null,
            insulinPm: med.insulin_pm || null,
            isWeekly,
            weeklyDays,
            tabletsPerDose,
            arsenalDoseValue: matchingMed?.dose_value || med.arsenal_dose_value || null,
            arsenalDoseUnit: matchingMed?.dose_unit || med.arsenal_dose_unit || null,
            arsenalPresentation: matchingMed?.presentation || med.arsenal_presentation || null,
            specificIndication: med.specific_indication || null,
            dosesBySchedule,
            useCustomPresentation: false,
            customPresentation: '',
            isSos: med.is_sos || false,
            sosReason: med.sos_reason || null,
          };
        });

        setItems([...activeGroup.items, ...newItems]);
        setAiText('');
        toast({ 
          title: 'Medicamentos agregados', 
          description: `Se agregaron ${newItems.length} medicamento(s) a ${activeGroup.label}.` 
        });
      } else {
        toast({ title: 'Sin resultados', description: 'No se encontraron medicamentos en el texto.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error parsing with AI:', error);
      toast({ title: 'Error', description: 'Error de conexión. Intenta de nuevo.', variant: 'destructive' });
    } finally {
      setParsingAi(false);
    }
  };

  const addMedication = (med: Medication) => {
    const isInsulin = isInsulinMedication(med.name);
    const defaultFrequency = 'c/24h';
    const scheduleInfo = getDefaultSchedule(med.name, defaultFrequency);
    
    const newItem: PrescriptionItemInput = {
      tempId: Date.now().toString(),
      medication_id: med.id,
      medication_name: `${med.name} ${med.dose_value}${med.dose_unit}`,
      prescribed_dose: med.dose_value,
      prescribed_unit: med.dose_unit,
      frequency: defaultFrequency,
      duration_days: activeGroup.expiryDays,
      fractionation: null,
      schedule: scheduleInfo.schedule,
      scheduleReason: scheduleInfo.reason,
      isInsulin,
      insulinAm: null,
      insulinPm: null,
      isWeekly: false,
      weeklyDays: emptyWeeklyDays(),
      tabletsPerDose: 1,
      arsenalDoseValue: med.dose_value,
      arsenalDoseUnit: med.dose_unit,
      arsenalPresentation: med.presentation,
      specificIndication: null,
      dosesBySchedule: null,
      useCustomPresentation: false,
      customPresentation: '',
      isSos: false,
      sosReason: null,
    };

    setItems([...activeGroup.items, newItem]);
    setSearchQuery('');
  };

  const updateItem = (tempId: string, updates: Partial<PrescriptionItemInput>) => {
    const updatedItems = activeGroup.items.map(item => {
      if (item.tempId !== tempId) return item;
      
      const updated = { ...item, ...updates };
      
      if (updates.frequency) {
        updated.isWeekly = isWeeklyFrequency(updates.frequency);
        if (!updated.isWeekly) {
          updated.weeklyDays = emptyWeeklyDays();
        }
      }
      
      if (updates.frequency && !updates.schedule) {
        const scheduleInfo = getDefaultSchedule(updated.medication_name, updates.frequency);
        updated.schedule = scheduleInfo.schedule;
        updated.scheduleReason = scheduleInfo.reason;
      }
      
      return updated;
    });
    setItems(updatedItems);
  };

  const updateWeeklyDay = (tempId: string, day: keyof WeeklyDays, value: number) => {
    const updatedItems = activeGroup.items.map(item => {
      if (item.tempId !== tempId) return item;
      return { ...item, weeklyDays: { ...item.weeklyDays, [day]: value } };
    });
    setItems(updatedItems);
  };

  const removeItem = (tempId: string) => {
    setItems(activeGroup.items.filter(item => item.tempId !== tempId));
  };

  const addPrescriptionGroup = () => {
    const newGroup = createEmptyGroup(groups.length);
    setGroups([...groups, newGroup]);
    setActiveGroupIndex(groups.length);
  };

  const removePrescriptionGroup = (index: number) => {
    if (groups.length <= 1) return;
    const newGroups = groups.filter((_, i) => i !== index);
    setGroups(newGroups);
    if (activeGroupIndex >= newGroups.length) {
      setActiveGroupIndex(newGroups.length - 1);
    } else if (activeGroupIndex > index) {
      setActiveGroupIndex(activeGroupIndex - 1);
    }
  };

  const duplicateGroup = (index: number) => {
    const source = groups[index];
    const newGroup: PrescriptionGroup = {
      ...source,
      id: `group-${Date.now()}-dup`,
      label: `Receta ${groups.length + 1}`,
      items: source.items.map(item => ({ ...item, tempId: `dup-${Date.now()}-${Math.random()}` })),
    };
    setGroups([...groups, newGroup]);
    setActiveGroupIndex(groups.length);
    toast({ title: 'Receta duplicada', description: `Se creó ${newGroup.label} como copia.` });
  };

  const buildAiDescription = (item: PrescriptionItemInput): string | null => {
    const parts: string[] = [];
    
    if (item.specificIndication) {
      parts.push(`💊 ${item.specificIndication}`);
    }
    
    if (item.isInsulin && item.insulinAm !== null && item.insulinPm !== null) {
      parts.push(`Distribución: ${item.insulinAm}U AM (mañana) / ${item.insulinPm}U PM (noche)`);
    }
    
    if (item.dosesBySchedule && item.dosesBySchedule.length > 0) {
      const presLabel = item.useCustomPresentation && item.customPresentation
        ? item.customPresentation.toLowerCase()
        : item.arsenalPresentation?.toLowerCase() || 'comp';
      const doseStr = item.dosesBySchedule.map(d => `${formatTablets(d.tablets)} ${presLabel} a las ${d.time}`).join(', ');
      parts.push(doseStr);
    } else if (item.tabletsPerDose && item.tabletsPerDose !== 1 && !item.isInsulin) {
      const presLabel = item.useCustomPresentation && item.customPresentation
        ? item.customPresentation.toLowerCase()
        : item.arsenalPresentation?.toLowerCase() || 'comp';
      parts.push(`${formatTablets(item.tabletsPerDose)} ${presLabel}`);
    }
    
    if (item.isWeekly) {
      const dayStr = DAY_LABELS.map((d, i) => 
        item.weeklyDays[d] > 0 ? `${DAY_DISPLAY[i]}:${formatTablets(item.weeklyDays[d])}` : null
      ).filter(Boolean).join(', ');
      if (dayStr) parts.push(`Semanal: ${dayStr}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : null;
  };

  const buildWeeklyFractionation = (days: WeeklyDays): string => {
    return DAY_LABELS.map(d => days[d]).join('-');
  };

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  const normalizeMedName = (name: string): string => {
    return name.toLowerCase().replace(/\s*\d+[\.,]?\d*\s*(mg|mcg|ml|ui|g|%)\s*/gi, '').trim();
  };

  const autoAnnulDuplicateMeds = async (newPrescriptionId: string, newItems: PrescriptionItemInput[], patientId: string) => {
    try {
      const { data: otherPrescriptions } = await supabase
        .from('prescriptions')
        .select('id, expiry_date')
        .eq('patient_id', patientId)
        .neq('id', newPrescriptionId);

      if (!otherPrescriptions) return;

      const activePrescriptionIds = otherPrescriptions
        .filter(p => new Date(p.expiry_date) > new Date())
        .map(p => p.id);

      if (activePrescriptionIds.length === 0) return;

      const { data: existingItems } = await supabase
        .from('prescription_items')
        .select('id, medication_name, medication_id, frequency, prescribed_dose')
        .in('prescription_id', activePrescriptionIds)
        .eq('is_annulled', false);

      if (!existingItems) return;

      const itemsToAnnul: string[] = [];

      for (const newItem of newItems) {
        for (const existing of existingItems) {
          const sameByName = normalizeMedName(existing.medication_name) === normalizeMedName(newItem.medication_name);
          const sameById = existing.medication_id && newItem.medication_id && existing.medication_id === newItem.medication_id;
          
          if (sameByName || sameById) {
            const differentPosology = existing.frequency !== newItem.frequency || existing.prescribed_dose !== newItem.prescribed_dose;
            if (differentPosology) {
              itemsToAnnul.push(existing.id);
            }
          }
        }
      }

      if (itemsToAnnul.length > 0) {
        await supabase
          .from('prescription_items')
          .update({ is_annulled: true })
          .in('id', itemsToAnnul);
      }
    } catch (error) {
      console.error('Error auto-annulling meds:', error);
    }
  };

  const handleSave = async () => {
    if (!patient || !user) {
      toast({ title: 'Error', description: 'No se pudo obtener información del paciente', variant: 'destructive' });
      return;
    }

    // Validate all groups
    const nonEmptyGroups = groups.filter(g => g.items.length > 0);
    if (nonEmptyGroups.length === 0) {
      toast({ title: 'Error', description: 'Agrega al menos un medicamento', variant: 'destructive' });
      return;
    }

    for (const group of nonEmptyGroups) {
      for (const item of group.items) {
        if (item.isInsulin && (item.frequency === 'c/12h') && (item.insulinAm === null || item.insulinPm === null)) {
          toast({ 
            title: 'Distribución requerida', 
            description: `Especifica AM y PM de ${item.medication_name} en ${group.label}`,
            variant: 'destructive' 
          });
          return;
        }
        if (item.isWeekly) {
          const totalDays = Object.values(item.weeklyDays).filter(v => v > 0).length;
          if (totalDays === 0) {
            toast({ 
              title: 'Días requeridos', 
              description: `Selecciona los días para ${item.medication_name} en ${group.label}`,
              variant: 'destructive' 
            });
            return;
          }
        }
      }
    }

    setSaving(true);

    try {
      for (const group of nonEmptyGroups) {
        const expiryDate = new Date(group.issueDate);
        expiryDate.setDate(expiryDate.getDate() + group.expiryDays);

        let prescriptionId: string;

        if (isEditMode && editPrescriptionId) {
          // Update existing prescription
          const { error: updateError } = await supabase
            .from('prescriptions')
            .update({
              issue_date: format(group.issueDate, 'yyyy-MM-dd'),
              expiry_date: expiryDate.toISOString().split('T')[0],
              notes: group.notes,
            })
            .eq('id', editPrescriptionId);

          if (updateError) throw updateError;
          prescriptionId = editPrescriptionId;

          // Delete old items
          await supabase.from('prescription_items').delete().eq('prescription_id', editPrescriptionId);
        } else {
          // Insert new prescription
          const { data: prescription, error: prescriptionError } = await supabase
            .from('prescriptions')
            .insert({
              patient_id: patient.id,
              prescribed_by: user.id,
              issue_date: format(group.issueDate, 'yyyy-MM-dd'),
              expiry_date: expiryDate.toISOString().split('T')[0],
              notes: group.notes,
            })
            .select()
            .single();

          if (prescriptionError) throw prescriptionError;
          prescriptionId = prescription.id;
        }

        const prescriptionItems = group.items.map(item => ({
          prescription_id: prescriptionId,
          medication_id: item.medication_id,
          medication_name: item.medication_name,
          prescribed_dose: item.prescribed_dose,
          prescribed_unit: item.prescribed_unit,
          frequency: item.frequency,
          duration_days: item.duration_days,
          fractionation: item.isInsulin && item.insulinAm !== null && item.insulinPm !== null
            ? `${item.insulinAm}-${item.insulinPm}`
            : item.isWeekly 
            ? buildWeeklyFractionation(item.weeklyDays)
            : null,
          schedule: item.schedule,
          ai_description: buildAiDescription(item),
          is_sos: item.isSos,
          sos_reason: item.sosReason,
        }));

        const { error: itemsError } = await supabase
          .from('prescription_items')
          .insert(prescriptionItems);

        if (itemsError) throw itemsError;

        // Auto-annul duplicate meds in other active prescriptions (only for new prescriptions, not edits)
        if (!isEditMode && patient) {
          await autoAnnulDuplicateMeds(prescriptionId, group.items, patient.id);
        }
      }

      const medNames = nonEmptyGroups.flatMap(g => g.items.map(i => i.medication_name)).join(', ');

      for (const group of nonEmptyGroups) {
        await logAudit({
          patientId: patient.id,
          patientCode: patientCode,
          entityType: 'prescription',
          actionType: isEditMode ? 'update' : 'create',
          description: isEditMode
            ? `Editó receta con medicamentos: ${group.items.map(i => i.medication_name).join(', ')}`
            : `Creó receta con medicamentos: ${group.items.map(i => i.medication_name).join(', ')}`,
        });
      }

      toast({ 
        title: isEditMode 
          ? 'Receta actualizada exitosamente'
          : `${nonEmptyGroups.length === 1 ? 'Receta creada' : `${nonEmptyGroups.length} recetas creadas`} exitosamente` 
      });
      navigate(`/PrescripcionInteligente/patients/${patientCode}`);
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse-soft flex flex-col items-center gap-4">
          <Pill className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/PrescripcionInteligente/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Paciente no encontrado</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-16 z-40 -mx-8 px-8 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/PrescripcionInteligente/patients/${patientCode}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEditMode ? 'Editar Receta' : renewPrescriptionId ? 'Renovar Receta' : 'Nueva Receta'}</h1>
            <p className="text-muted-foreground">Paciente: {patient.full_name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || totalItems === 0}>
          {saving ? 'Guardando...' : isEditMode 
            ? 'Actualizar Receta'
            : groups.filter(g => g.items.length > 0).length > 1 
            ? `Guardar ${groups.filter(g => g.items.length > 0).length} Recetas` 
            : 'Guardar Receta'}
        </Button>
      </div>

      {/* Prescription Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {groups.map((group, index) => (
          <div key={group.id} className="flex items-center">
            <Button
              variant={activeGroupIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveGroupIndex(index)}
              className="rounded-r-none"
            >
              <Pill className="h-3.5 w-3.5 mr-1.5" />
              {group.label}
              {group.items.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {group.items.length}
                </Badge>
              )}
            </Button>
            <div className="flex border-l-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeGroupIndex === index ? "default" : "outline"}
                    size="sm"
                    className="rounded-none px-1.5 border-l-0"
                    onClick={() => duplicateGroup(index)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicar receta</TooltipContent>
              </Tooltip>
              {groups.length > 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeGroupIndex === index ? "default" : "outline"}
                      size="sm"
                      className="rounded-l-none px-1.5 border-l-0"
                      onClick={() => removePrescriptionGroup(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eliminar receta</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addPrescriptionGroup}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Receta
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: AI Text and Search */}
        <div className="space-y-4">
          {/* AI Text Input */}
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Ingreso con IA
              </CardTitle>
              <CardDescription>
                Escribe o pega el texto de la receta y la IA lo interpretará
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`Ejemplo:\nLosartan 50mg c/24h\nMetformina 850mg c/12h\nInsulina NPH 24-36\nEnalapril 5mg c/24h\nLevotiroxina 50mcg 8 comp c/7d`}
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <Button 
                onClick={parseWithAI} 
                disabled={parsingAi || !aiText.trim()}
                className="w-full"
              >
                {parsingAi ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Interpretando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Agregar a {activeGroup.label}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Agregar Manualmente
              </CardTitle>
              <CardDescription>O busca y selecciona del arsenal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar medicamento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchQuery && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredMedications.length > 0 ? (
                    filteredMedications.slice(0, 8).map((med) => (
                      <div
                        key={med.id}
                        className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => addMedication(med)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {med.active_ingredient} • {med.dose_value}{med.dose_unit} • {med.presentation}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No se encontraron medicamentos
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issue date, Expiry and notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fecha y Validez — {activeGroup.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha de emisión</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !activeGroup.issueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activeGroup.issueDate ? format(activeGroup.issueDate, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={activeGroup.issueDate}
                      onSelect={(date) => date && updateActiveGroup({ issueDate: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Días de validez</Label>
                <Select value={activeGroup.expiryDays.toString()} onValueChange={(v) => updateActiveGroup({ expiryDays: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                    <SelectItem value="180">180 días</SelectItem>
                    <SelectItem value="365">1 año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Indicaciones especiales..."
                  value={activeGroup.notes}
                  onChange={(e) => updateActiveGroup({ notes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Selected medications */}
        <div className="space-y-4">
          {/* Risk Warnings */}
          {patient && activeGroup.items.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <RiskWarnings
                  diagnoses={patient.diagnoses}
                  age={patient.age}
                  medicationNames={activeGroup.items.map(i => i.medication_name)}
                />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                {activeGroup.label} — Medicamentos ({activeGroup.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeGroup.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Usa el campo de IA o busca medicamentos</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {activeGroup.items.map((item) => (
                    <div key={item.tempId} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <Pill className="h-4 w-4 text-primary" />
                            {item.medication_name}
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.tabletsPerDose && item.tabletsPerDose !== 1 && !item.isInsulin && (
                              <Badge className="text-xs bg-primary/10 text-primary">
                                {formatTablets(item.tabletsPerDose)} {(item.useCustomPresentation && item.customPresentation ? item.customPresentation : item.arsenalPresentation || 'comp').toLowerCase()}
                              </Badge>
                            )}
                            {item.useCustomPresentation && item.customPresentation && (
                              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                                Presentación: {item.customPresentation}
                              </Badge>
                            )}
                            {item.isInsulin && (
                              <Badge variant="secondary" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Insulina
                              </Badge>
                            )}
                            {item.isWeekly && (
                              <Badge variant="outline" className="text-xs">Semanal</Badge>
                            )}
                            {item.isSos && (
                              <Badge className="text-xs bg-warning text-warning-foreground font-semibold">
                                🆘 SOS
                              </Badge>
                            )}
                            {!item.medication_id && (
                              <Badge variant="destructive" className="text-xs">No en arsenal</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeItem(item.tempId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        {/* Frequency */}
                        <div className="space-y-1">
                          <Label className="text-xs">Frecuencia</Label>
                          <Select
                            value={item.frequency}
                            onValueChange={(v) => updateItem(item.tempId, { frequency: v })}
                          >
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FREQUENCY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Presentation toggle */}
                        {item.arsenalPresentation && !item.isInsulin && (
                          <PresentationSelector
                            item={item}
                            onUpdate={(updates) => updateItem(item.tempId, updates)}
                          />
                        )}

                        {/* Schedule */}
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Horarios
                            {item.scheduleReason && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-primary cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">{item.scheduleReason}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {item.schedule.map((time, idx) => (
                              <Badge key={idx} variant="outline" className={item.scheduleReason ? 'border-primary/50' : ''}>
                                {time}
                              </Badge>
                            ))}
                            {item.scheduleReason && (
                              <span className="text-xs text-primary italic ml-1 self-center">(evidencia)</span>
                            )}
                          </div>
                        </div>

                        {/* INSULIN: AM/PM fields */}
                        {item.isInsulin && (item.frequency === 'c/12h' || item.frequency === 'c/24h') && (
                          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 space-y-2">
                            <Label className="text-xs flex items-center gap-1 text-warning-foreground">
                              <AlertCircle className="h-3 w-3" />
                              Distribución AM / PM *
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">AM (mañana)</Label>
                                <Input
                                  type="number"
                                  placeholder="Ej: 24"
                                  value={item.insulinAm ?? ''}
                                  onChange={(e) => updateItem(item.tempId, { insulinAm: e.target.value ? Number(e.target.value) : null })}
                                  className="bg-background h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">PM (noche)</Label>
                                <Input
                                  type="number"
                                  placeholder="Ej: 36"
                                  value={item.insulinPm ?? ''}
                                  onChange={(e) => updateItem(item.tempId, { insulinPm: e.target.value ? Number(e.target.value) : null })}
                                  className="bg-background h-9"
                                />
                              </div>
                            </div>
                            {item.insulinAm !== null && item.insulinPm !== null && (
                              <p className="text-xs text-muted-foreground">
                                Total: {(item.insulinAm || 0) + (item.insulinPm || 0)}U → {item.insulinAm}U AM / {item.insulinPm}U PM
                              </p>
                            )}
                          </div>
                        )}

                        {/* WEEKLY: Day selector */}
                        {item.isWeekly && (
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
                            <Label className="text-xs flex items-center gap-1 text-primary">
                              <AlertCircle className="h-3 w-3" />
                              Seleccionar días y dosis *
                            </Label>
                            <div className="grid grid-cols-7 gap-1">
                              {DAY_LABELS.map((day, i) => {
                                const isActive = item.weeklyDays[day] > 0;
                                return (
                                  <div key={day} className="flex flex-col items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => updateWeeklyDay(item.tempId, day, isActive ? 0 : 1)}
                                      className={cn(
                                        "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                                        isActive
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted text-muted-foreground hover:bg-accent"
                                      )}
                                    >
                                      {DAY_DISPLAY[i]}
                                    </button>
                                    {isActive && (
                                      <Select
                                        value={item.weeklyDays[day].toString()}
                                        onValueChange={(v) => updateWeeklyDay(item.tempId, day, parseFloat(v))}
                                      >
                                        <SelectTrigger className="h-7 w-14 text-xs px-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {[0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                                            <SelectItem key={v} value={v.toString()}>
                                              {formatTablets(v)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Total semanal: {formatTablets(Object.values(item.weeklyDays).reduce((a, b) => a + b, 0))} {item.isInsulin ? 'UI' : 'comp.'}
                            </p>
                          </div>
                        )}

                        {/* SOS / A demanda */}
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`sos-${item.tempId}`}
                              checked={item.isSos}
                              onCheckedChange={(checked) => updateItem(item.tempId, { isSos: !!checked })}
                            />
                            <Label htmlFor={`sos-${item.tempId}`} className="text-xs cursor-pointer flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-warning" />
                              SOS / A demanda
                            </Label>
                          </div>
                        </div>
                        {item.isSos && (
                          <div className="space-y-1">
                            <Label className="text-xs">Motivo SOS</Label>
                            <Input
                              placeholder="Ej: En caso de dolor, En caso de fiebre..."
                              value={item.sosReason || ''}
                              onChange={(e) => updateItem(item.tempId, { sosReason: e.target.value || null })}
                              className="h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
