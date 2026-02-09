# Configuración de Variables de Entorno - TICKET A-07

## SUPABASE_SERVICE_ROLE_KEY

Para que el sistema de invitaciones funcione correctamente, necesitas configurar la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` en tu archivo `.env.local`.

### Pasos para obtener la Service Role Key:

1. Ve al dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **API**
4. En la sección "Project API keys", busca la key llamada **`service_role`**
5. Haz clic en "Reveal" para mostrar la key
6. Copia la key completa

### Agregar a .env.local:

Abre o crea el archivo `.env.local` en la raíz del proyecto y agrega:

```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### ⚠️ IMPORTANTE - Seguridad

- **NUNCA** expongas esta key al cliente (navegador)
- **NUNCA** la subas a Git (`.env.local` ya está en `.gitignore`)
- Esta key tiene permisos completos sobre tu base de datos
- Solo se usa en el servidor (API routes)

### Verificación

Después de agregar la variable:

1. Reinicia el servidor de desarrollo:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

2. Verifica que la variable esté cargada:
   - Intenta enviar una invitación desde `/admin/users`
   - Si ves el error "Configuración de servidor incompleta", la variable no está configurada correctamente

### Variables de Entorno Completas

Tu archivo `.env.local` debería tener al menos:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

Opcionalmente, para producción:

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

---

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY no configurada"

- Verifica que el archivo `.env.local` existe en la raíz del proyecto
- Verifica que la variable esté escrita exactamente como `SUPABASE_SERVICE_ROLE_KEY`
- Reinicia el servidor de desarrollo

### Error: "Error al enviar email de invitación"

- Verifica que la Service Role Key sea correcta
- Verifica que el email del destinatario sea válido
- Revisa los logs del servidor para más detalles
