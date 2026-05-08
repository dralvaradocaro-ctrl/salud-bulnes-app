/**
 * Cardiovascular Risk Calculation & Follow-up Logic
 * 
 * Based on Chilean PSCV (Programa de Salud Cardiovascular) guidelines.
 * This logic is simplified and configurable. Modify the rules below
 * to match your local protocol (MINSAL / establecimiento).
 */

// ============================================================
// CONFIGURABLE THRESHOLDS
// ============================================================

/** Days before next control to mark as "próximo cercano" */
export const NEAR_CONTROL_THRESHOLD_DAYS = 14;

/** Days after missed control to mark as "paciente perdido en seguimiento" */
export const LOST_FOLLOWUP_THRESHOLD_DAYS = 60;

// ============================================================
// TYPES
// ============================================================

export type CardiovascularRisk = 'bajo' | 'moderado' | 'alto';

export type CVFollowUpStatus = 
  | 'al_dia' 
  | 'proximo_cercano' 
  | 'control_vencido' 
  | 'perdido_seguimiento';

export type CVProfessional = 'medico' | 'enfermera' | 'nutricionista';

export const CV_PROFESSIONAL_LABELS: Record<CVProfessional, string> = {
  medico: 'Médico/a',
  enfermera: 'Enfermero/a',
  nutricionista: 'Nutricionista',
};

export const CV_RISK_LABELS: Record<CardiovascularRisk, string> = {
  bajo: 'Bajo',
  moderado: 'Moderado',
  alto: 'Alto',
};

export const CV_STATUS_LABELS: Record<CVFollowUpStatus, string> = {
  al_dia: 'Al día',
  proximo_cercano: 'Próximo control cercano',
  control_vencido: 'Control vencido',
  perdido_seguimiento: 'Paciente perdido en seguimiento',
};

export const CV_STATUS_COLORS: Record<CVFollowUpStatus, string> = {
  al_dia: 'bg-success text-success-foreground',
  proximo_cercano: 'bg-warning text-warning-foreground',
  control_vencido: 'bg-destructive text-destructive-foreground',
  perdido_seguimiento: 'bg-destructive text-destructive-foreground',
};

export const CV_RISK_COLORS: Record<CardiovascularRisk, string> = {
  bajo: 'bg-success text-success-foreground',
  moderado: 'bg-warning text-warning-foreground',
  alto: 'bg-destructive text-destructive-foreground',
};

// ============================================================
// DIAGNOSIS IDs USED FOR RISK CALCULATION
// ============================================================

// High-risk diagnoses: any ONE of these → high risk
const HIGH_RISK_DIAGNOSES = [
  'acv',                    // ACV previo
  'iam',                    // IAM previo
  'insuficiencia_cardiaca', // Insuficiencia cardíaca
  'enfermedad_renal',       // Enfermedad Renal Crónica
  'enfermedad_arterial_periferica', // Enfermedad arterial periférica
  'otras_ecv',              // Otras enfermedades cardiovasculares
];

// Diagnoses that with "daño órgano blanco" → high risk
const HIGH_RISK_WITH_ORGAN_DAMAGE = [
  'diabetes_tipo2',         // DM2 con daño de órgano
];

// Moderate-risk factor diagnoses
const MODERATE_RISK_DIAGNOSES = [
  'hta',                    // Hipertensión arterial
  'diabetes_tipo2',         // DM2 (sin daño de órgano)
  'dislipidemia',           // Dislipidemia
  'obesidad',               // Obesidad
  'tabaquismo',             // Tabaquismo
  'sindrome_metabolico',    // Síndrome metabólico
  'angina',                 // Angina (can be moderate if stable)
  'fibrilacion_auricular',  // Fibrilación auricular
];

// ============================================================
// RISK CALCULATION
// ============================================================

/**
 * Calculate cardiovascular risk based on patient diagnoses.
 * 
 * Rules (simplified, configurable):
 * - HIGH: Any established CV event (ACV, IAM, IC, EAP, ERC) 
 *   OR DM2 + organ damage OR multiple major factors (≥3)
 * - MODERATE: Has risk factors without established CV event
 * - LOW: No significant risk factors
 * 
 * @param diagnoses - Array of diagnosis IDs from the patient record
 * @returns Calculated cardiovascular risk level
 */
/**
 * Determines if a patient should default into the cardiovascular program
 * based on having any CV-relevant diagnosis.
 */
