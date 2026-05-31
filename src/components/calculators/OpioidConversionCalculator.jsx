import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, AlertTriangle, Calculator, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OPIOIDS = {
  morphine_po: { label: 'Morfina VO', unit: 'mg/día', eqTo30Ome: 30, kind: 'mg' },
  morphine_sc_iv: { label: 'Morfina SC/EV', unit: 'mg/día', eqTo30Ome: 12.5, kind: 'mg' },
  codeine_po: { label: 'Codeína VO', unit: 'mg/día', eqTo30Ome: 220, kind: 'mg' },
  tramadol_po: { label: 'Tramadol VO', unit: 'mg/día', eqTo30Ome: 150, kind: 'mg' },
  oxycodone_po: { label: 'Oxicodona VO', unit: 'mg/día', eqTo30Ome: 17.5, kind: 'mg' },
  hydromorphone_po: { label: 'Hidromorfona VO', unit: 'mg/día', eqTo30Ome: 5, kind: 'mg' },
  tapentadol_po: { label: 'Tapentadol VO', unit: 'mg/día', eqTo30Ome: 125, kind: 'mg' },
  fentanyl_td: { label: 'Fentanilo transdérmico', unit: 'mcg/h', eqTo30Ome: 12, kind: 'patch' },
  buprenorphine_td: { label: 'Buprenorfina transdérmica', unit: 'mcg/h', eqTo30Ome: 26, kind: 'patch' },
};

const TARGET_OPTIONS = Object.entries(OPIOIDS).filter(([key]) => key !== 'methadone_po');
const PATCH_STRENGTHS = {
  fentanyl_td: [25, 50],
  buprenorphine_td: [35],
};

const roundTo = (value, decimals = 1) => {
  if (!Number.isFinite(value)) return '';
  return Number(value.toFixed(decimals)).toString();
};

