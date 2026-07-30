/**
 * Cliente directo a Google Gemini API para interpretación de recetas.
 * Reemplaza la edge function `parse-prescription` que usaba LOVABLE_API_KEY (de pago).
 *
 * Free tier de Gemini: 15 req/min, 1M tokens/día con gemini-1.5-flash.
 * Configurar VITE_GEMINI_API_KEY en .env.local:
 *   VITE_GEMINI_API_KEY=AIza...
 * Obtener key gratis en https://aistudio.google.com/apikey
 */

interface ParsedMedication {
  name: string;
  dose: number;
  unit: string;
  frequency: string;
  duration_days: number | null;
  fractionation: string | null;
  is_insulin: boolean;
  is_weekly: boolean;
  matched_medication_id: string | null;
  matched_medication_name: string | null;
  default_schedule: string[];
  schedule_reason: string | null;
  tablets_per_dose: number | null;
  arsenal_dose_value: number | null;
  arsenal_dose_unit: string | null;
  arsenal_presentation: string | null;
  insulin_am: number | null;
  insulin_pm: number | null;
  weekly_days: Record<string, number> | null;
  specific_indication: string | null;
  doses_by_schedule: Array<{ time: string; tablets: number }> | null;
  is_sos: boolean;
  sos_reason: string | null;
}

interface MedicationFromDB {
  id: string;
  name: string;
  dose_value: number;
  dose_unit: string;
  active_ingredient: string;
  presentation: string;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SHORTHAND_ALIASES: Record<string, string> = {
  mtf: 'Metformina',
  met: 'Metformina',
  atv: 'Atorvastatina',
  atorva: 'Atorvastatina',
  hct: 'Hidroclorotiazida',
  hctz: 'Hidroclorotiazida',
  aas: 'Ácido acetilsalicílico',
  lvtx: 'Levotiroxina',
  levo: 'Levotiroxina',
  los: 'Losartan',
  amlo: 'Amlodipino',
};

const normalizeAlias = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\./g, '').trim();

/**
 * Interpreta la notación clínica chilena "medicamento 1-0[-1]".
 * Esta vía es deliberadamente determinística: evita que el modelo convierta
 * 1-0 en c/12 h o invente una dosis en mg.
 */
function parseStructuredShorthand(text: string): ParsedMedication[] | null {
  const rawLines = text.split(/\n|;/).map(line => line.trim()).filter(Boolean);
  if (rawLines.length === 0) return null;

  const parsed = rawLines.map((rawLine) => {
    const line = rawLine.replace(/^\s*\d+[\.\)\-:]\s*/, '').trim();
    const match = line.match(/^(.+?)\s+((?:\d+(?:[.,]\d+)?|[½¼¾])(?:\s*-\s*(?:\d+(?:[.,]\d+)?|[½¼¾])){1,2})\s*$/i);
    if (!match) return null;

    const rawName = match[1].trim();
    const aliasKey = normalizeAlias(rawName);
    const name = SHORTHAND_ALIASES[aliasKey] || rawName;
    const toNumber = (part: string) => {
      if (part === '½') return 0.5;
      if (part === '¼') return 0.25;
      if (part === '¾') return 0.75;
      return Number(part.replace(',', '.'));
    };
    const doses = match[2].split('-').map(part => toNumber(part.trim()));
    if (doses.some(dose => !Number.isFinite(dose) || dose < 0) || doses.every(dose => dose === 0)) return null;

    const slots = doses.length === 2 ? ['08:00', '20:00'] : ['08:00', '14:00', '20:00'];
    const dosesBySchedule = doses
      .map((tablets, index) => ({ time: slots[index], tablets }))
      .filter(item => item.tablets > 0);
    const administrations = dosesBySchedule.length;
    const frequency = administrations === 1 ? 'c/24h' : administrations === 2 ? 'c/12h' : 'c/8h';
    const indication = doses.length === 2
      ? `${doses[0]} comprimido(s) en la mañana y ${doses[1]} en la noche`
      : `${doses[0]} comprimido(s) en la mañana, ${doses[1]} al mediodía y ${doses[2]} en la noche`;

    return {
      name,
      dose: dosesBySchedule[0]?.tablets || 1,
      unit: 'comp',
      frequency,
      duration_days: null,
      fractionation: match[2].replace(/\s/g, ''),
      is_insulin: false,
      is_weekly: false,
      matched_medication_id: null,
      matched_medication_name: null,
      default_schedule: dosesBySchedule.map(item => item.time),
      schedule_reason: 'Horario indicado explícitamente por la posología escrita',
      tablets_per_dose: dosesBySchedule[0]?.tablets || 1,
      arsenal_dose_value: null,
      arsenal_dose_unit: null,
      arsenal_presentation: null,
      insulin_am: null,
      insulin_pm: null,
      weekly_days: null,
      specific_indication: indication,
      doses_by_schedule: dosesBySchedule,
      is_sos: false,
      sos_reason: null,
    } satisfies ParsedMedication;
  });

  return parsed.every((medication): medication is ParsedMedication => medication !== null)
    ? parsed
    : null;
}

