import { Product } from '../types';

export const CSV_HEADERS = [
  'sku',
  'name',
  'category',
  'audience',
  'price',
  'sizes',
  'color',
  'type',
  'tag',
  'description',
  'stock',
  'imageUrl',
  'material',
  'fit',
];

/**
 * 16 Core Products from the original OBRYNT storefront, supplemented with rich variants
 * so each of the 9 categories is thoroughly represented.
 */
export const OBRYNT_PRODUCTS: Product[] = [
  {
    sku: 'OB-001',
    id: 1,
    name: 'Classic Everyday T-Shirt',
    category: 'T-Shirts',
    cat: 'T-Shirts',
    audience: 'Men',
    aud: 'Men',
    price: 499,
    originalPrice: 699,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: '#171717',
    colorName: 'Pitch Black',
    type: 'shirt',
    tag: 'BESTSELLER',
    badge: 'BESTSELLER',
    description: '100% organic heavyweight combed cotton tailored with a refined ribbed neckline for durable daily wear.',
    stock: 75,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.8,
    reviewCount: 142,
    material: '100% Combed Cotton',
    fit: 'Regular Fit',
  },
  {
    sku: 'OB-002',
    id: 2,
    name: 'Oversized Graphic Tee',
    category: 'T-Shirts',
    cat: 'T-Shirts',
    audience: 'Unisex',
    aud: 'Unisex',
    price: 699,
    originalPrice: 899,
    sizes: ['S', 'M', 'L', 'XL'],
    color: '#d5d0c5',
    colorName: 'Chalk Stone',
    type: 'shirt',
    tag: 'TRENDING',
    badge: 'TRENDING',
    description: 'Streetwear drop-shoulder oversized silhouette featuring high-density archival graphic print on 240 GSM cotton.',
    stock: 48,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.9,
    reviewCount: 98,
    material: '240 GSM Pure Cotton',
    fit: 'Boxy Oversized',
  },
  {
    sku: 'OB-003',
    id: 3,
    name: 'Performance Gym T-Shirt',
    category: 'Gym & Sports',
    cat: 'Gym & Sports',
    audience: 'Men',
    aud: 'Men',
    price: 599,
    originalPrice: 799,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: '#243c6b',
    colorName: 'Deep Navy',
    type: 'shirt',
    tag: 'ACTIVE',
    badge: 'ACTIVE',
    description: 'Engineered micro-mesh athletic tee with quick-dry moisture wicking, 4-way mechanical stretch, and flatlock anti-chafing seams.',
    stock: 62,
    imageUrl: './images/product_gym_tee_1793012316718.jpg',
    rating: 4.7,
    reviewCount: 110,
    material: '88% Poly, 12% Spandex',
    fit: 'Athletic Active Fit',
  },
  {
    sku: 'OB-004',
    id: 4,
    name: "Women's Relaxed Tee",
    category: 'T-Shirts',
    cat: 'T-Shirts',
    audience: 'Women',
    aud: 'Women',
    price: 549,
    originalPrice: 749,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    color: '#d9a8a8',
    colorName: 'Dusty Rose',
    type: 'shirt',
    tag: 'NEW',
    badge: 'NEW',
    description: 'Silky-smooth Supima cotton crewneck cut with relaxed fluid drape, capped sleeves, and pre-shrunk wash.',
    stock: 53,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.9,
    reviewCount: 64,
    material: '100% Supima Cotton',
    fit: 'Relaxed Fluid Fit',
  },
  {
    sku: 'OB-005',
    id: 5,
    name: 'Everyday Boxer Shorts (Pack of 2)',
    category: 'Innerwear',
    cat: 'Innerwear',
    audience: 'Men',
    aud: 'Men',
    price: 299,
    originalPrice: 449,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: '#64745a',
    colorName: 'Olive Green',
    type: 'shirt',
    tag: 'ESSENTIAL',
    badge: 'ESSENTIAL',
    description: 'Ultra-breathable combed cotton boxers with plush microfiber elastic waistband, functional button fly, and relaxed leg opening.',
    stock: 80,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.6,
    reviewCount: 88,
    material: '100% Combed Cotton',
    fit: 'Relaxed Comfort Fit',
  },
  {
    sku: 'OB-006',
    id: 6,
    name: "Women's Comfort Seamless Briefs",
    category: 'Innerwear',
    cat: 'Innerwear',
    audience: 'Women',
    aud: 'Women',
    price: 249,
    originalPrice: 399,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    color: '#b87e91',
    colorName: 'Blush Mauve',
    type: 'shirt',
    tag: 'ESSENTIAL',
    badge: 'ESSENTIAL',
    description: 'Zero-seam laser-cut comfort briefs designed with modal cotton fabric for complete invisible layering under leggings and trousers.',
    stock: 90,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.8,
    reviewCount: 75,
    material: '92% MicroModal, 8% Elastane',
    fit: 'Seamless Second-Skin',
  },
  {
    sku: 'OB-007',
    id: 7,
    name: 'OBRYNT Street Sneakers',
    category: 'Footwear',
    cat: 'Footwear',
    audience: 'Unisex',
    aud: 'Unisex',
    price: 1499,
    originalPrice: 1999,
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    color: '#f4f1e8',
    colorName: 'Chalk & Gum',
    type: 'shoe',
    tag: 'POPULAR',
    badge: 'POPULAR',
    description: 'Low-profile minimalist retro trainers featuring vulcanized rubber cupsole, memory foam footbed, and supple vegan leather uppers.',
    stock: 35,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.9,
    reviewCount: 165,
    material: 'Vegan Micro-Leather & Rubber',
    fit: 'True to Size',
  },
  {
    sku: 'OB-008',
    id: 8,
    name: 'Everyday Cloud Slides',
    category: 'Footwear',
    cat: 'Footwear',
    audience: 'Unisex',
    aud: 'Unisex',
    price: 499,
    originalPrice: 699,
    sizes: ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
    color: '#171717',
    colorName: 'Matte Charcoal',
    type: 'shoe',
    tag: 'COMFORT',
    badge: 'COMFORT',
    description: 'One-piece molded high-density EVA recovery slides providing 4cm cushioned arch support for post-workout or lounge rest.',
    stock: 70,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.7,
    reviewCount: 92,
    material: 'High-Density Injection EVA',
    fit: 'Pillow Soft Fit',
  },
  {
    sku: 'OB-009',
    id: 9,
    name: 'Structured Classic Handbag',
    category: 'Bags & Accessories',
    cat: 'Bags & Accessories',
    audience: 'Women',
    aud: 'Women',
    price: 999,
    originalPrice: 1499,
    sizes: ['One Size'],
    color: '#a87851',
    colorName: 'Cognac Tan',
    type: 'bag',
    tag: 'NEW',
    badge: 'NEW',
    description: 'Architectural structured tote handbag with detachable shoulder crossbody strap, gold-tone metal zipper, and interior zip partitions.',
    stock: 28,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.8,
    reviewCount: 54,
    material: 'Textured Grained Vegan Leather',
    fit: 'Structured Silhouette',
  },
  {
    sku: 'OB-010',
    id: 10,
    name: 'OBRYNT Urban Commuter Backpack',
    category: 'Bags & Accessories',
    cat: 'Bags & Accessories',
    audience: 'Unisex',
    aud: 'Unisex',
    price: 1199,
    originalPrice: 1699,
    sizes: ['22 Liters'],
    color: '#343b36',
    colorName: 'Olive Pine',
    type: 'bag',
    tag: 'EVERYDAY',
    badge: 'EVERYDAY',
    description: 'Weather-resistant 900D ballistic matte canvas backpack featuring padded 16-inch laptop pocket, hidden passport slot, and luggage pass-through.',
    stock: 40,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.9,
    reviewCount: 81,
    material: '900D Water-Repellent Poly Canvas',
    fit: 'Ergonomic Commuter',
  },
  {
    sku: 'OB-011',
    id: 11,
    name: 'Essential Washed Baseball Cap',
    category: 'Bags & Accessories',
    cat: 'Bags & Accessories',
    audience: 'Unisex',
    aud: 'Unisex',
    price: 349,
    originalPrice: 499,
    sizes: ['Adjustable Strap'],
    color: '#171717',
    colorName: 'Washed Black',
    type: 'bag',
    tag: 'ADD-ON',
    badge: 'ADD-ON',
    description: 'Unstructured 6-panel dad cap in vintage garment-washed cotton twill with brass buckle adjuster and curved visor.',
    stock: 85,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.6,
    reviewCount: 46,
    material: '100% Cotton Twill',
    fit: 'Adjustable One-Size',
  },
  {
    sku: 'OB-012',
    id: 12,
    name: 'Velvet Matte Liquid Lipstick',
    category: 'Beauty & Makeup',
    cat: 'Beauty & Makeup',
    audience: 'Beauty',
    aud: 'Beauty',
    price: 399,
    originalPrice: 599,
    sizes: ['4.5 ml'],
    color: '#a52e35',
    colorName: 'Crimson Muse',
    type: 'bottle',
    tag: 'BEAUTY',
    badge: 'BEAUTY',
    description: 'Long-wearing non-drying velvet matte lip pigment infused with argan oil and hyaluronic spheres for all-day comfort without feathering.',
    stock: 60,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.9,
    reviewCount: 115,
    material: 'Infused with Vitamin E & Argan',
    fit: 'All-Day Wear',
  },
  {
    sku: 'OB-013',
    id: 13,
    name: 'Daily Barrier Hydrating Moisturizer',
    category: 'Beauty & Makeup',
    cat: 'Beauty & Makeup',
    audience: 'Beauty',
    aud: 'Beauty',
    price: 499,
    originalPrice: 699,
    sizes: ['50 ml'],
    color: '#e3d4c2',
    colorName: 'Porcelain Cream',
    type: 'bottle',
    tag: 'SKINCARE',
    badge: 'SKINCARE',
    description: 'Lightweight peptide & 5-ceramide barrier repair emulsion delivering 24-hour hydration with a velvety matte natural skin finish.',
    stock: 45,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.8,
    reviewCount: 92,
    material: 'Ceramides 1, 3, 6-II & Niacinamide',
    fit: 'Suitable for All Skin Types',
  },
  {
    sku: 'OB-014',
    id: 14,
    name: "Women's High-Rise Training Leggings",
    category: 'Gym & Sports',
    cat: 'Gym & Sports',
    audience: 'Women',
    aud: 'Women',
    price: 799,
    originalPrice: 1199,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    color: '#252525',
    colorName: 'Matte Obsidian',
    type: 'shirt',
    tag: 'ACTIVE',
    badge: 'ACTIVE',
    description: 'Squat-proof compression tights with wide double-layer support waistband, side drop-in phone pockets, and buttery soft brushed feel.',
    stock: 58,
    imageUrl: './images/product_gym_tee_1793012316718.jpg',
    rating: 4.9,
    reviewCount: 138,
    material: '75% Nylon, 25% Lycra',
    fit: 'High-Rise Compression',
  },
  {
    sku: 'OB-015',
    id: 15,
    name: 'Textured Pique Polo T-Shirt',
    category: 'T-Shirts',
    cat: 'T-Shirts',
    audience: 'Men',
    aud: 'Men',
    price: 649,
    originalPrice: 899,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: '#64745a',
    colorName: 'Sage Olive',
    type: 'shirt',
    tag: 'SMART CASUAL',
    badge: 'SMART CASUAL',
    description: 'Premium honeycomb pique knit cotton polo with structured knit collar, two-button placket, and subtle ribbed cuff accents.',
    stock: 44,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.7,
    reviewCount: 71,
    material: '100% Organic Pique Cotton',
    fit: 'Smart Casual Regular Fit',
  },
  {
    sku: 'OB-016',
    id: 16,
    name: 'Custom Design T-Shirt (Studio Bespoke)',
    category: 'Custom Design',
    cat: 'Custom Design',
    audience: 'Unisex',
    aud: 'Unisex',
    price: 799,
    originalPrice: 999,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    color: '#f5f4ed',
    colorName: 'Natural Off-White',
    type: 'shirt',
    tag: 'MAKE IT YOURS',
    badge: 'MAKE IT YOURS',
    description: 'Create your bespoke identity piece. Premium 220 GSM heavyweight combed cotton personalized with your custom chest or back typography.',
    stock: 999,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 5.0,
    reviewCount: 220,
    material: '220 GSM Heavyweight Cotton',
    fit: 'Bespoke Tailored Fit',
  },
  // Additional companion items for rich category depth
  {
    sku: 'OB-017',
    id: 17,
    name: 'Relaxed Fleece Zip Hoodie',
    category: 'Men',
    cat: 'Men',
    audience: 'Men',
    aud: 'Men',
    price: 1299,
    originalPrice: 1799,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: '#202020',
    colorName: 'Charcoal Noir',
    type: 'shirt',
    tag: 'BESTSELLER',
    badge: 'BESTSELLER',
    description: '380 GSM French Terry brushed cotton zip-up hoodie featuring double-layered hood and heavy metal YKK hardware.',
    stock: 40,
    imageUrl: './images/product_hoodie_mineral_1793012316379.jpg',
    rating: 4.8,
    reviewCount: 63,
    material: '100% French Terry Cotton',
    fit: 'Relaxed Street Fit',
  },
  {
    sku: 'OB-018',
    id: 18,
    name: 'Tailored Wide-Leg Trousers',
    category: 'Women',
    cat: 'Women',
    audience: 'Women',
    aud: 'Women',
    price: 1199,
    originalPrice: 1599,
    sizes: ['26', '28', '30', '32'],
    color: '#3d3835',
    colorName: 'Dark Espresso',
    type: 'shirt',
    tag: 'TRENDING',
    badge: 'TRENDING',
    description: 'Pleated wide-leg drape trousers with elasticated back comfort waistband and slant pockets.',
    stock: 32,
    imageUrl: './images/product_denim_raw_1793012316312.jpg',
    rating: 4.9,
    reviewCount: 52,
    material: 'Polyester-Rayon Viscose Blend',
    fit: 'High-Waist Wide Leg',
  },
  {
    sku: 'OB-019',
    id: 19,
    name: 'Everyday Running Trackers',
    category: 'Footwear',
    cat: 'Footwear',
    audience: 'Men',
    aud: 'Men',
    price: 1699,
    originalPrice: 2299,
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    color: '#151515',
    colorName: 'Triple Black',
    type: 'shoe',
    tag: 'ACTIVE',
    badge: 'ACTIVE',
    description: 'Responsive air-cushioned running shoes with breathable knit upper and non-slip rubber traction outsole.',
    stock: 29,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.8,
    reviewCount: 47,
    material: 'Engineered Jacquard Knit & Air Cushion',
    fit: 'Athletic Runner',
  },
  {
    sku: 'OB-020',
    id: 20,
    name: 'Botanical Cleansing Facial Oil',
    category: 'Beauty & Makeup',
    cat: 'Beauty & Makeup',
    audience: 'Beauty',
    aud: 'Beauty',
    price: 549,
    originalPrice: 749,
    sizes: ['100 ml'],
    color: '#c29a59',
    colorName: 'Golden Jojoba',
    type: 'bottle',
    tag: 'BEAUTY',
    badge: 'BEAUTY',
    description: 'Gentle emulsifying facial cleansing oil with cold-pressed jojoba, rosehip, and squalane to melt makeup effortlessly.',
    stock: 38,
    imageUrl: './images/product_tshirt_minimal_1793012315796.jpg',
    rating: 4.9,
    reviewCount: 84,
    material: '100% Organic Botanical Extracts',
    fit: 'Clean Skincare',
  },
];

