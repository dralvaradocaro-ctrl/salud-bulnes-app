import regiones from '@/data/chile_regiones.json';
import { dateParts, FORM_WIDTH, FORM_HEIGHT, isPriorityField } from '@/lib/coquelucheForm';

const position = (field) => ({
  left: `${field.x / FORM_WIDTH * 100}%`, top: `${field.y / FORM_HEIGHT * 100}%`,
  width: `${field.w / FORM_WIDTH * 100}%`, height: `${field.h / FORM_HEIGHT * 100}%`,
});

export function fieldOptions(field, data) {
  if (field.type === 'region') return regiones.map(r => r.nombre);
  if (field.type === 'comuna') return regiones.find(r => r.nombre === data.region)?.comunas || [];
  if (field.type === 'choice') return field.options.map(o => o.value);
  return field.values || [];
}

export default function CoquelucheField({ field, data, onChange, inline = false }) {
  const value = data[field.id];
  const priority = isPriorityField(field, data);
  const pending = priority && !String(value ?? '').trim();
  const label = field.group ? `${field.group}: ${field.label}` : field.label;
  const set = (next) => onChange(field.id, next);
  const select = ['region', 'comuna', 'select', 'choice'].includes(field.type);
  const id = `${inline ? 'documento' : 'popup'}-${field.id}`;
  const inputProps = {
    id, 'aria-label': label, value: value ?? '', onChange: e => set(e.target.value),
    'data-pending': pending || undefined,
    'aria-describedby': priority ? 'coq-priority-help' : undefined,
    title: field.type === 'comuna' && !data.region ? 'Seleccione primero una región' : `${label}${priority ? ' · Obligatorio (no bloquea la impresión)' : ''}`,
    className: inline ? 'coq-inline-input' : 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
  };

  if (inline && field.type === 'choice') return field.options.map(option => (
    <button key={option.value} type="button" title={`${label}: ${option.value}`} aria-label={`${label}: ${option.value}`}
      aria-pressed={value === option.value} data-pending={pending || undefined} aria-describedby={priority ? 'coq-priority-help' : undefined} className="coq-mark"
      style={position({ ...field, x: option.x, y: option.y })}
      onClick={() => set(value === option.value ? '' : option.value)}>
      {value === option.value ? '×' : ''}
    </button>
  ));

  if (field.type === 'checkbox') {
    if (inline) return <button type="button" className="coq-mark" style={position(field)} aria-label={label}
      title={label} aria-pressed={Boolean(value)} onClick={() => set(!value)}>{value ? '×' : ''}</button>;
    return <label className="flex items-center gap-2 py-2 text-sm text-slate-800" htmlFor={id}>
      <input id={id} type="checkbox" checked={Boolean(value)} onChange={e => set(e.target.checked)} className="h-4 w-4" />{field.label}
    </label>;
  }

  let control;
  if (select) control = <select {...inputProps} disabled={field.type === 'comuna' && !data.region}>
    <option value="">{inline ? '' : field.type === 'comuna' && !data.region ? 'Seleccione primero una región' : 'Sin completar'}</option>
    {fieldOptions(field, data).map(option => <option key={option} value={option}>{option}</option>)}
  </select>;
  else control = <input {...inputProps} type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
    min={field.type === 'number' ? '0' : undefined} step={field.step || (field.type === 'number' ? '1' : undefined)} />;

  if (!inline) return <div className="space-y-1"><label htmlFor={id} className="block text-sm font-medium text-slate-700">{field.label}{priority && <span className="ml-1 text-xs font-semibold text-amber-700">* Obligatorio</span>}</label>{control}</div>;

  // Fit long institutional names in the spaces provided by the original form.
  const fontSize = Math.min(17, (field.w - 4) / Math.max(String(value || '').length * 0.54, 1));
  if (field.type === 'date') return <div className="coq-date" data-pending={pending || undefined} style={position(field)}>
    <span aria-hidden="true">{dateParts(value).map((part, i) => <span key={i}>{part}</span>)}</span>
    {control}
  </div>;
  return <div className="coq-field" style={{ ...position(field), fontSize: `${fontSize / FORM_WIDTH * 100}cqw` }}>{control}</div>;
}
