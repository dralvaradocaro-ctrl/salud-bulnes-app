import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  ClipboardCopy,
  ClipboardList,
  Home,
  Hospital,
  Pill,
  Printer,
  RotateCcw,
  ShieldPlus,
  User,
  Weight,
} from 'lucide-react';

import GlobalSearch from '@/components/search/GlobalSearch';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';

const SYNDROMES = [
  { id: 'bronquitis', label: 'Bronquitis aguda' },
  { id: 'itu', label: 'ITU baja simple' },
  { id: 'costocondritis', label: 'Costocondritis' },
  { id: 'lumbago', label: 'Lumbago sin banderas rojas' },
  { id: 'lumbociatica', label: 'Lumbociatica' },
  { id: 'artrosis', label: 'Artrosis exacerbada' },
  { id: 'asma', label: 'Asma exacerbado' },
  { id: 'rinofaringitis', label: 'Rinofaringitis aguda' },
  { id: 'colico_biliar', label: 'Colico biliar simple' },
  { id: 'colico_renal', label: 'Colico renal simple' },
  { id: 'hta', label: 'Hipertension descompensada' },
  { id: 'tec', label: 'TEC leve' },
];

const PAIN_SYNDROMES = new Set(['costocondritis', 'lumbago', 'lumbociatica', 'artrosis', 'colico_biliar', 'colico_renal']);
const ANTIHISTAMINE_SYNDROMES = new Set(['bronquitis', 'asma', 'rinofaringitis']);
const PAIN_INTENSITIES = [
  { id: 'leve', label: 'Leve' },
  { id: 'moderado', label: 'Moderado' },
  { id: 'intenso', label: 'Intenso' },
];

const ALLERGIES = [
  { id: 'paracetamol', label: 'Paracetamol' },
  { id: 'aines', label: 'AINEs' },
  { id: 'metamizol', label: 'Metamizol/dipirona' },
  { id: 'tramadol', label: 'Tramadol/opioides' },
  { id: 'macrolidos', label: 'Macrolidos' },
  { id: 'betalactamicos', label: 'Beta-lactamicos' },
  { id: 'nitrofurantoina', label: 'Nitrofurantoina' },
  { id: 'corticoides', label: 'Corticoides' },
  { id: 'salbutamol', label: 'Salbutamol' },
];

const hasAllergy = (allergies, key) => allergies.includes(key);
const cleanLines = lines => lines.filter(Boolean).join('\n');
const roundTo = (value, step) => Math.round(value / step) * step;
const formatNumber = value => Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
const formatMl = value => formatNumber(value);
const tabletText = (count, strength) => `${formatNumber(count)} ${count === 1 ? 'comp' : 'comp'} de ${strength} mg`;

function doseFromLiquid(targetMg, mgPerMl, { maxMg = Infinity, stepMl = 0.5 } = {}) {
  const ml = Math.max(stepMl, roundTo(targetMg / mgPerMl, stepMl));
  const doseMg = Math.min(roundTo(ml * mgPerMl, 1), maxMg);
  return { doseMg, ml };
}

function doseFromTablets(targetMg, strengths, { maxMg = Infinity, preferFloor = false } = {}) {
  const options = [];
  strengths.forEach(strength => {
    [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4].forEach(count => {
      const doseMg = strength * count;
      if (doseMg <= maxMg) options.push({ doseMg, count, strength });
    });
  });
  const viable = options.filter(option => !preferFloor || option.doseMg <= targetMg);
  const pool = viable.length > 0 ? viable : options;
  return pool.sort((a, b) => Math.abs(a.doseMg - targetMg) - Math.abs(b.doseMg - targetMg))[0];
}

function infoLine({ infoRecipient, recipientName, recipientRelation }) {
  if (infoRecipient === 'minor') {
    return recipientName || recipientRelation
      ? `Se entrega informacion de estado de salud a adulto responsable: ${[recipientName, recipientRelation].filter(Boolean).join(' - ')}.`
      : 'Se entrega informacion de estado de salud a adulto responsable.';
  }
  if (infoRecipient === 'companion') {
    return recipientName || recipientRelation
      ? `Se entrega informacion de estado de salud a usuario y acompanante/familiar: ${[recipientName, recipientRelation].filter(Boolean).join(' - ')}.`
      : 'Se entrega informacion de estado de salud a usuario y acompanante/familiar.';
  }
  return 'Se entrega informacion de estado de salud a usuario.';
}

