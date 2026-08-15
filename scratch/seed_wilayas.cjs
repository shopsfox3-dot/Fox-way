const { createClient } = require('@supabase/supabase-js');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NTY3NjYsImV4cCI6MjEwMjIzMjc2Nn0.t3Kl1t4dQ9VSxzXx04hU7pCIXFcM9gr68wXtxm_NO4Q';
const url = 'https://buldwdvngkglkwvwttzk.supabase.co';

const supabase = createClient(url, serviceKey);

// We dynamically require algeria_data after converting to json or importing
const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync(path.join(__dirname, '../src/lib/algeria_data.ts'), 'utf8');

// Parse ALL_WILAYAS array from ts file
const wilayasMatch = fileContent.match(/export const ALL_WILAYAS = (\[[\s\S]*?\]);/);
if (!wilayasMatch) {
  console.error('Could not find ALL_WILAYAS in file');
  process.exit(1);
}

const wilayas = JSON.parse(wilayasMatch[1]);

async function seed() {
  console.log(`Seeding ${wilayas.length} wilayas to Supabase...`);
  const rows = wilayas.map(w => ({
    code: w.code,
    name: w.name,
    name_ar: w.name,
    sort_order: w.sort_order
  }));

  const { data, error } = await supabase.from('wilayas').upsert(rows, { onConflict: 'code' });
  if (error) {
    console.error('Error seeding wilayas:', error);
  } else {
    console.log('Successfully seeded wilayas into Supabase!');
  }
}

seed();
