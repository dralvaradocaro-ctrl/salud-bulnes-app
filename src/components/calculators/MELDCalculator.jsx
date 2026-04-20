import { Activity } from 'lucide-react';

import CalculatorTemplate from '@/components/calculator/CalculatorTemplate';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const meldConfig = {
  title: 'MELD 3.0',
  description: 'Modelo para enfermedad hepática terminal en adultos (>=18 años)',
  icon: Activity,
  gradientFrom: 'amber',
  gradientTo: 'orange',
  inputs: [
    {
      id: 'sex',
      label: 'Sexo',
      type: 'select',
      required: true,
      options: [
        { value: 'male', label: 'Masculino' },
        { value: 'female', label: 'Femenino' }
      ]
    },
    {
      id: 'bilirubin',
      label: 'Bilirrubina total',
      type: 'number',
      unit: 'mg/dL',
      required: true,
      min: 0
    },
    {
      id: 'sodium',
      label: 'Sodio sérico',
      type: 'number',
      unit: 'mEq/L',
      required: true,
      min: 100
    },
    {
      id: 'inr',
      label: 'INR',
      type: 'number',
      required: true,
      min: 0
    },
    {
      id: 'creatinine',
      label: 'Creatinina sérica',
      type: 'number',
      unit: 'mg/dL',
      required: true,
      min: 0
    },
    {
      id: 'albumin',
      label: 'Albúmina sérica',
      type: 'number',
      unit: 'g/dL',
      required: true,
      min: 0
    },
    {
      id: 'dialysis',
      label: 'Diálisis reciente (2 sesiones/7 días o 24 h de CVVHD)',
      type: 'select',
      required: true,
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Sí' }
      ],
      default: 'no'
    }
  ],
  references: [
    {
      label: 'HRSA/OPTN MELD Calculator: modelo y actualización vigente',
      url: 'https://www.hrsa.gov/optn/data/allocation-calculators/meld-calculator'
    },
    {
      label: 'OPTN User Guide: fórmula MELD 3.0, límites y ajustes de laboratorio',
      url: 'https://optn.transplant.hrsa.gov/media/qmsdjqst/meld-peld-calculator-user-guide.pdf'
    },
    {
      label: 'Hepatitis C Online: fórmula MELD 3.0 y mortalidad estimada a 90 días',
      url: 'https://www.hepatitisc.uw.edu/page/clinical-calculators/meld'
    }
  ],
  calculate: (inputs) => {
    const adjustedBilirubin = Math.max(inputs.bilirubin, 1);
    const adjustedInr = Math.max(inputs.inr, 1);
    const adjustedSodium = clamp(inputs.sodium, 125, 137);
    const adjustedAlbumin = clamp(inputs.albumin, 1.5, 3.5);
    const adjustedCreatinine = inputs.dialysis === 'yes'
      ? 3
      : clamp(Math.max(inputs.creatinine, 1), 1, 3);

    const rawScore = (
      (inputs.sex === 'female' ? 1.33 : 0) +
      (4.56 * Math.log(adjustedBilirubin)) +
      (0.82 * (137 - adjustedSodium)) -
      (0.24 * (137 - adjustedSodium) * Math.log(adjustedBilirubin)) +
      (9.09 * Math.log(adjustedInr)) +
      (11.14 * Math.log(adjustedCreatinine)) +
      (1.85 * (3.5 - adjustedAlbumin)) -
      (1.83 * (3.5 - adjustedAlbumin) * Math.log(adjustedCreatinine)) +
      6
    );

    const score = clamp(Math.round(rawScore), 6, 40);
    const survival = Math.pow(0.946, Math.exp((0.17698 * score) - 3.56)) * 100;
    const mortality = clamp(100 - survival, 0, 100);

    const adjustments = [];
    if (inputs.bilirubin < 1) adjustments.push('La bilirrubina se ajustó a 1.0 mg/dL para el cálculo.');
    if (inputs.inr < 1) adjustments.push('El INR se ajustó a 1.0 para el cálculo.');
    if (inputs.sodium < 125 || inputs.sodium > 137) adjustments.push('El sodio se limitó al rango 125-137 mEq/L.');
    if (inputs.albumin < 1.5 || inputs.albumin > 3.5) adjustments.push('La albúmina se limitó al rango 1.5-3.5 g/dL.');
    if (inputs.creatinine < 1 || inputs.creatinine > 3 || inputs.dialysis === 'yes') {
      adjustments.push('La creatinina se ajustó según reglas OPTN/HRSA (máximo 3 mg/dL; diálisis = 3 mg/dL).');
    }

    let riskLabel = 'Bajo riesgo de mortalidad a 90 días';
    let riskMessage = 'Mantener correlación con el contexto clínico y la evolución del paciente.';

    if (score >= 40) {
      riskLabel = 'Riesgo extremadamente alto';
      riskMessage = 'El puntaje está en el máximo del sistema; requiere evaluación hepatológica urgente.';
    } else if (score >= 30) {
      riskLabel = 'Riesgo muy alto';
      riskMessage = 'Compatibile con enfermedad hepática avanzada y alta urgencia clínica.';
    } else if (score >= 20) {
      riskLabel = 'Riesgo alto';
      riskMessage = 'Considerar evaluación especializada temprana y seguimiento estrecho.';
    } else if (score >= 10) {
      riskLabel = 'Riesgo intermedio';
      riskMessage = 'La gravedad es relevante y debe interpretarse junto al cuadro clínico.';
    }

    return {
      score,
      label: riskLabel,
      interpretation: `Mortalidad estimada a 90 días: ${mortality.toFixed(1)}%. ${riskMessage}`,
      recommendations: [
        'Aplicable a pacientes adultos (>=18 años).',
        ...adjustments,
        'No reemplaza la calculadora oficial de asignación de trasplante ni la evaluación por hepatología.'
      ]
    };
  }
};

export default function MELDCalculator() {
  return <CalculatorTemplate config={meldConfig} />;
}
