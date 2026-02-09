# 🔍 REVISIÓN COMPLETA: U-03 PATCH Multi-Tenant Fix

**Archivo:** `0003_u03_patch_multitenant_fix.sql`  
**Fecha de revisión:** 2026-01-21  
**Revisor:** Agente Codificador  
**Estado:** ✅ APROBADO CON OBSERVACIONES

---

## 📋 Resumen Ejecutivo

El patch corrige **3 problemas críticos** de la migración U-03 original:

1. ✅ **Leak de seguridad**: Usuario podía tener múltiples tenants activos → comportamiento no determinista
2. ✅ **Performance**: Faltaban índices para queries RLS frecuentes
3. ✅ **Hardening**: `get_user_tenant_id()` ahora falla explícitamente si detecta estado inconsistente

**Veredicto:** El patch es **CORRECTO y NECESARIO**. Mejora significativamente la seguridad del sistema.

---

## ✅ Análisis Punto por Punto

### 1. UNIQUE INDEX: `ux_tenant_users_one_active_tenant_per_user`

```sql
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_users_one_active_tenant_per_user
ON public.tenant_users (user_id)
WHERE is_active = true;
```

#### ✅ Correcto:
- **Propósito**: Garantiza que un usuario solo puede tener **UNA** membresía activa a la vez (MVP)
- **Implementación**: Partial unique index en `user_id` donde `is_active = true`
- **Efecto**: Imposible insertar/actualizar para crear múltiples membresías activas
- **Performance**: Índice parcial → solo indexa filas activas (eficiente)

#### ⚠️ Observación:
- Esto **cambia el modelo de negocio** implícitamente
- En la migración U-02 original, el UNIQUE era `(tenant_id, user_id)` → permitía múltiples tenants por user
- Ahora: **1 user = 1 tenant activo máximo**
- **¿Es esto correcto para el MVP?** → Sí, según el contexto de "pequeñas empresas" tiene sentido

#### 🧪 Testing requerido:
```sql
-- Caso 1: Insertar segunda membresía activa (debe fallar)
INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active)
VALUES 
  ('tenant-1', 'user-1', 'Admin', true),
  ('tenant-2', 'user-1', 'Operador', true); -- ❌ DEBE FALLAR

-- Caso 2: Múltiples membresías inactivas (debe permitir)
INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active)
VALUES 
  ('tenant-1', 'user-1', 'Admin', false),
  ('tenant-2', 'user-1', 'Operador', false); -- ✅ DEBE PERMITIR

-- Caso 3: Activar segunda membresía (debe fallar)
UPDATE tenant_users 
SET is_active = true 
WHERE tenant_id = 'tenant-2' AND user_id = 'user-1'; -- ❌ DEBE FALLAR
```

---

### 2. FUNCIÓN REFACTORIZADA: `get_user_tenant_id()`

```sql
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_tenant_id uuid;
BEGIN
  SELECT COUNT(*), MAX(tenant_id)
    INTO v_count, v_tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid()
    AND is_active = true;

  IF v_count = 0 THEN
    RETURN NULL;
  END IF;

  IF v_count > 1 THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: user % has % active tenants', auth.uid(), v_count;
  END IF;

  RETURN v_tenant_id;
END;
$$;
```

#### ✅ Mejoras de seguridad:

1. **`SET search_path = public`**
   - ✅ **CRÍTICO**: Previene ataques de "search path injection"
   - Sin esto, un atacante podría crear funciones maliciosas en otro schema
   - Buena práctica en funciones `SECURITY DEFINER`

2. **Validación explícita de estado**
   - ✅ Cuenta cuántas membresías activas tiene el usuario
   - ✅ Si `count > 1` → **FALLA EXPLÍCITAMENTE** con excepción
   - Esto es **defense in depth**: aunque el UNIQUE INDEX previene esto, la función valida por si acaso

3. **Uso de `MAX(tenant_id)`**
   - ⚠️ **Potencial issue**: Si `v_count > 1`, `MAX()` retorna un valor arbitrario
   - ✅ **Pero está OK** porque inmediatamente lanza excepción
   - No hay riesgo de retornar tenant incorrecto

#### ✅ Performance:
- `COUNT(*)` + `MAX()` en una sola query → eficiente
- Con los nuevos índices, esta query será muy rápida

