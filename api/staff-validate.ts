import crypto from 'crypto';

const STAFF_ACCESS_CODE = (process.env.STAFF_ACCESS_CODE || '30182607').trim();
const STAFF_SESSION_SECRET = (
  process.env.STAFF_SESSION_SECRET || 'obrynt_secure_staff_hmac_secret_production_key_2026'
).trim();

// In-memory rate limiting for serverless instance
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
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anonymous';

  // Check rate limit
  const state = failedAttemptsMap.get(ip) || { attempts: 0, lockedUntil: 0 };
  if (state.lockedUntil > Date.now()) {
    const remainingSec = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      error: `Security lockout active. Try again in ${Math.ceil(remainingSec / 60)} minute(s).`,
      isLocked: true,
      lockRemainingSec: remainingSec,
    });
  }

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Staff access code required.' });
  }

  const isMatch = safeCompare(code.trim(), STAFF_ACCESS_CODE);

  if (!isMatch) {
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
        : 'Invalid staff access code. Access denied.',
      isLocked: state.lockedUntil > Date.now(),
      lockRemainingSec: remainingSec,
    });
  }

  // Clear failures on success
  failedAttemptsMap.delete(ip);

  const issuedAt = Date.now();
  const expiresAt = issuedAt + 8 * 60 * 60 * 1000;

  const payload = {
    staffId: `staff_${issuedAt.toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    role: 'staff',
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

  return res.status(200).json({
    success: true,
    token,
    role: payload.role,
    permissions: payload.permissions,
    expiresAt: payload.expiresAt,
  });
}