const percentDiff = (actual, target) => {
  if (!target) return '';
  const diff = ((actual - target) / target) * 100;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${roundTo(diff, 0)}%`;
};

const references = [
  {
    label: 'Merck Manual Professional. Equianalgesic Doses of Opioid Analgesics.',
    url: 'https://www.merckmanuals.com/professional/multimedia/table/equianalgesic-doses-of-opioid-analgesics',
  },
  {
    label: 'Faculty of Pain Medicine. Dose equivalents and changing opioids.',
    url: 'https://fpm.ac.uk/opioids-aware-structured-approach-opioid-prescribing/dose-equivalents-and-changing-opioids',
  },
  {
    label: 'NCI PDQ. Approximate Dose Equivalents for Opioid Analgesics.',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK65949.1/table/CDR0000062738__557/',
  },
];

const roundDose = (dose, unit) => {
  if (!Number.isFinite(dose)) return '';
  if (unit === 'mcg/h') return dose < 20 ? dose.toFixed(1) : Math.round(dose).toString();
  if (dose < 10) return dose.toFixed(1);
  return Math.round(dose).toString();
};

const closestPatch = (key, dose) => {
  const strengths = PATCH_STRENGTHS[key];
  if (!strengths) return null;
  return strengths.reduce((closest, current) =>
    Math.abs(current - dose) < Math.abs(closest - dose) ? current : closest
  );
};

const buildPatchPlan = (key, dose) => {
  if (key === 'fentanyl_td') {
    const combos = [
      { label: '1 parche 25 mcg/h c/72 h', dose: 25 },
      { label: '1 parche 50 mcg/h c/72 h', dose: 50 },
      { label: '1 parche 25 + 1 parche 50 mcg/h c/72 h', dose: 75 },
      { label: '2 parches 50 mcg/h c/72 h', dose: 100 },
    ];
    const best = combos.reduce((closest, current) =>
      Math.abs(current.dose - dose) < Math.abs(closest.dose - dose) ? current : closest
    );
    return [
      {
        title: 'Fentanilo transdérmico HCSFB',
        lines: [
          'Presentación local: parches 25 y 50 mcg/h.',
          `Opción práctica más cercana: ${best.label} = ${best.dose} mcg/h (${percentDiff(best.dose, dose)} vs cálculo).`,
          dose < 25 ? 'El cálculo queda bajo el parche local mínimo: preferir titulación con morfina u otra alternativa antes de parche.' : null,
          'Usar solo en dolor estable y paciente tolerante a opioides; mantener rescate de acción rápida.',
        ].filter(Boolean),
      },
    ];
  }

  if (key === 'buprenorphine_td') {
    return [
      {
        title: 'Buprenorfina transdérmica HCSFB',
        lines: [
          'Presentación local registrada: parche 35 mcg/h.',
          `Comparación: parche 35 mcg/h (${percentDiff(35, dose)} vs cálculo de ${roundDose(dose, 'mcg/h')} mcg/h).`,
          'Si el cálculo queda lejos de 35 mcg/h, no forzar equivalencia: preferir ajuste por equipo con experiencia.',
        ],
      },
    ];
  }

  return [];
};

const buildLocalDosingPlans = (targetKey, dose) => {
  if (!Number.isFinite(dose) || dose <= 0) return [];

  if (targetKey === 'tramadol_po') {
    const dropsPerMg = 1 / 2.5; // 100 mg/mL; aprox. 2,5 mg/gota.
    const q8Drops = Math.max(1, Math.round((dose / 3) * dropsPerMg));
    const q8DropsDaily = q8Drops * 2.5 * 3;
    const q6Drops = Math.max(1, Math.round((dose / 4) * dropsPerMg));
    const q6DropsDaily = q6Drops * 2.5 * 4;
    const q8Tabs = Math.max(0.5, Math.round((dose / 3 / 50) * 2) / 2);
    const q8TabsDaily = q8Tabs * 50 * 3;
    const q6HalfDaily = 0.5 * 50 * 4;
    return [
      {
        title: 'Tramadol VO HCSFB',
        lines: [
          'Presentaciones locales: comprimido 50 mg, gotas 100 mg/mL (~2,5 mg/gota), ampolla 100 mg/mL.',
          `Gotas c/8 h: ${q8Drops} gotas c/8 h = ${roundTo(q8DropsDaily, 1)} mg/día (${percentDiff(q8DropsDaily, dose)}).`,
          `Gotas c/6 h: ${q6Drops} gotas c/6 h = ${roundTo(q6DropsDaily, 1)} mg/día (${percentDiff(q6DropsDaily, dose)}).`,
          `Comprimidos: ${roundTo(q8Tabs, 1)} comp de 50 mg c/8 h = ${roundTo(q8TabsDaily, 0)} mg/día (${percentDiff(q8TabsDaily, dose)}).`,
          `Alternativa simple si se quiere evitar sobrepasar: 1/2 comp c/6 h = ${q6HalfDaily} mg/día (${percentDiff(q6HalfDaily, dose)}).`,
        ],
      },
    ];
  }

  if (targetKey === 'morphine_po') {
    const dropsPerMg = 1 / 1.25; // 20 mg/mL; protocolo: 20 mg = 16 gotas.
    const q4Drops = Math.max(1, Math.round((dose / 6) * dropsPerMg));
    const q4DropsDaily = q4Drops * 1.25 * 6;
    const q6Drops = Math.max(1, Math.round((dose / 4) * dropsPerMg));
    const q6DropsDaily = q6Drops * 1.25 * 4;
    const lpHalfTabs = Math.max(0.5, Math.round((dose / 2 / 30) * 2) / 2);
    const lpDaily = lpHalfTabs * 30 * 2;
    return [
      {
        title: 'Morfina VO HCSFB',
        lines: [
          'Presentaciones locales: gotas 2% (20 mg/mL; ~1,25 mg/gota) y comprimido LP 30 mg.',
          `Gotas IR c/4 h: ${q4Drops} gotas c/4 h = ${roundTo(q4DropsDaily, 1)} mg/día (${percentDiff(q4DropsDaily, dose)}).`,
          `Gotas IR c/6 h: ${q6Drops} gotas c/6 h = ${roundTo(q6DropsDaily, 1)} mg/día (${percentDiff(q6DropsDaily, dose)}).`,
          dose >= 45
            ? `Si dolor estable: ${roundTo(lpHalfTabs, 1)} comp LP 30 mg c/12 h = ${roundTo(lpDaily, 0)} mg/día (${percentDiff(lpDaily, dose)}).`
            : 'Dosis baja: preferir gotas IR para titulación; comprimido LP 30 mg puede ser demasiado rígido.',
        ],
      },
    ];
  }

  if (targetKey === 'morphine_sc_iv') {
    const q4Mg = dose / 6;
    const q4Ml10 = q4Mg / 10;
    const infusionMl10 = dose / 10;
    const infusionMl20 = dose / 20;
    return [
      {
        title: 'Morfina SC/EV HCSFB',
        lines: [
          'Presentaciones locales: ampollas 10 mg/mL y 20 mg/mL.',
          `Fraccionada c/4 h: ${roundTo(q4Mg, 1)} mg c/4 h = ${roundTo(q4Ml10, 2)} mL por dosis usando 10 mg/mL.`,
          `Infusión continua 24 h: ${roundTo(dose, 1)} mg/día = ${roundTo(infusionMl10, 2)} mL/día de 10 mg/mL o ${roundTo(infusionMl20, 2)} mL/día de 20 mg/mL.`,
          'En SC/EV titular por EVA, sedación y frecuencia respiratoria.',
        ],
      },
    ];
  }

  if (targetKey === 'fentanyl_td' || targetKey === 'buprenorphine_td') {
    return buildPatchPlan(targetKey, dose);
  }

  if (targetKey === 'codeine_po') {
    return [
      {
        title: 'Codeína',
        lines: [
          'No encontré codeína como presentación local HCSFB en los seed de arsenal disponibles.',
          'En práctica local, usar tramadol como opioide débil si corresponde o escalar según protocolo.',
        ],
      },
    ];
  }

  return [
    {
      title: OPIOIDS[targetKey]?.label || 'Presentación local',
      lines: [
        'No hay presentación local HCSFB registrada en los seed de arsenal disponibles para este opioide.',
        'Usar equivalencia solo como referencia y confirmar disponibilidad con farmacia/arsenal vigente.',
      ],
    },
  ];
};

const calculateOme = (sourceKey, dailyDose) => {
  const source = OPIOIDS[sourceKey];
  return (Number(dailyDose) / source.eqTo30Ome) * 30;
};

const calculateTarget = (targetKey, ome) => {
  const target = OPIOIDS[targetKey];
  return (ome / 30) * target.eqTo30Ome;
};

export default function OpioidConversionCalculator() {
  const [values, setValues] = useState({
    source: 'morphine_po',
    dailyDose: '',
    target: 'morphine_sc_iv',
    reduction: '30',
    highRisk: false,
  });
  const [result, setResult] = useState(null);

  const source = OPIOIDS[values.source];
  const target = OPIOIDS[values.target];

  const printableInputs = useMemo(() => {
    const inputs = {
      'Opioide actual': source?.label,
      'Dosis diaria total actual': values.dailyDose ? `${values.dailyDose} ${source?.unit}` : '',
      'Opioide destino': target?.label,
      'Reducción por tolerancia cruzada': `${values.reduction}%`,
    };
    if (values.highRisk) inputs['Contexto de alto riesgo'] = 'Sí';
    return inputs;
  }, [source, target, values]);

  const handleCalculate = () => {
    const dailyDose = Number(values.dailyDose);
    if (!values.source || !values.target || !dailyDose || dailyDose <= 0) {
      alert('Completa opioide actual, dosis diaria total y opioide destino.');
      return null;
    }

    const ome = calculateOme(values.source, dailyDose);
    const equianalgesicDose = calculateTarget(values.target, ome);
    const reduction = Number(values.reduction) / 100;
    const conservativeDose = equianalgesicDose * (1 - reduction);
    const patch = closestPatch(values.target, conservativeDose);
    const localPlans = buildLocalDosingPlans(values.target, conservativeDose);
    const highOme = ome >= 200;
    const veryHighOme = ome >= 500;
    const targetLabel = `${roundDose(conservativeDose, target.unit)} ${target.unit}`;

    const warnings = [
      'Usar como punto de partida clínico, no como orden automática.',
      'Prescribir rescate de acción rápida y reevaluar analgesia/sedación a 24-72 h.',
      values.reduction === '25'
        ? 'Reducción 25%: razonable si el motivo principal es analgesia insuficiente.'
        : 'Reducción conservadora: apropiada si hay toxicidad, fragilidad, edad avanzada o comorbilidad.',
      highOme ? 'OME elevada: considerar revisión por cuidados paliativos/dolor antes de rotar.' : null,
      veryHighOme ? 'OME >=500 mg/día: las guías recomiendan reducciones mayores y supervisión experta.' : null,
      values.target === 'fentanyl_td' ? 'Fentanilo TD: solo en dolor estable y paciente tolerante a opioides; no usar en dolor agudo/inestable.' : null,
      values.target === 'buprenorphine_td' ? 'Buprenorfina TD: planificar transición desde agonistas completos en dosis altas para evitar abstinencia.' : null,
    ].filter(Boolean);

    const calcResult = {
      score: targetLabel,
      label: `Dosis inicial sugerida de ${target.label}`,
      color: values.highRisk || highOme ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200',
      interpretation: `${source.label} ${dailyDose} ${source.unit} equivale aproximadamente a ${roundDose(ome, 'mg/día')} mg/día de morfina oral. La dosis equianalgésica de ${target.label} sería ${roundDose(equianalgesicDose, target.unit)} ${target.unit}; tras reducir ${values.reduction}% por tolerancia cruzada incompleta, iniciar cerca de ${targetLabel}.`,
      recommendations: [
        patch ? `» Presentación/parche cercano: ${patch} ${target.unit}. Ajustar a disponibilidad local y contexto clínico.` : null,
        '━━━ SEGURIDAD ━━━',
        ...warnings,
        '━━━ RESCATE ━━━',
        'Rescate habitual: 10-15% de la dosis diaria total del opioide basal, ajustado a vía, formulación y contexto.',
      ].filter(Boolean),
      localPlans,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setValues({
      source: 'morphine_po',
      dailyDose: '',
      target: 'morphine_sc_iv',
      reduction: '30',
      highRisk: false,
    });
    setResult(null);
  };

  return (
    <CalculatorWrapper
      title="Equivalencia y rotación de opioides"
      description="Convierte dosis diaria actual a morfina oral equivalente y propone dosis inicial reducida."
      icon={ArrowRightLeft}
      gradientFrom="indigo"
      gradientTo="purple"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={false}
    >
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-2 block text-sm">Opioide actual</Label>
          <Select value={values.source} onValueChange={(sourceValue) => setValues(prev => ({ ...prev, source: sourceValue }))}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OPIOIDS).map(([key, opioid]) => (
                <SelectItem key={key} value={key}>{opioid.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block text-sm">Dosis diaria total actual <span className="text-slate-500">({source.unit})</span></Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={values.dailyDose}
            onChange={(event) => setValues(prev => ({ ...prev, dailyDose: event.target.value }))}
            placeholder="Incluye basal + rescates de 24 h"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="mb-2 block text-sm">Opioide destino</Label>
          <Select value={values.target} onValueChange={(targetValue) => setValues(prev => ({ ...prev, target: targetValue }))}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_OPTIONS.map(([key, opioid]) => (
                <SelectItem key={key} value={key}>{opioid.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block text-sm">Reducción por tolerancia cruzada incompleta</Label>
          <Select value={values.reduction} onValueChange={(reduction) => setValues(prev => ({ ...prev, reduction }))}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25% - dolor mal controlado</SelectItem>
              <SelectItem value="30">30% - estándar conservador</SelectItem>
              <SelectItem value="50">50% - fragilidad/toxicidad/dosis alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <input
          type="checkbox"
          checked={values.highRisk}
          onChange={(event) => setValues(prev => ({ ...prev, highRisk: event.target.checked }))}
          className="mt-1"
        />
        <span>
          Paciente frágil, adulto mayor, insuficiencia renal/hepática, toxicidad actual o polifarmacia sedante.
        </span>
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-indigo-200 bg-white/80 p-3">
          <Calculator className="mb-2 h-4 w-4 text-indigo-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Método</p>
          <p className="mt-1 text-xs text-slate-600">Dosis actual → OME → opioide destino → reducción 25-50%.</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white/80 p-3">
          <ShieldCheck className="mb-2 h-4 w-4 text-emerald-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Rescate</p>
          <p className="mt-1 text-xs text-slate-600">Dejar rescate y reevaluar a 24-72 h según dolor, sedación y eventos adversos.</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-white/80 p-3">
          <AlertTriangle className="mb-2 h-4 w-4 text-rose-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Límite</p>
          <p className="mt-1 text-xs text-slate-600">Metadona no se automatiza: requiere conversión no lineal y equipo experto.</p>
        </div>
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900">{result.score}</div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>

          <div className="mt-5 rounded-lg border border-white/80 bg-white/80 p-4">
            <h4 className="mb-2 text-sm font-bold text-slate-900">Interpretación</h4>
            <p className="break-words text-sm leading-relaxed text-slate-700">{result.interpretation}</p>
          </div>

          {result.localPlans?.length > 0 && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-white/90 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-900">Aterrizaje con arsenal local Bulnes</h4>
              </div>
              <div className="space-y-3">
                {result.localPlans.map((plan, index) => (
                  <div key={index} className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-800">{plan.title}</p>
                    <div className="space-y-1.5">
                      {plan.lines.map((line, lineIndex) => (
                        <div key={lineIndex} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <span className="break-words">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {result.recommendations.map((recommendation, index) => {
              if (/^━+/.test(recommendation)) {
                const label = recommendation.replace(/━/g, '').trim();
                return (
                  <div key={index} className="pt-2 first:pt-0">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      {label}
                    </span>
                  </div>
                );
              }
              if (recommendation.startsWith('»')) {
                return (
                  <div key={index} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-900">
                    {recommendation.replace(/^»\s*/, '')}
                  </div>
                );
              }
              return (
                <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{recommendation}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CalculatorReferences
        references={references}
        note="Las equivalencias son aproximadas. No sustituyen juicio clínico, evaluación de función renal/hepática ni normativa local de opioides."
      />
    </CalculatorWrapper>
  );
}
