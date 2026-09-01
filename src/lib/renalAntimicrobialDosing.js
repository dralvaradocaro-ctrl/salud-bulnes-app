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

const generalScenario = [{ id: 'general', label: 'Indicación habitual' }];
export const RENAL_ANTIMICROBIAL_SCENARIOS = {
  Aciclovir: [
    { id: 'iv-general', label: 'EV · HSV mucocutáneo/general' },
    { id: 'iv-severe', label: 'EV · SNC/ocular/diseminado/zóster' },
    { id: 'po-hsv', label: 'VO · HSV mucocutáneo' },
    { id: 'po-vzv', label: 'VO · Varicela-zóster' },
  ],
  Amoxicilina: [
    { id: 'general', label: 'Infección habitual' },
    { id: 'cap', label: 'Neumonía adquirida en comunidad' },
    { id: 'prophylaxis', label: 'Profilaxis de procedimiento (dosis única)' },
  ],
  'Amoxicilina + ácido clavulánico': [
    { id: 'general', label: 'Infección habitual / NAC' },
    { id: 'stepdown', label: 'Descenso VO: intraabdominal o bacteriemia GNR no complicada' },
  ],
  Ampicilina: [
    { id: 'mild', label: 'Leve / no complicada' },
    { id: 'severe', label: 'Meningitis / endovascular / prótesis articular' },
  ],
  'Ampicilina + sulbactam': [
    { id: 'mild', label: 'Leve / no complicada' },
    { id: 'systemic', label: 'Infección sistémica' },
    { id: 'acinetobacter', label: 'Acinetobacter baumannii' },
  ],
  Cefazolina: [
    { id: 'mild', label: 'Infección leve' },
    { id: 'severe', label: 'Moderada / grave' },
  ],
  Cefepime: [
    { id: 'general', label: 'Infección general' },
    { id: 'severe', label: 'Pulmonar / neutropenia / SNC / Pseudomonas / grave' },
  ],
  Ceftazidima: [
    { id: 'general', label: 'Infección general' },
    { id: 'severe', label: 'Infección grave' },
  ],
  Ceftriaxona: [
    { id: 'general', label: 'Infección general' },
    { id: 'endovascular', label: 'Endovascular / osteomielitis / prótesis articular' },
    { id: 'meningitis', label: 'Meningitis / endocarditis por E. faecalis' },
  ],
  Ciprofloxacino: [
    { id: 'general', label: 'Infección general' },
    { id: 'severe', label: 'Pseudomonas / infección grave' },
  ],
  'Cotrimoxazol (TMP/SMX)': [
    { id: 'cystitis', label: 'Cistitis no complicada' },
    { id: 'ssti', label: 'Piel y tejidos blandos' },
    { id: 'bone-gnb', label: 'Ósea/articular por S. aureus o bacteriemia GNR' },
    { id: 'stenotrophomonas', label: 'Stenotrophomonas' },
    { id: 'pjp', label: 'Pneumocystis jirovecii' },
  ],
  Daptomicina: [
    { id: 'ssti', label: 'Piel y tejidos blandos' },
    { id: 'bacteremia', label: 'Bacteriemia / endovascular' },
    { id: 'efaecium', label: 'Enterococcus faecium (consulta especialista)' },
  ],
  Fluconazol: [
    { id: 'oropharyngeal', label: 'Orofaríngea / peritonitis por Candida' },
    { id: 'esophageal', label: 'Esofágica / osteoarticular / pielonefritis por Candida' },
    { id: 'severe', label: 'Candidiasis grave / candidemia / SNC / endovascular' },
  ],
  Levofloxacino: [
    { id: 'cystitis', label: 'Cistitis' },
    { id: 'moderate', label: 'Pie diabético leve-moderado / prostatitis' },
    { id: 'severe', label: 'Neumonía / ITU complicada / osteomielitis / Pseudomonas / grave' },
  ],
  Meropenem: [
    { id: 'general', label: 'Habitual / neutropenia / neumonía / Pseudomonas' },
    { id: 'cns', label: 'Fibrosis quística / infección del SNC' },
  ],
  Metronidazol: [
    { id: 'general', label: 'SNC / C. difficile / tejidos blandos o necrotizante' },
    { id: 'intraabdominal', label: 'Intraabdominal' },
    { id: 'hepatic', label: 'Insuficiencia hepática grave' },
  ],
  'Piperacilina + tazobactam': [
    { id: 'extended', label: 'Infusión extendida 4 h · general/Pseudomonas/neumonía nosocomial' },
    { id: 'intermittent-general', label: 'Infusión 30 min · infección general' },
    { id: 'intermittent-severe', label: 'Infusión 30 min · sepsis/grave/FQ/neumonía nosocomial' },
  ],
  Vancomicina: [
    { id: 'iv', label: 'EV · infección sistémica (AUC/niveles)' },
    { id: 'po-cdi', label: 'VO · C. difficile no fulminante' },
    { id: 'po-cdi-fulminant', label: 'VO · C. difficile fulminante/complicada' },
  ],
};