const SCHEDULES_PROMPT = `
HORARIOS POR DEFECTO BASADOS EN EVIDENCIA (solo usar si no hay indicación explícita de hora/momento):
- ESTATINAS: 22:00
- LEVOTIROXINA: 07:00 en ayunas
- IBP (omeprazol, pantoprazol, etc.): 07:30 (o 30min antes de la comida indicada)
- DIURÉTICOS: 08:00
- ANTIHIPERTENSIVOS: 08:00
- METFORMINA: 08:00, 20:00
- INSULINA NPH: 08:00, 22:00
- INSULINA GLARGINA/DETEMIR: 22:00
- WARFARINA: 18:00
- CORTICOIDES: 08:00
- ISRS: 08:00
- SEDANTES: 22:00
- MONTELUKAST: 22:00

INDICACIONES ESPECÍFICAS DE HORA/MOMENTO (PRIORIDAD ABSOLUTA sobre evidencia):
- "después de almuerzo" / "post almuerzo" → 14:00
- "antes de almuerzo" / "pre almuerzo" → 13:00
- "después de desayuno" / "post desayuno" → 08:30
- "antes de desayuno" → 07:30
- "después de cena" / "post cena" → 21:30
- "antes de cena" → 20:00
- "al acostarse" / "al dormir" / "nocturno" → 22:00
- "mañana" solo → 08:00
- "noche" solo → 22:00
- Si el médico escribe un momento específico, SIEMPRE usarlo en lugar del horario por evidencia`;

function buildSystemPrompt(medsContext: string): string {
  return `Eres un asistente médico experto en interpretar prescripciones médicas en español (Chile).

REGLAS CRÍTICAS:

0. INDICACIONES ESPECÍFICAS DEL MÉDICO (PRIORIDAD MÁXIMA):
   - Si el médico especifica un momento o indicación especial (ej: "después del almuerzo"), RESPETA ESO SOBRE TODO.
   - Guarda la indicación textual en "specific_indication" para mostrarla al paciente.
   - Ejemplo: "Omeprazol 20mg después de almuerzo" → schedule: ["14:00"], specific_indication: "Tomar después del almuerzo"
   - Ejemplo: "½ comp AM y 1 comp PM" → doses_by_schedule: [{"time":"08:00","tablets":0.5},{"time":"20:00","tablets":1}]

0.5. MEDICAMENTOS SOS / A DEMANDA (CRÍTICO):
   - Si el texto contiene "SOS", "PRN", "a demanda", "si dolor", "si necesita", "rescate", "condicional" → is_sos = true
   - Genera sos_reason descriptivo según el medicamento:
     - Analgésicos → "En caso de dolor"
     - Antipiréticos → "En caso de fiebre"
     - Broncodilatadores (salbutamol) → "En caso de dificultad respiratoria"
     - Antieméticos → "En caso de náuseas o vómitos"
     - Ansiolíticos → "En caso de ansiedad"
     - Antiespasmódicos → "En caso de cólicos"
     - Laxantes → "En caso de constipación"

1. DOSIS FRACCIONADAS Y PRESENTACIONES:
   - Si la dosis prescrita es DIFERENTE a la presentación del arsenal, CALCULA cuántos comprimidos.
   - Ej: "Enalapril 5mg" + arsenal "Enalapril 10mg" → tablets_per_dose = 0.5
   - "medio comprimido" o "½ comp" → tablets_per_dose = 0.5
   - SIEMPRE incluye arsenal_dose_value, arsenal_dose_unit y arsenal_presentation cuando hay match.

2. INSULINA - SEPARACIÓN AM/PM:
   - "Insulina NPH 24-36" → insulin_am=24, insulin_pm=36. NO sumar.
   - dose es la suma total. insulin_am e insulin_pm son las dosis reales.
   - frequency = "c/12h" para insulinas con distribución AM/PM.

3. SINÓNIMOS:
   - "Insulina NPH" = "Insulina Humana NPH" = "Insulina Isófana"
   - "Losartan potásico" = "Losartan"
   - "Ácido acetilsalicílico" = "Aspirina" = "AAS"
   - "Paracetamol" = "Acetaminofén"
   - "LVTX" = "Levotiroxina", "HCT" = "Hidroclorotiazida", "MTF" = "Metformina"

4. MEDICAMENTOS NO EN ARSENAL:
   - Si no está en el arsenal, igual interprétalo con presentación frecuente.

5. MEDICAMENTOS SEMANALES:
   - "c/7d" → genera weekly_days con distribución por día.
   - Ej: "Levotiroxina 50mcg 8 comp c/7d (1-1-1-1-1-1-2)" → weekly_days: {"lun":1,"mar":1,"mie":1,"jue":1,"vie":1,"sab":1,"dom":2}

6. ABREVIACIONES:
   - "c/8h"=cada 8h, "c/12h"=cada 12h, "c/24h"=1 vez al día
   - "c/7d"=semanal, "bid"=c/12h, "tid"=c/8h
   - "U"/"UI"=unidades, "comp"=comprimido
   - En esquemas de comprimidos, "1-0" = 1 comprimido SOLO en la mañana (c/24h).
   - "0-1" = 1 comprimido SOLO en la noche (c/24h).
   - "1-1" = 1 comprimido mañana y noche (c/12h).
   - "1-0-1" = mañana y noche (c/12h); "1-1-1" = tres veces al día (c/8h).
   - Los ceros significan que NO hay toma: nunca generes un horario para una posición con 0.
   - MTF=Metformina, ATV=Atorvastatina, HCT/HCTZ=Hidroclorotiazida,
     AAS=Ácido acetilsalicílico, LVTX=Levotiroxina.

${SCHEDULES_PROMPT}
${medsContext}

Responde SOLO con JSON con la estructura:
{
  "medications": [
    {
      "name": "nombre del medicamento (sin dosis)",
      "dose": número,
      "unit": "mg/mcg/UI/etc",
      "frequency": "c/8h, c/12h, c/24h, c/7d, etc",
      "duration_days": número o null,
      "fractionation": null,
      "is_insulin": true/false,
      "is_weekly": true/false,
      "matched_medication_id": "uuid o null",
      "matched_medication_name": "nombre exacto del arsenal con dosis o null",
      "default_schedule": ["08:00"],
      "schedule_reason": "razón del horario",
      "tablets_per_dose": 1,
      "arsenal_dose_value": null,
      "arsenal_dose_unit": null,
      "arsenal_presentation": null,
      "insulin_am": null,
      "insulin_pm": null,
      "weekly_days": null,
      "specific_indication": null,
      "doses_by_schedule": null,
      "is_sos": false,
      "sos_reason": null
    }
  ]
}`;
}

