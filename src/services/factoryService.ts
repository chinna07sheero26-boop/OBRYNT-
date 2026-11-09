import {
  FactoryPartner,
  FactoryProductSubmission,
  FactorySession,
  FactorySubmissionStatus,
  Product,
} from '../types';
import { supabase } from './supabaseClient';
import { saveProduct } from './productService';

const STORAGE_KEY_FACTORIES = 'obrynt_factories_v1';
const STORAGE_KEY_SUBMISSIONS = 'obrynt_factory_submissions_v1';
const STORAGE_KEY_FACTORY_SESSION = 'obrynt_factory_session_v1';

// Pre-seeded factories
const DEFAULT_FACTORIES: FactoryPartner[] = [
  {
    id: 'FAC-TIRUPUR-101',
    name: 'Tirupur Knitwear Works',
    ownerName: 'Karthik Subramanian',
    email: 'karthik@tirupurknitworks.in',
    phone: '+91 94431 88201',
    address: 'Avinashi Road, Cotton Hub, Tirupur, Tamil Nadu 641602',
    accessKeyHash: 'tirupur@knit25',
    plainPasswordPreview: 'tirupur@knit25',
    invitationToken: 'FAC-INV-TIRUPUR-7781',
    status: 'active',
    capacity: '45,000 units / month',
    specialization: '100% Combed Cotton, Heavyweight Fleece & Loopback Terry',
    notes: 'Premium supplier of heavyweight oversized streetwear blanks & hoodies.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
    submissionsCount: 2,
    approvedCount: 1,
  },
  {
    id: 'FAC-SURAT-202',
    name: 'Surat Silk & Rayon Mills',
    ownerName: 'Dharmesh Zaveri',
    email: 'dharmesh@suratrayonmills.com',
    phone: '+91 98251 77290',
    address: 'Ring Road Textile Market, Surat, Gujarat 395002',
    accessKeyHash: 'surat@weave25',
    plainPasswordPreview: 'surat@weave25',
    invitationToken: 'FAC-INV-SURAT-9942',
    status: 'active',
    capacity: '30,000 units / month',
    specialization: 'Viscose Rayon, Jacquard & Resort Printed Shirts',
    notes: 'Craftsman mill specializing in breezy summer silhouettes.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
    submissionsCount: 1,
    approvedCount: 1,
  },
  {
    id: 'FAC-LUDH-303',
    name: 'Ludhiana Woolen Atelier',
    ownerName: 'Harpreet Singh',
    email: 'production@ludhiana-woolens.in',
    phone: '+91 98140 33812',
    address: 'Industrial Area A, Ludhiana, Punjab 141003',
    accessKeyHash: 'ludhiana@wool25',
    plainPasswordPreview: 'ludhiana@wool25',
    invitationToken: 'FAC-INV-LUDH-5521',
    status: 'active',
    capacity: '20,000 units / month',
    specialization: 'Merino Knits, Cable Knit Sweaters & Bomber Outerwear',
    notes: 'Winterwear and textured pullover manufacturing partner.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    submissionsCount: 1,
    approvedCount: 0,
  },
];

