import { useState } from 'react';
import ScoreShell from './ScoreShell';

// Caprini 2013: factores agrupados por el puntaje que aportan.
const GRUPOS = [
  {
    puntos: 1,
    factores: [
      'Edad 41–60 años',
      'Cirugía menor',
      'IMC ≥ 25',
      'Edema de extremidades inferiores',
      'Várices',
      'Embarazo o puerperio',
      'Aborto a repetición o inexplicado',
      'Anticonceptivos orales o terapia hormonal',
      'Sepsis en el último mes',
      'Enfermedad pulmonar grave o neumonía en el último mes',
      'Función pulmonar alterada (EPOC)',
      'Infarto agudo al miocardio',
      'Insuficiencia cardíaca congestiva en el último mes',
      'Enfermedad inflamatoria intestinal',
      'Paciente médico en reposo',
    ],
  },
  {
    puntos: 2,
    factores: [
      'Edad 61–74 años',
      'Cirugía artroscópica',
      'Cirugía mayor abierta de más de 45 minutos',
      'Cirugía laparoscópica de más de 45 minutos',
      'Cáncer',
      'Reposo en cama por más de 72 horas',
      'Bota de yeso inmovilizadora',
      'Acceso venoso central',
    ],
  },
  {
    puntos: 3,
    factores: [
      'Edad ≥ 75 años',
      'Tromboembolismo venoso previo',
      'Historia familiar de tromboembolismo',
      'Factor V de Leiden',
      'Protrombina 20210A',
      'Anticoagulante lúpico',
      'Anticuerpos anticardiolipinas',
      'Homocisteína sérica elevada',
      'Trombocitopenia inducida por heparina',
      'Otra trombofilia congénita o adquirida',
    ],
  },
  {
    puntos: 5,
    factores: [
      'Artroplastia mayor electiva de extremidad inferior',
      'Fractura de cadera, pelvis o pierna',
      'Accidente cerebrovascular en el último mes',
      'Politraumatismo',
      'Lesión medular aguda en el último mes',
    ],
  },
];

export function getCapriniResult(score) {
  if (score === 0) return {
    nivel: 'Riesgo muy bajo (0)',
    bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900',
    conducta: 'Solo deambulación precoz.',
    recs: ['Riesgo de tromboembolismo menor al 0,5%.'],
  };
  if (score <= 2) return {
    nivel: `Riesgo bajo (${score})`,
    bg: 'bg-lime-50 border-lime-200', badge: 'bg-lime-100 text-lime-800', text: 'text-lime-900',
    conducta: 'Profilaxis mecánica: compresión neumática intermitente.',
    recs: ['Riesgo de tromboembolismo cercano al 1,5%.'],
  };
  if (score <= 4) return {
    nivel: `Riesgo moderado (${score})`,
    bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900',
    conducta: 'Profilaxis farmacológica o mecánica según el riesgo de sangrado.',
    recs: [
      'Riesgo de tromboembolismo cercano al 3%.',
      'Si el riesgo de sangrado es alto, preferir compresión neumática intermitente.',
    ],
  };
  return {
    nivel: `Riesgo alto (${score})`,
    bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-900', text: 'text-red-900',
    conducta: 'Profilaxis farmacológica, idealmente combinada con mecánica.',
    recs: [
      'Riesgo de tromboembolismo del 6% o más.',
      'Heparina de bajo peso molecular ajustada a peso y función renal.',
      'En cirugía oncológica abdominal o pélvica y en artroplastia, evaluar profilaxis extendida por 4 semanas.',
    ],
  };
}

export default function CapriniCalculator() {
  const [marcados, setMarcados] = useState({});

  const alternar = clave => setMarcados(current => ({ ...current, [clave]: !current[clave] }));
  const score = GRUPOS.reduce(
    (total, grupo) => total + grupo.factores.filter(factor => marcados[`${grupo.puntos}-${factor}`]).length * grupo.puntos,
    0,
  );
  const seleccionados = Object.values(marcados).filter(Boolean).length;
  const result = { ...getCapriniResult(score), valor: `${score} pts` };

  return (
    <ScoreShell
      title="Caprini — Riesgo trombótico en paciente quirúrgico"
      subtitle="Suma de factores de riesgo para definir la tromboprofilaxis."
      gradient="from-violet-700 to-purple-700"
      badge={score}
      result={result}
      onReset={seleccionados ? () => setMarcados({}) : null}
      references={[
        { label: 'Caprini JA. Dis Mon 2005 · Modelo 2013', url: 'https://doi.org/10.1016/j.disamonth.2005.02.003' },
      ]}
      footnote="Cortes: 0 muy bajo, 1–2 bajo, 3–4 moderado, ≥5 alto. Pensado para el paciente quirúrgico; en el paciente médico se usa Padua. Evaluar siempre el riesgo de sangrado antes de indicar profilaxis."
    >
      {GRUPOS.map(grupo => (
        <div key={grupo.puntos}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {grupo.puntos} punto{grupo.puntos === 1 ? '' : 's'} cada uno
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {grupo.factores.map(factor => {
              const clave = `${grupo.puntos}-${factor}`;
              const activo = Boolean(marcados[clave]);
              return (
                <button
                  key={clave}
                  type="button"
                  onClick={() => alternar(clave)}
                  aria-pressed={activo}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    activo ? 'border-violet-400 bg-violet-50 font-semibold text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                    activo ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-300 bg-white text-transparent'
                  }`}>✓</span>
                  <span className="leading-snug">{factor}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </ScoreShell>
  );
}
