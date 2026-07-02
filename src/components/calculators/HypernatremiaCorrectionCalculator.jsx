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
  const [v, setV] = useState({ na: '', weight: '', sex: 'M', chronicity: 'desconocida', volume: 'estable' });
  const [result, setResult] = useState(null);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const tbwFactor = v.sex === 'F' ? 0.5 : 0.6;

  const printableInputs = useMemo(() => [
    { label: 'Na actual', value: v.na ? `${v.na} mEq/L` : '' },
    { label: 'Peso', value: v.weight ? `${v.weight} kg` : '' },
    { label: 'Sexo', value: v.sex === 'F' ? 'Femenino' : 'Masculino' },
    { label: 'Volemia', value: v.volume },
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

    const clinicalOrder = [
      v.volume === 'hipovolemia_inestable'
        ? 'Si hay hipovolemia o inestabilidad: primero estabilizar con SF 0,9% EV hasta perfusión adecuada; luego iniciar corrección de agua libre.'
        : 'Paciente sin hipovolemia/inestabilidad ingresada: priorizar reposición de agua libre VO/SNG si es posible, o EV con SG 5%.',
      freeWaterDeficit !== null
        ? `Déficit de agua libre estimado ${round(freeWaterDeficit)} L. Reponer en 24-48 h, sumando mantención y pérdidas.`
        : 'Ingresar peso para calcular déficit de agua libre; mientras tanto titular aporte por controles seriados.',
      rateMlH !== null
        ? `Si se usa SG 5% EV para el déficit inicial: orientar a ${round(rateMlH, 0)} mL/h como punto de partida, ajustando según Na de control y balance.`
        : 'Si se usa SG 5% EV: iniciar velocidad conservadora y ajustar a controles de Na/balance.',
    ];

    const finalIndication = rateMlH !== null
      ? `Indicar agua libre VO/SNG si es posible. Si EV: SG 5% a ${round(rateMlH, 0)} mL/h como punto de partida, ajustar a Na de control.`
      : 'Indicar agua libre VO/SNG si es posible; si EV, SG 5% a velocidad conservadora y ajustar por controles.';
    const safetyChecks = [
      `Límite: no bajar Na >${limit24} mEq/L en 24 h si crónica o duración desconocida.`,
      'Control de Na cada 4-6 h y balance hídrico estricto.',
      v.volume === 'hipovolemia_inestable' ? 'Primero estabilizar perfusión con SF 0,9%; luego corregir agua libre.' : 'Sumar mantención y pérdidas en curso al déficit calculado.',
      deltaPerLiterD5 !== null ? `1 L de SG 5% baja Na aprox. ${round(Math.abs(deltaPerLiterD5))} mEq/L.` : null,
    ].filter(Boolean);

    const calcResult = {
      score: round(na),
      label: `${classification}${freeWaterDeficit !== null ? ` · déficit agua libre ≈ ${round(freeWaterDeficit)} L` : ''}`,
      color,
      interpretation: tbw !== null ? `ACT ≈ ${round(tbw)} L. Déficit agua libre ≈ ${round(freeWaterDeficit)} L.` : 'Ingresar peso permite estimar ACT y déficit.',
      finalIndication,
      clinicalOrder,
      medicationCards,
      safetyChecks,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => { setV({ na: '', weight: '', sex: 'M', chronicity: 'desconocida', volume: 'estable' }); setResult(null); };

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
        <div className="md:col-span-2">
          <Label className="mb-2 block text-sm">Estado de volumen/perfusión</Label>
          <Select value={v.volume} onValueChange={(val) => set('volume', val)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="estable">Sin hipovolemia/inestabilidad evidente</SelectItem>
              <SelectItem value="hipovolemia_inestable">Hipovolemia o inestabilidad</SelectItem>
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
          <div className="mt-4 rounded-2xl border-2 border-amber-500 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">Indicación final sugerida</p>
            <p className="mt-2 text-xl font-black leading-snug text-amber-950">{result.finalIndication}</p>
            {result.clinicalOrder.slice(0, 2).map((item, i) => (
              <p key={i} className="mt-2 text-sm font-semibold leading-relaxed text-amber-900">{item}</p>
            ))}
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
                    {card.details.slice(0, 2).map((d, di) => (
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
          <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-bold text-slate-900">Controles clave</p>
            <p className="mt-1 text-sm text-slate-600">{result.interpretation}</p>
            <div className="mt-3 space-y-2">
            {result.safetyChecks.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      <CalculatorReferences references={references} note="Solo apoyo clínico. Confirmar estado de volemia, causa, pérdidas en curso, controles de Na cada 4-6 h y límite de descenso antes de indicar." />
    </CalculatorWrapper>
  );
}
