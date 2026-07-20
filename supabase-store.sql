-- Karagümrük Hentbol club store
-- Run in Supabase SQL Editor. Safe to run again.

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  name_tr text not null,
  name_en text,
  description_tr text,
  description_en text,
  category text not null default 'other',
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  image_url text,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  city text,
  note text,
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer','cash_on_delivery','whatsapp')),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  status text not null default 'new' check (status in ('new','preparing','shipped','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.store_order_seq start 1;

create or replace function public.set_store_order_number()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.order_number is null or trim(new.order_number) = '' then
    new.order_number := 'KH-SHOP-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.store_order_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_store_order_number on public.store_orders;
create trigger trg_store_order_number before insert on public.store_orders
for each row execute function public.set_store_order_number();

create or replace function public.store_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select lower(coalesce(auth.jwt()->>'email','')) in (
    'info@karagumrukhentbol.org',
    'raouf.tarek@gmail.com'
  );
$$;

grant execute on function public.store_is_admin() to authenticated;

alter table public.store_products enable row level security;
alter table public.store_orders enable row level security;

drop policy if exists public_reads_active_products on public.store_products;
create policy public_reads_active_products on public.store_products
for select to anon, authenticated using (active = true or public.store_is_admin());

drop policy if exists admin_manages_products on public.store_products;
create policy admin_manages_products on public.store_products
for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists public_creates_orders on public.store_orders;
create policy public_creates_orders on public.store_orders
for insert to anon, authenticated with check (
  customer_name <> '' and customer_email <> '' and customer_phone <> '' and delivery_address <> ''
);

drop policy if exists admin_manages_orders on public.store_orders;
create policy admin_manages_orders on public.store_orders
for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

grant select on public.store_products to anon, authenticated;
grant insert on public.store_orders to anon, authenticated;
grant select, insert, update, delete on public.store_products to authenticated;
grant select, update, delete on public.store_orders to authenticated;
grant usage, select on sequence public.store_order_seq to anon, authenticated;
