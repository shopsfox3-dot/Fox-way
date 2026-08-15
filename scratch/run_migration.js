import fs from 'fs';

const projectId = 'buldwdvngkglkwvwttzk';
const token = 'sbp_5cf17f327afaab3cfbc816b48e556822d7d3906e';
const sqlPath = 'supabase/migrations/20260815165000_add_user_status_and_secure_catalog.sql';

async function runMigration() {
  try {
    const query = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Sending SQL to Supabase API...');
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error running migration:', response.status, response.statusText);
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log('Migration executed successfully:', data);
  } catch (err) {
    console.error('Failed to run migration:', err);
    process.exit(1);
  }
}

runMigration();
