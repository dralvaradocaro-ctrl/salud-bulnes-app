export const resources = [
  { key: 'retina', label: 'Retinopatía diabética', id: '696ea74c245ef362de4f4337', group: 'Flujos' },
  { key: 'hta', label: 'HTA · HEARTS', id: '696ea74c245ef362de4f433a', group: 'Flujos' },
  { key: 'dm2', label: 'Diabetes mellitus tipo 2', id: '696ea74c245ef362de4f4339', group: 'Flujos' },
  { key: 'erc', label: 'Enfermedad renal crónica · etapas 4 y 5', id: '696efcff77924d3a78533dd4', group: 'Protocolos' },
  { key: 'prevencion-erc', label: 'Prevención secundaria de ERC', id: '2d31e828-cf69-4a64-8274-6e706b2bf74a', group: 'Protocolos' },
  { key: 'via-dm', label: 'Vía clínica de diabetes · documento local', group: 'Protocolos' },
  { key: 'isglt2', label: 'Indicaciones locales de iSGLT2', group: 'Protocolos' },
  { key: 'idpp4', label: 'Indicaciones locales de iDPP4', group: 'Protocolos' },
  { key: 'heridas', label: 'Manejo avanzado de heridas', group: 'Heridas' },
];
export const rosterGroups = ['Retinopatía', 'HTA / HEARTS', 'DM2', 'ERC', 'Heridas', 'Otros'];
export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function safeResourceUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
export function calendarDays(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return [...Array(offset).fill(null), ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)];
}
