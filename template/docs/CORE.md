# Core Multi-Tenant Architecture

## Conceptos Fundamentales

### 1. Multi-Tenancy
El sistema utiliza un enfoque de **Multi-tenancy por Base de Datos Compartida** con separación lógica mediante `tenant_id`.
- Todas las tablas de datos pertenecen a un tenant.
- RLS (Row Level Security) es OBLIGATORIO para aislar datos.

### 2. Roles Estándar
Los roles define el nivel de acceso dentro de un tenant:
- **Admin**: Acceso total, gestión de usuarios.
- **Operador**: Gestión operativa (crear/editar registros).
- **Tecnico**: Acceso técnico/operativo limitado.
- **Lectura**: Solo visualización.

### 3. Modelo de "Tenant Activo" (Modelo B)
Un usuario puede pertenecer a N tenants, pero:
- Solo tiene **1 tenant activo** al mismo tiempo.
- Controlado por índice parcial único `idx_one_active_tenant_per_user`.
- `tenant_users.is_active = true` define el contexto actual.

### 4. Flujo de Onboarding
Para un sistema cerrado/corporativo, se usa el flujo "Solicitud-Aprobación":
1.  **Registro**: Crea usuario Auth.
2.  **Solicitud**: Usuario pide unirse a un tenant (por Slug o ID).
3.  **Aprobación**: Admin del tenant revisa y aprueba/rechaza.

## Seguridad
- **Nunca confiar en el cliente**. El Frontend es mera UI.
- **RLS es la ley**. Toda consulta a DB debe pasar por RLS.
- **RPC**. Operaciones complejas (como aprobar usuarios) usan funciones SQL `SECURITY DEFINER` controladas.
