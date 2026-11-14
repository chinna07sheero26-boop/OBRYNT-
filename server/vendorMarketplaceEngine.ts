import express, { Request, Response, NextFunction, Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =========================================================================
// TYPES & SERVER-SIDE STORAGE STRUCTURE
// =========================================================================

export type AccountType = 'SHOP_OWNER' | 'SELLER';
export type PartnerCategory = 'EXISTING_SUPPLIER' | 'GARMENT_SHOP' | 'ROADSIDE_STORE';
export type RegistrationOption = 'OPTION_A_EXISTING_URL' | 'OPTION_B_NEW_PARTNER' | 'ADMIN_CREATED';
export type PartnerApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info_requested';
export type ShopStaffCategory = 'GARMENT_SHOP' | 'ROADSIDE_STORE';
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'blocked';
export type ApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'out_of_stock' | 'disabled';
export type CommissionMode = 'percentage' | 'fixed' | 'percentage_plus_fixed';
export type SubOrderStatus =
  | 'pending_acceptance'
  | 'accepted'
  | 'rejected'
  | 'processing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'returned';

interface InternalBankRecord {
  accountHolderName?: string;
  accountNumberMasked?: string;
  accountNumberHash?: string;
  ifscCode?: string;
  upiId?: string;
}

interface InternalVendorProfile {
  id: string;
  vendorCode: string;
  authUserId?: string;
  accountType: AccountType;
  partnerCategory: PartnerCategory;
  registrationOption: RegistrationOption;
  applicationStatus: PartnerApplicationStatus;
  existingWebsiteUrl?: string;
  rejectionReason?: string;
  infoRequestMessage?: string;
  registrationLinkId?: string;
  approvedAt?: string;
  approvedBy?: string;
  secureLoginTokenHash?: string;
  secureLoginLink?: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  status: AccountStatus;
  passwordHash: string; // scrypt salt:derivedKey — NEVER plaintext
  gstNumber?: string;
  bankDetails?: InternalBankRecord;
  commissionMode: CommissionMode;
  commissionRate: number;
  fixedCommission: number;
  platformFeePct: number;
  pickupAddress: string;
  notes?: string;
  createdBy: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface InternalRegistrationLink {
  id: string;
  tokenHash: string;
  partnerCategory: PartnerCategory | 'ANY';
  registrationOption: RegistrationOption | 'BOTH';
  intendedBusinessName?: string;
  createdBy: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  status: 'active' | 'used' | 'revoked' | 'expired';
  createdAt: string;
}

interface InternalStaffAccount {
  id: string;
  staffCode: string;
  authUserId?: string;
  vendorId: string;
  vendorCode: string;
  shopName: string;
  staffCategory: ShopStaffCategory;
  staffLabel: string;
  passwordHash: string;
  accessTokenHash: string;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface InternalPartnerNotification {
  id: string;
  vendorId?: string;
  recipientRole: 'ADMIN' | 'PARTNER';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface InternalShopProfile {
  id: string;
  vendorId: string;
  shopName: string;
  ownerName: string;
  shopAddress: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  shopPhotos: string[];
  gstNumber?: string;
  openingHours: string;
  pickupAddress: string;
  createdAt: string;
  updatedAt: string;
}

interface InternalProductVariant {
  id: string;
  vendorProductId: string;
  sku: string;
  size: string;
  color: string;
  colorHex?: string;
  originalPrice: number;
  supplierPrice: number;
  sellingPrice: number;
  stock: number;
  imageUrl?: string;
}

interface InternalVendorProduct {
  id: string;
  productCode: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  vendorType: AccountType;
  shopId?: string;
  shopName?: string;
  publishedProductSku?: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  audience: string;
  images: string[];
  videoUrl?: string;
  originalPrice: number;
  supplierPrice: number;
  sellingPrice: number;
  commissionOverrideMode?: CommissionMode;
  commissionOverrideRate?: number;
  commissionOverrideFixed?: number;
  totalStock: number;
  sizes: string[];
  colors: string[];
  variants: InternalProductVariant[];
  material?: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface InternalInventory {
  id: string;
  vendorId: string;
  vendorProductId: string;
  variantId?: string;
  sku: string;
  availableStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  lastRestockedAt: string;
  updatedAt: string;
}

interface InternalSubOrderItem {
  id: string;
  vendorOrderId: string;
  vendorProductId?: string;
  variantId?: string;
  sku: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  supplierPrice: number;
  sellingPrice: number;
  obryntCommission: number;
  applicableFees: number;
  vendorPayable: number;
  imageUrl?: string;
}

interface InternalSubOrder {
  id: string;
  suborderCode: string;
  parentOrderCode: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  vendorType: AccountType;
  shopId?: string;
  shopName?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  pickupAddress: string;
  paymentMode: 'PREPAID' | 'COD';
  codAmountToCollect: number;
  subtotalSellingPrice: number;
  totalSupplierPrice: number;
  obryntCommission: number;
  applicableFees: number;
  vendorPayableAmount: number;
  stockConfirmed: boolean;
  status: SubOrderStatus;
  rejectionReason?: string;
  trackingNumber?: string;
  deliveryAssignmentId?: string;
  items: InternalSubOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface InternalCommissionRule {
  id: string;
  scope: 'global' | 'vendor' | 'product';
  vendorId?: string;
  vendorName?: string;
  vendorProductId?: string;
  productName?: string;
  commissionMode: CommissionMode;
  percentageRate: number;
  fixedAmount: number;
  platformFeePct: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InternalSettlement {
  id: string;
  settlementCode: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  vendorType: AccountType;
  vendorOrderId: string;
  suborderCode: string;
  parentOrderCode: string;
  grossSellingAmount: number;
  supplierAgreedAmount: number;
  obryntCommission: number;
  applicableFees: number;
  netVendorPayable: number;
  settlementStatus: 'pending' | 'eligible' | 'on_hold' | 'settled' | 'cancelled';
  paymentReference?: string;
  settledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InternalActivityLog {
  id: string;
  actorId: string;
  actorRole: string;
  vendorId?: string;
  vendorCode?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

interface MarketplaceDatabase {
  vendors: InternalVendorProfile[];
  shops: InternalShopProfile[];
  products: InternalVendorProduct[];
  inventory: InternalInventory[];
  orders: InternalSubOrder[];
  commissions: InternalCommissionRule[];
  settlements: InternalSettlement[];
  logs: InternalActivityLog[];
  registrationLinks: InternalRegistrationLink[];
  staffAccounts: InternalStaffAccount[];
  notifications: InternalPartnerNotification[];
  counters: {
    dukaniSeq: number;
    sellerSeq: number;
    supplierSeq: number;
    garmentSeq: number;
    roadsideSeq: number;
    staffSeq: number;
    productSeq: number;
    suborderSeq: number;
    settlementSeq: number;
  };
}

// =========================================================================
// SECRETS & SUPABASE ADMIN INITIALIZATION
// =========================================================================

const OWNER_SESSION_SECRET = (
  process.env.OWNER_SESSION_SECRET || 'obrynt_secure_owner_hmac_master_secret_2026'
).trim();

const VENDOR_SESSION_SECRET = (
  process.env.VENDOR_SESSION_SECRET || 'obrynt_secure_vendor_hmac_secret_2026'
).trim();

const DB_FILE_PATH = path.resolve(process.cwd(), '.obrynt-marketplace-db.json');

function getSupabaseAdmin(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !serviceRoleKey || !url.startsWith('http')) {
    return null;
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =========================================================================
// PERSISTENT STORE (NO FAKE PRODUCTS OR DEMO VENDORS IN PRODUCTION!)
// =========================================================================

function createEmptyDb(): MarketplaceDatabase {
  const now = new Date().toISOString();
  return {
    vendors: [],
    shops: [],
    products: [],
    inventory: [],
    orders: [],
    commissions: [
      {
        id: 'comm-global-default',
        scope: 'global',
        commissionMode: 'percentage',
        percentageRate: 10,
        fixedAmount: 0,
        platformFeePct: 2,
        isActive: true,
        notes: 'Default marketplace global commission (10% + 2% platform fee)',
        createdAt: now,
        updatedAt: now,
      },
    ],
    settlements: [],
    logs: [],
    registrationLinks: [],
    staffAccounts: [],
    notifications: [],
    counters: {
      dukaniSeq: 1000,
      sellerSeq: 1000,
      supplierSeq: 1000,
      garmentSeq: 1000,
      roadsideSeq: 1000,
      staffSeq: 1000,
      productSeq: 1000,
      suborderSeq: 1000,
      settlementSeq: 1000,
    },
  };
}

function normalizeVendorRecord(v: any): InternalVendorProfile {
  const inferredCategory: PartnerCategory =
    v.partnerCategory ||
    (v.accountType === 'SELLER' ? 'EXISTING_SUPPLIER' : 'GARMENT_SHOP');
  const inferredAppStatus: PartnerApplicationStatus =
    v.applicationStatus || (v.status === 'active' || v.status === 'suspended' || v.status === 'blocked' ? 'approved' : 'pending');
  return {
    ...v,
    partnerCategory: inferredCategory,
    registrationOption: v.registrationOption || 'ADMIN_CREATED',
    applicationStatus: inferredAppStatus,
  };
}

function loadDb(): MarketplaceDatabase {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      const base = createEmptyDb();
      return {
        ...base,
        ...parsed,
        vendors: Array.isArray(parsed.vendors) ? parsed.vendors.map(normalizeVendorRecord) : [],
        registrationLinks: Array.isArray(parsed.registrationLinks) ? parsed.registrationLinks : [],
        staffAccounts: Array.isArray(parsed.staffAccounts) ? parsed.staffAccounts : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        counters: {
          ...base.counters,
          ...(parsed.counters || {}),
        },
      };
    }
  } catch (err) {
    console.warn('[OBRYNT Vendor Engine] Starting fresh store:', err);
  }
  return createEmptyDb();
}

let db: MarketplaceDatabase = loadDb();

function saveDb(): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[OBRYNT Vendor Engine] Failed to save DB:', err);
  }
}

// =========================================================================
// CRYPTOGRAPHIC PASSWORD & TOKEN HELPERS
// =========================================================================

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  try {
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(plain, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

function generateSecureTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#';
  let pw = 'Ob!';
  const bytes = crypto.randomBytes(9);
  for (let i = 0; i < 9; i++) {
    pw += chars[bytes[i] % chars.length];
  }
  return pw;
}

function maskAccountNumber(raw?: string): string | undefined {
  if (!raw) return undefined;
  const clean = raw.replace(/\s+/g, '');
  if (clean.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
}

function signVendorToken(payload: {
  vendorId: string;
  vendorCode: string;
  accountType: AccountType;
  email: string;
  issuedAt: number;
  expiresAt: number;
}): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', VENDOR_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifyVendorToken(token: string): {
  valid: boolean;
  payload?: {
    vendorId: string;
    vendorCode: string;
    accountType: AccountType;
    email: string;
    issuedAt: number;
    expiresAt: number;
  };
  error?: string;
} {
  if (!token || !token.includes('.')) {
    return { valid: false, error: 'Missing or malformed vendor token.' };
  }
  const [payloadB64, sig] = token.split('.');
  try {
    const expectedSig = crypto
      .createHmac('sha256', VENDOR_SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, error: 'Invalid vendor token signature.' };
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Vendor session has expired.' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid vendor token structure.' };
  }
}

function verifyOwnerTokenString(token: string): { valid: boolean; userEmail?: string; userId?: string } {
  if (!token || !token.includes('.')) return { valid: false };
  const [payloadB64, signature] = token.split('.');
  try {
    const expected = crypto
      .createHmac('sha256', OWNER_SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { valid: false };
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) return { valid: false };
    if (payload.role !== 'owner' && payload.role !== 'admin' && payload.role !== 'super_admin') {
      return { valid: false };
    }
    return { valid: true, userEmail: payload.userEmail, userId: payload.userId };
  } catch {
    return { valid: false };
  }
}

function extractBearerToken(req: Request): string {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return '';
}

function sha256Hex(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeWebsiteUrl(url?: string): string {
  if (!url) return '';
  let clean = url.trim().toLowerCase();
  if (!clean) return '';
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean.replace(/\/+$/, '');
}

function inferAccountTypeFromCategory(cat: PartnerCategory): AccountType {
  return cat === 'EXISTING_SUPPLIER' ? 'SELLER' : 'SHOP_OWNER';
}

function getCategoryLabel(cat: PartnerCategory): string {
  if (cat === 'EXISTING_SUPPLIER') return 'Existing Supplier';
  if (cat === 'ROADSIDE_STORE') return 'Roadside Store';
  return 'Garment Shop';
}

const SHOP_STAFF_SECRET = (
  process.env.VENDOR_SESSION_SECRET || 'obrynt_secure_vendor_hmac_secret_2026'
) + '_staff_portal';

function signShopStaffToken(payload: {
  staffId: string;
  staffCode: string;
  vendorId: string;
  staffCategory: ShopStaffCategory;
  role: 'GARMENT_STAFF' | 'ROADSIDE_STAFF';
  issuedAt: number;
  expiresAt: number;
}): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SHOP_STAFF_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifyShopStaffToken(token: string): {
  valid: boolean;
  payload?: {
    staffId: string;
    staffCode: string;
    vendorId: string;
    staffCategory: ShopStaffCategory;
    role: 'GARMENT_STAFF' | 'ROADSIDE_STAFF';
    issuedAt: number;
    expiresAt: number;
  };
  error?: string;
} {
  if (!token || !token.includes('.')) {
    return { valid: false, error: 'Missing or malformed staff token.' };
  }
  const [payloadB64, sig] = token.split('.');
  try {
    const expectedSig = crypto
      .createHmac('sha256', SHOP_STAFF_SECRET)
      .update(payloadB64)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, error: 'Invalid staff token signature.' };
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Staff session has expired.' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid staff token structure.' };
  }
}

// Per-IP rate limiter for private staff login and registration link endpoints
const portalRateLimits = new Map<string, { count: number; lockedUntil: number }>();

function getReqIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'anon';
}

function checkPortalLockout(key: string): { locked: boolean; remainingSec: number } {
  const entry = portalRateLimits.get(key);
  if (!entry) return { locked: false, remainingSec: 0 };
  if (entry.lockedUntil > Date.now()) {
    return { locked: true, remainingSec: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  if (entry.lockedUntil > 0 && entry.lockedUntil <= Date.now()) {
    portalRateLimits.delete(key);
  }
  return { locked: false, remainingSec: 0 };
}

function recordPortalFailure(key: string, maxAttempts = 5, lockMs = 15 * 60 * 1000) {
  const entry = portalRateLimits.get(key) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= maxAttempts) {
    entry.lockedUntil = Date.now() + lockMs;
  }
  portalRateLimits.set(key, entry);
  return entry;
}

function resetPortalLimit(key: string) {
  portalRateLimits.delete(key);
}

function appendNotification(entry: Omit<InternalPartnerNotification, 'id' | 'isRead' | 'createdAt'>) {
  db.notifications.unshift({
    id: `pnot-${crypto.randomUUID()}`,
    ...entry,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  if (db.notifications.length > 250) {
    db.notifications = db.notifications.slice(0, 250);
  }
}

function appendActivityLog(entry: Omit<InternalActivityLog, 'id' | 'createdAt'>): void {
  db.logs.unshift({
    id: `vlog-${crypto.randomUUID()}`,
    ...entry,
    createdAt: new Date().toISOString(),
  });
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
}

function sanitizeVendorForResponse(vendor: InternalVendorProfile, includeStats = false) {
  const { passwordHash: _pw, secureLoginTokenHash: _lt, ...safeVendor } = vendor;
  const shopProfile = db.shops.find((s) => s.vendorId === vendor.id);
  const safeBank = vendor.bankDetails
    ? {
        accountHolderName: vendor.bankDetails.accountHolderName,
        accountNumberMasked: vendor.bankDetails.accountNumberMasked,
        ifscCode: vendor.bankDetails.ifscCode,
        upiId: vendor.bankDetails.upiId,
      }
    : undefined;

  let stats;
  if (includeStats) {
    const vProducts = db.products.filter((p) => p.vendorId === vendor.id);
    const vOrders = db.orders.filter((o) => o.vendorId === vendor.id);
    stats = {
      totalProducts: vProducts.length,
      approvedProducts: vProducts.filter((p) => p.approvalStatus === 'approved').length,
      pendingProducts: vProducts.filter((p) => p.approvalStatus === 'pending_approval').length,
      totalStockUnits: vProducts.reduce((s, p) => s + (p.totalStock || 0), 0),
      totalOrders: vOrders.length,
      totalSales: vOrders
        .filter((o) => o.status !== 'rejected' && o.status !== 'cancelled')
        .reduce((s, o) => s + o.subtotalSellingPrice, 0),
      totalCommission: vOrders
        .filter((o) => o.status !== 'rejected' && o.status !== 'cancelled')
        .reduce((s, o) => s + o.obryntCommission, 0),
      totalPayable: vOrders
        .filter((o) => o.status !== 'rejected' && o.status !== 'cancelled')
        .reduce((s, o) => s + o.vendorPayableAmount, 0),
    };
  }

  return {
    ...safeVendor,
    bankDetails: safeBank,
    shopProfile,
    ...(stats ? { stats } : {}),
  };
}

// =========================================================================
// COMMISSION CALCULATION ENGINE
// =========================================================================

export function resolveCommissionRule(vendorId: string, vendorProductId?: string) {
  // 1. Product-specific rule (highest priority)
  if (vendorProductId) {
    const prodRule = db.commissions.find(
      (c) => c.isActive && c.scope === 'product' && c.vendorProductId === vendorProductId
    );
    if (prodRule) return prodRule;

    const prod = db.products.find((p) => p.id === vendorProductId);
    if (prod?.commissionOverrideMode) {
      return {
        commissionMode: prod.commissionOverrideMode,
        percentageRate: prod.commissionOverrideRate ?? 0,
        fixedAmount: prod.commissionOverrideFixed ?? 0,
        platformFeePct: 2,
      };
    }
  }

  // 2. Vendor-specific rule
  const vendorRule = db.commissions.find(
    (c) => c.isActive && c.scope === 'vendor' && c.vendorId === vendorId
  );
  if (vendorRule) return vendorRule;

  // 3. Vendor profile defaults
  const vendor = db.vendors.find((v) => v.id === vendorId);
  if (vendor) {
    return {
      commissionMode: vendor.commissionMode,
      percentageRate: vendor.commissionRate,
      fixedAmount: vendor.fixedCommission,
      platformFeePct: vendor.platformFeePct ?? 2,
    };
  }

  // 4. Global active rule
  const globalRule = db.commissions.find((c) => c.isActive && c.scope === 'global');
  return (
    globalRule || {
      commissionMode: 'percentage' as CommissionMode,
      percentageRate: 10,
      fixedAmount: 0,
      platformFeePct: 2,
    }
  );
}

export function calculateCommissionBreakdown(params: {
  vendorId: string;
  vendorProductId?: string;
  supplierPrice: number;
  sellingPrice: number;
  quantity: number;
}) {
  const rule = resolveCommissionRule(params.vendorId, params.vendorProductId);
  const grossSelling = Math.max(0, Number(params.sellingPrice) * params.quantity);
  const totalSupplier = Math.max(0, Number(params.supplierPrice) * params.quantity);

  let commission = 0;
  if (rule.commissionMode === 'percentage') {
    commission = Math.round((grossSelling * (rule.percentageRate || 0)) / 100);
  } else if (rule.commissionMode === 'fixed') {
    commission = Math.round((rule.fixedAmount || 0) * params.quantity);
  } else {
    commission = Math.round(
      (grossSelling * (rule.percentageRate || 0)) / 100 + (rule.fixedAmount || 0) * params.quantity
    );
  }

  const feePct = rule.platformFeePct ?? 2;
  const applicableFees = Math.round((grossSelling * feePct) / 100);
  const vendorPayable = Math.max(0, grossSelling - commission - applicableFees);

  return {
    grossSelling,
    totalSupplier,
    obryntCommission: commission,
    applicableFees,
    vendorPayable,
  };
}

// =========================================================================
// SUPABASE CLOUD SYNC HELPERS (RUNS WHENEVER SUPABASE SERVICE KEY EXISTS)
// =========================================================================

async function syncVendorToSupabase(vendor: InternalVendorProfile, shop?: InternalShopProfile) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    await sb.from('vendor_profiles').upsert({
      id: vendor.id,
      vendor_code: vendor.vendorCode,
      auth_user_id: vendor.authUserId || null,
      account_type: vendor.accountType,
      partner_category: vendor.partnerCategory,
      registration_option: vendor.registrationOption,
      existing_website_url: vendor.existingWebsiteUrl || null,
      application_status: vendor.applicationStatus,
      rejection_reason: vendor.rejectionReason || null,
      info_request_message: vendor.infoRequestMessage || null,
      registration_link_id: vendor.registrationLinkId || null,
      approved_at: vendor.approvedAt || null,
      approved_by: vendor.approvedBy || null,
      full_name: vendor.fullName,
      business_name: vendor.businessName,
      email: vendor.email || null,
      phone: vendor.phone,
      status: vendor.status,
      password_hash: vendor.passwordHash,
      gst_number: vendor.gstNumber || null,
      bank_account_holder: vendor.bankDetails?.accountHolderName || null,
      bank_account_masked: vendor.bankDetails?.accountNumberMasked || null,
      bank_ifsc: vendor.bankDetails?.ifscCode || null,
      upi_id: vendor.bankDetails?.upiId || null,
      commission_mode: vendor.commissionMode,
      commission_rate: vendor.commissionRate,
      fixed_commission: vendor.fixedCommission,
      pickup_address: vendor.pickupAddress,
      notes: vendor.notes || null,
      last_login_at: vendor.lastLoginAt || null,
      created_at: vendor.createdAt,
      updated_at: vendor.updatedAt,
    });

    if (shop) {
      await sb.from('vendor_shops').upsert({
        id: shop.id,
        vendor_id: shop.vendorId,
        shop_name: shop.shopName,
        owner_name: shop.ownerName,
        shop_address: shop.shopAddress,
        city: shop.city,
        state: shop.state,
        pincode: shop.pincode,
        contact_number: shop.contactNumber,
        shop_photos: shop.shopPhotos,
        gst_number: shop.gstNumber || null,
        opening_hours: shop.openingHours,
        pickup_address: shop.pickupAddress,
        created_at: shop.createdAt,
        updated_at: shop.updatedAt,
      });
    }
  } catch (err) {
    console.warn('[OBRYNT Supabase Sync] vendor_profiles sync warning:', err);
  }
}

async function syncProductToSupabase(prod: InternalVendorProduct) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    await sb.from('vendor_products').upsert({
      id: prod.id,
      product_code: prod.productCode,
      vendor_id: prod.vendorId,
      vendor_type: prod.vendorType,
      shop_id: prod.shopId || null,
      name: prod.name,
      description: prod.description,
      category: prod.category,
      subcategory: prod.subcategory || null,
      audience: prod.audience,
      images: prod.images,
      video_url: prod.videoUrl || null,
      original_price: prod.originalPrice,
      supplier_price: prod.supplierPrice,
      selling_price: prod.sellingPrice,
      commission_override_mode: prod.commissionOverrideMode || null,
      commission_override_rate: prod.commissionOverrideRate ?? null,
      commission_override_fixed: prod.commissionOverrideFixed ?? null,
      total_stock: prod.totalStock,
      sizes: prod.sizes,
      colors: prod.colors,
      material: prod.material || null,
      approval_status: prod.approvalStatus,
      rejection_reason: prod.rejectionReason || null,
      submitted_at: prod.submittedAt,
      reviewed_at: prod.reviewedAt || null,
      reviewed_by: prod.reviewedBy || null,
      created_at: prod.createdAt,
      updated_at: prod.updatedAt,
    });

    if (prod.approvalStatus === 'approved') {
      await sb.from('products').upsert(
        {
          sku: prod.productCode,
          name: prod.name,
          description: prod.description,
          category: prod.category,
          subcategory: prod.subcategory || null,
          audience: prod.audience || 'Unisex',
          brand: prod.shopName || prod.vendorName || 'OBRYNT',
          retail_price: prod.sellingPrice,
          original_price: prod.originalPrice || prod.sellingPrice,
          wholesale_cost: prod.supplierPrice,
          stock: prod.totalStock,
          status: prod.totalStock > 0 ? 'active' : 'out_of_stock',
          is_published: true,
          is_approved: true,
          vendor_id: prod.vendorId,
          vendor_type: prod.vendorType,
          shop_id: prod.shopId || null,
          approval_status: 'approved',
          image_url: prod.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg',
          gallery_urls: prod.images,
          sizes: prod.sizes,
          colors: prod.colors,
        },
        { onConflict: 'sku' }
      );
    } else {
      await sb
        .from('products')
        .update({
          is_published: false,
          is_approved: false,
          approval_status: prod.approvalStatus,
        })
        .eq('sku', prod.productCode);
    }
  } catch (err) {
    console.warn('[OBRYNT Supabase Sync] vendor_products sync warning:', err);
  }
}

// =========================================================================
// MIDDLEWARE: STRICT ROLE AUTHENTICATION
// =========================================================================

interface AuthedRequest extends Request {
  adminAuth?: { userId: string; userEmail: string; role: 'SUPER_ADMIN' };
  vendorAuth?: {
    vendorId: string;
    vendorCode: string;
    accountType: AccountType;
    partnerCategory: PartnerCategory;
    email: string;
  };
  staffAuth?: {
    staffId: string;
    staffCode: string;
    vendorId: string;
    staffCategory: ShopStaffCategory;
    role: 'GARMENT_STAFF' | 'ROADSIDE_STAFF';
  };
}

async function requireAdminAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Admin authorization token required.' });
    return;
  }

  // 1. Check Owner HMAC Token
  const ownerCheck = verifyOwnerTokenString(token);
  if (ownerCheck.valid) {
    req.adminAuth = {
      userId: ownerCheck.userId || 'owner',
      userEmail: ownerCheck.userEmail || 'admin@obrynt.com',
      role: 'SUPER_ADMIN',
    };
    next();
    return;
  }

  // 2. Check Supabase JWT if configured
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { data: userRes } = await sb.auth.getUser(token);
      if (userRes?.user) {
        const { data: profile } = await sb
          .from('profiles')
          .select('role')
          .eq('id', userRes.user.id)
          .maybeSingle();
        if (profile && ['owner', 'admin', 'super_admin'].includes(profile.role)) {
          req.adminAuth = {
            userId: userRes.user.id,
            userEmail: userRes.user.email || '',
            role: 'SUPER_ADMIN',
          };
          next();
          return;
        }
      }
    } catch {}
  }

  res.status(403).json({
    success: false,
    error: 'Forbidden: SUPER ADMIN privileges required for this action.',
  });
}

