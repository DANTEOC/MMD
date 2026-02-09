# TICKET A-02 — Guards + protección del área privada + control por rol

## Implementación

Se implementó la protección completa del área privada `(app)` con guards server-side y control por roles.

---

## 📋 1. QUÉ SE IMPLEMENTÓ

### **A) Layout Protegido `(app)/layout.tsx`**
Guard global que protege toda el área privada:

```typescript
await requireAuth()
```

**Validaciones:**
- Usuario autenticado (sesión activa)
- Tenant activo asignado
- Redirect automático a `/login` o `/no-autorizado` según el caso

---

### **B) Páginas de Error**

#### **`/no-autorizado`**
Para usuarios sin tenant activo o bloqueados por RLS:
- Mensaje claro de error
- Causas posibles listadas
- Enlaces a `/login` y `/`

#### **`/forbidden`**
Para usuarios sin permisos de rol (no Admin cuando se requiere):
- Mensaje específico de rol insuficiente
- Sugerencia de contactar administrador
- Enlaces a `/dashboard` y `/`

---

### **C) Páginas Protegidas**

#### **`/dashboard`**
Página principal del área privada:
- Muestra contexto de autenticación (userId, tenantId, roleKey)
- Enlaces de prueba a rutas admin
- Botón de logout
- Protegida por `requireAuth()` en layout

#### **`/admin`**
Ruta de ejemplo solo para Admin:
- Usa `requireAdmin()` directamente
- Muestra contexto de autenticación
- Redirect a `/forbidden` si no es Admin

---

### **D) Actualización de Guards**

**`requireAdmin()` actualizado:**
- Ahora redirige a `/forbidden` (en lugar de `/no-autorizado`)
- Diferencia errores de rol vs errores de tenant

**Flujo de redirects:**
```
Sin sesión → /login
Con sesión pero sin tenant → /no-autorizado
Con sesión y tenant pero rol != Admin → /forbidden
```

---

## 📁 2. ARCHIVOS CREADOS/MODIFICADOS

### **Creados:**
- [`(app)/layout.tsx`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/app/(app)/layout.tsx) - Layout protegido con requireAuth
- [`(app)/dashboard/page.tsx`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/app/(app)/dashboard/page.tsx) - Dashboard principal
- [`(app)/admin/page.tsx`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/app/(app)/admin/page.tsx) - Ruta admin de ejemplo
- [`no-autorizado/page.tsx`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/app/no-autorizado/page.tsx) - Página de error sin tenant
- [`forbidden/page.tsx`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/app/forbidden/page.tsx) - Página de error sin permisos de rol

### **Modificados:**
- [`lib/auth/guards.ts`](file:///c:/Users/Dante%20Oliver/Proyectos%20IA/MMD%20Maintenance/lib/auth/guards.ts) - requireAdmin redirige a /forbidden

**Total:** 5 archivos creados, 1 modificado

---

## 🧪 3. CÓMO PROBAR LA FUNCIONALIDAD

### **Escenario 1: Sin sesión activa**
1. Cerrar sesión o abrir navegador en incógnito
2. Navegar a `/dashboard`
3. ✅ **Resultado esperado:** Redirect a `/login`

### **Escenario 2: Con sesión pero sin tenant activo**
1. Iniciar sesión con usuario que NO tiene registro en `tenant_users`
2. Navegar a `/dashboard`
3. ✅ **Resultado esperado:** Redirect a `/no-autorizado`

### **Escenario 3: Con sesión y tenant activo (cualquier rol)**
1. Iniciar sesión con usuario que tiene tenant activo
2. Navegar a `/dashboard`
3. ✅ **Resultado esperado:** Muestra dashboard con contexto de auth

### **Escenario 4: Usuario NO Admin intenta acceder a /admin**
1. Iniciar sesión con usuario rol `Operador`, `Tecnico` o `Lectura`
2. Navegar a `/admin`
3. ✅ **Resultado esperado:** Redirect a `/forbidden`

### **Escenario 5: Usuario Admin accede a /admin**
1. Iniciar sesión con usuario rol `Admin`
2. Navegar a `/admin`
3. ✅ **Resultado esperado:** Muestra página admin con contexto

### **Escenario 6: Navegación dentro del área privada**
1. Iniciar sesión como Admin
2. Navegar entre `/dashboard`, `/admin`, `/configuracion`
3. ✅ **Resultado esperado:** No pide login nuevamente (sesión persistente)

---

## 🚫 4. QUÉ EXPLÍCITAMENTE NO SE TOCÓ

- ❌ **No se implementó UI de selección de tenant** (existe RPC U-04, UI pendiente)
- ❌ **No se implementó gestión de usuarios** (CRUD de tenant_users)
- ❌ **No se implementó login UI** (es TICKET A-01)
- ❌ **No se implementó logout funcional** (es TICKET A-01)
- ❌ **No se creó middleware de Next.js** (guards son server-side en layouts/pages)
- ❌ **No se implementaron permisos granulares** más allá de Admin/No-Admin
- ❌ **No se creó sistema de auditoría** de accesos
- ❌ **No se implementó rate limiting**

---

## 📝 NOTAS TÉCNICAS

### **Arquitectura de Guards**

**3 niveles de protección:**

1. **Layout `(app)/layout.tsx`:**
   - Guard global con `requireAuth()`
   - Protege toda el área privada
   - Valida sesión + tenant activo

2. **Páginas específicas:**
   - Pueden añadir `requireAdmin()` si requieren rol Admin
   - Ejemplo: `/admin`, `/configuracion`

3. **RLS en base de datos:**
   - Última línea de defensa
   - Policies validan permisos a nivel de fila

### **Diferenciación de Errores**

**`/login`:** Sin sesión activa  
**`/no-autorizado`:** Sin tenant activo o bloqueado por RLS  
**`/forbidden`:** Rol insuficiente (no Admin cuando se requiere)

Esta separación facilita debugging y mejora UX.

### **Sesión Persistente**

- Manejada automáticamente por Supabase SSR
- Cookies HTTP-only
- No requiere código adicional en guards

---

## ✅ CHECKLIST DE ENTREGA

- [x] Layout `(app)` protegido con `requireAuth()`
- [x] Página `/dashboard` funcional
- [x] Página `/admin` solo para Admin
- [x] Página `/no-autorizado` creada
- [x] Página `/forbidden` creada
- [x] `requireAdmin()` redirige a `/forbidden`
- [x] Guards validan sesión + tenant + rol
- [x] Documentación completa

---

**Fecha de implementación:** 2026-01-22  
**Ticket:** A-02  
**Estado:** ✅ COMPLETADO
