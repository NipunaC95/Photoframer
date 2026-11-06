const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createSampleAssets() {
  const assetsDir = path.resolve(__dirname, '../sample-assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('Generating sample assets in', assetsDir);

  // 1. Landscape image (1920x1080)
  const svgLandscape = `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f2027" />
          <stop offset="50%" stop-color="#203a43" />
          <stop offset="100%" stop-color="#2c5364" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#g1)" />
      <circle cx="960" cy="540" r="300" fill="#06b6d4" opacity="0.3" />
      <text x="960" y="520" font-family="sans-serif" font-size="72" font-weight="bold" fill="#ffffff" text-anchor="middle">
        Landscape Photo (16:9)
      </text>
      <text x="960" y="600" font-family="sans-serif" font-size="36" fill="#94a3b8" text-anchor="middle">
        1920 × 1080 px
      </text>
    </svg>
  `;
  await sharp(Buffer.from(svgLandscape))
    .jpeg({ quality: 95 })
    .toFile(path.join(assetsDir, 'sample_landscape_16-9.jpg'));

  // 2. Portrait image (1080x1920)
  const svgPortrait = `
    <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#141e30" />
          <stop offset="100%" stop-color="#243b55" />
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#g2)" />
      <polygon points="540,400 800,1000 280,1000" fill="#3b82f6" opacity="0.4" />
      <text x="540" y="1120" font-family="sans-serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle">
        Portrait Shot (9:16)
      </text>
      <text x="540" y="1200" font-family="sans-serif" font-size="36" fill="#94a3b8" text-anchor="middle">
        1080 × 1920 px
      </text>
    </svg>
  `;
  await sharp(Buffer.from(svgPortrait))
    .jpeg({ quality: 95 })
    .toFile(path.join(assetsDir, 'sample_portrait_9-16.jpg'));

  // 3. Square image (1200x1200)
  const svgSquare = `
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e130c" />
          <stop offset="100%" stop-color="#9a8478" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" fill="url(#g3)" />
      <circle cx="600" cy="600" r="350" fill="#f59e0b" opacity="0.3" />
      <text x="600" y="580" font-family="sans-serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle">
        Square Studio (1:1)
      </text>
      <text x="600" y="660" font-family="sans-serif" font-size="32" fill="#e2e8f0" text-anchor="middle">
        1200 × 1200 px
      </text>
    </svg>
  `;
  await sharp(Buffer.from(svgSquare))
    .png()
    .toFile(path.join(assetsDir, 'sample_square_1-1.png'));

  // 4. Transparent PNG Watermark logo
  const svgWatermark = `
    <svg width="600" height="160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wmg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#22d3ee" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="140" height="140" rx="28" fill="#0891b2" />
      <path d="M40 110 L80 40 L120 110 Z" fill="#ffffff" />
      <circle cx="80" cy="85" r="14" fill="#0891b2" />
      <text x="180" y="85" font-family="sans-serif" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="2">
        ANTIGRAVITY
      </text>
      <text x="182" y="125" font-family="sans-serif" font-size="24" font-weight="600" fill="#22d3ee" letter-spacing="4">
        STUDIO PRO
      </text>
    </svg>
  `;
  await sharp(Buffer.from(svgWatermark))
    .png()
    .toFile(path.join(assetsDir, 'watermark_logo.png'));

  console.log('Sample assets generated successfully:');
  console.log('- sample_landscape_16-9.jpg');
  console.log('- sample_portrait_9-16.jpg');
  console.log('- sample_square_1-1.png');
  console.log('- watermark_logo.png');
}

createSampleAssets().catch(console.error);
