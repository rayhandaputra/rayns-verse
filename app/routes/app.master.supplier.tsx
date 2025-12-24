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
import TableComponent from "~/components/table/Table";
import { TitleHeader } from "~/components/TitleHedaer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useFetcherData } from "~/hooks";
import { useModal } from "~/hooks/use-modal";
import { API } from "~/lib/api";
import { nexus } from "~/lib/nexus-client";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const { page = 0, size = 10 } = Object.fromEntries(
    url.searchParams.entries()
  );
  try {
    const supplier = await API.SUPPLIER.get({
      // session,
      session: {},
      req: {
        pagination: "true",
        page: 0,
        size: 10,
      } as any,
    });

    return {
      // search,
      // APP_CONFIG: CONFIG,
      table: {
        ...supplier,
        page: 0,
        size: 10,
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
      res = await API.SUPPLIER.update({
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
        res = await API.SUPPLIER.update({
          session: {},
          req: {
            body: {
              id,
              ...payload,
            } as any,
          },
        });
      } else {
        res = await API.SUPPLIER.create({
          session: {},
          req: {
            body: payload as any,
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

export default function SupplierPage() {
  const {} = useLoaderData();
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
        { method: "delete", action: "/app/master/supplier" }
      );
      toast.success("Berhasil menghapus Toko");
      reloadSupplier();
    }
  };

  // table: {
  //       ...supplier,
  //       page: 0,
  //       size: 10,
  //     },
  const { data: supplier, reload: reloadSupplier } = useFetcherData({
    endpoint: nexus()
      .module("SUPPLIER")
      .action("get")
      .params({
        pagination: "true",
        page: 0,
        size: 10,
      })
      .build(),
  });
  const table = {
    ...supplier?.data,
    page: 0,
    size: 10,
  };

  const {
    data: fetcherDataAction,
    load: submitAction,
    loading: isSubmitting,
  } = useFetcherData({
    endpoint: "/app/master/supplier",
    method: "POST",
    autoLoad: false,
  });

  // 3. Handle pengiriman form secara manual
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    // Kirim data menggunakan submitAction
    submitAction(payload);
  };

  // 4. Effect untuk handle response dari submitAction
  useEffect(() => {
    if (fetcherDataAction) {
      if (fetcherDataAction.success) {
        setModal({ ...modal, open: false });
        toast.success("Berhasil", {
          description: fetcherDataAction.message || "Data berhasil disimpan",
        });
        reloadSupplier(); // Refresh data tabel
      } else {
        toast.error("Terjadi Kesalahan", {
          description:
            fetcherDataAction.error_message || "Terjadi kesalahan teknis",
        });
      }
    }
  }, [fetcherDataAction]);

  // Reload tabel jika DELETE berhasil (via actionData Remix)
  useEffect(() => {
    if (actionData?.success) reloadSupplier();
  }, [actionData]);

  const columns = [
    {
      name: "No",
      width: "50px",
      cell: (_: any, index: number) => index + 1,
    },
    {
      name: "Nama",
      cell: (row: any) => row?.name || "-",
    },
    {
      name: "Telepon",
      cell: (row: any) => row?.phone || "-",
    },
    {
      name: "Alamat",
      cell: (row: any) => row?.address || "-",
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
        title="Daftar Mitra Toko"
        description="Kelola data mitra toko Anda."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Master Data", href: "/" },
              { label: "Toko", active: true },
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
            Toko Baru
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />

      {(modal?.key === "create" || modal?.key === "update") && (
        <Modal
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Toko`}
        >
          {/* 5. Ubah Form menjadi standard form dengan onSubmit */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="hidden" name="id" value={modal?.data?.id || ""} />
            <div className="space-y-1">
              <Label>Nama Toko</Label>
              <Input
                required
                type="text"
                name="name"
                placeholder="Masukkan Nama Toko"
                defaultValue={modal?.data?.name}
              />
            </div>
            <div className="space-y-1">
              <Label>No Telepon</Label>
              <Input
                required
                type="text"
                name="phone"
                placeholder="Masukkan No Telepon"
                defaultValue={modal?.data?.phone}
              />
            </div>
            <div className="space-y-1">
              <Label>Alamat</Label>
              <Input
                required
                type="text"
                name="address"
                placeholder="Masukkan Alamat"
                defaultValue={modal?.data?.address}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                className="text-gray-600"
                onClick={() => setModal({ ...modal, open: false })}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                size="sm"
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
