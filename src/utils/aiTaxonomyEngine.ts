/**
 * OBRYNT Smart Product Recognition & AI Auto-Categorisation Engine
 * 
 * Provides:
 * - Structured taxonomy mappings for Men, Women, Footwear, Accessories, Beauty, etc.
 * - Deep keyword pattern recognition with confidence scoring
 * - Attribute extraction (sizes, colors, audience, brand, garment shape)
 * - Gemini prompt builder for AI auto-categorisation
 * - Dual-layer execution: Gemini 3.8 Flash on server-side with local taxonomy fallback
 */

export interface TaxonomyCategory {
  mainCategory: string;
  subcategories: string[];
  audience: 'Men' | 'Women' | 'Unisex' | 'Beauty' | 'Kids';
  keywords: string[];
  garmentType: 'shirt' | 'shoe' | 'bag' | 'bottle' | 'hoodie' | 'pants' | 'accessory';
}

export const OBRYNT_TAXONOMY: Record<string, TaxonomyCategory> = {
  // 1. MEN
  'Men - Shirts': {
    mainCategory: 'Men',
    subcategories: ['Shirts', 'Casual Shirts', 'Formal Shirts', 'Linen Shirts'],
    audience: 'Men',
    keywords: ['men shirt', 'formal shirt', 'casual shirt', 'button down', 'oxford shirt', 'linen shirt', 'mandarin collar', 'half sleeve shirt', 'full sleeve shirt'],
    garmentType: 'shirt',
  },
  'Men - T-Shirts': {
    mainCategory: 'T-Shirts',
    subcategories: ['T-shirts', 'Polo T-shirts', 'Oversized T-shirts', 'Plain T-shirts', 'Printed T-shirts'],
    audience: 'Men',
    keywords: ['t-shirt', 'tshirt', 'tee', 'polo', 'polo tee', 'oversize tee', 'crewneck', 'graphic tee', 'henley'],
    garmentType: 'shirt',
  },
  'Men - Jeans & Trousers': {
    mainCategory: 'Men',
    subcategories: ['Jeans', 'Trousers', 'Cargo pants', 'Track pants', 'Joggers', 'Chinos'],
    audience: 'Men',
    keywords: ['jeans', 'denim', 'trouser', 'cargo', 'track pant', 'jogger', 'chino', 'cargo pant', 'pants'],
    garmentType: 'pants',
  },
  'Men - Shorts': {
    mainCategory: 'Men',
    subcategories: ['Shorts', 'Bermuda Shorts', 'Cargo Shorts', 'Chino Shorts'],
    audience: 'Men',
    keywords: ['shorts', 'bermuda', 'cargo short', 'denim short', 'casual short'],
    garmentType: 'pants',
  },
  'Men - Underwear': {
    mainCategory: 'Innerwear',
    subcategories: ['Underwear', 'Boxers', 'Briefs', 'Trunks', 'Vests'],
    audience: 'Men',
    keywords: ['boxer', 'brief', 'trunk', 'innerwear', 'underwear', 'vest', 'undershirt', 'boxer brief'],
    garmentType: 'pants',
  },
  'Men - Outerwear': {
    mainCategory: 'Men',
    subcategories: ['Jackets', 'Hoodies', 'Pullovers', 'Sweaters', 'Blazers', 'Windbreakers'],
    audience: 'Men',
    keywords: ['jacket', 'hoodie', 'pullover', 'sweater', 'sweatshirt', 'bomber', 'blazer', 'cardigan', 'coat', 'windbreaker'],
    garmentType: 'hoodie',
  },
  'Men - Nightwear': {
    mainCategory: 'Men',
    subcategories: ['Nightwear', 'Pyjamas', 'Sleepwear', 'Loungewear'],
    audience: 'Men',
    keywords: ['pyjama', 'pajama', 'nightwear', 'sleepwear', 'loungewear', 'night suit'],
    garmentType: 'pants',
  },

  // 2. WOMEN
  'Women - Tops & Shirts': {
    mainCategory: 'Women',
    subcategories: ['Tops', 'Shirts', 'T-shirts', 'Blouses', 'Crop Tops', 'Tunics'],
    audience: 'Women',
    keywords: ['women top', 'crop top', 'blouse', 'tunic', 'women shirt', 'peplum', 'corset', 'women tee', 'camisole'],
    garmentType: 'shirt',
  },
  'Women - Dresses & Ethnic': {
    mainCategory: 'Women',
    subcategories: ['Dresses', 'Kurtis', 'Sarees', 'Gowns', 'Lehengas', 'Anarkalis'],
    audience: 'Women',
    keywords: ['dress', 'kurti', 'kurta', 'saree', 'sari', 'gown', 'maxi dress', 'midi dress', 'lehenga', 'anarkali', 'ethnic'],
    garmentType: 'shirt',
  },
  'Women - Bottoms': {
    mainCategory: 'Women',
    subcategories: ['Jeans', 'Leggings', 'Jeggings', 'Trousers', 'Palazzos', 'Skirts'],
    audience: 'Women',
    keywords: ['women jeans', 'legging', 'jegging', 'palazzo', 'skirt', 'culotte', 'women trousers', 'bell bottom'],
    garmentType: 'pants',
  },
  'Women - Innerwear & Nightwear': {
    mainCategory: 'Innerwear',
    subcategories: ['Innerwear', 'Bras', 'Panties', 'Lingerie', 'Nightwear', 'Babydolls'],
    audience: 'Women',
    keywords: ['bra', 'panty', 'panties', 'lingerie', 'nighty', 'nightwear', 'camisole', 'sports bra', 'babydoll'],
    garmentType: 'shirt',
  },
  'Women - Outerwear': {
    mainCategory: 'Women',
    subcategories: ['Jackets', 'Sweaters', 'Cardigans', 'Shrugs', 'Hoodies'],
    audience: 'Women',
    keywords: ['women jacket', 'women sweater', 'cardigan', 'shrug', 'women hoodie', 'trench coat'],
    garmentType: 'hoodie',
  },

  // 3. FOOTWEAR
  'Footwear - Shoes & Sneakers': {
    mainCategory: 'Footwear',
    subcategories: ['Sneakers', 'Shoes', 'Sports shoes', 'Running shoes', 'Walking shoes'],
    audience: 'Unisex',
    keywords: ['sneaker', 'shoe', 'sports shoe', 'running shoe', 'walking shoe', 'trainer', 'tennis shoe', 'cleats'],
    garmentType: 'shoe',
  },
  'Footwear - Formal & Boots': {
    mainCategory: 'Footwear',
    subcategories: ['Formal shoes', 'Loafers', 'Boots', 'Oxfords', 'Brogues', 'Derbys'],
    audience: 'Men',
    keywords: ['formal shoe', 'loafer', 'boot', 'oxford shoe', 'brogue', 'derby shoe', 'monk strap'],
    garmentType: 'shoe',
  },
  'Footwear - Casual & Daily': {
    mainCategory: 'Footwear',
    subcategories: ['Sandals', 'Slippers', 'Flip-flops', 'Slides', 'Clogs', 'Mules'],
    audience: 'Unisex',
    keywords: ['sandal', 'slipper', 'flip-flop', 'flipflop', 'slide', 'chappal', 'clog', 'mule', 'croc'],
    garmentType: 'shoe',
  },
  'Footwear - Women Specific': {
    mainCategory: 'Footwear',
    subcategories: ['Heels', 'Flats', 'Stilettos', 'Wedges', 'Ballerinas'],
    audience: 'Women',
    keywords: ['heels', 'stiletto', 'wedge', 'ballerina', 'flat shoe', 'block heel', 'kitten heel'],
    garmentType: 'shoe',
  },

  // 4. BAGS & ACCESSORIES
  'Accessories - Watches': {
    mainCategory: 'Bags & Accessories',
    subcategories: ['Watches', 'Analog Watches', 'Digital Watches', 'Chronographs', 'Smartwatches'],
    audience: 'Unisex',
    keywords: ['watch', 'chronograph', 'analog watch', 'digital watch', 'timepiece', 'smartwatch', 'wrist watch'],
    garmentType: 'accessory',
  },
  'Accessories - Bags': {
    mainCategory: 'Bags & Accessories',
    subcategories: ['Bags', 'Handbags', 'Backpacks', 'Tote Bags', 'Sling Bags', 'Duffle Bags', 'Wallets', 'Clutches'],
    audience: 'Unisex',
    keywords: ['bag', 'handbag', 'backpack', 'tote', 'sling bag', 'duffle', 'wallet', 'clutch', 'pouch', 'briefcase'],
    garmentType: 'bag',
  },
  'Accessories - Accessories': {
    mainCategory: 'Bags & Accessories',
    subcategories: ['Belts', 'Sunglasses', 'Caps', 'Hats', 'Jewellery', 'Ties', 'Socks'],
    audience: 'Unisex',
    keywords: ['belt', 'sunglass', 'shades', 'cap', 'hat', 'beanie', 'jewellery', 'jewelry', 'necklace', 'earring', 'bracelet', 'ring', 'tie', 'cufflink', 'socks'],
    garmentType: 'accessory',
  },

  // 5. GYM & SPORTS
  'Gym & Sports': {
    mainCategory: 'Gym & Sports',
    subcategories: ['Gym T-shirts', 'Track pants', 'Sports shorts', 'Compression Wear', 'Activewear'],
    audience: 'Unisex',
    keywords: ['gym', 'workout', 'compression', 'athletic', 'dry-fit', 'dri-fit', 'fitness', 'sportswear', 'activewear'],
    garmentType: 'shirt',
  },

  // 6. BEAUTY & MAKEUP
  'Beauty & Makeup': {
    mainCategory: 'Beauty & Makeup',
    subcategories: ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Bath & Body', 'Face Wash', 'Moisturizer', 'Serums'],
    audience: 'Beauty',
    keywords: ['serum', 'cream', 'creme', 'cleanser', 'face wash', 'moisturizer', 'lipstick', 'foundation', 'mascara', 'perfume', 'fragrance', 'shampoo', 'sunscreen', 'lotion', 'toner'],
    garmentType: 'bottle',
  },
};

