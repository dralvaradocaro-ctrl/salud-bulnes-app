/**
 * Evidence-based medication scheduling defaults
 * Based on pharmacokinetic properties and clinical guidelines
 */

interface MedicationScheduleInfo {
  defaultTime: string[];
  reason: string;
  modifiable: boolean;
}

// Map of medication keywords to their evidence-based default schedules
const MEDICATION_SCHEDULE_DEFAULTS: Record<string, MedicationScheduleInfo> = {
  // STATINS - Evening administration (better cholesterol synthesis inhibition at night)
  'atorvastatina': { defaultTime: ['22:00'], reason: 'Síntesis de colesterol es mayor en la noche', modifiable: true },
  'simvastatina': { defaultTime: ['22:00'], reason: 'Mayor eficacia en administración nocturna', modifiable: true },
  'lovastatina': { defaultTime: ['22:00'], reason: 'Tomar con cena para mejor absorción', modifiable: true },
  'pravastatina': { defaultTime: ['22:00'], reason: 'Mejor efecto nocturno sobre síntesis hepática', modifiable: true },
  'rosuvastatina': { defaultTime: ['22:00'], reason: 'Administración nocturna preferida', modifiable: true },
  
  // THYROID - Morning fasting (30-60 min before breakfast)
  'levotiroxina': { defaultTime: ['07:00'], reason: 'En ayunas, 30-60 min antes del desayuno', modifiable: true },
  'eutirox': { defaultTime: ['07:00'], reason: 'En ayunas para mejor absorción', modifiable: true },
  
  // PPI - Before breakfast (acid suppression throughout day)
  'omeprazol': { defaultTime: ['07:30'], reason: '30 min antes del desayuno', modifiable: true },
  'esomeprazol': { defaultTime: ['07:30'], reason: 'Antes de la primera comida', modifiable: true },
  'lansoprazol': { defaultTime: ['07:30'], reason: 'En ayunas para máxima eficacia', modifiable: true },
  'pantoprazol': { defaultTime: ['07:30'], reason: 'Antes del desayuno', modifiable: true },
  'rabeprazol': { defaultTime: ['07:30'], reason: 'Antes de la comida principal', modifiable: true },
  
  // ACE INHIBITORS/ARBs - Morning or at same time daily
  'enalapril': { defaultTime: ['08:00'], reason: 'Preferiblemente en la mañana', modifiable: true },
  'losartan': { defaultTime: ['08:00'], reason: 'Una vez al día, mismo horario', modifiable: true },
  'valsartan': { defaultTime: ['08:00'], reason: 'Mañana o consistente', modifiable: true },
  'telmisartan': { defaultTime: ['08:00'], reason: 'Preferiblemente en la mañana', modifiable: true },
  'irbesartan': { defaultTime: ['08:00'], reason: 'Mismo horario cada día', modifiable: true },
  'lisinopril': { defaultTime: ['08:00'], reason: 'Una vez al día', modifiable: true },
  'captopril': { defaultTime: ['08:00', '20:00'], reason: '1 hora antes de las comidas', modifiable: true },
  
  // DIURETICS - Morning (avoid nighttime urination)
  'furosemida': { defaultTime: ['08:00'], reason: 'Evitar administración nocturna por diuresis', modifiable: true },
  'hidroclorotiazida': { defaultTime: ['08:00'], reason: 'Mañana para evitar nicturia', modifiable: true },
  'espironolactona': { defaultTime: ['08:00'], reason: 'Con el desayuno', modifiable: true },
  'indapamida': { defaultTime: ['08:00'], reason: 'Preferiblemente en la mañana', modifiable: true },
  
  // BETA BLOCKERS - Morning or as prescribed
  'atenolol': { defaultTime: ['08:00'], reason: 'Una vez al día, mañana', modifiable: true },
  'propranolol': { defaultTime: ['08:00', '20:00'], reason: 'Espaciar uniformemente', modifiable: true },
  'carvedilol': { defaultTime: ['08:00', '20:00'], reason: 'Con alimentos', modifiable: true },
  'metoprolol': { defaultTime: ['08:00'], reason: 'Con o después de las comidas', modifiable: true },
  'bisoprolol': { defaultTime: ['08:00'], reason: 'Por la mañana', modifiable: true },
  
  // CALCIUM CHANNEL BLOCKERS
  'amlodipino': { defaultTime: ['08:00'], reason: 'Una vez al día, consistente', modifiable: true },
  'nifedipino': { defaultTime: ['08:00', '20:00'], reason: 'Espaciar uniformemente', modifiable: true },
  'verapamilo': { defaultTime: ['08:00', '20:00'], reason: 'Con alimentos', modifiable: true },
  'diltiazem': { defaultTime: ['08:00', '20:00'], reason: 'Espaciar dosis', modifiable: true },
  
  // DIABETES MEDICATIONS
  'metformina': { defaultTime: ['08:00', '20:00'], reason: 'Con las comidas principales', modifiable: true },
  'glibenclamida': { defaultTime: ['07:30'], reason: '30 min antes del desayuno', modifiable: true },
  'glimepirida': { defaultTime: ['07:30'], reason: 'Antes de la primera comida', modifiable: true },
  'glipizida': { defaultTime: ['07:30'], reason: '30 min antes de las comidas', modifiable: true },
  'sitagliptina': { defaultTime: ['08:00'], reason: 'Con o sin alimentos', modifiable: true },
  'linagliptina': { defaultTime: ['08:00'], reason: 'Una vez al día', modifiable: true },
  
  // INSULIN - Special handling (morning/evening split)
  'insulina nph': { defaultTime: ['08:00', '22:00'], reason: 'Dividir dosis mañana/noche según indicación', modifiable: true },
  'insulina cristalina': { defaultTime: ['08:00', '14:00', '20:00'], reason: 'Antes de las comidas', modifiable: true },
  'insulina glargina': { defaultTime: ['22:00'], reason: 'A la misma hora cada día', modifiable: true },
  'insulina detemir': { defaultTime: ['22:00'], reason: 'Una o dos veces al día', modifiable: true },
  'insulina lispro': { defaultTime: ['08:00', '14:00', '20:00'], reason: 'Inmediatamente antes de las comidas', modifiable: true },
  
  // ANTICOAGULANTS
  'warfarina': { defaultTime: ['18:00'], reason: 'A la misma hora, típicamente en la tarde', modifiable: true },
  'acenocumarol': { defaultTime: ['18:00'], reason: 'Por la tarde, misma hora', modifiable: true },
  'rivaroxaban': { defaultTime: ['20:00'], reason: 'Con la cena (mayor absorción)', modifiable: true },
  'apixaban': { defaultTime: ['08:00', '20:00'], reason: 'Cada 12 horas', modifiable: true },
  'dabigatran': { defaultTime: ['08:00', '20:00'], reason: 'Cada 12 horas con alimentos', modifiable: true },
  
  // ANTIPLATELETS
  'aspirina': { defaultTime: ['08:00'], reason: 'Con alimentos para protección gástrica', modifiable: true },
  'clopidogrel': { defaultTime: ['08:00'], reason: 'Una vez al día, consistente', modifiable: true },
  'ticagrelor': { defaultTime: ['08:00', '20:00'], reason: 'Cada 12 horas', modifiable: true },
  
  // ANTIDEPRESSANTS/ANXIOLYTICS
  'sertralina': { defaultTime: ['08:00'], reason: 'Mañana para evitar insomnio', modifiable: true },
  'escitalopram': { defaultTime: ['08:00'], reason: 'Preferiblemente en la mañana', modifiable: true },
  'fluoxetina': { defaultTime: ['08:00'], reason: 'Por la mañana (estimulante)', modifiable: true },
  'paroxetina': { defaultTime: ['08:00'], reason: 'Por la mañana con alimentos', modifiable: true },
  'amitriptilina': { defaultTime: ['22:00'], reason: 'En la noche (sedante)', modifiable: true },
  'trazodona': { defaultTime: ['22:00'], reason: 'Antes de dormir', modifiable: true },
  'mirtazapina': { defaultTime: ['22:00'], reason: 'En la noche por efecto sedante', modifiable: true },
  'clonazepam': { defaultTime: ['22:00'], reason: 'En la noche', modifiable: true },
  'alprazolam': { defaultTime: ['22:00'], reason: 'Preferiblemente noche', modifiable: true },
  'lorazepam': { defaultTime: ['22:00'], reason: 'En la noche', modifiable: true },
  
  // SLEEP AIDS
  'zolpidem': { defaultTime: ['22:00'], reason: 'Inmediatamente antes de acostarse', modifiable: true },
  'zopiclona': { defaultTime: ['22:00'], reason: 'Antes de dormir', modifiable: true },
  
  // PAIN/ANTI-INFLAMMATORY
  'paracetamol': { defaultTime: ['08:00', '14:00', '20:00'], reason: 'Según necesidad, espaciar 6-8h', modifiable: true },
  'ibuprofeno': { defaultTime: ['08:00', '14:00', '20:00'], reason: 'Con alimentos', modifiable: true },
  'naproxeno': { defaultTime: ['08:00', '20:00'], reason: 'Con alimentos', modifiable: true },
  'diclofenaco': { defaultTime: ['08:00', '20:00'], reason: 'Con alimentos', modifiable: true },
  'tramadol': { defaultTime: ['08:00', '14:00', '20:00'], reason: 'Espaciar uniformemente', modifiable: true },
  
  // CORTICOSTEROIDS - Morning (mimics natural cortisol)
  'prednisona': { defaultTime: ['08:00'], reason: 'Mañana, imita ciclo natural de cortisol', modifiable: true },
  'prednisolona': { defaultTime: ['08:00'], reason: 'Por la mañana con alimentos', modifiable: true },
  'hidrocortisona': { defaultTime: ['08:00'], reason: 'Mañana, imita ritmo circadiano', modifiable: true },
  'dexametasona': { defaultTime: ['08:00'], reason: 'Por la mañana', modifiable: true },
  'betametasona': { defaultTime: ['08:00'], reason: 'Por la mañana', modifiable: true },
  
  // ASTHMA/RESPIRATORY
  'salbutamol': { defaultTime: ['08:00', '14:00', '20:00'], reason: 'Según necesidad o preventivo', modifiable: true },
  'fluticasona': { defaultTime: ['08:00', '20:00'], reason: 'Mañana y noche', modifiable: true },
  'budesonida': { defaultTime: ['08:00', '20:00'], reason: 'Mañana y noche', modifiable: true },
  'montelukast': { defaultTime: ['22:00'], reason: 'En la noche', modifiable: true },
  'tiotropio': { defaultTime: ['08:00'], reason: 'Una vez al día, mañana', modifiable: true },
  
  // OSTEOPOROSIS
  'alendronato': { defaultTime: ['07:00'], reason: 'En ayunas, 30 min antes de alimentos', modifiable: true },
  'risedronato': { defaultTime: ['07:00'], reason: 'En ayunas con agua', modifiable: true },
  'ibandronato': { defaultTime: ['07:00'], reason: 'En ayunas, 60 min antes', modifiable: true },
  
  // GOUT
  'alopurinol': { defaultTime: ['08:00'], reason: 'Con alimentos', modifiable: true },
  'colchicina': { defaultTime: ['08:00', '20:00'], reason: 'Con alimentos', modifiable: true },
  
  // IRON SUPPLEMENTS - Between meals for better absorption
  'sulfato ferroso': { defaultTime: ['10:00'], reason: 'Entre comidas para mejor absorción', modifiable: true },
  'hierro': { defaultTime: ['10:00'], reason: '2h después del desayuno', modifiable: true },
  
  // CALCIUM - With meals, not with other meds
  'calcio': { defaultTime: ['20:00'], reason: 'Con cena, separar de otros medicamentos', modifiable: true },
  'carbonato de calcio': { defaultTime: ['20:00'], reason: 'Con alimentos para absorción', modifiable: true },
};