function getPatientProfile(age, weight) {
  const numericAge = Number(age);
  const numericWeight = Number(weight);
  const pediatric = Number.isFinite(numericAge) && numericAge < 15;
  return {
    age: numericAge,
    weight: numericWeight,
    pediatric,
    hasWeight: Number.isFinite(numericWeight) && numericWeight > 0,
  };
}

function doseParacetamol(profile, allergies, sos = false, days = '5 dias') {
  if (hasAllergy(allergies, 'paracetamol')) return null;
  if (profile.pediatric) {
    if (!profile.hasWeight) return '-Paracetamol: ingresar peso para calculo pediatrico';
    const targetMg = Math.min(profile.weight * 15, 1000);
    if (profile.weight >= 30) {
      const dose = doseFromTablets(targetMg, [500, 160], { maxMg: 1000, preferFloor: true });
      return `-Paracetamol ${dose.doseMg} mg (${tabletText(dose.count, dose.strength)}) cada 8 horas${sos ? ' SOS si dolor o fiebre' : ''} x ${days}`;
    }
    const dose = doseFromLiquid(targetMg, 25, { maxMg: 1000, stepMl: 0.5 });
    return `-Paracetamol ${dose.doseMg} mg (${formatMl(dose.ml)} mL de jarabe 125 mg/5 mL) cada 8 horas${sos ? ' SOS si dolor o fiebre' : ''} x ${days}`;
  }
  return `-Paracetamol 500 mg 2 comp cada 8 horas${sos ? ' SOS si dolor o fiebre' : ''} x ${days}`;
}

function doseIbuprofeno(profile, allergies) {
  if (hasAllergy(allergies, 'aines')) return null;
  if (profile.pediatric) {
    if (!profile.hasWeight) return '-Ibuprofeno: ingresar peso para calculo pediatrico';
    const targetMg = Math.min(profile.weight * 10, 400);
    if (targetMg >= 300) return '-Ibuprofeno 400 mg (1 comp de 400 mg) cada 8 horas x 3 dias';
    const dose = doseFromLiquid(targetMg, 40, { maxMg: 400, stepMl: 0.5 });
    return `-Ibuprofeno ${dose.doseMg} mg (${formatMl(dose.ml)} mL de suspension 200 mg/5 mL) cada 8 horas x 3 dias`;
  }
  return '-Ibuprofeno 400 mg 1 comp cada 8 horas x 3 dias';
}

function dosePrednisona(profile, allergies) {
  if (hasAllergy(allergies, 'corticoides')) return null;
  if (profile.pediatric) {
    if (!profile.hasWeight) return '-Prednisona: ingresar peso para calculo pediatrico';
    const targetMg = Math.min(profile.weight, 40);
    const dose = doseFromTablets(targetMg, [20, 5], { maxMg: 40 });
    return `-Prednisona ${dose.doseMg} mg (${tabletText(dose.count, dose.strength)}) cada 24 horas x 5 dias`;
  }
  return '-Prednisona 20 mg 1 comprimido cada 24 horas x 5 dias';
}

function doseAzitromicina(profile, allergies) {
  if (hasAllergy(allergies, 'macrolidos')) return null;
  if (profile.pediatric) {
    if (!profile.hasWeight) return '-Azitromicina: ingresar peso para calculo pediatrico';
    const targetMg = Math.min(profile.weight * 10, 500);
    if (targetMg >= 450) return '-Azitromicina 500 mg (1 comp de 500 mg) cada 24 horas x 5 dias';
    const dose = doseFromLiquid(targetMg, 80, { maxMg: 500, stepMl: 0.5 });
    return `-Azitromicina ${dose.doseMg} mg (${formatMl(dose.ml)} mL de suspension 400 mg/5 mL) cada 24 horas x 5 dias`;
  }
  return '-Azitromicina 500 mg 1 comprimido cada 24 horas x 5 dias';
}

function doseAntihistamine(profile, sedatingRisk) {
  if (profile.pediatric && profile.age < 2) return null;
  if (sedatingRisk) {
    if (profile.pediatric) {
      return profile.hasWeight && profile.weight < 30
        ? '-Loratadina 5 mg cada 24 horas x 5 dias'
        : '-Loratadina 10 mg cada 24 horas x 5 dias';
    }
    return '-Loratadina 10 mg 1 comprimido cada 24 horas x 5 dias';
  }
  if (profile.pediatric) {
    return profile.hasWeight && profile.weight < 30
      ? '-Clorfenamina 2 mg cada 8 horas x 5 dias'
      : '-Clorfenamina 4 mg cada 8 horas x 5 dias';
  }
  return '-Clorfenamina 4 mg 1 comprimido cada 8 horas x 5 dias';
}

