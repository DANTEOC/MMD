-- ============================================================================
-- VALIDATOR: C-01 Config Tables (Supabase SQL Editor compatible)
-- No psql commands. Safe to run multiple times.
-- ============================================================================

-- 1) Verificar que las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tenant_settings', 'tenant_modules')
ORDER BY table_name;

-- 2) Verificar estructura de tenant_settings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_settings'
ORDER BY ordinal_position;

-- 3) Verificar estructura de tenant_modules
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_modules'
ORDER BY ordinal_position;

-- 4) Verificar constraints de tenant_modules (CHECK module_key)
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tenant_modules'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 5) Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('tenant_settings', 'tenant_modules')
ORDER BY tablename, indexname;

-- 6) Verificar RLS habilitado
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenant_settings', 'tenant_modules')
ORDER BY tablename;

-- 7) Verificar policies (debe haber 4 por tabla: SELECT, INSERT, UPDATE, DELETE)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd AS operation,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tenant_settings', 'tenant_modules')
ORDER BY tablename, operation, policyname;

-- 8) Contar policies por tabla (debe ser 4 cada una)
SELECT 
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tenant_settings', 'tenant_modules')
GROUP BY tablename
ORDER BY tablename;

-- 9) Verificar triggers de updated_at
SELECT 
    trigger_name,
    event_object_table AS table_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('tenant_settings', 'tenant_modules')
ORDER BY event_object_table, trigger_name;

-- 10) Verificar seed de módulos (debe haber 9 módulos por tenant)
SELECT 
    tenant_id,
    COUNT(*) AS module_count,
    COUNT(*) FILTER (WHERE enabled = true) AS enabled_count
FROM public.tenant_modules
GROUP BY tenant_id
ORDER BY tenant_id;

-- 11) Listar módulos seeded
SELECT DISTINCT module_key
FROM public.tenant_modules
ORDER BY module_key;

-- 12) Verificar que no hay módulos duplicados por tenant
SELECT 
    tenant_id,
    module_key,
    COUNT(*) AS duplicate_count
FROM public.tenant_modules
GROUP BY tenant_id, module_key
HAVING COUNT(*) > 1;

-- ============================================================================
-- RESULTADOS ESPERADOS:
-- ============================================================================
-- 1) Debe mostrar 2 tablas: tenant_settings, tenant_modules
-- 2-3) Debe mostrar columnas correctas con tipos apropiados
-- 4) Debe mostrar CHECK constraint con lista de módulos
-- 5) Debe mostrar índices incluyendo idx_tenant_modules_enabled
-- 6) Ambas tablas deben tener rls_enabled = true
-- 7-8) Cada tabla debe tener 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- 9) Ambas tablas deben tener trigger set_updated_at_*
-- 10) Cada tenant debe tener 9 módulos (todos enabled=true)
-- 11) Debe listar 9 módulos distintos
-- 12) NO debe retornar filas (sin duplicados)
-- ============================================================================
