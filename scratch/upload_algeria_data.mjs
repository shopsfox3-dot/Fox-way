/**
 * رفع الولايات والبلديات الحقيقية (1541 بلدية) إلى Supabase
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'buldwdvngkglkwvwttzk';
const MGMT_TOKEN = 'sbp_bf8d5ec81ad603d8752211c92c51dba42f992995';
const MGMT_URL = `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`;

async function runSQL(sql) {
  const res = await fetch(MGMT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MGMT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SQL Error: ${err}`);
  }
  return await res.json();
}

function esc(s) { return String(s).replace(/'/g, "''"); }

// قراءة الملف
const raw = readFileSync(join(__dirname, '../src/lib/algeria_data.ts'), 'utf-8');

// استخراج ALL_WILAYAS
const wilayasMatch = raw.match(/export const ALL_WILAYAS[^=]+=\s*(\[[\s\S]*?\]);\s*\nexport/);
const wilayas = JSON.parse(wilayasMatch[1].replace(/,(\s*\])/g, '$1'));

// استخراج ALL_COMMUNES
const communesMatch = raw.match(/export const ALL_COMMUNES[^=]+=\s*(\[[\s\S]*\]);?\s*$/);
const communes = JSON.parse(communesMatch[1].replace(/,(\s*\])/g, '$1'));

console.log(`📊 البيانات: ${wilayas.length} ولاية | ${communes.length} بلدية`);

// حذف القديم
console.log('\n🗑️  حذف البيانات القديمة...');
await runSQL("DELETE FROM communes");
await runSQL("DELETE FROM wilayas");
console.log('   تم ✅');

// رفع الولايات — الجدول يستخدم (code, name, sort_order) فقط بلا id
console.log('\n📍 رفع الولايات...');
const wilayaValues = wilayas.map(w =>
  `('${esc(w.code)}', '${esc(w.name)}', '${esc(w.name)}', ${w.sort_order})`
).join(',\n');
await runSQL(`INSERT INTO wilayas (code, name, name_ar, sort_order) VALUES ${wilayaValues} ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, sort_order=EXCLUDED.sort_order`);
console.log(`   ✅ ${wilayas.length} ولاية`);

// رفع البلديات على دفعات — communes يملك id كـ serial تلقائي
console.log('\n🏘️  رفع البلديات (1541)...');
const CHUNK = 200;
let done = 0;
for (let i = 0; i < communes.length; i += CHUNK) {
  const chunk = communes.slice(i, i + CHUNK);
  // نرفع بدون id لأنه serial تلقائي، لكن نستخدم wilaya_code و name فقط
  const vals = chunk.map(c =>
    `('${esc(c.wilaya_code)}', '${esc(c.name)}', '${esc(c.name)}')`
  ).join(',\n');
  await runSQL(`INSERT INTO communes (wilaya_code, name, name_ar) VALUES ${vals}`);
  done += chunk.length;
  process.stdout.write(`\r   تم رفع ${done}/${communes.length}...`);
}
console.log(' ✅');

// تحقق نهائي
const wCount = (await runSQL("SELECT COUNT(*) as n FROM wilayas"))[0].n;
const cCount = (await runSQL("SELECT COUNT(*) as n FROM communes"))[0].n;
console.log(`\n🎉 اكتمل!`);
console.log(`   ✅ ولايات في DB: ${wCount}`);
console.log(`   ✅ بلديات في DB: ${cCount}`);
