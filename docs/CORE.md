CORE.md

Roles estándar: Admin, Operador, Tecnico, Lectura

Modelo tenant activo: 1 activo por usuario (tenant_users.is_active=true único por user_id)

Seguridad:

RLS obligatorio en todas las tablas tenant_*

Nunca confiar en frontend

Onboarding:

Registro → Solicitud → Aprobación Admin

Admin:

/admin/users gestiona memberships

/admin/requests aprueba solicitudes.

### Deprecated Features
- **Invitaciones por email**: El sistema de invitaciones (`tenant_invites`) ha sido reemplazado por el flujo de Solicitudes de Acceso (`tenant_join_requests`). No se debe utilizar ni incluir en nuevas implementaciones.