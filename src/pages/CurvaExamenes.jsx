import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bed, CalendarPlus, FlaskConical, LineChart as LineChartIcon, LogOut, Pencil, Printer, Save, Search, Trash2 } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ALL_BEDS } from '@/components/agenda-diaria/bedCatalog';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { archiveProaRecord, deleteProaRecord, fetchProaRecords, getLatestProaForm, isHistoricalProaRecord } from '@/lib/proaRegistry';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'hospital_lab_tracker_v1';
const TEST_EPISODE_ID = 'curva-examenes-test-patient';
const TEST_BED = { code: 'TEST-1', cell: 'TEST-1', serviceShort: 'PRUEBA' };
const CURVE_BEDS = [...ALL_BEDS, TEST_BED];

const buildTestEpisode = () => {
  const at = (daysAgo, hour) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };
  const result = (examKey, name, category, value, unit, daysAgo, hour = 8) => ({
    id: `test-${examKey}-${daysAgo}`,
    examKey,
    name,
    category,
    value,
    unit,
    originalUnit: unit,
    collectedAt: at(daysAgo, hour),
    originalText: 'Resultado ficticio para probar Curva de exámenes',
    sourceHadIdentifiers: false,
    status: 'confirmed',
    confidence: 'alta',
  });
  const microbiology = (examKey, name, valueText, daysAgo) => ({
    ...result(examKey, name, 'Microbiología', null, '', daysAgo, 11),
    valueText,
  });
  const series = (examKey, name, category, values, unit) => values.map((value, index) => (
    result(examKey, name, category, value, unit, values.length - index - 1)
  ));
  const admittedAt = at(8, 10);
  return {
    id: TEST_EPISODE_ID,
    code: 'HOS-TEST',
    bedCode: TEST_BED.code,
    service: TEST_BED.serviceShort,
    admittedAt,
    ageRange: '60–69 años',
    clinicalSex: 'M',
    admissionConfirmed: true,
    proaRecordId: '',
    source: 'test',
    isTest: true,
    status: 'hospitalizado',
    results: [
      ...series('hb', 'Hemoglobina', 'Hemograma', [10.4, 10.6, 10.8, 11, 11.2, 11.6, 12.1], 'g/dL'),
      ...series('leu', 'Leucocitos', 'Hemograma', [18900, 17600, 15400, 13700, 12100, 10400, 9200], '/µL'),
      ...series('plaq', 'Plaquetas', 'Hemograma', [142000, 151000, 168000, 181000, 196000, 214000, 238000], '/µL'),
      ...series('pcr', 'Proteína C reactiva', 'Inflamatorios', [212, 184, 151, 126, 91, 62, 38], 'mg/L'),
      ...series('crea', 'Creatinina', 'Función renal', [2.1, 2, 1.8, 1.6, 1.4, 1.2, 1.1], 'mg/dL'),
      ...series('bun', 'Nitrógeno ureico (BUN)', 'Función renal', [52, 49, 45, 41, 37, 34, 31], 'mg/dL'),
      ...series('na', 'Sodio', 'Electrolitos', [132, 133, 134, 135, 137, 138, 139], 'mEq/L'),
      ...series('k', 'Potasio', 'Electrolitos', [5.1, 4.9, 4.7, 4.5, 4.3, 4.2, 4.1], 'mEq/L'),
      ...series('cl', 'Cloro', 'Electrolitos', [99, 100, 101, 102, 102, 103, 104], 'mEq/L'),
      ...series('hco3', 'Bicarbonato', 'Gases y ácido-base', [18, 19, 20, 21, 22, 23, 24], 'mEq/L'),
      ...series('alb', 'Albúmina', 'Perfil hepático', [2.6, 2.6, 2.7, 2.8, 2.9, 3, 3.1], 'g/dL'),
      ...series('calcio', 'Calcio', 'Electrolitos', [7.5, 7.6, 7.7, 7.8, 8, 8.1, 8.2], 'mg/dL'),
      ...series('ast', 'AST/GOT', 'Perfil hepático', [84, 78, 70, 61, 53, 45, 38], 'U/L'),
      ...series('alt', 'ALT/GPT', 'Perfil hepático', [66, 63, 59, 54, 49, 44, 40], 'U/L'),
      microbiology('hemocultivo_1_test', 'Hemocultivo periférico', 'Escherichia coli · BLEE negativo · sensible a ceftriaxona', 6),
      microbiology('hemocultivo_2_test', 'Hemocultivo de control', 'Sin desarrollo bacteriano a las 48 horas', 4),
      microbiology('urocultivo_test', 'Urocultivo', 'Escherichia coli 100.000 UFC/mL · sensible a ceftriaxona y gentamicina', 6),
      microbiology('cultivo_esputo_test', 'Cultivo de esputo', 'Flora respiratoria habitual · muestra de calidad intermedia', 5),
      microbiology('panel_respiratorio_test', 'Panel respiratorio molecular', 'Influenza A/B, SARS-CoV-2 y VRS no detectados', 3),
      microbiology('coprocultivo_test', 'Coprocultivo', 'Sin desarrollo de enteropatógenos', 2),
      microbiology('toxina_cd_test', 'Toxina de Clostridioides difficile', 'No detectada', 1),
    ],
    movements: [{ type: 'ingreso', bedCode: TEST_BED.code, at: admittedAt, source: 'test' }],
  };
};

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
    const savedEpisodes = storedEpisodes.filter((episode) => (
      episode.admissionConfirmed === true
      || (episode.results || []).length > 0
      || (episode.movements || []).length > 1
    ));
    const episodes = [buildTestEpisode(), ...savedEpisodes.filter((episode) => episode.id !== TEST_EPISODE_ID)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, episodes }));
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