export interface CategorizedResult {
  category: string;
  subcategory: string;
  audience: 'Men' | 'Women' | 'Unisex' | 'Beauty' | 'Kids';
  brand: string;
  sizes: string[];
  colors: string[];
  confidence: number;
  needsReview: boolean;
  garmentType: string;
  reason?: string;
}

/**
 * Standard sizes normalization
 */
const SIZE_PATTERNS = [
  { pattern: /\b(XXL|2XL)\b/i, size: 'XXL' },
  { pattern: /\b(XL)\b/i, size: 'XL' },
  { pattern: /\b(L|Large)\b/i, size: 'L' },
  { pattern: /\b(M|Medium)\b/i, size: 'M' },
  { pattern: /\b(S|Small)\b/i, size: 'S' },
  { pattern: /\b(XS|Extra Small)\b/i, size: 'XS' },
  { pattern: /\b(3XL|XXXL)\b/i, size: '3XL' },
  { pattern: /\b(UK\s?[5-9]|UK\s?1[0-2])\b/i, extract: true },
  { pattern: /\b(2[89]|3[0-8]|4[0-4])\s?(in|inch)?\b/i, extract: true },
];

/**
 * Common color extraction palette
 */
const COLOR_MAP: Record<string, string> = {
  black: '#171717',
  white: '#f5f5f4',
  navy: '#1e293b',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
  olive: '#4d5c43',
  grey: '#52525b',
  gray: '#52525b',
  charcoal: '#334155',
  beige: '#d5d0c5',
  brown: '#78350f',
  tan: '#b45309',
  pink: '#ec4899',
  yellow: '#eab308',
  orange: '#f97316',
  maroon: '#881337',
  purple: '#9333ea',
  gold: '#ca8a04',
  silver: '#94a3b8',
};

