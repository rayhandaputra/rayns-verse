import {
  Copy,
  EllipsisIcon,
  Eye,
  Pencil,
  PencilLineIcon,
  PenLine,
  Plus,
  PlusCircleIcon,
  Trash2,
  Trash2Icon,
  X,
} from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import PaginationItem from "~/components/table/PaginationOnly";
import ProductCard from "~/components/card/ProductCard";
import { ConfirmDialog } from "~/components/modal/ConfirmDialog";
import SlideInModal from "~/components/modal/SlideInModal";
import ProductFullFormModal from "~/components/form/FormProduct";
import { getSession } from "~/lib/session.client";
import {
  PopoverMenu,
  type PopoverMenuItem,
} from "~/components/popover/PopoverMenu";
import { DropdownMenu } from "~/components/ui/dropdown-menu";
// import SlideInModal from "~/components/modal/SlideInModal";
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
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  let { id, state, items, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    let resMessage = "";
    state = state ? JSON.parse(state) : {};
    items = items ? JSON.parse(items) : {};

    // console.log("STATE", state);
    // console.log("ITEMS", items);

    if (!id) {
      const result = await API.PRODUCT.create({
        session: {},
        req: {
          body: {
            ...state,
            subtotal: payload?.subtotal,
            total_price: payload?.total,
            items: items,
          },
        },
      });

      resMessage = "Berhasil menambahkan Produk";
    } else {
      if (request.method === "DELETE") {
        await API.PRODUCT.update({
          session: {},
          req: {
            body: {
              id,
              ...payload,
            } as any,
          },
        });

        resMessage = "Berhasil menghapus Produk";
      } else {
        await API.PRODUCT.create({
          session: {},
          req: {
            body: {
              ...state,
              subtotal: payload?.subtotal,
              total_price: payload?.total,
              items: items,
              id,
            },
          },
        });

        resMessage = "Berhasil memperbaharui Produk";
      }
    }

    return Response.json({
      success: true,
      message: resMessage,
    });
    // return Response.json({
    //   flash: {
    //     success: true,
    //     message: resMessage,
    //   },
    // });
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error_message: "Terjadi Kesalahan",
    };
  }
};

export default function AccountPage() {
  const { table } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const [modal, setModal] = useModal();

  const fetcher = useFetcher();

  const handleDelete = async (data: any) => {
    const result = await ConfirmDialog({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus Produk ini?",
      icon: "warning",
      confirmText: "Hapus",
    });

    if (result.isConfirmed) {
      fetcher.submit(
        { id: data?.id, deleted_on: moment().format("YYYY-MM-DD HH:mm:ss") },
        {
          method: "delete",
          action: "/app/product",
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
            // onClick={() => navigate(`/app/product/manage`)}
            onClick={() =>
              setModal({ ...modal, open: true, key: "create", data: null })
            }
          >
            <PlusCircleIcon className="w-4" />
            Produk Baru
          </Button>
        }
      />

      {/* <TableComponent columns={columns} data={table} /> */}

      {/* <ProductList /> */}

      <div className="relative">
        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {table?.items.map((p: any) => (
            <div className="relative">
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                sku={p.code}
                image={p.image}
                status={p.status}
                price={`Rp ${toMoney(p?.total_price || 0)}`}
                fee={`${toMoney(p?.tax_fee || 0)}%`}
                discount={`Rp ${toMoney(p?.other_fee || 0)}`}
                component={p.total_components}
                onMenuClick={(id) => {
                  setModal({
                    ...modal,
                    open:
                      modal?.key !== `${p?.code}-open-detail` ? true : false,
                    key:
                      modal?.key !== `${p?.code}-open-detail`
                        ? `${p?.code}-open-detail`
                        : "",
                    data: p,
                  });
                }}
              />
              <PopoverMenu
                open={modal?.open && modal?.key === `${p.code}-open-detail`}
                onClose={() => setModal({ open: false, key: "" })}
                items={[
                  {
                    label: "Detail",
                    icon: <Eye className="w-4 h-4" />,
                    onClick: () => console.log("detail"),
                  },
                  {
                    label: "Edit",
                    icon: <PenLine className="w-4 h-4" />,
                    onClick: () =>
                      setModal({
                        ...modal,
                        open: true,
                        key: "create",
                        data: p,
                      }),
                  },
                  {
                    label: "Delete",
                    icon: <Trash2 className="w-4 h-4" />,
                    destructive: true,
                    onClick: () => handleDelete(p),
                  },
                ]}
              />
            </div>
          ))}
        </div>

        <PaginationItem
          currentPage={table?.page}
          totalPages={table?.total_pages}
          totalItems={table?.total_items}
          perPage={table?.size}
          onPageChange={(p) => {}}
        />

        <SlideInModal
          isOpen={modal?.open && modal?.key === "create"}
          onClose={() => setModal({ ...modal, open: false })}
          title={modal?.data ? "Edit Produk" : "Tambah Produk"}
          width="w-1/2 max-w-3xl"
        >
          <ProductFullFormModal
            detail={modal?.data}
            // currentItems={currentItems}
            currentItems={[]}
            onSuccess={() => {
              setModal({ ...modal, open: false });
              toast.success("Produk berhasil disimpan!");
            }}
          />
        </SlideInModal>
      </div>
    </div>
  );
}

interface Product {
  id: number;
  name: string;
  sku: string;
  retail: string;
  wholesale: string;
  stock: string;
  status: "Active" | "Draft";
}

const mockProducts: Product[] = Array.from({ length: 22 }).map((_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  sku: `SKU-${i + 1}`,
  retail: "$120.00",
  wholesale: "$90.00",
  stock: `${Math.floor(Math.random() * 100)} in stock`,
  status: i % 2 === 0 ? "Active" : "Draft",
}));
