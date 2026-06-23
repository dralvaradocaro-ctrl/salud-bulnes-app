import React, { useMemo, useState } from 'react';
import { Pill, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return '';
  return Number(value.toFixed(digits)).toString();
};

const KCL_TABLET_MEQ = 8;
const KCL_AMP_MEQ = 13.4;

const references = [
  {
    label: 'AAFP. Potassium Disorders: Hypokalemia and Hyperkalemia. 2023.',
    url: 'https://www.aafp.org/pubs/afp/issues/2023/0100/potassium-disorders-hypokalemia-hyperkalemia.html',
  },
  {
    label: 'Merck Manual Professional. Hypokalemia.',
    url: 'https://www.merckmanuals.com/professional/endocrine-and-metabolic-disorders/electrolyte-disorders/hypokalemia',
  },
  {
    label: 'StatPearls. Potassium Chloride.',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK557785/',
  },
];

const classifyK = (k, symptoms, ecg) => {
  if (k < 2.5 || symptoms || ecg) return { label: 'Hipokalemia grave / urgente', color: 'bg-rose-50 border-rose-300' };
  if (k < 3) return { label: 'Hipokalemia moderada', color: 'bg-amber-50 border-amber-300' };
  if (k < 3.5) return { label: 'Hipokalemia leve', color: 'bg-emerald-50 border-emerald-300' };
  return { label: 'Kalemia no baja', color: 'bg-slate-50 border-slate-300' };
};

const correctedForPh = (k, ph) => {
  if (ph === null) return null;
  return k - 0.6 * ((7.4 - ph) / 0.1);
};

