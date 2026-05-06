
import React from "react";
import { Label } from "~/components/ui/label";
import SelectBasic from "~/components/shared/select/SelectBasic";

export const OrderDetailSection = ({ state, setState }: any) => {
    return (
        <section className="space-y-4">
            <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
                Detail Pesanan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <Label>Jenis Pesanan</Label>
                    <SelectBasic
                        options={[
                            { label: "Paket", value: "package" },
                            { label: "Kartu ID", value: "id_card" },
                            { label: "Lanyard", value: "lanyard" },
                            { label: "Custom", value: "custom" },
                            { label: "Layanan / Service", value: "service" },
                        ]}
                        value={state?.order_type}
                        onChange={(value) => setState({ ...state, order_type: value })}
                    />
                </div>

                <div className="space-y-1">
                    <Label>Status Pembayaran</Label>
                    <SelectBasic
                        options={[
                            { label: "Belum Bayar", value: "unpaid" },
                            { label: "DP", value: "down_payment" },
                            { label: "Lunas", value: "paid" },
                        ]}
                        value={state?.payment_status}
                        onChange={(val) => setState({ ...state, payment_status: val })}
                    />
                </div>

                <div className="space-y-1">
                    <Label>Metode Pembayaran</Label>
                    <SelectBasic
                        options={[
                            { label: "Transfer Manual", value: "manual_transfer" },
                            { label: "QRIS", value: "qris" },
                            { label: "Virtual Account", value: "virtual_account" },
                            { label: "Tunai / Cash", value: "cash" },
                        ]}
                        value={state?.payment_method}
                        onChange={(val) => setState({ ...state, payment_method: val })}
                    />
                </div>
            </div>
        </section>
    );
};
