# TICKET C-01-DB — Tablas Configuración + RLS + Seed Módulos

## Implementación

Se crearon las tablas de configuración para el sistema multi-tenant con RLS estricto (solo Admin) y seed automático de módulos.

---

## 📋 1. QUÉ SE IMPLEMENTÓ

### **A) Tabla `tenant_settings`**
Configuración general por tenant (1 fila por tenant):

**Columnas:**
- `tenant_id` UUID PK FK → `tenants(id)` ON DELETE CASCADE
- `nombre_comercial` TEXT
- `razon_social` TEXT
- `rfc` TEXT
- `email` TEXT
- `telefono` TEXT
- `domicilio_fiscal` TEXT
- `logo_url` TEXT (URL del logo, MVP)
- `iva_rate` NUMERIC(5,2) DEFAULT 16.00 (tasa IVA México)
- `otro_impuesto_rate` NUMERIC(5,2) DEFAULT 0.00
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now() (auto-actualizado por trigger)

**Características:**
- PK en `tenant_id` garantiza 1 fila por tenant
- Trigger automático para `updated_at`
- RLS habilitado: **SOLO Admin** puede SELECT/INSERT/UPDATE/DELETE

---

### **B) Tabla `tenant_modules`**
Feature flags de módulos habilitados por tenant:

**Columnas:**
- `tenant_id` UUID FK → `tenants(id)` ON DELETE CASCADE
- `module_key` TEXT CHECK (lista de módulos permitidos)
- `enabled` BOOLEAN DEFAULT true
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now() (auto-actualizado por trigger)
- **PK compuesta:** `(tenant_id, module_key)`

**Módulos permitidos (CHECK constraint):**
1. `clientes`
2. `proveedores`
3. `inventario`
4. `compras`
5. `ordenes_servicio`
6. `cotizaciones`
7. `bancos`
8. `ingresos_gastos`
9. `proyectos_tareas`

**Características:**
- Índice parcial `idx_tenant_modules_enabled` para queries de módulos activos
- Trigger automático para `updated_at`
- RLS habilitado: **SOLO Admin** puede SELECT/INSERT/UPDATE/DELETE

---

### **C) Seed Automático**
Inserción automática de todos los módulos habilitados para cada tenant existente:

```sql
INSERT INTO tenant_modules (tenant_id, module_key, enabled)
SELECT t.id, m.module_key, true
FROM tenants t
CROSS JOIN (VALUES ('clientes'), ('proveedores'), ...) AS m(module_key)
ON CONFLICT (tenant_id, module_key) DO NOTHING;
```

- ✅ Idempotente (ON CONFLICT DO NOTHING)
- ✅ Funciona con múltiples tenants
- ✅ Todos los módulos habilitados por defecto

---

### **D) RLS Policies**

Ambas tablas tienen **4 policies** (SELECT, INSERT, UPDATE, DELETE):

#### **tenant_settings:**
- `tenant_settings_select_admin_only` → Solo Admin puede ver
- `tenant_settings_insert_admin_only` → Solo Admin puede crear
- `tenant_settings_update_admin_only` → Solo Admin puede actualizar
- `tenant_settings_delete_admin_only` → Solo Admin puede eliminar

#### **tenant_modules:**
- `tenant_modules_select_admin_only` → Solo Admin puede ver
- `tenant_modules_insert_admin_only` → Solo Admin puede crear
- `tenant_modules_update_admin_only` → Solo Admin puede actualizar
- `tenant_modules_delete_admin_only` → Solo Admin puede eliminar

**Todas las policies usan:** `public.is_tenant_admin(tenant_id)` (función helper de U-03)

---

## 📁 2. ARCHIVOS CREADOS/MODIFICADOS

### **Archivos SQL Creados:**
```
supabase/migrations/
├── 20260122_c01_config_tables.sql        ⭐ Migración principal
└── validate_c01_config_tables.sql        ⭐ Script de validación
```

### **Documentación Creada:**
```
docs/
└── C-01-config-tables.md                 ⭐ Este archivo
```

**Total:** 3 archivos creados, 0 modificados

---

## 🧪 3. CÓMO PROBAR LA FUNCIONALIDAD

### **Paso 1: Ejecutar la Migración**

