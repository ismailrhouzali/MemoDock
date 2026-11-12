import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(size) {
  const width = size;
  const height = size;
  
  // Create RGBA raw buffer (each line has 1 filter byte + width * 4 bytes)
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);
  
  // Theme colors: Minimalist elegant warm charcoal with subtle accent
  const bgR = 24, bgG = 24, bgB = 27; // #18181b obsidian
  const pageR = 250, pageG = 250, pageB = 249; // #fafaf9 warm paper
  const accentR = 217, accentG = 119, accentB = 6; // amber accent bookmark #d97706
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Calculate normalized coordinates
      const nx = x / width;
      const ny = y / height;
      
      // Rounded rectangle for notebook cover
      const margin = 0.12;
      const r = 0.15;
      
      // Check inside notebook
      const inX = nx >= margin && nx <= (1 - margin);
      const inY = ny >= margin && ny <= (1 - margin);
      
      // Corner roundness
      let inNotebook = false;
      if (inX && inY) {
        const cx = Math.max(margin + r, Math.min(1 - margin - r, nx));
        const cy = Math.max(margin + r, Math.min(1 - margin - r, ny));
        const distSq = (nx - cx) * (nx - cx) + (ny - cy) * (ny - cy);
        if (distSq <= r * r) {
          inNotebook = true;
        }
      }
      
      if (!inNotebook) {
        // Transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      } else {
        // Spine on left side
        const isSpine = nx <= (margin + 0.16);
        // Ribbon bookmark near right
        const isRibbon = nx >= (1 - margin - 0.28) && nx <= (1 - margin - 0.18) && ny <= (margin + 0.35);
        // Embossed lines
        const isLine1 = ny >= 0.45 && ny <= 0.49 && nx >= 0.36 && nx <= 0.75;
        const isLine2 = ny >= 0.57 && ny <= 0.61 && nx >= 0.36 && nx <= 0.65;
        
        if (isRibbon) {
          rawData[pixelOffset] = accentR;
          rawData[pixelOffset + 1] = accentG;
          rawData[pixelOffset + 2] = accentB;
          rawData[pixelOffset + 3] = 255;
        } else if (isSpine) {
          rawData[pixelOffset] = 15;
          rawData[pixelOffset + 1] = 15;
          rawData[pixelOffset + 2] = 17;
          rawData[pixelOffset + 3] = 255;
        } else if (isLine1 || isLine2) {
          rawData[pixelOffset] = 120;
          rawData[pixelOffset + 1] = 113;
          rawData[pixelOffset + 2] = 108;
          rawData[pixelOffset + 3] = 255;
        } else {
          rawData[pixelOffset] = bgR;
          rawData[pixelOffset + 1] = bgG;
          rawData[pixelOffset + 2] = bgB;
          rawData[pixelOffset + 3] = 255;
        }
      }
    }
  }
  
  // Compress IDAT
  const compressedData = zlib.deflateSync(rawData);
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type 6 (RGBA)
  ihdr.writeUInt8(0, 10); // compression 0
  ihdr.writeUInt8(0, 11); // filter 0
  ihdr.writeUInt8(0, 12); // interlace 0
  
  function createChunk(type, data) {
    const typeBuf = Buffer.from(type);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }
  
  // CRC-32 implementation
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Precompute CRC table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 32, 48, 128].forEach(size => {
  const png = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${size}x${size})`);
});

