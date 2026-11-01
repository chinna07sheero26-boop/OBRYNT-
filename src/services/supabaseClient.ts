import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

/**
 * OBRYNT International Fashion Marketplace — Supabase Client & RLS Integration
 * 
 * Configured with:
 * - Supabase Auth (Email & Password, Session management)
 * - PostgreSQL Profiles Table role-checking (Roles: 'owner' | 'admin' | 'supplier' | 'customer')
 * - Server-side Row Level Security (RLS) enforcement
 * - Dynamic fallback / custom configuration support (persisted in localStorage if env vars are pending)
 */

const STORAGE_KEYS = {
  SUPABASE_URL: 'obrynt_custom_supabase_url',
  SUPABASE_KEY: 'obrynt_custom_supabase_anon_key',
  CACHED_ROLE: 'obrynt_cached_user_role',
};

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url?: string;
  hasAnonKey: boolean;
  source: 'env' | 'custom' | 'none';
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'supplier' | 'customer';
  full_name?: string;
  phone?: string;
  supplier_id?: string;
  created_at?: string;
}

// Retrieve active configuration (Environment variables take precedence, followed by custom config)
export function getActiveSupabaseCredentials(): { url: string; anonKey: string; source: 'env' | 'custom' | 'none' } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), source: 'env' };
  }

  try {
    const customUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
    const customKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY);
    if (customUrl && customKey && customUrl.startsWith('http')) {
      return { url: customUrl.trim(), anonKey: customKey.trim(), source: 'custom' };
    }
  } catch {}

  return { url: '', anonKey: '', source: 'none' };
}

// Singleton Supabase Client
let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getActiveSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'obrynt_supabase_auth_token',
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('[OBRYNT Supabase] Failed to initialize client:', err);
    return null;
  }
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, anonKey.trim());
    cachedClient = null; // reset singleton so it recreates with new config
  } catch (err) {
    console.error('Failed to save custom Supabase configuration', err);
  }
}

export function clearCustomSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
    localStorage.removeItem(STORAGE_KEYS.CACHED_ROLE);
    cachedClient = null;
  } catch (err) {}
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  const { url, anonKey, source } = getActiveSupabaseCredentials();

  return {
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
    url: url || undefined,
    hasAnonKey: Boolean(anonKey),
    source,
  };
}

/**
 * Verify user role from public.profiles table (protected by Row Level Security)
 * Only users who have 'owner' or 'admin' roles will be allowed into the /admin dashboard.
 */
export async function verifyUserRole(userId: string, userEmail?: string): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Query the RLS-protected public.profiles table
    const { data, error } = await client
      .from('profiles')
      .select('id, email, role, full_name, phone, supplier_id, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[OBRYNT Supabase] Error querying profiles table:', error.message);
    }

    if (data) {
      try {
        localStorage.setItem(STORAGE_KEYS.CACHED_ROLE, data.role);
      } catch {}
      return data as UserProfile;
    }

    // 2. If profile does not exist yet (e.g. freshly created user), check if this is the verified owner email
    const knownOwnerEmail = 'chinna07sheero.26@gmail.com';
    const isOwnerByEmail = userEmail && userEmail.toLowerCase() === knownOwnerEmail.toLowerCase();

    if (isOwnerByEmail) {
      // Attempt to initialize owner profile
      const newProfile: Partial<UserProfile> = {
        id: userId,
        email: userEmail,
        role: 'owner',
        full_name: 'OBRYNT Store Owner',
      };

      const { data: inserted, error: insertErr } = await client
        .from('profiles')
        .upsert(newProfile as any)
        .select()
        .single();

      if (!insertErr && inserted) {
        return inserted as UserProfile;
      }

      // If RLS prevented insert, but user email is the authorized owner, treat role as owner for verified session
      return {
        id: userId,
        email: userEmail,
        role: 'owner',
        full_name: 'OBRYNT Store Owner',
      };
    }

    return null;
  } catch (err) {
    console.error('[OBRYNT Supabase] verifyUserRole failed:', err);
    return null;
  }
}

/**
 * Check if the current authenticated Supabase session has owner/admin privileges
 */
export async function checkIsAdminOrOwnerSession(): Promise<{
  isAuthorized: boolean;
  user: User | null;
  profile: UserProfile | null;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { isAuthorized: false, user: null, profile: null, error: 'Supabase client not configured' };
  }

  try {
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError || !session || !session.user) {
      return { isAuthorized: false, user: null, profile: null };
    }

    const user = session.user;
    const profile = await verifyUserRole(user.id, user.email);

    if (profile && (profile.role === 'owner' || profile.role === 'admin')) {
      return { isAuthorized: true, user, profile };
    }

    return {
      isAuthorized: false,
      user,
      profile,
      error: `Account role "${profile?.role || 'unassigned'}" is not authorized for OBRYNT Merchant OS.`,
    };
  } catch (err: any) {
    return { isAuthorized: false, user: null, profile: null, error: err?.message };
  }
}

/**
 * Sign in to Supabase Authentication with email and password
 * Enforces Role-Based Access Control and RLS verification
 */
export async function signInWithSupabaseAuth(email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  profile?: UserProfile;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase is not configured yet. Please configure your Project URL & Anon Key.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || 'Invalid email or password.',
      };
    }

    // Role check: query public.profiles with RLS
    const profile = await verifyUserRole(data.user.id, data.user.email);

    if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
      // User is authenticated in Supabase, but lacks owner or admin role
      await client.auth.signOut();
      return {
        success: false,
        error: `Access Denied: Account role is "${profile?.role || 'customer'}". Only verified 'owner' or 'admin' roles can access OBRYNT Merchant OS.`,
      };
    }

    return {
      success: true,
      user: data.user,
      profile,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Authentication failed.',
    };
  }
}

/**
 * Sign out of Supabase Auth
 */
export async function signOutSupabaseAuth(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.auth.signOut();
    localStorage.removeItem(STORAGE_KEYS.CACHED_ROLE);
  } catch (err) {
    console.error('[OBRYNT Supabase] signOut failed:', err);
  }
}

/**
 * Subscribe to Supabase Auth State changes
 */
export function onSupabaseAuthStateChange(
  callback: (event: string, session: Session | null, profile: UserProfile | null) => void
): { unsubscribe: () => void } {
  const client = getSupabaseClient();
  if (!client) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await verifyUserRole(session.user.id, session.user.email);
      callback(event, session, profile);
    } else {
      callback(event, null, null);
    }
  });

  return {
    unsubscribe: () => subscription.unsubscribe(),
  };
}
