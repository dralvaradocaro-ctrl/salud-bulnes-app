import React, { useMemo, useState } from 'react';
import { Bed, CalendarPlus, FlaskConical, LineChart as LineChartIcon, LogOut, Save, Trash2 } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ALL_BEDS } from '@/components/agenda-diaria/bedCatalog';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const STORAGE_KEY = 'hospital_lab_tracker_v1';
const nowLocal = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
};
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const makeCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(5);
  globalThis.crypto?.getRandomValues?.(bytes);
  return `HOS-${[...bytes].map((byte, index) => alphabet[byte % alphabet.length] || alphabet[(Date.now() + index) % alphabet.length]).join('')}`;
};
const loadState = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const storedEpisodes = Array.isArray(value.episodes) ? value.episodes : [];
    // La primera versión creaba un episodio con solo tocar una cama. Se eliminan
    // exclusivamente esos registros vacíos no confirmados; si tienen exámenes,
    // movimientos posteriores o confirmación explícita se conservan.
    const episodes = storedEpisodes.filter((episode) => (
      episode.admissionConfirmed === true
      || (episode.results || []).length > 0
      || (episode.movements || []).length > 1
    ));
    if (episodes.length !== storedEpisodes.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, episodes }));
    }
    return { episodes };
  } catch {
    return { episodes: [] };
  }
};

const EXAMS = [
  { key: 'hb', name: 'Hemoglobina', category: 'Hemograma', unit: 'g/dL', aliases: ['HEMOGLOBINA', 'HB', 'HGB'] },
  { key: 'hto', name: 'Hematocrito', category: 'Hemograma', unit: '%', aliases: ['HEMATOCRITO', 'HTO', 'HCT'] },
  { key: 'rbc', name: 'Recuento de eritrocitos', category: 'Hemograma', unit: 'x10^6/µL', aliases: ['RCTO. DE ERITROCITOS', 'RCTO DE ERITROCITOS', 'ERITROCITOS', 'RBC'] },
  { key: 'vcm', name: 'VCM', category: 'Hemograma', unit: 'fL', aliases: ['VCM', 'MCV'] },
  { key: 'hcm', name: 'HCM', category: 'Hemograma', unit: 'pg', aliases: ['HCM', 'MCH'] },
  { key: 'chcm', name: 'CHCM', category: 'Hemograma', unit: 'g/dL', aliases: ['CHCM', 'MCHC'] },
  { key: 'leu', name: 'Leucocitos', category: 'Hemograma', unit: '/µL', aliases: ['RCTO. DE LEUCOCITOS', 'RCTO DE LEUCOCITOS', 'LEUCOCITOS', 'LEU', 'GB', 'WBC'] },
  { key: 'plaq', name: 'Plaquetas', category: 'Hemograma', unit: '/µL', aliases: ['RCTO. DE PLAQUETAS', 'RCTO DE PLAQUETAS', 'PLAQUETAS', 'PLAQ', 'PLQ', 'PLT'] },
  { key: 'vhs', name: 'VHS', category: 'Inflamatorios', unit: 'mm/h', aliases: ['VHS', 'VELOCIDAD DE ERITROSEDIMENTACION'] },
  { key: 'pcr', name: 'Proteína C reactiva', category: 'Inflamatorios', unit: 'mg/L', aliases: ['PROTEINA C REACTIVA', 'PCR', 'CRP'] },
  { key: 'crea', name: 'Creatinina', category: 'Función renal', unit: 'mg/dL', aliases: ['CREATININA EN SANGRE', 'CREATININA', 'CREA', 'CREAT', 'CR'] },
  { key: 'urea', name: 'Uremia', category: 'Función renal', unit: 'mg/dL', aliases: ['UREMIA', 'UREA'] },
  { key: 'bun', name: 'Nitrógeno ureico (BUN)', category: 'Función renal', unit: 'mg/dL', aliases: ['NITROGENO UREICO', 'BUN', 'NU'] },
  { key: 'na', name: 'Sodio', category: 'Electrolitos', unit: 'mEq/L', aliases: ['SODIO', 'NA'] },
  { key: 'k', name: 'Potasio', category: 'Electrolitos', unit: 'mEq/L', aliases: ['POTASIO', 'K'] },
  { key: 'cl', name: 'Cloro', category: 'Electrolitos', unit: 'mEq/L', aliases: ['CLORO', 'CL'] },
  { key: 'calcio', name: 'Calcio', category: 'Electrolitos', unit: 'mg/dL', aliases: ['CALCIO EN SANGRE', 'CALCIO', 'CA'] },
  { key: 'fosforo', name: 'Fósforo', category: 'Electrolitos', unit: 'mg/dL', aliases: ['FOSFORO EN SANGRE', 'FOSFORO', 'P'] },
  { key: 'hco3', name: 'Bicarbonato', category: 'Gases y ácido-base', unit: 'mEq/L', aliases: ['HCO3', 'BIC'] },
  { key: 'ph', name: 'pH', category: 'Gases y ácido-base', unit: '', aliases: ['PH'] },
  { key: 'pco2', name: 'pCO₂', category: 'Gases y ácido-base', unit: 'mmHg', aliases: ['P CO2', 'PCO2'] },
  { key: 'po2', name: 'pO₂', category: 'Gases y ácido-base', unit: 'mmHg', aliases: ['P O2', 'PO2'] },
  { key: 'be', name: 'Exceso de base', category: 'Gases y ácido-base', unit: 'mEq/L', aliases: ['BE'] },
  { key: 'tco2', name: 'CO₂ total', category: 'Gases y ácido-base', unit: 'mEq/L', aliases: ['T CO2', 'TCO2'] },
  { key: 'sato2', name: 'Saturación O₂', category: 'Gases y ácido-base', unit: '%', aliases: ['SATURACION DE O2', 'SATO2'] },
  { key: 'lactato', name: 'Lactato', category: 'Gases y ácido-base', unit: 'mmol/L', aliases: ['LACTATO', 'LAC'] },
  { key: 'alb', name: 'Albúmina', category: 'Perfil hepático', unit: 'g/dL', aliases: ['ALB', 'ALBUMINA'] },
  { key: 'bt', name: 'Bilirrubina total', category: 'Perfil hepático', unit: 'mg/dL', aliases: ['BT'] },
  { key: 'bd', name: 'Bilirrubina directa', category: 'Perfil hepático', unit: 'mg/dL', aliases: ['BD'] },
  { key: 'ast', name: 'AST/GOT', category: 'Perfil hepático', unit: 'U/L', aliases: ['AST', 'GOT'] },
  { key: 'alt', name: 'ALT/GPT', category: 'Perfil hepático', unit: 'U/L', aliases: ['ALT', 'GPT'] },
  { key: 'inr', name: 'INR', category: 'Coagulación', unit: '', aliases: ['INR'] },
];

