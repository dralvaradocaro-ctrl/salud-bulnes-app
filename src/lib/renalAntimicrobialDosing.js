export const RENAL_DOSING_SOURCES = [
  { label: 'Stanford Health Care Antimicrobial Dosing Reference Guide (2026)', url: 'https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC-ABX-Dosing-Guide.pdf' },
  { label: 'Stanford Health Care Aminoglycoside Dosing Guide', url: 'https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC-Aminoglycoside-Dosing-Guide.pdf' },
  { label: 'Stanford Health Care Vancomycin Dosing Guide', url: 'https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC-Vancomycin-Dosing-Guide.pdf' },
  { label: 'NIDDK — Determining Drug Dosing in Adults with CKD', url: 'https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/ckd-drug-dosing-providers' },
  { label: 'FDA — Pharmacokinetics in Patients with Impaired Renal Function (2024)', url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/pharmacokinetics-patients-impaired-renal-function-study-design-data-analysis-and-impact-dosing' },
];

const noChange = (usual, notes = '') => ({ status: 'Sin ajuste renal habitual', recommendation: usual, notes });
const adjust = (recommendation, notes = '') => ({ status: 'Requiere ajuste', recommendation, notes });
const specialist = (recommendation, notes = '') => ({ status: 'Individualizar / monitorizar', recommendation, notes });
const avoid = (recommendation, notes = '') => ({ status: 'Evitar / contraindicación relativa', recommendation, notes });
const replacement = (modality, recommendation, notes = '', steps = []) => ({ status: modality, recommendation, notes, steps });

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
  Amikacina: [
    { id: 'gn-extended', label: 'Gramnegativos · dosis extendida' },
    { id: 'gn-conventional', label: 'Gramnegativos · pauta convencional' },
    { id: 'cf', label: 'Exacerbación de fibrosis quística' },
    { id: 'ntm-daily', label: 'Micobacterias no tuberculosas · pauta diaria' },
    { id: 'ntm-weekly', label: 'Micobacterias no tuberculosas · 3 veces/semana' },
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
  Gentamicina: [
    { id: 'gn-hartford', label: 'Gramnegativos grave/sepsis/Pseudomonas · Hartford' },
    { id: 'gn-urban', label: 'ITU complicada/pielonefritis/profilaxis · Urban-Craig' },
    { id: 'gn-conventional', label: 'Gramnegativos · pauta convencional' },
    { id: 'synergy-strep', label: 'Sinergia · endocarditis por Streptococcus' },
    { id: 'synergy-staph-enterococcus', label: 'Sinergia · Staphylococcus/Enterococcus' },
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

const calculatedWeightDose = (mgPerKg, weight) => {
  const kg = Number(String(weight ?? '').replace(',', '.'));
  if (!Number.isFinite(kg) || kg <= 0) return '';
  const total = Math.round(mgPerKg * kg);
  return ` ≈ ${total} mg por dosis para ${kg} kg, antes de ajustar por peso de dosificación y presentación`;
};

const weightBasedDose = (range, weight, interval, route = 'EV') => {
  const values = String(range).split('-').map(Number);
  const calculated = values.length === 1
    ? calculatedWeightDose(values[0], weight)
    : (() => {
      const kg = Number(String(weight ?? '').replace(',', '.'));
      if (!Number.isFinite(kg) || kg <= 0) return '';
      return ` ≈ ${Math.round(values[0] * kg)}–${Math.round(values[1] * kg)} mg por dosis para ${kg} kg, antes de ajustar por peso de dosificación y presentación`;
    })();
  return `${range.replace('-', '–')} mg/kg ${route}${calculated}; ${interval}.`;
};

const vancomycinLoadingDose = (weight, modified = false) => {
  const kg = Number(String(weight ?? '').replace(',', '.'));
  if (!Number.isFinite(kg) || kg <= 0) return modified
    ? 'Carga 20–25 mg/kg EV una vez (máximo 2 g en IHD/TRRC; redondear a 250 mg).'
    : 'Carga 20–35 mg/kg EV una vez según gravedad (habitualmente ~25 mg/kg; máximo 3 g; redondear a 250 mg).';
  if (modified) {
    const dose = Math.min(2000, Math.max(250, Math.round((kg * 25) / 250) * 250));
    return `Carga ${dose.toLocaleString('es-CL')} mg EV una vez (25 mg/kg para ${kg} kg; máximo 2 g).`;
  }
  if (kg <= 45) return 'Carga 1.000 mg EV una vez.';
  if (kg <= 55) return 'Carga 1.250 mg EV una vez.';
  if (kg <= 65) return 'Carga 1.500 mg EV una vez.';
  if (kg <= 75) return 'Carga 1.750 mg EV una vez.';
  if (kg <= 120) return 'Carga 2.000 mg EV una vez.';
  return 'Carga 2.000–3.000 mg EV una vez, según gravedad (máximo 3 g).';
};

function renalReplacementDose(name, scenario, modality, context = {}) {
  const label = modality === 'ihd' ? 'Hemodiálisis intermitente' : modality === 'crrt' ? 'TRRC' : 'Diálisis peritoneal';
  const afterHd = 'Administrar la dosis diaria después de la sesión los días de hemodiálisis.';
  if (modality === 'pd' && name !== 'Vancomicina') return specialist('No hay una pauta estructurada de diálisis peritoneal para este antimicrobiano en la guía Stanford utilizada.', 'Validar modalidad, función renal residual, vía y pauta con Farmacia/PROA.');
  switch (name) {
    case 'Aciclovir':
      if (modality === 'ihd') {
        if (scenario === 'iv-severe') return replacement(label, weightBasedDose('5', context.weight, 'cada 24 h, después de hemodiálisis'), 'Asegurar hidratación y vigilar neurotoxicidad/cristaluria.');
        if (scenario === 'iv-general') return replacement(label, weightBasedDose('2.5', context.weight, 'cada 24 h, después de hemodiálisis'), 'Asegurar hidratación y vigilar neurotoxicidad/cristaluria.');
        return replacement(label, scenario === 'po-vzv' ? '800 mg VO cada 12 h; administrar después de hemodiálisis.' : '200 mg VO cada 12 h; administrar después de hemodiálisis.', 'La guía no aporta pauta CRRT para presentaciones VO.');
      }
      return modality === 'crrt' ? replacement(label, scenario === 'iv-severe' ? weightBasedDose('10', context.weight, 'cada 12 h') : weightBasedDose('5', context.weight, 'cada 12 h'), 'Confirmar tasa de efluente y vigilar neurotoxicidad.') : specialist('Individualizar por nivel y función renal residual.', 'Consultar Farmacia/PROA.');
    case 'Amikacina':
      if (modality === 'ihd') return replacement(label, `${weightBasedDose('5-7.5', context.weight, 'después de hemodiálisis')} Redosificar según nivel pre-HD o 4 h post-HD.`, 'La pauta extendida no se aplica en IHD; usar estrategia convencional y niveles.');
      if (modality === 'crrt') return replacement(label, `${weightBasedDose('10', context.weight, 'dosis de carga')} Luego ${weightBasedDose('7.5', context.weight, 'cada 24–48 h')}`, 'Controlar pico y valle; ajustar según efluente y función residual.');
      break;
    case 'Amoxicilina': return modality === 'ihd' ? replacement(label, '500 mg VO cada 12–24 h; administrar después de hemodiálisis.', afterHd) : specialist('Sin datos estructurados para TRRC en la guía Stanford.', 'Individualizar con Farmacia/PROA.');
    case 'Amoxicilina + ácido clavulánico': return modality === 'ihd' ? replacement(label, '500/125 mg VO cada 24 h; después de hemodiálisis o con dosis suplementaria al finalizar.', afterHd) : specialist('Sin datos estructurados para TRRC en la guía Stanford.', 'Individualizar con Farmacia/PROA.');
    case 'Ampicilina':
      if (modality === 'ihd') return replacement(label, scenario === 'severe' ? '2 g EV cada 12 h; administrar después de hemodiálisis.' : '1–2 g EV cada 24 h; administrar después de hemodiálisis.', afterHd);
      return replacement(label, scenario === 'severe' ? '2 g EV cada 6–8 h.' : '2 g EV cada 8–12 h.', 'Confirmar tasa de efluente y foco.');
    case 'Ampicilina + sulbactam':
      if (modality === 'ihd') return replacement(label, scenario === 'acinetobacter' ? '3 g EV cada 12 h; administrar después de hemodiálisis.' : scenario === 'systemic' ? '3 g EV cada 24 h; administrar después de hemodiálisis.' : '1,5 g EV cada 24 h; administrar después de hemodiálisis.', afterHd);
      return replacement(label, scenario === 'acinetobacter' ? '3 g EV cada 6 h.' : scenario === 'systemic' ? '3 g EV cada 8 h.' : '3 g EV cada 12 h.', 'Confirmar tasa de efluente.');
    case 'Azitromicina': return replacement(label, '500 mg EV/VO cada 24 h.', 'No requiere ajuste específico por reemplazo renal.');
    case 'Cefazolina': return modality === 'ihd' ? replacement(label, '1 g EV cada 24 h, después de hemodiálisis; alternativa seleccionada: 2 g/2 g/3 g EV solo post-HD.', afterHd) : replacement(label, '2 g EV cada 12 h.', 'Confirmar tasa de efluente y gravedad.');
    case 'Cefepime': return modality === 'ihd' ? replacement(label, scenario === 'severe' ? '1 g EV cada 24 h, después de hemodiálisis.' : '500 mg–1 g EV cada 24 h, después de hemodiálisis.', 'Vigilar neurotoxicidad; Stanford contempla 2 g solo post-HD como alternativa seleccionada.') : replacement(label, 'Carga 2 g EV; luego 1 g EV cada 8 h, infusión de 4 h.', 'Confirmar tasa de efluente; individualizar infecciones graves/SNC.');
    case 'Ceftazidima': return modality === 'ihd' ? replacement(label, '500 mg–1 g EV cada 24 h, después de hemodiálisis.', afterHd) : replacement(label, 'Carga 2 g EV; luego 1 g EV cada 8 h o 2 g EV cada 12 h.', 'Confirmar tasa de efluente y gravedad.');
    case 'Ceftriaxona': return replacement(label, antimicrobialUsualDose(name, scenario, context.weight), 'No requiere ajuste específico por reemplazo renal aislado.');
    case 'Ciprofloxacino': return modality === 'ihd' ? replacement(label, '200–400 mg EV cada 24 h o 250–500 mg VO cada 24 h; después de hemodiálisis.', afterHd) : replacement(label, scenario === 'severe' ? '400 mg EV cada 8–12 h.' : '400 mg EV cada 12 h o 500 mg VO cada 12 h.', 'Confirmar tasa de efluente y riesgo de QT.');
    case 'Clindamicina': return replacement(label, antimicrobialUsualDose(name, scenario, context.weight), 'No requiere ajuste específico por reemplazo renal.');
    case 'Cotrimoxazol (TMP/SMX)':
      if (modality === 'ihd') return replacement(label, scenario === 'pjp' || scenario === 'stenotrophomonas' ? weightBasedDose('5-7.5', context.weight, 'cada 24 h, después de hemodiálisis', 'de TMP EV/VO') : weightBasedDose('2.5-5', context.weight, 'cada 24 h, después de hemodiálisis', 'de TMP EV/VO'), 'Vigilar potasio, hemograma y toxicidad; ajustar al foco.');
      return replacement(label, scenario === 'pjp' ? weightBasedDose('10-15', context.weight, 'por día, dividido cada 8 h', 'de TMP EV/VO') : scenario === 'stenotrophomonas' ? weightBasedDose('10-15', context.weight, 'por día, dividido cada 8–12 h', 'de TMP EV/VO') : weightBasedDose('5-10', context.weight, 'por día, dividido cada 12 h', 'de TMP EV/VO'), 'Confirmar tasa de efluente y vigilar potasio.');
    case 'Daptomicina':
      return modality === 'ihd'
        ? replacement(label, scenario === 'efaecium' ? weightBasedDose('8-10', context.weight, 'post-HD; alternativa cada 48 h') : scenario === 'bacteremia' ? weightBasedDose('8', context.weight, 'post-HD; alternativa cada 48 h') : weightBasedDose('6', context.weight, 'post-HD; alternativa 4–6 mg/kg cada 48 h'), 'Controlar CPK; la dosis previa al intervalo largo puede requerir aumento según protocolo.')
        : replacement(label, scenario === 'efaecium' ? weightBasedDose('8', context.weight, 'cada 24 h') : scenario === 'bacteremia' ? weightBasedDose('6-8', context.weight, 'cada 24 h') : weightBasedDose('6', context.weight, 'cada 24 h'), 'Controlar CPK y confirmar tasa de efluente.');
    case 'Doxiciclina': return replacement(label, antimicrobialUsualDose(name, scenario, context.weight), 'No requiere ajuste específico por reemplazo renal.');
    case 'Ertapenem': return modality === 'ihd' ? replacement(label, '500 mg EV cada 24 h, después de hemodiálisis; alternativa seleccionada 500–1.000 mg solo post-HD.', afterHd) : replacement(label, '1 g EV cada 24 h.', 'Confirmar tasa de efluente.');
    case 'Fluconazol':
      if (modality === 'ihd') return replacement(label, scenario === 'severe' ? 'Carga 800 mg una vez; luego 400–800 mg EV/VO post-HD o 200–400 mg cada 24 h, después de HD.' : scenario === 'esophageal' ? 'Carga 400 mg una vez; luego 400 mg post-HD o 200 mg cada 24 h, después de HD.' : 'Carga 200 mg una vez; luego 200 mg cada 48 h, después de HD.', 'No reducir la dosis de carga.');
      return replacement(label, scenario === 'severe' ? 'Carga 800 mg; luego 400–800 mg EV/VO cada 24 h.' : scenario === 'esophageal' ? 'Carga 800 mg; luego 400 mg EV/VO cada 24 h.' : 'Carga 400 mg; luego 100–200 mg EV/VO cada 24 h.', 'Confirmar tasa de efluente; candidiasis grave requiere Infectología.');
    case 'Gentamicina':
      if (modality === 'ihd') return replacement(label, scenario.startsWith('synergy') ? `${weightBasedDose('1', context.weight, 'cada 48–72 h')} Redosificar por nivel pre-HD o 4 h post-HD <1 mcg/mL.` : `${weightBasedDose('2', context.weight, 'dosis de carga')} Luego ${weightBasedDose('1.5', context.weight, 'post-HD, con redosificación según nivel')}`, 'No usar nomograma de intervalo extendido en IHD.');
      return replacement(label, scenario.startsWith('synergy') ? `${weightBasedDose('1', context.weight, 'cada 24 h')} Luego ajustar por nivel.` : `${weightBasedDose('3', context.weight, 'dosis de carga')} Luego ${weightBasedDose('1.5-2.5', context.weight, 'cada 24–48 h')}`, 'Controlar pico/valle y ajustar por tasa de efluente.');
    case 'Levofloxacino': return modality === 'ihd' ? replacement(label, scenario === 'cystitis' ? '250 mg EV/VO cada 24 h, después de hemodiálisis.' : scenario === 'moderate' ? '500 mg una vez; luego 250 mg EV/VO cada 48 h, después de HD.' : '750 mg una vez; luego 500 mg EV/VO cada 48 h, después de HD.', afterHd) : replacement(label, scenario === 'severe' ? '750 mg EV/VO cada 48 h.' : scenario === 'moderate' ? '500 mg una vez; luego 250 mg cada 24 h o 500 mg cada 48 h.' : '250 mg EV/VO cada 24 h.', 'Confirmar tasa de efluente y QT.');
    case 'Linezolid': return replacement(label, '600 mg EV/VO cada 12 h.', 'Sin ajuste formal; en falla renal prolongada vigilar trombocitopenia y metabolitos.');
    case 'Meropenem': return modality === 'ihd' ? replacement(label, scenario === 'cns' ? '1 g EV cada 24 h, después de hemodiálisis.' : '500 mg EV cada 24 h, después de hemodiálisis.', afterHd) : replacement(label, scenario === 'cns' ? '2 g EV cada 12 h, infusión de 3 h.' : '1 g EV cada 8 h, infusión de 3 h.', 'Confirmar tasa de efluente y MIC.');
    case 'Metronidazol': return replacement(label, antimicrobialUsualDose(name, scenario, context.weight), 'Generalmente sin ajuste; vigilar metabolitos/neurotoxicidad en uso prolongado.');
    case 'Moxifloxacino': return replacement(label, '400 mg EV/VO cada 24 h.', 'No requiere ajuste renal; no usar como tratamiento de ITU.');
    case 'Nitrofurantoína': return avoid('Evitar en pacientes en diálisis.', 'No alcanza concentraciones urinarias fiables y aumenta el riesgo de toxicidad.');
    case 'Piperacilina + tazobactam':
      if (modality === 'ihd') return replacement(label, scenario === 'intermittent-general' ? '2,25 g EV cada 12 h; después de hemodiálisis.' : '3,375 g EV cada 12 h en infusión de 4 h; alternativa 2,25 g cada 8 h.', 'Administrar después de HD; confirmar gravedad y disponibilidad de acceso EV.');
      return replacement(label, scenario === 'intermittent-general' ? '3,375 g EV cada 6 h, infusión de 30 min.' : '3,375–4,5 g EV cada 8 h, infusión extendida de 4 h.', 'Confirmar tasa de efluente y gravedad.');
    case 'Vancomicina':
      if (scenario === 'po-cdi' || scenario === 'po-cdi-fulminant') return replacement(label, antimicrobialUsualDose(name, scenario, context.weight), 'La vía oral tiene absorción sistémica pobre; no requiere ajuste renal habitual.');
      if (modality === 'ihd') {
        const loading = vancomycinLoadingDose(context.weight, true);
        return replacement(
          label,
          `${loading} Controlar nivel pre-HD antes de la siguiente sesión y redosificar después de HD según resultado.`,
          'Meta pre-HD 15–20 mg/L. La redosis no es fija: depende del nivel obtenido.',
          [
            { label: 'Dosis de carga', value: loading },
            { label: 'Control', value: 'Nivel pre-HD antes de la siguiente sesión (o con los exámenes matinales del día de HD).' },
            { label: 'Mantenimiento', value: 'Redosificar después de HD según nivel pre-HD.' },
          ],
        );
      }
      if (modality === 'crrt') return replacement(label, `${vancomycinLoadingDose(context.weight, true)} Luego 10–15 mg/kg EV cada 24 h.`, 'Carga máxima 2 g. Obtener pico 1 h después de la 2.ª/3.ª dosis y valle antes de la 3.ª/4.ª; ajustar por niveles y efluente.');
      return replacement(label, `${weightBasedDose('10-15', context.weight, 'dosis EV única')} Luego redosificar por nivel.`, 'Diálisis peritoneal: controlar nivel 24 h después de la dosis y consultar PROA/Farmacia; la dosis intraperitoneal requiere protocolo específico.');
    default: return specialist(`No existe una pauta ${label} estructurada para este antimicrobiano.`, 'Consultar ficha técnica, guía específica y Farmacia/PROA.');
  }
  return specialist(`No existe una pauta ${label} estructurada para este escenario.`, 'Consultar guía específica y Farmacia/PROA.');
}

export function antimicrobialUsualDose(name, scenario = 'general', weight) {
  switch (name) {
    case 'Aciclovir':
      if (scenario === 'iv-severe') return '10 mg/kg EV cada 8 h.';
      if (scenario === 'po-hsv') return '400 mg VO cada 8 h (alternativa: 200 mg VO 5 veces/día).';
      if (scenario === 'po-vzv') return '800 mg VO cada 4 h (5 veces/día).';
      return '5 mg/kg EV cada 8 h.';
    case 'Amikacina':
      if (scenario === 'gn-conventional') return weightBasedDose('7.5', weight, 'cada 12 h (alternativa: 5 mg/kg cada 8 h)');
      if (scenario === 'cf') return weightBasedDose('20', weight, 'cada 24 h');
      if (scenario === 'ntm-daily') return weightBasedDose('10-15', weight, 'cada 24 h');
      if (scenario === 'ntm-weekly') return weightBasedDose('10-25', weight, '3 veces por semana');
      return weightBasedDose('15', weight, 'cada 24 h');
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
    case 'Gentamicina':
      if (scenario === 'gn-urban') return weightBasedDose('5', weight, 'cada 24 h');
      if (scenario === 'gn-conventional') return weightBasedDose('1.7', weight, 'cada 8 h');
      if (scenario === 'synergy-strep') return weightBasedDose('3', weight, 'cada 24 h (alternativa: 1 mg/kg cada 8 h)');
      if (scenario === 'synergy-staph-enterococcus') return weightBasedDose('1', weight, 'cada 8 h (alternativa: 1,5 mg/kg cada 12 h)');
      return weightBasedDose('7', weight, 'cada 24 h');
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
      return `${vancomycinLoadingDose(weight)} Luego iniciar mantenimiento individualizado para AUC24 400–600 mg·h/L.`;
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

export function renalDoseRecommendation(name, renalValue, scenario = 'general', context = {}) {
  if (context.renalReplacement && context.renalReplacement !== 'none') return renalReplacementDose(name, scenario, context.renalReplacement, context);
  const crcl = Number(renalValue);
  if (!Number.isFinite(crcl) || crcl <= 0) return { status: 'Datos insuficientes', recommendation: 'Complete creatinina, edad, sexo y, de ser posible, peso.', notes: '' };
  const usualDose = antimicrobialUsualDose(name, scenario, context.weight);
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
      if (context.aki || crcl < 10) return specialist(`${vancomycinLoadingDose(context.weight, true)} Luego 15 mg/kg EV una vez y redosificar por nivel.`, 'Tomar nivel dentro de 24 h de la última dosis. Objetivo AUC24 400–600 mg·h/L; la función renal inestable queda excluida del cálculo AUC automatizado habitual.');
      return specialist(usualDose, 'La dosis de carga es concreta; el mantenimiento EV debe ajustarse con AUC24 400–600 mg·h/L. Obtener un nivel dentro de las primeras 24–48 h y repetir si cambia función renal o dosis.');
    case 'Amikacina': {
      const levelNote = 'Obtener nivel aleatorio 8–12 h después de la primera dosis y ajustar el intervalo; usar peso ajustado si obesidad. Vigilar nefro/ototoxicidad.';
      if (context.aki) return specialist(`${weightBasedDose('5', context.weight, 'dosis de carga única') } Luego redosificar según nivel.`, 'Lesión renal aguda: no usar pauta extendida; obtener pico 30 min después de la primera dosis y nivel antes de redosificar.');
      if (scenario === 'gn-conventional') {
        if (crcl > 60) return noChange(usualDose, 'Pico 30 min después de la 3.ª dosis y valle antes de la 4.ª.');
        if (crcl >= 40) return adjust(weightBasedDose('5-7.5', context.weight, 'cada 12 h'), 'Pico 30 min después de la 2.ª dosis y valle antes de la 3.ª.');
        if (crcl >= 20) return adjust(weightBasedDose('5-7.5', context.weight, 'cada 24 h'), 'Pico 30 min después de la 2.ª dosis y valle antes de la 3.ª.');
        return specialist(`${weightBasedDose('5', context.weight, 'dosis de carga única')} Luego redosificar según nivel.`, 'CrCl <20: obtener pico tras la primera dosis y nivel antes de redosificar.');
      }
      if (scenario === 'cf') {
        if (crcl >= 60) return noChange(usualDose, 'Objetivo pico 40–60 mcg/mL y valle <4 mcg/mL.');
        if (crcl >= 40) return adjust(weightBasedDose('20', context.weight, 'cada 36 h'), 'Obtener pico y valle después de la primera dosis.');
        if (crcl >= 30) return adjust(weightBasedDose('20', context.weight, 'cada 48 h'), 'Obtener pico y valle después de la primera dosis.');
        return specialist('La pauta extendida no está recomendada con CrCl <30 mL/min; usar pauta convencional individualizada por niveles.', 'Revisar dosis previamente toleradas y coordinar Farmacia/PROA.');
      }
      if (scenario === 'ntm-daily' || scenario === 'ntm-weekly') {
        if (crcl >= 60) return noChange(usualDose, 'Pico 30 min después de completar la primera dosis y valle 30–60 min antes de la segunda.');
        if (crcl >= 40) return adjust(scenario === 'ntm-weekly' ? weightBasedDose('10-25', context.weight, '3 veces por semana, con intervalo guiado por niveles') : weightBasedDose('10-15', context.weight, 'cada 24–48 h'), 'Monitorizar pico y valle; en mayores de 50 años Stanford propone 10 mg/kg y máximo 500 mg por dosis.');
        if (crcl >= 30) return adjust(scenario === 'ntm-weekly' ? weightBasedDose('10-25', context.weight, '3 veces por semana, con intervalo guiado por niveles') : weightBasedDose('10-15', context.weight, 'cada 48–72 h'), 'Monitorizar pico y valle y ajustar según tolerancia.');
        return specialist('Dosificar por nivel; no fijar un intervalo automático.', 'CrCl <30, hemodiálisis o TRRC requieren niveles y coordinación con Farmacia/Infectología.');
      }
      if (crcl >= 60) return noChange(usualDose, levelNote);
      if (crcl >= 40) return adjust(weightBasedDose('15', context.weight, 'cada 36 h'), levelNote);
      if (crcl >= 30) return adjust(weightBasedDose('15', context.weight, 'cada 48 h'), levelNote);
      return specialist('La pauta extendida no está recomendada con CrCl <30 mL/min; usar pauta convencional.', 'Pauta convencional inicial: 5–7,5 mg/kg EV cada 24 h si CrCl 20–29; con CrCl <20, carga 5 mg/kg y redosificar según nivel.');
    }
    case 'Gentamicina': {
      if (context.aki) return specialist(`${weightBasedDose('2', context.weight, 'dosis de carga única')} Luego redosificar cuando el nivel sea <1 mcg/mL.`, 'Lesión renal aguda: no usar pauta extendida; monitorizar pico y nivel previo a redosificación.');
      if (scenario === 'synergy-strep' || scenario === 'synergy-staph-enterococcus') {
        if (crcl > 60) return noChange(usualDose, 'Objetivo pico 3–4 mcg/mL y valle <1 mcg/mL.');
        if (crcl >= 40) return adjust(weightBasedDose('1', context.weight, 'cada 12 h'), 'Pico 30 min después de la 2.ª dosis y valle antes de la 3.ª.');
        if (crcl >= 20) return adjust(weightBasedDose('1', context.weight, 'cada 24 h'), 'Pico 30 min después de la primera dosis y valle antes de la segunda.');
        return specialist(`${weightBasedDose('1', context.weight, 'dosis única')} Redosificar cuando el nivel sea <1 mcg/mL.`, 'CrCl <20: controlar nivel antes de una nueva dosis.');
      }
      if (scenario === 'gn-conventional') {
        if (crcl > 60) return noChange(usualDose, 'Objetivo pico según foco 4–10 mcg/mL y valle <1–2 mcg/mL.');
        if (crcl >= 40) return adjust(weightBasedDose('1.7', context.weight, 'cada 12 h'), 'Pico 30 min después de la 2.ª dosis y valle antes de la 3.ª.');
        if (crcl >= 20) return adjust(weightBasedDose('1.7', context.weight, 'cada 24 h'), 'Pico tras la dosis inicial y valle antes de la siguiente.');
        return specialist(`${weightBasedDose('2', context.weight, 'dosis de carga única')} Luego redosificar según nivel.`, 'CrCl <20: redosificar cuando el nivel sea <1 mcg/mL.');
      }
      const dose = scenario === 'gn-urban' ? '5' : '7';
      const minimumCrcl = scenario === 'gn-urban' ? 20 : 30;
      const monitor = `Nivel aleatorio 8–12 h después de la primera dosis y ajuste con nomograma ${scenario === 'gn-urban' ? 'Urban-Craig' : 'Hartford'}; usar peso ajustado si obesidad.`;
      if (crcl >= 60) return noChange(usualDose, monitor);
      if (crcl >= 40) return adjust(weightBasedDose(dose, context.weight, 'cada 36 h'), monitor);
      if (crcl >= minimumCrcl) return adjust(weightBasedDose(dose, context.weight, 'cada 48 h'), monitor);
      return specialist('La pauta extendida no está recomendada para este CrCl; usar pauta convencional.', 'Pauta convencional inicial: 1,7 mg/kg EV cada 24 h si CrCl 20–39; con CrCl <20, carga 2 mg/kg y redosificar según nivel.');
    }
    case 'Azitromicina': return noChange(usualDose, 'No requiere ajuste renal habitual.');
    case 'Clindamicina': return noChange(usualDose, 'No requiere ajuste renal habitual.');
    case 'Doxiciclina': return noChange(usualDose, 'No requiere ajuste renal habitual.');
    case 'Linezolid': return noChange(usualDose, 'Sin ajuste renal formal; en tratamientos prolongados y falla renal vigilar trombocitopenia y metabolitos.');
    case 'Metronidazol': return noChange(usualDose, 'Con CrCl <30 y uso >1–2 semanas, vigilar acumulación de metabolitos y neurotoxicidad.');
    case 'Moxifloxacino': return noChange(usualDose, 'No requiere ajuste renal; no es adecuado para ITU por baja concentración urinaria.');
    default: return specialist('No hay una regla estructurada para este antimicrobiano.', 'Consultar ficha técnica vigente, protocolo local y Farmacia/PROA.');
  }
}
