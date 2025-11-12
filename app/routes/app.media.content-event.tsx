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
import { ImageUploadPreview } from "~/components/input/ImageUploadPreview";
import { ConfirmDialog } from "~/components/modal/ConfirmDialog";
import { Modal } from "~/components/modal/Modal";
import SelectBasic from "~/components/select/SelectBasic";
import TableComponent from "~/components/table/Table";
import { TitleHeader } from "~/components/TitleHedaer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useModal } from "~/hooks/use-modal";
import { API } from "~/lib/api";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const { page = 0, size = 10 } = Object.fromEntries(
    url.searchParams.entries()
  );
  try {
    const supplier = await API.CMS_CONTENT.get({
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
      res = await API.CMS_CONTENT.update({
        session: {},
        req: {
          body: {
            id,
            ...payload,
          } as any,
        },
      });
    }

    console.log(payload);
    if (request.method === "POST") {
      if (id) {
        res = await API.CMS_CONTENT.update({
          session: {},
          req: {
            body: {
              id,
              ...payload,
            } as any,
          },
        });
      } else {
        res = await API.CMS_CONTENT.create({
          session: {},
          req: {
            body: {
              ...payload,
              type: "highlight-event",
            } as any,
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

export default function AccountPage() {
  const { table } = useLoaderData();
  const actionData = useActionData();
  const [modal, setModal] = useModal();

  const fetcher = useFetcher();

  const handleDelete = async (data: any) => {
    const result = await ConfirmDialog({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus data ini?",
      icon: "warning",
      confirmText: "Hapus",
    });

    if (result.isConfirmed) {
      fetcher.submit(
        { id: data?.id, deleted_on: moment().format("YYYY-MM-DD HH:mm:ss") },
        {
          method: "delete",
          action: "/app/media/content-event",
        }
      );
      toast.success("Produk berhasil dihapus");
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
      cell: (_: any, index: number) => index + 1,
    },
    {
      name: "Gambar",
      cell: (row: any) =>
        row?.image ? <img src={row?.image} alt="" className="w-24" /> : "-",
    },
    {
      name: "Nama",
      cell: (row: any) => row?.title || "-",
    },
    {
      name: "Deskripsi",
      cell: (row: any) => row?.description || "-",
    },
    {
      name: "Tautan",
      cell: (row: any) => row?.link || "-",
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
        title="Sorotan Event"
        description="Kelola Konten Sorotan Event."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "CMS", href: "/" },
              { label: "Sorotan Event", active: true },
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
            Sorotan Baru
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />

      {(modal?.key === "create" || modal?.key === "update") && (
        <Modal
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Sorotan`}
        >
          <Form method="post" className="space-y-3">
            <input type="hidden" name="id" value={modal?.data?.id} />
            <div className="space-y-1">
              <Label>Judul</Label>
              <Input
                required
                type="text"
                name="title"
                placeholder="Masukkan Judul"
                defaultValue={modal?.data?.title}
              />
            </div>
            <div className="space-y-1">
              <ImageUploadPreview
                label="Upload Foto Profil"
                value={modal?.data?.image || undefined}
                size={128}
                onChange={(file, previewUrl) => {
                  setModal({
                    ...modal,
                    data: {
                      ...modal?.data,
                      image: previewUrl,
                    },
                  });
                }}
              />
              <input type="hidden" name="image" value={modal?.data?.image} />
              {/* <Label>Gambar</Label>
              <Input
                required
                type="text"
                name="image"
                placeholder="Masukkan Gambar"
                defaultValue={modal?.data?.image}
              /> */}
            </div>
            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Input
                required
                type="text"
                name="description"
                placeholder="Masukkan Deskripsi"
                defaultValue={modal?.data?.description}
              />
            </div>
            <div className="space-y-1">
              <Label>Tautan</Label>
              <Input
                required
                type="text"
                name="link"
                placeholder="Masukkan Tautan"
                defaultValue={modal?.data?.link}
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
