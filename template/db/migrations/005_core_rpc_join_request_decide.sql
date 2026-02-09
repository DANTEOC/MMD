-- 005_core_rpc_join_request_decide.sql
-- RPC: api_join_request_decide
-- Lógica server-side segura para aprobar/rechazar solicitudes y crear membresías.

CREATE OR REPLACE FUNCTION public.api_join_request_decide(
    p_request_id UUID,
    p_decision TEXT,
    p_role_key TEXT DEFAULT 'Lectura'
) 
RETURNS TABLE (success boolean, message text) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request public.tenant_join_requests%ROWTYPE;
    v_executer_id UUID;
    v_is_admin BOOLEAN;
    v_user_has_active_tenant BOOLEAN;
BEGIN
    v_executer_id := auth.uid();
    
    -- 1. Obtener solicitud
    SELECT * INTO v_request FROM public.tenant_join_requests WHERE id = p_request_id;
    
    IF v_request IS NULL THEN
        RETURN QUERY SELECT false, 'Solicitud no encontrada';
        RETURN;
    END IF;

    IF v_request.status != 'pending' THEN
        RETURN QUERY SELECT false, 'Solicitud ya procesada';
        RETURN;
    END IF;

    -- 2. Verificar Admin en tenant
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE tenant_id = v_request.tenant_id 
        AND user_id = v_executer_id 
        AND role_key = 'Admin'
        AND is_active = true
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN QUERY SELECT false, 'No tienes permisos de Admin';
        RETURN;
    END IF;

    -- 3. Decisión
    IF p_decision = 'approved' THEN
        -- Check si tiene active tenant
        SELECT EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = v_request.user_id 
            AND is_active = true
        ) INTO v_user_has_active_tenant;

        -- Upsert en tenant_users
        INSERT INTO public.tenant_users (tenant_id, user_id, role_key, is_active)
        VALUES (
            v_request.tenant_id, 
            v_request.user_id, 
            p_role_key, 
            NOT v_user_has_active_tenant
        )
        ON CONFLICT (tenant_id, user_id) 
        DO UPDATE SET 
            role_key = EXCLUDED.role_key,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        UPDATE public.tenant_join_requests
        SET status = 'approved', decided_at = NOW(), decided_by = v_executer_id
        WHERE id = p_request_id;
        
        RETURN QUERY SELECT true, 'Solicitud aprobada';
        
    ELSIF p_decision = 'rejected' THEN
        UPDATE public.tenant_join_requests
        SET status = 'rejected', decided_at = NOW(), decided_by = v_executer_id
        WHERE id = p_request_id;
        
        RETURN QUERY SELECT true, 'Solicitud rechazada';
    ELSE
        RETURN QUERY SELECT false, 'Decisión inválida';
    END IF;
END;
$$;
