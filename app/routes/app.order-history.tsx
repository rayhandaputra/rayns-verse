// app/routes/app.order-history.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  useLoaderData,
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

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  // Fetch Products
  const productsRes = await API.PRODUCT.get({
    req: { query: { page: 0, size: 100, pagination: "true" } },
  });

  // Fetch History (Institutions)
  let historyRes: any = { items: [] };
  try {
    historyRes = await API.INSTITUTION.get({
      session: { user, token },
      req: { query: { page: 0, size: 1000, pagination: "true" } },
    });
  } catch (e) {
    console.error("Failed to fetch history", e);
  }

  // Fetch Orders (Status: done)
  const ordersRes = await API.ORDERS.get({
    req: {
      query: {
        status: "done",
        page: 0,
        size: 200,
        pagination: "true",
      },
    },
  });

  // Map API Orders to UI Order type
  const mappedOrders = (ordersRes.items || []).map((o: any) => {
    // Parse notes for portfolio data
    let notesData: any = {};
    try {
      if (o.notes) {
        const parsed = JSON.parse(o.notes);
        if (typeof parsed === "object") notesData = parsed;
      }
    } catch (e) {
      /* ignore */
    }

    return {
      id: o.id,
      instansi: o.institution_name || "",
      jenisPesanan: o.order_type === "package" ? "Paket" : "Satuan",
      jumlah: o.total_product || 0,
      totalHarga: o.grand_total || 0,
      status: o.status || "",
      createdAt: o.created_on || "",
      is_portfolio: Number(o?.is_portfolio) || 0,
      review: notesData.review || "",
      rating: notesData.rating || 0,
      portfolioImages: notesData.portfolioImages || [],
      raw: o,
    };
  });

  return {
    products: productsRes.items || [],
    history: historyRes.items || [],
    orders: mappedOrders,
  };
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
      const id = formData.get("id") as string;
      const review = formData.get("review") as string;
      const rating = Number(formData.get("rating"));
      const is_portfolio = formData.get("is_portfolio") === "true";
      const imagesStr = formData.get("portfolioImages") as string;

      let portfolioImages = [];
      try {
        portfolioImages = JSON.parse(imagesStr);
      } catch (e) {
        /* ignore */
      }

      // Fetch current order to preserve existing notes
      const currentOrderRes = await API.ORDERS.get({
        req: { query: { id, size: 1 } },
      });
      const currentOrder = currentOrderRes.items?.[0];

      let currentNotes = {};
      try {
        if (currentOrder?.notes) currentNotes = JSON.parse(currentOrder.notes);
      } catch (e) {
        /* ignore */
      }

      const newNotes = {
        ...currentNotes,
        is_portfolio,
        review,
        rating,
        portfolioImages,
      };

      const response = await API.ORDERS.update({
        session: { user, token },
        req: {
          body: {
            id,
            is_portfolio,
            notes: JSON.stringify(newNotes),
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
      const payload = JSON.parse(rawData);

      // Ensure status is done
      const finalPayload = {
        ...payload,
        status: "done",
        notes: JSON.stringify({
          ...(payload.notes || {}),
          is_portfolio: true,
        }),
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
  const { orders = [], products = [], history = [] } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  // ========== STATE ==========
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReview, setEditReview] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [showAddArchive, setShowAddArchive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== EFFECTS ==========
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      setEditingId(null);
      setShowAddArchive(false);
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  // ========== COMPUTED ==========
  const filteredOrders = orders?.filter((o) =>
    o.instansi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ========== HANDLERS ==========
  const handleEditClick = (order: Order) => {
    setEditingId(order.id);
    setEditReview(order.review || "");
    setEditRating(order.rating || 5);
    setEditImages(order.portfolioImages || []);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setEditImages([...editImages, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setEditImages(editImages.filter((_, i) => i !== index));
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

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      {showAddArchive ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Tambah Arsip Produksi Lama</h2>
            <button
              onClick={() => setShowAddArchive(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>
          </div>
          <OrderFormComponent
            history={history}
            orders={orders}
            products={products}
            onSubmit={handleArchiveSubmit}
            isArchive={true}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Riwayat Pesanan & Arsip</h2>
              <p className="text-gray-500 text-sm">
                Kelola arsip pesanan, ulasan, dan tampilan portfolio.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
                placeholder="Cari Instansi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => setShowAddArchive(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
              >
                <Plus size={16} /> Arsip Lama
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3">Tampil?</th>
                  <th className="px-6 py-3">Instansi</th>
                  <th className="px-6 py-3">Produk</th>
                  <th className="px-6 py-3">Gambar</th>
                  <th className="px-6 py-3">Ulasan</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      Belum ada arsip / riwayat.
                    </td>
                  </tr>
                )}
                {filteredOrders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Form method="post">
                        <input type="hidden" name="intent" value="update_portfolio" />
                        <input type="hidden" name="id" value={order.id} />
                        <input type="hidden" name="review" value={order.review || ""} />
                        <input type="hidden" name="rating" value={order.rating || 0} />
                        <input
                          type="hidden"
                          name="portfolioImages"
                          value={JSON.stringify(order.portfolioImages || [])}
                        />
                        <input type="hidden" name="is_portfolio" value={String(!order.is_portfolio)} />
                        <button
                          type="submit"
                          className={`w-10 h-6 rounded-full transition-colors relative ${
                            order.is_portfolio ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                              order.is_portfolio ? "left-5" : "left-1"
                            }`}
                          ></div>
                        </button>
                      </Form>
                    </td>
                    <td className="px-6 py-3 font-medium">
                      {order.instansi}
                      <div className="text-xs text-gray-400">
                        {order.createdAt ? formatFullDate(order.createdAt) : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {order.jenisPesanan} ({order.jumlah})
                    </td>
                    <td className="px-6 py-3">
                      {order.portfolioImages && order.portfolioImages.length > 0 ? (
                        <div className="flex -space-x-2">
                          {order.portfolioImages.slice(0, 3).map((img: any, i: number) => (
                            <img
                              key={i}
                              src={img}
                              className="w-8 h-8 rounded-full border-2 border-white object-cover"
                              alt="Portfolio"
                            />
                          ))}
                          {order.portfolioImages.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600 font-bold">
                              +{order.portfolioImages.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">0 Foto</span>
                      )}
                    </td>
                    <td className="px-6 py-3 max-w-xs truncate">
                      {order.review ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="truncate">{order.review}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => handleEditClick(order)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                        title="Edit Portfolio Details"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Detail Portfolio</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-red-500">
                <X />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Images */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Foto Hasil Produksi
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {editImages.map((img, idx) => (
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
                  ))}
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Ulasan Pelanggan</label>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEditRating(star)}
                      className={`${
                        star <= editRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
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
                  value={editReview}
                  onChange={(e) => setEditReview(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Batal
              </button>
              <Form method="post">
                <input type="hidden" name="intent" value="update_portfolio" />
                <input type="hidden" name="id" value={editingId} />
                <input type="hidden" name="review" value={editReview} />
                <input type="hidden" name="rating" value={editRating} />
                <input type="hidden" name="is_portfolio" value="true" />
                <input type="hidden" name="portfolioImages" value={JSON.stringify(editImages)} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <Check size={16} /> Simpan Perubahan
                </button>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
