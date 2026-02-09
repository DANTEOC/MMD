# TICKET U-05 — Seeds mínimos (DEV / STAGING)

## Implementación

Se creó un script SQL para insertar datos mínimos en ambiente DEV/STAGING: tenant demo y usuario Admin vinculado.

---

## 📋 1. QUÉ SE IMPLEMENTÓ

### **A) Tenant Demo**
Tenant de demostración para MMD Maintenance:

**Datos:**
- `id`: `00000000-0000-0000-0000-000000000001` (UUID fijo para DEV)
- `name`: `MMD Maintenance Demo`
- `slug`: `mmd-demo`
- `is_active`: `true`

**Características:**
- Idempotente: usa `ON CONFLICT DO UPDATE`
- UUID fijo facilita referencias en tests y desarrollo

---

### **B) Usuario Admin Vinculado**
Vínculo de un usuario existente de Supabase Auth como Admin del tenant demo:

**Proceso:**
1. Desactiva cualquier tenant activo previo del usuario (modelo B)
2. Inserta o actualiza el vínculo con `tenant_users`:
   - `tenant_id`: UUID del tenant demo
   - `user_id`: UUID del usuario de Auth (configurable)
   - `role_key`: `Admin`
   - `is_active`: `true`

**Características:**
- Respeta modelo B: solo 1 tenant activo por usuario
- Idempotente: usa `ON CONFLICT DO UPDATE`
- Requiere usuario existente en `auth.users`

---

### **C) Validación Modelo B**
Query de verificación para confirmar que ningún usuario tiene múltiples tenants activos:

```sql
SELECT user_id, COUNT(*) as active_tenants_count
FROM public.tenant_users
WHERE is_active = true
GROUP BY user_id
HAVING COUNT(*) > 1;
```

✅ Si retorna 0 filas: Modelo B respetado  
❌ Si retorna filas: Violación del modelo B

---

## 📁 2. ARCHIVOS CREADOS

### **SQL Creado:**
- [`20260122_u05_seeds_dev.sql`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/supabase/migrations/20260122_u05_seeds_dev.sql)
  - ✅ Script completo de seeds con instrucciones

### **Documentación Creada:**
- [`U-05-seeds-dev.md`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/docs/U-05-seeds-dev.md)
  - ✅ Este archivo de documentación

**Total:** 2 archivos creados

---

## 🧪 3. CÓMO PROBAR LA FUNCIONALIDAD

### **Requisitos Previos**

1. **Crear usuario en Supabase Auth:**
   - Ir a Supabase Dashboard → **Authentication** → **Users**
   - Click en **Add user** → **Create new user**
   - Ingresar email y contraseña
   - Copiar el **UUID** del usuario creado

2. **Configurar el script:**
   - Abrir [`20260122_u05_seeds_dev.sql`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/supabase/migrations/20260122_u05_seeds_dev.sql)
   - Buscar `<TU-USER-ID-AQUI>` (aparece 3 veces)
   - Reemplazar con el UUID del usuario creado

---

### **Paso 1: Ejecutar Seeds**

1. Abrir **Supabase Dashboard** → **SQL Editor**
2. Copiar contenido completo de `20260122_u05_seeds_dev.sql` (ya configurado)
3. Ejecutar el script
4. ✅ Debe completarse sin errores

**Salida esperada:**

```sql
-- Query 1: Verificar tenant creado
id                                   | name                    | slug      | is_active
-------------------------------------|-------------------------|-----------|----------
00000000-0000-0000-0000-000000000001 | MMD Maintenance Demo    | mmd-demo  | true

-- Query 2: Verificar vínculo creado
tenant_id                            | user_id              | role_key | is_active | tenant_name
-------------------------------------|----------------------|----------|-----------|--------------------
00000000-0000-0000-0000-000000000001 | <tu-uuid>            | Admin    | true      | MMD Maintenance Demo

-- Query 3: Validación modelo B
(0 rows)  ← ✅ Ningún usuario con múltiples tenants activos
```

---

### **Paso 2: Validar desde la Aplicación**

1. **Iniciar sesión** con el usuario creado en Supabase Auth

2. **Probar guards server-side:**
   ```typescript
   // En cualquier página protegida
   import { requireAuth } from '@/lib/auth'
   
   export default async function Page() {
     const auth = await requireAuth()
     // Debe retornar:
     // - userId: <tu-uuid>
     // - tenantId: 00000000-0000-0000-0000-000000000001
     // - roleKey: 'Admin'
   }
   ```

