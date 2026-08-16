import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testQueries() {
  console.log('Testing search for "زيت":');
  const { data: oilResults } = await supabase
    .from('products')
    .select('name, price, unit, stock')
    .or(`name.ilike.%زيت%,description.ilike.%زيت%`);
  console.log('Oil results:', oilResults);

  console.log('Testing search for "حليب":');
  const { data: milkResults } = await supabase
    .from('products')
    .select('name, price, unit, stock')
    .or(`name.ilike.%حليب%,description.ilike.%حليب%`);
  console.log('Milk results:', milkResults);

  console.log('Testing search for "شامبو":');
  const { data: shampooResults } = await supabase
    .from('products')
    .select('name, price, unit, stock')
    .or(`name.ilike.%شامبو%,description.ilike.%شامبو%`);
  console.log('Shampoo results:', shampooResults);
}

testQueries();
