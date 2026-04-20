import { Heart, Brain, Activity, Stethoscope, Pill } from 'lucide-react';

import NIHSSCalculator from '@/components/calculators/NIHSSCalculator';
import HEARTScoreCalculator from '@/components/calculators/HEARTScoreCalculator';
import MOCACalculator from '@/components/calculators/MOCACalculator';
import SRICalculator from '@/components/calculators/SRICalculator';
import NRS2002Calculator from '@/components/calculators/NRS2002Calculator';
import MELDCalculator from '@/components/calculators/MELDCalculator';
import ChildPughCalculator from '@/components/calculators/ChildPughCalculator';
import AsciticFluidCalculator from '@/components/calculators/AsciticFluidCalculator';
import RFactorCalculator from '@/components/calculators/RFactorCalculator';

export const calculatorsByCategory = {
  'Urgencias': [
    { id: 'sri', name: 'SRI - Intubación Rápida', component: SRICalculator, icon: Activity, includeInStats: false }
  ],
  'Cardiología': [
    { id: 'heart', name: 'HEART Score', component: HEARTScoreCalculator, icon: Heart }
  ],
  'Neurología': [
    { id: 'nihss', name: 'NIHSS - Escala ACV', component: NIHSSCalculator, icon: Brain },
    { id: 'moca', name: 'MoCA - Cognición', component: MOCACalculator, icon: Brain }
  ],
  'Nutrición': [
    { id: 'nrs2002', name: 'NRS-2002 - Riesgo Nutricional', component: NRS2002Calculator, icon: Stethoscope }
  ],
  'Gastroenterología': [
    { id: 'meld', name: 'MELD 3.0', component: MELDCalculator, icon: Pill },
    { id: 'child-pugh', name: 'Child-Pugh', component: ChildPughCalculator, icon: Pill },
    { id: 'ascitic-fluid', name: 'Interpretación de Líquido Ascítico', component: AsciticFluidCalculator, icon: Pill },
    { id: 'r-factor', name: 'Factor R', component: RFactorCalculator, icon: Pill }
  ]
};

export const categoryIcons = {
  'Urgencias': Activity,
  'Cardiología': Heart,
  'Neurología': Brain,
  'Nutrición': Stethoscope,
  'Gastroenterología': Pill
};

export const categoryColors = {
  'Urgencias': 'from-red-500 to-red-600',
  'Cardiología': 'from-rose-500 to-rose-600',
  'Neurología': 'from-violet-500 to-violet-600',
  'Nutrición': 'from-green-500 to-green-600',
  'Gastroenterología': 'from-orange-500 to-amber-600'
};

export const allCalculators = Object.values(calculatorsByCategory).flat();
export const countedCalculators = allCalculators.filter(({ includeInStats }) => includeInStats !== false);

export const calculatorReferences = allCalculators.map(({ id, name }) => ({ id, name }));
