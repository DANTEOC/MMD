-- Migración: Tabla tenant_join_requests y RPC api_join_request_decide
-- Fecha: 2026-01-24
-- Ticket: A-07.3

-- 1. Crear tabla tenant_join_requests
CREATE TABLE IF NOT EXISTS public.tenant_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    decided_by UUID REFERENCES auth.users(id),
    -- Evitar duplicados: un usuario solo puede tener una solicitud por tenant (pendiente o decidida)
    UNIQUE(tenant_id, user_id)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_join_requests_tenant_status ON public.tenant_join_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON public.tenant_join_requests(user_id);

-- Comentarios
COMMENT ON TABLE public.tenant_join_requests IS 'Solicitudes de usuarios para unirse a un tenant';

-- 2. Habilitar RLS
ALTER TABLE public.tenant_join_requests ENABLE ROW LEVEL SECURITY;

-- 3. Policies RLS

-- INSERT: Usuario autenticado puede solicitar unirse si es para él mismo
CREATE POLICY "Users can create their own requests" ON public.tenant_join_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- SELECT: Ver mis propias solicitudes
CREATE POLICY "Users can view their own requests" ON public.tenant_join_requests
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- SELECT: Admins del tenant pueden ver solicitudes de su tenant
CREATE POLICY "Admins can view tenant requests" ON public.tenant_join_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.tenant_id = tenant_join_requests.tenant_id 
            AND tu.user_id = auth.uid() 
            AND tu.role_key IN ('Admin', 'Tecnico') -- Ajustar roles según necesidad, Admin seguro
            AND tu.is_active = true
        )
    );

-- UPDATE: Dejamos UPDATE restringido o solo vía RPC. 
-- Para flexibilidad, permitimos a Admins actualizar (aunque usaremos RPC principalmente)
CREATE POLICY "Admins can update tenant requests" ON public.tenant_join_requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.tenant_id = tenant_join_requests.tenant_id 
            AND tu.user_id = auth.uid() 
            AND tu.role_key = 'Admin'
            AND tu.is_active = true
        )
    );

-- 4. RPC: api_join_request_decide
-- Esta función maneja la aprobación/rechazo de forma atómica y segura
CREATE OR REPLACE FUNCTION public.api_join_request_decide(
    p_request_id UUID,
    p_decision TEXT,
    p_role_key TEXT DEFAULT 'Lectura'
) 
RETURNS TABLE (success boolean, message text) 
LANGUAGE plpgsql 
SECURITY DEFINER -- Se ejecuta con permisos de superusuario para saltar RLS si es necesario y garantizar integridad
SET search_path = public
AS $$
DECLARE
    v_request public.tenant_join_requests%ROWTYPE;
    v_executer_id UUID;
    v_is_admin BOOLEAN;
    v_user_has_active_tenant BOOLEAN;
BEGIN
    v_executer_id := auth.uid();
    
    -- 1. Obtener la solicitud
    SELECT * INTO v_request FROM public.tenant_join_requests WHERE id = p_request_id;
    
    IF v_request IS NULL THEN
        RETURN QUERY SELECT false, 'Solicitud no encontrada';
        RETURN;
    END IF;

    -- 2. Verificar que la solicitud esté pendiente
    IF v_request.status != 'pending' THEN
        RETURN QUERY SELECT false, 'La solicitud ya fue procesada anteriormente';
        RETURN;
    END IF;

    -- 3. Verificar que quien ejecuta es Admin del tenant
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE tenant_id = v_request.tenant_id 
        AND user_id = v_executer_id 
        AND role_key = 'Admin'
        AND is_active = true
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN QUERY SELECT false, 'No tienes permisos de Administrador en este tenant';
        RETURN;
    END IF;

    -- 4. Procesar decisión
    IF p_decision = 'approved' THEN
        -- Verificar si el usuario ya tiene otro tenant activo (Modelo B)
        SELECT EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = v_request.user_id 
            AND is_active = true
        ) INTO v_user_has_active_tenant;

        -- Crear o actualizar membership
        INSERT INTO public.tenant_users (tenant_id, user_id, role_key, is_active)
        VALUES (
            v_request.tenant_id, 
            v_request.user_id, 
            p_role_key, 
            NOT v_user_has_active_tenant -- Activo si no tiene otros activos
        )
        ON CONFLICT (tenant_id, user_id) 
        DO UPDATE SET 
            role_key = EXCLUDED.role_key,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        -- Actualizar solicitud
        UPDATE public.tenant_join_requests
        SET status = 'approved',
            decided_at = NOW(),
            decided_by = v_executer_id
        WHERE id = p_request_id;
        
        RETURN QUERY SELECT true, 'Solicitud aprobada y usuario agregado al tenant';
        
    ELSIF p_decision = 'rejected' THEN
        -- Actualizar solicitud
        UPDATE public.tenant_join_requests
        SET status = 'rejected',
            decided_at = NOW(),
            decided_by = v_executer_id
        WHERE id = p_request_id;
        
        RETURN QUERY SELECT true, 'Solicitud rechazada correctamente';
    ELSE
        RETURN QUERY SELECT false, 'Decisión inválida (use approved/rejected)';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error interno: ' || SQLERRM;
END;
$$;
