import { numberInput } from './decision.js';

export const formatNumber = number => number.toLocaleString('es-CL', { maximumFractionDigits: 4 });
export function tabletText(tablets) {
  const quarters = Math.round(tablets * 4);
  if (Math.abs(tablets * 4 - quarters) > 1e-8) return formatNumber(tablets);
  const whole = Math.floor(quarters / 4);
  const fraction = ['', '¼', '½', '¾'][quarters % 4];
  return `${whole || !fraction ? whole : ''}${fraction ? `${whole ? ' ' : ''}${fraction}` : ''}`;
}

// Acenocoumarol 4 mg biranurado: 1/4 tablet = 1 mg, so every practical weekly dose is a whole number of mg.
// Each interval endpoint is rounded to the nearest mg; if the interval collapses onto the current dose while a
// change is required, it moves one mg in the required direction.
export function practicalRange(weekly, percent, drug) {
  const current = numberInput(weekly);
  if (!Number.isFinite(current) || current <= 0 || !percent) return null;
  const exact = [current * (1 + Math.min(...percent) / 100), current * (1 + Math.max(...percent) / 100)];
  if (drug !== 'acenocoumarol') return { exact, range: exact };
  let low = Math.round(exact[0]);
  let high = Math.round(exact[1]);
  const direction = Math.sign(percent[0] + percent[1]);
  if (direction < 0) { high = Math.min(high, Math.ceil(current) - 1); low = Math.min(low, high); }
  if (direction > 0) { low = Math.max(low, Math.floor(current) + 1); high = Math.max(high, low); }
  return { exact, range: [Math.max(1, low), Math.max(1, high)] };
}
export function doseOptions(weekly, percent, drug) {
  const practical = practicalRange(weekly, percent, drug);
  if (!practical) return [];
  const current = numberInput(weekly);
  const [low, high] = practical.range;
  const doses = drug === 'acenocoumarol'
    ? Array.from({ length: high - low + 1 }, (_, index) => low + index)
    : [...new Set([low, (low + high) / 2, high])];
  return doses.map(mg => ({
    practicalMg: mg, tablets: drug === 'acenocoumarol' ? mg / 4 : null,
    deltaMg: mg - current, actualPercent: Math.round((mg / current - 1) * 10000) / 100,
  }));
}

// Calendar dates, independent of browser timezone and daylight saving transitions.
export function addDays(date, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(days) || days < 0) return null;
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
}
export const displayDate = value => value ? value.split('-').reverse().join('/') : '';
export function controlDates(date, days) {
  if (!days) return null;
  const start = addDays(date, days[0]);
  const end = addDays(date, days[1]);
  if (!start || !end) return null;
  return start === end ? displayDate(start) : `${displayDate(start)}–${displayDate(end)}`;
}

export function prescriptionText({ drug, option, hold, controlDate }) {
  if (!option || !controlDate) return '';
  const medication = drug === 'acenocoumarol' ? 'Acenocumarol 4 mg' : 'Warfarina';
  const tablets = option.tablets === null ? '' : ` (${tabletText(option.tablets)} comprimidos de 4 mg/semana)`;
  return [
    `${medication}: dosis total semanal ${formatNumber(option.practicalMg)} mg/semana${tablets}; distribuir según pauta diaria indicada por el médico.`,
    hold ? `Suspender ${hold} horas. La DTS indicada corresponde a la mantención posterior; confirmar reinicio con nuevo INR y evaluación clínica.` : '',
    `Próximo control INR: ${displayDate(controlDate)}.`,
  ].filter(Boolean).join('\n');
}
