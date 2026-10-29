import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ageFromBirthDate, expandPatientProfile } from './patientProfile';

const KEY = 'salud_bulnes_paciente_general_v1';
const Context = createContext(null);
export function permitePacienteGeneral(page, search = '') {
  return !/Hospitalizados|PROA|OperacionClinica|GestionCardiovascular|PrescripcionInteligente|Admin/i.test(page || '')
    && !new URLSearchParams(search).has('contextoClinico')
    && !new URLSearchParams(search).has('bed');
}
function leer() {
  try {
    const p = JSON.parse(sessionStorage.getItem(KEY));
    return p && typeof p.nombre === 'string' && typeof p.rut === 'string'
      ? { diagnostico: '', fechaNacimiento: '', ...p, edad: ageFromBirthDate(p.fechaNacimiento) }
      : null;
  } catch { return null; }
}
export function PacienteGeneralProvider({ enabled, children }) {
  const [paciente, setPaciente] = useState(leer);
  const actualizar = datos => {
    const next = { nombre: datos.nombre || '', rut: datos.rut || '', diagnostico: datos.diagnostico || '', fechaNacimiento: datos.fechaNacimiento || '' };
    setPaciente({ ...next, edad: ageFromBirthDate(next.fechaNacimiento) });
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* session-only memory fallback */ }
  };
  return <Context.Provider value={enabled ? { paciente, actualizar } : null}>{children}</Context.Provider>;
}
export const usePacienteGeneral = () => useContext(Context);
// Only a change of the shared identity updates a mounted form; ordinary edits
// to the form do not trigger a reset. No clinical inputs/results are copied.
export function useAplicarPacienteGeneral(aplicar, enabled = true) {
  const general = usePacienteGeneral();
  const callback = useRef(aplicar);
  callback.current = aplicar;
  const paciente = enabled ? general?.paciente : null;
  useEffect(() => {
    if (paciente) callback.current(paciente);
  }, [paciente]);
  return paciente;
}

// El paciente actual con los nombres del perfil compartido (patient_name, patient_rut,
// patient_fecha_nac, patient_edad, diagnostico…), para formularios que ya leen ese formato.
export const perfilPacienteGeneral = p => expandPatientProfile({
  patient_name: p.nombre, patient_rut: p.rut, patient_fecha_nac: p.fechaNacimiento, diagnostico: p.diagnostico,
});
export const useAplicarPerfilPacienteGeneral = (aplicar, enabled = true) =>
  useAplicarPacienteGeneral(p => aplicar(perfilPacienteGeneral(p)), enabled);
