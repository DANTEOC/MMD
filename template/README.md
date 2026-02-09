# Core Multi-Tenant Template

Template base para aplicaciones Next.js + Supabase Multi-Tenant SaaS.
Incluye autenticación, gestión de organizaciones (tenants), roles y flujo de solicitud de acceso.

## Características
- **Stack**: Next.js (App Router), TypeScript, Supabase (Auth + DB).
- **Multi-Tenant**: Aislamiento lógico por `tenant_id` + RLS.
- **Roles**: Admin, Operador, Tecnico, Lectura.
- **Onboarding**: Registro -> Solicitud a Tenant -> Aprobación Admin.
- **Sin Invitaciones**: Diseño simplificado "pull" (usuario solicita) en lugar de "push" (admin invita por email).

## Getting Started

### 1. Configuración Supabase
1. Crea un proyecto nuevo en Supabase.
2. Ve al **SQL Editor**.
3. Copia y ejecuta el contenido de `db/migrations/` en orden numérico:
   - `001_core_tenants.sql`
   - `...`
   - `010_module_clients_example.sql`

### 2. Configuración Local
1. Copia `.env.local.example` a `.env.local`.
2. Llena las variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
3. Instala dependencias:
   ```bash
   npm install
   ```

### 3. Crear Primer Tenant (Bootstrap)
Como no hay UI pública para crear tenants (solo para unirse), debes crear el primero manualmente en Supabase SQL o Table Editor:

```sql
INSERT INTO tenants (name, slug) VALUES ('Demo Company', 'demo');
```

Luego, regístrate en la App (`/register`), solicita acceso a 'demo', y apruébate manualmente en la base de datos (o temporalmente desactiva RLS para el primer usuario, pero mejor hazlo por SQL):

```sql
-- Obtén tu user_id de auth.users y el tenant_id
-- INSERT INTO tenant_users (tenant_id, user_id, role_key, is_active) ...
```

### 4. Ejecutar
```bash
npm run dev
```

## Estructura
- `/app`: Rutas Next.js.
  - `(app)`: Rutas protegidas (requireAuth).
  - `/auth`, `/register`, `/request-access`: Rutas públicas.
- `/lib`: Utilidades (Supabase client, Auth guards).
- `/db`: Migraciones SQL.
