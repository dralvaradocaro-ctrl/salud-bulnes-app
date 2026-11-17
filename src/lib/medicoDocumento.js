import { MEDICO } from '@/lib/certificadoPdf';
import { validateRut } from '@/lib/rut-ges';

const KEY = 'medico_documentos_v1';
export const medicoCompleto = medico => Boolean(medico?.nombre?.trim() && medico?.titulo?.trim() && validateRut(medico?.rut || ''));
const normalizar = texto => String(texto || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[.\s-]/g, '').toLowerCase();
export const puedeUsarFirma = medico => normalizar(medico.nombre) === normalizar(MEDICO.nombre) && normalizar(medico.rut) === normalizar(MEDICO.rut);
export function leerMedicoDocumento() {
  try {
    const medico = JSON.parse(sessionStorage.getItem(KEY));
    if (medicoCompleto(medico)) return medico;
  } catch { /* Sin almacenamiento disponible. */ }
  return { ...MEDICO };
}
export function guardarMedicoDocumento(medico) {
  if (!medicoCompleto(medico)) return;
  try { sessionStorage.setItem(KEY, JSON.stringify(medico)); } catch { /* Mantener datos en el formulario. */ }
}
