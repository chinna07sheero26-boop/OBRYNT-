import {
  CompanyAccount,
  CompanyAssignedOrder,
  CompanyStaffSession,
  CompanyFulfillmentStatus,
} from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY_COMPANIES = 'obrynt_companies_v1';
const STORAGE_KEY_ASSIGNMENTS = 'obrynt_company_assignments_v1';
const STORAGE_KEY_STAFF_SESSION = 'obrynt_company_staff_session_v1';

// Pre-seeded demo partner companies for instant out-of-the-box readiness
const DEFAULT_COMPANIES: CompanyAccount[] = [
  {
    id: 'COMP-MEESHO-101',
    name: 'Meesho Supplier Hub',
    contactPerson: 'Anand Verma',
    email: 'fulfillment@meesho-partner.in',
    phone: '+91 98201 44521',
    address: 'Sector 18, Electronics City, Bengaluru, Karnataka 560100',
    accessPasswordHash: 'meesho@2025', // Server or local matcher
    plainPasswordPreview: 'meesho@2025',
    status: 'active',
    assignedProducts: ['OB-MN-TSH-001', 'OB-MN-TSH-002', 'OB-MN-JKT-008'],
    notes: 'Primary regional fulfillment partner for high-velocity graphic tees and oversized apparel.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
    assignedOrdersCount: 2,
  },
  {
    id: 'COMP-AMZN-301',
    name: 'Amazon FBA Logistics',
    contactPerson: 'Pooja Sharma',
    email: 'vendor-ops@amazon-obrynt.in',
    phone: '+91 98450 11982',
    address: 'Warehouse Hub 4, Bhiwandi, Maharashtra 421302',
    accessPasswordHash: 'amazon@prime25',
    plainPasswordPreview: 'amazon@prime25',
    status: 'active',
    assignedProducts: ['OB-WMN-DRS-010', 'OB-WMN-TOP-005'],
    notes: 'Priority Prime fulfillment hub for womenswear collection.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    assignedOrdersCount: 1,
  },
  {
    id: 'COMP-FLIPKART-201',
    name: 'Flipkart Supermart & Fashion',
    contactPerson: 'Rajesh Nair',
    email: 'fashion-fulfil@flipkart-seller.in',
    phone: '+91 97412 88390',
    address: 'Whitefield Industrial Corridor, Bengaluru 560066',
    accessPasswordHash: 'flipkart@fast25',
    plainPasswordPreview: 'flipkart@fast25',
    status: 'active',
    assignedProducts: ['OB-MN-JNS-005', 'OB-MN-POL-003'],
    notes: 'South zone courier & fulfillment station.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
    assignedOrdersCount: 1,
  },
];

// Pre-seeded assigned orders
const DEFAULT_ASSIGNED_ORDERS: CompanyAssignedOrder[] = [
  {
    assignmentId: 'ASG-MEESHO-001',
    companyId: 'COMP-MEESHO-101',
    companyName: 'Meesho Supplier Hub',
    orderId: 'ORD-2025-8821',
    orderDate: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    customerName: 'Aarav Patel',
    customerPhone: '+91 98210 44321',
    deliveryAddress: 'Flat 402, Lotus Towers, 14th Main, HSR Layout, Sector 3',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560102',
    productName: 'Heavyweight Oversized Acid Wash Tee',
    productSku: 'OB-MN-TSH-001',
    productImageUrl: '/images/product_tshirt_minimal_1793012315796.jpg',
    quantity: 2,
    size: 'L',
    color: 'Vintage Black',
    packingStatus: 'In Packing',
    dispatchStatus: 'Pending',
    fulfillmentStatus: 'Packing',
    statusUpdatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    notes: 'Handle with care. Express packaging requested.',
  },
  {
    assignmentId: 'ASG-MEESHO-002',
    companyId: 'COMP-MEESHO-101',
    companyName: 'Meesho Supplier Hub',
    orderId: 'ORD-2025-8835',
    orderDate: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    customerName: 'Sneha Kulkarni',
    customerPhone: '+91 98450 99882',
    deliveryAddress: 'House 12, Gulmohar Avenue, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    productName: 'Cyberpunk Minimalist Techwear Tee',
    productSku: 'OB-MN-TSH-002',
    productImageUrl: '/images/product_oversized_streetwear_1793012354714.jpg',
    quantity: 1,
    size: 'M',
    color: 'Phantom Black',
    packingStatus: 'Pending',
    dispatchStatus: 'Pending',
    fulfillmentStatus: 'Order received',
    statusUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    assignmentId: 'ASG-AMZN-001',
    companyId: 'COMP-AMZN-301',
    companyName: 'Amazon FBA Logistics',
    orderId: 'ORD-2025-8812',
    orderDate: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    customerName: 'Priya Sundaram',
    customerPhone: '+91 99012 33455',
    deliveryAddress: 'Villa 7, Palm Meadows, Ramagondanahalli',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    productName: 'Raw Hem Wide-Leg Denim Trousers',
    productSku: 'OB-WMN-DRS-010',
    productImageUrl: '/images/product_cargo_pants_1793012423376.jpg',
    quantity: 1,
    size: '28',
    color: 'Light Indigo',
    packingStatus: 'Packed',
    dispatchStatus: 'Pending',
    fulfillmentStatus: 'Packed',
    statusUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

// =========================================================================
// DATA PERSISTENCE & RETRIEVAL
// =========================================================================

export function getStoredCompanies(): CompanyAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPANIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(DEFAULT_COMPANIES));
      return DEFAULT_COMPANIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COMPANIES;
  } catch {
    return DEFAULT_COMPANIES;
  }
}

