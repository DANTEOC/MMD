# TICKET U-02 — Tablas base multi-tenant

## Implementación

Se crearon las tablas base del sistema multi-tenant: `tenants` y `tenant_users`, con todas las especificaciones requeridas.

---

## 📋 1. QUÉ SE IMPLEMENTÓ

### **A) Tabla `tenants`**
Tabla principal de organizaciones/empresas en el sistema.

**Columnas:**
- `id` UUID PRIMARY KEY (auto-generado)
- `name` TEXT NOT NULL
- `slug` TEXT UNIQUE NOT NULL (identificador amigable para URLs)
- `is_active` BOOLEAN DEFAULT true (soft delete)
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now() (auto-actualizado por trigger)

**Índices:**
- `idx_tenants_slug` en `slug`
- `idx_tenants_is_active` en `is_active`

---

### **B) Tabla `tenant_users`**
Vínculo entre usuarios (auth.users) y tenants con asignación de roles.

**Columnas:**
- `id` UUID PRIMARY KEY (auto-generado)
- `tenant_id` UUID NOT NULL → FK a `tenants(id)` ON DELETE CASCADE
- `user_id` UUID NOT NULL → FK a `auth.users(id)` ON DELETE CASCADE
- `role_key` TEXT NOT NULL CHECK (`'Admin'`, `'Operador'`, `'Tecnico'`, `'Lectura'`)
- `is_active` BOOLEAN DEFAULT true
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now() (auto-actualizado por trigger)

**Constraints:**
- `unique_user_per_tenant` UNIQUE (`tenant_id`, `user_id`)
- CHECK constraint en `role_key` con valores permitidos

**Índices:**
- `idx_tenant_users_tenant_id` en `tenant_id`
- `idx_tenant_users_user_id` en `user_id`
- `idx_tenant_users_role_key` en `role_key`
- `idx_tenant_users_is_active` en `is_active`
- `idx_tenant_users_active_lookup` compuesto en `(user_id, tenant_id)` WHERE `is_active = true`

---

### **C) Función Helper y Triggers**

**Función `update_updated_at_column()`:**
- Función genérica para actualizar automáticamente `updated_at` en cada UPDATE.
- Usada por ambas tablas mediante triggers.

**Triggers:**
- `set_updated_at_tenants` en tabla `tenants`
- `set_updated_at_tenant_users` en tabla `tenant_users`
- **Idempotente**: Usa `DROP TRIGGER IF EXISTS` antes de crear

---

## 📁 2. ARCHIVOS AFECTADOS

### **Modificados:**
- [`20260122_u02_base_multitenant_tables.sql`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/supabase/migrations/20260122_u02_base_multitenant_tables.sql)
  - ✅ Corregido para ser idempotente (añadido `DROP TRIGGER IF EXISTS`)

### **Creados:**
- [`validate_u02_base_tables.sql`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/supabase/migrations/validate_u02_base_tables.sql)
  - ✅ Script de validación completo compatible con Supabase SQL Editor

- [`U-02-base-tables.md`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/docs/U-02-base-tables.md)
  - ✅ Este archivo de documentación

**Total:** 1 archivo modificado, 2 archivos creados

---

## 🧪 3. CÓMO PROBAR LA FUNCIONALIDAD

### **Paso 1: Ejecutar la Migración**

1. Abrir **Supabase Dashboard** → SQL Editor
2. Copiar contenido completo de [`20260122_u02_base_multitenant_tables.sql`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/supabase/migrations/20260122_u02_base_multitenant_tables.sql)
3. Pegar en SQL Editor y ejecutar
4. ✅ Debe completarse sin errores (incluso si ya fue ejecutado previamente)

### **Paso 2: Validar la Estructura**

1. Copiar contenido de [`validate_u02_base_tables.sql`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/supabase/migrations/validate_u02_base_tables.sql)
2. Ejecutar en Supabase SQL Editor
3. Verificar resultados esperados:

**Query 1: Tablas creadas**
```
table_name      | table_type
----------------+-----------
tenants         | BASE TABLE
tenant_users    | BASE TABLE
```

**Query 4: CHECK constraint de roles**
```
constraint_name         | constraint_definition
------------------------+--------------------------------------------------
tenant_users_role_key_check | CHECK (role_key IN ('Admin', 'Operador', 'Tecnico', 'Lectura'))
```

**Query 5: UNIQUE constraint**
```
constraint_name         | constraint_definition
------------------------+----------------------------------
unique_user_per_tenant  | UNIQUE (tenant_id, user_id)
```

**Query 10: Test insert/rollback**
```
NOTICE: Test tenant created with ID: <uuid>
NOTICE: Test completed and rolled back successfully
```

### **Paso 3: Pruebas Manuales**

#### **Test: Crear un tenant**
```sql
INSERT INTO public.tenants (name, slug, is_active)
VALUES ('Mi Empresa', 'mi-empresa', true)
RETURNING *;
```
✅ Debe retornar el tenant creado con `id` UUID generado

