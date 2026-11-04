import fields from './application-fields.json';

export const applicationFields = fields;
export const initialApplicationValues = Object.fromEntries(fields.map(field => [field.key, field.default]));
const fieldMap = Object.fromEntries(fields.map(field => [field.key, field]));

export function createApplicationValues(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return { ...initialApplicationValues, fechaDocumento: `${date.year}-${date.month}-${date.day}` };
}

export function formatApplicationValue(key, value) {
  if (key === 'fechaDocumento' && /^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    return value.split('-').reverse().join('/');
  }
  return value || '';
}

export function updateApplicationValue(values, key, value) {
  const field = fieldMap[key];
  if (!field) return values;
  const next = { ...values, [key]: Array.isArray(value) ? value : String(value).slice(0, field.maxLength) };
  const previousSignature = [values.nombre, values.cargo].filter(Boolean).join(', ');
  if ((key === 'nombre' || key === 'cargo') && (!values.firmaNombre || values.firmaNombre === previousSignature)) {
    next.firmaNombre = [next.nombre, next.cargo].filter(Boolean).join(', ');
  }
  return next;
}

export function toggleApplicationOption(values, key, option) {
  const field = fieldMap[key];
  if (!field?.options?.some(item => item.value === option)) return values;
  const selected = values[key];
  const value = field.type === 'checkboxes'
    ? (selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option])
    : (selected === option ? '' : option);
  return updateApplicationValue(values, key, value);
}

export function renderApplication(template, values, { editable = false } = {}) {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key.includes('__')) {
      const [field, option] = key.split('__');
      const selected = Array.isArray(values[field]) ? values[field].includes(option) : values[field] === option;
      if (!editable) return `<span class="selection">${selected ? 'X' : ' '}</span>`;
      const label = `${fieldMap[field].label}: ${fieldMap[field].options.find(item => item.value === option).label}`;
      return `<button type="button" class="selection option-toggle" data-field="${field}" data-option="${option}" aria-label="${escape(label)}" aria-pressed="${selected}">${selected ? 'X' : ' '}</button>`;
    }
    const value = values[key] || '';
    if (!editable) return `<span class="value">${escape(formatApplicationValue(key, value))}</span>`;
    const field = fieldMap[key];
    const attributes = `data-field="${key}" aria-label="${escape(field.label)}"`;
    const printValue = `<span class="print-value" data-print-field="${key}">${escape(formatApplicationValue(key, value))}</span>`;
    if (field.type === 'select') {
      return `<select class="inline-control" ${attributes}><option value="">—</option>${field.options.map(option => `<option value="${option.value}"${option.value === value ? ' selected' : ''}>${escape(option.label)}</option>`).join('')}</select>${printValue}`;
    }
    if (field.type === 'date' || field.type === 'number') {
      const limits = field.type === 'number' ? ` min="0"${key === 'porcentaje' ? ' max="100"' : ''}` : '';
      return `<input class="inline-control ${field.type}-field" ${attributes} type="${field.type}" value="${escape(value)}"${limits}>${printValue}`;
    }
    return `<span class="value editable-text" contenteditable="plaintext-only" role="textbox" aria-multiline="true" tabindex="0" ${attributes}>${escape(value)}</span>`;
  });
}
