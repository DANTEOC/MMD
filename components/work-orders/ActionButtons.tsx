'use client';

type ActionButtonsProps = {
    isQuote: boolean;
    isTechnician: boolean;
    workOrderId: string;
    onCancel?: () => void;
    onPrint?: () => void;
    onConvertToOrder?: () => void;
    onSave?: () => void;
    onDirectPurchase?: () => void;
    onReturnMaterial?: () => void;
    onConsumeMaterial?: () => void;
    onRegisterPayment?: () => void;
};

export default function ActionButtons({
    isQuote,
    isTechnician,
    workOrderId,
    onCancel,
    onPrint,
    onConvertToOrder,
    onSave,
    onDirectPurchase,
    onReturnMaterial,
    onConsumeMaterial,
    onRegisterPayment
}: ActionButtonsProps) {
    // Cotizaciones (solo Admin/Supervisor)
    if (isQuote) {
        return (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'flex-end' }}>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        CANCELAR
                    </button>
                )}
                {onPrint && (
                    <button
                        onClick={onPrint}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#1f2937',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        🖨️ Imprimir
                    </button>
                )}
                {onConvertToOrder && (
                    <button
                        onClick={onConvertToOrder}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Convertir a Orden de Servicio
                    </button>
                )}
                {onSave && (
                    <button
                        onClick={onSave}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Guardar cambios
                    </button>
                )}
            </div>
        );
    }

    // Órdenes de Servicio - Técnico
    if (isTechnician) {
        return (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'flex-end' }}>
                {onPrint && (
                    <button
                        onClick={onPrint}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#1f2937',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        🖨️ Imprimir
                    </button>
                )}
                {onReturnMaterial && (
                    <button
                        onClick={onReturnMaterial}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#ea580c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Devolver material
                    </button>
                )}
                {onConsumeMaterial && (
                    <button
                        onClick={onConsumeMaterial}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#c2410c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Salida de material
                    </button>
                )}
            </div>
        );
    }

    // Órdenes de Servicio - Admin/Supervisor
    return (
        <div style={{ marginTop: '2rem' }}>
            {/* Primera fila */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', justifyContent: 'flex-end' }}>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        CANCELAR
                    </button>
                )}
                {onPrint && (
                    <button
                        onClick={onPrint}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#1f2937',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        🖨️ Imprimir
                    </button>
                )}
                {onSave && (
                    <button
                        onClick={onSave}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Guardar cambios
                    </button>
                )}
            </div>

            {/* Segunda fila */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {onDirectPurchase && (
                    <button
                        onClick={onDirectPurchase}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'white',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        + Compra directa
                    </button>
                )}
                {onReturnMaterial && (
                    <button
                        onClick={onReturnMaterial}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#ea580c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Devolver material
                    </button>
                )}
                {onConsumeMaterial && (
                    <button
                        onClick={onConsumeMaterial}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#c2410c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Salida de material
                    </button>
                )}
                {onRegisterPayment && (
                    <button
                        onClick={onRegisterPayment}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#15803d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        💵 Registrar Pago
                    </button>
                )}
            </div>
        </div>
    );
}
