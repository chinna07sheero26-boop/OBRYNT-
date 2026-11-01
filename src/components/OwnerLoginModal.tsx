import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Key,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Database,
  Sliders,
  Copy,
  Check,
  Server,
  Mail,
  ExternalLink,
} from 'lucide-react';
import {
  authenticateOwner,
  getRateLimitState,
  isOwnerSetupCompleted,
  setOwnerPassword,
  logSecurityEvent,
  createSessionFromSupabaseUser,
  AuthSession,
} from '../services/authService';
import {
  signInWithSupabaseAuth,
  getSupabaseStatus,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  getActiveSupabaseCredentials,
  verifyUserRole,
} from '../services/supabaseClient';
import {
  validateOwnerServerCredentials,
  checkOwnerServerStatus,
} from '../services/ownerAuthService';

interface OwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  onShowNotice?: (msg: string) => void;
}

export const OwnerLoginModal: React.FC<OwnerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowNotice,
}) => {
  // Mode selection: 'supabase' (default) | 'config' | 'emergency_local'
  const [authMode, setAuthMode] = useState<'supabase' | 'config' | 'emergency_local'>('supabase');

  // Supabase Auth State
  const [email, setEmail] = useState('chinna07sheero.26@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState(0);

  // Supabase Config State
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseStatus());
  const [configUrl, setConfigUrl] = useState('');
  const [configAnonKey, setConfigAnonKey] = useState('');
  const [configSuccess, setConfigSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Check rate limit timer on open and every second
  useEffect(() => {
    if (!isOpen) return;

    const currentStatus = getSupabaseStatus();
    setSupabaseConfig(currentStatus);
    const creds = getActiveSupabaseCredentials();
    setConfigUrl(creds.url);
    setConfigAnonKey(creds.anonKey);

    const checkLockout = () => {
      const state = getRateLimitState();
      if (state.lockedUntil > Date.now()) {
        const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
        setLockoutRemainingSec(remaining);
      } else {
        setLockoutRemainingSec(0);
      }
    };

    // Check server rate limit status
    checkOwnerServerStatus().then((serverStatus) => {
      if (serverStatus.isLocked && serverStatus.lockRemainingSec > 0) {
        setLockoutRemainingSec(serverStatus.lockRemainingSec);
      }
    });

    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Primary: Handle Owner Authentication (Supabase Auth + Server-Side Security Gateway)
  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSec > 0 || isVerifying) return;

    setError('');
    setIsVerifying(true);

    try {
      // 1. If Supabase is configured, attempt Supabase Auth first
      if (supabaseConfig.isConfigured) {
        const result = await signInWithSupabaseAuth(email.trim(), password);

        if (result.success && result.user) {
          const role = result.profile?.role || 'customer';
          if (role === 'owner' || role === 'admin') {
            const session = await createSessionFromSupabaseUser(
              result.user.id,
              result.user.email || email.trim(),
              role
            );
            onSuccess(session);
            setPassword('');
            setError('');
            onClose();
            if (onShowNotice) {
              onShowNotice(`Authenticated: Supabase Auth · Verified Role: ${role.toUpperCase()}`);
            }
            return;
          }
        }
      }

      // 2. Validate securely on server via protected backend (/api/owner/validate)
      // Password is NEVER checked or evaluated in client-side code
      const serverResult = await validateOwnerServerCredentials(email.trim(), password);

      if (serverResult.success && serverResult.session) {
        onSuccess(serverResult.session);
        setPassword('');
        setError('');
        onClose();
        if (onShowNotice) {
          onShowNotice('Authenticated: Server-Verified Master Owner Session Active');
        }
        return;
      }

      if (serverResult.isLocked && serverResult.lockRemainingSec) {
        setLockoutRemainingSec(serverResult.lockRemainingSec);
      }

      setError(serverResult.error || 'Invalid credentials. Access denied by Owner Security Gateway.');
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Emergency Local PBKDF2 verification (only if configured)
  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSec > 0 || isVerifying) return;

    setError('');
    setIsVerifying(true);

    try {
      const result = await authenticateOwner(password.trim());
      if (result.success && result.session) {
        onSuccess(result.session);
        setPassword('');
        setError('');
        onClose();
        if (onShowNotice) {
          onShowNotice('Authenticated: Emergency Local PBKDF2 Session Active');
        }
      } else {
        if (result.isLocked && result.lockTimeRemainingSec) {
          setLockoutRemainingSec(result.lockTimeRemainingSec);
        }
        setError(result.error || 'Authentication rejected.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Save Supabase Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!configUrl.startsWith('http')) {
      setError('Project URL must start with https:// (e.g. https://your-project.supabase.co)');
      return;
    }
    if (!configAnonKey || configAnonKey.length < 20) {
      setError('Please provide a valid Supabase anon public key.');
      return;
    }

    saveCustomSupabaseConfig(configUrl, configAnonKey);
    const updatedStatus = getSupabaseStatus();
    setSupabaseConfig(updatedStatus);
    setConfigSuccess(true);

    setTimeout(() => {
      setConfigSuccess(false);
      setAuthMode('supabase');
    }, 1200);

    if (onShowNotice) {
      onShowNotice('Supabase credentials saved. You can now log in.');
    }
  };

  // Copy Supabase SQL schema for easy database provisioning
  const handleCopySql = () => {
    const sqlText = `-- OBRYNT Production RLS Migration (Copy & paste into Supabase SQL Editor)
-- 1. Create profiles table with roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'customer' check (role in ('owner', 'admin', 'supplier', 'customer')),
  full_name text,
  phone text,
  supplier_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Security Definer Helper for Role Enforcement
create or replace function public.is_admin_or_owner() returns boolean as $$
begin
  return exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin'));
end;
$$ language plpgsql security definer;

-- 4. RLS Policies
create policy "Users can view own profile" on public.profiles for select
  using (auth.uid() = id or public.is_admin_or_owner());

create policy "Users can update own profile" on public.profiles for update
  using (auth.uid() = id);

-- 5. Set chinna07sheero.26@gmail.com as Owner upon registration
-- (Replace <AUTH_USER_UUID> with user ID from auth.users after signing up)
-- insert into public.profiles (id, email, role, full_name)
-- values ('<AUTH_USER_UUID>', 'chinna07sheero.26@gmail.com', 'owner', 'OBRYNT Store Owner')
-- on conflict (id) do update set role = 'owner';
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    if (onShowNotice) {
      onShowNotice('Supabase RLS Schema copied to clipboard.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] text-white rounded-3xl w-full max-w-lg p-6 sm:p-8 border border-stone-800 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle accent ambient glow */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-[#d7ff3f]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#d7ff3f] text-[#111111] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#d7ff3f]/15">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            OBRYNT Owner Portal
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Protected by Supabase Authentication & PostgreSQL RLS
          </p>

          {/* Security Status Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-stone-800 bg-stone-900/80">
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConfig.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-[#d7ff3f] animate-pulse'
              }`}
            />
            <span className="text-stone-300">
              {supabaseConfig.isConfigured
                ? `Supabase Connected (${supabaseConfig.source === 'env' ? 'Vercel Env' : 'Custom Config'})`
                : 'Server Security Gateway Active'}
            </span>
          </div>
        </div>

        {/* Lockout Notice */}
        {lockoutRemainingSec > 0 ? (
          <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-5 text-center my-4 space-y-2">
            <Clock className="w-7 h-7 text-rose-400 mx-auto" />
            <h4 className="text-sm font-bold text-rose-200">Security Lockout Active</h4>
            <p className="text-xs text-stone-400">
              Multiple failed attempts detected. Access is temporarily locked to prevent brute-force attacks.
            </p>
            <div className="text-lg font-mono font-black text-rose-400 pt-1">
              {Math.floor(lockoutRemainingSec / 60)}:
              {(lockoutRemainingSec % 60).toString().padStart(2, '0')}
            </div>
          </div>
        ) : authMode === 'config' ? (
          /* Supabase Configuration Panel */
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 text-xs text-stone-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#d7ff3f]">
                <Database className="w-4 h-4" />
                <span>Supabase Project Settings</span>
              </div>
              <p className="text-stone-400 text-[11px]">
                Enter your Supabase project credentials to enable cloud authentication and server-side Row Level Security.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="url"
                required
                value={configUrl}
                onChange={(e) => setConfigUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-stone-600 outline-hidden focus:border-[#d7ff3f]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                Anon Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <textarea
                required
                rows={2}
                value={configAnonKey}
                onChange={(e) => setConfigAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-stone-600 outline-hidden focus:border-[#d7ff3f]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {configSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Supabase configuration saved successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleCopySql}
                className="text-[11px] text-stone-400 hover:text-[#d7ff3f] transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy Supabase RLS Schema SQL'}</span>
              </button>

              {supabaseConfig.source === 'custom' && (
                <button
                  type="button"
                  onClick={() => {
                    clearCustomSupabaseConfig();
                    setSupabaseConfig(getSupabaseStatus());
                    setConfigUrl('');
                    setConfigAnonKey('');
                  }}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Config
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('supabase')}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-full cursor-pointer transition-colors"
              >
                Back to Login
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black text-xs uppercase tracking-wider rounded-full cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                Save & Connect
              </button>
            </div>
          </form>
        ) : authMode === 'emergency_local' ? (
          /* Emergency Local PBKDF2 Fallback */
          <form onSubmit={handleLocalSubmit} className="space-y-4">
            <div className="bg-amber-950/30 border border-amber-900/50 p-3.5 rounded-xl text-xs text-amber-200">
              <span className="font-bold">Offline / Emergency Mode:</span> Authenticates via client-side PBKDF2 key derivation.
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                Emergency Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter emergency master password"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm font-medium text-white outline-hidden focus:border-[#d7ff3f]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('supabase')}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-full cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-3 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black text-xs uppercase tracking-wider rounded-full cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify</span>}
              </button>
            </div>
          </form>
        ) : (
          /* Primary: Supabase Authentication Form */
          <form onSubmit={handleSupabaseSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                Owner Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="chinna07sheero.26@gmail.com"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-white placeholder:text-stone-600 outline-hidden focus:border-[#d7ff3f]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                Supabase Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your Supabase password"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-10 pr-11 py-3 text-sm font-medium text-white placeholder:text-stone-600 outline-hidden focus:border-[#d7ff3f]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className="flex items-start gap-1.5 text-xs text-rose-400 mt-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black text-xs uppercase tracking-wider rounded-full transition-transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying RLS Role on Supabase...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO OBRYNT MERCHANT OS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Utility links */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('config');
                  setError('');
                }}
                className="text-[11px] text-stone-400 hover:text-[#d7ff3f] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>Configure Supabase Project</span>
              </button>

              <button
                type="button"
                onClick={handleCopySql}
                className="text-[11px] text-stone-400 hover:text-[#d7ff3f] transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy Schema SQL'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Security Footer Notice */}
        <div className="mt-6 pt-4 border-t border-stone-800/80 text-center text-[11px] text-stone-500 leading-normal">
          <div className="flex items-center justify-center gap-1.5 text-stone-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d7ff3f]" />
            <span className="font-semibold text-stone-300">Server-Side RLS Role Guard</span>
          </div>
          Every request verifies <code className="text-stone-400 font-mono">public.profiles.role in ('owner', 'admin')</code>.<br />
          Customers and unauthenticated users cannot access this merchant system.
        </div>
      </div>
    </div>
  );
};
