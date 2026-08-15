import fs from 'fs';

const wilayasRaw = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/wilayas.json', 'utf8'));
const c3 = JSON.parse(fs.readFileSync('node_modules/geoalgeria/data/communes_w49_w69.json', 'utf8'));

console.log('wilayas keys:', typeof wilayasRaw, Array.isArray(wilayasRaw), Object.keys(wilayasRaw).slice(0, 5));
console.log('c3 keys:', typeof c3, Array.isArray(c3), Object.keys(c3).slice(0, 5));
