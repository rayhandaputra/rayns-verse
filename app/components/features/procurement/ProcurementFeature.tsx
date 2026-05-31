
import React from 'react';
import { API } from '~/nexus';
import { useProcurementLogic } from './use-procurement-logic';
import { ProcurementForm } from './ProcurementForm';
import { LogTable } from './LogTable';
import { ProofModals } from './ProofModals';

export default function ProcurementFeature() {
    const {
        isSubmitting,
        modal,
        setModal,
        shops,
        transactions,
        form,
        setForm,
        cottonOrderOptions,
        selectedOrderData,
        calcData,
        handleProcess,
        handleProcessSablon,
        handleSubmitPaymentProof
    } = useProcurementLogic();

    const loadSupplierOptions = async (inputValue: string) => {
        try {
            const response = await API.SUPPLIER.get({
                session: {},
                req: {
                    query: {
                        size: 100, category: "cotton_combed_premium", search: inputValue || undefined
                    }
                }
            })
            return response?.items?.map((v: any) => ({
                ...v,
                value: v?.id,
                label: v?.name
            }))
        } catch (err) {
            return []
        }
    };

    return (
        <div className="space-y-8 animate-fade-in p-6">
            <ProcurementForm
                shops={shops}
                orders={cottonOrderOptions}
                form={form}
                setForm={setForm}
                calcData={calcData}
                selectedOrderData={selectedOrderData}
                handleProcess={handleProcess}
                isSubmitting={isSubmitting}
            />

            <LogTable
                transactions={transactions}
                shops={shops}
                isSubmitting={isSubmitting}
                handleProcessSablon={handleProcessSablon}
                loadSupplierOptions={loadSupplierOptions}
                openUploadModal={(data: any, fieldName: string) => setModal({ open: true, type: "upload_payment_proof", data: { ...data, target_field: fieldName } })}
                openViewModal={(data: any) => setModal({ open: true, type: "view_payment_proof", data })}
            />

            <ProofModals
                modal={modal}
                setModal={setModal}
                handleSubmitPaymentProof={handleSubmitPaymentProof}
                actionLoading={isSubmitting}
            />
        </div>
    );
}
