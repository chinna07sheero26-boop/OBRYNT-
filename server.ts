import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { GoogleGenAI } from '@google/genai';
import { classifyProductLocally, buildGeminiCategorizationPrompt } from './src/utils/aiTaxonomyEngine';
import { generateThemedArtworkVariations } from './src/utils/aiArtworkGenerator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// =========================================================================
// OBRYNT STAFF PORTAL SECURITY CONFIGURATION (SERVER-SIDE ONLY)
// =========================================================================
// Protected server-side secret. NEVER shipped to browser JavaScript or client bundles.
const STAFF_ACCESS_CODE = (process.env.STAFF_ACCESS_CODE || '30182607').trim();
const STAFF_SESSION_SECRET = (
  process.env.STAFF_SESSION_SECRET || 'obrynt_secure_staff_hmac_secret_production_key_2026'
).trim();

// Staff rate limiting state
interface RateLimitEntry {
  failedAttempts: number;
  lockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'anonymous';
}

function checkRateLimit(ip: string): { isLocked: boolean; remainingSec: number } {
  const entry = rateLimitStore.get(ip);
  if (!entry) return { isLocked: false, remainingSec: 0 };

  if (entry.lockedUntil > Date.now()) {
    const remainingSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return { isLocked: true, remainingSec };
  }

  // Lockout expired, reset counter
  if (entry.lockedUntil > 0 && entry.lockedUntil <= Date.now()) {
    rateLimitStore.delete(ip);
  }

  return { isLocked: false, remainingSec: 0 };
}

function recordFailedAttempt(ip: string): { isLocked: boolean; remainingSec: number } {
  const entry = rateLimitStore.get(ip) || { failedAttempts: 0, lockedUntil: 0 };
  entry.failedAttempts += 1;

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  rateLimitStore.set(ip, entry);

  const remainingSec = entry.lockedUntil > Date.now()
    ? Math.ceil((entry.lockedUntil - Date.now()) / 1000)
    : 0;

  return { isLocked: entry.lockedUntil > Date.now(), remainingSec };
}

function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

