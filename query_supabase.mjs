import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gcuevpxondfepbowvyqa.supabase.co';
const supabaseAnonKey = 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getCategories() {
  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug, order')
      .order('order', { ascending: true });
    
    if (catError) {
      console.error('Error fetching categories:', catError);
      return null;
    }
    return categories;
  } catch (error) {
    console.error('Exception in getCategories:', error);
    return null;
  }
}

async function getTopics() {
  try {
    const { data: topics, error: topicError } = await supabase
      .from('topics')
      .select('id, name, subcategory, category_id, status, has_local_protocol')
      .order('name', { ascending: true });
    
    if (topicError) {
      console.error('Error fetching topics:', topicError);
      return null;
    }
    return topics;
  } catch (error) {
    console.error('Exception in getTopics:', error);
    return null;
  }
}

async function main() {
  console.log('Fetching categories...');
  const categories = await getCategories();
  
  console.log('Fetching topics...');
  const topics = await getTopics();
  
  if (!categories || !topics) {
    console.error('Failed to fetch data');
    process.exit(1);
  }
  
  console.log('\n=== CATEGORIES ===');
  console.log(JSON.stringify(categories, null, 2));
  
  console.log('\n=== TOPICS ===');
  console.log(JSON.stringify(topics, null, 2));
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total Categories: ${categories.length}`);
  console.log(`Total Topics: ${topics.length}`);
}

main().catch(console.error);
