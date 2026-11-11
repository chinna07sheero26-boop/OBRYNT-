import { getSupabaseClient } from './supabaseClient';
import { Product, Category } from '../types';
import { OBRYNT_PRODUCTS } from './csvService';

const STORAGE_KEYS = {
  ALL_PRODUCTS: 'obrynt_all_products',
  CUSTOM_PRODUCTS: 'obrynt_custom_products',
};

/**
 * Maps a Supabase `public.products` record to the application `Product` model
 */
export function mapDbRowToProduct(row: any): Product {
  const stock = typeof row.stock === 'number' ? row.stock : parseInt(row.stock, 10) || 0;
  let status: 'active' | 'draft' | 'out_of_stock' = 'active';

  if (row.status) {
    status = row.status as 'active' | 'draft' | 'out_of_stock';
  } else if (row.is_published === false) {
    status = 'draft';
  } else if (stock === 0) {
    status = 'out_of_stock';
  }

  return {
    sku: row.sku,
    id: row.id,
    name: row.name,
    description: row.description || '',
    category: (row.category || 'T-Shirts') as Category,
    cat: row.category,
    audience: row.audience || 'Unisex',
    aud: row.audience || 'Unisex',
    brand: row.brand || 'OBRYNT',
    brandName: row.brand || 'OBRYNT',
    subcategory: row.subcategory || undefined,
    confidence: row.confidence !== undefined ? Number(row.confidence) : 100,
    needsReview: Boolean(row.needs_review),
    supplierProductId: row.supplier_product_id || undefined,
    sourceFile: row.source_file || undefined,
    price: Number(row.retail_price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    stock: stock,
    status: status,
    isPublished: row.is_published !== false,
    imageUrl: row.image_url || '/images/product_tshirt_minimal_1793012315796.jpg',
    galleryUrls: Array.isArray(row.gallery_urls) ? row.gallery_urls : [],
    sizes: Array.isArray(row.sizes) && row.sizes.length > 0 ? row.sizes : ['S', 'M', 'L', 'XL'],
    colors: Array.isArray(row.colors) ? row.colors : [],
    color: Array.isArray(row.colors) && row.colors.length > 0 ? row.colors[0] : '#171717',
    colorName: Array.isArray(row.colors) && row.colors.length > 0 ? row.colors[0] : 'Classic',
    supplierId: row.supplier_id || undefined,
    supplierPrice: row.wholesale_cost ? Number(row.wholesale_cost) : (Number(row.retail_price) > 40 ? Number(row.retail_price) - 40 : undefined),
    wholesalePrice: row.wholesale_cost ? Number(row.wholesale_cost) : undefined,
    markupAmount: 40,
    rating: row.rating ? Number(row.rating) : 4.8,
    reviewCount: row.review_count ? Number(row.review_count) : 24,
    material: row.material || undefined,
    fit: row.fit || undefined,
    type: row.type || 'shirt',
    tag: row.tag || (status === 'out_of_stock' ? 'SOLD OUT' : 'NEW'),
  };
}

/**
 * Maps application `Product` to Supabase `public.products` column format
 */
export function mapProductToDbRow(product: Product): Record<string, any> {
  const isPublished = product.status !== 'draft' && !product.needsReview;
  const effectiveStock = product.status === 'out_of_stock' ? 0 : Number(product.stock) || 0;
  const rawCost = product.supplierPrice ?? product.wholesalePrice ?? (product.price > 40 ? product.price - 40 : null);

  return {
    sku: product.sku.trim(),
    name: product.name.trim(),
    description: product.description || '',
    category: product.category,
    subcategory: product.subcategory || null,
    audience: product.audience || 'Unisex',
    brand: product.brand || product.brandName || 'OBRYNT',
    retail_price: Number(product.price) || 0,
    original_price: product.originalPrice ? Number(product.originalPrice) : null,
    stock: effectiveStock,
    status: product.status || (effectiveStock === 0 ? 'out_of_stock' : 'active'),
    is_published: isPublished,
    is_approved: !product.needsReview,
    confidence: product.confidence !== undefined ? product.confidence : 100,
    needs_review: Boolean(product.needsReview),
    supplier_product_id: product.supplierProductId || null,
    source_file: product.sourceFile || null,
    image_url: product.imageUrl,
    gallery_urls: product.galleryUrls || [],
    sizes: product.sizes || ['S', 'M', 'L', 'XL'],
    colors: product.colors || (product.color ? [product.color] : ['#171717']),
    supplier_id: product.supplierId || null,
    wholesale_cost: rawCost ? Number(rawCost) : null,
  };
}

/**
 * Fetch products from Supabase `public.products`
 */
export async function fetchProductsFromSupabase(): Promise<{
  products: Product[];
  success: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { products: [], success: false, error: 'Supabase client not configured' };
  }

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[OBRYNT Product Service] Supabase select error:', error.message);
      return { products: [], success: false, error: error.message };
    }

    if (data && data.length > 0) {
      const mapped = data.map(mapDbRowToProduct);
      return { products: mapped, success: true };
    }

    return { products: [], success: true };
  } catch (err: any) {
    console.error('[OBRYNT Product Service] Error fetching products:', err);
    return { products: [], success: false, error: err?.message || 'Failed to fetch products' };
  }
}

