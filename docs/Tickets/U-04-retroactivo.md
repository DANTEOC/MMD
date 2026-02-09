# U-04 (Retroactivo) — RPC para cambiar tenant activo

Fecha: 2026-01-22
Estado: Implementado manualmente (SQL listo), pendiente de validación end-to-end desde sesión app

## Objetivo
Crear un mecanismo seguro para cambiar el tenant activo del usuario (modelo B: solo 1 activo).

## Entregable técnico
Función:
- public.api_set_active_tenant(p_tenant_id uuid)
- security definer
- search_path fijo a public
- grant execute a authenticated

## Comportamiento esperado
- Requiere usuario autenticado (auth.uid()).
- Valida membership: debe existir tenant_users para (auth.uid(), p_tenant_id).
- Desactiva cualquier tenant activo previo del usuario (is_active = false).
- Activa el tenant solicitado (is_active = true).
- Devuelve (tenant_id, role_key, is_active).

## Notas de prueba
- La prueba real requiere ejecutar la RPC desde un cliente autenticado (Next.js o cliente con sesión).
- Verificación posterior:
  - Para un user_id, solo debe existir 1 fila con is_active = true (por el índice parcial).
