import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buldwdvngkglkwvwttzk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bGR3ZHZuZ2tnbGt3dnd0dHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY1Njc2NiwiZXhwIjoyMTAyMjMyNzY2fQ.JmffGu7hTEOQ2Oxsl9DkzR2yxMIGeDaF0GMCHFdV23s';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createOrPromoteAdmin() {
  const adminEmail = 'admin@foxway.dz';
  const adminPassword = 'AdminPassword123!';

  console.log(`Checking admin user: ${adminEmail}...`);

  // Check if user already exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  let adminUser = users.find(u => u.email === adminEmail);

  if (!adminUser) {
    console.log('Creating new admin user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { first_name: 'مدير', last_name: 'النظام' }
    });

    if (createError) {
      console.error('Error creating admin auth user:', createError);
      return;
    }
    adminUser = newUser.user;
    console.log('Admin auth user created with ID:', adminUser.id);
  } else {
    console.log('Admin user already exists in auth. ID:', adminUser.id);
    // Update password just in case
    await supabase.auth.admin.updateUserById(adminUser.id, {
      password: adminPassword,
      email_confirm: true
    });
  }

  // Upsert profile as admin and approved
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: adminUser.id,
    phone: '0600000000',
    wilaya_code: '16',
    commune_id: 101,
    first_name: 'مدير',
    last_name: 'النظام',
    full_name: 'مدير النظام',
    role: 'admin',
    status: 'approved'
  });

  if (profileError) {
    console.error('Error setting profile role to admin:', profileError);
  } else {
    console.log('SUCCESS: Admin profile configured with role="admin" and status="approved".');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
  }
}

createOrPromoteAdmin();
