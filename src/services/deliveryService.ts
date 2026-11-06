import {
  DeliveryCompany,
  DeliveryAssignment,
  DeliveryOrderSnapshot,
  DeliveryActivityLog,
  DeliverySession,
  OrderDetails,
} from '../types';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEYS = {
  COMPANIES: 'obrynt_delivery_companies',
  ASSIGNMENTS: 'obrynt_delivery_assignments',
  LOGS: 'obrynt_delivery_activity_logs',
  SESSION: 'obrynt_delivery_session',
};

// Initial Verified Delivery Partners
export const INITIAL_DELIVERY_COMPANIES: DeliveryCompany[] = [
  {
    id: 'del-company-bluedart',
    companyName: 'Blue Dart Express (Surface & Air)',
    authorizedEmail: 'dispatch@bluedart-express.in',
    contactNumber: '+91 98200 12345',
    contactPerson: 'Karan Mehra (Hub Operations)',
    accessCode: 'DEL-BLUEDART-8891',
    status: 'active',
    permissions: {
      canViewCustomerPhone: true,
      canViewAddress: true,
      canUpdateStatus: true,
    },
    notes: 'Primary courier partner for Metros and Express Air shipments.',
    createdAt: '2026-10-25T10:00:00Z',
    lastActiveAt: '2026-11-05T18:30:00Z',
    assignedOrdersCount: 2,
  },
  {
    id: 'del-company-delhivery',
    companyName: 'Delhivery Surface Logistics',
    authorizedEmail: 'ops.support@delhivery-logistics.com',
    contactNumber: '+91 99100 67890',
    contactPerson: 'Sandeep Rao (Dispatch Incharge)',
    accessCode: 'DEL-DELHIVERY-4420',
    status: 'active',
    permissions: {
      canViewCustomerPhone: true,
      canViewAddress: true,
      canUpdateStatus: true,
    },
    notes: 'Handles pan-India Tier-2 & Tier-3 PIN codes and COD collections.',
    createdAt: '2026-10-28T11:30:00Z',
    lastActiveAt: '2026-11-05T14:15:00Z',
    assignedOrdersCount: 1,
  },
  {
    id: 'del-company-shadowfax',
    companyName: 'Shadowfax Hyperlocal Fleet',
    authorizedEmail: 'riders@shadowfax-network.in',
    contactNumber: '+91 98450 33445',
    contactPerson: 'Vikram Joshi (City Fleet Lead)',
    accessCode: 'DEL-SHADOWFAX-2099',
    status: 'active',
    permissions: {
      canViewCustomerPhone: true,
      canViewAddress: true,
      canUpdateStatus: true,
    },
    notes: 'Same-day and next-day intra-city delivery fleet.',
    createdAt: '2026-10-30T09:00:00Z',
    lastActiveAt: '2026-11-04T12:00:00Z',
    assignedOrdersCount: 0,
  },
];

// Initial sample assignments for verification (Strictly separated into PREPAID and COD sample orders)
export const INITIAL_DELIVERY_ASSIGNMENTS: DeliveryAssignment[] = [
  {
    id: 'asgn-001',
    orderId: 'OB-982142',
    companyId: 'del-company-bluedart',
    companyName: 'Blue Dart Express (Surface & Air)',
    assignedAt: '2026-11-01T12:00:00Z',
    status: 'in_transit',
    copiedAt: '2026-11-01T14:10:00Z',
    copiedBy: 'dispatch@bluedart-express.in',
    trackingNumber: 'BD-AIR-992144',
    courierPartner: 'Blue Dart Express',
    notes: 'Handed over at Bengaluru Central Fulfillment Hub.',
    orderSnapshot: {
      orderId: 'OB-982142',
      date: '31 Oct 2026',
      customerName: 'Aarav Patel',
      customerPhone: '+91 9876543210',
      address: '42, Boulevard Towers, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      isCod: false,
      paymentMethodType: 'PREPAID',
      // Strict privacy: no prices or costs!
    },
  },
  {
    id: 'asgn-002',
    orderId: 'SAMPLE-COD-7712',
    companyId: 'del-company-bluedart',
    companyName: 'Blue Dart Express (Surface & Air)',
    assignedAt: '2026-11-04T10:15:00Z',
    status: 'assigned',
    notes: 'Sample Cash on Delivery order for dispatch verification.',
    orderSnapshot: {
      orderId: 'SAMPLE-COD-7712',
      date: '04 Nov 2026',
      customerName: 'Neha Verma',
      customerPhone: '+91 9822334455',
      address: 'House No. 18, 5th Main, Sector 4, HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
      isCod: true,
      paymentMethodType: 'CASH ON DELIVERY',
      codAmountToCollect: 1599, // Amount to collect only
    },
  },
  {
    id: 'asgn-003',
    orderId: 'SAMPLE-PREPAID-9031',
    companyId: 'del-company-delhivery',
    companyName: 'Delhivery Surface Logistics',
    assignedAt: '2026-11-05T08:30:00Z',
    status: 'assigned',
    notes: 'Sample Prepaid order for pan-India courier routing.',
    orderSnapshot: {
      orderId: 'SAMPLE-PREPAID-9031',
      date: '05 Nov 2026',
      customerName: 'Rohan Deshmukh',
      customerPhone: '+91 9765432190',
      address: 'Plot 88, Sunrise Enclave, Koregaon Park',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      isCod: false,
      paymentMethodType: 'PREPAID',
    },
  },
];