/**
 * Local Rule-based Taxonomy Classifier (Instant, 100% resilient fallback)
 */
export function classifyProductLocally(raw: {
  name: string;
  description?: string;
  brand?: string;
  categoryHint?: string;
  price?: number;
  attributes?: Record<string, any>;
}): CategorizedResult {
  const text = `${raw.name || ''} ${raw.description || ''} ${raw.categoryHint || ''}`.toLowerCase();

  // 1. Detect Brand
  let detectedBrand = (raw.brand || '').trim();
  if (!detectedBrand) {
    const knownBrands = ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Levis', "Levi's", 'Tommy Hilfiger', 'Calvin Klein', 'Allen Solly', 'Van Heusen', 'Peter England', 'Roadster', 'HRX', 'OBRYNT'];
    for (const b of knownBrands) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(raw.name)) {
        detectedBrand = b;
        break;
      }
    }
  }
  if (!detectedBrand) {
    detectedBrand = 'OBRYNT';
  }

  // 2. Score against all taxonomy entries
  let bestMatch: TaxonomyCategory | null = null;
  let bestScore = 0;
  let matchedKeyword = '';

  for (const [_, entry] of Object.entries(OBRYNT_TAXONOMY)) {
    let score = 0;
    for (const kw of entry.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        // Longer keyword matches get higher weight
        const weight = kw.split(' ').length * 10;
        score += weight;
        if (score > bestScore) {
          matchedKeyword = kw;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // 3. Detect Audience/Gender
  let detectedAudience: 'Men' | 'Women' | 'Unisex' | 'Beauty' | 'Kids' = 'Unisex';
  if (bestMatch?.audience) {
    detectedAudience = bestMatch.audience;
  }
  if (/\b(women|woman|female|girl|ladies|lady)\b/i.test(text)) {
    detectedAudience = 'Women';
  } else if (/\b(men|man|male|boy|gent|gents)\b/i.test(text)) {
    detectedAudience = 'Men';
  } else if (/\b(kid|kids|infant|toddler|baby)\b/i.test(text)) {
    detectedAudience = 'Kids';
  }

  // 4. Extract Sizes
  const detectedSizes: string[] = [];
  for (const sp of SIZE_PATTERNS) {
    if (sp.pattern.test(text)) {
      if (sp.size) {
        if (!detectedSizes.includes(sp.size)) detectedSizes.push(sp.size);
      } else {
        const m = text.match(sp.pattern);
        if (m && m[0] && !detectedSizes.includes(m[0].toUpperCase())) {
          detectedSizes.push(m[0].toUpperCase());
        }
      }
    }
  }
  if (detectedSizes.length === 0) {
    if (bestMatch?.garmentType === 'shoe') {
      detectedSizes.push('UK 7', 'UK 8', 'UK 9', 'UK 10');
    } else if (bestMatch?.garmentType === 'bag' || bestMatch?.garmentType === 'accessory' || bestMatch?.garmentType === 'bottle') {
      detectedSizes.push('Standard');
    } else {
      detectedSizes.push('S', 'M', 'L', 'XL');
    }
  }

  // 5. Extract Colors
  const detectedColors: string[] = [];
  for (const [colName, hex] of Object.entries(COLOR_MAP)) {
    if (new RegExp(`\\b${colName}\\b`, 'i').test(text)) {
      if (!detectedColors.includes(hex)) {
        detectedColors.push(hex);
      }
    }
  }
  if (detectedColors.length === 0) {
    detectedColors.push('#171717');
  }

  // 6. Confidence & Review Flag
  let confidence = 95;
  let needsReview = false;
  let category = 'Men';
  let subcategory = 'T-shirts';
  let garmentType = 'shirt';

  if (!bestMatch || bestScore === 0) {
    confidence = 35;
    needsReview = true;
    category = raw.categoryHint || 'T-Shirts';
    subcategory = 'Uncategorised';
    garmentType = 'shirt';
  } else {
    category = bestMatch.mainCategory;
    subcategory = bestMatch.subcategories[0] || 'Apparel';
    garmentType = bestMatch.garmentType;

    // Refine subcategory if exact match in text
    for (const sub of bestMatch.subcategories) {
      if (new RegExp(`\\b${sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
        subcategory = sub;
        break;
      }
    }

    if (bestScore < 15) {
      confidence = 65;
      needsReview = true;
    }
  }

  return {
    category,
    subcategory,
    audience: detectedAudience,
    brand: detectedBrand,
    sizes: detectedSizes,
    colors: detectedColors,
    confidence,
    needsReview,
    garmentType,
    reason: bestMatch ? `Matched keyword "${matchedKeyword}" (score: ${bestScore})` : 'No distinct taxonomy patterns found; flagged for merchant review.',
  };
}

/**
 * System prompt and JSON instructions for Gemini 3.8 Flash model
 */
export function buildGeminiCategorizationPrompt(items: Array<{
  id: string;
  name: string;
  description?: string;
  brand?: string;
  categoryHint?: string;
  price?: number;
}>): string {
  return `You are an expert fashion merchandising and catalog AI for OBRYNT International Fashion Marketplace.
Your job is to analyze the following ${items.length} products and assign each product to the exact correct Category and Subcategory.

AVAILABLE MAIN CATEGORIES:
- "Men"
- "Women"
- "Footwear"
- "Bags & Accessories"
- "T-Shirts"
- "Gym & Sports"
- "Innerwear"
- "Beauty & Makeup"
- "Custom Design"

DETAILED SUBCATEGORY GUIDELINES:
- Men: "Shirts", "T-shirts", "Polo T-shirts", "Jeans", "Trousers", "Cargo pants", "Track pants", "Joggers", "Shorts", "Underwear", "Jackets", "Hoodies", "Pullovers", "Sweaters", "Nightwear"
- Women: "Tops", "Shirts", "T-shirts", "Dresses", "Kurtis", "Sarees", "Jeans", "Leggings", "Nightwear", "Innerwear", "Jackets", "Sweaters"
- Footwear: "Shoes", "Sneakers", "Formal shoes", "Sandals", "Slippers", "Flip-flops", "Heels", "Sports shoes"
- Bags & Accessories: "Watches", "Bags", "Wallets", "Belts", "Sunglasses", "Caps", "Jewellery"
- Beauty & Makeup: "Skincare", "Makeup", "Fragrance", "Haircare", "Bath & Body"

RULES:
1. NEVER invent details that are not supported by the product text.
2. If gender/audience is ambiguous, set audience to "Unisex".
3. Set confidence between 0 and 100. If confidence is below 75 or the product title is confusing/vague, set needsReview = true.
4. Extract brand name if present (e.g. from title), otherwise default to "OBRYNT".
5. Extract standard sizes and colors from text where found.

INPUT PRODUCTS:
${JSON.stringify(items, null, 2)}

Return a valid JSON array of objects with the following schema:
[
  {
    "id": "string (matches input id)",
    "category": "string (one of the main categories above)",
    "subcategory": "string (matching subcategory)",
    "audience": "Men" | "Women" | "Unisex" | "Beauty" | "Kids",
    "brand": "string",
    "sizes": ["string"],
    "colors": ["string (hex color or name)"],
    "confidence": number,
    "needsReview": boolean,
    "reason": "brief reason for classification"
  }
]
`;
}
