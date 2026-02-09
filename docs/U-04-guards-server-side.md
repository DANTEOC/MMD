# TICKET U-04 — Guards Server-Side

## Implementación

Se han creado guards server-side reutilizables para proteger rutas en Next.js App Router:

### 1. `requireAuth()`
- Valida sesión activa usando Supabase Auth
- Consulta `tenant_users` para obtener tenant activo del usuario
- Valida que existe exactamente 1 tenant activo (constraint MVP)
- Retorna `AuthContext` con `userId`, `tenantId` y `roleKey`
- Redirige a `/login` si no hay sesión
- Redirige a `/no-autorizado` si no tiene tenant activo o hay múltiples

### 2. `requireAdmin()`
- Llama internamente a `requireAuth()`
- Valida que `roleKey === 'Admin'`
- Retorna el mismo `AuthContext`
- Redirige a `/no-autorizado` si el rol no es Admin

## Archivos Creados

### Configuración del Proyecto
- `package.json` - Dependencias Next.js 15 + Supabase SSR
- `tsconfig.json` - TypeScript estricto
- `next.config.ts` - Configuración Next.js
- `.env.local.example` - Template variables de entorno
- `.gitignore` - Archivos a ignorar

### Librería de Autenticación
- `lib/supabase/server.ts` - Cliente Supabase server-side con cookies
- `lib/auth/types.ts` - Tipos TypeScript (AuthContext, RoleKey, TenantUser)
- `lib/auth/guards.ts` - **Implementación de requireAuth y requireAdmin**
- `lib/auth/index.ts` - Barrel export

### Páginas de Ejemplo
- `app/layout.tsx` - Layout raíz
- `app/page.tsx` - Home con enlaces de prueba
- `app/configuracion/page.tsx` - **Ejemplo de uso de requireAdmin()**
- `app/login/page.tsx` - Placeholder login
- `app/no-autorizado/page.tsx` - Placeholder acceso denegado

## Ejemplo de Uso

```typescript
// En cualquier page.tsx o layout.tsx (Server Component)
import { requireAuth, requireAdmin } from '@/lib/auth'

// Ruta protegida (cualquier usuario autenticado con tenant activo)
export default async function DashboardPage() {
  const auth = await requireAuth()
  // auth.userId, auth.tenantId, auth.roleKey disponibles
  return <div>Dashboard para {auth.roleKey}</div>
}

// Ruta solo para Admin
export default async function ConfigPage() {
  const auth = await requireAdmin()
  // Solo llega aquí si roleKey === 'Admin'
  return <div>Configuración</div>
}
```

## Pasos para Probar

### Requisitos Previos
1. Crear archivo `.env.local` con credenciales de Supabase:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Ejecutar servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Escenarios de Prueba

#### 1. Sin sesión activa
- Navegar a `http://localhost:3000/configuracion`
- **Resultado esperado:** Redirect a `/login`

#### 2. Con sesión pero sin tenant activo
- Iniciar sesión en Supabase (crear usuario en Auth)
- NO crear registro en `tenant_users` para ese usuario
- Navegar a `http://localhost:3000/configuracion`
- **Resultado esperado:** Redirect a `/no-autorizado`

#### 3. Con sesión y tenant activo (rol NO Admin)
- Iniciar sesión en Supabase
- Crear registro en `tenant_users`:
  ```sql
  INSERT INTO public.tenant_users (user_id, tenant_id, role_key, is_active)
  VALUES (
    'uuid-del-usuario-autenticado',
    'uuid-de-un-tenant',
    'Operador',  -- o 'Tecnico' o 'Lectura'
    true
  );
  ```
- Navegar a `http://localhost:3000/configuracion`
- **Resultado esperado:** Redirect a `/no-autorizado`

#### 4. Con sesión y tenant activo (rol Admin)
- Iniciar sesión en Supabase
- Crear registro en `tenant_users`:
  ```sql
  INSERT INTO public.tenant_users (user_id, tenant_id, role_key, is_active)
  VALUES (
    'uuid-del-usuario-autenticado',
    'uuid-de-un-tenant',
    'Admin',
    true
  );
  ```
- Navegar a `http://localhost:3000/configuracion`
- **Resultado esperado:** Página se muestra con contexto de autenticación

## Qué NO se Tocó

- ❌ No se crearon tablas SQL (ya existen de tickets anteriores)
- ❌ No se implementó UI de login funcional (solo placeholder)
- ❌ No se implementó UI de configuración (solo placeholder)
- ❌ No se creó middleware de Next.js
- ❌ No se implementó manejo de sesiones client-side
- ❌ No se agregaron validaciones adicionales fuera del scope
- ❌ No se refactorizó código existente

## Notas Técnicas

- Los guards son 100% server-side (Server Components)
- Compatible con Next.js 15 App Router
- TypeScript estricto con tipos explícitos
- Manejo de errores mediante redirects (no throws)
- Logs en consola para debugging (producción debe usar logger apropiado)
- Constraint MVP: 1 usuario = 1 tenant activo (enforced por UNIQUE INDEX en DB)
