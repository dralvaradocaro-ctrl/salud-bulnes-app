import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PROA_BED_MAP as BASE_PROA_BED_MAP } from '@/lib/hospitalSuggestions';
import { archiveProaRecord, deleteProaRecord, fetchProaRecords, getLatestProaForm, isHistoricalProaRecord, moveProaRecordToBed, readProaRegistry, saveProaPreAdmission, setPendingProaForm } from '@/lib/proaRegistry';
import { buildRenalFunctionText } from '@/lib/renalFunction';
import { ANTIBIOTICOS, DEFAULT_DOSIS_ATB, DIAGNOSTICOS_INFECTO, PATOGENOS, PRESENTACIONES_ATB, TIPOS_MUESTRA } from '@/pages/VisitaPROA';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Bed,
  ChevronLeft,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  Copy,
  Plus,
  Printer,
  RotateCw,
  ShieldPlus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

const moduleCardClass = 'group block h-full rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md';
const CHART_COLORS = ['#0f766e', '#0284c7', '#7c3aed', '#d97706', '#dc2626', '#059669', '#4f46e5', '#be185d'];
const localTodayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const PROA_BED_MAP = [
  ...BASE_PROA_BED_MAP,
  {
    servicio: 'Hospitalización domiciliaria',
    groups: [{
      label: 'Cupos indiferenciados',
      beds: Array.from({ length: 15 }, (_, index) => `HD-${index + 1}`),
    }],
  },
  {
    servicio: 'Sala de prueba PROA',
    groups: [{ label: 'No contabiliza en estadísticas', beds: ['TEST-PROA-1'] }],
  },
];

function formatUpdatedAt(value) {
  if (!value) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return 'Sin fecha';
  }
}

