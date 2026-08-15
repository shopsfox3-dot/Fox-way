const https = require('https');
const fs = require('fs');
const path = require('path');

const token = 'sbp_bf8d5ec81ad603d8752211c92c51dba42f992995';
const projectRef = 'buldwdvngkglkwvwttzk';

const fileContent = fs.readFileSync(path.join(__dirname, '../src/lib/algeria_data.ts'), 'utf8');

// Extract ALL_COMMUNES
const communesMatch = fileContent.match(/export const ALL_COMMUNES = (\[[\s\S]*?\]);/);
if (!communesMatch) {
  console.error('Could not find ALL_COMMUNES');
  process.exit(1);
}
const communes = JSON.parse(communesMatch[1]);

console.log(`Seeding ${communes.length} communes...`);

// Batch insert in chunks of 300 to avoid payload limit
async function sendBatch(batch) {
  const valuesStr = batch.map(c => `(${c.id}, '${c.wilaya_code}', '${c.name.replace(/'/g, "''")}', '${c.name.replace(/'/g, "''")}')`).join(',\n');

  const sql = `
DROP POLICY IF EXISTS "Public communes insert" ON public.communes;
CREATE POLICY "Public communes insert" ON public.communes FOR INSERT WITH CHECK (true);

INSERT INTO public.communes (id, wilaya_code, name, name_ar) VALUES
${valuesStr}
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, wilaya_code = EXCLUDED.wilaya_code;
`;

  const postData = JSON.stringify({ query: sql });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  const chunkSize = 100;
  for (let i = 0; i < communes.length; i += chunkSize) {
    const chunk = communes.slice(i, i + chunkSize);
    console.log(`Sending batch ${i / chunkSize + 1} (${chunk.length} communes)...`);
    const status = await sendBatch(chunk);
    console.log(`Batch ${i / chunkSize + 1} status: ${status}`);
  }
  console.log('Done seeding all communes!');
}

run();