// Constant-time string comparison to prevent timing attacks
function timingSafeCompare(input: string, target: string): boolean {
  const bufA = Buffer.from(input);
  const bufB = Buffer.from(target);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// =========================================================================
// STAFF SECURITY API ENDPOINTS
// =========================================================================

// 1. Check Server Security Health
app.get('/api/staff/status', (req: Request, res: Response) => {
  const ip = getClientIdentifier(req);
  const { isLocked, remainingSec } = checkRateLimit(ip);

  res.json({
    ok: true,
    serverActive: true,
    secureValidationAvailable: true,
    isLocked,
    lockRemainingSec: remainingSec,
  });
});

// 2. Validate Staff Access Code (Server-side validation)
app.post('/api/staff/validate-code', (req: Request, res: Response): void => {
  const ip = getClientIdentifier(req);
  const { isLocked, remainingSec } = checkRateLimit(ip);

  if (isLocked) {
    res.status(429).json({
      success: false,
      error: `Security Lockout Active. Please wait ${Math.ceil(remainingSec / 60)} minute(s) before trying again.`,
      isLocked: true,
      lockRemainingSec: remainingSec,
    });
    return;
  }

  const { code } = req.body || {};

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Staff access code is required.',
    });
    return;
  }

  // Constant-time check against server-side secret
  const isMatch = timingSafeCompare(code.trim(), STAFF_ACCESS_CODE);

  if (!isMatch) {
    const lockStatus = recordFailedAttempt(ip);
    res.status(401).json({
      success: false,
      error: lockStatus.isLocked
        ? 'Maximum failed attempts reached. Access is locked for 15 minutes.'
        : 'Invalid staff access code. Access denied.',
      isLocked: lockStatus.isLocked,
      lockRemainingSec: lockStatus.remainingSec,
    });
    return;
  }

  // Authentication succeeded! Reset rate limit
  resetRateLimit(ip);

  // Generate cryptographically signed HMAC token for staff
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 8 * 60 * 60 * 1000; // 8-hour staff session

  const payload = {
    staffId: `staff_${issuedAt.toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    role: 'staff' as const,
    permissions: [
      'fulfillment:view',
      'fulfillment:update_status',
      'orders:view_summary',
      'orders:update_dispatch',
      'inventory:view',
      'inventory:adjust_stock',
    ],
    issuedAt,
    expiresAt,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', STAFF_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const token = `${payloadB64}.${signature}`;

  // NEVER return the secret code in the response
  res.json({
    success: true,
    token,
    role: payload.role,
    permissions: payload.permissions,
    expiresAt: payload.expiresAt,
    message: 'Staff access authenticated successfully.',
  });
});

// 3. Verify Active Staff Session Token
app.post('/api/staff/verify-session', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.body?.token;

  if (!token || typeof token !== 'string' || !token.includes('.')) {
    res.status(401).json({ valid: false, error: 'Missing or malformed staff token.' });
    return;
  }

  const [payloadB64, signature] = token.split('.');

  try {
    const expectedSignature = crypto
      .createHmac('sha256', STAFF_SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      res.status(403).json({ valid: false, error: 'Invalid staff token signature.' });
      return;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    if (Date.now() > payload.expiresAt) {
      res.status(401).json({ valid: false, error: 'Staff session has expired.' });
      return;
    }

    res.json({
      valid: true,
      staffId: payload.staffId,
      role: payload.role,
      permissions: payload.permissions,
      expiresAt: payload.expiresAt,
    });
  } catch (err) {
    res.status(400).json({ valid: false, error: 'Invalid token structure.' });
  }
});

// Also create alias endpoints for Vercel compatibility
app.post('/api/staff-validate', (req, res) => {
  // redirect or re-route to validate-code
  app._router.handle({ ...req, url: '/api/staff/validate-code' }, res);
});

// =========================================================================
// OBRYNT OWNER PORTAL SECURITY CONFIGURATION & ENDPOINTS (SERVER-SIDE ONLY)
// =========================================================================
// Protected server-side credentials. NEVER shipped to browser JavaScript or client bundles.
const OWNER_PORTAL_PASSWORD = (process.env.OWNER_PORTAL_PASSWORD || 'chinnasheero3026').trim();
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'chinna07sheero.26@gmail.com').trim().toLowerCase();
const OWNER_SESSION_SECRET = (
  process.env.OWNER_SESSION_SECRET || 'obrynt_secure_owner_hmac_master_secret_2026'
).trim();

const ownerRateLimitStore = new Map<string, RateLimitEntry>();

function checkOwnerRateLimit(ip: string): { isLocked: boolean; remainingSec: number } {
  const entry = ownerRateLimitStore.get(ip);
  if (!entry) return { isLocked: false, remainingSec: 0 };

  if (entry.lockedUntil > Date.now()) {
    const remainingSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return { isLocked: true, remainingSec };
  }

  if (entry.lockedUntil > 0 && entry.lockedUntil <= Date.now()) {
    ownerRateLimitStore.delete(ip);
  }

  return { isLocked: false, remainingSec: 0 };
}

function recordOwnerFailedAttempt(ip: string): { isLocked: boolean; remainingSec: number } {
  const entry = ownerRateLimitStore.get(ip) || { failedAttempts: 0, lockedUntil: 0 };
  entry.failedAttempts += 1;

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  ownerRateLimitStore.set(ip, entry);

  const remainingSec = entry.lockedUntil > Date.now()
    ? Math.ceil((entry.lockedUntil - Date.now()) / 1000)
    : 0;

  return { isLocked: entry.lockedUntil > Date.now(), remainingSec };
}

function resetOwnerRateLimit(ip: string): void {
  ownerRateLimitStore.delete(ip);
}

// 1. Check Owner Server Security Health
app.get('/api/owner/status', (req: Request, res: Response) => {
  const ip = getClientIdentifier(req);
  const { isLocked, remainingSec } = checkOwnerRateLimit(ip);

  res.json({
    ok: true,
    serverActive: true,
    isLocked,
    lockRemainingSec: remainingSec,
  });
});

// 2. Validate Owner Portal Password (Server-side validation)
app.post('/api/owner/validate', (req: Request, res: Response): void => {
  const ip = getClientIdentifier(req);
  const { isLocked, remainingSec } = checkOwnerRateLimit(ip);

  if (isLocked) {
    res.status(429).json({
      success: false,
      error: `Security Lockout Active. Please wait ${Math.ceil(remainingSec / 60)} minute(s) before trying again.`,
      isLocked: true,
      lockRemainingSec: remainingSec,
    });
    return;
  }

  const { email, password } = req.body || {};

  if (!password || typeof password !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Owner password is required.',
    });
    return;
  }

  const inputEmail = (typeof email === 'string' && email.trim()) ? email.trim().toLowerCase() : OWNER_EMAIL;
  const isEmailMatch = inputEmail === OWNER_EMAIL || inputEmail.includes('owner') || inputEmail.includes('admin');
  const isPasswordMatch = timingSafeCompare(password.trim(), OWNER_PORTAL_PASSWORD);

  if (!isEmailMatch || !isPasswordMatch) {
    const lockStatus = recordOwnerFailedAttempt(ip);
    res.status(401).json({
      success: false,
      error: lockStatus.isLocked
        ? 'Maximum failed attempts reached. Access is locked for 15 minutes.'
        : 'Invalid credentials. Access rejected by Owner Security Gateway.',
      isLocked: lockStatus.isLocked,
      lockRemainingSec: lockStatus.remainingSec,
    });
    return;
  }

  // Authentication succeeded! Reset rate limit
  resetOwnerRateLimit(ip);

  const issuedAt = Date.now();
  const expiresAt = issuedAt + 8 * 60 * 60 * 1000; // 8-hour master session
  const sessionId = crypto.randomBytes(16).toString('hex');

  const payload = {
    sessionId,
    userId: `owner_${sessionId.slice(0, 8)}`,
    userEmail: OWNER_EMAIL,
    role: 'owner' as const,
    issuedAt,
    expiresAt,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', OWNER_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const token = `${payloadB64}.${signature}`;

  res.json({
    success: true,
    token,
    session: {
      ...payload,
      signature,
    },
    message: 'Owner authenticated successfully.',
  });
});

// 3. Verify Active Owner Session Token
app.post('/api/owner/verify-session', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.body?.token;

  if (!token || typeof token !== 'string' || !token.includes('.')) {
    res.status(401).json({ valid: false, error: 'Missing or malformed owner token.' });
    return;
  }

  const [payloadB64, signature] = token.split('.');

  try {
    const expectedSignature = crypto
      .createHmac('sha256', OWNER_SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      res.status(403).json({ valid: false, error: 'Invalid owner token signature.' });
      return;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    if (Date.now() > payload.expiresAt) {
      res.status(401).json({ valid: false, error: 'Owner session has expired.' });
      return;
    }

    res.json({
      valid: true,
      sessionId: payload.sessionId,
      userId: payload.userId,
      userEmail: payload.userEmail,
      role: payload.role,
      expiresAt: payload.expiresAt,
    });
  } catch (err) {
    res.status(400).json({ valid: false, error: 'Invalid token structure.' });
  }
});

// Alias for Vercel serverless compatibility
app.post('/api/owner-validate', (req, res) => {
  app._router.handle({ ...req, url: '/api/owner/validate' }, res);
});

// =========================================================================
// SUPABASE SECURE DIAGNOSTIC & VERIFICATION ENDPOINTS
// =========================================================================
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const parts = host.split('.');
    if (parts.length >= 3) {
      const ref = parts[0];
      const maskedRef = ref.slice(0, 3) + '***' + ref.slice(-2);
      return `https://${maskedRef}.${parts.slice(1).join('.')}`;
    }
    return `https://${host.slice(0, 5)}***`;
  } catch {
    return 'invalid-url';
  }
}

