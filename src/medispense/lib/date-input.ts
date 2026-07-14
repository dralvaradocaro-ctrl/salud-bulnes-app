/**
 * Entrada de fechas escritas a mano, en dd-mm-aaaa.
 */

/** Parsea dd-mm-aaaa o aaaa-mm-dd. Devuelve null si la fecha no existe. */
export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const build = (y: number, m: number, day: number): Date | null => {
    const d = new Date(y, m - 1, day);
    // Descarta fechas que no existen (31-02 rebotaría al 3 de marzo).
    if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== m - 1) return null;
    return d;
  };
  const dmy = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) return build(parseInt(dmy[3]), parseInt(dmy[2]), parseInt(dmy[1]));
  const ymd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) return build(parseInt(ymd[1]), parseInt(ymd[2]), parseInt(ymd[3]));
  return null;
}

/**
 * Va poniendo los guiones a medida que se escribe: 12052025 -> 12-05-2025.
 * Deja pasar tal cual el formato aaaa-mm-dd, para no romper un pegado.
 */
export function maskDateInput(value: string): string {
  if (/^\d{4}-\d{0,2}-?\d{0,2}$/.test(value)) return value;
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/** Fecha a 'aaaa-mm-dd' en hora local (toISOString correría un día hacia atrás). */
export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
