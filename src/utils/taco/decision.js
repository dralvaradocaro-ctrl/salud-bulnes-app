// Source: INR algorithm supplied by the clinician. Target INR 2–3, AVK maintenance.
// Do not interpolate unprovided rules or choose a dose within a percentage interval.
export const TACO_SOURCE = 'Flujograma INR aportado para esta calculadora; objetivo INR 2,0–3,0.';
export function numberInput(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const text = String(value).trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : NaN;
}
export function decideTaco(input) {
  const inr = numberInput(input.inr);
  const previous = numberInput(input.previous);
  const weekly = numberInput(input.weekly);
  const trt = numberInput(input.trt);
  const count = numberInput(input.count);
  const notes = [];
  const base = { notes, dose: null, percent: null, days: null, hold: null, urgent: false };
  // Emergency flags must remain visible even when the rest of the form is incomplete.
  if (input.bleeding === 'yes' || (Number.isFinite(inr) && inr >= 8)) {
    return { ...base, urgent: true, action: 'Suspender TACO y derivar a urgencias', reason: input.bleeding === 'yes' ? 'Sangrado activo: derivar independientemente del INR.' : 'INR ≥ 8: derivar a servicio de urgencia según el flujograma aportado.', notes: ['Evaluación urgente; no esperar un control ambulatorio ni reiniciar automáticamente. El equipo tratante definirá la reversión y el seguimiento.'] };
  }
  const errors = [];
  if (!Number.isFinite(inr) || inr <= 0) errors.push('Ingresa un INR actual válido, mayor que 0.');
  if (previous !== null && (!Number.isFinite(previous) || previous <= 0)) errors.push('El INR previo debe ser mayor que 0 o quedar vacío.');
  if (!Number.isFinite(weekly) || weekly <= 0) errors.push('Ingresa la dosis total semanal actual en mg, mayor que 0.');
  if (trt !== null && (!Number.isFinite(trt) || trt < 0 || trt > 100)) errors.push('El TRT debe estar entre 0 y 100%.');
  if (count !== null && (!Number.isInteger(count) || count < 1)) errors.push('El número de controles consecutivos debe ser un entero ≥ 1 o quedar vacío.');
  if (!['yes', 'no'].includes(input.bleeding)) errors.push('Indica si existe sangrado activo.');
  if (errors.length) return { ...base, errors };
  if (previous !== null) notes.push(`INR previo ${previous}: ${inr > previous ? 'tendencia ascendente' : inr < previous ? 'tendencia descendente' : 'sin cambio'}. El esquema no define un ajuste porcentual adicional por tendencia.`);
  const inRange = inr >= 2 && inr <= 3;
  if (count > 1 && previous !== null && ((previous >= 2 && previous <= 3) !== inRange)) {
    return { ...base, errors: ['El INR previo no concuerda con los controles consecutivos declarados. Revisa ese número (incluye el control actual).'] };
  }
  if ((trt !== null && trt < 60) || (!inRange && count >= 3) || input.adherence) notes.push('Derivar a QF para educación y revisión de adherencia: TRT < 60%, ≥ 3 controles consecutivos fuera de rango o problemas de adherencia.');
  if (input.interactions) notes.push('Revisar antibióticos, AINEs, otros fármacos, alcohol y cambios de dieta; individualizar dosis y adelantar el control según la interacción.');
  if (input.adherence) notes.push('Revisar dosis omitidas o duplicadas antes de confirmar el ajuste de DTS.');
  if (input.target !== '2-3' || input.drug === 'other' || input.phase !== 'maintenance' || input.special) {
    return { ...base, action: 'Valoración individual por equipo tratante', reason: 'Este esquema solo cubre mantención con acenocumarol o warfarina y meta INR 2,0–3,0. Otra meta, otro anticoagulante, inicio de tratamiento, embarazo o manejo perioperatorio requieren un plan específico.' };
  }
  if (inr >= 5.5) {
    // The figure only states "suspend 72 h and strict follow-up" for this branch. The restart uses the
    // adjacent >4.5–<5.5 reduction (25–50%) and a control at 3–5 days, once the suspension is completed.
    return {
      ...base, action: 'Suspender 72 h y reducir DTS', hold: 72, percent: [-50, -25], days: [3, 5],
      dose: [weekly * 0.5, weekly * 0.75], reason: 'INR ≥ 5,5 y < 8, sin sangrado.',
      notes: [...notes, 'Seguimiento telefónico estricto. Confirmar reinicio con nuevo INR y evaluación clínica; no reiniciar automáticamente al completar 72 horas.', 'El flujograma solo indica suspensión 72 h en este tramo; la reducción 25–50% y el control a 3–5 días se toman del tramo >4,5–<5,5 como referencia. Ajustar según la evaluación del episodio.'],
    };
  }
  // INR 4.5: clinician explicitly confirmed the 24 h / 10–20% branch.
  // Figure labels leave gaps for two-decimal INR (1.95, 3.05, 3.55). Do not silently round.
  if ((inr > 1.9 && inr < 2) || (inr > 3 && inr < 3.1) || (inr > 3.5 && inr < 3.6)) return { ...base, action: 'Confirmar interpretación del INR', reason: 'Valor entre los intervalos de la imagen (expresados con un decimal). No se redondea automáticamente un INR para decidir la dosis.' };
  let percent, days, action, hold = null;
  if (inr < 1.5) { percent = [10, 20]; days = [10, 14]; action = 'Aumentar DTS'; }
  else if (inr < 2) { percent = [5, 10]; days = [14, 21]; action = 'Aumentar DTS'; }
  else if (inRange) { percent = [0, 0]; days = [30, 30]; action = 'Mantener DTS'; }
  else if (inr <= 3.5) { percent = [-10, -5]; days = [14, 21]; action = 'Disminuir DTS'; }
  else if (inr <= 4.5) { percent = [-20, -10]; days = [7, 14]; hold = 24; action = 'Suspender 24 h y reducir DTS'; }
  else { percent = [-50, -25]; days = [3, 5]; hold = 48; action = 'Suspender 48 h y reducir DTS'; }
  if (inr < 2) notes.push('Reforzar adherencia.');
  const poorControl = input.adherence || input.interactions || (trt !== null && trt < 60);
  if (inRange && !poorControl) {
    if (trt > 90) days = [60, 60];
    else if (count >= 3) days = [45, 45];
  }
  if (poorControl) notes.push('El plazo mostrado es el basal del flujograma; confirmar un control más cercano según la situación. No se extiende a 45/60 días.');
  notes.push('Las dosis se expresan en cuartos de comprimido de acenocumarol 4 mg (¼ = 1 mg); la distribución diaria debe indicarla el profesional.');
  return { ...base, action, percent, days, hold, dose: percent.map(p => weekly * (1 + p / 100)), reason: inRange ? 'INR actual dentro de la meta 2,0–3,0.' : 'INR actual fuera de la meta 2,0–3,0.' };
}
