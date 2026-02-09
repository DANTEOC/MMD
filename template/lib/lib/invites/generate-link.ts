/**
 * Genera el link de aceptación de invitación
 * 
 * @param tenantId - ID del tenant
 * @returns URL completa para aceptar la invitación
 */
export function generateInvitationLink(tenantId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/auth/accept-invite?tenant_id=${tenantId}`;
}
