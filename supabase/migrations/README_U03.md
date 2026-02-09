# TICKET U-03 — RLS Base Multi-Tenant

## ✅ Entregables

### Archivos creados:
- `supabase/migrations/20260122_u03_rls_multitenant_policies.sql`

### Qué se hizo:

#### 1. **Funciones Helper SQL** (reutilizables en toda la app)
- `get_user_tenant_id()`: Retorna el tenant_id del usuario autenticado
- `user_belongs_to_tenant(uuid)`: Verifica si el usuario pertenece a un tenant
- `is_tenant_admin(uuid)`: Verifica si el usuario es Admin de un tenant
- `get_user_role(uuid)`: Retorna el rol del usuario en un tenant

Todas marcadas como `SECURITY DEFINER STABLE` para performance y seguridad.

#### 2. **RLS Habilitado**
- `ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY`

#### 3. **Policies en `tenants`**

| Operación | Policy | Regla |
|-----------|--------|-------|
| **SELECT** | `tenants_select_own_tenant` | ✅ Solo si `user_belongs_to_tenant(id)` |
| **UPDATE** | `tenants_update_admin_only` | ✅ Solo si `is_tenant_admin(id)` |
| **INSERT** | ❌ Sin policy | Bloqueado (proceso administrativo) |
| **DELETE** | ❌ Sin policy | Bloqueado (usar soft delete) |

#### 4. **Policies en `tenant_users`**

| Operación | Policy | Regla |
|-----------|--------|-------|
| **SELECT** | `tenant_users_select_same_tenant` | ✅ Solo si `user_belongs_to_tenant(tenant_id)` |
| **UPDATE** | ❌ Sin policy | Bloqueado en MVP |
| **INSERT** | ❌ Sin policy | Bloqueado en MVP |
| **DELETE** | ❌ Sin policy | Bloqueado en MVP |

---

## 🚀 Cómo aplicar la migración

### Opción 1: Supabase SQL Editor (recomendado)

1. Ir a tu proyecto Supabase → **SQL Editor**
2. Copiar todo el contenido de `20260122_u03_rls_multitenant_policies.sql`
3. Pegar en el editor
4. Ejecutar (Run)
5. Verificar que no hay errores

### Opción 2: Supabase CLI

```bash
supabase db push
```

---

## 🔍 Verificación post-migración

### 1. Verificar que RLS está habilitado

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tenants', 'tenant_users');
```

**Resultado esperado:** `rowsecurity = true` para ambas tablas.

---

### 2. Verificar funciones helper

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_tenant_id',
    'user_belongs_to_tenant',
    'is_tenant_admin',
    'get_user_role'
  );
```

**Resultado esperado:** 4 funciones tipo `FUNCTION`.

---

### 3. Verificar policies creadas

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'tenant_users')
ORDER BY tablename, cmd;
```

**Resultado esperado:**

| tablename | policyname | cmd |
|-----------|------------|-----|
| tenants | tenants_select_own_tenant | SELECT |
| tenants | tenants_update_admin_only | UPDATE |
| tenant_users | tenant_users_select_same_tenant | SELECT |

---

### 4. Probar funciones helper (requiere usuario autenticado)

```sql
-- Simular como usuario autenticado (reemplazar con UUID real)
SET request.jwt.claim.sub = 'tu-user-uuid-aqui';

-- Probar get_user_tenant_id
SELECT public.get_user_tenant_id();

-- Probar user_belongs_to_tenant
SELECT public.user_belongs_to_tenant('tenant-uuid-aqui');

-- Probar is_tenant_admin
SELECT public.is_tenant_admin('tenant-uuid-aqui');

-- Probar get_user_role
SELECT public.get_user_role('tenant-uuid-aqui');
```

---

## 🧪 Testing de seguridad

### Escenario 1: Usuario sin membresía

```sql
-- Como usuario sin tenant_users activo
SELECT * FROM tenants;
-- Resultado esperado: 0 filas (RLS bloquea)

SELECT * FROM tenant_users;
-- Resultado esperado: 0 filas (RLS bloquea)
```

### Escenario 2: Usuario Operador (no Admin)

```sql
-- Como usuario con role_key = 'Operador'
SELECT * FROM tenants;
-- Resultado esperado: Solo SU tenant

UPDATE tenants SET name = 'Nuevo Nombre' WHERE id = 'su-tenant-id';
-- Resultado esperado: ERROR (solo Admin puede UPDATE)
```

### Escenario 3: Usuario Admin

```sql
-- Como usuario con role_key = 'Admin'
SELECT * FROM tenants;
-- Resultado esperado: Solo SU tenant

