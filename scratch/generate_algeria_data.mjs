import fs from 'fs';

const wilayasRaw = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/wilayas.json', 'utf8')).wilayas;
const c1 = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/communes_w1_w23.json', 'utf8'));
const c2 = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/communes_w24_w48.json', 'utf8'));
const c3 = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/communes_w49_w69.json', 'utf8'));

const allCommunesRaw = [...c1, ...c2, ...c3];

console.log('Total Wilayas:', wilayasRaw.length);
console.log('Total Communes:', allCommunesRaw.length);

const formattedWilayas = wilayasRaw.map((w, index) => {
  const codeStr = String(w.code).padStart(2, '0');
  return {
    id: index + 1,
    code: codeStr,
    name: w.name_ar,
    sort_order: index + 1
  };
});

const formattedCommunes = allCommunesRaw.map((c, index) => {
  const wilayaCodeStr = String(c.wilaya_code).padStart(2, '0');
  return {
    id: index + 1,
    wilaya_code: wilayaCodeStr,
    name: c.name_ar
  };
});

const fileContent = `import type { Wilaya, Commune } from '@/types';

export const ALL_WILAYAS: Wilaya[] = ${JSON.stringify(formattedWilayas, null, 2)};

export const ALL_COMMUNES: Commune[] = ${JSON.stringify(formattedCommunes, null, 2)};
`;

fs.writeFileSync('src/lib/algeria_data.ts', fileContent, 'utf8');
console.log('src/lib/algeria_data.ts written successfully!');

// Test lookup for wilayas 01, 16, 58, 59, 68, 69
for (const testCode of ['01', '16', '58', '59', '68', '69']) {
  const matched = formattedCommunes.filter(c => c.wilaya_code === testCode);
  console.log(`Wilaya ${testCode} has ${matched.length} communes. Example:`, matched.slice(0, 2).map(m => m.name));
}