const catalogToProaBed = (bed) => {
  if (bed.serviceShort === 'MQ1') {
    if (/^\d+-\d+$/.test(bed.cell)) return bed.cell;
    const isolation = /^Aisl(\d+)-(\d+)$/.exec(bed.cell);
    if (isolation) return Number(isolation[2]) === 1 && !['5', '8'].includes(isolation[1])
      ? `Aisl ${isolation[1]}`
      : `Aisl ${isolation[1]}-${isolation[2]}`;
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
    const pediatricBeds = ALL_BEDS.filter((item) => item.serviceShort === 'PED');
    const index = pediatricBeds.findIndex((item) => item.code === bed.code);
    return index >= 0 ? `PED-${index + 1}` : null;
  }
  return null;
};

const PROA_TO_CATALOG_BED = new Map(ALL_BEDS.map((bed) => [catalogToProaBed(bed), bed.code]).filter(([proaBed]) => proaBed));

const PROA_LAB_DEFINITIONS = [
  ['pcr', 'PCR', 'mg/L'], ['pct', 'Procalcitonina', 'ng/mL'], ['blancos', 'Leucocitos', '/mm³'],
  ['crea', 'Creatinina', 'mg/dL'], ['vhs', 'VHS', 'mm/h'], ['temp', 'Temperatura', '°C'],
];
const proaLabResults = (record) => {
  const form = getLatestProaForm(record) || {};
  return (form.parametros_inflamatorios || []).flatMap((row) => PROA_LAB_DEFINITIONS.flatMap(([key, name, unit]) => {
    const raw = row?.[key] ?? (key === 'blancos' ? row?.leucocitos : '');
    if (raw === '' || raw == null) return [];
    const collectedAt = `${row.fecha || form.fecha || new Date().toISOString().slice(0, 10)}T12:00:00`;
    return [{ id: `proa-${record.id}-${key}-${collectedAt}`, examKey: key === 'blancos' ? 'wbc' : key, name, category: 'Sangre', value: Number(String(raw).replace(',', '.')), unit, originalUnit: unit, collectedAt, originalText: '', sourceHadIdentifiers: false, status: 'confirmed', confidence: 'alta', source: 'proa' }];
  }));
};

const mergeProaLabResults = (episode, record) => {
  const manual = (episode.results || []).filter((item) => item.source !== 'proa');
  return { ...episode, results: [...manual, ...proaLabResults(record)] };
};

