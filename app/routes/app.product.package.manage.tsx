import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  PlusCircleIcon,
  Trash2Icon,
} from "lucide-react";
import {
  Form,
  useActionData,
  useLoaderData,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { useNavigate } from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { API, API_KEY, API_URL } from "~/lib/api";
import AsyncReactSelect from "react-select/async";
import { useEffect, useState } from "react";
import { getSession } from "~/lib/session.client";
import { toMoney } from "~/lib/utils";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const {
    page = 0,
    size = 10,
    id = "",
  } = Object.fromEntries(url.searchParams.entries());
  try {
    const detail = await API.PRODUCT.get({
      // session,
      session: {},
      req: {
        query: {
          pagination: "true",
          id,
          page: 0,
          size: 10,
        },
      } as any,
    });
    const items = await API.PRODUCT_PACKAGE_ITEM.get({
      // session,
      session: {},
      req: {
        query: {
          pagination: "true",
          package_id: id,
          page: 0,
          size: 10,
        },
      } as any,
    });
    console.log(items);

    return {
      detail: detail?.items?.[0] ?? null,
      items: items?.items ?? [],
      // search,
      // APP_CONFIG: CONFIG,
      table: {
        ...detail,
        page: 0,
        size: 10,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  let { id, state, items, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    state = state ? JSON.parse(state) : {};
    items = items ? JSON.parse(items) : {};

    await API.PRODUCT_PACKAGE_ITEM.create({
      session: {},
      req: {
        body: {
          ...state,
          products: items,
        },
      },
    });

    return Response.json({
      flash: {
        success: true,
        message: "Paket produk berhasil dibuat",
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

export default function AccountPage() {
  const { detail, items: currentItems } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();

  // const defItem = {
  //   product_id: "",
  //   product_name: "",
  //   qty: 0,
  // };
  // const [items, setItems] = useState<any[]>([defItem]);
  const defState = {
    code: detail?.code ?? "",
    name: detail?.name ?? "",
    type: "package",
    description: detail?.description ?? "",
  };
  const [state, setState] = useState<any>(defState);

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
          columns: ["id", "name"],
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
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const defItem = {
    commodity_id: 0,
    commodity_name: "",
    qty: 1,
    unit_price: 0,
    subtotal: 0,
  };

  // ✅ Normalisasi data awal (fix untuk edit mode)
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

  // ✅ Total otomatis
  const subtotal = items.reduce((a, b) => a + (b.subtotal || 0), 0);
  const discount = state.discount_value || 0;
  const taxPercent = state.tax_fee || 0;
  const extraFee = state.other_fee || 0;
  const afterDiscount = subtotal - discount;
  const tax = (afterDiscount * taxPercent) / 100;
  const total = afterDiscount + tax + extraFee;

  // ✅ Sinkronisasi hidden field ke form (biar submit aman)
  useEffect(() => {
    document
      .querySelector('input[name="subtotal"]')
      ?.setAttribute("value", subtotal.toString());
    document
      .querySelector('input[name="total"]')
      ?.setAttribute("value", total.toString());
  }, [subtotal, total]);

  useEffect(() => {
    if (actionData?.flash) {
      navigate("/app/product/package", {
        state: { flash: actionData?.flash },
        replace: true,
      });
    }
  }, [actionData]);

  return (
    <div className="space-y-3">
      <TitleHeader
        title={`${!detail ? "Tambah" : "Edit"} Paket Produk`}
        description=""
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
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() => navigate(`/app/product/package`)}
          >
            <ChevronLeftIcon className="w-4" />
            Kembali
          </Button>
        }
      />

      <Card className="bg-white px-4 py-6">
        <div className="space-y-4 mb-4">
          <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
            Informasi Produk
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label aria-required>Kode Paket</Label>
              <Input
                required
                placeholder="Masukkan Kode Paket"
                value={state.code}
                onChange={(e) =>
                  setState({ ...state, code: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="space-y-1">
              <Label aria-required>Nama Paket</Label>
              <Input
                required
                placeholder="Masukkan Nama Paket"
                value={state.name}
                onChange={(e) => setState({ ...state, name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Deskripsi</Label>
            <Input
              placeholder="Tulis deskripsi singkat Paket"
              value={state.description}
              onChange={(e) =>
                setState({ ...state, description: e.target.value })
              }
            />
          </div>
        </div>

        {/* === KOMPONEN PRODUK === */}
        <div className="space-y-4">
          <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
            Produk yang ingin dibuat Paket
          </h3>
          <CardContent className="bg-slate-50 space-y-3 py-4 rounded-lg border border-slate-200">
            {items.map((item: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-slate-200"
              >
                {/* Komponen */}
                <div className="col-span-5">
                  <AsyncReactSelect
                    value={
                      item?.product_id
                        ? {
                            value: item?.product_id,
                            label: item?.product_name,
                          }
                        : null
                    }
                    maxMenuHeight={175}
                    loadOptions={loadOptionInstitution}
                    cacheOptions
                    defaultOptions
                    placeholder="Cari dan Pilih Komponen"
                    onChange={(val: any) => {
                      let tmp = [...items];
                      tmp[index] = {
                        ...item,
                        product_id: val.value,
                        product_name: val.name,
                        unit_price: val.base_price || 0,
                        subtotal: (val.base_price || 0) * (item?.qty || 0),
                      };
                      setItems(tmp);
                    }}
                    className="w-full text-xs font-light capitalize !text-black placeholder:text-xs"
                  />
                </div>

                {/* Harga Satuan */}
                {/* <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Harga"
                    value={item?.unit_price}
                    onChange={(e) => {
                      let tmp = [...items];
                      tmp[index] = {
                        ...item,
                        unit_price: +e.target.value,
                        subtotal: (item?.qty || 0) * +e.target.value,
                      };
                      setItems(tmp);
                    }}
                    className="text-center"
                  />
                </div> */}

                {/* Jumlah */}
                <div className="col-span-4">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item?.qty}
                    onChange={(e) => {
                      let tmp = [...items];
                      tmp[index] = {
                        ...item,
                        qty: +e.target.value,
                        subtotal: +e.target.value * (item?.unit_price || 0),
                      };
                      setItems(tmp);
                    }}
                    className="text-center"
                  />
                </div>

                {/* Subtotal */}
                <div className="col-span-2 text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    Rp {toMoney(item?.subtotal || 0)}
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

        {/* === RINCIAN HARGA === */}
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-700 text-base font-semibold">
              Rincian Harga Paket Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-800">
                Rp {toMoney(subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-600 flex-1">Potongan / Diskon</span>
              <Input
                type="number"
                placeholder="Nominal (Rp)"
                value={state.discount_value || ""}
                onChange={(e) => {
                  const val = +e.target.value;
                  setState({ ...state, discount_value: isNaN(val) ? 0 : val });
                }}
                className="w-40 text-right"
              />
            </div>

            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-600 flex-1">Pajak (%)</span>
              <Input
                type="number"
                placeholder="Misal 10"
                value={state.tax_fee || ""}
                onChange={(e) => {
                  const val = +e.target.value;
                  setState({ ...state, tax_fee: isNaN(val) ? 0 : val });
                }}
                className="w-40 text-right"
              />
            </div>

            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-600 flex-1">Biaya Lain</span>
              <Input
                type="number"
                placeholder="Opsional"
                value={state.other_fee || ""}
                onChange={(e) => {
                  const val = +e.target.value;
                  setState({ ...state, other_fee: isNaN(val) ? 0 : val });
                }}
                className="w-40 text-right"
              />
            </div>

            <div className="border-t border-slate-200 my-3" />

            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-semibold text-base">
                Total Harga Paket Produk
              </span>
              <span className="text-blue-600 font-bold text-lg">
                Rp {toMoney(total)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Form method="post" className="flex justify-end">
          <input type="hidden" name="state" value={JSON.stringify(state)} />
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <Button
            type="submit"
            className="bg-green-700 hover:bg-green-600 text-white"
            onClick={() => navigate(`/app/product`)}
          >
            <CheckCircle2Icon className="w-4" />
            Simpan
          </Button>
        </Form>
      </Card>
    </div>
  );
}
