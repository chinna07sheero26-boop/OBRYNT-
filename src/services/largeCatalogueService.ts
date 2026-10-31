import { Product, Category, ALL_CATEGORIES } from '../types';

export const LARGE_CATALOGUE_CATEGORIES: Partial<
  Record<
    Category,
    {
    code: string;
    fits: string[];
    materials: string[];
    colors: string[];
    priceMin: number;
    priceMax: number;
    sizes: string[];
    images: string[];
  }
>> = {
  'Plain T-shirts': {
    code: 'PTS',
    fits: ['Boxy Oversized Fit', 'Regular Crew Fit', 'Slim Muscle Fit', 'Relaxed Drop-Shoulder', 'Classic Heavyweight'],
    materials: ['100% Combed Cotton', '100% Supima Cotton', '100% Ring-Spun Cotton', '240 GSM Heavy Cotton', '280 GSM French Terry'],
    colors: ['Onyx Black', 'Off White', 'Slate Grey', 'Muted Terracotta', 'Sand Beige', 'Forest Olive', 'Navy Blue', 'Charcoal'],
    priceMin: 599,
    priceMax: 1099,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: [
      './images/product_tshirt_minimal_1793012315796.jpg',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Printed T-shirts': {
    code: 'PRT',
    fits: ['Oversized Drop-Shoulder', 'Relaxed Fit', 'Boxy Skater Cut', 'Vintage Street Fit'],
    materials: ['100% Combed Jersey', '220 GSM Cotton', 'Bio-Washed Cotton', 'Vintage Washed Cotton'],
    colors: ['Chalk White', 'Washed Charcoal', 'Pitch Black', 'Sage Green', 'Cobalt Blue'],
    priceMin: 799,
    priceMax: 1299,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Gym T-shirts': {
    code: 'GYM',
    fits: ['Athletic Active Fit', 'Compression Fit', 'Sleeveless Drop-Arm', 'Engineered Muscle Fit'],
    materials: ['88% Poly 12% Spandex', '90% Nylon 10% Elastane', 'Dry-Tech Moisture Mesh', '4-Way Mechanical Stretch'],
    colors: ['Charcoal Grey', 'Matte Black', 'Cobalt Blue', 'Army Olive', 'Gunmetal Steel'],
    priceMin: 699,
    priceMax: 1399,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      './images/product_gym_tee_1793012316718.jpg',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584865288642-42078afe6942?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Shirts': {
    code: 'SHT',
    fits: ['Relaxed Camp Fit', 'Tailored Classic', 'Structured Work Fit', 'Oversized Cuban Collar'],
    materials: ['100% French Flax Linen', '100% Oxford Cotton', '100% Cotton Ripstop'],
    colors: ['Sand Beige', 'Chambray Blue', 'Forest Olive', 'Crisp White', 'Dusty Terracotta'],
    priceMin: 1499,
    priceMax: 2499,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Jeans': {
    code: 'JNS',
    fits: ['Straight Leg Selvedge', 'Slim Tapered', 'Relaxed 90s Baggy', 'Classic Regular Rise'],
    materials: ['14oz Japanese Redline Selvedge', '99% Cotton 1% Elastane', '100% Ring-Spun Twill Denim'],
    colors: ['Raw Indigo', 'Vintage Fade Blue', 'Stay-Black Jet', 'Washed Grey'],
    priceMin: 1899,
    priceMax: 2999,
    sizes: ['28', '30', '32', '34', '36', '38'],
    images: [
      './images/product_denim_raw_1793012316312.jpg',
      'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Trousers': {
    code: 'TRS',
    fits: ['Relaxed Wide Leg Pleated', 'Modern Slim Chino', 'Tailored Cropped Trouser'],
    materials: ['70% Cotton 30% Wool Blend', '97% Cotton 3% Elastane Twill', '100% Heavy Cotton Canvas'],
    colors: ['Graphite Grey', 'Khaki Stone', 'Midnight Navy', 'Olive Drab'],
    priceMin: 1699,
    priceMax: 2799,
    sizes: ['28', '30', '32', '34', '36'],
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Shorts': {
    code: 'SHR',
    fits: ['Regular 7-inch Inseam', 'Athletic 5-inch Inseam', 'Relaxed Elastic Lounge Cut'],
    materials: ['55% Linen 45% Cotton', 'Quick-Dry Nylon Spandex', 'French Terry Cotton'],
    colors: ['Warm Oatmeal', 'Matte Black', 'Sage Green', 'Navy'],
    priceMin: 999,
    priceMax: 1599,
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Joggers': {
    code: 'JGR',
    fits: ['Relaxed Tapered Cuffed', 'Tapered Cargo Jogger', 'Wide-Leg Heavy Sweatpant'],
    materials: ['400 GSM Loopback French Terry', '65% Cotton 35% Nylon', '100% Organic Fleece Cotton'],
    colors: ['Heather Grey', 'Pitch Black', 'Washed Olive', 'Deep Espresso'],
    priceMin: 1499,
    priceMax: 2299,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80',
    ],
  },
  'Hoodies & Sweatshirts': {
    code: 'HOD',
    fits: ['Oversized Boxy Dropped', 'Relaxed Zip-Up', 'Classic Raglan Crew', 'Double-Layer Thermal'],
    materials: ['450 GSM Heavy French Terry', '100% Ring-Spun Cotton', '100% Organic Cotton Fleece'],
    colors: ['Sage Green', 'Faded Charcoal', 'Muted Sand', 'Vintage Jet Black', 'Bone White'],
    priceMin: 1899,
    priceMax: 2899,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      './images/product_hoodie_mineral_1793012316379.jpg',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80',
    ],
  },
};

const ADJECTIVES = [
  'Heavyweight',
  'Essential',
  'Artisan',
  'Tactical',
  'Tailored',
  'Minimalist',
  'Relaxed',
  'Raw Hem',
  'Vintage Washed',
  'Seamless',
  'Structured',
  'Everyday',
  'Pro Performance',
  'Supima Grade',
  'Loopback',
];

/**
 * Generates an apparel item by index in O(1) constant time without memory allocation.
 * This allows streaming through 2,00,000 to 4,00,000 items instantly on an Android phone.
 */
export function getProductByIndex(index: number): Product {
  const categories = ALL_CATEGORIES;
  const cat = categories[index % categories.length];
  const DEFAULT_CFG = {
    code: 'APP',
    fits: ['Regular Fit', 'Comfort Fit'],
    materials: ['100% Combed Cotton', 'Breathable Jersey'],
    colors: ['Pitch Black', 'Off White', 'Navy Blue', 'Olive Green'],
    priceMin: 499,
    priceMax: 999,
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['./images/product_tshirt_minimal_1793012315796.jpg'],
  };
  const cfg = LARGE_CATALOGUE_CATEGORIES[cat] || DEFAULT_CFG;
  const adj = ADJECTIVES[index % ADJECTIVES.length];
  const color = cfg.colors[index % cfg.colors.length];
  const fit = cfg.fits[index % cfg.fits.length];
  const material = cfg.materials[index % cfg.materials.length];
  const img = cfg.images[index % cfg.images.length];
  const sku = `OB-${cfg.code}-${String(index + 1).padStart(6, '0')}`;
  const name = `${adj} ${color} ${cat.replace(/s$/, '')}`;
  
  // Realistic Indian price ending in 99 or 49
  const price = Math.round((cfg.priceMin + ((index * 37) % (cfg.priceMax - cfg.priceMin))) / 50) * 50 - 1;
  const stock = 10 + ((index * 13) % 80);
  const badge = index % 17 === 0 ? 'Best Seller' : index % 29 === 0 ? 'New Arrival' : index % 71 === 0 ? 'Limited Drop' : undefined;

  return {
    sku,
    name,
    category: cat,
    price,
    sizes: cfg.sizes,
    color,
    description: `Premium garment crafted with ${material} and tailored in a ${fit}. Engineered for daily wear and lasting shape retention.`,
    stock,
    imageUrl: img,
    badge,
    material,
    fit,
  };
}

/**
 * Returns a slice of products for paginated viewing of 2 to 4 lakhs items
 */
export function getPaginatedLargeProducts(
  page: number,
  pageSize: number,
  totalItems: number,
  categoryFilter = 'All',
  searchQuery = ''
): { items: Product[]; totalMatches: number } {
  // If specific category is selected, calculate matching subset
  const search = searchQuery.toLowerCase().trim();
  
  if (categoryFilter === 'All' && !search) {
    const startIndex = (page - 1) * pageSize;
    const items: Product[] = [];
    for (let i = startIndex; i < Math.min(startIndex + pageSize, totalItems); i++) {
      items.push(getProductByIndex(i));
    }
    return { items, totalMatches: totalItems };
  }

  // Filtered mode
  const matchingIndices: number[] = [];
  const maxSearchScan = Math.min(totalItems, 50000); // scan reasonable window for instant UX

  for (let i = 0; i < maxSearchScan; i++) {
    const prod = getProductByIndex(i);
    if (categoryFilter !== 'All' && prod.category !== categoryFilter) continue;
    if (search) {
      const match =
        prod.name.toLowerCase().includes(search) ||
        prod.sku.toLowerCase().includes(search) ||
        prod.color.toLowerCase().includes(search) ||
        prod.description.toLowerCase().includes(search);
      if (!match) continue;
    }
    matchingIndices.push(i);
    if (matchingIndices.length >= (page * pageSize) + 200) break; // pre-fetch window
  }

  const startIndex = (page - 1) * pageSize;
  const pageIndices = matchingIndices.slice(startIndex, startIndex + pageSize);
  const items = pageIndices.map(getProductByIndex);

  // Extrapolate estimated matches for the whole large catalogue
  const totalMatches = categoryFilter !== 'All' && !search
    ? Math.round(totalItems / ALL_CATEGORIES.length)
    : matchingIndices.length;

  return { items, totalMatches };
}