export const getRenalAntimicrobialScenarios = name => RENAL_ANTIMICROBIAL_SCENARIOS[name] || generalScenario;

export function antimicrobialUsualDose(name, scenario = 'general') {
  switch (name) {
    case 'Aciclovir':
      if (scenario === 'iv-severe') return '10 mg/kg EV cada 8 h.';
      if (scenario === 'po-hsv') return '400 mg VO cada 8 h (alternativa: 200 mg VO 5 veces/día).';
      if (scenario === 'po-vzv') return '800 mg VO cada 4 h (5 veces/día).';
      return '5 mg/kg EV cada 8 h.';
    case 'Amikacina': return 'Dosificación por peso según protocolo de aminoglucósidos y monitorización de niveles.';
    case 'Amoxicilina':
      if (scenario === 'cap') return '1.000 mg VO cada 8 h.';
      if (scenario === 'prophylaxis') return '2.000 mg VO una vez.';
      return '500 mg VO cada 8 h o 1.000 mg VO cada 8–12 h.';
    case 'Amoxicilina + ácido clavulánico': return scenario === 'stepdown' ? 'Hasta 875/125 mg VO cada 8 h.' : '500/125 mg VO cada 8 h u 875/125 mg VO cada 12 h.';
    case 'Ampicilina': return scenario === 'severe' ? '2 g EV cada 4 h.' : '1–2 g EV cada 6 h.';
    case 'Ampicilina + sulbactam': return scenario === 'acinetobacter' ? '3 g EV cada 4 h.' : scenario === 'systemic' ? '3 g EV cada 6 h.' : '1,5 g EV cada 6 h.';
    case 'Azitromicina': return '500 mg EV/VO cada 24 h.';
    case 'Cefazolina': return scenario === 'severe' ? '2 g EV cada 8 h.' : '1 g EV cada 8 h.';
    case 'Cefepime': return scenario === 'severe' ? '2 g EV cada 8 h, en infusión extendida de 4 h.' : '1 g EV cada 8 h o 2 g EV cada 12 h, en infusión extendida de 4 h.';
    case 'Ceftazidima': return scenario === 'severe' ? '2 g EV cada 8 h.' : '1–2 g EV cada 8 h.';
    case 'Ceftriaxona': return scenario === 'meningitis' ? '2 g EV cada 12 h.' : scenario === 'endovascular' ? '2 g EV cada 24 h.' : '1–2 g EV cada 24 h.';
    case 'Ciprofloxacino': return scenario === 'severe' ? '400 mg EV cada 8 h o 750 mg VO cada 12 h.' : '400 mg EV cada 12 h o 500 mg VO cada 12 h.';
    case 'Clindamicina': return '600–900 mg EV cada 8 h o 150–450 mg VO cada 6 h.';
    case 'Cotrimoxazol (TMP/SMX)':
      if (scenario === 'ssti') return '1–2 comprimidos DS VO cada 12 h.';
      if (scenario === 'bone-gnb') return '8–10 mg/kg/día del componente TMP, dividido (aprox. 2 DS cada 12 h).';
      if (scenario === 'stenotrophomonas') return '10–15 mg/kg/día de TMP, dividido cada 8–12 h.';
      if (scenario === 'pjp') return '10–15 mg/kg/día de TMP, dividido cada 8 h (aprox. 2 DS cada 8 h).';
      return '1 comprimido DS VO cada 12 h.';
    case 'Daptomicina': return scenario === 'efaecium' ? '10–12 mg/kg EV cada 24 h.' : scenario === 'bacteremia' ? '8 mg/kg EV cada 24 h.' : '4–6 mg/kg EV cada 24 h.';
    case 'Doxiciclina': return 'Carga 200 mg una vez si infección grave; luego 100 mg EV/VO cada 12 h.';
    case 'Ertapenem': return '1 g EV cada 24 h.';
    case 'Fluconazol':
      if (scenario === 'severe') return 'Carga 800 mg (12 mg/kg) una vez; luego 400–800 mg EV/VO cada 24 h.';
      if (scenario === 'esophageal') return '400 mg (6 mg/kg) EV/VO cada 24 h.';
      return 'Carga 200 mg una vez; luego 100–200 mg EV/VO cada 24 h.';
    case 'Gentamicina': return 'Dosificación por peso según protocolo de aminoglucósidos y monitorización de niveles.';
    case 'Levofloxacino': return scenario === 'cystitis' ? '250 mg EV/VO cada 24 h.' : scenario === 'moderate' ? '500 mg EV/VO cada 24 h.' : '750 mg EV/VO cada 24 h.';
    case 'Linezolid': return '600 mg EV/VO cada 12 h.';
    case 'Meropenem': return scenario === 'cns' ? '2 g EV cada 8 h, en infusión extendida de 3 h.' : '1 g EV cada 8 h, en infusión extendida de 3 h.';
    case 'Metronidazol': return scenario === 'intraabdominal' ? '500 mg EV/VO cada 8–12 h.' : scenario === 'hepatic' ? '500 mg EV/VO cada 12 h.' : '500 mg EV/VO cada 8 h.';
    case 'Moxifloxacino': return '400 mg EV/VO cada 24 h.';
    case 'Nitrofurantoína': return '100 mg VO cada 12 h, solo para cistitis baja no complicada.';
    case 'Piperacilina + tazobactam':
      if (scenario === 'intermittent-general') return '3,375 g EV cada 6 h, infusión de 30 min.';
      if (scenario === 'intermittent-severe') return '4,5 g EV cada 6 h, infusión de 30 min.';
      return '3,375–4,5 g EV cada 8 h, infusión extendida de 4 h.';
    case 'Vancomicina':
      if (scenario === 'po-cdi') return '125 mg VO cada 6 h.';
      if (scenario === 'po-cdi-fulminant') return '500 mg VO cada 6 h.';
      return 'Dosis de carga según peso/gravedad; mantenimiento guiado por AUC24/MIC o niveles.';
    default: return 'Consultar ficha técnica vigente, protocolo local y Farmacia/PROA.';
  }
}

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

