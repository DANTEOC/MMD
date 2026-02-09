-- U-03 PATCH: Fix multi-tenant leak + perf indexes
-- Date: 2026-01-21
-- Purpose: enforce single active tenant per user (MVP) and make get_user_tenant_id deterministic

-- 1) Enforce: a user can have ONLY ONE active tenant membership
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_users_one_active_tenant_per_user
ON public.tenant_users (user_id)
WHERE is_active = true;

-- 2) Replace get_user_tenant_id() with secure deterministic implementation
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_tenant_id uuid;
BEGIN
  SELECT COUNT(*), MAX(tenant_id)
    INTO v_count, v_tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid()
    AND is_active = true;

  IF v_count = 0 THEN
    RETURN NULL;
  END IF;

  IF v_count > 1 THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: user % has % active tenants', auth.uid(), v_count;
  END IF;

  RETURN v_tenant_id;
END;
$$;

-- 3) Perf indexes for RLS/helper lookups
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_active
ON public.tenant_users (user_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_tenant_active
ON public.tenant_users (user_id, tenant_id, is_active)
WHERE is_active = true;
