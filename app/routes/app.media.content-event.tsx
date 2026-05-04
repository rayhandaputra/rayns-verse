import { PencilLineIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
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
import { AppBreadcrumb } from "~/components/core/AppBreadcrumb";
import { ImageUploadPreview } from "~/components/shared/input/ImageUploadPreview";
import MediaGalleryUploader from "~/components/shared/input/MediaGalleryUploader";
import { ConfirmDialog } from "~/components/shared/modal/ConfirmDialog";
import { Modal } from "~/components/shared/modal/Modal";
import SelectBasic from "~/components/shared/select/SelectBasic";
import TableComponent from "~/components/shared/table/Table";
import { TitleHeader } from "~/components/core/TitleHeader";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useModal } from "~/hooks/use-modal";
import { API } from "~/nexus";

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
        query: {
          pagination: "true",
          page: 0,
          size: 10,
          type: "highlight-event",
        },
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
      cell: (row: any) => {
        const gallery: string[] = row?.image_gallery
          ? JSON.parse(row?.image_gallery)
          : [];

        if (!gallery.length) return "-";

        const first = gallery[0];
        const remaining = gallery.length - 1;

        return (
          <div className="flex items-center gap-2">
            {/* Thumbnail pertama */}
            <img
              src={first}
              alt="preview"
              className="w-16 h-16 object-cover rounded border"
            />

            {/* Info sisa gambar */}
            {remaining > 0 && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                +{remaining} gambar lainnya
              </span>
            )}
          </div>
        );
      },
    },

    {
      name: "Nama Instansi/Event",
      cell: (row: any) => row?.title || "-",
    },
    {
      name: "Jumlah Order",
      cell: (row: any) => row?.total_order,
    },
    {
      name: "Jenis",
      cell: (row: any) => row?.promotion_type || "-",
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
                data: {
                  ...row,
                  ...(row?.image_gallery && {
                    image_gallery: JSON.parse(row?.image_gallery),
                  }),
                },
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
        title="Riwayat Pesanan"
        description="Kelola Konten Riwayat Pesanan."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "CMS", href: "/" },
              { label: "Riwayat Pesanan", active: true },
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
                data: {
                  image_gallery: [],
                },
              })
            }
          >
            <PlusCircleIcon className="w-4" />
            Riwayat Pesanan
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />

      {(modal?.key === "create" || modal?.key === "update") && (
        <Modal
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={`${modal?.key === "create" ? "Tambah" : "Ubah"} Riwayat Pesanan`}
        >
          <Form method="post" className="space-y-3">
            <input type="hidden" name="id" value={modal?.data?.id} />
            <div className="space-y-1">
              <Label>Nama Instansi/Event</Label>
              <Input
                required
                type="text"
                name="title"
                placeholder="Masukkan Nama Instansi/Event"
                defaultValue={modal?.data?.title}
              />
            </div>
            <div className="space-y-1">
              <Label>Jumlah Order</Label>
              <Input
                required
                type="number"
                name="total_order"
                placeholder="Masukkan Jumlah Order"
                defaultValue={modal?.data?.total_order}
              />
            </div>
            <div className="space-y-1">
              <Label>Jenis</Label>
              <SelectBasic
                required
                options={[
                  { label: "Reguler", value: "regular" },
                  { label: "Sponsor", value: "sponsored" },
                ]}
                defaultValue={modal?.data?.promotion_type || "regular"}
                placeholder="Pilih Jeni"
                onChange={(value) => {
                  setModal({
                    ...modal,
                    data: { ...modal?.data, promotion_type: value },
                  });
                }}
              />
              <input
                type="hidden"
                name="promotion_type"
                value={modal?.data?.promotion_type || "regular"}
              />
            </div>
            <div className="space-y-1">
              <Label>Upload Gambar</Label>
              <MediaGalleryUploader
                value={modal?.data?.image_gallery ?? []} // initial value (optional)
                onChange={(urls) => {
                  setModal({
                    ...modal,
                    data: {
                      ...modal?.data,
                      image_gallery: urls,
                    },
                  });
                }} // receive updated array of URLs
                maxFiles={50} // optional
                size={128} // optional square size
              />
              <input
                type="hidden"
                name="image_gallery"
                value={JSON.stringify(modal?.data?.image_gallery)}
              />

              {/* <pre className="mt-4 bg-gray-100 p-3 rounded text-xs">
                {JSON.stringify(gallery, null, 2)}
              </pre> */}
            </div>
            {/* <div className="space-y-1">
              <ImageUploadPreview
                label="Upload Gambar"
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
            </div> */}

            {/* <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Input
                required
                type="text"
                name="description"
                placeholder="Masukkan Deskripsi"
                defaultValue={modal?.data?.description}
              />
            </div>
            */}

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
