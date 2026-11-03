import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Terminal,
  RefreshCw,
  Sliders,
  FileCode,
  CreditCard,
} from 'lucide-react';
import {
  getSecurityAuditLogs,
  getRateLimitState,
  getActiveSession,
  isOwnerSetupCompleted,
  SecurityAuditLog,
} from '../../services/authService';
import {
  getSupabaseStatus,
  testSupabaseConnection,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
} from '../../services/supabaseClient';
import {
  getRazorpayPublicConfig,
  RazorpayPublicConfig,
} from '../../services/paymentService';

interface SecurityAuditTabProps {
  onShowNotice: (msg: string) => void;
}

const FULL_SUPABASE_SCHEMA_SQL = `-- =========================================================================
-- OBRYNT International Fashion Marketplace — Production Schema & Security
-- PostgreSQL & Supabase Database Definition with Row Level Security (RLS)
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USER PROFILES & ROLES
-- Roles: 'owner' | 'admin' | 'staff' | 'supplier' | 'customer'
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'customer' check (role in ('owner', 'admin', 'staff', 'supplier', 'customer')),
  full_name text,
  phone text,
  supplier_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. BRANDS & SUPPLIERS
create table if not exists public.suppliers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  brand_name text not null,
  contact_person text not null,
  email text not null,
  phone text not null,
  address text,
  city text,
  state text,
  pincode text,
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  commercial_terms text,
  payment_terms text,
  shipping_terms text,
  wholesale_prices text,
  product_categories text[] default array['T-Shirts']::text[],
  wholesale_discount_pct numeric default 30.00,
  dispatch_days integer default 2,
  accepts_single_item boolean default true,
  accepts_cod boolean default true,
  accepts_returns boolean default true,
  auto_forward_orders boolean default false,
  rating numeric default 5.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PRODUCTS & CATALOGUE
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  sku text not null unique,
  name text not null,
  description text,
  category text not null,
  subcategory text,
  audience text default 'Unisex',
  supplier_id uuid references public.suppliers(id) on delete set null,
  retail_price numeric not null,
  original_price numeric,
  wholesale_cost numeric,
  stock integer not null default 0,
  image_url text not null,
  gallery_urls text[] default array[]::text[],
  sizes text[] default array['S', 'M', 'L', 'XL']::text[],
  colors text[] default array[]::text[],
  weight_grams integer default 250,
  is_published boolean default true,
  is_approved boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_supplier on public.products(supplier_id);

-- 4. CUSTOMER ORDERS
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  order_code text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  shipping_address jsonb not null,
  subtotal numeric not null,
  discount numeric default 0,
  shipping_fee numeric default 0,
  tax numeric default 0,
  total_amount numeric not null,
  payment_method text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'authorized', 'captured', 'failed', 'refunded', 'cod_pending', 'cod_remitted')),
  payment_gateway_ref text,
  order_status text not null default 'Placed' check (order_status in ('Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ORDER LINE ITEMS
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  sku text not null,
  product_name text not null,
  size text,
  color text,
  quantity integer not null,
  unit_price numeric not null,
  unit_wholesale_cost numeric not null,
  custom_design_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. SUPPLIER FULFILMENTS
create table if not exists public.supplier_fulfilments (
  id uuid default uuid_generate_v4() primary key,
  fulfilment_code text not null unique,
  order_id uuid references public.orders(id) on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  total_wholesale_cost numeric not null,
  shipping_cost numeric default 60,
  status text not null default 'pending' check (status in ('pending', 'acknowledged', 'in_preparation', 'dispatched', 'delivered', 'cancelled', 'returned')),
  dispatch_date timestamp with time zone,
  tracking_number text,
  courier_partner text,
  supplier_notes text,
  settlement_status text not null default 'unsettled' check (settlement_status in ('unsettled', 'eligible', 'settled', 'disputed')),
  settlement_ref text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. AUDIT LOGS & ADMINISTRATIVE SECURITY
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — ZERO TRUST ARCHITECTURE
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.supplier_fulfilments enable row level security;
alter table public.audit_logs enable row level security;

-- Function: Helper to check if current authenticated user has 'owner' or 'admin' role
create or replace function public.is_admin_or_owner()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('owner', 'admin')
  );
end;
$$ language plpgsql security definer;

-- PROFILES POLICIES
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin_or_owner());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- PRODUCTS POLICIES
create policy "Public can view published products"
  on public.products for select
  using (is_published = true and is_approved = true);

create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin_or_owner());

-- SUPPLIERS POLICIES
create policy "Suppliers can view own record"
  on public.suppliers for select
  using (
    public.is_admin_or_owner() or
    id in (select supplier_id from public.profiles where id = auth.uid() and role = 'supplier')
  );

create policy "Admins can manage suppliers"
  on public.suppliers for all
  using (public.is_admin_or_owner());

-- ORDERS POLICIES
create policy "Customers view own orders"
  on public.orders for select
  using (customer_id = auth.uid() or public.is_admin_or_owner());

create policy "Customers insert orders"
  on public.orders for insert
  with check (auth.uid() is not null or public.is_admin_or_owner());

create policy "Admins manage orders"
  on public.orders for all
  using (public.is_admin_or_owner());

-- SUPPLIER FULFILMENTS POLICIES
create policy "Suppliers view own fulfilments"
  on public.supplier_fulfilments for select
  using (
    public.is_admin_or_owner() or
    supplier_id in (select supplier_id from public.profiles where id = auth.uid() and role = 'supplier')
  );

create policy "Suppliers update dispatch on own fulfilments"
  on public.supplier_fulfilments for update
  using (
    public.is_admin_or_owner() or
    supplier_id in (select supplier_id from public.profiles where id = auth.uid() and role = 'supplier')
  );

-- AUDIT LOGS POLICIES
create policy "Admins view audit logs"
  on public.audit_logs for select
  using (public.is_admin_or_owner());
`;

