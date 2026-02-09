# Patrón de Módulos (Module Pattern)

Para agregar una nueva funcionalidad (ej. `Inventory`), sigue esta receta:

## 1. Base de Datos
Crea una nueva migración SQL (ej. `020_module_inventory.sql`):

```sql
CREATE TABLE public.tenant_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- ... campos específicos ...
    name TEXT NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice Tenant OBLIGATORIO
CREATE INDEX idx_inventory_tenant ON public.tenant_inventory(tenant_id);

-- Habilitar RLS OBLIGATORIO
ALTER TABLE public.tenant_inventory ENABLE ROW LEVEL SECURITY;

-- Policy Lectura (Miembros)
CREATE POLICY "Tenant members view inventory" ON public.tenant_inventory
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_inventory.tenant_id 
            AND tenant_users.user_id = auth.uid()
        )
    );

-- Policy Escritura (Operador+)
CREATE POLICY "Operators manage inventory" ON public.tenant_inventory
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_inventory.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.role_key IN ('Admin', 'Operador')
        )
    );
```

## 2. Frontend (Next.js)
Crea la estructura de carpetas en `app/`:

```
app/
  (app)/
    inventory/
      page.tsx        (Lista)
      new/page.tsx    (Crear)
      [id]/page.tsx   (Detalle/Editar)
```

## 3. Server Actions
Crea `app/actions/inventory.ts` para agrupar lógica de DB.
- Usa `createClient()` de `@/lib/supabase/server`.
- Verifica `requireAuth()`.
- Siempre filtra por `tenant_id` (aunque RLS protege, es buena práctica).
