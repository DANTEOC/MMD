-- ============================================================================
-- MIGRACIÓN U-05: Seeds mínimos (DEV / STAGING)
-- ============================================================================
-- Objetivo: Crear datos mínimos para operar el core multi-tenant
-- - Tenant demo para MMD Maintenance
-- - Usuario Admin vinculado (requiere usuario existente en auth.users)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- IMPORTANTE: CONFIGURACIÓN PREVIA
-- ----------------------------------------------------------------------------
-- Antes de ejecutar este script:
-- 1. Crear un usuario en Supabase Dashboard → Authentication → Users
-- 2. Copiar el UUID del usuario creado
-- 3. Reemplazar '<TU-USER-ID-AQUI>' en la línea 48 con el UUID real

-- ----------------------------------------------------------------------------
-- 1. Crear tenant demo (idempotente)
-- ----------------------------------------------------------------------------
INSERT INTO public.tenants (id, name, slug, is_active, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,  -- UUID fijo para DEV
    'MMD Maintenance Demo',
    'mmd-demo',
    true,
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Verificar tenant creado
SELECT id, name, slug, is_active 
FROM public.tenants 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ----------------------------------------------------------------------------
-- 2. Vincular usuario como Admin en tenant demo
-- ----------------------------------------------------------------------------
-- IMPORTANTE: Reemplazar '<TU-USER-ID-AQUI>' con el UUID real del usuario
-- creado en Supabase Auth

-- Primero: desactivar cualquier tenant activo previo del usuario (modelo B)
UPDATE public.tenant_users
SET is_active = false, updated_at = now()
WHERE user_id = 'ccd4dba4-2fd3-427b-abdc-4a1cba02bc48'::uuid
  AND is_active = true;

-- Segundo: insertar o actualizar el vínculo con el tenant demo
INSERT INTO public.tenant_users (
    tenant_id,
    user_id,
    role_key,
    is_active,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,  -- tenant demo
    'ccd4dba4-2fd3-427b-abdc-4a1cba02bc48'::uuid,                     -- ⚠️ REEMPLAZAR AQUÍ
    'Admin',
    true,
    now(),
    now()
)
ON CONFLICT (tenant_id, user_id) DO UPDATE
SET 
    role_key = EXCLUDED.role_key,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Verificar vínculo creado
SELECT 
    tu.tenant_id,
    tu.user_id,
    tu.role_key,
    tu.is_active,
    t.name as tenant_name
FROM public.tenant_users tu
JOIN public.tenants t ON t.id = tu.tenant_id
WHERE tu.user_id = 'ccd4dba4-2fd3-427b-abdc-4a1cba02bc48'::uuid;  -- ⚠️ REEMPLAZAR AQUÍ

-- ----------------------------------------------------------------------------
-- 3. Validación final: verificar modelo B (solo 1 tenant activo por usuario)
-- ----------------------------------------------------------------------------
-- Esta query NO debe retornar filas (si retorna, hay violación del modelo B)
SELECT 
    user_id,
    COUNT(*) as active_tenants_count
FROM public.tenant_users
WHERE is_active = true
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Si la query anterior retorna 0 filas: ✅ Modelo B respetado
-- Si retorna filas: ❌ ERROR - Usuario tiene múltiples tenants activos

-- ============================================================================
-- RESUMEN DE SEEDS
-- ============================================================================
-- 
-- TENANT DEMO:
--   ID: 00000000-0000-0000-0000-000000000001
--   Name: MMD Maintenance Demo
--   Slug: mmd-demo
--
-- USUARIO ADMIN:
--   User ID: <el que configuraste>
--   Tenant: mmd-demo
--   Role: Admin
--   Active: true
--
-- VALIDACIÓN MODELO B:
--   ✅ Solo 1 tenant activo por usuario
--
-- ============================================================================
-- FIN MIGRACIÓN U-05
-- ============================================================================