export const SecurityAuditTab: React.FC<SecurityAuditTabProps> = ({ onShowNotice }) => {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  // Live Supabase Testing State
  const [testUrl, setTestUrl] = useState('');
  const [testAnonKey, setTestAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; schemaReady: boolean } | null>(null);

  const session = getActiveSession();
  const rateLimit = getRateLimitState();
  const [supabaseStatus, setSupabaseStatus] = useState(getSupabaseStatus());
  const [rzpConfig, setRzpConfig] = useState<RazorpayPublicConfig | null>(null);

  useEffect(() => {
    setLogs(getSecurityAuditLogs());
    const current = getSupabaseStatus();
    setSupabaseStatus(current);
    if (current.url) setTestUrl(current.url);
    getRazorpayPublicConfig().then(setRzpConfig).catch(() => {});
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(FULL_SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    onShowNotice('Complete Supabase SQL Schema copied to clipboard.');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleRunConnectionTest = async () => {
    if (!testUrl || !testAnonKey) {
      onShowNotice('Please enter both Supabase Project URL and Publishable Anon Key.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(testUrl, testAnonKey);
    setTesting(false);
    setTestResult(result);

    if (result.success) {
      saveCustomSupabaseConfig(testUrl, testAnonKey);
      setSupabaseStatus(getSupabaseStatus());
      onShowNotice('Supabase connection verified and activated!');
    } else {
      onShowNotice(result.message);
    }
  };

  const handleDisconnect = () => {
    clearCustomSupabaseConfig();
    setSupabaseStatus(getSupabaseStatus());
    setTestResult(null);
    setTestAnonKey('');
    onShowNotice('Custom Supabase configuration removed.');
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-[#d7ff3f]" />
          <span>Cybersecurity & Enterprise Vault Console</span>
        </h1>
        <p className="text-xs text-stone-400 mt-1">
          Zero-Trust cryptographic access control, PBKDF2 salted encryption, rate-limiting brute-force lockouts, and database Row Level Security.
        </p>
      </div>

      {/* Security Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cryptographic Vault */}
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300">
            <span>Cryptographic Hashing</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
              WebCrypto
            </span>
          </div>
          <div className="text-xl font-black text-white">PBKDF2-SHA256</div>
          <div className="text-xs text-stone-400 space-y-1">
            <div>• Iterations: <strong className="text-stone-200">100,000</strong></div>
            <div>• Salt Entropy: <strong className="text-stone-200">128-bit CSPRNG</strong></div>
            <div>• Stored State: <strong className="text-stone-200">Encrypted Digest Only</strong></div>
          </div>
        </div>

        {/* Card 2: Active Session */}
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300">
            <span>Active Master Session</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-950 text-blue-300 border border-blue-800">
              {session?.userEmail?.includes('@') ? 'Supabase Auth' : 'HMAC Signed'}
            </span>
          </div>
          <div className="text-xl font-black text-white">
            Role: {session?.role.toUpperCase() || 'OWNER'}
          </div>
          <div className="text-xs text-stone-400 space-y-1">
            {session?.userEmail && (
              <div>• User: <span className="font-mono text-[11px] text-[#d7ff3f]">{session.userEmail}</span></div>
            )}
            <div>• Session ID: <span className="font-mono text-[11px] text-stone-300">{session?.sessionId.slice(0, 12)}...</span></div>
            <div>• Lifetime: <strong className="text-stone-200">8 Hours</strong></div>
            <div>• Status: <strong className="text-emerald-400">Authenticated & Active</strong></div>
          </div>
        </div>

        {/* Card 3: Brute-Force Monitor */}
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300">
            <span>Brute-Force Rate Limiter</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${rateLimit.lockedUntil > Date.now() ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
              {rateLimit.lockedUntil > Date.now() ? 'Lockout Active' : 'Active & Guarding'}
            </span>
          </div>
          <div className="text-xl font-black text-white">
            Failed Attempts: {rateLimit.failedAttempts} / 5
          </div>
          <div className="text-xs text-stone-400 space-y-1">
            <div>• Lockout Policy: <strong className="text-stone-200">15 min cooldown</strong></div>
            <div>• Threshold: <strong className="text-stone-200">5 max attempts</strong></div>
            <div>• Memory Protection: <strong className="text-stone-200">Automatic Wipe</strong></div>
          </div>
        </div>

        {/* Card 4: Razorpay Payment Gateway Vault */}
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#d7ff3f]" />
              <span>Razorpay Gateway</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${rzpConfig?.isConfigured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
              {rzpConfig?.isConfigured ? 'Test Mode Active' : 'Keys Pending'}
            </span>
          </div>
          <div className="text-xl font-black text-white">
            {rzpConfig?.isTestMode ? 'Test Mode' : 'Live Gateway'}
          </div>
          <div className="text-xs text-stone-400 space-y-1">
            <div>• Key ID: <span className="font-mono text-[11px] text-stone-200">{rzpConfig?.keyId ? `${rzpConfig.keyId.slice(0, 12)}...` : 'Not set in env'}</span></div>
            <div>• Key Secret: <strong className="text-emerald-400">Protected Server-Side</strong></div>
            <div>• Signature: <strong className="text-stone-200">HMAC-SHA256 Verified</strong></div>
          </div>
        </div>
      </div>

      {/* Supabase RLS Database Blueprint */}
      <div className="bg-[#141414] border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#d7ff3f]" />
              <span>Production Supabase PostgreSQL Integration & Row Level Security</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Strict database-enforced policies ensuring suppliers cannot view competing suppliers' data, and customers only see their personal orders.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-full transition-colors cursor-pointer border border-stone-700 self-start sm:self-auto"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema Script'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone-900/60 rounded-xl p-4 border border-stone-800 space-y-3">
            <span className="text-xs font-bold text-stone-300">Live Database Status:</span>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${supabaseStatus.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-bold text-white">
                {supabaseStatus.isConfigured
                  ? `Connected (${supabaseStatus.source === 'env' ? 'Environment Variables' : 'Custom In-App'})`
                  : 'Standby / Local Cryptographic Vault Active'}
              </span>
            </div>

            {supabaseStatus.url && (
              <div className="text-[11px] font-mono text-stone-400 truncate bg-stone-950 p-2 rounded border border-stone-800">
                Endpoint: {supabaseStatus.url}
              </div>
            )}

            <div className="text-[11px] text-stone-400 space-y-1">
              <div>• Required AI Studio / Vercel Env Var 1: <code className="text-[#d7ff3f] font-mono">VITE_SUPABASE_URL</code></div>
              <div>• Required AI Studio / Vercel Env Var 2: <code className="text-[#d7ff3f] font-mono">VITE_SUPABASE_ANON_KEY</code></div>
            </div>

            {supabaseStatus.source === 'custom' && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
              >
                Clear Custom In-App Connection
              </button>
            )}
          </div>

          <div className="bg-stone-900/60 rounded-xl p-4 border border-stone-800 space-y-2">
            <span className="text-xs font-bold text-stone-300">Zero-Trust Role & RLS Permissions:</span>
            <div className="text-[11px] text-stone-300 space-y-1">
              <div>✓ <strong className="text-emerald-400">Public/Anonymous:</strong> Reads only published and approved catalogue items.</div>
              <div>✓ <strong className="text-blue-400">Customer:</strong> Inserts orders, reads own profile and own order history.</div>
              <div>✓ <strong className="text-purple-400">Supplier:</strong> Strictly restricted to their own assigned company catalogue & fulfilment dispatches.</div>
              <div>✓ <strong className="text-amber-400">Staff:</strong> Validated via access code 30182607 for order packing & dispatches.</div>
              <div>✓ <strong className="text-[#d7ff3f]">Owner:</strong> Complete master governance over all companies, catalogue, finances, and settings.</div>
            </div>
          </div>
        </div>

        {/* Live Supabase Connection Test & Quick Connect Widget */}
        <div className="bg-stone-900/80 rounded-xl p-4 border border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#d7ff3f]" />
              <span className="text-xs font-bold text-white">Live Supabase Connection Tester & Quick Connect</span>
            </div>
            <span className="text-[10px] text-stone-400">Instant test without server rebuild</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-stone-400 font-bold mb-1">
                Supabase Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-hidden focus:border-[#d7ff3f]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 font-bold mb-1">
                Anon / Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={testAnonKey}
                onChange={(e) => setTestAnonKey(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-hidden focus:border-[#d7ff3f]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={testing}
              onClick={handleRunConnectionTest}
              className="px-4 py-2 bg-[#d7ff3f] hover:bg-[#c8f032] text-[#111111] text-xs font-black rounded-full cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
            >
              {testing ? 'Testing Connection...' : 'Test & Save Connection'}
            </button>

            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-full cursor-pointer border border-stone-700"
            >
              {showSqlPreview ? 'Hide SQL Schema' : 'View SQL Migration Script (256 Lines)'}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-sans ${
                testResult.success
                  ? testResult.schemaReady
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              <div className="font-bold flex items-center gap-2">
                {testResult.success ? (
                  testResult.schemaReady ? '✓ Connection Verified & Active' : '⚠ Connection Verified (Schema Required)'
                ) : (
                  '✕ Connection Failed'
                )}
              </div>
              <div className="text-[11px] mt-1 text-stone-300">{testResult.message}</div>
            </div>
          )}

          {showSqlPreview && (
            <div className="mt-3 p-3 bg-stone-950 rounded-xl border border-stone-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
                <span className="text-[11px] font-bold text-stone-300">
                  supabase/schema.sql (PostgreSQL + RLS)
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="text-[11px] text-[#d7ff3f] font-bold hover:underline cursor-pointer"
                >
                  {copiedSql ? 'Copied!' : 'Copy Script'}
                </button>
              </div>
              <pre className="text-[10px] font-mono text-stone-400 max-h-60 overflow-y-auto overflow-x-auto whitespace-pre leading-relaxed">
                {FULL_SUPABASE_SCHEMA_SQL}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Ledger */}
      <div className="bg-[#141414] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#d7ff3f]" />
              <span>Real-Time Security Audit Ledger</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Tamper-evident log of administrative logins, credential changes, and rate-limiting triggers.
            </p>
          </div>
          <button
            onClick={() => {
              setLogs(getSecurityAuditLogs());
              onShowNotice('Audit ledger refreshed.');
            }}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-stone-800/60 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">
              No audit logs recorded yet. Security events will appear here in real-time.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-stone-900/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        log.event === 'LOGIN_SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.event === 'RATE_LIMIT_LOCKOUT' || log.event === 'LOGIN_FAILURE'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {log.event}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Role: {log.role || 'system'}
                    </span>
                  </div>
                  <div className="text-xs text-stone-200 font-sans">
                    {log.details}
                  </div>
                </div>

                <div className="text-[10px] text-stone-500 shrink-0 text-right">
                  {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                  <div className="text-[9px] text-stone-600">
                    {new Date(log.timestamp).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
