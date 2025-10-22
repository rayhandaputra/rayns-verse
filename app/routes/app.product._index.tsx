import { PencilLineIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
import moment from "moment";
import { useEffect } from "react";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigate,
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
import { useModal } from "~/hooks/use-modal";
import { API } from "../lib/api";
import { toMoney } from "~/lib/utils";
// import { API } from "~/lib/api";
// import { API } from "~/lib/api";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const { page = 0, size = 10 } = Object.fromEntries(
    url.searchParams.entries()
  );
  try {
    const product = await API.PRODUCT.get({
      // session,
      session: {},
      req: {
        query: {
          pagination: "true",
          type: "single",
          page: 0,
          size: 10,
        },
      } as any,
    });
    // console.log(product?.items?.[0]);

    return {
      // search,
      // APP_CONFIG: CONFIG,
      table: {
        ...product,
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
      res = await API.PRODUCT.update({
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
        res = await API.PRODUCT.update({
          session: {},
          req: {
            body: {
              id,
              ...payload,
            } as any,
          },
        });
      } else {
        res = await API.PRODUCT.create({
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

export default function AccountPage() {
  const { table } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
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
          action: "/app/product",
        }
      );

      // console.log("HASIL FETCHER => ", fetcher);
      toast.success("Berhasil", {
        // description: fetcher.data.message,
        description: "Berhasil menghapus Produk",
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
      cell: (_: any, index: number) => index + 1,
    },
    {
      name: "Kode",
      cell: (row: any) => row?.name || "-",
    },
    {
      name: "Nama",
      cell: (row: any) => row?.name || "-",
    },
    {
      name: "Biaya & Potongan",
      cell: (row: any) => (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between gap-2">
            <p className="text-[0.675rem] text-gray-600">Diskon</p>
            <p className="text-[0.675rem] font-medium">
              Rp{toMoney(row?.discount_value)}
            </p>
          </div>
          <div className="flex justify-between gap-2">
            <p className="text-[0.675rem] text-gray-600">Pajak</p>
            <p className="text-[0.675rem] font-medium">
              Rp{toMoney(row?.tax_fee)}
            </p>
          </div>
          <div className="flex justify-between gap-2">
            <p className="text-[0.675rem] text-gray-600">Lainnya</p>
            <p className="text-[0.675rem] font-medium">
              Rp{toMoney(row?.other_fee)}
            </p>
          </div>
        </div>
      ),
    },
    {
      name: "Harga",
      cell: (row: any) => `Rp ${toMoney(row?.total_price || 0)}`,
    },
    {
      name: "Deskripsi",
      cell: (row: any) => row?.description || "-",
    },
    {
      name: "Aksi",
      cell: (row: any, index: number) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="text-blue-700 hover:text-blue-500"
            onClick={() => navigate(`/app/product/manage?id=${row?.id}`)}
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
        title="Daftar Produk"
        description="Kelola data Produk."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Produk", href: "/" },
              { label: "Daftar Produk", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() => navigate(`/app/product/manage`)}
          >
            <PlusCircleIcon className="w-4" />
            Produk Baru
          </Button>
        }
      />

      <TableComponent columns={columns} data={table} />
    </div>
  );
}
