'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MetadataGrid from '@/components/work-orders/MetadataGrid';
import WorkOrderLinesTable from '@/components/work-orders/WorkOrderLinesTable';
import ActionButtons from '@/components/work-orders/ActionButtons';
import RegisterPaymentModal from '@/components/work-orders/RegisterPaymentModal';
import ReturnMaterialModal from '@/components/work-orders/ReturnMaterialModal';
import DirectPurchaseModal from '@/components/work-orders/DirectPurchaseModal';
import WorkOrderHistory from './WorkOrderHistory';
import AddLineModal from '@/components/work-orders/AddLineModal';
import { updateWorkOrder, getWorkOrder } from '@/app/actions/work-orders';
import { convertQuoteToOrder } from '@/app/actions/work-orders';
import { deleteWorkOrderLine, getWorkOrderLines } from '@/app/actions/work-order-lines';

type WorkOrderDetailContentProps = {
    workOrder: any;
    lines: any[];
    clients: any[];
    assets: any[];
    serviceTypes: any[];
    users: any[];
    roleKey: string;
    isQuote: boolean;
};

export default function WorkOrderDetailContent({
    workOrder,
    lines,
    clients,
    assets,
    serviceTypes,
    users,
    roleKey,
    isQuote
}: WorkOrderDetailContentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(workOrder);
    const [localLines, setLocalLines] = useState(lines);
    const [showRegisterPaymentModal, setShowRegisterPaymentModal] = useState(false);
    const [showReturnMaterialModal, setShowReturnMaterialModal] = useState(false);
    const [showDirectPurchaseModal, setShowDirectPurchaseModal] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [showAddLineModal, setShowAddLineModal] = useState(false);
    const [addLineKind, setAddLineKind] = useState<'SERVICE' | 'MATERIAL'>('SERVICE');
    const [editingLine, setEditingLine] = useState<any>(null);
    const router = useRouter();

    const isTechnician = roleKey === 'Tecnico';
    const showFinancials = !isTechnician; // Admin/Supervisor see financials

    // Sync state when props change (from parent server component)
    useEffect(() => {
        console.log('Syncing from props:', workOrder.id, lines.length);
        setFormData(workOrder);
        setLocalLines(lines);
    }, [workOrder, lines]);

    const refreshMetadata = async () => {
        const updated = await getWorkOrder(workOrder.id);
        if (updated) {
            setFormData(updated);
        }
    };

    const refreshLines = async () => {
        const updated = await getWorkOrderLines(workOrder.id);
        setLocalLines(updated);
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        const formDataObj = new FormData();
        formDataObj.append('title', formData.title || '');
        formDataObj.append('description', formData.description || '');
        formDataObj.append('priority', formData.priority || 'medium');
        formDataObj.append('status', formData.status || 'pending');
        formDataObj.append('assigned_to', formData.assigned_to || '');
        formDataObj.append('client_id', formData.client_id || '');
        formDataObj.append('asset_id', formData.asset_id || '');
        formDataObj.append('service_type_id', formData.service_type_id || '');
        formDataObj.append('observations', formData.observations || '');
        formDataObj.append('terms_and_conditions', formData.terms_and_conditions || '');

        const result = await updateWorkOrder(workOrder.id, formDataObj);

        if (result.success) {
            setIsEditing(false);
            await refreshMetadata();
            startTransition(() => {
                router.refresh();
            });
        } else {
            alert('Error al guardar: ' + (result.error || 'Error desconocido'));
        }
    };

    const handleCancel = () => {
        setFormData(workOrder);
        setIsEditing(false);
    };

    const handleConvertToOrder = async () => {
        if (!confirm('¿Convertir esta cotización a orden de servicio? (Esto creará una nueva Orden manteniendo esta cotización como historial)')) return;

        const result = await convertQuoteToOrder(workOrder.id);

        if (result.success && result.newId) {
            console.log('Convert success, redirecting to new order:', result.newId);
            router.push(`/work-orders/${result.newId}`);
        } else if (result.success) {
            // Fallback if no newId returned
            await refreshMetadata();
            startTransition(() => {
                router.refresh();
            });
        } else {
            alert('Error al convertir: ' + (result.error || 'Error desconocido'));
        }
    };

    const handleDeleteLine = async (lineId: string) => {
        if (!confirm('¿Estás seguro de eliminar esta línea?')) return;

        // Optimistic update
        const previousLines = [...localLines];
        setLocalLines(prev => prev.filter(l => l.id !== lineId));

        const result = await deleteWorkOrderLine(lineId, workOrder.id);
        if (result.success) {
            console.log('Delete success, refreshing router...');
            await refreshLines();
            await refreshMetadata(); // Refresh metadata too because totals might change
            startTransition(() => {
                router.refresh();
            });
        } else {
            // Revert on error
            setLocalLines(previousLines);
            alert('Error al eliminar línea: ' + result.error);
        }
    };

    const handleEditLine = (lineId: string) => {
        const line = localLines.find(l => l.id === lineId);
        if (line) {
            setEditingLine(line);
            setShowAddLineModal(true);
        }
    };

    return (
        <div>
            {/* Quote Warning Banner */}
            {isQuote && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#fff3e0',
                    color: '#ef6c00',
                    border: '1px solid #ffe0b2',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    fontWeight: 500
                }}>
                    <strong>Modo Cotización.</strong> El inventario no se verá afectado hasta que se convierta a orden.
                </div>
            )}

            {/* Metadata Grid */}
            <MetadataGrid
                workOrder={formData}
                clients={clients}
                assets={assets}
                serviceTypes={serviceTypes}
                users={users}
                isEditing={isEditing && !isTechnician} // Técnicos cannot edit
                onChange={handleFieldChange}
            />

            {/* Lines Table Section */}
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                        Líneas de {isQuote ? 'Cotización' : 'Orden'}
                    </h2>

                    {!isTechnician && (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => {
                                    setEditingLine(null);
                                    setAddLineKind('SERVICE');
                                    setShowAddLineModal(true);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span>+</span> Agregar Línea
                            </button>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: isEditing ? '#dc2626' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                {isEditing ? '❌ Cancelar edición' : '✏️ Editar Info'}
                            </button>
                        </div>
                    )}
                </div>

                <WorkOrderLinesTable
                    key={JSON.stringify(localLines.map(l => l.id + l.qty))}
                    lines={localLines}
                    showFinancials={showFinancials}
                    onEdit={isEditing ? handleEditLine : undefined}
                    onDelete={isEditing ? handleDeleteLine : undefined}
                />
            </div>

            {/* Observations */}
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#666'
                }}>
                    Observaciones
                </label>
                {(isEditing && !isTechnician) ? (
                    <textarea
                        value={formData.observations || ''}
                        onChange={(e) => handleFieldChange('observations', e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontFamily: 'system-ui',
                            resize: 'vertical'
                        }}
                        placeholder="Agregar observaciones..."
                    />
                ) : (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '4px',
                        minHeight: '60px',
                        color: formData.observations ? '#333' : '#999',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {formData.observations || 'Sin observaciones'}
                    </div>
                )}
            </div>

            {/* Terms and Conditions */}
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#666'
                }}>
                    Términos y condiciones
                </label>
                {(isEditing && !isTechnician) ? (
                    <textarea
                        value={formData.terms_and_conditions || ''}
                        onChange={(e) => handleFieldChange('terms_and_conditions', e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontFamily: 'system-ui',
                            resize: 'vertical'
                        }}
                        placeholder="Agregar términos y condiciones..."
                    />
                ) : (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '4px',
                        minHeight: '60px',
                        color: formData.terms_and_conditions ? '#333' : '#999',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {formData.terms_and_conditions || 'Sin términos y condiciones'}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <ActionButtons
                isQuote={isQuote}
                isTechnician={isTechnician}
                workOrderId={workOrder.id}
                onCancel={handleCancel}
                onPrint={() => window.print()}
                onConvertToOrder={handleConvertToOrder}
                onSave={handleSave}
                onDirectPurchase={() => setShowDirectPurchaseModal(true)}
                onReturnMaterial={() => setShowReturnMaterialModal(true)}
                onConsumeMaterial={() => {
                    setEditingLine(null);
                    setAddLineKind('MATERIAL');
                    setShowAddLineModal(true);
                }}
                onRegisterPayment={() => setShowRegisterPaymentModal(true)}
            />

            {/* Register Payment Modal */}
            {showRegisterPaymentModal && (
                <RegisterPaymentModal
                    workOrder={workOrder}
                    onClose={() => setShowRegisterPaymentModal(false)}
                    onSuccess={async () => {
                        setShowRegisterPaymentModal(false);
                        await refreshMetadata();
                        startTransition(() => {
                            router.refresh();
                        });
                    }}
                />
            )}

            {/* Return Material Modal */}
            {showReturnMaterialModal && (
                <ReturnMaterialModal
                    workOrderId={workOrder.id}
                    lines={localLines}
                    onClose={() => setShowReturnMaterialModal(false)}
                    onSuccess={async () => {
                        setShowReturnMaterialModal(false);
                        await refreshLines();
                        await refreshMetadata();
                        startTransition(() => {
                            router.refresh();
                        });
                    }}
                />
            )}

            {/* Direct Purchase Modal */}
            {showDirectPurchaseModal && (
                <DirectPurchaseModal
                    workOrderId={workOrder.id}
                    onClose={() => setShowDirectPurchaseModal(false)}
                    onSuccess={async () => {
                        setShowDirectPurchaseModal(false);
                        await refreshLines();
                        await refreshMetadata();
                        startTransition(() => {
                            router.refresh();
                        });
                    }}
                />
            )}

            {/* Add/Edit Line Modal */}
            {showAddLineModal && (
                <AddLineModal
                    workOrderId={workOrder.id}
                    line={editingLine}
                    defaultKind={addLineKind}
                    onClose={() => {
                        setShowAddLineModal(false);
                        setEditingLine(null);
                    }}
                    onSuccess={async () => {
                        setShowAddLineModal(false);
                        setEditingLine(null);
                        await refreshLines();
                        await refreshMetadata();
                        startTransition(() => {
                            router.refresh();
                        });
                    }}
                />
            )}

            {isPending && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    zIndex: 1000
                }}>
                    Procesando...
                </div>
            )}

            {/* Activity History */}
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                marginTop: '2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
                    Historial de Actividad
                </h2>
                <WorkOrderHistory workOrderId={workOrder.id} />
            </div>
        </div>
    );
}
