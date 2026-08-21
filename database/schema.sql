create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('investor','deal_owner','wtca_member','reviewer','administrator')),
  organisation text,
  country text,
  wtca_membership_number text,
  wtca_chapter text,
  wtca_chapter_country text,
  job_title text,
  kyc_status text not null default 'pending' check (kyc_status in ('pending','in_review','verified','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table users add column if not exists wtca_membership_number text;
alter table users add column if not exists wtca_chapter text;
alter table users add column if not exists wtca_chapter_country text;
alter table users add column if not exists job_title text;
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('investor','deal_owner','wtca_member','reviewer','administrator'));

create unique index if not exists users_wtca_membership_number_idx
  on users (wtca_membership_number)
  where wtca_membership_number is not null;

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_name text not null,
  participant_type text not null check (participant_type in ('investor','company','wtca_member')),
  status text not null default 'pending' check (status in ('pending','trial','active','past_due','cancelled')),
  starts_at timestamptz,
  renews_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table memberships drop constraint if exists memberships_participant_type_check;
alter table memberships add constraint memberships_participant_type_check check (participant_type in ('investor','company','wtca_member'));

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

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  investor_id uuid not null references users(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  equity_requested numeric(6,3) check (equity_requested >= 0 and equity_requested <= 100),
  bid_type text not null check (bid_type in ('soft_commit','hard_bid')),
  investment_horizon_years integer check (investment_horizon_years between 1 and 30),
  escrow_reference text,
  status text not null default 'submitted' check (status in ('draft','submitted','under_review','countered','accepted','declined','withdrawn','in_escrow','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bids_deal_status_idx on bids (deal_id, status, created_at desc);

create table if not exists news_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references users(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text not null,
  body text not null,
  category text not null,
  image_url text,
  status text not null default 'draft' check (status in ('draft','in_review','published','archived')),
  is_sponsored boolean not null default false,
  sponsor_name text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_sponsored or sponsor_name is not null)
);

create index if not exists news_publication_idx on news_posts (status, published_at desc);

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
