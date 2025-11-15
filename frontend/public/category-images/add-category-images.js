#!/usr/bin/env node

/**
 * Helper script to add category images
 * 
 * Usage:
 * 1. Place your 4 images in a folder (e.g., ~/Downloads/category-images/)
 * 2. Run: node add-category-images.js /path/to/your/images
 * 
 * Or manually copy files:
 * - luxury-sedans.jpg
 * - sports-cars.jpg  
 * - suvs.jpg
 * - supercars.jpg
 */

const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const requiredFiles = [
  'luxury-sedans.jpg',
  'sports-cars.jpg',
  'suvs.jpg',
  'supercars.jpg'
];

console.log('Category Images Setup');
console.log('====================\n');
console.log('Target directory:', targetDir);
console.log('\nRequired files:');
requiredFiles.forEach(file => console.log(`  - ${file}`));
console.log('\nTo add images:');
console.log('1. Save your images with the exact filenames listed above');
console.log('2. Copy them to:', targetDir);
console.log('3. Restart your Next.js dev server\n');

// Check if files exist
console.log('Current status:');
requiredFiles.forEach(file => {
  const filePath = path.join(targetDir, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✓' : '✗'} ${file} ${exists ? '(found)' : '(missing)'}`);
});

