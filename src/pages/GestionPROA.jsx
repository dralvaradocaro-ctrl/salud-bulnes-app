import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PROA_BED_MAP } from '@/lib/hospitalSuggestions';
import { fetchProaRecords, getLatestProaForm, moveProaRecordToBed, readProaRegistry, setPendingProaForm } from '@/lib/proaRegistry';
import {
  ArrowRight,
  Bed,
  ChevronLeft,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  RotateCw,
  ShieldPlus,
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

function GestionPROA() {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('Home'));
  };
  const bedMapRef = useRef(null);
  const [records, setRecords] = useState(() => readProaRegistry());
  const [selectedBed, setSelectedBed] = useState('');
  const [activeService, setActiveService] = useState(PROA_BED_MAP[0]?.servicio || '');
  const [sourceBedToMove, setSourceBedToMove] = useState('');

  const recordsByBed = useMemo(() => (
    records.reduce((acc, record) => {
      acc[record.bedCode] = record;
      return acc;
    }, {})
  ), [records]);

  const selectedRecord = selectedBed ? recordsByBed[selectedBed] : null;
  const selectedLatest = getLatestProaForm(selectedRecord);
  const currentService = PROA_BED_MAP.find((service) => service.servicio === activeService) || PROA_BED_MAP[0];

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

  // Nueva evolución del MISMO paciente, con el formulario en blanco (sin arrastrar
  // datos clínicos). Conserva fecha de ingreso si está registrada, para que los días
  // de hospitalización sigan calculándose. No es paciente nuevo: se encadena al registro.
  const newBlankEvolution = () => {
    if (!selectedBed) return;
    setPendingProaForm({
      cama: selectedBed,
      servicio: findServiceForBed(selectedBed),
      fecha_ingreso: selectedLatest?.fecha_ingreso || '',
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

  const modules = [
    {
      title: 'Formato de evolución PROA',
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
      description: 'Módulo pensado para cargar tablas clínicas, antibioterapia, cultivos y estado de revisión.',
      icon: FileSpreadsheet,
      color: 'slate',
      status: 'Próximamente',
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
          <div className="flex items-center gap-4">
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
                  <Button onClick={createFromBed} className="w-full bg-teal-600 hover:bg-teal-700">Crear evolución</Button>
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
                      Continuar evolución ({selectedRecord.code})
                    </Button>
                    <p className="text-[11px] leading-tight text-teal-800">Carga la evolución previa y actualiza días de hospitalización, días de antibiótico y la curva inflamatoria.</p>
                    <Button onClick={newBlankEvolution} variant="outline" className="w-full border-teal-300 bg-white text-teal-800">
                      Nueva evolución desde 0 (mismo paciente)
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
      </main>
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
