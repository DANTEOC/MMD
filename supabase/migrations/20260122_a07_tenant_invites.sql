-- TICKET A-07: Invitaciones por Email
-- Tabla tenant_invites + RLS + RPC api_accept_invite()

-- ============================================================================
-- 1. TABLA tenant_invites
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role_key text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz NULL,
  
  -- Constraints
  CONSTRAINT tenant_invites_role_key_check 
    CHECK (role_key IN ('Admin', 'Operador', 'Tecnico', 'Lectura')),
  CONSTRAINT tenant_invites_status_check 
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
);

-- Comentarios
COMMENT ON TABLE public.tenant_invites IS 'Invitaciones de usuarios a tenants';
COMMENT ON COLUMN public.tenant_invites.email IS 'Email normalizado (lower/trim)';
COMMENT ON COLUMN public.tenant_invites.expires_at IS 'Fecha de expiración (default 7 días)';

-- ============================================================================
-- 2. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenant_invites_tenant_id 
  ON public.tenant_invites(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_invites_tenant_email 
  ON public.tenant_invites(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_tenant_invites_status 
  ON public.tenant_invites(status);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Admin puede ver invites de su tenant
CREATE POLICY "tenant_invites_select"
  ON public.tenant_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = tenant_invites.tenant_id
        AND tu.role_key = 'Admin'
        AND tu.is_active = true
    )
  );

-- Policy: Admin puede crear invites en su tenant
CREATE POLICY "tenant_invites_insert"
  ON public.tenant_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = tenant_invites.tenant_id
        AND tu.role_key = 'Admin'
        AND tu.is_active = true
    )
  );

-- Policy: Admin puede actualizar invites de su tenant
CREATE POLICY "tenant_invites_update"
  ON public.tenant_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = tenant_invites.tenant_id
        AND tu.role_key = 'Admin'
        AND tu.is_active = true
    )
  );

-- ============================================================================
-- 4. FUNCIÓN RPC: api_accept_invite
-- ============================================================================

CREATE OR REPLACE FUNCTION public.api_accept_invite(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_invite record;
  v_existing_membership uuid;
BEGIN
  -- Obtener user_id y email del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No autenticado'
    );
  END IF;

  -- Obtener email del usuario
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email no encontrado'
    );
  END IF;

  -- Normalizar email
  v_user_email := lower(trim(v_user_email));

  -- Buscar invitación válida
  SELECT * INTO v_invite
  FROM public.tenant_invites
  WHERE tenant_id = p_tenant_id
    AND lower(trim(email)) = v_user_email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitación no encontrada, expirada o ya aceptada'
    );
  END IF;

  -- Verificar si ya existe membership
  SELECT id INTO v_existing_membership
  FROM public.tenant_users
  WHERE tenant_id = p_tenant_id
    AND user_id = v_user_id;

  IF v_existing_membership IS NOT NULL THEN
    -- Ya existe, solo actualizar el invite
    UPDATE public.tenant_invites
    SET status = 'accepted',
        accepted_at = now()
    WHERE id = v_invite.id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Ya eras miembro del tenant'
    );
  END IF;

  -- Crear tenant_user
  INSERT INTO public.tenant_users (
    tenant_id,
    user_id,
    role_key,
    is_active
  ) VALUES (
    p_tenant_id,
    v_user_id,
    v_invite.role_key,
    true  -- Activar automáticamente
  );

  -- Marcar invitación como aceptada
  UPDATE public.tenant_invites
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'role', v_invite.role_key,
    'tenant_id', p_tenant_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Comentario
COMMENT ON FUNCTION public.api_accept_invite IS 
  'Acepta una invitación pendiente y crea tenant_user automáticamente';

-- ============================================================================
-- 5. VERIFICACIÓN
-- ============================================================================

-- Verificar tabla creada
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tenant_invites';

-- Verificar función creada
SELECT 
  proname,
  prosecdef
FROM pg_proc 
WHERE proname = 'api_accept_invite';
