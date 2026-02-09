-- Migración: Agregar columna delivery a tenant_invites
-- Fecha: 2026-01-24
-- Ticket: A-07.1

-- Agregar columna delivery
ALTER TABLE tenant_invites 
ADD COLUMN delivery TEXT CHECK (delivery IN ('email', 'manual_link'));

-- Comentario para documentación
COMMENT ON COLUMN tenant_invites.delivery IS 'Método de entrega: email (enviado por Supabase) o manual_link (requiere copiar link)';
