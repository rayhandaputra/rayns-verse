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
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { ConfirmDialog } from "~/components/modal/ConfirmDialog";
import { Modal } from "~/components/modal/Modal";
import TableComponent from "~/components/table/Table";
import { TitleHeader } from "~/components/TitleHedaer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import SelectBasic from "~/components/select/SelectBasic";
import { useModal } from "~/hooks/use-modal";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import * as LucideIcons from "lucide-react";

// List of available icons from lucide-react
const availableIcons = [
  "Package",
  "Users",
  "CalendarDays",
  "Building2",
  "TrendingUp",
  "Award",
  "Target",
  "Zap",
  "Rocket",
  "Star",
  "Heart",
  "ThumbsUp",
  "Trophy",
  "Sparkles",
  "Gem",
  "Crown",
  "Shield",
  "CheckCircle",
  "Globe",
  "Briefcase",
];

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  const url = new URL(request.url);
  const { page = 0, size = 10 } = Object.fromEntries(
    url.searchParams.entries()
  );

  try {
    const stats = await API.CMS_CONTENT.get({
      session: { user, token },
      req: {
        query: {
          pagination: "true",
          page: 0,
          type: "stats",
          size: 50,
        },
      } as any,
    });

    return {
      table: {
        ...stats,
        page: 0,
        size: 50,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      table: {
        items: [],
        total_items: 0,
        current_page: 0,
        total_pages: 0,
      },
    };
  }
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries()) as Record<string, any>;

  const { id, ...payload } = data;

  try {
    let res: any = {};
    if (request.method === "DELETE") {
      res = await API.CMS_CONTENT.update({
        session: { user, token },
        req: {
          body: {
            id,
            deleted: 1,
            modified_on: new Date().toISOString(),
          } as any,
        },
      });
    }

    if (request.method === "POST") {
      if (id) {
        res = await API.CMS_CONTENT.update({
          session: { user, token },
          req: {
            body: {
              id,
              ...payload,
              type: "stats",
            } as any,
          },
        });
      } else {
        res = await API.CMS_CONTENT.create({
          session: { user, token },
          req: {
            body: {
              ...payload,
              type: "stats",
            } as any,
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

export default function StatsManagePage() {
  const { table } = useLoaderData();
  const actionData = useActionData();
  const [modal, setModal] = useModal();
  const [formData, setFormData] = useState({
    suffix: "+",
    icon_type: "Package",
    is_active: "1",
  });

  const fetcher = useFetcher();

  const handleDelete = async (data: any) => {
    const result = await ConfirmDialog({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus data stats ini?",
      icon: "warning",
      confirmText: "Hapus",
    });

    if (result.isConfirmed) {
      fetcher.submit(
        { id: data?.id, deleted: 1 },
        {
          method: "delete",
        }
      );
      toast.success("Stats berhasil dihapus");
    }
  };

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        toast.success(actionData.message || "Berhasil");
        setModal({ ...modal, open: false });
        setFormData({ suffix: "+", icon_type: "Package", is_active: "1" });
      } else {
        toast.error(actionData.error_message || "Terjadi kesalahan");
      }
    }
  }, [actionData]);

  useEffect(() => {
    if (modal?.data) {
      setFormData({
        suffix: modal.data.suffix || "+",
        icon_type: modal.data.icon_type || "Package",
        is_active: String(modal.data.is_active ?? 1),
      });
    } else {
      setFormData({ suffix: "+", icon_type: "Package", is_active: "1" });
    }
  }, [modal?.data]);

  const columns = [
    {
      name: "No",
      width: "50px",
      cell: (_: any, index: number) =>
        table?.current_page * table?.size + (index + 1),
    },
    {
      name: "Icon",
      width: "80px",
      cell: (row: any) => {
        const IconComponent =
          (LucideIcons as any)[row?.icon_type] || LucideIcons.Package;
        return (
          <div className="flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-blue-500" />
          </div>
        );
      },
    },
    {
      name: "Label",
      width: "200px",
      cell: (row: any) => row?.title || "-",
    },
    {
      name: "Nilai",
      width: "120px",
      cell: (row: any) => (
        <div className="flex items-center gap-1">
          <span className="font-semibold">{row?.value || 0}</span>
          <span className="text-gray-500">{row?.suffix || ""}</span>
        </div>
      ),
    },
    {
      name: "Urutan",
      width: "80px",
      cell: (row: any) => row?.seq || 0,
    },
    {
      name: "Status",
      width: "100px",
      cell: (row: any) => (
        <Badge
          className={
            row?.is_active === 1
              ? "bg-green-600 text-white"
              : "bg-gray-400 text-white"
          }
        >
          {row?.is_active === 1 ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      name: "Aksi",
      width: "150px",
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => {
              setModal({
                ...modal,
                open: true,
                key: "form",
                data: row,
              });
            }}
          >
            <PencilLineIcon className="w-4" />
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-500 text-white"
            onClick={() => handleDelete(row)}
          >
            <Trash2Icon className="w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const [client, setClient] = useState<boolean>(false);
  useEffect(() => {
    setClient(true);
  }, []);
  if (!client) return null;

  return (
    <div className="space-y-3">
      <TitleHeader
        title="Kelola Stats"
        description="Kelola data statistik yang ditampilkan di landing page"
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Media", href: "#" },
              { label: "Stats", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() => {
              setModal({
                ...modal,
                open: true,
                key: "form",
                data: null,
              });
            }}
          >
            <PlusCircleIcon className="w-4" />
            Tambah Stats
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />

      {modal?.key === "form" && (
        <Modal
          open={modal.open}
          title={modal?.data ? "Edit Stats" : "Tambah Stats"}
          onClose={() => setModal({ ...modal, open: false })}
        >
          <Form method="post" className="space-y-4">
            <input type="hidden" name="id" value={modal?.data?.id || ""} />

            <div className="space-y-2">
              <Label htmlFor="title">Label / Judul</Label>
              <Input
                id="title"
                name="title"
                defaultValue={modal?.data?.title || ""}
                placeholder="Contoh: ID Card Diproduksi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Nilai</Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="any"
                defaultValue={modal?.data?.value || ""}
                placeholder="Contoh: 12500 atau 85.45"
                required
              />
              <p className="text-xs text-gray-500">
                Masukkan nilai angka (bisa desimal untuk persen)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <SelectBasic
                options={[
                  { label: "+", value: "+" },
                  { label: "%", value: "%" },
                  // { label: "Tidak ada", value: "" },
                ]}
                value={formData.suffix}
                onChange={(value) => {
                  setFormData({ ...formData, suffix: value });
                }}
              />
              <input type="hidden" name="suffix" value={formData.suffix} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_type">Icon</Label>
              <SelectBasic
                options={availableIcons.map((icon) => ({
                  label: icon,
                  value: icon,
                }))}
                value={formData.icon_type}
                onChange={(value) => {
                  setFormData({ ...formData, icon_type: value });
                }}
              />
              <input
                type="hidden"
                name="icon_type"
                value={formData.icon_type}
              />
              <p className="text-xs text-gray-500">
                Pilih icon yang akan ditampilkan (random jika tidak dipilih)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seq">Urutan</Label>
              <Input
                id="seq"
                name="seq"
                type="number"
                defaultValue={modal?.data?.seq || 0}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Urutan tampilan (0 = pertama)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <SelectBasic
                options={[
                  { label: "Aktif", value: "1" },
                  { label: "Nonaktif", value: "0" },
                ]}
                value={formData.is_active}
                onChange={(value) => {
                  setFormData({ ...formData, is_active: value });
                }}
              />
              <input
                type="hidden"
                name="is_active"
                value={formData.is_active}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal({ ...modal, open: false })}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-700 hover:bg-blue-600 text-white"
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
