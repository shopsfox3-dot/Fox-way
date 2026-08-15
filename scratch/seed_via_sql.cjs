const https = require('https');
const fs = require('fs');
const path = require('path');

const token = 'sbp_bf8d5ec81ad603d8752211c92c51dba42f992995';
const projectRef = 'buldwdvngkglkwvwttzk';

const fileContent = fs.readFileSync(path.join(__dirname, '../src/lib/algeria_data.ts'), 'utf8');

// Extract ALL_WILAYAS
const wilayasMatch = fileContent.match(/export const ALL_WILAYAS = (\[[\s\S]*?\]);/);
const wilayas = JSON.parse(wilayasMatch[1]);

// Build INSERT statement for wilayas
const valuesStr = wilayas.map(w => `('${w.code}', '${w.name.replace(/'/g, "''")}', '${w.name.replace(/'/g, "''")}', ${w.sort_order})`).join(',\n');

const sql = `
-- Allow public insert/upsert on wilayas & communes for seeding
DROP POLICY IF EXISTS "Public wilayas insert" ON public.wilayas;
CREATE POLICY "Public wilayas insert" ON public.wilayas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public wilayas update" ON public.wilayas;
CREATE POLICY "Public wilayas update" ON public.wilayas FOR UPDATE USING (true);

INSERT INTO public.wilayas (code, name, name_ar, sort_order) VALUES
${valuesStr}
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, sort_order = EXCLUDED.sort_order;
`;

const postData = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(postData);
req.end();