/**
 * Get evidence-based default schedule for a medication
 */
export function getDefaultSchedule(medicationName: string, frequency: string): {
  schedule: string[];
  reason: string | null;
} {
  const nameLower = medicationName.toLowerCase();
  
  // Search for matching medication keyword
  for (const [keyword, info] of Object.entries(MEDICATION_SCHEDULE_DEFAULTS)) {
    if (nameLower.includes(keyword)) {
      // Adjust based on frequency
      if (frequency === 'c/24h' || frequency === 'c/7d') {
        return { schedule: [info.defaultTime[0]], reason: info.reason };
      } else if (frequency === 'c/12h') {
        // Use first two times or duplicate
        const times = info.defaultTime.length >= 2 
          ? info.defaultTime.slice(0, 2)
          : ['08:00', '20:00'];
        return { schedule: times, reason: info.reason };
      } else if (frequency === 'c/8h') {
        const times = info.defaultTime.length >= 3 
          ? info.defaultTime.slice(0, 3)
          : ['08:00', '14:00', '22:00'];
        return { schedule: times, reason: info.reason };
      }
      return { schedule: info.defaultTime, reason: info.reason };
    }
  }
  
  // Default schedule based only on frequency
  switch (frequency) {
    case 'c/8h':
      return { schedule: ['08:00', '16:00', '24:00'], reason: null };
    case 'c/12h':
      return { schedule: ['08:00', '20:00'], reason: null };
    case 'c/24h':
    case 'c/7d':
      return { schedule: ['08:00'], reason: null };
    case 'c/48h':
      return { schedule: ['08:00'], reason: null };
    default:
      return { schedule: ['08:00'], reason: null };
  }
}

/**
 * Get schedule info for a medication (for display purposes)
 */
export function getMedicationScheduleInfo(medicationName: string): MedicationScheduleInfo | null {
  const nameLower = medicationName.toLowerCase();
  
  for (const [keyword, info] of Object.entries(MEDICATION_SCHEDULE_DEFAULTS)) {
    if (nameLower.includes(keyword)) {
      return info;
    }
  }
  
  return null;
}
