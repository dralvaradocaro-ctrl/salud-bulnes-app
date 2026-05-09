/**
 * Reescribe el bloque `aisl-tabla` del protocolo de Aislamiento (GCL 3.3.2)
 * de tipo `criteria` (lista plana) a tipo `table` (3 columnas, 23 filas).
 *
 * Requiere que el renderer ya soporte type 'table' (ResponsiveTopicLayout.jsx).
 *
 * Uso:
 *   node scripts/update-aislamiento-tabla-v1.mjs           (dry-run)
 *   node scripts/update-aislamiento-tabla-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const NEW_BLOCK = {
  id: 'aisl-tabla',
  tab: 'aisl_tabla',
  type: 'table',
  color: 'amber',
  order: 1,
  title: 'Tabla 1 — Indicación de aislamiento por agente o tipo de infección',
  description: 'Tipo y duración del aislamiento según patógeno identificado',
  headers: [
    'Infección o microorganismo aislado',
    'Tipo de aislamiento',
    'Duración del aislamiento',
  ],
  rows: [
    ['ARAISP (infección o colonización)', 'Por contacto', 'Toda la hospitalización o hasta dos cultivos negativos separados por al menos 1 semana'],
    ['Adenovirus respiratorio', 'Por gotitas y por contacto', 'Toda la hospitalización'],
    ['Bordetella pertussis', 'Por gotitas', '5 días post inicio de tratamiento antibiótico efectivo'],
    ['Clostridioides difficile', 'Por contacto', '2 meses post egreso'],
    ['Fiebre tifoidea y paratifoidea', 'Por contacto', 'Toda la hospitalización'],
    ['Hantavirus', 'Por gotitas', 'Toda la hospitalización'],
    ['Impétigo', 'Por contacto', '24 horas post inicio de tratamiento antibiótico efectivo'],
    ['Infección respiratoria aguda en pacientes pediátricos sin agente etiológico identificado', 'Por gotitas', 'Toda la hospitalización'],
    ['Meningitis meningocócica o por Haemophilus influenzae', 'Por gotitas', '24 horas post inicio de tratamiento antibiótico efectivo'],
    ['Meningitis viral', 'Por contacto', '7 días post inicio de síntomas'],
    ['Mycoplasma', 'Por gotitas', 'Toda la hospitalización'],
    ['Parotiditis', 'Por gotitas', '7 días post aumento de volumen de parótidas'],
    ['Poliomielitis', 'Por contacto', 'Toda la hospitalización'],
    ['Rotavirus', 'Por contacto', 'Toda la hospitalización'],
    ['Rubeola', 'Aéreo durante sospecha, por gotitas si confirmado', '7 días post exantema'],
    ['Sarampión', 'Aéreo', '4 días post inicio de exantema'],
    ['SARS-CoV-2', 'Por contacto y gotitas', 'Toda la hospitalización'],
    ['Síndrome Guillain Barré', 'Por contacto', 'Toda la hospitalización'],
    ['Tuberculosis', 'Aéreo', 'Post 3 baciloscopias seriadas negativas'],
    ['Virus hepatitis A', 'Por contacto', 'Incontinentes o pañales y menores 3 años: 2 semanas post inicio síntomas. 3 a 14 años: 2 semanas. Mayores 14: 1 semana'],
    ['Virus influenza, parainfluenza', 'Por gotitas', '7 días post inicio de síntomas'],
    ['Virus respiratorio sincicial (VRS)', 'Por gotitas y contacto', 'Toda la hospitalización'],
    ['Virus varicela zoster', 'Por contacto y aéreo', 'Hasta que todas las lesiones se encuentren en etapa de costra'],
  ],
  source: 'Tabla 1, Protocolo HCSFB GCL 3.3.2 (Tercera Edición, Agosto 2022)',
  layout_position: 'main',
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  AISLAMIENTO — REEMPLAZAR TABLA — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const { data, error } = await supabase
  .from('topics')
  .select('id, content_blocks')
  .eq('protocol_code', 'GCL 3.3.2')
  .single();

if (error) { console.error('Fetch:', error.message); process.exit(1); }

const before = data.content_blocks || [];
const without = before.filter(b => b.id !== 'aisl-tabla');
const merged = [...without, NEW_BLOCK];

const oldBlock = before.find(b => b.id === 'aisl-tabla');

console.log(`Topic id: ${data.id}`);
console.log(`Bloques antes: ${before.length}`);
console.log(`Bloques final: ${merged.length}`);
console.log(`Bloque viejo aisl-tabla: type=${oldBlock?.type || '(no existe)'}`);
console.log(`Bloque nuevo aisl-tabla: type=table, ${NEW_BLOCK.headers.length} columnas, ${NEW_BLOCK.rows.length} filas\n`);

if (!APPLY) {
  console.log('Modo dry-run. Agregá --apply para escribir.');
  process.exit(0);
}

const { error: e } = await supabase
  .from('topics')
  .update({ content_blocks: merged, last_updated: new Date().toISOString() })
  .eq('id', data.id);

if (e) { console.error('Update:', e.message); process.exit(1); }
console.log('Actualizado.');
