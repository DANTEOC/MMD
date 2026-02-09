# U-03 (Retroactivo) — RLS + Policies base multi-tenant

Fecha: 2026-01-22
Estado: Implementado manualmente y validado

## Objetivo
Habilitar RLS y dejar policies mínimas para operar multi-tenant con Supabase Auth.

## Decisión de arquitectura
Modelo B: Un usuario solo puede tener 1 tenant activo.
- Se habilita enforcement mediante índice parcial:
  - UNIQUE(user_id) WHERE is_active = true

## Estado verificado (evidencia)
- RLS activo:
  - tenant_users: relrowsecurity = true
  - tenants: relrowsecurity = true

- Policies existentes detectadas (pg_policies):
  tenant_users:
    - tenant_users_select_own (SELECT)
    - tenant_users_select_admin_of_tenant (SELECT)
    - tenant_users_select_same_tenant (SELECT) [preexistente o adicional]
    - tenant_users_insert_admin_of_tenant (INSERT)
    - tenant_users_update_admin_of_tenant (UPDATE)
    - tenant_users_delete_admin_of_tenant (DELETE)

  tenants:
    - tenants_select_if_member (SELECT)
    - tenants_select_own_tenant (SELECT) [preexistente o adicional]
    - tenants_update_admin_only (UPDATE) [preexistente o adicional]

## Resultado
- RLS y policies están presentes y activas en ambas tablas.
- Existe set adicional de policies (select_same_tenant / select_own_tenant / update_admin_only) que debe considerarse en auditorías futuras.

## Fuera de alcance (no realizado en U-03)
- No se creó UI ni guard server-side en Next.js.
- No se crearon seeds.
