import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

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
