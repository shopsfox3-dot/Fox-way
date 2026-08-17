import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NTY3NjYsImV4cCI6MjEwMjIzMjc2Nn0.74g2F8mYv_tF3YFf4Yg_yXW7H-0Y0gW2T4mQeG9Vv8w';

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const client = createClient(supabaseUrl, anonKey);

async function checkRLS() {
  console.log('--- Checking login_attempts RLS policies ---');
  const { data: policies, error: polErr } = await adminClient.rpc('get_policies_for_login_attempts');
  
  // Let's test delete using anon client vs service role
  const { data: before } = await adminClient.from('login_attempts').select('id');
  console.log('Login attempts count in DB:', before ? before.length : 0);

  // Let's check RLS table status
  const { data: pgTables } = await adminClient
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'login_attempts');

  // Let's test a direct delete with anonClient
  const { data: delRes, error: delErr } = await client
    .from('login_attempts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Anon delete error:', delErr);
}

checkRLS();
