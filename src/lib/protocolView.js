// Preferencia de vista para el detalle de protocolos: 'clasica' (actual) o 'modular' (nueva, en prueba).
// ?vista=modular o ?vista=clasica en la URL manda sobre lo guardado y queda recordado.
export const PROTOCOL_VIEW_KEY = 'salud-bulnes-protocol-view';
export const PROTOCOL_VIEWS = ['clasica', 'modular'];
export const DEFAULT_PROTOCOL_VIEW = 'clasica';

export function resolveProtocolView(search = '', stored = null) {
  const fromUrl = new URLSearchParams(search).get('vista');
  if (PROTOCOL_VIEWS.includes(fromUrl)) return fromUrl;
  if (PROTOCOL_VIEWS.includes(stored)) return stored;
  return DEFAULT_PROTOCOL_VIEW;
}

export function readStoredProtocolView() {
  try { return localStorage.getItem(PROTOCOL_VIEW_KEY); } catch { return null; }
}

export function storeProtocolView(view) {
  try { localStorage.setItem(PROTOCOL_VIEW_KEY, view); } catch { /* Sin almacenamiento: vale solo para esta visita. */ }
}
