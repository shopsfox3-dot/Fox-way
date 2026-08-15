import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAndCreateTable() {
  console.log('Testing query on login_attempts...');
  const { data, error } = await supabase.from('login_attempts').select('*').limit(5);

  if (error) {
    console.log('Error selecting login_attempts:', error.message, error.code);
    console.log('Creating table via raw SQL if possible...');
  } else {
    console.log('Table exists! Current rows:', data.length);
  }
}

checkAndCreateTable();
