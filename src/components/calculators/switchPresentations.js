import { DRUGS } from './antidepressantSwitchEngine.js';

// Typical strengths from the calculator's existing Chilean presentation catalog.
// Suggestions describe presentations, not local pharmacy stock.
export function switchPresentation(drugKey) {
  const description = DRUGS[drugKey]?.presentacion || '';
  const capsule = /cáps/.test(description);
  const mixed = capsule && /comp/.test(description);
  return {
    strengths: [...new Set((description.match(/\d+(?:[,.]\d+)?/g) || []).map((s) => Number(s.replace(',', '.'))))].sort((a, b) => a - b),
    unit: mixed ? 'unidad' : capsule ? 'cápsula' : 'comprimido',
    canSplit: !capsule && !/LP|XL/.test(description),
  };
}

export function parsePresentationStrength(value) {
  const text = String(value ?? '').trim().replace(/\s*mg\s*$/i, '').replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const strength = Number(text);
  return strength > 0 && Number.isFinite(strength) ? strength : null;
}
