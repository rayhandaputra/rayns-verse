import React, { useState, useMemo, useEffect } from "react";
import { formatCurrency, unitAdd, INITIAL_STOCK } from "../constants";
import {
  Calculator,
  Store,
  Settings,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Trash2Icon,
  Tag,
} from "lucide-react";
import {
  type LoaderFunction,
  type ActionFunction,
  useNavigate,
  type ClientLoaderFunction,
} from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { safeParseArray } from "~/lib/utils";
import AsyncReactSelect from "react-select/async";
import { useQueryParams } from "~/hooks/use-query-params";

import AsyncCreatableSelect from "react-select/async-creatable";
import { useModal } from "~/hooks";
import { Button } from "~/components/ui/button";
import Swal from "sweetalert2";
import DataTable, { type ColumnDef } from "~/components/ui/data-table";
import { useAnimateMini } from "framer-motion";
import { useLoaderData } from "react-router";
import ModalSecond from "~/components/modal/ModalSecond";
import TableHeader from "~/components/table/TableHeader";
import SupplierPage from "./app.master.supplier";

// Mapping specific commodity codes to StockState keys if needed
// Or we assume the "code" in DB matches the keys in StockState
const STOCK_KEYS = Object.keys(INITIAL_STOCK);

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "restock") {
    const rawData = formData.get("data");
    if (typeof rawData !== "string") return Response.json({ success: false });

    const updates = JSON.parse(rawData); // Array of { key, qty, id }

    // Use first supplier as default
    const suppliersRes = await API.SUPPLIER.get({
      session: { user, token },
      req: { query: { size: 1 } },
    });

    const supplier_id = suppliersRes.items?.[0]?.id || "1";

    const promises = updates.map(async (u: any) => {
      if (!u.id) return; // Need commodity ID

      // Calculate actual unit quantity to add based on logic unless 'isDirect'
      let qtyToAdd = Number(u.qty);
      if (!u.isDirect) {
        qtyToAdd = unitAdd(u.key, qtyToAdd);
      }

      return API.COMMODITY_STOCK.restock({
        session: { user, token },
        req: { body: { supplier_id, commodity_id: u.id, qty: qtyToAdd } },
      });
    });

    try {
      await Promise.all(promises);
      return Response.json({
        success: true,
        message: "Stok berhasil ditambahkan",
      });
    } catch (e: any) {
      return Response.json({ success: false, message: e.message });
    }
  }

  return Response.json({ success: true });
};

export const clientLoader: ClientLoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const { supplier_id } = Object.fromEntries(url.searchParams.entries());

  const detailSupplier = await API.SUPPLIER.get({
    session: {},
    req: { query: { id: supplier_id || "null" } },
  });

  return Response.json({ detail_supplier: detailSupplier?.items?.[0] ?? null });
};

