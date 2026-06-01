import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Droplets, FlaskConical, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const n = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return '';
  return Number(value.toFixed(digits)).toString();
};

const references = [
  {
    label: 'Umpierrez GE, Korytkowski M. Diabetic emergencies: ketoacidosis, hyperglycaemic hyperosmolar state and hypoglycaemia. Nat Rev Endocrinol. 2016.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26893262/',
  },
  {
    label: 'Hyperglycemic Crises in Adults With Diabetes: A Consensus Report. Diabetes Care. 2024.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11272983/',
  },
  {
    label: 'Endocrine Society. Management of Hyperglycemia in Hospitalized Adult Patients in Non-Critical Care Settings. 2022.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9653018/',
  },
];

function classifyDka({ glucose, ph, bicarbonate, bhb, mental, euglycemicRisk }) {
  const hyperglycemia = glucose >= 200 || euglycemicRisk;
  const ketosis = bhb >= 3;
  const acidosis = ph < 7.3 || bicarbonate < 18;
  if (!hyperglycemia || !ketosis || !acidosis) return null;

  const severe = ph < 7 || bicarbonate < 10 || mental === 'stupor';
  const moderate = ph < 7.25 || bicarbonate < 15 || mental === 'drowsy';
  if (severe) return 'CAD severa';
  if (moderate) return 'CAD moderada';
  return 'CAD leve';
}

