import { Pill } from 'lucide-react';

import CalculatorTemplate from '@/components/calculator/CalculatorTemplate';
import { createPageUrl } from '@/utils';

/**
 * Modelo de Lille (Louvet 2007) — respuesta a corticoides en hepatitis alcohólica.
 * Se aplica al DÍA 7 de iniciado el corticoide.
 *
 * R = 3.19 − 0.101·edad + 0.147·albúmina(día0,g/L) + 0.0165·Δbilirrubina
 *     − 0.206·insuf.renal − 0.0065·bilirrubina(día0) − 0.0096·TP
 * Lille = exp(−R) / (1 + exp(−R))
 *
 * Bilirrubina y albúmina se ingresan en unidades clínicas (mg/dL, g/dL) y se
 * convierten internamente a las del modelo (µmol/L, g/L).
 */
const BILI_MGDL_TO_UMOL = 17.1;

const lilleConfig = {
  title: 'Score de Lille — Respuesta a corticoides',
  description: 'Predice respuesta al corticoide en hepatitis alcohólica grave. Se aplica al día 7 de tratamiento.',
  icon: Pill,
  gradientFrom: 'orange',
  gradientTo: 'amber',
  inputs: [
    {
      id: 'age',
      label: 'Edad',
      type: 'number',
      unit: 'años',
      required: true,
      min: 0,
      placeholder: 'ej. 52',
    },
    {
      id: 'albumin',
      label: 'Albúmina (día 0, al iniciar corticoide)',
      type: 'number',
      unit: 'g/dL',
      required: true,
      min: 0,
      placeholder: 'ej. 2.8',
    },
    {
      id: 'biliDay0',
      label: 'Bilirrubina total — día 0 (al iniciar)',
      type: 'number',
      unit: 'mg/dL',
      required: true,
      min: 0,
      placeholder: 'ej. 14',
    },
    {
      id: 'biliDay7',
      label: 'Bilirrubina total — día 7',
      type: 'number',
      unit: 'mg/dL',
      required: true,
      min: 0,
      placeholder: 'ej. 9',
    },
    {
      id: 'creatinine',
      label: 'Creatinina sérica (día 7)',
      type: 'number',
      unit: 'mg/dL',
      required: true,
      min: 0,
      placeholder: 'ej. 1.0',
    },
    {
      id: 'pt',
      label: 'Tiempo de protrombina',
      type: 'number',
      unit: 'segundos',
      required: true,
      min: 0,
      placeholder: 'ej. 18',
    },
  ],
  references: [
    {
      label: 'Louvet A et al. The Lille model: a new tool for therapeutic strategy in patients with severe alcoholic hepatitis treated with steroids. Hepatology 2007.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17654743/',
    },
    {
      label: 'EASL Clinical Practice Guidelines: Management of alcohol-related liver disease. J Hepatol 2018.',
      url: 'https://www.journal-of-hepatology.eu/article/S0168-8278(18)31966-4/fulltext',
    },
  ],
  referencesNote: 'El modelo de Lille se aplica al día 7 de corticoide. Se usa junto con la Función Discriminante de Maddrey (mDF ≥ 32 indica el inicio). No reemplaza el juicio clínico ni la evaluación por gastroenterología.',
  calculate: (inputs) => {
    const age = Number(inputs.age);
    const albuminGL = Number(inputs.albumin) * 10;            // g/dL → g/L
    const biliDay0 = Number(inputs.biliDay0) * BILI_MGDL_TO_UMOL; // mg/dL → µmol/L
    const biliDay7 = Number(inputs.biliDay7) * BILI_MGDL_TO_UMOL;
    const deltaBili = biliDay0 - biliDay7;                    // µmol/L (positivo si bajó)
    const renalInsuf = Number(inputs.creatinine) > 1.3 ? 1 : 0;
    const pt = Number(inputs.pt);

    const R = 3.19
      - 0.101 * age
      + 0.147 * albuminGL
      + 0.0165 * deltaBili
      - 0.206 * renalInsuf
      - 0.0065 * biliDay0
      - 0.0096 * pt;

    const lille = Math.exp(-R) / (1 + Math.exp(-R));
    const score = Math.round(lille * 1000) / 1000;
    const respondedor = lille < 0.45;

    const comun = [
      '━━━ CUÁNDO USAR ━━━',
      'Aplicar al DÍA 7 de iniciado el corticoide en hepatitis alcohólica grave (mDF ≥ 32).',
      'Permite decidir si continuar el corticoide hasta completar 28 días o suspenderlo por falta de respuesta.',
      { text: 'Calcular Función Discriminante de Maddrey (mDF)', link: createPageUrl('AllCalculators?calc=maddrey') },
      '━━━ INTERPRETACIÓN ━━━',
      'Umbral 0,45 — Lille < 0,45 = respondedor; Lille ≥ 0,45 = no respondedor.',
      'La Δbilirrubina (día 0 menos día 7) es el predictor más fuerte: un descenso marcado mejora el pronóstico.',
    ];

    if (respondedor) {
      return {
        score,
        label: 'Lille < 0,45 — RESPONDEDOR al corticoide',
        color: 'bg-emerald-50 border-emerald-200',
        interpretation: `Score de Lille de ${score}. Por debajo de 0,45: el paciente responde al corticoide; la supervivencia a 6 meses es claramente mejor (~85%).`,
        recommendations: [
          ...comun,
          '━━━ CONDUCTA ━━━',
          '» Continuar el corticoide hasta completar 28 días de tratamiento.',
          'Mantener abstinencia alcohólica absoluta, soporte nutricional intensivo y vigilancia de infección.',
          'Controlar evolución de bilirrubina, función renal y signos de complicación.',
        ],
      };
    }

    return {
      score,
      label: 'Lille ≥ 0,45 — NO RESPONDEDOR al corticoide',
      color: 'bg-red-50 border-red-200',
      interpretation: `Score de Lille de ${score}. Igual o sobre 0,45: el paciente NO responde al corticoide; la supervivencia a 6 meses es baja (~25%).`,
      recommendations: [
        ...comun,
        '━━━ CONDUCTA ━━━',
        '» Suspender el corticoide: prolongar la exposición no aporta beneficio y aumenta el riesgo de infección.',
        'Reforzar abstinencia, soporte nutricional, manejo de complicaciones y cuidados según pronóstico.',
        'Derivar a gastroenterología; valorar evaluación de trasplante hepático en casos seleccionados.',
        'No hay terapia farmacológica de rescate con beneficio demostrado en no respondedores.',
      ],
    };
  },
};

export default function LilleCalculator() {
  return <CalculatorTemplate config={lilleConfig} />;
}
