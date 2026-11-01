-- =========================================================================
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

-- 6. SUPPLIER FULFILMENT REQUESTS (SEPARATE ISOLATED VIEWS PER SUPPLIER)
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

-- PROFILES:
-- Users can view their own profile; Owners/Admins can view all profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin_or_owner());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- PRODUCTS:
-- Public can view published products; Owners can manage all products
create policy "Public can view published products"
  on public.products for select
  using (is_published = true and is_approved = true);

create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin_or_owner());

-- SUPPLIERS:
-- Only admins can see and manage suppliers; A supplier can view their own record
create policy "Suppliers can view own record"
  on public.suppliers for select
  using (
    public.is_admin_or_owner() or
    id in (select supplier_id from public.profiles where id = auth.uid() and role = 'supplier')
  );

create policy "Admins can manage suppliers"
  on public.suppliers for all
  using (public.is_admin_or_owner());

-- ORDERS:
-- Customers view their own orders; Admins view all orders; Suppliers CANNOT view raw orders
create policy "Customers view own orders"
  on public.orders for select
  using (customer_id = auth.uid() or public.is_admin_or_owner());

create policy "Customers insert orders"
  on public.orders for insert
  with check (auth.uid() is not null or public.is_admin_or_owner());

create policy "Admins manage orders"
  on public.orders for all
  using (public.is_admin_or_owner());

-- SUPPLIER FULFILMENTS:
-- STRICT ISOLATION: A supplier can ONLY view and update their OWN fulfilment requests!
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

-- AUDIT LOGS:
-- Only Owners and Admins can view audit logs; append-only
create policy "Admins view audit logs"
  on public.audit_logs for select
  using (public.is_admin_or_owner());

-- =========================================================================
-- 9. SUPABASE AUTH OWNER CREDENTIAL SETUP PROCEDURE
-- =========================================================================
-- Owner Email: chinna07sheero.26@gmail.com
-- To set or update the owner password to "chinnasheero3026" via Supabase Auth:
-- Method 1 (Supabase Dashboard):
--   1. Go to Authentication -> Users.
--   2. Click on chinna07sheero.26@gmail.com -> "Edit User" -> "Update Password".
--   3. Enter the owner password: chinnasheero3026
-- Method 2 (SQL Editor with pgcrypto bcrypt hash - never plain text):
--   update auth.users
--   set encrypted_password = crypt('chinnasheero3026', gen_salt('bf'))
--   where email = 'chinna07sheero.26@gmail.com';
-- =========================================================================
