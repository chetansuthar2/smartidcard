const fs = require('fs');
const path = require('path');

// Read the logo file
const logoPath = path.join(__dirname, '../public/images/kpgu-logo.png');
const logoBuffer = fs.readFileSync(logoPath);

// Convert to base64
const base64Logo = logoBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64Logo}`;

console.log('KPGU Logo Base64 Data URL:');
console.log('Length:', dataUrl.length);
console.log('First 100 chars:', dataUrl.substring(0, 100));

// Save to a file for easy copying
const outputPath = path.join(__dirname, '../public/images/kpgu-logo-base64.txt');
fs.writeFileSync(outputPath, dataUrl);

console.log('\n✅ Base64 logo saved to:', outputPath);
console.log('\nYou can now use this data URL directly in your code instead of the file path.');