#### 🧪 Testing requerido:
```sql
-- Caso 1: Usuario sin membresías
SELECT public.get_user_tenant_id(); -- Debe retornar NULL

-- Caso 2: Usuario con 1 membresía activa
SELECT public.get_user_tenant_id(); -- Debe retornar UUID del tenant

-- Caso 3: Usuario con múltiples activas (estado corrupto)
-- Primero corromper data (solo en testing):
ALTER TABLE tenant_users DISABLE TRIGGER ALL;
INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active)
VALUES ('tenant-x', auth.uid(), 'Admin', true);
ALTER TABLE tenant_users ENABLE TRIGGER ALL;

-- Ahora probar:
SELECT public.get_user_tenant_id(); 
-- ❌ DEBE LANZAR: "SECURITY VIOLATION: user <uuid> has 2 active tenants"
```

---

### 3. ÍNDICES DE PERFORMANCE

```sql
-- Índice 1: Lookup por user + active
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_active
ON public.tenant_users (user_id, is_active)
WHERE is_active = true;

-- Índice 2: Lookup por user + tenant + active
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_tenant_active
ON public.tenant_users (user_id, tenant_id, is_active)
WHERE is_active = true;
```

#### ✅ Análisis:

**Índice 1: `idx_tenant_users_user_active`**
- **Uso**: Queries de las funciones helper (`get_user_tenant_id`, `user_belongs_to_tenant`)
- **Beneficio**: Acelera `WHERE user_id = auth.uid() AND is_active = true`
- **Partial index**: Solo indexa filas activas → menor tamaño, más rápido

**Índice 2: `idx_tenant_users_user_tenant_active`**
- **Uso**: `user_belongs_to_tenant(target_tenant_id)` y `is_tenant_admin(target_tenant_id)`
- **Beneficio**: Acelera `WHERE user_id = X AND tenant_id = Y AND is_active = true`
- **Partial index**: Solo indexa filas activas

#### ⚠️ Observación: Posible redundancia

El índice 2 **incluye** las columnas del índice 1 (`user_id, is_active`).

**Pregunta:** ¿Es necesario tener ambos?

**Análisis:**
- Postgres puede usar índice compuesto `(user_id, tenant_id, is_active)` para queries que solo filtran por `user_id`
- **PERO**: índices más anchos son menos eficientes para queries que no usan todas las columnas
- **Decisión:** Mantener ambos es **correcto** para este caso:
  - Índice 1 → optimizado para `get_user_tenant_id()` (muy frecuente)
  - Índice 2 → optimizado para `user_belongs_to_tenant()` (también frecuente)

#### 🧪 Testing de performance:
```sql
-- Verificar que los índices se usan
EXPLAIN ANALYZE
SELECT tenant_id 
FROM public.tenant_users 
WHERE user_id = auth.uid() 
  AND is_active = true;
-- Debe usar: idx_tenant_users_user_active

EXPLAIN ANALYZE
SELECT 1 
FROM public.tenant_users 
WHERE user_id = auth.uid() 
  AND tenant_id = 'some-uuid'
  AND is_active = true;
-- Debe usar: idx_tenant_users_user_tenant_active
```

---

## 🔒 Análisis de Seguridad

### ✅ Fortalezas:

1. **Defense in depth**
   - UNIQUE INDEX previene estado inconsistente a nivel DB
   - Función valida y falla explícitamente si detecta inconsistencia
   - Doble capa de protección

2. **Search path hardening**
   - `SET search_path = public` previene ataques de injection
   - Crítico en funciones `SECURITY DEFINER`

3. **Fail-secure**
   - Si hay múltiples tenants activos → **FALLA** (no retorna uno aleatorio)
   - Mejor fallar que permitir leak de datos

### ⚠️ Consideraciones:

1. **Cambio de modelo de negocio**
   - Original: usuario podía pertenecer a múltiples tenants
   - Nuevo: usuario solo puede tener 1 tenant activo
   - **¿Esto está documentado en requerimientos?**
   - Si en el futuro se necesita multi-tenant por usuario, habrá que:
     - Eliminar el UNIQUE INDEX
     - Modificar `get_user_tenant_id()` para recibir parámetro o usar contexto
     - Revisar todas las policies RLS

2. **Migración de datos existentes**
   - Si ya hay usuarios con múltiples tenants activos, el UNIQUE INDEX **fallará**
   - Necesitas script de limpieza antes de aplicar:
   ```sql
   -- Detectar usuarios con múltiples tenants activos
   SELECT user_id, COUNT(*) as active_count
   FROM tenant_users
   WHERE is_active = true
   GROUP BY user_id
   HAVING COUNT(*) > 1;
   
   -- Decidir qué hacer: desactivar todos menos uno, o fallar
   ```

