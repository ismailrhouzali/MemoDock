import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');
const primaryZipName = 'memodock-extension.zip';
const legacyZipName = 'notebook-extension.zip';

console.log('Packaging MemoDock Chrome Extension into ZIP archive...');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

try {
  const publicPrimary = path.join(publicDir, primaryZipName);
  const distPrimary = path.join(distDir, primaryZipName);
  const publicLegacy = path.join(publicDir, legacyZipName);
  const distLegacy = path.join(distDir, legacyZipName);

  [publicPrimary, distPrimary, publicLegacy, distLegacy].forEach((p) => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  // Use PowerShell Compress-Archive on Windows
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Compress-Archive -Path '${distDir}/*' -DestinationPath '${publicPrimary}' -Force"`);
  } else {
    execSync(`cd "${distDir}" && zip -r "${publicPrimary}" ./*`);
  }

  // Copy to dist and copy legacy alias
  fs.copyFileSync(publicPrimary, distPrimary);
  fs.copyFileSync(publicPrimary, publicLegacy);
  fs.copyFileSync(publicPrimary, distLegacy);

  const stat = fs.statSync(distPrimary);
  console.log(`Successfully generated ${primaryZipName} (${(stat.size / 1024).toFixed(1)} KB)`);
  console.log(`  Location 1: ${publicPrimary}`);
  console.log(`  Location 2: ${distPrimary}`);
} catch (err) {
  console.error('Failed to create ZIP package:', err);
  process.exit(1);
}