function formatProaRut(value) {
  const clean = String(value || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

function summarizeLatest(form) {
  if (!form) return 'Sin evolución registrada.';
  const diagnosis = form.diagnostico_actual || 'Sin diagnóstico consignado';
  const atb = (form.antibioticos || [])
    .filter((item) => item.nombre)
    .map((item) => item.nombre)
    .slice(0, 3)
    .join(', ');
  return atb ? `${diagnosis} · ATB: ${atb}` : diagnosis;
}

// Parseo tolerante de fecha (ISO yyyy-mm-dd o dd/mm/aaaa).
function parseProaDate(s) {
  if (!s) return null;
  let d = new Date(`${s}T00:00:00`);
  if (!Number.isNaN(d.getTime())) return d;
  const m = String(s).match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    const yr = m[3].length === 2 ? `20${m[3]}` : m[3];
    d = new Date(`${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}
function daysSince(s, { inclusive = false } = {}) {
  const d = parseProaDate(s);
  if (!d) return null;
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff < 0) return null;
  return inclusive ? diff + 1 : diff;
}

function hospitalStayDays(form) {
  const start = parseProaDate(form?.fecha_ingreso);
  if (!start) return null;
  const end = form?.fecha_egreso
    ? parseProaDate(form.fecha_egreso)
    : form?.proa_archived_at ? new Date(form.proa_archived_at) : new Date();
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);
  return diff >= 0 ? diff : null;
}

// Resumen para el tooltip al pasar sobre una cama ocupada (si hay info).
function bedTooltip(form) {
  if (!form) return '';
  const lines = [];
  const dx = form.diagnostico_actual || form.diagnostico_microbiologico;
  if (dx) lines.push(`Diagnóstico: ${dx}`);
  const atbs = (form.antibioticos || []).filter((a) => a.nombre);
  if (atbs.length) {
    const txt = atbs.map((a) => {
      const dia = daysSince(a.inicio, { inclusive: true });
      const dosis = [a.dosis, a.intervalo_horas ? `c/${a.intervalo_horas} h` : '', a.via].filter(Boolean).join(' ');
      return `${a.nombre}${dosis ? ` ${dosis}` : ''}${dia ? ` (día ${dia})` : ''}`;
    }).join(' · ');
    lines.push(`ATB: ${txt}`);
  }
  const diasHosp = daysSince(form.fecha_ingreso);
  if (diasHosp !== null) lines.push(`Días de hospitalización: ${diasHosp}`);
  return lines.join('\n');
}

function findServiceForBed(bedCode) {
  return PROA_BED_MAP.find((service) => (
    service.groups.some((group) => group.beds.includes(bedCode))
  ))?.servicio || '';
}

function displayBedCode(bedCode) {
  return String(bedCode || '').replace(/^MQ2-/, '');
}

const ALL_PROA_BEDS = PROA_BED_MAP.flatMap((service) => (
  service.groups.flatMap((group) => group.beds.map((bed) => ({ bed, servicio: service.servicio })))
));

const EMPTY_PRE_ANTIBIOTIC = {
  nombre: '',
  presentacion: '',
  dosis_cantidad: '',
  dosis_unidad: 'g',
  presentacion_unidad: 'g',
  intervalo_horas: '',
  via: 'EV',
  inicio: '',
};
const EMPTY_PRE_CULTURE = { tipo_muestra: '', fecha: '', patogeno: '', sensibilidad: 'Pendiente', resistente: [], sensible: [], intermedio: [], antibiograma_nota: '', antibiograma: '' };

function formatPreAntibiotic(item) {
  const dose = item.dosis_unidad === 'ampolla'
    ? `${item.dosis_cantidad || ''} ${Number(item.dosis_cantidad) === 1 ? 'ampolla' : 'ampollas'}`
    : `${item.dosis_cantidad || ''} ${item.dosis_unidad || ''}`.trim();
  return [
    item.nombre,
    item.presentacion && `(${item.presentacion})`,
    dose,
    item.intervalo_horas && `c/${item.intervalo_horas} h`,
    item.via,
  ].filter(Boolean).join(' ');
}

function getLastInflammatoryRows(form) {
  return (form?.parametros_inflamatorios || [])
    .filter((row) => row && Object.values(row).some(Boolean))
    .sort((a, b) => (parseProaDate(b.fecha)?.getTime() || 0) - (parseProaDate(a.fecha)?.getTime() || 0))
    .slice(0, 3);
}

function formatInflammatoryRow(row) {
  const values = [
    row.pcr && `PCR ${row.pcr}`,
    row.blancos && `Leucos ${row.blancos}`,
    row.pct && `PCT ${row.pct}`,
    row.crea && `Cr ${row.crea}`,
    row.vhs && `VHS ${row.vhs}`,
    row.temp && `T° ${row.temp}`,
  ].filter(Boolean);
  return `${row.fecha || 'Sin fecha'}: ${values.join(' · ') || 'Sin valores'}`;
}

function formatMicroStudies(form) {
  return (form?.estudios_micro || [])
    .filter((study) => study?.tipo_muestra || study?.patogeno)
    .map((study) => [study.tipo_muestra, study.fecha, study.patogeno].filter(Boolean).join(' · '))
    .join('; ') || form?.estudios_imagen || '—';
}

function formatAntimicrobial(item, form) {
  const structuredDose = item.dosis_modo === 'ampolla' || item.dosis_unidad === 'ampolla'
    ? item.unidades_por_dosis && `${item.unidades_por_dosis} ampolla${Number(item.unidades_por_dosis) === 1 ? '' : 's'}`
    : item.dosis_cantidad && `${item.dosis_cantidad} ${item.dosis_unidad || ''}`.trim();
  const dose = item.dosis || [
    structuredDose,
    item.intervalo_horas && `c/${item.intervalo_horas} h`,
    item.via,
  ].filter(Boolean).join(' ');
  const duration = item.inicio
    ? daysSince(item.inicio, { inclusive: true })
    : null;
  return {
    name: item.nombre || '—',
    dose: dose || 'Dosis no registrada',
    duration: item.termino
      ? `${item.inicio || '—'} a ${item.termino}`
      : duration
        ? `Día ${duration}`
        : form?.plan_duracion || 'Sin duración',
  };
}

function recordOccupiesDateRange(record, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true;
  const form = getLatestProaForm(record) || {};
  const admission = form.fecha_ingreso || '';
  if (!admission) return false;
  const discharge = isHistoricalProaRecord(record)
    ? (form.fecha_egreso || String(form.proa_archived_at || record.updatedAt || '').slice(0, 10))
    : '';
  if (dateTo && admission && admission > dateTo) return false;
  if (dateFrom && discharge && discharge < dateFrom) return false;
  return true;
}

function isPositiveCulture(culture) {
  const pathogen = String(culture?.patogeno || '').trim();
  if (!pathogen) return false;
  return !/^(pendiente|sin desarrollo|negativo|sin crecimiento|no desarrollo)$/i.test(pathogen);
}

function isTestProaRecord(record) {
  const form = getLatestProaForm(record) || {};
  return Boolean(form.proa_is_test || form.cama === 'TEST-PROA-1' || record?.bedCode === 'TEST-PROA-1');
}

const TABLE_HEADERS = ['Código PROA', 'Nombre', 'RUT', 'Cama', 'Servicio', 'Estado', 'Fecha de egreso', 'Edad', 'Fecha de ingreso', 'Días de estadía', 'DG', 'Función renal', 'Antibioterapia', 'DG microbiológico', 'Estudio', 'Últimos 3 PI', 'Antimicrobiano', 'Dosis', 'Duración', 'Plan'];
const PRINT_HEADERS = ['Servicio', 'Cama', 'Paciente', 'Edad / estadía', 'Diagnóstico', 'Función renal', 'Antibioterapia', 'Microbiología / estudios', 'Últimos 3 PI', 'Plan'];

function buildProaTableRows(records) {
  return records.map((record) => {
    const form = getLatestProaForm(record) || {};
    const antimicrobials = (form.antibioticos || []).filter((item) => item?.nombre);
    const formatted = antimicrobials.map((item) => formatAntimicrobial(item, form));
    const plan = [
      ...(form.recomendaciones || []),
      form.recomendaciones_otra,
      form.plan_duracion,
      form.proxima_revision && `Próxima revisión: ${form.proxima_revision}`,
    ].filter(Boolean).join(' · ');
    return [
      record.code,
      form.paciente || '—',
      form.rut || '—',
      displayBedCode(form.cama || record.bedCode),
      findServiceForBed(form.cama || record.bedCode) || 'Sin servicio',
      isHistoricalProaRecord(record) ? 'Egresado' : 'Actual',
      form.fecha_egreso || '—',
      form.edad ? `${form.edad} años` : '—',
      form.fecha_ingreso || 'Sin fecha',
      hospitalStayDays(form) ?? '—',
      form.diagnostico_actual || '—',
      form.funcion_renal || '—',
      form.antibioterapia_preingreso || antimicrobials.map((item) => item.nombre).join(', ') || '—',
      form.diagnostico_microbiologico || '—',
      formatMicroStudies(form),
      getLastInflammatoryRows(form).map(formatInflammatoryRow).join('\n') || '—',
      formatted.map((item) => item.name).join('\n') || '—',
      formatted.map((item) => item.dose).join('\n') || '—',
      formatted.map((item) => item.duration).join('\n') || '—',
      plan || '—',
    ];
  });
}

function buildProaPrintRows(records) {
  return records.map((record) => {
    const form = getLatestProaForm(record) || {};
    const antimicrobials = (form.antibioticos || []).filter((item) => item?.nombre);
    const formatted = antimicrobials.map((item) => formatAntimicrobial(item, form));
    const identity = [
      form.paciente || record.code,
      form.rut && `RUT ${form.rut}`,
      isHistoricalProaRecord(record) ? `Egresado ${form.fecha_egreso || ''}`.trim() : 'Actual',
    ].filter(Boolean).join('\n');
    const stay = [
      form.edad && `${form.edad} años`,
      form.fecha_ingreso && `Ingreso ${form.fecha_ingreso}`,
      form.fecha_egreso && `Egreso ${form.fecha_egreso}`,
      hospitalStayDays(form) != null && `${hospitalStayDays(form)} días`,
    ].filter(Boolean).join('\n');
    const antibioticText = formatted.length
      ? formatted.map((item) => `${item.name}: ${item.dose} · ${item.duration}`).join('\n')
      : '—';
    const microbiology = [
      form.diagnostico_microbiologico,
      formatMicroStudies(form) !== '—' && formatMicroStudies(form),
    ].filter(Boolean).join('\n') || '—';
    const plan = [
      ...(form.recomendaciones || []),
      form.recomendaciones_otra,
      form.plan_duracion,
      form.proxima_revision && `Revisión: ${form.proxima_revision}`,
    ].filter(Boolean).join(' · ') || '—';
    return [
      findServiceForBed(form.cama || record.bedCode) || 'Sin servicio',
      displayBedCode(form.cama || record.bedCode),
      identity,
      stay || '—',
      form.diagnostico_actual || '—',
      form.funcion_renal || '—',
      antibioticText,
      microbiology,
      getLastInflammatoryRows(form).map(formatInflammatoryRow).join('\n') || '—',
      plan,
    ];
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function GestionPROA() {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('Home'));
  };
  const bedMapRef = useRef(null);
  const tableRef = useRef(null);
  const [records, setRecords] = useState(() => readProaRegistry());
  const [selectedBed, setSelectedBed] = useState('');
  const [activeService, setActiveService] = useState(PROA_BED_MAP[0]?.servicio || '');
  const [sourceBedToMove, setSourceBedToMove] = useState('');
  const [showPreAdmission, setShowPreAdmission] = useState(false);
  const [preAdmissionArchiveOnly, setPreAdmissionArchiveOnly] = useState(false);
  const [recordToView, setRecordToView] = useState(null);
  const [savingPreAdmission, setSavingPreAdmission] = useState(false);
  const [preAdmissionError, setPreAdmissionError] = useState('');
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [recordToArchive, setRecordToArchive] = useState(null);
  const [archivingRecord, setArchivingRecord] = useState(false);
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().slice(0, 10));
  const [occupiedRecordForPreAdmission, setOccupiedRecordForPreAdmission] = useState(null);
  const [replacementDischargeDate, setReplacementDischargeDate] = useState(new Date().toISOString().slice(0, 10));
  const [resolvingOccupiedBed, setResolvingOccupiedBed] = useState(false);
  const [tableCopied, setTableCopied] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [tableScope, setTableScope] = useState('actuales');
  const [tableAntibioticFilter, setTableAntibioticFilter] = useState('');
  const [tableBedFilter, setTableBedFilter] = useState('');
  const [tableDateFrom, setTableDateFrom] = useState('');
  const [tableDateTo, setTableDateTo] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const [chartsUseTableFilters, setChartsUseTableFilters] = useState(false);
  const [preAdmission, setPreAdmission] = useState({
    cama: '',
    paciente: '',
    rut: '',
    edad: '',
    sexo: '',
    creatinina: '',
    fecha_ingreso: '',
    antibioticos: [{ ...EMPTY_PRE_ANTIBIOTIC }],
    cultivos: [{ ...EMPTY_PRE_CULTURE }],
    diagnostico: '',
  });

  const recordsByBed = useMemo(() => (
    records.filter((record) => !isHistoricalProaRecord(record)).reduce((acc, record) => {
      acc[record.bedCode] = record;
      return acc;
    }, {})
  ), [records]);

  const selectedRecord = selectedBed ? recordsByBed[selectedBed] : null;
  const selectedLatest = getLatestProaForm(selectedRecord);
  const viewedLatest = getLatestProaForm(recordToView);
  const currentService = PROA_BED_MAP.find((service) => service.servicio === activeService) || PROA_BED_MAP[0];
  const savedClinicalCatalog = useMemo(() => {
    const diagnoses = new Set();
    const antibiotics = new Set();
    records.forEach((record) => {
      (record.evolutions || []).forEach((evolution) => {
        const form = evolution?.form || {};
        if (form.diagnostico_actual) diagnoses.add(form.diagnostico_actual);
        (form.antibioticos || []).forEach((item) => {
          if (!item?.nombre) return;
          antibiotics.add(item.nombre);
        });
      });
    });
    return {
      diagnoses: [...new Set([...DIAGNOSTICOS_INFECTO, ...diagnoses])].sort((a, b) => a.localeCompare(b, 'es')),
      antibiotics: [...new Set([...ANTIBIOTICOS, ...antibiotics])].sort((a, b) => a.localeCompare(b, 'es')),
    };
  }, [records]);

  const refreshRecords = () => fetchProaRecords().then((nextRecords) => {
    setRecords(nextRecords);
    return nextRecords;
  });
  const currentRecords = useMemo(() => records.filter((record) => !isHistoricalProaRecord(record)), [records]);
  const historicalRecords = useMemo(() => records.filter(isHistoricalProaRecord), [records]);
  const clinicalRecords = useMemo(() => records.filter((record) => !isTestProaRecord(record)), [records]);
  const currentClinicalRecords = useMemo(
    () => currentRecords.filter((record) => !isTestProaRecord(record)),
    [currentRecords],
  );
  const historicalClinicalRecords = useMemo(
    () => historicalRecords.filter((record) => !isTestProaRecord(record)),
    [historicalRecords],
  );
  const currentTestRecords = currentRecords.length - currentClinicalRecords.length;
  const historicalTestRecords = historicalRecords.length - historicalClinicalRecords.length;
  const visibleTableRecords = useMemo(() => {
    const scoped = tableScope === 'historicos'
      ? historicalRecords
      : tableScope === 'todos'
        ? records
        : currentRecords;
    const query = tableAntibioticFilter.trim().toLowerCase();
    return scoped.filter((record) => {
      const form = getLatestProaForm(record) || {};
      const effectiveBed = form.cama || record.bedCode;
      const matchesBed = !tableBedFilter || effectiveBed === tableBedFilter;
      const matchesAntibiotic = !query || (form.antibioticos || [])
        .some((item) => item?.nombre?.toLowerCase().includes(query));
      return matchesBed
        && matchesAntibiotic
        && recordOccupiesDateRange(record, tableDateFrom, tableDateTo);
    });
  }, [
    currentRecords,
    historicalRecords,
    records,
    tableAntibioticFilter,
    tableBedFilter,
    tableDateFrom,
    tableDateTo,
    tableScope,
  ]);
  const tableRows = useMemo(() => buildProaTableRows(visibleTableRecords), [visibleTableRecords]);
  const printRows = useMemo(() => buildProaPrintRows(visibleTableRecords), [visibleTableRecords]);
  const groupedTableRecords = useMemo(() => {
    const groups = new Map(PROA_BED_MAP.map((service) => [service.servicio, []]));
    groups.set('Sin servicio', []);
    visibleTableRecords.forEach((record) => {
      const form = getLatestProaForm(record) || {};
      const service = findServiceForBed(form.cama || record.bedCode) || 'Sin servicio';
      if (!groups.has(service)) groups.set(service, []);
      groups.get(service).push(record);
    });
    return [...groups.entries()]
      .filter(([, serviceRecords]) => serviceRecords.length > 0)
      .map(([service, serviceRecords]) => ({
        service,
        records: serviceRecords.sort((a, b) => {
          const bedA = getLatestProaForm(a)?.cama || a.bedCode;
          const bedB = getLatestProaForm(b)?.cama || b.bedCode;
          return bedA.localeCompare(bedB, 'es', { numeric: true });
        }),
      }));
  }, [visibleTableRecords]);
  const currentProaAnalytics = useMemo(() => {
    const antibioticCounts = new Map();
    const pathogenCounts = new Map();
    let patientsWithAntibiotics = 0;
    let patientsWithPositiveCulture = 0;

    const analyticsRecords = chartsUseTableFilters
      ? visibleTableRecords.filter((record) => !isHistoricalProaRecord(record) && !isTestProaRecord(record))
      : currentClinicalRecords;
    analyticsRecords.forEach((record) => {
      const form = getLatestProaForm(record) || {};
      const antibiotics = (form.antibioticos || []).filter((item) => item?.nombre);
      const positiveCultures = (form.estudios_micro || []).filter(isPositiveCulture);
      if (antibiotics.length > 0) patientsWithAntibiotics += 1;
      if (antibiotics.length > 0 && positiveCultures.length > 0) patientsWithPositiveCulture += 1;
      antibiotics.forEach((item) => {
        const name = item.nombre.trim();
        antibioticCounts.set(name, (antibioticCounts.get(name) || 0) + 1);
      });
      positiveCultures.forEach((culture) => {
        const pathogen = culture.patogeno.trim();
        pathogenCounts.set(pathogen, (pathogenCounts.get(pathogen) || 0) + 1);
      });
    });

    const totalTreatments = [...antibioticCounts.values()].reduce((sum, count) => sum + count, 0);
    const antibiotics = [...antibioticCounts.entries()]
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalTreatments ? Math.round((count / totalTreatments) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    const pathogens = [...pathogenCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      antibiotics,
      pathogens,
      patientsWithAntibiotics,
      patientsWithPositiveCulture,
      totalTreatments,
    };
  }, [chartsUseTableFilters, currentClinicalRecords, visibleTableRecords]);

  // Cargar desde Supabase al montar (fuente de verdad, multi-dispositivo).
  useEffect(() => { fetchProaRecords().then(setRecords); }, []);

  const serviceRecordCount = (service) => service.groups.reduce((total, group) => (
    total + group.beds.filter((bed) => recordsByBed[bed]).length
  ), 0);

  const handleServiceChange = (serviceName) => {
    setActiveService(serviceName);
    const nextService = PROA_BED_MAP.find((service) => service.servicio === serviceName);
    const selectedIsVisible = nextService?.groups.some((group) => group.beds.includes(selectedBed));
    if (!selectedIsVisible) setSelectedBed('');
    setSourceBedToMove('');
  };

  const editFromLatest = () => {
    if (!selectedLatest) return;
    setPendingProaForm(selectedLatest);
    navigate(createPageUrl('VisitaPROA'));
  };

  const editExistingLatestEvolution = () => {
    if (!viewedLatest) return;
    setPendingProaForm({
      ...viewedLatest,
      __proaEditLatest: true,
    });
    setRecordToView(null);
    navigate(createPageUrl('VisitaPROA'));
  };

  const createFromBed = () => {
    if (!selectedBed) return;
    setPendingProaForm({
      cama: selectedBed,
      servicio: findServiceForBed(selectedBed),
      __proaRegistryMode: selectedRecord ? 'new_patient' : '',
    });
    navigate(createPageUrl('VisitaPROA'));
  };

  const movePatientToSelectedBed = async () => {
    if (!selectedBed || !sourceBedToMove) return;
    await moveProaRecordToBed(sourceBedToMove, selectedBed, findServiceForBed(selectedBed));
    setSourceBedToMove('');
    refreshRecords();
  };

  const scrollToBedMap = () => {
    bedMapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openPreAdmission = (bed = '', { archiveOnly = false } = {}) => {
    setPreAdmission({
      cama: bed,
      paciente: '',
      rut: '',
      edad: '',
      sexo: '',
      creatinina: '',
      fecha_ingreso: '',
      antibioticos: [{ ...EMPTY_PRE_ANTIBIOTIC }],
      cultivos: [{ ...EMPTY_PRE_CULTURE }],
      diagnostico: '',
    });
    setPreAdmissionArchiveOnly(archiveOnly);
    setPreAdmissionError('');
    setShowPreAdmission(true);
  };

  const persistPreAdmission = async () => {
    setSavingPreAdmission(true);
    setPreAdmissionError('');
    try {
      const servicio = findServiceForBed(preAdmission.cama);
      await saveProaPreAdmission({
        ...preAdmission,
        servicio,
      });
      setShowPreAdmission(false);
      setSelectedBed(preAdmission.cama);
      setActiveService(servicio || activeService);
      await refreshRecords();
    } catch (error) {
      console.error('Error guardando preingreso PROA:', error);
      setPreAdmissionError('No fue posible guardar el paciente PROA. Intenta nuevamente.');
    } finally {
      setSavingPreAdmission(false);
    }
  };

  const savePreAdmission = async () => {
    if (!preAdmission.cama || !preAdmission.edad || !preAdmission.fecha_ingreso || !preAdmission.diagnostico.trim()) {
      setPreAdmissionError('Completa cama, edad, fecha de ingreso y diagnóstico.');
      return;
    }
    const incompleteAntibiotic = preAdmission.antibioticos.some((item) => (
      item.nombre && (!item.presentacion || !item.dosis_cantidad || !item.intervalo_horas || !item.via || !item.inicio)
    ));
    if (incompleteAntibiotic) {
      setPreAdmissionError('Completa presentación, dosis, frecuencia, vía y fecha de inicio de cada antimicrobiano.');
      return;
    }
    const occupiedRecord = recordsByBed[preAdmission.cama];
    if (occupiedRecord) {
      setOccupiedRecordForPreAdmission(occupiedRecord);
      setReplacementDischargeDate(new Date().toISOString().slice(0, 10));
      return;
    }
    await persistPreAdmission();
  };

  const resolveOccupiedBedAndSave = async (action) => {
    if (!occupiedRecordForPreAdmission) return;
    if (action === 'discharge' && !replacementDischargeDate) {
      setPreAdmissionError('Indica la fecha de egreso del paciente anterior.');
      return;
    }
    setResolvingOccupiedBed(true);
    try {
      if (action === 'delete') await deleteProaRecord(occupiedRecordForPreAdmission.bedCode);
      else await archiveProaRecord(occupiedRecordForPreAdmission, replacementDischargeDate);
      setOccupiedRecordForPreAdmission(null);
      await persistPreAdmission();
    } catch (error) {
      console.error('Error resolviendo cama PROA ocupada:', error);
      setPreAdmissionError('No fue posible resolver el registro anterior. No se guardó el paciente nuevo.');
    } finally {
      setResolvingOccupiedBed(false);
    }
  };

  const updatePreAntibiotic = (index, key, value) => {
    setPreAdmission((current) => ({
      ...current,
      antibioticos: current.antibioticos.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (key === 'presentacion') {
          const presentationInfo = (PRESENTACIONES_ATB[item.nombre] || []).find((option) => option.label === value);
          return { ...item, presentacion: value, presentacion_unidad: presentationInfo?.unidad || item.presentacion_unidad };
        }
        if (key !== 'nombre') return { ...item, [key]: value };
        const preset = DEFAULT_DOSIS_ATB[value];
        const presentation = preset?.presentacion || PRESENTACIONES_ATB[value]?.[0]?.label || '';
        const presentationInfo = (PRESENTACIONES_ATB[value] || []).find((option) => option.label === presentation);
        return {
          ...item,
          nombre: value,
          presentacion,
          presentacion_unidad: presentationInfo?.unidad || preset?.dosis_unidad || item.presentacion_unidad,
          dosis_cantidad: preset?.dosis_cantidad || preset?.unidades_por_dosis || item.dosis_cantidad,
          dosis_unidad: preset?.dosis_modo === 'ampolla' ? 'ampolla' : (preset?.dosis_unidad || item.dosis_unidad),
          intervalo_horas: preset?.intervalo_horas || item.intervalo_horas,
          via: preset?.via || item.via || 'EV',
        };
      }),
    }));
  };

  const addPreAntibiotic = () => setPreAdmission((current) => ({
    ...current,
    antibioticos: [...current.antibioticos, { ...EMPTY_PRE_ANTIBIOTIC }],
  }));

  const removePreAntibiotic = (index) => setPreAdmission((current) => ({
    ...current,
    antibioticos: current.antibioticos.length === 1
      ? [{ ...EMPTY_PRE_ANTIBIOTIC }]
      : current.antibioticos.filter((_, itemIndex) => itemIndex !== index),
  }));

  const updatePreCulture = (index, key, value) => setPreAdmission((current) => ({
    ...current,
    cultivos: current.cultivos.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
  }));

  const addPreCulture = () => setPreAdmission((current) => ({
    ...current,
    cultivos: [...current.cultivos, { ...EMPTY_PRE_CULTURE }],
  }));

  const removePreCulture = (index) => setPreAdmission((current) => ({
    ...current,
    cultivos: current.cultivos.length === 1
      ? [{ ...EMPTY_PRE_CULTURE }]
      : current.cultivos.filter((_, itemIndex) => itemIndex !== index),
  }));

  const printProaTable = () => {
    const printWindow = window.open('', '_blank', 'width=1400,height=900');
    if (!printWindow) return;
    const headerHtml = PRINT_HEADERS.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
    const rowsHtml = printRows.map((row) => (
      `<tr>${row.map((cell) => `<td>${escapeHtml(cell).replace(/\n/g, '<br>')}</td>`).join('')}</tr>`
    )).join('');
    printWindow.document.write(`<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Tabla de pacientes PROA</title>
          <style>
            @page { size: A4 landscape; margin: 6mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #0f172a; font-family: Arial, sans-serif; }
            h1 { margin: 0 0 2px; font-size: 14px; }
            .meta { margin: 0 0 5px; color: #475569; font-size: 8px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            thead { display: table-header-group; }
            th, td { border: 0.5px solid #94a3b8; padding: 2.5px; vertical-align: top; overflow-wrap: anywhere; }
            th { background: #dbeafe; font-size: 6.7px; line-height: 1.1; text-transform: uppercase; }
            td { font-size: 7px; line-height: 1.15; }
            th:nth-child(1), td:nth-child(1) { width: 8%; }
            th:nth-child(2), td:nth-child(2) { width: 5%; font-weight: 700; }
            th:nth-child(3), td:nth-child(3) { width: 10%; }
            th:nth-child(4), td:nth-child(4) { width: 8%; }
            th:nth-child(5), td:nth-child(5) { width: 12%; }
            th:nth-child(6), td:nth-child(6) { width: 8%; }
            th:nth-child(7), td:nth-child(7) { width: 15%; }
            th:nth-child(8), td:nth-child(8) { width: 12%; }
            th:nth-child(9), td:nth-child(9) { width: 11%; }
            th:nth-child(10), td:nth-child(10) { width: 11%; }
            tr { break-inside: avoid; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>Tabla de pacientes PROA</h1>
          <p class="meta">Hospital Comunitario de Salud Familiar de Bulnes · ${new Date().toLocaleString('es-CL')}</p>
          <table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>
          <script>window.addEventListener('load', () => { window.print(); });<\/script>
        </body>
      </html>`);
    printWindow.document.close();
    setShowPrintPreview(false);
  };

  const copyProaTable = async () => {
    const clipboardText = [
      TABLE_HEADERS,
      ...tableRows,
    ].map((row) => row.map((cell) => String(cell ?? '').replace(/\t/g, ' ').replace(/\n/g, ' · ')).join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(clipboardText);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = clipboardText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setTableCopied(true);
    window.setTimeout(() => setTableCopied(false), 2500);
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setDeletingRecord(true);
    setDeleteError('');
    try {
      await deleteProaRecord(recordToDelete.bedCode);
      setRecords((current) => current.filter((record) => record.bedCode !== recordToDelete.bedCode));
      if (selectedBed === recordToDelete.bedCode) setSelectedBed('');
      setRecordToDelete(null);
      await refreshRecords();
    } catch (error) {
      console.error('Error eliminando paciente PROA:', error);
      setDeleteError('No fue posible borrar el paciente del servidor. Intenta nuevamente.');
    } finally {
      setDeletingRecord(false);
    }
  };

  const openDischargeDialog = (record) => {
    setDischargeDate(new Date().toISOString().slice(0, 10));
    setRecordToArchive(record);
  };

  const confirmArchiveRecord = async () => {
    if (!recordToArchive || !dischargeDate) return;
    setArchivingRecord(true);
    try {
      await archiveProaRecord(recordToArchive, dischargeDate);
      if (selectedBed === recordToArchive.bedCode) setSelectedBed('');
      setRecordToArchive(null);
      await refreshRecords();
      setTableScope('historicos');
    } catch (error) {
      console.error('Error archivando paciente PROA:', error);
    } finally {
      setArchivingRecord(false);
    }
  };

  const modules = [
    {
      title: 'Evolución PROA',
      description: 'Registro imprimible para evolucionar la visita del Programa de Optimización del Uso de Antimicrobianos.',
      icon: ClipboardList,
      color: 'teal',
      status: 'Disponible',
      to: createPageUrl('VisitaPROA'),
    },
    {
      title: 'Pacientes por cama',
      description: 'Mapa navegable con identificación, cama y última Evolución PROA sincronizada.',
      icon: Users,
      color: 'teal',
      status: `${clinicalRecords.length} registros`,
      onClick: scrollToBedMap,
    },
    {
      title: 'Tablas de seguimiento',
      description: 'Listado clínico consolidado de pacientes PROA, diagnósticos, PI, microbiología, antimicrobianos y plan.',
      icon: FileSpreadsheet,
      color: 'slate',
      status: `${clinicalRecords.length} pacientes`,
      onClick: () => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    },
  ];

  const renderCard = (mod, index) => {
    const Icon = mod.icon;
    const available = Boolean(mod.to || mod.onClick);
    const colors = mod.color === 'teal'
      ? {
          border: 'border-teal-200 hover:border-teal-300',
          icon: 'bg-teal-600',
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          action: 'text-teal-700',
        }
      : {
          border: 'border-slate-200 border-dashed',
          icon: 'bg-slate-100',
          iconText: 'text-slate-500',
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          action: 'text-slate-500',
        };

    const inner = (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className={`${moduleCardClass} ${colors.border}`}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
            <Icon className={`h-5 w-5 ${colors.iconText || 'text-white'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-900">{mod.title}</p>
              <Badge className={colors.badge}>{mod.status}</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{mod.description}</p>
            <div className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${colors.action}`}>
              {available ? 'Abrir módulo' : 'Preparado para integrar'}
              {available && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </div>
          </div>
        </div>
      </motion.div>
    );

    if (mod.to) return (
      <Link key={mod.title} to={mod.to} className="block">
        {inner}
      </Link>
    );

    return mod.onClick ? (
      <button key={mod.title} type="button" onClick={mod.onClick} className="block w-full text-left">
        {inner}
      </button>
    ) : (
      <div key={mod.title}>{inner}</div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={goBack} title="Volver">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600">
                <ShieldPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Gestión PROA</h1>
                <p className="text-sm text-slate-500">Seguimiento clínico e identificación exclusiva del módulo PROA</p>
              </div>
            </div>
            <Button onClick={() => openPreAdmission()} className="gap-2 bg-teal-600 hover:bg-teal-700">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar paciente PROA</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {modules.map(renderCard)}
        </div>

        <section ref={bedMapRef} className="mt-6 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Bed className="h-5 w-5 text-teal-700" />
                Buscar paciente por cama
              </h2>
              <p className="text-sm text-slate-500">Selecciona una cama para revisar el código y retomar la última evolución PROA.</p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshRecords} className="gap-2 self-start sm:self-auto">
              <RotateCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <Tabs value={activeService} onValueChange={handleServiceChange} className="space-y-4">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-slate-100 p-1.5">
                  {PROA_BED_MAP.map((service) => (
                    <TabsTrigger
                      key={service.servicio}
                      value={service.servicio}
                      className="gap-2 rounded-lg px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-teal-800"
                    >
                      {service.servicio}
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {serviceRecordCount(service)}/{service.groups.reduce((total, group) => total + group.beds.length, 0)}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {PROA_BED_MAP.map((service) => (
                  <TabsContent key={service.servicio} value={service.servicio} className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-bold text-slate-800">{service.servicio}</p>
                        <Badge className="border-slate-200 bg-white text-slate-600">
                          {service.groups.reduce((total, group) => total + group.beds.length, 0)} camas
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {service.groups.map((group) => (
                          <div key={`${service.servicio}-${group.label}`}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                              {group.beds.map((bed) => {
                                const record = recordsByBed[bed];
                                const selected = selectedBed === bed;
                                const tip = record ? bedTooltip(getLatestProaForm(record)) : '';
                                return (
                                  <div key={bed} className="group relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBed(bed);
                                        setSourceBedToMove('');
                                      }}
                                      className={`w-full min-h-[62px] rounded-xl border px-3 py-2 text-left transition ${
                                        selected
                                          ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                                          : record
                                            ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
                                            : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="block text-base font-bold text-slate-900">{displayBedCode(bed)}</span>
                                        {record && (
                                          <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Ocupada</span>
                                        )}
                                      </div>
                                      {record ? (
                                        <>
                                          <span className="mt-0.5 block truncate text-xs font-semibold text-emerald-800">
                                            {getLatestProaForm(record)?.paciente || record.code}
                                          </span>
                                          {getLatestProaForm(record)?.paciente && (
                                            <span className="block truncate text-[9px] text-slate-500">{record.code}</span>
                                          )}
                                          <span className="mt-0.5 block text-[10px] text-slate-500">{formatUpdatedAt(record.updatedAt)}</span>
                                        </>
                                      ) : (
                                        <span className="mt-1 block text-xs text-slate-400">Libre</span>
                                      )}
                                    </button>
                                    {tip && (
                                      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-64 max-w-[80vw] -translate-x-1/2 group-hover:block">
                                        <div className="rounded-lg bg-slate-900/95 px-3 py-2 text-left text-[11px] leading-snug text-white shadow-xl ring-1 ring-black/10">
                                          {tip.split('\n').map((line, li) => {
                                            const idx = line.indexOf(':');
                                            const label = idx > -1 ? line.slice(0, idx) : '';
                                            const value = idx > -1 ? line.slice(idx + 1).trim() : line;
                                            return (
                                              <p key={li} className={li > 0 ? 'mt-1' : ''}>
                                                {label && <span className="font-bold text-emerald-300">{label}: </span>}
                                                {value}
                                              </p>
                                            );
                                          })}
                                        </div>
                                        <div className="mx-auto -mt-1 h-2 w-2 rotate-45 bg-slate-900/95" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-700">Detalle</p>
              {!selectedBed && (
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Elige una cama de {currentService?.servicio} para ver si tiene registro PROA guardado.
                </p>
              )}

              {selectedBed && !selectedRecord && (
                <div className="mt-3 space-y-3">
                  <Badge className="border-slate-200 bg-white text-slate-700">Cama {displayBedCode(selectedBed)}</Badge>
                  <p className="text-sm text-slate-500">No hay registro PROA asociado a esta cama.</p>
                  <Button onClick={() => openPreAdmission(selectedBed)} className="w-full bg-teal-600 hover:bg-teal-700">
                    Agregar paciente PROA
                  </Button>
                  <Button onClick={createFromBed} variant="outline" className="w-full">Ir directo a Evolución PROA</Button>
                  <MovePatientControl
                    records={records}
                    selectedBed={selectedBed}
                    sourceBedToMove={sourceBedToMove}
                    setSourceBedToMove={setSourceBedToMove}
                    onMove={movePatientToSelectedBed}
                    onDelete={(record) => setRecordToDelete(record)}
                  />
                </div>
              )}

              {selectedRecord && (
                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Identificación PROA</p>
                    <p className="mt-1 text-2xl font-black text-emerald-800">{selectedRecord.code}</p>
                    {selectedLatest?.paciente && <p className="mt-2 font-bold text-slate-900">{selectedLatest.paciente}</p>}
                    {selectedLatest?.rut && <p className="text-sm text-slate-600">RUT {selectedLatest.rut}</p>}
                    {selectedLatest?.edad && <p className="text-sm text-slate-600">{selectedLatest.edad} años</p>}
                    <p className="mt-1 text-sm text-slate-500">Cama {displayBedCode(selectedRecord.bedCode)}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 font-medium text-slate-700">
                      <Clock3 className="h-4 w-4 text-slate-500" />
                      Última actualización: {formatUpdatedAt(selectedRecord.updatedAt)}
                    </p>
                    <p className="leading-relaxed text-slate-600">{summarizeLatest(selectedLatest)}</p>
                    {selectedLatest?.evolucion && (
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Última evolución</p>
                        <p className="line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">{selectedLatest.evolucion}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border border-teal-200 bg-teal-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-900">¿Qué quieres hacer con esta cama?</p>
                    <Button type="button" onClick={() => setRecordToView(selectedRecord)} variant="outline" className="w-full border-sky-300 bg-white text-sky-800 hover:bg-sky-50">
                      Ver última evolución
                    </Button>
                    <Button onClick={editFromLatest} className="w-full bg-teal-600 hover:bg-teal-700">
                      Actualizar evolución
                    </Button>
                    <p className="text-[11px] leading-tight text-teal-800">Carga la evolución previa y actualiza días de hospitalización, días de antibiótico y la curva inflamatoria.</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openDischargeDialog(selectedRecord)}
                      className="w-full border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
                    >
                      Egresar paciente
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRecordToDelete(selectedRecord)}
                      className="w-full border-red-300 bg-white text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Borrar paciente
                    </Button>
                    <Button
                      type="button"
                      onClick={() => openPreAdmission(selectedBed, { archiveOnly: true })}
                      variant="outline"
                      className="w-full border-slate-400 bg-white font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Ingresar nuevo paciente
                    </Button>
                    <p className="text-[11px] leading-tight text-slate-600">Al confirmar el nuevo ingreso, el paciente anterior será egresado y conservado en el histórico.</p>
                  </div>

                  <MovePatientControl
                    records={records}
                    selectedBed={selectedBed}
                    sourceBedToMove={sourceBedToMove}
                    setSourceBedToMove={setSourceBedToMove}
                    onMove={movePatientToSelectedBed}
                    onDelete={(record) => setRecordToDelete(record)}
                  />
                </div>
              )}
            </aside>
          </div>
        </section>

        <section ref={tableRef} className="mt-6 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <FileSpreadsheet className="h-5 w-5 text-teal-700" />
                Tabla de pacientes PROA
              </h2>
              <p className="text-sm text-slate-500">Resumen del último preingreso o evolución formal disponible por cama.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showCharts ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCharts((current) => !current)}
                className={showCharts ? 'bg-teal-700 hover:bg-teal-800' : ''}
              >
                {showCharts ? 'Ocultar gráficos' : 'Ver gráficos'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPrintPreview(true)} disabled={visibleTableRecords.length === 0} className="gap-2">
                <Printer className="h-4 w-4" /> Imprimir tabla
              </Button>
              <Button variant="outline" size="sm" onClick={copyProaTable} disabled={visibleTableRecords.length === 0} className="gap-2 border-emerald-300 text-emerald-800">
                <Copy className="h-4 w-4" /> {tableCopied ? 'Tabla copiada' : 'Copiar para Sheets'}
              </Button>
              <Button variant="outline" size="sm" onClick={refreshRecords} className="gap-2">
                <RotateCw className="h-4 w-4" /> Actualizar
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs">Estado del paciente</Label>
              <select value={tableScope} onChange={(event) => setTableScope(event.target.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="actuales">
                  Pacientes actuales ({currentClinicalRecords.length}{currentTestRecords ? ` + ${currentTestRecords} prueba` : ''})
                </option>
                <option value="historicos">
                  Pacientes egresados / histórico ({historicalClinicalRecords.length}{historicalTestRecords ? ` + ${historicalTestRecords} prueba` : ''})
                </option>
                <option value="todos">
                  Todos ({clinicalRecords.length}{records.length - clinicalRecords.length ? ` + ${records.length - clinicalRecords.length} prueba` : ''})
                </option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs">Cama actual o histórica</Label>
              <select
                value={tableBedFilter}
                onChange={(event) => setTableBedFilter(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Todas las camas</option>
                {ALL_PROA_BEDS.map(({ bed, servicio }) => (
                  <option key={bed} value={bed}>{servicio} · {displayBedCode(bed)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                value={tableDateFrom}
                onChange={(event) => setTableDateFrom(event.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                min={tableDateFrom || undefined}
                value={tableDateTo}
                onChange={(event) => setTableDateTo(event.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1 lg:col-span-3">
              <Label className="text-xs">Filtrar por antibiótico</Label>
              <Input
                value={tableAntibioticFilter}
                onChange={(event) => setTableAntibioticFilter(event.target.value)}
                placeholder="Ej.: ceftriaxona, meropenem..."
                className="h-9"
              />
            </div>
            {(tableAntibioticFilter || tableBedFilter || tableDateFrom || tableDateTo || tableScope !== 'actuales') && (
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setTableScope('actuales');
                setTableAntibioticFilter('');
                setTableBedFilter('');
                setTableDateFrom('');
                setTableDateTo('');
              }} className="lg:col-span-2">Limpiar filtros</Button>
            )}
            <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-12">
              {visibleTableRecords.length} paciente{visibleTableRecords.length === 1 ? '' : 's'} en el listado. El rango muestra pacientes cuya estadía coincidió total o parcialmente con esas fechas.
            </p>
          </div>

          {showCharts && (
            <div className="grid gap-4 border-b border-slate-200 bg-slate-50/60 p-4 lg:grid-cols-12">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:col-span-12">
                <div>
                  <p className="text-sm font-bold text-slate-900">Alcance de los gráficos</p>
                  <p className="text-xs text-slate-500">
                    {chartsUseTableFilters
                      ? 'Solo pacientes actuales que coinciden con los filtros de la tabla.'
                      : 'Resumen global de todos los pacientes actuales.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setChartsUseTableFilters((current) => !current)}
                >
                  {chartsUseTableFilters ? 'Mostrar todos los actuales' : 'Aplicar filtros de tabla'}
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:col-span-12">
                <div className="rounded-xl border border-teal-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pacientes actuales con antibióticos</p>
                  <p className="mt-2 text-3xl font-black text-teal-800">{currentProaAnalytics.patientsWithAntibiotics}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Con antibioterapia y cultivo positivo</p>
                  <p className="mt-2 text-3xl font-black text-emerald-700">{currentProaAnalytics.patientsWithPositiveCulture}</p>
                  <p className="text-xs text-slate-500">
                    {currentProaAnalytics.patientsWithAntibiotics
                      ? `${Math.round((currentProaAnalytics.patientsWithPositiveCulture / currentProaAnalytics.patientsWithAntibiotics) * 100)}% de quienes usan antibióticos`
                      : 'Sin pacientes con antibióticos'}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tratamientos antimicrobianos activos</p>
                  <p className="mt-2 text-3xl font-black text-sky-700">{currentProaAnalytics.totalTreatments}</p>
                  <p className="text-xs text-slate-500">Un paciente puede utilizar más de uno.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-7">
                <h3 className="font-bold text-slate-900">Antibióticos en uso actualmente</h3>
                <p className="mb-3 text-xs text-slate-500">% calculado sobre el total de tratamientos antimicrobianos activos.</p>
                {currentProaAnalytics.antibiotics.length > 0 ? (
                  <div className="grid items-center gap-2 md:grid-cols-[minmax(260px,1fr)_minmax(220px,0.8fr)]">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={currentProaAnalytics.antibiotics} layout="vertical" margin={{ left: 12, right: 36 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} unit="%" />
                          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Uso']} />
                          <Bar dataKey="percentage" radius={[0, 5, 5, 0]}>
                            {currentProaAnalytics.antibiotics.map((item, index) => (
                              <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {currentProaAnalytics.antibiotics.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <strong>{item.percentage}% ({item.count})</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-16 text-center text-sm text-slate-500">No hay antibioterapia activa registrada.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-5">
                <h3 className="font-bold text-slate-900">Cultivos positivos: microorganismos</h3>
                <p className="mb-3 text-xs text-slate-500">Cantidad de aislamientos registrados en pacientes actuales.</p>
                {currentProaAnalytics.pathogens.length > 0 ? (
                  <>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={currentProaAnalytics.pathogens} dataKey="count" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={2}>
                            {currentProaAnalytics.pathogens.map((item, index) => (
                              <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Aislamientos']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5">
                      {currentProaAnalytics.pathogens.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <strong>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="py-16 text-center text-sm text-slate-500">No hay cultivos positivos registrados en pacientes actuales.</p>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-[1540px] w-full border-collapse text-xs">
              <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-600">
                <tr>
                  {['Paciente', 'Cama', 'Edad / ingreso', 'DG', 'Función renal', 'Antibioterapia', 'DG microbiológico', 'Estudio', 'Últimos 3 PI', 'Antimicrobiano', 'Dosis', 'Duración', 'Plan'].map((heading, index) => (
                    <th
                      key={heading}
                      className={`border-b border-r border-slate-200 px-3 py-2 font-bold last:border-r-0 ${
                        index === 0 ? 'sticky left-0 z-20 min-w-[190px] bg-slate-100' : ''
                      } ${index === 1 ? 'sticky left-[190px] z-20 min-w-[105px] bg-slate-100 shadow-[3px_0_5px_-4px_rgba(15,23,42,0.45)]' : ''}`}
                    >
                      {heading}
                    </th>
                  ))}
                  <th className="sticky right-0 border-b border-l border-slate-200 bg-slate-100 px-3 py-2 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groupedTableRecords.map(({ service, records: serviceRecords }) => (
                  <Fragment key={service}>
                    <tr className="bg-teal-800 text-white">
                      <td colSpan={14} className="border-b border-teal-900 px-4 py-2.5">
                        <span className="font-black uppercase tracking-wide">{service}</span>
                        <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 font-semibold">
                          {serviceRecords.length} paciente{serviceRecords.length === 1 ? '' : 's'}
                        </span>
                      </td>
                    </tr>
                    {serviceRecords.map((record) => {
                      const form = getLatestProaForm(record) || {};
                      const effectiveBed = form.cama || record.bedCode;
                      const antimicrobials = (form.antibioticos || []).filter((item) => item?.nombre);
                      const formattedAntimicrobials = antimicrobials.map((item) => formatAntimicrobial(item, form));
                      const piRows = getLastInflammatoryRows(form);
                      const plan = [
                        ...(form.recomendaciones || []),
                        form.recomendaciones_otra,
                        form.plan_duracion,
                        form.proxima_revision && `Próxima revisión: ${form.proxima_revision}`,
                      ].filter(Boolean).join(' · ');
                      return (
                    <tr key={record.id} className="align-top odd:bg-white even:bg-slate-50/60 hover:bg-teal-50/50">
                      <td className="sticky left-0 z-10 min-w-[190px] border-b border-r border-slate-200 bg-inherit px-3 py-3">
                        <div className="text-left">
                          <span className="block font-bold text-teal-800">{record.code}</span>
                          {form.paciente && <span className="block font-semibold text-slate-900">{form.paciente}</span>}
                          {form.rut && <span className="block text-slate-500">RUT {form.rut}</span>}
                          {form.proa_is_test && <Badge className="mt-1 block w-fit bg-violet-100 text-violet-800">Paciente de prueba · no contabiliza</Badge>}
                          <Badge className={`mt-1 ${isHistoricalProaRecord(record) ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}>
                            {isHistoricalProaRecord(record) ? `Egresado${form.fecha_egreso ? ` · ${form.fecha_egreso}` : ''}` : 'Actual'}
                          </Badge>
                        </div>
                      </td>
                      <td className="sticky left-[190px] z-10 min-w-[105px] border-b border-r border-slate-200 bg-inherit px-3 py-3 shadow-[3px_0_5px_-4px_rgba(15,23,42,0.45)]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBed(isHistoricalProaRecord(record) ? '' : record.bedCode);
                            setActiveService(findServiceForBed(effectiveBed));
                            scrollToBedMap();
                          }}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-left text-base font-black text-teal-900 hover:bg-teal-100"
                        >
                          {displayBedCode(effectiveBed)}
                        </button>
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3">
                        <span className="block">{form.edad ? `${form.edad} años` : '—'}</span>
                        <span className="text-slate-500">{form.fecha_ingreso || 'Sin fecha'}</span>
                        {form.fecha_egreso && <span className="block font-semibold text-amber-700">Egreso: {form.fecha_egreso}</span>}
                        <span className="mt-1 block font-medium text-slate-700">
                          {hospitalStayDays(form) != null ? `${hospitalStayDays(form)} días de estadía` : 'Estadía sin calcular'}
                        </span>
                      </td>
                      <td className="max-w-[190px] border-b border-r border-slate-200 px-3 py-3">{form.diagnostico_actual || '—'}</td>
                      <td className="max-w-[160px] border-b border-r border-slate-200 px-3 py-3">{form.funcion_renal || '—'}</td>
                      <td className="max-w-[180px] border-b border-r border-slate-200 px-3 py-3">
                        {form.antibioterapia_preingreso || antimicrobials.map((item) => item.nombre).join(', ') || '—'}
                      </td>
                      <td className="max-w-[180px] border-b border-r border-slate-200 px-3 py-3">{form.diagnostico_microbiologico || '—'}</td>
                      <td className="max-w-[220px] border-b border-r border-slate-200 px-3 py-3">{formatMicroStudies(form)}</td>
                      <td className="max-w-[240px] border-b border-r border-slate-200 px-3 py-3">
                        {piRows.length ? piRows.map((row, index) => <span key={`${row.fecha}-${index}`} className="mb-1 block">{formatInflammatoryRow(row)}</span>) : '—'}
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3">
                        {formattedAntimicrobials.length ? formattedAntimicrobials.map((item, index) => <span key={index} className="mb-1 block font-medium">{item.name}</span>) : '—'}
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3">
                        {formattedAntimicrobials.length ? formattedAntimicrobials.map((item, index) => <span key={index} className="mb-1 block">{item.dose}</span>) : '—'}
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3">
                        {formattedAntimicrobials.length ? formattedAntimicrobials.map((item, index) => <span key={index} className="mb-1 block">{item.duration}</span>) : '—'}
                      </td>
                      <td className="max-w-[240px] border-b border-slate-200 px-3 py-3">{plan || '—'}</td>
                      <td className="sticky right-0 border-b border-l border-slate-200 bg-white px-2 py-3">
                        <div className="space-y-1">
                          {!isHistoricalProaRecord(record) && (
                            <Button type="button" variant="outline" size="sm" onClick={() => openDischargeDialog(record)} className="h-8 w-full px-2 text-slate-700">
                              Egresar
                            </Button>
                          )}
                          {isHistoricalProaRecord(record) && (
                            <Badge className="w-full justify-center bg-slate-200 py-1.5 text-slate-700">Egresado</Badge>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeleteError('');
                              setRecordToDelete(record);
                            }}
                            className="h-8 w-full gap-1 border-red-200 px-2 text-red-700 hover:bg-red-50 hover:text-red-800"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Borrar
                          </Button>
                        </div>
                      </td>
                    </tr>
                      );
                    })}
                  </Fragment>
                ))}
                {visibleTableRecords.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-sm text-slate-500">No hay pacientes PROA registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Dialog open={!!recordToView} onOpenChange={(open) => { if (!open) setRecordToView(null); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Última evolución PROA</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Paciente</p>
              <p className="mt-1 font-bold text-slate-900">{viewedLatest?.paciente || recordToView?.code}</p>
              <p className="text-sm text-slate-600">Cama {displayBedCode(viewedLatest?.cama || recordToView?.bedCode)}</p>
              <p className="text-sm text-slate-600">Actualizada: {formatUpdatedAt(recordToView?.updatedAt)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Resumen clínico</p>
              <p className="mt-1 text-sm text-slate-700">{summarizeLatest(viewedLatest) || 'Sin resumen disponible.'}</p>
              {viewedLatest?.funcion_renal && <p className="mt-1 text-sm text-slate-700">{viewedLatest.funcion_renal}</p>}
            </div>
            <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2">
              <p className="mb-2 text-xs font-bold uppercase text-slate-500">Evolución</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{viewedLatest?.evolucion || 'No hay narrativa de evolución registrada; el último registro corresponde al preingreso.'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-slate-500">Antibioterapia</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {(viewedLatest?.antibioticos || []).filter((item) => item?.nombre).map((item) => `${item.nombre}: ${formatAntimicrobial(item, viewedLatest).dose}`).join('\n') || '—'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-slate-500">Microbiología y plan</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{formatMicroStudies(viewedLatest)}</p>
              {viewedLatest?.plan_duracion && <p className="mt-2 text-sm font-medium text-slate-800">{viewedLatest.plan_duracion}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRecordToView(null)}>Cerrar</Button>
            <Button onClick={editExistingLatestEvolution} className="bg-teal-700 hover:bg-teal-800">
              Editar esta evolución
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="flex max-h-[94vh] w-[calc(100vw-2rem)] max-w-[96vw] flex-col gap-3 p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-teal-700" />
              Vista previa de impresión — Tabla PROA
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
            <span>{visibleTableRecords.length} paciente{visibleTableRecords.length === 1 ? '' : 's'} · A4 horizontal</span>
            <span>La impresión combina campos relacionados para aprovechar mejor cada página.</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-300 bg-white">
            <table className="min-w-[1200px] w-full table-fixed border-collapse text-[10px] leading-tight">
              <thead className="sticky top-0 z-10 bg-blue-100 text-left uppercase text-slate-700">
                <tr>
                  {PRINT_HEADERS.map((header, index) => (
                    <th
                      key={header}
                      className="border-b border-r border-slate-300 px-2 py-2 last:border-r-0"
                      style={{ width: `${[8, 5, 10, 8, 12, 8, 15, 12, 11, 11][index]}%` }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {printRows.map((row, rowIndex) => (
                  <tr key={`${row[0]}-${row[1]}-${rowIndex}`} className="align-top even:bg-slate-50">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className={`whitespace-pre-line border-b border-r border-slate-200 px-2 py-2 last:border-r-0 ${cellIndex === 1 ? 'font-black text-teal-900' : ''}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowPrintPreview(false)}>Cerrar</Button>
            <Button type="button" onClick={printProaTable} className="gap-2 bg-teal-700 hover:bg-teal-800">
              <Printer className="h-4 w-4" />
              Imprimir esta vista
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreAdmission} onOpenChange={setShowPreAdmission}>
        <DialogContent
          className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto p-4 sm:p-6"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-700" />
              Agregar paciente PROA
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-x-4 gap-y-3 md:grid-cols-12">
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="proa-pre-bed">Cama *</Label>
              <select
                id="proa-pre-bed"
                value={preAdmission.cama}
                onChange={(event) => {
                  setPreAdmission((current) => ({ ...current, cama: event.target.value }));
                  setPreAdmissionError('');
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar cama...</option>
                {ALL_PROA_BEDS.map(({ bed, servicio }) => <option key={bed} value={bed}>{servicio} · {displayBedCode(bed)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="proa-pre-age">Edad *</Label>
              <Input id="proa-pre-age" type="number" min="0" max="120" value={preAdmission.edad} onChange={(event) => setPreAdmission((current) => ({ ...current, edad: event.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-4">
              <Label htmlFor="proa-pre-name">Nombre del paciente</Label>
              <Input
                id="proa-pre-name"
                value={preAdmission.paciente}
                onChange={(event) => setPreAdmission((current) => ({ ...current, paciente: event.target.value }))}
                placeholder="Nombre y apellidos"
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="proa-pre-rut">RUT</Label>
              <Input
                id="proa-pre-rut"
                value={preAdmission.rut}
                onChange={(event) => setPreAdmission((current) => ({ ...current, rut: formatProaRut(event.target.value) }))}
                placeholder="12.345.678-9"
              />
            </div>
            <p className="text-[11px] text-slate-500 md:col-span-12">
              Nombre, RUT y edad se guardan exclusivamente en Gestión/Evolución PROA.
            </p>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="proa-pre-sex">Sexo para cálculo de VFG</Label>
              <select
                id="proa-pre-sex"
                value={preAdmission.sexo}
                onChange={(event) => setPreAdmission((current) => ({ ...current, sexo: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="proa-pre-creatinine">Creatinina sérica (mg/dL)</Label>
              <Input
                id="proa-pre-creatinine"
                type="number"
                min="0"
                step="0.01"
                value={preAdmission.creatinina}
                onChange={(event) => setPreAdmission((current) => ({ ...current, creatinina: event.target.value }))}
                placeholder="Ej.: 1,20"
              />
            </div>
            <div className="flex items-end md:col-span-6">
              <div className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                {preAdmission.creatinina
                  ? buildRenalFunctionText(preAdmission)
                  : 'Al ingresar creatinina, edad y sexo se calculará automáticamente la VFG.'}
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="proa-pre-date">Fecha de ingreso *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreAdmission((current) => ({ ...current, fecha_ingreso: localTodayIso() }))}
                  className="h-6 px-2 text-xs text-teal-700 hover:bg-teal-50"
                >
                  Hoy
                </Button>
              </div>
              <Input id="proa-pre-date" type="date" value={preAdmission.fecha_ingreso} onChange={(event) => setPreAdmission((current) => ({ ...current, fecha_ingreso: event.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-9">
              <Label htmlFor="proa-pre-diagnosis">Diagnóstico *</Label>
              <Input id="proa-pre-diagnosis" list="proa-pre-diagnoses" value={preAdmission.diagnostico} onChange={(event) => setPreAdmission((current) => ({ ...current, diagnostico: event.target.value }))} placeholder="Buscar diagnóstico infectológico vigente" />
              <datalist id="proa-pre-diagnoses">
                {savedClinicalCatalog.diagnoses.map((diagnosis) => <option key={diagnosis} value={diagnosis} />)}
              </datalist>
              <p className="text-[11px] text-slate-500">Incluye el catálogo de Evolución PROA y los diagnósticos previamente guardados.</p>
            </div>
            <div className="space-y-1.5 md:col-span-12">
              <div className="flex items-center justify-between">
                <Label>Antibioterapia vigente</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPreAntibiotic} className="h-8 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {preAdmission.antibioticos.map((item, index) => {
                  const presentationOptions = (PRESENTACIONES_ATB[item.nombre] || []).map((presentation) => presentation.label);
                  const presentationListId = `proa-pre-presentation-${index}`;
                  return (
                    <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Antimicrobiano {index + 1}</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePreAntibiotic(index)} className="h-7 w-7 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12">
                        <div className="space-y-1 lg:col-span-4">
                          <Label className="text-[11px]">Antibiótico</Label>
                        <Input
                          list="proa-pre-antibiotics"
                          value={item.nombre}
                          onChange={(event) => updatePreAntibiotic(index, 'nombre', event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') event.preventDefault();
                          }}
                          placeholder="Antimicrobiano"
                        />
                        </div>
                        <div className="space-y-1 lg:col-span-5">
                          <Label className="text-[11px]">Presentación disponible</Label>
                        <Input
                            list={presentationListId}
                            value={item.presentacion}
                            onChange={(event) => updatePreAntibiotic(index, 'presentacion', event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') event.preventDefault();
                            }}
                            placeholder="Ej.: Frasco ampolla 4,5 g"
                        />
                          <datalist id={presentationListId}>
                            {presentationOptions.map((presentation) => <option key={presentation} value={presentation} />)}
                          </datalist>
                        </div>
                        <div className="space-y-1 lg:col-span-3">
                          <Label className="text-[11px]">Fecha de inicio</Label>
                          <Input type="date" value={item.inicio} onChange={(event) => updatePreAntibiotic(index, 'inicio', event.target.value)} />
                        </div>
                        <div className="space-y-1 lg:col-span-4">
                          <Label className="text-[11px]">Dosis por administración</Label>
                          <div className="flex">
                            <Input type="number" min="0" step="0.1" value={item.dosis_cantidad} onChange={(event) => updatePreAntibiotic(index, 'dosis_cantidad', event.target.value)} className="rounded-r-none" placeholder="Ej.: 4,5 o 1" />
                            <select value={item.dosis_unidad} onChange={(event) => updatePreAntibiotic(index, 'dosis_unidad', event.target.value)} className="h-10 rounded-r-md border border-l-0 border-input bg-white px-2 text-sm">
                              {['g', 'mg', 'MUI', 'UI', 'ampolla'].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1 lg:col-span-3">
                          <Label className="text-[11px]">Frecuencia</Label>
                          <Input list="proa-pre-frequencies" value={item.intervalo_horas} onChange={(event) => updatePreAntibiotic(index, 'intervalo_horas', event.target.value)} placeholder="Horas, ej.: 8" />
                        </div>
                        <div className="space-y-1 lg:col-span-2">
                          <Label className="text-[11px]">Vía</Label>
                          <select value={item.via} onChange={(event) => updatePreAntibiotic(index, 'via', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
                            {['EV', 'VO', 'IM', 'SC', 'Inhalado'].map((via) => <option key={via} value={via}>{via}</option>)}
                          </select>
                        </div>
                        <div className="flex items-end lg:col-span-3">
                          <p className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">{formatPreAntibiotic(item) || 'Completa el esquema antibiótico.'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <datalist id="proa-pre-antibiotics">
                {savedClinicalCatalog.antibiotics.map((antibiotic) => <option key={antibiotic} value={antibiotic} />)}
              </datalist>
              <datalist id="proa-pre-frequencies">
                {['4', '6', '8', '12', '24', '48'].map((hours) => <option key={hours} value={hours}>{`Cada ${hours} horas`}</option>)}
              </datalist>
              <p className="text-[11px] text-slate-500">La presentación y pauta se precargan cuando existen; todos los campos permanecen editables.</p>
            </div>

            <div className="space-y-1.5 md:col-span-12">
              <div className="flex items-center justify-between">
                <Label>Cultivos (opcional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPreCulture} className="h-8 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Agregar cultivo
                </Button>
              </div>
              <div className="space-y-2">
                {preAdmission.cultivos.map((culture, index) => (
                  <div key={index} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 sm:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_36px]">
                    <Input list="proa-pre-samples" value={culture.tipo_muestra} onChange={(event) => updatePreCulture(index, 'tipo_muestra', event.target.value)} placeholder="Tipo de muestra" />
                    <Input type="date" value={culture.fecha} onChange={(event) => updatePreCulture(index, 'fecha', event.target.value)} />
                    <Input list="proa-pre-pathogens" value={culture.patogeno} onChange={(event) => updatePreCulture(index, 'patogeno', event.target.value)} placeholder="Resultado / patógeno" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePreCulture(index)} className="h-10 w-9 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <datalist id="proa-pre-samples">{TIPOS_MUESTRA.map((sample) => <option key={sample} value={sample} />)}</datalist>
              <datalist id="proa-pre-pathogens">{PATOGENOS.map((pathogen) => <option key={pathogen} value={pathogen} />)}</datalist>
            </div>
          </div>
          {preAdmissionError && <p className="text-sm font-medium text-red-600">{preAdmissionError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowPreAdmission(false)}>Cancelar</Button>
            <Button type="button" onClick={savePreAdmission} disabled={savingPreAdmission} className="bg-teal-600 hover:bg-teal-700">
              {savingPreAdmission ? 'Guardando…' : 'Guardar preingreso'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => {
        if (!open && !deletingRecord) {
          setRecordToDelete(null);
          setDeleteError('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar paciente PROA?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el paciente PROA <strong>{getLatestProaForm(recordToDelete)?.paciente || recordToDelete?.code}</strong> de la cama{' '}
              <strong>{displayBedCode(recordToDelete?.bedCode)}</strong>, incluyendo su preingreso y todas sus evoluciones PROA.
              Esta acción se replicará inmediatamente en la tabla y en el mapa de camas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm font-medium text-red-600">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingRecord}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDeleteRecord();
              }}
              disabled={deletingRecord}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deletingRecord ? 'Borrando…' : 'Sí, borrar paciente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!recordToArchive} onOpenChange={(open) => {
        if (!open && !archivingRecord) setRecordToArchive(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Egresar paciente PROA?</AlertDialogTitle>
            <AlertDialogDescription>
              El paciente PROA <strong>{getLatestProaForm(recordToArchive)?.paciente || recordToArchive?.code}</strong> dejará de ocupar la cama{' '}
              <strong>{displayBedCode(recordToArchive?.bedCode)}</strong>. Su preingreso y evoluciones se conservarán en el archivo de pacientes egresados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="proa-discharge-date">Fecha de egreso *</Label>
            <Input id="proa-discharge-date" type="date" value={dischargeDate} onChange={(event) => setDischargeDate(event.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archivingRecord}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmArchiveRecord();
              }}
              disabled={archivingRecord || !dischargeDate}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {archivingRecord ? 'Egresando…' : 'Confirmar egreso'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!occupiedRecordForPreAdmission} onOpenChange={(open) => {
        if (!open && !resolvingOccupiedBed) setOccupiedRecordForPreAdmission(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>La cama {displayBedCode(preAdmission.cama)} ya está ocupada en PROA</AlertDialogTitle>
            <AlertDialogDescription>
              Actualmente está asociada a <strong>{getLatestProaForm(occupiedRecordForPreAdmission)?.paciente || occupiedRecordForPreAdmission?.code}</strong>.
              {preAdmissionArchiveOnly
                ? ' Para ingresar al paciente nuevo se egresará al anterior y se conservará todo su historial.'
                : ' Antes de ingresar al paciente nuevo debes decidir qué hacer con el registro anterior.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <Label htmlFor="proa-replacement-discharge-date">Fecha de egreso del paciente anterior</Label>
            <Input
              id="proa-replacement-discharge-date"
              type="date"
              value={replacementDischargeDate}
              onChange={(event) => setReplacementDischargeDate(event.target.value)}
              className="bg-white"
            />
            <p className="text-xs text-amber-800">“Egresar y conservar” libera la cama y mantiene todo el historial en el archivo.</p>
          </div>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel disabled={resolvingOccupiedBed}>Cancelar</AlertDialogCancel>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {!preAdmissionArchiveOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resolveOccupiedBedAndSave('delete')}
                  disabled={resolvingOccupiedBed}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Eliminar registro anterior
                </Button>
              )}
              <Button
                type="button"
                onClick={() => resolveOccupiedBedAndSave('discharge')}
                disabled={resolvingOccupiedBed || !replacementDischargeDate}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                {resolvingOccupiedBed ? 'Procesando…' : 'Egresar y conservar'}
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MovePatientControl({ records, selectedBed, sourceBedToMove, setSourceBedToMove, onMove, onDelete }) {
  const movableRecords = records.filter((record) => !isHistoricalProaRecord(record) && record.bedCode !== selectedBed);
  const selectedSourceRecord = movableRecords.find((record) => record.bedCode === sourceBedToMove);
  if (!selectedBed || movableRecords.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Mover paciente desde otra cama</p>
      <select
        value={sourceBedToMove}
        onChange={(event) => setSourceBedToMove(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-teal-400 focus:outline-none"
      >
        <option value="">Seleccionar cama origen...</option>
        {movableRecords.map((record) => (
          <option key={record.id} value={record.bedCode}>
            {displayBedCode(record.bedCode)} · {record.code}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        onClick={onMove}
        disabled={!sourceBedToMove}
        className="w-full"
      >
        Mover a cama {displayBedCode(selectedBed)}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => onDelete(selectedSourceRecord)}
        disabled={!selectedSourceRecord}
        className="w-full border-red-300 text-red-700 hover:bg-red-50"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar paciente seleccionado
      </Button>
      <p className="text-[11px] leading-relaxed text-slate-500">
        Puedes mover el paciente a esta cama o eliminar completamente su registro PROA. La eliminación siempre solicitará confirmación.
      </p>
    </div>
  );
}

export default conPuertaAcceso(GestionPROA, {
  storageKey: 'acceso_medico',
  descripcion: 'Ingresa el código de acceso para usar Gestión PROA.',
});
