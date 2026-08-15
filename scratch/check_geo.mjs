import geoalgeria from 'geoalgeria';
console.log('geoalgeria keys:', Object.keys(geoalgeria || {}));
if (typeof geoalgeria === 'function') {
  console.log('geoalgeria():', geoalgeria());
}