// Pre-seeded factory submissions
const DEFAULT_SUBMISSIONS: FactoryProductSubmission[] = [
  {
    id: 'SUB-FAC-001',
    factoryId: 'FAC-TIRUPUR-101',
    factoryName: 'Tirupur Knitwear Works',
    productName: 'Heavy Loopback 450 GSM Raw French Terry Hoodie',
    description:
      'Ultra-dense 450 GSM combed cotton fleece with drop shoulders, kangaroo pocket, and double-layered heavyweight hood. Zero shrinkage pre-shrunk wash.',
    category: 'Men',
    subcategory: 'Hoodies',
    images: ['/images/product_cargo_pants_1793012423376.jpg'],
    factoryQuotation: 680,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Onyx Black', 'Oatmeal Heather', 'Sage Green'],
    stockQuantity: 250,
    materialFabric: '100% Combed Compact Cotton French Terry (450 GSM)',
    sku: 'FAC-TKW-HD-450',
    moq: 50,
    status: 'pending_approval',
    reviewNotes: 'Sample inspected. Factory quote ₹680 approved in principle. Ready for retail margin pricing.',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    importMethod: 'single',
  },
  {
    id: 'SUB-FAC-002',
    factoryId: 'FAC-SURAT-202',
    factoryName: 'Surat Silk & Rayon Mills',
    productName: 'Hand-Block Printed Camp Collar Cuban Shirt',
    description:
      'Breathable 100% modal viscose crafted with hand-carved wooden block indigo motifs. Relaxed Cuban camp collar with pearl buttons.',
    category: 'Men',
    subcategory: 'Shirts',
    images: ['/images/product_tshirt_minimal_1793012315796.jpg'],
    factoryQuotation: 420,
    finalSellingPrice: 1299,
    sizes: ['M', 'L', 'XL'],
    colors: ['Indigo Floral', 'Rust Earth'],
    stockQuantity: 180,
    materialFabric: '100% High-Grade Modal Viscose (140 GSM)',
    sku: 'FAC-SRM-CS-140',
    moq: 30,
    status: 'approved',
    reviewNotes: 'Excellent stitching quality. Approved at ₹1,299 retail price (67.6% gross margin).',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reviewedBy: 'OBRYNT Store Owner',
    publishedProductSku: 'OB-MN-SHT-140',
    importMethod: 'single',
  },
  {
    id: 'SUB-FAC-003',
    factoryId: 'FAC-LUDH-303',
    factoryName: 'Ludhiana Woolen Atelier',
    productName: 'Chunky Fisherman Ribbed Wool Knit Pullover',
    description:
      'Heavy gauge ribbed knit pullover spun from cruelty-free blended wool. Raglan sleeve construction with shape-retaining elasticized cuffs.',
    category: 'Men',
    subcategory: 'Sweaters',
    images: ['/images/product_oversized_streetwear_1793012354714.jpg'],
    factoryQuotation: 890,
    sizes: ['M', 'L', 'XL'],
    colors: ['Cream Ecru', 'Charcoal Grey'],
    stockQuantity: 100,
    materialFabric: '60% Merino Wool, 40% Anti-Pill Acrylic',
    sku: 'FAC-LWA-SW-890',
    moq: 25,
    status: 'pending_approval',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    importMethod: 'bulk',
  },
];

// =========================================================================
// RETRIEVAL & STORAGE
// =========================================================================

export function getStoredFactories(): FactoryPartner[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FACTORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FACTORIES, JSON.stringify(DEFAULT_FACTORIES));
      return DEFAULT_FACTORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FACTORIES;
  } catch {
    return DEFAULT_FACTORIES;
  }
}

export function saveFactories(factories: FactoryPartner[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FACTORIES, JSON.stringify(factories));
  } catch (err) {
    console.error('Failed to save factories locally:', err);
  }
}

export function getStoredSubmissions(): FactoryProductSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(DEFAULT_SUBMISSIONS));
      return DEFAULT_SUBMISSIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SUBMISSIONS;
  } catch {
    return DEFAULT_SUBMISSIONS;
  }
}

export function saveSubmissions(submissions: FactoryProductSubmission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
  } catch (err) {
    console.error('Failed to save submissions locally:', err);
  }
}

// =========================================================================
// OWNER ADMIN OPERATIONS
// =========================================================================

