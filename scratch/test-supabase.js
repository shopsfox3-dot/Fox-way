import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmails() {
  console.log('Fetching users from auth to find developer emails...');
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
     console.error('Error fetching users:', error);
  } else {
     if (data.users && data.users.length > 0) {
       console.log('Found these registered emails (one of them might be yours):');
       data.users.forEach(u => console.log(`- ${u.email} (Created: ${u.created_at})`));
     } else {
       console.log('No users found in auth.users.');
     }
  }
}

checkEmails();