function antihistamineSafetyLine(profile, useAntihistamine) {
  if (!useAntihistamine) return 'No se indica antihistaminico H1 por seleccion clinica.';
  if (profile.pediatric && profile.age < 2) return 'No se indica antihistaminico H1 por edad menor a 2 anos.';
  return null;
}

function doseCefadroxilo(profile, allergies, days = '5 dias') {
  if (hasAllergy(allergies, 'betalactamicos')) return null;
  if (!profile.pediatric) return `-Cefadroxilo 500 mg 1 comprimido cada 12 horas x ${days}`;
  if (!profile.hasWeight) return '-Cefadroxilo: ingresar peso para calculo pediatrico';
  const targetMg = Math.min((profile.weight * 30) / 2, 1000);
  if (targetMg >= 450) return `-Cefadroxilo 500 mg (1 comp de 500 mg) cada 12 horas x ${days}`;
  const dose = doseFromLiquid(targetMg, 50, { maxMg: 1000, stepMl: 0.5 });
  return `-Cefadroxilo ${dose.doseMg} mg (${formatMl(dose.ml)} mL de suspension 250 mg/5 mL) cada 12 horas x ${days}`;
}

function doseLoratadina(profile, days = '5 dias') {
  if (profile.pediatric) {
    return profile.hasWeight && profile.weight < 30
      ? `-Loratadina 5 mg cada 24 horas x ${days}`
      : `-Loratadina 10 mg cada 24 horas x ${days}`;
  }
  return `-Loratadina 10 mg 1 comprimido cada 24 horas x ${days}`;
}

function baseCare(destination, homeText = 'Reposo relativo en domicilio') {
  return destination === 'domicilio'
    ? [homeText, 'Abundante hidratacion si no existe contraindicacion', 'Control de temperatura SOS']
    : ['Hospitalizar segun criterio clinico', 'Control de signos vitales segun indicacion', 'Hidratacion segun tolerancia y condicion clinica'];
}

function analgesiaLines({ profile, allergies, painIntensity, days = '3 dias', allowTramadol = true, preferCelecoxib = false }) {
  const lines = [doseParacetamol(profile, allergies, true, days)];
  const canUseAine = !hasAllergy(allergies, 'aines');
  const canUseTramadol = allowTramadol && !profile.pediatric && !hasAllergy(allergies, 'tramadol');

  if (profile.pediatric) {
    lines.push(doseIbuprofeno(profile, allergies));
    return lines.filter(Boolean);
  }

  if (canUseAine) {
    if (painIntensity === 'leve' && !preferCelecoxib) {
      lines.push('-Ibuprofeno 400 mg 1 comprimido cada 8 horas x 3 dias, con alimentos');
    } else if (painIntensity === 'moderado' || preferCelecoxib) {
      lines.push(`-Celecoxib 200 mg 1 comprimido cada 24 horas x ${days}, con alimentos`);
    } else {
      lines.push(`-Celecoxib 200 mg 1 comprimido cada 24 horas x ${days}, con alimentos`);
      lines.push('-Ketorolaco 10 mg 1 comprimido cada 8 horas SOS dolor intenso, maximo 3 dias, no asociar a otros AINEs');
    }
  }

  if (painIntensity === 'intenso' && canUseTramadol) {
    lines.push('-Tramadol 50 mg 1 comprimido cada 8 horas SOS dolor intenso pese a analgesia base x 3 dias; evitar alcohol, conduccion y sedantes');
  }

  if (!canUseAine) lines.push('Se omiten AINEs por alergia/contraindicacion registrada.');
  if (painIntensity === 'intenso' && allowTramadol && hasAllergy(allergies, 'tramadol')) lines.push('Se omite tramadol por alergia/contraindicacion registrada.');
  return lines.filter(Boolean);
}

function renalColicAnalgesia({ profile, allergies, painIntensity }) {
  if (profile.pediatric) return analgesiaLines({ profile, allergies, painIntensity, days: '3 dias', allowTramadol: false });
  const lines = [doseParacetamol(profile, allergies, true, '3 dias')];
  if (!hasAllergy(allergies, 'aines')) {
    lines.push('-Ketorolaco 10 mg 1 comprimido cada 8 horas x 3 dias, con alimentos; no asociar a otros AINEs');
    if (painIntensity === 'intenso') lines.push('-Diclofenaco 75 mg IM dosis unica en Urgencias si dolor refractario y sin contraindicacion a AINEs');
  } else {
    lines.push('Se omiten AINEs por alergia/contraindicacion registrada.');
  }
  if (painIntensity === 'intenso' && !hasAllergy(allergies, 'tramadol')) {
    lines.push('-Tramadol 50 mg 1 comprimido cada 8 horas SOS dolor intenso pese a analgesia base x 3 dias; evitar alcohol, conduccion y sedantes');
  }
  lines.push('-Tamsulosina 0,4 mg 1 comprimido cada 24 horas en la noche x 7 dias si sospecha de calculo ureteral distal y sin hipotension');
  return lines.filter(Boolean);
}