const normalizeReportText = (text) => String(text || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase()
  .replace(/,/g, '.');

const stripDirectIdentifiers = (text) => String(text || '')
  .replace(/NOMBRE\s*:.*?(?=LIQUIDO ASCITICO)/gis, (header) => {
    const collected = header.match(/TOMA\s*MUESTRA\s*(\d{2}[-/]\d{2}[-/]\d{4}\s+\d{2}:\d{2}(?::\d{2})?)/i)?.[1]
      || header.match(/\d{2}[-/]\d{2}[-/]\d{4}\s+\d{2}:\d{2}(?::\d{2})?/)?.[0];
    return `${collected ? ` TOMA ${collected} ` : ' '} LIQUIDO ASCITICO `;
  })
  .replace(/PACIENTE\s*:.*?(?=AREA\s*:|ÁREA\s*:)/gis, (header) => {
    const collected = header.match(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/)?.[0];
    return collected ? ` TOMA ${collected} ` : ' ';
  })
  .replace(/ESTE EXAMEN NO CONSTITUYE DIAGNOSTICO.*?(?=PACIENTE\s*:|$)/gis, '')
  .trim();

const detectCollectedAt = (text, fallback) => {
  const match = String(text || '').match(/(\d{2})[-/](\d{2})[-/](\d{4})\s+(\d{2}):(\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}` : `${fallback.date}T${fallback.time || '00:00'}`;
};

const detectCollectedAtNear = (text, index, fallback) => {
  const dates = [...String(text || '').matchAll(/(\d{2})[-/](\d{2})[-/](\d{4})\s+(\d{2}):(\d{2})/g)];
  if (!dates.length) return `${fallback.date}T${fallback.time || '00:00'}`;
  const previous = dates.filter((match) => match.index <= index).at(-1);
  const next = dates.find((match) => match.index > index);
  const selected = previous || next;
  return `${selected[3]}-${selected[2]}-${selected[1]}T${selected[4]}:${selected[5]}`;
};

const parseBiologicalFluids = (normalized, safeSource, block, sourceHadIdentifiers) => {
  const start = normalized.indexOf('LIQUIDO ASCITICO');
  if (start < 0) return [];
  const section = normalized.slice(start);
  const collectedAt = detectCollectedAtNear(normalized, start, block);
  const results = [];
  const addText = (examKey, name, value) => results.push({ id: makeId(), examKey, name, category: 'Líquido ascítico', value: null, valueText: value, unit: '', originalUnit: '', collectedAt, originalText: safeSource, sourceHadIdentifiers, status: 'confirmed', confidence: 'alta' });
  const addNumber = (examKey, name, value, unit, extra = {}) => results.push({ id: makeId(), examKey, name, category: 'Líquido ascítico', value: Number(value), unit, originalUnit: unit, collectedAt, originalText: safeSource, sourceHadIdentifiers, status: 'confirmed', confidence: 'alta', ...extra });
  [
    ['ascitico_color_pre', 'Color antes de centrifugar', /COLOR ANTES DE CENTRIFUGAR\s+(.+?)(?=COLOR DESPUES|ASPECTO|PROTEINAS)/],
    ['ascitico_color_post', 'Color después de centrifugar', /COLOR DESPUES DE CENTRIFUGAR\s+(.+?)(?=ASPECTO|PROTEINAS)/],
    ['ascitico_aspecto_pre', 'Aspecto antes de centrifugar', /ASPECTO ANTES DE CENTRIFUGAR\s+(.+?)(?=ASPECTO DESPUES|PROTEINAS)/],
    ['ascitico_aspecto_post', 'Aspecto después de centrifugar', /ASPECTO DESPUES DE(?:\s+CENTRIFUGAR)?\s+(.+?)(?=PROTEINAS|ALBUMINA)/],
    ['ascitico_gram', 'Gram', /GRAM\s+(.+?)(?=PRESENCIA DE COAGULO|MUESTRA PRIMARIA|$)/],
    ['ascitico_coagulo', 'Presencia de coágulo', /PRESENCIA DE COAGULO\s+(.+?)(?=MUESTRA PRIMARIA|$)/],
  ].forEach(([key, name, regex]) => {
    const match = section.match(regex);
    if (match) addText(key, name, match[1].trim());
  });
  [
    ['ascitico_proteinas', 'Proteínas', /PROTEINAS\s+(?:MENOR QUE\s+)?(\d+(?:\.\d+)?)\s+G\/DL/, 'g/dL'],
    ['ascitico_albumina', 'Albúmina', /ALBUMINA\s+(\d+(?:\.\d+)?)\s+G\/DL/, 'g/dL'],
    ['ascitico_glucosa', 'Glucosa', /GLUCOSA\s+(\d+(?:\.\d+)?)\s+MG\/DL/, 'mg/dL'],
    ['ascitico_leucocitos', 'Leucocitos', /LEUCOCITOS\s+(\d+(?:\.\d+)?)\s+X\s*MM3/, 'células/mm³'],
    ['ascitico_eritrocitos', 'Eritrocitos', /ERITROCITOS\s+(\d+(?:\.\d+)?)\s+X\s*MM3/, 'células/mm³'],
    ['ascitico_mononucleares', 'Mononucleares', /MONONUCLEARES\s+(\d+(?:\.\d+)?)\s*%/, '%'],
    ['ascitico_pmn_pct', 'Polimorfonucleares', /POLIMORFONUCLEARES\s+(\d+(?:\.\d+)?)\s*%/, '%'],
  ].forEach(([key, name, regex, unit]) => {
    const match = section.match(regex);
    if (match) addNumber(key, name, match[1], unit, key === 'ascitico_proteinas' && /MENOR QUE/.test(match[0]) ? { comparator: '<' } : {});
  });
  const leukocytes = results.find((item) => item.examKey === 'ascitico_leucocitos')?.value;
  const pmnPct = results.find((item) => item.examKey === 'ascitico_pmn_pct')?.value;
  if (Number.isFinite(leukocytes) && Number.isFinite(pmnPct)) {
    addNumber('ascitico_pmn_absoluto', 'PMN absolutos calculados', Number((leukocytes * pmnPct / 100).toFixed(1)), 'células/mm³', { formula: 'Leucocitos × % PMN / 100', derived: true });
  }
  return results;
};

const parseUrineAndMicrobiology = (normalized, safeSource, block, sourceHadIdentifiers) => {
  const results = [];
  const urineStart = normalized.indexOf('AREA: ORINAS');
  const microStart = normalized.indexOf('AREA: MICROBIOLOGIA');
  const urine = urineStart >= 0 ? normalized.slice(urineStart, microStart > urineStart ? microStart : undefined) : '';
  const urineAt = urineStart >= 0 ? detectCollectedAtNear(normalized, urineStart, block) : detectCollectedAt(safeSource, block);
  const add = (examKey, name, value, unit = '', status = 'confirmed') => results.push({
    id: makeId(), examKey, name, category: examKey.startsWith('urocultivo') ? 'Microbiología' : 'Orina',
    value: null, valueText: value, unit, originalUnit: unit, collectedAt: examKey.startsWith('urocultivo') && microStart >= 0 ? detectCollectedAtNear(normalized, microStart, block) : urineAt,
    originalText: safeSource, sourceHadIdentifiers, status, confidence: 'alta',
  });
  const qualitativeRules = [
    ['orina_color', 'Color', /(?:^|\s)COLOR\s+([A-Z]+)/],
    ['orina_aspecto', 'Aspecto', /(?:^|\s)ASPECTO\s+([A-Z]+)/],
    ['orina_glucosa', 'Glucosa en orina', /(?:^|\s)GLUCOSA\s+(NEGATIVO|POSITIVO|TRAZAS|\d+(?:\.\d+)?)/],
    ['orina_proteinas', 'Proteínas en orina', /(?:^|\s)PROTEINAS\s+(NEGATIVO|POSITIVO|TRAZAS|\d+(?:\.\d+)?)/],
    ['orina_bilirrubina', 'Bilirrubina en orina', /(?:^|\s)BILIRRUBINA\s+(NEGATIVO|POSITIVO|TRAZAS|\d+(?:\.\d+)?)/],
    ['orina_cetonas', 'Cetonas', /(?:^|\s)CETONA(?:S)?\s+(NEGATIVO|POSITIVO|TRAZAS|\d+(?:\.\d+)?)/],
    ['orina_nitritos', 'Nitritos', /(?:^|\s)NITRITOS\s+(NEGATIVO|POSITIVO)/],
    ['orina_sangre', 'Sangre en orina', /(?:^|\s)SANGRE\s+(NEGATIVO|POSITIVO|TRAZAS|\d+(?:\.\d+)?)/],
    ['orina_bacterias', 'Bacterias', /(?:^|\s)BACTERIAS\s+(NO SE OBSERVAN|ESCASA CANTIDAD|REGULAR CANTIDAD|ABUNDANTE CANTIDAD)/],
    ['orina_levaduras', 'Levaduras', /(?:^|\s)LEVADURAS\s+(NO SE OBSERVAN|ESCASAS|REGULAR|ABUNDANTES)/],
    ['orina_cristales', 'Cristales', /(?:^|\s)CRISTALES\s+(NO SE OBSERVAN|ESCASOS|REGULAR|ABUNDANTES)/],
  ];
  qualitativeRules.forEach(([key, name, regex]) => {
    const match = urine.match(regex);
    if (match) add(key, name, match[1]);
  });
  const numericUrineRules = [
    ['orina_densidad', 'Densidad urinaria', /(?:^|\s)DENSIDAD\s+(\d+(?:\.\d+)?)/, ''],
    ['orina_ph', 'pH urinario', /EXAMEN QUIMICO[\s\S]*?\bPH\s+(\d+(?:\.\d+)?)/, ''],
    ['orina_urobilinogeno', 'Urobilinógeno', /UROBILINOGENO\s+(\d+(?:\.\d+)?)/, 'mg/dL'],
  ];
  numericUrineRules.forEach(([key, name, regex, unit]) => {
    const match = urine.match(regex);
    if (match) results.push({ id: makeId(), examKey: key, name, category: 'Orina', value: Number(match[1]), unit, originalUnit: unit, collectedAt: urineAt, originalText: safeSource, sourceHadIdentifiers, status: 'confirmed', confidence: 'alta' });
  });
  const sedimentRules = [
    ['orina_leucocitos_campo', 'Leucocitos en sedimento', /SEDIMENTO[\s\S]*?LEUCOCITOS\s+(\d+\s*-\s*\d+)\s*X CPO/],
    ['orina_hematies_campo', 'Hematíes en sedimento', /HEMATIES\s+(\d+\s*-\s*\d+)\s*X CPO/],
  ];
  sedimentRules.forEach(([key, name, regex]) => {
    const match = urine.match(regex);
    if (match) add(key, name, match[1], 'x cpo');
  });
  if (microStart >= 0) {
    const micro = normalized.slice(microStart);
    const culture = micro.match(/RESULTADO UROCULTIVO\s+(.+?)(?=VALIDADO POR|$)/);
    if (culture) add('urocultivo_resultado', 'Urocultivo', culture[1].trim(), '', /NEGATIVO|POSITIVO/i.test(culture[1]) ? 'confirmed' : 'review');
  }
  return results;
};

const parseText = (text, block) => {
  const safeSource = stripDirectIdentifiers(text);
  const normalized = normalizeReportText(safeSource);
  const sourceHadIdentifiers = /PACIENTE\s*:|IDENTIFICACION\s*:|RUT\s*:|NOMBRE\s*:/i.test(text);
  const found = [];
  EXAMS.forEach((exam) => {
    const alias = exam.aliases
      .map((item) => normalizeReportText(item).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length)
      .join('|');
    const match = normalized.match(new RegExp(`(?:^|[\\s;:/|])(${alias})\\s*[:=]?\\s*\\*{0,2}\\s*(-?\\d+(?:\\.\\d+)?)\\s*([A-Zµ%³][A-Z/%0-9µ³^.-]*(?:/[A-Z0-9µ³]+)?)?`, 'i'));
    if (!match) return;
    const rawValue = Number(match[2]);
    const asciticStart = normalized.indexOf('LIQUIDO ASCITICO');
    if (asciticStart >= 0 && match.index >= asciticStart && ['alb', 'leu', 'rbc'].includes(exam.key)) return;
    if (['leu', 'plaq'].includes(exam.key) && rawValue < 1000 && /CPO|CAMPO/i.test(match[3] || '')) return;
    found.push({
      id: makeId(), examKey: exam.key, name: exam.name, category: exam.category,
      value: rawValue,
      unit: match[3] || exam.unit, originalUnit: match[3] || '', collectedAt: detectCollectedAtNear(normalized, match.index, block),
      originalText: safeSource, sourceHadIdentifiers,
      status: match[3] ? 'confirmed' : 'review', confidence: match[3] ? 'alta' : 'media',
    });
  });
  return [...found, ...parseUrineAndMicrobiology(normalized, safeSource, block, sourceHadIdentifiers), ...parseBiologicalFluids(normalized, safeSource, block, sourceHadIdentifiers)];
};

const daysInHospital = (episode) => Math.max(0, Math.floor((Date.now() - new Date(episode.admittedAt).getTime()) / 86400000));

function CurvaExamenes() {
  const initial = useMemo(loadState, []);
  const [episodes, setEpisodes] = useState(initial.episodes);
  const [selectedId, setSelectedId] = useState(initial.episodes.find((item) => item.status === 'hospitalizado')?.id || '');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [blocks, setBlocks] = useState([{ id: makeId(), ...nowLocal(), sample: 'Sangre', text: '' }]);
  const [review, setReview] = useState([]);
  const [selectedExam, setSelectedExam] = useState('crea');
  const [pendingBed, setPendingBed] = useState(null);
  const [admission, setAdmission] = useState({ ...nowLocal(), ageRange: '', clinicalSex: '' });
  const selected = episodes.find((item) => item.id === selectedId);
  const activeByBed = useMemo(() => new Map(episodes.filter((item) => item.status === 'hospitalizado').map((item) => [item.bedCode, item])), [episodes]);
  const services = [...new Set(ALL_BEDS.map((item) => item.serviceShort))];

  const persist = (next) => {
    setEpisodes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ episodes: next }));
  };
  const openBed = (bed) => {
    const currentEpisode = activeByBed.get(bed.code);
    if (currentEpisode) {
      setSelectedId(currentEpisode.id);
      return;
    }
    setAdmission({ ...nowLocal(), ageRange: '', clinicalSex: '' });
    setPendingBed(bed);
  };
  const admit = () => {
    if (!pendingBed || activeByBed.has(pendingBed.code) || !admission.date || !admission.time) return;
    const stamp = new Date(`${admission.date}T${admission.time}:00`).toISOString();
    const episode = { id: makeId(), code: makeCode(), bedCode: pendingBed.code, service: pendingBed.serviceShort, admittedAt: stamp, ageRange: admission.ageRange, clinicalSex: admission.clinicalSex, admissionConfirmed: true, status: 'hospitalizado', results: [], movements: [{ type: 'ingreso', bedCode: pendingBed.code, at: stamp }] };
    persist([episode, ...episodes]);
    setSelectedId(episode.id);
    setPendingBed(null);
  };
  const discharge = () => {
    if (!selected || !window.confirm(`¿Egresar ${selected.code} y liberar la cama ${selected.bedCode}?`)) return;
    const stamp = new Date().toISOString();
    persist(episodes.map((item) => item.id === selected.id ? { ...item, status: 'egresado', dischargedAt: stamp, movements: [...item.movements, { type: 'egreso', bedCode: item.bedCode, at: stamp }] } : item));
    setSelectedId('');
  };
  const processBlocks = () => setReview(blocks.flatMap((block) => parseText(block.text, block)));
  const saveResults = () => {
    const accepted = review.filter((item) => item.status !== 'discarded');
    if (!selected || !accepted.length) return;
    persist(episodes.map((item) => item.id === selected.id ? { ...item, results: [...(item.results || []), ...accepted] } : item));
    setReview([]);
    setBlocks([{ id: makeId(), ...nowLocal(), sample: 'Sangre', text: '' }]);
  };
  const columns = useMemo(() => [...new Set((selected?.results || []).map((item) => item.collectedAt))].sort(), [selected]);
  const rows = useMemo(() => {
    const definitions = new Map(EXAMS.map((exam) => [exam.key, exam]));
    (selected?.results || []).forEach((item) => {
      if (!definitions.has(item.examKey)) definitions.set(item.examKey, { key: item.examKey, name: item.name, category: item.category, unit: item.unit });
    });
    return [...definitions.values()].map((exam) => ({ ...exam, values: columns.map((date) => (selected?.results || []).find((item) => item.examKey === exam.key && item.collectedAt === date)) })).filter((row) => row.values.some(Boolean));
  }, [selected, columns]);
  const chartData = useMemo(() => (selected?.results || []).filter((item) => item.examKey === selectedExam && item.status === 'confirmed').sort((a, b) => a.collectedAt.localeCompare(b.collectedAt)).map((item) => ({ date: new Date(item.collectedAt).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), value: Number(item.value) })), [selected, selectedExam]);
  const latest = (key) => [...(selected?.results || [])].filter((item) => item.examKey === key && item.status === 'confirmed').sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0]?.value;
  const calculations = useMemo(() => {
    if (!selected) return [];
    const na = latest('na'); const cl = latest('cl'); const hco3 = latest('hco3'); const k = latest('k'); const alb = latest('alb'); const bun = latest('bun'); const crea = latest('crea');
    const result = [];
    if ([na, cl, hco3].every(Number.isFinite)) {
      const ag = na - cl - hco3;
      result.push({ name: 'Anión gap', value: ag.toFixed(1), formula: 'Na − (Cl + HCO₃)' });
      if (Number.isFinite(alb)) result.push({ name: 'AG corregido por albúmina', value: (ag + 2.5 * (4 - alb)).toFixed(1), formula: 'AG + 2,5 × (4 − albúmina)' });
      if (Number.isFinite(k)) result.push({ name: 'Anión gap con K', value: (na + k - cl - hco3).toFixed(1), formula: '(Na + K) − (Cl + HCO₃)' });
    }
    if ([bun, crea].every(Number.isFinite) && crea !== 0) result.push({ name: 'Relación BUN/creatinina', value: (bun / crea).toFixed(1), formula: 'BUN ÷ creatinina' });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-2xl font-black text-slate-950">Curva de exámenes</h1><p className="text-sm text-slate-600">Seguimiento longitudinal anónimo de pacientes hospitalizados.</p></div>
            {selected && <Button variant="outline" onClick={discharge} className="gap-2 text-rose-700"><LogOut className="h-4 w-4" />Egresar y liberar cama</Button>}
          </div>
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">Este módulo no solicita ni almacena nombre, RUT, ficha, teléfono ni otros identificadores directos.</p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-black text-slate-900">Camas</h2><select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="rounded-md border px-2 py-1 text-xs"><option value="all">Todos</option>{services.map((service) => <option key={service}>{service}</option>)}</select></div>
            <div className="grid max-h-[72vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
              {ALL_BEDS.filter((bed) => serviceFilter === 'all' || bed.serviceShort === serviceFilter).map((bed) => {
                const episode = activeByBed.get(bed.code);
                return <button key={bed.code} onClick={() => openBed(bed)} className={`relative rounded-xl border p-3 text-left transition ${selectedId === episode?.id ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : episode ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-teal-300'}`}><span className="block text-xs font-bold text-slate-500">{bed.serviceShort}</span><span className="block text-lg font-black text-slate-900">{bed.cell}</span>{episode ? <><Badge className="mt-1 bg-emerald-600 text-[9px] text-white">OCUPADA</Badge><span className="mt-1 block text-xs font-bold text-emerald-800">{episode.code}</span><span className="text-[10px] text-slate-500">Día {daysInHospital(episode)} · abrir y agregar exámenes</span></> : <><Badge variant="outline" className="mt-1 border-slate-300 bg-white text-[9px] text-slate-500">LIBRE</Badge><span className="mt-1 block text-xs text-slate-400">Crear nuevo paciente</span></>}</button>;
              })}
            </div>
          </aside>

          <main className="min-w-0 space-y-5">
            {!selected ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><Bed className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">Selecciona una cama ocupada o una libre para crear un episodio anónimo.</p></div> : <>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-3"><Badge className="bg-teal-700 text-white">{selected.code}</Badge><strong>Cama {selected.bedCode}</strong><span className="text-sm text-slate-500">Ingreso {new Date(selected.admittedAt).toLocaleString('es-CL')} · Día {daysInHospital(selected)}</span></div></section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="font-black text-slate-900">Pegar exámenes</h2><p className="text-xs text-slate-500">Cada bloque corresponde a una toma diferente.</p></div><Button variant="outline" onClick={() => setBlocks((current) => [...current, { id: makeId(), ...nowLocal(), sample: 'Sangre', text: '' }])} className="gap-2"><CalendarPlus className="h-4 w-4" />Agregar fecha</Button></div>
                <div className="space-y-3">{blocks.map((block, index) => <div key={block.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-2 grid gap-2 sm:grid-cols-[160px_120px_1fr_auto]"><Input type="date" value={block.date} onChange={(e) => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, date: e.target.value } : item))} /><Input type="time" value={block.time} onChange={(e) => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, time: e.target.value } : item))} /><Input value={block.sample} onChange={(e) => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, sample: e.target.value } : item))} placeholder="Muestra" /><Button size="icon" variant="ghost" disabled={blocks.length === 1} onClick={() => setBlocks((current) => current.filter((item) => item.id !== block.id))}><Trash2 className="h-4 w-4 text-rose-600" /></Button></div><Textarea value={block.text} onChange={(e) => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, text: e.target.value } : item))} placeholder="HB 9.4 HTO 28.1 LEU 15300 PCR 184 CREA 1.7 NA 132 K 3.2..." rows={3} /></div>)}</div>
                <Button onClick={processBlocks} className="mt-3 gap-2 bg-teal-700 hover:bg-teal-800"><FlaskConical className="h-4 w-4" />Procesar y revisar</Button>
              </section>

              {review.length > 0 && <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm"><h2 className="font-black text-slate-900">Revisión antes de guardar</h2>{review.some((item) => item.sourceHadIdentifiers) && <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">Se detectó un encabezado con identificadores directos. Fue eliminado del texto fuente y no se guardará con los resultados.</p>}<div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-100 text-left"><th className="p-2">Examen</th><th>Valor</th><th>Unidad</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{review.map((item) => <tr key={item.id} className="border-b"><td className="p-2 font-semibold">{item.name}{item.derived && <span className="block text-[10px] font-normal text-blue-600">Calculado: {item.formula}</span>}</td><td>{item.valueText !== undefined ? <Input value={item.valueText} onChange={(e) => setReview((current) => current.map((row) => row.id === item.id ? { ...row, valueText: e.target.value } : row))} className="min-w-44" /> : <div className="flex items-center gap-1">{item.comparator && <strong>{item.comparator}</strong>}<Input type="number" value={item.value} onChange={(e) => setReview((current) => current.map((row) => row.id === item.id ? { ...row, value: Number(e.target.value) } : row))} className="w-28" /></div>}</td><td><Input value={item.unit} onChange={(e) => setReview((current) => current.map((row) => row.id === item.id ? { ...row, unit: e.target.value } : row))} className="w-28" /></td><td className="whitespace-nowrap text-xs">{new Date(item.collectedAt).toLocaleString('es-CL')}</td><td><select value={item.status} onChange={(e) => setReview((current) => current.map((row) => row.id === item.id ? { ...row, status: e.target.value } : row))} className="rounded-md border p-2"><option value="confirmed">Confirmar</option><option value="review">Requiere revisión</option><option value="discarded">Descartar</option></select></td></tr>)}</tbody></table></div><Button onClick={saveResults} className="mt-3 gap-2"><Save className="h-4 w-4" />Guardar resultados</Button></section>}

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black text-slate-900">Tabla longitudinal</h2>{rows.length ? <div className="mt-3 overflow-x-auto"><table className="min-w-max border-collapse text-xs"><thead><tr><th className="sticky left-0 z-10 min-w-44 border bg-slate-100 p-2 text-left">Examen</th>{columns.map((date) => <th key={date} className="min-w-28 border bg-slate-100 p-2">{new Date(date).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.key}><td className="sticky left-0 border bg-white p-2"><strong>{row.name}</strong><span className="block text-[10px] text-slate-400">{row.category}</span></td>{row.values.map((value, index) => <td key={columns[index]} className={`border p-2 text-center ${value?.status === 'review' ? 'bg-amber-50 text-amber-900' : ''}`}>{value ? <>{value.comparator || ''}{value.valueText ?? value.value}<span className="ml-1 text-[10px] text-slate-500">{value.unit}</span></> : '—'}</td>)}</tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-slate-500">Aún no hay resultados guardados.</p>}</section>

              <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-black"><LineChartIcon className="h-4 w-4" />Curva</h2><select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="rounded-md border p-2 text-xs">{EXAMS.map((exam) => <option key={exam.key} value={exam.key}>{exam.name}</option>)}</select></div><div className="mt-3 h-64">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot /></LineChart></ResponsiveContainer> : <p className="py-20 text-center text-sm text-slate-400">Sin valores confirmados para graficar.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">Cálculos verificables</h2><div className="mt-3 space-y-2">{calculations.length ? calculations.map((calc) => <div key={calc.name} className="rounded-xl border border-blue-100 bg-blue-50 p-3"><div className="flex justify-between gap-3"><strong>{calc.name}</strong><span className="text-lg font-black text-blue-900">{calc.value}</span></div><p className="text-xs text-slate-500">{calc.formula}</p></div>) : <p className="text-sm text-slate-500">Faltan resultados confirmados y compatibles.</p>}</div></section></div>
            </>}
          </main>
        </div>
      </div>

      <Dialog open={Boolean(pendingBed)} onOpenChange={(open) => { if (!open) setPendingBed(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear nuevo paciente anónimo</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-sm font-bold text-teal-950">{pendingBed?.serviceShort} · Cama {pendingBed?.cell}</p>
            <p className="mt-1 text-xs text-teal-800">Se generará un código aleatorio nuevo. Esta acción no recupera ni reutiliza los exámenes del ocupante anterior.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label className="mb-1.5 block">Fecha de ingreso *</Label><Input type="date" value={admission.date} onChange={(e) => setAdmission((current) => ({ ...current, date: e.target.value }))} /></div>
            <div><Label className="mb-1.5 block">Hora de ingreso *</Label><Input type="time" value={admission.time} onChange={(e) => setAdmission((current) => ({ ...current, time: e.target.value }))} /></div>
            <div><Label className="mb-1.5 block">Rango etario (opcional)</Label><select value={admission.ageRange} onChange={(e) => setAdmission((current) => ({ ...current, ageRange: e.target.value }))} className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="">No registrar</option><option>0–17 años</option><option>18–39 años</option><option>40–64 años</option><option>65–79 años</option><option>80 años o más</option></select></div>
            <div><Label className="mb-1.5 block">Sexo clínico (opcional)</Label><select value={admission.clinicalSex} onChange={(e) => setAdmission((current) => ({ ...current, clinicalSex: e.target.value }))} className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="">No registrar</option><option value="F">Femenino</option><option value="M">Masculino</option></select></div>
          </div>
          <p className="text-xs text-slate-500">No ingreses nombre, RUT, ficha clínica, fecha de nacimiento ni teléfono.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingBed(null)}>Cancelar</Button>
            <Button onClick={admit} disabled={!admission.date || !admission.time} className="bg-teal-700 hover:bg-teal-800">Crear episodio y ocupar cama</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default conPuertaAcceso(CurvaExamenes, {
  storageKey: 'acceso_curva_examenes',
  titulo: 'Acceso a Curva de exámenes',
  descripcion: 'Ingresa el permiso de BulnesMédico para acceder al seguimiento de pacientes hospitalizados.',
});