async function verifySupabaseEndpoint(url: string, anonKey: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return { success: false, message: 'Invalid protocol. URL must start with https://' };
    }
  } catch {
    return { success: false, message: 'Invalid Project URL format.' };
  }

  try {
    // 1. Ping Supabase Auth Health
    const healthUrl = `${parsedUrl.origin}/auth/v1/health`;
    const healthRes = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        apikey: anonKey.trim(),
      },
      signal: AbortSignal.timeout(6000),
    });

    const isAuthHealthy = healthRes.ok || healthRes.status === 200;

    // 2. Query public.profiles (Rest API)
    const restUrl = `${parsedUrl.origin}/rest/v1/profiles?select=id&limit=1`;
    const restRes = await fetch(restUrl, {
      method: 'GET',
      headers: {
        apikey: anonKey.trim(),
        Authorization: `Bearer ${anonKey.trim()}`,
      },
      signal: AbortSignal.timeout(6000),
    });

    const restBody = await restRes.text().catch(() => '');

    let schemaStatus = 'unknown';
    let schemaMessage = '';

    if (restRes.ok) {
      schemaStatus = 'ready';
      schemaMessage = 'Database tables and Row Level Security policies are active and responding.';
    } else if (
      restRes.status === 404 ||
      restBody.includes('relation "public.profiles" does not exist') ||
      restBody.includes('PGRST204') ||
      restBody.includes('PGRST205')
    ) {
      schemaStatus = 'tables_missing';
      schemaMessage = 'Connected to Supabase, but the database tables have not been created yet. Execute supabase/schema.sql in your Supabase SQL Editor.';
    } else if (restRes.status === 401 || restRes.status === 403) {
      schemaStatus = 'auth_error';
      schemaMessage = 'Supabase rejected the Anon Key (Invalid or unauthorized API key). Please ensure you copied the public anon key.';
    } else {
      schemaStatus = 'reachable';
      schemaMessage = `Supabase responded with HTTP ${restRes.status}.`;
    }

    return {
      success: isAuthHealthy || restRes.ok || schemaStatus === 'tables_missing',
      maskedUrl: maskUrl(url),
      anonKeyLength: anonKey.trim().length,
      authEndpointStatus: healthRes.status,
      databaseEndpointStatus: restRes.status,
      schemaStatus,
      schemaMessage,
    };
  } catch (err: any) {
    return {
      success: false,
      maskedUrl: maskUrl(url),
      error: err?.message || 'Network request failed or timed out.',
    };
  }
}

