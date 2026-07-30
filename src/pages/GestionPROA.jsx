import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PROA_BED_MAP } from '@/lib/hospitalSuggestions';
import { fetchProaRecords, getLatestProaForm, moveProaRecordToBed, readProaRegistry, saveProaPreAdmission, setPendingProaForm } from '@/lib/proaRegistry';
import { ANTIBIOTICOS, DEFAULT_DOSIS_ATB, DIAGNOSTICOS_INFECTO, PRESENTACIONES_ATB } from '@/pages/VisitaPROA';
import {
  ArrowRight,
  Bed,
  ChevronLeft,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  Plus,
  RotateCw,
  ShieldPlus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

const moduleCardClass = 'group block h-full rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md';

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

const ALL_PROA_BEDS = PROA_BED_MAP.flatMap((service) => (
  service.groups.flatMap((group) => group.beds.map((bed) => ({ bed, servicio: service.servicio })))
));

const EMPTY_PRE_ANTIBIOTIC = { nombre: '', dosis: '', via: 'EV' };

function defaultAntibioticDose(name) {
  const dose = DEFAULT_DOSIS_ATB[name];
  if (!dose) return '';
  const amount = dose.dosis_cantidad
    ? `${dose.dosis_cantidad} ${dose.dosis_unidad || ''}`.trim()
    : dose.dosis_por_kg
      ? `${dose.dosis_por_kg} ${dose.dosis_unidad || 'mg'}/kg`
      : '';
  return [
    amount,
    dose.intervalo_horas && `c/${dose.intervalo_horas} h`,
    dose.via,
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
  const dose = item.dosis || [
    item.dosis_cantidad && `${item.dosis_cantidad} ${item.dosis_unidad || ''}`.trim(),
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
  const [savingPreAdmission, setSavingPreAdmission] = useState(false);
  const [preAdmissionError, setPreAdmissionError] = useState('');
  const [preAdmissionReplaceConfirmed, setPreAdmissionReplaceConfirmed] = useState(false);
  const [preAdmission, setPreAdmission] = useState({
    cama: '',
    edad: '',
    fecha_ingreso: '',
    antibioticos: [{ ...EMPTY_PRE_ANTIBIOTIC }],
    diagnostico: '',
  });

  const recordsByBed = useMemo(() => (
    records.reduce((acc, record) => {
      acc[record.bedCode] = record;
      return acc;
    }, {})
  ), [records]);

  const selectedRecord = selectedBed ? recordsByBed[selectedBed] : null;
  const selectedLatest = getLatestProaForm(selectedRecord);
  const currentService = PROA_BED_MAP.find((service) => service.servicio === activeService) || PROA_BED_MAP[0];
  const savedClinicalCatalog = useMemo(() => {
    const diagnoses = new Set();
    const antibiotics = new Set();
    const dosesByAntibiotic = {};
    records.forEach((record) => {
      (record.evolutions || []).forEach((evolution) => {
        const form = evolution?.form || {};
        if (form.diagnostico_actual) diagnoses.add(form.diagnostico_actual);
        (form.antibioticos || []).forEach((item) => {
          if (!item?.nombre) return;
          antibiotics.add(item.nombre);
          const dose = item.dosis || [
            item.dosis_cantidad && `${item.dosis_cantidad} ${item.dosis_unidad || ''}`.trim(),
            item.intervalo_horas && `c/${item.intervalo_horas} h`,
            item.via,
          ].filter(Boolean).join(' ');
          if (dose) {
            if (!dosesByAntibiotic[item.nombre]) dosesByAntibiotic[item.nombre] = new Set();
            dosesByAntibiotic[item.nombre].add(dose);
          }
        });
      });
    });
    return {
      diagnoses: [...new Set([...DIAGNOSTICOS_INFECTO, ...diagnoses])].sort((a, b) => a.localeCompare(b, 'es')),
      antibiotics: [...new Set([...ANTIBIOTICOS, ...antibiotics])].sort((a, b) => a.localeCompare(b, 'es')),
      dosesByAntibiotic,
    };
  }, [records]);

  const refreshRecords = () => { fetchProaRecords().then(setRecords); };

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

  // Nueva evolución formal del mismo paciente. Conserva los datos base capturados
  // en el preingreso, pero no arrastra la narrativa ni el plan de la evolución previa.
  const newBlankEvolution = () => {
    if (!selectedBed) return;
    setPendingProaForm({
      cama: selectedBed,
      servicio: findServiceForBed(selectedBed),
      edad: selectedLatest?.edad || '',
      fecha_ingreso: selectedLatest?.fecha_ingreso || '',
      diagnostico_actual: selectedLatest?.diagnostico_actual || '',
      antibioticos: selectedLatest?.antibioticos || [],
      antibioterapia_preingreso: selectedLatest?.antibioterapia_preingreso || '',
    });
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

  const openPreAdmission = (bed = '') => {
    setPreAdmission({
      cama: bed,
      edad: '',
      fecha_ingreso: '',
      antibioticos: [{ ...EMPTY_PRE_ANTIBIOTIC }],
      diagnostico: '',
    });
    setPreAdmissionError('');
    setPreAdmissionReplaceConfirmed(false);
    setShowPreAdmission(true);
  };

  const savePreAdmission = async () => {
    if (!preAdmission.cama || !preAdmission.edad || !preAdmission.fecha_ingreso || !preAdmission.diagnostico.trim()) {
      setPreAdmissionError('Completa cama, edad, fecha de ingreso y diagnóstico.');
      return;
    }
    const incompleteAntibiotic = preAdmission.antibioticos.some((item) => item.nombre && !item.dosis.trim());
    if (incompleteAntibiotic) {
      setPreAdmissionError('Completa la dosis de cada antimicrobiano seleccionado.');
      return;
    }
    const occupiedRecord = recordsByBed[preAdmission.cama];
    if (occupiedRecord && !preAdmissionReplaceConfirmed) {
      setPreAdmissionReplaceConfirmed(true);
      setPreAdmissionError(`La cama ${preAdmission.cama} ya contiene al paciente ${occupiedRecord.code}. Presiona nuevamente “Guardar preingreso” para confirmar su reemplazo.`);
      return;
    }
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
      refreshRecords();
    } catch (error) {
      console.error('Error guardando preingreso PROA:', error);
      setPreAdmissionError('No fue posible guardar el paciente PROA. Intenta nuevamente.');
    } finally {
      setSavingPreAdmission(false);
    }
  };

  const updatePreAntibiotic = (index, key, value) => {
    setPreAdmission((current) => ({
      ...current,
      antibioticos: current.antibioticos.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (key !== 'nombre') return { ...item, [key]: value };
        const defaultDose = defaultAntibioticDose(value);
        return {
          ...item,
          nombre: value,
          dosis: defaultDose || item.dosis,
          via: DEFAULT_DOSIS_ATB[value]?.via || item.via || 'EV',
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
      description: 'Mapa navegable con código anonimizado, cama y última evolución PROA guardada localmente.',
      icon: Users,
      color: 'teal',
      status: `${records.length} registros`,
      onClick: scrollToBedMap,
    },
    {
      title: 'Tablas de seguimiento',
      description: 'Listado clínico consolidado de pacientes PROA, diagnósticos, PI, microbiología, antimicrobianos y plan.',
      icon: FileSpreadsheet,
      color: 'slate',
      status: `${records.length} pacientes`,
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
                <p className="text-sm text-slate-500">Seguimiento clínico anonimizado por cama</p>
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/80 p-5"
        >
          <p className="text-lg font-bold text-slate-900">PROA</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Los registros se guardan con código anonimizado y número de cama. Nombre, RUT y ficha no quedan almacenados.
          </p>
        </motion.div>

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
                                        <span className="block text-base font-bold text-slate-900">{bed}</span>
                                        {record && (
                                          <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Ocupada</span>
                                        )}
                                      </div>
                                      {record ? (
                                        <>
                                          <span className="mt-0.5 block truncate text-xs font-semibold text-emerald-800">{record.code}</span>
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
                  <Badge className="border-slate-200 bg-white text-slate-700">Cama {selectedBed}</Badge>
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
                  />
                </div>
              )}

              {selectedRecord && (
                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Código anonimizado</p>
                    <p className="mt-1 text-2xl font-black text-emerald-800">{selectedRecord.code}</p>
                    <p className="mt-1 text-sm text-slate-500">Cama {selectedRecord.bedCode}</p>
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
                    <Button onClick={editFromLatest} className="w-full bg-teal-600 hover:bg-teal-700">
                      Evolucionar paciente PROA ({selectedRecord.code})
                    </Button>
                    <p className="text-[11px] leading-tight text-teal-800">Carga la evolución previa y actualiza días de hospitalización, días de antibiótico y la curva inflamatoria.</p>
                    <Button onClick={newBlankEvolution} variant="outline" className="w-full border-teal-300 bg-white text-teal-800">
                      Nueva evolución formal (precargar datos base)
                    </Button>
                    <Button onClick={createFromBed} variant="outline" className="w-full border-slate-300 bg-white">
                      Nuevo paciente en esta cama
                    </Button>
                  </div>

                  <MovePatientControl
                    records={records}
                    selectedBed={selectedBed}
                    sourceBedToMove={sourceBedToMove}
                    setSourceBedToMove={setSourceBedToMove}
                    onMove={movePatientToSelectedBed}
                  />
                </div>
              )}
            </aside>
          </div>
        </section>

        <section ref={tableRef} className="mt-6 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <FileSpreadsheet className="h-5 w-5 text-teal-700" />
                Tabla de pacientes PROA
              </h2>
              <p className="text-sm text-slate-500">Resumen del último preingreso o evolución formal disponible por cama.</p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshRecords} className="gap-2 self-start">
              <RotateCw className="h-4 w-4" /> Actualizar
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full border-collapse text-xs">
              <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-600">
                <tr>
                  {['Paciente / cama', 'Edad / ingreso', 'DG', 'Función renal', 'Antibioterapia', 'DG microbiológico', 'Estudio', 'Últimos 3 PI', 'Antimicrobiano', 'Dosis', 'Duración', 'Plan'].map((heading) => (
                    <th key={heading} className="border-b border-r border-slate-200 px-3 py-2 font-bold last:border-r-0">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const form = getLatestProaForm(record) || {};
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
                      <td className="border-b border-r border-slate-200 px-3 py-3">
                        <button type="button" onClick={() => {
                          setSelectedBed(record.bedCode);
                          setActiveService(record.servicio || findServiceForBed(record.bedCode));
                          scrollToBedMap();
                        }} className="text-left">
                          <span className="block font-bold text-teal-800">{record.code}</span>
                          <span className="text-slate-600">Cama {record.bedCode}</span>
                        </button>
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3">
                        <span className="block">{form.edad ? `${form.edad} años` : '—'}</span>
                        <span className="text-slate-500">{form.fecha_ingreso || 'Sin fecha'}</span>
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
                    </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-sm text-slate-500">No hay pacientes PROA registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Dialog open={showPreAdmission} onOpenChange={setShowPreAdmission}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-700" />
              Agregar paciente PROA
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="proa-pre-bed">Cama *</Label>
              <select
                id="proa-pre-bed"
                value={preAdmission.cama}
                onChange={(event) => {
                  setPreAdmission((current) => ({ ...current, cama: event.target.value }));
                  setPreAdmissionReplaceConfirmed(false);
                  setPreAdmissionError('');
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar cama...</option>
                {ALL_PROA_BEDS.map(({ bed, servicio }) => <option key={bed} value={bed}>{servicio} · {bed}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proa-pre-age">Edad *</Label>
              <Input id="proa-pre-age" type="number" min="0" max="120" value={preAdmission.edad} onChange={(event) => setPreAdmission((current) => ({ ...current, edad: event.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="proa-pre-date">Fecha de ingreso *</Label>
              <Input id="proa-pre-date" type="date" value={preAdmission.fecha_ingreso} onChange={(event) => setPreAdmission((current) => ({ ...current, fecha_ingreso: event.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="proa-pre-diagnosis">Diagnóstico *</Label>
              <Input id="proa-pre-diagnosis" list="proa-pre-diagnoses" value={preAdmission.diagnostico} onChange={(event) => setPreAdmission((current) => ({ ...current, diagnostico: event.target.value }))} placeholder="Buscar diagnóstico infectológico vigente" />
              <datalist id="proa-pre-diagnoses">
                {savedClinicalCatalog.diagnoses.map((diagnosis) => <option key={diagnosis} value={diagnosis} />)}
              </datalist>
              <p className="text-[11px] text-slate-500">Incluye el catálogo de Evolución PROA y los diagnósticos previamente guardados.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Antibioterapia vigente</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPreAntibiotic} className="h-8 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {preAdmission.antibioticos.map((item, index) => {
                  const savedDoses = [...(savedClinicalCatalog.dosesByAntibiotic[item.nombre] || [])];
                  const presentationDoses = (PRESENTACIONES_ATB[item.nombre] || []).map((presentation) => presentation.label);
                  const doseOptions = [...new Set([defaultAntibioticDose(item.nombre), ...savedDoses, ...presentationDoses].filter(Boolean))];
                  const doseListId = `proa-pre-dose-${index}`;
                  return (
                    <div key={index} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_72px_36px]">
                      <div>
                        <Input
                          list="proa-pre-antibiotics"
                          value={item.nombre}
                          onChange={(event) => updatePreAntibiotic(index, 'nombre', event.target.value)}
                          placeholder="Antimicrobiano"
                        />
                      </div>
                      <div>
                        <Input
                          list={doseListId}
                          value={item.dosis}
                          onChange={(event) => updatePreAntibiotic(index, 'dosis', event.target.value)}
                          placeholder="Dosis y frecuencia"
                        />
                        <datalist id={doseListId}>
                          {doseOptions.map((dose) => <option key={dose} value={dose} />)}
                        </datalist>
                      </div>
                      <select value={item.via} onChange={(event) => updatePreAntibiotic(index, 'via', event.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
                        {['EV', 'VO', 'IM', 'SC', 'Inhalado'].map((via) => <option key={via} value={via}>{via}</option>)}
                      </select>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePreAntibiotic(index)} className="h-10 w-9 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <datalist id="proa-pre-antibiotics">
                {savedClinicalCatalog.antibiotics.map((antibiotic) => <option key={antibiotic} value={antibiotic} />)}
              </datalist>
              <p className="text-[11px] text-slate-500">Al seleccionar un antimicrobiano se propone su dosis vigente; también aparecen dosis usadas previamente.</p>
            </div>
          </div>
          {preAdmissionError && <p className="text-sm font-medium text-red-600">{preAdmissionError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreAdmission(false)}>Cancelar</Button>
            <Button onClick={savePreAdmission} disabled={savingPreAdmission} className="bg-teal-600 hover:bg-teal-700">
              {savingPreAdmission ? 'Guardando…' : 'Guardar preingreso'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MovePatientControl({ records, selectedBed, sourceBedToMove, setSourceBedToMove, onMove }) {
  const movableRecords = records.filter((record) => record.bedCode !== selectedBed);
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
            {record.bedCode} · {record.code}
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
        Mover a cama {selectedBed}
                  </Button>
      <p className="text-[11px] leading-relaxed text-slate-500">
        El código anonimizado y su historial PROA pasan a esta cama. Si esta cama tenía otro registro, será reemplazado.
      </p>
    </div>
  );
}

export default conPuertaAcceso(GestionPROA, {
  storageKey: 'acceso_medico',
  descripcion: 'Ingresa el código de acceso para usar Gestión PROA.',
});
