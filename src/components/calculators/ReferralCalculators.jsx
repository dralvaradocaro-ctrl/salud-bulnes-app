import { useState } from 'react';
import ScoreShell, { inputClass } from './ScoreShell';
import { renalEstimates, glasgowBlatchford, alvarado, centorMcIsaac, bishop } from '@/utils/clinical/triage';

const yesNo = [['0', 'No'], ['1', 'Sí']];
const sex = [['male', 'Masculino'], ['female', 'Femenino']];
const field = (key, label, options) => ({ key, label, options });
const format = value => value.toLocaleString('es-CL', { maximumFractionDigits: 1 });
const definitions = {
  renal: {
    title: 'Función renal — CKD-EPI 2021 y Cockcroft–Gault',
    fields: [field('age', 'Edad (años; adultos)'), field('sex', 'Sexo utilizado por la ecuación', sex), field('creatinine', 'Creatinina sérica'), field('unit', 'Unidad de creatinina', [['mgdl', 'mg/dL'], ['umol', 'µmol/L']]), field('weight', 'Peso para Cockcroft–Gault (kg)'), field('stable', 'Creatinina estable, sin lesión renal aguda', [['yes', 'Sí'], ['no', 'No / no confirmado']])],
    calculate: renalEstimates,
    summarize: r => ({ badge: format(r.egfr), detail: `CKD-EPI 2021: ${format(r.egfr)} mL/min/1,73 m². Cockcroft–Gault: ${format(r.clearance)} mL/min.`, action: 'Son estimaciones diferentes: utiliza la ecuación y unidad que requiere la ficha del medicamento. Elige clínicamente el peso apropiado, especialmente en obesidad, edema o bajo peso.' }),
    note: 'Adultos con creatinina estable. No aplicar en lesión renal aguda, embarazo ni diálisis. La TFG indexada no equivale al aclaramiento en mL/min. Un resultado aislado no diagnostica enfermedad renal crónica.',
    references: [{ label: 'NIDDK — CKD-EPI 2021 en adultos', url: 'https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults' }, { label: 'Cockcroft y Gault — ecuación original', url: 'https://doi.org/10.1159/000180580' }],
  },
  gbs: {
    title: 'Glasgow–Blatchford — hemorragia digestiva alta',
    fields: [field('urea', 'Urea / nitrógeno ureico'), field('unit', 'Analito y unidad', [['urea-mmol', 'Urea · mmol/L'], ['urea-mg', 'Urea · mg/dL'], ['bun-mg', 'BUN (nitrógeno ureico) · mg/dL']]), field('hb', 'Hemoglobina (g/dL)'), field('sex', 'Sexo utilizado por la escala', sex), field('sbp', 'Presión sistólica (mmHg)'), field('pulse', 'Frecuencia cardíaca (lpm)'), field('melena', 'Melena', yesNo), field('syncope', 'Síncope', yesNo), field('liver', 'Enfermedad hepática', yesNo), field('heart', 'Insuficiencia cardíaca', yesNo)],
    calculate: glasgowBlatchford,
    summarize: score => ({ badge: score, detail: `GBS: ${score} puntos (0–23).`, action: score <= 1 ? 'Riesgo muy bajo según la escala. Considerar manejo ambulatorio solo tras evaluación, estabilidad y acceso garantizado a endoscopía/seguimiento.' : 'Requiere evaluación hospitalaria y coordinación de endoscopía temprana según estabilidad y recursos. No utilizar el puntaje para retrasar reanimación o traslado.' }),
    note: 'Adultos con sospecha de hemorragia digestiva alta, antes de endoscopía. Sangrado activo o inestabilidad requieren atención urgente cualquiera sea el puntaje. Urea y BUN no son intercambiables: selecciona el analito del informe.',
    references: [{ label: 'NHS Greater Glasgow and Clyde — GBS y criterios de manejo', url: 'https://handbook.ggcmedicines.org.uk/guidelines/gastrointestinal-system/glasgow-blatchford-score/' }],
  },
  alvarado: {
    title: 'Alvarado — sospecha de apendicitis',
    fields: [field('migration', 'Migración del dolor a fosa ilíaca derecha', yesNo), field('anorexia', 'Anorexia', yesNo), field('vomiting', 'Náuseas o vómitos', yesNo), field('tenderness', 'Dolor a palpación en fosa ilíaca derecha', yesNo), field('rebound', 'Rebote / irritación peritoneal', yesNo), field('fever', 'Temperatura ≥37,3 °C', yesNo), field('leukocytes', 'Leucocitos >10.000/µL', yesNo), field('shift', 'Desviación izquierda / neutrófilos >75%', yesNo)],
    calculate: alvarado,
    summarize: score => ({ badge: score, detail: `Alvarado: ${score}/10. ${score < 5 ? 'Baja probabilidad según la escala.' : score < 7 ? 'Resultado intermedio.' : 'Alta sospecha.'}`, action: score < 5 ? 'Reevaluar según evolución; un puntaje bajo no excluye apendicitis por sí solo.' : score < 7 ? 'Evaluación clínica seriada e imagen según disponibilidad; coordinar derivación si persiste la sospecha.' : 'Valoración quirúrgica o derivación prioritaria. El puntaje no confirma el diagnóstico ni indica cirugía por sí solo.' }),
    note: 'Sospecha de apendicitis en adultos. Peritonismo, inestabilidad o deterioro requieren evaluación urgente independientemente del puntaje. No extrapolar automáticamente a embarazo o niños.',
    references: [{ label: 'AHRQ — componentes y ponderación de Alvarado', url: 'https://www.ncbi.nlm.nih.gov/books/NBK355447/table/results.t13/' }],
  },
  centor: {
    title: 'Centor–McIsaac — faringoamigdalitis',
    fields: [field('age', 'Edad (años; desde 3 años)'), field('fever', 'Fiebre >38 °C', yesNo), field('noCough', 'Ausencia de tos', yesNo), field('nodes', 'Adenopatías cervicales anteriores dolorosas', yesNo), field('tonsils', 'Exudado o aumento de volumen amigdalino', yesNo)],
    calculate: centorMcIsaac,
    summarize: r => ({ badge: r.mcisaac, detail: `Centor: ${r.centor}/4. McIsaac ajustado por edad: ${r.mcisaac} (−1 a 5).`, action: r.mcisaac <= 1 ? 'Baja probabilidad de estreptococo. Valorar contexto epidemiológico y signos de alarma; evitar antibiótico basado solo en síntomas inespecíficos.' : 'Considerar test para estreptococo según edad y protocolo local. El puntaje orienta a quién estudiar; no confirma infección ni prescribe antibióticos automáticamente.' }),
    note: 'No aplicar en menores de 3 años. Signos de obstrucción de vía aérea, absceso o compromiso sistémico requieren evaluación urgente.',
    references: [{ label: 'McIsaac et al. — estudio original, CMAJ 1998', url: 'https://pubmed.ncbi.nlm.nih.gov/9475915/' }, { label: 'IDSA — evaluación de faringitis estreptocócica', url: 'https://www.idsociety.org/practice-guideline/streptococcal-pharyngitis2/' }],
  },
  bishop: {
    title: 'Bishop — evaluación cervical',
    fields: [field('dilation', 'Dilatación cervical', [['0', 'Cerrado'], ['1', '1–2 cm'], ['2', '3–4 cm'], ['3', '≥5 cm']]), field('effacement', 'Borramiento cervical', [['0', '0–30%'], ['1', '40–50%'], ['2', '60–70%'], ['3', '≥80%']]), field('station', 'Estación fetal', [['0', '−3'], ['1', '−2'], ['2', '−1 / 0'], ['3', '+1 / +2']]), field('consistency', 'Consistencia cervical', [['0', 'Firme'], ['1', 'Intermedia'], ['2', 'Blanda']]), field('position', 'Posición cervical', [['0', 'Posterior'], ['1', 'Media'], ['2', 'Anterior']])],
    calculate: bishop,
    summarize: score => ({ badge: score, detail: `Bishop: ${score}/13. ${score >= 8 ? 'Cuello favorable.' : score <= 6 ? 'Cuello desfavorable.' : 'Resultado intermedio.'}`, action: 'Comunicar el resultado al equipo obstétrico. La indicación y el método de inducción requieren evaluación materno-fetal y capacidad resolutiva del establecimiento.' }),
    note: 'Versión original con borramiento porcentual. No define lugar del parto ni autoriza inducción en este centro.',
    references: [{ label: 'Estudio NICHD — tabla de Bishop original', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2728002/' }, { label: 'NICE NG207 — interpretación y evaluación para inducción', url: 'https://www.nice.org.uk/guidance/NG207/chapter/recommendations' }],
  },
};
function ReferralCalculator({ kind }) {
  const [values, setValues] = useState({});
  const definition = definitions[kind];
  const calculated = definition.calculate(values);
  const summary = calculated === null ? null : definition.summarize(calculated);
  return <ScoreShell title={definition.title} subtitle="Completa todos los datos para obtener el resultado" badge={summary?.badge} onReset={() => setValues({})} references={definition.references} footnote={definition.note} pending={!summary ? 'Datos incompletos, fuera del ámbito de aplicación o no válidos. Verifica todos los campos.' : null} result={summary ? { nivel: 'Resultado', detalle: summary.detail, conducta: summary.action, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-900' } : null}>
    <div className="grid gap-4 sm:grid-cols-2">{definition.fields.map(({ key, label, options }) => <label key={key} className="block text-sm font-semibold text-slate-700">{label}{options ? <select className={inputClass} value={values[key] ?? ''} onChange={e => setValues(old => ({ ...old, [key]: e.target.value }))}><option value="">Seleccionar…</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select> : <input className={inputClass} inputMode="decimal" value={values[key] ?? ''} onChange={e => setValues(old => ({ ...old, [key]: e.target.value }))} />}</label>)}</div>
  </ScoreShell>;
}
export const RenalFunctionCalculator = () => <ReferralCalculator kind="renal" />;
export const GlasgowBlatchfordCalculator = () => <ReferralCalculator kind="gbs" />;
export const AlvaradoCalculator = () => <ReferralCalculator kind="alvarado" />;
export const CentorMcIsaacCalculator = () => <ReferralCalculator kind="centor" />;
export const BishopCalculator = () => <ReferralCalculator kind="bishop" />;
