import { useState } from 'react';
import ScoreShell, { NumberField } from './ScoreShell';

export function getShockIndexResult(si) {
  if (si < 0.5) return {
    nivel: 'Bajo el rango habitual',
    bg: 'bg-sky-50 border-sky-200', badge: 'bg-sky-100 text-sky-800', text: 'text-sky-900',
    conducta: 'Revisar la medición: puede reflejar bradicardia o hipertensión.',
    recs: ['Confirmar frecuencia y presión antes de interpretar.'],
  };
  if (si <= 0.7) return {
    nivel: 'Rango normal',
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Sin alerta hemodinámica por este índice.',
    recs: ['No descarta hemorragia: repetir si el cuadro clínico cambia.'],
  };
  if (si < 0.9) return {
    nivel: 'Levemente elevado',
    bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900',
    conducta: 'Vigilar: puede anticipar deterioro antes de que caiga la presión.',
    recs: [
      'Control seriado de signos vitales y búsqueda activa de sangrado o sepsis.',
      'Asegurar accesos venosos.',
    ],
  };
  if (si < 1.3) return {
    nivel: 'Elevado',
    bg: 'bg-orange-50 border-orange-300', badge: 'bg-orange-100 text-orange-900', text: 'text-orange-900',
    conducta: 'Sugiere compromiso hemodinámico: avisar al médico.',
    recs: [
      'Buscar causa: hemorragia, sepsis, deshidratación, tromboembolismo.',
      'Monitorización continua y reanimación según la causa.',
      'En trauma, se asocia a mayor necesidad de transfusión.',
    ],
  };
  return {
    nivel: 'Muy elevado',
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Shock probable: reanimación inmediata y activación del equipo.',
    recs: [
      'Reanimación agresiva según la causa y activación de protocolo de transfusión si hay trauma.',
      'Traslado a unidad de mayor complejidad.',
    ],
  };
}

export default function ShockIndexCalculator() {
  const [fc, setFc] = useState('');
  const [pas, setPas] = useState('');
  const [edad, setEdad] = useState('');

  const fcNum = Number(fc);
  const pasNum = Number(pas);
  const edadNum = Number(edad);
  const listo = Number.isFinite(fcNum) && fcNum > 0 && Number.isFinite(pasNum) && pasNum > 0;

  const si = listo ? fcNum / pasNum : null;
  const siRedondeado = si === null ? null : Math.round(si * 100) / 100;
  const siEdad = listo && Number.isFinite(edadNum) && edadNum > 0 ? Math.round(si * edadNum * 10) / 10 : null;

  const base = listo ? getShockIndexResult(si) : null;
  const result = base
    ? {
      ...base,
      valor: siRedondeado.toFixed(2),
      detalle: siEdad !== null
        ? `Índice de shock ajustado por edad: ${siEdad} (sobre 50 se asocia a peor pronóstico en trauma).`
        : undefined,
    }
    : null;

  return (
    <ScoreShell
      title="Índice de shock"
      subtitle="Frecuencia cardíaca dividida por la presión arterial sistólica."
      gradient="from-rose-700 to-red-700"
      badge={siRedondeado ?? '—'}
      result={result}
      pending={!listo ? 'Ingresa la frecuencia cardíaca y la presión sistólica.' : null}
      onReset={() => { setFc(''); setPas(''); setEdad(''); }}
      references={[
        { label: 'Allgöwer M, Burri C. Schockindex. Dtsch Med Wochenschr 1967', url: 'https://doi.org/10.1055/s-0028-1106070' },
      ]}
      footnote="Rango habitual 0,5–0,7. Pierde valor con betabloqueo, marcapasos, embarazo y en el adulto mayor. La edad es opcional: solo se usa para el índice ajustado."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Frecuencia cardíaca" unit="lpm" min="20" max="250" value={fc} onChange={setFc} />
        <NumberField label="Presión arterial sistólica" unit="mmHg" min="40" max="300" value={pas} onChange={setPas} />
      </div>
      <NumberField label="Edad (opcional, para el índice ajustado)" unit="años" min="0" max="120" value={edad} onChange={setEdad} />
    </ScoreShell>
  );
}
