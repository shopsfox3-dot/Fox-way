import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkCatalog() {
  console.log('--- Checking Categories ---');
  const { data: cats, error: catErr } = await supabase.from('categories').select('*');
  console.log('Categories count:', cats ? cats.length : 0, catErr ? catErr.message : '');

  console.log('--- Checking Products ---');
  const { data: prods, error: prodErr } = await supabase.from('products').select('*');
  console.log('Products count:', prods ? prods.length : 0, prodErr ? prodErr.message : '');

  if (prods && prods.length > 0) {
    console.log('Sample product:', prods[0]);
    
    // Test search query
    const { data: searchResults } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%زيت%,description.ilike.%زيت%`);
    console.log('Search test for "زيت":', searchResults ? searchResults.length : 0, 'results found');
  }
}

checkCatalog();
