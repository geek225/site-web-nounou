create extension if not exists pgcrypto;

create table if not exists site_settings (
  id integer primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  media jsonb,
  enabled boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists other_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  media jsonb,
  enabled boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists destinations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text,
  tags text[] not null default array[]::text[],
  media jsonb,
  enabled boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  avatar jsonb,
  enabled boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  ville text,
  commune text,
  quartier text,
  service_type text,
  option_name text,
  option_price text,
  raw jsonb,
  created_at timestamptz not null default now()
);
