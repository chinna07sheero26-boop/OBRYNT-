import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const docsDir = path.join(rootDir, 'docs');

console.log('[Post-Build] Starting THREADLAB GitHub Pages packaging...');

const indexHtmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('[Post-Build] Error: dist/index.html not found! Run vite build first.');
  process.exit(1);
}

// 1. Read fresh Vite-built index.html (which contains relative ./assets/ links)
const originalViteHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// 2. Locate CSS and JS assets
const assetsDir = path.join(distDir, 'assets');
let inlinedCss = '';
let inlinedJs = '';

if (fs.existsSync(assetsDir)) {
  const assetFiles = fs.readdirSync(assetsDir);
  const cssFiles = assetFiles.filter((f) => f.endsWith('.css'));
  for (const cssFile of cssFiles) {
    inlinedCss += fs.readFileSync(path.join(assetsDir, cssFile), 'utf8') + '\n';
  }

  const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));
  for (const jsFile of jsFiles) {
    inlinedJs += fs.readFileSync(path.join(assetsDir, jsFile), 'utf8') + '\n';
  }
}

// 3. Construct a 100% bulletproof self-contained standalone HTML
// CRITICAL: Escape any `</script` inside JS to `<\/script` so HTML parser does NOT terminate early!
const safeJs = inlinedJs.replace(/<\/script/gi, '<\\/script');

let standaloneHtml = originalViteHtml;

if (inlinedCss) {
  // Strip asset css links
  standaloneHtml = standaloneHtml.replace(/<link[^>]+rel=["']stylesheet["'][^>]*href=["'][^"']*assets\/[^"']+["'][^>]*\/?>/gi, '');
  standaloneHtml = standaloneHtml.replace(/<link[^>]+href=["'][^"']*assets\/[^"']+["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi, '');
  const headEnd = standaloneHtml.lastIndexOf('</head>');
  if (headEnd !== -1) {
    standaloneHtml = standaloneHtml.slice(0, headEnd) + `\n<style id="threadlab-styles">\n${inlinedCss}\n</style>\n` + standaloneHtml.slice(headEnd);
  }
}

if (safeJs) {
  // Strip asset js script tags
  standaloneHtml = standaloneHtml.replace(/<script[^>]+type=["']module["'][^>]*src=["'][^"']*assets\/[^"']+["'][^>]*><\/script>/gi, '');
  standaloneHtml = standaloneHtml.replace(/<script[^>]+src=["'][^"']*assets\/[^"']+["'][^>]*type=["']module["'][^>]*><\/script>/gi, '');
  const bodyEnd = standaloneHtml.lastIndexOf('</body>');
  if (bodyEnd !== -1) {
    standaloneHtml = standaloneHtml.slice(0, bodyEnd) + `\n<script type="module">\n${safeJs}\n</script>\n` + standaloneHtml.slice(bodyEnd);
  }
}

// Save standalone single-file into dist/index.html (and public/index-standalone.html for direct download)
fs.writeFileSync(indexHtmlPath, standaloneHtml, 'utf8');
console.log(`[Post-Build] Created self-contained dist/index.html (${standaloneHtml.length.toLocaleString()} bytes)`);

// 4. Ensure dist/404.html is identical copy for SPA fallback
const fourOhFourPath = path.join(distDir, '404.html');
fs.writeFileSync(fourOhFourPath, standaloneHtml, 'utf8');

// 5. Ensure .nojekyll in dist/ and public/
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');
fs.writeFileSync(path.join(publicDir, '.nojekyll'), '', 'utf8');

// 6. Copy standalone single-file into public/index-standalone.html for direct browser download
const publicStandaloneHtml = path.join(publicDir, 'index-standalone.html');
fs.writeFileSync(publicStandaloneHtml, standaloneHtml, 'utf8');

// 7. Mirror dist to docs for GitHub Pages "Deploy from /docs" option
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}
fs.cpSync(distDir, docsDir, { recursive: true });

// 8. Call python packager to create clean zips
try {
  execSync('python3 scripts/package-zips.py', { cwd: rootDir, stdio: 'inherit' });
} catch (zipErr) {
  console.warn('[Post-Build] Warning packaging zips:', zipErr.message);
}

console.log('[Post-Build] Packaging successfully finished!');
