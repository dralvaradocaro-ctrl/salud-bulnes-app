import {
  Activity,
  Baby,
  Bandage,
  Brain,
  ClipboardList,
  Droplets,
  Ear,
  Eye,
  FileText,
  FlaskConical,
  HeartPulse,
  Ribbon,
  ShieldPlus,
  SmilePlus,
  Stethoscope,
  Users,
  Wind,
} from 'lucide-react';
import { getGesTopicMeta, normalizeGesText } from '@/lib/ges';

const VISUAL_STYLES = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    ring: 'ring-blue-100',
    gradient: 'from-sky-500 to-blue-600',
    border: 'border-blue-200',
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-600',
    ring: 'ring-cyan-100',
    gradient: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-200',
  },
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    ring: 'ring-emerald-100',
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200',
  },
  fuchsia: {
    bg: 'bg-fuchsia-100',
    text: 'text-fuchsia-600',
    ring: 'ring-fuchsia-100',
    gradient: 'from-fuchsia-500 to-pink-600',
    border: 'border-fuchsia-200',
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    ring: 'ring-indigo-100',
    gradient: 'from-indigo-500 to-blue-600',
    border: 'border-indigo-200',
  },
  lime: {
    bg: 'bg-lime-100',
    text: 'text-lime-700',
    ring: 'ring-lime-100',
    gradient: 'from-lime-500 to-emerald-600',
    border: 'border-lime-200',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    ring: 'ring-orange-100',
    gradient: 'from-orange-500 to-amber-600',
    border: 'border-orange-200',
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-600',
    ring: 'ring-pink-100',
    gradient: 'from-pink-500 to-rose-600',
    border: 'border-pink-200',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    ring: 'ring-purple-100',
    gradient: 'from-purple-500 to-violet-600',
    border: 'border-purple-200',
  },
  rose: {
    bg: 'bg-rose-100',
    text: 'text-rose-600',
    ring: 'ring-rose-100',
    gradient: 'from-rose-500 to-red-600',
    border: 'border-rose-200',
  },
  sky: {
    bg: 'bg-sky-100',
    text: 'text-sky-600',
    ring: 'ring-sky-100',
    gradient: 'from-sky-500 to-cyan-600',
    border: 'border-sky-200',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    ring: 'ring-slate-100',
    gradient: 'from-slate-500 to-slate-700',
    border: 'border-slate-200',
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-600',
    ring: 'ring-teal-100',
    gradient: 'from-teal-500 to-emerald-600',
    border: 'border-teal-200',
  },
  violet: {
    bg: 'bg-violet-100',
    text: 'text-violet-600',
    ring: 'ring-violet-100',
    gradient: 'from-violet-500 to-indigo-600',
    border: 'border-violet-200',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    ring: 'ring-yellow-100',
    gradient: 'from-yellow-500 to-amber-500',
    border: 'border-yellow-200',
  },
};

const AREA_VISUALS = {
  'Cardiovascular': { icon: HeartPulse, color: 'blue' },
  'Digestivo y Hepatología': { icon: FlaskConical, color: 'orange' },
  'Endocrinología y Metabólico': { icon: Activity, color: 'emerald' },
  'GES General': { icon: Stethoscope, color: 'slate' },
  'Ginecología y Obstetricia': { icon: Users, color: 'fuchsia' },
  'Nefrología y Urología': { icon: Droplets, color: 'teal' },
  'Neurología': { icon: Brain, color: 'purple' },
  'Odontología y Salud Oral': { icon: SmilePlus, color: 'yellow' },
  'Oftalmología': { icon: Eye, color: 'indigo' },
  'Oncología': { icon: Ribbon, color: 'rose' },
  'Otorrinolaringología': { icon: Ear, color: 'lime' },
  'Pediatría y Neonatología': { icon: Baby, color: 'pink' },
  'Reumatología e Inmunología': { icon: ShieldPlus, color: 'sky' },
  'Respiratorio': { icon: Wind, color: 'cyan' },
  'Salud Mental': { icon: Brain, color: 'violet' },
  'Traumatología y Rehabilitación': { icon: Bandage, color: 'orange' },
};

