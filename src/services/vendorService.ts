import {
  OrderDetails,
  PartnerCategory,
  PartnerNotification,
  PartnerRegistrationLink,
  PartnerStaffAccount,
  PartnersAdminOverviewCounts,
  RegistrationOption,
  ShopStaffCategory,
  ShopStaffSession,
  VendorAccountStatus,
  VendorAccountType,
  VendorActivityLog,
  VendorAuthSession,
  VendorCommissionRule,
  VendorProduct,
  VendorProductApprovalStatus,
  VendorProfile,
  VendorSettlement,
  VendorSubOrder,
  CommissionMode,
} from '../types';
import { getActiveSession } from './authService';
import { getSupabaseClient } from './supabaseClient';

const VENDOR_SESSION_STORAGE_KEY = 'obrynt_vendor_session_v1';
const SHOP_STAFF_SESSION_STORAGE_KEY = 'obrynt_shop_staff_session_v1';

// =========================================================================
// VENDOR & PRIVATE SHOP STAFF SESSION STORAGE
// =========================================================================

export function getVendorSession(): VendorAuthSession | null {
  try {
    const raw = localStorage.getItem(VENDOR_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: VendorAuthSession = JSON.parse(raw);
    if (!session.token || Date.now() > session.expiresAt) {
      clearVendorSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveVendorSession(session: VendorAuthSession): void {
  try {
    localStorage.setItem(VENDOR_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('[OBRYNT Vendor] Failed to save vendor session:', err);
  }
}

export function clearVendorSession(): void {
  try {
    localStorage.removeItem(VENDOR_SESSION_STORAGE_KEY);
  } catch {}
}

export function getShopStaffSession(): ShopStaffSession | null {
  try {
    const raw = localStorage.getItem(SHOP_STAFF_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: ShopStaffSession = JSON.parse(raw);
    if (!session.token || Date.now() > session.expiresAt) {
      clearShopStaffSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveShopStaffSession(session: ShopStaffSession): void {
  try {
    localStorage.setItem(SHOP_STAFF_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

export function clearShopStaffSession(): void {
  try {
    localStorage.removeItem(SHOP_STAFF_SESSION_STORAGE_KEY);
  } catch {}
}

// =========================================================================
// AUTH HEADER HELPERS
// =========================================================================

async function getAdminHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const ownerSession = getActiveSession();
  if (ownerSession?.serverToken) {
    headers.Authorization = `Bearer ${ownerSession.serverToken}`;
    return headers;
  }

  try {
    const sb = getSupabaseClient();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data.session?.access_token) {
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    }
  } catch {}

  return headers;
}

function getVendorHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const session = getVendorSession();
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
}

function getShopStaffHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const session = getShopStaffSession();
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
}

async function parseJsonSafe<T = any>(res: Response): Promise<T & { success?: boolean; error?: string }> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with HTTP ${res.status}`);
  }
  return data;
}

// =========================================================================
// VENDOR / PARTNER AUTHENTICATION & ONBOARDING
// =========================================================================

export async function loginVendorPortal(
  identifier: string,
  password: string
): Promise<{
  success: boolean;
  session?: VendorAuthSession;
  profile?: VendorProfile;
  notifications?: PartnerNotification[];
  error?: string;
  code?: string;
  applicationStatus?: string;
  infoRequestMessage?: string;
  rejectionReason?: string;
  vendorCode?: string;
}> {
  try {
    const res = await fetch('/api/vendor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Authentication failed.',
        code: data.code,
        applicationStatus: data.applicationStatus,
        infoRequestMessage: data.infoRequestMessage,
        rejectionReason: data.rejectionReason,
        vendorCode: data.vendorCode,
      };
    }
    saveVendorSession(data.session);
    return {
      success: true,
      session: data.session,
      profile: data.profile,
      notifications: data.notifications,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unable to connect to authentication server.' };
  }
}

export async function createPartnerRegistrationLink(payload: {
  partnerCategory?: PartnerCategory | 'ANY';
  registrationOption?: RegistrationOption | 'BOTH';
  intendedBusinessName?: string;
}): Promise<{
  token: string;
  link: { id: string; partnerCategory: string; registrationOption: string; expiresAt: string };
  registrationPath: string;
}> {
  const res = await fetch('/api/partners/create-registration-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonSafe(res);
}

export async function validatePartnerRegistrationToken(token: string): Promise<{
  valid: boolean;
  link?: {
    id: string;
    partnerCategory: PartnerCategory | 'ANY';
    registrationOption: RegistrationOption | 'BOTH';
    intendedBusinessName?: string;
    expiresAt: string;
  };
  error?: string;
}> {
  try {
    const res = await fetch(`/api/partners/registration-links/${encodeURIComponent(token)}`, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.valid) {
      return { valid: false, error: data.error || 'Invalid or expired registration link.' };
    }
    return { valid: true, link: data.link };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Unable to verify registration link.' };
  }
}

export async function submitPartnerApplication(payload: {
  token: string;
  partnerCategory: PartnerCategory;
  registrationOption: RegistrationOption;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  existingWebsiteUrl?: string;
  password: string;
  notes?: string;
}): Promise<{
  success: boolean;
  vendorCode: string;
  partnerCategory: PartnerCategory;
  applicationStatus: string;
  message: string;
}> {
  const res = await fetch('/api/partners/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonSafe(res);
}

export async function resubmitPartnerMoreInfo(payload: {
  identifier: string;
  password: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  existingWebsiteUrl?: string;
  additionalInfo?: string;
}): Promise<{ success: boolean; applicationStatus: string; message: string }> {
  const res = await fetch('/api/partners/resubmit-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonSafe(res);
}

// =========================================================================
// PRIVATE SHOP STAFF PORTAL (GARMENT STAFF & ROADSIDE STORE STAFF)
// =========================================================================

export async function loginPrivateShopStaff(payload: {
  staffType: ShopStaffCategory;
  password: string;
  accessToken?: string;
}): Promise<{
  success: boolean;
  session?: ShopStaffSession;
  error?: string;
  isLocked?: boolean;
  lockRemainingSec?: number;
}> {
  try {
    const res = await fetch('/api/staff-portal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Invalid staff access credentials.',
        isLocked: data.isLocked,
        lockRemainingSec: data.lockRemainingSec,
      };
    }
    saveShopStaffSession(data.session);
    return { success: true, session: data.session };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unable to verify staff login.' };
  }
}

export interface ShopStaffWorkspace {
  staffCode: string;
  staffCategory: ShopStaffCategory;
  shopName: string;
  products: VendorProduct[];
  orders: Array<{
    id: string;
    suborderCode: string;
    parentOrderCode: string;
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
    stockConfirmed: boolean;
    status: string;
    rejectionReason?: string;
    trackingNumber?: string;
    items: Array<{
      id: string;
      sku: string;
      productName: string;
      size: string;
      color: string;
      quantity: number;
      imageUrl?: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
}

export async function fetchShopStaffWorkspace(): Promise<ShopStaffWorkspace> {
  const res = await fetch('/api/staff-portal/workspace', { headers: getShopStaffHeaders() });
  const data = await parseJsonSafe<{ workspace: ShopStaffWorkspace }>(res);
  return data.workspace;
}

export async function staffUpdateProductStock(
  productId: string,
  totalStock: number
): Promise<{ totalStock: number; approvalStatus: string }> {
  const res = await fetch(`/api/staff-portal/products/${encodeURIComponent(productId)}/stock`, {
    method: 'POST',
    headers: getShopStaffHeaders(),
    body: JSON.stringify({ totalStock }),
  });
  return parseJsonSafe(res);
}

export async function staffPerformOrderAction(
  orderId: string,
  action: 'accept' | 'confirm_stock' | 'mark_processing' | 'mark_ready_for_pickup',
  trackingNumber?: string
): Promise<{ status: string }> {
  const res = await fetch(`/api/staff-portal/orders/${encodeURIComponent(orderId)}/action`, {
    method: 'POST',
    headers: getShopStaffHeaders(),
    body: JSON.stringify({ action, trackingNumber }),
  });
  return parseJsonSafe(res);
}

export async function fetchVendorProfile(): Promise<VendorProfile> {
  const res = await fetch('/api/vendor/me', { headers: getVendorHeaders() });
  const data = await parseJsonSafe<{ profile: VendorProfile }>(res);
  return data.profile;
}

export async function updateVendorProfile(payload: {
  fullName?: string;
  businessName?: string;
  phone?: string;
  gstNumber?: string;
  pickupAddress?: string;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  shopProfile?: {
    shopName?: string;
    ownerName?: string;
    shopAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contactNumber?: string;
    shopPhotos?: string[];
    gstNumber?: string;
    openingHours?: string;
    pickupAddress?: string;
  };
}): Promise<VendorProfile> {
  const res = await fetch('/api/vendor/profile', {
    method: 'PUT',
    headers: getVendorHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe<{ profile: VendorProfile }>(res);
  return data.profile;
}

// =========================================================================
// VENDOR PRODUCT & BULK CATALOG MANAGEMENT
// =========================================================================

export async function fetchVendorProducts(): Promise<VendorProduct[]> {
  const res = await fetch('/api/vendor/products', { headers: getVendorHeaders() });
  const data = await parseJsonSafe<{ products: VendorProduct[] }>(res);
  return data.products || [];
}

export async function createVendorProduct(payload: Partial<VendorProduct> & { saveAsDraft?: boolean }): Promise<VendorProduct> {
  const res = await fetch('/api/vendor/products', {
    method: 'POST',
    headers: getVendorHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe<{ product: VendorProduct }>(res);
  return data.product;
}

export async function bulkUploadVendorProducts(
  products: Array<Partial<VendorProduct> & { imageUrl?: string }>
): Promise<{ createdCount: number; skipped: string[]; products: VendorProduct[] }> {
  const res = await fetch('/api/vendor/products/bulk', {
    method: 'POST',
    headers: getVendorHeaders(),
    body: JSON.stringify({ products }),
  });
  return parseJsonSafe<{ createdCount: number; skipped: string[]; products: VendorProduct[] }>(res);
}

export async function updateVendorProduct(
  productId: string,
  payload: Partial<VendorProduct> & { submitForApproval?: boolean }
): Promise<{ product: VendorProduct; returnedForApproval: boolean }> {
  const res = await fetch(`/api/vendor/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers: getVendorHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJsonSafe<{ product: VendorProduct; returnedForApproval: boolean }>(res);
}

export async function deleteVendorProduct(productId: string): Promise<void> {
  const res = await fetch(`/api/vendor/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: getVendorHeaders(),
  });
  await parseJsonSafe(res);
}

// =========================================================================
// VENDOR ORDER & FINANCIAL MANAGEMENT
// =========================================================================

export async function fetchVendorOrders(): Promise<VendorSubOrder[]> {
  const res = await fetch('/api/vendor/orders', { headers: getVendorHeaders() });
  const data = await parseJsonSafe<{ orders: VendorSubOrder[] }>(res);
  return data.orders || [];
}

export interface VendorDeliveryNotice {
  assignmentId: string;
  suborderCode: string;
  parentOrderCode: string;
  pickupShopAddress: string;
  pickupVendorName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  packageDetails: string;
  isCod: boolean;
  paymentMethodType: 'PREPAID' | 'CASH ON DELIVERY';
  codAmountToCollect?: number;
}

export async function performVendorOrderAction(
  orderId: string,
  action: 'accept' | 'confirm_stock' | 'reject' | 'mark_processing' | 'mark_ready_for_pickup',
  options?: { reason?: string; trackingNumber?: string }
): Promise<{ order: VendorSubOrder; deliveryNotice?: VendorDeliveryNotice }> {
  const res = await fetch(`/api/vendor/orders/${encodeURIComponent(orderId)}/action`, {
    method: 'POST',
    headers: getVendorHeaders(),
    body: JSON.stringify({
      action,
      reason: options?.reason,
      trackingNumber: options?.trackingNumber,
    }),
  });
  return parseJsonSafe<{ order: VendorSubOrder; deliveryNotice?: VendorDeliveryNotice }>(res);
}

export interface VendorFinancialSummary {
  totalSales: number;
  totalSupplierAgreed: number;
  totalCommission: number;
  totalFees: number;
  totalPayableEarnings: number;
  settledAmount: number;
  pendingPayableAmount: number;
  returnedOrCancelledCount: number;
}

export async function fetchVendorFinancials(): Promise<{
  summary: VendorFinancialSummary;
  settlements: VendorSettlement[];
  commissionRule: VendorCommissionRule;
}> {
  const res = await fetch('/api/vendor/financials', { headers: getVendorHeaders() });
  return parseJsonSafe(res);
}

// =========================================================================
// CENTRAL ORDER DISTRIBUTION & DELIVERY SANITIZED PICKUPS
// =========================================================================

export async function distributeOrderToVendors(order: OrderDetails): Promise<VendorSubOrder[]> {
  try {
    const res = await fetch('/api/orders/distribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ order }),
    });
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data.suborders) ? data.suborders : [];
  } catch (err) {
    console.warn('[OBRYNT Marketplace] Vendor order distribution notice:', err);
    return [];
  }
}

export interface SanitizedDeliveryVendorPickup {
  assignmentId: string;
  suborderId: string;
  suborderCode: string;
  parentOrderCode: string;
  pickupShopAddress: string;
  pickupVendorName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  packageDetails: string;
  isCod: boolean;
  paymentMethodType: 'PREPAID' | 'CASH ON DELIVERY';
  codAmountToCollect?: number;
  status: string;
  trackingNumber?: string;
  updatedAt: string;
}

export async function fetchDeliveryVendorPickups(): Promise<SanitizedDeliveryVendorPickup[]> {
  try {
    const res = await fetch('/api/delivery/vendor-pickups', {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data.pickups) ? data.pickups : [];
  } catch {
    return [];
  }
}

export async function updateDeliveryVendorPickupStatus(
  suborderId: string,
  status: 'picked_up' | 'in_transit' | 'delivered' | 'returned',
  trackingNumber?: string
): Promise<void> {
  const res = await fetch(`/api/delivery/vendor-pickups/${encodeURIComponent(suborderId)}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ status, trackingNumber }),
  });
  await parseJsonSafe(res);
}

// =========================================================================
// ADMIN SUPER-USER VENDOR CONTROL ENDPOINTS
// =========================================================================

export async function adminListVendors(): Promise<VendorProfile[]> {
  const res = await fetch('/api/admin/vendors', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ vendors: VendorProfile[] }>(res);
  return data.vendors || [];
}

export async function adminCreateVendor(payload: {
  accountType?: VendorAccountType;
  partnerCategory?: PartnerCategory;
  registrationOption?: RegistrationOption;
  existingWebsiteUrl?: string;
  createAsPending?: boolean;
  fullName: string;
  businessName: string;
  email?: string;
  phone: string;
  password?: string;
  gstNumber?: string;
  shopName?: string;
  shopAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  openingHours?: string;
  pickupAddress?: string;
  commissionMode?: CommissionMode;
  commissionRate?: number;
  fixedCommission?: number;
  platformFeePct?: number;
  notes?: string;
}): Promise<{
  vendor: VendorProfile;
  initialCredentials: {
    vendorCode: string;
    email: string;
    temporaryPassword: string;
    secureLoginLink?: string;
  };
}> {
  const res = await fetch('/api/admin/vendors', {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJsonSafe(res);
}

export async function adminUpdateVendor(
  vendorId: string,
  payload: Partial<VendorProfile> & { shopProfile?: Record<string, any> }
): Promise<VendorProfile> {
  const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}`, {
    method: 'PATCH',
    headers: await getAdminHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe<{ vendor: VendorProfile }>(res);
  return data.vendor;
}

export async function adminChangeVendorStatus(
  vendorId: string,
  status: VendorAccountStatus
): Promise<VendorProfile> {
  const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}/status`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await parseJsonSafe<{ vendor: VendorProfile }>(res);
  return data.vendor;
}

export async function adminResetVendorPassword(
  vendorId: string,
  newPassword?: string
): Promise<{ vendorCode: string; email: string; temporaryPassword: string }> {
  const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}/reset-password`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ newPassword }),
  });
  return parseJsonSafe(res);
}

export async function adminDeleteVendor(
  vendorId: string
): Promise<{ retentionArchived: boolean; message: string }> {
  const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}`, {
    method: 'DELETE',
    headers: await getAdminHeaders(),
  });
  return parseJsonSafe(res);
}

export async function adminGetVendorOverview(vendorId: string): Promise<{
  vendor: VendorProfile;
  products: VendorProduct[];
  orders: VendorSubOrder[];
  settlements: VendorSettlement[];
  logs: VendorActivityLog[];
}> {
  const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}/overview`, {
    headers: await getAdminHeaders(),
  });
  return parseJsonSafe(res);
}

export async function adminListVendorProducts(): Promise<VendorProduct[]> {
  const res = await fetch('/api/admin/vendor-products', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ products: VendorProduct[] }>(res);
  return data.products || [];
}

export async function adminApproveVendorProduct(
  productId: string,
  sellingPrice?: number
): Promise<VendorProduct> {
  const res = await fetch(`/api/admin/vendor-products/${encodeURIComponent(productId)}/approve`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify(sellingPrice ? { sellingPrice } : {}),
  });
  const data = await parseJsonSafe<{ product: VendorProduct }>(res);
  return data.product;
}

export async function adminRejectVendorProduct(
  productId: string,
  reason: string
): Promise<VendorProduct> {
  const res = await fetch(`/api/admin/vendor-products/${encodeURIComponent(productId)}/reject`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await parseJsonSafe<{ product: VendorProduct }>(res);
  return data.product;
}

export async function adminUpdateVendorProductStatus(
  productId: string,
  approvalStatus: VendorProductApprovalStatus
): Promise<VendorProduct> {
  const res = await fetch(`/api/admin/vendor-products/${encodeURIComponent(productId)}/status`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ approvalStatus }),
  });
  const data = await parseJsonSafe<{ product: VendorProduct }>(res);
  return data.product;
}

export async function adminListCommissions(): Promise<VendorCommissionRule[]> {
  const res = await fetch('/api/admin/commissions', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ rules: VendorCommissionRule[] }>(res);
  return data.rules || [];
}

export async function adminSaveCommissionRule(payload: {
  scope: 'global' | 'vendor' | 'product';
  vendorId?: string;
  vendorProductId?: string;
  commissionMode: CommissionMode;
  percentageRate: number;
  fixedAmount: number;
  platformFeePct: number;
  notes?: string;
}): Promise<VendorCommissionRule> {
  const res = await fetch('/api/admin/commissions', {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe<{ rule: VendorCommissionRule }>(res);
  return data.rule;
}

export async function adminDeleteCommissionRule(ruleId: string): Promise<void> {
  const res = await fetch(`/api/admin/commissions/${encodeURIComponent(ruleId)}`, {
    method: 'DELETE',
    headers: await getAdminHeaders(),
  });
  await parseJsonSafe(res);
}

export async function adminListVendorOrders(): Promise<VendorSubOrder[]> {
  const res = await fetch('/api/admin/vendor-orders', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ orders: VendorSubOrder[] }>(res);
  return data.orders || [];
}

export async function adminListSettlements(): Promise<VendorSettlement[]> {
  const res = await fetch('/api/admin/settlements', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ settlements: VendorSettlement[] }>(res);
  return data.settlements || [];
}

export async function adminMarkSettlementPaid(
  settlementId: string,
  paymentReference: string,
  notes?: string
): Promise<VendorSettlement> {
  const res = await fetch(`/api/admin/settlements/${encodeURIComponent(settlementId)}/mark-settled`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ paymentReference, notes }),
  });
  const data = await parseJsonSafe<{ settlement: VendorSettlement }>(res);
  return data.settlement;
}

export async function adminListVendorLogs(): Promise<VendorActivityLog[]> {
  const res = await fetch('/api/admin/vendor-logs', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ logs: VendorActivityLog[] }>(res);
  return data.logs || [];
}

export async function adminGetPartnersOverview(): Promise<PartnersAdminOverviewCounts> {
  const res = await fetch('/api/admin/partners/overview', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ counts: PartnersAdminOverviewCounts }>(res);
  return data.counts;
}

export async function adminListNotifications(): Promise<PartnerNotification[]> {
  const res = await fetch('/api/admin/notifications', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ notifications: PartnerNotification[] }>(res);
  return data.notifications || [];
}

export async function adminMarkNotificationsRead(): Promise<void> {
  const res = await fetch('/api/admin/notifications/read-all', {
    method: 'POST',
    headers: await getAdminHeaders(),
  });
  await parseJsonSafe(res);
}

export async function adminListRegistrationLinks(): Promise<PartnerRegistrationLink[]> {
  const res = await fetch('/api/admin/registration-links', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ links: PartnerRegistrationLink[] }>(res);
  return data.links || [];
}

export async function adminCreateRegistrationLink(payload: {
  partnerCategory?: PartnerCategory | 'ANY';
  registrationOption?: RegistrationOption | 'BOTH';
  intendedBusinessName?: string;
  expiresInHours?: number;
  maxUses?: number;
}): Promise<{
  link: PartnerRegistrationLink;
  rawToken: string;
  registrationPath: string;
}> {
  const res = await fetch('/api/admin/registration-links', {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJsonSafe(res);
}

export async function adminRevokeRegistrationLink(linkId: string): Promise<PartnerRegistrationLink> {
  const res = await fetch(`/api/admin/registration-links/${encodeURIComponent(linkId)}/revoke`, {
    method: 'POST',
    headers: await getAdminHeaders(),
  });
  const data = await parseJsonSafe<{ link: PartnerRegistrationLink }>(res);
  return data.link;
}

export async function adminApprovePartner(
  vendorId: string
): Promise<{ vendor: VendorProfile; secureLoginLink?: string }> {
  const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}/approve`, {
    method: 'POST',
    headers: await getAdminHeaders(),
  });
  return parseJsonSafe(res);
}

export async function adminRejectPartner(vendorId: string, reason: string): Promise<VendorProfile> {
  const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}/reject`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await parseJsonSafe<{ vendor: VendorProfile }>(res);
  return data.vendor;
}

export async function adminRequestMoreInfo(vendorId: string, message: string): Promise<VendorProfile> {
  const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}/request-info`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ message }),
  });
  const data = await parseJsonSafe<{ vendor: VendorProfile }>(res);
  return data.vendor;
}

