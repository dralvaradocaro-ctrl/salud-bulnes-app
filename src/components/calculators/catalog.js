import { Heart, Brain, Activity, Stethoscope, Pill, Baby, ShieldAlert, HeartPulse, Wind, ArrowRightLeft, Candy, Bone, Droplet, Syringe } from 'lucide-react';

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
import LightCriteriaCalculator from '@/components/calculators/LightCriteriaCalculator';
import OpioidConversionCalculator from '@/components/calculators/OpioidConversionCalculator';
import HyperglycemicCrisisCalculator from '@/components/calculators/HyperglycemicCrisisCalculator';
import HypoglycemiaTreatmentCalculator from '@/components/calculators/HypoglycemiaTreatmentCalculator';
import HypokalemiaCorrectionCalculator from '@/components/calculators/HypokalemiaCorrectionCalculator';
import HyperkalemiaManagementCalculator from '@/components/calculators/HyperkalemiaManagementCalculator';
import HyponatremiaCorrectionCalculator from '@/components/calculators/HyponatremiaCorrectionCalculator';
import HypernatremiaCorrectionCalculator from '@/components/calculators/HypernatremiaCorrectionCalculator';
import FibromyalgiaACRCalculator from '@/components/calculators/FibromyalgiaACRCalculator';
import FIQRCalculator from '@/components/calculators/FIQRCalculator';
import PSFSCalculator from '@/components/calculators/PSFSCalculator';
import PECARNCalculator from '@/components/calculators/PECARNCalculator';
import ProceduralSedoanalgesiaCalculator from '@/components/calculators/ProceduralSedoanalgesiaCalculator';
import AntidepressantSwitchCalculator from '@/components/calculators/AntidepressantSwitchCalculator';
import MoriskyCalculator from '@/components/calculators/MoriskyCalculator';
import GRACECalculator from '@/components/calculators/GRACECalculator';
import TalCalculator from '@/components/calculators/TalCalculator';
import WestleyCalculator from '@/components/calculators/WestleyCalculator';
import QsofaCalculator from '@/components/calculators/QsofaCalculator';
import SofaCalculator from '@/components/calculators/SofaCalculator';
import ShockIndexCalculator from '@/components/calculators/ShockIndexCalculator';
import PercCalculator from '@/components/calculators/PercCalculator';
import WellsTepCalculator from '@/components/calculators/WellsTepCalculator';
import Curb65Calculator from '@/components/calculators/Curb65Calculator';
import PafiCalculator from '@/components/calculators/PafiCalculator';
import RoxCalculator from '@/components/calculators/RoxCalculator';
import CapriniCalculator from '@/components/calculators/CapriniCalculator';
import PaduaCalculator from '@/components/calculators/PaduaCalculator';
import ClinicalFrailtyScaleCalculator from '@/components/calculators/ClinicalFrailtyScaleCalculator';
import MaintenanceFluidsCalculator from '@/components/calculators/MaintenanceFluidsCalculator';
import PediatricNutritionCalculator from '@/components/calculators/PediatricNutritionCalculator';

