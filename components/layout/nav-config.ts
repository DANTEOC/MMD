import { LayoutDashboard, ClipboardList, Package, BarChart3, Settings, User, Truck, Users, Anchor, Tags, Landmark, Receipt, FileText } from 'lucide-react';

export type NavItem = {
    label: string;
    href: string;
    icon: any;
    roles: string[]; // ['Admin', 'Supervisor', 'Tecnico', 'Lectura', 'Operador', etc]
    section?: string;
};

export const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Supervisor', 'Operador', 'Tecnico', 'Lectura', 'Contador', 'Visitante'] },
    { label: 'Clientes', href: '/clients', icon: Users, roles: ['Admin', 'Supervisor', 'Operador', 'Lectura', 'Contador'] },
    { label: 'Activos', href: '/assets', icon: Anchor, roles: ['Admin', 'Supervisor', 'Operador', 'Lectura', 'Contador'] },
    { label: 'Órdenes', href: '/work-orders', icon: ClipboardList, roles: ['Admin', 'Supervisor', 'Operador', 'Tecnico', 'Lectura', 'Contador', 'Visitante'] },
    { label: 'Cotizaciones', href: '/quotes', icon: FileText, roles: ['Admin', 'Supervisor', 'Operador', 'Contador'] },
    { label: 'Inventario', href: '/inventory', icon: Package, roles: ['Admin', 'Supervisor', 'Operador', 'Lectura', 'Contador', 'Visitante'] },
    { label: 'Proveedores', href: '/finance/providers', icon: Truck, roles: ['Admin', 'Supervisor', 'Operador', 'Contador'] },
    { label: 'Gastos', href: '/finance/expenses', icon: Receipt, roles: ['Admin', 'Supervisor', 'Contador'] },
    { label: 'Bancos', href: '/banks', icon: Landmark, roles: ['Admin', 'Supervisor', 'Contador'] },
    { label: 'Catálogos', href: '/service-types', icon: Tags, roles: ['Admin', 'Supervisor', 'Operador'] },
    { label: 'Reportes', href: '/reports', icon: BarChart3, roles: ['Admin', 'Supervisor', 'Operador', 'Lectura', 'Contador', 'Visitante'] },
    { label: 'Usuarios', href: '/admin/users', icon: User, roles: ['Admin', 'Supervisor', 'Operador'], section: 'bottom' },
    { label: 'Configuración', href: '/admin/settings', icon: Settings, roles: ['Admin'], section: 'bottom' },
];

export const MAX_MOBILE_ITEMS = 4; // Check logic in BottomNav
