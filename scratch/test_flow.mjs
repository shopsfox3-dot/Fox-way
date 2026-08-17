import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function testDeletionFlow() {
  console.log('--- Step 1: Check existing login_attempts in DB ---');
  const { data: list1 } = await supabaseAdmin.from('login_attempts').select('id, email');
  console.log('Current count in DB:', list1?.length);

  if (list1 && list1.length > 0) {
    const toDeleteId = list1[0].id;
    console.log('Deleting attempt:', toDeleteId);
    const { error: delErr } = await supabaseAdmin.from('login_attempts').delete().eq('id', toDeleteId);
    console.log('Delete error:', delErr);

    const { data: list2 } = await supabaseAdmin.from('login_attempts').select('id, email');
    console.log('Count after single deletion:', list2?.length);
  }
}

testDeletionFlow();