---

## 📊 Impacto en Sistema

### Tablas afectadas:
- ✅ `tenant_users` (índices + constraint)

### Funciones afectadas:
- ✅ `get_user_tenant_id()` (refactorizada)

### Policies afectadas:
- ✅ Ninguna (las policies usan las funciones, que ahora son más seguras)

### Código Next.js afectado:
- ✅ Ninguno (si aún no hay código que dependa de multi-tenant por usuario)

---

## 🧪 Plan de Testing Completo

### 1. Testing de UNIQUE INDEX

```sql
-- Setup: Crear tenant y usuario de prueba
INSERT INTO tenants (id, name, slug) 
VALUES ('test-tenant-1', 'Test 1', 'test-1');

INSERT INTO tenants (id, name, slug) 
VALUES ('test-tenant-2', 'Test 2', 'test-2');

-- Test 1: Primera membresía activa (debe pasar)
INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active)
VALUES ('test-tenant-1', auth.uid(), 'Admin', true);
-- ✅ ESPERADO: SUCCESS

-- Test 2: Segunda membresía activa (debe fallar)
INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active)
VALUES ('test-tenant-2', auth.uid(), 'Operador', true);
-- ❌ ESPERADO: ERROR - duplicate key violates unique constraint

-- Test 3: Segunda membresía inactiva (debe pasar)
INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active)
VALUES ('test-tenant-2', auth.uid(), 'Operador', false);
-- ✅ ESPERADO: SUCCESS

-- Test 4: Activar segunda membresía (debe fallar)
UPDATE tenant_users 
SET is_active = true 
WHERE tenant_id = 'test-tenant-2' AND user_id = auth.uid();
-- ❌ ESPERADO: ERROR - duplicate key violates unique constraint

-- Test 5: Cambiar tenant (desactivar uno, activar otro)
BEGIN;
  UPDATE tenant_users SET is_active = false 
  WHERE tenant_id = 'test-tenant-1' AND user_id = auth.uid();
  
  UPDATE tenant_users SET is_active = true 
  WHERE tenant_id = 'test-tenant-2' AND user_id = auth.uid();
COMMIT;
-- ✅ ESPERADO: SUCCESS (dentro de transacción)
```

### 2. Testing de `get_user_tenant_id()`

```sql
-- Test 1: Sin membresías
DELETE FROM tenant_users WHERE user_id = auth.uid();
SELECT public.get_user_tenant_id();
-- ✅ ESPERADO: NULL

-- Test 2: Con 1 membresía activa
INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active)
VALUES ('test-tenant-1', auth.uid(), 'Admin', true);
SELECT public.get_user_tenant_id();
-- ✅ ESPERADO: 'test-tenant-1'

-- Test 3: Estado corrupto (solo en testing, requiere deshabilitar constraint)
-- NO EJECUTAR EN PRODUCCIÓN
```

### 3. Testing de Performance

```sql
-- Verificar uso de índices
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM tenant_users 
WHERE user_id = auth.uid() AND is_active = true;

-- Debe mostrar:
-- Index Scan using idx_tenant_users_user_active
```

### 4. Testing de RLS (regresión)

```sql
-- Verificar que las policies siguen funcionando
SELECT * FROM tenants;
-- ✅ ESPERADO: Solo tu tenant

SELECT * FROM tenant_users;
-- ✅ ESPERADO: Solo membresías de tu tenant

-- Como Operador, intentar UPDATE en tenant
UPDATE tenants SET name = 'Hack' WHERE id = public.get_user_tenant_id();
-- ❌ ESPERADO: ERROR (solo Admin puede UPDATE)
```

---

## ✅ Checklist de Integración

- [ ] **Pre-migración:**
  - [ ] Verificar que no hay usuarios con múltiples tenants activos
  - [ ] Backup de `tenant_users` table
  - [ ] Documentar decisión de "1 user = 1 tenant activo"

- [ ] **Aplicar migración:**
  - [ ] Ejecutar `0003_u03_patch_multitenant_fix.sql` en Supabase
  - [ ] Verificar que no hay errores

- [ ] **Post-migración:**
  - [ ] Verificar UNIQUE INDEX creado: `ux_tenant_users_one_active_tenant_per_user`
  - [ ] Verificar índices de performance creados (2)
  - [ ] Probar `get_user_tenant_id()` con usuario de prueba
  - [ ] Ejecutar tests de regresión de RLS
  - [ ] Verificar performance con `EXPLAIN ANALYZE`