export async function createFactoryPartner(
  data: Omit<FactoryPartner, 'createdAt' | 'updatedAt' | 'submissionsCount' | 'approvedCount' | 'invitationToken'>
): Promise<FactoryPartner> {
  const token = `FAC-INV-${data.id.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;
  const newFactory: FactoryPartner = {
    ...data,
    invitationToken: token,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionsCount: 0,
    approvedCount: 0,
  };

  const factories = getStoredFactories();
  const updated = [newFactory, ...factories];
  saveFactories(updated);

  // Sync with Supabase if configured
  try {
    if (supabase) {
      await supabase.from('factory_partners').insert({
        id: newFactory.id,
        name: newFactory.name,
        owner_name: newFactory.ownerName,
        email: newFactory.email,
        phone: newFactory.phone,
        address: newFactory.address,
        access_key_hash: newFactory.accessKeyHash,
        invitation_token: newFactory.invitationToken,
        status: newFactory.status,
        capacity: newFactory.capacity,
        specialization: newFactory.specialization,
        notes: newFactory.notes,
      });
    }
  } catch (err) {
    console.warn('Supabase note for factory creation:', err);
  }

  return newFactory;
}

export function updateFactoryStatus(factoryId: string, status: 'active' | 'suspended' | 'deactivated'): void {
  const list = getStoredFactories().map((f) =>
    f.id === factoryId ? { ...f, status, updatedAt: new Date().toISOString() } : f
  );
  saveFactories(list);
}

export function resetFactoryKey(factoryId: string, newKey: string): void {
  const list = getStoredFactories().map((f) =>
    f.id === factoryId
      ? {
          ...f,
          accessKeyHash: newKey,
          plainPasswordPreview: newKey,
          updatedAt: new Date().toISOString(),
        }
      : f
  );
  saveFactories(list);
}

export function generateFactoryInviteUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://obrynt.example';
  return `${origin}?factory_portal=true&token=${encodeURIComponent(token)}`;
}

// =========================================================================
// FACTORY AUTHENTICATION & SESSION
// =========================================================================

export async function authenticateFactoryWithToken(token: string): Promise<{
  success: boolean;
  factory?: FactoryPartner;
  session?: FactorySession;
  error?: string;
}> {
  const trimmed = token.trim();
  const factories = getStoredFactories();
  const factory = factories.find((f) => f.invitationToken === trimmed);

  if (!factory) {
    return { success: false, error: 'Invalid or expired factory partner invitation link.' };
  }

  if (factory.status !== 'active') {
    return {
      success: false,
      error: `Access for factory "${factory.name}" is currently ${factory.status}. Contact OBRYNT Owner.`,
    };
  }

  const session: FactorySession = {
    factoryId: factory.id,
    factoryName: factory.name,
    ownerName: factory.ownerName,
    role: 'factory_partner',
    token: `FAC-SES-${factory.id}-${Date.now().toString(36)}`,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    authenticatedAt: new Date().toISOString(),
  };

  setFactorySession(session);
  return { success: true, factory, session };
}

export async function authenticateFactoryWithKey(
  factoryIdOrEmail: string,
  key: string
): Promise<{
  success: boolean;
  factory?: FactoryPartner;
  session?: FactorySession;
  error?: string;
}> {
  const idLower = factoryIdOrEmail.trim().toLowerCase();
  const keyTrimmed = key.trim();
  const factories = getStoredFactories();

  const factory = factories.find(
    (f) =>
      (f.id.toLowerCase() === idLower || f.email.toLowerCase() === idLower) &&
      (f.accessKeyHash === keyTrimmed || f.plainPasswordPreview === keyTrimmed)
  );

  if (!factory) {
    return { success: false, error: 'Invalid factory credentials. Please check Factory ID and Secret Key.' };
  }

  if (factory.status !== 'active') {
    return {
      success: false,
      error: `Access for factory "${factory.name}" is currently ${factory.status}. Contact OBRYNT Owner.`,
    };
  }

  const session: FactorySession = {
    factoryId: factory.id,
    factoryName: factory.name,
    ownerName: factory.ownerName,
    role: 'factory_partner',
    token: `FAC-SES-${factory.id}-${Date.now().toString(36)}`,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    authenticatedAt: new Date().toISOString(),
  };

  setFactorySession(session);
  return { success: true, factory, session };
}

export function getFactorySession(): FactorySession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FACTORY_SESSION);
    if (!raw) return null;
    const session: FactorySession = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearFactorySession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setFactorySession(session: FactorySession): void {
  try {
    localStorage.setItem(STORAGE_KEY_FACTORY_SESSION, JSON.stringify(session));
  } catch {}
}

export function clearFactorySession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_FACTORY_SESSION);
  } catch {}
}

// =========================================================================
// FACTORY PRODUCT SUBMISSION OPERATIONS
// =========================================================================

export function getFactorySubmissions(factoryId?: string): FactoryProductSubmission[] {
  const all = getStoredSubmissions();
  if (factoryId) {
    return all.filter((s) => s.factoryId === factoryId);
  }
  return all;
}

export async function submitSingleFactoryProduct(
  factorySession: FactorySession,
  submissionData: Omit<
    FactoryProductSubmission,
    'id' | 'factoryId' | 'factoryName' | 'status' | 'submittedAt' | 'finalSellingPrice' | 'publishedProductSku'
  >
): Promise<FactoryProductSubmission> {
  const newSubmission: FactoryProductSubmission = {
    ...submissionData,
    id: `SUB-FAC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
    factoryId: factorySession.factoryId,
    factoryName: factorySession.factoryName,
    status: 'pending_approval',
    submittedAt: new Date().toISOString(),
    importMethod: 'single',
  };

  const existing = getStoredSubmissions();
  const updated = [newSubmission, ...existing];
  saveSubmissions(updated);

  // Update factory count
  const factories = getStoredFactories().map((f) =>
    f.id === factorySession.factoryId ? { ...f, submissionsCount: (f.submissionsCount || 0) + 1 } : f
  );
  saveFactories(factories);

  // Sync to Supabase if configured
  try {
    if (supabase) {
      await supabase.from('factory_submissions').insert({
        id: newSubmission.id,
        factory_id: newSubmission.factoryId,
        factory_name: newSubmission.factoryName,
        product_name: newSubmission.productName,
        description: newSubmission.description,
        category: newSubmission.category,
        subcategory: newSubmission.subcategory,
        images: newSubmission.images,
        factory_quotation: newSubmission.factoryQuotation,
        sizes: newSubmission.sizes,
        colors: newSubmission.colors,
        stock_quantity: newSubmission.stockQuantity,
        material_fabric: newSubmission.materialFabric,
        sku: newSubmission.sku,
        moq: newSubmission.moq,
        status: newSubmission.status,
      });
    }
  } catch (err) {
    console.warn('Supabase note for factory submission:', err);
  }

  return newSubmission;
}