UPDATE tenants SET name = 'Nuevo Nombre' WHERE id = 'su-tenant-id';
-- Resultado esperado: SUCCESS (Admin puede UPDATE)

UPDATE tenants SET name = 'Hack' WHERE id = 'otro-tenant-id';
-- Resultado esperado: 0 rows affected (RLS bloquea otros tenants)
```

### Escenario 4: Intentos de bypass

```sql
-- Intentar ver tenant_users de otro tenant
SELECT * FROM tenant_users WHERE tenant_id = 'otro-tenant-id';
-- Resultado esperado: 0 filas (RLS filtra automáticamente)

-- Intentar INSERT en tenant_users
INSERT INTO tenant_users (tenant_id, user_id, role_key) 
VALUES ('tenant-id', 'user-id', 'Admin');
-- Resultado esperado: ERROR (sin policy de INSERT)
```

---

## ⚠️ Notas de seguridad críticas

### ✅ Lo que SÍ está protegido:
- ✅ Usuarios solo ven datos de SU tenant
- ✅ Solo Admins pueden modificar tenants
- ✅ Imposible ver/modificar tenant_users de otros tenants
- ✅ Funciones helper usan `SECURITY DEFINER` (ejecutan con permisos del creador)
- ✅ Todas las policies verifican `is_active = true`

### ⚠️ Lo que NO está incluido (próximos tickets):
- ❌ Gestión de usuarios (INSERT/UPDATE en tenant_users)
- ❌ Creación de tenants (proceso administrativo pendiente)
- ❌ Auditoría de cambios
- ❌ Rate limiting
- ❌ Validaciones de negocio (ej. límite de usuarios por tenant)

### 🔒 Reglas de oro:
1. **NUNCA** deshabilitar RLS en producción
2. **NUNCA** confiar solo en validaciones de UI
3. **SIEMPRE** usar `auth.uid()` en policies
4. **SIEMPRE** verificar `is_active = true` en tenant_users
5. **SIEMPRE** probar con diferentes roles antes de deploy

---

## 🐛 Troubleshooting

### Error: "permission denied for function get_user_tenant_id"
**Solución:** Verificar que se ejecutó el `GRANT EXECUTE` al final del script.

```sql
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
```

### Error: "new row violates row-level security policy"
**Causa:** Intentando INSERT/UPDATE/DELETE sin policy habilitada.
**Solución:** Esto es CORRECTO en MVP. Esas operaciones deben hacerse por proceso administrativo.

### Queries retornan 0 filas siendo usuario válido
**Verificar:**
1. ¿El usuario tiene registro en `tenant_users`?
2. ¿El registro tiene `is_active = true`?
3. ¿El `user_id` coincide con `auth.uid()`?

```sql
-- Debug: ver membresías del usuario actual
SELECT * FROM tenant_users WHERE user_id = auth.uid();
```

### Performance lento en queries grandes
**Solución:** Las funciones helper están marcadas como `STABLE` para cacheo.
Si persiste, considerar índices adicionales en próximos tickets.

---

## 📋 Checklist de integración

- [ ] Migración aplicada sin errores
- [ ] RLS habilitado en ambas tablas (verificar con query)
- [ ] 4 funciones helper creadas
- [ ] 3 policies creadas (2 en tenants, 1 en tenant_users)
- [ ] Grants ejecutados correctamente
- [ ] Testing con usuario sin membresía → 0 filas ✅
- [ ] Testing con Operador → solo lectura ✅
- [ ] Testing con Admin → lectura + UPDATE ✅
- [ ] Documentar en changelog del proyecto
- [ ] Notificar al equipo que RLS está activo

---

## 🔗 Dependencias

**Requiere:**
- ✅ Migración U-02 aplicada (tablas `tenants` y `tenant_users`)
- ✅ Supabase Auth habilitado

**Habilita:**
- ✅ Desarrollo seguro de features multi-tenant
- ✅ Próximo ticket: U-04 (Guards server-side en Next.js)
- ✅ Próximo ticket: U-05 (Seeds de datos de prueba)

---

**Ticket:** U-03  
**Fecha:** 2026-01-22  
**Alcance:** Solo RLS y policies base (sin gestión de usuarios, sin UI)  
**Seguridad:** CRÍTICA — No hacer deploy sin probar todos los escenarios
