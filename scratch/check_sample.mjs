import fs from 'fs';

const wilayasRaw = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/wilayas.json', 'utf8'));
const c3 = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/communes_w49_w69.json', 'utf8'));

console.log('Sample wilaya:', wilayasRaw.wilayas[0]);
console.log('Sample commune from c3:', c3[0]);
console.log('Total wilayas:', wilayasRaw.wilayas.length);
console.log('Communes in c3:', c3.length);
