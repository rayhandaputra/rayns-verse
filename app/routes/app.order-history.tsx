// app/routes/app.order-history.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  useActionData,
  Form,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import type { Order, Product } from "../types";
import { formatFullDate } from "../constants";
import { Star, Edit, Upload, Check, X, Plus } from "lucide-react";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  products: Product[];
  history: any[];
  orders: Order[];
}

interface ActionData {
  success?: boolean;
  message?: string;
}

interface OrderFormProps {
  history: any[];
  orders: Order[];
  products: Product[];
  onSubmit: (data: any) => void;
  isArchive: boolean;
}

// Import OrderForm component
import OrderFormComponent from "~/components/OrderFormComponent";
import TableHeader from "~/components/table/TableHeader";
import DataTable, { type ColumnDef } from "~/components/ui/data-table";
import { Button } from "~/components/ui/button";
import { useModal } from "~/hooks";
import ModalSecond from "~/components/modal/ModalSecond";
import { safeParseArray, safeParseObject, uploadFile } from "~/lib/utils";

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

// ============================================
// ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update_portfolio") {
    try {
      const data = Object.fromEntries(formData);
      const { id, review, rating, is_portfolio, images } = data as any;

      const response = await API.ORDERS.update({
        session: { user, token },
        req: {
          body: {
            id,
            ...(is_portfolio
              ? {
                  is_portfolio,
                }
              : {
                  review,
                  rating,
                  images: safeParseArray(images),
                }),
          },
        },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Berhasil update portfolio",
      });
    } catch (error: any) {
      console.error("Error updating portfolio:", error);
      return Response.json({
        success: false,
        message: error.message || "Gagal update portfolio",
      });
    }
  }

  if (intent === "create_archive") {
    try {
      const rawData = formData.get("data") as string;
      const payload: any = safeParseObject(rawData);

      // Ensure status is done
      const finalPayload = {
        // ...payload,
        institution_id: payload.instansi_id,
        institution_name: payload.instansi,
        institution_domain: payload.accessCode,
        pic_name: payload.pemesanName,
        pic_phone: payload.pemesanPhone,
        status: "done",
        payment_status: "none",
        images: payload.portfolioImages,
        items: payload.items,
      };

      const response = await API.ORDERS.create({
        session: { user, token },
        req: { body: finalPayload },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Arsip berhasil disimpan",
      });
    } catch (error: any) {
      console.error("Error creating archive:", error);
      return Response.json({
        success: false,
        message: error.message || "Gagal menyimpan arsip",
      });
    }
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function OrderHistoryPage() {
  const actionData = useActionData<ActionData>();

  // Fetch products
  const { data: productsData } = useFetcherData({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({ page: 0, size: 100, pagination: "true" })
      .build(),
  });

  // Fetch done orders
  const { data: getOrdersData, reload } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        status: "done",
        page: 0,
        size: 200,
        pagination: "true",
      })
      .build(),
  });

  const orders = getOrdersData?.data?.items || [];

  // Map data
  const products = productsData?.data?.items || [];

  // ========== STATE ==========
  const [modal, setModal] = useModal();
  const [searchTerm, setSearchTerm] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== EFFECTS ==========
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      setModal({ ...modal, open: false, type: "" });
      reload(); // Reload data after success
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await uploadFile(file);
      setModal({
        ...modal,
        data: {
          ...(modal?.data ?? {}),
          images: [...(modal?.data?.images || []), url],
        },
      });
    }
  };

  const removeImage = (index: number) => {
    setModal({
      ...modal,
      data: {
        ...modal.data,
        images: modal.data.images.filter((_: any, i: number) => i !== index),
      },
    });
  };

  const handleArchiveSubmit = (data: any) => {
    // This will be called by OrderForm component
    // We need to trigger the form submission
    const form = document.createElement("form");
    form.method = "post";
    form.style.display = "none";

    const intentInput = document.createElement("input");
    intentInput.type = "hidden";
    intentInput.name = "intent";
    intentInput.value = "create_archive";
    form.appendChild(intentInput);

    const dataInput = document.createElement("input");
    dataInput.type = "hidden";
    dataInput.name = "data";
    dataInput.value = JSON.stringify(data);
    form.appendChild(dataInput);

    document.body.appendChild(form);
    form.submit();
  };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: "show",
        header: "Tampil?",
        cellClassName:
          "whitespace-nowrap text-xs text-gray-600 min-w-[90px] font-medium",
        cell: (row) => (
          <Form method="post">
            <input type="hidden" name="intent" value="update_portfolio" />
            <input type="hidden" name="id" value={row.id} />
            <input
              type="hidden"
              name="is_portfolio"
              value={+row?.is_portfolio ? 0 : 1}
            />
            <button
              type="submit"
              className={`w-10 h-6 rounded-full transition-colors relative ${
                +row?.is_portfolio ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  +row?.is_portfolio ? "left-5" : "left-1"
                }`}
              ></div>
            </button>
          </Form>
        ),
      },
      {
        key: "institution_name",
        header: "Instansi",
        cellClassName:
          "whitespace-nowrap text-xs text-gray-600 min-w-[180px] font-medium",
        cell: (row) => (
          <>
            {row.institution_name}
            <div className="text-xs text-gray-400">
              {row.created_on ? formatFullDate(row.created_on) : "-"}
            </div>
          </>
        ),
      },
      {
        key: "product",
        header: "Produk",
        cellClassName: "max-w-[180px]",
        cell: (row) => (
          <ul className="list-disc list-inside text-xs text-gray-600">
            {safeParseArray(row.order_items)?.length > 0
              ? safeParseArray(row.order_items)?.map(
                  (item: any, idx: number) => (
                    <li key={idx} className="truncate">
                      {item.product_name} ({item.qty})
                    </li>
                  )
                )
              : "-"}
          </ul>
        ),
      },
      {
        key: "image",
        header: "Gambar",
        headerClassName: "text-center",
        cellClassName: "max-w-[150px]",
        cell: (row) => (
          <div className="px-6 py-3 flex justify-center">
            {(() => {
              const images: any[] = safeParseArray(row.images);
              return images.length > 0 ? (
                <div className="flex -space-x-2">
                  {images.slice(0, 3).map((img: string, i: number) => (
                    <img
                      key={i}
                      src={img}
                      className="w-8 h-8 rounded-full border border-white object-cover"
                      alt=""
                    />
                  ))}
                  {images.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] text-gray-500">
                      +{images.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400">No Image</span>
              );
            })()}
          </div>
        ),
      },
      {
        key: "feedback",
        header: "Ulasam",
        headerClassName: "text-center",
        cellClassName: "max-w-[150px]",
        cell: (row) => (
          <div className="px-6 py-3 max-w-xs truncate">
            {row.review ? (
              <div className="flex items-center gap-1 text-xs">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="truncate">{row.review}</span>
              </div>
            ) : (
              "-"
            )}
          </div>
        ),
      },
      {
        key: "aksi",
        header: "Aksi",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (row) => (
          <div className="flex justify-center gap-2 relative">
            <Button
              onClick={() => {
                setModal({
                  ...modal,
                  open: true,
                  data: {
                    ...row,
                    images: safeParseArray(row?.images),
                  },
                  type: "update",
                });
              }}
              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
              title="Edit Portfolio Details"
            >
              <Edit size={16} />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      {modal?.type === "add_archive" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Tambah Arsip Produksi Lama</h2>
            <button
              onClick={() => setModal({ ...modal, open: false, type: "" })}
              className="text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>
          </div>
          <OrderFormComponent
            orders={orders}
            products={products}
            onSubmit={handleArchiveSubmit}
            isArchive={true}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TableHeader
            title="Riwayat Pesanan & Arsip"
            description="Kelola arsip pesanan, ulasan, dan tampilan portfolio."
            buttonText="Arsip Lama"
            onClick={() => {
              setModal({
                open: true,
                type: "add_archive",
                data: null,
              });
            }}
            buttonIcon={Plus}
            searchValue={searchTerm}
            setSearchValue={setSearchTerm}
          />

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={orders}
            getRowKey={(product, _index) => product.id}
            // rowClassName={(product) =>
            //   product.show_in_dashboard ? "bg-green-50/30" : ""
            // }
            emptyMessage="Belum ada arsip / riwayat."
            minHeight="400px"
          />
        </div>
      )}

      {/* EDIT MODAL */}
      {modal.type === "update" && (
        <ModalSecond
          open={modal.open}
          onClose={() => setModal({ open: false, type: "" })}
          title="Edit Detail Portfolio"
          size="xl"
        >
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Images */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Foto Hasil Produksi
              </label>
              <div className="flex flex-wrap gap-3 mb-3">
                {(modal?.data?.images ?? [])?.map(
                  (img: string, idx: number) => (
                    <div key={idx} className="relative w-20 h-20 group">
                      <img
                        src={img}
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                        alt="Portfolio"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition"
                >
                  <Upload size={20} />
                  <span className="text-[10px] mt-1">Upload</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* Review */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Ulasan Pelanggan
              </label>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      setModal({
                        ...modal,
                        data: { ...modal.data, rating: star },
                      })
                    }
                    className={`${
                      star <= (modal?.data?.rating ?? 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    <Star size={24} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                placeholder="Ketik ulasan pelanggan..."
                value={modal?.data?.review}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    data: { ...modal.data, review: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
            <button
              onClick={() => setModal({ ...modal, open: false })}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
            >
              Batal
            </button>
            <Form method="post">
              <input type="hidden" name="intent" value="update_portfolio" />
              <input type="hidden" name="id" value={modal?.data?.id} />
              <input type="hidden" name="review" value={modal?.data?.review} />
              <input type="hidden" name="rating" value={modal?.data?.rating} />
              <input
                type="hidden"
                name="images"
                value={JSON.stringify(modal?.data?.images)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Check size={16} /> Simpan Perubahan
              </button>
            </Form>
          </div>
        </ModalSecond>
      )}
    </div>
  );
}