function commonStart(context, homeText) {
  const { destination, extraAllergy, infoRecipient, recipientName, recipientRelation } = context;
  return [
    ...baseCare(destination, homeText),
    infoLine({ infoRecipient, recipientName, recipientRelation }),
    extraAllergy && `Alergias adicionales referidas: ${extraAllergy}`,
  ];
}

function buildBronquitis({ profile, destination, allergies, sedatingRisk, useAntihistamine, extraAllergy, infoRecipient, recipientName, recipientRelation }) {
  const homeCare = destination === 'domicilio'
    ? ['Reposo relativo en domicilio', 'Abundante hidratacion', 'Control de temperatura SOS']
    : ['Hospitalizar segun criterio clinico', 'Control de signos vitales y saturacion segun indicacion', 'Abundante hidratacion si no existe contraindicacion'];

  const salbutamol = hasAllergy(allergies, 'salbutamol')
    ? null
    : '-Salbutamol 2 puff cada 8 horas x 5 dias x aerocamara, luego SOS';

  const omitted = [
    hasAllergy(allergies, 'paracetamol') && 'paracetamol',
    hasAllergy(allergies, 'aines') && 'AINEs',
    hasAllergy(allergies, 'corticoides') && 'corticoides',
    hasAllergy(allergies, 'macrolidos') && 'macrolidos',
    hasAllergy(allergies, 'salbutamol') && 'salbutamol',
  ].filter(Boolean);

  return cleanLines([
    ...homeCare,
    infoLine({ infoRecipient, recipientName, recipientRelation }),
    extraAllergy && `Alergias adicionales referidas: ${extraAllergy}`,
    'Farmacos:',
    doseParacetamol(profile, allergies),
    doseIbuprofeno(profile, allergies),
    dosePrednisona(profile, allergies),
    doseAzitromicina(profile, allergies),
    salbutamol,
    useAntihistamine && doseAntihistamine(profile, sedatingRisk),
    antihistamineSafetyLine(profile, useAntihistamine),
    omitted.length > 0 && `Se omiten: ${omitted.join(', ')} por alergia/contraindicacion registrada.`,
    destination === 'domicilio' && 'Si persiste con sintomas a pesar de tratamiento consultar con medico de su consultorio.',
    'Consultar SOS en Urgencias si dificultad respiratoria (hundimiento de costillas, coloracion azulviolacea de mucosas, sensacion de falta de aire, aumento en la frecuencia respiratoria), fiebre persistente a pesar de uso de antipireticos, tos persistente que no cede con medicamentos, expectoracion sanguinolenta, alteracion en el estado de conciencia (confusion, desmayo o convulsiones) o cuando estime pertinente.',
  ]);
}

function buildHta({ profile, destination, allergies, extraAllergy, infoRecipient, recipientName, recipientRelation }) {
  const analgesic = hasAllergy(allergies, 'metamizol')
    ? doseParacetamol(profile, allergies, true, '3 dias')
    : '-Metamizol 300 mg 1 comprimido cada 8 horas SOS si dolor';

  return cleanLines([
    destination === 'domicilio' ? 'Reposo relativo en domicilio' : 'Hospitalizar segun criterio clinico',
    'Abundante hidratacion si no existe contraindicacion',
    'Control de temperatura SOS',
    infoLine({ infoRecipient, recipientName, recipientRelation }),
    extraAllergy && `Alergias adicionales referidas: ${extraAllergy}`,
    'Farmacos:',
    '-Se optimiza antihipertensivos',
    analgesic,
    hasAllergy(allergies, 'metamizol') && 'Se omite metamizol por alergia/contraindicacion registrada.',
    'Seguimiento de presion arterial',
    destination === 'domicilio' && 'Control con medico de su consultorio en policlinico descompensados (llevar registro de presiones).',
    'Control SOS en Urgencias si dolor toracico, debilidad de alguna parte del cuerpo, dolor de cabeza que no cede con medicamentos, vomitos explosivos, alteraciones en la vision o en el comportamiento.',
  ]);
}