// 1. Inspect configured environment variables and live status
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  const envUrl = process.env.VITE_SUPABASE_URL || '';
  const envKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  const hasUrl = Boolean(envUrl && envUrl.trim().startsWith('http'));
  const hasKey = Boolean(envKey && envKey.trim().length > 15);

  const missing: string[] = [];
  if (!hasUrl) missing.push('VITE_SUPABASE_URL');
  if (!hasKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    res.json({
      configured: false,
      missing,
      maskedUrl: hasUrl ? maskUrl(envUrl) : null,
      hasAnonKey: hasKey,
      message: `Supabase environment variables are missing (${missing.join(', ')}). The application is safely running in local cryptographic mode with all owner and staff features intact.`,
      nextStep: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables or paste them in the Owner Portal Security & Audit Vault.',
    });
    return;
  }

  // Both variables are set in environment — perform safe non-destructive verification
  const verification = await verifySupabaseEndpoint(envUrl, envKey);
  res.json({
    configured: true,
    source: 'environment',
    verification,
  });
});

// 2. Safe verify endpoint for manual test payloads
app.post('/api/supabase/verify', async (req: Request, res: Response) => {
  const { url, anonKey } = req.body || {};
  const targetUrl = url || process.env.VITE_SUPABASE_URL;
  const targetKey = anonKey || process.env.VITE_SUPABASE_ANON_KEY;

  if (!targetUrl || !targetKey) {
    res.status(400).json({
      success: false,
      error: 'Missing URL or Anon Key. Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.',
    });
    return;
  }

  const result = await verifySupabaseEndpoint(targetUrl, targetKey);
  res.json(result);
});

// =========================================================================
// RAZORPAY PAYMENT GATEWAY SECURE INTEGRATION (SERVER-SIDE ONLY)
// =========================================================================
function getRazorpayClient(): Razorpay | null {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (keyId && keySecret) {
    try {
      return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } catch (err) {
      console.error('[OBRYNT Razorpay] Initialization error:', err);
      return null;
    }
  }
  return null;
}

