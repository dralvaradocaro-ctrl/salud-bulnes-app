import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

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
    label: 'UK Kidney Association. Treatment of Acute Hyperkalaemia in Adults. 2023.',
    url: 'https://guidelines.ukkidney.org/hyperkalaemia/',
  },
  {
    label: 'European Resuscitation Council Guidelines 2021: Cardiac arrest in special circumstances.',
    url: 'https://www.sciencedirect.com/science/article/pii/S0300957221000642',
  },
  {
    label: 'AAFP. Potassium Disorders: Hypokalemia and Hyperkalemia. 2023.',
    url: 'https://www.aafp.org/pubs/afp/issues/2023/0100/potassium-disorders-hypokalemia-hyperkalemia.html',
  },
];

const correctedForPh = (k, ph) => {
  if (ph === null) return null;
  return k - 0.6 * ((7.4 - ph) / 0.1);
};

const classify = (k, ecg, arrest, symptoms) => {
  if (arrest) return { label: 'Hiperkalemia periparo/paro', color: 'bg-rose-50 border-rose-300', emergency: true };
  if (ecg || k >= 6.5 || symptoms) return { label: 'Hiperkalemia grave / urgente', color: 'bg-rose-50 border-rose-300', emergency: true };
  if (k >= 6) return { label: 'Hiperkalemia moderada', color: 'bg-amber-50 border-amber-300', emergency: true };
  if (k > 5) return { label: 'Hiperkalemia leve', color: 'bg-emerald-50 border-emerald-300', emergency: false };
  return { label: 'Kalemia no elevada', color: 'bg-slate-50 border-slate-300', emergency: false };
};

