create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  category text,
  available boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  call_id text,
  customer_name text,
  phone text not null,
  type text not null check (type in ('pickup', 'delivery')),
  address text,
  items jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null default 0 check (total >= 0),
  eta_minutes integer check (eta_minutes is null or eta_minutes >= 0),
  status text not null default 'new'
    check (status in ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  call_id text,
  customer_name text not null,
  phone text not null,
  date date not null,
  time time not null,
  party_size integer not null check (party_size between 1 and 30),
  notes text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  call_id text not null unique,
  phone text not null,
  duration_s integer check (duration_s is null or duration_s >= 0),
  summary text,
  transcript text,
  recording_url text,
  sms_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_call_id_idx on public.orders (call_id);
create unique index if not exists orders_call_id_unique_idx on public.orders (call_id) where call_id is not null;
create index if not exists bookings_date_time_idx on public.bookings (date, time);
create index if not exists bookings_call_id_idx on public.bookings (call_id);
create unique index if not exists bookings_call_id_unique_idx on public.bookings (call_id) where call_id is not null;
create index if not exists calls_created_at_idx on public.calls (created_at desc);

alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.bookings enable row level security;
alter table public.calls enable row level security;

drop policy if exists "Authenticated users can manage menu items" on public.menu_items;
create policy "Authenticated users can manage menu items" on public.menu_items
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage orders" on public.orders;
create policy "Authenticated users can manage orders" on public.orders
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage bookings" on public.bookings;
create policy "Authenticated users can manage bookings" on public.bookings
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage calls" on public.calls;
create policy "Authenticated users can manage calls" on public.calls
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.menu_items to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant select, insert, update, delete on public.calls to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
    ) then
      alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
    ) then
      alter publication supabase_realtime add table public.bookings;
    end if;
  end if;
end
$$;

notify pgrst, 'reload schema';
