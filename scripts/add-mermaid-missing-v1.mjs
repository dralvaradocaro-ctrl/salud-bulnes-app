/**
 * Agrega bloques mermaid a 3 protocolos que tienen contenido pero no activan auto-tab:
 *  - Contención Física (GCL 1.9)
 *  - LPP / Lesiones por Presión (GCL 2.2.3-A)
 *  - Toracocentesis (HCSFB 139)
 *
 * Uso:  node scripts/add-mermaid-missing-v1.mjs
 *       node scripts/add-mermaid-missing-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const UPDATES = [
  {
    label: 'GCL 1.9 — Contención Física',
    id:    '9e0b3406-9055-43a4-8a75-bf6d290bceb4',
    block: {
      id:    'contencion-mermaid',
      type:  'mermaid',
      order: 10,
      title: 'Algoritmo GCL 1.9 — Contención Física',
      content: `flowchart TD
    A([Paciente con agitación\\no riesgo de daño]) --> B{¿Responde a\\nmanejo verbal?}
    B -->|Sí| C([Desescalada verbal\\nReducir estímulos · Espacio seguro])
    B -->|No| D{¿Responde a\\ncontención farmacológica?}
    D -->|Sí| E([Observación · Registrar\\nReevaluar en 30 min])
    D -->|No — o riesgo inmediato| F{¿Indicación válida?}
    F -->|Castigo · comodidad\\ndel equipo| G([CONTRAINDICADO\\nBuscar alternativa clínica])
    F -->|Violencia · riesgo dispositivos\\nfarmacología urgente| H[Indicación médica en FC\\nCausa + duración estimada]
    H --> I[Preparar equipo: 5 personas\\n1 enfermera + 4 técnicos]
    I --> J[Técnica: decúbito supino\\nBanda abdominal + 4 extremidades en diagonal]
    J --> K[Cabeza levantada — prevenir aspiración]
    K --> L[Monitoreo c/4h:\\nTemp · color · sensibilidad · pulso]
    L --> M{¿Persiste\\nnecesidad?}
    M -->|No| N([Retirar contención\\nRegistrar fin en FC])
    M -->|Sí| L`,
      layout_position: 'main',
    },
  },
  {
    label: 'GCL 2.2.3-A — LPP',
    id:    'da8d14ee-463c-48d0-9460-509bbc422cd7',
    block: {
      id:    'lpp-mermaid',
      type:  'mermaid',
      order: 10,
      title: 'Algoritmo GCL 2.2.3-A — Prevención y Manejo LPP',
      content: `flowchart TD
    A([Ingreso del paciente]) --> B[Escala Braden al ingreso]
    B --> C{Puntuación\\nBraden}
    C -->|≤ 9 — Muy alto riesgo| D[Cambio posición c/2h\\nColchón especial · Apósito espuma\\nNutrición + hidratación]
    C -->|10–12 — Alto riesgo| E[Cambio posición c/2h\\nProtección prominencias óseas]
    C -->|13–14 — Riesgo moderado| F[Cambio posición c/2-3h\\nHidratación cutánea]
    C -->|15–18 — Riesgo bajo| G[Movilización activa\\nEducación paciente/familiar]
    D & E & F & G --> H[Reevaluación Braden diaria]
    H --> I{¿LPP\\npresente?}
    I -->|No| H
    I -->|Sí| J{Estadio}
    J -->|I — Eritema sin pérdida piel| K[Aliviar presión\\nApósito protector · No masajear]
    J -->|II — Pérdida parcial dermis| L[Limpieza SF · Apósito hidrocoloide\\nCubrir hasta curación]
    J -->|III — Pérdida total grosor| M[Desbridamiento si necrótico\\nApósito húmedo · Evaluación heridas]
    J -->|IV — Tejido óseo/muscular| N([Interconsulta cirugía\\nManejo avanzado heridas])`,
      layout_position: 'main',
    },
  },
  {
    label: 'HCSFB 139 — Toracocentesis',
    id:    'df8dbe5d-59a0-4447-80a7-3af37319e325',
    block: {
      id:    'toracocentesis-mermaid',
      type:  'mermaid',
      order: 10,
      title: 'Algoritmo HCSFB 139 — Toracocentesis en Adultos',
      content: `flowchart TD
    A([Paciente con derrame pleural\\nconfirmado o sospechado]) --> B[Ecoscopia previa\\nSensibilidad 100% · Especificidad 99.7%]
    B --> C{¿Contraindicación\\nrelativa presente?}
    C -->|INR>2 · plaquetas<50K\\nNo coopera · Mínima cuantía| D([Evaluar riesgo-beneficio\\nConsiderar alternativa])
    C -->|No| E{¿Objetivo?}
    E -->|Diagnóstico| F[10–60 mL en tubos\\nTapa lila + amarilla + estéril 60mL]
    E -->|Terapéutico — alivio síntomas| G[Máx 1–1.5 L/24h\\nSuspender: dolor pecho · disnea · hipotensión]
    F & G --> H[Posición: sentado erguido inclinado\\no decúbito supino brazo ipsilateral]
    H --> I[Lidocaína 2% + SF 1:1\\nAguja 25G habón → 20-22G hasta LP]
    I --> J[Aguja 22G diagnóstica\\no Abbocath + llave 3 pasos terapéutica]
    J --> K[Retirar en exhalación\\nApósito tegaderm]
    K --> L{¿Complicación?}
    L -->|Reacción vagal| M[Posición Trendelenburg · SF IV · Atropina si bradicardia]
    L -->|Neumotórax · hemotórax| N([Radiografía · pleurostomía si indicado])
    L -->|Sin complicación| O([Enviar muestras a HCHM\\nRegistrar en DAU o FC])`,
      layout_position: 'main',
    },
  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  MERMAID FALTANTES v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const u of UPDATES) {
  const { data: topic, error } = await supabase
    .from('topics').select('content_blocks').eq('id', u.id).single();

  if (error) { console.error(`❌ Fetch ${u.label}: ${error.message}`); continue; }

  const existing = topic.content_blocks || [];
  const alreadyHasMermaid = existing.some(b => b.type === 'mermaid');

  console.log(`📋 ${u.label}`);
  console.log(`   Bloques actuales: ${existing.length}  →  nuevos: ${existing.length + (alreadyHasMermaid ? 0 : 1)}`);
  if (alreadyHasMermaid) {
    console.log(`   ⚠️  Ya tiene bloque mermaid — sin cambio\n`);
    continue;
  }
  console.log(`   + mermaid: "${u.block.title}"\n`);

  if (!APPLY) continue;

  const newBlocks = [...existing, u.block].sort((a, b) => (a.order || 99) - (b.order || 99));
  const { error: e } = await supabase.from('topics').update({ content_blocks: newBlocks }).eq('id', u.id);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Mermaid agregado.\n`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
