import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HospitalCareDocuments from '@/components/hospitalizados/HospitalCareDocuments';
import { getMultiPrefill } from '@/lib/multiTemplatePrefill';
import { usePacienteGeneral } from '@/lib/PacienteGeneral';

// Acceso desde Formularios: el mismo documento de adecuación / límites terapéuticos
// que se abre desde la cama, prellenado con el paciente del generador múltiple si existe.
function patientFromPrefill() {
  const p = getMultiPrefill();
  if (!p) return null;
  return {
    nombre: p.patient_name || '', rut: p.patient_rut || '', edad: p.edad || '',
    diagnosticoPrincipal: p.diagnostico_principal || p.diagnostico || '',
    resumenCaso: p.resumen_caso || p.clinical_text || '', antecedentes: p.antecedentes_relevantes || p.antecedentes || '',
  };
}

export default function AdecuacionTerapeutica() {
  const navigate = useNavigate();
  const [prefill] = useState(patientFromPrefill);
  const general = usePacienteGeneral()?.paciente;
  // Sin datos del generador múltiple, usa el paciente actual (botón de usuario).
  const patient = useMemo(() => prefill || (general ? { nombre: general.nombre, rut: general.rut, edad: general.edad, diagnosticoPrincipal: general.diagnostico } : null), [prefill, general]);
  return <div className="min-h-screen bg-slate-100"><HospitalCareDocuments open patient={patient} bed={null} onClose={() => navigate(-1)} /></div>;
}
