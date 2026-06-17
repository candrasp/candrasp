/**
 * generate-favicon.mjs
 * Generates favicon.ico (16, 32, 48px) from favicon.svg
 * Run: node generate-favicon.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- Minimal ICO writer (pure Node.js, no dependencies) ----------
// We embed a hand-crafted 32x32 ICO using a canvas rendered from SVG via resvg/sharp
// But since those may not be installed, we use a pure-JS SVG→pixel renderer fallback.

// ---- Attempt 1: use 'sharp' (if installed) --------------------------------
async function trySharp(svgBuffer, sizes) {
  try {
    const sharp = (await import('sharp')).default;
    const pngs = await Promise.all(
      sizes.map(size =>
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );
    return pngs;
  } catch {
    return null;
  }
}

// ---- Attempt 2: use '@resvg/resvg-js' ------------------------------------
async function tryResvg(svgBuffer, sizes) {
  try {
    const { Resvg } = await import('@resvg/resvg-js');
    return sizes.map(size => {
      const resvg = new Resvg(svgBuffer, {
        fitTo: { mode: 'width', value: size },
      });
      return resvg.render().asPng();
    });
  } catch {
    return null;
  }
}

// ---- ICO assembler -------------------------------------------------------
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const HEADER_SIZE = 6;
  const ENTRY_SIZE = 16;
  const headerAndDir = HEADER_SIZE + ENTRY_SIZE * count;

  // Calculate offsets
  const offsets = [];
  let offset = headerAndDir;
  for (const buf of pngBuffers) {
    offsets.push(offset);
    offset += buf.length;
  }

  const totalSize = offset;
  const ico = Buffer.alloc(totalSize);

  // ICO header: reserved=0, type=1 (ICO), count
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(count, 4);

  // Directory entries
  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i];
    const base = HEADER_SIZE + i * ENTRY_SIZE;
    // Read size from PNG IHDR (bytes 16-23)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    ico.writeUInt8(width >= 256 ? 0 : width, base);    // width  (0 = 256)
    ico.writeUInt8(height >= 256 ? 0 : height, base + 1); // height
    ico.writeUInt8(0, base + 2);   // color count
    ico.writeUInt8(0, base + 3);   // reserved
    ico.writeUInt16LE(1, base + 4); // color planes
    ico.writeUInt16LE(32, base + 6); // bits per pixel
    ico.writeUInt32LE(buf.length, base + 8);   // size of image data
    ico.writeUInt32LE(offsets[i], base + 12);  // offset of image data
  }

  // Write PNG data
  for (let i = 0; i < count; i++) {
    pngBuffers[i].copy(ico, offsets[i]);
  }

  return ico;
}

// ---- Main ----------------------------------------------------------------
async function main() {
  const svgPath = resolve(__dirname, 'public', 'favicon.svg');
  const icoPath = resolve(__dirname, 'public', 'favicon.ico');
  const svgBuffer = readFileSync(svgPath);

  const sizes = [16, 32, 48, 256];

  console.log('🎨 Generating favicon...');

  let pngs = await trySharp(svgBuffer, sizes);
  if (pngs) {
    console.log('   ✓ Used sharp for rendering');
  } else {
    pngs = await tryResvg(svgBuffer, sizes);
    if (pngs) {
      console.log('   ✓ Used @resvg/resvg-js for rendering');
    } else {
      console.error('   ✗ Neither sharp nor @resvg/resvg-js is available.');
      console.log('   → Installing sharp...');
      const { execSync } = await import('child_process');
      execSync('npm install --save-dev sharp', { stdio: 'inherit', cwd: __dirname });
      pngs = await trySharp(svgBuffer, sizes);
      if (!pngs) {
        console.error('   ✗ Failed to install sharp. Please run: npm install --save-dev sharp');
        process.exit(1);
      }
      console.log('   ✓ sharp installed and used for rendering');
    }
  }

  const ico = buildIco(pngs);
  writeFileSync(icoPath, ico);
  console.log(`✅ favicon.ico created at: ${icoPath}`);
  console.log(`   Sizes included: ${sizes.join(', ')}px`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
