import * as XLSX from 'xlsx';
import { Product, BulkImportItem, BulkImportReport } from '../types';
import { classifyProductLocally } from '../utils/aiTaxonomyEngine';

export interface RawImportProduct {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  originalPrice?: number;
  stock: number;
  brand: string;
  categoryHint?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  supplierProductId?: string;
  supplierName?: string;
  sourceFile?: string;
  raw: Record<string, any>;
}

/**
 * Universal file parser supporting CSV, Excel (.xlsx, .xls), and JSON
 */
export async function parseBulkFile(file: File): Promise<{
  products: RawImportProduct[];
  sourceName: string;
  format: 'csv' | 'excel' | 'json';
  errors: string[];
}> {
  const fileName = file.name.toLowerCase();
  const errors: string[] = [];

  if (fileName.endsWith('.json')) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const array = Array.isArray(parsed) ? parsed : parsed.products || parsed.items || [parsed];
      const products = array.map((item: any, idx: number) => normalizeRawObject(item, idx, file.name));
      return { products, sourceName: file.name, format: 'json', errors };
    } catch (err: any) {
      errors.push(`JSON parsing error: ${err?.message}`);
      return { products: [], sourceName: file.name, format: 'json', errors };
    }
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Workbook contains no sheets');
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const products = rows.map((row, idx) => normalizeRawObject(row, idx, file.name));
      return { products, sourceName: file.name, format: 'excel', errors };
    } catch (err: any) {
      errors.push(`Excel parsing error: ${err?.message}`);
      return { products: [], sourceName: file.name, format: 'excel', errors };
    }
  }

  // Fallback to CSV / text parsing
  try {
    const text = await file.text();
    const rows = parseCSVText(text);
    if (rows.length < 2) {
      errors.push('CSV contains no data rows');
      return { products: [], sourceName: file.name, format: 'csv', errors };
    }
    const headers = rows[0].map((h) => h.trim());
    const products: RawImportProduct[] = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r.length === 0 || (r.length === 1 && !r[0].trim())) continue;
      const obj: Record<string, any> = {};
      headers.forEach((h, hIdx) => {
        obj[h] = r[hIdx] !== undefined ? r[hIdx] : '';
      });
      products.push(normalizeRawObject(obj, i - 1, file.name));
    }

    return { products, sourceName: file.name, format: 'csv', errors };
  } catch (err: any) {
    errors.push(`CSV parsing error: ${err?.message}`);
    return { products: [], sourceName: file.name, format: 'csv', errors };
  }
}

/**
 * Robust CSV Line Parser handling quotes and commas
 */
function parseCSVText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
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

/**
 * Normalizes loose key-value pairs into standardized RawImportProduct
 */
