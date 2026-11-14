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
-- 13. COMPANY MANAGEMENT & STAFF ACCESS (PART A)
-- Roles: 'owner' manages; 'company_staff' accesses isolated orders
-- =========================================================================
create table if not exists public.companies (
  id text primary key, -- Unique company identity e.g. 'COMP-MEESHO-101'
  name text not null, -- Company Name e.g. Meesho, Amazon, Flipkart
  contact_person text not null,
  email text not null,
  phone text not null,
  address text,
  password_hash text not null, -- Cryptographically hashed password
  status text not null default 'active' check (status in ('active', 'suspended')),
  assigned_products text[] default array[]::text[],
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_companies_status on public.companies(status);

-- 14. COMPANY ORDER ASSIGNMENTS
create table if not exists public.company_order_assignments (
  id uuid default uuid_generate_v4() primary key,
  company_id text references public.companies(id) on delete cascade,
  order_id text not null,
  order_date text not null,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  product_name text not null,
  product_sku text not null,
  product_image_url text not null,
  quantity integer not null default 1,
  size text default 'Standard',
  color text default 'Standard',
  packing_status text not null default 'Pending' check (packing_status in ('Pending', 'In Packing', 'Packed')),
  dispatch_status text not null default 'Pending' check (dispatch_status in ('Pending', 'Dispatched')),
  fulfillment_status text not null default 'Order received' check (fulfillment_status in ('Order received', 'Packing', 'Packed', 'Dispatched')),
  status_updated_at timestamp with time zone default timezone('utc'::text, now()),
  notes text,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_company_asgn_comp on public.company_order_assignments(company_id);
create index if not exists idx_company_asgn_order on public.company_order_assignments(order_id);

-- 15. FACTORY PARTNER REGISTRATION & INVITATIONS (PART B)
create table if not exists public.factory_partners (
  id text primary key, -- Unique factory identity e.g. 'FAC-ATELIER-101'
  name text not null, -- Factory Name
  owner_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  access_key_hash text not null,
  invitation_token text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'deactivated')),
  capacity text,
  specialization text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_factory_invite on public.factory_partners(invitation_token);
create index if not exists idx_factory_status on public.factory_partners(status);

-- 16. FACTORY PRODUCT SUBMISSIONS & OWNER APPROVAL WORKFLOW
create table if not exists public.factory_submissions (
  id uuid default uuid_generate_v4() primary key,
  factory_id text references public.factory_partners(id) on delete cascade,
  factory_name text not null,
  product_name text not null,
  description text not null,
  category text not null,
  subcategory text not null,
  images text[] not null default array[]::text[],
  factory_quotation numeric not null,
  final_selling_price numeric, -- Set by OBRYNT Owner upon approval
  sizes text[] not null default array['S', 'M', 'L', 'XL']::text[],
  colors text[] not null default array['#171717']::text[],
  stock_quantity integer not null default 100,
  material_fabric text not null,
  sku text not null,
  moq integer not null default 50,
  status text not null default 'pending_approval' check (status in ('pending_approval', 'approved', 'rejected', 'needs_revision')),
  review_notes text,
  published_product_sku text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone,
  reviewed_by text
);

create index if not exists idx_factory_sub_factory on public.factory_submissions(factory_id);
create index if not exists idx_factory_sub_status on public.factory_submissions(status);

-- 17. ROW LEVEL SECURITY (RLS) FOR COMPANIES & FACTORIES
alter table public.companies enable row level security;
alter table public.company_order_assignments enable row level security;
alter table public.factory_partners enable row level security;
alter table public.factory_submissions enable row level security;

-- Admin policies (Owner has full access)
drop policy if exists "Admins manage companies" on public.companies;
create policy "Admins manage companies" on public.companies for all using (public.is_admin_or_owner());

drop policy if exists "Admins manage company order assignments" on public.company_order_assignments;
create policy "Admins manage company order assignments" on public.company_order_assignments for all using (public.is_admin_or_owner());

drop policy if exists "Admins manage factory partners" on public.factory_partners;
create policy "Admins manage factory partners" on public.factory_partners for all using (public.is_admin_or_owner());

drop policy if exists "Admins manage factory submissions" on public.factory_submissions;
create policy "Admins manage factory submissions" on public.factory_submissions for all using (public.is_admin_or_owner());

-- Company Staff Isolated Policies (Can ONLY view/update assigned orders for their authenticated company)
drop policy if exists "Company staff view assigned orders only" on public.company_order_assignments;
create policy "Company staff view assigned orders only"
  on public.company_order_assignments for select
  using (
    public.is_admin_or_owner() or
    company_id = current_setting('request.jwt.claims', true)::json->>'company_id'
  );

drop policy if exists "Company staff update fulfilment status on assigned orders" on public.company_order_assignments;
create policy "Company staff update fulfilment status on assigned orders"
  on public.company_order_assignments for update
  using (
    public.is_admin_or_owner() or
    company_id = current_setting('request.jwt.claims', true)::json->>'company_id'
  );

-- Factory Partners Isolated Policies (Can ONLY view/create their own submissions)
drop policy if exists "Factory view own profile" on public.factory_partners;
create policy "Factory view own profile"
  on public.factory_partners for select
  using (
    public.is_admin_or_owner() or
    id = current_setting('request.jwt.claims', true)::json->>'factory_id'
  );

drop policy if exists "Factory view own submissions" on public.factory_submissions;
create policy "Factory view own submissions"
  on public.factory_submissions for select
  using (
    public.is_admin_or_owner() or
    factory_id = current_setting('request.jwt.claims', true)::json->>'factory_id'
  );

drop policy if exists "Factory submit products" on public.factory_submissions;
create policy "Factory submit products"
  on public.factory_submissions for insert
  with check (
    public.is_admin_or_owner() or
    factory_id = current_setting('request.jwt.claims', true)::json->>'factory_id'
  );

-- =========================================================================
-- 18. SMART BULK IMPORT & STAGING ENGINE (100,000+ CATALOGUE CAPACITY)
-- =========================================================================

create table if not exists public.import_batches (
  id text primary key, -- e.g. 'BATCH-2026-X1'
  name text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text,
  source_type text not null check (source_type in ('single_url', 'bulk_urls', 'file', 'supplier_feed', 'demo')),
  total_products integer not null default 0,
  approved_count integer not null default 0,
  pending_count integer not null default 0,
  rejected_count integer not null default 0,
  duplicates_count integer not null default 0,
  status text not null default 'pending_review' check (status in ('pending_review', 'partially_approved', 'completed', 'failed')),
  error_log jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_import_batches_status on public.import_batches(status);
create index if not exists idx_import_batches_supplier on public.import_batches(supplier_id);
create index if not exists idx_import_batches_created on public.import_batches(created_at desc);

create table if not exists public.import_staging_products (
  id uuid default uuid_generate_v4() primary key,
  batch_id text references public.import_batches(id) on delete cascade not null,
  sku text not null,
  product_name text not null,
  description text,
  category text not null,
  subcategory text,
  brand text default 'OBRYNT',
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text,
  source_url text,
  supplier_cost numeric not null default 0, -- Private to owner
  suggested_price numeric not null default 0,
  final_selling_price numeric, -- Set by owner upon approval
  margin_pct numeric,
  stock_quantity integer not null default 50,
  image_urls text[] default array[]::text[],
  sizes text[] default array['S', 'M', 'L', 'XL']::text[],
  colors text[] default array['#171717']::text[],
  variants jsonb default '[]'::jsonb,
  material text,
  confidence numeric default 90.0,
  is_duplicate boolean default false,
  duplicate_of_sku text,
  missing_fields text[] default array[]::text[],
  approval_status text not null default 'pending_approval' check (approval_status in ('pending_approval', 'approved', 'rejected')),
  published_product_id uuid references public.products(id) on delete set null,
  raw_payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_staging_batch on public.import_staging_products(batch_id);
create index if not exists idx_staging_sku on public.import_staging_products(sku);
create index if not exists idx_staging_status on public.import_staging_products(approval_status);
create index if not exists idx_staging_dup on public.import_staging_products(is_duplicate);

-- Compound index on products for lightning-fast cursor pagination at 100k+ scale
create index if not exists idx_products_fast_paginate on public.products(is_published, category, created_at desc);

-- RLS: Strict Owner & Admin Isolation for Staging & Batches
alter table public.import_batches enable row level security;
alter table public.import_staging_products enable row level security;

drop policy if exists "Admins manage import batches" on public.import_batches;
create policy "Admins manage import batches" on public.import_batches for all using (public.is_admin_or_owner());

drop policy if exists "Admins manage staging products" on public.import_staging_products;
create policy "Admins manage staging products" on public.import_staging_products for all using (public.is_admin_or_owner());
-- =========================================================================

-- =========================================================================
-- 19. DUKANI (SHOP OWNER) & SELLER MULTI-VENDOR MARKETPLACE SCHEMA & RLS
-- =========================================================================

-- Expand profiles roles to cover SUPER_ADMIN, SHOP_OWNER, SELLER, DELIVERY_PARTNER, CUSTOMER
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'super_admin', 'shop_owner', 'seller', 'delivery_partner', 'delivery', 'staff', 'supplier', 'customer'));
alter table public.profiles add column if not exists vendor_id uuid;
alter table public.profiles add column if not exists status text default 'active';

-- 19.1 VENDOR PROFILES (Admin-provisioned only; public vendor registration prohibited)
create table if not exists public.vendor_profiles (
  id uuid default uuid_generate_v4() primary key,
  vendor_code text not null unique, -- e.g. 'DUK-1001' or 'SEL-1001'
  auth_user_id uuid references auth.users(id) on delete set null,
  account_type text not null check (account_type in ('SHOP_OWNER', 'SELLER')),
  full_name text not null,
  business_name text not null,
  email text not null unique,
  phone text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended', 'blocked')),
  password_hash text not null, -- scrypt/bcrypt hash only, never plaintext
  gst_number text,
  bank_account_holder text,
  bank_account_masked text,
  bank_ifsc text,
  upi_id text,
  commission_mode text not null default 'percentage' check (commission_mode in ('percentage', 'fixed', 'percentage_plus_fixed')),
  commission_rate numeric not null default 10.00,
  fixed_commission numeric not null default 0,
  pickup_address text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_profiles_code on public.vendor_profiles(vendor_code);
create index if not exists idx_vendor_profiles_type on public.vendor_profiles(account_type);
create index if not exists idx_vendor_profiles_status on public.vendor_profiles(status);
create index if not exists idx_vendor_profiles_auth on public.vendor_profiles(auth_user_id);

-- 19.2 VENDOR SHOPS (Physical Dukani clothing stores linked to SHOP_OWNER)
create table if not exists public.vendor_shops (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references public.vendor_profiles(id) on delete cascade not null unique,
  shop_name text not null,
  owner_name text not null,
  shop_address text not null default '',
  city text default '',
  state text default '',
  pincode text default '',
  contact_number text not null default '',
  shop_photos text[] default array[]::text[],
  gst_number text,
  opening_hours text default '10:00 AM - 9:00 PM',
  pickup_address text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_shops_vendor on public.vendor_shops(vendor_id);

-- 19.3 VENDOR PRODUCTS & APPROVAL WORKFLOW
create table if not exists public.vendor_products (
  id uuid default uuid_generate_v4() primary key,
  product_code text not null unique,
  vendor_id uuid references public.vendor_profiles(id) on delete cascade not null,
  vendor_type text not null check (vendor_type in ('SHOP_OWNER', 'SELLER')),
  shop_id uuid references public.vendor_shops(id) on delete set null,
  published_product_id uuid references public.products(id) on delete set null,
  name text not null,
  description text default '',
  category text not null,
  subcategory text,
  audience text default 'Unisex',
  images text[] not null default array[]::text[],
  video_url text,
  original_price numeric not null default 0,
  supplier_price numeric not null default 0,
  selling_price numeric not null default 0,
  commission_override_mode text check (commission_override_mode in ('percentage', 'fixed', 'percentage_plus_fixed')),
  commission_override_rate numeric,
  commission_override_fixed numeric,
  total_stock integer not null default 0,
  sizes text[] default array['S', 'M', 'L', 'XL']::text[],
  colors text[] default array['Pitch Black']::text[],
  material text,
  approval_status text not null default 'pending_approval' check (approval_status in ('draft', 'pending_approval', 'approved', 'rejected', 'out_of_stock', 'disabled')),
  rejection_reason text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()),
  reviewed_at timestamp with time zone,
  reviewed_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_products_vendor on public.vendor_products(vendor_id);
create index if not exists idx_vendor_products_status on public.vendor_products(approval_status);
create index if not exists idx_vendor_products_category on public.vendor_products(category);
create index if not exists idx_vendor_products_published on public.vendor_products(published_product_id);

-- Connect central products table cleanly without duplication
alter table public.products add column if not exists vendor_id uuid references public.vendor_profiles(id) on delete set null;
alter table public.products add column if not exists vendor_type text;
alter table public.products add column if not exists shop_id uuid references public.vendor_shops(id) on delete set null;
alter table public.products add column if not exists approval_status text default 'approved';
create index if not exists idx_products_vendor on public.products(vendor_id);
create index if not exists idx_products_approval on public.products(approval_status);

-- 19.4 PRODUCT VARIANTS
create table if not exists public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  vendor_product_id uuid references public.vendor_products(id) on delete cascade not null,
  sku text not null,
  size text not null default 'Free Size',
  color text not null default 'Default',
  color_hex text default '#171717',
  original_price numeric default 0,
  supplier_price numeric not null default 0,
  selling_price numeric not null default 0,
  stock integer not null default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_product_variants_product on public.product_variants(vendor_product_id);
create index if not exists idx_product_variants_sku on public.product_variants(sku);

-- 19.5 VENDOR INVENTORY LEDGER
create table if not exists public.vendor_inventory (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references public.vendor_profiles(id) on delete cascade not null,
  vendor_product_id uuid references public.vendor_products(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete cascade,
  sku text not null,
  available_stock integer not null default 0,
  reserved_stock integer not null default 0,
  low_stock_threshold integer not null default 10,
  last_restocked_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_inventory_vendor on public.vendor_inventory(vendor_id);
create index if not exists idx_vendor_inventory_product on public.vendor_inventory(vendor_product_id);

-- 19.6 VENDOR SUBORDERS (Order Distribution Split per Vendor from Parent Order)
create table if not exists public.vendor_orders (
  id uuid default uuid_generate_v4() primary key,
  suborder_code text not null unique, -- e.g. 'SUB-OB-9821-01'
  parent_order_id uuid references public.orders(id) on delete set null,
  parent_order_code text not null,
  vendor_id uuid references public.vendor_profiles(id) on delete restrict not null,
  vendor_type text not null check (vendor_type in ('SHOP_OWNER', 'SELLER')),
  shop_id uuid references public.vendor_shops(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  delivery_address jsonb not null,
  pickup_address text not null default '',
  payment_mode text not null check (payment_mode in ('PREPAID', 'COD')),
  cod_amount_to_collect numeric default 0,
  subtotal_selling_price numeric not null default 0,
  total_supplier_price numeric not null default 0,
  obrynt_commission numeric not null default 0,
  applicable_fees numeric not null default 0,
  vendor_payable_amount numeric not null default 0,
  stock_confirmed boolean not null default false,
  status text not null default 'pending_acceptance' check (status in ('pending_acceptance', 'accepted', 'rejected', 'processing', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'returned')),
  rejection_reason text,
  delivery_assignment_id uuid,
  tracking_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_orders_vendor on public.vendor_orders(vendor_id);
create index if not exists idx_vendor_orders_parent on public.vendor_orders(parent_order_code);
create index if not exists idx_vendor_orders_status on public.vendor_orders(status);

-- 19.7 VENDOR ORDER ITEMS
create table if not exists public.vendor_order_items (
  id uuid default uuid_generate_v4() primary key,
  vendor_order_id uuid references public.vendor_orders(id) on delete cascade not null,
  vendor_product_id uuid references public.vendor_products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text not null,
  product_name text not null,
  size text,
  color text,
  quantity integer not null default 1,
  supplier_price numeric not null default 0,
  selling_price numeric not null default 0,
  obrynt_commission numeric not null default 0,
  applicable_fees numeric not null default 0,
  vendor_payable numeric not null default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_order_items_order on public.vendor_order_items(vendor_order_id);

-- 19.8 VENDOR COMMISSIONS (Admin-Controlled Rules: Global, Vendor-Specific, Product-Specific)
create table if not exists public.vendor_commissions (
  id uuid default uuid_generate_v4() primary key,
  scope text not null check (scope in ('global', 'vendor', 'product')),
  vendor_id uuid references public.vendor_profiles(id) on delete cascade,
  vendor_product_id uuid references public.vendor_products(id) on delete cascade,
  commission_mode text not null default 'percentage' check (commission_mode in ('percentage', 'fixed', 'percentage_plus_fixed')),
  percentage_rate numeric not null default 10.00,
  fixed_amount numeric not null default 0,
  platform_fee_pct numeric not null default 2.00,
  is_active boolean not null default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_commissions_scope on public.vendor_commissions(scope, vendor_id, vendor_product_id);

-- 19.9 VENDOR SETTLEMENTS LEDGER (Manual Admin Settlement Only)
create table if not exists public.vendor_settlements (
  id uuid default uuid_generate_v4() primary key,
  settlement_code text not null unique,
  vendor_id uuid references public.vendor_profiles(id) on delete restrict not null,
  vendor_order_id uuid references public.vendor_orders(id) on delete cascade not null,
  suborder_code text not null,
  gross_selling_amount numeric not null default 0,
  supplier_agreed_amount numeric not null default 0,
  obrynt_commission numeric not null default 0,
  applicable_fees numeric not null default 0,
  net_vendor_payable numeric not null default 0,
  settlement_status text not null default 'pending' check (settlement_status in ('pending', 'eligible', 'on_hold', 'settled', 'cancelled')),
  payment_reference text,
  settled_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_settlements_vendor on public.vendor_settlements(vendor_id);
create index if not exists idx_vendor_settlements_status on public.vendor_settlements(settlement_status);

-- 19.10 VENDOR ACTIVITY LOGS
create table if not exists public.vendor_activity_logs (
  id uuid default uuid_generate_v4() primary key,
  actor_id text,
  actor_role text not null,
  vendor_id uuid references public.vendor_profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vendor_logs_vendor on public.vendor_activity_logs(vendor_id);
create index if not exists idx_vendor_logs_created on public.vendor_activity_logs(created_at desc);

-- =========================================================================
-- MULTI-VENDOR ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.vendor_profiles enable row level security;
alter table public.vendor_shops enable row level security;
alter table public.vendor_products enable row level security;
alter table public.product_variants enable row level security;
alter table public.vendor_inventory enable row level security;
alter table public.vendor_orders enable row level security;
alter table public.vendor_order_items enable row level security;
alter table public.vendor_commissions enable row level security;
alter table public.vendor_settlements enable row level security;
alter table public.vendor_activity_logs enable row level security;

create or replace function public.is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('owner', 'admin', 'super_admin')
  );
end;
$$ language plpgsql security definer;

create or replace function public.current_active_vendor_id()
returns uuid as $$
begin
  return (
    select id from public.vendor_profiles
    where auth_user_id = auth.uid()
      and status = 'active'
    limit 1
  );
end;
$$ language plpgsql security definer;

-- Admin full access + strict vendor self-isolation
drop policy if exists "Admin manages vendor profiles" on public.vendor_profiles;
create policy "Admin manages vendor profiles" on public.vendor_profiles for all using (public.is_super_admin());
drop policy if exists "Vendor reads own profile" on public.vendor_profiles;
create policy "Vendor reads own profile" on public.vendor_profiles for select using (auth_user_id = auth.uid() and status = 'active');

drop policy if exists "Admin manages vendor shops" on public.vendor_shops;
create policy "Admin manages vendor shops" on public.vendor_shops for all using (public.is_super_admin());
drop policy if exists "Vendor manages own shop" on public.vendor_shops;
create policy "Vendor manages own shop" on public.vendor_shops for all using (vendor_id = public.current_active_vendor_id());

drop policy if exists "Admin manages vendor products" on public.vendor_products;
create policy "Admin manages vendor products" on public.vendor_products for all using (public.is_super_admin());
drop policy if exists "Vendor manages own products" on public.vendor_products;
create policy "Vendor manages own products" on public.vendor_products for all
  using (vendor_id = public.current_active_vendor_id())
  with check (vendor_id = public.current_active_vendor_id());

drop policy if exists "Admin manages product variants" on public.product_variants;
create policy "Admin manages product variants" on public.product_variants for all using (public.is_super_admin());
drop policy if exists "Vendor manages own variants" on public.product_variants;
create policy "Vendor manages own variants" on public.product_variants for all
  using (vendor_product_id in (select id from public.vendor_products where vendor_id = public.current_active_vendor_id()));

drop policy if exists "Admin manages vendor inventory" on public.vendor_inventory;
create policy "Admin manages vendor inventory" on public.vendor_inventory for all using (public.is_super_admin());
drop policy if exists "Vendor manages own inventory" on public.vendor_inventory;
create policy "Vendor manages own inventory" on public.vendor_inventory for all
  using (vendor_id = public.current_active_vendor_id());

drop policy if exists "Admin manages vendor orders" on public.vendor_orders;
create policy "Admin manages vendor orders" on public.vendor_orders for all using (public.is_super_admin());
drop policy if exists "Vendor views and updates own suborders" on public.vendor_orders;
create policy "Vendor views and updates own suborders" on public.vendor_orders for select
  using (vendor_id = public.current_active_vendor_id());
drop policy if exists "Vendor updates status on own suborders" on public.vendor_orders;
create policy "Vendor updates status on own suborders" on public.vendor_orders for update
  using (vendor_id = public.current_active_vendor_id());

drop policy if exists "Admin manages vendor order items" on public.vendor_order_items;
create policy "Admin manages vendor order items" on public.vendor_order_items for all using (public.is_super_admin());
drop policy if exists "Vendor views own suborder items" on public.vendor_order_items;
create policy "Vendor views own suborder items" on public.vendor_order_items for select
  using (vendor_order_id in (select id from public.vendor_orders where vendor_id = public.current_active_vendor_id()));

drop policy if exists "Admin manages commissions" on public.vendor_commissions;
create policy "Admin manages commissions" on public.vendor_commissions for all using (public.is_super_admin());
drop policy if exists "Vendor reads own commission rules" on public.vendor_commissions;
create policy "Vendor reads own commission rules" on public.vendor_commissions for select
  using (scope = 'global' or vendor_id = public.current_active_vendor_id());

drop policy if exists "Admin manages settlements" on public.vendor_settlements;
create policy "Admin manages settlements" on public.vendor_settlements for all using (public.is_super_admin());
drop policy if exists "Vendor reads own settlements" on public.vendor_settlements;
create policy "Vendor reads own settlements" on public.vendor_settlements for select
  using (vendor_id = public.current_active_vendor_id());

drop policy if exists "Admin manages vendor logs" on public.vendor_activity_logs;
create policy "Admin manages vendor logs" on public.vendor_activity_logs for all using (public.is_super_admin());
drop policy if exists "Vendor reads own logs" on public.vendor_activity_logs;
create policy "Vendor reads own logs" on public.vendor_activity_logs for select
  using (vendor_id = public.current_active_vendor_id());

-- Ensure public storefront only sees approved active vendor products
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
  on public.products for select
  using (
    is_published = true
    and (status is null or status = 'active')
    and (approval_status is null or approval_status = 'approved')
  );

-- =========================================================================
-- 20. THREE-TYPE PARTNER REGISTRATION, APPROVAL & PRIVATE STAFF LOGIN
-- Extends existing tables cleanly without duplicating partners/products/orders
-- =========================================================================

-- Expand profiles roles to cover three partner categories and private shop staff roles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in (
    'owner', 'admin', 'super_admin',
    'shop_owner', 'seller',
    'existing_supplier', 'garment_shop', 'roadside_store',
    'garment_staff', 'roadside_staff',
    'delivery_partner', 'delivery', 'staff', 'supplier', 'customer'
  ));

-- Extend vendor_profiles for Option A (Existing URL) / Option B (New Registration) & Approval Workflow
alter table public.vendor_profiles alter column email drop not null;
alter table public.vendor_profiles add column if not exists partner_category text not null default 'GARMENT_SHOP'
  check (partner_category in ('EXISTING_SUPPLIER', 'GARMENT_SHOP', 'ROADSIDE_STORE'));
alter table public.vendor_profiles add column if not exists registration_option text not null default 'ADMIN_CREATED'
  check (registration_option in ('OPTION_A_EXISTING_URL', 'OPTION_B_NEW_PARTNER', 'ADMIN_CREATED'));
alter table public.vendor_profiles add column if not exists existing_website_url text;
alter table public.vendor_profiles add column if not exists application_status text not null default 'pending'
  check (application_status in ('pending', 'approved', 'rejected', 'more_info_requested'));
alter table public.vendor_profiles add column if not exists rejection_reason text;
alter table public.vendor_profiles add column if not exists info_request_message text;
alter table public.vendor_profiles add column if not exists registration_link_id uuid;
alter table public.vendor_profiles add column if not exists approved_at timestamp with time zone;
alter table public.vendor_profiles add column if not exists approved_by text;

create index if not exists idx_vendor_profiles_partner_category on public.vendor_profiles(partner_category);
create index if not exists idx_vendor_profiles_app_status on public.vendor_profiles(application_status);
create index if not exists idx_vendor_profiles_phone on public.vendor_profiles(phone);

-- 20.1 EXPIRING TOKENIZED PARTNER REGISTRATION LINKS
create table if not exists public.partner_registration_links (
  id uuid default uuid_generate_v4() primary key,
  token_hash text not null unique,
  partner_category text check (partner_category in ('EXISTING_SUPPLIER', 'GARMENT_SHOP', 'ROADSIDE_STORE', 'ANY')),
  registration_option text default 'BOTH' check (registration_option in ('OPTION_A_EXISTING_URL', 'OPTION_B_NEW_PARTNER', 'BOTH')),
  intended_business_name text,
  created_by text not null,
  expires_at timestamp with time zone not null,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_partner_reg_links_token on public.partner_registration_links(token_hash);
create index if not exists idx_partner_reg_links_status on public.partner_registration_links(status);

-- 20.2 PRIVATE SHOP STAFF ACCOUNTS (GARMENT_SHOP & ROADSIDE_STORE ONLY — ZERO PUBLIC DIRECTORY)
create table if not exists public.partner_staff_accounts (
  id uuid default uuid_generate_v4() primary key,
  staff_code text not null unique,
  auth_user_id uuid references auth.users(id) on delete set null,
  vendor_id uuid references public.vendor_profiles(id) on delete cascade not null,
  staff_category text not null check (staff_category in ('GARMENT_SHOP', 'ROADSIDE_STORE')),
  staff_label text not null default 'Store Staff',
  password_hash text not null,
  access_token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  last_login_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_partner_staff_vendor on public.partner_staff_accounts(vendor_id);
create index if not exists idx_partner_staff_category on public.partner_staff_accounts(staff_category);
create index if not exists idx_partner_staff_token on public.partner_staff_accounts(access_token_hash);

-- 20.3 PARTNER & ADMIN APPROVAL NOTIFICATIONS
create table if not exists public.partner_notifications (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references public.vendor_profiles(id) on delete cascade,
  recipient_role text not null check (recipient_role in ('ADMIN', 'PARTNER')),
  title text not null,
  message text not null,
  action_url text,
  is_read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_partner_notifs_role on public.partner_notifications(recipient_role, is_read);
create index if not exists idx_partner_notifs_vendor on public.partner_notifications(vendor_id);

-- RLS ENFORCEMENT FOR NEW PARTNER REGISTRATION, STAFF & NOTIFICATION TABLES
alter table public.partner_registration_links enable row level security;
alter table public.partner_staff_accounts enable row level security;
alter table public.partner_notifications enable row level security;

create or replace function public.current_active_staff_vendor_id()
returns uuid as $$
begin
  return (
    select psa.vendor_id
    from public.partner_staff_accounts psa
    join public.vendor_profiles vp on vp.id = psa.vendor_id
    where psa.auth_user_id = auth.uid()
      and psa.status = 'active'
      and vp.status = 'active'
      and vp.application_status = 'approved'
    limit 1
  );
end;
$$ language plpgsql security definer;

-- Only Super Admin can list/manage registration links (no unauthenticated/public directory)
drop policy if exists "Admin manages registration links" on public.partner_registration_links;
create policy "Admin manages registration links"
  on public.partner_registration_links for all
  using (public.is_super_admin());

-- Strict zero-directory privacy on staff accounts
drop policy if exists "Admin manages staff accounts" on public.partner_staff_accounts;
create policy "Admin manages staff accounts"
  on public.partner_staff_accounts for all
  using (public.is_super_admin());

drop policy if exists "Staff reads own account only" on public.partner_staff_accounts;
create policy "Staff reads own account only"
  on public.partner_staff_accounts for select
  using (auth_user_id = auth.uid() and status = 'active');

-- Notifications: Admin views Admin alerts; active Vendor views own notifications
drop policy if exists "Admin manages partner notifications" on public.partner_notifications;
create policy "Admin manages partner notifications"
  on public.partner_notifications for all
  using (public.is_super_admin());

drop policy if exists "Vendor reads own notifications" on public.partner_notifications;
create policy "Vendor reads own notifications"
  on public.partner_notifications for select
  using (recipient_role = 'PARTNER' and vendor_id = public.current_active_vendor_id());

-- Extend Vendor RLS so unapproved/pending vendors cannot manage products or view orders
drop policy if exists "Vendor reads own profile" on public.vendor_profiles;
create policy "Vendor reads own profile"
  on public.vendor_profiles for select
  using (auth_user_id = auth.uid() and status = 'active' and application_status = 'approved');

-- Allow active shop staff to access ONLY products and orders assigned to their single shop
drop policy if exists "Shop staff views assigned shop products" on public.vendor_products;
create policy "Shop staff views assigned shop products"
  on public.vendor_products for select
  using (vendor_id = public.current_active_staff_vendor_id());

drop policy if exists "Shop staff updates stock on assigned shop products" on public.vendor_products;
create policy "Shop staff updates stock on assigned shop products"
  on public.vendor_products for update
  using (vendor_id = public.current_active_staff_vendor_id());

drop policy if exists "Shop staff views assigned shop orders" on public.vendor_orders;
create policy "Shop staff views assigned shop orders"
  on public.vendor_orders for select
  using (vendor_id = public.current_active_staff_vendor_id());

drop policy if exists "Shop staff updates assigned shop orders" on public.vendor_orders;
create policy "Shop staff updates assigned shop orders"
  on public.vendor_orders for update
  using (vendor_id = public.current_active_staff_vendor_id());