3. **Probar acceso a configuración:**
   - Navegar a `/configuracion`
   - ✅ Debe mostrar la página (usuario es Admin)

---

### **Paso 3: Pruebas Manuales Adicionales**

#### **Test: Verificar tenant demo**
```sql
SELECT * FROM public.tenants 
WHERE id = '00000000-0000-0000-0000-000000000001';
```
✅ Debe retornar el tenant demo

#### **Test: Verificar usuario Admin**
```sql
SELECT 
    tu.*,
    t.name as tenant_name,
    u.email as user_email
FROM public.tenant_users tu
JOIN public.tenants t ON t.id = tu.tenant_id
JOIN auth.users u ON u.id = tu.user_id
WHERE tu.tenant_id = '00000000-0000-0000-0000-000000000001';
```
✅ Debe mostrar el usuario vinculado como Admin

#### **Test: Intentar activar segundo tenant (debe fallar por modelo B)**
```sql
-- Crear segundo tenant
INSERT INTO public.tenants (name, slug)
VALUES ('Segundo Tenant', 'segundo-tenant')
RETURNING id;

-- Intentar vincular el mismo usuario con is_active=true
INSERT INTO public.tenant_users (tenant_id, user_id, role_key, is_active)
VALUES (
    '<id-segundo-tenant>',
    '<tu-user-id>',
    'Admin',
    true
);
```
❌ Debe fallar con error: `duplicate key value violates unique constraint "ux_tenant_users_one_active_tenant_per_user"`

---

## 🚫 4. QUÉ EXPLÍCITAMENTE NO SE TOCÓ

- ❌ **No se crearon usuarios en `auth.users`** (debe hacerse manualmente en Dashboard)
- ❌ **No se insertaron datos en `tenant_settings`** (tabla de configuración)
- ❌ **No se insertaron datos en `tenant_modules`** (feature flags)
- ❌ **No se crearon múltiples tenants** (solo 1 demo)
- ❌ **No se crearon múltiples usuarios** (solo 1 Admin)
- ❌ **No se implementó UI** para gestión de seeds
- ❌ **No se crearon scripts de rollback**
- ❌ **No se agregaron datos de producción**

---

## 📝 NOTAS TÉCNICAS

### **Decisiones de Diseño**

1. **UUID fijo para tenant demo:**
   - Facilita referencias en tests y desarrollo
   - Evita conflictos en re-ejecuciones
   - Patrón común en seeds de desarrollo

2. **Idempotencia con ON CONFLICT:**
   - Permite re-ejecutar el script sin errores
   - Actualiza datos si ya existen
   - Seguro para ambientes de desarrollo

3. **No crear usuarios en auth.users:**
   - Supabase Auth maneja la creación de usuarios
   - Evita conflictos con sistema de autenticación
   - Respeta separación de responsabilidades

4. **Validación explícita del modelo B:**
   - Query de verificación incluida en el script
   - Alerta inmediata si hay violaciones
   - Documenta el constraint esperado

### **Modelo B: 1 Tenant Activo por Usuario**

El script respeta estrictamente el modelo B mediante:

1. **UPDATE previo:** Desactiva cualquier tenant activo antes de insertar
2. **Índice parcial:** `ux_tenant_users_one_active_tenant_per_user` enforza el constraint
3. **Validación post-insert:** Query verifica que no hay violaciones

### **Uso en Diferentes Ambientes**

**DEV/Local:**
- Ejecutar tal cual con usuario de prueba

**STAGING:**
- Cambiar UUID del tenant si se requiere
- Usar usuario de prueba específico de staging

**PRODUCCIÓN:**
- ❌ **NO ejecutar este script**
- Crear seeds específicos de producción
- Usar UUIDs diferentes

---

## ✅ CHECKLIST DE ENTREGA

- [x] Script SQL completo y ejecutable
- [x] Tenant demo creado con UUID fijo
- [x] Usuario Admin vinculado (configurable)
- [x] Respeta modelo B (1 tenant activo por usuario)
- [x] Idempotente (ON CONFLICT DO UPDATE)
- [x] Validación de modelo B incluida
- [x] Instrucciones claras de configuración
- [x] Compatible con Supabase SQL Editor
- [x] Documentación completa

---

**Fecha de implementación:** 2026-01-22  
**Ticket:** U-05  
**Estado:** ✅ COMPLETADO  
**Ambiente:** DEV / STAGING