function normalizeRawObject(row: Record<string, any>, index: number, sourceFile: string): RawImportProduct {
  const findValue = (keys: string[]): any => {
    const lowerKeys = keys.map((k) => k.toLowerCase());
    for (const [k, v] of Object.entries(row)) {
      if (lowerKeys.includes(k.toLowerCase().trim())) {
        return v;
      }
    }
    return undefined;
  };

  const nameVal = findValue(['name', 'title', 'product_name', 'product title', 'item_name', 'item', 'product']) || `Imported Item #${index + 1}`;
  const descVal = findValue(['description', 'desc', 'details', 'specs', 'product_description', 'summary']) || '';
  const skuVal = findValue(['sku', 'item_code', 'code', 'product_id', 'id']) || `OB-IMP-${Date.now().toString(36).slice(-4)}-${index + 1}`;
  const priceVal = Number(findValue(['price', 'retail_price', 'selling_price', 'sale_price', 'amount', 'rate'])) || 799;
  const origPriceVal = Number(findValue(['original_price', 'mrp', 'list_price', 'regular_price', 'base_price'])) || Math.round(priceVal * 1.35);
  const stockVal = Number(findValue(['stock', 'quantity', 'qty', 'inventory', 'units', 'count'])) || 50;
  const brandVal = findValue(['brand', 'brand_name', 'vendor', 'manufacturer', 'company']) || 'OBRYNT';
  const catHint = findValue(['category', 'sub_category', 'department', 'type', 'cat', 'collection']);
  const supProdId = findValue(['supplier_product_id', 'external_id', 'supplier_sku', 'supplier_id', 'feed_id']);
  const supName = findValue(['supplier_name', 'supplier', 'source']);

  // Extract Images
  const imgField = findValue(['image', 'image_url', 'images', 'photos', 'photo', 'gallery', 'picture', 'thumbnail']);
  let images: string[] = [];
  if (Array.isArray(imgField)) {
    images = imgField.map(String).filter(Boolean);
  } else if (typeof imgField === 'string' && imgField.trim()) {
    images = imgField
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http') || s.startsWith('/') || s.startsWith('data:'));
  }
  if (images.length === 0) {
    images = ['/images/product_tshirt_minimal_1793012315796.jpg'];
  }

  // Extract Sizes
  const sizeField = findValue(['sizes', 'size', 'available_sizes', 'size_range']);
  let sizes: string[] = [];
  if (Array.isArray(sizeField)) {
    sizes = sizeField.map(String).filter(Boolean);
  } else if (typeof sizeField === 'string' && sizeField.trim()) {
    sizes = sizeField
      .split(/[,;|]/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }

  // Extract Colors
  const colorField = findValue(['colors', 'color', 'colour', 'available_colors']);
  let colors: string[] = [];
  if (Array.isArray(colorField)) {
    colors = colorField.map(String).filter(Boolean);
  } else if (typeof colorField === 'string' && colorField.trim()) {
    colors = colorField
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return {
    id: `raw-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    name: String(nameVal).trim(),
    description: String(descVal).trim(),
    sku: String(skuVal).trim().toUpperCase(),
    price: priceVal,
    originalPrice: origPriceVal,
    stock: stockVal,
    brand: String(brandVal).trim(),
    categoryHint: catHint ? String(catHint).trim() : undefined,
    images,
    sizes,
    colors,
    supplierProductId: supProdId ? String(supProdId).trim() : undefined,
    supplierName: supName ? String(supName).trim() : undefined,
    sourceFile,
    raw: row,
  };
}

/**
 * AI Categorization Processor with Chunking and Fallback
 */
export async function categorizeImportBatch(
  rawItems: RawImportProduct[],
  existingCatalogue: Product[],
  onProgress?: (processed: number, total: number, currentItemName: string) => void
): Promise<BulkImportItem[]> {
  const total = rawItems.length;
  const results: BulkImportItem[] = [];
  const BATCH_SIZE = 25;

  // Build duplicate lookup maps from existing catalogue
  const existingSkuMap = new Set(existingCatalogue.map((p) => p.sku.toUpperCase()));
  const existingSupIdMap = new Set(
    existingCatalogue.map((p) => (p.supplierProductId || '').toLowerCase()).filter(Boolean)
  );
  const existingNameMap = new Map<string, string>();
  existingCatalogue.forEach((p) => {
    const key = `${p.name.toLowerCase()}|${(p.brand || 'OBRYNT').toLowerCase()}`;
    existingNameMap.set(key, p.sku);
  });

  // Also track seen in current batch to detect duplicates within the import file
  const seenBatchSkus = new Set<string>();
  const seenBatchNames = new Set<string>();

  for (let i = 0; i < rawItems.length; i += BATCH_SIZE) {
    const chunk = rawItems.slice(i, i + BATCH_SIZE);

    // Call server AI categorization endpoint
    let aiCategorizedMap = new Map<string, any>();
    try {
      const response = await fetch('/api/products/ai-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: chunk.map((it) => ({
            id: it.id,
            name: it.name,
            description: it.description,
            brand: it.brand,
            categoryHint: it.categoryHint,
            price: it.price,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.categorized)) {
          data.categorized.forEach((c: any) => aiCategorizedMap.set(c.id, c));
        }
      }
    } catch (err) {
      console.warn('[OBRYNT AI Import] Network note on server AI categorizer, falling back to local taxonomy:', err);
    }

    // Process chunk items
    for (const raw of chunk) {
      // 1. Get AI or Local Classification
      let aiResult = aiCategorizedMap.get(raw.id);
      if (!aiResult) {
        aiResult = classifyProductLocally({
          name: raw.name,
          description: raw.description,
          brand: raw.brand,
          categoryHint: raw.categoryHint,
          price: raw.price,
        });
      }

      // Merge sizes and colors
      const finalSizes = raw.sizes.length > 0 ? raw.sizes : aiResult.sizes || ['S', 'M', 'L', 'XL'];
      const finalColors = raw.colors.length > 0 ? raw.colors : aiResult.colors || ['#171717'];
      const finalBrand = raw.brand && raw.brand !== 'OBRYNT' ? raw.brand : aiResult.brand || 'OBRYNT';

      // 2. Duplicate Check
      let isDuplicate = false;
      let duplicateOfSku: string | undefined = undefined;

      const normNameKey = `${raw.name.toLowerCase()}|${finalBrand.toLowerCase()}`;
      if (existingSkuMap.has(raw.sku)) {
        isDuplicate = true;
        duplicateOfSku = raw.sku;
      } else if (raw.supplierProductId && existingSupIdMap.has(raw.supplierProductId.toLowerCase())) {
        isDuplicate = true;
        duplicateOfSku = `Supplier ID: ${raw.supplierProductId}`;
      } else if (existingNameMap.has(normNameKey)) {
        isDuplicate = true;
        duplicateOfSku = existingNameMap.get(normNameKey);
      } else if (seenBatchSkus.has(raw.sku) || seenBatchNames.has(normNameKey)) {
        isDuplicate = true;
        duplicateOfSku = `Duplicate in file (${raw.sku})`;
      }

      seenBatchSkus.add(raw.sku);
      seenBatchNames.add(normNameKey);

      // 3. Assemble Product Model
      const productModel: Product = {
        sku: raw.sku,
        name: raw.name,
        description: raw.description || `${raw.name} from ${finalBrand}. Quality checked for OBRYNT international marketplace.`,
        category: aiResult.category || 'Men',
        cat: aiResult.category || 'Men',
        subcategory: aiResult.subcategory || 'T-shirts',
        audience: aiResult.audience || 'Unisex',
        aud: aiResult.audience || 'Unisex',
        brand: finalBrand,
        brandName: finalBrand,
        price: raw.price,
        originalPrice: raw.originalPrice || Math.round(raw.price * 1.35),
        stock: raw.stock,
        status: isDuplicate ? 'draft' : aiResult.needsReview ? 'draft' : 'active',
        isPublished: !isDuplicate && !aiResult.needsReview,
        imageUrl: raw.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg',
        galleryUrls: raw.images.slice(1),
        sizes: finalSizes,
        colors: finalColors,
        color: finalColors[0] || '#171717',
        colorName: 'Standard',
        confidence: aiResult.confidence || 90,
        needsReview: Boolean(aiResult.needsReview),
        supplierProductId: raw.supplierProductId,
        sourceFile: raw.sourceFile,
        supplierName: raw.supplierName,
        tag: isDuplicate ? 'DUPLICATE' : aiResult.needsReview ? 'NEEDS REVIEW' : 'IMPORTED',
      };

      const itemStatus: BulkImportItem['status'] = isDuplicate
        ? 'needs_review'
        : aiResult.needsReview
        ? 'needs_review'
        : 'categorized';

      results.push({
        id: raw.id,
        raw: raw.raw,
        product: productModel,
        confidence: aiResult.confidence || 90,
        category: aiResult.category || 'Men',
        subcategory: aiResult.subcategory || 'T-shirts',
        audience: aiResult.audience || 'Unisex',
        brand: finalBrand,
        isDuplicate,
        duplicateOfSku,
        status: itemStatus,
        error: isDuplicate ? `Duplicate item identified (matches ${duplicateOfSku})` : undefined,
      });

      if (onProgress) {
        onProgress(results.length, total, raw.name);
      }
    }
  }

  return results;
}

/**
 * Generate a ready-to-test mixed demo feed containing varied categories
 */
export function generateMixedDemoFeed(count: number = 30): RawImportProduct[] {
  const SAMPLE_ITEMS = [
    { name: 'Slim Fit Oxford Cotton Shirt', desc: 'Premium button down long sleeve shirt for work and evenings', price: 1299, mrp: 1899, brand: 'OBRYNT Men', cat: 'Men' },
    { name: 'Vintage Heavyweight Washed Graphic Tee', desc: '240 GSM drop shoulder streetwear boxy tee', price: 799, mrp: 1199, brand: 'OBRYNT Street', cat: 'T-Shirts' },
    { name: 'Air Mesh High Cushion Running Shoes', desc: 'Breathable road running shoes with responsive EVA sole', price: 2499, mrp: 3499, brand: 'Velocity Footwear', cat: 'Footwear' },
    { name: 'Leather Automatic Mechanical Watch', desc: 'Classic skeleton dial wristwatch with genuine leather strap', price: 3499, mrp: 4999, brand: 'Chrono Lux', cat: 'Accessories' },
    { name: 'Floral Print Georgette Anarkali Kurti', desc: 'Graceful flared Indian ethnic kurti with gota patti detailing', price: 1499, mrp: 2199, brand: 'Aura Ethnic', cat: 'Women' },
    { name: 'Relaxed Tapered Fit Stretch Jeans', desc: 'Mid-rise 5-pocket denim trousers with 2% elastane flex', price: 1599, mrp: 2299, brand: 'Denim Lab', cat: 'Men' },
    { name: 'Dry-Tech Athletic Compression Track Pants', desc: 'Moisture wicking training joggers for running and workout', price: 899, mrp: 1299, brand: 'ProFit Active', cat: 'Gym & Sports' },
    { name: 'Organic Bamboo Fibre Boxers (Pack of 3)', desc: 'Ultra soft anti-chafing breathable innerwear trunks', price: 699, mrp: 999, brand: 'Comfort Base', cat: 'Innerwear' },
    { name: 'Botanical Hyaluronic Acid Hydrating Serum', desc: 'Pure plant-based facial moisture serum for glowing skin', price: 649, mrp: 899, brand: 'Pure Botanic', cat: 'Beauty' },
    { name: 'Water-Resistant Commuter Laptop Backpack', desc: '15.6 inch padded laptop compartment with anti-theft zipper', price: 1799, mrp: 2599, brand: 'Urban Gear', cat: 'Bags' },
    { name: 'Slip-On Orthopedic Comfort Slides', desc: 'Ergonomic daily wear waterproof bathroom and garden slippers', price: 499, mrp: 799, brand: 'SoleComfort', cat: 'Footwear' },
    { name: 'Classic Aviator Polarized Sunglasses', desc: 'UV400 metal frame luxury shades with anti-glare lenses', price: 999, mrp: 1499, brand: 'Vision Optic', cat: 'Accessories' },
    { name: 'Cotton Ribbed Halter Neck Crop Top', desc: 'Sleeveless breathable summer crop top for women', price: 499, mrp: 749, brand: 'OBRYNT Studio', cat: 'Women' },
    { name: 'Heavy French Terry Pullover Hoodie', desc: '380 GSM fleece lined winter hooded sweatshirt with kangaroo pocket', price: 1899, mrp: 2699, brand: 'OBRYNT Atelier', cat: 'Men' },
    { name: 'Genuine Full Grain Leather Dress Belt', desc: 'Reversible formal pin buckle belt for suits and trousers', price: 799, mrp: 1199, brand: 'Heritage Leather', cat: 'Accessories' },
  ];

  const generated: RawImportProduct[] = [];
  for (let i = 0; i < count; i++) {
    const base = SAMPLE_ITEMS[i % SAMPLE_ITEMS.length];
    const itemNum = i + 1;
    generated.push({
      id: `demo-${Date.now()}-${itemNum}`,
      name: `${base.name} #${itemNum}`,
      description: base.desc,
      sku: `OB-BULK-${String(itemNum).padStart(4, '0')}`,
      price: base.price,
      originalPrice: base.mrp,
      stock: 30 + (itemNum % 70),
      brand: base.brand,
      categoryHint: base.cat,
      images: ['/images/product_tshirt_minimal_1793012315796.jpg'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['#171717'],
      supplierProductId: `SUP-FEED-${1000 + itemNum}`,
      sourceFile: 'obrynt_mixed_supplier_feed.csv',
      raw: {
        'Product Title': `${base.name} #${itemNum}`,
        'SKU': `OB-BULK-${String(itemNum).padStart(4, '0')}`,
        'Selling Price': base.price,
        'MRP': base.mrp,
        'Stock': 50,
        'Brand': base.brand,
      },
    });
  }

  return generated;
}

/**
 * Downloads a clean Excel / CSV template for bulk imports
 */
export function downloadBulkImportTemplate(format: 'csv' | 'xlsx' = 'xlsx'): void {
  const sampleData = [
    {
      'Product Title': 'Heavyweight Oversized Streetwear T-Shirt',
      'SKU': 'OB-TSH-001',
      'Selling Price': 899,
      'MRP': 1299,
      'Stock': 100,
      'Brand': 'OBRYNT',
      'Description': '240 GSM organic combed cotton drop shoulder tee',
      'Sizes': 'S, M, L, XL, XXL',
      'Colors': 'Black, White, Navy',
      'Image URL': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      'Supplier Product ID': 'SUP-001',
      'Supplier Name': 'Atelier Textile Mill',
    },
    {
      'Product Title': 'Air Mesh Lightweight Running Sneakers',
      'SKU': 'OB-SHOE-001',
      'Selling Price': 2299,
      'MRP': 3199,
      'Stock': 45,
      'Brand': 'Velocity',
      'Description': 'Cushioned athletic sneakers for marathon running',
      'Sizes': 'UK 7, UK 8, UK 9, UK 10',
      'Colors': 'White, Grey',
      'Image URL': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'Supplier Product ID': 'SUP-002',
      'Supplier Name': 'Apex Footwear Ltd',
    },
    {
      'Product Title': 'Automatic Skeleton Mechanical Wrist Watch',
      'SKU': 'OB-WAT-001',
      'Selling Price': 3499,
      'MRP': 4999,
      'Stock': 20,
      'Brand': 'Chrono Lux',
      'Description': 'Waterproof sapphire glass chronograph watch',
      'Sizes': 'Standard',
      'Colors': 'Silver, Black',
      'Image URL': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800',
      'Supplier Product ID': 'SUP-003',
      'Supplier Name': 'Timepiece Masters',
    },
    {
      'Product Title': 'Floral Embroidered Cotton Kurti',
      'SKU': 'OB-KUR-001',
      'Selling Price': 1199,
      'MRP': 1699,
      'Stock': 60,
      'Brand': 'Aura Ethnic',
      'Description': 'Flared traditional ethnic wear tunic for women',
      'Sizes': 'S, M, L, XL',
      'Colors': 'Teal, Mustard',
      'Image URL': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      'Supplier Product ID': 'SUP-004',
      'Supplier Name': 'Ethnic Couture Hub',
    },
  ];

  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'OBRYNT_Bulk_Import_Template.xlsx');
  } else {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'OBRYNT_Bulk_Import_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
