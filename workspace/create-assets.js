const sharp = require('sharp');
const path = require('path');

async function createGradient(filename, color1, color2, angle = '180') {
  const w = 1440, h = 810;
  let svg;
  if (angle === 'diagonal') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;
  }
  await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, 'slides', filename));
}

async function main() {
  // Title slide - deep dark blue gradient
  await createGradient('bg-title.png', '#0a0a1a', '#1a1a3e', 'diagonal');
  // Current state - dark charcoal
  await createGradient('bg-current.png', '#1a1a2e', '#2d2d44');
  // Option 1 - gradient/parallax - sky blue tones
  await createGradient('bg-gradient.png', '#0c1445', '#1a3a6e', 'diagonal');
  // Option 2 - pixel art - dark green retro
  await createGradient('bg-pixel.png', '#0a1a0a', '#1a3a1a', 'diagonal');
  // Option 3 - doodle - dark warm
  await createGradient('bg-doodle.png', '#1a1510', '#2e2518', 'diagonal');
  // Option 4 - neon - dark with purple
  await createGradient('bg-neon.png', '#0a0015', '#1a0a2e', 'diagonal');
  // Option 5 - watercolor - dark lavender
  await createGradient('bg-watercolor.png', '#1a1525', '#251a30', 'diagonal');
  // Comparison slide
  await createGradient('bg-compare.png', '#12121e', '#1e1e30');
  // Recommendation
  await createGradient('bg-recommend.png', '#0a0a1a', '#1a1a3e', 'diagonal');

  console.log('All gradient backgrounds created.');
}

main().catch(console.error);