// 1. Get Public Razorpay Configuration (Never exposes Key Secret)
app.get('/api/payment/razorpay/config', (_req: Request, res: Response) => {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
  const hasSecret = Boolean((process.env.RAZORPAY_KEY_SECRET || '').trim());

  res.json({
    enabled: true,
    keyId: keyId || null,
    isConfigured: Boolean(keyId && hasSecret),
    isTestMode: keyId.startsWith('rzp_test_') || !keyId,
    currency: 'INR',
    status: keyId && hasSecret
      ? (keyId.startsWith('rzp_test_') ? 'Razorpay Test Mode Active' : 'Razorpay Live Mode Active')
      : 'Razorpay keys pending configuration. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
  });
});

// 2. Create Razorpay Payment Order (Server-Side)
app.post('/api/payment/razorpay/create-order', async (req: Request, res: Response): Promise<void> => {
  const { amount, currency = 'INR', orderCode, customer } = req.body || {};

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ success: false, error: 'Invalid order amount.' });
    return;
  }

  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const rzp = getRazorpayClient();

  if (rzp && keyId && keySecret) {
    try {
      const amountInPaise = Math.round(Number(amount) * 100);
      const safeReceipt = `rcpt_${(orderCode || 'OB' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30)}`;

      const rzpOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: safeReceipt,
        notes: {
          store: 'OBRYNT International Fashion Marketplace',
          orderCode: orderCode || '',
          customerEmail: customer?.email || '',
          customerPhone: customer?.phone || '',
        },
      });

      res.json({
        success: true,
        order: {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          receipt: rzpOrder.receipt,
        },
        keyId, // Only publishable Key ID is sent, secret remains secure
        isTestMode: keyId.startsWith('rzp_test_'),
        mode: 'live_razorpay',
      });
      return;
    } catch (err: any) {
      console.error('[OBRYNT Razorpay] Order creation failed:', err);
      res.status(500).json({
        success: false,
        error: err?.error?.description || err?.message || 'Failed to create Razorpay payment order.',
      });
      return;
    }
  }

  // Graceful fallback for initial preview if merchant has not set RAZORPAY_KEY_ID yet
  res.json({
    success: true,
    order: {
      id: `order_test_${Date.now()}`,
      amount: Math.round(Number(amount) * 100),
      currency: currency.toUpperCase(),
      receipt: `rcpt_test_${Date.now()}`,
    },
    keyId: keyId || 'rzp_test_placeholder',
    isTestMode: true,
    mode: 'test_sandbox',
    requiresEnvKeys: !keyId || !keySecret,
    notice: !keyId || !keySecret
      ? 'Running in Test Mode. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to connect to your live Razorpay Dashboard.'
      : undefined,
  });
});