const TOPIC_SPECIFIC_VISUALS = [
  { keywords: ['cancer', 'linfoma', 'leucemia', 'mieloma', 'osteosarcoma'], icon: Ribbon, color: 'rose' },
  { keywords: ['retinopatia', 'retina', 'catarata', 'estrabismo', 'ocular', 'refraccion'], icon: Eye, color: 'indigo' },
  { keywords: ['hipoacusia', 'audifono'], icon: Ear, color: 'lime' },
  { keywords: ['salud oral', 'odontologica'], icon: SmilePlus, color: 'yellow' },
  { keywords: ['infarto', 'hipertension', 'marcapasos', 'cerebrovascular', 'aneurisma', 'valvula', 'cardio'], icon: HeartPulse, color: 'blue' },
  { keywords: ['asma', 'epoc', 'pulmon', 'respiratoria', 'respiratorio', 'neumonia', 'tabaco', 'quistica'], icon: Wind, color: 'cyan' },
  { keywords: ['epilepsia', 'parkinson', 'demencia', 'alzheimer', 'neurolog', 'disrafias'], icon: Brain, color: 'purple' },
  { keywords: ['diabetes', 'hipotiroidismo'], icon: Activity, color: 'emerald' },
  { keywords: ['renal', 'rinon', 'urolog', 'hemofilia'], icon: Droplets, color: 'teal' },
  { keywords: ['hepatitis', 'cirrosis', 'gastrico', 'helicobacter', 'vesicula'], icon: FlaskConical, color: 'orange' },
  { keywords: ['cadera', 'rodilla', 'escoliosis', 'hernia', 'politraumatizado', 'traumatismo', 'quemado', 'luxante'], icon: Bandage, color: 'orange' },
  { keywords: ['prematuro', 'recien nacido', 'ninos', 'ninas', 'menores de 15', 'menores de 4', 'labiopalatina'], icon: Baby, color: 'pink' },
  { keywords: ['parto', 'gestante', 'ovario', 'cervicouterino'], icon: Users, color: 'fuchsia' },
  { keywords: ['agresion sexual', 'vih', 'sida'], icon: ShieldPlus, color: 'violet' },
  { keywords: ['artritis', 'lupus', 'esclerosis multiple'], icon: ShieldPlus, color: 'sky' },
];

function getTopicText(topic = {}) {
  return normalizeGesText([
    topic.name,
    topic.description,
    topic.subcategory,
    ...(topic.tags || []),
  ].filter(Boolean).join(' '));
}

function getVisualFromArea(topic = {}) {
  if (topic.subcategory && AREA_VISUALS[topic.subcategory]) {
    return AREA_VISUALS[topic.subcategory];
  }

  if (topic.clasificacion_ges === 'GES') {
    const { area } = getGesTopicMeta(topic.name || '');
    return AREA_VISUALS[area];
  }

  return null;
}

export function getTopicVisual(topic = {}) {
  const normalizedText = getTopicText(topic);

  const specificVisual = TOPIC_SPECIFIC_VISUALS.find(({ keywords }) =>
    keywords.some((keyword) => normalizedText.includes(normalizeGesText(keyword)))
  );

  const areaVisual = specificVisual || getVisualFromArea(topic);
  const contentVisual = topic.tipo_contenido?.includes('herramienta_clinica')
    ? { icon: Stethoscope, color: 'emerald' }
    : topic.has_local_protocol
      ? { icon: ClipboardList, color: 'blue' }
      : { icon: FileText, color: 'slate' };

  const visual = areaVisual || contentVisual;
  const style = VISUAL_STYLES[visual.color] || VISUAL_STYLES.slate;

  return {
    ...visual,
    ...style,
  };
}
