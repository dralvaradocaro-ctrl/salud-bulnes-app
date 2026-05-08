/**
 * Setea autores reales (extraídos de PDFs Drive) en 4 protocolos Hospitalizados
 * que actualmente tienen authors: null:
 *  - GCL 2.2.3-A LPP
 *  - GCL 1.7 Transfusión
 *  - HCSFB 161 PROA
 *  - GCL 3.3.2 Aislamiento
 *
 * Uso:  node scripts/update-hospitalizados-authors-v1.mjs
 *       node scripts/update-hospitalizados-authors-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Por ID directo
const BY_ID = [
  {
    id: 'da8d14ee-463c-48d0-9460-509bbc422cd7',
    label: 'GCL 2.2.3-A — LPP (6ª Ed, Mayo 2024)',
    authors: {
      elaborado: [
        'EU. María Teresa Medina Bravo — Enfermera Apoyo Of. Calidad y Seguridad del Paciente HCSFB',
      ],
      revisado: [
        'EU. Mauricio Contreras Parra — Subdirector de Gestión del Cuidado HCSFB',
      ],
      aprobado: [
        'Dr. Álvaro Lagos Llanos — Director (S) HCSFB',
      ],
    },
  },
  {
    id: 'ea66f700-760b-479b-8299-eef151e98754',
    label: 'GCL 1.7 — Transfusión (2ª Ed, Enero 2024)',
    authors: {
      elaborado: [
        'TM. Javier Zapata Neira — Encargado Calidad Laboratorio Clínico HCSFB',
        'TM. Eva López Ferrada — D.T. Laboratorio Clínico HCSFB',
      ],
      revisado: [
        'Dra. Estefanía Acuña Brevis — Subdirector Médico HCSFB',
      ],
      aprobado: [
        'Dr. Álvaro Lagos Llanos — Director (S) HCSFB',
      ],
    },
  },
  {
    id: '286e18f1-7d84-4e43-a90a-a15923f4d14c',
    label: 'HCSFB 161 — PROA (1ª Ed, Febrero 2026)',
    authors: {
      elaborado: [
        'Dra. Claudia Ihl Herbach — Médico EDF, Referente PROA HCSFB',
        'EU. María Teresa Medina Bravo — Oficina de Calidad y Seguridad del Paciente HCSFB',
      ],
      revisado: [
        'Dra. Micaela Fasani Montagna — Subdirectora Médica HCSFB',
      ],
      aprobado: [
        'Dr. Álvaro Lagos Llanos — Director HCSFB',
      ],
    },
  },
];

// Por nombre (Aislamiento no tiene UUID conocido)
const BY_NAME = [
  {
    name: 'Aislamiento',
    label: 'GCL 3.3.2 — Aislamiento (3ª Ed, Agosto 2022)',
    authors: {
      elaborado: [
        'EU. María Teresa Medina Bravo — Enfermera Oficina de Calidad y Seguridad del Paciente HCSFB',
        'EU. Paula Díaz Cartes — Enfermera Médico Quirúrgico HCSFB',
      ],
      revisado: [
        'EU. Cecilia Monsalve Ávila — Encargada PCI HCSFB',
        'Dra. Camila Gutiérrez Canales — Médica PCI HCSFB',
      ],
      aprobado: [
        'Dr. Álvaro Lagos Llanos — Director HCSFB',
      ],
    },
  },
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  HOSPITALIZADOS AUTHORS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

// --- Por ID ---
for (const entry of BY_ID) {
  const { data: topic, error } = await supabase
    .from('topics').select('name, authors').eq('id', entry.id).single();

  if (error) { console.error(`❌ Fetch ${entry.label}: ${error.message}`); continue; }

  console.log(`📋 ${entry.label}`);
  console.log(`   Nombre: ${topic.name}`);
  console.log(`   Authors actuales: ${JSON.stringify(topic.authors)}`);
  console.log(`   Authors nuevos: ${JSON.stringify(entry.authors)}`);
  console.log();

  if (!APPLY) continue;

  const { error: e } = await supabase
    .from('topics').update({ authors: entry.authors }).eq('id', entry.id);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Autores actualizados.\n`);
}

// --- Por nombre ---
for (const entry of BY_NAME) {
  const { data: topics, error } = await supabase
    .from('topics').select('id, name, authors').ilike('name', `%${entry.name}%`);

  if (error) { console.error(`❌ Fetch ${entry.label}: ${error.message}`); continue; }
  if (!topics || topics.length === 0) { console.error(`❌ No encontrado: ${entry.name}`); continue; }
  if (topics.length > 1) {
    console.warn(`⚠️  Múltiples matches para "${entry.name}":`);
    topics.forEach(t => console.warn(`   ${t.id} — ${t.name}`));
    console.warn('   Agrega id exacto para evitar ambigüedad.');
    continue;
  }

  const topic = topics[0];
  console.log(`📋 ${entry.label}`);
  console.log(`   ID: ${topic.id}`);
  console.log(`   Nombre: ${topic.name}`);
  console.log(`   Authors actuales: ${JSON.stringify(topic.authors)}`);
  console.log(`   Authors nuevos: ${JSON.stringify(entry.authors)}`);
  console.log();

  if (!APPLY) continue;

  const { error: e } = await supabase
    .from('topics').update({ authors: entry.authors }).eq('id', topic.id);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Autores actualizados.\n`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
