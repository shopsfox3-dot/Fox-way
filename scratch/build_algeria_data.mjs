import fs from 'fs';
import path from 'path';

const wilayasRaw = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/wilayas.json', 'utf8'));
const c1 = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/communes_w1_w23.json', 'utf8'));
const c2 = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/communes_w24_w48.json', 'utf8'));
const c3 = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/communes_w49_w69.json', 'utf8'));

console.log('Wilayas count:', wilayasRaw.length);
console.log('Sample wilaya 69:', wilayasRaw.find(w => String(w.code) === '69'));

const allCommunesRaw = [...c1, ...c2, ...c3];
console.log('Total communes count:', allCommunesRaw.length);
console.log('Sample commune 69:', allCommunesRaw.find(c => String(c.wilaya_code) === '69'));
