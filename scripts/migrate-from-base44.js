/**
 * Script de migración: Base44 → Supabase
 * Corre UNA SOLA VEZ con: node scripts/migrate-from-base44.js
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://gcuevpxondfepbowvyqa.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh';
const BASE44_URL    = 'https://guia-medica-hospitalaria-bulnes.base44.app';
const BASE44_APP_ID = '696ea57a6fe967568ba751c5';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Columnas válidas por tabla (las que definimos en schema.sql)
const COLUMNS = {
  categories:        ['id','created_at','name','slug','description','icon','color','order'],
  topics:            ['id','created_at','name','category_id','subcategory','status','title','description','tags','order','authors','published_date','last_updated','layout_mode','tipo_contenido','clasificacion_ges','has_local_protocol','content_blocks','related_topics','related_tools','clinical_summary','diagnostic_orientation','complementary_studies','initial_treatment','guarantee_days','guarantee_details','protocol_code','protocol_edition','protocol_date','protocol_validity','protocol_authors','protocol_objective','protocol_participants','protocol_flowchart','protocol_algorithm','protocol_medications','protocol_file_url'],
  clinical_tools:    ['id','created_at','name','category_id','specialty','type','status','version','description','content','input_schema','calculation_logic','result_interpretation','interpretation','reference_url','show_patient_info'],
  flow_steps:        ['id','created_at','topic_id','step_number','title','responsible','description','time_limit','location','derivation_options','notes'],
  request_templates: ['id','created_at','name','category_id','type','template_content','required_fields','destination_emails','instructions'],
  topic_versions:    ['id','created_at','topic_id','version_number','changed_by','change_description','content_snapshot'],
};

/** Elimina campos que no existen en nuestra tabla */
function clean(item, table) {
  const allowed = COLUMNS[table];
  const out = {};
  for (const key of allowed) {
    if (item[key] !== undefined) out[key] = item[key];
  }
  return out;
}

const ENTITIES = [
  { name: 'Category',        table: 'categories'        },
  { name: 'Topic',           table: 'topics'            },
  { name: 'ClinicalTool',    table: 'clinical_tools'    },
  { name: 'FlowStep',        table: 'flow_steps'        },
  { name: 'RequestTemplate', table: 'request_templates' },
  { name: 'TopicVersion',    table: 'topic_versions'    },
];

async function fetchFromBase44(entityName) {
  const url = `${BASE44_URL}/api/apps/${BASE44_APP_ID}/entities/${entityName}`;
  const res = await fetch(url, { headers: { 'X-App-Id': BASE44_APP_ID } });
  if (!res.ok) {
    console.log(`  ⚠️  ${entityName}: HTTP ${res.status} — omitiendo`);
    return [];
  }
  const json = await res.json();
  // Base44 devuelve el array directamente o dentro de una propiedad
  return Array.isArray(json) ? json : (json.items ?? json.data ?? []);
}

async function migrate() {
  console.log('🚀 Iniciando migración Base44 → Supabase\n');

  for (const { name, table } of ENTITIES) {
    process.stdout.write(`📦 ${name}... `);
    try {
      const items = await fetchFromBase44(name);
      if (!items.length) { console.log('sin datos'); continue; }

      // Insertar en lotes de 50 (limpiando campos desconocidos)
      for (let i = 0; i < items.length; i += 50) {
        const batch = items.slice(i, i + 50).map(item => clean(item, table));
        const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
        if (error) throw error;
      }
      console.log(`✅ ${items.length} registros`);
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log('\n✅ Migración completada.');
}

migrate().catch(console.error);
