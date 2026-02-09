# Protocolo de Cambio de Contexto (MMD vs MDXC)

Para evitar errores críticos al alternar entre proyectos (Bases de datos mezcladas, scripts incorrectos), sigue este protocolo:

## 1. Regla de Oro: Sesiones Asiladas
Idealmente, utiliza **una sesión de chat nueva** cada vez que cambies de proyecto.
- Si debes continuar en el mismo chat, tu primer prompt DEBE ser:
  > "CAMBIO DE CONTEXTO: Ahora trabajaremos en [Nombre del Proyecto]. Olvida el contexto anterior."

## 2. Verificación de Entorno (.env.local)
Antes de pedir cualquier código, pide al agente que verifique en qué "tierra" está pisando:
- El agente debe leer el archivo `README.md` o `package.json` para confirmar el nombre del proyecto.
- Verificar las variables `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`.

## 3. Comandos de Seguridad
Si tienes dudas de qué base de datos está conectada, ejecuta:
```bash
cat .env.local
```
*(O pide al agente: "¿A qué base de datos estamos apuntando?")*

## 4. Git es tu red de seguridad
Antes de cambiar de proyecto:
1. **Guarda todo:** `git commit -am "WIP antes de cambiar contexto"`
2. **Limpia:** `git status` debe estar limpio.

## 5. Diferencias Clave (Recordatorio)

| Característica | MMD Maintenance | MDXC (Otro Proyecto) |
| :--- | :--- | :--- |
| **Tipo** | Multi-tenant ERP | (Definir aquí) |
| **Auth** | Supabase Auth + Guards | (Definir) |
| **DB** | Tablas `tenant_*` | (Definir) |

---
*Este documento reside en `docs/WORKFLOW_SWITCHING.md` para referencia futura.*
