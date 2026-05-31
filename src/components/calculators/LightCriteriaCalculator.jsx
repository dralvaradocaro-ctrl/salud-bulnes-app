import { Droplets } from 'lucide-react';

import CalculatorTemplate from '@/components/calculator/CalculatorTemplate';

const lightCriteriaConfig = {
  title: 'Criterios de Light',
  description: 'Clasifica líquido pleural como exudado o transudado',
  icon: Droplets,
  gradientFrom: 'cyan',
  gradientTo: 'blue',
  showPatientInfo: false,
  inputs: [
    {
      id: 'pleuralProtein',
      label: 'Proteínas líquido pleural',
      type: 'number',
      unit: 'g/dL',
      required: true,
      min: 0,
    },
    {
      id: 'serumProtein',
      label: 'Proteínas séricas',
      type: 'number',
      unit: 'g/dL',
      required: true,
      min: 0,
    },
    {
      id: 'pleuralLdh',
      label: 'LDH líquido pleural',
      type: 'number',
      unit: 'U/L',
      required: true,
      min: 0,
    },
    {
      id: 'serumLdh',
      label: 'LDH sérica',
      type: 'number',
      unit: 'U/L',
      required: true,
      min: 0,
    },
    {
      id: 'serumLdhUpperLimit',
      label: 'Límite superior normal LDH sérica',
      type: 'number',
      unit: 'U/L',
      required: true,
      min: 0,
    },
  ],
  references: [
    {
      label: 'Light RW et al. Pleural effusions: the diagnostic separation of transudates and exudates. Ann Intern Med. 1972.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/4642731/',
    },
  ],
  referencesNote: 'Un derrame pleural se clasifica como exudado si cumple al menos uno de los criterios de Light.',
  calculate: (inputs) => {
    const proteinRatio = inputs.pleuralProtein / inputs.serumProtein;
    const ldhRatio = inputs.pleuralLdh / inputs.serumLdh;
    const ldhLimit = inputs.pleuralLdh > (2 / 3) * inputs.serumLdhUpperLimit;

    const criteria = [
      {
        met: proteinRatio > 0.5,
        text: `Proteínas LP/suero: ${proteinRatio.toFixed(2)} ${proteinRatio > 0.5 ? '> 0,5' : '<= 0,5'}`,
      },
      {
        met: ldhRatio > 0.6,
        text: `LDH LP/suero: ${ldhRatio.toFixed(2)} ${ldhRatio > 0.6 ? '> 0,6' : '<= 0,6'}`,
      },
      {
        met: ldhLimit,
        text: `LDH LP ${inputs.pleuralLdh} U/L ${ldhLimit ? '>' : '<='} 2/3 del límite superior normal (${Math.round((2 / 3) * inputs.serumLdhUpperLimit)} U/L)`,
      },
    ];

    const metCount = criteria.filter(item => item.met).length;
    const isExudate = metCount > 0;

    return {
      score: isExudate ? 'Exudado' : 'Transudado',
      label: `${metCount}/3 criterios positivos`,
      color: isExudate ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200',
      interpretation: isExudate
        ? 'Líquido pleural compatible con exudado según criterios de Light.'
        : 'Líquido pleural compatible con transudado si el contexto clínico es concordante.',
      recommendations: [
        ...criteria.map(item => `${item.met ? 'Positivo' : 'Negativo'}: ${item.text}`),
        isExudate
          ? 'Orientar estudio según sospecha: infección/empiema, TBC, neoplasia, inflamatorio u otras causas de exudado.'
          : 'En transudado, correlacionar con insuficiencia cardíaca, cirrosis, síndrome nefrótico u otras causas sistémicas.',
      ],
    };
  },
};

export default function LightCriteriaCalculator() {
  return <CalculatorTemplate config={lightCriteriaConfig} />;
}