async function requireVendorAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Vendor authorization token required.' });
    return;
  }

  const check = verifyVendorToken(token);
  if (!check.valid || !check.payload) {
    res.status(401).json({ success: false, error: check.error || 'Unauthorized vendor token.' });
    return;
  }

  // Re-verify live vendor approval and account status on EVERY request
  const vendor = db.vendors.find((v) => v.id === check.payload!.vendorId);
  if (!vendor) {
    res.status(403).json({ success: false, error: 'Partner account no longer exists.' });
    return;
  }
  if (vendor.applicationStatus !== 'approved') {
    res.status(403).json({
      success: false,
      error: `Account is currently ${vendor.applicationStatus.toUpperCase()}. Admin approval is required before accessing partner features.`,
    });
    return;
  }
  if (vendor.status !== 'active') {
    res.status(403).json({
      success: false,
      error: `Account access denied: your partner status is ${vendor.status.toUpperCase()}. Contact OBRYNT Admin.`,
    });
    return;
  }

  req.vendorAuth = {
    vendorId: vendor.id,
    vendorCode: vendor.vendorCode,
    accountType: vendor.accountType,
    partnerCategory: vendor.partnerCategory,
    email: vendor.email,
  };
  next();
}

async function requireShopStaffAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Staff authorization token required.' });
    return;
  }
  const check = verifyShopStaffToken(token);
  if (!check.valid || !check.payload) {
    res.status(401).json({ success: false, error: check.error || 'Invalid staff session.' });
    return;
  }

  const staff = db.staffAccounts.find((s) => s.id === check.payload!.staffId);
  if (!staff || staff.status !== 'active') {
    res.status(403).json({ success: false, error: 'Staff access has been deactivated. Contact OBRYNT Admin.' });
    return;
  }

  const vendor = db.vendors.find((v) => v.id === staff.vendorId);
  if (!vendor || vendor.status !== 'active' || vendor.applicationStatus !== 'approved') {
    res.status(403).json({ success: false, error: 'Parent shop account is not active.' });
    return;
  }

  req.staffAuth = {
    staffId: staff.id,
    staffCode: staff.staffCode,
    vendorId: vendor.id,
    staffCategory: staff.staffCategory,
    role: check.payload.role,
  };
  next();
}

// =========================================================================
// ROUTER DEFINITION
// =========================================================================

