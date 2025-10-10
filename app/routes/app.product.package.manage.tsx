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
} from "react-router";
import { useNavigate } from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { API, API_KEY, API_URL } from "~/lib/api";
import AsyncReactSelect from "react-select/async";
import { useEffect, useState } from "react";
import { getSession } from "~/lib/session";

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
  //   const { table } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();

  const defItem = {
    product_id: "",
    product_name: "",
    qty: 0,
  };
  const [items, setItems] = useState<any[]>([defItem]);
  const defState = {
    code: "",
    name: "",
    type: "package",
    description: "",
  };
  const [state, setState] = useState<any>([defState]);

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
        title="Tambah Paket Produk"
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
        <div className="space-y-1">
          <Label>Kode</Label>
          <Input
            placeholder="Masukkan Kode"
            value={state?.code}
            onChange={(e: any) => setState({ ...state, code: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Nama</Label>
          <Input
            placeholder="Masukkan Nama"
            value={state?.name}
            onChange={(e: any) => setState({ ...state, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Deskripsi</Label>
          <Input
            placeholder="Masukkan Deskripsi"
            value={state?.description}
            onChange={(e: any) =>
              setState({ ...state, description: e.target.value })
            }
          />
        </div>

        <Label>Produk yang ingin dibuat Paket</Label>
        <CardContent className="bg-slate-50 space-y-3 py-3">
          {items.map((item: any, index: number) => (
            <div className="flex gap-2">
              <AsyncReactSelect
                name=""
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
                    product_name: val.label,
                  };
                  setItems(tmp);
                }}
                className="w-full text-xs font-light capitalize !text-black placeholder:text-xs"
              />
              <Input
                placeholder="Jumlah"
                value={item?.qty}
                onChange={(e) => {
                  let tmp = [...items];
                  tmp[index] = {
                    ...item,
                    qty: e.target.value,
                  };
                  setItems(tmp);
                }}
              />
              <Button
                size="icon"
                className="text-red-700 hover:text-red-600"
                onClick={() => {
                  let tmp = [...items];
                  tmp.splice(index, 1);
                  setItems(tmp);
                }}
              >
                <Trash2Icon className="w-4" />
              </Button>
            </div>
          ))}
          <div className="inline-flex">
            <Button
              size="sm"
              variant="outline"
              className="text-gray-800 hover:text-gray-700"
              onClick={() => setItems([...items, defItem])}
            >
              <PlusCircleIcon className="w-4" />
              Item/Komponen
            </Button>
          </div>
        </CardContent>

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