1. Abrir **Supabase Dashboard** → SQL Editor
2. Copiar y pegar el contenido de `20260122_c01_config_tables.sql`
3. Ejecutar el script
4. ✅ Debe completarse sin errores

### **Paso 2: Validar la Estructura**

1. En Supabase SQL Editor, ejecutar `validate_c01_config_tables.sql`
2. Verificar resultados esperados:

#### **Query 1: Tablas creadas**
```
table_name       | table_type
-----------------+-----------
tenant_modules   | BASE TABLE
tenant_settings  | BASE TABLE
```

#### **Query 6: RLS habilitado**
```
tablename        | rls_enabled
-----------------+------------
tenant_modules   | true
tenant_settings  | true
```

#### **Query 8: Conteo de policies**
```
tablename        | policy_count
-----------------+-------------
tenant_modules   | 4
tenant_settings  | 4
```

#### **Query 10: Módulos seeded**
```
tenant_id                              | module_count | enabled_count
---------------------------------------+--------------+--------------
<uuid-tenant-1>                        | 9            | 9
<uuid-tenant-2>                        | 9            | 9
```

#### **Query 12: Sin duplicados**
```
(0 rows)  ← Debe estar vacío
```

### **Paso 3: Probar RLS con Usuario Admin**

1. Crear usuario Admin en tenant (si no existe):
```sql
-- Obtener user_id de auth.users y tenant_id de tenants
INSERT INTO public.tenant_users (user_id, tenant_id, role_key, is_active)
VALUES (
    '<uuid-usuario>',
    '<uuid-tenant>',
    'Admin',
    true
);
```

2. Autenticarse como ese usuario en la aplicación

3. Probar SELECT en `tenant_settings`:
```sql
SELECT * FROM public.tenant_settings;
-- ✅ Debe retornar la configuración de SU tenant (si existe)
```

4. Probar INSERT en `tenant_settings`:
```sql
INSERT INTO public.tenant_settings (
    tenant_id, 
    nombre_comercial, 
    razon_social, 
    rfc, 
    email
) VALUES (
    '<uuid-tenant-del-usuario>',
    'Mi Empresa',
    'Mi Empresa S.A. de C.V.',
    'XAXX010101000',
    'contacto@miempresa.com'
);
-- ✅ Debe insertar correctamente
```

5. Probar SELECT en `tenant_modules`:
```sql
SELECT * FROM public.tenant_modules ORDER BY module_key;
-- ✅ Debe retornar 9 módulos habilitados de SU tenant
```

6. Probar UPDATE en `tenant_modules`:
```sql
UPDATE public.tenant_modules
SET enabled = false
WHERE tenant_id = '<uuid-tenant-del-usuario>'
  AND module_key = 'proyectos_tareas';
-- ✅ Debe actualizar correctamente
```

### **Paso 4: Probar RLS con Usuario NO Admin**

1. Crear usuario NO Admin:
```sql
INSERT INTO public.tenant_users (user_id, tenant_id, role_key, is_active)
VALUES (
    '<uuid-usuario-2>',
    '<uuid-tenant>',
    'Operador',  -- NO Admin
    true
);
```

2. Autenticarse como ese usuario

3. Probar SELECT en `tenant_settings`:
```sql
SELECT * FROM public.tenant_settings;
-- ✅ Debe retornar 0 filas (bloqueado por RLS)
```

4. Probar SELECT en `tenant_modules`:
```sql
SELECT * FROM public.tenant_modules;
-- ✅ Debe retornar 0 filas (bloqueado por RLS)
```

5. Probar INSERT en `tenant_settings`:
```sql
INSERT INTO public.tenant_settings (tenant_id, nombre_comercial)
VALUES ('<uuid-tenant>', 'Test');
-- ❌ Debe fallar con error de RLS
```

### **Paso 5: Verificar Seed Automático**

1. Crear un nuevo tenant:
```sql
INSERT INTO public.tenants (name, slug, is_active)
VALUES ('Nuevo Tenant', 'nuevo-tenant', true)
RETURNING id;
```

2. Ejecutar nuevamente el seed (parte del script C-01):
```sql
INSERT INTO public.tenant_modules (tenant_id, module_key, enabled)
SELECT t.id, m.module_key, true
FROM public.tenants t
CROSS JOIN (VALUES 
    ('clientes'), ('proveedores'), ('inventario'), 
    ('compras'), ('ordenes_servicio'), ('cotizaciones'),
    ('bancos'), ('ingresos_gastos'), ('proyectos_tareas')
) AS m(module_key)
ON CONFLICT (tenant_id, module_key) DO NOTHING;
```

