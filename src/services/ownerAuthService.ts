import { AuthSession, saveActiveSession } from './authService';

/**
 * OBRYNT Owner Authentication Service
 * 
 * Provides client-side interfacing for secure server-side owner validation.
 * 
 * SECURITY MANDATE:
 * - NO password is stored or hardcoded in this frontend file.
 * - Validation is delegated exclusively to the protected backend (/api/owner/validate).
 * - Issues cryptographically signed HMAC bearer tokens upon server approval.
 */

export interface OwnerAuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  isLocked?: boolean;
  lockRemainingSec?: number;
  isServerConfigMissing?: boolean;
}

export interface OwnerServerSecurityStatus {
  available: boolean;
  isLocked: boolean;
  lockRemainingSec: number;
}

/**
 * Check if the owner validation server endpoint is active and reachable
 */
export async function checkOwnerServerStatus(): Promise<OwnerServerSecurityStatus> {
  try {
    const res = await fetch('/api/owner/status', {
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
 * Validate Owner Password via protected server endpoint
 * Strictly requires backend validation — never performs frontend password matching.
 */
export async function validateOwnerServerCredentials(
  email: string,
  passwordInput: string
): Promise<OwnerAuthResult> {
  const trimmedPassword = passwordInput.trim();
  if (!trimmedPassword) {
    return { success: false, error: 'Password is required.' };
  }

  const endpoints = ['/api/owner/validate', '/api/owner-validate'];
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
        body: JSON.stringify({
          email: email.trim(),
          password: trimmedPassword,
        }),
      });

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
          error: data.error || 'Invalid credentials. Access rejected.',
          isLocked: Boolean(data.isLocked),
          lockRemainingSec: data.lockRemainingSec || 0,
        };
      }

      // Success: Build AuthSession
      const sessionData = data.session || {};
      const session: AuthSession = {
        sessionId: sessionData.sessionId || `owner_${Date.now()}`,
        userId: sessionData.userId || `usr_${Date.now().toString(36)}`,
        userEmail: sessionData.userEmail || email.trim(),
        role: 'owner',
        issuedAt: sessionData.issuedAt || Date.now(),
        expiresAt: sessionData.expiresAt || Date.now() + 8 * 60 * 60 * 1000,
        signature: sessionData.signature || 'server_verified',
        serverToken: data.token || undefined,
      };

      saveActiveSession(session);
      return { success: true, session };
    } catch (err: any) {
      lastError = err?.message || 'Network error.';
    }
  }

  if (!serverResponded) {
    return {
      success: false,
      isServerConfigMissing: true,
      error:
        'Secure Server Validation Unavailable: /api/owner/validate is not reachable. Per security policy, the owner password cannot be checked on the frontend to avoid password exposure. Ensure server.ts is running.',
    };
  }

  return {
    success: false,
    error: lastError || 'Authentication failed. Please try again.',
  };
}