- [ ] **Documentación:**
  - [ ] Actualizar README con cambio de modelo (1 tenant activo por user)
  - [ ] Documentar en changelog
  - [ ] Notificar al equipo del cambio

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Usuarios existentes con múltiples tenants activos

**Impacto:** La migración fallará al crear el UNIQUE INDEX

**Mitigación:**
```sql
-- Antes de aplicar el patch, ejecutar:
SELECT user_id, array_agg(tenant_id) as tenants, COUNT(*) as count
FROM tenant_users
WHERE is_active = true
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Si hay resultados, decidir estrategia:
-- Opción A: Desactivar todos menos el más reciente
-- Opción B: Desactivar todos menos el primero
-- Opción C: Fallar y resolver manualmente
```

### Riesgo 2: Cambio de modelo de negocio no documentado

**Impacto:** En el futuro, si se necesita multi-tenant por usuario, habrá refactoring

**Mitigación:**
- Documentar explícitamente en README que MVP es "1 user = 1 tenant activo"
- Si se necesita cambiar, crear ticket específico con plan de migración

### Riesgo 3: Performance de `COUNT(*) + MAX()`

**Impacto:** Mínimo, pero en tablas muy grandes podría ser lento

**Mitigación:**
- Los índices parciales mitigan esto
- Monitorear performance en producción
- Si es problema, considerar cache o materialización

---

## 📝 Recomendaciones Adicionales

### 1. Agregar comentarios a los índices

```sql
COMMENT ON INDEX ux_tenant_users_one_active_tenant_per_user IS 
'Garantiza que un usuario solo puede tener UNA membresía activa (MVP)';

COMMENT ON INDEX idx_tenant_users_user_active IS 
'Optimiza queries de get_user_tenant_id() y funciones helper';

COMMENT ON INDEX idx_tenant_users_user_tenant_active IS 
'Optimiza queries de user_belongs_to_tenant() y is_tenant_admin()';
```

### 2. Crear función de migración de tenant

Para cuando un usuario necesite cambiar de tenant:

```sql
CREATE OR REPLACE FUNCTION public.switch_user_tenant(
  p_new_tenant_id UUID,
  p_new_role_key TEXT DEFAULT 'Lectura'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Desactivar membresía actual
  UPDATE tenant_users 
  SET is_active = false 
  WHERE user_id = auth.uid() AND is_active = true;
  
  -- Activar o crear nueva membresía
  INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active)
  VALUES (p_new_tenant_id, auth.uid(), p_new_role_key, true)
  ON CONFLICT (tenant_id, user_id) 
  DO UPDATE SET is_active = true, role_key = EXCLUDED.role_key;
END;
$$;
```

### 3. Agregar logging/auditoría

Para detectar intentos de violación del UNIQUE constraint:

```sql
-- Trigger para loguear intentos de múltiples tenants activos
CREATE OR REPLACE FUNCTION log_multi_tenant_attempt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE user_id = NEW.user_id 
        AND is_active = true 
        AND id != NEW.id
    ) THEN
      RAISE WARNING 'User % attempted to activate multiple tenants', NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_tenant_users_multi_tenant_check
  BEFORE INSERT OR UPDATE ON tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION log_multi_tenant_attempt();
```

---

## 🎯 Veredicto Final

### ✅ APROBADO

El patch `0003_u03_patch_multitenant_fix.sql` es:

- ✅ **Técnicamente correcto**
- ✅ **Mejora significativa de seguridad**
- ✅ **Mejora de performance**
- ✅ **Bien implementado** (search_path, partial indexes, fail-secure)

### ⚠️ REQUERIMIENTOS PREVIOS:

1. **Verificar data existente** (no debe haber usuarios con múltiples tenants activos)
2. **Documentar cambio de modelo** (1 user = 1 tenant activo en MVP)
3. **Ejecutar tests de validación** post-migración

### 📋 PRÓXIMOS PASOS:

1. Aplicar pre-check de data
2. Ejecutar migración en ambiente de testing
3. Ejecutar suite de tests completa
4. Aplicar en producción
5. Monitorear logs por 24h

---

**Revisado por:** Agente Codificador  
**Fecha:** 2026-01-21  
**Ticket relacionado:** U-03 (RLS Multi-Tenant)  
**Severidad:** CRÍTICA (seguridad + modelo de datos)