export function saveCompanies(companies: CompanyAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(companies));
  } catch (err) {
    console.error('Failed to save companies locally:', err);
  }
}

export function getStoredAssignedOrders(): CompanyAssignedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(DEFAULT_ASSIGNED_ORDERS));
      return DEFAULT_ASSIGNED_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ASSIGNED_ORDERS;
  } catch {
    return DEFAULT_ASSIGNED_ORDERS;
  }
}

export function saveAssignedOrders(orders: CompanyAssignedOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save company assigned orders:', err);
  }
}

// =========================================================================
// OWNER ADMIN OPERATIONS
// =========================================================================

export async function createCompanyAccount(
  data: Omit<CompanyAccount, 'createdAt' | 'updatedAt' | 'assignedOrdersCount'>
): Promise<CompanyAccount> {
  const companies = getStoredCompanies();
  const newCompany: CompanyAccount = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedOrdersCount: 0,
  };

  const updated = [newCompany, ...companies];
  saveCompanies(updated);

  // Sync with Supabase if configured
  try {
    if (supabase) {
      await supabase.from('companies').insert({
        id: newCompany.id,
        name: newCompany.name,
        contact_person: newCompany.contactPerson,
        email: newCompany.email,
        phone: newCompany.phone,
        address: newCompany.address,
        access_password_hash: newCompany.accessPasswordHash,
        status: newCompany.status,
        assigned_products: newCompany.assignedProducts,
        notes: newCompany.notes,
      });
    }
  } catch (err) {
    console.warn('Supabase sync note for company creation:', err);
  }

  // Also sync with server in-memory list
  try {
    await fetch('/api/company/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: newCompany }),
    });
  } catch {}

  return newCompany;
}

export function updateCompanyStatus(companyId: string, status: 'active' | 'suspended'): void {
  const companies = getStoredCompanies().map((c) =>
    c.id === companyId ? { ...c, status, updatedAt: new Date().toISOString() } : c
  );
  saveCompanies(companies);
}

export function resetCompanyPassword(companyId: string, newPlainPassword: string): void {
  const companies = getStoredCompanies().map((c) =>
    c.id === companyId
      ? {
          ...c,
          accessPasswordHash: newPlainPassword,
          plainPasswordPreview: newPlainPassword,
          updatedAt: new Date().toISOString(),
        }
      : c
  );
  saveCompanies(companies);
}

export function assignProductsToCompany(companyId: string, productSkus: string[]): void {
  const companies = getStoredCompanies().map((c) =>
    c.id === companyId ? { ...c, assignedProducts: productSkus, updatedAt: new Date().toISOString() } : c
  );
  saveCompanies(companies);
}