export async function submitBulkFactoryProducts(
  factorySession: FactorySession,
  productsList: Array<
    Omit<
      FactoryProductSubmission,
      'id' | 'factoryId' | 'factoryName' | 'status' | 'submittedAt' | 'finalSellingPrice' | 'publishedProductSku'
    >
  >
): Promise<FactoryProductSubmission[]> {
  const newSubmissions: FactoryProductSubmission[] = productsList.map((p, idx) => ({
    ...p,
    id: `SUB-FAC-${Date.now().toString(36).toUpperCase()}-${idx + 1}`,
    factoryId: factorySession.factoryId,
    factoryName: factorySession.factoryName,
    status: 'pending_approval',
    submittedAt: new Date().toISOString(),
    importMethod: 'bulk',
  }));

  const existing = getStoredSubmissions();
  const updated = [...newSubmissions, ...existing];
  saveSubmissions(updated);

  // Update factory count
  const factories = getStoredFactories().map((f) =>
    f.id === factorySession.factoryId
      ? { ...f, submissionsCount: (f.submissionsCount || 0) + newSubmissions.length }
      : f
  );
  saveFactories(factories);

  return newSubmissions;
}

// Download Sample Template for Factory Owners (.csv / Excel format)
export function downloadFactoryBulkExcelTemplate(): void {
  const headers = [
    'Product Name*',
    'Description*',
    'Category (Men/Women/Kids)*',
    'Subcategory*',
    'Factory Quotation (INR)*',
    'Available Sizes (Comma separated: S, M, L, XL, XXL)*',
    'Available Colours (Comma separated)*',
    'Stock Quantity*',
    'Material / Fabric Details*',
    'Factory SKU*',
    'MOQ (Minimum Order Quantity)*',
    'Primary Image URL',
    'Additional Image URLs (Comma separated)',
  ];

  const sampleRows = [
    [
      'Heavyweight Acid Wash Graphic Tee',
      '240 GSM heavy combed cotton vintage wash tee with custom distress ribbing.',
      'Men',
      'T-shirts',
      '380',
      'S, M, L, XL, XXL',
      'Washed Charcoal, Vintage Bone',
      '150',
      '100% Combed Compact Cotton (240 GSM)',
      'FAC-TKW-TEE-01',
      '30',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    ],
    [
      'Floral Jacquard Camp Collar Resort Shirt',
      'Breezy viscose jacquard resort shirt with camp open collar and natural wood buttons.',
      'Men',
      'Shirts',
      '460',
      'M, L, XL',
      'Olive Palm, Terracotta',
      '80',
      '100% Rayon Jacquard (150 GSM)',
      'FAC-SRM-SHT-02',
      '25',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
      '',
    ],
    [
      'Tailored High-Waist Pleated Trousers',
      'Premium twill pleated formal trousers with concealed waistband adjusters.',
      'Women',
      'Trousers',
      '620',
      '26, 28, 30, 32',
      'Taupe, Noir Black',
      '120',
      'Polyester Viscose Stretch Twill (280 GSM)',
      'FAC-LWA-TRS-03',
      '20',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
      '',
    ],
  ];

  const csvRows = [headers.join(','), ...sampleRows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(','))];
  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OBRYNT_Factory_Bulk_Submission_Template.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =========================================================================