export function shouldDefaultToCardiovascularProgram(diagnoses: string[] | null): boolean {
  if (!diagnoses || diagnoses.length === 0) return false;
  const allCVDiagnoses = [...HIGH_RISK_DIAGNOSES, ...HIGH_RISK_WITH_ORGAN_DAMAGE, ...MODERATE_RISK_DIAGNOSES, 'dano_organo_blanco'];
  return diagnoses.some(d => allCVDiagnoses.includes(d));
}

export function calculateCardiovascularRisk(diagnoses: string[] | null): CardiovascularRisk {
  if (!diagnoses || diagnoses.length === 0) return 'bajo';

  // Check for high-risk diagnoses (any single one = high)
  const hasHighRiskDiagnosis = diagnoses.some(d => HIGH_RISK_DIAGNOSES.includes(d));
  if (hasHighRiskDiagnosis) return 'alto';

  // Check for DM2 + organ damage combination
  const hasDM2 = diagnoses.includes('diabetes_tipo2');
  const hasOrganDamage = diagnoses.includes('dano_organo_blanco');
  if (hasDM2 && hasOrganDamage) return 'alto';

  // Count moderate risk factors
  const moderateFactorCount = diagnoses.filter(d => MODERATE_RISK_DIAGNOSES.includes(d)).length;

  // Multiple major factors combined (≥3) → high risk
  if (moderateFactorCount >= 3) return 'alto';

  // Has any moderate risk factors → moderate
  if (moderateFactorCount >= 1) return 'moderado';

  return 'bajo';
}

// ============================================================
// FOLLOW-UP INTERVAL
// ============================================================

/**
 * Get the follow-up interval in months based on cardiovascular risk.
 * 
 * Real establishment logic:
 * - RCV bajo: 4 months
 * - RCV moderado: 3 months
 * - RCV alto: 3 months
 */
export function getFollowUpIntervalMonths(risk: CardiovascularRisk): number {
  switch (risk) {
    case 'bajo': return 4;
    case 'moderado': return 3;
    case 'alto': return 3;
    default: return 3;
  }
}

/**
 * Calculate the next control date based on last control date and risk.
 */
export function calculateNextControlDate(
  lastControlDate: Date | string,
  risk: CardiovascularRisk
): Date {
  const date = typeof lastControlDate === 'string' ? new Date(lastControlDate + 'T12:00:00') : new Date(lastControlDate);
  const months = getFollowUpIntervalMonths(risk);
  date.setMonth(date.getMonth() + months);
  return date;
}

// ============================================================
// PROFESSIONAL ROTATION
// ============================================================

/**
 * Get the next professional in the cardiovascular follow-up cycle.
 * 
 * Cycle: Médico → Nutricionista → Enfermera → Médico → ...
 */
export function getNextCardiovascularProfessional(lastProfessional: CVProfessional): CVProfessional {
  switch (lastProfessional) {
    case 'medico': return 'nutricionista';
    case 'nutricionista': return 'enfermera';
    case 'enfermera': return 'medico';
    default: return 'medico';
  }
}

// ============================================================
// FOLLOW-UP STATUS
// ============================================================

/**
 * Calculate the current follow-up status based on next control date.
 */
export function calculateFollowUpStatus(
  nextControlDate: Date | string | null
): CVFollowUpStatus {
  if (!nextControlDate) return 'al_dia';

  const next = typeof nextControlDate === 'string' 
    ? new Date(nextControlDate + 'T12:00:00') 
    : new Date(nextControlDate);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const diffMs = next.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -LOST_FOLLOWUP_THRESHOLD_DAYS) {
    return 'perdido_seguimiento';
  }
  if (diffDays < 0) {
    return 'control_vencido';
  }
  if (diffDays <= NEAR_CONTROL_THRESHOLD_DAYS) {
    return 'proximo_cercano';
  }
  return 'al_dia';
}

// ============================================================
// FORMAT HELPERS
// ============================================================

export function formatDateES(date: Date | string | null): string {
  if (!date) return 'Sin registro';
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Manual override event reasons
 */
export const OVERRIDE_REASONS = [
  'Paciente inasistente',
  'Reagendado',
  'Control realizado fuera de plazo',
  'Ingreso extraordinario a flujo',
  'Paciente perdido en seguimiento',
  'Otro',
] as const;