export default function HyperglycemicCrisisCalculator() {
  const [values, setValues] = useState({
    glucose: '',
    sodium: '',
    potassium: '',
    ph: '',
    bicarbonate: '',
    betaHydroxybutyrate: '',
    chloride: '',
    weight: '70',
    mental: 'alert',
    euglycemicRisk: false,
  });
  const [result, setResult] = useState(null);

  const printableInputs = useMemo(() => [
    { label: 'Glicemia', value: values.glucose ? `${values.glucose} mg/dL` : '' },
    { label: 'Sodio medido', value: values.sodium ? `${values.sodium} mEq/L` : '' },
    { label: 'Potasio', value: values.potassium ? `${values.potassium} mEq/L` : '' },
    { label: 'pH', value: values.ph },
    { label: 'HCO3-', value: values.bicarbonate ? `${values.bicarbonate} mEq/L` : '' },
    { label: 'Beta-hidroxibutirato', value: values.betaHydroxybutyrate ? `${values.betaHydroxybutyrate} mmol/L` : '' },
  ], [values]);

  const setField = (field, value) => setValues(prev => ({ ...prev, [field]: value }));

  const handleCalculate = () => {
    const glucose = n(values.glucose);
    const sodium = n(values.sodium);
    const potassium = n(values.potassium);
    const ph = n(values.ph);
    const bicarbonate = n(values.bicarbonate);
    const bhb = n(values.betaHydroxybutyrate);
    const chloride = n(values.chloride);
    const weight = n(values.weight) || 70;

    if ([glucose, sodium, potassium, ph, bicarbonate, bhb].some(value => value === null)) {
      const invalid = {
        score: 'Incompleto',
        label: 'Faltan datos para clasificar',
        interpretation: 'Ingresa glicemia, sodio, potasio, pH, bicarbonato y beta-hidroxibutirato. Si no hay beta-hidroxibutirato, usa cetonas disponibles y confirma con laboratorio.',
        color: 'bg-amber-50 border-amber-300',
        recommendations: ['No demorar manejo clínico si hay compromiso hemodinámico, vómitos persistentes, respiración de Kussmaul o alteración de conciencia.'],
      };
      setResult(invalid);
      return invalid;
    }

    const correctedNa = sodium + 1.6 * ((glucose - 100) / 100);
    const effectiveOsm = 2 * sodium + glucose / 18;
    const anionGap = chloride === null ? null : sodium - chloride - bicarbonate;
    const dka = classifyDka({ glucose, ph, bicarbonate, bhb, mental: values.mental, euglycemicRisk: values.euglycemicRisk });
    const hhs = glucose >= 600 && effectiveOsm >= 320 && ph >= 7.3 && bicarbonate >= 15 && bhb < 3;
    const mixed = glucose >= 600 && effectiveOsm >= 320 && Boolean(dka);
    const insulinRate = weight * 0.1;
    const reducedInsulinRate = weight * 0.05;
    const deficitLow = weight * 100 / 1000;
    const deficitHigh = weight * 200 / 1000;

    let diagnosis = 'No cumple CAD/EHH típico';
    if (mixed) diagnosis = 'Cuadro mixto CAD + EHH';
    else if (dka) diagnosis = dka;
    else if (hhs) diagnosis = 'Estado hiperglicémico hiperosmolar';

    const urgent = mixed || hhs || dka === 'CAD severa' || potassium < 3.3 || values.mental === 'stupor';
    const medicationCards = [
      {
        title: 'NaCl 0,9%',
        dose: '500-1000 mL/h',
        badge: 'Infusión · 1ª-2ª h',
        details: [
          'Indicación: NaCl 0,9% 500-1000 mL/h EV en infusión continua durante 1-2 h. No es bolo único: se titula según diuresis, Na corregido, presión y comorbilidad.',
          'Ajustar por cardiopatía, falla renal, edad, presión, diuresis y Na corregido.',
          correctedNa >= 135 ? 'Luego de fase inicial: Na corregido normal/alto, reevaluar tipo de fluido.' : 'Na corregido bajo: continuar reposición salina isotónica según respuesta.',
        ],
      },
    ];
    const sequenceSteps = [
      {
        title: '1. Confirmar crisis y gravedad',
        text: 'ABC, volemia, sensorio, HGT, gases, electrolitos, creatinina, cetonas/beta-hidroxibutirato, ECG si K alterado y búsqueda de gatillante.',
      },
      {
        title: '2. Iniciar volumen',
        text: 'NaCl 0,9% 500-1000 mL/h durante 1-2 h si no hay contraindicación; después ajustar por Na corregido, diuresis y comorbilidad.',
      },
      {
        title: '3. Potasio antes de insulina',
        text: potassium < 3.3
          ? 'K <3,3: reponer KCl y diferir insulina.'
          : potassium > 5
            ? 'K >5: iniciar insulina si corresponde, sin KCl inicial y con control estrecho.'
            : 'K 3,3-5,0: iniciar insulina y agregar KCl si hay diuresis.',
      },
      {
        title: '4. Insulina cristalina',
        text: potassium >= 3.3
          ? `Iniciar ${round(insulinRate)} UI/h EV; con dilución 1 UI/mL equivale a ${round(insulinRate)} mL/h.`
          : 'Aún no iniciar hasta corregir K a >=3,3 mEq/L.',
      },
      {
        title: '5. Glucosa de transición',
        text: `Agregar SG 5-10% al umbral de glicemia y bajar insulina a ${round(reducedInsulinRate)} UI/h hasta resolver acidosis/osmolaridad.`,
      },
    ];
    const recommendations = [
      `Na corregido estimado: ${round(correctedNa)} mEq/L. Osmolaridad efectiva: ${round(effectiveOsm)} mOsm/kg.`,
      anionGap !== null ? `Anion gap estimado: ${round(anionGap)} mEq/L.` : 'Si tienes cloro, calcula anion gap: Na - Cl - HCO3.',
      urgent ? 'Escalar a monitorización estrecha/UPC o derivación según disponibilidad local: alto riesgo metabólico.' : 'Si está hemodinámicamente estable, puede iniciar manejo protocolizado con reevaluación frecuente.',
      'Fluidos: NaCl 0,9% 500-1000 mL/h las primeras 1-2 h si no hay insuficiencia cardiaca/renal; luego ajustar por Na corregido, diuresis y estado clínico.',
      correctedNa >= 135 ? 'Luego de la fase inicial, si Na corregido normal/alto, considerar solución hipotónica según protocolo y disponibilidad; si Na bajo, continuar NaCl 0,9%.' : 'Na corregido bajo: continuar reposición con NaCl 0,9% y controles seriados.',
    ];

    if (potassium < 3.3) {
      medicationCards.push({
        title: 'Cloruro de potasio',
        dose: 'Reponer antes de insulina',
        badge: 'K <3,3',
        details: [
          'NO iniciar insulina hasta K >=3,3 mEq/L.',
          'Si KCl 10% viene en ampolla 10 mL: 1 ampolla aporta aprox. 13,4 mEq; 20 mEq ≈ 1,5 ampollas.',
          'Indicar en mEq y velocidad segura según norma local; confirmar concentración y volumen de ampolla.',
        ],
      });
      recommendations.push('K <3,3 mEq/L: NO iniciar insulina todavía. Reponer KCl con monitorización hasta K >=3,3 mEq/L.');
    } else if (potassium > 5) {
      recommendations.push('K >5 mEq/L: iniciar insulina si corresponde, sin KCl inicial; controlar K cada 2 h y ECG si alteraciones.');
    } else {
      medicationCards.push({
        title: 'Cloruro de potasio',
        dose: '20-40 mEq/L de suero',
        badge: 'K 3,3-5,0',
        details: [
          'Usar si hay diuresis y monitorización seriada.',
          'Si KCl 10% ampolla 10 mL ≈ 13,4 mEq: 20 mEq ≈ 1,5 ampollas; 30 mEq ≈ 2,25 ampollas; 40 mEq ≈ 3 ampollas por litro.',
          'Objetivo práctico: K 4-5 mEq/L.',
        ],
      });
      recommendations.push('K 3,3-5 mEq/L: agregar KCl a los sueros si hay diuresis y control seriado; objetivo práctico K 4-5 mEq/L.');
    }

    if (potassium >= 3.3) {
      medicationCards.push({
        title: 'Insulina humana cristalina',
        dose: `${round(insulinRate)} UI/h`,
        badge: 'Infusión continua',
        details: [
          `Indicación: insulina cristalina ${round(insulinRate)} UI/h EV en infusión continua (BIC). No se da en bolo: se titula según glicemia/acidosis.`,
          `Preparar 100 UI en 100 mL NaCl 0,9% = 1 UI/mL → pasar a ${round(insulinRate)} mL/h.`,
          `Al llegar a rango de transición: bajar a ${round(reducedInsulinRate)} UI/h (= ${round(reducedInsulinRate)} mL/h) y mantener hasta resolver acidosis/osmolaridad. No iniciar si K <3,3 mEq/L.`,
        ],
      });
      medicationCards.push({
        title: 'Suero glucosado 5-10%',
        dose: 'Agregar en transición',
        badge: 'Infusión en transición',
        details: [
          'Se agrega como infusión (no bolo) cuando la glicemia baja al umbral: CAD 200-250 mg/dL; EHH 250-300 mg/dL.',
          'Permite mantener la insulina y seguir cerrando cetosis/osmolaridad sin hipoglicemia.',
        ],
      });
      recommendations.push(`Insulina cristalina EV: ${round(insulinRate)} UI/h. Si se prepara 100 UI en 100 mL, pasar a ${round(insulinRate)} mL/h.`);
      recommendations.push(`Cuando glicemia llegue a 200-250 mg/dL en CAD o 250-300 mg/dL en EHH: añadir SG 5-10% y bajar a ${round(reducedInsulinRate)} UI/h hasta resolver acidosis/osmolaridad.`);
    }

    recommendations.push(`Déficit hídrico orientativo: CAD ~${round(deficitLow)} L; EHH puede llegar a ${round(deficitLow)}-${round(deficitHigh)} L. Reponer en 24-48 h según edad/comorbilidad.`);
    recommendations.push('Controles: HGT horario; gases/electrolitos/creatinina/cetonemia cada 2-4 h; balance estricto; buscar gatillante infeccioso, IAM, suspensión de insulina o iSGLT2.');

    const calcResult = {
      score: diagnosis,
      label: urgent ? 'Requiere manejo urgente y monitorización' : 'Manejo inicial protocolizado',
      interpretation: mixed
        ? 'Tiene hiperosmolaridad marcada y criterios de cetoacidosis: manejar como crisis mixta, priorizando fluidos, potasio, insulina y monitorización estrecha.'
        : dka
          ? 'Cumple criterios de cetoacidosis diabética por hiperglicemia/riesgo euglicémico, cetosis y acidosis metabólica.'
          : hhs
            ? 'Cumple criterios de estado hiperglicémico hiperosmolar: hiperglicemia severa, osmolaridad efectiva elevada y cetosis/acidosis no predominante.'
            : 'No hay criterios completos con los datos ingresados; revisar cetonas, anion gap, lactato, función renal y contexto clínico.',
      color: urgent ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300',
      medicationCards,
      sequenceSteps,
      recommendations,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setValues({
      glucose: '',
      sodium: '',
      potassium: '',
      ph: '',
      bicarbonate: '',
      betaHydroxybutyrate: '',
      chloride: '',
      weight: '70',
      mental: 'alert',
      euglycemicRisk: false,
    });
    setResult(null);
  };

  return (
    <CalculatorWrapper
      title="CAD/EHH: criterios y tratamiento inicial"
      description="Clasifica crisis hiperglicémica, calcula osmolaridad/Na corregido y ordena las primeras medidas."
      icon={Activity}
      gradientFrom="rose"
      gradientTo="orange"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={false}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label className="mb-2 block text-sm">Glicemia (mg/dL)</Label>
          <Input type="number" value={values.glucose} onChange={e => setField('glucose', e.target.value)} placeholder="Ej: 540" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Sodio medido (mEq/L)</Label>
          <Input type="number" value={values.sodium} onChange={e => setField('sodium', e.target.value)} placeholder="Ej: 132" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Potasio (mEq/L)</Label>
          <Input type="number" step="0.1" value={values.potassium} onChange={e => setField('potassium', e.target.value)} placeholder="Ej: 4.8" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">pH</Label>
          <Input type="number" step="0.01" value={values.ph} onChange={e => setField('ph', e.target.value)} placeholder="Ej: 7.18" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Bicarbonato (mEq/L)</Label>
          <Input type="number" value={values.bicarbonate} onChange={e => setField('bicarbonate', e.target.value)} placeholder="Ej: 12" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Beta-hidroxibutirato (mmol/L)</Label>
          <Input type="number" step="0.1" value={values.betaHydroxybutyrate} onChange={e => setField('betaHydroxybutyrate', e.target.value)} placeholder="Ej: 4.2" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Cloro (opcional)</Label>
          <Input type="number" value={values.chloride} onChange={e => setField('chloride', e.target.value)} placeholder="Para anion gap" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Peso (kg)</Label>
          <Input type="number" value={values.weight} onChange={e => setField('weight', e.target.value)} className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Estado mental</Label>
          <Select value={values.mental} onValueChange={value => setField('mental', value)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alert">Alerta</SelectItem>
              <SelectItem value="drowsy">Somnoliento/confuso</SelectItem>
              <SelectItem value="stupor">Estupor/coma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <input
          type="checkbox"
          checked={values.euglycemicRisk}
          onChange={e => setField('euglycemicRisk', e.target.checked)}
          className="mt-1"
        />
        <span>Riesgo de CAD euglicémica: iSGLT2, embarazo, ayuno prolongado o insulina suspendida.</span>
      </label>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-rose-200 bg-white/80 p-3">
          <FlaskConical className="mb-2 h-4 w-4 text-rose-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Criterios</p>
          <p className="mt-1 text-xs text-slate-600">CAD: glicemia/riesgo + cetosis + acidosis. EHH: glicemia muy alta + osmolaridad efectiva elevada.</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-white/80 p-3">
          <Droplets className="mb-2 h-4 w-4 text-orange-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Primero</p>
          <p className="mt-1 text-xs text-slate-600">Fluidos, potasio y monitorización antes de acelerar insulina.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white/80 p-3">
          <AlertTriangle className="mb-2 h-4 w-4 text-amber-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Escalar</p>
          <p className="mt-1 text-xs text-slate-600">CAD severa, EHH, K bajo, shock o compromiso de conciencia requieren monitorización estrecha.</p>
        </div>
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">{result.score}</div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>
          <div className="mt-4 rounded-lg border border-white/80 bg-white/80 p-4">
            <h4 className="mb-2 text-sm font-bold text-slate-900">Interpretación</h4>
            <p className="text-sm leading-relaxed text-slate-700">{result.interpretation}</p>
          </div>
          {result.sequenceSteps?.length > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-900">Orden de manejo</h4>
              <div className="grid gap-2">
                {result.sequenceSteps.map((step, index) => (
                  <div key={index} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{step.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.medicationCards?.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {result.medicationCards.map((card, index) => (
                <div key={index} className="rounded-2xl border-2 border-rose-300 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Fármaco / solución</p>
                      <h4 className="mt-1 text-lg font-black text-slate-950">{card.title}</h4>
                    </div>
                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                      {card.badge}
                    </span>
                  </div>
                  <div className="rounded-xl bg-rose-50 px-4 py-3 text-center">
                    <p className="text-2xl font-black text-rose-900">{card.dose}</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {card.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-2">
            {result.recommendations.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CalculatorReferences references={references} note="Herramienta de apoyo. Ajustar por edad, cardiopatía, función renal, disponibilidad de bomba y protocolos institucionales." />
    </CalculatorWrapper>
  );
}
