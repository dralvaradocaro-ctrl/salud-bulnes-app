import React, { useMemo, useState } from 'react';
import { Droplet, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round = (v, d = 1) => (Number.isFinite(v) ? Number(v.toFixed(d)) : '');

const references = [
  { label: 'AAFP. Sodium Disorders: Hyponatremia and Hypernatremia. 2023.', url: 'https://www.aafp.org/pubs/afp/issues/2023/1100/sodium-disorders.html' },
  { label: 'Spasovski G, et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. 2014.', url: 'https://doi.org/10.1093/ndt/gfu040' },
  { label: 'StatPearls. Hyponatremia; Osmotic Demyelination Syndrome.' },
];

export default function HyponatremiaCorrectionCalculator() {
  const [v, setV] = useState({ na: '', weight: '', sex: 'M', symptoms: 'ausente', chronicity: 'desconocida', volume: 'no_definida', highRisk: false });
  const [result, setResult] = useState(null);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));

  const tbwFactor = v.sex === 'F' ? 0.5 : 0.6;

  const printableInputs = useMemo(() => [
    { label: 'Na actual', value: v.na ? `${v.na} mEq/L` : '' },
    { label: 'Peso', value: v.weight ? `${v.weight} kg` : '' },
    { label: 'Sexo', value: v.sex === 'F' ? 'Femenino' : 'Masculino' },
    { label: 'Síntomas', value: v.symptoms },
    { label: 'Volemia', value: v.volume },
  ], [v]);

  const handleCalculate = () => {
    const na = toNumber(v.na);
    const weight = toNumber(v.weight);
    if (na === null) {
      const invalid = { score: 'Incompleto', label: 'Ingresa el Na actual', color: 'bg-amber-50 border-amber-300', interpretation: 'Esta calculadora estima la corrección inicial; no reemplaza el juicio clínico, el estado de volumen ni los controles seriados.', recommendations: [] };
      setResult(invalid); return invalid;
    }

    const tbw = weight ? weight * tbwFactor : null;
    // Límite seguro de corrección en 24 h (evitar mielinolisis/ODS).
    const limit24 = v.highRisk ? 6 : 8;
    const severe = v.symptoms === 'graves';
    const classification = na >= 130 ? 'Hiponatremia leve' : na >= 125 ? 'Hiponatremia moderada' : 'Hiponatremia grave';
    const color = na < 125 || severe ? 'bg-rose-50 border-rose-300' : na < 130 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300';

    // Déficit de Na para subir hasta una meta inicial prudente (no más de +limit24).
    const targetDelta = Math.min(limit24, Math.max(0, 130 - na)); // hasta 130 o el límite
    const naDeficitToTarget = tbw !== null ? tbw * targetDelta : null;
    // Efecto estimado de 1 L de NaCl 3% (513 mEq/L): ΔNa ≈ (513 - Na)/(TBW+1).
    const deltaPerLiter3 = tbw !== null ? (513 - na) / (tbw + 1) : null;

    const medicationCards = [];
    if (severe) {
      medicationCards.push({
        title: 'NaCl 3% — bolo (hiponatremia sintomática grave)',
        dose: '100-150 mL EV en 10-20 min',
        badge: 'Emergencia · repetible',
        details: [
          'Indicación: NaCl 3% 100-150 mL EV a pasar en 10-20 min. Repetible hasta 3 veces (cada 10-20 min) hasta que cedan los síntomas graves (convulsión, coma, vómitos).',
          'Objetivo del rescate: subir el Na 4-6 mEq/L (no más). Controlar Na cada 1-2 h durante el rescate.',
          'Arsenal local: NaCl 3% disponible — usar directamente. Respaldo si no hay stock (NaCl 3% ≈ 513 mEq/L): mezclar 385 mL de SF 0,9% + 115 mL de NaCl 10% (≈ 6 ampollas de 20 mL) para ~500 mL; confirmar con farmacia.',
        ],
      });
    } else {
      medicationCards.push({
        title: 'Corrección lenta (sin síntomas graves)',
        dose: `≤ ${limit24} mEq/L en 24 h`,
        badge: 'Según volemia',
        details: [
          'Hipovolémica: SF 0,9% EV y tratar la causa (vigilar autocorrección rápida al reponer volumen).',
          'Euvolémica (SIADH): restricción hídrica; considerar NaCl según respuesta. No usar SF si SIADH con Na urinario alto (puede empeorar).',
          'Hipervolémica (IC, cirrosis, ERC): restricción hídrica + tratar causa ± diurético de asa.',
        ],
      });
    }

    const volumePlan = {
      hipovolemica: 'Hipovolémica: indicar SF 0,9% EV, tratar pérdidas y vigilar autocorrección rápida al restaurar volumen.',
      euvolemica: 'Euvolémica/SIADH probable: restricción hídrica, tratar causa y evitar SF 0,9% si orina hipertónica porque puede empeorar el Na.',
      hipervolemica: 'Hipervolémica: restricción hídrica y sodio, tratar causa de sobrecarga y considerar diurético de asa si congestión.',
      no_definida: 'Definir volemia antes de indicar corrección no urgente: hipovolémica, euvolémica/SIADH o hipervolémica.',
    };

    const clinicalOrder = severe
      ? [
        `Indicar NaCl 3% 100-150 mL EV en 10-20 min ahora.`,
        'Repetir bolo cada 10-20 min hasta 3 veces si persisten síntomas graves, buscando aumento inicial 4-6 mEq/L.',
        `No sobrepasar corrección de ${limit24} mEq/L en 24 h (${v.highRisk ? 'alto riesgo de mielinolisis' : 'límite prudente'}). Control de Na cada 1-2 h durante rescate.`,
      ]
      : [
        volumePlan[v.volume],
        `Meta máxima: subir Na ≤ ${limit24} mEq/L en 24 h y ≤ ${v.highRisk ? 12 : 18} mEq/L en 48 h. Control de Na cada 2-4 h al inicio si hospitalizado o Na <125.`,
        tbw !== null ? `Déficit aproximado para subir ${round(targetDelta)} mEq/L: ${round(naDeficitToTarget, 0)} mEq de Na; ajustar por controles y causa.` : 'Ingresar peso para estimar déficit y respuesta esperada.',
      ];

    const finalIndication = clinicalOrder[0];
    const safetyChecks = [
      severe ? 'Control de Na cada 1-2 h durante rescate.' : 'Control de Na cada 2-4 h al inicio si hospitalizado o Na <125.',
      `Límite: no subir Na >${limit24} mEq/L en 24 h ni >${v.highRisk ? 12 : 18} mEq/L en 48 h.`,
      'Medir y corregir K: la reposición de K también sube el Na efectivo.',
      v.chronicity === 'aguda' ? 'Aguda documentada: puede corregirse más rápido solo con monitorización estrecha.' : 'Cronicidad desconocida/>48 h: tratar como crónica.',
    ];

    const calcResult = {
      score: round(na),
      label: `${classification} · meta inicial +${round(targetDelta)} mEq/L`,
      color,
      interpretation: tbw !== null
        ? `ACT ≈ ${round(tbw)} L. Déficit para subir ${round(targetDelta)} mEq/L ≈ ${round(naDeficitToTarget, 0)} mEq.`
        : 'Ingresar peso permite estimar ACT y déficit.',
      finalIndication,
      clinicalOrder,
      medicationCards,
      safetyChecks,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => { setV({ na: '', weight: '', sex: 'M', symptoms: 'ausente', chronicity: 'desconocida', volume: 'no_definida', highRisk: false }); setResult(null); };

  return (
    <CalculatorWrapper
      title="Hiponatremia: corrección"
      description="Clasifica, estima el déficit de Na y orienta la corrección con NaCl 3%/SF, respetando el límite de 24 h para evitar mielinolisis."
      icon={Droplet}
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
          <Label className="mb-2 block text-sm">Na actual (mEq/L)</Label>
          <Input type="number" step="0.1" value={v.na} onChange={(e) => set('na', e.target.value)} placeholder="Ej: 118" className="bg-white" />
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
          <Label className="mb-2 block text-sm">Síntomas</Label>
          <Select value={v.symptoms} onValueChange={(val) => set('symptoms', val)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ausente">Ausentes / leves</SelectItem>
              <SelectItem value="moderados">Moderados</SelectItem>
              <SelectItem value="graves">Graves (convulsión, coma, vómitos)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label className="mb-2 block text-sm">Cronicidad</Label>
          <Select value={v.chronicity} onValueChange={(val) => set('chronicity', val)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desconocida">Desconocida / &gt;48 h (tratar como crónica)</SelectItem>
              <SelectItem value="aguda">Aguda (&lt;48 h documentada)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label className="mb-2 block text-sm">Estado de volumen</Label>
          <Select value={v.volume} onValueChange={(val) => set('volume', val)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no_definida">No definido</SelectItem>
              <SelectItem value="hipovolemica">Hipovolémica</SelectItem>
              <SelectItem value="euvolemica">Euvolémica / SIADH probable</SelectItem>
              <SelectItem value="hipervolemica">Hipervolémica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          <input type="checkbox" checked={v.highRisk} onChange={(e) => set('highRisk', e.target.checked)} className="mt-1" />
          <span>Alto riesgo de mielinolisis (Na &lt;120, alcoholismo, desnutrición, hipokalemia, hepatopatía): meta ≤6 mEq/L/24 h.</span>
        </label>
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">{result.score}<span className="text-base text-slate-500"> mEq/L</span></div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>
          <div className="mt-4 rounded-2xl border-2 border-blue-500 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">Indicación final sugerida</p>
            <p className="mt-2 text-xl font-black leading-snug text-blue-950">{result.finalIndication}</p>
            {result.clinicalOrder.slice(1).map((item, i) => (
              <p key={i} className="mt-2 text-sm font-semibold leading-relaxed text-blue-900">{item}</p>
            ))}
          </div>
          {result.medicationCards?.length > 0 && (
            <div className="mt-4 grid gap-3">
              {result.medicationCards.map((card, i) => (
                <div key={i} className="rounded-2xl border-2 border-blue-300 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h4 className="text-base font-black text-slate-950">{card.title}</h4>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800">{card.badge}</span>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">
                    <p className="text-xl font-black text-blue-900">{card.dose}</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {card.details.slice(0, 2).map((d, di) => (
                      <div key={di} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
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

      <CalculatorReferences references={references} note="Solo apoyo clínico. Confirmar estado de volemia, preparación local de NaCl 3%, controles de Na cada 2-4 h y límite de corrección antes de indicar." />
    </CalculatorWrapper>
  );
}
