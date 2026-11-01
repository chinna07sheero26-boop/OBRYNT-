import { Supplier, SupplierFulfilment, OrderDetails, CartItem, FinancialBreakdown } from '../types';
import { getSupabaseClient } from './supabaseClient';

const SUPPLIERS_STORAGE_KEY = 'obrynt_suppliers_v2';
const FULFILMENTS_STORAGE_KEY = 'obrynt_fulfilments_v2';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_obrynt_atelier',
    name: 'OBRYNT Bespoke Studio Pvt Ltd',
    brandName: 'OBRYNT Atelier',
    contactPerson: 'Master Tailor Chinna',
    email: 'atelier@obrynt.com',
    phone: '+91 98400 12345',
    address: 'Studio 4B, Fashion District, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    status: 'active',
    commercialTerms: 'In-house production, 100% margin',
    paymentTerms: 'In-House Internal Ledger Reconciliation',
    shippingTerms: 'Dedicated Studio Courier & Express Air (2-day dispatch)',
    wholesalePrices: 'Direct manufacturing cost (40% margin)',
    productCategories: ['Custom Design', 'T-Shirts', 'Hoodies & Sweatshirts'],
    wholesaleDiscountPct: 40,
    dispatchDays: 2,
    acceptsSingleItem: true,
    acceptsCod: true,
    acceptsReturns: true,
    autoForwardOrders: true,
    rating: 4.9,
    totalFulfilled: 42,
    totalReturned: 1,
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'sup_tirupur_knits',
    name: 'Tirupur Precision Knitwear Mills Ltd',
    brandName: 'Apex Mills Tirupur',
    contactPerson: 'R. Senthil Kumar',
    email: 'dispatch@tirupurknits.example.in',
    phone: '+91 94432 67890',
    address: '42 Industrial Estate, Avinashi Road',
    city: 'Tirupur',
    state: 'Tamil Nadu',
    pincode: '641603',
    status: 'active',
    commercialTerms: 'Net 15 days, 35% margin on T-shirts & Hoodies',
    paymentTerms: 'Net 15 days via NEFT/RTGS wire transfer',
    shippingTerms: 'Direct surface logistics, 3-day dispatch SLA',
    wholesalePrices: '35% off retail MRP (average ₹320-₹450/unit)',
    productCategories: ['T-Shirts', 'Gym & Sports', 'Innerwear', 'Hoodies & Sweatshirts'],
    wholesaleDiscountPct: 35,
    dispatchDays: 3,
    acceptsSingleItem: true,
    acceptsCod: true,
    acceptsReturns: true,
    autoForwardOrders: false,
    rating: 4.8,
    totalFulfilled: 118,
    totalReturned: 3,
    createdAt: '2026-02-10T00:00:00.000Z',
  },
  {
    id: 'sup_agra_footwear',
    name: 'Heritage Leathercraft Agra Ltd',
    brandName: 'Vanguard Footwear',
    contactPerson: 'Mohd. Aslam',
    email: 'sales@heritageagra.example.in',
    phone: '+91 98971 45678',
    address: 'Plot 12, Leather Complex, Nunhai',
    city: 'Agra',
    state: 'Uttar Pradesh',
    pincode: '282007',
    status: 'active',
    commercialTerms: 'Net 30 days, 28% margin on sneakers & loafers',
    paymentTerms: 'Net 30 days invoice settlement',
    shippingTerms: 'Door-to-door insured road cargo, 4-day dispatch SLA',
    wholesalePrices: '28% off retail MRP (average ₹850-₹1200/pair)',
    productCategories: ['Footwear', 'Bags & Accessories'],
    wholesaleDiscountPct: 28,
    dispatchDays: 4,
    acceptsSingleItem: true,
    acceptsCod: false,
    acceptsReturns: true,
    autoForwardOrders: false,
    rating: 4.7,
    totalFulfilled: 65,
    totalReturned: 2,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
];

/**
 * Retrieve suppliers from persistent storage
 */
export function getStoredSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
    if (!raw) {
      saveSuppliers(INITIAL_SUPPLIERS);
      return INITIAL_SUPPLIERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUPPLIERS;
  }
}

/**
 * Save suppliers to persistent storage and database if configured
 */
export function saveSuppliers(suppliers: Supplier[]): void {
  try {
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
  } catch (err) {
    console.warn('Failed to save suppliers to local storage:', err);
  }
}

/**
 * Persistently save or update a single supplier in the database (Supabase if connected + localStorage)
 */
