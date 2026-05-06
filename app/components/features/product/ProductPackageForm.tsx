import React, { useState, useEffect } from "react";
import { CheckCircle2Icon, ChevronLeftIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
import { useLoaderData, useNavigate, useActionData, Form } from "react-router";
import AsyncReactSelect from "react-select/async";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { TitleHeader } from "~/components/core/TitleHeader";
import { AppBreadcrumb } from "~/components/core/AppBreadcrumb";
import { toMoney } from "~/utils/utils";
import { API_URL, API_KEY } from "~/nexus";

export const ProductPackageForm: React.FC = () => {
  const { detail, items: currentItems } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const navigate = useNavigate();

  const defState = {
    code: detail?.code ?? "",
    name: detail?.name ?? "",
    type: "package",
    description: detail?.description ?? "",
    discount_value: detail?.discount_value ?? 0,
    tax_fee: detail?.tax_fee ?? 0,
    other_fee: detail?.other_fee ?? 0,
  };
  const [state, setState] = useState<any>(defState);

  const defItem = {
    product_id: 0,
    product_name: "",
    qty: 1,
    unit_price: 0,
    subtotal: 0,
  };

  const [items, setItems] = useState<any[]>(() => {
    if (currentItems?.length > 0) {
      return currentItems.map((it: any) => ({
        ...defItem,
        ...it,
        product_id: it.product_id,
        product_name: it.product_name,
        unit_price: +it.unit_price || 0,
        qty: +it.qty || 0,
        subtotal: (+it.unit_price || 0) * (+it.qty || 0),
      }));
    }
    return [defItem];
  });

  const loadOptionInstitution = async (search: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          action: "select",
          table: "products",
          columns: ["id", "name", "total_price"],
          where: { deleted_on: "null", type: "single" },
          search,
          page: 0,
          size: 50,
        }),
      });
      const result = await response.json();
      return result?.items?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.abbr ? v?.abbr + "- " : ""}${v?.name}`,
        name: v.name,
        base_price: v.total_price
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const subtotal = items.reduce((a, b) => a + (b.subtotal || 0), 0);
  const discount = Number(state.discount_value || 0);
  const taxPercent = Number(state.tax_fee || 0);
  const extraFee = Number(state.other_fee || 0);
  const afterDiscount = subtotal - discount;
  const tax = (afterDiscount * taxPercent) / 100;
  const total = afterDiscount + tax + extraFee;

  useEffect(() => {
    if (actionData?.flash?.success) {
      navigate("/app/product/package", { replace: true });
    }
  }, [actionData, navigate]);

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-4">
      <TitleHeader
        title={`${!detail ? "Tambah" : "Edit"} Paket Produk`}
        description="Bundling beberapa produk tunggal menjadi satu paket"
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Paket Produk", href: "/app/product/package" },
              { label: "Manajemen", active: true },
            ]}
          />
        }
        actions={
          <Button
            variant="outline"
            className="text-gray-600 hover:bg-gray-50 border-gray-200"
            onClick={() => navigate(`/app/product/package`)}
          >
            <ChevronLeftIcon className="w-4 mr-1" />
            Kembali
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="border-b border-gray-50 bg-gray-50/10">
              <CardTitle className="text-sm font-bold uppercase text-gray-400">Informasi Paket</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-500">Kode Paket</Label>
                  <Input
                    placeholder="e.g. PKT-001"
                    className="bg-gray-50 border-gray-200 uppercase font-mono"
                    value={state.code}
                    onChange={(e) => setState({ ...state, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-500">Nama Paket</Label>
                  <Input
                    placeholder="e.g. Paket Seragam Karyawan"
                    className="bg-gray-50 border-gray-200 font-bold"
                    value={state.name}
                    onChange={(e) => setState({ ...state, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-500">Deskripsi</Label>
                <Input
                  placeholder="Keterangan singkat paket..."
                  className="bg-gray-50 border-gray-200"
                  value={state.description}
                  onChange={(e) => setState({ ...state, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardHeader className="border-b border-gray-50 bg-gray-50/10 flex flex-row justify-between items-center py-4">
              <CardTitle className="text-sm font-bold uppercase text-gray-400">Daftar Produk Bundling</CardTitle>
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-8"
                onClick={() => setItems([...items, defItem])}
              >
                <PlusCircleIcon className="w-4 mr-1.5" />
                Tambah Produk
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 group transition-all hover:bg-white hover:shadow-sm">
                  <div className="col-span-12 md:col-span-6">
                    <Label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Pilih Produk Tunggal</Label>
                    <AsyncReactSelect
                      value={item?.product_id ? { value: item?.product_id, label: item?.product_name } : null}
                      loadOptions={loadOptionInstitution}
                      cacheOptions
                      defaultOptions
                      placeholder="Cari produk..."
                      onChange={(val: any) => {
                        const newItems = [...items];
                        newItems[index] = {
                          ...item,
                          product_id: val.value,
                          product_name: val.name,
                          unit_price: val.base_price || 0,
                          subtotal: (val.base_price || 0) * (item?.qty || 0),
                        };
                        setItems(newItems);
                      }}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <Label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Jumlah</Label>
                    <Input
                      type="number"
                      value={item?.qty}
                      className="bg-white text-center font-bold"
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index] = {
                          ...item,
                          qty: +e.target.value,
                          subtotal: +e.target.value * (item?.unit_price || 0),
                        };
                        setItems(newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-3 text-right">
                    <Label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Subtotal</Label>
                    <p className="text-sm font-bold text-gray-800">Rp {toMoney(item?.subtotal || 0)}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex justify-end pt-5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-rose-500 hover:bg-rose-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                    >
                      <Trash2Icon className="w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-sm border-gray-100 sticky top-6">
            <CardHeader className="border-b border-gray-50 bg-gray-50/10">
              <CardTitle className="text-sm font-bold uppercase text-gray-400">Rincian Harga Paket</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal Produk</span>
                <span className="font-bold text-gray-800">Rp {toMoney(subtotal)}</span>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs text-gray-400">Potongan / Diskon (Rp)</Label>
                <Input
                  type="number"
                  value={state.discount_value || ""}
                  onChange={(e) => setState({ ...state, discount_value: +e.target.value })}
                  className="bg-gray-50 text-right font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Pajak (%)</Label>
                  <Input
                    type="number"
                    value={state.tax_fee || ""}
                    onChange={(e) => setState({ ...state, tax_fee: +e.target.value })}
                    className="bg-gray-50 text-center font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Biaya Lain (Rp)</Label>
                  <Input
                    type="number"
                    value={state.other_fee || ""}
                    onChange={(e) => setState({ ...state, other_fee: +e.target.value })}
                    className="bg-gray-50 text-right font-bold"
                  />
                </div>
              </div>

              <div className="border-t border-dashed border-gray-100 my-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-gray-900 leading-tight">Total Harga<br/><span className="text-[10px] font-normal text-gray-400 font-sans tracking-normal">Sudah termasuk pajak & biaya</span></span>
                <span className="text-xl font-bold text-indigo-600">Rp {toMoney(total)}</span>
              </div>

              <Form method="post" className="pt-2">
                <input type="hidden" name="id" value={detail?.id || ""} />
                <input type="hidden" name="state" value={JSON.stringify(state)} />
                <input type="hidden" name="items" value={JSON.stringify(items.map(it => ({ product_id: it.product_id, qty: it.qty })))} />
                <input type="hidden" name="subtotal" value={subtotal} />
                <input type="hidden" name="total" value={total} />
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-bold shadow-lg shadow-emerald-100 flex gap-2">
                  <CheckCircle2Icon size={18} />
                  Simpan Paket Produk
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