function CurvaExamenes() {
  const initial = useMemo(loadState, []);
  const [episodes, setEpisodes] = useState(initial.episodes);
  const [proaRecords, setProaRecords] = useState([]);
  const [verifiedProaIds, setVerifiedProaIds] = useState(null);
  const [proaLoading, setProaLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(initial.episodes.find((item) => item.status === 'hospitalizado')?.id || '');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [codeSearch, setCodeSearch] = useState('');
  const [blocks, setBlocks] = useState([{ id: makeId(), ...nowLocal(), sample: 'Sangre', text: '' }]);
  const [review, setReview] = useState([]);
  const [selectedExam, setSelectedExam] = useState('crea');
  const [pendingBed, setPendingBed] = useState(null);
  const [admission, setAdmission] = useState({ ...nowLocal(), ageRange: '', clinicalSex: '' });
  const [episodeActionOpen, setEpisodeActionOpen] = useState(false);
  const [episodeActionBusy, setEpisodeActionBusy] = useState(false);
  const [episodeActionError, setEpisodeActionError] = useState('');
  const [backConfirmationOpen, setBackConfirmationOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [resultToDelete, setResultToDelete] = useState(null);
  const selected = episodes.find((item) => item.id === selectedId);
  const activeByBed = useMemo(() => new Map(episodes.filter((item) => item.status === 'hospitalizado').map((item) => [item.bedCode, item])), [episodes]);
  const activeProaByBed = useMemo(() => {
    const map = new Map();
    proaRecords.filter((record) => !isHistoricalProaRecord(record)).forEach((record) => {
      const form = getLatestProaForm(record) || {};
      const catalogBed = PROA_TO_CATALOG_BED.get(form.cama || record.bedCode);
      if (catalogBed) map.set(catalogBed, record);
    });
    return map;
  }, [proaRecords]);
  const services = [...new Set(CURVE_BEDS.map((item) => item.serviceShort))];
  const visibleBeds = useMemo(() => {
    const query = codeSearch.trim().toUpperCase();
    return CURVE_BEDS.filter((bed) => {
      if (serviceFilter !== 'all' && bed.serviceShort !== serviceFilter) return false;
      if (!query) return true;
      const episode = activeByBed.get(bed.code);
      return episode?.code?.toUpperCase().includes(query);
    });
  }, [activeByBed, codeSearch, serviceFilter]);

  useEffect(() => {
    let active = true;
    const refreshProaState = async () => {
      const [records, verification] = await Promise.all([
        fetchProaRecords(),
        supabase.from('proa_records').select('id'),
      ]);
      if (!active) return;
      setProaRecords(records);
      if (!verification.error) setVerifiedProaIds(new Set((verification.data || []).map((row) => row.id)));
      setProaLoading(false);
    };
    refreshProaState();
    const intervalId = window.setInterval(refreshProaState, 30000);
    window.addEventListener('focus', refreshProaState);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshProaState);
    };
  }, []);

  const persist = (next) => {
    setEpisodes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ episodes: next }));
  };
  useEffect(() => {
    if (!(verifiedProaIds instanceof Set)) return;
    setEpisodes((current) => {
      let changed = false;
      const next = current.flatMap((episode) => {
        if (!episode.proaRecordId || episode.status !== 'hospitalizado') return [episode];
        const proaRecord = proaRecords.find((record) => record.id === episode.proaRecordId);
        if (!verifiedProaIds.has(episode.proaRecordId)) {
          changed = true;
          return [];
        }
        if (proaRecord && isHistoricalProaRecord(proaRecord)) {
          changed = true;
          const form = getLatestProaForm(proaRecord) || {};
          const dischargedAt = form.fecha_egreso ? `${form.fecha_egreso}T12:00:00` : (form.proa_archived_at || new Date().toISOString());
          return [{ ...episode, status: 'egresado', dischargedAt, movements: [...(episode.movements || []), { type: 'egreso', bedCode: episode.bedCode, at: dischargedAt, source: 'proa' }] }];
        }
        if (proaRecord) {
          const form = getLatestProaForm(proaRecord) || {};
          const catalogBed = PROA_TO_CATALOG_BED.get(form.cama || proaRecord.bedCode);
          const syncedEpisode = mergeProaLabResults(episode, proaRecord);
          changed = true;
          if (catalogBed && catalogBed !== episode.bedCode) {
            return [{ ...syncedEpisode, bedCode: catalogBed, service: ALL_BEDS.find((bed) => bed.code === catalogBed)?.serviceShort || episode.service, movements: [...(episode.movements || []), { type: 'traslado', bedCode: catalogBed, at: new Date().toISOString(), source: 'proa' }] }];
          }
          return [syncedEpisode];
        }
        return [episode];
      });

      proaRecords.filter((record) => !isHistoricalProaRecord(record) && verifiedProaIds.has(record.id)).forEach((record) => {
        if (next.some((episode) => episode.proaRecordId === record.id && episode.status === 'hospitalizado')) return;
        const form = getLatestProaForm(record) || {};
        const catalogBed = PROA_TO_CATALOG_BED.get(form.cama || record.bedCode);
        const bed = ALL_BEDS.find((item) => item.code === catalogBed);
        if (!bed) return;
        const existingIndex = next.findIndex((episode) => episode.status === 'hospitalizado' && episode.bedCode === catalogBed && !episode.proaRecordId);
        if (existingIndex >= 0) {
          next[existingIndex] = mergeProaLabResults({ ...next[existingIndex], proaRecordId: record.id, source: 'proa' }, record);
          changed = true;
          return;
        }
        const admissionDate = /^\d{4}-\d{2}-\d{2}$/.test(form.fecha_ingreso || '') ? form.fecha_ingreso : new Date().toISOString().slice(0, 10);
        const admittedAt = `${admissionDate}T12:00:00`;
        next.unshift({
          id: makeId(), code: makeCode(), bedCode: catalogBed, service: bed.serviceShort,
          admittedAt, ageRange: '', clinicalSex: '', admissionConfirmed: true,
          proaRecordId: record.id, source: 'proa', status: 'hospitalizado', results: proaLabResults(record),
          movements: [{ type: 'ingreso', bedCode: catalogBed, at: admittedAt, source: 'proa' }],
        });
        changed = true;
      });
      if (!changed) return current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ episodes: next }));
      return next;
    });
  }, [proaRecords, verifiedProaIds]);
  useEffect(() => {
    if (selectedId && !episodes.some((episode) => episode.id === selectedId && episode.status === 'hospitalizado')) {
      setSelectedId('');
      setEpisodeActionOpen(false);
    }
  }, [episodes, selectedId]);
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
    const linkedProa = activeProaByBed.get(pendingBed.code);
    const episode = { id: makeId(), code: makeCode(), bedCode: pendingBed.code, service: pendingBed.serviceShort, admittedAt: stamp, ageRange: admission.ageRange, clinicalSex: admission.clinicalSex, admissionConfirmed: true, proaRecordId: linkedProa?.id || '', source: linkedProa ? 'proa' : 'manual', status: 'hospitalizado', results: [], movements: [{ type: 'ingreso', bedCode: pendingBed.code, at: stamp }] };
    persist([episode, ...episodes]);
    setSelectedId(episode.id);
    setPendingBed(null);
  };
  const applyEpisodeAction = async (action) => {
    if (!selected || !['discharge', 'delete'].includes(action)) return;
    setEpisodeActionBusy(true);
    setEpisodeActionError('');
    try {
      const linkedProa = selected.proaRecordId ? proaRecords.find((record) => record.id === selected.proaRecordId) : null;
      if (linkedProa) {
        if (action === 'delete') await deleteProaRecord(linkedProa.bedCode);
        else if (!isHistoricalProaRecord(linkedProa)) await archiveProaRecord(linkedProa, nowLocal().date);
      }
      if (action === 'delete') {
        persist(episodes.filter((item) => item.id !== selected.id));
      } else {
        const stamp = new Date().toISOString();
        persist(episodes.map((item) => item.id === selected.id ? { ...item, status: 'egresado', dischargedAt: stamp, movements: [...(item.movements || []), { type: 'egreso', bedCode: item.bedCode, at: stamp, source: 'curva_examenes' }] } : item));
      }
      setSelectedId('');
      setEpisodeActionOpen(false);
      const [records, verification] = await Promise.all([
        fetchProaRecords(),
        supabase.from('proa_records').select('id'),
      ]);
      setProaRecords(records);
      if (!verification.error) setVerifiedProaIds(new Set((verification.data || []).map((row) => row.id)));
    } catch (error) {
      console.error('No fue posible sincronizar el egreso/eliminación:', error);
      setEpisodeActionError('No fue posible completar la acción en ambos módulos. No se modificó el episodio local.');
    } finally {
      setEpisodeActionBusy(false);
    }
  };
  const processBlocks = () => setReview(blocks.flatMap((block) => parseText(block.text, block)));
  const goBackWithoutSaving = () => {
    setReview([]);
    setBlocks([{ id: makeId(), ...nowLocal(), sample: 'Sangre', text: '' }]);
    setPendingBed(null);
    setEditingResult(null);
    setResultToDelete(null);
    setSelectedId('');
    setBackConfirmationOpen(false);
  };
  const saveResults = () => {
    const accepted = review.filter((item) => item.status !== 'discarded');
    if (!selected || !accepted.length) return;
    persist(episodes.map((item) => item.id === selected.id ? { ...item, results: [...(item.results || []), ...accepted] } : item));
    setReview([]);
    setBlocks([{ id: makeId(), ...nowLocal(), sample: 'Sangre', text: '' }]);
  };
  const updateSavedResult = () => {
    if (!selected || !editingResult) return;
    persist(episodes.map((episode) => episode.id === selected.id ? {
      ...episode,
        results: (episode.results || []).map((item) => item.id === editingResult.id ? {
        ...item,
        name: editingResult.name,
        collectedAt: editingResult.collectedAt,
        value: editingResult.valueText === undefined ? Number(editingResult.value) : item.value,
        valueText: editingResult.valueText,
        unit: editingResult.unit,
      } : item),
    } : episode));
    setEditingResult(null);
  };
  const deleteSavedResult = () => {
    if (!selected || !resultToDelete) return;
    persist(episodes.map((episode) => episode.id === selected.id ? {
      ...episode,
      results: (episode.results || []).filter((item) => item.id !== resultToDelete.id),
    } : episode));
    setResultToDelete(null);
  };
  const columns = useMemo(() => [...new Set((selected?.results || []).filter((item) => item.category !== 'Microbiología').map((item) => item.collectedAt))].sort(), [selected]);
  const rows = useMemo(() => {
    const definitions = new Map(EXAMS.map((exam) => [exam.key, exam]));
    (selected?.results || []).forEach((item) => {
      if (!definitions.has(item.examKey)) definitions.set(item.examKey, { key: item.examKey, name: item.name, category: item.category, unit: item.unit });
    });
    return [...definitions.values()].map((exam) => ({ ...exam, values: columns.map((date) => (selected?.results || []).find((item) => item.examKey === exam.key && item.collectedAt === date)) })).filter((row) => row.category !== 'Microbiología' && row.values.some(Boolean));
  }, [selected, columns]);
  const microbiologyResults = useMemo(() => (selected?.results || [])
    .filter((item) => item.category === 'Microbiología' || /cultivo|microbiolog/i.test(`${item.examKey} ${item.name}`))
    .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt)), [selected]);
  const chartData = useMemo(() => (selected?.results || []).filter((item) => item.examKey === selectedExam && item.status === 'confirmed').sort((a, b) => a.collectedAt.localeCompare(b.collectedAt)).map((item) => ({ date: new Date(item.collectedAt).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), value: Number(item.value) })), [selected, selectedExam]);
  const latest = (key) => [...(selected?.results || [])].filter((item) => item.examKey === key && item.status === 'confirmed').sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0]?.value;
  const calculations = useMemo(() => {
    if (!selected) return [];
    const na = latest('na'); const cl = latest('cl'); const hco3 = latest('hco3'); const k = latest('k'); const alb = latest('alb'); const bun = latest('bun'); const crea = latest('crea'); const calcium = latest('calcio'); const ast = latest('ast'); const alt = latest('alt'); const platelets = latest('plaq');
    const result = [];
    if ([na, cl, hco3].every(Number.isFinite)) {
      const ag = na - cl - hco3;
      result.push({ name: 'Anión gap', value: ag.toFixed(1), formula: 'Na − (Cl + HCO₃)' });
      if (Number.isFinite(alb)) result.push({ name: 'AG corregido por albúmina', value: (ag + 2.5 * (4 - alb)).toFixed(1), formula: 'AG + 2,5 × (4 − albúmina)' });
      if (Number.isFinite(k)) result.push({ name: 'Anión gap con K', value: (na + k - cl - hco3).toFixed(1), formula: '(Na + K) − (Cl + HCO₃)' });
    }
    if ([bun, crea].every(Number.isFinite) && crea !== 0) result.push({ name: 'Relación BUN/creatinina', value: (bun / crea).toFixed(1), formula: 'BUN ÷ creatinina' });
    if ([calcium, alb].every(Number.isFinite)) result.push({ name: 'Calcio corregido', value: (calcium + 0.8 * (4 - alb)).toFixed(1), formula: 'Calcio + 0,8 × (4 − albúmina)' });
    if ([ast, alt].every(Number.isFinite) && alt !== 0) result.push({ name: 'Relación AST/ALT (De Ritis)', value: (ast / alt).toFixed(2), formula: 'AST ÷ ALT' });
    if ([ast, platelets].every(Number.isFinite) && platelets !== 0) result.push({ name: 'APRI estimado', value: (((ast / 40) / platelets) * 100000).toFixed(2), formula: '(AST ÷ LSN 40) ÷ plaquetas × 100.000' });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const resultActions = (item) => <span className="curve-no-print ml-1 inline-flex gap-0.5 align-middle"><button type="button" onClick={() => setEditingResult({ ...item })} className="rounded p-1 text-blue-700 hover:bg-blue-50" aria-label={`Editar ${item.name}`}><Pencil className="h-3 w-3" /></button><button type="button" onClick={() => setResultToDelete(item)} className="rounded p-1 text-rose-700 hover:bg-rose-50" aria-label={`Borrar ${item.name}`}><Trash2 className="h-3 w-3" /></button></span>;

  const renderCurveTable = (interactive = false) => rows.length ? (
    <table className="w-full table-fixed border-collapse text-[10px]">
      <thead><tr><th className="w-40 border bg-slate-100 p-1.5 text-left">Examen</th>{columns.map((date) => <th key={date} className="border bg-slate-100 p-1.5 text-center">{new Date(date).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.key}><td className="border bg-white p-1.5"><strong>{row.name}</strong><span className="block text-[9px] text-slate-500">{row.category}</span></td>{row.values.map((value, index) => <td key={columns[index]} className={`border p-1.5 text-center align-middle ${value?.status === 'review' ? 'bg-amber-50 text-amber-900' : ''}`}>{value ? <>{value.comparator || ''}{value.valueText ?? value.value}{value.unit && <span className="ml-1 text-[9px] text-slate-500">{value.unit}</span>}{interactive && resultActions(value)}</> : '—'}</td>)}</tr>)}</tbody>
    </table>
  ) : <p className="py-5 text-center text-sm text-slate-500">Aún no hay resultados guardados.</p>;

  const renderMicrobiology = (interactive = false) => (
    <div className="curve-microbiology mt-5 break-inside-avoid">
      <h3 className="mb-2 border-b-2 border-slate-800 pb-1 text-sm font-black text-slate-900">Resultados microbiológicos</h3>
      {microbiologyResults.length ? <table className="w-full table-fixed border-collapse text-[10px]"><thead><tr><th className="w-32 border bg-slate-100 p-1.5 text-left">Fecha</th><th className="w-40 border bg-slate-100 p-1.5 text-left">Estudio</th><th className="border bg-slate-100 p-1.5 text-left">Resultado</th></tr></thead><tbody>{microbiologyResults.map((item) => <tr key={item.id}><td className="border p-1.5">{new Date(item.collectedAt).toLocaleString('es-CL')}</td><td className="border p-1.5 font-semibold">{item.name}</td><td className="border p-1.5">{item.valueText ?? `${item.value ?? ''} ${item.unit || ''}`.trim()}{interactive && resultActions(item)}</td></tr>)}</tbody></table> : <div className="min-h-20 rounded border border-dashed border-slate-400 p-3 text-xs text-slate-500">Sin resultados microbiológicos registrados. Espacio para observaciones:</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-2xl font-black text-slate-950">Curva de exámenes</h1><p className="text-sm text-slate-600">Seguimiento longitudinal anónimo de pacientes hospitalizados.</p></div>
            <div className="curve-no-print flex flex-wrap gap-2">{selected && <><Button type="button" variant="outline" onClick={() => setBackConfirmationOpen(true)} className="gap-2"><ArrowLeft className="h-4 w-4" />Volver sin guardar</Button><Button variant="outline" onClick={() => setPrintPreviewOpen(true)} className="gap-2"><Printer className="h-4 w-4" />Imprimir curva</Button><Button variant="outline" onClick={() => { setEpisodeActionError(''); setEpisodeActionOpen(true); }} className="gap-2 text-rose-700"><LogOut className="h-4 w-4" />Egresar o eliminar</Button></>}</div>
          </div>
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">Este módulo no solicita ni almacena nombre, RUT, ficha, teléfono ni otros identificadores directos.</p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="curve-no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><div><h2 className="font-black text-slate-900">Camas</h2><p className="text-[10px] text-slate-500">{proaLoading ? 'Sincronizando PROA…' : `${activeProaByBed.size} ocupadas desde PROA`}</p></div><select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="rounded-md border px-2 py-1 text-xs"><option value="all">Todos</option>{services.map((service) => <option key={service}>{service}</option>)}</select></div>
            <div className="relative mb-3"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={codeSearch} onChange={(e) => setCodeSearch(e.target.value.toUpperCase())} placeholder="Buscar código, ej. HOS-AB123" className="pl-9 uppercase" /></div>
            <div className="grid max-h-[72vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
              {visibleBeds.map((bed) => {
                const episode = activeByBed.get(bed.code);
                const proaRecord = activeProaByBed.get(bed.code);
                const occupied = Boolean(episode || proaRecord);
                return <button key={bed.code} onClick={() => openBed(bed)} className={`relative rounded-xl border p-3 text-left transition ${selectedId === episode?.id ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : occupied ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-teal-300'}`}><span className="block text-xs font-bold text-slate-500">{bed.serviceShort}</span><span className="block text-lg font-black text-slate-900">{bed.cell}</span>{episode ? <><Badge className="mt-1 bg-emerald-600 text-[9px] text-white">OCUPADA</Badge><span className="mt-1 block text-xs font-bold text-emerald-800">{episode.code}</span><span className="text-[10px] text-slate-500">Día {daysInHospital(episode)} · abrir y agregar exámenes</span></> : proaRecord ? <><Badge className="mt-1 bg-cyan-700 text-[9px] text-white">OCUPADA EN PROA</Badge><span className="mt-1 block text-[10px] font-semibold text-cyan-800">Crear episodio anónimo vinculado</span></> : <><Badge variant="outline" className="mt-1 border-slate-300 bg-white text-[9px] text-slate-500">LIBRE</Badge><span className="mt-1 block text-xs text-slate-400">Crear nuevo paciente</span></>}</button>;
              })}
              {visibleBeds.length === 0 && <p className="col-span-2 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No hay un paciente activo con ese código.</p>}
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

              <section className="curve-print-document rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="curve-print-header hidden"><h1>Curva de exámenes</h1><p><strong>Código del paciente: {selected.code}</strong></p><p>Cama {selected.bedCode} · Ingreso {new Date(selected.admittedAt).toLocaleString('es-CL')}</p></div><h2 className="curve-no-print font-black text-slate-900">Tabla longitudinal</h2><div className="mt-3 overflow-x-auto">{renderCurveTable(true)}</div>{renderMicrobiology(true)}</section>

              <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-black"><LineChartIcon className="h-4 w-4" />Curva</h2><select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="rounded-md border p-2 text-xs">{EXAMS.map((exam) => <option key={exam.key} value={exam.key}>{exam.name}</option>)}</select></div><div className="mt-3 h-64">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot /></LineChart></ResponsiveContainer> : <p className="py-20 text-center text-sm text-slate-400">Sin valores confirmados para graficar.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">Cálculos verificables</h2><div className="mt-3 space-y-2">{calculations.length ? calculations.map((calc) => <div key={calc.name} className="rounded-xl border border-blue-100 bg-blue-50 p-3"><div className="flex justify-between gap-3"><strong>{calc.name}</strong><span className="text-lg font-black text-blue-900">{calc.value}</span></div><p className="text-xs text-slate-500">{calc.formula}</p></div>) : <p className="text-sm text-slate-500">Faltan resultados confirmados y compatibles.</p>}</div></section></div>
            </>}
          </main>
        </div>
      </div>

      {selected && <div className="curve-print-sheet hidden bg-white">
        <div className="mb-3 border-b-2 border-slate-900 pb-2">
          <h1 className="text-lg font-black">Curva de exámenes</h1>
          <p className="text-[10px]"><strong>Código: {selected.code}</strong> · Cama {selected.bedCode} · Ingreso {new Date(selected.admittedAt).toLocaleString('es-CL')}</p>
        </div>
        {renderCurveTable()}
        {renderMicrobiology()}
      </div>}

      <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
        <DialogContent className="curve-print-preview-dialog z-[100] !flex h-[94vh] max-h-[94vh] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 xl:max-w-[1400px]">
          <DialogHeader className="shrink-0 border-b px-5 py-4">
            <DialogTitle>Vista previa de impresión</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto bg-slate-200 p-4 md:p-7">
            <div className="mx-auto aspect-[1.414/1] min-w-[900px] max-w-[1250px] overflow-hidden bg-white p-[3%] shadow-xl">
              <div className="mb-3 border-b-2 border-slate-900 pb-2">
                <h2 className="text-lg font-black">Curva de exámenes</h2>
                <p className="text-[10px]"><strong>Código: {selected?.code}</strong> · Cama {selected?.bedCode} · Ingreso {selected?.admittedAt ? new Date(selected.admittedAt).toLocaleString('es-CL') : '—'}</p>
              </div>
              {renderCurveTable()}
              {renderMicrobiology()}
            </div>
          </div>
          <DialogFooter className="relative z-10 shrink-0 border-t bg-white px-5 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)]">
            <Button variant="outline" onClick={() => setPrintPreviewOpen(false)}>Cerrar</Button>
            <Button onClick={() => { setPrintPreviewOpen(false); window.setTimeout(() => window.print(), 400); }} className="gap-2 bg-teal-700 hover:bg-teal-800"><Printer className="h-4 w-4" />Imprimir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingResult)} onOpenChange={(open) => { if (!open) setEditingResult(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar registro de examen</DialogTitle></DialogHeader>
          {editingResult && <div className="space-y-4">
            <div><Label className="mb-1.5 block">Examen</Label><Input value={editingResult.name || ''} onChange={(event) => setEditingResult((current) => ({ ...current, name: event.target.value }))} /></div>
            <div><Label className="mb-1.5 block">Fecha y hora</Label><Input type="datetime-local" value={String(editingResult.collectedAt || '').slice(0, 16)} onChange={(event) => setEditingResult((current) => ({ ...current, collectedAt: event.target.value }))} /></div>
            {editingResult.valueText !== undefined
              ? <div><Label className="mb-1.5 block">Resultado</Label><Textarea value={editingResult.valueText || ''} onChange={(event) => setEditingResult((current) => ({ ...current, valueText: event.target.value }))} rows={3} /></div>
              : <div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-1.5 block">Valor</Label><Input type="number" step="any" value={editingResult.value ?? ''} onChange={(event) => setEditingResult((current) => ({ ...current, value: event.target.value }))} /></div><div><Label className="mb-1.5 block">Unidad</Label><Input value={editingResult.unit || ''} onChange={(event) => setEditingResult((current) => ({ ...current, unit: event.target.value }))} /></div></div>}
          </div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingResult(null)}>Cancelar sin guardar</Button>
            <Button type="button" onClick={updateSavedResult} className="bg-teal-700 hover:bg-teal-800">Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resultToDelete)} onOpenChange={(open) => { if (!open) setResultToDelete(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>¿Borrar este registro?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Se eliminará <strong>{resultToDelete?.name}</strong> del {resultToDelete?.collectedAt ? new Date(resultToDelete.collectedAt).toLocaleString('es-CL') : ''}. Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResultToDelete(null)}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={deleteSavedResult}>Sí, borrar registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={backConfirmationOpen} onOpenChange={setBackConfirmationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Volver sin guardar?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Se descartarán los exámenes pegados o procesados que todavía no hayas guardado. Los resultados ya guardados no se modificarán.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBackConfirmationOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={goBackWithoutSaving} className="bg-teal-700 hover:bg-teal-800">Sí, volver sin guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingBed)} onOpenChange={(open) => { if (!open) setPendingBed(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear nuevo paciente anónimo</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-sm font-bold text-teal-950">{pendingBed?.serviceShort} · Cama {pendingBed?.cell}</p>
            <p className="mt-1 text-xs text-teal-800">{pendingBed && activeProaByBed.has(pendingBed.code) ? 'PROA informa un paciente activo en esta cama. Se creará un episodio anónimo vinculado sin copiar nombre ni RUT.' : 'Se generará un código aleatorio nuevo. Esta acción no recupera ni reutiliza los exámenes del ocupante anterior.'}</p>
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

      <Dialog open={episodeActionOpen} onOpenChange={(open) => { if (!episodeActionBusy) setEpisodeActionOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>¿Qué quieres hacer con este paciente?</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-bold text-slate-900">{selected?.code} · Cama {selected?.bedCode}</p>
            <p className="mt-1 text-xs text-slate-600">{selected?.proaRecordId ? 'Este episodio está vinculado a PROA: la acción se aplicará en ambos módulos.' : 'Este episodio solo existe en Curva de exámenes.'}</p>
          </div>
          <button type="button" disabled={episodeActionBusy} onClick={() => applyEpisodeAction('discharge')} className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-left transition hover:bg-amber-100 disabled:opacity-50">
            <span className="block font-black text-amber-950">Egresar y conservar historial</span>
            <span className="mt-1 block text-sm text-amber-800">Libera la cama y mantiene exámenes, curvas y movimientos en el archivo histórico.</span>
          </button>
          <button type="button" disabled={episodeActionBusy} onClick={() => applyEpisodeAction('delete')} className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-left transition hover:bg-rose-100 disabled:opacity-50">
            <span className="block font-black text-rose-900">Eliminar definitivamente</span>
            <span className="mt-1 block text-sm text-rose-700">Borra el episodio y sus exámenes. Si está vinculado, también elimina el registro PROA. Esta acción no se puede deshacer.</span>
          </button>
          {episodeActionError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{episodeActionError}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={episodeActionBusy} onClick={() => setEpisodeActionOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          html, body { margin: 0 !important; background: white !important; }
          body * { visibility: hidden !important; }
          .curve-print-sheet, .curve-print-sheet * { visibility: visible !important; }
          .curve-print-sheet {
            display: block !important;
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .curve-print-sheet table { width: 100% !important; min-width: 0 !important; table-layout: fixed !important; font-size: 8px !important; }
          .curve-print-sheet th, .curve-print-sheet td { padding: 3px !important; overflow-wrap: anywhere; }
          .curve-print-sheet th:first-child, .curve-print-sheet td:first-child { position: static !important; width: 105px !important; min-width: 0 !important; }
          .curve-print-sheet tr { break-inside: avoid; }
          .curve-print-sheet .curve-microbiology { margin-top: 10px !important; }
          .curve-print-sheet .curve-microbiology h3 { font-size: 10px !important; margin-bottom: 4px !important; }
        }
      `}</style>
    </div>
  );
}

export default conPuertaAcceso(CurvaExamenes, {
  storageKey: 'acceso_curva_examenes',
  titulo: 'Acceso a Curva de exámenes',
  descripcion: 'Ingresa el permiso de BulnesMédico para acceder al seguimiento de pacientes hospitalizados.',
});
