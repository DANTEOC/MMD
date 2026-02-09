'use client';

import { useState } from 'react';
import PaymentForm from './PaymentForm';
import { CreditCard } from 'lucide-react';

interface RegisterPaymentButtonProps {
    workOrderId: string;
    totalAmount: number;
    amountPaid: number;
}

export default function RegisterPaymentButton({ workOrderId, totalAmount, amountPaid }: RegisterPaymentButtonProps) {
    const [showForm, setShowForm] = useState(false);

    const handleSuccess = () => {
        setShowForm(false);
        window.location.reload();
    };

    return (
        <>
            <button
                onClick={() => setShowForm(true)}
                style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#16a34a', // Green-600
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                }}
            >
                <CreditCard size={16} />
                Registrar Pago
            </button>

            {showForm && (
                <PaymentForm
                    workOrderId={workOrderId}
                    totalAmount={totalAmount}
                    amountPaid={amountPaid}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    );
}
