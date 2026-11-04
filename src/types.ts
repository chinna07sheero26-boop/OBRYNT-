export type Category =
  | 'All'
  | 'Men'
  | 'Women'
  | 'T-Shirts'
  | 'Gym & Sports'
  | 'Innerwear'
  | 'Footwear'
  | 'Bags & Accessories'
  | 'Beauty & Makeup'
  | 'Custom Design'
  | 'Plain T-shirts'
  | 'Printed T-shirts'
  | 'Gym T-shirts'
  | 'Shirts'
  | 'Jeans'
  | 'Trousers'
  | 'Shorts'
  | 'Joggers'
  | 'Hoodies & Sweatshirts';

export const ALL_CATEGORIES: Category[] = [
  'All',
  'Men',
  'Women',
  'T-Shirts',
  'Gym & Sports',
  'Innerwear',
  'Footwear',
  'Bags & Accessories',
  'Beauty & Makeup',
  'Custom Design',
];

export interface CategoryInfo {
  name: Category;
  icon: string;
  desc: string;
  badge?: string;
}

export const CATEGORY_METADATA: CategoryInfo[] = [
  { name: 'Men', icon: '◈', desc: 'Everyday style' },
  { name: 'Women', icon: '✿', desc: 'Your kind of fit' },
  { name: 'T-Shirts', icon: '▤', desc: 'Everyday essentials' },
  { name: 'Gym & Sports', icon: '↗', desc: 'Move comfortably' },
  { name: 'Innerwear', icon: '◇', desc: 'Daily essentials' },
  { name: 'Footwear', icon: '⌁', desc: 'Shoes & slippers' },
  { name: 'Bags & Accessories', icon: '▣', desc: 'Finish the look' },
  { name: 'Beauty & Makeup', icon: '✦', desc: 'Makeup & skincare' },
  { name: 'Custom Design', icon: '✳', desc: 'Create your own' },
];

export interface ArtworkPlacement {
  url: string;
  x: number; // percentage offset -50 to 50
  y: number; // percentage offset -50 to 50
  scale: number; // scale multiplier 0.3 to 2.0
  rotation: number; // rotation in degrees
  preset?: 'pocket' | 'chest' | 'center' | 'full' | 'custom';
}

export interface CustomDesign {
  id?: string;
  text?: string;
  side: 'Front' | 'Back';
  size: string;
  colorHex: string;
  colorName: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  dateCreated?: string;
  // Advanced AI Studio Garment Details
  category?: string;
  clothingType?: string;
  gender?: 'Men' | 'Women' | 'Unisex';
  fit?: 'Regular fit' | 'Oversized fit' | 'Relaxed fit' | 'Athletic fit' | string;
  neckline?: 'Round neck' | 'V-neck' | 'Polo collar' | 'Hooded' | 'Spread collar' | string;
  sleeve?: 'Half sleeve' | 'Full sleeve' | 'Sleeveless' | string;
  artworkUrl?: string;
  frontArtwork?: ArtworkPlacement;
  backArtwork?: ArtworkPlacement;
  prompt?: string;
  stylePreset?: string;
  basePrice?: number;
  printPrice?: number;
  totalPrice?: number;
  previewUrl?: string;
}

export interface Product {
  sku: string;
  id?: number | string;
  name: string;
  category: Category | string;
  cat?: string;
  audience?: 'Men' | 'Women' | 'Unisex' | 'Beauty' | string;
  aud?: string;
  price: number;
  originalPrice?: number;
  sizes: string[];
  color: string;
  colorName?: string;
  type?: 'shirt' | 'shoe' | 'bottle' | 'bag' | 'hoodie' | 'pants' | string;
  tag?: string;
  badge?: string;
  description: string;
  stock: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  brandName?: string;
  subcategory?: string;
  galleryUrls?: string[];
  colors?: string[];
  status?: 'active' | 'draft' | 'out_of_stock';
  isPublished?: boolean;
  material?: string;
  fit?: string;
  supplierId?: string;
  supplierName?: string;
  wholesalePrice?: number;
  confidence?: number;
  needsReview?: boolean;
  supplierProductId?: string;
  sourceFile?: string;
  importBatchId?: string;
}

export interface BulkImportItem {
  id: string;
  raw: Record<string, any>;
  product: Product;
  confidence: number;
  category: string;
  subcategory: string;
  audience: string;
  brand: string;
  isDuplicate: boolean;
  duplicateOfSku?: string;
  status: 'pending' | 'categorized' | 'needs_review' | 'imported' | 'failed';
  error?: string;
}

export interface BulkImportReport {
  batchId: string;
  timestamp: string;
  totalParsed: number;
  categorized: number;
  needsReview: number;
  duplicates: number;
  imported: number;
  failed: number;
  categoriesBreakdown: Record<string, number>;
  sourceName: string;
}

export interface CartItem {
  id: string; // unique item key
  product: Product;
  size: string;
  quantity: number;
  customDesign?: CustomDesign;
}

export interface FilterState {
  search: string;
  category: string;
  audience?: string;
  sizes: string[];
  colors: string[];
  maxPrice: number;
  minPrice: number;
  inStockOnly: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'rating';
}

export interface OrderDetails {
  orderId: string;
  date: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'Demo order placed' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | string;
  paymentId?: string;
  paymentGatewayRef?: string;
  paymentStatus?: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'cod_pending' | string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface TransactionRecord {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  gatewayRef?: string;
  gateway?: string;
}

export interface ProductReview {
  id: string;
  sku: string;
  author: string;
  rating: number; // 1 to 5
  date: string;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  fitFeedback?: 'Runs Small' | 'True to Size' | 'Runs Large';
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  flatDiscount: number;
  minSpend: number;
  usageCount: number;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  announcementText: string;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  currencySymbol: string;
  contactEmail: string;
  contactPhone: string;
  enableCod: boolean;
  enableUpi: boolean;
  enableCards: boolean;
  masterPasswordHash?: string;
  requireAuthForAdmin?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  brandName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: 'active' | 'pending' | 'suspended';
  commercialTerms: string; // e.g. "Net 30 days, 20% margin"
  paymentTerms?: string; // e.g. "Net 15 days via NEFT wire"
  shippingTerms?: string; // e.g. "Door-to-door courier, FOB factory"
  wholesalePrices?: string; // e.g. "35% off MRP, ₹320 base per unit"
  productCategories?: string[]; // e.g. ["T-Shirts", "Gym & Sports"]
  wholesaleDiscountPct: number;
  dispatchDays: number;
  acceptsSingleItem: boolean;
  acceptsCod: boolean;
  acceptsReturns: boolean;
  autoForwardOrders: boolean;
  rating: number;
  totalFulfilled: number;
  totalReturned: number;
  createdAt: string;
}

export interface SupplierFulfilment {
  id: string;
  orderId: string;
  supplierId: string;
  supplierName: string;
  items: CartItem[];
  totalWholesaleCost: number;
  customerPrice: number;
  shippingCost: number;
  commission: number;
  estimatedNetMargin: number;
  status: 'pending' | 'acknowledged' | 'in_preparation' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';
  dispatchDate?: string;
  trackingNumber?: string;
  courierPartner?: string;
  supplierNotes?: string;
  createdAt: string;
  settlementStatus: 'unsettled' | 'eligible' | 'settled';
  settlementReference?: string;
}

export interface FinancialBreakdown {
  grossSales: number;
  supplierCostPayable: number;
  shippingCostLiability: number;
  courierCodFees: number;
  platformGrossMargin: number;
  estimatedTaxes: number;
  estimatedNetProfit: number;
  pendingCodRemittances: number;
}

