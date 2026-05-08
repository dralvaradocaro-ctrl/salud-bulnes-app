export const DIAGNOSIS_OPTIONS = [
  { id: 'hta', label: 'Hipertensión Arterial' },
  { id: 'diabetes_tipo2', label: 'Diabetes Mellitus Tipo 2' },
  { id: 'dislipidemia', label: 'Dislipidemia' },
  { id: 'obesidad', label: 'Obesidad' },
  { id: 'tabaquismo', label: 'Tabaquismo' },
  { id: 'enfermedad_renal', label: 'Enfermedad Renal Crónica' },
  { id: 'acv', label: 'ACV (Accidente Cerebrovascular)' },
  { id: 'iam', label: 'IAM (Infarto Agudo al Miocardio)' },
  { id: 'insuficiencia_cardiaca', label: 'Insuficiencia Cardíaca' },
  { id: 'enfermedad_arterial_periferica', label: 'Enfermedad Arterial Periférica' },
  { id: 'sindrome_metabolico', label: 'Síndrome Metabólico' },
  { id: 'dano_organo_blanco', label: 'Daño de Órgano Blanco' },
  { id: 'angina', label: 'Angina' },
  { id: 'fibrilacion_auricular', label: 'Fibrilación Auricular' },
  { id: 'enfermedad_hepatica', label: 'Enfermedad Hepática' },
  { id: 'otras_ecv', label: 'Otras Enfermedades Cardiovasculares' },
  { id: 'glicemia_alterada_ayuno', label: 'Glicemia Alterada de Ayuno' },
  { id: 'intolerancia_glucosa_oral', label: 'Intolerancia a la Glucosa Oral' },
];

export const DIAGNOSIS_LABELS: Record<string, string> = Object.fromEntries(
  DIAGNOSIS_OPTIONS.map(d => [d.id, d.label])
);
