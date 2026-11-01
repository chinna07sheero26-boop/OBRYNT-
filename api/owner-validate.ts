import crypto from 'crypto';

/**
 * OBRYNT Owner Portal Server-Side Security Endpoint (Vercel Serverless & Node API)
 * 
 * SECURITY MANDATE:
 * - The owner portal password is NEVER sent to or stored in frontend client bundles.
 * - Validation is executed strictly server-side using constant-time comparison.
 * - Rate limiting is enforced with a 15-minute lockout after 5 consecutive failures.
 * - Upon successful authentication, generates a cryptographically signed HMAC token for 'owner'.
 */

const OWNER_PORTAL_PASSWORD = (process.env.OWNER_PORTAL_PASSWORD || 'chinnasheero3026').trim();
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'chinna07sheero.26@gmail.com').trim().toLowerCase();
const OWNER_SESSION_SECRET = (
  process.env.OWNER_SESSION_SECRET || 'obrynt_secure_owner_hmac_master_secret_2026'
).trim();

// In-memory rate limiting map for serverless execution
const failedAttemptsMap = new Map<string, { attempts: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function safeCompare(input: string, target: string): boolean {
  const bufA = Buffer.from(input);
  const bufB = Buffer.from(target);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export default function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anonymous';

  // Status check endpoint
  if (req.method === 'GET') {
    const state = failedAttemptsMap.get(ip) || { attempts: 0, lockedUntil: 0 };
    const isLocked = state.lockedUntil > Date.now();
    const remainingSec = isLocked ? Math.ceil((state.lockedUntil - Date.now()) / 1000) : 0;
    return res.status(200).json({
      ok: true,
      service: 'obrynt-owner-auth',
      isLocked,
      lockRemainingSec: remainingSec,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check rate limit status
  const state = failedAttemptsMap.get(ip) || { attempts: 0, lockedUntil: 0 };
  if (state.lockedUntil > Date.now()) {
    const remainingSec = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      error: `Security Lockout Active. Please wait ${Math.ceil(remainingSec / 60)} minute(s) before trying again.`,
      isLocked: true,
      lockRemainingSec: remainingSec,
    });
  }

  const { email, password } = req.body || {};

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Owner password is required.' });
  }

  const normalizedEmail = (email && typeof email === 'string' ? email.trim().toLowerCase() : OWNER_EMAIL);
  const isEmailMatch = normalizedEmail === OWNER_EMAIL || normalizedEmail.includes('admin') || normalizedEmail.includes('owner');
  const isPasswordMatch = safeCompare(password.trim(), OWNER_PORTAL_PASSWORD);

  if (!isEmailMatch || !isPasswordMatch) {
    state.attempts += 1;
    if (state.attempts >= MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + LOCKOUT_MS;
    }
    failedAttemptsMap.set(ip, state);

    const remainingSec = state.lockedUntil > Date.now() ? Math.ceil((state.lockedUntil - Date.now()) / 1000) : 0;
    return res.status(401).json({
      success: false,
      error: state.lockedUntil > Date.now()
        ? 'Maximum failed attempts reached. Access is locked for 15 minutes.'
        : 'Invalid credentials. Access rejected by Owner Security Gateway.',
      isLocked: state.lockedUntil > Date.now(),
      lockRemainingSec: remainingSec,
    });
  }

  // Clear failed attempts counter on successful login
  failedAttemptsMap.delete(ip);

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

  return res.status(200).json({
    success: true,
    token,
    session: {
      ...payload,
      signature,
    },
    message: 'Owner authenticated successfully.',
  });
}
