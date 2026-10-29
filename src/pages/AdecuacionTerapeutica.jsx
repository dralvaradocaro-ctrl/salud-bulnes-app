import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HospitalCareDocuments from '@/components/hospitalizados/HospitalCareDocuments';
import { getMultiPrefill } from '@/lib/multiTemplatePrefill';

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
  const [patient] = useState(patientFromPrefill);
  return <div className="min-h-screen bg-slate-100"><HospitalCareDocuments open patient={patient} bed={null} onClose={() => navigate(-1)} /></div>;
}
