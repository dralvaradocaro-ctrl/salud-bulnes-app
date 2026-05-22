import { Heart, Brain, Activity, Stethoscope, Pill, Baby, ShieldAlert, HeartPulse } from 'lucide-react';

import NIHSSCalculator from '@/components/calculators/NIHSSCalculator';
import HEARTScoreCalculator from '@/components/calculators/HEARTScoreCalculator';
import MOCACalculator from '@/components/calculators/MOCACalculator';
import SRICalculator from '@/components/calculators/SRICalculator';
import NRS2002Calculator from '@/components/calculators/NRS2002Calculator';
import MELDCalculator from '@/components/calculators/MELDCalculator';
import ChildPughCalculator from '@/components/calculators/ChildPughCalculator';
import AsciticFluidCalculator from '@/components/calculators/AsciticFluidCalculator';
import RFactorCalculator from '@/components/calculators/RFactorCalculator';
import ABCD2Calculator from '@/components/calculators/ABCD2Calculator';
import HASBLEDCalculator from '@/components/calculators/HASBLEDCalculator';
import CHA2DS2VAScCalculator from '@/components/calculators/CHA2DS2VAScCalculator';
import PediatricDoseCalculator from '@/components/calculators/PediatricDoseCalculator';
import MaddreyCalculator from '@/components/calculators/MaddreyCalculator';
import LilleCalculator from '@/components/calculators/LilleCalculator';
import SadPersonsCalculator from '@/components/calculators/SadPersonsCalculator';
import GlasgowCalculator from '@/components/calculators/GlasgowCalculator';
import GDSCalculator from '@/components/calculators/GDSCalculator';

export const calculatorsByCategory = {
  'Urgencias': [
    { id: 'sri', name: 'SRI - Intubación Rápida', component: SRICalculator, icon: Activity, includeInStats: false }
  ],
  'Cardiología': [
    { id: 'heart', name: 'HEART Score', component: HEARTScoreCalculator, icon: Heart },
    { id: 'cha2ds2vasc', name: 'CHA₂DS₂-VASc — Riesgo de ACV en FA', component: CHA2DS2VAScCalculator, icon: Heart },
    { id: 'has-bled', name: 'HAS-BLED — Riesgo de Sangrado', component: HASBLEDCalculator, icon: ShieldAlert }
  ],
  'Neurología': [
    { id: 'nihss', name: 'NIHSS - Escala ACV', component: NIHSSCalculator, icon: Brain },
    { id: 'moca', name: 'MoCA - Cognición', component: MOCACalculator, icon: Brain },
    { id: 'abcd2', name: 'ABCD² — Riesgo ACV post-AIT', component: ABCD2Calculator, icon: Brain },
    { id: 'glasgow', name: 'Glasgow (GCS) — Coma / TEC', component: GlasgowCalculator, icon: Brain },
    { id: 'gds', name: 'GDS Reisberg — Estadío de Demencia', component: GDSCalculator, icon: Brain }
  ],
  'Pediatría': [
    { id: 'pediatric-dose', name: 'Dosis Pediátricas por Peso', component: PediatricDoseCalculator, icon: Baby }
  ],
  'Nutrición': [
    { id: 'nrs2002', name: 'NRS-2002 - Riesgo Nutricional', component: NRS2002Calculator, icon: Stethoscope }
  ],
  'Salud Mental': [
    { id: 'sad-persons', name: 'SAD PERSONS — Riesgo Suicida', component: SadPersonsCalculator, icon: HeartPulse }
  ],
  'Gastroenterología': [
    { id: 'meld', name: 'MELD 3.0', component: MELDCalculator, icon: Pill },
    { id: 'maddrey', name: 'Maddrey (mDF) — Hepatitis Alcohólica', component: MaddreyCalculator, icon: Pill },
    { id: 'lille', name: 'Lille — Respuesta a Corticoides (día 7)', component: LilleCalculator, icon: Pill },
    { id: 'child-pugh', name: 'Child-Pugh', component: ChildPughCalculator, icon: Pill },
    { id: 'ascitic-fluid', name: 'Interpretación de Líquido Ascítico', component: AsciticFluidCalculator, icon: Pill },
    { id: 'r-factor', name: 'Factor R', component: RFactorCalculator, icon: Pill }
  ]
};

export const categoryIcons = {
  'Urgencias': Activity,
  'Cardiología': Heart,
  'Neurología': Brain,
  'Pediatría': Baby,
  'Nutrición': Stethoscope,
  'Salud Mental': HeartPulse,
  'Gastroenterología': Pill
};

export const categoryColors = {
  'Urgencias': 'from-red-500 to-red-600',
  'Cardiología': 'from-rose-500 to-rose-600',
  'Neurología': 'from-violet-500 to-violet-600',
  'Pediatría': 'from-teal-500 to-emerald-600',
  'Nutrición': 'from-green-500 to-green-600',
  'Salud Mental': 'from-fuchsia-500 to-purple-600',
  'Gastroenterología': 'from-orange-500 to-amber-600'
};

export const allCalculators = Object.values(calculatorsByCategory).flat();
export const countedCalculators = allCalculators.filter(({ includeInStats }) => includeInStats !== false);

export const calculatorReferences = allCalculators.map(({ id, name }) => ({ id, name }));
