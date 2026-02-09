-- ============================================================================
-- VALIDATOR: U-03 Patch Multi-Tenant Fix (Supabase SQL Editor compatible)
-- No psql commands (\echo). No inserts. Safe to run multiple times.
-- ============================================================================

-- 1) Verify indexes exist on tenant_users
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'tenant_users'
  and indexname in (
    'ux_tenant_users_one_active_tenant_per_user',
    'idx_tenant_users_user_active',
    'idx_tenant_users_user_tenant_active'
  )
order by indexname;

-- 2) Verify function definition (should NOT contain "LIMIT 1")
select
  pg_get_functiondef(p.oid) as function_def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_user_tenant_id';

-- Quick check: does the function contain "LIMIT 1"?
select
  case when pg_get_functiondef(p.oid) ilike '%limit 1%'
       then 'FAIL: function contains LIMIT 1'
       else 'OK: function does not contain LIMIT 1'
  end as get_user_tenant_id_limit1_check
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_user_tenant_id';

-- 3) Verify no users have multiple active tenants (must be 0 rows)
select user_id, count(*) as active_count
from public.tenant_users
where is_active = true
group by user_id
having count(*) > 1;

-- 4) Verify RLS enabled (tenants and tenant_users)
select
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('tenants', 'tenant_users')
order by tablename;

-- 5) Verify policies exist (names may vary; check operations)
select
  schemaname,
  tablename,
  policyname,
  cmd as operation
from pg_policies
where schemaname = 'public'
  and tablename in ('tenants', 'tenant_users')
order by tablename, operation, policyname;

-- 6) Optional performance sanity: ensure planner can use indexes for lookups
-- (EXPLAIN output is informational; may differ depending on stats/data size)
explain (costs off)
select tenant_id
from public.tenant_users
where user_id = '00000000-0000-0000-0000-000000000099'
  and is_active = true;

explain (costs off)
select 1
from public.tenant_users
where user_id = '00000000-0000-0000-0000-000000000099'
  and tenant_id = '00000000-0000-0000-0000-000000000001'
  and is_active = true;
