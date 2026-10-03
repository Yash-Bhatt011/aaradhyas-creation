-- ═══════════════════════════════════════════════════════════════════
-- Aaradhya's Creation — Supabase Database Setup
-- ═══════════════════════════════════════════════════════════════════
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New Query → paste this → Run)
--
-- This creates a single table that stores your entire store's data
-- (products, orders, customers, settings, etc.) as one JSON document —
-- the same reliable "single document" pattern this app has used since
-- the beginning, just backed by Postgres instead of a JSON file.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists app_state (
  id text primary key default 'singleton',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: keep this table locked down. The backend connects
-- using the "service_role" key, which bypasses RLS entirely — so this
-- table stays completely inaccessible to anyone using the public/anon key
-- (i.e. inaccessible directly from a browser). Only your backend server
-- can read or write it.
alter table app_state enable row level security;

-- No policies are created on purpose — with RLS enabled and zero policies,
-- the anon/public key gets NO access at all. Only the service_role key
-- (used exclusively by your backend, never exposed to the frontend) can
-- read or write, because service_role bypasses RLS by design.

-- ═══════════════════════════════════════════════════════════════════
-- That's it for the database. For image storage, create a Storage
-- bucket from the Dashboard instead of SQL (Storage → New Bucket):
--   Name: images
--   Public bucket: ON  (so uploaded product/site photos load in the browser)
-- ═══════════════════════════════════════════════════════════════════
