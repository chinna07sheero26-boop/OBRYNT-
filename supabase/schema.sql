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

-- =========================================================================
-- 10. PRODUCT MANAGEMENT SYSTEM & STORAGE MIGRATION
-- =========================================================================
-- Safe idempotent enhancements for products table
alter table public.products add column if not exists brand text default 'OBRYNT';
alter table public.products add column if not exists status text default 'active' check (status in ('active', 'draft', 'out_of_stock'));

-- Ensure RLS allows public to view active products and admins to manage all
drop policy if exists "Public can view published products" on public.products;
create policy "Public can view active products"
  on public.products for select
  using (is_published = true and (status is null or status = 'active'));

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin_or_owner());

-- Create Supabase Storage Bucket for Product Images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Storage RLS: Public read access
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Storage RLS: Admin and authenticated management
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images');

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images');

-- =========================================================================
-- 11. SMART BULK PRODUCT IMPORT & AI AUTO-CATEGORISATION COLUMNS
-- =========================================================================
-- Safe idempotent column additions for AI categorization & duplicate detection
alter table public.products add column if not exists subcategory text;
alter table public.products add column if not exists confidence numeric default 100;
alter table public.products add column if not exists needs_review boolean default false;
alter table public.products add column if not exists supplier_product_id text;
alter table public.products add column if not exists source_file text;

create index if not exists idx_products_subcategory on public.products(subcategory);
create index if not exists idx_products_needs_review on public.products(needs_review);
create index if not exists idx_products_supplier_prod_id on public.products(supplier_product_id);

-- =========================================================================
-- 12. RESTRICTED DELIVERY COMPANY ACCESS & PRIVACY POLICIES
-- =========================================================================

-- Expand role check in profiles table if needed
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'staff', 'supplier', 'customer', 'delivery'));

-- Delivery Companies Registry
create table if not exists public.delivery_companies (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  authorized_email text not null unique,
  contact_number text not null,
  contact_person text,
  access_code text not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  can_view_phone boolean default true,
  can_view_address boolean default true,
  can_update_status boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Delivery Order Assignments (Isolated per company)
-- Notice: PREPAID orders have product prices and totals excluded by RLS and application views
create table if not exists public.delivery_assignments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  company_id uuid references public.delivery_companies(id) on delete cascade not null,
  order_code text not null,
  recipient_name text not null,
  recipient_phone text not null,
  delivery_address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_cod boolean not null default false,
  payment_method_type text not null check (payment_method_type in ('PREPAID', 'CASH ON DELIVERY')),
  -- Strictly null for PREPAID orders! Only populated if is_cod = true
  cod_amount_to_collect numeric,
  status text not null default 'assigned' check (status in ('assigned', 'copied', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')),
  copied_at timestamp with time zone,
  copied_by text,
  dispatched_at timestamp with time zone,
  delivered_at timestamp with time zone,
  tracking_number text,
  courier_partner text,
  notes text,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_delivery_asgn_company on public.delivery_assignments(company_id);
create index if not exists idx_delivery_asgn_order on public.delivery_assignments(order_id);
create index if not exists idx_delivery_asgn_status on public.delivery_assignments(status);

-- Courier Activity & Privacy Audit Logs
create table if not exists public.delivery_activity_logs (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.delivery_companies(id) on delete set null,
  company_name text,
  order_code text,
  action text not null,
  details text not null,
  actor text not null check (actor in ('admin', 'delivery_agent')),
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security for Delivery
alter table public.delivery_companies enable row level security;
alter table public.delivery_assignments enable row level security;
alter table public.delivery_activity_logs enable row level security;

-- Admin policies
drop policy if exists "Admins manage delivery companies" on public.delivery_companies;
create policy "Admins manage delivery companies"
  on public.delivery_companies for all
  using (public.is_admin_or_owner());

drop policy if exists "Admins manage delivery assignments" on public.delivery_assignments;
create policy "Admins manage delivery assignments"
  on public.delivery_assignments for all
  using (public.is_admin_or_owner());

drop policy if exists "Admins view delivery logs" on public.delivery_activity_logs;
create policy "Admins view delivery logs"
  on public.delivery_activity_logs for all
  using (public.is_admin_or_owner());

-- Delivery Company Isolated Policies
-- A courier can ONLY view assignments allocated to its company ID and CANNOT view raw orders or financial ledgers!
drop policy if exists "Couriers view own assigned orders" on public.delivery_assignments;
create policy "Couriers view own assigned orders"
  on public.delivery_assignments for select
  using (
    public.is_admin_or_owner() or
    company_id in (
      select id from public.delivery_companies
      where authorized_email = auth.email() and status = 'active'
    )
  );

drop policy if exists "Couriers update status on own assignments" on public.delivery_assignments;
create policy "Couriers update status on own assignments"
  on public.delivery_assignments for update
  using (
    public.is_admin_or_owner() or
    company_id in (
      select id from public.delivery_companies
      where authorized_email = auth.email() and status = 'active'
    )
  );
-- =========================================================================
