import { Scale } from 'lucide-react';

import CalculatorTemplate from '@/components/calculator/CalculatorTemplate';

const childPughConfig = {
  title: 'Child-Pugh',
  description: 'Clasificación de severidad de cirrosis',
  icon: Scale,
  gradientFrom: 'orange',
  gradientTo: 'amber',
  inputs: [
    {
      id: 'bilirubin',
      label: 'Bilirrubina total',
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
      id: 'inr',
      label: 'INR',
      type: 'number',
      required: true,
      min: 0
    },
    {
      id: 'ascites',
      label: 'Ascitis',
      type: 'select',
      required: true,
      options: [
        { value: 'none', label: 'Ninguna' },
        { value: 'mild', label: 'Leve/moderada (diurético-responsiva)' },
        { value: 'severe', label: 'Severa (refractaria)' }
      ]
    },
    {
      id: 'encephalopathy',
      label: 'Encefalopatía hepática',
      type: 'select',
      required: true,
      options: [
        { value: 'none', label: 'Ninguna' },
        { value: 'mild', label: 'Grado 1-2' },
        { value: 'severe', label: 'Grado 3-4' }
      ]
    }
  ],
  references: [
    {
      label: 'Hepatitis C Online: criterios y puntajes de Child-Turcotte-Pugh',
      url: 'https://www.hepatitisc.uw.edu/page/clinical-calculators/ctp'
    },
    {
      label: 'AASLD Liver Fellow Network: resumen conceptual de Child-Pugh y clases A/B/C',
      url: 'https://www.aasld.org/liver-fellow-network/core-series/why-series/why-do-we-use-model-end-stage-liver-disease-meld-score'
    }
  ],
  calculate: (inputs) => {
    const bilirubinPoints = inputs.bilirubin < 2 ? 1 : inputs.bilirubin <= 3 ? 2 : 3;
    const albuminPoints = inputs.albumin > 3.5 ? 1 : inputs.albumin >= 2.8 ? 2 : 3;
    const inrPoints = inputs.inr < 1.7 ? 1 : inputs.inr <= 2.3 ? 2 : 3;
    const ascitesPoints = inputs.ascites === 'none' ? 1 : inputs.ascites === 'mild' ? 2 : 3;
    const encephalopathyPoints = inputs.encephalopathy === 'none' ? 1 : inputs.encephalopathy === 'mild' ? 2 : 3;

    const score = bilirubinPoints + albuminPoints + inrPoints + ascitesPoints + encephalopathyPoints;

    let childClass = 'A';
    let summary = 'Función hepática relativamente preservada.';
    let recommendations = [
      'Correlacionar con descompensación clínica, varices, ascitis y encefalopatía.'
    ];

    if (score >= 10) {
      childClass = 'C';
      summary = 'Disfunción hepática severa / cirrosis avanzada.';
      recommendations = [
        'Compatibile con cirrosis avanzada; requiere seguimiento hepatológico estrecho.',
        'Considerar evaluación de trasplante según contexto clínico.'
      ];
    } else if (score >= 7) {
      childClass = 'B';
      summary = 'Disfunción hepática moderada.';
      recommendations = [
        'Riesgo clínico significativo; monitorizar complicaciones de hipertensión portal.',
        'Valorar interconsulta hepatológica si no existe seguimiento especializado.'
      ];
    }

    return {
      score,
      label: `Clase ${childClass}`,
      interpretation: `${summary} Puntaje total: ${score}/15.`,
      recommendations: [
        `Subpuntajes: bilirrubina ${bilirubinPoints}, albúmina ${albuminPoints}, INR ${inrPoints}, ascitis ${ascitesPoints}, encefalopatía ${encephalopathyPoints}.`,
        ...recommendations
      ]
    };
  }
};

export default function ChildPughCalculator() {
  return <CalculatorTemplate config={childPughConfig} />;
}
