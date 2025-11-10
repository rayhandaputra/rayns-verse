// app/routes/pesanan.new.tsx
import {
  CheckCircle2Icon,
  ChevronLeft,
  PlusCircleIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Form,
  redirect,
  useActionData,
  useNavigate,
  type ActionFunction,
} from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import SelectBasic from "~/components/select/SelectBasic";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import moment from "moment";
import { API, API_KEY, API_URL } from "~/lib/api";
import { getSession } from "~/lib/session";
import AsyncReactSelect from "react-select/async";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { generateShortId, toMoney } from "~/lib/utils";
import AsyncCreatableSelect from "react-select/async-creatable";

// === ACTION ===
export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  let { id, state, items, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    state = state ? JSON.parse(state) : {};
    items = items ? JSON.parse(items) : {};

    await API.ORDERS.create({
      session: {},
      req: {
        body: {
          ...state,
          items,
        },
      },
    });

    return Response.json({
      flash: {
        success: true,
        message: "Pesanan berhasil dibuat",
      },
    });
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error_message: "Terjadi kesalahan saat menyimpan pesanan",
    };
  }
};

// === COMPONENT ===
export default function CreatePesanan() {
  const actionData = useActionData();
  const navigate = useNavigate();

  const defItem = {
    product_id: "",
    product_name: "",
    product_type: "single",
    unit_price: 0,
    qty: 1,
    subtotal: 0,
  };
  const [items, setItems] = useState<any[]>([defItem]);

  useEffect(() => {
    if (actionData?.flash) {
      navigate("/app/order/ordered", {
        state: { flash: actionData?.flash },
        replace: true,
      });
    }
  }, [actionData]);

  const defaultState = {
    institution_id: "",
    institution_name: "",
    institution_abbr: "",
    institution_abbr_id: "",
    institution_domain: "",
    order_type: "package",
    payment_status: "unpaid",
    payment_method: "manual_transfer",
    discount_value: 0,
    tax_percent: 0,
    shipping_fee: 0,
    other_fee: 0,
    deadline: moment().format("YYYY-MM-DD"),
  };
  const [state, setState] = useState<any>(defaultState);

  // === HITUNG TOTALS ===
  const subtotal = items.reduce((a, b) => a + (b.subtotal || 0), 0);
  const discount = parseFloat(state.discount_value) || 0;
  const taxPercent = parseFloat(state.tax_percent) || 0;
  const shippingFee = parseFloat(state.shipping_fee) || 0;
  const otherFee = parseFloat(state.other_fee) || 0;

  const afterDiscount = Math.max(subtotal - discount, 0);
  const tax = (afterDiscount * taxPercent) / 100;
  const grandTotal = afterDiscount + tax + shippingFee + otherFee;

  // === LOAD OPTIONS ===
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
          table: "institutions",
          columns: ["id", "name", "abbr"],
          where: { deleted_on: "null" },
          search,
          page: 0,
          size: 50,
        }),
      });
      const result = await response.json();
      return result?.items?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.abbr ? v?.abbr + " - " : ""}${v?.name}`,
      }));
    } catch (error) {
      console.log(error);
    }
  };
  const loadOptionDomain = async (search: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          action: "select",
          table: "institution_domains",
          columns: ["id", "institution_id", "domain"],
          where: {
            deleted_on: "null",
            institution_id: state?.institution_id || "0000",
          },
          search,
          page: 0,
          size: 50,
        }),
      });
      const result = await response.json();
      return result?.items?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: v?.domain,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const loadOptionProduct = async (search: string) => {
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
          columns: ["id", "name", "type", "total_price"],
          where: { deleted_on: "null" },
          search,
          page: 0,
          size: 50,
        }),
      });
      const result = await response.json();
      return result?.items?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.type === "package" ? "[PAKET] " : ""}${v?.name} - Rp${toMoney(v?.total_price)}`,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-6">
      <TitleHeader
        title="Form Pemesanan"
        description="Buat pesanan baru untuk instansi"
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Pesanan", href: "/app/order/ordered" },
              { label: "Form Pesanan", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="text-blue-700"
            onClick={() => navigate("/app/order/ordered")}
            variant="outline"
          >
            <ChevronLeft className="w-4" />
            Kembali
          </Button>
        }
      />

      <div className="space-y-6 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <input type="hidden" name="state" value={JSON.stringify(state)} />

        {/* === INSTANSI === */}
        <section className="space-y-4">
          <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
            Data Instansi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nama Instansi</Label>
              <AsyncReactSelect
                value={
                  state?.institution_id
                    ? {
                        value: state?.institution_id,
                        label: state?.institution_name,
                      }
                    : null
                }
                loadOptions={loadOptionInstitution}
                defaultOptions
                placeholder="Cari dan Pilih Instansi"
                onChange={(val: any) =>
                  setState({
                    ...state,
                    institution_id: val.value,
                    institution_name: val.label,
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Singkatan Instansi</Label>
              <AsyncCreatableSelect
                cacheOptions
                defaultOptions
                isClearable
                placeholder="Cari atau tambahkan singkatan instansi..."
                loadOptions={loadOptionDomain}
                value={
                  state?.institution_abbr
                    ? {
                        value: "",
                        label: state?.institution_abbr,
                      }
                    : null
                }
                onChange={(val) => {
                  setState({
                    ...state,
                    institution_abbr_id: val?.value,
                    institution_abbr: val?.label,
                    institution_domain: `kinau.id/eforms/${generateShortId(12)}`,
                  });
                }}
                onCreateOption={(newValue) => {
                  const value = newValue.toUpperCase().replace(/\s+/g, "");
                  setState({
                    ...state,
                    institution_abbr: value,
                    institution_domain: `kinau.id/eforms/${generateShortId(12)}`,
                  });
                }}
                formatCreateLabel={(inputValue) => {
                  const newValue = inputValue.toUpperCase().replace(/\s+/g, "");
                  return (
                    <span>
                      Buat singkatan: <strong>{newValue}</strong>
                    </span>
                  );
                }}
                noOptionsMessage={({ inputValue }) => {
                  if (!inputValue) {
                    return (
                      <div style={{ padding: "8px", color: "#6b7280" }}>
                        Belum ada singkatan instansi.
                        <br />
                        <strong>Ketik</strong> untuk membuat singkatan baru.
                      </div>
                    );
                  }
                  return (
                    <div style={{ padding: "8px", color: "#6b7280" }}>
                      Tidak ditemukan hasil untuk <strong>{inputValue}</strong>.
                      <br />
                      Tekan <strong>Enter</strong> untuk membuat singkatan ini.
                    </div>
                  );
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Domain Instansi</Label>
            <Input
              readOnly
              value={state?.institution_domain}
              className="bg-gray-100"
              placeholder="Generate Otomatis"
            />
          </div>
        </section>

        {/* === DETAIL PESANAN === */}
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

        {/* === PRODUK === */}
        <section className="space-y-4">
          <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
            Produk Dipesan
          </h3>

          <CardContent className="bg-slate-50 space-y-3 py-4 rounded-lg border border-slate-200">
            {items.map((item, index) => (
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

        {/* === RINCIAN HARGA PESANAN === */}
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-700 text-base font-semibold">
              Rincian Harga Pesanan
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-800">
                Rp {toMoney(subtotal)}
              </span>
            </div>

            {/* Diskon */}
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-600 flex-1">Potongan / Diskon</span>
              <div className="flex items-center gap-1">
                <SelectBasic
                  options={[
                    { label: "%", value: "percent" },
                    { label: "Rp", value: "fixed" },
                  ]}
                  placeholder="Tipe"
                  value={state.discount_type || "fixed"}
                  onChange={(value) =>
                    setState((s: any) => ({ ...s, discount_type: value }))
                  }
                  className="w-20"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder={
                    state.discount_type === "percent"
                      ? "Misal 10%"
                      : "Nominal (Rp)"
                  }
                  value={state.discount_value ?? ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setState((s: any) => ({ ...s, discount_value: val }));
                  }}
                  className="w-40 text-right"
                />
              </div>
            </div>

            {/* Pajak */}
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-600 flex-1">Tambahan Pajak (%)</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                placeholder="Misal 11"
                value={state.tax_fee ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setState((s: any) => ({ ...s, tax_fee: val }));
                }}
                className="w-40 text-right"
              />
            </div>

            {/* Biaya Lain */}
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-600 flex-1">
                Biaya Lain (opsional)
              </span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Nominal (Rp)"
                value={state.other_fee ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setState((s: any) => ({ ...s, other_fee: val }));
                }}
                className="w-40 text-right"
              />
            </div>

            <div className="border-t border-slate-200 my-3" />

            {/* PERHITUNGAN */}
            {(() => {
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
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">
                      Setelah Diskon (
                      {state.discount_type === "percent"
                        ? `${state.discount_value || 0}%`
                        : `Rp ${toMoney(discountValue)}`}
                      )
                    </span>
                    <span className="font-semibold text-slate-700">
                      Rp {toMoney(afterDiscount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">
                      Pajak ({state.tax_fee || 0}%)
                    </span>
                    <span className="font-semibold text-slate-700">
                      Rp {toMoney(taxValue)}
                    </span>
                  </div>

                  {state.other_fee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Biaya Tambahan</span>
                      <span className="font-semibold text-slate-700">
                        Rp {toMoney(state.other_fee)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 my-3" />

                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-semibold text-base">
                      Total Akhir
                    </span>
                    <span className="text-blue-600 font-bold text-lg">
                      Rp {toMoney(total)}
                    </span>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* === BUTTON === */}
        <Form method="post" className="flex justify-end gap-2 pt-2">
          <input type="hidden" name="state" value={JSON.stringify(state)} />
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <Button
            type="button"
            variant="outline"
            className="text-gray-700"
            onClick={() => {
              setState(defaultState);
              setItems([defItem]);
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            <CheckCircle2Icon className="w-4 mr-1" />
            Buat Pesanan
          </Button>
        </Form>
      </div>
    </div>
  );
}