function buildTec({ profile, destination, allergies, extraAllergy, infoRecipient, recipientName, recipientRelation }) {
  return cleanLines([
    destination === 'domicilio' ? 'Reposo relativo en domicilio por 24 a 48 horas' : 'Observacion/hospitalizacion segun criterio clinico',
    'Acompanamiento por adulto responsable durante las primeras 24 horas',
    'Abundante hidratacion',
    'Evitar alcohol, sedantes, conduccion, deporte y actividad de riesgo hasta permanecer asintomatico',
    infoLine({ infoRecipient, recipientName, recipientRelation }),
    extraAllergy && `Alergias adicionales referidas: ${extraAllergy}`,
    'Farmacos:',
    doseParacetamol(profile, allergies, true, '3 dias'),
    hasAllergy(allergies, 'paracetamol') && 'Se omite paracetamol por alergia/contraindicacion registrada.',
    'Se entrega hoja TEC',
    'Control SOS en Urgencias si somnolencia progresiva, vomitos repetidos, cefalea intensa o progresiva, convulsiones, confusion, desmayo, debilidad de alguna extremidad, alteracion del habla o vision, salida de sangre/liquido por oido o nariz, conducta inhabitual, dificultad para despertar o empeoramiento clinico.',
  ]);
}

function buildItu(context) {
  const { profile, allergies } = context;
  const antibiotic = profile.pediatric
    ? doseCefadroxilo(profile, allergies, '7 dias')
    : hasAllergy(allergies, 'nitrofurantoina')
      ? '-Fosfomicina trometamol 3 g VO dosis unica'
      : '-Nitrofurantoina 100 mg 1 capsula cada 12 horas x 5 dias';

  return cleanLines([
    ...commonStart(context, 'Reposo relativo en domicilio'),
    'Aumentar ingesta de liquidos si no existe contraindicacion',
    'Farmacos:',
    antibiotic,
    doseParacetamol(profile, allergies, true, '3 dias'),
    hasAllergy(allergies, 'nitrofurantoina') && 'Se omite nitrofurantoina por alergia/contraindicacion registrada.',
    profile.pediatric && hasAllergy(allergies, 'betalactamicos') && 'Alergia a beta-lactamicos: definir antibiotico alternativo segun evaluacion clinica y urocultivo.',
    'Solicitar/confirmar examen de orina y urocultivo segun criterio clinico.',
    'Control con medico de su consultorio si persisten sintomas a las 48-72 horas o si reaparecen.',
    'Control SOS en Urgencias si fiebre, dolor lumbar, escalofrios, vomitos persistentes, compromiso del estado general, embarazo, varon con sintomas urinarios, menor de edad, hematuria importante o dolor que no cede.',
  ]);
}

function buildCostocondritis(context) {
  const { profile, allergies, painIntensity } = context;
  return cleanLines([
    ...commonStart(context, 'Reposo relativo en domicilio; evitar carga, ejercicio intenso y movimientos que reproduzcan dolor'),
    'Calor local 15-20 minutos, 3 veces al dia.',
    'Farmacos:',
    ...analgesiaLines({ profile, allergies, painIntensity, days: '5 dias' }),
    'Control con medico de su consultorio si dolor persiste mas de 7 dias.',
    'Control SOS en Urgencias si dolor opresivo, falta de aire, sudoracion, desmayo, palpitaciones, fiebre, dolor que aparece con esfuerzo o irradiacion a brazo/mandibula/espalda.',
  ]);
}

function buildLumbago(context) {
  const { profile, allergies, painIntensity } = context;
  return cleanLines([
    ...commonStart(context, 'Reposo relativo en domicilio; mantener actividad suave segun tolerancia y evitar reposo absoluto'),
    'Calor local y elongacion suave segun tolerancia.',
    'Farmacos:',
    ...analgesiaLines({ profile, allergies, painIntensity, days: '5 dias' }),
    !profile.pediatric && painIntensity !== 'leve' && '-Ciclobenzaprina 10 mg 1 comprimido en la noche x 5 dias si contractura; evitar conduccion y alcohol',
    'Control con medico de su consultorio si no mejora en 5-7 dias.',
    'Control SOS en Urgencias si fiebre, baja de peso, antecedente de cancer, trauma, dolor nocturno progresivo, debilidad de piernas, anestesia en silla de montar, retencion/incontinencia urinaria o fecal.',
  ]);
}