/**
 * Save (create or update) a product in Supabase and local storage
 */
export async function saveProduct(product: Product): Promise<{
  success: boolean;
  product: Product;
  savedToSupabase: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  let savedToSupabase = false;
  let supabaseError = '';

  // 1. If Supabase is connected, attempt upsert
  if (client) {
    try {
      const row = mapProductToDbRow(product);
      const { data, error } = await client
        .from('products')
        .upsert(row, { onConflict: 'sku' })
        .select()
        .single();

      if (error) {
        console.warn('[OBRYNT Product Service] Supabase upsert error:', error.message);
        supabaseError = error.message;
      } else if (data) {
        savedToSupabase = true;
        // Merge with db generated id or created_at
        product = mapDbRowToProduct(data);
      }
    } catch (err: any) {
      supabaseError = err?.message || 'Database connection error';
    }
  }

  // 2. Always persist locally for offline resilience and instant reactivity
  saveProductToLocalCache(product);

  return {
    success: true,
    product,
    savedToSupabase,
    error: supabaseError || undefined,
  };
}

/**
 * Save multiple products in batches to Supabase and local storage
 */
export async function saveProductsBulk(
  products: Product[],
  onProgress?: (saved: number, total: number) => void
): Promise<{
  success: boolean;
  savedCount: number;
  supabaseCount: number;
  errors: string[];
}> {
  const client = getSupabaseClient();
  let supabaseCount = 0;
  const errors: string[] = [];
  const BATCH_SIZE = 40;

  if (client) {
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const chunk = products.slice(i, i + BATCH_SIZE);
      const rows = chunk.map(mapProductToDbRow);
      try {
        const { error } = await client
          .from('products')
          .upsert(rows, { onConflict: 'sku' });

        if (error) {
          console.warn(`[OBRYNT Product Service] Bulk upsert error in batch ${i}:`, error.message);
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        } else {
          supabaseCount += chunk.length;
        }
      } catch (err: any) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err?.message || 'Network error'}`);
      }

      if (onProgress) {
        onProgress(Math.min(i + chunk.length, products.length), products.length);
      }
    }
  }

  // Update local storage in one bulk pass
  saveBulkProductsToLocalCache(products);

  return {
    success: true,
    savedCount: products.length,
    supabaseCount,
    errors,
  };
}

/**
 * Efficient bulk update to local storage
 */
export function saveBulkProductsToLocalCache(newProducts: Product[]): void {
  try {
    const existing = getLocalProducts();
    const map = new Map<string, Product>();
    // First index existing
    existing.forEach((p) => map.set(p.sku, p));
    // Overwrite / add new
    newProducts.forEach((p) => map.set(p.sku, p));
    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEYS.ALL_PRODUCTS, JSON.stringify(merged));

    // Also update custom list
    const customSaved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    const customList: Product[] = customSaved ? JSON.parse(customSaved) : [];
    const customMap = new Map<string, Product>();
    customList.forEach((p) => customMap.set(p.sku, p));
    newProducts.forEach((p) => customMap.set(p.sku, p));
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRODUCTS, JSON.stringify(Array.from(customMap.values())));
  } catch (err) {
    console.error('Failed to update bulk products in local cache:', err);
  }
}

/**
 * Delete a product by SKU from Supabase and local cache
 */
export async function deleteProduct(sku: string): Promise<{
  success: boolean;
  deletedFromSupabase: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  let deletedFromSupabase = false;
  let supabaseError = '';

  if (client) {
    try {
      const { error } = await client
        .from('products')
        .delete()
        .eq('sku', sku);

      if (error) {
        console.warn('[OBRYNT Product Service] Supabase delete error:', error.message);
        supabaseError = error.message;
      } else {
        deletedFromSupabase = true;
      }
    } catch (err: any) {
      supabaseError = err?.message || 'Database error during delete';
    }
  }

  // Remove from local caches
  removeProductFromLocalCache(sku);

  return {
    success: true,
    deletedFromSupabase,
    error: supabaseError || undefined,
  };
}

/**
 * Upload an image file to Supabase Storage bucket 'product-images'
 * Falls back to high-resolution DataURL if storage bucket is initializing
 */
export async function uploadProductImage(file: File): Promise<{
  url: string;
  isSupabaseStorage: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `products/${Date.now()}_${cleanFileName}`;

      const { data: uploadData, error: uploadErr } = await client.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = client.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            isSupabaseStorage: true,
          };
        }
      } else if (uploadErr) {
        console.warn('[OBRYNT Storage] Upload notice:', uploadErr.message);
      }
    } catch (err: any) {
      console.warn('[OBRYNT Storage] Storage attempt failed, falling back to local image data:', err?.message);
    }
  }

  // Safe fallback to client-side Data URL so product creation is never blocked
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        isSupabaseStorage: false,
      });
    };
    reader.onerror = () => {
      resolve({
        url: '/images/product_tshirt_minimal_1793012315796.jpg',
        isSupabaseStorage: false,
        error: 'Failed to read image file',
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Load local products from localStorage
 */
export function getLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ALL_PRODUCTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading local products:', err);
  }
  return [];
}

/**
 * Save product to local storage cache
 */
export function saveProductToLocalCache(product: Product): void {
  try {
    const existing = getLocalProducts();
    const index = existing.findIndex((p) => p.sku === product.sku);
    let updated: Product[];

    if (index >= 0) {
      updated = [...existing];
      updated[index] = product;
    } else {
      updated = [product, ...existing];
    }

    localStorage.setItem(STORAGE_KEYS.ALL_PRODUCTS, JSON.stringify(updated));

    // Also track in custom products
    const customSaved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    const customList: Product[] = customSaved ? JSON.parse(customSaved) : [];
    const customIdx = customList.findIndex((p) => p.sku === product.sku);
    if (customIdx >= 0) {
      customList[customIdx] = product;
    } else {
      customList.unshift(product);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRODUCTS, JSON.stringify(customList));
  } catch (err) {
    console.error('Failed to update local product cache:', err);
  }
}

/**
 * Remove product from local cache
 */
export function removeProductFromLocalCache(sku: string): void {
  try {
    const existing = getLocalProducts();
    const updated = existing.filter((p) => p.sku !== sku);
    localStorage.setItem(STORAGE_KEYS.ALL_PRODUCTS, JSON.stringify(updated));

    const customSaved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    if (customSaved) {
      const customList: Product[] = JSON.parse(customSaved);
      const filtered = customList.filter((p) => p.sku !== sku);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_PRODUCTS, JSON.stringify(filtered));
    }
  } catch (err) {
    console.error('Failed to remove product from local cache:', err);
  }
}

/**
 * Unified catalog loader that hydrates from Supabase, local cache, and core catalog
 */
export async function loadUnifiedProductCatalogue(): Promise<{
  products: Product[];
  source: 'supabase' | 'localstorage' | 'defaults';
  remoteCount: number;
}> {
  // 1. Check Supabase
  const sbResult = await fetchProductsFromSupabase();
  if (sbResult.success && sbResult.products.length > 0) {
    // Cache the Supabase products
    try {
      localStorage.setItem(STORAGE_KEYS.ALL_PRODUCTS, JSON.stringify(sbResult.products));
    } catch {}
    return {
      products: sbResult.products,
      source: 'supabase',
      remoteCount: sbResult.products.length,
    };
  }

  // 2. Check local storage
  const localList = getLocalProducts();
  if (localList.length > 0) {
    return {
      products: localList,
      source: 'localstorage',
      remoteCount: 0,
    };
  }

  // 3. Fallback to default catalog
  return {
    products: OBRYNT_PRODUCTS,
    source: 'defaults',
    remoteCount: 0,
  };
}