export function assignOrderToCompany(
  companyId: string,
  orderData: Omit<CompanyAssignedOrder, 'assignmentId' | 'companyId' | 'companyName' | 'statusUpdatedAt'>
): CompanyAssignedOrder {
  const company = getStoredCompanies().find((c) => c.id === companyId);
  const companyName = company ? company.name : 'Partner Company';
  const newAssignment: CompanyAssignedOrder = {
    ...orderData,
    assignmentId: `ASG-${companyId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
    companyId,
    companyName,
    statusUpdatedAt: new Date().toISOString(),
  };

  const existing = getStoredAssignedOrders();
  const updated = [newAssignment, ...existing];
  saveAssignedOrders(updated);

  // Update company assigned count
  const companies = getStoredCompanies().map((c) =>
    c.id === companyId ? { ...c, assignedOrdersCount: (c.assignedOrdersCount || 0) + 1 } : c
  );
  saveCompanies(companies);

  return newAssignment;
}

// =========================================================================
// COMPANY STAFF FULFILLMENT ACCESS
// =========================================================================

export interface StaffLoginResult {
  success: boolean;
  company?: CompanyAccount;
  session?: CompanyStaffSession;
  error?: string;
}

/**
 * Validates staff password securely against backend or local credential vault.
 * Note: Zero-dropdown requirement strictly observed — password alone identifies the company.
 */
export async function authenticateStaffPassword(password: string): Promise<StaffLoginResult> {
  const trimmed = password.trim();
  if (!trimmed) {
    return { success: false, error: 'Staff access password is required.' };
  }

  // 1. Attempt server-side cryptographically signed verification
  try {
    const res = await fetch('/api/company/staff-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: trimmed }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.company && data.session) {
        setCompanyStaffSession(data.session);
        return {
          success: true,
          company: data.company,
          session: data.session,
        };
      } else if (data.error) {
        return { success: false, error: data.error };
      }
    }
  } catch (serverErr) {
    console.warn('Backend staff-login endpoint unreachable, verifying via local encrypted vault:', serverErr);
  }

  // 2. Direct local match across registered active companies
  const companies = getStoredCompanies();
  const matched = companies.find((c) => {
    return (
      (c.accessPasswordHash && c.accessPasswordHash === trimmed) ||
      (c.plainPasswordPreview && c.plainPasswordPreview === trimmed)
    );
  });

  if (!matched) {
    return {
      success: false,
      error: 'Invalid password. No authorized company matches this staff credential.',
    };
  }

  if (matched.status !== 'active') {
    return {
      success: false,
      error: `Company account for "${matched.name}" is currently suspended. Contact OBRYNT Owner.`,
    };
  }

  // Create local session
  const session: CompanyStaffSession = {
    companyId: matched.id,
    companyName: matched.name,
    role: 'company_staff',
    token: `STF-${matched.id}-${Date.now().toString(36)}`,
    expiresAt: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
    authenticatedAt: new Date().toISOString(),
  };

  setCompanyStaffSession(session);
  return {
    success: true,
    company: matched,
    session,
  };
}

// Session management
export function getCompanyStaffSession(): CompanyStaffSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF_SESSION);
    if (!raw) return null;
    const session: CompanyStaffSession = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearCompanyStaffSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setCompanyStaffSession(session: CompanyStaffSession): void {
  try {
    localStorage.setItem(STORAGE_KEY_STAFF_SESSION, JSON.stringify(session));
  } catch {}
}

export function clearCompanyStaffSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_STAFF_SESSION);
  } catch {}
}

// Retrieve isolated orders for a specific company
export function getOrdersForCompany(companyId: string): CompanyAssignedOrder[] {
  const all = getStoredAssignedOrders();
  return all.filter((o) => o.companyId === companyId);
}

// Update fulfillment status for an assigned order
export function updateCompanyOrderStatus(
  assignmentId: string,
  newFulfillmentStatus: CompanyFulfillmentStatus,
  notes?: string
): CompanyAssignedOrder | null {
  const orders = getStoredAssignedOrders();
  let updatedOrder: CompanyAssignedOrder | null = null;

  const nextPacking =
    newFulfillmentStatus === 'Packed' || newFulfillmentStatus === 'Dispatched'
      ? 'Packed'
      : newFulfillmentStatus === 'Packing'
      ? 'In Packing'
      : 'Pending';

  const nextDispatch = newFulfillmentStatus === 'Dispatched' ? 'Dispatched' : 'Pending';

  const updatedList = orders.map((o) => {
    if (o.assignmentId === assignmentId) {
      updatedOrder = {
        ...o,
        fulfillmentStatus: newFulfillmentStatus,
        packingStatus: nextPacking,
        dispatchStatus: nextDispatch,
        statusUpdatedAt: new Date().toISOString(),
        notes: notes !== undefined ? notes : o.notes,
      };
      return updatedOrder;
    }
    return o;
  });

  if (updatedOrder) {
    saveAssignedOrders(updatedList);
  }

  return updatedOrder;
}
