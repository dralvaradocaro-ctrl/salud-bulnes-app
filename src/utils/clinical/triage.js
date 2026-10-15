import { calculateEgfrCkdEpi2021 } from '../../lib/renalFunction.js';
export const numeric = value => typeof value === 'number' ? (Number.isFinite(value) ? value : NaN) : /^\d+(?:[.,]\d+)?$/.test(String(value ?? '').trim()) ? Number(String(value).replace(',', '.')) : NaN;
export function renalEstimates({ age, creatinine, sex, weight, unit, stable }) {
  const years = numeric(age), kg = numeric(weight), measured = numeric(creatinine);
  if (!(years >= 18 && years <= 120 && kg > 0 && kg <= 500 && measured > 0) || !['female', 'male'].includes(sex) || !['mgdl', 'umol'].includes(unit) || stable !== 'yes') return null;
  const scr = unit === 'umol' ? measured / 88.4 : measured;
  return { egfr: calculateEgfrCkdEpi2021({ age: years, creatinine: scr, sex }), clearance: (140 - years) * kg / (72 * scr) * (sex === 'female' ? 0.85 : 1) };
}
export function glasgowBlatchford({ urea, unit, hb, sex, sbp, pulse, melena, syncope, liver, heart }) {
  const lab = numeric(urea), hemoglobin = numeric(hb), pressure = numeric(sbp), rate = numeric(pulse);
  if (!(lab >= 0 && hemoglobin > 0 && pressure > 0 && rate > 0) || !['male', 'female'].includes(sex) || !['urea-mmol', 'urea-mg', 'bun-mg'].includes(unit) || ![melena, syncope, liver, heart].every(x => x === '0' || x === '1')) return null;
  const mmol = unit === 'urea-mg' ? lab / 6.006 : unit === 'bun-mg' ? lab / 2.801 : lab;
  return (mmol >= 25 ? 6 : mmol >= 10 ? 4 : mmol >= 8 ? 3 : mmol >= 6.5 ? 2 : 0)
    + (hemoglobin < 10 ? 6 : sex === 'male' ? (hemoglobin < 12 ? 3 : hemoglobin < 13 ? 1 : 0) : hemoglobin < 12 ? 1 : 0)
    + (pressure < 90 ? 3 : pressure < 100 ? 2 : pressure < 110 ? 1 : 0)
    + (rate >= 100 ? 1 : 0) + Number(melena) + 2 * (Number(syncope) + Number(liver) + Number(heart));
}
export const ALVARADO_WEIGHTS = { migration: 1, anorexia: 1, vomiting: 1, tenderness: 2, rebound: 1, fever: 1, leukocytes: 2, shift: 1 };
export function alvarado(values) {
  if (!Object.keys(ALVARADO_WEIGHTS).every(key => ['0', '1'].includes(values[key]))) return null;
  return Object.entries(ALVARADO_WEIGHTS).reduce((sum, [key, weight]) => sum + Number(values[key]) * weight, 0);
}
export function centorMcIsaac(values) {
  const age = numeric(values.age);
  const keys = ['fever', 'noCough', 'nodes', 'tonsils'];
  if (!(age >= 3 && age <= 120) || !keys.every(key => ['0', '1'].includes(values[key]))) return null;
  const centor = keys.reduce((sum, key) => sum + Number(values[key]), 0);
  return { centor, mcisaac: centor + (age < 15 ? 1 : age >= 45 ? -1 : 0) };
}
export function bishop(values) {
  const limits = { dilation: 3, effacement: 3, station: 3, consistency: 2, position: 2 };
  if (!Object.entries(limits).every(([key, max]) => /^\d$/.test(String(values[key] ?? '')) && Number(values[key]) <= max)) return null;
  return Object.keys(limits).reduce((sum, key) => sum + Number(values[key]), 0);
}
