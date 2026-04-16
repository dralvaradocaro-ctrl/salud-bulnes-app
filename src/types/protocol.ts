export type PatientGroup = 'sensible' | 'intermedio' | 'resistente';

export interface PatientData {
  // Datos demográficos
  edad: number;
  peso: number;
  imc: number;
  sexo: 'masculino' | 'femenino' | '';

  // Criterios clínicos
  corticoidesSistemicos: boolean;
  infeccionActiva: boolean;
  postoperatorioMayor: boolean;
  sop: boolean;
  hepatopatia: boolean;
  nefropatia: boolean;
  
  // Datos metabólicos
  glicemiaIngreso: number;
  hba1c: number;
  trigliceridos: number;
  creatinina: number; // mg/dL
  vfg: number;
  
  // Antecedentes
  usoPrevioNPH: number; // U/kg
  
  // Clasificación
  grupo?: PatientGroup;
}

export interface DoseRecommendation {
  glucoseRange: string;
  dose: number;
  comment: string;
  ukgRange?: string;
}

export interface ClassificationCriteria {
  criteriosMayores: string[];
  criteriosMenores: string[];
  cumple: boolean;
}
