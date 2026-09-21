// Las fuentes estándar de jsPDF (Times, Helvetica, Courier) solo cubren
// Latin-1. Un carácter fuera de ese rango (O₂, m², ≥, comillas tipográficas…)
// hace que jsPDF escriba la línea completa en codificación de dos bytes: las
// letras salen espaciadas, la línea duplica su ancho y se sale del margen.
//
// `pdfSafe` reemplaza esos caracteres por equivalentes seguros y
// `sanitizeJsPdf` envuelve una instancia de jsPDF para que text(),
// splitTextToSize() y getTextWidth() limpien todo lo que reciben.

const PDF_CHAR_MAP = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '≥': '>=', '≤': '<=', '≠': '!=', '→': '->', '←': '<-',
  '↑': '^', '↓': 'v', '–': '-', '—': '-', '−': '-',
  '‘': "'", '’': "'", '‚': "'", '“': '"', '”': '"', '„': '"',
  '…': '...', '•': '-', ' ': ' ', ' ': ' ', ' ': ' ',
  'Δ': 'delta', 'β': 'beta', 'α': 'alfa', 'γ': 'gamma', 'λ': 'lambda',
  'μ': 'u', '℃': '°C', '‰': 'por mil', '€': 'EUR', '™': 'TM',
  '✓': 'v', '✔': 'v', '✗': 'x', '✘': 'x',
};

export const pdfSafe = value => String(value ?? '')
  .normalize('NFC')
  .replace(/[-￿]/g, ch => {
    if (PDF_CHAR_MAP[ch] !== undefined) return PDF_CHAR_MAP[ch];
    if (ch.charCodeAt(0) <= 0xff) return ch; // Latin-1: la fuente lo soporta
    const stripped = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return stripped && stripped.charCodeAt(0) <= 0xff ? stripped : '?';
  });

const safeArg = v => Array.isArray(v) ? v.map(safeArg) : typeof v === 'string' ? pdfSafe(v) : v;

/** Envuelve una instancia de jsPDF para que todo texto pase por pdfSafe. */
export function sanitizeJsPdf(doc) {
  for (const method of ['text', 'splitTextToSize', 'getTextWidth', 'getStringUnitWidth']) {
    const original = doc[method];
    if (typeof original !== 'function') continue;
    doc[method] = function (first, ...rest) {
      return original.call(this, safeArg(first), ...rest);
    };
  }
  return doc;
}