// Initial Audit Logs
export const INITIAL_DELIVERY_LOGS: DeliveryActivityLog[] = [
  {
    id: 'log-001',
    action: 'created_company',
    details: 'Admin registered Blue Dart Express (Surface & Air) with access code.',
    timestamp: '2026-10-25T10:00:00Z',
    actor: 'admin',
    companyName: 'Blue Dart Express (Surface & Air)',
  },
  {
    id: 'log-002',
    action: 'order_assigned',
    details: 'Assigned Order OB-982142 (PREPAID) to Blue Dart Express.',
    timestamp: '2026-11-01T12:00:00Z',
    actor: 'admin',
    orderId: 'OB-982142',
    companyName: 'Blue Dart Express (Surface & Air)',
  },
  {
    id: 'log-003',
    action: 'details_copied',
    details: 'Blue Dart dispatch team copied complete delivery details for OB-982142.',
    timestamp: '2026-11-01T14:10:00Z',
    actor: 'delivery_agent',
    orderId: 'OB-982142',
    companyName: 'Blue Dart Express (Surface & Air)',
  },
];

// =========================================================================
// ORDER PRIVACY SANITIZER (STRICT PAYMENT PRIVACY RULES)
// =========================================================================

/**
 * Sanitizes customer orders for delivery company consumption:
 * - PREPAID: Strips product prices, order totals, profits, costs, and payment references.
 * - COD: Provides ONLY the exact collection amount labeled as AMOUNT TO COLLECT.
 */
export function sanitizeOrderForDelivery(order: OrderDetails): DeliveryOrderSnapshot {
  const method = (order.paymentMethod || '').toLowerCase();
  const status = (order.paymentStatus || '').toLowerCase();

  const isCod =
    method.includes('cod') ||
    method.includes('cash on delivery') ||
    status === 'cod_pending' ||
    status === 'cod_remitted';

  return {
    orderId: order.orderId,
    date: order.date,
    customerName: order.customer.fullName,
    customerPhone: order.customer.phone,
    address: order.customer.address,
    city: order.customer.city,
    state: order.customer.state,
    pincode: order.customer.pincode,
    isCod,
    paymentMethodType: isCod ? 'CASH ON DELIVERY' : 'PREPAID',
    // Strictly populated ONLY if COD
    codAmountToCollect: isCod ? Number(order.total) : undefined,
  };
}

// =========================================================================
// TEXT FORMATTERS FOR COURIER COPY BUTTONS
// =========================================================================

/**
 * Format complete permitted delivery details suitable for pasting into courier apps:
 * (Delhivery, BlueDart, Shadowfax, Shiprocket, Porter, etc.)
 */
export function formatCompleteDeliveryDetails(
  snapshot: DeliveryOrderSnapshot,
  trackingOrNotes?: string
): string {
  const lines: string[] = [];
  lines.push('========================================');
  lines.push('OBRYNT DISPATCH — DELIVERY DETAILS');
  lines.push('========================================');
  lines.push(`Order ID: ${snapshot.orderId}`);
  lines.push(`Customer Name: ${snapshot.customerName}`);
  lines.push(`Mobile Number: ${snapshot.customerPhone}`);
  lines.push(`Delivery Address: ${snapshot.address}`);
  lines.push(`City & State: ${snapshot.city}, ${snapshot.state}`);
  lines.push(`PIN Code: ${snapshot.pincode}`);
  lines.push('----------------------------------------');

  if (snapshot.isCod) {
    lines.push('Payment Mode: CASH ON DELIVERY');
    lines.push(`AMOUNT TO COLLECT: ₹${snapshot.codAmountToCollect?.toLocaleString('en-IN')}`);
    lines.push('IMPORTANT: Collect exact cash from customer before handing parcel.');
  } else {
    lines.push('Payment Mode: PREPAID');
    lines.push('AMOUNT TO COLLECT: ₹0 (PREPAID — DO NOT COLLECT CASH)');
    lines.push('Zero payment collection required. Handover upon recipient verification.');
  }

  if (trackingOrNotes) {
    lines.push(`Notes: ${trackingOrNotes}`);
  }

  lines.push('========================================');
  return lines.join('\n');
}

