import { Sigma } from 'lucide-react';

import CalculatorTemplate from '@/components/calculator/CalculatorTemplate';

const rFactorConfig = {
  title: 'Factor R',
  description: 'Clasifica el patrón de lesión hepática según aminotransferasa y fosfatasa alcalina',
  icon: Sigma,
  gradientFrom: 'red',
  gradientTo: 'orange',
  inputs: [
    {
      id: 'enzymeName',
      label: 'Aminotransferasa utilizada',
      type: 'select',
      required: true,
      options: [
        { value: 'ALT', label: 'ALT / GPT (preferida)' },
        { value: 'AST', label: 'AST' }
      ],
      default: 'ALT'
    },
    {
      id: 'aminotransferase',
      label: 'Valor aminotransferasa',
      type: 'number',
      unit: 'U/L',
      required: true,
      min: 0
    },
    {
      id: 'aminotransferaseUln',
      label: 'Límite superior normal aminotransferasa',
      type: 'number',
      unit: 'U/L',
      required: true,
      min: 0.1
    },
    {
      id: 'alp',
      label: 'Fosfatasa alcalina',
      type: 'number',
      unit: 'U/L',
      required: true,
      min: 0
    },
    {
      id: 'alpUln',
      label: 'Límite superior normal fosfatasa alcalina',
      type: 'number',
      unit: 'U/L',
      required: true,
      min: 0.1
    }
  ],
  references: [
    {
      label: 'AASLD: enfoque de enzimas hepáticas elevadas y definición del R-value',
      url: 'https://www.aasld.org/liver-fellow-network/core-series/back-basics/how-approach-elevated-liver-enzymes'
    },
    {
      label: 'AASLD Practice Guidance sobre DILI: clasificación hepatocelular, colestásica y mixta',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10598316/'
    }
  ],
  calculate: (inputs) => {
    const enzymeDisplay = inputs.enzymeName === 'ALT' ? 'ALT / GPT' : inputs.enzymeName;
    const aminotransferaseMultiple = inputs.aminotransferase / inputs.aminotransferaseUln;
    const alpMultiple = inputs.alp / inputs.alpUln;
    const rFactor = aminotransferaseMultiple / alpMultiple;

    let pattern = 'Mixto';
    let summary = 'Patrón mixto de lesión hepática.';

    if (rFactor > 5) {
      pattern = 'Hepatocelular';
      summary = 'Predominio hepatocelular.';
    } else if (rFactor < 2) {
      pattern = 'Colestásico';
      summary = 'Predominio colestásico.';
    }

    return {
      score: rFactor.toFixed(2),
      label: pattern,
      interpretation: `${summary} El factor R se interpreta mejor con los exámenes iniciales del cuadro.`,
      recommendations: [
        `${enzymeDisplay} = ${aminotransferaseMultiple.toFixed(2)} x LSN.`,
        `Fosfatasa alcalina = ${alpMultiple.toFixed(2)} x LSN.`,
        'Patrones: >5 hepatocelular, <2 colestásico, 2-5 mixto.',
        'Correlacionar con bilirrubina, INR, fármacos, serologías e imágenes según contexto.'
      ]
    };
  }
};

export default function RFactorCalculator() {
  return <CalculatorTemplate config={rFactorConfig} />;
}