function buildLumbociatica(context) {
  const { profile, allergies, painIntensity } = context;
  return cleanLines([
    ...commonStart(context, 'Reposo relativo en domicilio; caminar tramos cortos segun tolerancia y evitar reposo absoluto'),
    'Evitar carga, flexion lumbar repetida y esfuerzos por 5-7 dias.',
    'Farmacos:',
    ...analgesiaLines({ profile, allergies, painIntensity, days: '5 dias' }),
    'Control con medico de su consultorio si dolor radicular persiste, limita marcha o requiere licencia.',
    'Control SOS en Urgencias si debilidad progresiva, pie caido, anestesia en silla de montar, retencion/incontinencia urinaria o fecal, fiebre, trauma o dolor incontrolable.',
  ]);
}

function buildArtrosis(context) {
  const { profile, allergies, painIntensity } = context;
  return cleanLines([
    ...commonStart(context, 'Reposo relativo articular; evitar sobrecarga y usar frio/calor local segun alivio'),
    'Movilizacion suave y apoyo con baston si dolor limita marcha.',
    'Farmacos:',
    ...analgesiaLines({ profile, allergies, painIntensity, days: '5 dias', preferCelecoxib: painIntensity !== 'leve' }),
    !profile.pediatric && '-Diclofenaco gel 1% aplicar capa fina en zona dolorosa cada 8 horas x 5 dias si piel indemne',
    'Control con medico de su consultorio si dolor persiste, aumento de volumen articular o limitacion funcional.',
    'Control SOS en Urgencias si fiebre, articulacion roja/caliente, imposibilidad de apoyar, trauma, dolor severo progresivo o compromiso del estado general.',
  ]);
}

function buildAsma(context) {
  const { profile, allergies, useAntihistamine } = context;
  const salbutamol = hasAllergy(allergies, 'salbutamol')
    ? null
    : '-Salbutamol inhalador 2 puff cada 4 horas x 48 horas con aerocamara, luego 2 puff cada 6-8 horas SOS';

  return cleanLines([
    ...commonStart(context, 'Reposo relativo en domicilio; evitar humo, frio, ejercicio intenso y gatillantes'),
    'Usar aerocamara y revisar tecnica inhalatoria.',
    'Farmacos:',
    salbutamol,
    dosePrednisona(profile, allergies),
    useAntihistamine && !(profile.pediatric && profile.age < 2) && doseLoratadina(profile, '5 dias'),
    antihistamineSafetyLine(profile, useAntihistamine),
    hasAllergy(allergies, 'salbutamol') && 'Se omite salbutamol por alergia/contraindicacion registrada.',
    hasAllergy(allergies, 'corticoides') && 'Se omite prednisona por alergia/contraindicacion registrada.',
    'Control con medico de su consultorio en 24-72 horas o antes si aumenta uso de salbutamol.',
    'Control SOS en Urgencias si dificultad respiratoria, habla entrecortada, hundimiento de costillas, coloracion azulviolacea, somnolencia, saturacion baja si dispone de oximetro, no responde a salbutamol o requiere salbutamol cada menos de 4 horas.',
  ]);
}

function buildRinofaringitis(context) {
  const { profile, allergies, sedatingRisk, useAntihistamine } = context;
  return cleanLines([
    ...commonStart(context, 'Reposo relativo en domicilio'),
    'Lavados nasales con suero fisiologico y evitar humo/irritantes.',
    'Farmacos:',
    doseParacetamol(profile, allergies, true, '3 dias'),
    doseIbuprofeno(profile, allergies),
    useAntihistamine && !(profile.pediatric && profile.age < 2) && (sedatingRisk ? doseLoratadina(profile, '5 dias') : doseAntihistamine(profile, false)),
    antihistamineSafetyLine(profile, useAntihistamine),
    'No requiere antibioticos si cuadro compatible con infeccion viral no complicada.',
    'Control con medico de su consultorio si sintomas persisten mas de 7-10 dias o aparece dolor facial/otico.',
    'Control SOS en Urgencias si dificultad respiratoria, fiebre persistente, compromiso del estado general, rechazo alimentario en menor, deshidratacion, dolor toracico o somnolencia.',
  ]);
}

