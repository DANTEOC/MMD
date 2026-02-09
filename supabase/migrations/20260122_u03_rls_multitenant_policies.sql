-- ============================================================================
-- MIGRACIÓN U-03: RLS Base Multi-Tenant
-- ============================================================================
-- Objetivo: Habilitar Row Level Security y crear policies seguras para:
-- - tenants: solo ver/editar tenants a los que pertenece el usuario
-- - tenant_users: solo ver membresías del mismo tenant
-- 
-- IMPORTANTE: Estas policies son la PRIMERA línea de defensa.
-- NUNCA confiar solo en validaciones de UI.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCIONES HELPER PARA RLS
-- ----------------------------------------------------------------------------

-- Función: Obtener tenant_id del usuario autenticado
-- Retorna el tenant_id si el usuario tiene membresía activa, NULL si no
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = auth.uid() 
          AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_tenant_id() IS 
'Retorna el tenant_id del usuario autenticado si tiene membresía activa';

-- Función: Verificar si el usuario pertenece a un tenant específico
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.tenant_users 
        WHERE user_id = auth.uid() 
          AND tenant_id = target_tenant_id
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_belongs_to_tenant(UUID) IS 
'Verifica si el usuario autenticado pertenece al tenant especificado';

-- Función: Verificar si el usuario es Admin de un tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.tenant_users 
        WHERE user_id = auth.uid() 
          AND tenant_id = target_tenant_id
          AND role_key = 'Admin'
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_tenant_admin(UUID) IS 
'Verifica si el usuario autenticado es Admin del tenant especificado';

-- Función: Obtener rol del usuario en un tenant
CREATE OR REPLACE FUNCTION public.get_user_role(target_tenant_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role_key 
        FROM public.tenant_users 
        WHERE user_id = auth.uid() 
          AND tenant_id = target_tenant_id
          AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_role(UUID) IS 
'Retorna el rol del usuario autenticado en el tenant especificado';

-- ----------------------------------------------------------------------------
-- 2. HABILITAR RLS EN TABLAS
-- ----------------------------------------------------------------------------

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. POLICIES PARA TABLA: tenants
-- ----------------------------------------------------------------------------

-- Policy: SELECT en tenants
-- Permite ver SOLO los tenants a los que el usuario pertenece
CREATE POLICY "tenants_select_own_tenant"
ON public.tenants
FOR SELECT
TO authenticated
USING (
    public.user_belongs_to_tenant(id)
);

COMMENT ON POLICY "tenants_select_own_tenant" ON public.tenants IS 
'Usuarios autenticados solo pueden ver tenants a los que pertenecen';

-- Policy: UPDATE en tenants
-- Permite actualizar SOLO si el usuario es Admin del tenant
CREATE POLICY "tenants_update_admin_only"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
    public.is_tenant_admin(id)
)
WITH CHECK (
    public.is_tenant_admin(id)
);

COMMENT ON POLICY "tenants_update_admin_only" ON public.tenants IS 
'Solo Admins pueden actualizar información de su tenant';

-- Policy: INSERT en tenants
-- DENEGADO en MVP (creación de tenants se hará por proceso administrativo)
-- No se crea policy → por defecto está bloqueado

-- Policy: DELETE en tenants
-- DENEGADO en MVP (soft delete vía UPDATE is_active)
-- No se crea policy → por defecto está bloqueado

-- ----------------------------------------------------------------------------
-- 4. POLICIES PARA TABLA: tenant_users
-- ----------------------------------------------------------------------------

-- Policy: SELECT en tenant_users
-- Permite ver SOLO las membresías del mismo tenant al que pertenece el usuario
CREATE POLICY "tenant_users_select_same_tenant"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (
    public.user_belongs_to_tenant(tenant_id)
);

COMMENT ON POLICY "tenant_users_select_same_tenant" ON public.tenant_users IS 
'Usuarios solo pueden ver membresías de su propio tenant';

-- Policy: UPDATE en tenant_users
-- DENEGADO en MVP (gestión de usuarios será por proceso administrativo)
-- No se crea policy → por defecto está bloqueado

-- Policy: INSERT en tenant_users
-- DENEGADO en MVP (asignación de usuarios será por proceso administrativo)
-- No se crea policy → por defecto está bloqueado

-- Policy: DELETE en tenant_users
-- DENEGADO en MVP (soft delete vía UPDATE is_active, cuando se habilite)
-- No se crea policy → por defecto está bloqueado

-- ----------------------------------------------------------------------------
-- 5. GRANTS NECESARIOS
-- ----------------------------------------------------------------------------

-- Asegurar que usuarios autenticados puedan ejecutar las funciones helper
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_tenant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

-- ============================================================================
-- RESUMEN DE SEGURIDAD
-- ============================================================================
-- 
-- TENANTS:
--   ✅ SELECT: Solo si perteneces al tenant
--   ✅ UPDATE: Solo si eres Admin del tenant
--   ❌ INSERT: Bloqueado (proceso administrativo)
--   ❌ DELETE: Bloqueado (usar soft delete)
--
-- TENANT_USERS:
--   ✅ SELECT: Solo membresías de tu tenant
--   ❌ UPDATE: Bloqueado en MVP
--   ❌ INSERT: Bloqueado en MVP
--   ❌ DELETE: Bloqueado en MVP
--
-- FUNCIONES HELPER:
--   - get_user_tenant_id(): Retorna tenant_id del usuario
--   - user_belongs_to_tenant(uuid): Verifica pertenencia
--   - is_tenant_admin(uuid): Verifica si es Admin
--   - get_user_role(uuid): Retorna rol del usuario
--
-- ============================================================================
-- FIN MIGRACIÓN U-03
-- ============================================================================
