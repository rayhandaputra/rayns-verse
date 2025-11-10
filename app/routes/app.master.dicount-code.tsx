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
import TableComponent from "~/components/table/Table";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import SelectBasic from "~/components/select/SelectBasic";
import { useModal } from "~/hooks/use-modal";
import { API } from "~/lib/api";
import SlideInModal from "~/components/modal/SlideInModal";

// ===================== LOADER =====================
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const {
    page = 0,
    size = 10,
    search,
  } = Object.fromEntries(url.searchParams.entries());

  try {
    const result = await API.DISCOUNT.get({
      session: {},
      req: {
        pagination: "true",
        page,
        size,
        search,
      } as any,
    });

    return {
      table: {
        ...result,
        page,
        size,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

// ===================== ACTION =====================
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries()) as Record<string, any>;

  const { id, ...payload } = data;

  try {
    let res: any = {};

    if (request.method === "DELETE") {
      // SOFT DELETE
      res = await API.DISCOUNT.update({
        session: {},
        req: {
          body: {
            id,
            deleted_on: moment().format("YYYY-MM-DD HH:mm:ss"),
          },
        },
      });
    }

    if (request.method === "POST") {
      if (id) {
        // UPDATE
        res = await API.DISCOUNT.update({
          session: {},
          req: {
            body: {
              id,
              ...payload,
            },
          },
        });
      } else {
        // CREATE
        res = await API.DISCOUNT.create({
          session: {},
          req: {
            body: payload,
          },
        });
      }
    }

    if (!res.success) throw { error_message: res.message };

    return Response.json({
      success: true,
      message: res.message,
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

// ===================== PAGE COMPONENT =====================
export default function DiscountPage() {
  const { table } = useLoaderData();
  const actionData = useActionData();
  const [modal, setModal] = useModal();

  const fetcher = useFetcher();

  // ===================== DELETE HANDLER =====================
  const handleDelete = async (row: any) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus kode diskon "${row.code}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton:
          "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg",
        cancelButton:
          "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2",
        popup: "rounded-2xl shadow-lg",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      fetcher.submit(
        {
          id: row.id,
        },
        {
          method: "DELETE",
        }
      );
      toast.success("Berhasil menghapus kode diskon");
    }
  };

  // ===================== FEEDBACK =====================
  useEffect(() => {
    if (actionData) {
      setModal({ ...modal, open: false, data: {} });

      if (actionData.success) {
        toast.success("Berhasil", {
          description: actionData.message,
        });
      } else {
        toast.error("Kesalahan", {
          description: actionData.error_message,
        });
      }
    }
  }, [actionData]);

  // ===================== TABLE COLUMNS =====================
  const columns = [
    {
      name: "No",
      width: "60px",
      cell: (_: any, index: number) => index + 1,
    },
    {
      name: "Kode",
      cell: (row: any) => row.code,
    },
    {
      name: "Nama",
      cell: (row: any) => row.name,
    },
    {
      name: "Tipe",
      cell: (row: any) => row.discount_type,
    },
    {
      name: "Nilai",
      cell: (row: any) => row.discount_value,
    },
    {
      name: "Max Diskon",
      cell: (row: any) => row.max_discount_amount,
    },
    {
      name: "Valid",
      cell: (row: any) =>
        `${moment(row.valid_from).format("DD/MM/YYYY")} - ${moment(
          row.valid_until
        ).format("DD/MM/YYYY")}`,
    },
    {
      name: "Aksi",
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setModal({
                open: true,
                key: "update",
                data: row,
              })
            }
          >
            <PencilLineIcon className="w-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="text-red-600"
            onClick={() => handleDelete(row)}
          >
            <Trash2Icon className="w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ===================== VIEW =====================
  return (
    <div className="space-y-3">
      <TitleHeader
        title="Kode Diskon"
        description="Kelola daftar kode diskon."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Master Data", href: "/" },
              { label: "Diskon", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="bg-blue-700 text-white"
            onClick={() => setModal({ open: true, key: "create", data: {} })}
          >
            <PlusCircleIcon className="w-4 mr-1" />
            Tambah Diskon
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />

      {(modal.key === "create" || modal.key === "update") && (
        <SlideInModal
          isOpen={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={modal.key === "create" ? "Tambah Diskon" : "Ubah Diskon"}
          width="w-1/2 max-w-2xl"
        >
          <Form method="post" className="space-y-3 p-1">
            <input type="hidden" name="id" value={modal?.data?.id ?? ""} />

            {/* KODE */}
            <div className="space-y-1">
              <Label>Kode</Label>
              <Input
                name="code"
                placeholder="AUTO jika dikosongi"
                value={modal?.data?.code ?? ""}
                maxLength={6}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, code: e.target.value },
                  })
                }
              />
            </div>

            {/* NAMA */}
            <div className="space-y-1">
              <Label aria-required>Nama Diskon</Label>
              <Input
                required
                name="name"
                placeholder="Nama diskon"
                value={modal?.data?.name ?? ""}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, name: e.target.value },
                  })
                }
              />
            </div>

            {/* TIPE DISKON */}
            <div className="space-y-1">
              <Label aria-required>Tipe Diskon</Label>
              <SelectBasic
                name="discount_type"
                value={modal?.data?.discount_type ?? "amount"}
                onChange={(val: any) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, discount_type: val },
                  })
                }
                options={[
                  { value: "amount", label: "Amount (Rp)" },
                  { value: "percentage", label: "Persentase (%)" },
                ]}
              />
            </div>

            {/* NILAI DISKON */}
            <div className="space-y-1">
              <Label aria-required>Nilai Diskon</Label>
              <Input
                type="number"
                name="discount_value"
                placeholder="0"
                value={modal?.data?.discount_value ?? ""}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, discount_value: e.target.value },
                  })
                }
              />
            </div>

            {/* MAX DISKON */}
            <div className="space-y-1">
              <Label aria-required>Maksimal Diskon</Label>
              <Input
                type="number"
                name="max_discount_amount"
                placeholder="0"
                value={modal?.data?.max_discount_amount ?? ""}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: {
                      ...modal.data,
                      max_discount_amount: e.target.value,
                    },
                  })
                }
              />
            </div>

            {/* MIN ORDER */}
            <div className="space-y-1">
              <Label>Minimal Order</Label>
              <Input
                type="number"
                name="min_order_amount"
                placeholder="0"
                value={modal?.data?.min_order_amount ?? ""}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, min_order_amount: e.target.value },
                  })
                }
              />
            </div>

            {/* VALID FROM */}
            <div className="space-y-1">
              <Label aria-required>Berlaku Dari</Label>
              <Input
                type="datetime-local"
                name="valid_from"
                value={
                  modal?.data?.valid_from ??
                  moment().format("YYYY-MM-DD 00:00:00")
                }
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, valid_from: e.target.value },
                  })
                }
              />
            </div>

            {/* VALID UNTIL */}
            <div className="space-y-1">
              <Label aria-required>Berlaku Sampai</Label>
              <Input
                type="datetime-local"
                name="valid_until"
                value={modal?.data?.valid_until ?? ""}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, valid_until: e.target.value },
                  })
                }
              />
            </div>

            {/* BATAS USER */}
            <div className="space-y-1">
              <Label aria-required>Batas Pengguna</Label>
              <Input
                type="number"
                name="user_limit"
                placeholder="0"
                value={modal?.data?.user_limit ?? ""}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, user_limit: e.target.value },
                  })
                }
              />
            </div>

            {/* STATUS */}
            <div className="space-y-1">
              <Label aria-required>Status</Label>
              <SelectBasic
                name="active"
                value={modal?.data?.active ?? 1}
                onChange={(val: any) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, active: val },
                  })
                }
                options={[
                  { value: "1", label: "Aktif" },
                  { value: "0", label: "Tidak Aktif" },
                ]}
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal({ open: false })}
              >
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 text-white">
                Simpan
              </Button>
            </div>
          </Form>
        </SlideInModal>
      )}
    </div>
  );
}
