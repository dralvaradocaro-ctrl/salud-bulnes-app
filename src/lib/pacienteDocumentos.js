import { getMultiPrefill } from '@/lib/multiTemplatePrefill';
import { formatRut } from '@/lib/rut-ges';

const KEY = 'pacienteDocumentos_v1';
const CAMPOS = ['paciente', 'rut', 'edad', 'direccion', 'diagnostico', 'institucion'];
let memoria = null;
const filtrar = datos => Object.fromEntries(CAMPOS.filter(c => typeof datos[c] === 'string').map(c => [c, datos[c]]));
function leerGuardado() {
  try { memoria = JSON.parse(sessionStorage.getItem(KEY)) || memoria; } catch { /* modo privado */ }
  return memoria?.datos || null;
}
export function leerPacienteDocumentos() {
  const guardado = leerGuardado();
  if (guardado) return filtrar(guardado);
  const p = getMultiPrefill();
  if (!p) return {};
  const datos = {
    paciente: p.patient_name || '', rut: formatRut(p.patient_rut || ''),
    edad: String(p.patient_age ?? p.edad ?? ''), direccion: p.patient_direccion || '',
    diagnostico: p.diagnostico_principal || p.diagnostico || '',
  };
  guardarPacienteDocumentos(datos);
  return { ...datos, desdeMulti: true };
}
export function guardarPacienteDocumentos(datos) {
  memoria = { datos: { ...filtrar(leerGuardado() || {}), ...filtrar(datos) }, ts: Date.now() };
  try { sessionStorage.setItem(KEY, JSON.stringify(memoria)); } catch { /* conservar en memoria */ }
}
export function limpiarPacienteDocumentos() {
  // Guardar vacío evita volver a importar un paciente anterior del generador múltiple.
  memoria = { datos: {}, ts: Date.now() };
  try { sessionStorage.setItem(KEY, JSON.stringify(memoria)); } catch { /* conservar en memoria */ }
}