export default function HypokalemiaCorrectionCalculator() {
  const [values, setValues] = useState({
    potassium: '',
    target: '4.0',
    ph: '',
    glucose: '',
    route: 'auto',
    symptoms: false,
    ecg: false,
    renalRisk: false,
    magnesiumLow: false,
    ongoingLosses: false,
  });
  const [result, setResult] = useState(null);

  const printableInputs = useMemo(() => [
    { label: 'K actual', value: values.potassium ? `${values.potassium} mEq/L` : '' },
    { label: 'Meta', value: values.target ? `${values.target} mEq/L` : '' },
    { label: 'pH', value: values.ph },
    { label: 'Glicemia', value: values.glucose ? `${values.glucose} mg/dL` : '' },
  ], [values]);

  const setField = (field, value) => setValues(prev => ({ ...prev, [field]: value }));

  const handleCalculate = () => {
    const k = toNumber(values.potassium);
    const target = toNumber(values.target) ?? 4;
    const ph = toNumber(values.ph);
    const glucose = toNumber(values.glucose);

    if (k === null || target === null) {
      const invalid = {
        score: 'Incompleto',
        label: 'Ingresa K actual y meta',
        interpretation: 'Esta calculadora estima reposición inicial. No reemplaza ECG, función renal, diuresis ni control seriado.',
        color: 'bg-amber-50 border-amber-300',
        recommendations: ['Si hay arritmia, debilidad severa o K <2,5 mEq/L, manejar como urgencia con monitorización.'],
      };
      setResult(invalid);
      return invalid;
    }

    const desiredDelta = Math.max(0, target - k);
    const deficitLow = desiredDelta * 100;
    const deficitHigh = desiredDelta * 200;
    const correctedK = correctedForPh(k, ph);
    const classification = classifyK(k, values.symptoms, values.ecg);
    const urgent = k < 2.5 || values.symptoms || values.ecg;
    const oralTabletsLow = Math.ceil(deficitLow / KCL_TABLET_MEQ);
    const oralTabletsHigh = Math.ceil(deficitHigh / KCL_TABLET_MEQ);
    const ampLow = deficitLow / KCL_AMP_MEQ;
    const ampHigh = deficitHigh / KCL_AMP_MEQ;
    const recommendedRoute = values.route === 'auto'
      ? urgent ? 'EV monitorizada' : k < 3 ? 'VO o EV periférica según tolerancia' : 'VO preferente'
      : values.route;

    // ── Orden EV lista (bolsa periférica estándar) ──
    const PERIPH_RATE = 10;   // mEq/h máx periférica
    const PERIPH_CONC = 40;   // mEq/L máx periférica
    const BAG_MEQ = 40;       // mEq por bolsa estándar
    const ampsPerBag = Math.round(BAG_MEQ / KCL_AMP_MEQ);          // ≈3 amp
    const volPerBag = Math.round(BAG_MEQ / PERIPH_CONC * 1000);    // 1000 mL
    const hoursPerBag = Math.round(BAG_MEQ / PERIPH_RATE);         // 4 h
    const bagsLow = Math.max(1, Math.round(deficitLow / BAG_MEQ));
    const bagsHigh = Math.max(1, Math.round(deficitHigh / BAG_MEQ));

    const medicationCards = [
      {
        title: 'Cloruro de potasio VO',
        dose: `${oralTabletsLow}-${oralTabletsHigh} comp de 600 mg`,
        badge: '600 mg = 8 mEq',
        details: [
          `Es el total para el déficit, no una sola toma: repartir en tomas de ≤5 comp (40 mEq), varias al día, hasta completar ${oralTabletsLow}-${oralTabletsHigh} comp con control de K.`,
          'Preferir VO si K >=3,0, sin síntomas graves y con tubo digestivo funcionante.',
          'Evitar más de 40 mEq por toma si hay mala tolerancia gástrica.',
        ],
      },
      {
        title: 'Cloruro de potasio EV 10%',
        dose: `${ampsPerBag} amp en ${volPerBag} mL SF · ${hoursPerBag} h EV`,
        badge: '10 mL ≈ 13,4 mEq',
        details: [
          `Indicación por bolsa: ${ampsPerBag} amp KCl 10% (${BAG_MEQ} mEq) en ${volPerBag} mL de SF 0,9% EV periférica, a pasar en ${hoursPerBag} h (10 mEq/h, ≤40 mEq/L).`,
          `No es dosis única: se repite hasta corregir. Para el déficit estimado (~${round(deficitLow, 0)}-${round(deficitHigh, 0)} mEq) son ≈ ${bagsLow}-${bagsHigh} bolsas iguales, una tras otra.`,
          `Recontrolar K cada 2-4 h y suspender al llegar a la meta (no completar las bolsas "a ciegas"; el déficit es estimado).`,
          `Si urge o es mucho volumen: 2 vías periféricas en paralelo (${ampsPerBag} amp c/u ≈ ${BAG_MEQ * 2} mEq en ${hoursPerBag} h) o vía central/monitorizada (mayor concentración y hasta ~20 mEq/h con ECG).`,
          'Usar EV si grave, síntomas, ECG, intolerancia VO u hospitalizado con pérdidas activas.',
        ],
      },
    ];

    const recommendations = [
      `Déficit estimado para meta ${target} mEq/L: ${round(deficitLow, 0)}-${round(deficitHigh, 0)} mEq. Es una aproximación: redistribución y pérdidas activas cambian la respuesta.`,
      `Ruta sugerida: ${recommendedRoute}.`,
      correctedK !== null ? `K corregido aproximado a pH 7,40: ${round(correctedK, 1)} mEq/L. Regla usada: variación ~0,6 mEq/L por cada 0,1 de pH; usar con cautela.` : 'Si hay alcalosis/acidosis, interpreta K con pH: los cambios de pH desplazan K entre intra y extracelular.',
      glucose !== null && glucose > 250 ? 'Hiperglicemia/insulinopenia puede ocultar déficit corporal de K; al iniciar insulina el K puede caer rápido. Reponer y monitorizar más estrecho.' : 'Glicemia sin alerta mayor para desplazamiento por insulina según dato ingresado.',
      values.magnesiumLow ? 'Corregir magnesio: hipomagnesemia hace refractaria la reposición de K y aumenta riesgo arrítmico.' : 'Medir Mg plasmático; si está bajo, corregirlo junto con K.',
      values.ongoingLosses ? 'Hay pérdidas activas: diarrea, SNG, diuréticos o poliuria pueden exigir dosis mayores y controles más frecuentes.' : 'Buscar y tratar causa: pérdidas GI, diuréticos, alcalosis, hiperaldosteronismo, redistribución o baja ingesta.',
      urgent ? 'Urgente: ECG/telemetría, vía EV, control K cada 2-4 h y considerar mayor nivel de cuidado si arritmia, parálisis o K muy bajo.' : 'No urgente: reposición fraccionada y control de K en 6-24 h según severidad y función renal.',
      values.renalRisk ? 'Riesgo renal/oliguria: reducir dosis, evitar sobrecorrección y controlar K/creatinina estrechamente.' : 'Confirmar diuresis y función renal antes de reposición EV significativa.',
    ];

    const clinicalOrder = urgent || recommendedRoute.includes('EV')
      ? [
        `Hipokalemia ${classification.label.toLowerCase()} (K ${round(k, 1)} mEq/L). Solicitar ECG/monitorización, Mg, creatinina y control de K seriado.`,
        `Indicar KCl 10% ${ampsPerBag} ampollas (${BAG_MEQ} mEq) en ${volPerBag} mL de SF 0,9% EV periférico, pasar en ${hoursPerBag} h. Repetir según control hasta meta ${round(target, 1)} mEq/L.`,
        `Déficit estimado ${round(deficitLow, 0)}-${round(deficitHigh, 0)} mEq: considerar ${bagsLow}-${bagsHigh} bolsas en total, ajustando a K de control, diuresis y función renal.`,
        values.magnesiumLow ? 'Corregir magnesio en paralelo por hipomagnesemia conocida/sospechada.' : 'Medir magnesio y corregir si bajo, especialmente si reposición refractaria o riesgo arrítmico.',
      ]
      : [
        `Hipokalemia ${classification.label.toLowerCase()} (K ${round(k, 1)} mEq/L), sin criterios de urgencia ingresados.`,
        `Indicar KCl VO 600 mg: déficit estimado ${round(deficitLow, 0)}-${round(deficitHigh, 0)} mEq, equivalente a ${oralTabletsLow}-${oralTabletsHigh} comprimidos en total. Fraccionar en tomas de hasta 5 comprimidos (40 mEq) y controlar K.`,
        `Meta inicial ${round(target, 1)} mEq/L. Control de K en 6-24 h según severidad, función renal y pérdidas activas.`,
        values.ongoingLosses ? 'Registrar pérdidas activas y corregir causa; puede requerir reposición adicional.' : 'Buscar causa: pérdidas GI/urinarias, diuréticos, alcalosis, redistribución o baja ingesta.',
      ];

    const calcResult = {
      score: classification.label,
      label: `K ${round(k, 1)} mEq/L → meta ${round(target, 1)} mEq/L`,
      interpretation: 'Apoyo para ordenar reposición inicial. La respuesta real depende de pH, insulina, magnesio, función renal y pérdidas activas.',
      color: classification.color,
      clinicalOrder,
      medicationCards,
      recommendations,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setValues({
      potassium: '',
      target: '4.0',
      ph: '',
      glucose: '',
      route: 'auto',
      symptoms: false,
      ecg: false,
      renalRisk: false,
      magnesiumLow: false,
      ongoingLosses: false,
    });
    setResult(null);
  };

  return (
    <CalculatorWrapper
      title="Hipokalemia: reposición de KCl"
      description="Estima déficit, vía de reposición y equivalencias con comprimidos/ampollas locales."
      icon={Pill}
      gradientFrom="blue"
      gradientTo="cyan"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={false}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Label className="mb-2 block text-sm">K actual (mEq/L)</Label>
          <Input type="number" step="0.1" value={values.potassium} onChange={e => setField('potassium', e.target.value)} placeholder="Ej: 2.8" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Meta (mEq/L)</Label>
          <Input type="number" step="0.1" value={values.target} onChange={e => setField('target', e.target.value)} className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">pH opcional</Label>
          <Input type="number" step="0.01" value={values.ph} onChange={e => setField('ph', e.target.value)} placeholder="Ej: 7.50" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Glicemia opcional</Label>
          <Input type="number" value={values.glucose} onChange={e => setField('glucose', e.target.value)} placeholder="mg/dL" className="bg-white" />
        </div>
        <div className="md:col-span-2">
          <Label className="mb-2 block text-sm">Vía preferida</Label>
          <Select value={values.route} onValueChange={value => setField('route', value)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automática según severidad</SelectItem>
              <SelectItem value="VO preferente">VO preferente</SelectItem>
              <SelectItem value="EV periférica">EV periférica</SelectItem>
              <SelectItem value="EV monitorizada">EV monitorizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          ['symptoms', 'Síntomas graves: debilidad marcada, parálisis, íleo o palpitaciones.'],
          ['ecg', 'Cambios ECG compatibles o arritmia.'],
          ['renalRisk', 'VFG baja, oliguria o riesgo de sobrecorrección.'],
          ['magnesiumLow', 'Hipomagnesemia conocida/sospechada.'],
          ['ongoingLosses', 'Pérdidas activas: diarrea, SNG, diuréticos, poliuria.'],
        ].map(([field, label]) => (
          <label key={field} className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
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
          <div className="mt-4 rounded-2xl border-2 border-blue-400 bg-blue-50 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-blue-800">Indicación sugerida para ficha clínica</p>
            <div className="mt-3 space-y-2">
              {result.clinicalOrder.map((item, index) => (
                <p key={index} className="text-sm font-semibold leading-relaxed text-blue-950">{item}</p>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {result.medicationCards.map((card, index) => (
              <div key={index} className="rounded-2xl border-2 border-blue-300 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Arsenal local</p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">{card.title}</h4>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800">{card.badge}</span>
                </div>
                <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">
                  <p className="text-2xl font-black text-blue-900">{card.dose}</p>
                </div>
                <div className="mt-3 space-y-1.5">
                  {card.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
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

      <CalculatorReferences references={references} note="Solo apoyo clínico: confirmar concentración local, vía, monitorización y controles seriados antes de indicar KCl." />
    </CalculatorWrapper>
  );
}
