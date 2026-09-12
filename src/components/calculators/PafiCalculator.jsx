import { useState } from 'react';
import ScoreShell, { NumberField } from './ScoreShell';
import Fio2Picker from './Fio2Picker';
import { estimarFio2 } from '@/lib/fio2';

export function getPafiResult(pafi) {
  if (pafi > 300) return {
    nivel: 'Sin criterio de SDRA por oxigenación',
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Mantener oxigenoterapia y buscar la causa de la hipoxemia.',
    recs: ['Reevaluar si baja el PaFi o aumenta el requerimiento de oxígeno.'],
  };
  if (pafi > 200) return {
    nivel: 'Compromiso leve de oxigenación',
    bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900',
    conducta: 'Rango de SDRA leve si hay PEEP o CPAP ≥ 5 cmH₂O.',
    recs: [
      'Optimizar soporte no invasivo y posición; considerar prono vigil según tolerancia.',
      'Control gasométrico seriado y radiografía de tórax.',
    ],
  };
  if (pafi > 100) return {
    nivel: 'Compromiso moderado de oxigenación',
    bg: 'bg-orange-50 border-orange-300', badge: 'bg-orange-100 text-orange-900', text: 'text-orange-900',
    conducta: 'Rango de SDRA moderado: avisar a médico y evaluar mayor complejidad.',
    recs: [
      'Considerar ventilación mecánica si hay trabajo respiratorio o deterioro.',
      'Coordinar traslado a unidad de paciente crítico.',
    ],
  };
  return {
    nivel: 'Compromiso grave de oxigenación',
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Rango de SDRA grave: manejo en cuidados intensivos.',
    recs: [
      'Ventilación protectora y prono según indicación.',
      'Traslado urgente a unidad de paciente crítico.',
    ],
  };
}

export default function PafiCalculator() {
  const [pao2, setPao2] = useState('');
  const [oxigeno, setOxigeno] = useState({ dispositivo: '', flujo: '', fio2: '' });

  const fio2 = estimarFio2(oxigeno);
  const pao2Num = Number(pao2);
  const listo = Number.isFinite(pao2Num) && pao2Num > 0 && fio2 !== null;
  const pafi = listo ? Math.round(pao2Num / (fio2 / 100)) : null;
  const result = listo ? { ...getPafiResult(pafi), valor: `${pafi}` } : null;

  return (
    <ScoreShell
      title="PaFi — PaO₂ / FiO₂"
      subtitle="Relación de oxigenación, con estimación de FiO₂ según el dispositivo."
      gradient="from-sky-700 to-blue-700"
      badge={pafi ?? '—'}
      result={result}
      pending={!listo ? 'Ingresa la PaO₂ de gases arteriales y el dispositivo de oxígeno.' : null}
      onReset={() => { setPao2(''); setOxigeno({ dispositivo: '', flujo: '', fio2: '' }); }}
      references={[
        { label: 'Definición de Berlín del SDRA. JAMA 2012', url: 'https://doi.org/10.1001/jama.2012.5669' },
      ]}
      footnote="Los cortes de SDRA (300/200/100) exigen PEEP o CPAP ≥ 5 cmH₂O y una causa compatible. En naricera y mascarilla la FiO₂ es estimada, así que el PaFi es referencial."
    >
      <NumberField label="PaO₂" unit="mmHg" min="10" max="700" value={pao2} onChange={setPao2} />
      <Fio2Picker value={oxigeno} onChange={setOxigeno} />
    </ScoreShell>
  );
}
