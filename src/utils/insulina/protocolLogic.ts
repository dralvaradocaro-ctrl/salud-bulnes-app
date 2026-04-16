import { PatientData, PatientGroup, DoseRecommendation, ClassificationCriteria } from '@/types/protocol';

export function classifyPatient(data: PatientData): PatientGroup {
  // Primero verificar criterios de SENSIBILIDAD (tiene prioridad)
  const criteriaSensible = checkSensibleCriteria(data);
  if (criteriaSensible.cumple) {
    return 'sensible';
  }

  // Luego verificar criterios de RESISTENCIA
  const criteriaResistente = checkResistenteCriteria(data);
  if (criteriaResistente.cumple) {
    return 'resistente';
  }

  // Si no cumple ninguno de los anteriores, es INTERMEDIO
  return 'intermedio';
}

function checkSensibleCriteria(data: PatientData): ClassificationCriteria {
  const criteriosMayores: string[] = [];
  const criteriosMenores: string[] = [];

  // Criterios Mayores - ignorar si el valor no está disponible
  if (data.hba1c > 0 && data.hba1c < 7) {
    criteriosMayores.push('HbA1c < 7%');
  }
  if (data.vfg > 0 && data.vfg < 30) {
    criteriosMayores.push('ERC avanzada (VFG < 30 ml/min)');
  }
  if (data.hepatopatia) {
    criteriosMayores.push('Hepatopatía avanzada');
  }

  // Criterios Menores - ignorar si el valor no está disponible
  if (data.glicemiaIngreso > 0 && data.glicemiaIngreso >= 140 && data.glicemiaIngreso <= 179) {
    criteriosMenores.push('Glicemia de ingreso 140-179 mg/dL');
  }
  if (data.edad > 0 && data.edad > 75) {
    criteriosMenores.push('Edad > 75 años');
  }
  if (data.imc > 0 && data.imc < 22) {
    criteriosMenores.push('IMC < 22 / caquexia');
  }
  if (data.trigliceridos > 0 && data.trigliceridos < 150) {
    criteriosMenores.push('TG < 150 mg/dL');
  }

  // Cumple si tiene al menos 1 criterio mayor O combinación de menores que indiquen fragilidad
  const cumple = criteriosMayores.length >= 1 || criteriosMenores.length >= 2;

  return { criteriosMayores, criteriosMenores, cumple };
}

function checkResistenteCriteria(data: PatientData): ClassificationCriteria {
  const criteriosMayores: string[] = [];
  const criteriosMenores: string[] = [];

  // Criterios Mayores - ignorar si el valor no está disponible
  if (data.hba1c > 0 && data.hba1c >= 9) {
    criteriosMayores.push('HbA1c ≥ 9%');
  }
  if (data.corticoidesSistemicos) {
    criteriosMayores.push('Corticoides sistémicos activos');
  }
  if (data.infeccionActiva) {
    criteriosMayores.push('Infección activa con repercusión sistémica significativa');
  }
  if (data.postoperatorioMayor) {
    criteriosMayores.push('Postoperatorio mayor reciente');
  }
  if (data.usoPrevioNPH > 0.5) {
    criteriosMayores.push('NPH previa > 0.5 U/kg');
  }

  // Criterios Menores - ignorar si el valor no está disponible
  if (data.imc > 0 && data.imc >= 30) {
    criteriosMenores.push('IMC ≥ 30');
  }
  if (data.glicemiaIngreso > 0 && data.glicemiaIngreso >= 250) {
    criteriosMenores.push('Glicemia de ingreso ≥ 250 mg/dL');
  }
  if (data.sop && data.sexo === 'femenino') {
    criteriosMenores.push('Síndrome de Ovario Poliquístico');
  }
  if (data.trigliceridos > 0 && data.trigliceridos >= 200) {
    criteriosMenores.push('TG ≥ 200 mg/dL');
  }

  // Cumple si tiene al menos 1 criterio mayor O al menos 2 menores
  const cumple = criteriosMayores.length >= 1 || criteriosMenores.length >= 2;

  return { criteriosMayores, criteriosMenores, cumple };
}

export function getDoseRecommendations(grupo: PatientGroup, peso: number): DoseRecommendation[] {
  switch (grupo) {
    case 'sensible':
      return [
        { glucoseRange: '140-159', dose: 0, comment: 'Muy sensible, riesgo de hipoglicemia' },
        { glucoseRange: '160-179', dose: 0, comment: 'Ajustar según tolerancia' },
        { glucoseRange: '180-199', dose: 2, comment: 'Monitorear estrechamente' },
        { glucoseRange: '200-219', dose: 2, comment: 'Solo si persiste > 1 lectura' },
        { glucoseRange: '220-249', dose: 4, comment: 'Reevaluar dosis basal' },
        { glucoseRange: '≥ 250', dose: 6, comment: 'Riesgo alto, consultar médico' },
      ];

    case 'intermedio':
      return [
        { glucoseRange: '140-179', dose: Math.round((peso * 0.03) / 2) * 2, comment: 'Inicio conservador', ukgRange: '0.03 U/kg' },
        { glucoseRange: '180-219', dose: Math.round((peso * 0.06) / 2) * 2, comment: 'Ajuste moderado', ukgRange: '0.06 U/kg' },
        { glucoseRange: '220-249', dose: Math.round((peso * 0.06) / 2) * 2, comment: 'Incrementar según evolución', ukgRange: '0.06 U/kg' },
        { glucoseRange: '250-299', dose: Math.round((peso * 0.09) / 2) * 2, comment: 'Vigilancia y reevaluación', ukgRange: '0.09 U/kg' },
        { glucoseRange: '300-349', dose: Math.round((peso * 0.11) / 2) * 2, comment: 'Notificar médico si persiste', ukgRange: '0.11 U/kg' },
        { glucoseRange: '≥ 350', dose: Math.round((peso * 0.14) / 2) * 2, comment: 'Reevaluar esquema basal o IV', ukgRange: '0.14 U/kg' },
      ];

    case 'resistente':
      return [
        { glucoseRange: '140-179', dose: Math.round((peso * 0.06) / 2) * 2, comment: 'Dosis baja por inicio', ukgRange: '0.06 U/kg' },
        { glucoseRange: '180-219', dose: Math.round((peso * 0.09) / 2) * 2, comment: 'Ajustar según tendencia', ukgRange: '0.09 U/kg' },
        { glucoseRange: '220-249', dose: Math.round((peso * 0.11) / 2) * 2, comment: 'Incrementar con hiperglicemia', ukgRange: '0.11 U/kg' },
        { glucoseRange: '250-299', dose: Math.round((peso * 0.14) / 2) * 2, comment: 'Vigilancia más estrecha', ukgRange: '0.14 U/kg' },
        { glucoseRange: '300-349', dose: Math.round((peso * 0.17) / 2) * 2, comment: 'Evaluar causas de resistencia', ukgRange: '0.17 U/kg' },
        { glucoseRange: '≥ 350', dose: Math.round((peso * 0.20) / 2) * 2, comment: 'Considerar infusión IV', ukgRange: '0.20 U/kg' },
      ];
  }
}

export function getClassificationDetails(data: PatientData) {
  return {
    sensible: checkSensibleCriteria(data),
    resistente: checkResistenteCriteria(data),
    nefropatiaSinVFG: data.nefropatia && data.vfg <= 0,
  };
}
