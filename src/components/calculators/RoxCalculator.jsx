import { useState } from 'react';
import ScoreShell, { NumberField } from './ScoreShell';
import Fio2Picker from './Fio2Picker';
import { estimarFio2 } from '@/lib/fio2';

export function getRoxResult(rox) {
  if (rox >= 4.88) return {
    nivel: 'Bajo riesgo de fracaso',
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Mantener la cánula de alto flujo y seguir controlando.',
    recs: ['Repetir el índice en los controles siguientes: la tendencia importa más que un valor aislado.'],
  };
  if (rox >= 3.85) return {
    nivel: 'Zona indeterminada',
    bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900',
    conducta: 'Vigilancia estrecha y reevaluación en 1–2 horas.',
    recs: [
      'Optimizar flujo, FiO₂ y manejo de secreciones antes de decidir.',
      'Avisar al médico si el índice no mejora en el siguiente control.',
    ],
  };
  return {
    nivel: 'Alto riesgo de fracaso',
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Riesgo de intubación: avisar de inmediato y no retrasar la decisión.',
    recs: [
      'Evaluar ventilación mecánica; el retraso empeora el pronóstico.',
      'Coordinar unidad de paciente crítico y preparar vía aérea.',
    ],
  };
}

export default function RoxCalculator() {
  const [spo2, setSpo2] = useState('');
  const [fr, setFr] = useState('');
  const [oxigeno, setOxigeno] = useState({ dispositivo: '', flujo: '', fio2: '' });

  const fio2 = estimarFio2(oxigeno);
  const spo2Num = Number(spo2);
  const frNum = Number(fr);
  const listo = fio2 !== null
    && Number.isFinite(spo2Num) && spo2Num > 0 && spo2Num <= 100
    && Number.isFinite(frNum) && frNum > 0;

  const rox = listo ? (spo2Num / fio2) * 100 / frNum : null;
  const roxRedondeado = rox === null ? null : Math.round(rox * 100) / 100;
  const result = listo ? { ...getRoxResult(rox), valor: roxRedondeado.toFixed(2) } : null;

  return (
    <ScoreShell
      title="Índice de ROX — Respuesta a cánula de alto flujo"
      subtitle="(SpO₂ / FiO₂) dividido por la frecuencia respiratoria."
      gradient="from-cyan-700 to-teal-700"
      badge={roxRedondeado ?? '—'}
      result={result}
      pending={!listo ? 'Ingresa saturación, frecuencia respiratoria y el dispositivo de oxígeno.' : null}
      onReset={() => { setSpo2(''); setFr(''); setOxigeno({ dispositivo: '', flujo: '', fio2: '' }); }}
      references={[
        { label: 'Roca O et al. Índice ROX para predecir el resultado de la CNAF. J Crit Care 2016 / Am J Respir Crit Care Med 2019', url: 'https://doi.org/10.1164/rccm.201803-0589OC' },
      ]}
      footnote="Validado en neumonía con cánula de alto flujo, medido a las 2, 6 y 12 horas. Cortes: ≥4,88 bajo riesgo; <3,85 alto riesgo de intubación. Un valor aislado no decide: importa la tendencia."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="SpO₂" unit="%" min="50" max="100" value={spo2} onChange={setSpo2} />
        <NumberField label="Frecuencia respiratoria" unit="por minuto" min="5" max="80" value={fr} onChange={setFr} />
      </div>
      <Fio2Picker value={oxigeno} onChange={setOxigeno} />
    </ScoreShell>
  );
}
