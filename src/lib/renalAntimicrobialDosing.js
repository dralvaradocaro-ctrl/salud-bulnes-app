export const RENAL_DOSING_SOURCES = [
  { label: 'Stanford Health Care Antimicrobial Dosing Reference Guide (2026)', url: 'https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC-ABX-Dosing-Guide.pdf' },
  { label: 'NIDDK — Determining Drug Dosing in Adults with CKD', url: 'https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/ckd-drug-dosing-providers' },
  { label: 'FDA — Pharmacokinetics in Patients with Impaired Renal Function (2024)', url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/pharmacokinetics-patients-impaired-renal-function-study-design-data-analysis-and-impact-dosing' },
];

const noChange = (usual, notes = '') => ({ status: 'Sin ajuste renal habitual', recommendation: usual, notes });
const adjust = (recommendation, notes = '') => ({ status: 'Requiere ajuste', recommendation, notes });
const specialist = (recommendation, notes = '') => ({ status: 'Individualizar / monitorizar', recommendation, notes });
const avoid = (recommendation, notes = '') => ({ status: 'Evitar / contraindicación relativa', recommendation, notes });

export const RENAL_ANTIMICROBIALS = [
  'Aciclovir', 'Amikacina', 'Amoxicilina', 'Amoxicilina + ácido clavulánico', 'Ampicilina', 'Ampicilina + sulbactam',
  'Azitromicina', 'Cefazolina', 'Cefepime', 'Ceftazidima', 'Ceftriaxona', 'Ciprofloxacino', 'Clindamicina',
  'Cotrimoxazol (TMP/SMX)', 'Daptomicina', 'Doxiciclina', 'Ertapenem', 'Fluconazol', 'Gentamicina', 'Levofloxacino',
  'Linezolid', 'Meropenem', 'Metronidazol', 'Moxifloxacino', 'Nitrofurantoína', 'Piperacilina + tazobactam', 'Vancomicina',
];

export function calculateCockcroftGault({ creatinine, age, sex, weight }) {
  const scr = Number(String(creatinine ?? '').replace(',', '.'));
  const years = Number(age);
  const kg = Number(String(weight ?? '').replace(',', '.'));
  if (![scr, years, kg].every(Number.isFinite) || scr <= 0 || years < 18 || kg <= 0) return null;
  const female = /^(f|femenino|mujer)$/i.test(String(sex || '').trim());
  const male = /^(m|masculino|hombre)$/i.test(String(sex || '').trim());
  if (!female && !male) return null;
  return Math.round((((140 - years) * kg) / (72 * scr)) * (female ? 0.85 : 1));
}

export function renalDoseRecommendation(name, renalValue) {
  const crcl = Number(renalValue);
  if (!Number.isFinite(crcl) || crcl <= 0) return { status: 'Datos insuficientes', recommendation: 'Complete creatinina, edad, sexo y, de ser posible, peso.', notes: '' };
  switch (name) {
    case 'Amoxicilina': return crcl >= 30 ? noChange('Pauta habitual según foco.') : adjust(crcl < 10 ? '500 mg VO cada 12–24 h según gravedad.' : '500–1.000 mg VO cada 12 h según pauta basal.', 'Evitar formulaciones altas sin revisar la indicación.');
    case 'Amoxicilina + ácido clavulánico': return crcl >= 30 ? noChange('Pauta habitual según foco.') : adjust(crcl < 10 ? '500/125 mg VO cada 24 h.' : '500/125 mg VO cada 12 h.', 'Evitar la presentación 875/125 mg con CrCl <30 mL/min.');
    case 'Ampicilina': return crcl >= 50 ? noChange('1–2 g EV cada 6 h; meningitis/endovascular: 2 g cada 4 h.') : adjust(crcl >= 30 ? '1–2 g EV cada 8 h; meningitis/endovascular: 2 g cada 6 h.' : crcl >= 15 ? '1–2 g EV cada 12 h; meningitis/endovascular: 2 g cada 8 h.' : '1–2 g EV cada 24 h; meningitis/endovascular: 2 g cada 12 h.', 'La gravedad y el sitio modifican la pauta.');
    case 'Ampicilina + sulbactam': return crcl > 30 ? noChange('1,5–3 g EV cada 6 h según gravedad.') : adjust(crcl >= 15 ? '1,5–3 g EV cada 12 h.' : '1,5–3 g EV cada 24 h.', 'Acinetobacter requiere una pauta específica de sulbactam.');
    case 'Cefazolina': return crcl > 30 ? noChange('1 g EV cada 8 h (leve) o 2 g cada 8 h (moderada/grave).') : adjust(crcl >= 10 ? '1 g EV cada 12 h (leve) o 2 g cada 12 h (moderada/grave).' : '1 g EV cada 24 h (leve) o 2 g cada 24 h (moderada/grave).');
    case 'Cefepime': return crcl > 60 ? noChange('1 g cada 8 h o 2 g cada 12 h; grave/Pseudomonas/CNS: 2 g cada 8 h.') : adjust(crcl >= 30 ? '1 g EV cada 12 h o 2 g cada 24 h; grave: 2 g cada 12 h.' : crcl >= 11 ? '1 g EV cada 24 h; grave: 1 g cada 12 h.' : '500 mg EV cada 24 h; grave: 1 g cada 24 h.', 'Vigilar encefalopatía, mioclonías o convulsiones por neurotoxicidad.');
    case 'Ceftazidima': return crcl > 50 ? noChange('1–2 g EV cada 8 h; grave: 2 g cada 8 h.') : adjust(crcl >= 30 ? '1–2 g EV cada 12 h.' : crcl >= 16 ? '1–2 g EV cada 24 h.' : crcl >= 6 ? '500 mg–1 g EV cada 24 h.' : '500 mg EV cada 24 h.', 'Confirmar pauta para meningitis o infección grave.');
    case 'Ceftriaxona': return noChange('1–2 g EV cada 24 h; meningitis: 2 g cada 12 h.', 'Habitualmente no requiere ajuste renal aislado; reconsiderar en insuficiencia renal y hepática combinadas.');
    case 'Ciprofloxacino': return crcl >= 30 ? noChange('400 mg EV o 500 mg VO cada 12 h; grave/Pseudomonas puede requerir pauta mayor.') : adjust('400 mg EV o 500 mg VO cada 24 h.', 'Revisar QT, interacciones, tendón y riesgo de C. difficile.');
    case 'Ertapenem': return crcl >= 30 ? noChange('1 g EV cada 24 h.') : adjust('500 mg EV cada 24 h.', 'En hemodiálisis administrar después de la sesión.');
    case 'Fluconazol': return crcl > 50 ? noChange('Mantener dosis de carga y mantenimiento según indicación.') : adjust('Mantener dosis de carga; reducir mantenimiento aproximadamente 50%.', 'La candidiasis grave/CNS/endovascular requiere valoración especializada.');
    case 'Levofloxacino': return crcl >= 50 ? noChange('Pauta habitual según indicación.') : adjust(crcl >= 20 ? 'Si pauta basal 750 mg/día: 750 mg cada 48 h. Si 500 mg/día: 500 mg inicial y luego 250 mg/día.' : 'Si pauta basal 750 mg/día: 750 mg inicial y luego 500 mg cada 48 h. Si 500 mg/día: 500 mg inicial y luego 250 mg cada 48 h.', 'Verificar indicación, QT y riesgo tendinoso/neurológico.');
    case 'Meropenem': return crcl > 50 ? noChange('1 g EV cada 8 h; meningitis: 2 g cada 8 h.') : adjust(crcl >= 26 ? '1 g EV cada 12 h; meningitis: 2 g cada 12 h.' : crcl >= 10 ? '500 mg EV cada 12 h; meningitis: 1 g cada 12 h.' : '500 mg EV cada 24 h; meningitis: 1 g cada 24 h.', 'Considerar infusión extendida según gravedad/MIC y protocolo local.');
    case 'Piperacilina + tazobactam': return crcl >= 40 ? noChange('Pauta habitual según modalidad de infusión y foco.') : adjust(crcl >= 20 ? 'Infusión corta: 2,25 g EV cada 6 h; neumonía nosocomial: 3,375 g cada 6 h.' : 'Infusión corta: 2,25 g EV cada 8 h; neumonía nosocomial: 2,25 g cada 6 h.', 'Si se usa infusión extendida, aplicar la tabla específica del protocolo local.');
    case 'Daptomicina': return crcl >= 30 ? noChange('Mantener dosis por kg cada 24 h según foco.') : adjust('Mantener dosis por kg y prolongar a cada 48 h.', 'Controlar CPK basal y seriada; bacteriemia/endovascular exige dosis diferenciada.');
    case 'Nitrofurantoína': return crcl >= 30 ? noChange('Usar solo para cistitis baja no complicada.') : avoid('Evitar con CrCl/eGFR <30 mL/min.', 'No usar para pielonefritis, prostatitis, bacteriemia o infección sistémica.');
    case 'Cotrimoxazol (TMP/SMX)': return crcl > 30 ? noChange('Pauta según indicación y componente trimetoprim.') : crcl >= 15 ? adjust('Usar aproximadamente 50% de la dosis diaria habitual.', 'Vigilar potasio, creatinina, hemograma e interacciones.') : avoid('Evitar si existe alternativa; si es imprescindible, individualizar con Farmacia/Infectología.', 'Alto riesgo de hiperpotasemia y toxicidad.');
    case 'Aciclovir': return crcl > 50 ? noChange('Pauta según indicación y vía.') : adjust(crcl >= 25 ? 'EV: conservar dosis y prolongar a cada 12 h.' : crcl >= 10 ? 'EV: conservar dosis y prolongar a cada 24 h.' : 'EV: usar aproximadamente 50% de la dosis cada 24 h.', 'Asegurar hidratación; vigilar neurotoxicidad y cristaluria.');
    case 'Vancomicina': return specialist('Usar dosis de carga según peso/gravedad y ajustar mantenimiento mediante AUC24/MIC o niveles.', 'No derivar una pauta definitiva solo desde CrCl/eGFR. Coordinar Farmacia/PROA.');
    case 'Amikacina':
    case 'Gentamicina': return specialist('Dosificar por peso y función renal con niveles plasmáticos; evitar pauta de intervalo extendido en función renal muy reducida o inestable.', 'Revisar peso de dosificación, foco, sinergia y riesgo oto/nefrotóxico.');
    case 'Azitromicina': return noChange('500 mg EV/VO cada 24 h según indicación.', 'No requiere ajuste renal habitual.');
    case 'Clindamicina': return noChange('600–900 mg EV cada 8 h o pauta VO según foco.', 'No requiere ajuste renal habitual.');
    case 'Doxiciclina': return noChange('100 mg EV/VO cada 12 h; considerar carga en infección grave.', 'No requiere ajuste renal habitual.');
    case 'Linezolid': return noChange('600 mg EV/VO cada 12 h.', 'Sin ajuste renal formal; en tratamientos prolongados y falla renal vigilar trombocitopenia y metabolitos.');
    case 'Metronidazol': return noChange('Pauta habitual según foco.', 'En falla renal extrema/diálisis revisar acumulación de metabolitos y horario posdiálisis.');
    case 'Moxifloxacino': return noChange('400 mg EV/VO cada 24 h.', 'No requiere ajuste renal; no es adecuado para ITU por baja concentración urinaria.');
    default: return specialist('No hay una regla estructurada para este antimicrobiano.', 'Consultar ficha técnica vigente, protocolo local y Farmacia/PROA.');
  }
}
