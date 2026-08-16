import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanCatalogData() {
  console.log('Deleting sample products...');
  const { error: prodErr } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (prodErr) console.error('Error deleting products:', prodErr);
  else console.log('Products deleted successfully.');

  console.log('Deleting sample categories...');
  const { error: catErr } = await supabase
    .from('categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (catErr) console.error('Error deleting categories:', catErr);
  else console.log('Categories deleted successfully.');
}

cleanCatalogData();
