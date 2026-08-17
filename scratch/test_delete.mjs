import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NTY3NjYsImV4cCI6MjEwMjIzMjc2Nn0.t3Kl1t4dQ9VSxzXx04hU7pCIXFcM9gr68wXtxm_NO4Q';

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const client = createClient(supabaseUrl, anonKey);

async function testDelete() {
  console.log('Testing delete with anon key...');
  const { data, error, count } = await client
    .from('login_attempts')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Delete result:', { error, count });
}

testDelete();
