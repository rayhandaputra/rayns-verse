
import React from "react";
import { PlusCircleIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import AsyncReactSelect from "react-select/async";
import { CardContent } from "~/components/ui/card";
import { toMoney } from "~/utils/utils";

export const ProductSection = ({ items, setItems, loadOptionProduct, defItem }: any) => {
    return (
        <section className="space-y-4">
            <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
                Produk Dipesan
            </h3>

            <CardContent className="bg-slate-50 space-y-3 py-4 rounded-lg border border-slate-200">
                {items.map((item: any, index: number) => (
                    <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-slate-200"
                    >
                        <div className="col-span-5">
                            <AsyncReactSelect
                                value={
                                    item?.product_id
                                        ? { value: item?.product_id, label: item?.product_name }
                                        : null
                                }
                                loadOptions={loadOptionProduct}
                                defaultOptions
                                placeholder="Cari Produk"
                                onChange={(val: any) => {
                                    const price = val?.total_price ?? 0;
                                    const tmp = [...items];
                                    tmp[index] = {
                                        ...item,
                                        product_id: val.value,
                                        product_name: val.label,
                                        product_type: val.type,
                                        unit_price: price,
                                        subtotal: price * (item.qty ?? 1),
                                    };
                                    setItems(tmp);
                                }}
                            />
                        </div>

                        <div className="col-span-2">
                            <Input
                                placeholder="Qty"
                                value={item?.qty}
                                onChange={(e) => {
                                    const qty = +e.target.value;
                                    const tmp = [...items];
                                    tmp[index] = {
                                        ...item,
                                        qty,
                                        subtotal: qty * (item?.unit_price ?? 0),
                                    };
                                    setItems(tmp);
                                }}
                                className="text-center"
                            />
                        </div>

                        <div className="col-span-4 text-right">
                            <p className="text-sm font-semibold text-slate-700">
                                Rp {toMoney(item?.subtotal)}
                            </p>
                        </div>

                        <div className="col-span-1 flex justify-end">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-500"
                                onClick={() => {
                                    const tmp = [...items];
                                    tmp.splice(index, 1);
                                    setItems(tmp);
                                }}
                            >
                                <Trash2Icon className="w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setItems([...items, defItem])}
                >
                    <PlusCircleIcon className="w-4 mr-1" />
                    Tambah Produk
                </Button>
            </CardContent>
        </section>
    );
};
