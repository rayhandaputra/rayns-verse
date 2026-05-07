import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import AsyncReactSelect from "react-select/async";
import { Trash2Icon, PlusCircleIcon, CheckCircle2Icon } from "lucide-react";
import { toMoney } from "~/lib/utils";
import { API_URL, API_KEY, API } from "~/lib/api";
import { Form } from "react-router";
import useSWR from "swr";
import { toast } from "sonner";

export default function ProductFullFormModal({
  detail,
  currentItems = [],
  onSuccess,
}: any) {
  // === STATE AWAL ===
  const defState = {
    code: detail?.code ?? "",
    name: detail?.name ?? "",
    type: detail?.type ?? "single",
    description: detail?.description ?? "",
    discount_value: detail?.discount_value ?? 0,
    tax_fee: detail?.tax_fee ?? 0,
    other_fee: detail?.other_fee ?? 0,
    image: detail?.image ?? "",
  };

  const defItem = {
    commodity_id: 0,
    commodity_name: "",
    qty: 1,
    unit_price: 0,
    subtotal: 0,
  };

  const [state, setState] = useState<any>(defState);
  const [loading, setLoading] = useState<boolean>(false);

  const fetcherAction = async (filters: any) => {
    const res = await API.PRODUCT_COMPONENT.get({
      req: { query: filters },
    });
    return res?.items;
  };
  const { data: product_components, mutate } = useSWR(
    detail?.id ? detail?.id : null,
    () =>
      fetcherAction({
        product_id: detail?.id || "null",
      })
  );

  useEffect(() => {
    setState(defState);
  }, [detail]);

  const defComponent = useMemo(() => {
    if (product_components?.length > 0) {
      return product_components.map((it: any) => ({
        ...defItem,
        ...it,
        unit_price: +it.unit_price || 0,
        qty: +it.qty || 0,
        subtotal: (+it.unit_price || 0) * (+it.qty || 0),
      }));
    }
    return [defItem];
  }, [product_components]);

  useEffect(() => {
    setItems(defComponent);
  }, [defComponent]);

  // === SET ITEMS (DARI LOADER) ===
  const [items, setItems] = useState<any[]>(defComponent);

  // === HITUNG OTOMATIS ===
  const subtotal = items.reduce((a, b) => a + (b.subtotal || 0), 0);
  const discount = state.discount_value || 0;
  const taxPercent = state.tax_fee || 0;
  const extraFee = state.other_fee || 0;

  const afterDiscount = subtotal - discount;
  const tax = taxPercent > 0 ? (afterDiscount * taxPercent) / 100 : 0;
  const total = +afterDiscount + +tax + +extraFee;

  // === LOAD OPTION KOMODITAS ***
  const loadOptionCommodity = async (search: string) => {
    try {
      const result = await API.COMMODITY.get({ req: { search } });
      return result?.items?.map((v: any) => ({
        value: v.id,
        label: `[${v.code}] ${v.name} - Rp ${v.base_price}`,
        base_price: v.base_price,
        name: v.name,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  // === UPDATE ITEM ===
  const handleChangeItem = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              [field]: value,
              subtotal:
                field === "qty" || field === "unit_price"
                  ? (field === "qty" ? +value : +it.qty) *
                    (field === "unit_price" ? +value : +it.unit_price)
                  : it.subtotal,
            }
          : it
      )
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const response = await API.ASSET.upload(file);
      setState((prev: any) => ({
        ...prev,
        image: response?.url,
      }));

      toast.success("Upload berhasil", { description: file.name });
    } catch (err) {
      toast.error("Upload gagal", { description: file.name });
    } finally {
      setLoading(false);
    }
  };

  // === TAMBAH ITEM ===
  const addItem = () => {
    setItems((prev) => [...prev, { ...defItem, id: Date.now() }]);
  };

  // === HAPUS ITEM ===
  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // === KIRIM DATA KE REMIX FORM (hidden) ===
  useEffect(() => {
    document
      .querySelector('input[name="subtotal"]')
      ?.setAttribute("value", subtotal.toString());
    document
      .querySelector('input[name="total"]')
      ?.setAttribute("value", total.toString());
  }, [subtotal, total]);

  return (
    <div className="space-y-6 pb-10">
      {/* === FOTO PRODUK === */}
      <div className="space-y-4 bg-white border border-gray-300 p-4 rounded-lg">
        <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
          Foto Produk
        </h3>

        <div className="flex items-start gap-4">
          {/* PREVIEW IMAGE (1:1) */}
          <div className="w-32 h-32 rounded-lg border border-gray-300 bg-gray-100 overflow-hidden flex items-center justify-center">
            {state.image ? (
              <img
                src={state.image}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-500">Preview</span>
            )}
          </div>

          {/* INPUT FILE */}
          <div className="flex-1 space-y-2">
            <Label>Upload Foto (1:1)</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            <p className="text-xs text-gray-500">
              Rekomendasi ukuran 800×800px — format JPG/PNG.
            </p>
          </div>
        </div>
      </div>

      {/* === INFORMASI PRODUK === */}
      <div className="space-y-4 bg-white border border-gray-300 p-4 rounded-lg">
        <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
          Informasi Produk
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NAMA */}
          <div className="space-y-1">
            <Label aria-required>Nama Produk</Label>
            <Input
              required
              value={state.name}
              onChange={(e) => setState({ ...state, name: e.target.value })}
              placeholder="Nama Produk"
            />
          </div>
        </div>

        {/* DESKRIPSI */}
        <div className="space-y-1">
          <Label>Deskripsi</Label>
          <Input
            value={state.description}
            onChange={(e) =>
              setState({ ...state, description: e.target.value })
            }
            placeholder="Deskripsi Produk (opsional)"
          />
        </div>
      </div>

      {/* === KOMPONEN === */}
      <div className="space-y-4 bg-white border border-gray-300 p-4 rounded-lg">
        <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
          Komponen Penyusun
        </h3>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 bg-slate-50 border border-gray-300 p-3 rounded-lg"
            >
              {/* SELECT */}
              <div className="col-span-5">
                <AsyncReactSelect
                  value={
                    item?.commodity_id
                      ? {
                          value: item.commodity_id,
                          label: item.commodity_name,
                        }
                      : null
                  }
                  loadOptions={loadOptionCommodity}
                  defaultOptions
                  onChange={(val: any) => {
                    let copy = [...items];
                    copy[index] = {
                      ...item,
                      commodity_id: val.value,
                      commodity_name: val.label,
                      unit_price: val.base_price,
                      subtotal: (val.base_price || 0) * (item?.qty || 0),
                    };
                    setItems(copy);
                  }}
                />
              </div>

              {/* QTY */}
              <div className="col-span-4">
                <Input
                  type="number"
                  className="text-center"
                  value={item.qty}
                  onChange={(e) =>
                    handleChangeItem(index, "qty", +e.target.value)
                  }
                />
              </div>

              {/* SUBTOTAL */}
              <div className="col-span-2 text-right font-semibold">
                Rp {toMoney(item.subtotal)}
              </div>

              {/* DELETE */}
              <div className="col-span-1 flex justify-end">
                <Button
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="text-red-600 hover:text-red-500"
                  onClick={() => removeItem(index)}
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
            className="text-gray-800"
            onClick={addItem}
          >
            <PlusCircleIcon className="w-4 mr-1" />
            Tambah Komponen
          </Button>
        </div>
      </div>

      {/* === RINCIAN HARGA === */}
      <div className="space-y-4 bg-white border border-gray-300 p-4 rounded-lg">
        <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
          Rincian Harga Produk
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">Rp {toMoney(subtotal)}</span>
          </div>

          {/* DISKON */}
          <div className="flex justify-between items-center gap-3">
            <span className="flex-1">Diskon</span>
            <Input
              type="number"
              className="w-40 text-right"
              value={state.discount_value}
              onChange={(e) =>
                setState({ ...state, discount_value: +e.target.value })
              }
            />
          </div>

          {/* PAJAK */}
          <div className="flex justify-between items-center gap-3">
            <span className="flex-1">Pajak (%)</span>
            <Input
              type="number"
              className="w-40 text-right"
              value={state.tax_fee}
              onChange={(e) => setState({ ...state, tax_fee: +e.target.value })}
            />
          </div>

          {/* BIAYA LAIN */}
          <div className="flex justify-between items-center gap-3">
            <span className="flex-1">Biaya Lain</span>
            <Input
              type="number"
              className="w-40 text-right"
              value={state.other_fee}
              onChange={(e) =>
                setState({ ...state, other_fee: +e.target.value })
              }
            />
          </div>

          <hr className="my-2" />

          <div className="flex justify-between text-base font-semibold">
            <span>Total Harga</span>
            <span className="text-blue-600">Rp {toMoney(total)}</span>
          </div>
        </div>
      </div>

      {/* === SUBMIT KE REMIX FORM === */}
      <Form method="post" className="flex justify-end">
        <input type="hidden" name="id" value={detail?.id} />
        <input type="hidden" name="state" value={JSON.stringify(state)} />
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <input type="hidden" name="subtotal" value={subtotal} />
        <input type="hidden" name="total" value={total} />

        <Button className="bg-green-700 text-white">
          <CheckCircle2Icon className="w-4 mr-1" />
          Simpan Produk
        </Button>
      </Form>
    </div>
  );
}