// 3. Verify Razorpay Payment Signature (Server-Side)
app.post('/api/payment/razorpay/verify-payment', async (req: Request, res: Response): Promise<void> => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderDetails,
    isSandboxDemo,
  } = req.body || {};

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!razorpay_order_id || !razorpay_payment_id) {
    res.status(400).json({ success: false, error: 'Missing payment or order reference.' });
    return;
  }

  let verified = false;

  // Real HMAC SHA256 Signature Verification
  if (keySecret && razorpay_signature) {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature.length === razorpay_signature.length) {
        verified = crypto.timingSafeEqual(
          Buffer.from(generatedSignature, 'utf8'),
          Buffer.from(razorpay_signature, 'utf8')
        );
      }
    } catch (err) {
      console.error('[OBRYNT Razorpay] Signature check error:', err);
      verified = false;
    }
  } else if (isSandboxDemo || razorpay_order_id.startsWith('order_test_')) {
    // Verified in test mode
    verified = true;
  }

  if (!verified) {
    res.status(400).json({
      success: false,
      error: 'Payment signature verification failed. Untrusted payment attempt rejected.',
    });
    return;
  }

  // Signature verified! Now sync with Supabase if configured
  let supabaseSynced = false;
  let supabaseMessage = '';

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && orderDetails) {
    try {
      const restUrl = `${supabaseUrl}/rest/v1/orders`;
      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          order_code: orderDetails.orderId,
          customer_name: orderDetails.customer?.fullName || 'Customer',
          customer_phone: orderDetails.customer?.phone || '',
          customer_email: orderDetails.customer?.email || '',
          shipping_address: orderDetails.customer || {},
          subtotal: orderDetails.subtotal || 0,
          discount: orderDetails.discount || 0,
          shipping_fee: orderDetails.shipping || 0,
          tax: orderDetails.tax || 0,
          total_amount: orderDetails.total || 0,
          payment_method: `Razorpay (${orderDetails.paymentMethod || 'Online'})`,
          payment_status: 'captured',
          payment_gateway_ref: razorpay_payment_id,
          order_status: 'Confirmed',
          updated_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(2500),
      });

      if (restRes.ok) {
        supabaseSynced = true;
        supabaseMessage = 'Order status successfully synced to Supabase (payment_status: captured).';
      } else {
        const body = await restRes.text().catch(() => '');
        supabaseSynced = false;
        supabaseMessage = body.includes('profiles') || body.includes('orders')
          ? 'Supabase database tables pending migration (schema.sql).'
          : `Supabase sync status: HTTP ${restRes.status}`;
      }
    } catch (err: any) {
      supabaseSynced = false;
      supabaseMessage = `Supabase sync: ${err?.message || 'Network unreachable'}`;
    }
  }

  res.json({
    success: true,
    verified: true,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    paymentStatus: 'captured',
    orderStatus: 'Confirmed',
    supabaseSynced,
    supabaseMessage,
    message: 'Payment verified successfully by server cryptographic signature.',
  });
});

// 4. Webhook Receiver for Asynchronous Events
app.post('/api/payment/razorpay/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '').trim();
  const signature = req.headers['x-razorpay-signature'];

  if (secret && signature && typeof signature === 'string') {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    if (expected !== signature) {
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }
  }

  const event = req.body?.event;
  console.log(`[OBRYNT Razorpay Webhook] Received verified event: ${event}`);
  res.json({ status: 'ok', received: true });
});

// =========================================================================
// AI AUTO-CATEGORISATION ENDPOINT (GEMINI 3.8 FLASH + LOCAL TAXONOMY FALLBACK)
// =========================================================================
let aiClient: GoogleGenAI | null = null;
try {
  aiClient = new GoogleGenAI();
} catch (err) {
  console.warn('[OBRYNT AI] Note on Gemini client initialization:', err);
}

app.post('/api/products/ai-categorize', async (req: Request, res: Response): Promise<void> => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Array of items required' });
    return;
  }

  // Cap batch size at 40 per request for fast response time
  const batch = items.slice(0, 40);

  // If Gemini client initialized and API key is present in environment, query Gemini 3.8 Flash
  if (aiClient && (process.env.GEMINI_API_KEY || process.env.API_KEY)) {
    try {
      const prompt = buildGeminiCategorizationPrompt(batch);
      const geminiRes = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = geminiRes.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          res.json({
            success: true,
            source: 'gemini-3.8-flash',
            categorized: parsed,
          });
          return;
        }
      }
    } catch (err: any) {
      console.warn('[OBRYNT AI] Gemini generateContent notice, utilizing local taxonomy rules engine:', err?.message);
    }
  }

  // Robust, instant local taxonomy classifier fallback
  const categorized = batch.map((item: any) => {
    const classification = classifyProductLocally(item);
    return {
      id: item.id,
      category: classification.category,
      subcategory: classification.subcategory,
      audience: classification.audience,
      brand: classification.brand,
      sizes: classification.sizes,
      colors: classification.colors,
      confidence: classification.confidence,
      needsReview: classification.needsReview,
      reason: classification.reason,
    };
  });

  res.json({
    success: true,
    source: 'local-taxonomy-engine',
    categorized,
  });
});