// =========================================================================
// STORAGE & CRUD OPERATIONS (DELIVERY COMPANIES)
// =========================================================================

export function getStoredDeliveryCompanies(): DeliveryCompany[] {
  if (typeof window === 'undefined') return INITIAL_DELIVERY_COMPANIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_DELIVERY_COMPANIES));
      return INITIAL_DELIVERY_COMPANIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DELIVERY_COMPANIES;
  } catch {
    return INITIAL_DELIVERY_COMPANIES;
  }
}

export function saveDeliveryCompanies(companies: DeliveryCompany[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  } catch (err) {
    console.error('Failed to save delivery companies to storage:', err);
  }
}

export function addDeliveryCompany(company: Omit<DeliveryCompany, 'id' | 'createdAt'>): DeliveryCompany {
  const companies = getStoredDeliveryCompanies();
  const id = `del-company-${Date.now().toString(36)}`;
  const newCompany: DeliveryCompany = {
    ...company,
    id,
    createdAt: new Date().toISOString(),
    assignedOrdersCount: 0,
  };

  const updated = [newCompany, ...companies];
  saveDeliveryCompanies(updated);

  logDeliveryActivity({
    action: 'created_company',
    details: `Admin added delivery partner "${newCompany.companyName}" (${newCompany.authorizedEmail}).`,
    actor: 'admin',
    companyId: newCompany.id,
    companyName: newCompany.companyName,
  });

  return newCompany;
}

export function updateDeliveryCompanyStatus(
  companyId: string,
  newStatus: 'active' | 'suspended' | 'revoked'
): DeliveryCompany[] {
  const companies = getStoredDeliveryCompanies();
  const updated = companies.map((c) => (c.id === companyId ? { ...c, status: newStatus } : c));
  saveDeliveryCompanies(updated);

  const matched = companies.find((c) => c.id === companyId);
  logDeliveryActivity({
    action: newStatus === 'revoked' ? 'access_revoked' : 'status_changed',
    details: `Delivery company "${matched?.companyName || companyId}" access status changed to ${newStatus.toUpperCase()}.`,
    actor: 'admin',
    companyId,
    companyName: matched?.companyName,
  });

  // If revoked or suspended, clear active session if currently logged in
  const currentSession = getDeliverySession();
  if (currentSession && currentSession.companyId === companyId && newStatus !== 'active') {
    clearDeliverySession();
  }

  return updated;
}

export function deleteDeliveryCompany(companyId: string): DeliveryCompany[] {
  const companies = getStoredDeliveryCompanies();
  const matched = companies.find((c) => c.id === companyId);
  const updated = companies.filter((c) => c.id !== companyId);
  saveDeliveryCompanies(updated);

  logDeliveryActivity({
    action: 'access_revoked',
    details: `Admin deleted delivery partner "${matched?.companyName || companyId}".`,
    actor: 'admin',
    companyId,
    companyName: matched?.companyName,
  });

  return updated;
}

// =========================================================================
// ASSIGNMENT MANAGEMENT
// =========================================================================

export function getDeliveryAssignments(companyId?: string): DeliveryAssignment[] {
  if (typeof window === 'undefined') return INITIAL_DELIVERY_ASSIGNMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    let all: DeliveryAssignment[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_DELIVERY_ASSIGNMENTS));
      all = INITIAL_DELIVERY_ASSIGNMENTS;
    } else {
      const parsed = JSON.parse(raw);
      all = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DELIVERY_ASSIGNMENTS;
    }

    if (companyId) {
      return all.filter((a) => a.companyId === companyId);
    }
    return all;
  } catch {
    return companyId ? INITIAL_DELIVERY_ASSIGNMENTS.filter((a) => a.companyId === companyId) : INITIAL_DELIVERY_ASSIGNMENTS;
  }
}