export function createVendorMarketplaceRouter(): Router {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // BLOCK UNCONTROLLED PUBLIC VENDOR SIGNUP (APPLICATIONS MUST GO THROUGH APPROVAL)
  // -----------------------------------------------------------------------
  router.all(['/vendor/register', '/vendors/register', '/vendor/signup', '/dukani/register'], (_req, res) => {
    res.status(403).json({
      success: false,
      error:
        'Direct self-activation is disabled. Use a valid OBRYNT partner registration link to submit an application for Admin approval.',
    });
  });

  // -----------------------------------------------------------------------
  // TOKENIZED PARTNER REGISTRATION LINKS & PENDING APPLICATION SUBMISSION
  // -----------------------------------------------------------------------
  router.post('/partners/create-registration-link', (req: Request, res: Response) => {
    const ipKey = `reglink:${getReqIp(req)}`;
    const lock = checkPortalLockout(ipKey);
    if (lock.locked) {
      res.status(429).json({
        success: false,
        error: `Too many registration links generated. Wait ${Math.ceil(lock.remainingSec / 60)} min(s).`,
      });
      return;
    }

    const body = req.body || {};
    const partnerCategory: PartnerCategory | 'ANY' = ['EXISTING_SUPPLIER', 'GARMENT_SHOP', 'ROADSIDE_STORE'].includes(
      body.partnerCategory
    )
      ? body.partnerCategory
      : 'ANY';
    const registrationOption: RegistrationOption | 'BOTH' =
      body.registrationOption === 'OPTION_A_EXISTING_URL' || body.registrationOption === 'OPTION_B_NEW_PARTNER'
        ? body.registrationOption
        : 'BOTH';

    const rawToken = `obreg_${crypto.randomBytes(18).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const link: InternalRegistrationLink = {
      id: crypto.randomUUID(),
      tokenHash: sha256Hex(rawToken),
      partnerCategory,
      registrationOption,
      intendedBusinessName: body.intendedBusinessName ? String(body.intendedBusinessName).trim() : undefined,
      createdBy: 'partner_onboarding_wizard',
      expiresAt,
      maxUses: 1,
      usedCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    db.registrationLinks.unshift(link);
    if (db.registrationLinks.length > 300) {
      db.registrationLinks = db.registrationLinks.slice(0, 300);
    }
    recordPortalFailure(ipKey, 20, 10 * 60 * 1000);
    saveDb();

    res.status(201).json({
      success: true,
      token: rawToken,
      link: {
        id: link.id,
        partnerCategory: link.partnerCategory,
        registrationOption: link.registrationOption,
        expiresAt: link.expiresAt,
      },
      registrationPath: `/partner-register?token=${encodeURIComponent(rawToken)}`,
    });
  });

  router.get('/partners/registration-links/:token', (req: Request, res: Response) => {
    const rawToken = String(req.params.token || '').trim();
    if (!rawToken) {
      res.status(400).json({ success: false, valid: false, error: 'Registration token is required.' });
      return;
    }
    const tokenHash = sha256Hex(rawToken);
    const link = db.registrationLinks.find((l) => l.tokenHash === tokenHash);
    if (!link) {
      res.status(404).json({ success: false, valid: false, error: 'Invalid or unrecognized registration link.' });
      return;
    }
    if (link.status === 'revoked') {
      res.status(403).json({ success: false, valid: false, error: 'This registration link was revoked by OBRYNT Admin.' });
      return;
    }
    if (Date.now() > new Date(link.expiresAt).getTime() || link.status === 'expired') {
      link.status = 'expired';
      saveDb();
      res.status(410).json({ success: false, valid: false, error: 'This registration link has expired. Request a fresh link.' });
      return;
    }
    if (link.usedCount >= link.maxUses || link.status === 'used') {
      res.status(410).json({ success: false, valid: false, error: 'This registration link has already been used.' });
      return;
    }

    res.json({
      success: true,
      valid: true,
      link: {
        id: link.id,
        partnerCategory: link.partnerCategory,
        registrationOption: link.registrationOption,
        intendedBusinessName: link.intendedBusinessName,
        expiresAt: link.expiresAt,
      },
    });
  });

  router.post('/partners/apply', async (req: Request, res: Response) => {
    const body = req.body || {};
    const rawToken = String(body.token || '').trim();
    if (!rawToken) {
      res.status(403).json({
        success: false,
        error: 'A valid, unexpired OBRYNT registration link token is required to submit a partner application.',
      });
      return;
    }

    const link = db.registrationLinks.find((l) => l.tokenHash === sha256Hex(rawToken));
    if (!link || link.status === 'revoked') {
      res.status(403).json({ success: false, error: 'Registration link is invalid or has been revoked.' });
      return;
    }
    if (Date.now() > new Date(link.expiresAt).getTime() || link.status === 'expired') {
      link.status = 'expired';
      saveDb();
      res.status(410).json({ success: false, error: 'Registration link has expired.' });
      return;
    }
    if (link.usedCount >= link.maxUses || link.status === 'used') {
      res.status(409).json({ success: false, error: 'This registration link has already been submitted.' });
      return;
    }

    const partnerCategory: PartnerCategory = body.partnerCategory;
    if (!['EXISTING_SUPPLIER', 'GARMENT_SHOP', 'ROADSIDE_STORE'].includes(partnerCategory)) {
      res.status(400).json({ success: false, error: 'Valid partner category is required.' });
      return;
    }
    if (link.partnerCategory !== 'ANY' && link.partnerCategory !== partnerCategory) {
      res.status(403).json({
        success: false,
        error: `This registration link is restricted to ${getCategoryLabel(link.partnerCategory)}.`,
      });
      return;
    }

    const registrationOption: RegistrationOption =
      body.registrationOption === 'OPTION_A_EXISTING_URL' ? 'OPTION_A_EXISTING_URL' : 'OPTION_B_NEW_PARTNER';
    const businessName = String(body.businessName || '').trim();
    const ownerName = String(body.ownerName || body.fullName || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const address = String(body.address || body.shopAddress || '').trim();
    const existingWebsiteUrl = normalizeWebsiteUrl(body.existingWebsiteUrl);
    const password = String(body.password || '');

    if (!businessName || !ownerName || !phone || !address) {
      res.status(400).json({
        success: false,
        error: 'Business name, owner name, mobile number, and complete business address are required.',
      });
      return;
    }

    const phoneDigits = normalizePhoneDigits(phone);
    if (phoneDigits.length < 8) {
      res.status(400).json({ success: false, error: 'Please enter a valid mobile number.' });
      return;
    }

    if (registrationOption === 'OPTION_A_EXISTING_URL' && !existingWebsiteUrl) {
      res.status(400).json({
        success: false,
        error: 'Existing website or supplier URL is required for Option A registration.',
      });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Please set a secure login password (minimum 6 characters).',
      });
      return;
    }

    // Strict duplicate prevention across email, normalized phone, and website URL
    const duplicate = db.vendors.find((v) => {
      if (email && v.email && v.email.toLowerCase() === email) return true;
      if (normalizePhoneDigits(v.phone) === phoneDigits) return true;
      if (existingWebsiteUrl && v.existingWebsiteUrl && normalizeWebsiteUrl(v.existingWebsiteUrl) === existingWebsiteUrl) {
        return true;
      }
      return false;
    });

    if (duplicate) {
      res.status(409).json({
        success: false,
        error: `An application or partner account with these details already exists (Status: ${duplicate.applicationStatus.toUpperCase()}).`,
      });
      return;
    }

    let vendorCode = '';
    if (partnerCategory === 'EXISTING_SUPPLIER') {
      db.counters.supplierSeq += 1;
      vendorCode = `SUP-${db.counters.supplierSeq}`;
    } else if (partnerCategory === 'ROADSIDE_STORE') {
      db.counters.roadsideSeq += 1;
      vendorCode = `RDS-${db.counters.roadsideSeq}`;
    } else {
      db.counters.garmentSeq += 1;
      vendorCode = `GAR-${db.counters.garmentSeq}`;
    }

    const vendorId = crypto.randomUUID();
    const accountType = inferAccountTypeFromCategory(partnerCategory);
    const now = new Date().toISOString();

    const newVendor: InternalVendorProfile = {
      id: vendorId,
      vendorCode,
      accountType,
      partnerCategory,
      registrationOption,
      applicationStatus: 'pending', // Strictly PENDING until Admin approves!
      existingWebsiteUrl: existingWebsiteUrl || undefined,
      registrationLinkId: link.id,
      fullName: ownerName,
      businessName,
      email,
      phone,
      status: 'inactive', // Strictly inactive until Admin approves!
      passwordHash: hashPassword(password),
      commissionMode: 'percentage',
      commissionRate: 10,
      fixedCommission: 0,
      platformFeePct: 2,
      pickupAddress: address,
      notes: body.notes ? String(body.notes).trim() : undefined,
      createdBy: 'partner_application',
      createdAt: now,
      updatedAt: now,
    };

    db.vendors.unshift(newVendor);

    let shop: InternalShopProfile | undefined;
    if (accountType === 'SHOP_OWNER') {
      shop = {
        id: crypto.randomUUID(),
        vendorId,
        shopName: businessName,
        ownerName,
        shopAddress: address,
        city: String(body.city || '').trim(),
        state: String(body.state || '').trim(),
        pincode: String(body.pincode || '').trim(),
        contactNumber: phone,
        shopPhotos: [],
        openingHours: '10:00 AM - 9:00 PM',
        pickupAddress: address,
        createdAt: now,
        updatedAt: now,
      };
      db.shops.unshift(shop);
    }

    link.usedCount += 1;
    if (link.usedCount >= link.maxUses) {
      link.status = 'used';
    }

    appendNotification({
      vendorId: newVendor.id,
      recipientRole: 'ADMIN',
      title: `New ${getCategoryLabel(partnerCategory)} Application`,
      message: `${businessName} (${ownerName} · ${phone}) submitted a ${
        registrationOption === 'OPTION_A_EXISTING_URL' ? 'URL-based' : 'New Store'
      } registration for approval.`,
    });

    appendActivityLog({
      actorId: newVendor.id,
      actorRole: partnerCategory,
      vendorId: newVendor.id,
      vendorCode: newVendor.vendorCode,
      action: 'partner_application_submitted',
      entityType: 'vendor_profile',
      entityId: newVendor.id,
      details: `${getCategoryLabel(partnerCategory)} "${businessName}" submitted application (${vendorCode}) -> PENDING approval.`,
    });
    saveDb();
    await syncVendorToSupabase(newVendor, shop);

    res.status(201).json({
      success: true,
      vendorCode,
      partnerCategory,
      applicationStatus: 'pending',
      message:
        'Application submitted to OBRYNT Admin. Your account remains PENDING until Admin reviews and approves it.',
    });
  });

  // Allow MORE_INFO_REQUESTED applicants to submit updated details (verified via their password)
  router.post('/partners/resubmit-info', async (req: Request, res: Response) => {
    const { identifier, password, businessName, ownerName, phone, email, address, existingWebsiteUrl, additionalInfo } =
      req.body || {};
    const rawId = String(identifier || '').trim().toLowerCase();
    const rawDigits = normalizePhoneDigits(rawId);
    const vendor = db.vendors.find(
      (v) =>
        v.vendorCode.toLowerCase() === rawId ||
        (v.email && v.email.toLowerCase() === rawId) ||
        (rawDigits.length >= 8 && normalizePhoneDigits(v.phone) === rawDigits)
    );

    if (!vendor || !verifyPassword(String(password || ''), vendor.passwordHash)) {
      res.status(401).json({ success: false, error: 'Invalid credentials for resubmission.' });
      return;
    }
    if (vendor.applicationStatus !== 'more_info_requested') {
      res.status(400).json({ success: false, error: 'Application is not awaiting additional information.' });
      return;
    }

    const now = new Date().toISOString();
    if (typeof businessName === 'string' && businessName.trim()) vendor.businessName = businessName.trim();
    if (typeof ownerName === 'string' && ownerName.trim()) vendor.fullName = ownerName.trim();
    if (typeof phone === 'string' && phone.trim()) vendor.phone = phone.trim();
    if (typeof email === 'string' && email.trim()) vendor.email = email.trim().toLowerCase();
    if (typeof address === 'string' && address.trim()) vendor.pickupAddress = address.trim();
    if (typeof existingWebsiteUrl === 'string' && existingWebsiteUrl.trim()) {
      vendor.existingWebsiteUrl = normalizeWebsiteUrl(existingWebsiteUrl);
    }
    if (typeof additionalInfo === 'string' && additionalInfo.trim()) {
      vendor.notes = `${vendor.notes ? vendor.notes + '\n' : ''}Partner Response (${now.slice(0, 10)}): ${additionalInfo.trim()}`;
    }
    vendor.applicationStatus = 'pending';
    vendor.updatedAt = now;

    const shop = db.shops.find((s) => s.vendorId === vendor.id);
    if (shop && typeof address === 'string' && address.trim()) {
      shop.shopAddress = address.trim();
      shop.pickupAddress = address.trim();
      shop.updatedAt = now;
    }

    appendNotification({
      vendorId: vendor.id,
      recipientRole: 'ADMIN',
      title: `Updated Info Submitted (${vendor.vendorCode})`,
      message: `${vendor.businessName} submitted the requested information and is ready for review.`,
    });
    appendActivityLog({
      actorId: vendor.id,
      actorRole: vendor.partnerCategory,
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'partner_resubmitted_info',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `${vendor.businessName} updated details following Admin info request.`,
    });
    saveDb();
    await syncVendorToSupabase(vendor, shop);

    res.json({
      success: true,
      applicationStatus: 'pending',
      message: 'Updated information sent to OBRYNT Admin for approval.',
    });
  });

  // -----------------------------------------------------------------------
  // VENDOR / PARTNER LOGIN & SESSION (SUP, GAR, RDS, DUK, SEL)
  // -----------------------------------------------------------------------
  router.post('/vendor/login', async (req: Request, res: Response) => {
    const { identifier, email, password } = req.body || {};
    const rawIdentifier = String(identifier || email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (!rawIdentifier || !rawPassword) {
      res.status(400).json({ success: false, error: 'Partner ID / Mobile / Email and password are required.' });
      return;
    }

    const phoneDigits = normalizePhoneDigits(rawIdentifier);
    const vendor = db.vendors.find(
      (v) =>
        (v.email && v.email.toLowerCase() === rawIdentifier) ||
        v.vendorCode.toLowerCase() === rawIdentifier ||
        (phoneDigits.length >= 8 && normalizePhoneDigits(v.phone) === phoneDigits)
    );

    if (!vendor) {
      res.status(401).json({ success: false, error: 'Invalid Partner ID/Mobile/Email or password.' });
      return;
    }

    const validPwd = verifyPassword(rawPassword, vendor.passwordHash);
    if (!validPwd) {
      appendActivityLog({
        actorId: vendor.id,
        actorRole: vendor.partnerCategory,
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        action: 'vendor_login_failed',
        entityType: 'vendor_profile',
        entityId: vendor.id,
        details: `Failed login attempt for ${vendor.vendorCode}`,
      });
      saveDb();
      res.status(401).json({ success: false, error: 'Invalid Partner ID/Mobile/Email or password.' });
      return;
    }

    // Strict Admin Approval Enforcement — ZERO dashboard access before approval
    if (vendor.applicationStatus === 'pending') {
      res.status(403).json({
        success: false,
        code: 'APPLICATION_PENDING',
        applicationStatus: 'pending',
        vendorCode: vendor.vendorCode,
        error:
          'Your partner application is PENDING OBRYNT Admin approval. You cannot upload products or receive orders until approved.',
      });
      return;
    }

    if (vendor.applicationStatus === 'more_info_requested') {
      res.status(403).json({
        success: false,
        code: 'MORE_INFO_REQUESTED',
        applicationStatus: 'more_info_requested',
        vendorCode: vendor.vendorCode,
        infoRequestMessage: vendor.infoRequestMessage || 'Admin requested additional verification details.',
        error: `Admin requested more information: ${vendor.infoRequestMessage || 'Please provide additional business details.'}`,
      });
      return;
    }

    if (vendor.applicationStatus === 'rejected') {
      res.status(403).json({
        success: false,
        code: 'APPLICATION_REJECTED',
        applicationStatus: 'rejected',
        rejectionReason: vendor.rejectionReason,
        error: `Your application was declined${vendor.rejectionReason ? `: ${vendor.rejectionReason}` : '.'}`,
      });
      return;
    }

    if (vendor.status !== 'active') {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        error: `Account is currently ${vendor.status.toUpperCase()}. Please contact OBRYNT Admin.`,
      });
      return;
    }

    const issuedAt = Date.now();
    const expiresAt = issuedAt + 12 * 60 * 60 * 1000; // 12h
    const token = signVendorToken({
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      accountType: vendor.accountType,
      email: vendor.email || vendor.phone,
      issuedAt,
      expiresAt,
    });

    vendor.lastLoginAt = new Date().toISOString();
    vendor.updatedAt = vendor.lastLoginAt;
    appendActivityLog({
      actorId: vendor.id,
      actorRole: vendor.partnerCategory,
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'vendor_login_success',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `${vendor.partnerCategory} logged in (${vendor.vendorCode})`,
    });
    saveDb();

    const partnerNotifications = db.notifications.filter(
      (n) => n.recipientRole === 'PARTNER' && n.vendorId === vendor.id
    );

    res.json({
      success: true,
      session: {
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        accountType: vendor.accountType,
        partnerCategory: vendor.partnerCategory,
        existingWebsiteUrl: vendor.existingWebsiteUrl,
        role: vendor.accountType,
        fullName: vendor.fullName,
        businessName: vendor.businessName,
        email: vendor.email || vendor.phone,
        token,
        expiresAt,
        authenticatedAt: new Date().toISOString(),
      },
      profile: sanitizeVendorForResponse(vendor, true),
      notifications: partnerNotifications.slice(0, 15),
    });
  });

  // -----------------------------------------------------------------------
  // PRIVATE STAFF LOGIN PORTAL (GARMENT STAFF & ROADSIDE STORE STAFF)
  // ZERO SHOP DIRECTORY, ZERO SHOP LIST, ZERO OWNER OR COUNT EXPOSURE
  // -----------------------------------------------------------------------
  router.post('/staff-portal/login', (req: Request, res: Response) => {
    const ipKey = `staff_login:${getReqIp(req)}`;
    const lock = checkPortalLockout(ipKey);
    if (lock.locked) {
      res.status(429).json({
        success: false,
        isLocked: true,
        lockRemainingSec: lock.remainingSec,
        error: `Too many failed login attempts. Try again in ${Math.ceil(lock.remainingSec / 60)} minute(s).`,
      });
      return;
    }

    const body = req.body || {};
    const staffType: ShopStaffCategory =
      body.staffType === 'ROADSIDE_STORE' ? 'ROADSIDE_STORE' : 'GARMENT_SHOP';
    const password = String(body.password || '');
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';

    if (!password) {
      res.status(400).json({ success: false, error: 'Staff access password is required.' });
      return;
    }

    let matchedStaff: InternalStaffAccount | undefined;
    let matchedVendor: InternalVendorProfile | undefined;

    if (accessToken) {
      const tokenHash = sha256Hex(accessToken);
      const staff = db.staffAccounts.find(
        (s) => s.accessTokenHash === tokenHash && s.staffCategory === staffType && s.status === 'active'
      );
      if (staff) {
        const vendor = db.vendors.find(
          (v) => v.id === staff.vendorId && v.status === 'active' && v.applicationStatus === 'approved'
        );
        if (vendor && verifyPassword(password, staff.passwordHash)) {
          matchedStaff = staff;
          matchedVendor = vendor;
        }
      }
    } else {
      // Unlinked password-only entry: match unambiguously against active staff of the requested category
      const candidates = db.staffAccounts.filter(
        (s) => s.staffCategory === staffType && s.status === 'active'
      );
      for (const staff of candidates) {
        const vendor = db.vendors.find(
          (v) => v.id === staff.vendorId && v.status === 'active' && v.applicationStatus === 'approved'
        );
        if (!vendor) continue;
        if (verifyPassword(password, staff.passwordHash)) {
          matchedStaff = staff;
          matchedVendor = vendor;
          break;
        }
      }
    }

    if (!matchedStaff || !matchedVendor) {
      recordPortalFailure(ipKey);
      // Generic response — never leak whether a shop or link exists
      res.status(401).json({ success: false, error: 'Invalid staff access credentials.' });
      return;
    }

    resetPortalLimit(ipKey);
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 10 * 60 * 60 * 1000;
    const role = staffType === 'GARMENT_SHOP' ? 'GARMENT_STAFF' : 'ROADSIDE_STAFF';
    const token = signShopStaffToken({
      staffId: matchedStaff.id,
      staffCode: matchedStaff.staffCode,
      vendorId: matchedVendor.id,
      staffCategory: matchedStaff.staffCategory,
      role,
      issuedAt,
      expiresAt,
    });

    matchedStaff.lastLoginAt = new Date().toISOString();
    matchedStaff.updatedAt = matchedStaff.lastLoginAt;
    appendActivityLog({
      actorId: matchedStaff.id,
      actorRole: role,
      vendorId: matchedVendor.id,
      vendorCode: matchedVendor.vendorCode,
      action: 'private_staff_login',
      entityType: 'partner_staff_account',
      entityId: matchedStaff.id,
      details: `${role} (${matchedStaff.staffCode}) authenticated for ${matchedVendor.businessName}.`,
    });
    saveDb();

    res.json({
      success: true,
      session: {
        staffId: matchedStaff.id,
        staffCode: matchedStaff.staffCode,
        staffCategory: matchedStaff.staffCategory,
        vendorId: matchedVendor.id,
        role,
        staffLabel: matchedStaff.staffLabel,
        shopName: matchedVendor.businessName,
        token,
        expiresAt,
        authenticatedAt: new Date().toISOString(),
      },
    });
  });

  // Strictly isolated Staff Workspace (ONLY products & orders for the staff member's assigned shop)
  router.get('/staff-portal/workspace', requireShopStaffAuth, (req: AuthedRequest, res: Response) => {
    const vendorId = req.staffAuth!.vendorId;
    const vendor = db.vendors.find((v) => v.id === vendorId);
    const shop = db.shops.find((s) => s.vendorId === vendorId);
    const products = db.products
      .filter((p) => p.vendorId === vendorId)
      .map(({ supplierPrice: _sp, ...safeProd }) => safeProd);
    const orders = db.orders
      .filter((o) => o.vendorId === vendorId)
      .map((o) => ({
        id: o.id,
        suborderCode: o.suborderCode,
        parentOrderCode: o.parentOrderCode,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        deliveryAddress: o.deliveryAddress,
        pickupAddress: o.pickupAddress,
        paymentMode: o.paymentMode,
        codAmountToCollect: o.codAmountToCollect,
        stockConfirmed: o.stockConfirmed,
        status: o.status,
        rejectionReason: o.rejectionReason,
        trackingNumber: o.trackingNumber,
        items: o.items.map(({ supplierPrice: _isp, obryntCommission: _oc, applicableFees: _af, vendorPayable: _vp, ...safeItem }) => safeItem),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      }));

    res.json({
      success: true,
      workspace: {
        staffCode: req.staffAuth!.staffCode,
        staffCategory: req.staffAuth!.staffCategory,
        shopName: shop?.shopName || vendor?.businessName || 'Assigned Shop',
        products,
        orders,
      },
    });
  });

  router.post('/staff-portal/products/:productId/stock', requireShopStaffAuth, async (req: AuthedRequest, res: Response) => {
    const prod = db.products.find((p) => p.id === req.params.productId);
    if (!prod || prod.vendorId !== req.staffAuth!.vendorId) {
      res.status(403).json({ success: false, error: 'Forbidden: Product does not belong to your assigned shop.' });
      return;
    }

    const totalStock = Math.max(0, Math.floor(Number(req.body?.totalStock ?? prod.totalStock)));
    const now = new Date().toISOString();
    prod.totalStock = totalStock;
    if (prod.approvalStatus === 'approved' && totalStock === 0) {
      prod.approvalStatus = 'out_of_stock';
    } else if (prod.approvalStatus === 'out_of_stock' && totalStock > 0) {
      prod.approvalStatus = 'approved';
    }
    prod.updatedAt = now;

    const inv = db.inventory.find((i) => i.vendorProductId === prod.id);
    if (inv) {
      inv.availableStock = totalStock;
      inv.updatedAt = now;
    }

    appendActivityLog({
      actorId: req.staffAuth!.staffId,
      actorRole: req.staffAuth!.role,
      vendorId: req.staffAuth!.vendorId,
      action: 'staff_updated_stock',
      entityType: 'vendor_product',
      entityId: prod.id,
      details: `Staff ${req.staffAuth!.staffCode} updated stock on "${prod.name}" to ${totalStock}.`,
    });
    saveDb();
    await syncProductToSupabase(prod);

    res.json({ success: true, totalStock: prod.totalStock, approvalStatus: prod.approvalStatus });
  });

  router.post('/staff-portal/orders/:orderId/action', requireShopStaffAuth, async (req: AuthedRequest, res: Response) => {
    const order = db.orders.find((o) => o.id === req.params.orderId);
    if (!order || order.vendorId !== req.staffAuth!.vendorId) {
      res.status(403).json({ success: false, error: 'Forbidden: Order does not belong to your assigned shop.' });
      return;
    }

    const { action, trackingNumber } = req.body || {};
    const now = new Date().toISOString();

    if (action === 'accept' || action === 'confirm_stock') {
      if (!order.stockConfirmed) {
        for (const item of order.items) {
          const vp = db.products.find((p) => p.id === item.vendorProductId || p.productCode === item.sku);
          if (vp && vp.totalStock < item.quantity) {
            res.status(400).json({
              success: false,
              error: `Insufficient stock for "${vp.name}" (${vp.totalStock} left, ${item.quantity} ordered).`,
            });
            return;
          }
        }
        for (const item of order.items) {
          const vp = db.products.find((p) => p.id === item.vendorProductId || p.productCode === item.sku);
          if (vp) {
            vp.totalStock = Math.max(0, vp.totalStock - item.quantity);
            if (vp.totalStock === 0 && vp.approvalStatus === 'approved') vp.approvalStatus = 'out_of_stock';
            vp.updatedAt = now;
            await syncProductToSupabase(vp);
          }
        }
        order.stockConfirmed = true;
      }
      order.status = 'accepted';
    } else if (action === 'mark_processing') {
      order.status = 'processing';
    } else if (action === 'mark_ready_for_pickup') {
      order.status = 'ready_for_pickup';
      order.deliveryAssignmentId = order.deliveryAssignmentId || `DLV-${order.suborderCode}`;
      if (trackingNumber) order.trackingNumber = String(trackingNumber).trim();
    } else {
      res.status(400).json({ success: false, error: 'Invalid staff order action.' });
      return;
    }

    order.updatedAt = now;
    appendActivityLog({
      actorId: req.staffAuth!.staffId,
      actorRole: req.staffAuth!.role,
      vendorId: req.staffAuth!.vendorId,
      action: `staff_order_${action}`,
      entityType: 'vendor_order',
      entityId: order.id,
      details: `Staff ${req.staffAuth!.staffCode} updated order ${order.suborderCode} -> ${order.status}.`,
    });
    saveDb();

    res.json({ success: true, status: order.status });
  });

  router.get('/vendor/me', requireVendorAuth, (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.vendorAuth!.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor profile not found.' });
      return;
    }
    res.json({ success: true, profile: sanitizeVendorForResponse(vendor, true) });
  });

  // -----------------------------------------------------------------------
  // VENDOR PROFILE UPDATE (DUKANI SHOP PROFILE & SELLER PROFILE)
  // -----------------------------------------------------------------------
  router.put('/vendor/profile', requireVendorAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.vendorAuth!.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found.' });
      return;
    }

    const body = req.body || {};
    const now = new Date().toISOString();

    if (typeof body.fullName === 'string' && body.fullName.trim()) vendor.fullName = body.fullName.trim();
    if (typeof body.businessName === 'string' && body.businessName.trim()) vendor.businessName = body.businessName.trim();
    if (typeof body.phone === 'string' && body.phone.trim()) vendor.phone = body.phone.trim();
    if (typeof body.gstNumber === 'string') vendor.gstNumber = body.gstNumber.trim();
    if (typeof body.pickupAddress === 'string') vendor.pickupAddress = body.pickupAddress.trim();

    if (body.bankDetails && typeof body.bankDetails === 'object') {
      const prevBank = vendor.bankDetails || {};
      const newAccRaw = typeof body.bankDetails.accountNumber === 'string' ? body.bankDetails.accountNumber.trim() : '';
      vendor.bankDetails = {
        accountHolderName:
          typeof body.bankDetails.accountHolderName === 'string'
            ? body.bankDetails.accountHolderName.trim()
            : prevBank.accountHolderName,
        accountNumberMasked: newAccRaw ? maskAccountNumber(newAccRaw) : prevBank.accountNumberMasked,
        accountNumberHash: newAccRaw ? hashPassword(newAccRaw) : prevBank.accountNumberHash,
        ifscCode:
          typeof body.bankDetails.ifscCode === 'string'
            ? body.bankDetails.ifscCode.trim().toUpperCase()
            : prevBank.ifscCode,
        upiId:
          typeof body.bankDetails.upiId === 'string'
            ? body.bankDetails.upiId.trim()
            : prevBank.upiId,
      };
    }

    let shop = db.shops.find((s) => s.vendorId === vendor.id);
    if (vendor.accountType === 'SHOP_OWNER') {
      const sp = body.shopProfile || body;
      if (!shop) {
        shop = {
          id: crypto.randomUUID(),
          vendorId: vendor.id,
          shopName: String(sp.shopName || vendor.businessName).trim(),
          ownerName: String(sp.ownerName || vendor.fullName).trim(),
          shopAddress: String(sp.shopAddress || '').trim(),
          city: String(sp.city || '').trim(),
          state: String(sp.state || '').trim(),
          pincode: String(sp.pincode || '').trim(),
          contactNumber: String(sp.contactNumber || vendor.phone).trim(),
          shopPhotos: Array.isArray(sp.shopPhotos) ? sp.shopPhotos : [],
          gstNumber: typeof sp.gstNumber === 'string' ? sp.gstNumber.trim() : vendor.gstNumber,
          openingHours: String(sp.openingHours || '10:00 AM - 9:00 PM').trim(),
          pickupAddress: String(sp.pickupAddress || vendor.pickupAddress || sp.shopAddress || '').trim(),
          createdAt: now,
          updatedAt: now,
        };
        db.shops.push(shop);
      } else {
        if (typeof sp.shopName === 'string' && sp.shopName.trim()) shop.shopName = sp.shopName.trim();
        if (typeof sp.ownerName === 'string' && sp.ownerName.trim()) shop.ownerName = sp.ownerName.trim();
        if (typeof sp.shopAddress === 'string') shop.shopAddress = sp.shopAddress.trim();
        if (typeof sp.city === 'string') shop.city = sp.city.trim();
        if (typeof sp.state === 'string') shop.state = sp.state.trim();
        if (typeof sp.pincode === 'string') shop.pincode = sp.pincode.trim();
        if (typeof sp.contactNumber === 'string') shop.contactNumber = sp.contactNumber.trim();
        if (Array.isArray(sp.shopPhotos)) shop.shopPhotos = sp.shopPhotos.filter((u: any) => typeof u === 'string' && u.trim());
        if (typeof sp.gstNumber === 'string') shop.gstNumber = sp.gstNumber.trim();
        if (typeof sp.openingHours === 'string') shop.openingHours = sp.openingHours.trim();
        if (typeof sp.pickupAddress === 'string') shop.pickupAddress = sp.pickupAddress.trim();
        shop.updatedAt = now;
      }
      if (shop.pickupAddress) {
        vendor.pickupAddress = shop.pickupAddress;
      }
    }

    vendor.updatedAt = now;
    appendActivityLog({
      actorId: vendor.id,
      actorRole: vendor.accountType,
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'vendor_profile_updated',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `${vendor.businessName} updated profile / shop settings.`,
    });
    saveDb();
    await syncVendorToSupabase(vendor, shop);

    res.json({ success: true, profile: sanitizeVendorForResponse(vendor, true) });
  });

  // -----------------------------------------------------------------------
  // VENDOR PRODUCT MANAGEMENT (STRICTLY ISOLATED TO AUTHENTICATED VENDOR)
  // -----------------------------------------------------------------------
  router.get('/vendor/products', requireVendorAuth, (req: AuthedRequest, res: Response) => {
    // Strictly filtered by authenticated vendorId — impossible to access another vendor's catalog
    const items = db.products.filter((p) => p.vendorId === req.vendorAuth!.vendorId);
    res.json({ success: true, products: items });
  });

  router.post('/vendor/products', requireVendorAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.vendorAuth!.vendorId)!;
    const shop = db.shops.find((s) => s.vendorId === vendor.id);
    const body = req.body || {};

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      res.status(400).json({ success: false, error: 'Product title is required.' });
      return;
    }

    const sellingPrice = Number(body.sellingPrice ?? body.price ?? 0);
    const supplierPrice = Number(body.supplierPrice ?? body.agreedPrice ?? sellingPrice);
    const originalPrice = Number(body.originalPrice ?? sellingPrice);
    const stock = Math.max(0, Math.floor(Number(body.totalStock ?? body.stock ?? 0)));

    if (!sellingPrice || sellingPrice <= 0) {
      res.status(400).json({ success: false, error: 'Valid customer selling price is required.' });
      return;
    }

    db.counters.productSeq += 1;
    const id = crypto.randomUUID();
    const productCode = String(
      body.productCode || body.sku || `${vendor.vendorCode}-P${db.counters.productSeq}`
    )
      .trim()
      .toUpperCase();

    if (db.products.some((p) => p.productCode === productCode)) {
      res.status(409).json({ success: false, error: `Product code / SKU "${productCode}" already exists.` });
      return;
    }

    const sizes = Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ['S', 'M', 'L', 'XL'];
    const colors = Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : ['Pitch Black'];
    const images =
      Array.isArray(body.images) && body.images.length > 0
        ? body.images.filter((u: any) => typeof u === 'string' && u.trim())
        : ['/images/product_tshirt_minimal_1793012315796.jpg'];

    const variants: InternalProductVariant[] = Array.isArray(body.variants) && body.variants.length > 0
      ? body.variants.map((v: any, idx: number) => ({
          id: crypto.randomUUID(),
          vendorProductId: id,
          sku: String(v.sku || `${productCode}-V${idx + 1}`).toUpperCase(),
          size: String(v.size || sizes[0] || 'M'),
          color: String(v.color || colors[0] || 'Black'),
          colorHex: v.colorHex || '#171717',
          originalPrice: Number(v.originalPrice ?? originalPrice),
          supplierPrice: Number(v.supplierPrice ?? supplierPrice),
          sellingPrice: Number(v.sellingPrice ?? sellingPrice),
          stock: Math.max(0, Math.floor(Number(v.stock ?? Math.ceil(stock / body.variants.length)))),
          imageUrl: v.imageUrl || images[0],
        }))
      : [
          {
            id: crypto.randomUUID(),
            vendorProductId: id,
            sku: productCode,
            size: sizes[0] || 'Free Size',
            color: colors[0] || 'Standard',
            colorHex: '#171717',
            originalPrice,
            supplierPrice,
            sellingPrice,
            stock,
            imageUrl: images[0],
          },
        ];

    const computedTotalStock =
      variants.length > 0 && Array.isArray(body.variants) && body.variants.length > 0
        ? variants.reduce((s, v) => s + v.stock, 0)
        : stock;

    const approvalStatus: ApprovalStatus = body.saveAsDraft ? 'draft' : 'pending_approval';
    const now = new Date().toISOString();

    const newProduct: InternalVendorProduct = {
      id,
      productCode,
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      vendorName: vendor.businessName,
      vendorType: vendor.accountType,
      shopId: shop?.id,
      shopName: shop?.shopName,
      name: body.name.trim(),
      description: String(body.description || '').trim(),
      category: String(body.category || 'Men').trim(),
      subcategory: body.subcategory ? String(body.subcategory).trim() : undefined,
      audience: String(body.audience || 'Unisex').trim(),
      images,
      videoUrl: body.videoUrl ? String(body.videoUrl).trim() : undefined,
      originalPrice,
      supplierPrice,
      sellingPrice,
      totalStock: computedTotalStock,
      sizes,
      colors,
      variants,
      material: body.material ? String(body.material).trim() : undefined,
      approvalStatus,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    db.products.unshift(newProduct);
    db.inventory.push({
      id: crypto.randomUUID(),
      vendorId: vendor.id,
      vendorProductId: newProduct.id,
      sku: newProduct.productCode,
      availableStock: newProduct.totalStock,
      reservedStock: 0,
      lowStockThreshold: 10,
      lastRestockedAt: now,
      updatedAt: now,
    });

    appendActivityLog({
      actorId: vendor.id,
      actorRole: vendor.accountType,
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: approvalStatus === 'draft' ? 'product_saved_draft' : 'product_submitted_for_approval',
      entityType: 'vendor_product',
      entityId: newProduct.id,
      details: `${vendor.businessName} created "${newProduct.name}" (${newProduct.productCode}) -> ${approvalStatus}`,
    });
    saveDb();
    await syncProductToSupabase(newProduct);

    res.status(201).json({ success: true, product: newProduct });
  });

  // Bulk Upload Products by Shop Owner / Seller
  router.post('/vendor/products/bulk', requireVendorAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.vendorAuth!.vendorId)!;
    const shop = db.shops.find((s) => s.vendorId === vendor.id);
    const items = Array.isArray(req.body?.products) ? req.body.products : [];

    if (items.length === 0) {
      res.status(400).json({ success: false, error: 'No products provided in bulk upload.' });
      return;
    }

    const now = new Date().toISOString();
    const created: InternalVendorProduct[] = [];
    const skipped: string[] = [];

    for (const raw of items) {
      const name = String(raw.name || raw.title || '').trim();
      const sellingPrice = Number(raw.sellingPrice ?? raw.price ?? 0);
      if (!name || sellingPrice <= 0) {
        skipped.push(name || 'Unnamed row');
        continue;
      }
      db.counters.productSeq += 1;
      const id = crypto.randomUUID();
      const productCode = String(raw.productCode || raw.sku || `${vendor.vendorCode}-B${db.counters.productSeq}`)
        .trim()
        .toUpperCase();
      if (db.products.some((p) => p.productCode === productCode)) {
        skipped.push(`${productCode} (duplicate SKU)`);
        continue;
      }
      const supplierPrice = Number(raw.supplierPrice ?? raw.agreedPrice ?? sellingPrice);
      const originalPrice = Number(raw.originalPrice ?? sellingPrice);
      const stock = Math.max(0, Math.floor(Number(raw.totalStock ?? raw.stock ?? 25)));
      const sizes = Array.isArray(raw.sizes) && raw.sizes.length > 0 ? raw.sizes : ['S', 'M', 'L', 'XL'];
      const colors = Array.isArray(raw.colors) && raw.colors.length > 0 ? raw.colors : ['Black'];
      const images =
        Array.isArray(raw.images) && raw.images.length > 0
          ? raw.images
          : [String(raw.imageUrl || '/images/product_tshirt_minimal_1793012315796.jpg')];

      const prod: InternalVendorProduct = {
        id,
        productCode,
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        vendorName: vendor.businessName,
        vendorType: vendor.accountType,
        shopId: shop?.id,
        shopName: shop?.shopName,
        name,
        description: String(raw.description || '').trim(),
        category: String(raw.category || 'Men').trim(),
        subcategory: raw.subcategory ? String(raw.subcategory).trim() : undefined,
        audience: String(raw.audience || 'Unisex').trim(),
        images,
        videoUrl: raw.videoUrl ? String(raw.videoUrl).trim() : undefined,
        originalPrice,
        supplierPrice,
        sellingPrice,
        totalStock: stock,
        sizes,
        colors,
        variants: [
          {
            id: crypto.randomUUID(),
            vendorProductId: id,
            sku: productCode,
            size: sizes[0] || 'M',
            color: colors[0] || 'Black',
            originalPrice,
            supplierPrice,
            sellingPrice,
            stock,
            imageUrl: images[0],
          },
        ],
        approvalStatus: 'pending_approval',
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      db.products.unshift(prod);
      db.inventory.push({
        id: crypto.randomUUID(),
        vendorId: vendor.id,
        vendorProductId: prod.id,
        sku: prod.productCode,
        availableStock: prod.totalStock,
        reservedStock: 0,
        lowStockThreshold: 10,
        lastRestockedAt: now,
        updatedAt: now,
      });
      created.push(prod);
      await syncProductToSupabase(prod);
    }

    appendActivityLog({
      actorId: vendor.id,
      actorRole: vendor.accountType,
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'vendor_bulk_upload',
      entityType: 'vendor_product',
      details: `${vendor.businessName} bulk-uploaded ${created.length} products (${skipped.length} skipped) -> Pending Approval.`,
    });
    saveDb();

    res.status(201).json({
      success: true,
      createdCount: created.length,
      skipped,
      products: created,
    });
  });

  // Update Vendor Product (Significant changes on approved products return to Pending Approval!)
  router.put('/vendor/products/:productId', requireVendorAuth, async (req: AuthedRequest, res: Response) => {
    const prod = db.products.find((p) => p.id === req.params.productId);
    if (!prod) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }
    if (prod.vendorId !== req.vendorAuth!.vendorId) {
      res.status(403).json({ success: false, error: 'Forbidden: You cannot modify another vendor product.' });
      return;
    }

    const body = req.body || {};
    const now = new Date().toISOString();

    const significantChange =
      (typeof body.name === 'string' && body.name.trim() !== prod.name) ||
      (typeof body.description === 'string' && body.description.trim() !== prod.description) ||
      (typeof body.category === 'string' && body.category.trim() !== prod.category) ||
      (body.sellingPrice !== undefined && Number(body.sellingPrice) !== prod.sellingPrice) ||
      (body.supplierPrice !== undefined && Number(body.supplierPrice) !== prod.supplierPrice) ||
      (Array.isArray(body.images) && JSON.stringify(body.images) !== JSON.stringify(prod.images));

    if (typeof body.name === 'string' && body.name.trim()) prod.name = body.name.trim();
    if (typeof body.description === 'string') prod.description = body.description.trim();
    if (typeof body.category === 'string' && body.category.trim()) prod.category = body.category.trim();
    if (typeof body.subcategory === 'string') prod.subcategory = body.subcategory.trim();
    if (typeof body.audience === 'string') prod.audience = body.audience.trim();
    if (Array.isArray(body.images) && body.images.length > 0) prod.images = body.images;
    if (typeof body.videoUrl === 'string') prod.videoUrl = body.videoUrl.trim();
    if (body.originalPrice !== undefined) prod.originalPrice = Number(body.originalPrice);
    if (body.supplierPrice !== undefined) prod.supplierPrice = Number(body.supplierPrice);
    if (body.sellingPrice !== undefined) prod.sellingPrice = Number(body.sellingPrice);
    if (Array.isArray(body.sizes)) prod.sizes = body.sizes;
    if (Array.isArray(body.colors)) prod.colors = body.colors;
    if (Array.isArray(body.variants)) prod.variants = body.variants;
    if (typeof body.material === 'string') prod.material = body.material.trim();
    if (body.totalStock !== undefined) {
      prod.totalStock = Math.max(0, Math.floor(Number(body.totalStock)));
    }

    let returnedForApproval = false;
    if (body.submitForApproval === true) {
      prod.approvalStatus = 'pending_approval';
      prod.rejectionReason = undefined;
      prod.submittedAt = now;
      returnedForApproval = true;
    } else if (prod.approvalStatus === 'approved' && significantChange) {
      prod.approvalStatus = 'pending_approval';
      prod.submittedAt = now;
      returnedForApproval = true;
    } else if (prod.approvalStatus === 'approved' && prod.totalStock === 0) {
      prod.approvalStatus = 'out_of_stock';
    } else if (prod.approvalStatus === 'out_of_stock' && prod.totalStock > 0) {
      prod.approvalStatus = 'approved';
    }

    prod.updatedAt = now;

    const inv = db.inventory.find((i) => i.vendorProductId === prod.id);
    if (inv) {
      inv.availableStock = prod.totalStock;
      inv.updatedAt = now;
    }

    appendActivityLog({
      actorId: req.vendorAuth!.vendorId,
      actorRole: req.vendorAuth!.accountType,
      vendorId: req.vendorAuth!.vendorId,
      vendorCode: req.vendorAuth!.vendorCode,
      action: returnedForApproval ? 'product_reapproval_triggered' : 'product_updated',
      entityType: 'vendor_product',
      entityId: prod.id,
      details: returnedForApproval
        ? `Significant update to "${prod.name}" moved status back to Pending Approval.`
        : `Updated stock/metadata on "${prod.name}" (Stock: ${prod.totalStock}).`,
    });
    saveDb();
    await syncProductToSupabase(prod);

    res.json({ success: true, product: prod, returnedForApproval });
  });

  router.delete('/vendor/products/:productId', requireVendorAuth, async (req: AuthedRequest, res: Response) => {
    const idx = db.products.findIndex((p) => p.id === req.params.productId);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }
    const prod = db.products[idx];
    if (prod.vendorId !== req.vendorAuth!.vendorId) {
      res.status(403).json({ success: false, error: 'Forbidden: You cannot delete another vendor product.' });
      return;
    }

    db.products.splice(idx, 1);
    db.inventory = db.inventory.filter((i) => i.vendorProductId !== prod.id);

    appendActivityLog({
      actorId: req.vendorAuth!.vendorId,
      actorRole: req.vendorAuth!.accountType,
      vendorId: req.vendorAuth!.vendorId,
      vendorCode: req.vendorAuth!.vendorCode,
      action: 'product_deleted',
      entityType: 'vendor_product',
      entityId: prod.id,
      details: `Vendor deleted product "${prod.name}" (${prod.productCode}).`,
    });
    saveDb();

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        await sb.from('vendor_products').delete().eq('id', prod.id);
        await sb.from('products').delete().eq('sku', prod.productCode);
      } catch {}
    }

    res.json({ success: true });
  });

  // -----------------------------------------------------------------------
  // VENDOR ORDER MANAGEMENT & READY FOR PICKUP -> DELIVERY INTEGRATION
  // -----------------------------------------------------------------------
  router.get('/vendor/orders', requireVendorAuth, (req: AuthedRequest, res: Response) => {
    const myOrders = db.orders.filter((o) => o.vendorId === req.vendorAuth!.vendorId);
    res.json({ success: true, orders: myOrders });
  });

  router.post('/vendor/orders/:orderId/action', requireVendorAuth, async (req: AuthedRequest, res: Response) => {
    const order = db.orders.find((o) => o.id === req.params.orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Vendor suborder not found.' });
      return;
    }
    if (order.vendorId !== req.vendorAuth!.vendorId) {
      res.status(403).json({ success: false, error: 'Forbidden: Cannot access another vendor order.' });
      return;
    }

    const { action, reason, trackingNumber } = req.body || {};
    const now = new Date().toISOString();

    if (action === 'accept' || action === 'confirm_stock') {
      // Verify & deduct stock cleanly if not already confirmed
      if (!order.stockConfirmed) {
        for (const item of order.items) {
          const vp = db.products.find(
            (p) => p.id === item.vendorProductId || p.productCode === item.sku
          );
          if (vp) {
            if (vp.totalStock < item.quantity) {
              res.status(400).json({
                success: false,
                error: `Insufficient stock for "${vp.name}" (${vp.totalStock} available, ${item.quantity} ordered).`,
              });
              return;
            }
          }
        }
        // Deduct stock after validation
        for (const item of order.items) {
          const vp = db.products.find(
            (p) => p.id === item.vendorProductId || p.productCode === item.sku
          );
          if (vp) {
            vp.totalStock = Math.max(0, vp.totalStock - item.quantity);
            if (vp.totalStock === 0 && vp.approvalStatus === 'approved') {
              vp.approvalStatus = 'out_of_stock';
            }
            vp.updatedAt = now;
            const inv = db.inventory.find((i) => i.vendorProductId === vp.id);
            if (inv) {
              inv.availableStock = vp.totalStock;
              inv.updatedAt = now;
            }
            await syncProductToSupabase(vp);
          }
        }
        order.stockConfirmed = true;
      }
      order.status = 'accepted';
    } else if (action === 'reject') {
      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        res.status(400).json({ success: false, error: 'Rejection reason is required.' });
        return;
      }
      order.status = 'rejected';
      order.rejectionReason = reason.trim();
      // Cancel associated settlement record
      const settlement = db.settlements.find((s) => s.vendorOrderId === order.id);
      if (settlement) {
        settlement.settlementStatus = 'cancelled';
        settlement.notes = `Order rejected by vendor: ${reason.trim()}`;
        settlement.updatedAt = now;
      }
    } else if (action === 'mark_processing') {
      order.status = 'processing';
    } else if (action === 'mark_ready_for_pickup') {
      order.status = 'ready_for_pickup';
      order.deliveryAssignmentId = order.deliveryAssignmentId || `DLV-${order.suborderCode}`;
      if (trackingNumber) order.trackingNumber = String(trackingNumber).trim();
    } else {
      res.status(400).json({ success: false, error: `Unsupported order action: ${action}` });
      return;
    }

    order.updatedAt = now;
    appendActivityLog({
      actorId: req.vendorAuth!.vendorId,
      actorRole: req.vendorAuth!.accountType,
      vendorId: req.vendorAuth!.vendorId,
      vendorCode: req.vendorAuth!.vendorCode,
      action: `suborder_${action}`,
      entityType: 'vendor_order',
      entityId: order.id,
      details: `Suborder ${order.suborderCode} updated to ${order.status}${order.rejectionReason ? ` (${order.rejectionReason})` : ''}`,
    });
    saveDb();

    // Build sanitized delivery notice if ready for pickup (NEVER expose supplier financial details)
    const deliveryNotice =
      order.status === 'ready_for_pickup'
        ? {
            assignmentId: order.deliveryAssignmentId,
            suborderCode: order.suborderCode,
            parentOrderCode: order.parentOrderCode,
            pickupShopAddress: order.pickupAddress,
            pickupVendorName: order.shopName || order.vendorName,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deliveryAddress: `${order.deliveryAddress.address}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}`,
            packageDetails: order.items
              .map((i) => `${i.productName} (${i.size}/${i.color}) x${i.quantity} [${i.sku}]`)
              .join(' | '),
            isCod: order.paymentMode === 'COD',
            paymentMethodType: order.paymentMode === 'COD' ? 'CASH ON DELIVERY' : 'PREPAID',
            codAmountToCollect: order.paymentMode === 'COD' ? order.codAmountToCollect : undefined,
          }
        : undefined;

    res.json({ success: true, order, deliveryNotice });
  });

  // -----------------------------------------------------------------------
  // VENDOR FINANCIALS & SETTLEMENT HISTORY
  // -----------------------------------------------------------------------
  router.get('/vendor/financials', requireVendorAuth, (req: AuthedRequest, res: Response) => {
    const vendorId = req.vendorAuth!.vendorId;
    const myOrders = db.orders.filter((o) => o.vendorId === vendorId);
    const activeOrders = myOrders.filter((o) => o.status !== 'rejected' && o.status !== 'cancelled');
    const settlements = db.settlements.filter((s) => s.vendorId === vendorId);

    const summary = {
      totalSales: activeOrders.reduce((s, o) => s + o.subtotalSellingPrice, 0),
      totalSupplierAgreed: activeOrders.reduce((s, o) => s + o.totalSupplierPrice, 0),
      totalCommission: activeOrders.reduce((s, o) => s + o.obryntCommission, 0),
      totalFees: activeOrders.reduce((s, o) => s + o.applicableFees, 0),
      totalPayableEarnings: activeOrders.reduce((s, o) => s + o.vendorPayableAmount, 0),
      settledAmount: settlements
        .filter((st) => st.settlementStatus === 'settled')
        .reduce((s, st) => s + st.netVendorPayable, 0),
      pendingPayableAmount: settlements
        .filter((st) => st.settlementStatus !== 'settled' && st.settlementStatus !== 'cancelled')
        .reduce((s, st) => s + st.netVendorPayable, 0),
      returnedOrCancelledCount: myOrders.filter(
        (o) => o.status === 'rejected' || o.status === 'cancelled' || o.status === 'returned'
      ).length,
    };

    res.json({
      success: true,
      summary,
      settlements,
      commissionRule: resolveCommissionRule(vendorId),
    });
  });

  // -----------------------------------------------------------------------
  // STOREFRONT PUBLIC APPROVED PRODUCTS & ORDER DISTRIBUTION
  // -----------------------------------------------------------------------
  router.get('/storefront/approved-vendor-products', (_req: Request, res: Response) => {
    const activeVendorIds = new Set(
      db.vendors.filter((v) => v.status === 'active').map((v) => v.id)
    );

    // Strictly return ONLY approved products from active vendors; strip supplierPrice & private costs
    const approved = db.products
      .filter((p) => p.approvalStatus === 'approved' && activeVendorIds.has(p.vendorId))
      .map((p) => ({
        sku: p.productCode,
        id: p.id,
        name: p.name,
        category: p.category,
        cat: p.category,
        subcategory: p.subcategory,
        audience: p.audience || 'Unisex',
        aud: p.audience || 'Unisex',
        price: p.sellingPrice,
        originalPrice: p.originalPrice || p.sellingPrice,
        sizes: p.sizes,
        color: p.variants?.[0]?.colorHex || '#171717',
        colorName: p.colors?.[0] || 'Standard',
        colors: p.colors,
        type: 'shirt',
        tag: p.vendorType === 'SHOP_OWNER' ? 'DUKANI STORE' : 'VERIFIED SELLER',
        description: p.description,
        stock: p.totalStock,
        imageUrl: p.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg',
        galleryUrls: p.images,
        videoUrl: p.videoUrl,
        brand: p.shopName || p.vendorName,
        brandName: p.shopName || p.vendorName,
        vendorId: p.vendorId,
        vendorCode: p.vendorCode,
        vendorName: p.vendorName,
        vendorType: p.vendorType,
        shopId: p.shopId,
        shopName: p.shopName,
        approvalStatus: p.approvalStatus,
        status: p.totalStock > 0 ? 'active' : 'out_of_stock',
        isPublished: true,
        material: p.material,
        rating: 4.9,
        reviewCount: 1,
      }));

    res.json({ success: true, products: approved });
  });

  // Order Distribution Engine: Splits customer order into isolated vendor suborders
  router.post('/orders/distribute', (req: Request, res: Response) => {
    const { order } = req.body || {};
    if (!order || !order.orderId || !Array.isArray(order.items)) {
      res.status(400).json({ success: false, error: 'Valid order payload required.' });
      return;
    }

    const existingForParent = db.orders.filter((o) => o.parentOrderCode === order.orderId);
    if (existingForParent.length > 0) {
      res.json({ success: true, suborders: existingForParent, alreadyDistributed: true });
      return;
    }

    const byVendor = new Map<string, { vendor: InternalVendorProfile; items: any[] }>();
    const methodStr = String(order.paymentMethod || '').toLowerCase();
    const isCod = methodStr.includes('cod') || methodStr.includes('cash on delivery') || order.paymentStatus === 'cod_pending';
    const now = new Date().toISOString();

    for (const item of order.items) {
      const pSku = item.product?.sku;
      const vp =
        db.products.find((p) => p.productCode === pSku || p.id === item.product?.id) ||
        (item.product?.vendorId ? db.products.find((p) => p.vendorId === item.product.vendorId && p.name === item.product.name) : undefined);

      const vendorId = vp?.vendorId || item.product?.vendorId;
      if (!vendorId) continue;

      const vendor = db.vendors.find((v) => v.id === vendorId);
      if (!vendor) continue;

      if (!byVendor.has(vendor.id)) {
        byVendor.set(vendor.id, { vendor, items: [] });
      }
      byVendor.get(vendor.id)!.items.push({ cartItem: item, vp });
    }

    const createdSubOrders: InternalSubOrder[] = [];

    for (const [vendorId, bundle] of byVendor.entries()) {
      const { vendor, items } = bundle;
      const shop = db.shops.find((s) => s.vendorId === vendorId);
      db.counters.suborderSeq += 1;
      const vendorOrderId = crypto.randomUUID();
      const suborderCode = `SUB-${order.orderId}-${db.counters.suborderSeq}`;

      let subtotalSelling = 0;
      let totalSupplier = 0;
      let totalCommission = 0;
      let totalFees = 0;
      let totalPayable = 0;

      const orderItems: InternalSubOrderItem[] = items.map(({ cartItem, vp }) => {
        const qty = Math.max(1, Number(cartItem.quantity || 1));
        const sellingUnit = Number(cartItem.product?.price ?? vp?.sellingPrice ?? 0);
        const supplierUnit = Number(vp?.supplierPrice ?? cartItem.product?.supplierPrice ?? sellingUnit);
        const calc = calculateCommissionBreakdown({
          vendorId,
          vendorProductId: vp?.id,
          supplierPrice: supplierUnit,
          sellingPrice: sellingUnit,
          quantity: qty,
        });

        subtotalSelling += calc.grossSelling;
        totalSupplier += calc.totalSupplier;
        totalCommission += calc.obryntCommission;
        totalFees += calc.applicableFees;
        totalPayable += calc.vendorPayable;

        return {
          id: crypto.randomUUID(),
          vendorOrderId,
          vendorProductId: vp?.id,
          sku: cartItem.product?.sku || vp?.productCode || 'SKU',
          productName: cartItem.product?.name || vp?.name || 'Product',
          size: cartItem.size || 'Standard',
          color: cartItem.product?.colorName || vp?.colors?.[0] || 'Standard',
          quantity: qty,
          supplierPrice: supplierUnit,
          sellingPrice: sellingUnit,
          obryntCommission: calc.obryntCommission,
          applicableFees: calc.applicableFees,
          vendorPayable: calc.vendorPayable,
          imageUrl: cartItem.product?.imageUrl || vp?.images?.[0],
        };
      });

      const pickupAddress =
        shop?.pickupAddress ||
        shop?.shopAddress ||
        vendor.pickupAddress ||
        'Vendor Registered Address';

      const suborder: InternalSubOrder = {
        id: vendorOrderId,
        suborderCode,
        parentOrderCode: order.orderId,
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        vendorName: vendor.businessName,
        vendorType: vendor.accountType,
        shopId: shop?.id,
        shopName: shop?.shopName,
        customerName: order.customer?.fullName || 'Customer',
        customerPhone: order.customer?.phone || '',
        deliveryAddress: {
          address: order.customer?.address || '',
          city: order.customer?.city || '',
          state: order.customer?.state || '',
          pincode: order.customer?.pincode || '',
        },
        pickupAddress,
        paymentMode: isCod ? 'COD' : 'PREPAID',
        codAmountToCollect: isCod ? subtotalSelling : 0,
        subtotalSellingPrice: subtotalSelling,
        totalSupplierPrice: totalSupplier,
        obryntCommission: totalCommission,
        applicableFees: totalFees,
        vendorPayableAmount: totalPayable,
        stockConfirmed: false,
        status: 'pending_acceptance',
        items: orderItems,
        createdAt: now,
        updatedAt: now,
      };

      db.orders.unshift(suborder);
      createdSubOrders.push(suborder);

      db.counters.settlementSeq += 1;
      db.settlements.unshift({
        id: crypto.randomUUID(),
        settlementCode: `SET-${db.counters.settlementSeq}`,
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        vendorName: vendor.businessName,
        vendorType: vendor.accountType,
        vendorOrderId: suborder.id,
        suborderCode: suborder.suborderCode,
        parentOrderCode: order.orderId,
        grossSellingAmount: subtotalSelling,
        supplierAgreedAmount: totalSupplier,
        obryntCommission: totalCommission,
        applicableFees: totalFees,
        netVendorPayable: totalPayable,
        settlementStatus: 'pending',
        notes: 'Awaiting vendor acceptance and delivery completion (manual settlement only).',
        createdAt: now,
        updatedAt: now,
      });

      appendActivityLog({
        actorId: 'system',
        actorRole: 'SYSTEM',
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        action: 'order_distributed_to_vendor',
        entityType: 'vendor_order',
        entityId: suborder.id,
        details: `Order ${order.orderId} split -> ${suborderCode} routed to ${vendor.businessName} (${orderItems.length} items).`,
      });
    }

    saveDb();
    res.json({ success: true, suborders: createdSubOrders });
  });

  // -----------------------------------------------------------------------
  // DELIVERY INTEGRATION (SANITIZED — NEVER EXPOSES SUPPLIER FINANCIALS)
  // -----------------------------------------------------------------------
  router.get('/delivery/vendor-pickups', (_req: Request, res: Response) => {
    const pickups = db.orders
      .filter((o) =>
        ['ready_for_pickup', 'picked_up', 'in_transit', 'delivered'].includes(o.status)
      )
      .map((o) => ({
        assignmentId: o.deliveryAssignmentId || `DLV-${o.suborderCode}`,
        suborderId: o.id,
        suborderCode: o.suborderCode,
        parentOrderCode: o.parentOrderCode,
        pickupShopAddress: o.pickupAddress,
        pickupVendorName: o.shopName || o.vendorName,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        deliveryAddress: o.deliveryAddress,
        packageDetails: o.items
          .map((i) => `${i.productName} (${i.size}/${i.color}) x${i.quantity} [${i.sku}]`)
          .join(' | '),
        isCod: o.paymentMode === 'COD',
        paymentMethodType: o.paymentMode === 'COD' ? 'CASH ON DELIVERY' : 'PREPAID',
        codAmountToCollect: o.paymentMode === 'COD' ? o.codAmountToCollect : undefined,
        status: o.status,
        trackingNumber: o.trackingNumber,
        updatedAt: o.updatedAt,
      }));
    res.json({ success: true, pickups });
  });

  router.post('/delivery/vendor-pickups/:suborderId/status', (req: Request, res: Response) => {
    const order = db.orders.find((o) => o.id === req.params.suborderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Suborder pickup not found.' });
      return;
    }
    const { status, trackingNumber } = req.body || {};
    if (!['picked_up', 'in_transit', 'delivered', 'returned'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid delivery status.' });
      return;
    }
    const now = new Date().toISOString();
    order.status = status;
    if (trackingNumber) order.trackingNumber = String(trackingNumber).trim();
    order.updatedAt = now;

    // When delivered, mark settlement ledger eligible (manual payout only — no auto money transfer)
    const settlement = db.settlements.find((s) => s.vendorOrderId === order.id);
    if (settlement) {
      if (status === 'delivered' && settlement.settlementStatus === 'pending') {
        settlement.settlementStatus = 'eligible';
        settlement.updatedAt = now;
      } else if (status === 'returned') {
        settlement.settlementStatus = 'cancelled';
        settlement.notes = 'Customer returned shipment.';
        settlement.updatedAt = now;
      }
    }

    appendActivityLog({
      actorId: 'delivery_partner',
      actorRole: 'DELIVERY_PARTNER',
      vendorId: order.vendorId,
      vendorCode: order.vendorCode,
      action: `delivery_${status}`,
      entityType: 'vendor_order',
      entityId: order.id,
      details: `Delivery updated ${order.suborderCode} to ${status.toUpperCase()}.`,
    });
    saveDb();

    res.json({ success: true, status: order.status, suborderCode: order.suborderCode });
  });

  // -----------------------------------------------------------------------
  // ADMIN PARTNER OVERVIEW, NOTIFICATIONS & EXPIRING REGISTRATION LINKS
  // -----------------------------------------------------------------------
  router.get('/admin/partners/overview', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    const counts = {
      totalRegistrations: db.vendors.length,
      existingSuppliers: db.vendors.filter((v) => v.partnerCategory === 'EXISTING_SUPPLIER').length,
      garmentShops: db.vendors.filter((v) => v.partnerCategory === 'GARMENT_SHOP').length,
      roadsideStores: db.vendors.filter((v) => v.partnerCategory === 'ROADSIDE_STORE').length,
      pendingApplications: db.vendors.filter((v) => v.applicationStatus === 'pending').length,
      moreInfoRequested: db.vendors.filter((v) => v.applicationStatus === 'more_info_requested').length,
      approvedPartners: db.vendors.filter((v) => v.applicationStatus === 'approved').length,
      activePartners: db.vendors.filter((v) => v.applicationStatus === 'approved' && v.status === 'active').length,
      rejectedApplications: db.vendors.filter((v) => v.applicationStatus === 'rejected').length,
      suspendedAccounts: db.vendors.filter((v) => v.status === 'suspended' || v.status === 'blocked').length,
      staffAccountsCount: db.staffAccounts.length,
      activeStaffCount: db.staffAccounts.filter((s) => s.status === 'active').length,
      unreadNotificationsCount: db.notifications.filter((n) => n.recipientRole === 'ADMIN' && !n.isRead).length,
    };
    res.json({ success: true, counts });
  });

  router.get('/admin/notifications', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    const notifications = db.notifications.filter((n) => n.recipientRole === 'ADMIN').slice(0, 50);
    res.json({ success: true, notifications });
  });

  router.post('/admin/notifications/read-all', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    db.notifications.forEach((n) => {
      if (n.recipientRole === 'ADMIN') n.isRead = true;
    });
    saveDb();
    res.json({ success: true });
  });

  router.get('/admin/registration-links', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    const nowMs = Date.now();
    const links = db.registrationLinks.map((l) => {
      const effectiveStatus =
        l.status === 'active' && nowMs > new Date(l.expiresAt).getTime() ? 'expired' : l.status;
      return { ...l, status: effectiveStatus };
    });
    res.json({ success: true, links });
  });

  router.post('/admin/registration-links', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const body = req.body || {};
    const partnerCategory: PartnerCategory | 'ANY' = ['EXISTING_SUPPLIER', 'GARMENT_SHOP', 'ROADSIDE_STORE', 'ANY'].includes(
      body.partnerCategory
    )
      ? body.partnerCategory
      : 'ANY';
    const registrationOption: RegistrationOption | 'BOTH' = [
      'OPTION_A_EXISTING_URL',
      'OPTION_B_NEW_PARTNER',
      'BOTH',
    ].includes(body.registrationOption)
      ? body.registrationOption
      : 'BOTH';
    const expiresInHours = Math.min(720, Math.max(1, Number(body.expiresInHours || 72)));
    const maxUses = Math.min(50, Math.max(1, Math.floor(Number(body.maxUses || 1))));

    const rawToken = `obreg_${crypto.randomBytes(18).toString('base64url')}`;
    const link: InternalRegistrationLink = {
      id: crypto.randomUUID(),
      tokenHash: sha256Hex(rawToken),
      partnerCategory,
      registrationOption,
      intendedBusinessName: body.intendedBusinessName ? String(body.intendedBusinessName).trim() : undefined,
      createdBy: req.adminAuth!.userEmail,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
      maxUses,
      usedCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    db.registrationLinks.unshift(link);
    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      action: 'admin_created_registration_link',
      entityType: 'partner_registration_link',
      entityId: link.id,
      details: `Generated expiring partner registration link (${partnerCategory}, ${expiresInHours}h expiry).`,
    });
    saveDb();

    res.status(201).json({
      success: true,
      link,
      rawToken,
      registrationPath: `/partner-register?token=${encodeURIComponent(rawToken)}`,
    });
  });

  router.post('/admin/registration-links/:linkId/revoke', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const link = db.registrationLinks.find((l) => l.id === req.params.linkId);
    if (!link) {
      res.status(404).json({ success: false, error: 'Registration link not found.' });
      return;
    }
    link.status = 'revoked';
    saveDb();
    res.json({ success: true, link });
  });

  // -----------------------------------------------------------------------
  // ADMIN VENDOR / PARTNER MANAGEMENT (PROTECTED — SUPER ADMIN ONLY)
  // -----------------------------------------------------------------------
  router.get('/admin/vendors', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    const vendors = db.vendors.map((v) => sanitizeVendorForResponse(v, true));
    res.json({ success: true, vendors });
  });

  router.post('/admin/vendors', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const body = req.body || {};
    const partnerCategory: PartnerCategory = ['EXISTING_SUPPLIER', 'GARMENT_SHOP', 'ROADSIDE_STORE'].includes(
      body.partnerCategory
    )
      ? body.partnerCategory
      : body.accountType === 'SELLER'
      ? 'EXISTING_SUPPLIER'
      : 'GARMENT_SHOP';
    const accountType: AccountType =
      body.accountType === 'SELLER' || body.accountType === 'SHOP_OWNER'
        ? body.accountType
        : inferAccountTypeFromCategory(partnerCategory);
    const registrationOption: RegistrationOption = [
      'OPTION_A_EXISTING_URL',
      'OPTION_B_NEW_PARTNER',
      'ADMIN_CREATED',
    ].includes(body.registrationOption)
      ? body.registrationOption
      : body.existingWebsiteUrl
      ? 'OPTION_A_EXISTING_URL'
      : 'ADMIN_CREATED';

    const fullName = String(body.fullName || body.ownerName || '').trim();
    const businessName = String(body.businessName || body.shopName || fullName).trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const existingWebsiteUrl = normalizeWebsiteUrl(body.existingWebsiteUrl);

    if (!fullName || !phone) {
      res.status(400).json({ success: false, error: 'Owner/Partner name and mobile number are required.' });
      return;
    }

    const phoneDigits = normalizePhoneDigits(phone);
    if (
      (email && db.vendors.some((v) => v.email && v.email.toLowerCase() === email)) ||
      (phoneDigits.length >= 8 && db.vendors.some((v) => normalizePhoneDigits(v.phone) === phoneDigits))
    ) {
      res.status(409).json({
        success: false,
        error: 'A partner account with this email or mobile number already exists.',
      });
      return;
    }

    const plainPassword =
      typeof body.password === 'string' && body.password.trim().length >= 6
        ? body.password.trim()
        : generateSecureTempPassword();

    let vendorCode = '';
    if (partnerCategory === 'EXISTING_SUPPLIER') {
      db.counters.supplierSeq += 1;
      vendorCode = `SUP-${db.counters.supplierSeq}`;
    } else if (partnerCategory === 'ROADSIDE_STORE') {
      db.counters.roadsideSeq += 1;
      vendorCode = `RDS-${db.counters.roadsideSeq}`;
    } else {
      db.counters.garmentSeq += 1;
      vendorCode = `GAR-${db.counters.garmentSeq}`;
    }

    const createAsPending = body.createAsPending === true;
    const applicationStatus: PartnerApplicationStatus = createAsPending ? 'pending' : 'approved';
    const accountStatus: AccountStatus = createAsPending ? 'inactive' : 'active';

    const vendorId = crypto.randomUUID();
    const now = new Date().toISOString();
    let authUserId: string | undefined;

    // Provision Supabase Auth user on active approval when Service Role Key is configured
    const sb = getSupabaseAdmin();
    if (sb && !createAsPending) {
      try {
        const authEmail = email || `${vendorCode.toLowerCase()}@partners.obrynt.local`;
        const { data: createdAuth, error: authErr } = await sb.auth.admin.createUser({
          email: authEmail,
          password: plainPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            vendor_code: vendorCode,
            account_type: accountType,
            partner_category: partnerCategory,
          },
        });
        if (!authErr && createdAuth?.user) {
          authUserId = createdAuth.user.id;
          const profileRole =
            partnerCategory === 'EXISTING_SUPPLIER'
              ? 'existing_supplier'
              : partnerCategory === 'ROADSIDE_STORE'
              ? 'roadside_store'
              : 'garment_shop';
          await sb.from('profiles').upsert({
            id: authUserId,
            email: authEmail,
            role: profileRole,
            full_name: fullName,
            phone,
            vendor_id: vendorId,
            status: 'active',
          });
        }
      } catch (err) {
        console.warn('[OBRYNT Supabase Auth Admin] createUser warning:', err);
      }
    }

    const secureLoginLink = `/vendor?partner=${encodeURIComponent(vendorCode)}`;

    const vendor: InternalVendorProfile = {
      id: vendorId,
      vendorCode,
      authUserId,
      accountType,
      partnerCategory,
      registrationOption,
      applicationStatus,
      existingWebsiteUrl: existingWebsiteUrl || undefined,
      approvedAt: createAsPending ? undefined : now,
      approvedBy: createAsPending ? undefined : req.adminAuth!.userEmail,
      secureLoginLink,
      fullName,
      businessName,
      email,
      phone,
      status: accountStatus,
      passwordHash: hashPassword(plainPassword),
      gstNumber: body.gstNumber ? String(body.gstNumber).trim() : undefined,
      commissionMode: body.commissionMode || 'percentage',
      commissionRate: Number(body.commissionRate ?? 10),
      fixedCommission: Number(body.fixedCommission ?? 0),
      platformFeePct: Number(body.platformFeePct ?? 2),
      pickupAddress: String(body.pickupAddress || body.shopAddress || '').trim(),
      notes: body.notes ? String(body.notes).trim() : undefined,
      createdBy: req.adminAuth!.userId,
      createdAt: now,
      updatedAt: now,
    };

    db.vendors.unshift(vendor);

    let shop: InternalShopProfile | undefined;
    if (accountType === 'SHOP_OWNER') {
      shop = {
        id: crypto.randomUUID(),
        vendorId,
        shopName: String(body.shopName || businessName).trim(),
        ownerName: fullName,
        shopAddress: String(body.shopAddress || body.pickupAddress || '').trim(),
        city: String(body.city || '').trim(),
        state: String(body.state || '').trim(),
        pincode: String(body.pincode || '').trim(),
        contactNumber: phone,
        shopPhotos: Array.isArray(body.shopPhotos) ? body.shopPhotos : [],
        gstNumber: vendor.gstNumber,
        openingHours: String(body.openingHours || '10:00 AM - 9:00 PM').trim(),
        pickupAddress: String(body.pickupAddress || body.shopAddress || '').trim(),
        createdAt: now,
        updatedAt: now,
      };
      db.shops.unshift(shop);
    }

    if (createAsPending) {
      appendNotification({
        vendorId: vendor.id,
        recipientRole: 'ADMIN',
        title: `New ${getCategoryLabel(partnerCategory)} Application`,
        message: `${businessName} (${vendorCode}) created in pending review queue.`,
      });
    }

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'admin_created_vendor',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `Admin created ${partnerCategory} account ${vendor.vendorCode} (${vendor.businessName}, ${applicationStatus.toUpperCase()}).`,
    });
    saveDb();
    await syncVendorToSupabase(vendor, shop);

    // Return initial credential ONE TIME in response only (never persisted as plaintext)
    res.status(201).json({
      success: true,
      vendor: sanitizeVendorForResponse(vendor, true),
      initialCredentials: {
        vendorCode: vendor.vendorCode,
        email: vendor.email || vendor.phone,
        temporaryPassword: plainPassword,
        secureLoginLink,
      },
    });
  });

  // Admin Approval Controls: Approve / Reject / Request More Info
  router.post('/admin/vendors/:vendorId/approve', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.params.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Partner account not found.' });
      return;
    }

    const now = new Date().toISOString();
    vendor.applicationStatus = 'approved';
    vendor.status = 'active';
    vendor.rejectionReason = undefined;
    vendor.infoRequestMessage = undefined;
    vendor.approvedAt = now;
    vendor.approvedBy = req.adminAuth!.userEmail;
    vendor.updatedAt = now;

    const inviteCode = crypto.randomBytes(8).toString('hex');
    vendor.secureLoginTokenHash = sha256Hex(inviteCode);
    vendor.secureLoginLink = `/vendor?partner=${encodeURIComponent(vendor.vendorCode)}&invite=${inviteCode}`;

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        if (!vendor.authUserId) {
          const authEmail = vendor.email || `${vendor.vendorCode.toLowerCase()}@partners.obrynt.local`;
          const tempAuthPass = generateSecureTempPassword();
          const { data: createdAuth, error: authErr } = await sb.auth.admin.createUser({
            email: authEmail,
            password: tempAuthPass,
            email_confirm: true,
            user_metadata: {
              full_name: vendor.fullName,
              vendor_code: vendor.vendorCode,
              partner_category: vendor.partnerCategory,
            },
          });
          if (!authErr && createdAuth?.user) {
            vendor.authUserId = createdAuth.user.id;
            const profileRole =
              vendor.partnerCategory === 'EXISTING_SUPPLIER'
                ? 'existing_supplier'
                : vendor.partnerCategory === 'ROADSIDE_STORE'
                ? 'roadside_store'
                : 'garment_shop';
            await sb.from('profiles').upsert({
              id: vendor.authUserId,
              email: authEmail,
              role: profileRole,
              full_name: vendor.fullName,
              phone: vendor.phone,
              vendor_id: vendor.id,
              status: 'active',
            });
          }
        } else {
          await sb.auth.admin.updateUserById(vendor.authUserId, { ban_duration: 'none' });
        }
      } catch {}
    }

    appendNotification({
      vendorId: vendor.id,
      recipientRole: 'PARTNER',
      title: 'Application Approved — Welcome to OBRYNT',
      message: `Your ${getCategoryLabel(vendor.partnerCategory)} account (${vendor.vendorCode}) is now ACTIVE. Sign in to manage products and orders.`,
      actionUrl: vendor.secureLoginLink,
    });

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'admin_approved_partner',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `Admin approved ${vendor.vendorCode} (${vendor.businessName} · ${getCategoryLabel(vendor.partnerCategory)}).`,
    });
    saveDb();
    await syncVendorToSupabase(vendor);

    res.json({
      success: true,
      vendor: sanitizeVendorForResponse(vendor, true),
      secureLoginLink: vendor.secureLoginLink,
    });
  });

  router.post('/admin/vendors/:vendorId/reject', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.params.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Partner account not found.' });
      return;
    }

    const reason = String(req.body?.reason || 'Application did not meet OBRYNT onboarding criteria.').trim();
    const now = new Date().toISOString();
    vendor.applicationStatus = 'rejected';
    vendor.status = 'inactive';
    vendor.rejectionReason = reason;
    vendor.updatedAt = now;

    // Deactivate any staff links tied to this vendor
    db.staffAccounts.forEach((s) => {
      if (s.vendorId === vendor.id) {
        s.status = 'inactive';
        s.updatedAt = now;
      }
    });

    appendNotification({
      vendorId: vendor.id,
      recipientRole: 'PARTNER',
      title: 'Application Declined',
      message: `Your application (${vendor.vendorCode}) was declined: ${reason}`,
    });

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'admin_rejected_partner',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `Admin rejected ${vendor.vendorCode} (${vendor.businessName}): ${reason}`,
    });
    saveDb();
    await syncVendorToSupabase(vendor);

    res.json({ success: true, vendor: sanitizeVendorForResponse(vendor, true) });
  });

  router.post('/admin/vendors/:vendorId/request-info', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.params.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Partner account not found.' });
      return;
    }

    const message = String(req.body?.message || 'Please verify business address, contact details, and catalogue info.').trim();
    const now = new Date().toISOString();
    vendor.applicationStatus = 'more_info_requested';
    vendor.status = 'inactive';
    vendor.infoRequestMessage = message;
    vendor.updatedAt = now;

    appendNotification({
      vendorId: vendor.id,
      recipientRole: 'PARTNER',
      title: 'Additional Information Requested by OBRYNT Admin',
      message,
    });

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'admin_requested_partner_info',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `Admin requested more information from ${vendor.vendorCode}: ${message}`,
    });
    saveDb();
    await syncVendorToSupabase(vendor);

    res.json({ success: true, vendor: sanitizeVendorForResponse(vendor, true) });
  });

  router.patch('/admin/vendors/:vendorId', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.params.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found.' });
      return;
    }

    const body = req.body || {};
    const now = new Date().toISOString();

    if (typeof body.fullName === 'string' && body.fullName.trim()) vendor.fullName = body.fullName.trim();
    if (typeof body.businessName === 'string' && body.businessName.trim()) vendor.businessName = body.businessName.trim();
    if (typeof body.phone === 'string' && body.phone.trim()) vendor.phone = body.phone.trim();
    if (typeof body.email === 'string') vendor.email = body.email.trim().toLowerCase();
    if (typeof body.existingWebsiteUrl === 'string') vendor.existingWebsiteUrl = normalizeWebsiteUrl(body.existingWebsiteUrl) || undefined;
    if (typeof body.gstNumber === 'string') vendor.gstNumber = body.gstNumber.trim();
    if (typeof body.pickupAddress === 'string') vendor.pickupAddress = body.pickupAddress.trim();
    if (typeof body.notes === 'string') vendor.notes = body.notes.trim();
    if (body.commissionMode) vendor.commissionMode = body.commissionMode;
    if (body.commissionRate !== undefined) vendor.commissionRate = Number(body.commissionRate);
    if (body.fixedCommission !== undefined) vendor.fixedCommission = Number(body.fixedCommission);
    if (body.platformFeePct !== undefined) vendor.platformFeePct = Number(body.platformFeePct);

    if (['EXISTING_SUPPLIER', 'GARMENT_SHOP', 'ROADSIDE_STORE'].includes(body.partnerCategory)) {
      vendor.partnerCategory = body.partnerCategory;
      vendor.accountType = inferAccountTypeFromCategory(body.partnerCategory);
    } else if (body.accountType === 'SHOP_OWNER' || body.accountType === 'SELLER') {
      vendor.accountType = body.accountType;
    }

    vendor.updatedAt = now;

    const shop = db.shops.find((s) => s.vendorId === vendor.id);
    if (shop && body.shopProfile) {
      Object.assign(shop, {
        shopName: body.shopProfile.shopName ?? shop.shopName,
        shopAddress: body.shopProfile.shopAddress ?? shop.shopAddress,
        city: body.shopProfile.city ?? shop.city,
        state: body.shopProfile.state ?? shop.state,
        pincode: body.shopProfile.pincode ?? shop.pincode,
        openingHours: body.shopProfile.openingHours ?? shop.openingHours,
        pickupAddress: body.shopProfile.pickupAddress ?? shop.pickupAddress,
        updatedAt: now,
      });
    }

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'admin_updated_vendor',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `Admin updated vendor details for ${vendor.vendorCode}.`,
    });
    saveDb();
    await syncVendorToSupabase(vendor, shop);

    res.json({ success: true, vendor: sanitizeVendorForResponse(vendor, true) });
  });

  router.post('/admin/vendors/:vendorId/status', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.params.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found.' });
      return;
    }

    const { status } = req.body || {};
    if (!['active', 'inactive', 'suspended', 'blocked'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status. Use active, inactive, suspended, or blocked.' });
      return;
    }

    if (status === 'active' && vendor.applicationStatus !== 'approved') {
      res.status(400).json({
        success: false,
        error: 'Partner application must be approved first before activating the account.',
      });
      return;
    }

    vendor.status = status;
    vendor.updatedAt = new Date().toISOString();

    const sb = getSupabaseAdmin();
    if (sb && vendor.authUserId) {
      try {
        await sb.auth.admin.updateUserById(vendor.authUserId, {
          ban_duration: status === 'active' ? 'none' : '87600h',
        });
      } catch {}
    }

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: `admin_vendor_status_${status}`,
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `Admin changed ${vendor.vendorCode} (${vendor.businessName}) status to ${status.toUpperCase()}.`,
    });
    saveDb();
    await syncVendorToSupabase(vendor);

    res.json({ success: true, vendor: sanitizeVendorForResponse(vendor, true) });
  });

  // -----------------------------------------------------------------------
  // ADMIN PRIVATE STAFF ACCOUNT MANAGEMENT (GARMENT SHOP & ROADSIDE STORE)
  // -----------------------------------------------------------------------
  router.get('/admin/staff-accounts', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    const staffAccounts = db.staffAccounts.map(({ passwordHash: _pw, accessTokenHash: _th, ...safe }) => safe);
    res.json({ success: true, staffAccounts });
  });

  router.post('/admin/staff-accounts', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const body = req.body || {};
    const vendor = db.vendors.find((v) => v.id === body.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Selected shop account not found.' });
      return;
    }
    if (vendor.partnerCategory !== 'GARMENT_SHOP' && vendor.partnerCategory !== 'ROADSIDE_STORE') {
      res.status(400).json({
        success: false,
        error: 'Staff accounts are available for approved Garment Shops and Roadside Stores only.',
      });
      return;
    }
    if (vendor.applicationStatus !== 'approved') {
      res.status(400).json({
        success: false,
        error: 'Shop must be approved before issuing private staff access.',
      });
      return;
    }

    const staffCategory: ShopStaffCategory = vendor.partnerCategory;
    const staffLabel = String(body.staffLabel || 'Store Staff').trim();
    const rawPassword =
      typeof body.password === 'string' && body.password.trim().length >= 6
        ? body.password.trim()
        : generateSecureTempPassword();

    // Guarantee password doesn't collide within active staff accounts of the same category
    const collides = db.staffAccounts.some(
      (s) => s.staffCategory === staffCategory && s.status === 'active' && verifyPassword(rawPassword, s.passwordHash)
    );
    if (collides) {
      res.status(409).json({
        success: false,
        error: 'Choose a more unique password so private staff logins remain isolated across stores.',
      });
      return;
    }

    db.counters.staffSeq += 1;
    const prefix = staffCategory === 'GARMENT_SHOP' ? 'GSTF' : 'RSTF';
    const staffCode = `${prefix}-${db.counters.staffSeq}`;
    const rawAccessToken = `stf_${crypto.randomBytes(18).toString('base64url')}`;
    const now = new Date().toISOString();

    const staff: InternalStaffAccount = {
      id: crypto.randomUUID(),
      staffCode,
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      shopName: vendor.businessName,
      staffCategory,
      staffLabel,
      passwordHash: hashPassword(rawPassword),
      accessTokenHash: sha256Hex(rawAccessToken),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    db.staffAccounts.unshift(staff);
    const routeSegment = staffCategory === 'GARMENT_SHOP' ? 'garment' : 'roadside';
    const staffAccessPath = `/staff/${routeSegment}?access=${encodeURIComponent(rawAccessToken)}`;

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'admin_created_staff_access',
      entityType: 'partner_staff_account',
      entityId: staff.id,
      details: `Issued private ${staffCategory} staff access ${staffCode} for ${vendor.businessName}.`,
    });
    saveDb();

    const { passwordHash: _pw, accessTokenHash: _th, ...safeStaff } = staff;
    res.status(201).json({
      success: true,
      staffAccount: safeStaff,
      staffAccessPath,
      temporaryPassword: rawPassword,
    });
  });

  router.post('/admin/staff-accounts/:staffId/status', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const staff = db.staffAccounts.find((s) => s.id === req.params.staffId);
    if (!staff) {
      res.status(404).json({ success: false, error: 'Staff account not found.' });
      return;
    }
    const status = req.body?.status === 'active' ? 'active' : 'inactive';
    staff.status = status;
    staff.updatedAt = new Date().toISOString();

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: staff.vendorId,
      vendorCode: staff.vendorCode,
      action: `admin_staff_${status}`,
      entityType: 'partner_staff_account',
      entityId: staff.id,
      details: `Admin set staff ${staff.staffCode} (${staff.shopName}) to ${status.toUpperCase()}.`,
    });
    saveDb();

    const { passwordHash: _pw, accessTokenHash: _th, ...safeStaff } = staff;
    res.json({ success: true, staffAccount: safeStaff });
  });

  router.post('/admin/staff-accounts/:staffId/reset-password', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const staff = db.staffAccounts.find((s) => s.id === req.params.staffId);
    if (!staff) {
      res.status(404).json({ success: false, error: 'Staff account not found.' });
      return;
    }
    const reqPw = typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';
    const newPassword = reqPw.length >= 6 ? reqPw : generateSecureTempPassword();

    const collides = db.staffAccounts.some(
      (s) =>
        s.id !== staff.id &&
        s.staffCategory === staff.staffCategory &&
        s.status === 'active' &&
        verifyPassword(newPassword, s.passwordHash)
    );
    if (collides) {
      res.status(409).json({
        success: false,
        error: 'Password collides with another active staff access key. Please choose another password.',
      });
      return;
    }

    const newAccessToken = `stf_${crypto.randomBytes(18).toString('base64url')}`;
    staff.passwordHash = hashPassword(newPassword);
    staff.accessTokenHash = sha256Hex(newAccessToken);
    staff.updatedAt = new Date().toISOString();

    const routeSegment = staff.staffCategory === 'GARMENT_SHOP' ? 'garment' : 'roadside';
    const staffAccessPath = `/staff/${routeSegment}?access=${encodeURIComponent(newAccessToken)}`;

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: staff.vendorId,
      vendorCode: staff.vendorCode,
      action: 'admin_reset_staff_access',
      entityType: 'partner_staff_account',
      entityId: staff.id,
      details: `Admin rotated password & access link for staff ${staff.staffCode}.`,
    });
    saveDb();

    res.json({
      success: true,
      staffCode: staff.staffCode,
      shopName: staff.shopName,
      temporaryPassword: newPassword,
      staffAccessPath,
    });
  });

  router.delete('/admin/staff-accounts/:staffId', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const idx = db.staffAccounts.findIndex((s) => s.id === req.params.staffId);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Staff account not found.' });
      return;
    }
    const [removed] = db.staffAccounts.splice(idx, 1);
    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: removed.vendorId,
      vendorCode: removed.vendorCode,
      action: 'admin_deleted_staff_access',
      entityType: 'partner_staff_account',
      entityId: removed.id,
      details: `Removed staff access ${removed.staffCode} for ${removed.shopName}.`,
    });
    saveDb();
    res.json({ success: true });
  });

  router.post('/admin/vendors/:vendorId/reset-password', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.params.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found.' });
      return;
    }

    const requestedPw = typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';
    const newPassword = requestedPw.length >= 6 ? requestedPw : generateSecureTempPassword();

    vendor.passwordHash = hashPassword(newPassword);
    vendor.updatedAt = new Date().toISOString();

    const sb = getSupabaseAdmin();
    if (sb && vendor.authUserId) {
      try {
        await sb.auth.admin.updateUserById(vendor.authUserId, { password: newPassword });
      } catch {}
    }

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      action: 'admin_reset_vendor_password',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `Admin securely reset password for ${vendor.vendorCode}.`,
    });
    saveDb();
    await syncVendorToSupabase(vendor);

    res.json({
      success: true,
      vendorCode: vendor.vendorCode,
      email: vendor.email || vendor.phone,
      temporaryPassword: newPassword,
    });
  });

  // Safe Delete with Data Retention Protection
  router.delete('/admin/vendors/:vendorId', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const idx = db.vendors.findIndex((v) => v.id === req.params.vendorId);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Vendor not found.' });
      return;
    }
    const vendor = db.vendors[idx];
    const hasOrders = db.orders.some((o) => o.vendorId === vendor.id);
    const hasSettlements = db.settlements.some((s) => s.vendorId === vendor.id);

    if (hasOrders || hasSettlements) {
      // Data retention rule: Preserve financial/order history by blocking account and disabling products rather than wiping accounting trail
      vendor.status = 'blocked';
      vendor.updatedAt = new Date().toISOString();
      db.products
        .filter((p) => p.vendorId === vendor.id)
        .forEach((p) => {
          p.approvalStatus = 'disabled';
          p.updatedAt = vendor.updatedAt;
        });
      db.staffAccounts.forEach((s) => {
        if (s.vendorId === vendor.id) {
          s.status = 'inactive';
          s.updatedAt = vendor.updatedAt;
        }
      });

      appendActivityLog({
        actorId: req.adminAuth!.userId,
        actorRole: 'SUPER_ADMIN',
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        action: 'admin_soft_archived_vendor_retention',
        entityType: 'vendor_profile',
        entityId: vendor.id,
        details: `Vendor ${vendor.vendorCode} has order/settlement history; safely blocked and products disabled per data-retention rules.`,
      });
      saveDb();
      res.json({
        success: true,
        retentionArchived: true,
        message: 'Vendor has historical orders/settlements — safely archived & blocked per financial data-retention rules.',
      });
      return;
    }

    // No order/settlement ledger yet: safe full deletion
    db.vendors.splice(idx, 1);
    db.shops = db.shops.filter((s) => s.vendorId !== vendor.id);
    db.products = db.products.filter((p) => p.vendorId !== vendor.id);
    db.inventory = db.inventory.filter((i) => i.vendorId !== vendor.id);
    db.staffAccounts = db.staffAccounts.filter((s) => s.vendorId !== vendor.id);

    const sb = getSupabaseAdmin();
    if (sb && vendor.authUserId) {
      try {
        await sb.auth.admin.deleteUser(vendor.authUserId);
      } catch {}
    }

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      action: 'admin_deleted_vendor',
      entityType: 'vendor_profile',
      entityId: vendor.id,
      details: `Admin permanently deleted unused vendor ${vendor.vendorCode} (${vendor.businessName}).`,
    });
    saveDb();
    res.json({ success: true, retentionArchived: false, message: 'Vendor account safely removed.' });
  });

  // Vendor 360° Overview for Admin
  router.get('/admin/vendors/:vendorId/overview', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const vendor = db.vendors.find((v) => v.id === req.params.vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found.' });
      return;
    }
    const products = db.products.filter((p) => p.vendorId === vendor.id);
    const orders = db.orders.filter((o) => o.vendorId === vendor.id);
    const settlements = db.settlements.filter((s) => s.vendorId === vendor.id);
    const logs = db.logs.filter((l) => l.vendorId === vendor.id).slice(0, 50);

    res.json({
      success: true,
      vendor: sanitizeVendorForResponse(vendor, true),
      products,
      orders,
      settlements,
      logs,
    });
  });

  // -----------------------------------------------------------------------
  // ADMIN PRODUCT APPROVAL QUEUE & CENTRAL CATALOGUE
  // -----------------------------------------------------------------------
  router.get('/admin/vendor-products', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    res.json({ success: true, products: db.products });
  });

  router.post('/admin/vendor-products/:productId/approve', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const prod = db.products.find((p) => p.id === req.params.productId);
    if (!prod) {
      res.status(404).json({ success: false, error: 'Vendor product not found.' });
      return;
    }
    const now = new Date().toISOString();
    if (req.body?.sellingPrice && Number(req.body.sellingPrice) > 0) {
      prod.sellingPrice = Number(req.body.sellingPrice);
    }
    prod.approvalStatus = prod.totalStock > 0 ? 'approved' : 'out_of_stock';
    prod.rejectionReason = undefined;
    prod.reviewedAt = now;
    prod.reviewedBy = req.adminAuth!.userEmail;
    prod.publishedProductSku = prod.productCode;
    prod.updatedAt = now;

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: prod.vendorId,
      vendorCode: prod.vendorCode,
      action: 'admin_approved_product',
      entityType: 'vendor_product',
      entityId: prod.id,
      details: `Approved "${prod.name}" (${prod.productCode}) for storefront at ₹${prod.sellingPrice}.`,
    });
    saveDb();
    await syncProductToSupabase(prod);

    res.json({ success: true, product: prod });
  });

  router.post('/admin/vendor-products/:productId/reject', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const prod = db.products.find((p) => p.id === req.params.productId);
    if (!prod) {
      res.status(404).json({ success: false, error: 'Vendor product not found.' });
      return;
    }
    const reason = String(req.body?.reason || 'Does not meet OBRYNT listing guidelines.').trim();
    const now = new Date().toISOString();
    prod.approvalStatus = 'rejected';
    prod.rejectionReason = reason;
    prod.reviewedAt = now;
    prod.reviewedBy = req.adminAuth!.userEmail;
    prod.updatedAt = now;

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: prod.vendorId,
      vendorCode: prod.vendorCode,
      action: 'admin_rejected_product',
      entityType: 'vendor_product',
      entityId: prod.id,
      details: `Rejected "${prod.name}" (${prod.productCode}): ${reason}`,
    });
    saveDb();
    await syncProductToSupabase(prod);

    res.json({ success: true, product: prod });
  });

  router.post('/admin/vendor-products/:productId/status', requireAdminAuth, async (req: AuthedRequest, res: Response) => {
    const prod = db.products.find((p) => p.id === req.params.productId);
    if (!prod) {
      res.status(404).json({ success: false, error: 'Vendor product not found.' });
      return;
    }
    const { approvalStatus } = req.body || {};
    if (!['draft', 'pending_approval', 'approved', 'rejected', 'out_of_stock', 'disabled'].includes(approvalStatus)) {
      res.status(400).json({ success: false, error: 'Invalid product approvalStatus.' });
      return;
    }
    prod.approvalStatus = approvalStatus;
    prod.updatedAt = new Date().toISOString();
    saveDb();
    await syncProductToSupabase(prod);
    res.json({ success: true, product: prod });
  });

  // -----------------------------------------------------------------------
  // ADMIN COMMISSIONS, ORDERS, SETTLEMENTS & LOGS
  // -----------------------------------------------------------------------
  router.get('/admin/commissions', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    res.json({ success: true, rules: db.commissions });
  });

  router.post('/admin/commissions', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const body = req.body || {};
    const scope = body.scope as 'global' | 'vendor' | 'product';
    if (!['global', 'vendor', 'product'].includes(scope)) {
      res.status(400).json({ success: false, error: 'Scope must be global, vendor, or product.' });
      return;
    }

    const now = new Date().toISOString();
    const vendor = body.vendorId ? db.vendors.find((v) => v.id === body.vendorId) : undefined;
    const product = body.vendorProductId ? db.products.find((p) => p.id === body.vendorProductId) : undefined;

    // Replace active rule for same target scope cleanly
    db.commissions.forEach((c) => {
      if (
        c.scope === scope &&
        c.vendorId === (body.vendorId || undefined) &&
        c.vendorProductId === (body.vendorProductId || undefined)
      ) {
        c.isActive = false;
      }
    });

    const rule: InternalCommissionRule = {
      id: crypto.randomUUID(),
      scope,
      vendorId: body.vendorId || undefined,
      vendorName: vendor?.businessName,
      vendorProductId: body.vendorProductId || undefined,
      productName: product?.name,
      commissionMode: body.commissionMode || 'percentage',
      percentageRate: Number(body.percentageRate ?? 10),
      fixedAmount: Number(body.fixedAmount ?? 0),
      platformFeePct: Number(body.platformFeePct ?? 2),
      isActive: true,
      notes: body.notes ? String(body.notes).trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    db.commissions.unshift(rule);

    // Sync vendor profile defaults if vendor-level
    if (scope === 'vendor' && vendor) {
      vendor.commissionMode = rule.commissionMode;
      vendor.commissionRate = rule.percentageRate;
      vendor.fixedCommission = rule.fixedAmount;
      vendor.platformFeePct = rule.platformFeePct;
      vendor.updatedAt = now;
    }

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: rule.vendorId,
      action: 'admin_updated_commission_rule',
      entityType: 'vendor_commission',
      entityId: rule.id,
      details: `Configured ${scope} commission: ${rule.commissionMode} (${rule.percentageRate}% + ₹${rule.fixedAmount}, fee ${rule.platformFeePct}%).`,
    });
    saveDb();

    res.status(201).json({ success: true, rule });
  });

  router.delete('/admin/commissions/:ruleId', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const idx = db.commissions.findIndex((c) => c.id === req.params.ruleId);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Rule not found.' });
      return;
    }
    if (db.commissions[idx].id === 'comm-global-default') {
      res.status(400).json({ success: false, error: 'Cannot delete baseline global commission rule; edit it instead.' });
      return;
    }
    db.commissions.splice(idx, 1);
    saveDb();
    res.json({ success: true });
  });

  router.get('/admin/vendor-orders', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    res.json({ success: true, orders: db.orders });
  });

  router.get('/admin/settlements', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    res.json({ success: true, settlements: db.settlements });
  });

  router.post('/admin/settlements/:settlementId/mark-settled', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const settlement = db.settlements.find((s) => s.id === req.params.settlementId);
    if (!settlement) {
      res.status(404).json({ success: false, error: 'Settlement record not found.' });
      return;
    }
    const paymentReference = String(req.body?.paymentReference || '').trim();
    if (!paymentReference) {
      res.status(400).json({ success: false, error: 'Manual bank/UPI payment reference is required to mark settled.' });
      return;
    }

    const now = new Date().toISOString();
    settlement.settlementStatus = 'settled';
    settlement.paymentReference = paymentReference;
    settlement.settledAt = now;
    settlement.notes = String(req.body?.notes || settlement.notes || 'Manually settled by OBRYNT Admin.');
    settlement.updatedAt = now;

    appendActivityLog({
      actorId: req.adminAuth!.userId,
      actorRole: 'SUPER_ADMIN',
      vendorId: settlement.vendorId,
      vendorCode: settlement.vendorCode,
      action: 'admin_marked_settlement_paid',
      entityType: 'vendor_settlement',
      entityId: settlement.id,
      details: `Recorded manual settlement ${settlement.settlementCode} for ₹${settlement.netVendorPayable} (Ref: ${paymentReference}).`,
    });
    saveDb();

    res.json({ success: true, settlement });
  });

  router.get('/admin/vendor-logs', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    res.json({ success: true, logs: db.logs });
  });

  return router;
}
