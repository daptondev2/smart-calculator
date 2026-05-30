-- Smart Calculator: Stripe-vs-EPD savings calculator
-- Schema: statements (uploaded PDFs), transactions (extracted line items), reports (computed comparison)

create extension if not exists "pgcrypto";

create table if not exists statements (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  file_path   text,
  file_name   text,
  file_size   integer,
  status      text not null default 'processing',  -- processing | completed | failed
  error       text,
  created_at  timestamptz not null default now()
);

create table if not exists transactions (
  id            uuid primary key default gen_random_uuid(),
  statement_id  uuid not null references statements(id) on delete cascade,
  txn_date      date,
  description   text,
  gross_amount  numeric(12,2) not null,
  currency      text not null default 'USD',
  card_brand    text,
  count         integer not null default 1,
  is_refund     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists reports (
  id                    uuid primary key default gen_random_uuid(),
  statement_id          uuid not null unique references statements(id) on delete cascade,
  total_volume          numeric(14,2) not null,
  transaction_count     integer not null,
  stripe_fees           numeric(14,2) not null,
  stripe_effective_rate numeric(6,5)  not null,
  epd_fees              numeric(14,2) not null,
  epd_rate              numeric(6,5)  not null default 0.015,
  savings               numeric(14,2) not null,
  savings_pct           numeric(6,5)  not null,
  assumptions           jsonb         not null,
  created_at            timestamptz   not null default now()
);

create index if not exists statements_session_id_idx on statements(session_id);
create index if not exists transactions_statement_id_idx on transactions(statement_id);

-- Access is server-side via the service role only; lock RLS for the browser.
-- No permissive policies = deny-all to anon/auth keys; the service role bypasses RLS.
alter table statements   enable row level security;
alter table transactions enable row level security;
alter table reports      enable row level security;

-- Private storage bucket for the uploaded PDFs.
insert into storage.buckets (id, name, public)
values ('statements', 'statements', false)
on conflict (id) do nothing;
