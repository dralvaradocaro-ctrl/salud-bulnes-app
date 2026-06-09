import React, { useState } from 'react';
import { Baby, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// PECARN — regla de decisión para TC de cerebro en TEC pediátrico (Kuppermann, Lancet 2009).
// Dos algoritmos según edad: < 2 años y ≥ 2 años.
const references = [
  {
    label: 'Kuppermann N, et al. Identification of children at very low risk of clinically-important brain injuries after head trauma (PECARN). Lancet. 2009;374:1160-70.',
    url: 'https://doi.org/10.1016/S0140-6736(09)61558-0',
  },
  {
    label: 'PECARN Pediatric Head Injury/Trauma Algorithm — MDCalc.',
    url: 'https://www.mdcalc.com/calc/589/pecarn-pediatric-head-injury-trauma-algorithm',
  },
];

// Predictores de "alto riesgo" (TC recomendada) e "intermedios" (observar vs TC) por edad.
// Formato del algoritmo PECARN (MDCalc): cada predictor es una pregunta Sí/No independiente.
const HIGH = {
  lt2: [
    { key: 'ams', label: 'GCS ≤ 14, o alteración del estado mental (agitación, somnolencia, preguntas repetitivas, respuesta lenta al hablar)' },
    { key: 'fx', label: 'Fractura de cráneo palpable' },
  ],
  gte2: [
    { key: 'ams', label: 'GCS ≤ 14, o alteración del estado mental' },
    { key: 'fx', label: 'Signos de fractura de base de cráneo' },
  ],
};
const INTERMEDIATE = {
  lt2: [
    { key: 'hematoma', label: 'Hematoma de cuero cabelludo occipital, parietal o temporal' },
    { key: 'loc', label: 'Pérdida de conciencia ≥ 5 segundos' },
    { key: 'mech', label: 'Mecanismo de lesión severo*' },
    { key: 'notNormal', label: 'No actúa normalmente según los padres' },
  ],
  gte2: [
    { key: 'loc', label: 'Antecedente de pérdida de conciencia' },
    { key: 'vomit', label: 'Antecedente de vómitos' },
    { key: 'mech', label: 'Mecanismo de lesión severo*' },
    { key: 'headache', label: 'Cefalea intensa' },
  ],
};
const SEVERE_MECH = {
  lt2: 'Mecanismo severo: accidente vehicular con eyección/muerte de otro pasajero/volcamiento; peatón o ciclista sin casco atropellado; caída > 0,9 m (3 pies); golpe en la cabeza por objeto de alto impacto.',
  gte2: 'Mecanismo severo: accidente vehicular con eyección/muerte/volcamiento; peatón o ciclista sin casco atropellado; caída > 1,5 m (5 pies); golpe en la cabeza por objeto de alto impacto.',
};

export default function PECARNCalculator() {
  const [age, setAge] = useState('lt2'); // 'lt2' | 'gte2'
  const [high, setHigh] = useState({});
  const [inter, setInter] = useState({});
  const [result, setResult] = useState(null);

  const setHighKey = (key, val) => setHigh((prev) => ({ ...prev, [key]: val }));
  const setInterKey = (key, val) => setInter((prev) => ({ ...prev, [key]: val }));

  const handleAgeChange = (value) => {
    setAge(value);
    setHigh({});
    setInter({});
    setResult(null);
  };

  const handleCalculate = () => {
    const interList = INTERMEDIATE[age];
    const interCount = interList.filter((it) => inter[it.key]).length;
    const isHigh = HIGH[age].some((it) => high[it.key]);

    let score, color, interpretation, recommendations;
    if (isHigh) {
      score = 'TC recomendada';
      color = 'bg-rose-50 border-rose-200';
      interpretation = `Predictor de alto riesgo presente. Riesgo de TEC clínicamente importante ≈ ${age === 'lt2' ? '4,4' : '4,3'}%. Se recomienda TC de cerebro.`;
      recommendations = [
        'Realizar TC de cerebro sin contraste.',
        'Manejo según hallazgos; valorar derivación a centro con neurocirugía si TC alterada.',
      ];
    } else if (interCount > 0) {
      score = 'Observar vs TC';
      color = 'bg-amber-50 border-amber-200';
      interpretation = `Sin predictores de alto riesgo, pero ${interCount} predictor(es) intermedio(s). Riesgo de TEC clínicamente importante ≈ 0,9%. Observación vs TC según criterio clínico.`;
      recommendations = [
        'Decidir TC vs observación según: experiencia del clínico, múltiples hallazgos vs aislado, empeoramiento, edad < 3 meses y preferencia de los padres.',
        'Si se observa: vigilancia clínica por 4-6 h; TC si deterioro o aparición de síntomas.',
      ];
    } else {
      score = 'TC no recomendada';
      color = 'bg-emerald-50 border-emerald-200';
      interpretation = 'Sin predictores de alto riesgo ni intermedios. Riesgo de TEC clínicamente importante < 0,05%. TC no recomendada de rutina.';
      recommendations = [
        'No se recomienda TC de rutina; el riesgo de radiación supera el beneficio.',
        'Indicaciones de reconsulta a los padres ante vómitos persistentes, alteración de conciencia, cefalea progresiva o convulsiones.',
      ];
    }

    const calcResult = {
      score,
      label: `PECARN ${age === 'lt2' ? '< 2 años' : '≥ 2 años'}`,
      color,
      interpretation,
      recommendations,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setHigh({});
    setInter({});
    setResult(null);
  };

  const printableInputs = [
    { label: 'Edad', value: age === 'lt2' ? '< 2 años' : '≥ 2 años' },
    ...HIGH[age].map((it) => ({ label: it.label, value: high[it.key] ? 'Sí' : 'No' })),
    ...INTERMEDIATE[age].map((it) => ({ label: it.label, value: inter[it.key] ? 'Sí' : 'No' })),
  ];

  const toggleClass = 'flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 cursor-pointer hover:border-slate-300';

  return (
    <CalculatorWrapper
      title="PECARN — TEC pediátrico"
      description="Regla de decisión para TC de cerebro tras traumatismo encefalocraneano en niños (Kuppermann 2009)."
      icon={Baby}
      gradientFrom="sky"
      gradientTo="blue"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={true}
    >
      <div className="mb-4 max-w-xs">
        <Label className="mb-2 block text-sm">Edad del paciente</Label>
        <Select value={age} onValueChange={handleAgeChange}>
          <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="lt2">Menor de 2 años</SelectItem>
            <SelectItem value="gte2">2 años o más</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-bold text-rose-700">Alto riesgo (cualquiera presente → TC recomendada)</p>
          <div className="space-y-2">
            {HIGH[age].map((it) => (
              <label key={it.key} className={toggleClass}>
                <input type="checkbox" checked={!!high[it.key]} onChange={(e) => setHighKey(it.key, e.target.checked)} className="mt-0.5" />
                <span>{it.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-amber-700">Predictores intermedios (observar vs TC)</p>
          <div className="space-y-2">
            {INTERMEDIATE[age].map((it) => (
              <label key={it.key} className={toggleClass}>
                <input type="checkbox" checked={!!inter[it.key]} onChange={(e) => setInterKey(it.key, e.target.checked)} className="mt-0.5" />
                <span>{it.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{SEVERE_MECH[age]}</p>
        </div>
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900">{result.score}</div>
            <p className="mt-1 text-sm text-slate-600">{result.label}</p>
          </div>
          <div className="mt-4 rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-sm leading-relaxed text-slate-700">{result.interpretation}</p>
          </div>
          <div className="mt-4 space-y-2">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CalculatorReferences references={references} note="Aplicar solo en TEC con GCS 14-15 y < 24 h de evolución. No reemplaza el juicio clínico ni la observación seriada." />
    </CalculatorWrapper>
  );
}
