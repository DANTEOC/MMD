# MMD Maintenance

Sistema ERP/CRM Multi-tenant construido con Next.js y Supabase.

## Stack Tecnológico

- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Backend:** Supabase (Postgres + Auth)
- **Arquitectura:** Multi-tenant mediante `tenant_users`
- **Roles:** Admin, Operador, Tecnico, Lectura

## Estructura del Proyecto

```
MMD Maintenance/
├── app/                      # Next.js App Router
│   ├── configuracion/        # Página protegida (solo Admin)
│   ├── login/                # Página de login
│   ├── no-autorizado/        # Página de acceso denegado
│   ├── layout.tsx            # Layout raíz
│   └── page.tsx              # Home
├── lib/
│   ├── auth/                 # Guards server-side
│   │   ├── guards.ts         # requireAuth() y requireAdmin()
│   │   ├── types.ts          # Tipos TypeScript
│   │   └── index.ts          # Barrel export
│   └── supabase/
│       └── server.ts         # Cliente Supabase server-side
├── supabase/
│   └── migrations/           # Migraciones SQL
├── docs/                     # Documentación de tickets
└── package.json
```

## Configuración Inicial

### 1. Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Ejecutar Migraciones en Supabase

Ejecutar los archivos SQL en el orden correcto en Supabase SQL Editor:

1. `supabase/migrations/0001_initial_schema.sql` (si existe)
2. `supabase/migrations/0002_rls_policies.sql` (si existe)
3. `supabase/migrations/0003_u03_patch_multitenant_fix.sql`

### 4. Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Características Implementadas

### ✅ TICKET U-03: Multi-tenant Fix
- UNIQUE INDEX para 1 usuario = 1 tenant activo
- Función `get_user_tenant_id()` determinística y segura
- Índices de performance para RLS

### ✅ TICKET U-04: Guards Server-Side
- `requireAuth()` - Protege rutas autenticadas
- `requireAdmin()` - Protege rutas solo para Admin
- Manejo automático de redirects
- TypeScript estricto

## Uso de Guards

```typescript
// Ruta protegida (cualquier usuario autenticado)
import { requireAuth } from '@/lib/auth'

export default async function DashboardPage() {
  const auth = await requireAuth()
  return <div>Bienvenido {auth.roleKey}</div>
}

// Ruta solo para Admin
import { requireAdmin } from '@/lib/auth'

export default async function ConfigPage() {
  const auth = await requireAdmin()
  return <div>Configuración del Sistema</div>
}
```

## Reglas del Proyecto

- ✅ Un ticket = una implementación
- ✅ No agregar funcionalidades no solicitadas
- ✅ No refactorizar código fuera del ticket
- ✅ RLS obligatorio en tablas `tenant_*`
- ✅ TypeScript estricto
- ✅ SQL compatible con Supabase (no psql commands)

## Documentación

Ver carpeta `docs/` para documentación detallada de cada ticket:

- `docs/U-04-guards-server-side.md` - Guards de autenticación

## Scripts Disponibles

- `npm run dev` - Servidor de desarrollo con Turbopack
- `npm run build` - Build de producción
- `npm start` - Servidor de producción
- `npm run lint` - Linter de código

## Soporte

Para preguntas o issues, consultar la documentación en `docs/` o contactar al equipo de desarrollo.