export const DEFAULT_PRODUCTS = OBRYNT_PRODUCTS;

/**
 * Load products catalogue with local fallback
 */
export async function loadProductsCatalogue(): Promise<{
  products: Product[];
  source: 'csv' | 'localstorage' | 'defaults';
  errors: string[];
}> {
  // Always return the rich OBRYNT products catalogue ensuring all categories are available
  try {
    const saved = localStorage.getItem('obrynt_custom_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          products: parsed,
          source: 'localstorage',
          errors: [],
        };
      }
    }
  } catch (err) {
    console.error('Error reading saved products:', err);
  }

  return {
    products: OBRYNT_PRODUCTS,
    source: 'defaults',
    errors: [],
  };
}

export function parseCSV(raw: string): string[][] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function csvRowsToProducts(rows: string[][]): { products: Product[]; errors: string[] } {
  if (rows.length < 2) return { products: [], errors: ['CSV contains no data rows'] };
  const products: Product[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 4) continue;
    try {
      products.push({
        sku: r[0] || `OB-${i}`,
        name: r[1] || 'Product',
        category: r[2] || 'All',
        price: parseInt(r[3], 10) || 499,
        sizes: r[4] ? r[4].split(';') : ['S', 'M', 'L', 'XL'],
        color: r[5] || '#171717',
        colorName: r[5] || 'Classic',
        description: r[6] || '',
        stock: parseInt(r[7], 10) || 50,
        imageUrl: r[8] || './images/product_tshirt_minimal_1793012315796.jpg',
      });
    } catch {
      errors.push(`Row ${i} could not be parsed.`);
    }
  }

  return { products, errors };
}

export function exportCatalogueToCSV(products: Product[]): string {
  const rows = [
    CSV_HEADERS.join(','),
    ...products.map((p) =>
      [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.audience || p.aud || 'Unisex'}"`,
        p.price,
        `"${(p.sizes || []).join(';')}"`,
        `"${p.color}"`,
        `"${p.type || 'shirt'}"`,
        `"${p.tag || p.badge || ''}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.stock,
        `"${p.imageUrl}"`,
        `"${p.material || ''}"`,
        `"${p.fit || ''}"`,
      ].join(',')
    ),
  ];
  return rows.join('\n');
}

export function downloadProductsCsvFile(products: Product[]): void {
  const csv = exportCatalogueToCSV(products);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'obrynt_products.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSitemapXmlFile(products?: Product[]): void {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://obrynt.store/</loc><priority>1.0</priority></url>
  <url><loc>https://obrynt.store/#shop</loc><priority>0.9</priority></url>
  <url><loc>https://obrynt.store/#design</loc><priority>0.9</priority></url>
  <url><loc>https://obrynt.store/#categories</loc><priority>0.8</priority></url>
</urlset>`;
  const blob = new Blob([sitemap], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sitemap.xml');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

