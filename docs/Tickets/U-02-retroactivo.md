# U-02 (Retroactivo) — Tablas base multi-tenant

Fecha: 2026-01-22
Estado: Implementado manualmente y validado

## Objetivo
Registrar el estado real de las tablas base multi-tenant del proyecto MMD Maintenance.

## Alcance
- Tablas:
  - public.tenants
  - public.tenant_users
- Constraints e índices:
  - FK tenant_users.user_id -> auth.users(id)
  - FK tenant_users.tenant_id -> public.tenants(id)
  - CHECK tenant_users.role_key IN ('Admin','Operador','Tecnico','Lectura')
  - UNIQUE (tenant_id, user_id)

## Observaciones del estado real
- La tabla public.tenants incluye columna `slug` con constraint NOT NULL.
  - Por lo tanto, inserts de tenants requieren `name` + `slug`.

## Validaciones realizadas
- Insert de tenant con (name, slug) ejecutado correctamente.
- Se creó usuario en Supabase Auth (Authentication -> Users).
- Se insertó tenant_users correctamente con:
  - tenant_id real
  - auth.users.id real
  - role_key = 'Admin'

## Fuera de alcance (no realizado en U-02)
- No se implementaron RLS/policies (eso corresponde a U-03).
- No se agregaron seeds (eso corresponde a U-05).
- No se añadieron triggers ni funciones auxiliares.
