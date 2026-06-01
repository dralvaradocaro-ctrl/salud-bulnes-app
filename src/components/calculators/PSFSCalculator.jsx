import React, { useMemo, useState } from 'react';
import { Activity, ShieldCheck, Plus, Trash2 } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Input } from '@/components/ui/input';

// Anexo N°5 del protocolo SSÑ de Fibromialgia (PRO-074): PSFS.
// El paciente elige 1 a 3 (o más) actividades afectadas; cada una de 0 (incapaz de
// realizar) a 10 (al mismo nivel que antes de su problema). Puntuación = promedio.
const references = [
  {
    label: 'Horn KK, et al. The Patient-Specific Functional Scale: psychometrics, clinimetrics and application. J Orthop Sports Phys Ther. 2012.',
    url: 'https://doi.org/10.2519/jospt.2012.3727',
  },
  {
    label: 'Protocolo de Abordaje Clínico de Fibromialgia, Servicio de Salud Ñuble (PRO-074), Anexo N°5.',
  },
];

const round = (value, digits = 1) => Number(Number(value).toFixed(digits));

export default function PSFSCalculator() {
  const [rows, setRows] = useState([
    { activity: '', score: '' },
    { activity: '', score: '' },
    { activity: '', score: '' },
  ]);
  const [result, setResult] = useState(null);

  const filled = useMemo(
    () => rows.filter((r) => r.score !== '' && Number.isFinite(Number(r.score))),
    [rows],
  );
  const mean = useMemo(() => {
    if (filled.length === 0) return null;
    const total = filled.reduce((acc, r) => acc + Number(r.score), 0);
    return total / filled.length;
  }, [filled]);

  const setRow = (index, field, value) => {
    if (field === 'score') {
      const clamped = value === '' ? '' : Math.max(0, Math.min(10, Number(value) || 0));
      setRows((prev) => prev.map((r, i) => (i === index ? { ...r, score: clamped } : r)));
    } else {
      setRows((prev) => prev.map((r, i) => (i === index ? { ...r, activity: value } : r)));
    }
  };
  const addRow = () => setRows((prev) => (prev.length >= 6 ? prev : [...prev, { activity: '', score: '' }]));
  const removeRow = (index) => setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const printableInputs = useMemo(
    () => filled.map((r, i) => ({ label: r.activity || `Actividad ${i + 1}`, value: `${r.score}/10` })),
    [filled],
  );

  const handleCalculate = () => {
    if (mean === null) {
      const invalid = {
        score: '—',
        label: 'Ingresa al menos una actividad con puntaje',
        color: 'bg-amber-50 border-amber-200',
        interpretation: 'Selecciona 1 a 3 (o más) actividades afectadas y puntúa cada una de 0 a 10.',
        recommendations: [],
      };
      setResult(invalid);
      return invalid;
    }
    const value = round(mean);
    const calcResult = {
      score: value,
      label: `Promedio PSFS /10 (${filled.length} actividad${filled.length === 1 ? '' : 'es'})`,
      color: value >= 7 ? 'bg-emerald-50 border-emerald-200' : value >= 4 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200',
      interpretation: `Puntuación funcional ${value}/10 (0 = incapaz de realizar la actividad; 10 = al mismo nivel que antes del problema). A mayor puntaje, mejor función.`,
      recommendations: [
        'Cambio mínimo detectable: 2 puntos en el promedio; 3 puntos en una sola actividad.',
        'Registrar el puntaje basal y de seguimiento en la ficha; es una de las escalas requeridas para fundamentar la derivación a Fisiatría.',
        'Puntuación total = suma de las actividades ÷ número de actividades.',
      ],
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setRows([
      { activity: '', score: '' },
      { activity: '', score: '' },
      { activity: '', score: '' },
    ]);
    setResult(null);
  };

  return (
    <CalculatorWrapper
      title="PSFS — Escala Funcional Específica del Paciente"
      description="El paciente elige 1 a 3 (o más) actividades afectadas y puntúa cada una de 0 (incapaz) a 10 (nivel previo al problema)."
      icon={Activity}
      gradientFrom="emerald"
      gradientTo="teal"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={true}
    >
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={row.activity}
              onChange={(e) => setRow(index, 'activity', e.target.value)}
              placeholder={`Actividad ${index + 1} (ej: subir escaleras)`}
              className="flex-1 bg-white"
            />
            <input
              type="number"
              min={0}
              max={10}
              value={row.score}
              onChange={(e) => setRow(index, 'score', e.target.value)}
              placeholder="0-10"
              className="h-10 w-20 shrink-0 rounded-md border border-slate-300 bg-white px-2 text-center text-sm"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
              title="Quitar actividad"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {rows.length < 6 && (
        <button
          type="button"
          onClick={addRow}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          <Plus className="h-4 w-4" /> Agregar actividad
        </button>
      )}

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-4xl font-black text-slate-900">{result.score}{result.score !== '—' && <span className="text-xl text-slate-500">/10</span>}</div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>
          <div className="mt-4 rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-sm leading-relaxed text-slate-700">{result.interpretation}</p>
          </div>
          <div className="mt-4 space-y-2">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CalculatorReferences references={references} note="Escala de apoyo; interpretar junto con la evaluación clínica. Registrar basal y seguimiento." />
    </CalculatorWrapper>
  );
}
