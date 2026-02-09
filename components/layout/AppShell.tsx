'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppShell({
    children,
    role,
    userEmail,
    userId
}: {
    children: ReactNode,
    role: string,
    userEmail?: string,
    userId?: string
}) {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <style jsx global>{`
                /* Default Mobile */
                .desktop-sidebar { display: none; }
                .mobile-nav { display: block; }
                /* Flex behavior is disabled on mobile, column layout implied */
                .layout-container { display: flex; flex-direction: column; min-height: 100vh; }
                .main-content { margin-left: 0; padding-bottom: 80px; width: 100%; flex: 1; }

                /* Desktop (MD+) */
                @media (min-width: 768px) {
                    .desktop-sidebar { display: block; }
                    .mobile-nav { display: none; }
                    
                    .layout-container { display: flex; flex-direction: row; align-items: flex-start; }
                    /* Sidebar is sticky/flex-item, so it takes its space. Main content takes rest. */
                    .main-content { flex: 1; padding-bottom: 0; margin-left: 0; width: auto; max-width: 100%; } 
                }
            `}</style>

            <div className="layout-container">
                {/* Desktop Sidebar */}
                <div className="desktop-sidebar">
                    <Sidebar role={role} userEmail={userEmail} userId={userId} />
                </div>

                {/* Main Content */}
                <main className="main-content">
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <div className="mobile-nav">
                    <BottomNav role={role} userEmail={userEmail} userId={userId} />
                </div>
            </div>
        </div>
    );
}
