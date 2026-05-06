
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import SelectBasic from "~/components/shared/select/SelectBasic";
import { toMoney } from "~/utils/utils";

export const SummarySection = ({ state, setState, subtotal }: any) => {
    let discountValue = 0;
    if (state.discount_type === "percent") {
        discountValue = (subtotal * (state.discount_value || 0)) / 100;
    } else {
        discountValue = state.discount_value || 0;
    }
    const afterDiscount = Math.max(subtotal - discountValue, 0);
    const taxValue = (afterDiscount * (state.tax_fee || 0)) / 100;
    const total = afterDiscount + taxValue + (state.other_fee || 0);

    return (
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-slate-700 text-base font-semibold">
                    Rincian Harga Pesanan
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-800">Rp {toMoney(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center gap-3">
                    <span className="text-slate-600 flex-1">Potongan / Diskon</span>
                    <div className="flex items-center gap-1">
                        <SelectBasic
                            options={[{ label: "%", value: "percent" }, { label: "Rp", value: "fixed" }]}
                            placeholder="Tipe"
                            value={state.discount_type || "fixed"}
                            onChange={(value) => setState((s: any) => ({ ...s, discount_type: value }))}
                            className="w-20"
                        />
                        <Input
                            type="number"
                            value={state.discount_value ?? ""}
                            onChange={(e) => setState((s: any) => ({ ...s, discount_value: parseFloat(e.target.value) || 0 }))}
                            className="w-40 text-right"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center gap-3">
                    <span className="text-slate-600 flex-1">Tambahan Pajak (%)</span>
                    <Input
                        type="number"
                        value={state.tax_fee ?? ""}
                        onChange={(e) => setState((s: any) => ({ ...s, tax_fee: parseFloat(e.target.value) || 0 }))}
                        className="w-40 text-right"
                    />
                </div>

                <div className="flex justify-between items-center gap-3">
                    <span className="text-slate-600 flex-1">Biaya Lain (opsional)</span>
                    <Input
                        type="number"
                        value={state.other_fee ?? ""}
                        onChange={(e) => setState((s: any) => ({ ...s, other_fee: parseFloat(e.target.value) || 0 }))}
                        className="w-40 text-right"
                    />
                </div>

                <div className="border-t border-slate-200 my-3" />

                <div className="flex justify-between items-center">
                    <span className="text-slate-600">
                        Setelah Diskon ({state.discount_type === "percent" ? `${state.discount_value || 0}%` : `Rp ${toMoney(discountValue)}`})
                    </span>
                    <span className="font-semibold text-slate-700">Rp {toMoney(afterDiscount)}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Pajak ({state.tax_fee || 0}%)</span>
                    <span className="font-semibold text-slate-700">Rp {toMoney(taxValue)}</span>
                </div>

                {state.other_fee > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Biaya Tambahan</span>
                        <span className="font-semibold text-slate-700">Rp {toMoney(state.other_fee)}</span>
                    </div>
                )}

                <div className="border-t border-slate-200 my-3" />

                <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-semibold text-base">Total Akhir</span>
                    <span className="text-blue-600 font-bold text-lg">Rp {toMoney(total)}</span>
                </div>
            </CardContent>
        </Card>
    );
};
