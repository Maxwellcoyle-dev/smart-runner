// Script to generate PNG logos from SVG
// Run with: node generate-logos.js
// Requires: npm install sharp (or use an online converter)

const fs = require('fs');
const path = require('path');

console.log('To generate PNG logos from the SVG files:');
console.log('');
console.log('Option 1: Use an online converter');
console.log('  - Visit https://cloudconvert.com/svg-to-png');
console.log('  - Upload logo.svg and convert to 192x192 and 512x512');
console.log('  - Save as logo192.png and logo512.png in the public folder');
console.log('');
console.log('Option 2: Install sharp and run this script');
console.log('  - npm install sharp');
console.log('  - Then update this script to use sharp');
console.log('');
console.log('Option 3: Use ImageMagick (if installed)');
console.log('  - convert -background none -resize 192x192 logo.svg logo192.png');
console.log('  - convert -background none -resize 512x512 logo.svg logo512.png');

// Check if sharp is available
try {
  const sharp = require('sharp');
  const publicDir = path.join(__dirname, 'public');
  const logoSvg = path.join(publicDir, 'logo.svg');
  
  if (fs.existsSync(logoSvg)) {
    console.log('\nGenerating PNG logos...');
    
    sharp(logoSvg)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'logo192.png'))
      .then(() => {
        console.log('✓ Generated logo192.png');
        return sharp(logoSvg)
          .resize(512, 512)
          .png()
          .toFile(path.join(publicDir, 'logo512.png'));
      })
      .then(() => {
        console.log('✓ Generated logo512.png');
        console.log('\nDone!');
      })
      .catch(err => {
        console.error('Error generating logos:', err.message);
        console.log('\nPlease use one of the options above to generate PNG files.');
      });
  } else {
    console.log('logo.svg not found. Please ensure it exists in the public folder.');
  }
} catch (err) {
  console.log('Sharp not installed. Please use one of the options above.');
}

