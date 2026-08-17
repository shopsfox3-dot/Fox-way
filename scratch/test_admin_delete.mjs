import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function testAdminDelete() {
  console.log('Deleting all login attempts with service_role...');
  const { data, error, count } = await adminClient
    .from('login_attempts')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Admin delete result:', { error, count });

  const { data: remaining } = await adminClient.from('login_attempts').select('id');
  console.log('Remaining login attempts:', remaining?.length);
}

testAdminDelete();
