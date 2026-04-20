import { Droplets } from 'lucide-react';

import CalculatorTemplate from '@/components/calculator/CalculatorTemplate';

const asciticFluidConfig = {
  title: 'Interpretación de Líquido Ascítico',
  description: 'SAAG, proteína y PMN para orientar etiología e infección',
  icon: Droplets,
  gradientFrom: 'cyan',
  gradientTo: 'blue',
  inputs: [
    {
      id: 'serumAlbumin',
      label: 'Albúmina sérica',
      type: 'number',
      unit: 'g/dL',
      required: true,
      min: 0
    },
    {
      id: 'asciticAlbumin',
      label: 'Albúmina en ascitis',
      type: 'number',
      unit: 'g/dL',
      required: true,
      min: 0
    },
    {
      id: 'asciticProtein',
      label: 'Proteína total ascítica',
      type: 'number',
      unit: 'g/dL',
      required: true,
      min: 0
    },
    {
      id: 'pmn',
      label: 'PMN en ascitis',
      type: 'number',
      unit: '/mm³',
      required: true,
      min: 0
    },
    {
      id: 'glucose',
      label: 'Glucosa ascítica',
      type: 'number',
      unit: 'mg/dL',
      required: false,
      min: 0
    },
    {
      id: 'ldhAscitic',
      label: 'LDH ascítico',
      type: 'number',
      unit: 'U/L',
      required: false,
      min: 0
    },
    {
      id: 'serumLdhUln',
      label: 'Límite superior normal LDH sérico',
      type: 'number',
      unit: 'U/L',
      required: false,
      min: 0
    }
  ],
  references: [
    {
      label: 'AASLD Practice Guidance: ascitis, SBP y HRS',
      url: 'https://www.aasld.org/practice-guidelines/diagnosis-evaluation-and-management-ascites-spontaneous-bacterial-peritonitis'
    },
    {
      label: 'AASLD: importancia del SAAG y proteína ascítica en la paracentesis diagnóstica',
      url: 'https://www.aasld.org/liver-fellow-network/core-series/why-series/why-timing-matters-paracentesis-admission-cirrhosis'
    },
    {
      label: 'Hepatitis C Online: análisis de líquido ascítico, SAAG, proteína y PMN',
      url: 'https://www.hepatitisc.uw.edu/go/management-cirrhosis-related-complications/ascites-diagnosis-management/core-concept/1'
    },
    {
      label: 'Hepatitis C Online: reconocimiento y manejo de peritonitis bacteriana espontánea',
      url: 'https://www.hepatitisc.uw.edu/go/management-cirrhosis-related-complications/spontaneous-bacterial-peritonitis-recognition-management/core-concept/all/'
    }
  ],
  referencesNote: 'La interpretación etiológica y la alerta de infección/posible peritonitis secundaria se sintetizaron a partir de estas fuentes.',
  calculate: (inputs) => {
    const saag = inputs.serumAlbumin - inputs.asciticAlbumin;
    const portalHypertension = saag >= 1.1;
    const infected = inputs.pmn >= 250;
    const highProtein = inputs.asciticProtein >= 2.5;
    const lowGlucose = inputs.glucose !== '' && inputs.glucose !== undefined && inputs.glucose < 50;
    const highLdh = (
      inputs.ldhAscitic !== '' &&
      inputs.ldhAscitic !== undefined &&
      inputs.serumLdhUln !== '' &&
      inputs.serumLdhUln !== undefined &&
      inputs.ldhAscitic > inputs.serumLdhUln
    );

    let summary = '';

    if (portalHypertension && !highProtein) {
      summary = 'Patrón compatible con ascitis por hipertensión portal, típicamente cirrosis.';
    } else if (portalHypertension && highProtein) {
      summary = 'Hipertensión portal con proteína alta: considerar ascitis cardíaca/congestiva o etiologías vasculares hepáticas.';
    } else if (!portalHypertension && highProtein) {
      summary = 'Patrón no portal hipertensivo con proteína alta: considerar carcinomatosis peritoneal, tuberculosis o ascitis pancreática.';
    } else {
      summary = 'Patrón no portal hipertensivo con proteína baja: considerar síndrome nefrótico u otras causas hipoalbuminémicas.';
    }

    const recommendations = [
      portalHypertension
        ? 'SAAG >= 1.1 g/dL: sugiere hipertensión portal.'
        : 'SAAG < 1.1 g/dL: orienta a etiología no portal hipertensiva.',
      highProtein
        ? 'Proteína ascítica >= 2.5 g/dL: patrón de proteína alta.'
        : 'Proteína ascítica < 2.5 g/dL: patrón de proteína baja.'
    ];

    if (infected) {
      recommendations.push('PMN >= 250/mm³: tratar como infección del líquido ascítico mientras se completa estudio y cultivos.');
      if (lowGlucose || highLdh || highProtein) {
        recommendations.push('Si existe dolor, falla a antibióticos o glucosa baja / LDH alta, considerar peritonitis bacteriana secundaria y buscar foco intraabdominal.');
      }
    } else {
      recommendations.push('PMN < 250/mm³: no cumple criterio citológico de peritonitis bacteriana espontánea.');
    }

    if (lowGlucose) {
      recommendations.push('Glucosa ascítica baja: puede verse en peritonitis secundaria, TB o carcinomatosis.');
    }

    if (highLdh) {
      recommendations.push('LDH ascítico elevado sobre el límite sérico: puede apoyar etiología inflamatoria/infecciosa secundaria.');
    }

    return {
      score: saag.toFixed(2),
      label: 'SAAG (g/dL)',
      interpretation: summary,
      recommendations
    };
  }
};

export default function AsciticFluidCalculator() {
  return <CalculatorTemplate config={asciticFluidConfig} />;
}
