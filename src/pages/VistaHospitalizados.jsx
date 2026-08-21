import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Apple, BedDouble, Calculator, ChevronDown, ChevronLeft, ChevronUp, ClipboardList, FileText, FlaskConical, HeartHandshake, Image, LogOut, Microscope, Pill, Plus, Printer, Save, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { ALL_BEDS } from '@/components/agenda-diaria/bedCatalog';
import { setMultiPrefill } from '@/lib/multiTemplatePrefill';
import { archiveProaRecord, fetchProaRecords, getLatestProaForm, isHistoricalProaRecord, isProaEnrolledRecord, saveProaPreAdmission, saveProaRecord } from '@/lib/proaRegistry';
import { createPageUrl } from '@/utils';
import { ANTIBIOTICOS, DEFAULT_DOSIS_ATB, PRESENTACIONES_ATB } from '@/pages/VisitaPROA';
import { allCalculators, calculatorReferences } from '@/components/calculators/catalog';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import HospitalCareDocuments from '@/components/hospitalizados/HospitalCareDocuments';
import HospitalLabCurvePreview from '@/components/hospitalizados/HospitalLabCurvePreview';
import HospitalMedicalReports from '@/components/hospitalizados/HospitalMedicalReports';
import { emptyHospitalLabRow, HOSPITAL_LAB_FIELDS, HOSPITAL_LAB_GROUPS, LAB_FIELD_BY_EXAM } from '@/components/hospitalizados/hospitalLabCatalog';
import { parseLabReportText } from '@/pages/CurvaExamenes';

const STORAGE_KEY = 'vista_general_hospitalizados_v1';
const SELECTED_BED_KEY = 'vista_general_hospitalizados_selected_bed';
const EMPTY = {
  nombre: '', rut: '', fechaNacimiento: '', edad: '', sexo: '', nFicha: '', prevision: '', telefono: '', direccion: '', comuna: '',
  fechaIngreso: '', diagnosticoPrincipal: '', diagnostico: '', antecedentes: '', antibioterapia: '', antibioticos: [], aislamiento: '', medicoTratante: '', observaciones: '',
  resumenCaso: '', ultimaEvolucion: '', planesPendientes: '', planAlta: '', estudiosComplementarios: '', estudiosDetalle: [], patogenoAislado: '', ultimoLaboratorio: '',
  letIndicacion: '', iotIndicacion: '', rcpIndicacion: '', pacienteSocial: false, escalas: [], evaluacionesNutricionales: [], historialActualizaciones: [],
  informesMedicos: [], cultivos: [],
  reingresoEvaluado: false, reingresoMenor30: false, reingresoFechaEgresoPrevia: '', reingresoEvaluadoEn: '',
};

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100';
const textarea = `${input} min-h-24 resize-y`;
const EMPTY_QUICK_ATB = { nombre: '', presentacion: '', dosis_cantidad: '', dosis_unidad: 'mg', intervalo_horas: '', via: 'EV', inicio: '', termino: '' };
const PRINT_SERVICE_OPTIONS = [
  { value: 'MQ1', label: 'MQ1' },
  { value: 'MQ2', label: 'MQ2' },
  { value: 'PED', label: 'Pediatría' },
  { value: 'GINE', label: 'Gineco-Obstetricia' },
  { value: 'HODOM', label: 'HODOM' },
];
const PRINT_SERVICE_ORDER = new Map(PRINT_SERVICE_OPTIONS.map((option, index) => [option.value, index]));
const DISCHARGE_REASONS = ['Alta médica', 'Fallecimiento', 'Traslado a otro servicio', 'Traslado a otro establecimiento', 'Hospitalización domiciliaria', 'Otro'];
const TEST_BED = { code: 'TEST-VISTA-PROA-1', cell: 'Prueba 1', serviceShort: 'PRUEBA', salaLabel: 'Sala exclusiva de prueba · no contabiliza' };
const TEST_PATIENT = {
  ...EMPTY, nombre: 'Paciente PROA de Prueba', rut: '11.111.111-1', edad: '68', sexo: 'F', fechaNacimiento: '1958-05-14', fechaIngreso: '2026-08-08',
  diagnosticoPrincipal: 'Neumonía adquirida en la comunidad', diagnostico: 'Insuficiencia respiratoria aguda hipoxémica', antecedentes: 'Hipertensión arterial. Diabetes mellitus tipo 2.',
  resumenCaso: 'Paciente estable, afebril y con requerimiento bajo de oxígeno.', ultimaEvolucion: 'Evolución favorable; menor disnea y sin fiebre.', planesPendientes: 'Control de laboratorio y reevaluación de antibioterapia.',
  estudiosComplementarios: 'Imagenología · 2026-08-08 · Radiografía de tórax: infiltrado basal derecho · Informado', estudiosDetalle: [{ fecha: '2026-08-08', tipo: 'Imagenología', estudio: 'Radiografía de tórax: infiltrado basal derecho', estado: 'Informado' }],
  aislamiento: 'Precauciones de gotitas', antibioticos: [{ nombre: 'Ceftriaxona', presentacion: 'Polvo para solución inyectable · 1 g', dosis_cantidad: '2', dosis_unidad: 'g', intervalo_horas: '24', via: 'EV', inicio: '2026-08-08', termino: '' }],
  antibioterapia: 'Ceftriaxona 2 g c/24 h EV', patogenoAislado: 'Streptococcus pneumoniae', ultimoLaboratorio: '2026-08-10 · PCR 42 · Leucocitos 10.200 · Creatinina 0,8 mg/dL',
  laboratorios: [{ fecha: '2026-08-10', pcr: '42', blancos: '10200', crea: '0.8', pct: '0.18', vhs: '35', temp: '36.7' }],
  letIndicacion: 'No', iotIndicacion: 'Sí', rcpIndicacion: 'Sí', evaluacionesNutricionales: [{ fecha: '2026-08-09', tamizaje: 'Sí', puntaje: '2', riesgo: 'Sin riesgo nutricional', evaluacion: 'Sí' }],
  reingresoEvaluado: false, reingresoMenor30: false, reingresoFechaEgresoPrevia: '', egresoPrevioConocido: '2026-07-25', reingresoEvaluadoEn: '', proaIsTest: true,
};

function readRegistry() {
  try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return parsed && typeof parsed === 'object' ? { [TEST_BED.code]: TEST_PATIENT, ...parsed } : { [TEST_BED.code]: TEST_PATIENT }; } catch { return { [TEST_BED.code]: TEST_PATIENT }; }
}

