-- ============================================================================
-- MIGRACIÓN C-01: Tablas de Configuración + RLS + Seed Módulos
-- ============================================================================
-- Objetivo: Crear tablas para configuración de tenants y feature flags
-- - tenant_settings: configuración general por tenant (1 fila por tenant)
-- - tenant_modules: feature flags de módulos habilitados por tenant
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla TENANT_SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre_comercial TEXT,
    razon_social TEXT,
    rfc TEXT,
    email TEXT,
    telefono TEXT,
    domicilio_fiscal TEXT,
    logo_url TEXT,
    iva_rate NUMERIC(5,2) DEFAULT 16.00,
    otro_impuesto_rate NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tenant_settings IS 'Configuración general por tenant (1 fila por tenant)';
COMMENT ON COLUMN public.tenant_settings.nombre_comercial IS 'Nombre comercial de la empresa';
COMMENT ON COLUMN public.tenant_settings.razon_social IS 'Razón social legal';
COMMENT ON COLUMN public.tenant_settings.rfc IS 'RFC (México) o identificador fiscal';
COMMENT ON COLUMN public.tenant_settings.logo_url IS 'URL del logo de la empresa';
COMMENT ON COLUMN public.tenant_settings.iva_rate IS 'Tasa de IVA (default 16% México)';
COMMENT ON COLUMN public.tenant_settings.otro_impuesto_rate IS 'Otra tasa de impuesto adicional';

-- Trigger para updated_at automático
CREATE TRIGGER set_updated_at_tenant_settings
    BEFORE UPDATE ON public.tenant_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2. Tabla TENANT_MODULES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_modules (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL CHECK (
        module_key IN (
            'clientes',
            'proveedores',
            'inventario',
            'compras',
            'ordenes_servicio',
            'cotizaciones',
            'bancos',
            'ingresos_gastos',
            'proyectos_tareas'
        )
    ),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    PRIMARY KEY (tenant_id, module_key)
);

-- Índice para búsquedas por módulo habilitado
CREATE INDEX IF NOT EXISTS idx_tenant_modules_enabled 
    ON public.tenant_modules(tenant_id, enabled) 
    WHERE enabled = true;

COMMENT ON TABLE public.tenant_modules IS 'Feature flags de módulos habilitados por tenant';
COMMENT ON COLUMN public.tenant_modules.module_key IS 'Clave del módulo (clientes, proveedores, etc.)';
COMMENT ON COLUMN public.tenant_modules.enabled IS 'Si el módulo está habilitado para este tenant';

-- Trigger para updated_at automático
CREATE TRIGGER set_updated_at_tenant_modules
    BEFORE UPDATE ON public.tenant_modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. SEED: Insertar módulos por defecto para tenants existentes
-- ----------------------------------------------------------------------------
-- Insertar todos los módulos habilitados para cada tenant existente
-- ON CONFLICT DO NOTHING evita duplicados si se ejecuta múltiples veces

INSERT INTO public.tenant_modules (tenant_id, module_key, enabled)
SELECT 
    t.id AS tenant_id,
    m.module_key,
    true AS enabled
FROM 
    public.tenants t
CROSS JOIN (
    VALUES 
        ('clientes'),
        ('proveedores'),
        ('inventario'),
        ('compras'),
        ('ordenes_servicio'),
        ('cotizaciones'),
        ('bancos'),
        ('ingresos_gastos'),
        ('proyectos_tareas')
) AS m(module_key)
ON CONFLICT (tenant_id, module_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. HABILITAR RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. POLICIES: TENANT_SETTINGS (Solo Admin)
-- ----------------------------------------------------------------------------

-- Policy: SELECT en tenant_settings
-- Solo Admin puede ver configuración de su tenant
CREATE POLICY "tenant_settings_select_admin_only"
ON public.tenant_settings
FOR SELECT
TO authenticated
USING (
    public.is_tenant_admin(tenant_id)
);

COMMENT ON POLICY "tenant_settings_select_admin_only" ON public.tenant_settings IS
'Solo Admins pueden ver configuración de su tenant';

-- Policy: INSERT en tenant_settings
-- Solo Admin puede crear configuración de su tenant
CREATE POLICY "tenant_settings_insert_admin_only"
ON public.tenant_settings
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_tenant_admin(tenant_id)
);