export function saveDeliveryAssignments(assignments: DeliveryAssignment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  } catch (err) {
    console.error('Failed to save delivery assignments:', err);
  }
}

export function assignOrderToDeliveryCompany(
  order: OrderDetails,
  company: DeliveryCompany,
  notes?: string
): DeliveryAssignment {
  const sanitizedSnapshot = sanitizeOrderForDelivery(order);
  const assignments = getDeliveryAssignments();

  // Remove existing assignment for this order if already assigned
  const existingFiltered = assignments.filter((a) => a.orderId !== order.orderId);

  const newAssignment: DeliveryAssignment = {
    id: `asgn-${Date.now().toString(36)}`,
    orderId: order.orderId,
    companyId: company.id,
    companyName: company.companyName,
    assignedAt: new Date().toISOString(),
    status: 'assigned',
    notes,
    orderSnapshot: sanitizedSnapshot,
  };

  const updated = [newAssignment, ...existingFiltered];
  saveDeliveryAssignments(updated);

  // Update company assigned orders count
  const companies = getStoredDeliveryCompanies();
  const updatedCompanies = companies.map((c) =>
    c.id === company.id ? { ...c, assignedOrdersCount: (c.assignedOrdersCount || 0) + 1 } : c
  );
  saveDeliveryCompanies(updatedCompanies);

  logDeliveryActivity({
    action: 'order_assigned',
    details: `Assigned Order ${order.orderId} (${sanitizedSnapshot.paymentMethodType}) to ${company.companyName}.`,
    actor: 'admin',
    orderId: order.orderId,
    companyId: company.id,
    companyName: company.companyName,
  });

  return newAssignment;
}

export function removeOrderAssignment(assignmentId: string): DeliveryAssignment[] {
  const assignments = getDeliveryAssignments();
  const matched = assignments.find((a) => a.id === assignmentId);
  const updated = assignments.filter((a) => a.id !== assignmentId);
  saveDeliveryAssignments(updated);

  if (matched) {
    logDeliveryActivity({
      action: 'order_assigned',
      details: `Admin unassigned Order ${matched.orderId} from ${matched.companyName}.`,
      actor: 'admin',
      orderId: matched.orderId,
      companyId: matched.companyId,
      companyName: matched.companyName,
    });
  }

  return updated;
}

export function recordDeliveryCopyAction(
  assignmentId: string,
  copyField: string,
  companyId?: string,
  companyName?: string
): DeliveryAssignment | null {
  const assignments = getDeliveryAssignments();
  let target: DeliveryAssignment | null = null;

  const updated = assignments.map((a) => {
    if (a.id === assignmentId) {
      const now = new Date().toISOString();
      target = {
        ...a,
        copiedAt: now,
        copiedBy: companyName || a.companyName,
        status: a.status === 'assigned' ? 'copied' : a.status,
      };
      return target;
    }
    return a;
  });

  if (target) {
    saveDeliveryAssignments(updated);
    logDeliveryActivity({
      action: 'details_copied',
      details: `${companyName || (target as DeliveryAssignment).companyName} copied ${copyField} for Order ${(target as DeliveryAssignment).orderId}.`,
      actor: 'delivery_agent',
      orderId: (target as DeliveryAssignment).orderId,
      companyId: companyId || (target as DeliveryAssignment).companyId,
      companyName: companyName || (target as DeliveryAssignment).companyName,
    });
  }

  return target;
}

export function updateDeliveryStatus(
  assignmentId: string,
  newStatus: DeliveryAssignment['status'],
  trackingNumber?: string,
  notes?: string
): DeliveryAssignment | null {
  const assignments = getDeliveryAssignments();
  let target: DeliveryAssignment | null = null;

  const updated = assignments.map((a) => {
    if (a.id === assignmentId) {
      const now = new Date().toISOString();
      target = {
        ...a,
        status: newStatus,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : a.trackingNumber,
        notes: notes !== undefined ? notes : a.notes,
        dispatchedAt: newStatus === 'in_transit' && !a.dispatchedAt ? now : a.dispatchedAt,
        deliveredAt: newStatus === 'delivered' ? now : a.deliveredAt,
      };
      return target;
    }
    return a;
  });

  if (target) {
    saveDeliveryAssignments(updated);
    logDeliveryActivity({
      action: 'delivery_updated',
      details: `Order ${(target as DeliveryAssignment).orderId} delivery status updated to ${newStatus.toUpperCase()}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}.`,
      actor: 'delivery_agent',
      orderId: (target as DeliveryAssignment).orderId,
      companyId: (target as DeliveryAssignment).companyId,
      companyName: (target as DeliveryAssignment).companyName,
    });
  }

  return target;
}

