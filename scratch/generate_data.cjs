const g = require('geoalgeria');
const fs = require('fs');

const wilayas = g.wilayas.map((w, idx) => ({
  id: Number(w.code),
  code: String(w.code).padStart(2, '0'),
  name: w.name_ar,
  sort_order: idx + 1
}));

const communes = g.communes.map((c, idx) => ({
  id: c.code_commune || (idx + 1),
  wilaya_code: String(c.wilaya_code).padStart(2, '0'),
  name: c.name_ar
}));

const content = `import type { Wilaya, Commune } from '@/types';

export const ALL_WILAYAS: Wilaya[] = ${JSON.stringify(wilayas, null, 2)};

export const ALL_COMMUNES: Commune[] = ${JSON.stringify(communes, null, 2)};
`;

fs.writeFileSync('c:/Users/DELL/Desktop/Github/Fox-way/src/lib/algeria_data.ts', content, 'utf8');
console.log('Successfully wrote static algeria_data.ts with', wilayas.length, 'wilayas and', communes.length, 'communes');
