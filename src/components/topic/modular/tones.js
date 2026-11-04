// Un tono por tipo de contenido; todos los bloques de la vista modular comparten esta paleta.
export const TONES = {
  blue:    { icon: 'bg-blue-50 text-blue-700',   soft: 'bg-blue-50',  ink: 'text-blue-900',  dot: 'bg-blue-600',  solid: 'bg-blue-700',  border: 'border-blue-700' },
  teal:    { icon: 'bg-teal-50 text-teal-700',   soft: 'bg-teal-50',  ink: 'text-teal-900',  dot: 'bg-teal-600',  solid: 'bg-teal-700',  border: 'border-teal-700' },
  amber:   { icon: 'bg-amber-50 text-amber-700', soft: 'bg-amber-50', ink: 'text-amber-900', dot: 'bg-amber-500', solid: 'bg-amber-700', border: 'border-amber-700' },
  red:     { icon: 'bg-red-50 text-red-700',     soft: 'bg-red-50',   ink: 'text-red-900',   dot: 'bg-red-600',   solid: 'bg-red-700',   border: 'border-red-700' },
  neutral: { icon: 'bg-slate-100 text-slate-700', soft: 'bg-slate-50', ink: 'text-slate-900', dot: 'bg-slate-500', solid: 'bg-slate-700', border: 'border-slate-700' },
};

// Colores guardados en los bloques (blue, purple, green, orange, amber, red) → tono de la vista modular.
export function toneFromColor(color, fallback = 'blue') {
  switch (color) {
    case 'red': return 'red';
    case 'amber':
    case 'orange': return 'amber';
    case 'green': return 'teal';
    case 'blue':
    case 'purple': return 'blue';
    default: return fallback;
  }
}
