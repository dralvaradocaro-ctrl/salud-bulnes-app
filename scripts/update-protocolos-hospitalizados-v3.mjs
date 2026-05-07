/**
 * v3 — Enriquece 11 protocolos de Hospitalizados con contenido completo extraído de PDFs reales.
 * Incluye escalas, dosis detalladas, tablas de fármacos y algoritmos Mermaid.
 *
 * Uso:  node scripts/update-protocolos-hospitalizados-v3.mjs
 *       node scripts/update-protocolos-hospitalizados-v3.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. AGITACIÓN PSICOMOTORA — HCSFB 159
// ─────────────────────────────────────────────────────────────────────────────
const AGITACION = {
  id: '13e6128f-882a-4a19-8e18-47cbf13203eb',
  authors: [
    { name: 'Dr. Rodrigo Enríquez Heredia',  role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
    { name: 'Dra. Daniella Sbarbaro Arias',  role: 'Elaboradora — Médico PROSAM HCSFB' },
    { name: 'Dra. Micaela Fasani Montagna',  role: 'Revisora — Subdirectora Médica HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'agit-v3-bars',
      type: 'flowchart',
      color: 'blue',
      order: 1,
      title: 'Escala BARS — Evaluación Inicial de Agitación',
      content: 'Behaviour Activity Rating Scale — clasifica el nivel de agitación para guiar la respuesta escalonada',
      details: [
        'BARS 1: No se puede despertar — riesgo de sedación excesiva',
        'BARS 2: Dormido, responde a estímulos verbales o físicos',
        'BARS 3: Somnoliento, mínima actividad, cierra ojos espontáneamente',
        'BARS 4: Tranquilo y cooperador (NORMAL — objetivo del tratamiento)',
        'BARS 5: Agitación leve — se calma con instrucciones verbales',
        'BARS 6: Muy activo, no requiere contención física pero no sigue instrucciones',
        'BARS 7: Violento — requiere restricción inmediata (riesgo para sí mismo o terceros)',
        '→ Evaluar BARS antes de cada escalón farmacológico',
      ],
      layout_position: 'main',
    },
    {
      id: 'agit-v3-escalon1',
      type: 'criteria',
      color: 'green',
      order: 2,
      title: 'Escalón 1 — Intervención No Farmacológica (BARS 5)',
      content: 'Manejo ambiental y verbal como primera línea — siempre intentar antes de farmacología',
      items: [
        'Espacio seguro: alejar al paciente de otros, reducir estímulos ambientales',
        'Hablar con voz calmada y clara — identificarse, explicar lo que se va a hacer',
        'Mantener distancia de seguridad de al menos 1 metro',
        'No confrontar ni debatir con el paciente durante la agitación',
        'Ofrecer objetos de confort (agua, manta, posición cómoda)',
        'Si hay causa identificable (dolor, vejiga llena, hipoglicemia) — corregir primero',
        'Evaluar BARS a los 15 minutos → si persiste BARS ≥5, iniciar Escalón 2',
      ],
      layout_position: 'main',
    },
    {
      id: 'agit-v3-escalon-adultos',
      type: 'flowchart',
      color: 'amber',
      order: 3,
      title: 'Escalones 2–4 — Tratamiento Farmacológico Adultos',
      content: 'Protocolo escalonado según nivel BARS y respuesta previa — esperar resultado entre escalones antes de avanzar',
      details: [
        '═══ ESCALÓN 2 — BARS 5–6 · ORAL/SUBLINGUAL ═══',
        'Sin psicosis: Lorazepam 1–2 mg SL/oral (esperar 15 min)',
        'Con psicosis o claro: Haloperidol 1–5 mg oral O Risperidona 1–3 mg oral O Olanzapina 10 mg oral/SL',
        '',
        '═══ ESCALÓN 3 — BARS 6–7 refractario · INTRAMUSCULAR ═══',
        'Sin psicosis: Lorazepam 2 mg IM/IV + Midazolam 5 mg IM/IV (esperar 20–30 min)',
        'Con psicosis: Haloperidol 5 mg IM O Olanzapina 10 mg IM O Droperidol 2.5–10 mg IM',
        '⚠️ NO combinar Olanzapina IM + BZD IM (riesgo depresión respiratoria)',
        '',
        '═══ ESCALÓN 4 — BARS 7 severo/refractario · INTRAVENOSO ═══',
        'Opción A: Lorazepam 4 mg IV + Haloperidol 5 mg IV',
        'Opción B: Midazolam 10–15 mg EV + Haloperidol 5 mg EV',
        'Opción C: Droperidol 5 mg EV',
        'Opción D (UCI): Dexmedetomidina 1 mcg/kg bolus en 10 min → infusión 0.5–1.2 mcg/kg/hr',
        '',
        '═══ DESESCALADA ═══',
        'Una vez BARS 4 (paciente tranquilo): retorno progresivo a vía oral según tolerancia',
        'Monitorizar BARS cada 30 min hasta estabilización',
      ],
      layout_position: 'main',
    },
    {
      id: 'agit-v3-pediatrico',
      type: 'criteria',
      color: 'purple',
      order: 4,
      title: 'Tratamiento Farmacológico Pediátrico (< 18 años)',
      content: 'Dosis basadas en peso para manejo de agitación en pacientes pediátricos — siempre priorizar manejo verbal y contención parental',
      items: [
        '━━━ ESCALÓN 2 — ORAL ━━━',
        'Lorazepam: 0.05–0.1 mg/kg oral (máx 2 mg/dosis)',
        'Risperidona: 0.25–2 mg oral según edad y peso',
        'Haloperidol: 0.05–0.15 mg/kg oral',
        'Midazolam: 0.25–0.5 mg/kg oral (máx 20 mg)',
        '',
        '━━━ ESCALÓN 3 — INTRAMUSCULAR ━━━',
        'Lorazepam: 0.05–0.1 mg/kg IM (> 12 años: máx 10 mg/día)',
        'Midazolam: 0.1–0.15 mg/kg IM (máx 10 mg)',
        'Haloperidol: 0.05–0.15 mg/kg IM',
        '',
        '⚠️ Monitorizar saturación, FC y FR durante todo el procedimiento',
        '⚠️ Tener BVM disponible si se usa BZD IM + antipsicótico',
      ],
      layout_position: 'main',
    },
    {
      id: 'agit-v3-mermaid',
      type: 'mermaid',
      order: 5,
      title: 'Algoritmo HCSFB 159 — Manejo Escalonado de Agitación Psicomotora',
      content: `flowchart TD
    A([Paciente agitado\\nEvaluar BARS]) --> B{BARS}
    B -->|BARS 5| C[Escalón 1: No farmacológico\\nespacio seguro · voz calmada · 1m]
    C --> C2{¿Mejora\\nen 15 min?}
    C2 -->|Sí BARS 4| Z([BARS 4 — Objetivo\\nmonitorizar c/30 min])
    C2 -->|No| D
    B -->|BARS 6| D[Escalón 2 — Oral/SL\\n¿psicosis?]
    D -->|Sin psicosis| E[Lorazepam 1–2 mg SL/oral]
    D -->|Con psicosis| F[Haloperidol 1–5 mg oral\\no Risperidona 1–3 mg\\no Olanzapina 10 mg SL]
    E --> G{¿BARS 4\\nen 15 min?}
    F --> G
    G -->|Sí| Z
    G -->|No| H[Escalón 3 — IM\\n¿psicosis?]
    H -->|Sin psicosis| I[Lorazepam 2 mg IM\\n+ Midazolam 5 mg IM]
    H -->|Con psicosis| J[Haloperidol 5 mg IM\\no Olanzapina 10 mg IM\\no Droperidol 2.5–10 mg IM]
    I --> K{¿BARS 4\\nen 20–30 min?}
    J --> K
    K -->|Sí| Z
    K -->|No BARS 7| L[Escalón 4 — IV]
    L --> M[Lorazepam 4 mg IV + Haloperidol 5 mg IV\\no Midazolam 10–15 mg EV + Haloperidol\\no Dexmedetomidina si UCI disponible]
    M --> N{¿Responde?}
    N -->|Sí| Z
    N -->|No| O([🏥 Traslado HCHM\\nUCI/monitoreo continuo])`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. HIPNÓTICOS — HCSFB 129
// ─────────────────────────────────────────────────────────────────────────────
const HIPNOTICOS = {
  id: 'eb702967-32fa-4aef-8246-742195d078e8',
  authors: [
    { name: 'Dra. Estefanía Acuña Brevis',    role: 'Elaboradora — Médico HCSFB' },
    { name: 'Dr. Sebastián Bustos Sepúlveda', role: 'Elaborador — Médico HCSFB' },
    { name: 'Dr. Roberto Aguilera Jaque',      role: 'Elaborador — Médico HCSFB' },
    { name: 'Dr. Felipe Sancho Tapia',         role: 'Revisor — Subdirector Médico HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',          role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'hipn-v3-diagnostico',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Criterios Diagnósticos — Insomnio (ICSD-2)',
      content: 'El diagnóstico de insomnio requiere cumplir TODOS los criterios para indicar hipnóticos',
      items: [
        '✅ Frecuencia: ≥ 3 noches por semana',
        '✅ Duración: ≥ 1 mes de persistencia',
        '✅ Síntomas diurnos asociados (al menos uno):',
        '   • Fatiga o malestar general',
        '   • Déficit de atención, concentración o memoria',
        '   • Disfunción social, laboral o académica',
        '   • Irritabilidad o alteraciones del ánimo',
        '   • Somnolencia diurna excesiva',
        '⚠️ Descartar PRIMERO: dolor no controlado, apnea del sueño, síndrome piernas inquietas, depresión, ansiedad, uso de sustancias',
        '📋 Escala de Epworth: somnolencia diurna — 0-9 normal · 10-12 leve · 13-16 moderado · >16 severo',
      ],
      layout_position: 'main',
    },
    {
      id: 'hipn-v3-nofarm',
      type: 'flowchart',
      color: 'green',
      order: 2,
      title: 'Tratamiento No Farmacológico — Higiene del Sueño (Primera Línea)',
      content: 'Las medidas no farmacológicas son la primera línea de tratamiento — iniciar siempre antes o junto a la farmacología',
      details: [
        '1. Horario fijo de acostarse y levantarse (incluso fines de semana)',
        '2. No quedarse en cama si no hay sueño — levantarse hasta tener sueño',
        '3. La cama solo para dormir y sexo — no TV, teléfono ni trabajo',
        '4. Evitar siestas (o limitarlas a < 30 min antes de las 15h)',
        '5. Evitar cafeína después de las 14h (café, té, bebidas energéticas)',
        '6. Evitar alcohol — fragmenta el sueño en segunda mitad de la noche',
        '7. Ejercicio regular pero NO en las 3–4 horas previas al sueño',
        '8. Cena liviana: ni hambre ni comida muy copiosa al acostarse',
        '9. Ambiente oscuro, silencioso y fresco (18–22°C)',
        '10. Baño tibio 1–2h antes de acostarse (baja la temperatura corporal)',
        '11. Rutina relajante pre-sueño (lectura, meditación, respiración)',
        '12. Limitar líquidos 2h antes para evitar nicturia',
        '13. Pantallas: apagar 30–60 min antes (luz azul inhibe melatonina)',
      ],
      layout_position: 'main',
    },
    {
      id: 'hipn-v3-zdrugs',
      type: 'flowchart',
      color: 'amber',
      order: 3,
      title: 'Fármacos Z-drugs — Primera Línea Farmacológica',
      content: 'Hipnóticos no benzodiacepínicos — preferir sobre BZD por menor dependencia y mejor perfil de seguridad',
      details: [
        '┌─────────────────┬──────────────┬──────────────┬──────────────────────┐',
        '│ Fármaco         │ Dosis (mg)   │ Vida ½ (h)   │ Indicación preferida │',
        '├─────────────────┼──────────────┼──────────────┼──────────────────────┤',
        '│ Zolpidem        │ 5–10         │ 2.5          │ Inicio de sueño      │',
        '│ Zolpidem ER     │ 6.25–12.5    │ 2.8          │ Inicio + mantención  │',
        '│ Eszopiclona     │ 1–3          │ 6            │ Mantención de sueño  │',
        '│ Zopiclona       │ 3.75–7.5     │ 3.5–6        │ Inicio + mantención  │',
        '└─────────────────┴──────────────┴──────────────┴──────────────────────┘',
        '⚠️ Adultos mayores: usar dosis mínima (Zolpidem 5 mg / Zopiclona 3.75 mg)',
        '⚠️ Duración máxima: 3 meses en AM, 6 meses en adultos — luego reevaluar',
      ],
      layout_position: 'main',
    },
    {
      id: 'hipn-v3-otros',
      type: 'flowchart',
      color: 'purple',
      order: 4,
      title: 'Otros Hipnóticos — Según Causa Subyacente',
      content: 'Opciones cuando hay comorbilidades específicas o contraindicación a Z-drugs',
      details: [
        '═══ ANTIDEPRESIVOS (si insomnio asociado a depresión, ansiedad o dolor) ═══',
        'Amitriptilina: 50–100 mg/noche (analgésica, sedante)',
        'Trazodona: 25–150 mg/noche (primera línea en depresión + insomnio)',
        'Mirtazapina: 7.5–30 mg/noche (útil en paciente con anorexia o pérdida de peso)',
        '',
        '═══ ANTICONVULSIVANTES (si insomnio + fibromialgia o dolor neuropático) ═══',
        'Pregabalina: 75–300 mg/noche',
        'Gabapentina: 300–900 mg/noche',
        '',
        '═══ MELATONINA (si alteración ritmo circadiano: turnos, jet lag, > 55 años) ═══',
        'Melatonina: 1–3 mg, 30–60 min antes de dormir',
        '',
        '═══ ANTIPSICÓTICOS ATÍPICOS (si insomnio en contexto psiquiátrico) ═══',
        'Quetiapina: 25–250 mg/noche',
        'Olanzapina: 2.5–20 mg/noche',
        '',
        '═══ BENZODIACEPINAS (EVITAR en adultos mayores — riesgo caídas/dependencia) ═══',
        'Midazolam: 7.5–15 mg/noche — Vida ½: 2.2–6.8h — solo adultos jóvenes, plazo corto',
        '',
        '═══ ANTIHISTAMÍNICO (uso ocasional, baja evidencia) ═══',
        'Clorfenamina: 2–4 mg/noche',
      ],
      layout_position: 'main',
    },
    {
      id: 'hipn-v3-seguimiento',
      type: 'criteria',
      color: 'blue',
      order: 5,
      title: 'Plan de Seguimiento y Controles',
      content: 'Cronograma de controles para evaluación de eficacia y seguridad del tratamiento hipnótico',
      items: [
        '⏱ Control a las 6 semanas: evaluación de efectos adversos (sedación diurna, caídas, dependencia)',
        '⏱ Control a las 8–12 semanas: reaplicar Escala de Epworth — evaluar eficacia',
        '📋 Duración recomendada del tratamiento:',
        '   • Adultos mayores (≥ 65 años): máximo 3 meses',
        '   • Adultos jóvenes: máximo 6 meses',
        '   • Después: retirada gradual (reducir 25% cada 1–2 semanas)',
        '⚠️ Signos de alarma para suspender: caídas nocturnas, somnolencia diurna severa, amnesia, dependencia',
        '📌 Derivar a psiquiatría: insomnio crónico (> 6 meses) refractario, comorbilidad psiquiátrica mayor',
      ],
      layout_position: 'main',
    },
    {
      id: 'hipn-v3-mermaid',
      type: 'mermaid',
      order: 6,
      title: 'Algoritmo HCSFB 129 — Uso Adecuado de Hipnóticos',
      content: `flowchart TD
    A([Paciente con queja\\nde insomnio]) --> B[Evaluación diagnóstica\\ncriterios ICSD-2 + Epworth]
    B --> C{¿Cumple criterios\\nICSD-2?}
    C -->|No| D([Orientar — no es insomnio\\no causa subyacente])
    C -->|Sí| E[Iniciar higiene del sueño\\n+ TCC si disponible]
    E --> F{¿Respuesta en\\n4–6 semanas?}
    F -->|Sí| G([Mantener higiene\\nreevaluar en 3 meses])
    F -->|No| H{¿Adulto mayor\\n≥ 65 años?}
    H -->|Sí| I[Z-drug dosis mínima:\\nZolpidem 5 mg o Zopiclona 3.75 mg\\nmáx 3 meses]
    H -->|No| J{¿Causa subyacente?}
    J -->|Depresión/ansiedad| K[Antidepresivo sedante:\\nTrazodona 25–150 mg o Mirtazapina 7.5–30 mg]
    J -->|Dolor/fibromialgia| L[Pregabalina 75–300 mg\\no Gabapentina 300–900 mg]
    J -->|Ritmo circadiano| M[Melatonina 1–3 mg]
    J -->|Sin causa identificada| N[Z-drug:\\nZolpidem 5–10 mg o Zopiclona 3.75–7.5 mg]
    I --> O[Control 6 semanas\\n+ Epworth 8–12 semanas]
    K --> O
    L --> O
    M --> O
    N --> O
    O --> P{¿Eficaz\\ny seguro?}
    P -->|Sí| Q[Mantener — evaluar\\nretiro gradual a los 3–6 meses]
    P -->|No| R([Derivar Psiquiatría\\nTCC especializada])`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. ERROR DE MEDICACIÓN — GCL 2.2.1
// ─────────────────────────────────────────────────────────────────────────────
const ERROR_MEDICACION = {
  id: '23e96a67-0f39-4bfe-91e0-88d63d04c3ae',
  authors: [
    { name: 'EU. María Teresa Medina Bravo', role: 'Elaboradora — Enfermería HCSFB' },
    { name: 'EU. Nelson Valdés Anabálon',    role: 'Elaborador — Enfermería HCSFB' },
    { name: 'EU. Mauricio Contreras Parra',  role: 'Revisor — Enfermería HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'errmed-v3-5correctos',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Los 5 Correctos — Verificación antes de Cada Administración',
      content: 'Verificar los 5 correctos antes de administrar CUALQUIER medicamento — sin excepción',
      items: [
        '✅ 1. MEDICAMENTO correcto — confirmar nombre genérico y comercial',
        '✅ 2. PACIENTE correcto — verificar nombre completo + RUT en brazalete',
        '✅ 3. DOSIS correcta — confirmar dosis en indicación médica vs. etiqueta',
        '✅ 4. VÍA correcta — oral, IM, IV, SC, SL — según indicación',
        '✅ 5. HORA correcta — tolerancia de ±60 minutos respecto a la hora indicada',
        '',
        '⚠️ MEDICAMENTOS DE ALTO RIESGO — doble verificación obligatoria:',
        '• Insulina · Heparina · Warfarina · Digoxina · KCl · Opioides · Quimioterapia',
        '• Siempre verificar con segundo profesional antes de administrar',
      ],
      layout_position: 'main',
    },
    {
      id: 'errmed-v3-flujo',
      type: 'flowchart',
      color: 'amber',
      order: 2,
      title: 'Flujo Prescripción → Farmacia → Administración',
      content: 'Cadena de seguridad del medicamento en HCSFB — cada eslabón es un punto de verificación',
      details: [
        '1. MÉDICO: prescribe en Recetón (HIS) o en forma manual — letra legible, dosis clara',
        '2. ENFERMERA: transcribe a hoja de enfermería — verifica 5 correctos',
        '3. FARMACIA: dispensa según recetón — revisa compatibilidad e interacciones',
        '4. TÉCNICO/ENFERMERA: prepara en sala limpia — etiqueta con nombre, dosis, hora',
        '5. ENFERMERA: administra verificando los 5 correctos en cabecera del paciente',
        '6. REGISTRO inmediato en hoja de enfermería:',
        '   ✓ = Medicamento administrado',
        '   O = No administrado (obligatorio registrar causa)',
        '   $ = Medicamento suspendido (obligatorio registrar causa)',
        '',
        'RECETONES — Vigencia según día de emisión:',
        '• Lunes: recetón válido por 3 días (hasta miércoles)',
        '• Jueves: recetón válido por 4 días (hasta domingo)',
        '• Sociosanitarios (miércoles): recetón válido semana completa',
        '',
        'FARMACIA CERRADA (nocturno/fines de semana): usar receta autocopiativa desde Urgencias',
      ],
      layout_position: 'main',
    },
    {
      id: 'errmed-v3-notificacion',
      type: 'criteria',
      color: 'red',
      order: 3,
      title: 'Procedimiento ante Error de Medicación',
      content: 'Protocolo obligatorio cuando se detecta o comete un error de medicación — no omitir ningún paso',
      items: [
        '🚨 INMEDIATO (primeros minutos):',
        '• Atender al paciente — evaluar signos vitales y estado clínico',
        '• Avisar al médico tratante o de turno',
        '• Administrar tratamiento si existe antídoto o acción correctiva',
        '',
        '📋 DOCUMENTACIÓN (en las primeras 2 horas):',
        '• Registrar en hoja de enfermería: qué ocurrió, cuándo, cómo',
        '• Completar Formulario OfiCySP (Oficina de Calidad y Seguridad del Paciente)',
        '• No alterar registros previos ni borrar anotaciones',
        '',
        '🔎 ANÁLISIS (dentro de 72 horas):',
        '• Revisión por jefatura de servicio',
        '• Identificación de causa raíz (¿prescripción? ¿dispensación? ¿administración?)',
        '• Medidas correctivas inmediatas y preventivas',
        '',
        '⚠️ El objetivo es el análisis sistémico — NO la sanción individual',
      ],
      layout_position: 'main',
    },
    {
      id: 'errmed-v3-mermaid',
      type: 'mermaid',
      order: 4,
      title: 'Algoritmo GCL 2.2.1 — Manejo de Error de Medicación',
      content: `flowchart TD
    A([Se detecta error\\nde medicación]) --> B{¿Daño\\nal paciente?}
    B -->|Sí o posible| C[Atender al paciente\\nEvaluar signos vitales]
    B -->|No — error no llegó al paciente| D[Registrar como near miss]
    C --> E[Avisar al médico tratante\\no médico de turno]
    E --> F{¿Requiere\\nintervención?}
    F -->|Sí| G[Tratar: antídoto / soporte\\n/ monitorización]
    F -->|No| H
    G --> H[Documentar en hoja\\nde enfermería]
    D --> H
    H --> I[Completar formulario\\nOfiCySP / notificación]
    I --> J[Jefatura: análisis\\ncausa raíz en 72h]
    J --> K([Medidas correctivas\\ny preventivas])`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONTENCIÓN FÍSICA — GCL 1.9
// ─────────────────────────────────────────────────────────────────────────────
const CONTENCION_FISICA = {
  id: '9e0b3406-9055-43a4-8a75-bf6d290bceb4',
  authors: [
    { name: 'EU. Nelson Valdés Anabálon',   role: 'Elaborador — Enfermería HCSFB' },
    { name: 'EU. Mauricio Contreras Parra', role: 'Revisor — Enfermería HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',       role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'conten-v3-indicaciones',
      type: 'criteria',
      color: 'amber',
      order: 1,
      title: 'Indicaciones y Contraindicaciones de Contención Física',
      content: 'La contención física es una medida de último recurso — solo cuando el riesgo es inminente y la farmacología no fue suficiente',
      items: [
        '✅ INDICACIONES (requiere indicación médica):',
        '• Conducta violenta con riesgo inmediato para sí mismo o para terceros',
        '• Agitación no controlable con tratamiento farmacológico máximo',
        '• Riesgo de retiro de dispositivos vitales (TET, CVC, sonda nasoyeyunal)',
        '• Contención temporal para administrar medicamento urgente necesario',
        '• Antecedente de pérdida de equilibrio o caídas con riesgo de daño',
        '',
        '🚫 CONTRAINDICACIONES ABSOLUTAS:',
        '• Como castigo o medida disciplinaria',
        '• Como respuesta a conducta simplemente molesta para el equipo',
        '• Como sustitución de vigilancia o tratamiento en curso',
        '• Por conveniencia del equipo clínico',
        '• Cuando existe rechazo explícito de tratamiento (evaluar capacidad)',
      ],
      layout_position: 'main',
    },
    {
      id: 'conten-v3-tecnica',
      type: 'flowchart',
      color: 'blue',
      order: 2,
      title: 'Técnica de Contención Física — Procedimiento',
      content: 'Requiere mínimo 5 personas (1 enfermera coordinadora + 4 técnicos) — comunicación constante durante el procedimiento',
      details: [
        '1. INDICACIÓN MÉDICA: médico de turno indica por escrito — causa y duración estimada',
        '2. EQUIPO: 5 personas mínimo (1 enfermera + 4 técnicos; preferiblemente varones)',
        '3. POSICIÓN: decúbito supino — elevar cabeza 30° para prevenir aspiración',
        '4. TIPO DE CONTENCIÓN:',
        '   • COMPLETA: banda abdominal + 4 extremidades en diagonal (cruzadas)',
        '   • PARCIAL: banda de tronco + 2 extremidades según necesidad',
        '5. MATERIAL: sujeciones de género (sábanas en desuso) — NUNCA esposas o elementos duros',
        '6. TENSIÓN: sujeción firme pero que permita insertar 2 dedos bajo la banda',
        '7. REGISTRAR: hora de inicio, tipo de contención, nombre del médico indicador',
      ],
      layout_position: 'main',
    },
    {
      id: 'conten-v3-monitoreo',
      type: 'criteria',
      color: 'green',
      order: 3,
      title: 'Monitoreo Durante la Contención (cada 4 horas)',
      content: 'Control obligatorio cada 4 horas mientras el paciente permanece con contención física — registrar en hoja de enfermería',
      items: [
        '🌡 Temperatura: evaluar hipertermia por agitación o infección',
        '🩺 Color de la piel bajo las sujeciones: palidez o cianosis indica compresión vascular',
        '✋ Sensibilidad: paresia o parestesias bajo bandas → aflojar inmediatamente',
        '💓 Pulso distal: verificar perfusión en extremidades contenidas',
        '👀 Estado de conciencia: nivel de alerta, respuesta a estímulos',
        '',
        '⚠️ COMPLICACIONES A VIGILAR:',
        '• TEP / TVP: movilizar extremidades libres pasivamente si es posible',
        '• LPP: cambiar posición dentro de lo permitido por la contención',
        '• Lesiones traumáticas por forcejeo',
        '• Hematomas en sitios de sujeción',
        '',
        '📋 Reevaluar necesidad de contención cada 4 horas — retirar tan pronto sea seguro',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. CAÍDAS — GCL 2.2.2
// ─────────────────────────────────────────────────────────────────────────────
const CAIDAS = {
  id: 'c97b6632-904c-4e9c-ba80-defb5b1199d9',
  authors: [
    { name: 'EU. María Teresa Medina Bravo', role: 'Elaboradora — Enfermería HCSFB' },
    { name: 'EU. Mauricio Contreras Parra',  role: 'Revisor — Enfermería HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'caidas-v3-dowton',
      type: 'flowchart',
      color: 'amber',
      order: 1,
      title: 'Escala de Dowton — Evaluación de Riesgo de Caída',
      content: 'Aplicar al ingreso y reevaluar diariamente — puntaje ≥ 3 = ALTO RIESGO',
      details: [
        '┌───────────────────────────────────────────────────────────┬───────┐',
        '│ Factor de Riesgo                                          │ Puntos│',
        '├───────────────────────────────────────────────────────────┼───────┤',
        '│ Caídas previas (anamnesis)                                │   1   │',
        '├───────────────────────────────────────────────────────────┼───────┤',
        '│ Medicamentos (1 punto por cada tipo):                     │       │',
        '│  • Sedantes / hipnóticos                                  │   1   │',
        '│  • Diuréticos                                             │   1   │',
        '│  • Antihipertensivos (excluyendo diuréticos)              │   1   │',
        '│  • Antiparkinsonianos                                     │   1   │',
        '│  • Antidepresivos / antipsicóticos                        │   1   │',
        '├───────────────────────────────────────────────────────────┼───────┤',
        '│ Déficits sensoriales (1 punto por cada uno):              │       │',
        '│  • Déficit visual significativo                           │   1   │',
        '│  • Déficit auditivo significativo                         │   1   │',
        '│  • Déficit motor (paresia, ataxia, amputación)            │   1   │',
        '├───────────────────────────────────────────────────────────┼───────┤',
        '│ Confusión o desorientación                                │   1   │',
        '│ Marcha insegura o inestable                               │   1   │',
        '└───────────────────────────────────────────────────────────┴───────┘',
        '⚠️ Excepciones: sedación/anestesia = SIEMPRE alto riesgo independiente del puntaje',
        '⚠️ Medicamentos SNC en adultos mayores = SIEMPRE alto riesgo',
      ],
      layout_position: 'main',
    },
    {
      id: 'caidas-v3-medidas',
      type: 'criteria',
      color: 'blue',
      order: 2,
      title: 'Medidas Preventivas según Nivel de Riesgo',
      content: 'Implementar medidas según puntaje Dowton — aplicar SIEMPRE todas las medidas del nivel correspondiente',
      items: [
        '━━━ RIESGO BAJO (Dowton ≤ 2) ━━━',
        '• Freno de cama activado permanentemente',
        '• Barandas laterales levantadas durante la noche',
        '• Iluminación nocturna en baño y pasillo',
        '• Asistencia para levantarse si el paciente lo solicita',
        '• Mantener piso seco y libre de obstáculos',
        '• Calzado antideslizante',
        '',
        '━━━ RIESGO ALTO (Dowton ≥ 3) ━━━',
        '• TODAS las medidas de riesgo bajo, MÁS:',
        '• Freno de cama verificado en cada turno',
        '• Barandas levantadas durante todo el día',
        '• Observación mínima cada 2 horas (o continua si BARS ≥ 5)',
        '• Timbre de llamado al alcance del paciente',
        '• Contención física SOLO si agitación — no como medida preventiva de caídas',
        '• Comunicar nivel de riesgo en cambio de turno',
        '• Informar a familia sobre riesgo y restricciones',
      ],
      layout_position: 'main',
    },
    {
      id: 'caidas-v3-evento',
      type: 'flowchart',
      color: 'red',
      order: 3,
      title: 'Procedimiento ante Caída — Toda Caída = Evento Centinela',
      content: 'Protocolo obligatorio cuando un paciente cae dentro del hospital — no omitir ningún paso',
      details: [
        '1. PRIMERO: no mover al paciente — evaluar consciencia y condición general',
        '2. AVISAR al médico de turno — evaluación clínica en el lugar',
        '3. TRASLADO seguro si requiere exámenes (TAC, Rx) — camilla con barandas',
        '4. REGISTRO en hoja de enfermería: hora, circunstancias, lesiones observadas',
        '5. FORMULARIO único de notificación de eventos adversos — completar dentro de 24h',
        '6. REEVALUAR Dowton inmediatamente tras la caída',
        '7. COMUNICAR a familiares o cuidador de referencia',
        '8. ANÁLISIS: jefatura revisa causa dentro de 72h — medidas correctivas',
        '',
        '⚠️ Obligatorio documentar aunque no haya lesión visible',
        '⚠️ No borrar ni modificar registros previos',
      ],
      layout_position: 'main',
    },
    {
      id: 'caidas-v3-mermaid',
      type: 'mermaid',
      order: 4,
      title: 'Algoritmo GCL 2.2.2 — Prevención de Caídas',
      content: `flowchart TD
    A([Ingreso de paciente]) --> B[Aplicar Escala Dowton\\nal ingreso]
    B --> C{Puntaje\\nDownton}
    C -->|≤ 2 — Bajo riesgo| D[Medidas básicas:\\nfreno · barandas · iluminación nocturna · calzado]
    C -->|≥ 3 — Alto riesgo| E[Medidas reforzadas:\\nfreno verificado c/turno · barandas todo el día\\nobservación c/2h · timbre al alcance]
    D --> F[Reevaluar Dowton diariamente]
    E --> F
    F --> G{¿Cambio clínico\\nque aumenta riesgo?}
    G -->|No| F
    G -->|Sí — nuevo medicamento\\nsedación/caída previa| H[Actualizar Dowton\\nescalar medidas]
    H --> E
    F --> I{¿Ocurrió\\ncaída?}
    I -->|No| F
    I -->|Sí| J[Evaluar paciente\\navisar médico de turno]
    J --> K[Registrar en hoja\\nenfermería + formulario EA]
    K --> L[Reevaluar Dowton\\ntras la caída]
    L --> M([Análisis causa raíz\\nJefatura en 72h])`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. PREVENCIÓN SUICIDIO — HCSFB 160
// ─────────────────────────────────────────────────────────────────────────────
const PREV_SUICIDIO = {
  id: 'c0aecd59-f807-4c2e-af91-408d5f5928b3',
  authors: [
    { name: 'Dr. Rodrigo Enríquez Heredia', role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
    { name: 'Dra. Daniella Sbarbaro Arias', role: 'Elaboradora — Médico PROSAM HCSFB' },
    { name: 'Dra. Micaela Fasani Montagna', role: 'Revisora — Subdirectora Médica HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',       role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'prevsuic-v3-asq',
      type: 'flowchart',
      color: 'blue',
      order: 1,
      title: 'Cuestionario ASQ — Ask Suicide-Screening Questions',
      content: 'Aplicar a TODO paciente hospitalizado al ingreso — lo aplica el enfermero/a de sala · Sensibilidad 100% · Especificidad 89%',
      details: [
        '━━━ PREGUNTAS OBLIGATORIAS (hacer todas 4) ━━━',
        '',
        'P1: "En las últimas semanas, ¿ha deseado estar muerto?"',
        'P2: "En las últimas semanas, ¿usted o su familia estarían mejor si usted estuviera muerto?"',
        'P3: "Esta semana, ¿ha estado pensando en suicidarse?"',
        'P4: "¿Alguna vez ha intentado suicidarse?"',
        '',
        '━━━ PREGUNTA ADICIONAL (SOLO si ≥ 1 respuesta positiva) ━━━',
        '',
        'P5: "¿Está pensando en suicidarse en este momento?"',
        '',
        '→ Resultado: ver protocolo de manejo según respuestas',
      ],
      layout_position: 'main',
    },
    {
      id: 'prevsuic-v3-manejo',
      type: 'criteria',
      color: 'amber',
      order: 2,
      title: 'Manejo según Resultado ASQ',
      content: 'Tres vías de respuesta según el resultado del ASQ — aplicar inmediatamente',
      items: [
        '✅ VÍA 1 — 0 respuestas positivas (P1–P4 todas NO):',
        '• Sin precauciones adicionales',
        '• Alta segura cuando corresponda clínicamente',
        '',
        '⚠️ VÍA 2 — ≥ 1 respuesta positiva + P5 = NO (sin ideación actual):',
        '• Evaluación por dupla psicosocial (psicólogo + asistente social) ANTES del alta',
        '• Eventual derivación a PROSAM al alta',
        '• Registrar en ficha clínica',
        '',
        '🚨 VÍA 3 — ≥ 1 respuesta positiva + P5 = SÍ (ideación actual):',
        '• Trasladar al paciente a sala frente al mesón de enfermería (supervisión visual continua)',
        '• Retirar objetos potencialmente peligrosos del entorno (cinturones, cables, objetos cortantes)',
        '• Evaluación urgente por dupla psicosocial (psicólogo + asistente social)',
        '• Hospitalización en sala hasta cese de ideación',
        '• Derivación a PROSAM al alta',
        '• Informar al médico tratante',
      ],
      layout_position: 'main',
    },
    {
      id: 'prevsuic-v3-mermaid',
      type: 'mermaid',
      order: 3,
      title: 'Algoritmo HCSFB 160 — Prevención de Autolesiones y Suicidio',
      content: `flowchart TD
    A([Paciente ingresa\\na hospitalización]) --> B[Enfermero/a aplica\\nASQ al ingreso]
    B --> C{P1–P4:\\n¿alguna positiva?}
    C -->|No — todas negativas| D([Sin precauciones adicionales\\nAlta cuando corresponda])
    C -->|Sí — ≥ 1 positiva| E[Aplicar P5:\\n¿ideación actual?]
    E -->|P5 = No\\nsin ideación actual| F[Evaluación dupla psicosocial\\nantes del alta]
    F --> G[Derivación PROSAM al alta\\n+ registro en FC]
    E -->|P5 = Sí\\nideación activa| H[Sala frente al mesón\\nsupervisión visual continua]
    H --> I[Retirar objetos peligrosos\\nInformar médico tratante]
    I --> J[Evaluación urgente\\ndupla psicosocial]
    J --> K{¿Cede\\nideación?}
    K -->|Sí| L[Alta con derivación\\nPROSAM prioritaria]
    K -->|No| M([Hospitalización\\nhasta cese ideación])`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. CRITERIOS SALUD MENTAL — HCSFB 166
// ─────────────────────────────────────────────────────────────────────────────
const CRITERIOS_SM = {
  id: 'fa57bf50-f39c-4438-af5e-bfa33be36fce',
  authors: [
    { name: 'Dr. Rodrigo Enríquez Heredia', role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
    { name: 'Dra. Daniella Sbarbaro Arias', role: 'Elaboradora — Médico PROSAM HCSFB' },
    { name: 'Dra. Micaela Fasani Montagna', role: 'Revisora — Subdirectora Médica HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',       role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'critsm-v3-ingreso',
      type: 'criteria',
      color: 'amber',
      order: 1,
      title: 'Criterios de Ingreso a Hospitalización por Causa Psiquiátrica',
      content: 'Cualquiera de estos criterios justifica hospitalización en Medicina o Pediatría HCSFB — indicación médica obligatoria',
      items: [
        '• SAD PERSONS ≥ 3 puntos',
        '• Intento de suicidio reciente (independiente de la escala)',
        '• Psicosis activa (delirios, alucinaciones, desorganización)',
        '• Planes activos de dañar a terceros',
        '• Incapacidad de asegurar la propia seguridad en el domicilio',
      ],
      layout_position: 'main',
    },
    {
      id: 'critsm-v3-traslado',
      type: 'criteria',
      color: 'red',
      order: 2,
      title: 'Criterios de Traslado a HCHM (Psiquiatría)',
      content: 'Cuando los recursos de hospital básico son insuficientes — gestionar traslado con internista de HCHM',
      items: [
        '🏥 Intento suicida de alta letalidad que requiere UCI o UPC',
        '🧠 Catatonía (requiere diagnóstico diferencial y tratamiento especializado)',
        '🔺 Manía o hipomanía severa sin respuesta a tratamiento inicial',
        '🆕 Primera psicosis sin diagnóstico previo (requiere evaluación especializada completa)',
        '⚡ Agitación incontrolable con los recursos farmacológicos y de personal disponibles en HCSFB',
        '',
        '📞 GESTIÓN: llamar a Internista HCHM → interconsulta urgente → traslado en ambulancia con acompañamiento médico',
      ],
      layout_position: 'main',
    },
    {
      id: 'critsm-v3-egreso',
      type: 'criteria',
      color: 'green',
      order: 3,
      title: 'Criterios de Egreso (TODOS deben cumplirse)',
      content: 'Para dar el alta de hospitalización por causa psiquiátrica — verificar cada criterio',
      items: [
        '✅ Sin ideación suicida activa (puede haber ideación pasiva encapsulada)',
        '✅ Sin psicosis activa (o delirios encapsulados sin riesgo conductual)',
        '✅ No planea dañar a terceros',
        '✅ Red de apoyo adecuada (familiar o comunitaria que pueda supervisar)',
        '✅ Control médico/psicológico concertado en ≤ 7 días',
        '✅ Plan de acción en crisis elaborado con dupla psicosocial',
        '',
        '📞 Contactos del plan de crisis: PROSAM HCSFB · Urgencias · Fono Salud 600 360 7777',
      ],
      layout_position: 'main',
    },
    {
      id: 'critsm-v3-mermaid',
      type: 'mermaid',
      order: 4,
      title: 'Algoritmo HCSFB 166 — Criterios de Ingreso, Traslado y Egreso SM',
      content: `flowchart TD
    A([Paciente con diagnóstico\\npsiquiátrico en HCSFB]) --> B{¿Criterio\\nde ingreso?}
    B -->|No| C([Manejo ambulatorio\\nPROSAM o policlínico])
    B -->|Sí: SAD PERSONS ≥3\\nintento suicida\\npsicosis\\nplanes daño| D[Hospitalizar en MQ o Pediatría]
    D --> E{¿Criterio\\nde traslado HCHM?}
    E -->|Sí: UCI · catatonía\\nmanía · 1ª psicosis\\nagitación refractaria| F[Gestionar traslado\\nIC internista HCHM]
    E -->|No| G[Manejo en HCSFB\\ndupla psicosocial activa]
    G --> H{¿Cumple TODOS\\nlos criterios de egreso?}
    H -->|No| G
    H -->|Sí| I[Alta con plan de crisis\\ncontrol ≤ 7 días]
    I --> J([Derivación PROSAM\\nprioritaria])`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. RESPUESTA RÁPIDA MQ — HCSFB 165
// ─────────────────────────────────────────────────────────────────────────────
const RESP_RAPIDA = {
  id: '099cba54-aec4-4d2b-9760-64b5302fe77e',
  authors: [
    { name: 'Dr. Ignacio San Martín Reyes', role: 'Elaborador — Médico HCSFB' },
    { name: 'Dra. Micaela Fasani Montagna', role: 'Revisora — Subdirectora Médica HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',       role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'rrmq-v3-alertas',
      type: 'criteria',
      color: 'amber',
      order: 1,
      title: 'Señales de Alerta — Activación Temprana del Protocolo',
      content: 'Cualquiera de estas señales en paciente hospitalizado con diagnóstico psiquiátrico requiere evaluación inmediata',
      items: [
        '• Inquietud creciente o incremento de la actividad motora',
        '• Aumento progresivo del tono o volumen de voz',
        '• Amenazas verbales hacia el equipo, familiares u otros pacientes',
        '• Intento de levantarse impulsivo, especialmente en situación de riesgo',
        '• Negativa abrupta y hostil al tratamiento o a la atención',
        '• Retiro de dispositivos (catéteres, sondas, vías venosas)',
        '• Verbalización de ideas persecutorias o paranoides',
        '• Conducta desorganizada, sin dirección coherente',
        '',
        '→ Ante una o más señales: evaluar nivel de respuesta requerido (Nivel 1/2/3)',
      ],
      layout_position: 'main',
    },
    {
      id: 'rrmq-v3-niveles',
      type: 'flowchart',
      color: 'blue',
      order: 2,
      title: 'Niveles de Respuesta — Protocolo Escalonado',
      content: 'Respuesta proporcional al nivel de agitación — iniciar siempre en el nivel más bajo que corresponda',
      details: [
        '═══ NIVEL 1 — ALERTA LEVE (señales de alerta sin agitación activa) ═══',
        '• Intervención verbal: identificarse, hablar con calma, preguntar qué necesita',
        '• Reducir estímulos: bajar luz, pedir silencio, limitar visitas',
        '• Contención emocional: validar emociones sin reforzar conducta inapropiada',
        '• Reevaluación médica y ajuste de farmacología si corresponde',
        '• Ofrecer SOS oral (ansiolítico o antipsicótico según indicación vigente)',
        '• Registro en hoja de enfermería',
        '',
        '═══ NIVEL 2 — AGITACIÓN MODERADA (BARS 5–6) ═══',
        '• Avisar a médico de urgencias Y guardia de seguridad del hospital',
        '• Retirar objetos potencialmente peligrosos del entorno inmediato',
        '• Intentar manejo verbal antes de farmacología',
        '• Administrar medicamento oral o IM según protocolo HCSFB 159',
        '• Supervisión continua (no dejar al paciente solo)',
        '• Registro médico de la intervención',
        '',
        '═══ NIVEL 3 — AGITACIÓN SEVERA / VIOLENCIA (BARS 7) ═══',
        '• Activar código de alarma → avisar urgencias + seguridad',
        '• Despejar el área (proteger a otros pacientes y al personal)',
        '• Contención farmacológica parenteral IM/IV según escalón 3–4 HCSFB 159',
        '• Contención física si necesario (5 personas, protocolo GCL 1.9)',
        '• Supervisión continua monitorizado',
        '• Evaluar traslado a HCHM si no responde a tratamiento local',
      ],
      layout_position: 'main',
    },
    {
      id: 'rrmq-v3-traslado',
      type: 'criteria',
      color: 'red',
      order: 3,
      title: 'Criterios de Traslado a HCHM desde Sala MQ/Pediatría',
      content: 'Cuando los recursos de HCSFB son insuficientes — coordinar con internista HCHM antes de traslado',
      items: [
        '• Agitación severa refractaria a tratamiento farmacológico máximo',
        '• Necesidad de contención física prolongada (> 8 horas)',
        '• Monitoreo continuo que excede la capacidad del servicio',
        '• Riesgo alto persistente a pesar de tratamiento óptimo',
        '',
        '📞 Gestión: médico HCSFB → IC a internista HCHM → traslado en ambulancia → enfermero acompañante',
      ],
      layout_position: 'main',
    },
    {
      id: 'rrmq-v3-mermaid',
      type: 'mermaid',
      order: 4,
      title: 'Algoritmo HCSFB 165 — Respuesta Rápida para Paciente Psiquiátrico Hospitalizado',
      content: `flowchart TD
    A([Señal de alerta\\nen sala MQ/Ped]) --> B{Evaluar\\nnivel BARS}
    B -->|BARS 4–5\\nLeve| C[NIVEL 1:\\nintervención verbal\\nreducir estímulos · SOS oral]
    B -->|BARS 5–6\\nModerado| D[NIVEL 2:\\navisar médico + seguridad\\nmanejo oral/IM]
    B -->|BARS 7\\nSevero| E[NIVEL 3:\\nalarma · despejar área\\nfarmacología IM/IV + contención]
    C --> F{¿Mejora?}
    D --> F
    E --> G{¿Responde\\nal tratamiento?}
    F -->|Sí| H([Supervisión continua\\nregistro enfermería])
    F -->|No — escalar| D
    G -->|Sí BARS 4| H
    G -->|No — refractario| I[Evaluar traslado\\nHCHM]
    I --> J([IC internista HCHM\\ntraslado en ambulancia])`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. TORACOCENTESIS — HCSFB 139
// ─────────────────────────────────────────────────────────────────────────────
const TORACOCENTESIS = {
  id: 'df8dbe5d-59a0-4447-80a7-3af37319e325',
  authors: [
    { name: 'Dr. Sebastián Bustos Sepúlveda',    role: 'Elaborador — Médico HCSFB' },
    { name: 'Dra. Valentina Sandoval Valenzuela', role: 'Elaboradora — Médico HCSFB' },
    { name: 'Dr. Roberto Aguilera Jaque',         role: 'Elaborador — Médico HCSFB' },
    { name: 'Dr. Felipe Sancho Tapia',            role: 'Revisor — Subdirector Médico HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',             role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'toraco-v3-contraindicaciones',
      type: 'criteria',
      color: 'red',
      order: 1,
      title: 'Contraindicaciones Relativas',
      content: 'Evaluar riesgo-beneficio antes de proceder — ninguna es contraindicación absoluta pero requieren consideración especial',
      items: [
        '• Paciente no cooperador o incapaz de mantener posición',
        '• INR > 2 o plaquetas < 50.000/µL (riesgo hemorrágico aumentado)',
        '• Enfermedad cutánea o infección en el sitio de punción planificado',
        '• Derrame de pequeña cuantía (riesgo aumentado sin beneficio claro)',
        '• Enfisema severo (riesgo aumentado de neumotórax)',
        '• Ventilación mecánica con presión positiva (aumenta riesgo de neumotórax a tensión)',
        '',
        '⚠️ Siempre realizar ecoscopia previa para confirmar cantidad y localización',
      ],
      layout_position: 'sidebar',
    },
    {
      id: 'toraco-v3-tecnica',
      type: 'flowchart',
      color: 'blue',
      order: 2,
      title: 'Técnica de Toracocentesis — Paso a Paso',
      content: 'Procedimiento guiado por ecoscopia — confirmar localización antes de punción · Sensibilidad 100%, Especificidad 99.7%',
      details: [
        '1. POSICIÓN: sentado erguido inclinado hacia adelante (mesa de apoyo) O decúbito supino con brazo ipsilateral detrás de la cabeza',
        '2. ECOSCOPIA previa: confirmar localización y cuantía del derrame — marcar el sitio',
        '3. PREPARACIÓN: campo estéril, guantes, mascarilla, tapa con clorhexidina',
        '4. ANESTESIA LOCAL: Lidocaína 2% diluida con SF al 1:1 → habón dérmico con aguja 25G → profundizar con aguja 20-22G por encima del borde superior de la costilla inferior (evitar paquete vasculo-nervioso)',
        '5. ASPIRACIÓN de LP con aguja 20-22G hasta confirmar posición',
        '6. DIAGNÓSTICA: obtener 10–60 mL en tubos correspondientes (ver tabla)',
        '7. TERAPÉUTICA: conectar sistema con llave de 3 pasos y recipiente; extraer hasta 1–1.5 L/24h máximo',
        '   → Suspender si: dolor torácico, disnea súbita, hipotensión (expansión pulmonar brusca)',
        '8. RETIRO: retirar aguja en fase de EXHALACIÓN (pulmón retraído)',
        '9. APÓSITO: tegaderm o apósito transparente — inspeccionar a las 2h',
        '10. ECOSCOPIA POST: descartar neumotórax',
      ],
      layout_position: 'main',
    },
    {
      id: 'toraco-v3-materiales',
      type: 'criteria',
      color: 'green',
      order: 3,
      title: 'Materiales del Kit de Toracocentesis',
      content: 'Preparar antes de iniciar el procedimiento — verificar disponibilidad de ecógrafo',
      items: [
        '• Ecógrafo con transductor lineal o convexo (disponible en pabellón/UCI)',
        '• Agujas: 25G (anestesia superficial) + 20–22G (anestesia profunda + punción)',
        '• Para terapéutica: Abbocath N°14 o 16G',
        '• Jeringas: 10 mL (anestesia) + 50 mL (aspiración diagnóstica)',
        '• Llave de 3 pasos + equipo de infusión + bolsa recolectora',
        '• Lidocaína 2% + SF 0.9%',
        '• Clorhexidina alcohólica 2%',
        '• Campos estériles, guantes estériles, mascarilla',
        '• Tegaderm o apósito transparente',
        '• Tubos de recolección (ver tabla de estudios)',
      ],
      layout_position: 'sidebar',
    },
    {
      id: 'toraco-v3-estudios',
      type: 'flowchart',
      color: 'amber',
      order: 4,
      title: 'Estudios del Líquido Pleural — Todos se Envían a HCHM',
      content: 'Enviar muestras correctamente etiquetadas a laboratorio HCHM — los plazos son de entrega de resultados',
      details: [
        '┌──────────────────────┬───────────────────────────┬────────────────┬──────────────┐',
        '│ Estudio              │ Indicación                │ Plazo resultado│ Envase/Tapa  │',
        '├──────────────────────┼───────────────────────────┼────────────────┼──────────────┤',
        '│ Citoquímico (LP)     │ Siempre                   │ 24 horas       │ Tapa lila    │',
        '│ Proteínas + LDH      │ Siempre (Criteron Light)  │ 24 horas       │ Tapa amarilla│',
        '│ ADA                  │ Sospecha TBC              │ 3 días         │ Tapa amarilla│',
        '│ XpertMTB (TBC)       │ Sospecha TBC              │ 24 horas       │ 60 mL estéril│',
        '│ Microbiología + C+S  │ Sospecha empiema          │ 48–72 horas    │ Frascos hemo │',
        '│ Cultivo hongos       │ Inmunodeprimido           │ 15 días        │ Frasco estéril│',
        '│ Citología oncológica │ Sospecha neoplasia        │ 5–7 días       │ Tapa amarilla│',
        '└──────────────────────┴───────────────────────────┴────────────────┴──────────────┘',
        '',
        '📋 Registro: DAU si procede en Urgencias; FC si procede en Hospitalizados',
        '📋 Criterios de Light (transudado vs. exudado): proteínas LP/S > 0.5 · LDH LP/S > 0.6 · LDH LP > 2/3 del límite normal',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. DOLOR AGUDO POST-OPERATORIO — GCL 1.3
// ─────────────────────────────────────────────────────────────────────────────
const DOLOR = {
  id: '66086cdd-cd73-46ca-87da-245fdb2f4e32',
  authors: [
    { name: 'Dr. Roberto Aguilera Jaque',    role: 'Elaborador — Médico Anestesiólogo HCSFB' },
    { name: 'Dr. Maicol Candia Sandoval',    role: 'Revisor — Subdirector Médico HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'dolor-v3-escalas',
      type: 'flowchart',
      color: 'blue',
      order: 1,
      title: 'Escalas de Evaluación del Dolor',
      content: 'Aplicar la escala correspondiente según edad y capacidad del paciente — evaluar reposo Y movimiento',
      details: [
        '═══ ADULTOS Y NIÑOS > 8 AÑOS — EVA (Escala Visual Análoga) ═══',
        'EVA 0–3: LEVE → Paso 1 analgésico',
        'EVA 4–7: MODERADO → Paso 2 analgésico',
        'EVA 8–10: SEVERO → Paso 3 analgésico (opioide)',
        '',
        '═══ NIÑOS 3–8 AÑOS — Escala de Caritas (Faces Pain Scale) ═══',
        '6 caras numeradas 0-10 → aplicar igual que EVA',
        '',
        '═══ NIÑOS < 3 AÑOS / PACIENTES NO VERBALES — FLACC ═══',
        'F=Face (mueca/llanto) · L=Legs (posición piernas) · A=Activity (movimiento) · C=Cry (llanto) · C=Consolability',
        '0-2 por categoría · Total 0-10 → misma escala de severidad',
        '',
        '═══ SEDACIÓN — Escala de Ramsay (monitorizar en uso de opioides IV) ═══',
        'Ramsay 1=ansioso/agitado · 2=cooperador/tranquilo · 3=responde órdenes · 4=dormido',
        'Objetivo: Ramsay 2–3 · FR objetivo ≥ 12/min',
      ],
      layout_position: 'main',
    },
    {
      id: 'dolor-v3-aines',
      type: 'flowchart',
      color: 'green',
      order: 2,
      title: 'AINEs y Analgésicos No Opioides — Dosis y Vías',
      content: 'Primera y segunda línea analgésica — siempre intentar AINEs antes de escalar a opioides',
      details: [
        '═══ ADMINISTRACIÓN INTERMITENTE ═══',
        'Metamizol (Dipirona):  1–2 g c/6–8h IV · máx 6 g/24h',
        'Paracetamol:           1 g c/6–8h VO · máx 4 g/24h · usar también como base',
        'Ketoprofeno:           100 mg c/8h IV (30 min) · máx 300 mg/24h',
        'Ketorolaco:            15 mg c/8h IV · máx 90 mg/24h · no más de 5 días',
        '',
        '═══ INFUSIÓN CONTINUA (dolor severo controlado) ═══',
        'Metamizol:             4–6 g/24h en infusión IV continua',
        'Ketoprofeno:           hasta 300 mg/24h en infusión IV continua',
        '',
        '⚠️ Precauciones: evitar AINEs en IR, IH, úlcera activa, embarazada, plaquetopenia',
        '⚠️ Ketorolaco máximo 5 días (toxicidad renal/GI)',
      ],
      layout_position: 'main',
    },
    {
      id: 'dolor-v3-opioides',
      type: 'flowchart',
      color: 'amber',
      order: 3,
      title: 'Opioides — EVA ≥ 7 o Refractario a AINEs',
      content: 'Tercer escalón analgésico — monitorizar FR, Ramsay y SpO2 durante infusión',
      details: [
        '═══ TRAMADOL — Opioide débil ═══',
        'Dosis: máximo 6 mg/kg/24h',
        'Vías: infusión continua O bolos c/6h',
        'Indicación: EVA 4–7 refractario a AINEs',
        '',
        '═══ MEPERIDINA (Petidina) ═══',
        'Dosis: 10–30 mg IV c/4–6h',
        'Indicación: dolor moderado-severo en contexto quirúrgico',
        '⚠️ No usar en IR o epilepsia (metabolito activo normeperidina)',
        '',
        '═══ MORFINA — Opioide fuerte ═══',
        'Titulación: 2–3 mg IV cada 10 minutos hasta EVA ≤ 3',
        'Mantenimiento: infusión 1 mg/hr IV (ajustar según respuesta)',
        'Indicación: dolor severo EVA ≥ 8 o refractario',
        '⚠️ Tener Naloxona disponible durante infusión de morfina',
      ],
      layout_position: 'main',
    },
    {
      id: 'dolor-v3-adversos',
      type: 'criteria',
      color: 'red',
      order: 4,
      title: 'Manejo de Efectos Adversos de Opioides',
      content: 'Tratamiento específico para cada efecto adverso — nunca suspender el opioide sin tratar primero el efecto adverso',
      items: [
        '🤢 NÁUSEAS Y VÓMITOS:',
        '  • Ondansetrón 4–8 mg IV (primera línea)',
        '  • Droperidol 1.25 mg IV',
        '  • Metoclopramida 10 mg IV',
        '  • Dexametasona 4–8 mg IV (también analgesia adyuvante)',
        '',
        '😖 PRURITO (frecuente con morfina epidural):',
        '  • Clorprimetón (Clorfenamina) 4 mg IV',
        '  • Naloxona 40 µg IV (dosis baja — no revierte analgesia)',
        '',
        '🫁 DEPRESIÓN RESPIRATORIA (FR < 12/min, Ramsay > 3):',
        '  • Naloxona 80 µg IV — repetir c/2–3 min si no responde',
        '  • Suspender infusión de opioide',
        '  • BVM disponible en cama del postoperado',
        '  • Llamar a médico de urgencias si no responde',
      ],
      layout_position: 'main',
    },
    {
      id: 'dolor-v3-mermaid',
      type: 'mermaid',
      order: 5,
      title: 'Algoritmo GCL 1.3 — Manejo del Dolor Agudo Post-Operatorio',
      content: `flowchart TD
    A([Paciente postoperado\\nEvaluar EVA cada 4h]) --> B{EVA}
    B -->|0–3 Leve| C[Paso 1:\\nParacetamol 1g VO c/6–8h]
    B -->|4–7 Moderado| D[Paso 2:\\nMetamizol 1–2g IV c/6–8h\\no Ketoprofeno 100mg IV c/8h\\n+ Paracetamol base]
    B -->|≥ 8 Severo| E[Paso 3:\\nMorfina 2–3mg IV c/10min\\nhasta EVA ≤ 3\\nluego infusión 1mg/hr]
    C --> F{¿Reevaluar\\na 30–60 min}
    D --> F
    E --> G[Monitorizar:\\nFR · Ramsay · SpO2]
    F -->|EVA ≤ 3| H([Mantener esquema\\nreevaluar c/4h])
    F -->|EVA > 3| I[Escalar al siguiente paso]
    I --> D
    G --> J{¿Efecto adverso?}
    J -->|No| H
    J -->|N/V| K[Ondansetrón 4–8mg IV]
    J -->|Prurito| L[Naloxona 40mcg IV\\no Clorfenamina 4mg]
    J -->|FR < 12\\nRamsay > 3| M[NALOXONA 80mcg IV\\nSuspender infusión\\nAvisar médico URGENTE]`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. INTENTO DE SUICIDIO — GCL 1.10
// (ID se busca por nombre si no está disponible)
// ─────────────────────────────────────────────────────────────────────────────
const INTENTO_SUICIDIO_BLOCKS = [
  {
    id: 'intsuic-v3-riesgo',
    type: 'criteria',
    color: 'amber',
    order: 1,
    title: 'Grupos de Riesgo — ¿A quién preguntar activamente?',
    content: 'Evaluar conducta suicida en estos grupos aunque el motivo de consulta sea otro — preguntar directamente no aumenta el riesgo',
    items: [
      '• Síntomas psicopatológicos: depresión, ansiedad severa, psicosis',
      '• Antecedente de intento de suicidio previo',
      '• Diagnóstico psiquiátrico activo',
      '• Abuso de sustancias (alcohol, drogas)',
      '• Evento estresante reciente (duelo, separación, pérdida laboral)',
      '• Enfermedad crónica o maligna (especialmente con dolor)',
      '• Adolescentes con rasgos impulsivos',
      '• Adultos mayores con desmedro o aislamiento',
    ],
    layout_position: 'main',
  },
  {
    id: 'intsuic-v3-sadpersons',
    type: 'flowchart',
    color: 'blue',
    order: 2,
    title: 'Escala SAD PERSONS — Estratificación del Riesgo',
    content: 'Calcular puntaje SAD PERSONS en todo paciente con conducta suicida — 1 punto por cada ítem presente',
    details: [
      'S — Sex: sexo masculino (mayor letalidad)',
      'A — Age: edad < 20 años o > 45 años',
      'D — Depression: depresión o desesperanza marcada',
      'P — Previous attempt: tentativa de suicidio previa',
      'E — Ethanol: abuso de alcohol o drogas',
      'R — Rational thinking loss: irracionalidad, psicosis',
      'S — Social support lacking: sin apoyo social o familiar',
      'O — Organized plan: plan suicida organizado y específico',
      'N — No spouse: sin pareja estable o viudo/a reciente',
      'S — Sickness: enfermedad somática grave o crónica',
      '',
      '┌──────────────────┬──────────────────────────────────────────────────┐',
      '│ Puntaje          │ Conducta recomendada                             │',
      '├──────────────────┼──────────────────────────────────────────────────┤',
      '│ 0–2              │ Poco riesgo — manejo ambulatorio + derivación SM │',
      '│ 3–6              │ Riesgo moderado — HOSPITALIZAR en MQ/Pediatría   │',
      '│ 7–10             │ Riesgo alto — hospitalizar + evaluar HCHM         │',
      '└──────────────────┴──────────────────────────────────────────────────┘',
    ],
    layout_position: 'main',
  },
  {
    id: 'intsuic-v3-flujo',
    type: 'flowchart',
    color: 'green',
    order: 3,
    title: 'Flujo de Atención en Urgencias',
    content: 'Protocolo de manejo desde la llegada a urgencias hasta la disposición final',
    details: [
      '1. IDENTIFICAR grupo de riesgo → indagar activamente conducta suicida',
      '2. ¿Conducta suicida confirmada? → derivar a urgencias HCSFB',
      '3. ¿Lesiones físicas graves? (intoxicación severa, heridas penetrantes):',
      '   → SÍ: estabilizar + derivación inmediata HCHM en ambulancia con médico',
      '   → NO: continuar en HCSFB',
      '4. Calcular SAD PERSONS',
      '5. SAD PERSONS > 2 → hospitalizar en MQ/Pediatría',
      '6. Durante hospitalización: psicólogo + asistente social (dupla psicosocial)',
      '7. ¿Criterio de derivación a psiquiatría HCHM? → IC a internista HCHM',
    ],
    layout_position: 'main',
  },
  {
    id: 'intsuic-v3-derivacion',
    type: 'criteria',
    color: 'red',
    order: 4,
    title: 'Criterios de Derivación a Psiquiatría HCHM',
    content: 'Indicaciones para derivar al Hospital Herminda Martín — gestionar con internista de HCHM',
    items: [
      '• Alta letalidad del intento (intoxicación masiva, arma de fuego, ahorcamiento)',
      '• Repercusión médico-quirúrgica que requiere UCI o UPC',
      '• Trastorno psiquiátrico descompensado no manejable en hospital básico',
      '• Riesgo de reintento (ideación persistente, sin conciencia de enfermedad, eventos estresantes recientes, red de apoyo insuficiente)',
      '• Clara intencionalidad suicida mantenida tras estabilización',
      '• Duda real si intento fue abortado (difícil distinguir de accidente)',
    ],
    layout_position: 'main',
  },
  {
    id: 'intsuic-v3-alta',
    type: 'criteria',
    color: 'green',
    order: 5,
    title: 'Criterios de Alta (cualquiera de los tres)',
    content: 'El alta debe ser indicada por psiquiatra o médico tratante con evaluación formal de riesgo',
    items: [
      '• Indicación expresa de psiquiatra tras evaluación',
      '• Petición familiar firmada (con registro médico de riesgo informado)',
      '• Compensación del episodio + hora de control psiquiátrico asignada (PROSAM u otro)',
      '',
      '📋 Siempre al alta: plan de crisis elaborado + fono de emergencias + derivación PROSAM prioritaria',
    ],
    layout_position: 'main',
  },
  {
    id: 'intsuic-v3-mermaid',
    type: 'mermaid',
    order: 6,
    title: 'Algoritmo GCL 1.10 — Manejo de Intento de Suicidio',
    content: `flowchart TD
    A([Paciente de riesgo\\no conducta suicida]) --> B{¿Conducta\\nsuicida confirmada?}
    B -->|No| C([Seguimiento habitual\\nderivación SM si pertinente])
    B -->|Sí| D{¿Lesiones físicas\\ngraves?}
    D -->|Sí| E[Estabilizar\\n+ derivación inmediata HCHM]
    D -->|No| F[Calcular SAD PERSONS]
    F --> G{Puntaje}
    G -->|0–2| H[Manejo ambulatorio\\nderivación SM]
    G -->|3–10| I[Hospitalizar MQ/Pediatría\\ndupla psicosocial]
    I --> J{¿Criterio\\nderivación HCHM?}
    J -->|No| K{¿Criterio\\nde alta?}
    J -->|Sí| L([IC internista HCHM\\nTraslado en ambulancia])
    K -->|No — continuar| I
    K -->|Sí| M[Alta con plan de crisis\\ncontrol PROSAM prioritario]`,
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — actualiza todos los topics
// ─────────────────────────────────────────────────────────────────────────────
async function updateTopic(topicId, authors, blocks, label) {
  const { data: current, error: fetchErr } = await supabase
    .from('topics')
    .select('content_blocks, name')
    .eq('id', topicId)
    .single();

  if (fetchErr) {
    console.error(`❌ ${label}: fetch error — ${fetchErr.message}`);
    return false;
  }

  console.log(`\n📋 ${label} — "${current.name}"`);
  console.log(`   Bloques actuales: ${(current.content_blocks || []).length}`);
  console.log(`   Bloques nuevos: ${blocks.length}`);

  if (!APPLY) return true;

  const { error } = await supabase
    .from('topics')
    .update({
      protocol_authors: authors,
      content_blocks:   blocks,
      last_updated:     new Date().toISOString(),
    })
    .eq('id', topicId);

  if (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }

  console.log(`   ✅ Actualizado correctamente`);
  return true;
}

async function findTopicIdByName(name) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, name')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();
  if (error || !data) return null;
  return data.id;
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  HOSPITALIZADOS v3 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);

// Buscar ID de Intento Suicidio por nombre
const intentoSuicidioId = await findTopicIdByName('Intento Suicida');
if (intentoSuicidioId) {
  console.log(`\n✅ Intento Suicida encontrado: ${intentoSuicidioId}`);
} else {
  console.log(`\n⚠️  Intento Suicida no encontrado por nombre`);
}

await updateTopic(AGITACION.id, AGITACION.authors, AGITACION.blocks, 'AGITACIÓN PSICOMOTORA (HCSFB 159)');
await updateTopic(HIPNOTICOS.id, HIPNOTICOS.authors, HIPNOTICOS.blocks, 'HIPNÓTICOS (HCSFB 129)');
await updateTopic(ERROR_MEDICACION.id, ERROR_MEDICACION.authors, ERROR_MEDICACION.blocks, 'ERROR MEDICACIÓN (GCL 2.2.1)');
await updateTopic(CONTENCION_FISICA.id, CONTENCION_FISICA.authors, CONTENCION_FISICA.blocks, 'CONTENCIÓN FÍSICA (GCL 1.9)');
await updateTopic(CAIDAS.id, CAIDAS.authors, CAIDAS.blocks, 'CAÍDAS (GCL 2.2.2)');
await updateTopic(PREV_SUICIDIO.id, PREV_SUICIDIO.authors, PREV_SUICIDIO.blocks, 'PREVENCIÓN SUICIDIO (HCSFB 160)');
await updateTopic(CRITERIOS_SM.id, CRITERIOS_SM.authors, CRITERIOS_SM.blocks, 'CRITERIOS SM (HCSFB 166)');
await updateTopic(RESP_RAPIDA.id, RESP_RAPIDA.authors, RESP_RAPIDA.blocks, 'RESPUESTA RÁPIDA MQ (HCSFB 165)');
await updateTopic(TORACOCENTESIS.id, TORACOCENTESIS.authors, TORACOCENTESIS.blocks, 'TORACOCENTESIS (HCSFB 139)');
await updateTopic(DOLOR.id, DOLOR.authors, DOLOR.blocks, 'DOLOR POST-OP (GCL 1.3)');

if (intentoSuicidioId) {
  await updateTopic(
    intentoSuicidioId,
    [
      { name: 'Dr. Rodrigo Enríquez Heredia',       role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
      { name: 'Psicóloga Sandra Ferrada Landero',   role: 'Elaboradora — PROSAM HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',             role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',             role: 'Aprobador — Director HCSFB' },
    ],
    INTENTO_SUICIDIO_BLOCKS,
    'INTENTO SUICIDA (GCL 1.10)'
  );
}

if (!APPLY) {
  console.log('\n\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
} else {
  console.log('\n\n✅ Todos los protocolos de Hospitalizados actualizados (v3).');
}
