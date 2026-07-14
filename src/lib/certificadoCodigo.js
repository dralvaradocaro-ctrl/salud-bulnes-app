// Código único + payload firmable-en-URL para verificar un certificado sin backend.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin caracteres ambiguos

export function generarCodigo(fechaIso) {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  const ymd = fechaIso.replace(/-/g, '');
  return `CM-${ymd}-${rand.slice(0, 3)}${rand.slice(3)}`;
}

export function encodePayload(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePayload(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

const REGISTRO_KEY = 'inalab_certificados_emitidos';

export function registrarCertificado(cert) {
  try {
    const prev = JSON.parse(localStorage.getItem(REGISTRO_KEY) || '[]');
    const next = [{ ...cert, emitido_en: new Date().toISOString() }, ...prev].slice(0, 200);
    localStorage.setItem(REGISTRO_KEY, JSON.stringify(next));
  } catch { /* localStorage lleno o bloqueado: la emisión no depende de esto */ }
}

export function leerRegistro() {
  try {
    return JSON.parse(localStorage.getItem(REGISTRO_KEY) || '[]');
  } catch {
    return [];
  }
}
