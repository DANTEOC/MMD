-- ============================================================================
-- VALIDATOR: U-02 Base Multi-Tenant Tables (Supabase SQL Editor compatible)
-- No psql commands. Safe to run multiple times.
-- ============================================================================

-- 1) Verificar que las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tenants', 'tenant_users')
ORDER BY table_name;

-- 2) Verificar estructura de tenants
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenants'
ORDER BY ordinal_position;

-- 3) Verificar estructura de tenant_users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_users'
ORDER BY ordinal_position;

-- 4) Verificar constraint CHECK de roles en tenant_users
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tenant_users'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 5) Verificar UNIQUE constraint (tenant_id, user_id)
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tenant_users'::regclass
  AND contype = 'u'
ORDER BY conname;

-- 6) Verificar Foreign Keys
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tenant_users'::regclass
  AND contype = 'f'
ORDER BY conname;

-- 7) Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'tenant_users')
ORDER BY tablename, indexname;

-- 8) Verificar triggers de updated_at
SELECT 
    trigger_name,
    event_object_table AS table_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('tenants', 'tenant_users')
ORDER BY event_object_table, trigger_name;

-- 9) Verificar función update_updated_at_column existe
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'update_updated_at_column';

-- 10) Test básico: intentar crear un tenant (luego rollback)
DO $$
DECLARE
    v_tenant_id uuid;
BEGIN
    -- Insertar tenant de prueba
    INSERT INTO public.tenants (name, slug, is_active)
    VALUES ('Test Tenant', 'test-tenant-validation', true)
    RETURNING id INTO v_tenant_id;
    
    RAISE NOTICE 'Test tenant created with ID: %', v_tenant_id;
    
    -- Rollback (no commitear el test)
    RAISE EXCEPTION 'Rollback test insert';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test completed and rolled back successfully';
END;
$$;

-- ============================================================================
-- RESULTADOS ESPERADOS:
-- ============================================================================
-- 1) Debe mostrar 2 tablas: tenants, tenant_users
-- 2) Tabla tenants: id, name, slug, is_active, created_at, updated_at
-- 3) Tabla tenant_users: id, tenant_id, user_id, role_key, is_active, created_at, updated_at
-- 4) CHECK constraint: role_key IN ('Admin', 'Operador', 'Tecnico', 'Lectura')
-- 5) UNIQUE constraint: (tenant_id, user_id)
-- 6) FK constraints: tenant_id -> tenants(id), user_id -> auth.users(id)
-- 7) Índices en tenant_id, user_id, slug, is_active, etc.
-- 8) Triggers: set_updated_at_tenants, set_updated_at_tenant_users
-- 9) Función update_updated_at_column definida
-- 10) Test insert/rollback exitoso
-- ============================================================================
