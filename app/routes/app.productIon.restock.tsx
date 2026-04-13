import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import {
  Trash2,
  PlusCircle,
  Package,
  Store,
  PlusCircleIcon,
  ChevronLeft,
} from "lucide-react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { API, API_KEY, API_URL } from "~/lib/api";
import SelectBasic from "~/components/select/SelectBasic";
import AsyncReactSelect from "react-select/async";
import { CONFIG } from "~/config";
import { toast } from "sonner";
import { toMoney } from "~/lib/utils";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { TitleHeader } from "~/components/TitleHedaer";

export const loader: LoaderFunction = async ({ request, params }) => {
  // const session = await unsealSession(request);
  // const session = await getSession(request);
  const url = new URL(request.url);
  const { search, supplier_id } = Object.fromEntries(
    url.searchParams.entries()
  );

  try {
    const filters = {
      supplier_id,
    };
    const suppliers = await API.SUPPLIER.get({
      session: {},
      req: {},
    });
    const supplier = supplier_id
      ? suppliers?.items?.find((v: any) => +v?.id === +supplier_id)
      : suppliers?.items?.[0];
    const supplierCommodity = await API.SUPPLIER_COMMODITY.get({
      session: {},
      req: {
        query: {
          supplier_id: supplier_id,
        },
      },
    });

    return {
      // search,
      supplier,
      APP_CONFIG: CONFIG,
      suppliers: suppliers?.items,
      supplierCommodity: supplierCommodity?.items,
      table: {
        // data: commodity,
        // page: 0,
        // size: 10,
        filter: filters,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries()) as Record<string, any>;

  const { id, ...payload } = data;

  try {
    let res: any = {};
    if (request.method === "POST") {
      res = await API.SUPPLIER_COMMODITY.bulkCreate({
        session: {},
        req: {
          body: {
            commodities: payload?.commodities
              ? JSON.parse(payload?.commodities)
              : [],
          } as any,
        },
      });
    }

    if (!res.success) throw { error_message: res.message };

    return Response.json({
      success: true,
      message: res.message,
      user: res.user,
    });
  } catch (error: any) {
    console.log(error);
    return Response.json({
      success: false,
      error_message:
        error.error_message || error.message || "Terjadi kesalahan",
    });
  }
};

export default function RestockForm() {
  const { table, supplier, suppliers, supplierCommodity, APP_CONFIG } =
    useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();

  const defCommodity = {
    supplier_id: table?.filter?.supplier_id,
    commodity_id: "",
    commodity_name: "",
    qty: 0,
    price: 0,
  };
  const [commodity, setCommodity] = useState<any[]>([]);

  useEffect(() => {
    setCommodity(
      !supplierCommodity.length ? [defCommodity] : supplierCommodity
    );
  }, [supplierCommodity]);

  const defState = {
    supplier_id: table?.filter?.supplier_id,
    shipping: 0,
    admin: 0,
    discount: 0,
  };
  const [state, setState] = useState<any>(defState);

  const listSupplier = useMemo(() => {
    return (
      suppliers?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: v?.name,
      })) ?? []
    );
  }, [suppliers]);

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

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        toast.success("Berhasil", {
          description: actionData.message,
        });

        setState(defState);
      } else {
        toast.error("Terjadi Kesalahan", {
          description:
            actionData.error_message || "Terjadi kesalahan. Hubungi Tim Teknis",
        });
      }
    }
  }, [actionData]);

  const subTotal = commodity?.reduce(
    (acc: number, item: any) => acc + +item?.price,
    0
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <TitleHeader
        title="Restock per Toko"
        description="Tambah atau perbarui stok per toko dengan mudah."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Produksi", href: "/app/production" },
              { label: "Manajemen Stok", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="border border-blue-700 text-blue-700 hover:text-blue-600"
            onClick={() => navigate(`/app/production/stock`)}
          >
            <ChevronLeft className="w-4" />
            Kembali
          </Button>
        }
      />

      {/* <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" /> Restock Stok
        </h1>
        <p className="text-sm text-muted-foreground">
          Tambah atau perbarui stok per toko dengan mudah.
        </p>
      </div> */}

      {/* Card Utama */}
      <Card className="bg-white">
        <CardHeader>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Store className="w-4 h-4" /> Pilih Toko
            </Label>
            <SelectBasic
              options={listSupplier}
              value={supplier.id}
              placeholder="Semua Toko"
              onChange={(value) => {
                navigate(
                  `/app/production/restock?${new URLSearchParams({ ...table?.filter, supplier_id: value })}`
                );
              }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* List Item */}
          {commodity.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <AsyncReactSelect
                name=""
                value={
                  item?.commodity_id
                    ? {
                        value: item?.commodity_id,
                        label: item?.commodity_name,
                      }
                    : null
                }
                maxMenuHeight={175}
                loadOptions={loadOptionCommodity}
                cacheOptions
                defaultOptions
                placeholder="Cari Item Komponen"
                onChange={(val: any) => {
                  let tmp = [...commodity];
                  tmp[index] = {
                    ...tmp[index],
                    commodity_id: val.value,
                    commodity_name: val.label,
                  };
                  setCommodity(tmp);
                }}
                className="w-full text-xs font-light capitalize !text-black placeholder:text-xs"
              />
              <Input
                type="number"
                value={item?.qty}
                placeholder="Qty"
                className="w-20 text-center"
                onChange={(e) => {
                  let tmp = [...commodity];
                  tmp[index] = {
                    ...tmp[index],
                    qty: e.target.value,
                  };
                  setCommodity(tmp);
                }}
              />
              <Input
                type="number"
                value={+item?.price}
                placeholder="Harga"
                className="w-28 text-right"
                onChange={(e) => {
                  let tmp = [...commodity];
                  tmp[index] = {
                    ...tmp[index],
                    price: e.target.value,
                  };
                  setCommodity(tmp);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  let tmp = [...commodity];
                  tmp.splice(index, 1);
                  setCommodity(tmp);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {/* Tambah Item */}
          <Button
            onClick={() => {
              setCommodity([...commodity, defCommodity]);
            }}
            variant="outline"
            className="w-full gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Tambah Item
          </Button>

          {/* Ongkir / Admin / Diskon */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <Label>Ongkir (Rp)</Label>
              <Input
                value={state?.shipping}
                type="number"
                placeholder="0"
                onChange={(e) =>
                  setState({ ...state, shipping: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Admin (Rp)</Label>
              <Input
                value={state?.admin}
                type="number"
                placeholder="0"
                onChange={(e) => setState({ ...state, admin: e.target.value })}
              />
            </div>
            <div>
              <Label>Diskon (Rp)</Label>
              <Input
                value={state?.discount}
                type="number"
                placeholder="0"
                onChange={(e) =>
                  setState({ ...state, discount: e.target.value })
                }
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Ringkasan */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Total Item: 1</p>
            <p>Subtotal: Rp {toMoney(subTotal)}</p>
            <p>Ongkir: Rp {toMoney(state?.shipping)}</p>
            <p>Admin: Rp {toMoney(state?.admin)}</p>
            <p>Diskon: Rp {toMoney(state?.discount)}</p>
          </div>
          <p className="text-lg font-semibold">
            Total Akhir: Rp{" "}
            {toMoney(
              +subTotal + +(+state?.shipping + +state?.admin - +state?.discount)
            )}
          </p>
        </CardContent>

        <CardFooter>
          <Form method="post">
            <input
              type="hidden"
              name="commodities"
              value={JSON.stringify(commodity)}
            />
            <Button className="w-full text-white bg-green-600 hover:bg-green-700">
              Simpan Stok Toko
            </Button>
          </Form>
        </CardFooter>
      </Card>

      {/* Log Restock */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Log Restock</h2>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>
              17-09-2025 | <span className="font-medium">ID Card</span> +10 pcs
            </p>
            <p className="text-muted-foreground">Toko A — Rp 1.500.000</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