export default function StockPage() {
  const { detail_supplier } = useLoaderData();
  const query = useQueryParams();
  const navigate = useNavigate();
  const [modal, setModal] = useModal();

  // Fetch stock data
  const { data: stockData, reload } = useFetcherData({
    endpoint: nexus()
      .module("COMMODITY_STOCK")
      .action("get")
      .params({ size: 100, pagination: "false" })
      .build(),
  });

  const loadOptionSupplier = async (search: string) => {
    try {
      const result = await API.SUPPLIER.get({
        req: {
          query: {
            search: search || undefined,
            page: 0,
            size: 50,
            pagination: "true",
          },
        },
      });

      return (result?.items || []).map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.name}`,
      }));
    } catch (error) {
      console.log(error);
      return [];
    }
  };
  const loadOptionCommodity = async (search: string) => {
    try {
      const result = await API.COMMODITY.get({
        req: {
          query: {
            search: search || undefined,
            page: 0,
            size: 50,
            pagination: "true",
          },
        },
      });
      return result?.items?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: v?.name,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  // Fetcher for actions
  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  // -- States for Multi Restock --
  const [restockInputs, setRestockInputs] = useState<Record<string, number>>(
    {}
  );
  const [shippingCost, setShippingCost] = useState("");
  const [discount, setDiscount] = useState("");

  // -- Format Helper --
  const formatNumber = (num: number | string | undefined) => {
    if (num === undefined || num === null || num === "") return "";
    return num
      .toString()
      .replace(/\D/g, "")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumber = (str: string) => {
    return Number(str.replace(/\./g, "")) || 0;
  };

  const handleAddUpdateMaterial = (item: any, intent: string) => {
    submitAction({
      intent,
      ...item,
    });
  };

  const handleDeleteMaterial = (item: any) => {
    Swal.fire({
      title: "Hapus Bahan Baku?",
      text: `Yakin ingin menghapus ${item.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-red-600 text-white",
        cancelButton: "bg-gray-200 text-gray-800",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        submitAction({ intent: "delete", id: item?.id });
      }
    });
  };

  const handleMultiRestock = () => {
    // const items = SHOP_ITEMS_CONFIG[restockShop];
    // const items = [];
    // if (!items) return;

    const hasItems = Object.values(restockInputs).some((v: number) => v > 0);
    if (!hasItems) {
      toast.error("Masukkan jumlah barang terlebih dahulu.");
      return;
    }

    const updates: any[] = [];

    // items.forEach((it) => {
    //   const qty = restockInputs[it.k] || 0;
    //   if (qty > 0) {
    //     let targetKey = it.k;
    //     if (["tinta_cL", "tinta_mL", "tinta_yL", "tinta_kL"].includes(it.k)) {
    //       targetKey = "tinta_ml";
    //     }

    //     const id = commodityMap[targetKey];
    //     if (id) {
    //       updates.push({ key: it.k, qty, id });
    //     }
    //   }
    // });

    if (updates.length > 0) {
      submitAction({ actionType: "restock", data: JSON.stringify(updates) });

      // Reset form
      setRestockInputs({});
      setShippingCost("");
      setDiscount("");
    } else {
      toast.error("Item tidak ditemukan di database atau qty 0");
    }
  };

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      reload();
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Komponen",
        cellClassName:
          "whitespace-nowrap text-gray-600 min-w-[180px] font-medium",
        cell: (row) => row.name,
      },
      {
        key: "stock",
        header: "Stok Fisik",
        cellClassName: "whitespace-nowrap text-right text-gray-500",
        headerClassName: "text-right",
        cell: (row) =>
          typeof row.stock === "number"
            ? Number(row.stock).toLocaleString("id-ID")
            : row.stock || "0",
      },
      {
        key: "count",
        header: "Konversi Paket",
        cellClassName: "whitespace-nowrap text-right font-bold text-gray-900",
        headerClassName: "text-right",
        cell: (row) => (
          <div>
            {row.count || 0}{" "}
            <span className="text-xs font-normal text-gray-400">pkt</span>
          </div>
        ),
      },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState("stock");
  return (
    <>
      {/* Navigation */}
      <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden flex-wrap mb-4">
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "stock" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Tag size={16} className="inline mr-2" /> Stok
        </button>
        <button
          onClick={() => setActiveTab("supplier")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "supplier" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Store size={16} className="inline mr-2" /> Toko
        </button>
      </div>
      {activeTab === "stock" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full items-start">
          {/* LEFT COLUMN: CAPACITY & CALCULATIONS */}

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calculator size={20} /> Kalkulasi Stok
              </h2>

              <DataTable
                columns={columns}
                data={stockData?.data?.items || []}
                getRowKey={(product, _index) => product.id}
                rowClassName={(product) =>
                  +(product.show_in_dashboard || 0) > 0 ? "bg-green-50/30" : ""
                }
                emptyMessage="Belum ada produk."
                minHeight="400px"
              />
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex items-center gap-2">
                <RefreshCw size={16} />
                {/* <span>Produksi Maksimal Saat Ini: <b>{metrics.maxPackage} Paket</b></span> */}
                <span>
                  Produksi Maksimal Saat Ini: <b>0 Paket</b>
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MANAGEMENT */}
          <div className="space-y-6">
            {/* Section 1: Restock with Cost */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
                <Store size={18} /> Restock Bahan Baru
              </h3>

              {/* Shop Selector */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Pilih Toko Supplier
                </label>
                <AsyncReactSelect
                  value={
                    detail_supplier?.name
                      ? {
                          value: detail_supplier?.id,
                          label: detail_supplier?.name,
                        }
                      : null
                  }
                  loadOptions={loadOptionSupplier}
                  defaultOptions
                  placeholder="Cari dan Pilih Toko..."
                  onChange={(val: any) => {
                    navigate(`?supplier_id=${val.value}`);
                  }}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      fontSize: "0.875rem",
                    }),
                  }}
                />
              </div>

              {query?.supplier_id ? (
                <>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                    {safeParseArray(detail_supplier?.supplier_commodities)
                      ?.length === 0 ? (
                      <p className="text-center text-gray-400 text-xs py-4">
                        Tidak ada item terdaftar untuk toko ini.
                      </p>
                    ) : (
                      safeParseArray(
                        detail_supplier?.supplier_commodities
                      )?.map((item: any) => (
                        <div
                          key={item.commodity_id}
                          className="flex items-center justify-between text-sm border-b border-gray-200 last:border-0 pb-2 mb-2 last:mb-0"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {item.commodity_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(item.price || 0)} / unit
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-20 text-right border border-gray-300 rounded-md text-sm p-1.5 focus:ring-blue-500 focus:outline-none"
                              placeholder="0"
                              value={formatNumber(item.qty || 0)}
                              onChange={(e) => {
                                const val = parseNumber(e.target.value);
                                // restock
                              }}
                            />
                            <span className="text-xs text-gray-500 w-8">
                              unit
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Diskon (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                        placeholder="0"
                        value={formatNumber(discount)}
                        onChange={(e) =>
                          setDiscount(e.target.value.replace(/\./g, ""))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Ongkir (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                        placeholder="0"
                        value={formatNumber(shippingCost)}
                        onChange={(e) =>
                          setShippingCost(e.target.value.replace(/\./g, ""))
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-gray-900 text-white p-4 rounded-lg flex justify-between items-center mb-4">
                    <span className="text-sm font-bold">
                      Total Pengeluaran:
                    </span>
                    <span className="text-lg font-bold">
                      {/* {formatCurrency(calculateGrandTotal())} */}0
                    </span>
                  </div>

                  <button
                    onClick={handleMultiRestock}
                    disabled={
                      safeParseArray(detail_supplier?.supplier_commodities)
                        ?.length === 0
                    }
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <Plus size={16} /> Proses & Catat Keuangan
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  Silakan pilih toko untuk mulai restock.
                </div>
              )}
            </div>

            {/* Section 3: Manage Materials */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2">
                  <Settings size={18} /> Data Bahan Baku
                </h3>
                <button
                  onClick={() =>
                    setModal({
                      ...modal,
                      open: true,
                      type: "create",
                      data: {
                        supplier_commodities: [
                          { supplier_id: "", supplier_name: "" },
                        ],
                      },
                    })
                  }
                  className="text-blue-600 text-xs font-bold hover:underline"
                >
                  + Item Baru
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stockData?.data?.items?.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs py-4">
                    Belum ada bahan baku terdaftar
                  </p>
                ) : (
                  stockData?.data?.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-xs p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 group"
                    >
                      <div>
                        <span className="font-bold block">{item.name}</span>
                        <div className="text-gray-500 flex gap-2">
                          <span>
                            {formatCurrency(item.base_price)}/{item.unit}
                          </span>
                          <span className="bg-gray-100 px-1 rounded text-[10px]">
                            <ul>
                              {safeParseArray(item.supplier_commodities).map(
                                (sc, i) => (
                                  <li key={i}>{sc.supplier_name}</li>
                                )
                              )}
                            </ul>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 transition">
                        <button
                          onClick={() => {
                            setModal({
                              ...modal,
                              open: true,
                              type: "update",
                              data: {
                                ...item,
                                supplier_commodities: [
                                  ...safeParseArray(item?.supplier_commodities),
                                  { supplier_id: "", supplier_name: "" },
                                ],
                              },
                            });
                          }}
                          className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(item)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "supplier" && (
        // <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        //   <TableHeader
        //     title="Daftar Supplier"
        //     description="Atur jenis barang dan aturan harga."
        //     buttonText="Tambah Produk"
        //     onClick={() => {
        //       setModal({
        //         open: true,
        //         type: "create",
        //         data: {
        //           product_price_rules: [],
        //           product_variants: [],
        //         },
        //       });
        //     }}
        //     buttonIcon={Plus}
        //   />

        //   {/* DataTable */}
        //   <DataTable
        //     columns={columns}
        //     data={[]}
        //     getRowKey={(product, _index) => product.id}
        //     rowClassName={(product) =>
        //       +(product.show_in_dashboard || 0) > 0 ? "bg-green-50/30" : ""
        //     }
        //     emptyMessage="Belum ada produk."
        //     minHeight="400px"
        //   />

        //   {/* Modal Section */}
        //   {(modal?.type === "create" || modal?.type === "update") && (
        //     <ModalSecond
        //       open={modal?.open}
        //       onClose={() => setModal({ ...modal, open: false })}
        //       title={modal?.data?.id ? "Edit Produk" : "Tambah Produk Baru"}
        //       size="xl"
        //     >
        //       <div className="flex flex-col h-full">
        //         {/* Form Content Area */}
        //         <div className="p-6 overflow-y-auto flex-1">
        //           <form
        //             id="productForm"
        //             onSubmit={(e) => e.preventDefault()}
        //             className="space-y-4"
        //           >
        //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        //               <div className="flex flex-col">
        //                 <label className="block text-xs font-bold text-gray-700 mb-1">
        //                   Nama Produk
        //                 </label>
        //                 <input
        //                   className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        //                   value={modal?.data?.name || ""}
        //                   onChange={(e) =>
        //                     setModal({
        //                       ...modal,
        //                       data: { ...modal?.data, name: e.target.value },
        //                     })
        //                   }
        //                   placeholder="Contoh: Paket Premium"
        //                   required
        //                 />
        //               </div>
        //               {/* Anda bisa menambah input grid ke-2 di sini jika diperlukan */}
        //             </div>
        //           </form>
        //         </div>

        //         {/* Footer Area */}
        //         <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
        //           <Button
        //             type="button"
        //             onClick={() => setModal({ ...modal, open: false })}
        //             className="bg-white border border-gray-300 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 text-sm font-medium"
        //           >
        //             Batal
        //           </Button>
        //           <Button
        //             type="submit"
        //             form="productForm"
        //             className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
        //           >
        //             {modal?.data?.id ? "Simpan Perubahan" : "Simpan Produk"}
        //           </Button>
        //         </div>
        //       </div>
        //     </ModalSecond>
        //   )}
        // </div>
        <SupplierPage />
      )}

      {/* Edit Material Modal */}
      {(modal?.type === "update" || modal?.type === "create") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">
              {modal?.type === "update" ? "Edit" : "Tambah"} Bahan Baku
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Nama Item
                </label>
                {modal?.type === "create" ? (
                  <AsyncCreatableSelect
                    cacheOptions
                    defaultOptions
                    isClearable
                    className="text-sm rounded"
                    placeholder="Masukkan atau Pilih Nama Item"
                    loadOptions={loadOptionCommodity}
                    value={
                      modal?.data?.name
                        ? {
                            value: modal?.data?.id,
                            label: modal?.data?.name,
                          }
                        : null
                    }
                    onChange={(val: any) => {
                      setModal({
                        ...modal,
                        data: { ...modal?.data, name: val?.label },
                      });
                    }}
                    onCreateOption={(newValue) => {
                      const value = newValue.toUpperCase().replace(/\s+/g, "");
                      setModal({
                        ...modal,
                        data: { ...modal?.data, name: value },
                      });
                    }}
                    formatCreateLabel={(inputValue) => {
                      const newValue = inputValue
                        .toUpperCase()
                        .replace(/\s+/g, "");
                      return (
                        <span>
                          Buat singkatan: <strong>{newValue}</strong>
                        </span>
                      );
                    }}
                    noOptionsMessage={({ inputValue }) => {
                      if (!inputValue) {
                        return (
                          <div style={{ padding: "8px", color: "#6b7280" }}>
                            Belum ada Bahan Baku.
                            <br />
                            <strong>Ketik</strong> untuk membuat Bahan Baku
                            baru.
                          </div>
                        );
                      }
                      return (
                        <div style={{ padding: "8px", color: "#6b7280" }}>
                          Tidak ditemukan hasil untuk{" "}
                          <strong>{inputValue}</strong>.
                          <br />
                          Tekan <strong>Enter</strong> untuk membuat Bahan Baku
                          ini.
                        </div>
                      );
                    }}
                  />
                ) : (
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={modal?.data?.name || ""}
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        data: {
                          ...modal?.data,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Harga Satuan
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formatNumber(modal?.data?.base_price || "")}
                    placeholder="0"
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        data: {
                          ...modal?.data,
                          base_price: parseNumber(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Satuan
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={modal?.data?.unit || ""}
                    placeholder="Satuan (e.g. roll, pack)"
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        data: {
                          ...modal?.data,
                          unit: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center gap-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Toko Supplier
                  </label>
                  <button
                    onClick={() =>
                      setModal({
                        ...modal,
                        data: {
                          ...modal?.data,
                          supplier_commodities: [
                            ...modal?.data?.supplier_commodities,
                            { supplier_id: "", supplier_name: "" },
                          ],
                        },
                      })
                    }
                    className="text-blue-600 text-xs font-bold hover:underline"
                  >
                    + Tambah Toko
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1 border border-gray-300 rounded-lg p-2 max-h-40">
                  {modal?.data?.supplier_commodities?.map((sc, i) => (
                    <div className="flex items-center gap-2">
                      <AsyncReactSelect
                        value={
                          sc?.supplier_name
                            ? {
                                value: sc?.supplier_id,
                                label: sc?.supplier_name,
                              }
                            : null
                        }
                        loadOptions={loadOptionSupplier}
                        defaultOptions
                        placeholder="Cari dan Pilih Toko..."
                        className="w-full"
                        onChange={(val: any) => {
                          let tmp = [...modal?.data?.supplier_commodities];
                          tmp[i] = {
                            supplier_id: val?.value,
                            supplier_name: val?.label,
                          };
                          setModal({
                            ...modal,
                            data: {
                              ...modal?.data,
                              supplier_commodities: tmp,
                            },
                          });
                        }}
                        isClearable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "38px",
                            fontSize: "0.875rem",
                          }),
                        }}
                      />
                      <Button
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => {
                          const newSupplierCommodities =
                            modal?.data?.supplier_commodities?.filter(
                              (sc, scidx) => scidx !== i
                            );
                          setModal({
                            ...modal,
                            data: {
                              ...modal?.data,
                              supplier_commodities: newSupplierCommodities,
                            },
                          });
                        }}
                      >
                        <Trash2Icon className="w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setModal({ ...modal, type: "", open: false })}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  onClick={() =>
                    handleAddUpdateMaterial(modal?.data, modal?.type!)
                  }
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold"
                >
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
