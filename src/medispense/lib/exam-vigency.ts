/**
 * Exam Vigency Calculation
 * 
 * Rules:
 * - Lab: 1 year validity
 * - ECG: 1 year validity
 * - Fundoscopy: 2 years (DM2 without retinopathy), no auto-calc if retinopathy
 * 
 * States:
 * - Vigente: not expired
 * - Próximo a vencer: < 30 days remaining
 * - Vencido: past expiry
 */

export type ExamStatus = 'vigente' | 'proximo_a_vencer' | 'vencido' | 'sin_registro' | 'no_aplica';

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  vigente: 'Vigente',
  proximo_a_vencer: 'Próximo a vencer',
  vencido: 'Vencido',
  sin_registro: 'Sin registro',
  no_aplica: 'No aplica',
};

export const EXAM_STATUS_COLORS: Record<ExamStatus, string> = {
  vigente: 'bg-success text-success-foreground',
  proximo_a_vencer: 'bg-warning text-warning-foreground',
  vencido: 'bg-destructive text-destructive-foreground',
  sin_registro: 'bg-muted text-muted-foreground',
  no_aplica: 'bg-muted text-muted-foreground',
};

/** Near expiry threshold in days */
const NEAR_EXPIRY_DAYS = 30;

export interface ExamInfo {
  name: string;
  lastDate: string | null;
  expiryDate: string | null;
  status: ExamStatus;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function calcStatus(expiryDate: Date | null): ExamStatus {
  if (!expiryDate) return 'sin_registro';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'vencido';
  if (diffDays <= NEAR_EXPIRY_DAYS) return 'proximo_a_vencer';
  return 'vigente';
}

function parseDate(d: string | null): Date | null {
  if (!d) return null;
  return new Date(d + 'T12:00:00');
}

export function calculateLabExam(lastDate: string | null): ExamInfo {
  const parsed = parseDate(lastDate);
  const expiry = parsed ? addYears(parsed, 1) : null;
  return {
    name: 'Laboratorio',
    lastDate,
    expiryDate: expiry ? expiry.toISOString().split('T')[0] : null,
    status: parsed ? calcStatus(expiry) : 'sin_registro',
  };
}

export function calculateEcgExam(lastDate: string | null): ExamInfo {
  const parsed = parseDate(lastDate);
  const expiry = parsed ? addYears(parsed, 1) : null;
  return {
    name: 'Electrocardiograma',
    lastDate,
    expiryDate: expiry ? expiry.toISOString().split('T')[0] : null,
    status: parsed ? calcStatus(expiry) : 'sin_registro',
  };
}

export function calculateFundoscopyExam(
  lastDate: string | null,
  hasDM2: boolean,
  hasDiabeticRetinopathy: boolean,
): ExamInfo {
  const parsed = parseDate(lastDate);
  
  // If retinopathy, don't auto-calculate
  if (hasDiabeticRetinopathy) {
    return {
      name: 'Fondo de ojo',
      lastDate,
      expiryDate: null,
      status: parsed ? 'no_aplica' : 'sin_registro',
    };
  }

  // DM2 without retinopathy: 2 years
  const validityYears = hasDM2 ? 2 : 2; // default 2 years for all
  const expiry = parsed ? addYears(parsed, validityYears) : null;

  return {
    name: 'Fondo de ojo',
    lastDate,
    expiryDate: expiry ? expiry.toISOString().split('T')[0] : null,
    status: parsed ? calcStatus(expiry) : 'sin_registro',
  };
}

export function getAllExams(
  lastLabDate: string | null,
  lastEcgDate: string | null,
  lastFundoscopyDate: string | null,
  hasDM2: boolean,
  hasDiabeticRetinopathy: boolean,
): ExamInfo[] {
  const exams = [
    calculateLabExam(lastLabDate),
    calculateEcgExam(lastEcgDate),
  ];
  // Only include fundoscopy for diabetic patients
  if (hasDM2) {
    exams.push(calculateFundoscopyExam(lastFundoscopyDate, hasDM2, hasDiabeticRetinopathy));
  }
  return exams;
}

export function hasAnyExpiredExam(exams: ExamInfo[]): boolean {
  return exams.some(e => e.status === 'vencido' || e.status === 'proximo_a_vencer');
}

export function formatExamDate(date: string | null): string {
  if (!date) return 'Sin registro';
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}
