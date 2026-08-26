import fs from 'fs';
const buf = fs.readFileSync('public/logo.png');
console.log('File length:', buf.length);
console.log('First 16 bytes:', buf.subarray(0, 16));
console.log('Hex:', buf.subarray(0, 16).toString('hex'));
