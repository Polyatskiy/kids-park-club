import sharp from 'sharp';
import toIco from 'to-ico';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const svgPath = path.join(rootDir, 'assets/brand/kids-park-club-icon-balloon.svg');
const appDir = path.join(rootDir, 'app');

// Ensure app directory exists
await fs.mkdir(appDir, { recursive: true });

// Read the SVG
const svgBuffer = await fs.readFile(svgPath);

// Generate PNG at different sizes
async function generatePNG(size) {
  return await sharp(svgBuffer)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
    })
    .png()
    .toBuffer();
}

console.log('Generating icons...');

// Generate sizes for favicon.ico (16, 32, 48)
const sizes16 = await generatePNG(16);
const sizes32 = await generatePNG(32);
const sizes48 = await generatePNG(48);

// Create favicon.ico with multiple sizes
const icoBuffer = await toIco([sizes16, sizes32, sizes48]);
await fs.writeFile(path.join(appDir, 'favicon.ico'), icoBuffer);
console.log('✓ Created app/favicon.ico');

// Generate icon.png (192x192 for better quality)
const icon192 = await generatePNG(192);
await fs.writeFile(path.join(appDir, 'icon.png'), icon192);
console.log('✓ Created app/icon.png (192x192)');

// Generate apple-icon.png (180x180)
const apple180 = await generatePNG(180);
await fs.writeFile(path.join(appDir, 'apple-icon.png'), apple180);
console.log('✓ Created app/apple-icon.png (180x180)');

console.log('\n✅ All icons generated successfully!');