export async function persistSupplierToDatabase(supplier: Supplier): Promise<void> {
  // 1. Immediately persist to localStorage
  const current = getStoredSuppliers();
  const exists = current.some((s) => s.id === supplier.id);
  const updated = exists
    ? current.map((s) => (s.id === supplier.id ? supplier : s))
    : [supplier, ...current];
  saveSuppliers(updated);

  // 2. Persist to database (Supabase) if configured
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const payload: any = {
      name: supplier.name,
      brand_name: supplier.brandName,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      pincode: supplier.pincode || '',
      status: supplier.status || 'active',
      commercial_terms: supplier.commercialTerms || supplier.paymentTerms || '',
      wholesale_discount_pct: Number(supplier.wholesaleDiscountPct || 30),
      dispatch_days: Number(supplier.dispatchDays || 2),
      accepts_single_item: supplier.acceptsSingleItem ?? true,
      accepts_cod: supplier.acceptsCod ?? true,
      accepts_returns: supplier.acceptsReturns ?? true,
      auto_forward_orders: supplier.autoForwardOrders ?? false,
      rating: Number(supplier.rating || 5.0),
    };

    // If ID is valid UUID format, preserve it, otherwise let database generate ID or match
    if (supplier.id && !supplier.id.startsWith('sup_')) {
      payload.id = supplier.id;
    }

    await client.from('suppliers').upsert(payload);
  } catch (err) {
    console.warn('[OBRYNT] Database sync attempted for supplier:', err);
  }
}

/**
 * Sync suppliers from database (Supabase) if available
 */
export async function syncSuppliersWithDatabase(): Promise<Supplier[]> {
  const client = getSupabaseClient();
  if (!client) return getStoredSuppliers();

  try {
    const { data, error } = await client
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const fromDb: Supplier[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        brandName: row.brand_name || row.name,
        contactPerson: row.contact_person || '',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        pincode: row.pincode || '',
        status: row.status || 'active',
        commercialTerms: row.commercial_terms || 'Net 30 days',
        paymentTerms: row.payment_terms || row.commercial_terms || 'Net 30 days',
        shippingTerms: row.shipping_terms || 'Standard Courier',
        wholesalePrices: row.wholesale_prices || `${row.wholesale_discount_pct || 30}% off MRP`,
        productCategories: row.product_categories || [],
        wholesaleDiscountPct: Number(row.wholesale_discount_pct || 30),
        dispatchDays: Number(row.dispatch_days || 2),
        acceptsSingleItem: row.accepts_single_item ?? true,
        acceptsCod: row.accepts_cod ?? true,
        acceptsReturns: row.accepts_returns ?? true,
        autoForwardOrders: row.auto_forward_orders ?? false,
        rating: Number(row.rating || 5.0),
        totalFulfilled: 0,
        totalReturned: 0,
        createdAt: row.created_at || new Date().toISOString(),
      }));

      // Merge without losing default/locally added suppliers
      const local = getStoredSuppliers();
      const map = new Map<string, Supplier>();
      local.forEach((s) => map.set(s.id, s));
      fromDb.forEach((s) => map.set(s.id, s));
      const merged = Array.from(map.values());
      saveSuppliers(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[OBRYNT] Could not fetch suppliers from database:', err);
  }

  return getStoredSuppliers();
}

/**
 * Retrieve supplier fulfilment requests
 */
