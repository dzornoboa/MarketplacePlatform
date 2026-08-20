create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('investor','deal_owner','reviewer','administrator')),
  organisation text,
  country text,
  kyc_status text not null default 'pending' check (kyc_status in ('pending','in_review','verified','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text not null,
  description text,
  sector text not null,
  stage text not null,
  country text not null,
  city text,
  target_amount numeric(18,2) not null check (target_amount > 0),
  committed_amount numeric(18,2) not null default 0 check (committed_amount >= 0),
  minimum_ticket numeric(18,2) not null default 0 check (minimum_ticket >= 0),
  currency char(3) not null default 'USD',
  contact_name text not null,
  contact_email text not null,
  status text not null default 'draft' check (status in ('draft','submitted','in_review','published','paused','closed','rejected')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deals_marketplace_idx on deals (status, featured desc, published_at desc);
create index if not exists deals_filters_idx on deals (sector, stage, country);

create table if not exists expressions_of_interest (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  investor_id uuid references users(id) on delete set null,
  investor_name text not null,
  investor_email text not null,
  organisation text,
  message text,
  status text not null default 'new' check (status in ('new','qualified','meeting','diligence','declined','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  name text not null,
  storage_key text not null unique,
  visibility text not null default 'nda' check (visibility in ('public','nda','restricted')),
  uploaded_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id bigserial primary key,
  actor_id uuid references users(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