export async function adminListStaffAccounts(): Promise<PartnerStaffAccount[]> {
  const res = await fetch('/api/admin/staff-accounts', { headers: await getAdminHeaders() });
  const data = await parseJsonSafe<{ staffAccounts: PartnerStaffAccount[] }>(res);
  return data.staffAccounts || [];
}

export async function adminCreateStaffAccount(payload: {
  vendorId: string;
  staffLabel?: string;
  password?: string;
}): Promise<{
  staffAccount: PartnerStaffAccount;
  staffAccessPath: string;
  temporaryPassword: string;
}> {
  const res = await fetch('/api/admin/staff-accounts', {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJsonSafe(res);
}

export async function adminChangeStaffStatus(
  staffId: string,
  status: 'active' | 'inactive'
): Promise<PartnerStaffAccount> {
  const res = await fetch(`/api/admin/staff-accounts/${encodeURIComponent(staffId)}/status`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await parseJsonSafe<{ staffAccount: PartnerStaffAccount }>(res);
  return data.staffAccount;
}

export async function adminResetStaffPassword(
  staffId: string,
  newPassword?: string
): Promise<{
  staffCode: string;
  shopName: string;
  temporaryPassword: string;
  staffAccessPath: string;
}> {
  const res = await fetch(`/api/admin/staff-accounts/${encodeURIComponent(staffId)}/reset-password`, {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ newPassword }),
  });
  return parseJsonSafe(res);
}

export async function adminDeleteStaffAccount(staffId: string): Promise<void> {
  const res = await fetch(`/api/admin/staff-accounts/${encodeURIComponent(staffId)}`, {
    method: 'DELETE',
    headers: await getAdminHeaders(),
  });
  await parseJsonSafe(res);
}