export function getStoredFulfilments(): SupplierFulfilment[] {
  try {
    const raw = localStorage.getItem(FULFILMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save supplier fulfilment requests
 */
export function saveFulfilments(fulfilments: SupplierFulfilment[]): void {
  try {
    localStorage.setItem(FULFILMENTS_STORAGE_KEY, JSON.stringify(fulfilments));
  } catch (err) {
    console.warn('Failed to save fulfilments:', err);
  }
}

/**
 * Map an item to a supplier based on direct product linkage, category, or custom studio origin
 */
export function mapItemToSupplier(item: CartItem, suppliers: Supplier[]): Supplier {
  // 1. Direct product linkage: if the product is explicitly linked to a supplying company, route directly to it!
  if (item.product.supplierId) {
    const linked = suppliers.find((s) => s.id === item.product.supplierId);
    if (linked) return linked;
  }

  // 2. If it's a bespoke custom design, always route to OBRYNT Bespoke Atelier
  if (item.customDesign || item.product.category === 'Custom Design') {
    return (
      suppliers.find((s) => s.id === 'sup_obrynt_atelier') ||
      suppliers[0] ||
      INITIAL_SUPPLIERS[0]
    );
  }

  // 3. If footwear, route to Agra Leathercraft
  if (
    item.product.category === 'Footwear' ||
    item.product.type === 'shoe' ||
    item.product.name.toLowerCase().includes('sneaker') ||
    item.product.name.toLowerCase().includes('slides')
  ) {
    return (
      suppliers.find((s) => s.id === 'sup_agra_footwear') ||
      suppliers[0] ||
      INITIAL_SUPPLIERS[0]
    );
  }

  // 4. T-shirts, hoodies, knitwear route to Tirupur Knits
  if (
    item.product.category === 'T-Shirts' ||
    item.product.category === 'Gym & Sports' ||
    item.product.type === 'shirt' ||
    item.product.type === 'hoodie'
  ) {
    return (
      suppliers.find((s) => s.id === 'sup_tirupur_knits') ||
      suppliers[0] ||
      INITIAL_SUPPLIERS[0]
    );
  }

  // Fallback to primary supplier
  return suppliers[0] || INITIAL_SUPPLIERS[0];
}

/**
 * Core Business Feature: Split a single customer order into separate, isolated
 * supplier fulfilment requests.
 */
export function splitOrderIntoSupplierFulfilments(
  order: OrderDetails,
  suppliers: Supplier[]
): SupplierFulfilment[] {
  const supplierBuckets = new Map<string, CartItem[]>();

  for (const item of order.items) {
    const supplier = mapItemToSupplier(item, suppliers);
    const existing = supplierBuckets.get(supplier.id) || [];
    existing.push(item);
    supplierBuckets.set(supplier.id, existing);
  }

  const result: SupplierFulfilment[] = [];

  supplierBuckets.forEach((items, supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId) || INITIAL_SUPPLIERS[0];
    
    // Calculate customer total for this supplier's slice
    const customerPrice = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Negotiated wholesale cost
    const discountFactor = 1 - (supplier.wholesaleDiscountPct || 30) / 100;
    const totalWholesaleCost = Math.round(customerPrice * discountFactor);

    // Allocated courier shipping cost
    const shippingCost = items.length > 0 ? 60 : 0;
    const platformCommission = customerPrice - totalWholesaleCost;
    const estimatedNetMargin = platformCommission - shippingCost;

    const fulfilment: SupplierFulfilment = {
      id: `FUL-${order.orderId.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}-${supplier.brandName.slice(0, 3).toUpperCase()}`,
      orderId: order.orderId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      totalWholesaleCost,
      customerPrice,
      shippingCost,
      commission: platformCommission,
      estimatedNetMargin,
      status: supplier.autoForwardOrders ? 'acknowledged' : 'pending',
      createdAt: order.date || new Date().toISOString(),
      settlementStatus: 'unsettled',
    };

    result.push(fulfilment);
  });

  return result;
}

/**
 * Calculate accurate marketplace financials
 */
export function calculateFinancials(
  orders: OrderDetails[],
  fulfilments: SupplierFulfilment[]
): FinancialBreakdown {
  const grossSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  // Total wholesale payable to suppliers
  const supplierCostPayable = fulfilments.reduce(
    (acc, f) => acc + (f.totalWholesaleCost || 0),
    0
  );

  // Total courier shipping liability
  const shippingCostLiability = orders.reduce(
    (acc, o) => acc + (o.shipping || 60),
    0
  );

  // Courier COD handling fees (approx 2% of COD orders)
  const courierCodFees = orders
    .filter((o) => o.paymentMethod?.toLowerCase().includes('cod') || o.paymentMethod?.toLowerCase().includes('cash'))
    .reduce((acc, o) => acc + Math.round(o.total * 0.02), 0);

  const platformGrossMargin = grossSales - supplierCostPayable - shippingCostLiability;
  const estimatedTaxes = Math.round(Math.max(0, platformGrossMargin) * 0.18); // 18% GST estimate
  const estimatedNetProfit = platformGrossMargin - estimatedTaxes - courierCodFees;

  // Pending COD remittances
  const pendingCodRemittances = orders
    .filter(
      (o) =>
        (o.paymentMethod?.toLowerCase().includes('cod') || o.paymentMethod?.toLowerCase().includes('cash')) &&
        o.status !== 'Delivered'
    )
    .reduce((acc, o) => acc + o.total, 0);

  return {
    grossSales,
    supplierCostPayable,
    shippingCostLiability,
    courierCodFees,
    platformGrossMargin,
    estimatedTaxes,
    estimatedNetProfit,
    pendingCodRemittances,
  };
}
