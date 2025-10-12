// // app/routes/pesanan.new.tsx
// // import { ActionFunctionArgs, redirect } from "@remix-run/node";
// // import { Form, useActionData } from "@remix-run/react";
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
import { toMoney } from "~/lib/utils";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  let { id, state, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    state = state ? JSON.parse(state) : {};

    await API.ORDERS.create({
      session: {},
      req: {
        body: state,
      },
    });

    return Response.json({
      flash: {
        success: true,
        message: "Pesanan Berhasil Dibuat",
      },
    });
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error_message: "Terjadi Kesalahan",
    };
  }
};

export default function CreatePesanan() {
  const actionData = useActionData();
  const navigate = useNavigate();

  const defItem = {
    product_id: "",
    product_name: "",
    product_type: "",
    unit_price: 0,
    qty: 0,
  };
  const [items, setItems] = useState<any[]>([defItem]);
  // const defState = {
  //   code: "",
  //   name: "",
  //   type: "package",
  //   description: "",
  // };
  // const [state, setState] = useState<any>([defState]);

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
    institution_domain: "",
    order_type: "",
    payment_type: "",
    quantity: 0,
    deadline: moment().format("YYYY-MM-DD"),
    discount: 0,
    tax_percent: 0,
    extra_fee: 0,
  };
  const [state, setState] = useState<any>(defaultState);

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
        label: `${v?.abbr ? v?.abbr + "- " : ""}${v?.name}`,
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
          columns: ["id", "name", "type", "price"],
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
        label: `${v?.type === "package" ? `[PAKET] ` : ""}${v?.name} - Rp${toMoney(v?.price)}`,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <TitleHeader
        title="Form Pemesanan"
        description="Kelola data pesanan."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Pesanan", href: "/" },
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

      {/* FORM */}
      <Form
        method="post"
        className="space-y-6 bg-white rounded-xl shadow-sm p-6 border border-slate-200"
      >
        <input type="hidden" name="state" value={JSON.stringify(state)} />

        {/* === DATA INSTANSI === */}
        <div className="space-y-4">
          <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
            Data Instansi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Instansi */}
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
                maxMenuHeight={175}
                loadOptions={loadOptionInstitution}
                cacheOptions
                defaultOptions
                placeholder="Cari dan Pilih Instansi"
                onChange={(val: any) =>
                  setState({
                    ...state,
                    institution_id: val.value,
                    institution_name: val.label,
                  })
                }
                className="w-full text-xs font-light !text-black placeholder:text-xs"
              />
            </div>

            {/* Singkatan */}
            <div className="space-y-1">
              <Label>Singkatan Instansi</Label>
              <Input
                required
                type="text"
                placeholder="Masukkan Singkatan Instansi"
                value={state?.institution_abbr}
                onChange={(e) => {
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/\s+/g, "");
                  setState({
                    ...state,
                    institution_abbr: value,
                    institution_domain: `kinau.id/${value?.toLowerCase()}`,
                  });
                }}
              />
            </div>
          </div>

          {/* Domain */}
          <div className="space-y-1">
            <Label>Domain Institusi</Label>
            <Input
              required
              readOnly
              type="text"
              placeholder="Generate Otomatis"
              className="bg-gray-100"
              value={state?.institution_domain}
            />
          </div>
        </div>

        {/* === DETAIL PESANAN === */}
        <div className="space-y-4">
          <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
            Detail Pesanan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Deadline</Label>
              <Input
                required
                type="date"
                className="text-gray-700"
                value={state?.deadline}
                onChange={(e) =>
                  setState({ ...state, deadline: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Pembayaran</Label>
              <SelectBasic
                required
                options={[
                  { label: "DP", value: "down_payment" },
                  { label: "Lunas", value: "paid" },
                ]}
                placeholder="Pilih Jenis Pembayaran"
                value={state?.payment_type}
                onChange={(value) =>
                  setState({ ...state, payment_type: value })
                }
              />
            </div>
          </div>
        </div>

        {/* === PRODUK === */}
        <div className="space-y-4">
          <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
            Produk Dipesan
          </h3>

          <CardContent className="bg-slate-50 space-y-3 py-4 rounded-lg border border-slate-200">
            {items.map((item: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-slate-200"
              >
                {/* Produk */}
                <div className="col-span-5">
                  <AsyncReactSelect
                    value={
                      item?.product_id
                        ? { value: item?.product_id, label: item?.product_name }
                        : null
                    }
                    maxMenuHeight={175}
                    loadOptions={loadOptionProduct}
                    cacheOptions
                    defaultOptions
                    placeholder="Cari dan Pilih Produk"
                    onChange={(val: any) => {
                      let tmp = [...items];
                      const unitPrice = val?.price ?? 0;
                      tmp[index] = {
                        ...item,
                        product_id: val.value,
                        product_name: val.label,
                        product_type: val.type,
                        unit_price: unitPrice,
                        subtotal: unitPrice * (item?.qty ?? 0),
                      };
                      setItems(tmp);
                    }}
                    className="w-full text-xs font-light !text-black placeholder:text-xs"
                  />
                </div>

                {/* Jumlah */}
                <div className="col-span-2">
                  <Input
                    placeholder="Jumlah"
                    value={item?.qty}
                    onChange={(e) => {
                      let tmp = [...items];
                      tmp[index] = {
                        ...item,
                        qty: +e.target.value,
                        subtotal: +e.target.value * (item?.unit_price ?? 0),
                      };
                      setItems(tmp);
                    }}
                    className="text-center"
                  />
                </div>

                {/* Subtotal */}
                <div className="col-span-4 text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    Rp {toMoney(item?.subtotal)}
                  </p>
                </div>

                {/* Hapus */}
                <div className="col-span-1 flex justify-end">
                  <Button
                    size="icon"
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:text-red-500"
                    onClick={() => {
                      let tmp = [...items];
                      tmp.splice(index, 1);
                      setItems(tmp);
                    }}
                  >
                    <Trash2Icon className="w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="text-gray-800 hover:text-gray-700"
                onClick={() => setItems([...items, defItem])}
              >
                <PlusCircleIcon className="w-4 mr-1" />
                Tambah Produk
              </Button>
            </div>
          </CardContent>
        </div>

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
                Rp {toMoney(items.reduce((a, b) => a + (b.subtotal || 0), 0))}
              </span>
            </div>

            {/* Diskon */}
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-600 flex-1">Potongan / Diskon</span>
              <Input
                type="number"
                placeholder="Nominal (Rp)"
                value={state.discount || ""}
                onChange={(e) => {
                  const val = +e.target.value;
                  setState({ ...state, discount: isNaN(val) ? 0 : val });
                }}
                className="w-40 text-right"
              />
            </div>

            {/* Pajak */}
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-600 flex-1">Pajak (%)</span>
              <Input
                type="number"
                placeholder="Misal 10"
                value={state.tax_percent || ""}
                onChange={(e) => {
                  const val = +e.target.value;
                  setState({ ...state, tax_percent: isNaN(val) ? 0 : val });
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
                placeholder="Nominal (Rp)"
                value={state.extra_fee || ""}
                onChange={(e) => {
                  const val = +e.target.value;
                  setState({ ...state, extra_fee: isNaN(val) ? 0 : val });
                }}
                className="w-40 text-right"
              />
            </div>

            <div className="border-t border-slate-200 my-3" />

            {/* Total Akhir */}
            {(() => {
              const subtotal = items.reduce((a, b) => a + (b.subtotal || 0), 0);
              const discount = state.discount || 0;
              const taxPercent = state.tax_percent || 0;
              const extraFee = state.extra_fee || 0;
              const afterDiscount = subtotal - discount;
              const tax = (afterDiscount * taxPercent) / 100;
              const total = afterDiscount + tax + extraFee;

              return (
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-semibold text-base">
                    Total Akhir
                  </span>
                  <span className="text-blue-600 font-bold text-lg">
                    Rp {toMoney(total)}
                  </span>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* === BUTTONS === */}
        <div className="flex justify-end gap-2 pt-2">
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
        </div>
      </Form>
    </div>
  );
}
