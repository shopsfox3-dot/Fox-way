import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyStep7() {
  console.log('--- 1. Testing Categories Query ---');
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  console.log('Categories test:', catErr ? `Error: ${catErr.message}` : `Success (${cats.length} categories)`);

  console.log('--- 2. Testing All Products Query ---');
  const { data: prods, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .order('sort_order');
  console.log('All products test:', prodErr ? `Error: ${prodErr.message}` : `Success (${prods.length} products)`);

  console.log('--- 3. Testing Search query syntax ---');
  const { data: searchTest, error: searchErr } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%test%,description.ilike.%test%`);
  console.log('Search syntax test:', searchErr ? `Error: ${searchErr.message}` : 'Success (Syntax is valid)');

  console.log('--- 4. Testing Category Count Aggregation ---');
  const { data: countTest, error: countErr } = await supabase
    .from('products')
    .select('category_id');
  console.log('Counts test:', countErr ? `Error: ${countErr.message}` : 'Success');
}

verifyStep7();