export default function HyperkalemiaManagementCalculator() {
  const [values, setValues] = useState({
    potassium: '',
    ph: '',
    glucose: '',
    ecg: false,
    symptoms: false,
    oliguria: false,
    acidosis: false,
    arrest: false,
    calciumAvailable: 'chloride',
  });
  const [result, setResult] = useState(null);

  const printableInputs = useMemo(() => [
    { label: 'K actual', value: values.potassium ? `${values.potassium} mEq/L` : '' },
    { label: 'pH', value: values.ph },
    { label: 'Glicemia', value: values.glucose ? `${values.glucose} mg/dL` : '' },
    { label: 'ECG alterado', value: values.ecg ? 'Sí' : 'No' },
  ], [values]);

  const setField = (field, value) => setValues(prev => ({ ...prev, [field]: value }));

  const handleCalculate = () => {
    const k = n(values.potassium);
    const ph = n(values.ph);
    const glucose = n(values.glucose);

    if (k === null) {
      const invalid = {
        score: 'Incompleto',
        label: 'Ingresa K actual',
        interpretation: 'Si hay QRS ancho, bradicardia, arritmia o paro, tratar como hiperkalemia grave mientras confirmas laboratorio.',
        color: 'bg-amber-50 border-amber-300',
        recommendations: ['No esperar confirmación si la clínica/ECG es compatible con toxicidad por K.'],
      };
      setResult(invalid);
      return invalid;
    }

    const classification = classify(k, values.ecg, values.arrest, values.symptoms);
    const correctedK = correctedForPh(k, ph);
    const needsCalcium = values.arrest || values.ecg || k >= 6.5;
    const needsShift = k >= 6 || values.ecg || values.symptoms || values.arrest;
    const glucosePlan = glucose !== null && glucose >= 250
      ? 'Glicemia >=250 mg/dL: se puede omitir o reducir carga inicial de glucosa, pero controlar HGT estrechamente.'
      : 'Dar glucosa junto a insulina: SG 10% 250 mL = 25 g o SG 30% 83 mL aprox = 25 g.';

    const sequenceSteps = [
      {
        title: '1. Confirmar y monitorizar',
        text: 'ECG inmediato, repetir muestra si sospecha pseudohiperkalemia, evaluar VFG/diuresis, pH, glicemia y fármacos.',
      },
      {
        title: '2. Proteger miocardio si corresponde',
        text: needsCalcium ? 'Calcio EV ahora por ECG alterado, K >=6,5 o paro/periparo.' : 'Sin ECG alterado y K <6,5: calcio no siempre es necesario; seguir monitorizando.',
      },
      {
        title: '3. Shift intracelular',
        text: needsShift ? 'Insulina cristalina + glucosa y salbutamol; bicarbonato si acidosis metabólica.' : 'Si leve y estable: retirar gatillantes, dieta baja en K y control seriado.',
      },
      {
        title: '4. Eliminar K del cuerpo',
        text: values.oliguria ? 'Oliguria/anuria o ERC avanzada: evaluar diálisis/traslado; furosemida no servirá sin diuresis.' : 'Si hay diuresis y volemia adecuada, considerar furosemida; resinas/quelantes si disponibles.',
      },
      {
        title: '5. Recontrol',
        text: 'Repetir K y ECG a 1-2 h según gravedad; HGT 0, 30, 60, 90, 120 min y luego según riesgo tras insulina.',
      },
    ];

    const calciumCard = values.calciumAvailable === 'gluconate'
      ? {
        title: 'Gluconato de calcio 10%',
        dose: '30 mL EV en 10 min',
        badge: 'Si disponible',
        details: [
          'Inicio 1-3 min; repetir si persisten cambios ECG.',
          'No baja K: solo estabiliza membrana.',
        ],
      }
      : {
        title: 'Cloruro de calcio 10%',
        dose: '10 mL EV lento',
        badge: 'Alternativa local',
        details: [
          'Preferir vía central o vena segura; extravasación es lesiva.',
          'Usar si gluconato no está disponible y hay toxicidad ECG/periparo.',
        ],
      };

    const medicationCards = [
      calciumCard,
      {
        title: 'Insulina cristalina + glucosa',
        dose: '10 UI EV + 25 g glucosa',
        badge: 'Shift K',
        details: [
          'SG 10% 250 mL = 25 g; SG 30% 83 mL aprox = 25 g.',
          glucosePlan,
          'Esperar descenso K ~0,6-1,0 mEq/L; vigilar hipoglicemia por 4-6 h.',
        ],
      },
      {
        title: 'Salbutamol nebulizado',
        dose: '10-20 mg nebulizado',
        badge: 'Adyuvante',
        details: [
          'Solución 5 mg/mL: 2-4 mL nebulizados.',
          'No usar como único tratamiento en hiperkalemia grave.',
        ],
      },
      {
        title: 'Bicarbonato 8,4%',
        dose: '50 mEq EV',
        badge: 'Si acidosis',
        details: [
          'Útil principalmente si acidosis metabólica significativa.',
          '8,4% suele equivaler a 1 mEq/mL: 50 mEq ≈ 50 mL.',
        ],
      },
      {
        title: 'Furosemida',
        dose: '20-40 mg EV',
        badge: 'Si diuresis',
        details: [
          'Presentación local 20 mg/mL: 1-2 mL.',
          'No sirve en anuria; corregir volemia si hipovolémico.',
        ],
      },
    ];

    const recommendations = [
      correctedK !== null ? `K corregido aproximado a pH 7,40: ${round(correctedK, 1)} mEq/L. Si pH bajo, parte de la hiperkalemia puede ser por shift; igual tratar si grave/ECG.` : 'Si hay acidosis/alcalosis, interpreta K con pH: el pH desplaza K entre intra y extracelular.',
      glucosePlan,
      needsCalcium ? 'Calcio primero si ECG alterado, K >=6,5 o periparo. Repetir si ECG no mejora.' : 'Si K leve sin ECG alterado, priorizar confirmar, retirar fármacos gatillantes y seguimiento.',
      needsShift ? 'Insulina/glucosa y salbutamol compran tiempo, pero no eliminan K: planificar eliminación y recontrol.' : 'No urgente: revisar IECA/ARA-II/espironolactona/AINES/sales de K, dieta y función renal.',
      values.oliguria ? 'Oliguria/anuria: alto riesgo de rebote. Coordinar traslado/nefrología para diálisis si refractaria o grave.' : 'Con diuresis conservada, furosemida puede ayudar a eliminar K si volemia lo permite.',
      values.acidosis ? 'Acidosis marcada: bicarbonato puede ayudar como adyuvante, además de tratar la causa.' : 'Bicarbonato no es de rutina si no hay acidosis metabólica relevante.',
      'Solo apoyo clínico: siempre correlacionar con ECG, velocidad de instalación, función renal y disponibilidad local.',
    ];

    const calcResult = {
      score: classification.label,
      label: `K ${round(k, 1)} mEq/L`,
      interpretation: 'Apoyo para ordenar urgencia, secuencia y fármacos. No reemplaza ECG ni criterio clínico.',
      color: classification.color,
      sequenceSteps,
      medicationCards,
      recommendations,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setValues({
      potassium: '',
      ph: '',
      glucose: '',
      ecg: false,
      symptoms: false,
      oliguria: false,
      acidosis: false,
      arrest: false,
      calciumAvailable: 'chloride',
    });
    setResult(null);
  };

  return (
    <CalculatorWrapper
      title="Hiperkalemia: urgencia y manejo inicial"
      description="Ordena estabilización, shift, eliminación y equivalencias con arsenal local."
      icon={Zap}
      gradientFrom="rose"
      gradientTo="orange"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={false}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Label className="mb-2 block text-sm">K actual (mEq/L)</Label>
          <Input type="number" step="0.1" value={values.potassium} onChange={e => setField('potassium', e.target.value)} placeholder="Ej: 6.4" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">pH opcional</Label>
          <Input type="number" step="0.01" value={values.ph} onChange={e => setField('ph', e.target.value)} placeholder="Ej: 7.20" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Glicemia opcional</Label>
          <Input type="number" value={values.glucose} onChange={e => setField('glucose', e.target.value)} placeholder="mg/dL" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Calcio disponible</Label>
          <Select value={values.calciumAvailable} onValueChange={value => setField('calciumAvailable', value)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="chloride">Cloruro de calcio 10%</SelectItem>
              <SelectItem value="gluconate">Gluconato de calcio 10%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          ['ecg', 'Cambios ECG: T picudas, PR largo, QRS ancho, bradiarritmia, sinusoide.'],
          ['symptoms', 'Síntomas: debilidad, parálisis, palpitaciones o compromiso neuromuscular.'],
          ['oliguria', 'Oliguria/anuria, ERC avanzada o alto riesgo de rebote.'],
          ['acidosis', 'Acidosis metabólica significativa.'],
          ['arrest', 'Paro/periparo o arritmia grave compatible.'],
        ].map(([field, label]) => (
          <label key={field} className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
            <input type="checkbox" checked={values[field]} onChange={e => setField(field, e.target.checked)} className="mt-1" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">{result.score}</div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>
          <div className="mt-4 rounded-lg border border-white/80 bg-white/80 p-4">
            <h4 className="mb-2 text-sm font-bold text-slate-900">Advertencia</h4>
            <p className="text-sm leading-relaxed text-slate-700">{result.interpretation}</p>
          </div>

          <div className="mt-4 rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-900">Orden de manejo</h4>
            <div className="grid gap-2">
              {result.sequenceSteps.map((step, index) => (
                <div key={index} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">{index + 1}</div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {result.medicationCards.map((card, index) => (
              <div key={index} className="rounded-2xl border-2 border-rose-300 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Fármaco / solución</p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">{card.title}</h4>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">{card.badge}</span>
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

      <CalculatorReferences references={references} note="Solo apoyo clínico: en hiperkalemia manda el ECG, la clínica y la velocidad de instalación. Recontrolar K y HGT seriados." />
    </CalculatorWrapper>
  );
}
