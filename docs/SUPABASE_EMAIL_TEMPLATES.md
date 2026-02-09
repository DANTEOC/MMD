# Configuración de Emails en Español - Supabase

## Problema
Los emails de invitación de Supabase están en inglés por defecto.

## Solución
Debes configurar los templates de email en el dashboard de Supabase.

---

## Pasos para Configurar Emails en Español

### 1. Acceder a Email Templates

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Email Templates**

### 2. Configurar Template de Invitación

Busca el template **"Invite user"** y edita:

#### Subject (Asunto):
```
Invitación para unirte a {{ .SiteURL }}
```

#### Body (Cuerpo):
```html
<h2>Has sido invitado</h2>

<p>Has sido invitado a unirte a {{ .SiteURL }}.</p>

<p>Haz clic en el siguiente enlace para aceptar la invitación:</p>

<p><a href="{{ .ConfirmationURL }}">Aceptar invitación</a></p>

<p>O copia y pega esta URL en tu navegador:</p>
<p>{{ .ConfirmationURL }}</p>

<p>Este enlace expirará en 24 horas.</p>

<p>Si no solicitaste esta invitación, puedes ignorar este correo.</p>
```

### 3. Configurar Otros Templates (Opcional)

También puedes traducir:

#### **Confirm signup** (Confirmar registro):
```html
<h2>Confirma tu correo electrónico</h2>

<p>Haz clic en el siguiente enlace para confirmar tu correo:</p>

<p><a href="{{ .ConfirmationURL }}">Confirmar correo</a></p>
```

#### **Magic Link** (Enlace mágico):
```html
<h2>Inicia sesión</h2>

<p>Haz clic en el siguiente enlace para iniciar sesión:</p>

<p><a href="{{ .ConfirmationURL }}">Iniciar sesión</a></p>
```

#### **Change Email Address** (Cambiar email):
```html
<h2>Confirma tu nuevo correo</h2>

<p>Haz clic en el siguiente enlace para confirmar tu nuevo correo:</p>

<p><a href="{{ .ConfirmationURL }}">Confirmar cambio</a></p>
```

#### **Reset Password** (Restablecer contraseña):
```html
<h2>Restablece tu contraseña</h2>

<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>

<p><a href="{{ .ConfirmationURL }}">Restablecer contraseña</a></p>

<p>Este enlace expirará en 1 hora.</p>
```

---

## Variables Disponibles

En los templates puedes usar estas variables:

- `{{ .ConfirmationURL }}` - URL de confirmación/invitación
- `{{ .Token }}` - Token de confirmación
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL de tu sitio
- `{{ .Email }}` - Email del usuario

---

## Guardar Cambios

1. Después de editar cada template, haz clic en **Save**
2. Los cambios se aplican inmediatamente
3. Prueba enviando una nueva invitación

---

## Nota Importante

⚠️ **Los emails ya enviados NO se actualizan**. Solo los nuevos emails usarán los templates actualizados.

Para probar:
1. Revoca la invitación anterior (cuando implementemos el botón)
2. Envía una nueva invitación
3. El nuevo email debería estar en español