// =========================================================================
// AUDIT LOGGING
// =========================================================================

export function getDeliveryActivityLogs(): DeliveryActivityLog[] {
  if (typeof window === 'undefined') return INITIAL_DELIVERY_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_DELIVERY_LOGS));
      return INITIAL_DELIVERY_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DELIVERY_LOGS;
  } catch {
    return INITIAL_DELIVERY_LOGS;
  }
}

export function logDeliveryActivity(log: Omit<DeliveryActivityLog, 'id' | 'timestamp'>): void {
  try {
    const current = getDeliveryActivityLogs();
    const newLog: DeliveryActivityLog = {
      ...log,
      id: `dlog-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...current].slice(0, 200); // retain last 200 activity entries
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to append delivery activity log:', err);
  }
}

// =========================================================================
// DELIVERY COMPANY AUTHENTICATION & RESTRICTED SESSION MANAGEMENT
// =========================================================================

export function authenticateDeliveryLogin(
  email: string,
  accessCode: string
): { success: boolean; session?: DeliverySession; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = accessCode.trim();

  if (!cleanEmail || !cleanCode) {
    return { success: false, error: 'Please enter both your authorized company email and access code.' };
  }

  const companies = getStoredDeliveryCompanies();
  const matched = companies.find((c) => c.authorizedEmail.toLowerCase() === cleanEmail);

  if (!matched) {
    logDeliveryActivity({
      action: 'login_failed',
      details: `Login attempt rejected: Unknown email "${cleanEmail}".`,
      actor: 'delivery_agent',
    });
    return { success: false, error: 'Invalid delivery company credentials or unauthorized account.' };
  }

  // Security check: Check if access is suspended or revoked
  if (matched.status === 'suspended') {
    logDeliveryActivity({
      action: 'login_failed',
      details: `Login blocked for suspended partner "${matched.companyName}".`,
      actor: 'delivery_agent',
      companyId: matched.id,
      companyName: matched.companyName,
    });
    return {
      success: false,
      error: 'Delivery account is temporarily suspended by OBRYNT Owner. Contact operations.',
    };
  }

  if (matched.status === 'revoked') {
    logDeliveryActivity({
      action: 'login_failed',
      details: `Login blocked for revoked partner "${matched.companyName}".`,
      actor: 'delivery_agent',
      companyId: matched.id,
      companyName: matched.companyName,
    });
    return {
      success: false,
      error: 'Delivery company access has been permanently revoked by OBRYNT Owner.',
    };
  }

  // Verify access code
  if (matched.accessCode !== cleanCode) {
    logDeliveryActivity({
      action: 'login_failed',
      details: `Failed access code attempt for "${matched.companyName}".`,
      actor: 'delivery_agent',
      companyId: matched.id,
      companyName: matched.companyName,
    });
    return { success: false, error: 'Incorrect access code for this delivery partner.' };
  }

  // Generate restricted delivery session (Valid for 12 hours)
  const session: DeliverySession = {
    companyId: matched.id,
    companyName: matched.companyName,
    authorizedEmail: matched.authorizedEmail,
    role: 'delivery',
    token: `del-tok-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
  };

  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch {}

  // Update company's lastActiveAt
  const updatedCompanies = companies.map((c) =>
    c.id === matched.id ? { ...c, lastActiveAt: new Date().toISOString() } : c
  );
  saveDeliveryCompanies(updatedCompanies);

  logDeliveryActivity({
    action: 'login_success',
    details: `Authorized delivery session established for "${matched.companyName}".`,
    actor: 'delivery_agent',
    companyId: matched.id,
    companyName: matched.companyName,
  });

  return { success: true, session };
}

export function getDeliverySession(): DeliverySession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const session: DeliverySession = JSON.parse(raw);
    if (session.expiresAt && session.expiresAt < Date.now()) {
      clearDeliverySession();
      return null;
    }
    // Check if company status is still active
    const companies = getStoredDeliveryCompanies();
    const company = companies.find((c) => c.id === session.companyId);
    if (!company || company.status !== 'active') {
      clearDeliverySession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearDeliverySession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch {}
}

export function isDeliveryAuthenticated(): boolean {
  return Boolean(getDeliverySession());
}
