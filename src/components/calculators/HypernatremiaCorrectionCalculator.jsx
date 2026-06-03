import React, { useMemo, useState } from 'react';
import { Droplet, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const toNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};
const round = (val, d = 1) => (Number.isFinite(val) ? Number(val.toFixed(d)) : '');

const references = [
  { label: 'AAFP. Sodium Disorders: Hyponatremia and Hypernatremia. 2023.', url: 'https://www.aafp.org/pubs/afp/issues/2023/1100/sodium-disorders.html' },
  { label: 'Adrogué HJ, Madias NE. Hypernatremia. N Engl J Med. 2000.', url: 'https://doi.org/10.1056/NEJM200005183422006' },
  { label: 'StatPearls. Hypernatremia.' },
];

export default function HypernatremiaCorrectionCalculator() {
  const [v, setV] = useState({ na: '', weight: '', sex: 'M', chronicity: 'desconocida' });
  const [result, setResult] = useState(null);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const tbwFactor = v.sex === 'F' ? 0.5 : 0.6;

  const printableInputs = useMemo(() => [
    { label: 'Na actual', value: v.na ? `${v.na} mEq/L` : '' },
    { label: 'Peso', value: v.weight ? `${v.weight} kg` : '' },
    { label: 'Sexo', value: v.sex === 'F' ? 'Femenino' : 'Masculino' },
  ], [v]);

  const handleCalculate = () => {
    const na = toNumber(v.na);
    const weight = toNumber(v.weight);
    if (na === null) {
      const invalid = { score: 'Incompleto', label: 'Ingresa el Na actual', color: 'bg-amber-50 border-amber-300', interpretation: 'Apoyo para la corrección inicial; no reemplaza el estado de volumen, las pérdidas en curso ni los controles seriados.', recommendations: [] };
      setResult(invalid); return invalid;
    }
    const tbw = weight ? weight * tbwFactor : null;
    const freeWaterDeficit = tbw !== null && na > 140 ? tbw * (na / 140 - 1) : null; // litros
    const limit24 = 10; // máximo descenso seguro de Na en 24 h (crónica)
    // Con SG 5% (Na 0): ΔNa por litro ≈ (0 - Na)/(TBW+1).
    const deltaPerLiterD5 = tbw !== null ? (0 - na) / (tbw + 1) : null;
    const classification = na <= 150 ? 'Hipernatremia leve' : na <= 160 ? 'Hipernatremia moderada' : 'Hipernatremia grave';
    const color = na > 160 ? 'bg-rose-50 border-rose-300' : na > 150 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300';

    // Volumen total a reponer ≈ déficit de agua libre + mantención + pérdidas; aquí estimamos el déficit.
    const litersOver24 = freeWaterDeficit !== null ? freeWaterDeficit : null;
    const rateMlH = litersOver24 !== null ? (litersOver24 * 1000) / 24 : null;

    const recommendations = [
      `Clasificación: ${classification} (Na ${round(na)} mEq/L).`,
      `⚠️ LÍMITE 24 h: NO bajar el Na más de ${limit24} mEq/L (≈ 0,5 mEq/L/h) en hipernatremia crónica o de duración desconocida, para evitar EDEMA CEREBRAL. Controlar Na cada 4-6 h.`,
      v.chronicity === 'aguda'
        ? 'Hipernatremia aguda (<48 h, p. ej. sobrecarga de sodio): puede corregirse más rápido (hasta ~1 mEq/L/h) bajo monitorización.'
        : 'Si la duración es desconocida o >48 h, tratar como crónica: descenso lento y controlado.',
      tbw !== null
        ? `Agua corporal total ≈ ${round(tbw)} L (peso × ${tbwFactor}). Déficit de agua libre ≈ ${round(freeWaterDeficit)} L. Reponer en 24-48 h (además de la mantención y las pérdidas en curso).`
        : 'Ingresa peso y sexo para estimar el agua corporal total y el déficit de agua libre.',
      'Vía preferente: agua libre VO o por SNG si el tubo digestivo funciona. Si EV: suero glucosado 5% (aporta agua libre). NaCl 0,45% si además hay déficit de volumen/Na.',
      deltaPerLiterD5 !== null ? `Estimación (Adrogué-Madias): 1 L de SG 5% baja el Na ≈ ${round(deltaPerLiterD5)} mEq/L. Recalcular según controles.` : null,
      'Si hay hipovolemia/inestabilidad: primero reponer volumen con SF 0,9% hasta estabilizar, y recién luego corregir el agua libre.',
      'Buscar y tratar la causa: pérdidas insensibles/fiebre, diuréticos, diuresis osmótica (hiperglicemia), diabetes insípida (considerar desmopresina), aporte insuficiente de agua.',
    ].filter(Boolean);

    const medicationCards = [{
      title: 'Reposición de agua libre',
      dose: litersOver24 !== null ? `≈ ${round(litersOver24)} L en 24-48 h` : 'Según déficit',
      badge: 'Descenso ≤ 10 mEq/L/24 h',
      details: [
        'Indicación (preferente): agua libre VO/SNG según déficit, repartida en el día.',
        rateMlH !== null ? `Si es EV: suero glucosado 5% a ≈ ${round(rateMlH, 0)} mL/h (solo el déficit en 24 h; sumar mantención y pérdidas). Ajustar por controles de Na.` : 'Si es EV: suero glucosado 5% titulado por controles de Na.',
        'No bajar el Na más rápido que el límite: si desciende >10 mEq/L/24 h, frenar el aporte de agua libre.',
      ],
    }];

    const calcResult = {
      score: round(na),
      label: `${classification}${freeWaterDeficit !== null ? ` · déficit agua libre ≈ ${round(freeWaterDeficit)} L` : ''}`,
      color,
      interpretation: `Na ${round(na)} mEq/L. Estima el déficit de agua libre y la velocidad segura; la decisión depende del estado de volumen, la causa y los controles seriados.`,
      medicationCards,
      recommendations,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => { setV({ na: '', weight: '', sex: 'M', chronicity: 'desconocida' }); setResult(null); };

  return (
    <CalculatorWrapper
      title="Hipernatremia: corrección"
      description="Estima el déficit de agua libre y la velocidad segura de descenso del Na (≤10 mEq/L/24 h) para evitar edema cerebral."
      icon={Droplet}
      gradientFrom="orange"
      gradientTo="amber"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={false}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Label className="mb-2 block text-sm">Na actual (mEq/L)</Label>
          <Input type="number" step="0.1" value={v.na} onChange={(e) => set('na', e.target.value)} placeholder="Ej: 158" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Peso (kg)</Label>
          <Input type="number" step="0.1" value={v.weight} onChange={(e) => set('weight', e.target.value)} placeholder="kg" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Sexo</Label>
          <Select value={v.sex} onValueChange={(val) => set('sex', val)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino (0,6)</SelectItem>
              <SelectItem value="F">Femenino (0,5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block text-sm">Duración</Label>
          <Select value={v.chronicity} onValueChange={(val) => set('chronicity', val)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desconocida">Desconocida / &gt;48 h</SelectItem>
              <SelectItem value="aguda">Aguda (&lt;48 h)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">{result.score}<span className="text-base text-slate-500"> mEq/L</span></div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>
          {result.medicationCards?.length > 0 && (
            <div className="mt-4 grid gap-3">
              {result.medicationCards.map((card, i) => (
                <div key={i} className="rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h4 className="text-base font-black text-slate-950">{card.title}</h4>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">{card.badge}</span>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
                    <p className="text-xl font-black text-amber-900">{card.dose}</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {card.details.map((d, di) => (
                      <div key={di} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-2">
            {result.recommendations.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CalculatorReferences references={references} note="Solo apoyo clínico. Confirmar estado de volemia, causa, pérdidas en curso, controles de Na cada 4-6 h y límite de descenso antes de indicar." />
    </CalculatorWrapper>
  );
}