3. Verificar que el nuevo tenant tiene 9 módulos:
```sql
SELECT COUNT(*) 
FROM public.tenant_modules 
WHERE tenant_id = '<uuid-nuevo-tenant>';
-- ✅ Debe retornar 9
```

---

## 🚫 4. QUÉ EXPLÍCITAMENTE NO SE TOCÓ

- ❌ **No se creó UI** para gestión de configuración
- ❌ **No se modificaron tablas existentes** (solo referencias FK)
- ❌ **No se crearon triggers adicionales** (solo updated_at que ya existía)
- ❌ **No se implementó lógica de negocio** en la aplicación
- ❌ **No se crearon endpoints API** para estas tablas
- ❌ **No se implementó validación de RFC** (solo almacenamiento)
- ❌ **No se implementó upload de logos** (solo campo logo_url)
- ❌ **No se crearon vistas** o materialized views
- ❌ **No se agregaron auditorías** adicionales
- ❌ **No se modificaron policies existentes** de otras tablas

---

## 📝 NOTAS TÉCNICAS

### **Decisiones de Diseño:**

1. **`logo_url` vs `logo_storage_path`:**
   - Se eligió `logo_url` para MVP
   - Permite usar URLs externas o Supabase Storage
   - Más flexible para fase inicial

2. **Seed con CROSS JOIN:**
   - Evita loops explícitos (compatible con Supabase)
   - Idempotente con ON CONFLICT DO NOTHING
   - Funciona con múltiples tenants simultáneamente

3. **RLS Solo Admin:**
   - Configuración sensible (fiscal, tasas de impuestos)
   - Feature flags afectan funcionalidad del sistema
   - Solo Admin debe tener control total

4. **PK en tenant_settings:**
   - `tenant_id` como PK garantiza 1 fila por tenant
   - No se necesita `id` separado
   - Simplifica queries y relaciones

5. **CHECK constraint en module_key:**
   - Garantiza integridad de datos
   - Lista explícita de módulos permitidos
   - Facilita validación en aplicación

### **Compatibilidad SQL:**

- ✅ 100% compatible con Supabase SQL Editor
- ✅ No usa comandos psql (`\echo`, `\set`, etc.)
- ✅ Usa solo PostgreSQL estándar
- ✅ Idempotente (IF NOT EXISTS, ON CONFLICT)

### **Performance:**

- ✅ Índice parcial en `tenant_modules` para queries de módulos activos
- ✅ PK compuesta optimiza lookups por (tenant_id, module_key)
- ✅ FK con ON DELETE CASCADE evita huérfanos
- ✅ Funciones helper STABLE para caching en RLS

---

## 🔄 PRÓXIMOS PASOS SUGERIDOS

1. **UI de Configuración (Ticket futuro):**
   - Formulario para editar `tenant_settings`
   - Toggle switches para `tenant_modules`
   - Upload de logo a Supabase Storage

2. **Validaciones de Negocio (Ticket futuro):**
   - Validar formato RFC (México)
   - Validar formato email
   - Validar rangos de tasas de impuestos

3. **Auditoría (Ticket futuro):**
   - Tabla de historial de cambios en configuración
   - Trigger para registrar quién modificó qué

---

## ✅ CHECKLIST DE ENTREGA

- [x] Tabla `tenant_settings` creada con todas las columnas especificadas
- [x] Tabla `tenant_modules` creada con CHECK constraint
- [x] Seed automático de 9 módulos por tenant
- [x] RLS habilitado en ambas tablas
- [x] 4 policies por tabla (SELECT, INSERT, UPDATE, DELETE)
- [x] Policies usan `is_tenant_admin()` correctamente
- [x] Triggers de `updated_at` configurados
- [x] Índices apropiados creados
- [x] Script de validación compatible con Supabase
- [x] Documentación completa
- [x] SQL 100% compatible con Supabase SQL Editor
- [x] No se tocaron tablas existentes
- [x] No se creó UI

---

**Fecha de implementación:** 2026-01-21  
**Ticket:** C-01-DB  
**Estado:** ✅ COMPLETADO
