import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const csvPath = path.join(rootDir, 'public', 'products.csv');
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');

function parseSimpleCsv(text) {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV row splitter handling quotes
    const line = lines[i];
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    values.push(cur.trim());

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    if (rowObj.sku && rowObj.name) {
      rows.push(rowObj);
    }
  }
  return rows;
}

function generateSitemap() {
  console.log('[Sitemap Generator] Reading products from:', csvPath);
  
  let products = [];
  try {
    if (fs.existsSync(csvPath)) {
      const text = fs.readFileSync(csvPath, 'utf8');
      products = parseSimpleCsv(text);
    }
  } catch (err) {
    console.error('[Sitemap Generator] Failed to read CSV:', err);
  }

  const currentDate = new Date().toISOString().split('T')[0];
  
  // Extract unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  
  console.log(`[Sitemap Generator] Found ${products.length} products across ${categories.length} categories.`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>./</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

  // Add all categories
  categories.forEach(cat => {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    xml += `  <!-- Category: ${cat} -->
  <url>
    <loc>./#category=${encodeURIComponent(slug)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  // Add individual products with Google Image Sitemap metadata for maximum indexing!
  products.forEach(p => {
    const sku = p.sku.trim();
    const cleanName = (p.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const imgUrl = (p.imageurl || '').replace(/&/g, '&amp;');

    xml += `  <!-- Product: ${sku} -->
  <url>
    <loc>./#product=${encodeURIComponent(sku)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
`;
    if (imgUrl) {
      xml += `    <image:image>
      <image:loc>${imgUrl}</image:loc>
      <image:title>${cleanName}</image:title>
      <image:caption>${cleanName} - THREADLAB Clothing</image:caption>
    </image:image>
`;
    }
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`[Sitemap Generator] Successfully generated ${sitemapPath} with ${1 + categories.length + products.length} URLs!`);
}

generateSitemap();