#### **Test: Verificar trigger de updated_at**
```sql
-- Obtener el tenant recién creado
SELECT id, updated_at FROM public.tenants WHERE slug = 'mi-empresa';

-- Esperar 1 segundo y actualizar
UPDATE public.tenants 
SET name = 'Mi Empresa Actualizada' 
WHERE slug = 'mi-empresa';

-- Verificar que updated_at cambió
SELECT id, name, updated_at FROM public.tenants WHERE slug = 'mi-empresa';
```
✅ `updated_at` debe ser mayor que antes

#### **Test: Crear usuario en tenant (requiere auth.users)**
```sql
-- Primero: crear usuario en auth (o usar uno existente)
-- Luego: vincular con tenant
INSERT INTO public.tenant_users (tenant_id, user_id, role_key, is_active)
VALUES (
    '<uuid-del-tenant>',
    '<uuid-del-usuario-en-auth>',
    'Admin',
    true
)
RETURNING *;
```
✅ Debe crear el vínculo correctamente

#### **Test: Constraint UNIQUE (tenant_id, user_id)**
```sql
-- Intentar insertar el mismo usuario en el mismo tenant
INSERT INTO public.tenant_users (tenant_id, user_id, role_key, is_active)
VALUES (
    '<mismo-tenant>',
    '<mismo-usuario>',
    'Operador',
    true
);
```
❌ Debe fallar con error: `duplicate key value violates unique constraint "unique_user_per_tenant"`

#### **Test: CHECK constraint de roles**
```sql
INSERT INTO public.tenant_users (tenant_id, user_id, role_key, is_active)
VALUES (
    '<uuid-tenant>',
    '<uuid-usuario>',
    'RolInvalido',
    true
);
```
❌ Debe fallar con error: `new row violates check constraint "tenant_users_role_key_check"`

---

## 🚫 4. QUÉ EXPLÍCITAMENTE NO SE TOCÓ

- ❌ **No se implementó RLS** (Row Level Security) - será en ticket U-03
- ❌ **No se crearon policies** de seguridad - será en ticket U-03
- ❌ **No se insertaron datos seed** - será en ticket U-05
- ❌ **No se creó UI** para gestión de tenants o usuarios
- ❌ **No se implementaron funciones helper** para RLS (ej: `get_user_tenant_id()`)
- ❌ **No se crearon vistas** o materialized views
- ❌ **No se implementó lógica de negocio** en la aplicación
- ❌ **No se crearon endpoints API**
- ❌ **No se modificaron otras tablas** existentes

---

## 📝 NOTAS TÉCNICAS

### **Solución al Error de Trigger Duplicado**

**Problema original:**
```
ERROR: 42710: trigger "set_updated_at_tenants" for relation "tenants" already exists
```

**Solución implementada:**
Se añadió `DROP TRIGGER IF EXISTS` antes de cada `CREATE TRIGGER` para hacer el script idempotente:

```sql
DROP TRIGGER IF EXISTS set_updated_at_tenants ON public.tenants;
CREATE TRIGGER set_updated_at_tenants
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

Ahora el script puede ejecutarse múltiples veces sin error.

### **Decisiones de Diseño**

1. **UUID como PK:** Mejora seguridad (no secuencial) y facilita replicación/merge.

2. **Soft Delete (`is_active`):** Permite desactivar tenants sin perder datos históricos.

3. **UNIQUE (tenant_id, user_id):** Un usuario solo puede tener un rol por tenant (evita duplicados).

4. **CHECK constraint en roles:** Garantiza integridad de datos a nivel DB.

5. **Índices compuestos:** Optimiza queries frecuentes (ej: buscar usuario activo en tenant).

### **Compatibilidad SQL**

- ✅ 100% compatible con Supabase SQL Editor
- ✅ No usa comandos psql (`\echo`, `\set`, etc.)
- ✅ Usa solo PostgreSQL estándar
- ✅ Idempotente (puede ejecutarse múltiples veces)

---

## ✅ CHECKLIST DE ENTREGA

- [x] Tabla `tenants` con UUID PK y campos requeridos
- [x] Tabla `tenant_users` con FKs a `auth.users` y `tenants`
- [x] Constraint CHECK para roles (`Admin`, `Operador`, `Tecnico`, `Lectura`)
- [x] Constraint UNIQUE para `(tenant_id, user_id)`
- [x] Índices en `tenant_id`, `user_id` y otros campos relevantes
- [x] Triggers de `updated_at` automáticos
- [x] SQL compatible con Supabase SQL Editor
- [x] Script idempotente (puede re-ejecutarse sin error)
- [x] Script de validación compatible con Supabase
- [x] Documentación completa

---

**Fecha de implementación:** 2026-01-22  
**Ticket:** U-02  
**Estado:** ✅ COMPLETADO
