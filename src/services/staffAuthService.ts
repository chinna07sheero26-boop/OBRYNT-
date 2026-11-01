/**
 * OBRYNT Staff Authentication Service
 * 
 * Provides client-side interfacing for secure server-side staff validation.
 * 
 * SECURITY MANDATE:
 * - NO access code is stored or validated in this frontend code.
 * - Validation is delegated exclusively to the protected backend (/api/staff/validate-code).
 * - Issues cryptographically signed HMAC bearer tokens upon server approval.
 * - Enforces role separation: Staff credentials ONLY grant operational permissions.
 *   Staff CANNOT access Owner/Admin functions (Financials, Settings, Schemas, Security Audit).
 */

export interface StaffSession {
  staffId: string;
  role: 'staff';
  permissions: string[];
  token: string;
  expiresAt: number;
  authenticatedAt: string;
}

export interface StaffAuthResult {
  success: boolean;
  session?: StaffSession;
  error?: string;
  isLocked?: boolean;
  lockRemainingSec?: number;
  isServerConfigMissing?: boolean;
}

export interface ServerSecurityStatus {
  available: boolean;
  isLocked: boolean;
  lockRemainingSec: number;
}

const STORAGE_KEY = 'obrynt_staff_session_v1';

/**
 * Check if the backend validation server is active and reachable
 */
export async function checkStaffServerStatus(): Promise<ServerSecurityStatus> {
  try {
    const res = await fetch('/api/staff/status', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        available: true,
        isLocked: Boolean(data.isLocked),
        lockRemainingSec: data.lockRemainingSec || 0,
      };
    }
    return { available: false, isLocked: false, lockRemainingSec: 0 };
  } catch {
    return { available: false, isLocked: false, lockRemainingSec: 0 };
  }
}

/**
 * Validate Staff Access Code via protected server endpoint
 * Strictly requires backend validation — never performs frontend code matching.
 */
export async function validateStaffAccessCode(inputCode: string): Promise<StaffAuthResult> {
  const trimmed = inputCode.trim();
  if (!trimmed) {
    return { success: false, error: 'Staff access code is required.' };
  }

  // Endpoints to attempt: primary Express API, fallback to Vercel Serverless Function
  const endpoints = ['/api/staff/validate-code', '/api/staff-validate'];
  let lastError = '';
  let serverResponded = false;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ code: trimmed }),
      });

      // 404 means route is not mounted on this specific path, try next
      if (response.status === 404) {
        continue;
      }

      serverResponded = true;
      const data = await response.json().catch(() => ({}));

      if (response.status === 429) {
        return {
          success: false,
          error: data.error || 'Too many failed attempts. Temporary security lockout active.',
          isLocked: true,
          lockRemainingSec: data.lockRemainingSec || 900,
        };
      }

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid staff access code. Access rejected.',
          isLocked: Boolean(data.isLocked),
          lockRemainingSec: data.lockRemainingSec || 0,
        };
      }

      // Success: Save signed token and permissions
      const session: StaffSession = {
        staffId: data.staffId || `staff_${Date.now()}`,
        role: 'staff',
        permissions: data.permissions || [
          'fulfillment:view',
          'orders:update_status',
          'inventory:view',
          'inventory:adjust_stock',
        ],
        token: data.token,
        expiresAt: data.expiresAt || Date.now() + 8 * 60 * 60 * 1000,
        authenticatedAt: new Date().toISOString(),
      };

      saveStaffSession(session);
      return { success: true, session };
    } catch (err: any) {
      lastError = err?.message || 'Network error.';
    }
  }

  // If server endpoints were not reachable
  if (!serverResponded) {
    return {
      success: false,
      isServerConfigMissing: true,
      error:
        'Secure Server Validation Unavailable: The backend endpoint (/api/staff/validate-code) is not reachable. Per security policy, the staff access code cannot be checked on the frontend to avoid code exposure. Ensure server.ts is running with STAFF_ACCESS_CODE configured.',
    };
  }

  return {
    success: false,
    error: lastError || 'Authentication failed. Please try again.',
  };
}

/**
 * Save staff session
 */
export function saveStaffSession(session: StaffSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem('obrynt_staff_active', 'true');
  } catch (e) {
    console.warn('Failed to store staff session:', e);
  }
}

/**
 * Retrieve active staff session
 */
export function getStaffSession(): StaffSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session: StaffSession = JSON.parse(raw);

    if (Date.now() > session.expiresAt) {
      clearStaffSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Check if a valid staff session is active
 */
export function isStaffAuthenticated(): boolean {
  return Boolean(getStaffSession());
}

/**
 * Clear staff session (Log out)
 */
export function clearStaffSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('obrynt_staff_active');
  } catch {}
}
