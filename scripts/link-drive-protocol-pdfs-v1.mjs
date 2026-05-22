/**
 * Asocia protocol_file_url de los topics con los PDFs reales subidos a la
 * carpeta institucional de Google Drive (compartida con "cualquier persona
 * con el enlace · Lector").
 *
 * Estrategia:
 *   1. Lista todos los topics.
 *   2. Para cada PDF del mapping, intenta matchear por:
 *        a) protocol_code exacto (ej. "GCL 1.10", "HCSFB 166")
 *        b) name (substring case-insensitive con keywords del PDF)
 *   3. Si encuentra match único, setea protocol_file_url = drive view URL.
 *   4. En modo dry-run muestra qué actualizaría sin escribir.
 *
 * Uso:
 *   node scripts/link-drive-protocol-pdfs-v1.mjs           (dry-run)
 *   node scripts/link-drive-protocol-pdfs-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const driveUrl = (id) => `https://drive.google.com/file/d/${id}/view?usp=drivesdk`;

// Mapping curado: cada entrada describe un PDF de la carpeta institucional y
// los criterios para encontrar el topic correspondiente. `codes` matchea
// contra topic.protocol_code (case-insensitive, exact). `nameAny` matchea si
// CUALQUIER substring aparece en topic.name (case-insensitive). Si ambos
// criterios fallan no se actualiza.
const PDF_MAPPING = [
  // ── Protocolos Acreditación ───────────────────────────────────────────
  { id: '1gzXSTkvE4I3F_Ea1SsZHhdqaLxQ7gHBx', title: 'Sistema Categorización de Urgencia', codes: ['5.A'], nameAny: ['categorización de urgencia', 'categorizacion de urgencia', 'triage'] },
  { id: '1zccHtDeakFB6e0KM6XPsMJZyHmGKHQlZ', title: 'APT 1.2 Transporte de Pacientes', codes: ['APT 1.2'], nameAny: ['transporte de pacientes'] },
  { id: '17k62qeyFXeILEJ6RrJJhVugE17dBc9Jq', title: 'Vigilancia IAAS', codes: [], nameAny: ['vigilancia iaas', 'iaas vigilancia'] },
  { id: '1SMza3Y8kp7smYyQNYxOFrfPM9-6xWjGm', title: 'Protocolo de Transfusión', codes: [], nameAny: ['transfusión', 'transfusion'] },
  { id: '1XfqTAYEO5Zy8ADY88KzfwdSVC7c11_mL', title: 'GCL 1.13 Policlínico TACO', codes: ['GCL 1.13'], nameAny: ['policlínico taco', 'policlinico taco', 'taco'] },
  { id: '18YvraNUAbJr4lBom6eUbOEXXKb-YXwfc', title: 'Derivación de pacientes HB → HHM', codes: [], nameAny: ['derivacion de pacientes', 'derivación de pacientes', 'derivacion hb', 'derivación hb'] },
  { id: '15O2SoIHNhcOLr33uwiiHW645Haa--i9M', title: 'GCL 3.3.2 Aislamiento', codes: ['GCL 3.3.2'], nameAny: ['aislamiento'] },
  { id: '10kK5n9FWqBXXCnCjcUyTc2IVI3_iZXyG', title: 'GCL 2.2.1 Error de medicación', codes: ['GCL 2.2.1'], nameAny: ['error de medicación', 'error de medicacion'] },
  { id: '1snD1G9DOdJE3Gqo6SnwduEOQrj1h0YC2', title: 'API 1.3 Solicitud de exámenes', codes: ['API 1.3'], nameAny: ['solicitud de exámenes', 'solicitud de examenes'] },
  { id: '1Iwy8-Rz6bCcsFGE_kpzkfO2GmNGBD74C', title: 'Prevención de Caídas', codes: [], nameAny: ['prevención de caídas', 'prevencion de caidas'] },
  { id: '1wuBX49KjnE-qiJaYJ_J_wxXuT07yGRVo', title: 'GCL 1.3 Manejo del Dolor', codes: ['GCL 1.3'], nameAny: ['manejo del dolor'] },
  { id: '1Ci_tD6CQYhqkPX9hawfSoIcoPH_ACN5N', title: 'RH 4.2 Sangre o Fluidos', codes: ['RH 4.2'], nameAny: ['sangre o fluidos', 'exposición a sangre'] },
  { id: '1qvqfI2Ig7HhXlduUvD1Q8X6S6iHH0Bd6', title: 'DP 4.2 Procedimientos alumnos', codes: ['DP 4.2'], nameAny: ['procedimientos.*alumnos'] },
  { id: '1nUxzgJRfgJ5PuLdlywsT1Eq7u0vA4_OU', title: 'GCL 2.3 Eventos adversos/centinelas', codes: ['GCL 2.3'], nameAny: ['eventos adversos', 'evento centinela'] },
  { id: '1hYqEV8n89u4HGfC0q2IsksUJdlOmPoF0', title: 'REG 1.1 Ficha Clínica Única', codes: ['REG 1.1'], nameAny: ['ficha clínica única', 'ficha clinica unica'] },
  { id: '1Lzo0t4kIwsqmTO0Bcc4RRC2bNKeTUvig', title: 'Entrega de turnos de médico', codes: ['5.B'], nameAny: ['entrega de turnos', 'entrega de turno'] },
  { id: '1mmPCa57TdV94qkSUHI_ZVF8ltMTRNHOq', title: 'INS 1.1 Prevención de Incendios', codes: ['INS 1.1'], nameAny: ['prevención de incendios', 'prevencion de incendios'] },
  { id: '1WHSIpR3vI1S24pjXdbiaIVF_GE1dINzu', title: 'DP 3.1 Aprobación ética investigación', codes: ['DP 3.1'], nameAny: ['aprobación ética', 'aprobacion etica', 'comité ético'] },
  { id: '1Ywmi_cPTL7TEV9eHgTDbMp32FmhmvxZk', title: 'DP 5.1 Comité de Ética', codes: ['DP 5.1'], nameAny: ['comité de ética', 'comite de etica'] },
  { id: '1tDFFisbKi2qctPqxlrUcC_9380edoTwU', title: 'GCL 2.2.3-A LPP Valoración de piel', codes: ['GCL 2.2.3-A', 'GCL 2.2.3'], nameAny: ['valoración de piel', 'valoracion de piel', 'lesiones por presión', 'lpp'] },
  { id: '12bIcpeJEV9yfRupjkx2NyVnEgXieYpfS', title: 'GCL 1.4 RCP Pediatría', codes: ['GCL 1.4-B', 'GCL 1.4 B'], nameAny: ['rcp pediátrica', 'rcp pediatria', 'reanimación.*pediatr', 'reanimacion.*pediatr'] },
  { id: '15Q8bPwx3jEQYf7SqJWl2FrKijYmLtgQF', title: 'Evacuación', codes: [], nameAny: ['evacuación', 'evacuacion'] },
  { id: '1JMZ9k1D_8Uu07KRKK5n8KNEWWIduXg6r', title: 'DP 1.3 Derechos de los pacientes', codes: ['DP 1.3'], nameAny: ['derechos de los pacientes'] },
  { id: '1McZmqD5Oc2b8ClqZugI-taBYL8ghdsfm', title: 'DP 1.2 Gestión de Reclamos', codes: ['DP 1.2'], nameAny: ['gestión de reclamos', 'gestion de reclamos'] },
  { id: '1wigiQGAdiaMCVbP6gweZPJblF5DrEvIn', title: 'AOC 1.1 Código Azul', codes: ['AOC 1.1'], nameAny: ['código azul', 'codigo azul'] },
  { id: '1Lm0pEIGS3d34vSAKp-8KC2rPUsLVFpMb', title: 'GCL 1.10 Intento Suicida', codes: ['GCL 1.10'], nameAny: ['intento suicida', 'intento de suicidio'] },
  { id: '1AM0FljPVZFSGw3MEnXIPrASED6_5XJGO', title: 'GCL 1.9 Contención física', codes: ['GCL 1.9'], nameAny: ['contención física', 'contencion fisica'] },
  { id: '1fIfpUm1U_i8Net62_c7BhJTCfOizJJIp', title: 'GCL 1.4 RCP Adulto', codes: ['GCL 1.4-A', 'GCL 1.4 A', 'GCL 1.4'], nameAny: ['rcp adulto', 'reanimación.*adulto', 'reanimacion.*adulto'] },
  { id: '15192_7Yma0IRjRE9ACXn2Hc0E2TJ8URu', title: 'REG 1.3 Entrega de prestaciones', codes: ['REG 1.3'], nameAny: ['entrega de prestaciones'] },
  { id: '1pKfd0kpksskYUSAbE8P7KghIFKRkXMVK', title: 'REG 1.2 Registros clínicos', codes: ['REG 1.2'], nameAny: ['registros clínicos', 'registros clinicos'] },

  // ── otros Protocolos HCSFB ─────────────────────────────────────────────
  { id: '1UXx4eXQCO2n6k8L5I3djPgw0xgWSFHPK', title: 'HCSFB 166 Criterios SM',                 codes: ['HCSFB 166', '166'], nameAny: ['166', 'criterios.*ingreso.*sm', 'salud mental'] },
  { id: '1G1HFOB6yHIHvW2s86pR51zxjnWnKL3v_', title: 'HCSFB 165 Activación MQ',                codes: ['HCSFB 165', '165'], nameAny: ['165', 'activación mq', 'activacion mq'] },
  { id: '18coWI1Yis2fR7ccg1tmomgCyBJ8p5O-X', title: 'HCSFB 161 Implementación PROA',          codes: ['HCSFB 161', '161'], nameAny: ['161', 'proa'] },
  { id: '1P86Keu2l8zkCSnaOOHdRQg3FoMWPn4yh', title: 'HCSFB 160 Prevención lesiones y suicidio', codes: ['HCSFB 160', '160'], nameAny: ['160', 'prevención.*lesiones.*suicidio', 'prevencion.*lesiones.*suicidio'] },
  { id: '1YBfPQbwaBHhTjIsSnrHOvN_nzSs7l7GI', title: 'HCSFB 159 Contención farmacológica pediatría', codes: ['HCSFB 159', '159'], nameAny: ['159', 'contención farmacológica.*pediátr', 'contencion farmacologica.*pediatr'] },
  { id: '1R-80mkccTyySnX7osH90-xgClzarkB5L', title: 'Demencia (Protocolo Local 117)',         codes: ['HCSFB 117', '117'], nameAny: ['demencia', 'deterioro cognitivo'] },
  { id: '1v6S9wzBMLyXVrQucOjE19uzgBB3M9S5O', title: 'HCSFB 167 Trato usuario',                codes: ['HCSFB 167', '167'], nameAny: ['167', 'trato usuario'] },
  { id: '1N44ZV88jEyrqpn3kBb0S8dmNsFU4V33k', title: 'HCSFB 150 Atención preferente',          codes: ['HCSFB 150', '150'], nameAny: ['150', 'atención preferente', 'atencion preferente'] },
  { id: '15oFjhM1LqCxxsMpGhlOVn76uZmxxxeAv', title: 'Hipotiroidismo Primario (Protocolo Local)', codes: [], nameAny: ['hipotiroidismo'] },
  { id: '1MuFdeg3264RQ1E6Qx-L1EdzYsaQGCBAD', title: 'HCSFB 154 Ingreso, recepción y traslado', codes: ['HCSFB 154', '154'], nameAny: ['154', 'ingreso.*recepción.*traslado', 'ingreso.*recepcion.*traslado'] },
  { id: '18Wquqa9mIVq2Wq0CYz0oETTMskclH61F', title: 'HCSFB 153 Clotiazepam',                  codes: ['HCSFB 153', '153'], nameAny: ['153', 'clotiazepam'] },
  { id: '1-VnQKi5oxupaOlcA-fcq5vYbQ5hoXbJI', title: 'HCSFB 151 Infiltración rodilla',         codes: ['HCSFB 151', '151'], nameAny: ['151', 'infiltración.*rodilla', 'infiltracion.*rodilla', 'gonartrosis', 'gonastrosis'] },
  { id: '1Jajt5ataIT-AefnWf3sTa_b2WKcY5a7-', title: 'HCSFB 128 Disyunción acromioclavicular', codes: ['HCSFB 128', '128'], nameAny: ['128', 'acromioclavicular'] },
  { id: '1k1BhB39-jfn2a1SLKSTWjDsWSPqG0Ops', title: 'HCSFB 130 TEC adulto',                  codes: ['HCSFB 130', '130'], nameAny: ['130', 'traumatismo.*cráneo.*adulto', 'tec adulto'] },
  { id: '1hb6jDWqp3Ht9GwkPlu8-fHP6ZolehmwA', title: 'HCSFB 121 Ley Dominga',                 codes: ['HCSFB 121', '121'], nameAny: ['121', 'ley dominga'] },
  { id: '1naazqm1uaL8aJs0DgWOKdJKld33row76', title: 'HCSFB 141 Contención farmacológica adulto', codes: ['HCSFB 141', '141'], nameAny: ['141', 'contención farmacológica.*agitación', 'contencion farmacologica.*agitacion'] },
  { id: '1fwrXwwGZcTD3-3pU3KO7bP3noPcq0CtX', title: 'HCSFB 139 Toracocentesis',              codes: ['HCSFB 139', '139'], nameAny: ['139', 'toracocentesis'] },
  { id: '15uDxWDOqV5xcS9ENBsRfVeSFwB2XZomq', title: 'HCSFB 138 Telemedicina GES',            codes: ['HCSFB 138', '138'], nameAny: ['138', 'telemedicina', 'telesalud'] },
  { id: '13hr_IqOb5S_xQ9BWcDjm9nH7jZ1bURa3', title: 'HCSFB 129 Hipnóticos',                  codes: ['HCSFB 129', '129'], nameAny: ['129', 'hipnóticos', 'hipnoticos'] },
  { id: '1JnDvjo9VMEywPGJLFYEiUr4uf5myXufw', title: 'Trombólisis HCSFB',                     codes: [], nameAny: ['trombólisis', 'trombolisis'] },
  { id: '1BZmxLBOfuEdO2O10tHBE0PPC_uWfnoFt', title: 'Flujo solicitud imágenes HCSFB → HCHM', codes: [], nameAny: ['flujo.*solicitud.*imágenes', 'flujo.*solicitud.*imagenes', 'imagenología hchm'] },
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  LINK DRIVE PROTOCOLS — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const { data: topics, error } = await supabase
  .from('topics')
  .select('id, name, protocol_code, protocol_file_url, subcategory');

if (error) { console.error('Fetch topics:', error.message); process.exit(1); }
console.log(`  topics totales: ${topics.length}\n`);

const norm = (s) => (s || '').toString().toLowerCase().trim();
const normCode = (s) => norm(s).replace(/\s+/g, ' ');

function findMatches(entry) {
  const matches = [];
  for (const t of topics) {
    const code = normCode(t.protocol_code);
    const name = norm(t.name);
    // a) match por código exacto
    if (entry.codes.some(c => normCode(c) === code && code)) {
      matches.push({ topic: t, by: 'code' });
      continue;
    }
    // b) match por substring/regex en name
    for (const pat of entry.nameAny || []) {
      try {
        const re = new RegExp(pat, 'i');
        if (re.test(name)) { matches.push({ topic: t, by: `name~/${pat}/` }); break; }
      } catch {
        if (name.includes(norm(pat))) { matches.push({ topic: t, by: `name~"${pat}"` }); break; }
      }
    }
  }
  return matches;
}

const updates = [];
const ambiguous = [];
const unmatched = [];

for (const entry of PDF_MAPPING) {
  const matches = findMatches(entry);
  if (matches.length === 0) {
    unmatched.push(entry);
  } else if (matches.length === 1) {
    updates.push({ entry, topic: matches[0].topic, by: matches[0].by });
  } else {
    // Desempate: priorizar match por code; si no, el topic que tenga
    // protocol_code seteado (version canonica). Si igual queda mas de uno,
    // dejarlo como ambiguo.
    const byCode = matches.filter(m => m.by === 'code');
    if (byCode.length === 1) {
      updates.push({ entry, topic: byCode[0].topic, by: byCode[0].by + ' [tie-break]' });
    } else {
      const withCode = matches.filter(m => m.topic.protocol_code);
      if (withCode.length === 1) {
        updates.push({ entry, topic: withCode[0].topic, by: withCode[0].by + ' [tie-break code-set]' });
      } else {
        ambiguous.push({ entry, matches });
      }
    }
  }
}

console.log(`──── MATCH ÚNICO (${updates.length}) ────`);
for (const u of updates) {
  const already = u.topic.protocol_file_url ? ' [ya tiene url — sobreescribe]' : '';
  console.log(`  ✓ "${u.entry.title}"`);
  console.log(`     → topic ${u.topic.id.slice(0, 8)}… [${u.topic.protocol_code || '—'}] ${u.topic.name}  (by ${u.by})${already}`);
}

if (ambiguous.length) {
  console.log(`\n──── AMBIGUOS (${ambiguous.length}) — no se actualizan ────`);
  for (const a of ambiguous) {
    console.log(`  ⚠ "${a.entry.title}" matchea ${a.matches.length} topics:`);
    for (const m of a.matches) {
      console.log(`     - [${m.topic.protocol_code || '—'}] ${m.topic.name}  (by ${m.by})`);
    }
  }
}

if (unmatched.length) {
  console.log(`\n──── SIN MATCH (${unmatched.length}) ────`);
  for (const e of unmatched) console.log(`  ✗ "${e.title}"  (codes=${JSON.stringify(e.codes)} names=${JSON.stringify(e.nameAny)})`);
}

console.log(`\n──── RESUMEN ────`);
console.log(`  PDFs a vincular: ${updates.length} / ${PDF_MAPPING.length}`);
console.log(`  Ambiguos:        ${ambiguous.length}`);
console.log(`  Sin match:       ${unmatched.length}`);

if (!APPLY) {
  console.log('\nDry-run. Para aplicar: --apply\n');
  process.exit(0);
}

let updated = 0;
let failed = 0;
for (const u of updates) {
  const { error: e } = await supabase
    .from('topics')
    .update({ protocol_file_url: driveUrl(u.entry.id), last_updated: new Date().toISOString() })
    .eq('id', u.topic.id);
  if (e) { console.error(`  ✗ update ${u.topic.id}: ${e.message}`); failed++; }
  else updated++;
}
console.log(`\n  actualizados: ${updated}  fallidos: ${failed}\n`);