export function renalDoseRecommendation(name, renalValue, scenario = 'general') {
  const crcl = Number(renalValue);
  if (!Number.isFinite(crcl) || crcl <= 0) return { status: 'Datos insuficientes', recommendation: 'Complete creatinina, edad, sexo y, de ser posible, peso.', notes: '' };
  const usualDose = antimicrobialUsualDose(name, scenario);
  switch (name) {
    case 'Amoxicilina':
      if (scenario === 'prophylaxis') return noChange(usualDose, 'Dosis única; no requiere ajuste renal habitual.');
      return crcl >= 30 ? noChange(usualDose) : adjust(crcl < 10 ? '500 mg VO cada 12–24 h.' : scenario === 'cap' ? '1.000 mg VO cada 12 h.' : '500–1.000 mg VO cada 12 h.', 'Elegir la dosis dentro del rango según foco y gravedad.');
    case 'Amoxicilina + ácido clavulánico': return crcl >= 30 ? noChange(usualDose) : adjust(crcl < 10 ? (scenario === 'stepdown' ? 'Hasta 875/125 mg VO cada 24 h.' : '500/125 mg VO cada 24 h.') : (scenario === 'stepdown' ? 'Hasta 875/125 mg VO cada 12 h.' : '500/125 mg VO cada 12 h.'), 'Revisar la presentación disponible y el aporte de clavulanato.');
    case 'Ampicilina': return crcl >= 50 ? noChange(usualDose, crcl >= 130 ? 'Depuración aumentada: Stanford permite considerar 2 g EV cada 4 h incluso en infección no complicada.' : '') : adjust(scenario === 'severe' ? (crcl >= 30 ? '2 g EV cada 6 h.' : crcl >= 15 ? '2 g EV cada 8 h.' : '2 g EV cada 12 h.') : (crcl >= 30 ? '1–2 g EV cada 8 h.' : crcl >= 15 ? '1–2 g EV cada 12 h.' : '1–2 g EV cada 24 h.'), 'La gravedad y el sitio modifican la pauta.');
    case 'Ampicilina + sulbactam': return crcl > 30 ? noChange(usualDose) : adjust(scenario === 'acinetobacter' ? (crcl >= 15 ? '3 g EV cada 8 h.' : '3 g EV cada 12 h.') : scenario === 'systemic' ? (crcl >= 15 ? '3 g EV cada 12 h.' : '3 g EV cada 24 h.') : (crcl >= 15 ? '1,5 g EV cada 12 h.' : '1,5 g EV cada 24 h.'), scenario === 'acinetobacter' ? 'Pauta específica orientada al componente sulbactam; validar con PROA/Infectología.' : 'Confirmar foco y gravedad.');
    case 'Cefazolina': return crcl > 30 ? noChange(usualDose) : adjust(scenario === 'severe' ? (crcl >= 10 ? '2 g EV cada 12 h.' : '2 g EV cada 24 h.') : (crcl >= 10 ? '1 g EV cada 12 h.' : '1 g EV cada 24 h.'));
    case 'Cefepime': return crcl > 60 ? noChange(usualDose) : adjust(scenario === 'severe' ? (crcl >= 30 ? '2 g EV cada 12 h, infusión de 4 h.' : crcl >= 11 ? '1 g EV cada 12 h, infusión de 4 h.' : '1 g EV cada 24 h, infusión de 4 h.') : (crcl >= 30 ? '1 g EV cada 12 h o 2 g EV cada 24 h, infusión de 4 h.' : crcl >= 11 ? '1 g EV cada 24 h, infusión de 4 h.' : '500 mg EV cada 24 h, infusión de 4 h.'), 'Vigilar encefalopatía, mioclonías o convulsiones por neurotoxicidad.');
    case 'Ceftazidima': return crcl > 50 ? noChange(usualDose) : adjust(crcl >= 30 ? '1–2 g EV cada 12 h.' : crcl >= 16 ? '1–2 g EV cada 24 h.' : crcl >= 6 ? '500 mg–1 g EV cada 24 h.' : '500 mg EV cada 24 h.', scenario === 'severe' ? 'Usar el extremo superior del rango y validar exposición según gravedad.' : 'Confirmar foco y microbiología.');
    case 'Ceftriaxona': return noChange(usualDose, 'No requiere ajuste renal aislado; reconsiderar en insuficiencia renal y hepática combinadas.');
    case 'Ciprofloxacino': return crcl >= 30 ? noChange(usualDose) : adjust(scenario === 'severe' ? '400 mg EV cada 24 h o 500 mg VO cada 24 h.' : '200–400 mg EV cada 24 h o 250–500 mg VO cada 24 h.', 'Revisar QT, interacciones, tendón y riesgo de C. difficile.');
    case 'Ertapenem': return crcl >= 30 ? noChange('1 g EV cada 24 h.') : adjust('500 mg EV cada 24 h.', 'En hemodiálisis administrar después de la sesión.');
    case 'Fluconazol': return crcl > 50 ? noChange(usualDose, scenario === 'severe' ? 'Stanford recomienda consulta a Infectología para candidiasis grave, criptococosis o coccidioidomicosis.' : '') : adjust(scenario === 'severe' ? 'Carga 800 mg (12 mg/kg) una vez; luego 200–400 mg (3–6 mg/kg) EV/VO cada 24 h.' : scenario === 'esophageal' ? 'Carga 400 mg (6 mg/kg) una vez; luego 200 mg (3 mg/kg) EV/VO cada 24 h.' : 'Carga 200 mg una vez; luego 100 mg EV/VO cada 24 h.', 'Mantener completa la dosis de carga; ajustar el mantenimiento.');
    case 'Levofloxacino':
      if (scenario === 'cystitis') return noChange(usualDose, 'Stanford no modifica la pauta de 250 mg/día en estos tramos; administrar después de HD si corresponde.');
      return crcl >= 50 ? noChange(usualDose) : adjust(scenario === 'moderate' ? (crcl >= 20 ? '500 mg inicial y luego 250 mg EV/VO cada 24 h.' : '500 mg inicial y luego 250 mg EV/VO cada 48 h.') : (crcl >= 20 ? '750 mg EV/VO cada 48 h.' : '750 mg inicial y luego 500 mg EV/VO cada 48 h.'), 'Verificar indicación, QT y riesgo tendinoso/neurológico.');
    case 'Meropenem': return crcl > 50 ? noChange(usualDose, crcl >= 130 ? 'Depuración aumentada: en infección vital/resistente, MIC 2 mg/L u obesidad seleccionada, considerar 2 g EV cada 8 h en infusión de 3 h.' : '') : adjust(scenario === 'cns' ? (crcl >= 26 ? '2 g EV cada 12 h, infusión de 3 h.' : crcl >= 10 ? '1 g EV cada 12 h, infusión de 3 h.' : '1 g EV cada 24 h, infusión de 3 h.') : (crcl >= 26 ? '1 g EV cada 12 h, infusión de 3 h.' : crcl >= 10 ? '500 mg EV cada 12 h, infusión de 3 h.' : '500 mg EV cada 24 h, infusión de 3 h.'), 'Confirmar foco, MIC y protocolo local.');
    case 'Piperacilina + tazobactam':
      if (scenario === 'extended') return crcl > 20 ? noChange(usualDose, crcl > 120 ? 'Depuración aumentada: considerar 4,5 g EV cada 8 h en 4 h o cada 6 h según gravedad/MIC.' : 'En sepsis, infección profunda, MIC 16 mg/L, peso >120 kg/BMI >40, fibrosis quística o depuración aumentada, puede requerirse 4,5 g cada 8 h en 4 h o cada 6 h.') : adjust('3,375 g EV cada 12 h, infusión extendida de 4 h.', 'En infección grave con CrCl <20, Stanford contempla 3,375 g cada 12 h en 4 h.');
      if (scenario === 'intermittent-severe') return crcl > 40 ? noChange(usualDose) : adjust(crcl >= 20 ? '3,375 g EV cada 6 h, infusión de 30 min.' : '2,25 g EV cada 6 h, infusión de 30 min.', 'Considerar infusión extendida en infección grave o Pseudomonas.');
      return crcl > 40 ? noChange(usualDose) : adjust(crcl >= 20 ? '2,25 g EV cada 6 h, infusión de 30 min.' : '2,25 g EV cada 8 h, infusión de 30 min.', 'Confirmar modalidad de infusión antes de indicar.');
    case 'Daptomicina': return crcl >= 30 ? noChange(usualDose) : adjust(scenario === 'efaecium' ? '10–12 mg/kg EV cada 48 h.' : scenario === 'bacteremia' ? '8 mg/kg EV cada 48 h.' : '4–6 mg/kg EV cada 48 h.', 'Controlar CPK basal y seriada; dosis >8 mg/kg requieren juicio clínico y monitorización más frecuente.');
    case 'Nitrofurantoína': return crcl >= 30 ? noChange(usualDose) : avoid('Evitar con CrCl/eGFR <30 mL/min.', 'No usar para pielonefritis, prostatitis, bacteriemia o infección sistémica.');
    case 'Cotrimoxazol (TMP/SMX)': return crcl > 30 ? noChange(usualDose) : crcl >= 15 ? adjust(`50% de la pauta habitual seleccionada: ${usualDose}`, 'Vigilar potasio, creatinina, hemograma e interacciones.') : scenario === 'pjp' ? specialist('5–7,5 mg/kg de TMP cada 24 h (25–50% de la pauta habitual).', 'CrCl <15: uso no recomendado; si es imprescindible, coordinar Farmacia/Infectología y monitorizar toxicidad.') : avoid('Uso no recomendado con CrCl <15 mL/min; si no existe alternativa, usar 25–50% de la pauta habitual con supervisión especializada.', 'Alto riesgo de hiperpotasemia y toxicidad.');
    case 'Aciclovir':
      if (scenario === 'po-hsv') return crcl > 50 ? noChange(usualDose) : adjust(crcl >= 25 ? '200 mg VO cada 8 h.' : '200 mg VO cada 12 h.', 'Asegurar hidratación y vigilar neurotoxicidad.');
      if (scenario === 'po-vzv') return crcl > 50 ? noChange(usualDose) : adjust(crcl >= 25 ? '800 mg VO cada 8 h.' : '800 mg VO cada 12 h.', 'Asegurar hidratación y vigilar neurotoxicidad.');
      return crcl > 50 ? noChange(usualDose) : adjust(scenario === 'iv-severe' ? (crcl >= 25 ? '10 mg/kg EV cada 12 h.' : crcl >= 10 ? '10 mg/kg EV cada 24 h.' : '5 mg/kg EV cada 24 h.') : (crcl >= 25 ? '5 mg/kg EV cada 12 h.' : crcl >= 10 ? '5 mg/kg EV cada 24 h.' : '2,5 mg/kg EV cada 24 h.'), 'Usar peso ajustado en obesidad; asegurar hidratación y vigilar neurotoxicidad/cristaluria.');
    case 'Vancomicina':
      if (scenario === 'po-cdi' || scenario === 'po-cdi-fulminant') return noChange(usualDose, 'La vancomicina VO tiene absorción sistémica pobre y no requiere ajuste renal habitual.');
      return specialist(usualDose, 'No derivar mantenimiento EV solo desde CrCl/eGFR: usar protocolo de vancomicina, AUC24/MIC o niveles y coordinar Farmacia/PROA.');
    case 'Amikacina':
    case 'Gentamicina': return specialist('Dosificar por peso y función renal con niveles plasmáticos; evitar pauta de intervalo extendido en función renal muy reducida o inestable.', 'Revisar peso de dosificación, foco, sinergia y riesgo oto/nefrotóxico.');
    case 'Azitromicina': return noChange(usualDose, 'No requiere ajuste renal habitual.');
    case 'Clindamicina': return noChange(usualDose, 'No requiere ajuste renal habitual.');
    case 'Doxiciclina': return noChange(usualDose, 'No requiere ajuste renal habitual.');
    case 'Linezolid': return noChange(usualDose, 'Sin ajuste renal formal; en tratamientos prolongados y falla renal vigilar trombocitopenia y metabolitos.');
    case 'Metronidazol': return noChange(usualDose, 'Con CrCl <30 y uso >1–2 semanas, vigilar acumulación de metabolitos y neurotoxicidad.');
    case 'Moxifloxacino': return noChange(usualDose, 'No requiere ajuste renal; no es adecuado para ITU por baja concentración urinaria.');
    default: return specialist('No hay una regla estructurada para este antimicrobiano.', 'Consultar ficha técnica vigente, protocolo local y Farmacia/PROA.');
  }
}