export const calculatorsByCategory = {
  'Urgencias': [
    { id: 'sri', name: 'SRI - Intubación Rápida', component: SRICalculator, icon: Activity, includeInStats: false },
    { id: 'procedural-sedoanalgesia', name: 'Sedoanalgesia procedural — combinación local', component: ProceduralSedoanalgesiaCalculator, icon: Syringe },
    { id: 'hyperglycemic-crisis', name: 'CAD/EHH — Criterios y manejo inicial', component: HyperglycemicCrisisCalculator, icon: Activity },
    { id: 'hypoglycemia-treatment', name: 'Hipoglicemia en urgencias — Tratamiento inicial', component: HypoglycemiaTreatmentCalculator, icon: Candy },
    { id: 'qsofa', name: 'qSOFA — Sospecha rápida de sepsis', component: QsofaCalculator, icon: ShieldAlert },
    { id: 'sofa', name: 'SOFA — Disfunción orgánica', component: SofaCalculator, icon: Activity },
    { id: 'shock-index', name: 'Índice de shock', component: ShockIndexCalculator, icon: HeartPulse }
  ],
  'Nefrología': [
    { id: 'hypokalemia-correction', name: 'Hipokalemia — reposición de KCl', component: HypokalemiaCorrectionCalculator, icon: Pill },
    { id: 'hyperkalemia-management', name: 'Hiperkalemia — urgencia y manejo inicial', component: HyperkalemiaManagementCalculator, icon: Activity },
    { id: 'hyponatremia-correction', name: 'Hiponatremia — corrección (NaCl 3%, límite 24 h)', component: HyponatremiaCorrectionCalculator, icon: Droplet },
    { id: 'hypernatremia-correction', name: 'Hipernatremia — déficit de agua libre', component: HypernatremiaCorrectionCalculator, icon: Droplet }
  ],
  'Cardiología': [
    { id: 'heart', name: 'HEART Score', component: HEARTScoreCalculator, icon: Heart },
    { id: 'cha2ds2vasc', name: 'CHA₂DS₂-VASc — Riesgo de ACV en FA', component: CHA2DS2VAScCalculator, icon: Heart },
    { id: 'has-bled', name: 'HAS-BLED — Riesgo de Sangrado', component: HASBLEDCalculator, icon: ShieldAlert },
    { id: 'morisky-mmas8', name: 'Morisky MMAS-8 — Adherencia a tratamiento', component: MoriskyCalculator, icon: Pill },
    { id: 'grace', name: 'GRACE — Riesgo en síndrome coronario agudo', component: GRACECalculator, icon: Heart },
    { id: 'wells-tep', name: 'Wells — Probabilidad de tromboembolismo pulmonar', component: WellsTepCalculator, icon: Activity },
    { id: 'perc', name: 'PERC — Descarte de tromboembolismo', component: PercCalculator, icon: ShieldAlert },
    { id: 'caprini', name: 'Caprini — Riesgo trombótico quirúrgico', component: CapriniCalculator, icon: ShieldAlert },
    { id: 'padua', name: 'Padua — Riesgo trombótico en paciente médico', component: PaduaCalculator, icon: ShieldAlert }
  ],
  'Neurología': [
    { id: 'nihss', name: 'NIHSS - Escala ACV', component: NIHSSCalculator, icon: Brain },
    { id: 'moca', name: 'MoCA - Cognición', component: MOCACalculator, icon: Brain },
    { id: 'abcd2', name: 'ABCD² — Riesgo ACV post-AIT', component: ABCD2Calculator, icon: Brain },
    { id: 'glasgow', name: 'Glasgow (GCS) — Coma / TEC', component: GlasgowCalculator, icon: Brain },
    { id: 'gds', name: 'GDS Reisberg — Estadío de Demencia', component: GDSCalculator, icon: Brain }
  ],
  'Pediatría': [
    { id: 'pediatric-dose', name: 'Dosis Pediátricas por Peso', component: PediatricDoseCalculator, icon: Baby },
    { id: 'pecarn', name: 'PECARN — TEC pediátrico (TC sí/no)', component: PECARNCalculator, icon: Baby },
    { id: 'tal', name: 'Tal modificado — Obstrucción bronquial', component: TalCalculator, icon: Wind },
    { id: 'westley', name: 'Westley — Crup / laringitis obstructiva', component: WestleyCalculator, icon: Wind },
    { id: 'maintenance-fluids', name: 'Fluidos de mantención — Holliday-Segar y 4-2-1', component: MaintenanceFluidsCalculator, icon: Droplet },
    { id: 'pediatric-nutrition', name: 'Alimentación del lactante — volumen y calorías', component: PediatricNutritionCalculator, icon: Baby }
  ],
  'Nutrición': [
    { id: 'nrs2002', name: 'NRS-2002 - Riesgo Nutricional', component: NRS2002Calculator, icon: Stethoscope }
  ],
  'Respiratorio': [
    { id: 'light-criteria', name: 'Criterios de Light — Líquido pleural', component: LightCriteriaCalculator, icon: Wind },
    { id: 'curb-65', name: 'CURB-65 — Gravedad de neumonía comunitaria', component: Curb65Calculator, icon: Wind },
    { id: 'pafi', name: 'PaFi — PaO₂/FiO₂ con estimador de FiO₂', component: PafiCalculator, icon: Wind },
    { id: 'rox', name: 'Índice de ROX — Respuesta a cánula de alto flujo', component: RoxCalculator, icon: Wind }
  ],
  'Salud Mental': [
    { id: 'sad-persons', name: 'SAD PERSONS — Riesgo Suicida', component: SadPersonsCalculator, icon: HeartPulse },
    { id: 'antidepressant-switch', name: 'Cambio de antidepresivo (switch)', component: AntidepressantSwitchCalculator, icon: ArrowRightLeft }
  ],
  'Gastroenterología': [
    { id: 'meld', name: 'MELD 3.0', component: MELDCalculator, icon: Pill },
    { id: 'maddrey', name: 'Maddrey (mDF) — Hepatitis Alcohólica', component: MaddreyCalculator, icon: Pill },
    { id: 'lille', name: 'Lille — Respuesta a Corticoides (día 7)', component: LilleCalculator, icon: Pill },
    { id: 'child-pugh', name: 'Child-Pugh', component: ChildPughCalculator, icon: Pill },
    { id: 'ascitic-fluid', name: 'Interpretación de Líquido Ascítico', component: AsciticFluidCalculator, icon: Pill },
    { id: 'r-factor', name: 'Factor R', component: RFactorCalculator, icon: Pill }
  ],
  'Cuidados Paliativos': [
    { id: 'opioid-conversion', name: 'Equivalencia y rotación de opioides', component: OpioidConversionCalculator, icon: ArrowRightLeft }
  ],
  'Geriatría': [
    { id: 'clinical-frailty-scale', name: 'Clinical Frailty Scale — Escala de fragilidad', component: ClinicalFrailtyScaleCalculator, icon: Stethoscope }
  ],
  'Reumatología': [
    { id: 'fibromyalgia-acr', name: 'Fibromialgia — Criterios diagnósticos ACR 2016', component: FibromyalgiaACRCalculator, icon: Bone },
    { id: 'fiq-r', name: 'FIQ-R — Impacto de la fibromialgia', component: FIQRCalculator, icon: Activity },
    { id: 'psfs', name: 'PSFS — Escala Funcional Específica del Paciente', component: PSFSCalculator, icon: Activity }
  ]
};