export async function parsePrescriptionWithGemini(
  prescriptionText: string,
  medicationsList: MedicationFromDB[]
): Promise<{ medications: ParsedMedication[] }> {
  const shorthand = parseStructuredShorthand(prescriptionText);
  if (shorthand) return { medications: shorthand };

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const medsContext = buildMedsContext(medicationsList);
  const systemPrompt = buildSystemPrompt(medsContext);

  if (!apiKey && import.meta.env.VITE_AI_API_KEY) {
    return parsePrescriptionWithFallbackLLM(prescriptionText, systemPrompt);
  }

  if (!apiKey) {
    throw new Error(
      'AI_CONFIG_MISSING: falta configurar VITE_GEMINI_API_KEY en el entorno de la app. En local, reinicia Vite después de editar .env.'
    );
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Interpreta esta prescripción y devuelve SOLO el JSON:\n\n${prescriptionText}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini no devolvió contenido. Respuesta: ' + JSON.stringify(data).slice(0, 200));
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed.medications || !Array.isArray(parsed.medications)) {
      throw new Error('Estructura inválida — falta campo medications');
    }
    return parsed;
  } catch (e: any) {
    throw new Error(`No se pudo parsear JSON: ${e.message}. Texto recibido: ${text.slice(0, 200)}`);
  }
}

function buildMedsContext(medicationsList: MedicationFromDB[]): string {
  return medicationsList && medicationsList.length > 0
    ? `\n\nMedicamentos disponibles en el arsenal (USA estos nombres y dosis exactos cuando sea posible):\n${medicationsList
        .slice(0, 150)
        .map(
          (m) =>
            `- ID:${m.id} | ${m.name} ${m.dose_value}${m.dose_unit} | PA: ${
              m.active_ingredient || 'N/A'
            } | Presentación: ${m.presentation || 'N/A'}`
        )
        .join('\n')}`
    : '';
}

async function parsePrescriptionWithFallbackLLM(
  prescriptionText: string,
  systemPrompt: string
): Promise<{ medications: ParsedMedication[] }> {
  const { invokeLLM } = await import('@/lib/gemini');
  const parsed = await invokeLLM({
    prompt: `${systemPrompt}\n\nInterpreta esta prescripción y devuelve SOLO el JSON:\n\n${prescriptionText}`,
    response_json_schema: true,
  });

  if (!parsed?.medications || !Array.isArray(parsed.medications)) {
    throw new Error('La IA de respaldo no devolvió una estructura válida de medicamentos.');
  }

  return parsed;
}
