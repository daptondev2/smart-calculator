-- Lead capture for the design-two flow: one email per analysis (set-once).

create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  statement_id  uuid not null unique references statements(id) on delete cascade,
  email         text not null,
  created_at    timestamptz not null default now()
);

-- Server-side access only via the service role; lock RLS for the browser.
alter table leads enable row level security;
