// import { useLoaderData, type LoaderFunction } from "react-router";
// import { CONFIG } from "~/config";
// import { API } from "~/lib/api";
// import { unsealSession } from "~/lib/session";
// import { getSession } from "~/lib/session.server";
// import DataTable from "react-data-table-component";

import { PencilLineIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
import moment from "moment";
import { useEffect } from "react";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { Modal } from "~/components/modal/Modal";
import SelectBasic from "~/components/select/SelectBasic";
// import { SelectBasic } from "~/components/select/SelectBasic";
// import SelectBasic from "~/components/select/SelectBasic";
import TableComponent from "~/components/table/Table";
import { TitleHeader } from "~/components/TitleHedaer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useModal } from "~/hooks/use-modal";
import { API } from "~/lib/api";
import { toMoney } from "~/lib/utils";

export const loader: LoaderFunction = async ({ request, params }) => {
  // const session = await unsealSession(request);
  // const session = await getSession(request);
  const url = new URL(request.url);
  const { page = 0, size = 10 } = Object.fromEntries(
    url.searchParams.entries()
  );

  try {
    const user = await API.COMMODITY.get({
      // session,
      session: {},
      req: {
        query: {
          pagination: "true",
          page: +page || 0,
          size: +size || 10,
        },
      } as any,
    });

    return {
      // search,
      // APP_CONFIG: CONFIG,
      table: {
        ...user,
        page,
        size,
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
    if (request.method === "DELETE") {
      res = await API.COMMODITY.update({
        session: {},
        req: {
          body: {
            id,
            ...payload,
          } as any,
        },
      });
    }
    if (request.method === "POST") {
      if (id) {
        res = await API.COMMODITY.update({
          session: {},
          req: {
            body: {
              id,
              ...payload,
            } as any,
          },
        });
      } else {
        res = await API.COMMODITY.create({
          session: {},
          req: {
            body: {
              ...(payload as any),
            },
          },
        });
      }
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

export default function CommodityPage() {
  const { table } = useLoaderData();
  const actionData = useActionData();
  const [modal, setModal] = useModal();

  const fetcher = useFetcher();

  const handleDelete = async (data: any) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus data ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton:
          "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg focus:outline-none",
        cancelButton:
          "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 mr-2",
        popup: "rounded-2xl shadow-lg",
        title: "text-lg font-semibold text-gray-800",
        htmlContainer: "text-gray-600",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      fetcher.submit(
        { id: data?.id, deleted_on: moment().format("YYYY-MM-DD HH:mm:ss") },
        {
          method: "delete",
          action: "/app/master/commodity",
        }
      );

      toast.success("Berhasil", {
        description: "Berhasil menghapus Komponen",
      });
    }
  };

  useEffect(() => {
    if (actionData) {
      setModal({ ...modal, open: false });

      if (actionData.success) {
        toast.success("Berhasil", {
          description: actionData.message,
        });
      } else {
        toast.error("Terjadi Kesalahan", {
          description:
            actionData.error_message || "Terjadi kesalahan. Hubungi Tim Teknis",
        });
      }
    }
  }, [actionData]);

  const columns = [
    {
      name: "No",
      width: "50px",
      cell: (_: any, index: number) =>
        table?.current_page * table?.size + (index + 1),
    },
    {
      name: "Kode",
      cell: (row: any) => row?.code || "-",
    },
    {
      name: "Komponen",
      cell: (row: any) => row?.name || "-",
    },
    {
      name: "Satuan",
      cell: (row: any) => row?.unit || "-",
    },
    {
      name: "Harga Dasar",
      cell: (row: any) => toMoney(row?.base_price ?? 0),
    },
    {
      name: "Aksi",
      cell: (row: any, index: number) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="text-blue-700 hover:text-blue-500"
            onClick={() =>
              setModal({
                ...modal,
                open: true,
                key: "update",
                data: row,
              })
            }
          >
            <PencilLineIcon className="w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-red-700 hover:text-red-500"
            onClick={() => handleDelete(row)}
          >
            <Trash2Icon className="w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <TitleHeader
        title="Komponen Produksi"
        description="Kelola data komponen produksi."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Master Data", href: "/" },
              { label: "Komponen", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() =>
              setModal({
                ...modal,
                open: true,
                key: "create",
                data: null,
              })
            }
          >
            <PlusCircleIcon className="w-4" />
            Komponen
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />

      {(modal?.key === "create" || modal?.key === "update") && (
        <Modal
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Komponen`}
        >
          <Form method="post" className="space-y-3">
            <input type="hidden" name="id" value={modal?.data?.id} />
            <div className="space-y-1">
              <Label>Kode</Label>
              <Input
                required
                type="text"
                name="code"
                placeholder="Masukkan Kode"
                defaultValue={modal?.data?.code}
              />
            </div>
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input
                required
                type="text"
                name="name"
                placeholder="Masukkan Nama"
                defaultValue={modal?.data?.name}
              />
            </div>
            <div className="space-y-1">
              <Label>Satuan</Label>
              <Input
                required
                type="text"
                name="unit"
                placeholder="Masukkan Satuan"
                defaultValue={modal?.data?.unit}
              />
            </div>
            <div className="space-y-1">
              <Label>Harga Dasar</Label>
              <Input
                required
                type="number"
                name="base_price"
                placeholder="Masukkan Harga Dasar"
                defaultValue={modal?.data?.base_price}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                className="text-gray-600"
                onClick={() => setModal({ ...modal, open: false })}
              >
                Batal
              </Button>
              <Button
                size="sm"
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Simpan
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}
