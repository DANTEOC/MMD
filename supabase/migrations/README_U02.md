# TICKET U-02 — Tablas Base Multi-Tenant

## ✅ Entregables

### Archivos creados:
- `supabase/migrations/20260122_u02_base_multitenant_tables.sql`

### Qué se hizo:
1. **Tabla `tenants`**: Organizaciones/empresas del sistema
   - UUID como PK
   - `slug` único para URLs amigables
   - `is_active` para soft delete
   - Timestamps automáticos

2. **Tabla `tenant_users`**: Vínculo user ↔ tenant + rol
   - UUID como PK
   - FK a `auth.users(id)` y `tenants(id)` con CASCADE
   - `role_key` con CHECK constraint: 'Admin', 'Operador', 'Tecnico', 'Lectura'
   - `is_active` para soft delete de membresías
   - UNIQUE constraint `(tenant_id, user_id)` → un usuario = un rol por tenant
   - Timestamps automáticos

3. **Índices optimizados**:
   - `tenants`: slug, is_active
   - `tenant_users`: tenant_id, user_id, role_key, is_active
   - Índice compuesto para lookup de usuarios activos

4. **Triggers automáticos**:
   - Función `update_updated_at_column()` reutilizable
   - Triggers en ambas tablas para actualizar `updated_at`

---

## 🚀 Cómo aplicar la migración

### Opción 1: Supabase SQL Editor (recomendado para desarrollo)

1. Ir a tu proyecto Supabase → **SQL Editor**
2. Copiar todo el contenido de `20260122_u02_base_multitenant_tables.sql`
3. Pegar en el editor
4. Ejecutar (Run)
5. Verificar que no hay errores

### Opción 2: Supabase CLI (recomendado para producción)

```bash
# Si aún no tienes Supabase CLI instalado:
npm install -g supabase

# Inicializar Supabase en el proyecto (solo primera vez):
supabase init

# Vincular con tu proyecto remoto:
supabase link --project-ref <TU_PROJECT_REF>

# Aplicar la migración:
supabase db push
```

### Opción 3: Migración manual con timestamp

Si prefieres usar el sistema de migraciones de Supabase:

```bash
# Crear migración:
supabase migration new u02_base_multitenant_tables

# Copiar el contenido del SQL en el archivo generado
# Luego aplicar:
supabase db push
```

---

## 🔍 Verificación post-migración

Ejecuta en SQL Editor para confirmar:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'tenant_users');

-- Verificar constraints de tenant_users
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'tenant_users';

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('tenants', 'tenant_users');

-- Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('tenants', 'tenant_users');
```

---

## ⚠️ Notas importantes

### Lo que SÍ incluye esta migración:
- ✅ Estructura de tablas con PKs UUID
- ✅ Foreign keys con CASCADE
- ✅ CHECK constraint para roles
- ✅ UNIQUE constraint (tenant_id, user_id)
- ✅ Índices optimizados
- ✅ Triggers para updated_at

### Lo que NO incluye (próximos tickets):
- ❌ **RLS Policies** → Ver ticket U-03
- ❌ **Datos de prueba (seeds)** → Ver ticket U-05
- ❌ **Funciones helper** → Ver tickets posteriores

### Dependencias:
- Requiere que `auth.users` exista (viene por defecto en Supabase)
- No tiene dependencias de otras migraciones custom

---

## 📋 Checklist de integración

- [ ] Migración aplicada sin errores
- [ ] Tablas `tenants` y `tenant_users` creadas
- [ ] Constraints verificados (FK, CHECK, UNIQUE)
- [ ] Índices creados correctamente
- [ ] Triggers funcionando (probar UPDATE en ambas tablas)
- [ ] Documentar en changelog del proyecto
- [ ] Notificar al equipo que la base está lista para U-03 (RLS)

---

## 🐛 Troubleshooting

**Error: "relation auth.users does not exist"**
→ Verifica que Supabase Auth esté habilitado en tu proyecto

**Error: "duplicate key value violates unique constraint"**
→ Ya existe data en las tablas. Revisar si es necesario DROP antes de CREATE

**Triggers no se ejecutan**
→ Verificar que la función `update_updated_at_column()` se creó correctamente

---

**Ticket:** U-02  
**Fecha:** 2026-01-22  
**Alcance:** Solo estructura de tablas base (sin RLS, sin seeds)