// OWNER ADMIN APPROVAL WORKFLOW
// =========================================================================

export interface OwnerReviewOptions {
  finalSellingPrice?: number;
  reviewNotes?: string;
  categoryOverride?: string;
  subcategoryOverride?: string;
}

/**
 * Handles Owner reviewing factory product:
 * - If approved: sets retail selling price, marks approved, and publishes to live store catalog!
 * - If rejected or needs_revision: saves review notes for factory partner to inspect.
 */
export async function ownerReviewFactoryProduct(
  submissionId: string,
  action: FactorySubmissionStatus,
  options: OwnerReviewOptions = {}
): Promise<{ success: boolean; submission?: FactoryProductSubmission; publishedProduct?: Product; error?: string }> {
  const submissions = getStoredSubmissions();
  const sub = submissions.find((s) => s.id === submissionId);

  if (!sub) {
    return { success: false, error: 'Factory submission not found.' };
  }

  let publishedProduct: Product | undefined;
  const now = new Date().toISOString();

  if (action === 'approved') {
    if (!options.finalSellingPrice || options.finalSellingPrice <= 0) {
      return { success: false, error: 'Owner must set an approved customer retail selling price before publishing.' };
    }

    const assignedSku = `OB-${sub.category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const category = (options.categoryOverride || sub.category) as any;

    const newCatalogueProduct: Product = {
      sku: assignedSku,
      name: sub.productName,
      description: sub.description,
      price: options.finalSellingPrice,
      originalPrice: Math.round(options.finalSellingPrice * 1.3),
      category: category,
      brand: 'OBRYNT Atelier',
      imageUrl: sub.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg',
      galleryUrls: sub.images.length > 0 ? sub.images : ['/images/product_tshirt_minimal_1793012315796.jpg'],
      rating: 4.8,
      reviewCount: 1,
      stock: sub.stockQuantity,
      status: 'active',
      colors: sub.colors,
      color: sub.colors[0] || '#171717',
      colorName: sub.colors[0] || 'Default',
      sizes: sub.sizes,
      material: sub.materialFabric,
      tag: 'NEW ARRIVAL',
    };

    // Publish to catalogue
    try {
      await saveProduct(newCatalogueProduct);
      publishedProduct = newCatalogueProduct;
    } catch (pubErr) {
      console.warn('Catalogue publish notice:', pubErr);
    }

    sub.finalSellingPrice = options.finalSellingPrice;
    sub.publishedProductSku = assignedSku;

    // Update approved count for factory
    const factories = getStoredFactories().map((f) =>
      f.id === sub.factoryId ? { ...f, approvedCount: (f.approvedCount || 0) + 1 } : f
    );
    saveFactories(factories);
  }

  sub.status = action;
  sub.reviewedAt = now;
  sub.reviewedBy = 'OBRYNT Store Owner';
  if (options.reviewNotes) {
    sub.reviewNotes = options.reviewNotes;
  }

  saveSubmissions(submissions);

  return { success: true, submission: sub, publishedProduct };
}