COMMENT ON POLICY "tenant_settings_insert_admin_only" ON public.tenant_settings IS
'Solo Admins pueden crear configuración de su tenant';

-- Policy: UPDATE en tenant_settings
-- Solo Admin puede actualizar configuración de su tenant
CREATE POLICY "tenant_settings_update_admin_only"
ON public.tenant_settings
FOR UPDATE
TO authenticated
USING (
    public.is_tenant_admin(tenant_id)
)
WITH CHECK (
    public.is_tenant_admin(tenant_id)
);

COMMENT ON POLICY "tenant_settings_update_admin_only" ON public.tenant_settings IS
'Solo Admins pueden actualizar configuración de su tenant';

-- Policy: DELETE en tenant_settings
-- Solo Admin puede eliminar configuración de su tenant
CREATE POLICY "tenant_settings_delete_admin_only"
ON public.tenant_settings
FOR DELETE
TO authenticated
USING (
    public.is_tenant_admin(tenant_id)
);

COMMENT ON POLICY "tenant_settings_delete_admin_only" ON public.tenant_settings IS
'Solo Admins pueden eliminar configuración de su tenant';

-- ----------------------------------------------------------------------------
-- 6. POLICIES: TENANT_MODULES (Solo Admin)
-- ----------------------------------------------------------------------------

-- Policy: SELECT en tenant_modules
-- Solo Admin puede ver módulos de su tenant
CREATE POLICY "tenant_modules_select_admin_only"
ON public.tenant_modules
FOR SELECT
TO authenticated
USING (
    public.is_tenant_admin(tenant_id)
);

COMMENT ON POLICY "tenant_modules_select_admin_only" ON public.tenant_modules IS
'Solo Admins pueden ver módulos de su tenant';

-- Policy: INSERT en tenant_modules
-- Solo Admin puede habilitar módulos en su tenant
CREATE POLICY "tenant_modules_insert_admin_only"
ON public.tenant_modules
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_tenant_admin(tenant_id)
);

COMMENT ON POLICY "tenant_modules_insert_admin_only" ON public.tenant_modules IS
'Solo Admins pueden habilitar módulos en su tenant';

-- Policy: UPDATE en tenant_modules
-- Solo Admin puede modificar módulos de su tenant
CREATE POLICY "tenant_modules_update_admin_only"
ON public.tenant_modules
FOR UPDATE
TO authenticated
USING (
    public.is_tenant_admin(tenant_id)
)
WITH CHECK (
    public.is_tenant_admin(tenant_id)
);

COMMENT ON POLICY "tenant_modules_update_admin_only" ON public.tenant_modules IS
'Solo Admins pueden modificar módulos de su tenant';

-- Policy: DELETE en tenant_modules
-- Solo Admin puede eliminar módulos de su tenant
CREATE POLICY "tenant_modules_delete_admin_only"
ON public.tenant_modules
FOR DELETE
TO authenticated
USING (
    public.is_tenant_admin(tenant_id)
);

COMMENT ON POLICY "tenant_modules_delete_admin_only" ON public.tenant_modules IS
'Solo Admins pueden eliminar módulos de su tenant';

-- ============================================================================
-- RESUMEN DE SEGURIDAD C-01
-- ============================================================================
-- 
-- TENANT_SETTINGS:
--   ✅ SELECT: Solo Admin del tenant
--   ✅ INSERT: Solo Admin del tenant
--   ✅ UPDATE: Solo Admin del tenant
--   ✅ DELETE: Solo Admin del tenant
--
-- TENANT_MODULES:
--   ✅ SELECT: Solo Admin del tenant
--   ✅ INSERT: Solo Admin del tenant
--   ✅ UPDATE: Solo Admin del tenant
--   ✅ DELETE: Solo Admin del tenant
--
-- SEED:
--   ✅ Todos los módulos habilitados por defecto para tenants existentes
--
-- ============================================================================
-- FIN MIGRACIÓN C-01
-- ============================================================================
