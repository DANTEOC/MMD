'use client';

import { useState } from 'react';
import { Landmark, ArrowDownCircle, PlusCircle } from 'lucide-react';
import { type BankAccount } from '@/app/actions/banks';
import { GeneralIncomeModal } from '@/components/finance/GeneralIncomeModal';

export function BanksHeader({ banks }: { banks: BankAccount[] }) {
    const [showIncomeModal, setShowIncomeModal] = useState(false);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Landmark className="text-blue-600" />
                    Tesorería y Bancos
                </h1>
                <p className="text-gray-500 mt-1">Administra tus cuentas bancarias y saldos.</p>
            </div>

            <div className="flex items-center gap-2">
                <a
                    href="/finance/transactions"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <ArrowDownCircle size={18} className="text-gray-400" />
                    Ver Movimientos
                </a>

                <button
                    onClick={() => setShowIncomeModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <PlusCircle size={18} />
                    Nuevo Ingreso
                </button>
            </div>

            {showIncomeModal && (
                <GeneralIncomeModal
                    banks={banks}
                    onClose={() => setShowIncomeModal(false)}
                    onSuccess={() => {
                        setShowIncomeModal(false);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
