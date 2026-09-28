-- Portfolio Visualizer schema. Run once in the Supabase SQL editor.
-- Every row belongs to the signed-in user (owner_id) and row-level security restricts access to that user.

create table groupings (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table categories (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  grouping_id text not null references groupings on delete cascade,
  name text not null,
  color text not null
);

create table holdings (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  invested_amount numeric(16, 2),
  sort_order int not null default 0
);

-- One category per holding per grouping.
create table holding_categories (
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  holding_id text not null references holdings on delete cascade,
  grouping_id text not null references groupings on delete cascade,
  category_id text not null references categories on delete cascade,
  primary key (holding_id, grouping_id)
);

create table snapshots (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  taken_at timestamptz not null
);

create table snapshot_values (
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  snapshot_id text not null references snapshots on delete cascade,
  holding_id text not null references holdings on delete cascade,
  value numeric(16, 2) not null check (value >= 0),
  primary key (snapshot_id, holding_id)
);

do $$
declare t text;
begin
  foreach t in array array['groupings', 'categories', 'holdings', 'holding_categories', 'snapshots', 'snapshot_values'] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "owner only" on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

-- Replace a snapshot and all its values atomically.
create function save_snapshot(p_id text, p_taken_at timestamptz, p_values jsonb)
returns void
language plpgsql
security invoker
as $$
begin
  insert into snapshots (id, taken_at) values (p_id, p_taken_at)
  on conflict (id) do update set taken_at = excluded.taken_at;

  delete from snapshot_values where snapshot_id = p_id;

  insert into snapshot_values (snapshot_id, holding_id, value)
  select p_id, key, value::numeric from jsonb_each_text(p_values);
end $$;
