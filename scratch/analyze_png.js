import fs from 'fs';
import zlib from 'zlib';

// Read PNG header and chunks
const buf = fs.readFileSync('public/logo.png');

// Check PNG signature
if (buf.readUInt32BE(0) !== 0x89504E47 || buf.readUInt32BE(4) !== 0x0D0A1A0A) {
  console.log('Not a valid PNG');
  process.exit(1);
}

let offset = 8;
let width = 0, height = 0, bitDepth = 0, colorType = 0;
const idatChunks = [];

while (offset < buf.length) {
  const length = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  const data = buf.subarray(offset + 8, offset + 8 + length);
  offset += 12 + length;

  if (type === 'IHDR') {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data.readUInt8(8);
    colorType = data.readUInt8(9);
    console.log({ width, height, bitDepth, colorType });
  } else if (type === 'IDAT') {
    idatChunks.push(data);
  } else if (type === 'IEND') {
    break;
  }
}

const compressed = Buffer.concat(idatChunks);
const decompressed = zlib.inflateSync(compressed);

console.log('Decompressed length:', decompressed.length, 'expected approx:', height * (width * 4 + 1));