function buildColicoBiliar(context) {
  const { profile, allergies, painIntensity } = context;
  return cleanLines([
    ...commonStart(context, 'Reposo relativo en domicilio; dieta liviana baja en grasas por 48-72 horas'),
    'Evitar frituras, alcohol y comidas abundantes.',
    'Farmacos:',
    ...analgesiaLines({ profile, allergies, painIntensity, days: '3 dias', preferCelecoxib: true }),
    !profile.pediatric && '-Butilbromuro de hioscina 10 mg 1-2 comprimidos cada 8 horas SOS colico x 3 dias si no hay glaucoma de angulo cerrado/retencion urinaria',
    !profile.pediatric && '-Metoclopramida 10 mg 1 comprimido cada 8 horas SOS nauseas o vomitos x 2 dias',
    'Control con medico de su consultorio para estudio ecografico y derivacion si episodios repetidos.',
    'Control SOS en Urgencias si dolor dura mas de 6 horas, fiebre, ictericia, vomitos persistentes, dolor abdominal progresivo, deposiciones palidas, orina oscura o compromiso del estado general.',
  ]);
}

function buildColicoRenal(context) {
  const { profile, allergies, painIntensity } = context;
  return cleanLines([
    ...commonStart(context, 'Reposo relativo en domicilio; hidratacion segun sed y tolerancia'),
    'Colar orina si es posible para recuperar calculo.',
    'Farmacos:',
    ...renalColicAnalgesia({ profile, allergies, painIntensity }),
    !profile.pediatric && '-Metoclopramida 10 mg 1 comprimido cada 8 horas SOS nauseas o vomitos x 2 dias',
    'Control con medico de su consultorio para seguimiento, imagen y examen de orina segun criterio.',
    'Control SOS en Urgencias si fiebre, escalofrios, anuria, rinon unico, embarazo, vomitos persistentes, dolor incontrolable, compromiso del estado general o hematuria importante.',
  ]);
}

function buildIndications(context) {
  if (context.syndrome === 'itu') return buildItu(context);
  if (context.syndrome === 'costocondritis') return buildCostocondritis(context);
  if (context.syndrome === 'lumbago') return buildLumbago(context);
  if (context.syndrome === 'lumbociatica') return buildLumbociatica(context);
  if (context.syndrome === 'artrosis') return buildArtrosis(context);
  if (context.syndrome === 'asma') return buildAsma(context);
  if (context.syndrome === 'rinofaringitis') return buildRinofaringitis(context);
  if (context.syndrome === 'colico_biliar') return buildColicoBiliar(context);
  if (context.syndrome === 'colico_renal') return buildColicoRenal(context);
  if (context.syndrome === 'hta') return buildHta(context);
  if (context.syndrome === 'tec') return buildTec(context);
  return buildBronquitis(context);
}

