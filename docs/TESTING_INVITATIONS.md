# Guía de Prueba - Sistema de Invitaciones (A-07)

## ✅ Pre-requisitos

1. **Service Role Key configurada** en `.env.local`
2. **Servidor reiniciado** después de agregar la key
3. **SQL ejecutado** en Supabase:
   - `20260122_a07_tenant_invites.sql`
   - `disable_rls_tenant_invites.sql`

---

## 📋 Flujo de Prueba Completo

### Paso 1: Como Admin - Enviar Invitación

1. Login como usuario Admin
2. Ir a: `http://localhost:3000/admin/users`
3. Scroll hasta la sección "Invitar Usuario por Email"
4. Ingresar:
   - **Email**: Un email válido al que tengas acceso (ej: tu email personal)
   - **Rol**: Seleccionar "Lectura" (o el rol que prefieras)
5. Click "Enviar Invitación"
6. **Verificar**:
   - Mensaje verde: "Invitación enviada exitosamente a [email]"
   - La página se recarga automáticamente
   - El invite aparece en la tabla "Invitaciones" con status "pending"

---

### Paso 2: Como Usuario Invitado - Recibir Email

1. **Revisar bandeja de entrada** del email que ingresaste
2. **Buscar email de Supabase** con subject:
   - "Confirm your signup" o
   - "You have been invited to join"
3. **Abrir el email**
4. **Hacer clic en el link** (puede decir "Accept Invite" o "Confirm Email")

---

### Paso 3: Confirmar Email / Establecer Contraseña

Supabase te redirigirá a una página donde:

**Si eres usuario nuevo:**
- Te pedirá establecer una contraseña
- Ingresa una contraseña segura
- Click "Set Password" o "Confirm"

**Si ya tienes cuenta:**
- Puede pedirte confirmar tu email
- Click en el botón de confirmación

---

### Paso 4: Aceptación Automática

Después de confirmar/establecer contraseña, Supabase te redirige automáticamente a:

```
http://localhost:3000/auth/accept-invite?tenant_id=XXXXXXXX
```

**Deberías ver:**
1. **Primero**: Pantalla de "Procesando invitación..." con spinner (1-2 segundos)
2. **Luego**: 
   - ✅ **Éxito**: "¡Invitación aceptada! Ahora eres miembro del tenant con rol: Lectura"
   - ❌ **Error**: Mensaje específico del problema

3. **Finalmente**: Redirección automática a `/dashboard` (2 segundos después)

---

### Paso 5: Verificar Acceso

1. Deberías estar en `/dashboard` autenticado
2. Puedes navegar según tu rol (ej: Lectura puede ver pero no editar)
3. Como Admin, ve a `/admin/users`:
   - El usuario invitado aparece en "Miembros del Tenant"
   - El invite cambió de "pending" a "accepted"

---

## 🐛 Troubleshooting

### Error: "Debes confirmar tu email y establecer tu contraseña..."

**Causa**: Llegaste a `/auth/accept-invite` sin estar autenticado.

**Solución**:
1. Vuelve al email de Supabase
2. Haz clic nuevamente en el link
3. Completa el proceso de confirmación/contraseña
4. Espera a que Supabase te redirija automáticamente

---

### Error: "Invitación inválida: falta tenant_id"

**Causa**: El link no tiene el parámetro `tenant_id` en la URL.

**Solución**:
1. Verifica que el link del email termine con `?tenant_id=...`
2. Si no, puede ser un problema con el `redirectTo` del API
3. Revisa los logs del servidor cuando envías la invitación

---

### Error: "Invitación no encontrada, expirada o ya aceptada"

**Causas posibles**:
1. El email del usuario no coincide con el email de la invitación
2. La invitación ya fue aceptada
3. La invitación expiró (>7 días)

**Solución**:
1. Verifica en `/admin/users` el status del invite
2. Si está "accepted", el usuario ya es miembro
3. Si está "expired", envía una nueva invitación

---

### Error: "No estás autenticado"

**Causa**: La sesión no se estableció correctamente.

**Solución**:
1. Cierra todas las pestañas de la app
2. Vuelve al email de Supabase
3. Haz clic en el link nuevamente
4. Si persiste, intenta en modo incógnito

---

## 🔍 Verificación en Base de Datos

Si quieres verificar manualmente en Supabase SQL Editor:

```sql
-- Ver todas las invitaciones
SELECT 
  email, 
  role_key, 
  status, 
  created_at, 
  expires_at,
  accepted_at
FROM tenant_invites
ORDER BY created_at DESC;

-- Ver si se creó el tenant_user
SELECT 
  tu.user_id,
  tu.role_key,
  tu.is_active,
  au.email
FROM tenant_users tu
JOIN auth.users au ON au.id = tu.user_id
ORDER BY tu.created_at DESC;
```

---

## 📝 Notas Importantes

1. **Los links de invitación expiran en 7 días**
2. **Cada invitación solo puede aceptarse una vez**
3. **El email debe coincidir exactamente** (case-insensitive)
4. **Si el usuario ya es miembro**, la invitación se marca como aceptada pero no se duplica el `tenant_user`

---

## 🎯 Resultado Esperado

Al final del flujo exitoso:

✅ Usuario recibió email
✅ Usuario confirmó email/estableció contraseña
✅ Usuario fue redirigido a `/auth/accept-invite`
✅ Invitación procesada automáticamente
✅ Usuario redirigido a `/dashboard`
✅ Usuario aparece en "Miembros del Tenant" con el rol correcto
✅ Invite cambió a status "accepted" en la tabla de invitaciones
