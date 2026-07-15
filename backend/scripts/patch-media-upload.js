const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../node_modules/@medusajs/dashboard');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Add "image/avif" after "image/heic"
  content = content.replace(/([ ]*)"image\/heic",/g, (match, spaces) => {
    if (content.includes('"image/avif"')) return match; // already patched
    return `${match}\n${spaces}"image/avif",`;
  });

  // 2. Add ".avif" after ".heic"
  content = content.replace(/([ ]*)".heic",/g, (match, spaces) => {
    if (content.includes('".avif"')) return match; // already patched
    return `${match}\n${spaces}".avif",`;
  });

  if (content !== original) {
    // Ensure we can write to the file
    try {
      fs.chmodSync(filePath, 0o666);
    } catch (e) {
      // ignore chmod errors
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully patched: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      patchFile(filePath);
    }
  }
}

console.log('Running patch-media-upload script...');
walkDir(targetDir);
console.log('Finished patching.');