function formatRut(value) {
  const clean = String(value || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  if (clean.length === 1) return clean;
  return `${clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${clean.slice(-1)}`;
}

const CLINICAL_ACRONYMS = new Set(['EPOC', 'VIH', 'ITU', 'AVE', 'NAC', 'TAC', 'ECG', 'PCR', 'RCP', 'IOT', 'LET', 'HTA', 'DM', 'ERC', 'IRA', 'VRS']);
const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-CL').replace(/(^|[\s-])([a-záéíóúüñ])/giu, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase('es-CL')}`);
const normalizeClinicalText = (value) => String(value || '').trim().replace(/[ \t]+/g, ' ').split('\n').map(line => {
  const lowered = line.toLocaleLowerCase('es-CL').replace(/(^|[.!?]\s+)([a-záéíóúüñ])/giu, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase('es-CL')}`);
  return lowered.replace(/\b[A-Za-zÁÉÍÓÚÜÑ]{2,4}\b/g, word => CLINICAL_ACRONYMS.has(word.toLocaleUpperCase('es-CL')) ? word.toLocaleUpperCase('es-CL') : word);
}).join('\n');

function hospitalDays(date) {
  if (!date) return 0;
  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max(1, Math.floor((new Date().setHours(0, 0, 0, 0) - start.getTime()) / 86400000) + 1);
}

function treatmentDays(startDate, endDate) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : new Date(new Date().setHours(0, 0, 0, 0));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function displayClinicalDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value || '');
}

const SNAPSHOT_FIELDS = ['diagnosticoPrincipal', 'diagnostico', 'resumenCaso', 'ultimaEvolucion', 'planesPendientes', 'planAlta', 'estudiosComplementarios', 'antibioterapia', 'patogenoAislado', 'ultimoLaboratorio', 'letIndicacion', 'iotIndicacion', 'rcpIndicacion', 'observaciones'];
function clinicalSnapshot(record) {
  return SNAPSHOT_FIELDS.reduce((snapshot, key) => ({ ...snapshot, [key]: record[key] || '' }), {});
}

function withHistorySnapshot(record) {
  const snapshot = clinicalSnapshot(record);
  if (!Object.values(snapshot).some(value => String(value).trim())) return record;
  const history = Array.isArray(record.historialActualizaciones) ? record.historialActualizaciones : [];
  const previous = history[0] ? clinicalSnapshot(history[0]) : null;
  if (previous && JSON.stringify(previous) === JSON.stringify(snapshot)) return record;
  const now = new Date();
  return { ...record, historialActualizaciones: [{ ...snapshot, fecha: now.toISOString().slice(0, 10), guardadoEn: now.toISOString() }, ...history].slice(0, 60) };
}

function combinedDiagnosisAndHistory(record) {
  return `DIAGNÓSTICO(S):\n${record?.diagnostico || ''}\n\nANTECEDENTES RELEVANTES:\n${record?.antecedentes || ''}`;
}

function splitDiagnosisAndHistory(value) {
  const normalized = String(value || '').replace(/^\s*DIAGNÓSTICO\(S\):\s*\n?/i, '');
  const parts = normalized.split(/\n\s*ANTECEDENTES RELEVANTES:\s*\n?/i);
  return { diagnostico: parts.shift()?.trim() || '', antecedentes: parts.join('\n').trim() };
}

const cultureKey = item => [item?.fecha, item?.tipo_muestra, item?.patogeno].map(value => String(value || '').trim().toLocaleLowerCase('es-CL')).join('|');
function deduplicateCultures(items) {
  const seen = new Set();
  return (items || []).filter(item => item?.fecha || item?.tipo_muestra || item?.patogeno).filter(item => {
    const key = cultureKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeLaboratoryRows(current, incoming) {
  const byDate = new Map();
  [...(current || []), ...(incoming || [])].forEach(row => {
    const fecha = String(row?.fecha || '').slice(0, 10);
    if (!fecha) return;
    byDate.set(fecha, { ...emptyHospitalLabRow(fecha), ...(byDate.get(fecha) || {}), ...row, fecha });
  });
  return [...byDate.values()].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}

function cultureFromParsedResult(result) {
  const text = String(result?.valueText || '').trim();
  const upper = text.toLocaleUpperCase('es-CL');
  const sensibilidad = /SIN DESARROLLO|NEGATIV|NO DETECTAD/.test(upper) ? 'Sin desarrollo' : /RESISTENTE/.test(upper) ? 'Resistente' : /SENSIBLE/.test(upper) ? 'Sensible' : 'Pendiente';
  return { fecha: String(result?.collectedAt || '').slice(0, 10), tipo_muestra: result?.name || 'Estudio microbiológico', patogeno: text, sensibilidad, resistente: [], sensible: [], intermedio: [], antibiograma_nota: text, antibiograma: '' };
}

function catalogToProaBed(bed) {
  if (bed?.code === TEST_BED.code) return 'TEST-PROA-1';
  if (bed.serviceShort === 'MQ1') {
    if (/^\d+-\d+$/.test(bed.cell)) return bed.cell;
    const isolation = /^Aisl(\d+)-(\d+)$/.exec(bed.cell);
    if (isolation) return Number(isolation[2]) === 1 && !['5', '8'].includes(isolation[1])
      ? `Aisl ${isolation[1]}` : `Aisl ${isolation[1]}-${isolation[2]}`;
  }
  if (bed.serviceShort === 'MQ2') {
    const isolation = /^Aislamiento\s+(\d+)$/i.exec(bed.cell);
    return isolation ? `MQ2-Aislamiento ${isolation[1]}` : `MQ2-${bed.cell}`;
  }
  if (bed.serviceShort === 'GINE') {
    const gine = /^08MB-(\d+)$/.exec(bed.code);
    const obs = /^SNC-(\d+)$/.exec(bed.code);
    return gine ? `GINE-${gine[1]}` : obs ? `OBS-${obs[1]}` : null;
  }
  if (bed.serviceShort === 'PED') {
    const pediatricBeds = ALL_BEDS.filter(item => item.serviceShort === 'PED');
    const index = pediatricBeds.findIndex(item => item.code === bed.code);
    return index >= 0 ? `PED-${index + 1}` : null;
  }
  return null;
}

const PROA_TO_CATALOG = new Map([...ALL_BEDS, TEST_BED].map(bed => [catalogToProaBed(bed), bed.code]).filter(([key]) => key));

function antibioticSummary(form) {
  if (form.antibioterapia_preingreso) return form.antibioterapia_preingreso;
  return (form.antibioticos || []).filter(item => item?.nombre).map(item => [
    item.nombre,
    item.dosis || [item.dosis_cantidad, item.dosis_unidad].filter(Boolean).join(' '),
    item.intervalo_horas && `c/${item.intervalo_horas} h`,
    item.via,
    item.inicio && `desde ${item.inicio}`,
  ].filter(Boolean).join(' ')).join('\n');
}

function structuredAntibioticSummary(items) {
  return (items || []).filter(item => item?.nombre).map(item => [item.nombre, item.presentacion && `(${item.presentacion})`, item.dosis || [item.dosis_cantidad, item.dosis_unidad].filter(Boolean).join(' '), item.intervalo_horas && `c/${item.intervalo_horas} h`, item.via, item.inicio && `desde ${item.inicio}`, item.termino && `hasta ${item.termino}`].filter(Boolean).join(' ')).join('\n');
}

function antibioticVisitItems(record) {
  const items = (record.antibioticos || []).filter(item => item?.nombre);
  if (!items.length) return { current: record.antibioterapia ? [record.antibioterapia] : [], suspended: [] };
  const today = new Date().toISOString().slice(0, 10);
  return items.reduce((groups, item) => {
    const days = treatmentDays(item.inicio, item.termino);
    const treatment = [item.nombre, item.presentacion && `(${item.presentacion})`, item.dosis || [item.dosis_cantidad, item.dosis_unidad].filter(Boolean).join(' '), item.intervalo_horas && `c/${item.intervalo_horas} h`, item.via].filter(Boolean).join(' ');
    const suspended = Boolean(item.termino && item.termino < today);
    const dates = [item.inicio && `FI ${displayClinicalDate(item.inicio)}`, suspended && item.termino && `FT ${displayClinicalDate(item.termino)}`].filter(Boolean).join(' · ');
    const duration = days ? `${suspended ? `${days} días` : `Día ${days}`}${dates ? ` · ${dates}` : ''}` : dates;
    const text = `${treatment}${duration ? ` (${duration})` : ''}`;
    groups[suspended ? 'suspended' : 'current'].push(text);
    return groups;
  }, { current: [], suspended: [] });
}

function pathogenSummary(form) {
  if (form.diagnostico_microbiologico) return form.diagnostico_microbiologico;
  return (form.estudios_micro || []).filter(item => item?.patogeno).map(item => [item.patogeno, item.tipo_muestra].filter(Boolean).join(' · ')).join('\n');
}

function latestLabSummary(form) {
  const rows = Array.isArray(form.parametros_inflamatorios) ? form.parametros_inflamatorios : [];
  const latest = rows.slice().sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))[0];
  const renal = form.funcion_renal || [form.creatinina && `Creatinina ${form.creatinina} mg/dL`, form.vfg_estimada && `VFG estimada ${form.vfg_estimada} mL/min/1,73 m²`].filter(Boolean).join(' · ');
  if (!latest) return [form.fecha_creatinina, renal].filter(Boolean).join(' · ');
  const values = HOSPITAL_LAB_FIELDS.filter(([key]) => latest[key] !== '' && latest[key] != null).slice(0, 6).map(([key, label, unit]) => `${label} ${latest[key]}${unit ? ` ${unit}` : ''}`);
  return [latest.fecha, ...values, !values.length ? renal : ''].filter(Boolean).join(' · ');
}

function isAutoRenalText(value) {
  return /^\s*Creatinina\s+[\d,.]+\s*mg\/dL\s*·\s*VFG\s+estimada/i.test(String(value || ''));
}

function latestStructuredAntibiotics(record) {
  for (const evolution of record?.evolutions || []) {
    const items = evolution?.form?.antibioticos;
    if (Array.isArray(items) && items.some(item => item?.nombre)) return items.filter(item => item?.nombre);
  }
  return [];
}

function proaToPatient(record) {
  const form = getLatestProaForm(record) || {};
  const structuredAntibiotics = latestStructuredAntibiotics(record);
  const formWithAntibiotics = { ...form, antibioticos: structuredAntibiotics };
  return {
    nombre: normalizeName(form.paciente), rut: formatRut(form.rut), fechaNacimiento: form.fecha_nacimiento || '', edad: form.edad || '', sexo: form.sexo || '',
    nFicha: form.n_ficha || '', prevision: form.prevision || '', telefono: form.telefono || '',
    direccion: form.direccion || '', comuna: form.comuna || '', fechaIngreso: form.fecha_ingreso || '',
    diagnosticoPrincipal: normalizeClinicalText(form.diagnostico_principal || form.diagnosticos_actuales?.[0] || form.diagnostico_actual || ''),
    diagnostico: normalizeClinicalText((form.diagnosticos_actuales || []).slice(1).join('\n') || form.diagnostico_desglose || form.diagnostico_actual || form.diagnostico || ''),
    antecedentes: form.antecedentes || '', antibioterapia: antibioticSummary(formWithAntibiotics), antibioticos: structuredAntibiotics,
    aislamiento: form.aislamiento || '', medicoTratante: form.medico || form.medico_tratante || '',
    observaciones: form.vista_observaciones || (form.recomendaciones || []).join(' · '),
    resumenCaso: form.resumen_caso || '',
    ultimaEvolucion: form.vista_ultima_evolucion || '',
    planesPendientes: form.vista_planes_pendientes || [form.plan_duracion, ...(form.recomendaciones || []), form.recomendaciones_otra].filter(Boolean).join(' · '),
    planAlta: form.vista_plan_alta || '',
    estudiosComplementarios: form.vista_estudios_complementarios || [form.estudios_imagen, form.diagnostico_microbiologico].filter(Boolean).join(' · '),
    estudiosDetalle: Array.isArray(form.vista_estudios_detalle) ? form.vista_estudios_detalle : [],
    patogenoAislado: pathogenSummary(form), ultimoLaboratorio: latestLabSummary(form), laboratorios: Array.isArray(form.parametros_inflamatorios) ? form.parametros_inflamatorios : [],
    cultivos: Array.isArray(form.estudios_micro) ? form.estudios_micro : [],
    letIndicacion: form.let_indicacion || form.let || '', iotIndicacion: form.iot_indicacion || form.iot || '', rcpIndicacion: form.rcp_indicacion || form.rcp || '', pacienteSocial: Boolean(form.paciente_social),
    escalas: Array.isArray(form.vista_escalas) ? form.vista_escalas : [], evaluacionesNutricionales: Array.isArray(form.vista_evaluaciones_nutricionales) ? form.vista_evaluaciones_nutricionales : [],
    informesMedicos: Array.isArray(form.vista_informes_medicos) ? form.vista_informes_medicos : [],
    historialActualizaciones: form.evolucion ? [{
      fecha: String(record.updatedAt || '').slice(0, 10), guardadoEn: record.updatedAt,
      diagnostico: form.diagnostico_actual || '', resumenCaso: form.evolucion,
      planesPendientes: [form.plan_duracion, ...(form.recomendaciones || [])].filter(Boolean).join(' · '),
      estudiosComplementarios: form.estudios_imagen || '', antibioterapia: antibioticSummary(form),
      patogenoAislado: pathogenSummary(form), ultimoLaboratorio: latestLabSummary(form), observaciones: '',
      letIndicacion: form.let_indicacion || form.let || '', iotIndicacion: form.iot_indicacion || form.iot || '', rcpIndicacion: form.rcp_indicacion || form.rcp || '',
    }] : [],
    proaRecordId: record.id, proaBedCode: record.bedCode, proaEnrolled: isProaEnrolledRecord(record), proaUpdatedAt: record.updatedAt,
  };
}

function mergePatient(base, local) {
  const merged = { ...base };
  Object.entries(local || {}).forEach(([key, value]) => {
    if (key === 'antecedentes' && isAutoRenalText(value)) return;
    if (value !== '' && value !== null && value !== undefined) merged[key] = value;
  });
  const proaIsNewer = String(base.proaUpdatedAt || '') > String(local?.updatedAt || '');
  if (proaIsNewer) ['nombre', 'rut', 'fechaNacimiento', 'edad', 'sexo', 'direccion', 'comuna', 'fechaIngreso', 'proaRecordId', 'proaBedCode', 'proaEnrolled', 'pacienteSocial', 'diagnosticoPrincipal', 'diagnostico', 'antibioterapia', 'antibioticos', 'aislamiento', 'patogenoAislado', 'ultimoLaboratorio', 'laboratorios', 'cultivos', 'planAlta', 'informesMedicos'].forEach(key => {
    if (base[key] !== '' && base[key] !== undefined) merged[key] = base[key];
  });
  return merged;
}

function Field({ label, children, wide = false }) {
  return <label className={wide ? 'block sm:col-span-2' : 'block'}><span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}

function studyVisitSummary(record) {
  const scale = record.escalas?.[0];
  const nutrition = record.evaluacionesNutricionales?.[0];
  return [record.estudiosComplementarios, scale && `Escala ${scale.nombre} (${scale.fecha}): ${scale.puntaje} pts${scale.resultado ? ` · ${scale.resultado}` : ''}`, nutrition && `Nutrición (${nutrition.fecha}): ${nutrition.tamizaje}${nutrition.puntaje ? ` · ${nutrition.puntaje} pts · ${nutrition.riesgo}` : ''} · Eval.: ${nutrition.evaluacion}`].filter(Boolean).join('\n');
}

function nutritionVisitSummary(record) {
  const nutrition = record.evaluacionesNutricionales?.[0];
  if (!nutrition) return '';
  if (nutrition.tamizaje !== 'Sí') return `Nutri: tamizaje ${String(nutrition.tamizaje || 'NC').toLocaleLowerCase('es-CL')} · Eval. ${String(nutrition.evaluacion || 'NC').toLocaleLowerCase('es-CL')}`;
  const risk = nutrition.riesgo ? nutrition.riesgo.replace(/nutricional/gi, '').trim().toLocaleLowerCase('es-CL') : '';
  return `Nutri: ${nutrition.puntaje || '—'} pt${risk ? ` · ${risk}` : ''} · Eval. ${String(nutrition.evaluacion || 'NC').toLocaleLowerCase('es-CL')}`;
}

function VisitTable({ rows, service }) {
  return <>
    <div className="hospital-print-header"><div><h1>Visita médica — Hospitalizados</h1><p>{service} · {new Date().toLocaleDateString('es-CL')}</p></div><p>{rows.length} paciente{rows.length === 1 ? '' : 's'}</p></div>
    <table><thead><tr><th>Cama / paciente</th><th>Día / diagnóstico</th><th>Resumen clínico</th><th>Última evolución</th><th>Estudios</th><th>ATB / patógeno</th><th>Últ. lab.</th><th>LET/IOT/RCP</th><th>Planes / alta</th></tr></thead><tbody>
      {rows.map(({ bed, record }) => <tr key={bed.code}>
        <td><strong>{bed.serviceShort} · {bed.cell}</strong><br />{record.nombre || 'Sin nombre'}<br /><span>{record.rut || ''}</span></td>
        <td><strong>Día {hospitalDays(record.fechaIngreso)}</strong><br /><strong>{record.diagnosticoPrincipal || record.diagnostico || '—'}{record.pacienteSocial ? ' (caso sociosanitario)' : ''}</strong>{record.diagnosticoPrincipal && record.diagnostico && <><br />{record.diagnostico}</>}</td>
        <td>{record.resumenCaso || (!nutritionVisitSummary(record) ? '—' : '')}{nutritionVisitSummary(record) && <div className="mt-1 text-[0.92em] font-semibold text-lime-800">{nutritionVisitSummary(record)}</div>}</td>
        <td>{record.ultimaEvolucion || '—'}</td>
        <td>{studyVisitSummary(record) || '—'}</td>
        <td>{record.antibioterapia || record.antibioticos?.length ? (() => { const groups = antibioticVisitItems(record); return <><strong>ATB actual:</strong>{groups.current.length ? groups.current.map((item, index) => <div key={`current-${index}`} className="font-bold text-slate-950">{item}</div>) : <div className="text-slate-500">Sin ATB activo</div>}{groups.suspended.length > 0 && <div className="mt-1 border-t border-slate-300 pt-1 text-slate-400 opacity-70"><span className="font-semibold">Suspendido:</span>{groups.suspended.map((item, index) => <div key={`suspended-${index}`}>{item}</div>)}</div>}</>; })() : 'Sin ATB'}{record.patogenoAislado && <><br /><strong>Patógeno:</strong> {record.patogenoAislado}</>}</td>
        <td>{record.ultimoLaboratorio || '—'}</td>
        <td><strong>LET:</strong> {record.letIndicacion || 'NC'}<br /><strong>IOT:</strong> {record.iotIndicacion || 'NC'}<br /><strong>RCP:</strong> {record.rcpIndicacion || 'NC'}</td>
        <td>{record.planesPendientes || (!record.planAlta ? '—' : '')}{record.planAlta && <div className="mt-1 border-t border-slate-300 pt-1"><strong>Plan de alta:</strong><br />{record.planAlta}</div>}</td>
      </tr>)}
    </tbody></table>
  </>;
}

const CHART_COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#db2777', '#d97706', '#0891b2', '#65a30d'];
function StatisticsDashboard({ statistics }) {
  const percentageChart = (key) => statistics.byService.map(item => ({ servicio: item.label, porcentaje: item[key] }));
  const metricCards = [
    ['Ocupación global', statistics.overall.occupancyPct, `${statistics.overall.occupied}/${statistics.overall.capacity} camas`],
    ['Hospitalización >7 días', statistics.overall.longStayPct, `${statistics.overall.longStay}/${statistics.overall.nonSocial} pacientes no sociales`],
    ['Con antibioterapia', statistics.overall.atbPct, `${statistics.overall.withAtb}/${statistics.overall.occupied} pacientes`],
  ];
  const ServiceBars = ({ data, color }) => <ResponsiveContainer width="100%" height={250}><BarChart data={data} margin={{ top: 8, right: 18, left: -12, bottom: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="servicio" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tickFormatter={value => `${value}%`} tick={{ fontSize: 10 }} /><Tooltip formatter={value => [`${value}%`, 'Porcentaje']} /><Bar dataKey="porcentaje" fill={color} radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer>;
  return <main className="mx-auto max-w-[1500px] space-y-5 p-4 pb-32">
    <div><h2 className="text-2xl font-black text-slate-950">Estadística hospitalaria</h2><p className="text-sm text-slate-500">Indicadores calculados con la ocupación vigente de Vista General.</p></div>
    <section className="grid gap-3 md:grid-cols-3">{metricCards.map(([label, value, detail], index) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-600">{label}</p><span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index] }} /></div><p className="mt-2 text-4xl font-black text-slate-950">{value}%</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}</section>
    <section className="grid gap-4 xl:grid-cols-3">
      {[['Ocupación de camas por servicio', 'occupancyPct', '#0f766e'], ['Hospitalización >7 días por servicio', 'longStayPct', '#7c3aed'], ['Antibioterapia por servicio', 'atbPct', '#d97706']].map(([title, key, color]) => <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="font-black text-slate-900">{title}</h3><p className="mb-2 text-xs text-slate-500">{key === 'longStayPct' ? 'Excluye pacientes sociales del denominador.' : 'Porcentaje sobre el servicio correspondiente.'}</p><ServiceBars data={percentageChart(key)} color={color} /></div>)}
    </section>
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-teal-200 bg-white p-4 shadow-sm"><h3 className="font-black text-teal-950">PROA · Antibióticos activos</h3><p className="mb-3 text-xs text-slate-500">Distribución de tratamientos vigentes.</p>{statistics.antibiotics.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={statistics.antibiotics} layout="vertical" margin={{ left: 30, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={135} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" name="Pacientes" fill="#0f766e" radius={[0, 7, 7, 0]} /></BarChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-slate-400">Sin antibioterapia activa registrada.</p>}</div>
      <div className="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm"><h3 className="font-black text-cyan-950">PROA · Patógenos aislados</h3><p className="mb-3 text-xs text-slate-500">Registros microbiológicos vigentes.</p>{statistics.pathogens.length ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={statistics.pathogens} dataKey="count" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>{statistics.pathogens.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-slate-400">Sin patógenos aislados registrados.</p>}</div>
    </section>
  </main>;
}

function ProaQuickModal({ bed, hasRecord, value, setValue, saving, onClose, onFull, onSave }) {
  const updateAtb = (index, key, nextValue) => setValue(old => ({ ...old, antibioticos: old.antibioticos.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: nextValue } : item) }));
  const selectAtb = (index, name) => setValue(old => ({ ...old, antibioticos: old.antibioticos.map((item, itemIndex) => itemIndex === index ? { ...item, nombre: name, ...(DEFAULT_DOSIS_ATB[name] || {}) } : item) }));
  const updateCulture = (index, key, nextValue) => setValue(old => ({ ...old, cultivos: old.cultivos.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: nextValue } : item) }));
  return <div className="fixed inset-0 z-[86] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-2xl">
    <div className="mb-4 rounded-xl bg-emerald-100/80 p-3"><h2 className="text-lg font-black text-teal-950">{hasRecord ? 'PROA' : 'Agregar paciente PROA'} — Cama {bed?.cell}</h2><p className="text-xs text-emerald-800">{hasRecord ? 'Consulta y actualización rápida de aislamiento, antimicrobianos y cultivos.' : 'Ingreso rápido con los datos ya disponibles en Vista general.'}</p></div>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
      {!hasRecord && <section className="rounded-xl border border-emerald-200 bg-white/80 p-4"><div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="text-sm font-black text-emerald-950">Datos precargados del paciente</h3><p className="text-xs text-emerald-700">Puedes corregirlos antes de crear el registro PROA.</p></div><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">NUEVO PROA</span></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre completo" wide><input className={input} value={value.paciente || ''} onChange={e => setValue(old => ({ ...old, paciente: e.target.value }))} /></Field><Field label="RUT"><input className={input} value={value.rut || ''} onChange={e => setValue(old => ({ ...old, rut: formatRut(e.target.value) }))} /></Field><Field label="Edad"><input type="number" min="0" max="130" className={input} value={value.edad || ''} onChange={e => setValue(old => ({ ...old, edad: e.target.value }))} /></Field><Field label="Sexo"><select className={input} value={value.sexo || ''} onChange={e => setValue(old => ({ ...old, sexo: e.target.value }))}><option value="">No consignado</option><option value="F">Femenino</option><option value="M">Masculino</option><option value="Otro">Otro</option></select></Field><Field label="Fecha de ingreso"><input type="date" className={input} value={value.fecha_ingreso || ''} onChange={e => setValue(old => ({ ...old, fecha_ingreso: e.target.value }))} /></Field><Field label="Diagnóstico principal" wide><textarea className={textarea} value={value.diagnostico || ''} onChange={e => setValue(old => ({ ...old, diagnostico: e.target.value }))} /></Field></div></section>}
      <Field label="Aislamiento / precauciones"><input className={input} value={value.aislamiento} onChange={e => setValue(old => ({ ...old, aislamiento: e.target.value }))} placeholder="Contacto, gotitas, aéreo…" /></Field>
      <section><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">Antibioterapia actual</h3><Button type="button" size="sm" variant="outline" onClick={() => setValue(old => ({ ...old, antibioticos: [...old.antibioticos, { ...EMPTY_QUICK_ATB }] }))}><Plus className="mr-1 h-3.5 w-3.5" />Agregar ATB</Button></div>
        <div className="space-y-2">{value.antibioticos.map((atb, index) => <div key={index} className="grid gap-2 rounded-xl border bg-slate-50 p-3 sm:grid-cols-12">
          <div className="sm:col-span-3"><Field label="Antibiótico"><input list="vista-proa-antibioticos" className={input} value={atb.nombre || ''} onChange={e => selectAtb(index, e.target.value)} /></Field></div>
          <div className="sm:col-span-3"><Field label="Presentación"><select className={input} value={atb.presentacion || ''} onChange={e => updateAtb(index, 'presentacion', e.target.value)}><option value="">Seleccionar…</option>{(PRESENTACIONES_ATB[atb.nombre] || []).map(option => <option key={option.label} value={option.label}>{option.label}</option>)}</select></Field></div>
          <div className="sm:col-span-2"><Field label="Dosis"><input className={input} value={atb.dosis_cantidad || atb.dosis || ''} onChange={e => { updateAtb(index, 'dosis_cantidad', e.target.value); updateAtb(index, 'dosis', ''); }} /></Field></div>
          <div className="sm:col-span-1"><Field label="Unidad"><select className={input} value={atb.dosis_unidad || 'mg'} onChange={e => updateAtb(index, 'dosis_unidad', e.target.value)}>{['mg','g','UI','MUI','comprimido','ampolla'].map(unit => <option key={unit}>{unit}</option>)}</select></Field></div>
          <div className="sm:col-span-1"><Field label="Cada h"><input className={input} value={atb.intervalo_horas || ''} onChange={e => updateAtb(index, 'intervalo_horas', e.target.value)} /></Field></div>
          <div className="sm:col-span-1"><Field label="Vía"><select className={input} value={atb.via || 'EV'} onChange={e => updateAtb(index, 'via', e.target.value)}>{['EV','VO','IM','SC'].map(via => <option key={via}>{via}</option>)}</select></Field></div>
          <div className="sm:col-span-2"><Field label={atb.inicio && treatmentDays(atb.inicio, atb.termino) ? `Inicio · Día ${treatmentDays(atb.inicio, atb.termino)}` : 'Inicio'}><input type="date" className={input} value={atb.inicio || ''} onChange={e => updateAtb(index, 'inicio', e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label="Término"><input type="date" className={input} value={atb.termino || ''} onChange={e => updateAtb(index, 'termino', e.target.value)} /></Field></div>
          <div className="flex items-end sm:col-span-1"><Button type="button" variant="ghost" size="sm" onClick={() => setValue(old => ({ ...old, antibioticos: old.antibioticos.length === 1 ? [{ ...EMPTY_QUICK_ATB }] : old.antibioticos.filter((_, itemIndex) => itemIndex !== index) }))} className="text-red-600">Quitar</Button></div>
        </div>)}</div>
        <datalist id="vista-proa-antibioticos">{ANTIBIOTICOS.map(name => <option key={name} value={name} />)}</datalist>
      </section>
      <section><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">Cultivos</h3><Button type="button" size="sm" variant="outline" onClick={() => setValue(old => ({ ...old, cultivos: [...old.cultivos, { fecha: '', tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }] }))}><Plus className="mr-1 h-3.5 w-3.5" />Agregar cultivo</Button></div>
        <div className="space-y-2">{value.cultivos.map((culture, index) => <div key={index} className="grid gap-2 rounded-xl border bg-slate-50 p-3 sm:grid-cols-[140px_1fr_1fr_150px_auto]"><input type="date" className={input} value={culture.fecha || ''} onChange={e => updateCulture(index, 'fecha', e.target.value)} /><input className={input} value={culture.tipo_muestra || ''} onChange={e => updateCulture(index, 'tipo_muestra', e.target.value)} placeholder="Muestra" /><input className={input} value={culture.patogeno || ''} onChange={e => updateCulture(index, 'patogeno', e.target.value)} placeholder="Patógeno" /><select className={input} value={culture.sensibilidad || 'Pendiente'} onChange={e => updateCulture(index, 'sensibilidad', e.target.value)}><option>Pendiente</option><option>Sensible</option><option>Resistente</option><option>Sin desarrollo</option></select><Button type="button" variant="ghost" size="sm" onClick={() => setValue(old => ({ ...old, cultivos: old.cultivos.length === 1 ? [{ fecha: '', tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }] : old.cultivos.filter((_, itemIndex) => itemIndex !== index) }))} className="text-red-600">Quitar</Button></div>)}</div>
      </section>
    </div>
    <div className="mt-5 flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onClose}>Cerrar</Button><Button variant="outline" onClick={onFull} className="border-teal-300 text-teal-800">{hasRecord ? 'Abrir y evolucionar paciente PROA' : 'Abrir ingreso y evolución PROA'}</Button><Button onClick={onSave} disabled={saving || (!hasRecord && (!value.paciente || !value.rut))} className="bg-teal-700 hover:bg-teal-800">{saving ? 'Guardando…' : hasRecord ? 'Guardar actualización PROA' : 'Agregar paciente PROA'}</Button></div>
  </div></div>;
}

function HospitalLabEntry({ rows, setRows, cultures, setCultures, pasteText, setPasteText, parseMessage, setParseMessage, onParse }) {
  const updateCulture = (index, key, value) => setCultures(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  return <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
    <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-4"><div className="mb-2"><h3 className="text-sm font-black text-blue-950">Carga automática desde informe</h3><p className="text-xs text-blue-700">Reconoce laboratorio general y microbiología. Los cultivos se sincronizan con PROA cuando el paciente está vinculado.</p></div><textarea className={`${textarea} min-h-32 bg-white font-mono text-xs`} value={pasteText} onChange={e => { setPasteText(e.target.value); setParseMessage(''); }} placeholder="Pega hemograma, función renal/hepática, electrolitos, coagulación, perfil lipídico, cultivos o paneles microbiológicos…" /><div className="mt-2 flex flex-wrap items-center justify-between gap-2">{parseMessage ? <p className={`text-xs font-semibold ${parseMessage.startsWith('No se') ? 'text-amber-700' : 'text-emerald-700'}`}>{parseMessage}</p> : <span />}<Button type="button" size="sm" onClick={onParse} disabled={!pasteText.trim()} className="bg-blue-700 hover:bg-blue-800"><FlaskConical className="mr-1 h-4 w-4" />Procesar y cargar</Button></div></section>
    {rows.map((row, index) => <section key={`${row.fecha}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-end justify-between gap-3"><Field label={`Control ${index + 1} · fecha`}><input type="date" className={input} value={row.fecha} onChange={e => setRows(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, fecha: e.target.value } : item))} /></Field><Button type="button" variant="ghost" size="sm" onClick={() => setRows(current => current.filter((_, rowIndex) => rowIndex !== index))} className="text-red-600">Eliminar fecha y exámenes</Button></div><div className="space-y-2">{HOSPITAL_LAB_GROUPS.map((group, groupIndex) => <details key={group.name} open={groupIndex < 3} className="rounded-lg border border-slate-200 bg-white"><summary className="cursor-pointer px-3 py-2 text-xs font-black text-slate-700">{group.name}</summary><div className="grid gap-3 border-t border-slate-100 p-3 sm:grid-cols-3 lg:grid-cols-4">{group.fields.map(([key, label, unit]) => <Field key={key} label={`${label}${unit ? ` · ${unit}` : ''}`}><input className={input} value={row[key] || ''} onChange={e => setRows(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, [key]: e.target.value } : item))} /></Field>)}</div></details>)}</div></section>)}
    <Button type="button" variant="outline" onClick={() => setRows(current => [...current, emptyHospitalLabRow()])} className="w-full border-dashed border-blue-300 text-blue-700"><Plus className="mr-1 h-4 w-4" />Agregar otra fecha</Button>
    <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-black text-violet-950">Microbiología</h3><p className="text-xs text-violet-700">Resultados detectados por el parser o provenientes de PROA.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setCultures(current => [...current, { fecha: new Date().toISOString().slice(0, 10), tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }])}><Plus className="mr-1 h-4 w-4" />Agregar estudio</Button></div>{cultures.length ? <div className="space-y-2">{cultures.map((culture, index) => <div key={`${cultureKey(culture)}-${index}`} className="grid gap-2 rounded-lg border border-violet-100 bg-white p-3 sm:grid-cols-[140px_1fr_2fr_150px_auto]"><input type="date" className={input} value={culture.fecha || ''} onChange={e => updateCulture(index, 'fecha', e.target.value)} /><input className={input} value={culture.tipo_muestra || ''} onChange={e => updateCulture(index, 'tipo_muestra', e.target.value)} placeholder="Muestra / estudio" /><textarea className={`${input} min-h-10`} value={culture.patogeno || ''} onChange={e => updateCulture(index, 'patogeno', e.target.value)} placeholder="Resultado / patógeno" /><select className={input} value={culture.sensibilidad || 'Pendiente'} onChange={e => updateCulture(index, 'sensibilidad', e.target.value)}><option>Pendiente</option><option>Sensible</option><option>Resistente</option><option>Sin desarrollo</option></select><Button type="button" variant="ghost" size="sm" onClick={() => setCultures(current => current.filter((_, itemIndex) => itemIndex !== index))} className="text-red-600">Quitar</Button></div>)}</div> : <p className="rounded-lg border border-dashed border-violet-200 bg-white/60 p-4 text-center text-xs text-violet-700">Sin estudios microbiológicos registrados.</p>}</section>
  </div>;
}

const ACTIONS = [
  { label: 'Evolución PROA', route: 'GestionPROA', proa: true, icon: ShieldCheck, color: 'text-teal-800 bg-teal-50' },
  { label: 'Solicitud de exámenes', route: 'SolicitudExamenes', icon: FlaskConical, color: 'text-blue-700 bg-blue-50' },
  { label: 'Microbiología', route: 'SolicitudMicrobiologia', icon: Microscope, color: 'text-cyan-700 bg-cyan-50' },
  { label: 'Fármaco restringido', route: 'SolicitudFarmacoRestringido', icon: Pill, color: 'text-amber-700 bg-amber-50' },
  { label: 'HODOM / consentimientos', route: 'FormulariosHODOM', icon: FileText, color: 'text-indigo-700 bg-indigo-50' },
  { label: 'Formulario / Constancia GES', route: 'FormularioGES', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50' },
  { label: 'IRA grave / ISP', route: 'FormularioIRAGrave', icon: Activity, color: 'text-rose-700 bg-rose-50' },
  { label: 'Solicitar protocolo de imágenes', route: 'Templates?image=1', icon: Image, color: 'text-violet-700 bg-violet-50' },
];

function VistaHospitalizados() {
  const navigate = useNavigate();
  const [registry, setRegistry] = useState(readRegistry);
  const [hodomRows, setHodomRows] = useState([]);
  const [selectedCode, setSelectedCode] = useState(() => sessionStorage.getItem(SELECTED_BED_KEY) || '');
  const [draft, setDraft] = useState(() => {
    const savedCode = sessionStorage.getItem(SELECTED_BED_KEY) || '';
    return { ...EMPTY, ...(savedCode ? readRegistry()[savedCode] : {}) };
  });
  const [service, setService] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('camas');
  const [saved, setSaved] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [syncState, setSyncState] = useState('loading');
  const [printPreview, setPrintPreview] = useState(false);
  const [printServices, setPrintServices] = useState(() => PRINT_SERVICE_OPTIONS.map(option => option.value));
  const [careDocumentOpen, setCareDocumentOpen] = useState(false);
  const [medicalReportsOpen, setMedicalReportsOpen] = useState(false);
  const [labWorkspaceTab, setLabWorkspaceTab] = useState('registro');
  const [labCurveLoading, setLabCurveLoading] = useState(false);
  const [labCurveRows, setLabCurveRows] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [labOpen, setLabOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [generalDraft, setGeneralDraft] = useState(EMPTY);
  const [diagnosisAndHistoryDraft, setDiagnosisAndHistoryDraft] = useState('');
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [evolutionDraft, setEvolutionDraft] = useState('');
  const [scalesOpen, setScalesOpen] = useState(false);
  const [scaleDraft, setScaleDraft] = useState({ fecha: new Date().toISOString().slice(0, 10), calculatorId: '', nombre: '', puntaje: '', resultado: '' });
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [nutritionDraft, setNutritionDraft] = useState({ fecha: new Date().toISOString().slice(0, 10), tamizaje: '', puntaje: '', evaluacion: '' });
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [diagnosisDraft, setDiagnosisDraft] = useState({ principal: '', desglose: '' });
  const [studiesOpen, setStudiesOpen] = useState(false);
  const [studiesRows, setStudiesRows] = useState([]);
  const [proaOpen, setProaOpen] = useState(false);
  const [proaSaving, setProaSaving] = useState(false);
  const [dischargeOpen, setDischargeOpen] = useState(false);
  const [discharging, setDischarging] = useState(false);
  const [dischargeDraft, setDischargeDraft] = useState({ fecha: new Date().toISOString().slice(0, 10), motivo: '', destinoServicio: '', destinoCama: '', antibioticActions: {}, antibioticStopDates: {}, antibioticoAltaIndicacion: '' });
  const [proaQuick, setProaQuick] = useState({ paciente: '', rut: '', edad: '', sexo: '', fecha_ingreso: '', diagnostico: '', aislamiento: '', antibioticos: [{ ...EMPTY_QUICK_ATB }], cultivos: [{ fecha: '', tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }] });
  const [labSaving, setLabSaving] = useState(false);
  const [labCultures, setLabCultures] = useState([]);
  const [labPasteText, setLabPasteText] = useState('');
  const [labParseMessage, setLabParseMessage] = useState('');
  const [readmissionOpen, setReadmissionOpen] = useState(false);
  const [readmissionDraft, setReadmissionDraft] = useState({ value: '', detected: false, previousDischargeDate: '' });
  const pendingClinicalAction = useRef(null);
  const emptyLabRow = () => emptyHospitalLabRow();
  const [labRows, setLabRows] = useState(() => [emptyLabRow()]);

  useEffect(() => {
    let active = true;
    const synchronize = () => fetchProaRecords().then(records => {
      if (!active) return;
      const currentHodomRows = records.filter(record => !isHistoricalProaRecord(record) && (/^HD-/i.test(record.bedCode) || /domiciliaria/i.test(record.servicio || ''))).map(record => ({
        bed: { code: record.bedCode, cell: record.bedCode, serviceShort: 'HODOM', salaLabel: 'Hospitalización domiciliaria' },
        record: proaToPatient(record),
      }));
      setHodomRows(currentHodomRows);
      setRegistry(current => {
        const fromProa = {};
        const activeRecordLocations = new Map();
        records.filter(record => !isHistoricalProaRecord(record)).forEach(record => {
          const catalogCode = PROA_TO_CATALOG.get(record.bedCode)
            || (ALL_BEDS.some(bed => bed.code === record.bedCode) ? record.bedCode : null);
          if (catalogCode) {
            fromProa[catalogCode] = proaToPatient(record);
            activeRecordLocations.set(record.id, catalogCode);
          }
        });
        currentHodomRows.forEach(({ bed, record }) => {
          fromProa[bed.code] = record;
          if (record.proaRecordId) activeRecordLocations.set(record.proaRecordId, bed.code);
        });
        const merged = { ...fromProa };
        Object.entries(current).forEach(([bedCode, local]) => {
          if (local?.proaRecordId && activeRecordLocations.get(local.proaRecordId) !== bedCode) return;
          merged[bedCode] = mergePatient(fromProa[bedCode] || {}, local);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
      setSyncState('ready');
    }).catch(() => { if (active) setSyncState('offline'); });
    synchronize();
    const intervalId = window.setInterval(synchronize, 60000);
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') synchronize(); };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', synchronize);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', synchronize);
    };
  }, []);

  const displayBeds = useMemo(() => [...ALL_BEDS, ...hodomRows.map(item => item.bed), TEST_BED].sort((a, b) => (PRINT_SERVICE_ORDER.get(a.serviceShort) ?? 99) - (PRINT_SERVICE_ORDER.get(b.serviceShort) ?? 99)
    || String(a.cell).localeCompare(String(b.cell), 'es', { numeric: true })), [hodomRows]);
  const services = [...new Set(displayBeds.map(b => b.serviceShort))];
  const selectedBed = displayBeds.find(b => b.code === selectedCode);
  const destinationBeds = useMemo(() => displayBeds
    .filter(bed => bed.serviceShort === dischargeDraft.destinoServicio && bed.code !== selectedCode)
    .map(bed => {
      const record = registry[bed.code] || {};
      return { ...bed, occupied: Boolean(record.nombre || record.rut || record.fechaIngreso || record.diagnosticoPrincipal || record.diagnostico) };
    }), [displayBeds, dischargeDraft.destinoServicio, registry, selectedCode]);
  const selectedCalculator = allCalculators.find(item => item.id === scaleDraft.calculatorId);
  const SelectedCalculatorComponent = selectedCalculator?.component;
  const occupied = Boolean(draft.nombre || draft.rut || draft.fechaIngreso || draft.diagnostico);
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const visibleBeds = useMemo(() => displayBeds.filter(b => {
    const record = registry[b.code] || {};
    const isOccupied = Boolean(record.nombre || record.rut || record.fechaIngreso || record.diagnostico);
    if (service !== 'all' && b.serviceShort !== service) return false;
    if (status === 'occupied' && !isOccupied) return false;
    if (status === 'free' && isOccupied) return false;
    if (!normalizedQuery) return true;
    return [b.code, b.cell, b.serviceShort, b.salaLabel, record.nombre, record.rut, record.diagnostico]
      .some(value => String(value || '').toLocaleLowerCase('es').includes(normalizedQuery));
  }), [displayBeds, registry, service, status, normalizedQuery]);

  const totals = useMemo(() => {
    const censusBeds = displayBeds.filter(b => b.code !== TEST_BED.code);
    const occupiedCount = censusBeds.filter(b => { const r = registry[b.code] || {}; return r.nombre || r.rut || r.fechaIngreso || r.diagnosticoPrincipal || r.diagnostico; }).length;
    return { occupied: occupiedCount, free: censusBeds.length - occupiedCount };
  }, [displayBeds, registry]);

  const statistics = useMemo(() => {
    const percent = (numerator, denominator) => denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0;
    const today = new Date().toISOString().slice(0, 10);
    const censusBeds = displayBeds.filter(bed => bed.code !== TEST_BED.code);
    const occupiedRows = censusBeds.map(bed => ({ bed, record: registry[bed.code] || {} })).filter(({ record }) => record.nombre || record.rut || record.fechaIngreso || record.diagnosticoPrincipal || record.diagnostico);
    const hasActiveAtb = record => (record.antibioticos || []).some(item => item?.nombre && (!item.termino || item.termino >= today)) || (!record.antibioticos?.length && Boolean(record.antibioterapia));
    const byService = PRINT_SERVICE_OPTIONS.map(option => {
      const serviceBeds = displayBeds.filter(bed => bed.serviceShort === option.value);
      const patients = occupiedRows.filter(({ bed }) => bed.serviceShort === option.value);
      const nonSocial = patients.filter(({ record }) => !record.pacienteSocial);
      const longStay = nonSocial.filter(({ record }) => hospitalDays(record.fechaIngreso) > 7);
      const withAtb = patients.filter(({ record }) => hasActiveAtb(record));
      return { service: option.value, label: option.label, capacity: serviceBeds.length, occupied: patients.length, nonSocial: nonSocial.length, longStay: longStay.length, withAtb: withAtb.length, occupancyPct: percent(patients.length, serviceBeds.length), longStayPct: percent(longStay.length, nonSocial.length), atbPct: percent(withAtb.length, patients.length) };
    });
    const nonSocial = occupiedRows.filter(({ record }) => !record.pacienteSocial);
    const longStay = nonSocial.filter(({ record }) => hospitalDays(record.fechaIngreso) > 7);
    const withAtb = occupiedRows.filter(({ record }) => hasActiveAtb(record));
    const antibioticCounts = new Map(); const pathogenCounts = new Map();
    occupiedRows.forEach(({ record }) => {
      (record.antibioticos || []).filter(item => item?.nombre && (!item.termino || item.termino >= today)).forEach(item => antibioticCounts.set(item.nombre, (antibioticCounts.get(item.nombre) || 0) + 1));
      String(record.patogenoAislado || '').split(/\n|,|;/).map(item => item.trim()).filter(Boolean).forEach(item => pathogenCounts.set(item, (pathogenCounts.get(item) || 0) + 1));
    });
    return {
      byService,
      overall: { capacity: censusBeds.length, occupied: occupiedRows.length, nonSocial: nonSocial.length, longStay: longStay.length, withAtb: withAtb.length, occupancyPct: percent(occupiedRows.length, censusBeds.length), longStayPct: percent(longStay.length, nonSocial.length), atbPct: percent(withAtb.length, occupiedRows.length) },
      antibiotics: [...antibioticCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      pathogens: [...pathogenCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    };
  }, [displayBeds, registry]);

  const printRows = useMemo(() => [
    ...ALL_BEDS.map(bed => ({ bed, record: registry[bed.code] || {} })),
    ...hodomRows,
  ].filter(({ bed, record }) => printServices.includes(bed.serviceShort) && (record.nombre || record.rut || record.fechaIngreso || record.diagnosticoPrincipal || record.diagnostico))
    .sort((a, b) => (PRINT_SERVICE_ORDER.get(a.bed.serviceShort) ?? 99) - (PRINT_SERVICE_ORDER.get(b.bed.serviceShort) ?? 99)
      || String(a.bed.cell).localeCompare(String(b.bed.cell), 'es', { numeric: true })), [registry, hodomRows, printServices]);
  const printServiceLabel = printServices.length === PRINT_SERVICE_OPTIONS.length
    ? 'Todos los servicios'
    : PRINT_SERVICE_OPTIONS.filter(option => printServices.includes(option.value)).map(option => option.label).join(' · ') || 'Sin servicios seleccionados';
  const togglePrintService = value => setPrintServices(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);

  const openBed = (bed) => {
    setSelectedCode(bed.code);
    sessionStorage.setItem(SELECTED_BED_KEY, bed.code);
    setDraft({ ...EMPTY, ...(registry[bed.code] || {}) });
    setHistoryOpen(false);
    setDetailsOpen(true);
    setSaved(false);
  };

  const update = (key, value) => { setDraft(old => ({ ...old, [key]: value })); setSaved(false); };
  const save = () => {
    const savedDraft = withHistorySnapshot({ ...draft, updatedAt: new Date().toISOString() });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft);
    setRegistry(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
  };
  const saveAllChanges = async () => {
    if (!selectedCode || savingAll) return;
    setSavingAll(true); setSaved(false);
    const savedDraft = withHistorySnapshot({ ...draft, nombre: normalizeName(draft.nombre), diagnosticoPrincipal: normalizeClinicalText(draft.diagnosticoPrincipal), diagnostico: normalizeClinicalText(draft.diagnostico), updatedAt: new Date().toISOString() });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    try {
      if (savedDraft.proaRecordId) {
        const records = await fetchProaRecords();
        const latest = getLatestProaForm(records.find(item => item.id === savedDraft.proaRecordId)) || {};
        const diagnoses = [savedDraft.diagnosticoPrincipal, ...String(savedDraft.diagnostico || '').split(/\n|;/)].map(item => item.trim()).filter(Boolean);
        await saveProaRecord({
          ...latest, paciente: savedDraft.nombre, rut: savedDraft.rut, fecha_nacimiento: savedDraft.fechaNacimiento, edad: savedDraft.edad, sexo: savedDraft.sexo,
          direccion: savedDraft.direccion, comuna: savedDraft.comuna, fecha_ingreso: savedDraft.fechaIngreso, antecedentes: savedDraft.antecedentes,
          diagnostico_principal: savedDraft.diagnosticoPrincipal, diagnostico_desglose: savedDraft.diagnostico, diagnosticos_actuales: diagnoses, diagnostico_actual: diagnoses.join('; '),
          resumen_caso: savedDraft.resumenCaso, vista_ultima_evolucion: savedDraft.ultimaEvolucion, vista_planes_pendientes: savedDraft.planesPendientes, vista_plan_alta: savedDraft.planAlta,
          vista_estudios_complementarios: savedDraft.estudiosComplementarios, vista_estudios_detalle: savedDraft.estudiosDetalle || [], vista_observaciones: savedDraft.observaciones,
          let_indicacion: savedDraft.letIndicacion, iot_indicacion: savedDraft.iotIndicacion, rcp_indicacion: savedDraft.rcpIndicacion, paciente_social: Boolean(savedDraft.pacienteSocial),
          vista_escalas: savedDraft.escalas || [], vista_evaluaciones_nutricionales: savedDraft.evaluacionesNutricionales || [],
          fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'actualizacion_general_vista_hospitalizados',
        });
      }
      setSaved(true); setSyncState('ready');
    } catch {
      setSyncState('offline');
    } finally {
      setSavingAll(false);
    }
  };
  const saveMedicalReport = async (report) => {
    const reports = [report, ...(Array.isArray(draft.informesMedicos) ? draft.informesMedicos : [])].slice(0, 100);
    const savedDraft = { ...draft, informesMedicos: reports, updatedAt: new Date().toISOString() };
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSaved(true);
    if (!savedDraft.proaRecordId) return { synced: false };
    try {
      const records = await fetchProaRecords();
      const latest = getLatestProaForm(records.find(item => item.id === savedDraft.proaRecordId)) || {};
      await saveProaRecord({ ...latest, vista_informes_medicos: reports, fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'informe_medico_vista_hospitalizados' });
      setSyncState('ready');
      return { synced: true };
    } catch (error) {
      setSyncState('offline');
      return { synced: false, error };
    }
  };
  const openGeneral = () => { setGeneralDraft({ ...draft }); setDiagnosisAndHistoryDraft(combinedDiagnosisAndHistory(draft)); setGeneralOpen(true); };
  const updateGeneral = (key, value) => setGeneralDraft(old => ({ ...old, [key]: value }));
  const saveGeneral = async () => {
    const clinicalContext = splitDiagnosisAndHistory(diagnosisAndHistoryDraft);
    const savedDraft = withHistorySnapshot({ ...generalDraft, nombre: normalizeName(generalDraft.nombre), diagnosticoPrincipal: normalizeClinicalText(generalDraft.diagnosticoPrincipal), diagnostico: normalizeClinicalText(clinicalContext.diagnostico), antecedentes: normalizeClinicalText(clinicalContext.antecedentes), updatedAt: new Date().toISOString() });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (savedDraft.proaRecordId) {
      const records = await fetchProaRecords();
      const latest = getLatestProaForm(records.find(item => item.id === savedDraft.proaRecordId)) || {};
      const diagnoses = [savedDraft.diagnosticoPrincipal, ...String(savedDraft.diagnostico || '').split(/\n|;/)].map(item => item.trim()).filter(Boolean);
      await saveProaRecord({ ...latest, antecedentes: savedDraft.antecedentes, diagnostico_principal: savedDraft.diagnosticoPrincipal, diagnostico_desglose: savedDraft.diagnostico, diagnosticos_actuales: diagnoses, diagnostico_actual: diagnoses.join('; '), resumen_caso: savedDraft.resumenCaso, vista_ultima_evolucion: savedDraft.ultimaEvolucion, vista_planes_pendientes: savedDraft.planesPendientes, vista_plan_alta: savedDraft.planAlta, fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'actualizacion_clinica_vista_general' });
    }
    setGeneralOpen(false); setSaved(true);
  };
  const toggleSocialPatient = async () => {
    const nextValue = !draft.pacienteSocial;
    const savedDraft = { ...draft, pacienteSocial: nextValue, updatedAt: new Date().toISOString() };
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSaved(true);
    if (savedDraft.proaRecordId) {
      const records = await fetchProaRecords();
      const latest = getLatestProaForm(records.find(item => item.id === savedDraft.proaRecordId)) || {};
      await saveProaRecord({ ...latest, paciente_social: nextValue, fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'clasificacion_social_vista_general' });
    }
  };
  const openDischarge = () => {
    const today = new Date().toISOString().slice(0, 10);
    const activeActions = Object.fromEntries((draft.antibioticos || []).map((item, index) => [index, item.termino && item.termino < today ? 'suspendido' : 'suspender']));
    const stopDates = Object.fromEntries((draft.antibioticos || []).map((item, index) => [index, item.termino || today]));
    setDischargeDraft({ fecha: today, motivo: '', destinoServicio: '', destinoCama: '', antibioticActions: activeActions, antibioticStopDates: stopDates, antibioticoAltaIndicacion: '' });
    setDischargeOpen(true);
  };
  const confirmDischarge = async () => {
    const missingDestination = dischargeDraft.motivo === 'Traslado a otro servicio' && (!dischargeDraft.destinoServicio || !dischargeDraft.destinoCama);
    if (!dischargeDraft.fecha || !dischargeDraft.motivo || missingDestination || discharging) return;
    setDischarging(true);
    try {
      const antibiotics = draft.antibioticos || [];
      const antibioticStops = {};
      const continued = [];
      antibiotics.forEach((item, index) => {
        if (!item?.nombre) return;
        const action = dischargeDraft.antibioticActions[index];
        if (action === 'suspender' || action === 'suspendido') antibioticStops[index] = dischargeDraft.antibioticStopDates[index] || item.termino || dischargeDraft.fecha;
        if (action === 'continuar') continued.push([item.nombre, item.dosis || [item.dosis_cantidad, item.dosis_unidad].filter(Boolean).join(' '), item.intervalo_horas && `c/${item.intervalo_horas} h`, item.via].filter(Boolean).join(' '));
      });
      if (draft.proaRecordId) {
        const records = await fetchProaRecords();
        const record = records.find(item => item.id === draft.proaRecordId);
        if (record) await archiveProaRecord(record, dischargeDraft.fecha, { motivo: dischargeDraft.motivo, destinoServicio: dischargeDraft.destinoServicio, destinoCama: dischargeDraft.destinoCama, antibioticStops, antibioticoAlta: continued.join('\n'), antibioticoAltaIndicacion: dischargeDraft.antibioticoAltaIndicacion });
      }
      const next = { ...registry }; delete next[selectedCode];
      setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setHodomRows(rows => rows.filter(item => item.bed.code !== selectedCode));
      setDraft({ ...EMPTY }); setSelectedCode(''); sessionStorage.removeItem(SELECTED_BED_KEY);
      setDischargeOpen(false); setSaved(false);
    } finally {
      setDischarging(false);
    }
  };
  const openLatestEvolution = () => { setEvolutionDraft(draft.ultimaEvolucion || ''); setEvolutionOpen(true); };
  const saveLatestEvolution = () => {
    const savedDraft = withHistorySnapshot({ ...draft, ultimaEvolucion: evolutionDraft, updatedAt: new Date().toISOString() });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setEvolutionOpen(false); setSaved(true);
  };
  const saveScale = () => {
    if (!scaleDraft.nombre || !scaleDraft.puntaje) return;
    const item = { ...scaleDraft, guardadoEn: new Date().toISOString() };
    const savedDraft = withHistorySnapshot({ ...draft, escalas: [item, ...(draft.escalas || [])], updatedAt: item.guardadoEn });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setScalesOpen(false); setSaved(true);
  };
  const nutritionRisk = score => score === '' ? '' : Number(score) >= 3 ? 'Riesgo nutricional' : 'Sin riesgo nutricional';
  const saveNutrition = () => {
    if (!nutritionDraft.tamizaje || !nutritionDraft.evaluacion) return;
    const item = { ...nutritionDraft, riesgo: nutritionDraft.tamizaje === 'Sí' ? nutritionRisk(nutritionDraft.puntaje) : nutritionDraft.tamizaje, guardadoEn: new Date().toISOString() };
    const savedDraft = withHistorySnapshot({ ...draft, evaluacionesNutricionales: [item, ...(draft.evaluacionesNutricionales || [])], updatedAt: item.guardadoEn });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setNutritionOpen(false); setSaved(true);
  };
  const openDiagnosis = () => { setDiagnosisDraft({ principal: draft.diagnosticoPrincipal || '', desglose: draft.diagnostico || '' }); setDiagnosisOpen(true); };
  const saveDiagnosis = async () => {
    const savedDraft = withHistorySnapshot({ ...draft, diagnosticoPrincipal: normalizeClinicalText(diagnosisDraft.principal), diagnostico: normalizeClinicalText(diagnosisDraft.desglose), updatedAt: new Date().toISOString() });
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (savedDraft.proaRecordId) {
      const records = await fetchProaRecords(); const latest = getLatestProaForm(records.find(item => item.id === savedDraft.proaRecordId)) || {};
      const diagnoses = [savedDraft.diagnosticoPrincipal, ...savedDraft.diagnostico.split(/\n|;/)].map(item => item.trim()).filter(Boolean);
      await saveProaRecord({ ...latest, diagnostico_principal: savedDraft.diagnosticoPrincipal, diagnostico_desglose: savedDraft.diagnostico, diagnosticos_actuales: diagnoses, diagnostico_actual: diagnoses.join('; '), fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'diagnostico_vista_general' });
    }
    setDiagnosisOpen(false); setSaved(true);
  };

  const prefill = () => {
    const data = {
      patient_name: draft.nombre, patient_rut: draft.rut, patient_fecha_nac: draft.fechaNacimiento,
      patient_direccion: draft.direccion, patient_comuna: draft.comuna, patient_telefono: draft.telefono,
      prevision: draft.prevision, diagnostico: draft.diagnosticoPrincipal || draft.diagnostico, diagnostico_principal: draft.diagnosticoPrincipal, diagnostico_desglose: draft.diagnostico, n_ficha: draft.nFicha,
      aislamiento: draft.aislamiento, clinical_text: [draft.resumenCaso, draft.antecedentes].filter(Boolean).join('\n'),
      edad: draft.edad, sexo: draft.sexo, fecha_ingreso: draft.fechaIngreso, proa_antibioticos: draft.antibioticos || [], proa_examenes: draft.laboratorios || [], ultimo_laboratorio: draft.ultimoLaboratorio || '',
      servicio: selectedBed?.serviceShort || '', unidad: selectedBed?.salaLabel || '', cama: selectedBed?.cell || selectedBed?.code || '',
      sala_cama: [selectedBed?.serviceShort, selectedBed?.salaLabel, selectedBed?.cell && `Cama ${selectedBed.cell}`].filter(Boolean).join(' · '),
      ubicacion: [selectedBed?.serviceShort, selectedBed?.salaLabel, selectedBed?.cell && `Cama ${selectedBed.cell}`].filter(Boolean).join(' · '),
      source: 'vista_general', source_service: selectedBed?.serviceShort || '', source_bed: draft.proaBedCode || selectedBed?.code || '',
    };
    setMultiPrefill(data);
    return data;
  };

  const requestFirstClinicalUse = async (action) => {
    if (draft.reingresoEvaluado) { action(); return; }
    pendingClinicalAction.current = action;
    let previousDischargeDate = draft.egresoPrevioConocido || '';
    if (!previousDischargeDate && draft.rut) {
      try {
        const normalizedRut = String(draft.rut).replace(/[^0-9k]/gi, '').toUpperCase();
        const records = await fetchProaRecords();
        previousDischargeDate = records
          .filter(record => isHistoricalProaRecord(record))
          .map(record => getLatestProaForm(record) || {})
          .filter(form => String(form.rut || '').replace(/[^0-9k]/gi, '').toUpperCase() === normalizedRut && form.fecha_egreso)
          .map(form => form.fecha_egreso)
          .sort().at(-1) || '';
      } catch { /* Permite confirmar manualmente si el histórico remoto no está disponible. */ }
    }
    const admission = draft.fechaIngreso ? new Date(`${draft.fechaIngreso}T00:00:00`) : new Date();
    const previous = previousDischargeDate ? new Date(`${previousDischargeDate}T00:00:00`) : null;
    const elapsedDays = previous && !Number.isNaN(previous.getTime()) ? Math.floor((admission.getTime() - previous.getTime()) / 86400000) : null;
    const detected = elapsedDays !== null && elapsedDays >= 0 && elapsedDays <= 30;
    setReadmissionDraft({ value: detected ? 'Sí' : '', detected, previousDischargeDate: detected ? previousDischargeDate : '' });
    setReadmissionOpen(true);
  };

  const confirmReadmission = () => {
    if (!readmissionDraft.value) return;
    const now = new Date().toISOString();
    const savedDraft = {
      ...draft,
      reingresoEvaluado: true,
      reingresoMenor30: readmissionDraft.value === 'Sí',
      reingresoFechaEgresoPrevia: readmissionDraft.value === 'Sí' ? readmissionDraft.previousDischargeDate : '',
      reingresoEvaluadoEn: now,
      updatedAt: now,
    };
    const next = { ...registry, [selectedCode]: savedDraft };
    setDraft(savedDraft); setRegistry(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setReadmissionOpen(false);
    const action = pendingClinicalAction.current; pendingClinicalAction.current = null;
    window.setTimeout(() => action?.(), 0);
  };

  const openActionDirect = (route, isProa = false) => {
    save();
    prefill();
    if (isProa) {
      const proaBed = draft.proaBedCode || catalogToProaBed(selectedBed);
      navigate(`${createPageUrl('GestionPROA')}?bed=${encodeURIComponent(proaBed || selectedBed.code)}&action=${draft.proaEnrolled ? 'evolve' : 'admit'}`);
      return;
    }
    const [page, search] = route.split('?');
    navigate(`${createPageUrl(page)}${search ? `?${search}` : ''}`);
  };
  const openAction = (route, isProa = false) => requestFirstClinicalUse(() => openActionDirect(route, isProa));
  const openFullProa = () => {
    setProaOpen(false); save(); prefill();
    const proaBed = draft.proaBedCode || catalogToProaBed(selectedBed);
    navigate(`${createPageUrl('GestionPROA')}?bed=${encodeURIComponent(proaBed || selectedBed.code)}&action=${draft.proaEnrolled ? 'evolve' : 'admit'}`);
  };

  const goToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const openLabCurve = async () => {
    setLabWorkspaceTab('curva');
    setLabOpen(true);
    setLabCurveLoading(true);
    try {
      let rows = Array.isArray(draft.laboratorios) ? draft.laboratorios : [];
      if (draft.proaRecordId) {
        const records = await fetchProaRecords();
        const record = records.find(item => item.id === draft.proaRecordId);
        const form = getLatestProaForm(record) || {};
        if (Array.isArray(form.parametros_inflamatorios) && form.parametros_inflamatorios.length) rows = form.parametros_inflamatorios;
      }
      setLabCurveRows(rows);
    } catch {
      setLabCurveRows(Array.isArray(draft.laboratorios) ? draft.laboratorios : []);
    } finally { setLabCurveLoading(false); }
  };
  const parsePastedLabs = () => {
    const fallbackDate = labRows[0]?.fecha || new Date().toISOString().slice(0, 10);
    const parsed = parseLabReportText(labPasteText, fallbackDate);
    const grouped = new Map();
    parsed.forEach(result => {
      if (result.category === 'Microbiología') return;
      const field = LAB_FIELD_BY_EXAM[result.examKey];
      if (!field || result.value == null || !Number.isFinite(Number(result.value))) return;
      const fecha = String(result.collectedAt || fallbackDate).slice(0, 10);
      const row = grouped.get(fecha) || emptyHospitalLabRow(fecha);
      row[field] = `${result.comparator || ''}${result.value}`;
      grouped.set(fecha, row);
    });
    const rows = [...grouped.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const parsedCultures = parsed.filter(result => result.category === 'Microbiología' && result.valueText).map(cultureFromParsedResult);
    if (parsedCultures.length) setLabCultures(current => deduplicateCultures([...parsedCultures, ...current]));
    if (!rows.length && !parsedCultures.length) {
      setLabParseMessage('No se reconocieron resultados compatibles. Revisa el texto o ingrésalos manualmente.');
      return;
    }
    if (rows.length) setLabRows(current => mergeLaboratoryRows(current, rows));
    const resultCount = rows.reduce((total, row) => total + Object.entries(row).filter(([key, value]) => key !== 'fecha' && value !== '').length, 0);
    setLabParseMessage(`Se cargaron ${rows.length} fecha(s), ${resultCount} resultado(s) y ${parsedCultures.length} estudio(s) microbiológico(s). Revísalos antes de guardar.`);
  };
  const saveLab = async () => {
    setLabSaving(true);
    try {
      const rows = labRows.filter(row => Object.entries(row).some(([key, value]) => key !== 'fecha' && value));
      const allRows = mergeLaboratoryRows([], rows);
      const cultures = deduplicateCultures(labCultures);
      const latestRow = allRows[0];
      const populated = HOSPITAL_LAB_FIELDS.filter(([key]) => latestRow?.[key] !== '' && latestRow?.[key] != null).slice(0, 6);
      const summary = latestRow ? [latestRow.fecha, ...populated.map(([key, label]) => `${label} ${latestRow[key]}`)].join(' · ') : '';
      const pathogen = cultures.filter(item => item.patogeno && item.sensibilidad !== 'Sin desarrollo').map(item => `${item.tipo_muestra}: ${item.patogeno}`).join('\n');
      const nextDraft = { ...draft, laboratorios: allRows, cultivos: cultures, ultimoLaboratorio: summary, patogenoAislado: pathogen, updatedAt: new Date().toISOString() };
      const nextRegistry = { ...registry, [selectedCode]: nextDraft };
      setDraft(nextDraft);
      setRegistry(nextRegistry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry));
      if (draft.proaRecordId) {
        const records = await fetchProaRecords();
        const record = records.find(item => item.id === draft.proaRecordId);
        const latest = getLatestProaForm(record) || {};
        await saveProaRecord({
          ...latest, fecha: latestRow?.fecha || new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'laboratorio_microbiologia_vista_general',
          parametros_inflamatorios: allRows, estudios_micro: cultures, diagnostico_microbiologico: pathogen,
          creatinina: latestRow?.crea || '', fecha_creatinina: latestRow?.crea ? latestRow.fecha : '',
        });
      }
      setLabPasteText('');
      setLabParseMessage(draft.proaRecordId ? 'Guardado en la ficha hospitalaria y sincronizado con PROA. Puedes procesar otro informe.' : 'Guardado en la ficha hospitalaria. Puedes procesar otro informe.');
    } finally { setLabSaving(false); }
  };
  const saveStats = async () => {
    const nextDraft = { ...draft, updatedAt: new Date().toISOString() };
    const nextRegistry = { ...registry, [selectedCode]: nextDraft };
    setRegistry(nextRegistry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry));
    if (draft.proaRecordId) {
      const records = await fetchProaRecords();
      const record = records.find(item => item.id === draft.proaRecordId);
      const latest = getLatestProaForm(record) || {};
      await saveProaRecord({ ...latest, paciente: draft.nombre, rut: draft.rut, edad: draft.edad, sexo: draft.sexo, fecha_nacimiento: draft.fechaNacimiento, prevision: draft.prevision, fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'datos_vista_general' });
    }
    setStatsOpen(false);
    setSaved(true);
  };
  const openStudies = () => {
    setStudiesRows((draft.estudiosDetalle || []).length ? draft.estudiosDetalle : [{ fecha: '', tipo: 'Imagenología', estudio: draft.estudiosComplementarios || '', estado: 'Pendiente' }]);
    setStudiesOpen(true);
  };
  const saveStudies = async () => {
    const rows = studiesRows.filter(item => item.estudio || item.fecha);
    const summary = rows.map(item => [item.tipo, item.fecha, item.estudio, item.estado].filter(Boolean).join(' · ')).join('\n');
    const nextDraft = { ...draft, estudiosDetalle: rows, estudiosComplementarios: summary, updatedAt: new Date().toISOString() };
    const nextRegistry = { ...registry, [selectedCode]: nextDraft };
    setDraft(nextDraft); setRegistry(nextRegistry); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry));
    if (draft.proaRecordId) {
      const records = await fetchProaRecords();
      const latest = getLatestProaForm(records.find(item => item.id === draft.proaRecordId)) || {};
      const byType = type => rows.filter(item => item.tipo === type).map(item => [item.fecha, item.estudio, item.estado].filter(Boolean).join(' · ')).join('\n');
      await saveProaRecord({ ...latest, estudios_imagen: byType('Imagenología'), estudios_funcionales: byType('Estudio funcional'), estudios_anatomopatologicos: byType('Anatomía patológica'), estudios_otros: byType('Otro'), fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'estudios_vista_general' });
    }
    setStudiesOpen(false); setSaved(true);
  };
  const openProaPopup = async () => {
    let latest = {};
    let selectedRecord = null;
    if (draft.proaRecordId) {
      const records = await fetchProaRecords();
      selectedRecord = records.find(item => item.id === draft.proaRecordId) || null;
      latest = getLatestProaForm(selectedRecord) || {};
    }
    const storedAntibiotics = latestStructuredAntibiotics(selectedRecord);
    setProaQuick({
      paciente: latest.paciente || draft.nombre || '', rut: latest.rut || draft.rut || '', edad: latest.edad || draft.edad || '', sexo: latest.sexo || draft.sexo || '',
      fecha_ingreso: latest.fecha_ingreso || draft.fechaIngreso || '', diagnostico: latest.diagnostico_principal || latest.diagnostico_actual || draft.diagnosticoPrincipal || draft.diagnostico || '',
      aislamiento: latest.aislamiento || draft.aislamiento || '',
      antibioticos: storedAntibiotics.length ? storedAntibiotics : [{ ...EMPTY_QUICK_ATB, nombre: antibioticSummary(latest) || draft.antibioterapia || '' }],
      cultivos: (latest.estudios_micro || []).length ? latest.estudios_micro : [{ fecha: '', tipo_muestra: '', patogeno: '', sensibilidad: 'Pendiente' }],
    });
    setProaOpen(true);
  };
  const openStudiesChecked = () => requestFirstClinicalUse(openStudies);
  const openProaChecked = () => requestFirstClinicalUse(openProaPopup);
  const openLabChecked = () => requestFirstClinicalUse(() => { setLabWorkspaceTab('registro'); setLabRows(Array.isArray(draft.laboratorios) && draft.laboratorios.length ? mergeLaboratoryRows([], draft.laboratorios) : [emptyLabRow()]); setLabCultures(Array.isArray(draft.cultivos) ? draft.cultivos : []); setLabPasteText(''); setLabParseMessage(''); setLabOpen(true); });
  const saveProaQuick = async () => {
    setProaSaving(true);
    try {
      if (!draft.proaRecordId) {
        const antibiotics = proaQuick.antibioticos.filter(item => item.nombre);
        const cultures = proaQuick.cultivos.filter(item => item.fecha || item.tipo_muestra || item.patogeno);
        const created = await saveProaPreAdmission({
          paciente: proaQuick.paciente, rut: proaQuick.rut, edad: proaQuick.edad, sexo: proaQuick.sexo,
          fecha_ingreso: proaQuick.fecha_ingreso, diagnostico: proaQuick.diagnostico,
          diagnosticos: [proaQuick.diagnostico].filter(Boolean), servicio: selectedBed?.serviceShort || '', proa_is_test: selectedBed?.code === TEST_BED.code,
          cama: catalogToProaBed(selectedBed) || selectedBed?.code || '', antibioticos: antibiotics, cultivos: cultures,
        });
        const latestCreated = getLatestProaForm(created) || {};
        if (proaQuick.aislamiento) await saveProaRecord({ ...latestCreated, aislamiento: proaQuick.aislamiento, fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'ingreso_rapido_vista_general' });
        const antibioticText = structuredAntibioticSummary(antibiotics);
        const nextDraft = { ...draft, nombre: proaQuick.paciente, rut: formatRut(proaQuick.rut), edad: proaQuick.edad, sexo: proaQuick.sexo, fechaIngreso: proaQuick.fecha_ingreso, diagnosticoPrincipal: proaQuick.diagnostico, aislamiento: proaQuick.aislamiento, antibioterapia: antibioticText, antibioticos: antibiotics, patogenoAislado: cultures.map(item => item.patogeno).filter(Boolean).join(', '), proaRecordId: created.id, proaBedCode: created.bedCode, proaUpdatedAt: created.updatedAt, updatedAt: new Date().toISOString() };
        const nextRegistry = { ...registry, [selectedCode]: nextDraft };
        setDraft(nextDraft); setRegistry(nextRegistry); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry)); setProaOpen(false); setSaved(true);
        return;
      }
      const records = await fetchProaRecords();
      const record = records.find(item => item.id === draft.proaRecordId);
      const latest = getLatestProaForm(record) || {};
      const cultures = proaQuick.cultivos.filter(item => item.fecha || item.tipo_muestra || item.patogeno);
      const antibiotics = proaQuick.antibioticos.filter(item => item.nombre);
      const antibioticText = structuredAntibioticSummary(antibiotics);
      await saveProaRecord({
        ...latest, aislamiento: proaQuick.aislamiento, antibioticos: antibiotics, antibioterapia_preingreso: antibioticText,
        estudios_micro: cultures, diagnostico_microbiologico: cultures.map(item => item.patogeno).filter(Boolean).join(', '),
        fecha: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), proa_entry_type: 'actualizacion_vista_general',
      });
      const pathogen = cultures.map(item => item.patogeno).filter(Boolean).join(', ');
      const nextDraft = { ...draft, aislamiento: proaQuick.aislamiento, antibioterapia: antibioticText, antibioticos: antibiotics, patogenoAislado: pathogen, updatedAt: new Date().toISOString() };
      const nextRegistry = { ...registry, [selectedCode]: nextDraft };
      setDraft(nextDraft); setRegistry(nextRegistry); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRegistry));
      setProaOpen(false); setSaved(true);
    } finally { setProaSaving(false); }
  };

  return <div className="min-h-screen bg-slate-100">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-black text-slate-950">Vista general</h1><p className="text-xs text-slate-500">{syncState === 'loading' ? 'Sincronizando pacientes desde PROA…' : syncState === 'offline' ? 'Mostrando última información disponible' : 'Camas, situación clínica y documentos del paciente'}</p></div>
        <div className="flex rounded-lg bg-slate-100 p-1"><button type="button" onClick={() => setActiveTab('camas')} className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${activeTab === 'camas' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}><BedDouble className="mr-1 inline h-3.5 w-3.5" />Camas</button><button type="button" onClick={() => setActiveTab('estadistica')} className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${activeTab === 'estadistica' ? 'bg-white text-violet-800 shadow-sm' : 'text-slate-500'}`}><Activity className="mr-1 inline h-3.5 w-3.5" />Estadística</button></div>
        <Button variant="outline" size="sm" onClick={() => setPrintPreview(true)} className="gap-2"><Printer className="h-4 w-4" /><span className="hidden sm:inline">Tabla de visita</span></Button>
        <div className="hidden items-center gap-2 sm:flex"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{totals.occupied} ocupadas</span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{totals.free} libres</span></div>
      </div>
    </header>

    <main className={`${activeTab === 'camas' ? 'grid' : 'hidden'} mx-auto max-w-[1500px] gap-4 p-4 pb-32 xl:grid-cols-[minmax(480px,0.9fr)_minmax(560px,1.1fr)]`}>
      <section className="min-w-0">
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} className={`${input} pl-9`} placeholder="Buscar cama, paciente, RUT o diagnóstico" /></label>
            <select className={input} value={service} onChange={e => setService(e.target.value)}><option value="all">Todos los servicios</option>{services.map(s => <option key={s}>{s}</option>)}</select>
            <select className={input} value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todas</option><option value="occupied">Ocupadas</option><option value="free">Libres</option></select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleBeds.map(bed => {
            const record = registry[bed.code] || {};
            const isOccupied = Boolean(record.nombre || record.rut || record.fechaIngreso || record.diagnostico);
            const active = selectedCode === bed.code;
            return <button key={bed.code} onClick={() => openBed(bed)} className={`min-h-36 rounded-xl border p-3 text-left transition ${active ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200' : bed.code === TEST_BED.code ? 'border-violet-300 bg-violet-50 hover:border-violet-500' : isOccupied ? 'border-emerald-200 bg-white hover:border-emerald-400' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
              <div className="flex items-start justify-between gap-2"><div><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{bed.serviceShort} · {bed.salaLabel}</span><span className="block text-lg font-black text-slate-950">Cama {bed.cell}</span></div><BedDouble className={`h-5 w-5 ${isOccupied ? 'text-emerald-600' : 'text-slate-300'}`} /></div>
              {isOccupied ? <><div className="mt-2 flex min-w-0 items-center gap-1.5"><p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{record.nombre || 'Paciente sin nombre'}</p>{bed.code === TEST_BED.code && <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-[9px] font-black text-violet-900">PRUEBA</span>}{record.pacienteSocial && <span title="Paciente social" aria-label="Paciente social" className="inline-flex shrink-0 items-center rounded-full bg-fuchsia-100 p-1 text-fuchsia-700"><HeartHandshake className="h-3.5 w-3.5" /></span>}</div><p className="truncate text-xs text-slate-500">{record.diagnosticoPrincipal || record.diagnostico || 'Sin diagnóstico registrado'}</p><p className="mt-2 text-[11px] font-bold text-emerald-700">Día {hospitalDays(record.fechaIngreso)} de hospitalización</p>{record.antibioterapia && <p className="mt-1 truncate text-[10px] font-semibold text-amber-700">ATB: {record.antibioterapia}</p>}</> : <><span className="mt-5 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">LIBRE / SIN INFORMACIÓN</span><p className="mt-2 text-[10px] text-slate-400">Abrir para ingresar paciente</p></>}
            </button>;
          })}
        </div>
      </section>

      <aside className="min-w-0 pb-20 xl:sticky xl:top-20 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
        {!selectedBed ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><BedDouble className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-4 font-bold text-slate-800">Selecciona una cama</h2><p className="mt-1 text-sm text-slate-500">Podrás registrar al paciente y generar todos sus documentos desde una sola ficha.</p></div> : <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex flex-wrap items-start justify-between gap-3 ${detailsOpen ? 'mb-4' : ''}`}><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">{selectedBed.serviceShort} · {selectedBed.salaLabel}</p><h2 className="text-2xl font-black text-slate-950">Cama {selectedBed.cell}</h2>{draft.nombre && <p className="flex flex-wrap items-center gap-1.5 font-bold text-slate-800">{draft.nombre} {draft.rut && <span className="font-normal text-slate-500">· {draft.rut}</span>}{draft.pacienteSocial && <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-bold text-fuchsia-800"><HeartHandshake className="h-3 w-3" />Paciente social</span>}</p>}{occupied && <p className="text-xs font-semibold text-emerald-700">Ingreso {draft.fechaIngreso || 'sin fecha'} · Día {hospitalDays(draft.fechaIngreso)}</p>}</div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setDetailsOpen(open => !open)} className="gap-2">{detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{detailsOpen ? 'Ocultar ficha' : 'Ver ficha'}</Button><Button type="button" variant="outline" onClick={saveAllChanges} disabled={savingAll || !occupied} className="gap-2 border-emerald-300 bg-emerald-50 font-bold text-emerald-800 hover:bg-emerald-100"><Save className="h-4 w-4" />{savingAll ? 'Guardando…' : saved ? 'Cambios guardados' : 'Guardar todos los cambios'}</Button><Button type="button" variant="outline" onClick={openDischarge} disabled={!occupied} className="gap-2 border-red-300 bg-red-50 font-bold text-red-700 hover:bg-red-100"><LogOut className="h-4 w-4" />Egresar paciente</Button><Button onClick={openGeneral} className="gap-2 bg-teal-700 hover:bg-teal-800"><ClipboardList className="h-4 w-4" />Editar ficha general</Button></div></div>
            {detailsOpen && <>
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>Información clínica protegida por código de acceso. Los datos se reutilizan únicamente al abrir documentos desde esta ficha.</p></div>
            {draft.reingresoMenor30 && <div className="mb-4 flex items-start gap-2 rounded-xl border-2 border-orange-300 bg-orange-50 p-3 text-orange-950 shadow-sm"><Activity className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" /><div><p className="text-sm font-black">Segundo ingreso en menos de 30 días</p><p className="text-xs text-orange-800">Reingreso marcado{draft.reingresoFechaEgresoPrevia ? ` · egreso previo: ${displayClinicalDate(draft.reingresoFechaEgresoPrevia)}` : ''}.</p></div></div>}
            <div className="mb-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={openGeneral} className="border-sky-300 bg-sky-50 text-sky-800 shadow-[0_0_0_3px_rgba(125,211,252,0.18)] hover:bg-sky-100"><ClipboardList className="mr-1 h-3.5 w-3.5" />Actualización clínica</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMedicalReportsOpen(true)} className="border-emerald-300 bg-emerald-50 font-bold text-emerald-800 shadow-[0_0_0_3px_rgba(110,231,183,0.2)] hover:bg-emerald-100"><FileText className="mr-1 h-3.5 w-3.5" />Informes médicos</Button>
              <Button type="button" size="sm" variant="outline" onClick={openGeneral} className="border-amber-300 bg-amber-50 text-amber-800 shadow-[0_0_0_3px_rgba(252,211,77,0.18)] hover:bg-amber-100"><FileText className="mr-1 h-3.5 w-3.5" />Planes</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => openAction('NotaEvolucion')} className="border-slate-300 bg-slate-50 font-bold text-slate-800 shadow-[0_0_0_3px_rgba(203,213,225,0.24)] hover:bg-slate-100"><ClipboardList className="mr-1 h-3.5 w-3.5" />Nota de evolución</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setCareDocumentOpen(true)} className="border-amber-300 bg-amber-50 font-bold text-amber-900 shadow-[0_0_0_3px_rgba(252,211,77,0.22)] hover:bg-amber-100"><HeartHandshake className="mr-1 h-3.5 w-3.5" />Adecuación / límites</Button>
              <Button type="button" size="sm" variant="outline" onClick={openStudiesChecked} className="border-cyan-300 bg-cyan-50 text-cyan-800 shadow-[0_0_0_3px_rgba(103,232,249,0.18)] hover:bg-cyan-100"><Image className="mr-1 h-3.5 w-3.5" />Estudios</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setScalesOpen(true)} className="border-rose-300 bg-rose-50 text-rose-700 shadow-[0_0_0_3px_rgba(253,164,175,0.18)] hover:bg-rose-100"><Calculator className="mr-1 h-3.5 w-3.5" />Escalas</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setNutritionOpen(true)} className="border-lime-300 bg-lime-50 text-lime-800 shadow-[0_0_0_3px_rgba(190,242,100,0.2)] hover:bg-lime-100"><Apple className="mr-1 h-3.5 w-3.5" />Evaluación nutricional</Button>
              <Button type="button" size="sm" variant="outline" onClick={openLabChecked} className="border-blue-300 bg-blue-50 font-bold text-blue-800 shadow-[0_0_0_3px_rgba(147,197,253,0.2)] hover:bg-blue-100"><FlaskConical className="mr-1 h-3.5 w-3.5" />Laboratorio / curva</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => openAction('ProtocoloInsulina')} className="border-sky-300 bg-sky-50 font-bold text-sky-800 shadow-[0_0_0_3px_rgba(125,211,252,0.2)] hover:bg-sky-100"><Activity className="mr-1 h-3.5 w-3.5" />Protocolo insulínico</Button>
              <Button type="button" size="sm" variant="outline" onClick={openProaChecked} className="border-teal-400 bg-teal-50 font-bold text-teal-800 shadow-[0_0_0_3px_rgba(45,212,191,0.2)] hover:bg-teal-100"><ShieldCheck className="mr-1 h-3.5 w-3.5" />PROA</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setStatsOpen(true)} className="border-violet-300 bg-violet-50 text-violet-700 shadow-[0_0_0_3px_rgba(196,181,253,0.2)] hover:bg-violet-100"><Activity className="mr-1 h-3.5 w-3.5" />Datos / estadísticas</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => goToSection('hospital-documentos')} className="border-indigo-300 bg-indigo-50 text-indigo-700 shadow-[0_0_0_3px_rgba(165,180,252,0.2)] hover:bg-indigo-100"><FileText className="mr-1 h-3.5 w-3.5" />Documentos y solicitudes</Button>
              <Button type="button" size="sm" variant="outline" aria-pressed={draft.pacienteSocial} onClick={toggleSocialPatient} className={draft.pacienteSocial ? 'border-fuchsia-400 bg-fuchsia-100 font-bold text-fuchsia-800 shadow-[0_0_0_3px_rgba(232,121,249,0.2)] hover:bg-fuchsia-200' : 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100'}><span aria-hidden="true" className={`mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] ${draft.pacienteSocial ? 'border-fuchsia-700 bg-fuchsia-700 text-white' : 'border-fuchsia-400 bg-white'}`}>{draft.pacienteSocial ? '✓' : ''}</span><HeartHandshake className="mr-1 h-3.5 w-3.5" />Paciente social</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre completo" wide><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.nombre} readOnly /></Field>
              <Field label="RUT"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.rut} readOnly /></Field>
              <Field label="Dirección"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.direccion} readOnly /></Field>
              <Field label="Comuna"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.comuna} readOnly /></Field>
              <Field label="Fecha de ingreso"><input type="date" className={`${input} cursor-not-allowed bg-slate-50`} value={draft.fechaIngreso} readOnly /></Field>
              <div className="sm:col-span-2 rounded-xl border border-sky-200 bg-sky-50/60 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-black text-sky-950">Diagnósticos compartidos con PROA</p><Button type="button" size="sm" variant="outline" onClick={openDiagnosis} className="border-sky-300 bg-white text-sky-800">Editar</Button></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Diagnóstico principal"><input className={`${input} cursor-not-allowed bg-white/70`} value={draft.diagnosticoPrincipal} readOnly /></Field><Field label="Desglose / diagnósticos asociados"><textarea className={`${textarea} cursor-not-allowed bg-white/70`} value={draft.diagnostico} readOnly /></Field></div></div>
              <Field label="Antecedentes relevantes" wide><textarea className={`${textarea} cursor-not-allowed bg-slate-50`} value={draft.antecedentes} readOnly /></Field>
              <div className="sm:col-span-2 rounded-xl border border-teal-200 bg-teal-50/60 p-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-black text-teal-950">Información PROA</p><p className="text-xs text-teal-700">Antibioterapia, aislamiento, precauciones y cultivos se editan exclusivamente desde PROA.</p></div><Button type="button" size="sm" variant="outline" onClick={openProaChecked} className="border-teal-400 bg-white font-bold text-teal-800"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Editar en PROA</Button></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Antibioterapia" wide><textarea className={`${textarea} cursor-not-allowed bg-white/70 text-slate-600`} value={draft.antibioterapia} readOnly aria-readonly="true" placeholder="Sin antibioterapia registrada en PROA" /></Field><Field label="Aislamiento / precauciones"><input className={`${input} cursor-not-allowed bg-white/70 text-slate-600`} value={draft.aislamiento} readOnly aria-readonly="true" placeholder="Sin indicación registrada" /></Field><Field label="Patógeno / cultivos"><input className={`${input} cursor-not-allowed bg-white/70 text-slate-600`} value={draft.patogenoAislado} readOnly aria-readonly="true" placeholder="Sin aislamiento registrado" /></Field></div></div>
              <Field label="Observaciones"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.observaciones} readOnly /></Field>
              <div id="hospital-resumen" className="sm:col-span-2"><Field label="Resumen clínico actual" wide><textarea className={`${textarea} cursor-not-allowed bg-slate-50`} value={draft.resumenCaso} readOnly placeholder="Sin resumen clínico registrado" /></Field></div>
              <div className="sm:col-span-2 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-cyan-900">Última evolución</p><p className="mt-1 whitespace-pre-line text-sm text-slate-700">{draft.ultimaEvolucion || 'Sin evolución breve registrada'}</p></div><Button type="button" size="sm" variant="outline" onClick={openLatestEvolution} className="shrink-0 border-cyan-300 bg-white text-cyan-800">Editar</Button></div></div>
              <div id="hospital-planes" className="grid gap-3 sm:col-span-2 sm:grid-cols-2"><Field label="Planes pendientes"><textarea className={`${textarea} cursor-not-allowed bg-slate-50`} value={draft.planesPendientes} readOnly placeholder="Sin planes registrados" /></Field><Field label="Plan de alta"><textarea className={`${textarea} cursor-not-allowed bg-emerald-50/60`} value={draft.planAlta || ''} readOnly placeholder="Sin plan de alta registrado" /></Field></div>
              <div id="hospital-estudios" className="sm:col-span-2"><div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-700">Estudios, escalas y evaluación nutricional</p><p className="mt-1 whitespace-pre-line text-xs text-slate-600">{studyVisitSummary(draft) || 'Sin estudios ni evaluaciones registradas'}</p></div><Button type="button" size="sm" variant="outline" onClick={openStudiesChecked} className="shrink-0">Agregar / ver</Button></div></div></div>
              <Field label="Último laboratorio"><input className={`${input} cursor-not-allowed bg-slate-50`} value={draft.ultimoLaboratorio} readOnly placeholder="Sin laboratorio registrado" /></Field>
              <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3"><p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-900">Decisiones y adecuación del esfuerzo terapéutico</p><div className="grid grid-cols-3 gap-2"><Field label="LET"><input className={`${input} cursor-not-allowed bg-white/70`} value={draft.letIndicacion || 'No consignado'} readOnly /></Field><Field label="IOT"><input className={`${input} cursor-not-allowed bg-white/70`} value={draft.iotIndicacion || 'No consignado'} readOnly /></Field><Field label="RCP"><input className={`${input} cursor-not-allowed bg-white/70`} value={draft.rcpIndicacion || 'No consignado'} readOnly /></Field></div></div>
            </div>
            <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-black text-teal-950">Historial de actualizaciones</h3><p className="text-xs text-teal-700">Fotografías fechadas de la situación clínica guardada.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setHistoryOpen(open => !open)} className="border-teal-300 bg-white text-teal-800 hover:bg-teal-50">{historyOpen ? 'Ocultar histórico' : `Ver histórico (${(draft.historialActualizaciones || []).length})`}</Button></div>
              {historyOpen && <div className="mt-3">{(draft.historialActualizaciones || []).length > 0 ? <div className="space-y-2">{draft.historialActualizaciones.map((item, index) => <details key={`${item.guardadoEn || item.fecha}-${index}`} className="rounded-lg border border-teal-100 bg-white px-3 py-2" open={index === 0}><summary className="cursor-pointer text-xs font-bold text-teal-800">{item.fecha || 'Sin fecha'}{item.guardadoEn ? ` · ${new Date(item.guardadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : ''} — {item.resumenCaso || item.diagnostico || 'Actualización clínica'}</summary><div className="mt-2 grid gap-1 text-xs text-slate-700"><p><strong>Resumen:</strong> {item.resumenCaso || '—'}</p><p><strong>Planes:</strong> {item.planesPendientes || '—'}</p><p><strong>Plan de alta:</strong> {item.planAlta || '—'}</p><p><strong>Estudios:</strong> {item.estudiosComplementarios || '—'}</p><p><strong>ATB:</strong> {item.antibioterapia || 'No registrada'}</p><p><strong>Patógeno:</strong> {item.patogenoAislado || '—'}</p><p><strong>Último lab.:</strong> {item.ultimoLaboratorio || '—'}</p><p><strong>LET / IOT / RCP:</strong> {item.letIndicacion || 'NC'} / {item.iotIndicacion || 'NC'} / {item.rcpIndicacion || 'NC'}</p></div></details>)}</div> : <p className="rounded-lg border border-dashed border-teal-200 bg-white/70 px-3 py-4 text-center text-xs text-slate-500">Todavía no hay actualizaciones guardadas.</p>}</div>}
            </div>
            </>}
          </section>

          <section id="hospital-documentos" className="scroll-mt-24 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-teal-700" /><div><h3 className="font-black text-slate-900">Documentos y solicitudes</h3><p className="text-xs text-slate-500">La ficha se guarda y los datos compatibles se cargan automáticamente.</p></div></div>
            <div className="grid gap-2 sm:grid-cols-2">{ACTIONS.map(action => { const Icon = action.icon; return <button key={action.label} onClick={() => openAction(action.route, action.proa)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-teal-300 hover:shadow-sm"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${action.color}`}><Icon className="h-4 w-4" /></span><span className="text-sm font-semibold text-slate-800">{action.label}</span></button>; })}</div>
          </section>
        </div>}
      </aside>
    </main>
    {activeTab === 'estadistica' && <StatisticsDashboard statistics={statistics} />}
    <HospitalCareDocuments open={careDocumentOpen} patient={draft} bed={selectedBed} onClose={() => setCareDocumentOpen(false)} />
    <HospitalMedicalReports open={medicalReportsOpen} patient={draft} bed={selectedBed} reports={draft.informesMedicos || []} onSave={saveMedicalReport} onClose={() => setMedicalReportsOpen(false)} />
    {readmissionOpen && <div className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"><div className="w-full max-w-xl overflow-hidden rounded-2xl border border-orange-300 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-2xl"><div className="border-b border-orange-200 bg-orange-100/80 px-5 py-4"><h2 className="text-lg font-black text-orange-950">Verificación de reingreso</h2><p className="text-xs text-orange-800">Se registra una sola vez antes del primer uso clínico del paciente.</p></div><div className="space-y-4 p-5">{readmissionDraft.detected && <div className="rounded-xl border border-orange-300 bg-orange-100 p-3 text-sm font-semibold text-orange-950"><Activity className="mr-2 inline h-4 w-4" />Antecedente detectado automáticamente: egreso el {displayClinicalDate(readmissionDraft.previousDischargeDate)}, dentro de los 30 días previos al ingreso actual.</div>}<Field label="¿El paciente ha tenido un ingreso hospitalario en los últimos 30 días?"><select className={input} value={readmissionDraft.value} onChange={e => setReadmissionDraft(old => ({ ...old, value: e.target.value, detected: old.detected && e.target.value === 'Sí' }))}><option value="">Seleccionar…</option><option value="Sí">Sí</option><option value="No">No</option></select></Field>{readmissionDraft.value === 'Sí' && <Field label="Fecha de egreso anterior (si se conoce)"><input type="date" className={input} value={readmissionDraft.previousDischargeDate} onChange={e => setReadmissionDraft(old => ({ ...old, previousDischargeDate: e.target.value }))} /></Field>}<p className="text-xs text-slate-500">Si marcas “Sí”, la ficha mostrará una alerta de “Segundo ingreso en menos de 30 días”.</p></div><div className="flex justify-end gap-2 border-t border-orange-200 bg-white/80 px-5 py-4"><Button variant="outline" onClick={() => { pendingClinicalAction.current = null; setReadmissionOpen(false); }}>Cancelar</Button><Button onClick={confirmReadmission} disabled={!readmissionDraft.value} className="bg-orange-600 hover:bg-orange-700">Guardar y continuar</Button></div></div></div>}
    {dischargeOpen && <div className="fixed inset-0 z-[92] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-amber-50 shadow-2xl">
        <div className="border-b border-red-200 bg-red-100/80 px-5 py-4"><h2 className="text-lg font-black text-red-950">Egresar paciente — {draft.nombre || selectedBed?.cell}</h2><p className="text-xs text-red-700">La ficha se conservará como histórica y la cama quedará libre.</p></div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Fecha de egreso"><input type="date" className={input} value={dischargeDraft.fecha} onChange={e => setDischargeDraft(old => ({ ...old, fecha: e.target.value }))} /></Field><Field label="Causa de egreso"><select className={input} value={dischargeDraft.motivo} onChange={e => setDischargeDraft(old => ({ ...old, motivo: e.target.value }))}><option value="">Seleccionar causa…</option>{DISCHARGE_REASONS.map(reason => <option key={reason}>{reason}</option>)}</select></Field></div>
          {dischargeDraft.motivo === 'Traslado a otro servicio' && <div className="grid gap-3 sm:grid-cols-2"><Field label="Servicio de destino"><select className={input} value={dischargeDraft.destinoServicio} onChange={e => setDischargeDraft(old => ({ ...old, destinoServicio: e.target.value, destinoCama: '' }))}><option value="">Seleccionar servicio…</option>{PRINT_SERVICE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field><Field label="Cama de destino"><select className={input} value={dischargeDraft.destinoCama} disabled={!dischargeDraft.destinoServicio} onChange={e => setDischargeDraft(old => ({ ...old, destinoCama: e.target.value }))}><option value="">{dischargeDraft.destinoServicio ? 'Seleccionar cama…' : 'Primero selecciona el servicio'}</option>{destinationBeds.map(bed => <option key={bed.code} value={bed.code} disabled={bed.occupied}>{bed.salaLabel} · Cama {bed.cell}{bed.occupied ? ' · Ocupada' : ' · Disponible'}</option>)}</select></Field></div>}
          {(draft.antibioticos || []).some(item => item?.nombre) ? <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4"><h3 className="font-black text-amber-950">Conducta con antibioterapia registrada</h3><p className="mb-3 text-xs text-amber-700">Selecciona la conducta y registra directamente la fecha de cese.</p><div className="space-y-2">{(draft.antibioticos || []).map((item, index) => {
            if (!item?.nombre) return null;
            const action = dischargeDraft.antibioticActions[index] || 'suspender';
            const stopDate = dischargeDraft.antibioticStopDates[index] || '';
            const days = stopDate ? treatmentDays(item.inicio, stopDate) : null;
            return <div key={`${item.nombre}-${index}`} className="rounded-lg border border-amber-100 bg-white p-3"><div className="grid items-end gap-2 sm:grid-cols-[1fr_205px_170px]"><div><p className="text-sm font-bold text-slate-900">{item.nombre}{days ? ` (${days} días)` : ''}</p><p className="text-xs text-slate-500">{[item.dosis || [item.dosis_cantidad, item.dosis_unidad].filter(Boolean).join(' '), item.intervalo_horas && `c/${item.intervalo_horas} h`, item.via, item.inicio && `desde ${item.inicio}`].filter(Boolean).join(' · ')}</p></div><Field label="Conducta"><select className={input} value={action} onChange={e => setDischargeDraft(old => ({ ...old, antibioticActions: { ...old.antibioticActions, [index]: e.target.value }, antibioticStopDates: e.target.value === 'continuar' ? old.antibioticStopDates : { ...old.antibioticStopDates, [index]: old.antibioticStopDates[index] || old.fecha } }))}><option value="suspender">Suspender al egreso</option><option value="continuar">Continuar al alta</option><option value="suspendido">Ya estaba suspendido</option></select></Field>{action !== 'continuar' && <Field label="Fecha de cese"><input type="date" min={item.inicio || undefined} className={input} value={stopDate} onChange={e => setDischargeDraft(old => ({ ...old, antibioticStopDates: { ...old.antibioticStopDates, [index]: e.target.value } }))} /></Field>}</div></div>;
          })}</div>{Object.values(dischargeDraft.antibioticActions).includes('continuar') && <div className="mt-3"><Field label="Indicación antimicrobiana al alta"><textarea className={textarea} value={dischargeDraft.antibioticoAltaIndicacion} onChange={e => setDischargeDraft(old => ({ ...old, antibioticoAltaIndicacion: e.target.value }))} placeholder="Duración restante, controles y otras indicaciones" /></Field></div>}</section> : <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Sin antibioterapia registrada.</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-red-200 bg-white/80 px-5 py-4"><Button variant="outline" onClick={() => setDischargeOpen(false)} disabled={discharging}>Cancelar</Button><Button onClick={confirmDischarge} disabled={discharging || !dischargeDraft.fecha || !dischargeDraft.motivo || (dischargeDraft.motivo === 'Traslado a otro servicio' && (!dischargeDraft.destinoServicio || !dischargeDraft.destinoCama))} className="bg-red-700 hover:bg-red-800"><LogOut className="mr-1 h-4 w-4" />{discharging ? 'Egresando…' : 'Confirmar egreso'}</Button></div>
      </div>
    </div>}
    {diagnosisOpen && <div className="fixed inset-0 z-[88] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-5 shadow-2xl"><h2 className="text-lg font-black text-sky-950">Diagnósticos compartidos</h2><p className="mb-4 text-xs text-sky-700">El diagnóstico principal y su desglose se sincronizan con PROA.</p><div className="space-y-3"><Field label="Diagnóstico principal"><input className={input} value={diagnosisDraft.principal} onChange={e => setDiagnosisDraft(old => ({ ...old, principal: e.target.value }))} /></Field><Field label="Desglose / diagnósticos asociados"><textarea className={textarea} value={diagnosisDraft.desglose} onChange={e => setDiagnosisDraft(old => ({ ...old, desglose: e.target.value }))} placeholder="Uno por línea" /></Field></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setDiagnosisOpen(false)}>Cancelar</Button><Button onClick={saveDiagnosis} className="bg-sky-700 hover:bg-sky-800">Guardar y sincronizar</Button></div></div></div>}
    {scalesOpen && <div className="fixed inset-0 z-[88] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"><div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 shadow-2xl"><div className="flex items-start justify-between gap-3 border-b border-rose-200 bg-rose-100/80 px-5 py-4"><div><h2 className="text-lg font-black text-rose-950">Escalas, calculadoras y scores — Cama {selectedBed?.cell}</h2><p className="text-xs text-rose-700">Aplica la calculadora aquí mismo y guarda el resultado fechado para este paciente.</p></div><Button variant="outline" size="sm" onClick={() => setScalesOpen(false)}>Cerrar</Button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-[180px_1fr]"><Field label="Fecha"><input type="date" className={input} value={scaleDraft.fecha} onChange={e => setScaleDraft(old => ({ ...old, fecha: e.target.value }))} /></Field><Field label="Escala / calculadora"><select className={input} value={scaleDraft.calculatorId} onChange={e => { const calculator = allCalculators.find(item => item.id === e.target.value); setScaleDraft(old => ({ ...old, calculatorId: e.target.value, nombre: calculator?.name || '', puntaje: '', resultado: '' })); }}><option value="">Seleccionar…</option>{calculatorReferences.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div>{SelectedCalculatorComponent ? <div className="mt-4 overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm"><SelectedCalculatorComponent key={scaleDraft.calculatorId} /></div> : <div className="mt-4 rounded-xl border border-dashed border-rose-300 bg-white/70 p-8 text-center text-sm text-rose-700"><Calculator className="mx-auto mb-2 h-7 w-7" />Selecciona una calculadora para aplicarla sin salir de la ficha.</div>}<div className="mt-4 rounded-xl border border-rose-200 bg-white/85 p-4"><p className="mb-3 text-sm font-black text-rose-950">Registrar resultado en la ficha</p><div className="grid gap-3 sm:grid-cols-2"><Field label="Puntaje / resultado"><input className={input} value={scaleDraft.puntaje} onChange={e => setScaleDraft(old => ({ ...old, puntaje: e.target.value }))} placeholder="Copia aquí el resultado calculado" /></Field><Field label="Interpretación"><input className={input} value={scaleDraft.resultado} onChange={e => setScaleDraft(old => ({ ...old, resultado: e.target.value }))} placeholder="Riesgo o interpretación clínica" /></Field></div></div>{(draft.escalas || []).length > 0 && <div className="mt-4 border-t border-rose-200 pt-3"><p className="mb-2 text-xs font-bold text-rose-900">Resultados previos</p>{draft.escalas.slice(0, 5).map((item, index) => <p key={index} className="text-xs text-slate-700">{item.fecha} · {item.nombre}: {item.puntaje} pts {item.resultado && `· ${item.resultado}`}</p>)}</div>}</div><div className="flex justify-end gap-2 border-t border-rose-200 bg-white/80 px-5 py-4"><Button variant="outline" onClick={() => setScalesOpen(false)}>Cancelar</Button><Button onClick={saveScale} disabled={!scaleDraft.nombre || !scaleDraft.puntaje} className="bg-rose-700 hover:bg-rose-800">Guardar resultado</Button></div></div></div>}
    {nutritionOpen && <div className="fixed inset-0 z-[88] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-lime-200 bg-gradient-to-br from-lime-50 via-white to-green-50 p-5 shadow-2xl"><h2 className="text-lg font-black text-lime-950">Evaluación nutricional</h2><p className="mb-4 text-xs text-lime-800">Tamizaje NRS-2002: 0–2 puntos sin riesgo; ≥3 puntos con riesgo nutricional.</p><div className="grid gap-3 sm:grid-cols-2"><Field label="Fecha"><input type="date" className={input} value={nutritionDraft.fecha} onChange={e => setNutritionDraft(old => ({ ...old, fecha: e.target.value }))} /></Field><Field label="Score / tamizaje aplicado"><select className={input} value={nutritionDraft.tamizaje} onChange={e => setNutritionDraft(old => ({ ...old, tamizaje: e.target.value }))}><option value="">Seleccionar…</option><option value="Sí">Sí</option><option value="No">No</option><option value="No aplica">No aplica</option></select></Field><Field label="Resultado (puntos)"><input type="number" min="0" className={input} value={nutritionDraft.puntaje} disabled={nutritionDraft.tamizaje !== 'Sí'} onChange={e => setNutritionDraft(old => ({ ...old, puntaje: e.target.value }))} /></Field><Field label="Riesgo automático"><input className={`${input} bg-white/70`} value={nutritionDraft.tamizaje === 'Sí' ? nutritionRisk(nutritionDraft.puntaje) : nutritionDraft.tamizaje} readOnly /></Field><Field label="Evaluación nutricional realizada" wide><select className={input} value={nutritionDraft.evaluacion} onChange={e => setNutritionDraft(old => ({ ...old, evaluacion: e.target.value }))}><option value="">Seleccionar…</option><option value="Sí">Sí</option><option value="No">No</option><option value="No aplica">No aplica</option></select></Field></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setNutritionOpen(false)}>Cancelar</Button><Button onClick={saveNutrition} className="bg-lime-700 hover:bg-lime-800">Guardar evaluación</Button></div></div></div>}
    {evolutionOpen && <div className="fixed inset-0 z-[87] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-5 shadow-2xl"><div className="mb-4 rounded-xl bg-cyan-100/80 p-3"><h2 className="text-lg font-black text-cyan-950">Última evolución — Cama {selectedBed?.cell}</h2><p className="text-xs text-cyan-700">Solo esta síntesis breve aparecerá en la columna “Última evolución” de la tabla de visita.</p></div><Field label="Síntesis de la última evolución"><textarea className={textarea} value={evolutionDraft} onChange={e => setEvolutionDraft(e.target.value)} placeholder="Ej.: Afebril, hemodinámicamente estable, con menor requerimiento de oxígeno." /></Field><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setEvolutionOpen(false)}>Cancelar</Button><Button onClick={saveLatestEvolution} className="bg-cyan-700 hover:bg-cyan-800">Guardar evolución breve</Button></div></div></div>}
    {generalOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 shadow-2xl"><div className="border-b border-teal-200 bg-teal-100/80 px-5 py-4"><h2 className="text-lg font-black text-teal-950">Actualización clínica — Cama {selectedBed?.cell}</h2><p className="text-xs text-teal-700">El resumen clínico y la última evolución se muestran en columnas distintas de la tabla.</p></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre completo" wide><input className={input} value={generalDraft.nombre} onChange={e => updateGeneral('nombre', e.target.value)} /></Field><Field label="RUT"><input className={input} value={generalDraft.rut} onChange={e => updateGeneral('rut', formatRut(e.target.value))} placeholder="12.345.678-9" /></Field><Field label="Dirección"><input className={input} value={generalDraft.direccion} onChange={e => updateGeneral('direccion', e.target.value)} /></Field><Field label="Comuna"><input className={input} value={generalDraft.comuna} onChange={e => updateGeneral('comuna', e.target.value)} /></Field><Field label="Fecha de ingreso"><input type="date" className={input} value={generalDraft.fechaIngreso} onChange={e => updateGeneral('fechaIngreso', e.target.value)} /></Field><Field label="Diagnósticos y antecedentes relevantes" wide><textarea className={`${textarea} min-h-44`} value={diagnosisAndHistoryDraft} onChange={e => setDiagnosisAndHistoryDraft(e.target.value)} placeholder={'DIAGNÓSTICO(S):\n\nANTECEDENTES RELEVANTES:'} /></Field><Field label="Resumen clínico actual · columna Resumen clínico" wide><textarea className={textarea} value={generalDraft.resumenCaso} onChange={e => updateGeneral('resumenCaso', e.target.value)} placeholder="Síntesis general vigente del cuadro clínico" /></Field><Field label="Última evolución · columna Última evolución" wide><textarea className={textarea} value={generalDraft.ultimaEvolucion || ''} onChange={e => updateGeneral('ultimaEvolucion', e.target.value)} placeholder="Cambios y estado observados en la evaluación más reciente" /></Field><Field label="Observaciones" wide><input className={input} value={generalDraft.observaciones} onChange={e => updateGeneral('observaciones', e.target.value)} /></Field><div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-900">Decisiones terapéuticas</p><div className="grid grid-cols-3 gap-2">{[['letIndicacion','LET'],['iotIndicacion','IOT'],['rcpIndicacion','RCP']].map(([key, label]) => <Field key={key} label={label}><select className={input} value={generalDraft[key]} onChange={e => updateGeneral(key, e.target.value)}><option value="">No consignado</option><option value="Sí">Sí</option><option value="No">No</option></select></Field>)}</div></div><Field label="Planes pendientes · columna Planes / alta" wide><textarea className={textarea} value={generalDraft.planesPendientes} onChange={e => updateGeneral('planesPendientes', e.target.value)} placeholder="Conductas o decisiones por completar" /></Field><Field label="Plan de alta · columna Planes / alta" wide><textarea className={`${textarea} border-emerald-200 bg-emerald-50/50`} value={generalDraft.planAlta || ''} onChange={e => updateGeneral('planAlta', e.target.value)} placeholder="Ej.: alta probable en 24–48 h, completar tratamiento, control en APS y signos de alarma" /></Field></div></div><div className="flex justify-end gap-2 border-t border-teal-200 bg-white/80 px-5 py-4"><Button variant="outline" onClick={() => setGeneralOpen(false)}>Cancelar</Button><Button onClick={saveGeneral} className="bg-teal-700 hover:bg-teal-800"><Save className="mr-1 h-4 w-4" />Guardar actualización clínica</Button></div></div></div>}
    {proaOpen && <ProaQuickModal bed={selectedBed} hasRecord={Boolean(draft.proaRecordId)} value={proaQuick} setValue={setProaQuick} saving={proaSaving} onClose={() => setProaOpen(false)} onFull={openFullProa} onSave={saveProaQuick} />}
    {studiesOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-5 shadow-2xl"><div className="mb-4 rounded-xl bg-teal-100/80 p-3"><h2 className="text-lg font-black text-teal-950">Estudios complementarios — Cama {selectedBed?.cell}</h2><p className="text-xs text-teal-700">Registra varias fechas y clasifica cada estudio para mantener un resumen clínico breve.</p></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">{studiesRows.map((row, index) => <div key={index} className="rounded-xl border border-teal-100 bg-white/80 p-3"><div className="mb-2 flex items-center justify-between"><strong className="text-xs text-slate-700">Estudio {index + 1}</strong>{studiesRows.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setStudiesRows(rows => rows.filter((_, rowIndex) => rowIndex !== index))} className="text-red-600">Quitar</Button>}</div><div className="grid gap-3 sm:grid-cols-[150px_190px_1fr_150px]"><Field label="Fecha"><input type="date" className={input} value={row.fecha} onChange={e => setStudiesRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, fecha: e.target.value } : item))} /></Field><Field label="Tipo"><select className={input} value={row.tipo} onChange={e => setStudiesRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, tipo: e.target.value } : item))}><option>Imagenología</option><option>Estudio funcional</option><option>Anatomía patológica</option><option>Otro</option></select></Field><Field label="Estudio / resultado"><input className={input} value={row.estudio} onChange={e => setStudiesRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, estudio: e.target.value } : item))} placeholder="Ej.: TAC tórax solicitado" /></Field><Field label="Estado"><select className={input} value={row.estado} onChange={e => setStudiesRows(rows => rows.map((item, rowIndex) => rowIndex === index ? { ...item, estado: e.target.value } : item))}><option>Pendiente</option><option>Solicitado</option><option>Informado</option><option>Suspendido</option></select></Field></div></div>)}<Button type="button" variant="outline" onClick={() => setStudiesRows(rows => [...rows, { fecha: '', tipo: 'Imagenología', estudio: '', estado: 'Pendiente' }])} className="w-full border-dashed border-teal-300 bg-white/70 text-teal-700"><Plus className="mr-1 h-4 w-4" />Agregar otro estudio / fecha</Button></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setStudiesOpen(false)}>Cancelar</Button><Button onClick={saveStudies} disabled={!studiesRows.some(row => row.estudio || row.fecha)} className="bg-teal-700 hover:bg-teal-800">Guardar estudios</Button></div></div></div>}
    {statsOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-4"><h2 className="text-lg font-black text-slate-900">Datos del paciente</h2><p className="text-xs text-slate-500">Identificación y variables estadísticas que no se muestran permanentemente en la ficha.</p></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre completo" wide><input className={input} value={draft.nombre} onChange={e => update('nombre', e.target.value)} /></Field><Field label="RUT"><input className={input} value={draft.rut} onChange={e => update('rut', formatRut(e.target.value))} placeholder="12.345.678-9" /></Field><Field label="Fecha de nacimiento"><input type="date" className={input} value={draft.fechaNacimiento} onChange={e => update('fechaNacimiento', e.target.value)} /></Field><Field label="Edad"><input type="number" min="0" max="130" className={input} value={draft.edad} onChange={e => update('edad', e.target.value)} /></Field><Field label="Sexo clínico"><select className={input} value={draft.sexo} onChange={e => update('sexo', e.target.value)}><option value="">No consignado</option><option value="F">Femenino</option><option value="M">Masculino</option><option value="Otro">Otro</option></select></Field><Field label="Previsión"><input className={input} value={draft.prevision} onChange={e => update('prevision', e.target.value)} placeholder="Fonasa A, B, C, D…" /></Field></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setStatsOpen(false)}>Cancelar</Button><Button onClick={saveStats} className="bg-violet-700 hover:bg-violet-800">Guardar datos</Button></div></div></div>}
    {labOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div><h2 className="text-lg font-black text-slate-900">Laboratorio — Cama {selectedBed?.cell}</h2><p className="text-xs text-slate-500">Registro y seguimiento longitudinal en una sola ventana.</p></div>
          <div className="flex items-center gap-3"><div className="flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setLabWorkspaceTab('registro')} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${labWorkspaceTab === 'registro' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-500'}`}><FlaskConical className="mr-1 inline h-4 w-4" />Registrar exámenes</button><button type="button" onClick={openLabCurve} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${labWorkspaceTab === 'curva' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500'}`}><Activity className="mr-1 inline h-4 w-4" />Curva de exámenes</button></div><Button variant="outline" size="sm" onClick={() => setLabOpen(false)}>Cerrar</Button></div>
        </div>
        {labWorkspaceTab === 'curva' ? <HospitalLabCurvePreview embedded open rows={labCurveRows} patient={draft} bed={selectedBed} loading={labCurveLoading} onClose={() => setLabOpen(false)} /> : <>
          <HospitalLabEntry rows={labRows} setRows={setLabRows} cultures={labCultures} setCultures={setLabCultures} pasteText={labPasteText} setPasteText={setLabPasteText} parseMessage={labParseMessage} setParseMessage={setLabParseMessage} onParse={parsePastedLabs} />
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3"><p className="text-xs text-slate-500">{draft.proaRecordId ? 'Guardado hospitalario + sincronización PROA' : 'Guardado en ficha hospitalaria'}</p><Button onClick={saveLab} disabled={labSaving || (!labRows.some(row => Object.entries(row).some(([key, value]) => key !== 'fecha' && value)) && !labCultures.some(item => item.fecha || item.tipo_muestra || item.patogeno) && !(draft.laboratorios?.length || draft.cultivos?.length))} className="bg-blue-700 hover:bg-blue-800">{labSaving ? 'Guardando…' : 'Guardar cambios de laboratorio'}</Button></div>
        </>}
      </div>
    </div>}
    {printPreview && <div className="hospital-preview-overlay" role="dialog" aria-modal="true" aria-label="Vista previa de tabla de visita">
      <div className="hospital-preview-dialog">
        <div className="hospital-preview-toolbar"><div><h2>Vista previa — Tabla de visita</h2><p>A4 horizontal · selecciona uno o varios servicios</p></div><div className="flex flex-wrap items-center gap-2">{PRINT_SERVICE_OPTIONS.map(option => <label key={option.value} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${printServices.includes(option.value) ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-500'}`}><input type="checkbox" checked={printServices.includes(option.value)} onChange={() => togglePrintService(option.value)} className="h-3.5 w-3.5 accent-teal-700" />{option.label}</label>)}<Button variant="outline" onClick={() => setPrintPreview(false)}>Cerrar</Button><Button onClick={() => window.print()} disabled={!printServices.length || !printRows.length} className="gap-2 bg-teal-700 hover:bg-teal-800"><Printer className="h-4 w-4" />Imprimir</Button></div></div>
        <div className="hospital-preview-canvas"><div className="hospital-preview-page"><VisitTable rows={printRows} service={printServiceLabel} /></div></div>
      </div>
    </div>}
    <section className="hospital-print-sheet">
      <VisitTable rows={printRows} service={printServiceLabel} />
    </section>
    <style>{`
      .hospital-print-sheet{display:none}
      .hospital-preview-overlay{position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.72);padding:18px;backdrop-filter:blur(4px)}
      .hospital-preview-dialog{display:flex;height:100%;flex-direction:column;overflow:hidden;border-radius:16px;background:#fff;box-shadow:0 24px 80px rgba(15,23,42,.35)}
      .hospital-preview-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e2e8f0;padding:14px 18px}.hospital-preview-toolbar h2{font-size:16px;font-weight:800;color:#0f172a}.hospital-preview-toolbar p{font-size:11px;color:#64748b}
      .hospital-preview-canvas{flex:1;overflow:auto;background:#cbd5e1;padding:22px}.hospital-preview-page{box-sizing:border-box;width:1120px;min-height:792px;margin:0 auto;background:#fff;padding:28px;box-shadow:0 5px 24px rgba(15,23,42,.25);color:#000;font-family:Arial,sans-serif}
      .hospital-preview-page .hospital-print-header{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:6px;margin-bottom:10px}.hospital-preview-page .hospital-print-header h1{font-size:18px;font-weight:800}.hospital-preview-page .hospital-print-header p{font-size:10px;margin-top:2px}.hospital-preview-page table{width:100%;height:auto!important;border-collapse:collapse;table-layout:fixed;font-size:9px;line-height:1.2}.hospital-preview-page thead,.hospital-preview-page thead tr,.hospital-preview-page th{height:auto!important;min-height:0!important}.hospital-preview-page th,.hospital-preview-page td{border:1px solid #64748b;padding:4px;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}.hospital-preview-page th{background:#e2e8f0;font-size:7.5px;line-height:1.1;text-transform:uppercase;text-align:left}.hospital-preview-page th:nth-child(1){width:10%}.hospital-preview-page th:nth-child(2){width:11%}.hospital-preview-page th:nth-child(3){width:15%}.hospital-preview-page th:nth-child(4){width:15%}.hospital-preview-page th:nth-child(5){width:8%}.hospital-preview-page th:nth-child(6){width:12%}.hospital-preview-page th:nth-child(7){width:7%}.hospital-preview-page th:nth-child(8){width:6%}.hospital-preview-page th:nth-child(9){width:16%}
      @media print{
        @page{size:A4 landscape;margin:7mm}
        html,body,#root{background:#fff!important}
        body *{visibility:hidden!important}
        .hospital-print-sheet,.hospital-print-sheet *{visibility:visible!important}
        .hospital-print-sheet{display:block!important;position:absolute;inset:0;width:100%;color:#000;font-family:Arial,sans-serif}
        .hospital-print-header{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:4px;margin-bottom:7px}
        .hospital-print-header h1{font-size:14px;font-weight:800;margin:0}.hospital-print-header p{font-size:8px;margin:2px 0 0}
        .hospital-print-sheet table{width:100%;height:auto!important;border-collapse:collapse;table-layout:fixed;font-size:7px;line-height:1.18}
        .hospital-print-sheet thead,.hospital-print-sheet thead tr,.hospital-print-sheet th{height:auto!important;min-height:0!important}
        .hospital-print-sheet th,.hospital-print-sheet td{border:1px solid #64748b;padding:3px;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}
        .hospital-print-sheet th{background:#e2e8f0;font-size:6.5px;line-height:1.05;text-transform:uppercase;text-align:left}
        .hospital-print-sheet th:nth-child(1){width:10%}.hospital-print-sheet th:nth-child(2){width:11%}.hospital-print-sheet th:nth-child(3){width:15%}.hospital-print-sheet th:nth-child(4){width:15%}.hospital-print-sheet th:nth-child(5){width:8%}.hospital-print-sheet th:nth-child(6){width:12%}.hospital-print-sheet th:nth-child(7){width:7%}.hospital-print-sheet th:nth-child(8){width:6%}.hospital-print-sheet th:nth-child(9){width:16%}
        .hospital-print-sheet tr{break-inside:avoid}
      }
    `}</style>
  </div>;
}

export default conPuertaAcceso(VistaHospitalizados, {
  storageKey: 'acceso_vista_hospitalizados',
  titulo: 'Acceso restringido',
  descripcion: 'Ingresa tu código para acceder a la información reservada.',
});
