// // app/routes/pesanan.new.tsx
// // import { ActionFunctionArgs, redirect } from "@remix-run/node";
// // import { Form, useActionData } from "@remix-run/react";
import { CheckCircle2Icon, ChevronLeft } from "lucide-react";
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
import { API } from "~/lib/api";
import { getSession } from "~/lib/session";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  let { id, state, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    state = state ? JSON.parse(state) : {};

    await API.orders.create({
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

  useEffect(() => {
    if (actionData?.flash) {
      navigate("/app/order", {
        state: { flash: actionData?.flash },
        replace: true,
      });
    }
  }, [actionData]);

  const defaultState = {
    institution_id: 1,
    institution_name: "",
    institution_abbr: "",
    institution_domain: "",
    order_type: "",
    payment_type: "",
    quantity: 0,
    deadline: moment().format("YYYY-MM-DD"),
  };
  const [state, setState] = useState<any>(defaultState);

  return (
    <div className="space-y-3">
      <TitleHeader
        title="Form Pemesanan"
        description="Kelola data Pesanan."
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
            onClick={() => navigate("/app/order")}
            variant="outline"
          >
            <ChevronLeft className="w-4" />
            Kembali
          </Button>
        }
      />

      <Form method="post" className="space-y-4 bg-white rounded-lg p-4">
        <input type="hidden" name="state" value={JSON.stringify(state)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Nama Instansi</Label>
            <Input
              required
              type="text"
              placeholder="Masukkan Nama Instansi"
              value={state?.institution_name}
              onChange={(e) =>
                setState({ ...state, institution_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Singkatan Instansi</Label>
            <Input
              required
              type="text"
              placeholder="Masukkan Singkatan Instansi"
              value={state?.institution_abbr}
              onChange={(e) => {
                const value = e.target.value
                  .toUpperCase() // otomatis jadi huruf besar
                  .replace(/\s+/g, "");
                setState({
                  ...state,
                  institution_abbr: value, // hapus semua spasi
                  institution_domain: `kinau.id/${value?.toLowerCase()}`,
                });
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Jenis Pesanan</Label>
            <SelectBasic
              required
              options={[
                { label: "Paket", value: "package" },
                { label: "ID Card", value: "id_card" },
                { label: "Lanyard", value: "lanyard" },
              ]}
              placeholder="Pilih Jenis Pesanan"
              value={state?.order_type}
              onChange={(value) => setState({ ...state, order_type: value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Jumlah</Label>
            <Input
              required
              type="number"
              placeholder="Masukkan Jumlah Pesanan"
              value={state?.quantity}
              onChange={(e) => setState({ ...state, quantity: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Deadline</Label>
            <Input
              required
              type="date"
              className="text-gray-700"
              value={state?.deadline}
              onChange={(e) => setState({ ...state, deadline: e.target.value })}
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
              placeholder="Pilih Jenis Pesanan"
              value={state?.payment_type}
              onChange={(value) => setState({ ...state, payment_type: value })}
            />
          </div>
        </div>
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

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="text-gray-700"
            onClick={() => {
              setState(defaultState);
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            <CheckCircle2Icon className="w-4" />
            Buat Pesanan
          </Button>
        </div>
      </Form>
    </div>
  );
}