function IndicacionesUrgencia() {
  const navigate = useNavigate();
  const [syndrome, setSyndrome] = useState('bronquitis');
  const [destination, setDestination] = useState('domicilio');
  const [age, setAge] = useState('35');
  const [weight, setWeight] = useState('70');
  const [sedatingRisk, setSedatingRisk] = useState(false);
  const [useAntihistamine, setUseAntihistamine] = useState(true);
  const [painIntensity, setPainIntensity] = useState('moderado');
  const [allergies, setAllergies] = useState([]);
  const [extraAllergy, setExtraAllergy] = useState('');
  const [infoRecipient, setInfoRecipient] = useState('user');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRelation, setRecipientRelation] = useState('');
  const [manualText, setManualText] = useState('');
  const [isEdited, setIsEdited] = useState(false);
  const [copied, setCopied] = useState(false);

  const profile = useMemo(() => getPatientProfile(age, weight), [age, weight]);
  const autoText = useMemo(
    () => buildIndications({
      syndrome,
      destination,
      profile,
      allergies,
      sedatingRisk,
      useAntihistamine,
      painIntensity,
      extraAllergy,
      infoRecipient,
      recipientName,
      recipientRelation,
    }),
    [syndrome, destination, profile, allergies, sedatingRisk, useAntihistamine, painIntensity, extraAllergy, infoRecipient, recipientName, recipientRelation]
  );
  const output = isEdited ? manualText : autoText;
  const showPainIntensity = PAIN_SYNDROMES.has(syndrome);
  const showAntihistamineOption = ANTIHISTAMINE_SYNDROMES.has(syndrome);

  const toggleAllergy = allergyId => {
    setAllergies(current => current.includes(allergyId)
      ? current.filter(id => id !== allergyId)
      : [...current, allergyId]);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Indicaciones de Urgencia</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            pre { white-space: pre-wrap; font-size: 15px; line-height: 1.55; }
          </style>
        </head>
        <body><pre>${output.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]))}</pre></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('Templates'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={goBack} title="Volver">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">Urgencias / Plantillas</p>
              <h1 className="truncate text-xl font-bold text-slate-950">Indicaciones prehechas por cuadro sindromatico</h1>
            </div>
            <Link
              to={createPageUrl('Home')}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 sm:flex"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Link>
          </div>
          <GlobalSearch />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
            <ShieldPlus className="h-4 w-4" />
            Urgencias
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600">
            <ClipboardList className="h-4 w-4" />
            Texto editable
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Pill className="h-5 w-5 text-rose-600" />
              <h2 className="font-bold text-slate-900">Variables clinicas</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cuadro sindromatico</Label>
                <Select value={syndrome} onValueChange={value => { setSyndrome(value); setIsEdited(false); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNDROMES.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showPainIntensity && (
                <div className="space-y-2">
                  <Label>Intensidad analgesia</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAIN_INTENSITIES.map(item => (
                      <Button
                        key={item.id}
                        type="button"
                        variant={painIntensity === item.id ? 'default' : 'outline'}
                        className="px-2"
                        onClick={() => { setPainIntensity(item.id); setIsEdited(false); }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={destination === 'domicilio' ? 'default' : 'outline'}
                  className="justify-start gap-2"
                  onClick={() => { setDestination('domicilio'); setIsEdited(false); }}
                >
                  <Home className="h-4 w-4" />
                  Domicilio
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start gap-2 opacity-60"
                  disabled
                  title="Pendiente formato de plantilla hospitalizado"
                >
                  <Hospital className="h-4 w-4" />
                  Hospitalizado
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Edad
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={age}
                    onChange={event => { setAge(event.target.value); setIsEdited(false); }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Weight className="h-4 w-4" />
                    Peso kg
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight}
                    onChange={event => { setWeight(event.target.value); setIsEdited(false); }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alergias / contraindicaciones</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALLERGIES.map(item => (
                    <label key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                      <Checkbox checked={allergies.includes(item.id)} onCheckedChange={() => { toggleAllergy(item.id); setIsEdited(false); }} />
                      {item.label}
                    </label>
                  ))}
                </div>
                <Input
                  value={extraAllergy}
                  onChange={event => { setExtraAllergy(event.target.value); setIsEdited(false); }}
                  placeholder="Otra alergia o antecedente relevante"
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <Checkbox checked={sedatingRisk} onCheckedChange={checked => { setSedatingRisk(Boolean(checked)); setIsEdited(false); }} />
                <span>Conductor, trabajo de riesgo o evitar somnolencia</span>
              </label>

              {showAntihistamineOption && (
                <label className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-900">
                  <Checkbox checked={useAntihistamine} onCheckedChange={checked => { setUseAntihistamine(Boolean(checked)); setIsEdited(false); }} />
                  <span>Usar antihistaminico H1 si edad y contexto clinico lo permiten</span>
                </label>
              )}

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="space-y-2">
                  <Label>Informacion de estado de salud</Label>
                  <Select value={infoRecipient} onValueChange={value => { setInfoRecipient(value); setIsEdited(false); }}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Solo usuario</SelectItem>
                      <SelectItem value="companion">Usuario y acompanante/familiar</SelectItem>
                      <SelectItem value="minor">Menor de edad / adulto responsable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {infoRecipient !== 'user' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={recipientName}
                      onChange={event => { setRecipientName(event.target.value); setIsEdited(false); }}
                      placeholder="Nombre"
                      className="bg-white"
                    />
                    <Input
                      value={recipientRelation}
                      onChange={event => { setRecipientRelation(event.target.value); setIsEdited(false); }}
                      placeholder="Parentesco"
                      className="bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Indicaciones generadas</h2>
                <p className="text-sm text-slate-500">
                  {profile.pediatric ? 'Dosis pediatrica calculada por peso cuando aplica.' : 'Formato adulto estandar.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsEdited(false); setManualText(''); }}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
                <Button size="sm" onClick={handlePrint} className="bg-rose-600 hover:bg-rose-700">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>

            <Textarea
              className="min-h-[560px] resize-y whitespace-pre-wrap font-mono text-[15px] leading-relaxed"
              value={output}
              onChange={event => {
                setManualText(event.target.value);
                setIsEdited(true);
              }}
            />

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>Validar indicacion final segun evaluacion clinica, embarazo, comorbilidades, funcion renal y disponibilidad local.</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default conPuertaAcceso(IndicacionesUrgencia, {
  storageKey: 'acceso_medico',
  descripcion: 'Ingresa el código de acceso para usar Indicaciones prehechas de Urgencia.',
});
