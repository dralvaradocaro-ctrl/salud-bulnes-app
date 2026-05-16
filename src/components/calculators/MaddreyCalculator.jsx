import { Pill } from 'lucide-react';

import CalculatorTemplate from '@/components/calculator/CalculatorTemplate';
import { createPageUrl } from '@/utils';

/**
 * Función Discriminante de Maddrey (mDF) para hepatitis alcohólica.
 * mDF = 4.6 × (TP paciente − TP control) + bilirrubina total (mg/dL)
 * mDF ≥ 32 → hepatitis alcohólica grave; se beneficia de corticoides.
 */
const maddreyConfig = {
  title: 'Función Discriminante de Maddrey (mDF)',
  description: 'Define gravedad de la hepatitis alcohólica y la necesidad de corticoides',
  icon: Pill,
  gradientFrom: 'orange',
  gradientTo: 'amber',
  inputs: [
    {
      id: 'ptPatient',
      label: 'Tiempo de protrombina del paciente',
      type: 'number',
      unit: 'segundos',
      required: true,
      min: 0,
      placeholder: 'ej. 19',
    },
    {
      id: 'ptControl',
      label: 'Tiempo de protrombina control del laboratorio',
      type: 'number',
      unit: 'segundos',
      required: true,
      min: 0,
      placeholder: 'ej. 12',
    },
    {
      id: 'bilirubin',
      label: 'Bilirrubina total',
      type: 'number',
      unit: 'mg/dL',
      required: true,
      min: 0,
      placeholder: 'ej. 14',
    },
    {
      id: 'contraindicacion',
      label: '¿Contraindicación para corticoides? (infección activa no controlada, HDA activa, sepsis, TBC)',
      type: 'select',
      required: true,
      default: 'no',
      options: [
        { value: 'no', label: 'No' },
        { value: 'si', label: 'Sí' },
      ],
    },
  ],
  references: [
    {
      label: 'Maddrey WC et al. Corticosteroid therapy of alcoholic hepatitis. Gastroenterology 1978.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/352788/',
    },
    {
      label: 'EASL Clinical Practice Guidelines: Management of alcohol-related liver disease. J Hepatol 2018.',
      url: 'https://www.journal-of-hepatology.eu/article/S0168-8278(18)31966-4/fulltext',
    },
    {
      label: 'ACG Clinical Guideline: Alcoholic Liver Disease. Am J Gastroenterol 2018.',
      url: 'https://journals.lww.com/ajg/fulltext/2018/02000/acg_clinical_guideline__alcoholic_liver_disease.14.aspx',
    },
  ],
  referencesNote: 'La mDF orienta el inicio de corticoides; la respuesta se reevalúa al día 7 con el score de Lille. No reemplaza el juicio clínico ni la evaluación por gastroenterología.',
  calculate: (inputs) => {
    const ptPatient = Number(inputs.ptPatient);
    const ptControl = Number(inputs.ptControl);
    const bilirubin = Number(inputs.bilirubin);
    const df = 4.6 * (ptPatient - ptControl) + bilirubin;
    const score = Math.round(df * 10) / 10;
    const grave = score >= 32;
    const contraindicado = inputs.contraindicacion === 'si';

    // Bloque común: cuándo usar + diagnóstico de las hepatitis que se benefician
    const cuandoUsar = [
      '━━━ CUÁNDO USAR ━━━',
      'Aplicar ante sospecha de HEPATITIS ALCOHÓLICA: ictericia de inicio reciente (< 8 semanas) en paciente con consumo de alcohol intenso y sostenido.',
      'Sirve para decidir si corresponde tratamiento con corticoides: mDF ≥ 32 marca enfermedad grave con alta mortalidad a corto plazo (~30-50% a 30 días).',
    ];
    const dxBeneficio = [
      '━━━ HEPATITIS QUE SE BENEFICIAN ━━━',
      'SOLO hepatitis alcohólica. La mDF y los corticoides NO aplican a hepatitis viral (A, B, C, E), autoinmune, isquémica ni a daño hepático por fármacos.',
      'Perfil típico de hepatitis alcohólica: AST/ALT > 2:1, ambas habitualmente < 300-400 UI/L, GGT elevada, bilirrubina elevada, leucocitosis con neutrofilia, antecedente claro de OH.',
      'Antes de tratar: descartar y tratar infección (incluida PBE), hemorragia digestiva y falla renal; obtener hemocultivos y orina; corregir el cuadro intercurrente.',
    ];

    if (!grave) {
      return {
        score,
        label: 'mDF < 32 — Hepatitis alcohólica NO grave',
        color: 'bg-emerald-50 border-emerald-200',
        interpretation: `Función discriminante de ${score}. Por debajo del umbral de 32: enfermedad leve a moderada, mortalidad precoz baja. NO está indicado el uso de corticoides.`,
        recommendations: [
          ...cuandoUsar,
          ...dxBeneficio,
          '━━━ MANEJO ━━━',
          'Abstinencia alcohólica absoluta (clave pronóstica) + manejo del síndrome de abstinencia.',
          'Soporte nutricional: aporte calórico-proteico adecuado (~35 kcal/kg/día y 1,2-1,5 g/kg/día de proteína), tiamina y complejo B antes de aportar glucosa.',
          'Tratar comorbilidades (infección, ascitis, encefalopatía) y controlar evolución de bilirrubina y TP.',
          'No requiere corticoides; reevaluar mDF si el cuadro progresa.',
        ],
      };
    }

    // mDF >= 32 → grave
    const posologiaCorticoide = [
      '━━━ POSOLOGÍA — CORTICOIDE (primera línea si NO hay contraindicación) ━━━',
      '» Arsenal local HCSF Bulnes: PREDNISONA 40 mg/día VO × 28 días, luego suspender o descender en 2-3 semanas. Es el corticoide disponible localmente y la opción práctica de elección.',
      'Equivalente internacional: prednisolona 40 mg/día VO (misma dosis). En hepatitis alcohólica el hígado conserva la capacidad de convertir prednisona en prednisolona, por lo que prednisona es válida.',
      'Si no tolera vía oral: metilprednisolona 32 mg/día EV.',
      'Reevaluar respuesta al DÍA 7 con el score de Lille: Lille ≥ 0,45 = no respondedor → suspender corticoide (no prolongar exposición); Lille < 0,45 = respondedor → completar 28 días.',
    ];
    const posologiaPentoxifilina = [
      '━━━ POSOLOGÍA — PENTOXIFILINA (alternativa si corticoide contraindicado) ━━━',
      '» Arsenal local HCSF Bulnes: PENTOXIFILINA 400 mg VO cada 8 h × 28 días.',
      'Indicada cuando hay contraindicación a corticoides (infección activa, HDA, sepsis).',
      'Su mayor beneficio descrito es la reducción del síndrome hepatorrenal; el beneficio en mortalidad global es menor que el de los corticoides.',
    ];
    const soporte = [
      '━━━ MEDIDAS DE SOPORTE (siempre) ━━━',
      'Abstinencia alcohólica absoluta + profilaxis/tratamiento del síndrome de abstinencia.',
      'N-acetilcisteína EV puede asociarse a corticoides los primeros 5 días en casos graves seleccionados.',
      'Nutrición intensiva: ~35 kcal/kg/día, 1,2-1,5 g/kg/día de proteína, tiamina y complejo B; vía enteral preferente.',
      'Vigilar y tratar infección, HDA, falla renal y encefalopatía; profilaxis de PBE según corresponda.',
      'Derivar a gastroenterología; considerar evaluación de trasplante en no respondedores seleccionados.',
    ];

    return {
      score,
      label: 'mDF ≥ 32 — Hepatitis alcohólica GRAVE',
      color: 'bg-red-50 border-red-200',
      interpretation: `Función discriminante de ${score}. Igual o sobre el umbral de 32: hepatitis alcohólica grave, con mortalidad precoz elevada (~30-50% a 30 días). ${contraindicado ? 'Hay contraindicación registrada para corticoides → usar pentoxifilina.' : 'Está indicado el tratamiento con corticoides si no hay contraindicación.'}`,
      recommendations: [
        ...cuandoUsar,
        ...dxBeneficio,
        ...(contraindicado ? posologiaPentoxifilina : posologiaCorticoide),
        ...soporte,
        '━━━ REEVALUACIÓN AL DÍA 7 ━━━',
        'Si inició corticoide, calcular el score de Lille al día 7 para decidir si continuar o suspender.',
        { text: 'Abrir calculadora de score de Lille', link: createPageUrl('AllCalculators?calc=lille') },
      ],
    };
  },
};

export default function MaddreyCalculator() {
  return <CalculatorTemplate config={maddreyConfig} />;
}