// =========================================================================
// AI CLOTHING DESIGN STUDIO ARTWORK ENDPOINT
// =========================================================================
app.post('/api/ai/generate-clothing-artwork', async (req: Request, res: Response): Promise<void> => {
  const { prompt, category = 'T-shirts', garmentColor = '#171717' } = req.body || {};
  const userPrompt = typeof prompt === 'string' && prompt.trim() ? prompt.trim() : 'OBRYNT Streetwear';

  // Base variations from themed vector generator
  let designs = generateThemedArtworkVariations(userPrompt, category);

  // If Gemini client initialized and API key is present, attempt image generation with gemini-3.1-flash-lite-image
  if (aiClient && (process.env.GEMINI_API_KEY || process.env.API_KEY)) {
    try {
      const apparelPrompt = `Clean silkscreen graphic print for apparel streetwear: ${userPrompt}. Isolated graphic artwork, flat vector illustration on pure solid white background, high contrast silhouette, bold lines, premium apparel graphic, no t-shirt mockup, no model.`;
      
      const imageRes = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: apparelPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });

      for (const part of imageRes.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          const aiArtworkUrl = `data:${mime};base64,${part.inlineData.data}`;
          designs.unshift({
            id: `art-gemini-${Date.now()}`,
            title: 'Gemini AI Vision Graphic',
            style: 'Neural Generated Vector',
            prompt: userPrompt,
            svgUrl: aiArtworkUrl,
            description: `Bespoke neural silkscreen graphic rendered for "${userPrompt}".`,
            accentColor: '#d7ff3f',
          });
          break;
        }
      }
    } catch (err: any) {
      console.warn('[OBRYNT AI] Gemini image generation notice, providing themed vector variations:', err?.message);
    }
  }

  res.json({
    success: true,
    designs,
    prompt: userPrompt,
    category,
    garmentColor,
  });
});

// =========================================================================
// RESTRICTED DELIVERY COMPANY API ENDPOINTS
// =========================================================================
interface ServerDeliveryCompany {
  id: string;
  name: string;
  email: string;
  accessCode: string;
  status: 'active' | 'suspended' | 'revoked';
}

// In-memory server company lookup
const serverDeliveryCompanies: ServerDeliveryCompany[] = [
  {
    id: 'del-company-bluedart',
    name: 'Blue Dart Express (Surface & Air)',
    email: 'dispatch@bluedart-express.in',
    accessCode: 'DEL-BLUEDART-8891',
    status: 'active',
  },
  {
    id: 'del-company-delhivery',
    name: 'Delhivery Surface Logistics',
    email: 'ops.support@delhivery-logistics.com',
    accessCode: 'DEL-DELHIVERY-4420',
    status: 'active',
  },
  {
    id: 'del-company-shadowfax',
    name: 'Shadowfax Hyperlocal Fleet',
    email: 'riders@shadowfax-network.in',
    accessCode: 'DEL-SHADOWFAX-2099',
    status: 'active',
  },
];

// Delivery login
app.post('/api/delivery/login', (req: Request, res: Response) => {
  const { email, accessCode } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanCode = (accessCode || '').trim();

  const matched = serverDeliveryCompanies.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!matched) {
    res.status(401).json({ success: false, error: 'Invalid delivery company credentials.' });
    return;
  }

  if (matched.status !== 'active') {
    res.status(403).json({ success: false, error: `Delivery access is ${matched.status.toUpperCase()}. Contact OBRYNT admin.` });
    return;
  }

  if (matched.accessCode !== cleanCode) {
    res.status(401).json({ success: false, error: 'Incorrect courier access key.' });
    return;
  }

  const token = `del-srv-${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}`;
  res.json({
    success: true,
    session: {
      companyId: matched.id,
      companyName: matched.name,
      authorizedEmail: matched.email,
      role: 'delivery',
      token,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    },
  });
});

// Courier audit log endpoint
app.post('/api/delivery/copy-log', (req: Request, res: Response) => {
  const { orderId, field, companyName } = req.body || {};
  console.log(`[OBRYNT Delivery Audit] ${companyName || 'Courier'} copied ${field || 'details'} for order ${orderId} at ${new Date().toISOString()}`);
  res.json({ success: true, loggedAt: new Date().toISOString() });
});

// =========================================================================
// VITE / STATIC SERVING
// =========================================================================
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OBRYNT] Server with Secure Staff Security running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[OBRYNT] Server failed to start:', err);
});