export const categoryIcons = {
  'Urgencias': Activity,
  'Nefrología': Pill,
  'Cardiología': Heart,
  'Neurología': Brain,
  'Pediatría': Baby,
  'Nutrición': Stethoscope,
  'Respiratorio': Wind,
  'Salud Mental': HeartPulse,
  'Gastroenterología': Pill,
  'Cuidados Paliativos': ArrowRightLeft,
  'Geriatría': Stethoscope,
  'Reumatología': Bone
};

export const categoryColors = {
  'Urgencias': 'from-red-500 to-red-600',
  'Nefrología': 'from-sky-500 to-blue-600',
  'Cardiología': 'from-rose-500 to-rose-600',
  'Neurología': 'from-violet-500 to-violet-600',
  'Pediatría': 'from-teal-500 to-emerald-600',
  'Nutrición': 'from-green-500 to-green-600',
  'Respiratorio': 'from-cyan-500 to-blue-600',
  'Salud Mental': 'from-fuchsia-500 to-purple-600',
  'Gastroenterología': 'from-orange-500 to-amber-600',
  'Cuidados Paliativos': 'from-indigo-500 to-purple-600',
  'Geriatría': 'from-amber-500 to-orange-600',
  'Reumatología': 'from-rose-500 to-purple-600'
};

export const allCalculators = Object.values(calculatorsByCategory).flat();
export const countedCalculators = allCalculators.filter(({ includeInStats }) => includeInStats !== false);

export const calculatorReferences = allCalculators.map(({ id, name }) => ({ id, name }));
