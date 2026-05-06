const MONTHS = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

/**
 * Parses a Spanish month-year string like "Febrero 2031" into a Date (last day of that month).
 * Returns null if unparseable.
 */
export function parseSpanishDate(str) {
  if (!str) return null;
  const parts = str.trim().toLowerCase().split(/\s+/);
  if (parts.length < 2) return null;
  const month = MONTHS[parts[0]];
  const year = parseInt(parts[parts.length - 1], 10);
  if (month === undefined || isNaN(year)) return null;
  // Use last day of the month as the expiry boundary
  return new Date(year, month + 1, 0);
}

/**
 * Returns 'vencido' | 'proximo' | 'vigente' | null based on protocol_validity string.
 * 'proximo' = expires within 6 months from today.
 */
export function getProtocolValidityStatus(protocol_validity) {
  const expiry = parseSpanishDate(protocol_validity);
  if (!expiry) return null;
  const now = new Date();
  if (expiry < now) return 'vencido';
  const sixMonths = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
  if (expiry <= sixMonths) return 'proximo';
  return 'vigente';
}
