import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'public', 'products-large.csv');

// Categories with attributes to generate realistic 200,000 - 400,000 apparel items
const CATEGORY_CONFIG = {
  'Plain T-shirts': {
    code: 'PTS',
    fits: ['Boxy Oversized Fit', 'Regular Crew Fit', 'Slim Muscle Fit', 'Relaxed Drop-Shoulder', 'Classic Heavyweight'],
    materials: ['100% Combed Cotton', '100% Supima Cotton', '100% Ring-Spun Cotton', '240 GSM Heavy Cotton', '280 GSM French Terry'],
    colors: ['Onyx Black', 'Off White', 'Slate Grey', 'Muted Terracotta', 'Sand Beige', 'Forest Olive', 'Navy Blue', 'Dusty Rose', 'Charcoal', 'Espresso Brown'],
    priceMin: 599,
    priceMax: 1099,
    sizes: 'XS, S, M, L, XL, XXL',
    imageUrls: [
      '/images/product_tshirt_minimal_1793012315796.jpg',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Printed T-shirts': {
    code: 'PRT',
    fits: ['Oversized Drop-Shoulder', 'Relaxed Fit', 'Boxy Skater Cut', 'Vintage Street Fit'],
    materials: ['100% Combed Jersey', '220 GSM Cotton', 'Bio-Washed Cotton', 'Vintage Acid-Washed Cotton'],
    colors: ['Chalk White', 'Washed Charcoal', 'Pitch Black', 'Sage Green', 'Cobalt Blue', 'Vintage Plum'],
    priceMin: 799,
    priceMax: 1299,
    sizes: 'S, M, L, XL, XXL',
    imageUrls: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Gym T-shirts': {
    code: 'GYM',
    fits: ['Athletic Active Fit', 'Compression Fit', 'Sleeveless Drop-Arm', 'Engineered Muscle Fit'],
    materials: ['88% Poly 12% Spandex', '90% Nylon 10% Elastane', 'Dry-Tech Moisture Mesh', '4-Way Mechanical Stretch Poly'],
    colors: ['Charcoal Grey', 'Matte Black', 'Cobalt Blue', 'Army Olive', 'Gunmetal Steel', 'Crimson Red'],
    priceMin: 699,
    priceMax: 1399,
    sizes: 'S, M, L, XL, XXL',
    imageUrls: [
      '/images/product_gym_tee_1793012316718.jpg',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584865288642-42078afe6942?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Shirts': {
    code: 'SHT',
    fits: ['Relaxed Camp Fit', 'Tailored Classic', 'Structured Work Fit', 'Oversized Cuban Collar'],
    materials: ['100% French Flax Linen', '100% Oxford Cotton', '100% Cotton Ripstop', 'Tencel Cotton Blend'],
    colors: ['Sand Beige', 'Chambray Blue', 'Forest Olive', 'Crisp White', 'Dusty Terracotta', 'Pinstripe Charcoal'],
    priceMin: 1499,
    priceMax: 2499,
    sizes: 'S, M, L, XL, XXL',
    imageUrls: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Jeans': {
    code: 'JNS',
    fits: ['Straight Leg Selvedge', 'Slim Tapered', 'Relaxed 90s Baggy', 'Classic Regular Rise'],
    materials: ['14oz Japanese Redline Selvedge', '99% Cotton 1% Elastane', '100% Ring-Spun Twill Denim', 'Sulphur-Dyed Stay-Black Denim'],
    colors: ['Raw Indigo', 'Vintage Fade Blue', 'Stay-Black Jet', 'Washed Grey', 'Dirty Tint Blue'],
    priceMin: 1899,
    priceMax: 2999,
    sizes: '28, 30, 32, 34, 36, 38',
    imageUrls: [
      '/images/product_denim_raw_1793012316312.jpg',
      'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Trousers': {
    code: 'TRS',
    fits: ['Relaxed Wide Leg Pleated', 'Modern Slim Chino', 'Tailored Cropped Trouser', 'Gurkha Waist Trouser'],
    materials: ['70% Cotton 30% Wool Blend', '97% Cotton 3% Elastane Twill', '100% Heavy Cotton Canvas', 'Linen Wool Blend'],
    colors: ['Graphite Grey', 'Khaki Stone', 'Midnight Navy', 'Olive Drab', 'Warm Mocha'],
    priceMin: 1699,
    priceMax: 2799,
    sizes: '28, 30, 32, 34, 36',
    imageUrls: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Shorts': {
    code: 'SHR',
    fits: ['Regular 7-inch Inseam', 'Athletic 5-inch Inseam', 'Relaxed Elastic Lounge Cut', 'Utility Cargo 8-inch'],
    materials: ['55% Linen 45% Cotton', 'Quick-Dry Nylon Spandex', 'French Terry Cotton', 'Cotton Ripstop'],
    colors: ['Warm Oatmeal', 'Matte Black', 'Sage Green', 'Navy', 'Washed Terracotta'],
    priceMin: 999,
    priceMax: 1599,
    sizes: 'S, M, L, XL',
    imageUrls: [
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Joggers': {
    code: 'JGR',
    fits: ['Relaxed Tapered Cuffed', 'Tapered Cargo Jogger', 'Wide-Leg Heavy Sweatpant'],
    materials: ['400 GSM Loopback French Terry', '65% Cotton 35% Nylon', '100% Organic Fleece Cotton'],
    colors: ['Heather Grey', 'Pitch Black', 'Washed Olive', 'Deep Espresso', 'Sandstone'],
    priceMin: 1499,
    priceMax: 2299,
    sizes: 'S, M, L, XL, XXL',
    imageUrls: [
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Hoodies & Sweatshirts': {
    code: 'HOD',
    fits: ['Oversized Boxy Dropped', 'Relaxed Zip-Up', 'Classic Raglan Crew', 'Double-Layer Thermal'],
    materials: ['450 GSM Heavy French Terry', '100% Ring-Spun Cotton', '100% Organic Cotton Fleece', '400 GSM Diagonal Loopback'],
    colors: ['Sage Green', 'Faded Charcoal', 'Muted Sand', 'Vintage Jet Black', 'Bone White', 'Mineral Rust'],
    priceMin: 1899,
    priceMax: 2899,
    sizes: 'S, M, L, XL, XXL',
    imageUrls: [
      '/images/product_hoodie_mineral_1793012316379.jpg',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80',
    ],
  },
};

const ADJECTIVES = ['Heavyweight', 'Essential', 'Artisan', 'Tactical', 'Tailored', 'Minimalist', 'Brutalist', 'Relaxed', 'Raw Hem', 'Vintage Washed', 'Seamless', 'Structured', 'Everyday', 'Pro Performance'];

export function generateCatalogueCSV(totalItems = 200000, targetFile = outputPath) {
  console.log(`[Large Catalogue Generator] Generating ${totalItems.toLocaleString('en-IN')} clothing items (${(totalItems / 100000).toFixed(1)} Lakhs)...`);
  
  const writeStream = fs.createWriteStream(targetFile, { encoding: 'utf8' });
  writeStream.write('sku,name,category,price,sizes,color,description,stock,imageUrl,badge,material,fit\n');

  const categories = Object.keys(CATEGORY_CONFIG);
  let count = 0;

  for (let i = 1; i <= totalItems; i++) {
    const cat = categories[i % categories.length];
    const cfg = CATEGORY_CONFIG[cat];
    const adj = ADJECTIVES[i % ADJECTIVES.length];
    const color = cfg.colors[i % cfg.colors.length];
    const fit = cfg.fits[i % cfg.fits.length];
    const material = cfg.materials[i % cfg.materials.length];
    const img = cfg.imageUrls[i % cfg.imageUrls.length];
    const sku = `TL-${cfg.code}-${String(i).padStart(6, '0')}`;
    const name = `${adj} ${color} ${cat.replace(/s$/, '')}`;
    const price = Math.round((cfg.priceMin + (i * 37) % (cfg.priceMax - cfg.priceMin)) / 50) * 50 - 1; // e.g. 799, 849, 1299
    const stock = 10 + (i * 13) % 80;
    const badge = i % 15 === 0 ? 'Best Seller' : i % 23 === 0 ? 'New Arrival' : i % 50 === 0 ? 'Limited Drop' : '';
    const desc = `Engineered with ${material} tailored in a ${fit}. Pre-shrunk for zero deformation across wash cycles.`;

    const row = `${sku},"${name}","${cat}",${price},"${cfg.sizes}","${color}","${desc}",${stock},"${img}","${badge}","${material}","${fit}"\n`;
    writeStream.write(row);
    count++;

    if (count % 50000 === 0) {
      console.log(`[Progress] Generated ${count.toLocaleString('en-IN')} items...`);
    }
  }

  writeStream.end();
  console.log(`[Done] Successfully wrote ${count.toLocaleString('en-IN')} clothes items to ${targetFile}`);
}

// If executed directly from node
const countArg = parseInt(process.argv[2], 10) || 200000;
generateCatalogueCSV(countArg);
