import React, { useState, useMemo, useRef, useEffect } from "react";
// import { useLoaderData, useFetcher } from '@remix-run/react'; // Aktifkan jika sudah integrasi API
import {
  Store,
  Plus,
  Trash2,
  Check,
  ShoppingCart,
  Layers,
  Package,
  Phone,
  MapPin,
  Zap,
  X,
  Edit2,
  ExternalLink,
  Upload,
  Info,
  Calculator,
  PlusCircle,
  Layout,
  Box,
  Settings,
} from "lucide-react";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import type { ActionFunction } from "react-router";
import { requireAuth } from "~/lib/session.server";
import { API } from "~/lib/api";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { safeParseArray } from "~/lib/utils";

// --- MOCK TYPES (Sesuaikan dengan ../types Anda) ---
export interface SubComponent {
  id: string;
  name: string;
  capacity_per_unit: number;
  current_stock: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit_price: number;
  supplier_id: string;
  current_stock: number;
  capacity_per_unit?: number;
  is_package?: number;
  sub_components?: SubComponent[];
  is_affected_side?: number;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  type: "online" | "offline";
  phone?: string;
  external_link?: string;
  category: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  description: string;
  isAuto: boolean;
  proofImage?: string;
}

export interface ProductVariation {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  variations?: ProductVariation[];
}

// --- CONSTANTS & HELPERS ---
const parseCurrency = (value: string): number => {
  return Number(value.replace(/[^0-9]/g, ""));
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatNumberInput = (val: number | string) => {
  const num = typeof val === "string" ? parseCurrency(val) : val;
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// --- UNIFIED STATE INTERFACE ---
interface StockPageState {
  // Navigation
  activeCategory: string;
  subTab: "belanja" | "toko" | "komponen" | "kapasitas";

  // Global UI
  editingShopId: string | null;
  editingMatId: string | null;
  zoomedImage: string | null;
  isProcessing: boolean;

  // HPP Simulator
  hppRecipes: Record<string, string[]>;

  // Form: Supplier
  showAddShop: boolean;
  newShop: Partial<Shop>;

  // Form: Komponen
  showAddMat: boolean;
  newMat: Partial<RawMaterial>;
  tempSubComponents: Partial<SubComponent>[];

  // Form: Belanja
  selectedShopId: string;
  restockInputs: Record<string, number>;
  mDiscountStr: string;
  mAdminStr: string;
  mShippingStr: string;
  restockProof: string;

  // Form: Manual
  manualMatId: string;
  manualSubId: string;
  manualQty: string;
}

// --- PROPS INTERFACE ---
interface StockPageProps {
  //   materials?: RawMaterial[];
  //   shops?: Shop[];
  transactions?: Transaction[];
  products?: Product[];
  // Callback props (bisa diganti dengan Remix Action nantinya)
  onUpdateMaterials?: (materials: RawMaterial[]) => void;
  onUpdateShops?: (shops: Shop[]) => void;
  onUpdateTransactions?: (txs: Transaction[]) => void;
  onUpdateProducts?: (products: Product[]) => void;
}

export const action: ActionFunction = async ({ request }) => {
  const { user, token }: any = await requireAuth(request);
  const formData = await request.formData();
  let { id, intent, data, sub_components }: any = Object.fromEntries(
    formData.entries()
  );
  data = data ? JSON.parse(data) : {};
  sub_components = sub_components ? JSON.parse(sub_components) : {};
  try {
    if (intent === "update_supplier") {
      const payload = {
        id,
        name: data?.name,
        phone: data?.phone,
        address: data?.address,
        type: data?.type,
        category: data?.category,
        location: data?.location,
        external_link: data?.external_link,
      };

      const res = await API.SUPPLIER.update({
        session: { user, token },
        req: { body: payload },
      });
      return Response.json({
        success: res.success,
        message: res.success
          ? "Berhasil memperbarui Supplier"
          : "Gagal memperbarui Supplier",
      });
    }
    if (intent === "create_supplier") {
      const payload = {
        name: data?.name,
        phone: data?.phone,
        address: data?.address,
        type: data?.type,
        category: data?.category,
        location: data?.location,
        external_link: data?.external_link,
      };

      const res = await API.SUPPLIER.create({
        session: { user, token },
        req: { body: payload },
      });
      return Response.json({
        success: res.success,
        message: res.success
          ? "Berhasil memperbarui Supplier"
          : "Gagal memperbarui Supplier",
      });
    }
    if (intent === "delete_supplier") {
      const payload = {
        id,
        deleted: 1,
      };

      const res = await API.SUPPLIER.update({
        session: { user, token },
        req: { body: payload },
      });
      return Response.json({
        success: res.success,
        message: res.success
          ? "Berhasil menghapus Supplier"
          : "Gagal menghapus Supplier",
      });
    }

    if (intent === "update_material") {
      const payload = {
        id,
        commodity_name: data?.commodity_name,
        is_affected_side: data?.is_affected_side,
        is_package: data?.is_package,
        supplier_id: data?.supplier_id,
        unit: data?.unit,
        unit_price: data?.unit_price,
        capacity_per_unit: data?.capacity_per_unit,
      };
      const res = await API.SUPPLIER_COMMODITY.update({
        session: { user, token },
        req: {
          body: {
            ...payload,
            sub_components: safeParseArray(sub_components)?.map((v: any) => ({
              id: v.id,
              commodity_id: v.commodity_id,
              commodity_name: v.commodity_name,
              capacity_per_unit: v.capacity_per_unit,
            })),
          },
        },
      });
      return Response.json({
        success: res.success,
        message: res.success
          ? "Berhasil memperbarui Komponen"
          : "Gagal memperbarui Komponen",
      });
    }
    if (intent === "create_material") {
      const payload = {
        commodity_id: 0,
        commodity_name: data?.name,
        is_affected_side: data?.is_affected_side,
        is_package: data?.is_package,
        supplier_id: data?.supplier_id,
        unit: data?.unit,
        unit_price: data?.unit_price,
        capacity_per_unit: data?.capacity_per_unit,
      };

      const res = await API.SUPPLIER_COMMODITY.create({
        session: { user, token },
        req: {
          body: {
            ...payload,
            sub_components: sub_components?.map((v: any) => ({
              commodity_id: 0,
              commodity_name: v.name,
            })),
          },
        },
      });
      return Response.json({
        success: res.success,
        message: res.success
          ? "Berhasil menambahkan Komponen"
          : "Gagal menambahkan Komponen",
      });
    }
    if (intent === "delete_material") {
      const payload = {
        id,
        deleted: 1,
      };

      const res = await API.SUPPLIER_COMMODITY.update({
        session: { user, token },
        req: { body: payload },
      });
      return Response.json({
        success: res.success,
        message: res.success
          ? "Berhasil menghapus Komponen"
          : "Gagal menghapus Komponen",
      });
    }
    return Response.json({ success: false, message: "Unknown intent" });
  } catch (error: any) {
    console.error("Finance action error:", error);
    return Response.json({
      success: false,
      message: error.message || "An error occurred",
    });
  }
};

const StockPage: React.FC<StockPageProps> = ({
  //   materials = [],
  //   shops = [],
  //   transactions = [],
  //   products = [],
  onUpdateMaterials = () => {},
  //   onUpdateShops = () => {},
  onUpdateTransactions = () => {},
  //   onUpdateProducts = () => {},
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: suppliers, reload: reloadSuppliers } = useFetcherData({
    endpoint: nexus()
      .module("SUPPLIER")
      .action("get")
      .params({
        page: 0,
        size: 100,
        pagination: "true",
      })
      .build(),
  });
  const { data: supplier_commodities, reload: reloadSupplierCommodities } =
    useFetcherData({
      endpoint: nexus()
        .module("SUPPLIER_COMMODITY")
        .action("get")
        .params({
          page: 0,
          size: 100,
          level: 1,
          pagination: "true",
        })
        .build(),
    });

  const { data: getProducts, reload: reloadProducts } = useFetcherData({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({
        page: 0,
        size: 100,
        pagination: "true",
      })
      .build(),
  });
  const { data: getTrx, reload: reloadTrx } = useFetcherData({
    endpoint: nexus()
      .module("ACCOUNT_MUTATION")
      .action("get")
      .params({
        page: 0,
        size: 100,
        pagination: "true",
      })
      .build(),
  });

  const shops: Shop[] = suppliers?.data?.items || [];
  const materials: Shop[] = supplier_commodities?.data?.items || [];
  const products: Shop[] = getProducts?.data?.items || [];
  const transactions: Shop[] = getTrx?.data?.items || [];

  // 3. Actions & Handlers
  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  useEffect(() => {
    if (actionData?.success) {
      reloadSuppliers();
      toast.success(
        actionData?.message || actionData?.error_message || "Berhasil"
      );
    }
  }, [actionData]);

  // --- SINGLE SOURCE OF TRUTH STATE ---
  const [state, setState] = useState<StockPageState>({
    activeCategory: "id_card_with_lanyard",
    subTab: "belanja",
    editingShopId: null,
    editingMatId: null,
    zoomedImage: null,
    isProcessing: false,
    hppRecipes: {},
    showAddShop: false,
    newShop: { type: "online" },
    showAddMat: false,
    newMat: { unit: "pcs", is_package: 0, is_affected_side: 1 },
    tempSubComponents: [],
    selectedShopId: "",
    restockInputs: {},
    mDiscountStr: "",
    mAdminStr: "",
    mShippingStr: "",
    restockProof: "",
    manualMatId: "",
    manualSubId: "",
    manualQty: "",
  });

  // Helper untuk update state parsial
  const updateState = (updates: Partial<StockPageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // --- MEMOIZED DATA ---
  const currentShops = useMemo(
    () => shops.filter((s) => s.category === state.activeCategory),
    [shops, state.activeCategory]
  );

  const currentMaterials = useMemo(
    () => materials.filter((m) => m.category === state.activeCategory),
    [materials, state.activeCategory]
  );

  const selectedManualMat: any = useMemo(
    () => materials.find((m) => m.id === state.manualMatId),
    [materials, state.manualMatId]
  );

  // --- LOGIC: CAPACITY (AKUMULATIF) ---
  const analysis = useMemo(() => {
    if (currentMaterials.length === 0)
      return { cap1: 0, cap2: 0, groupedBottlenecks: [] };

    let totalCap1 = 0;
    let totalCap2 = 0;
    const groups: any[] = [];

    currentMaterials.forEach((m: any) => {
      const itemDetails: any[] = [];
      let groupMinCap = Infinity;

      if (m.is_package && safeParseArray(m.sub_components).length > 0) {
        safeParseArray(m.sub_components).forEach((sub: any) => {
          const yieldVal = Number(sub.capacity_per_unit || 0);
          const stockVal = Number(sub.current_stock || 0);
          const c1 = Math.floor(stockVal * yieldVal);
          const c2 = m.is_affected_side
            ? Math.floor(stockVal * (yieldVal / 2))
            : c1;

          totalCap1 += c1;
          totalCap2 += c2;
          if (c1 < groupMinCap) groupMinCap = c1;
          itemDetails.push({ name: sub.name, stock: stockVal, cap1Sisi: c1 });
        });
      } else {
        const yieldVal = Number(m.capacity_per_unit || 0);
        const stockVal = Number(m.current_stock || 0);
        const c1 = Math.floor(stockVal * yieldVal);
        const c2 = m.is_affected_side
          ? Math.floor(stockVal * (yieldVal / 2))
          : c1;

        totalCap1 += c1;
        totalCap2 += c2;
        groupMinCap = c1;
        itemDetails.push({ name: "Utama", stock: stockVal, cap1Sisi: c1 });
      }

      groups.push({
        id: m.id,
        parentName: m.commodity_name,
        unit: m.unit,
        minCap: groupMinCap === Infinity ? 0 : groupMinCap,
        details: itemDetails,
      });
    });

    return {
      cap1: totalCap1,
      cap2: totalCap2,
      groupedBottlenecks: groups.sort((a, b) => a.minCap - b.minCap),
    };
  }, [currentMaterials]);

  // --- HANDLERS: SHOP ---
  const handleEditShop = (shop: Shop) => {
    updateState({
      editingShopId: shop.id,
      newShop: { ...shop },
      showAddShop: true,
    });
  };

  const handleSaveShop = () => {
    if (state.editingShopId) {
      submitAction({
        intent: "update_supplier",
        id: state.editingShopId,
        data: JSON.stringify(state.newShop),
      });
    } else {
      submitAction({
        intent: "create_supplier",
        data: JSON.stringify(state.newShop),
      });
    }
    // if (!state.newShop.name) return;
    // if (state.editingShopId) {
    //   onUpdateShops(
    //     shops.map((s) =>
    //       s.id === state.editingShopId
    //         ? ({ ...s, ...state.newShop } as Shop)
    //         : s
    //     )
    //   );
    // } else {
    //   onUpdateShops([
    //     ...shops,
    //     {
    //       id: "shop-" + Date.now(),
    //       name: state.newShop.name!,
    //       location: state.newShop.location || "-",
    //       type: state.newShop.type as any,
    //       phone: state.newShop.phone,
    //       external_link: state.newShop.external_link,
    //       category: state.activeCategory,
    //     },
    //   ]);
    // }
    // updateState({
    //   newShop: { type: "Online" },
    //   showAddShop: false,
    //   editingShopId: null,
    // });
  };

  // --- HANDLERS: MATERIAL ---
  const handleEditMat = (mat: RawMaterial) => {
    updateState({
      editingMatId: mat.id,
      newMat: { ...mat, sub_components: safeParseArray(mat.sub_components) },
      tempSubComponents: safeParseArray(mat.sub_components),
      //   tempSubComponents: mat.subComponents ? [...mat.subComponents] : [],
      showAddMat: true,
    });
  };

  const handleAddSubComp = () => {
    updateState({
      tempSubComponents: [
        ...state.tempSubComponents,
        {
          id: "sub-" + Date.now() + "-" + Math.random(),
          name: "",
          capacity_per_unit: 0,
          current_stock: 0,
        },
      ],
    });
  };

  const handleSaveMat = () => {
    if (state.editingMatId) {
      submitAction({
        intent: "update_material",
        id: state.editingMatId,
        data: JSON.stringify(state.newMat),
        sub_components: JSON.stringify(state.newMat.sub_components),
        // sub_components: JSON.stringify(state.tempSubComponents),
      });
    } else {
      submitAction({
        intent: "create_material",
        data: JSON.stringify(state.newMat),
        sub_components: JSON.stringify(state.newMat.sub_components),
      });
    }
  };

  // --- HANDLERS: RESTOCK (BELANJA) ---
  const handleProcessBelanja = () => {
    if (state.isProcessing) return;
    let totalBase = 0;
    let itemsStr: string[] = [];
    const newMaterials = JSON.parse(JSON.stringify(materials));

    const inputs = Object.entries(state.restockInputs) as [string, number][];
    if (inputs.length === 0 || inputs.every(([_, q]) => q <= 0)) {
      alert("Masukkan setidaknya satu jumlah pembelian.");
      return;
    }

    updateState({ isProcessing: true });

    inputs.forEach(([inputKey, qty]) => {
      if (qty <= 0) return;
      const isSub = inputKey.startsWith("sub:");
      const id = isSub ? inputKey.replace("sub:", "") : inputKey;

      if (isSub) {
        newMaterials.forEach((m: RawMaterial) => {
          if (m.is_package && safeParseArray(m.sub_components).length > 0) {
            const sub: any = safeParseArray(m.sub_components).find(
              (s: any) => s.id === id
            );
            if (sub) {
              sub.current_stock = Number(sub.current_stock || 0) + Number(qty);
              totalBase += Number(m.unit_price) * Number(qty);
              itemsStr.push(`${m.name} [${sub.name}] (x${qty})`);
            }
          }
        });
      } else {
        const m = newMaterials.find((x: any) => x.id === id);
        if (m && !m.is_package) {
          m.current_stock = Number(m.current_stock || 0) + Number(qty);
          totalBase += Number(m.unit_price) * Number(qty);
          itemsStr.push(`${m.name} (x${qty})`);
        }
      }
    });

    const disc = parseCurrency(state.mDiscountStr);
    const admin = parseCurrency(state.mAdminStr);
    const ship = parseCurrency(state.mShippingStr);
    const finalTotal = totalBase + admin + ship - disc;
    const shopName =
      shops.find((s) => s.id === state.selectedShopId)?.name || "Supplier";

    const historyDesc = `Belanja di ${shopName}: ${itemsStr.join(", ")} | DISK:${disc} | ADMIN:${admin} | ONGK:${ship} | TOTAL:${finalTotal}`;

    onUpdateTransactions([
      {
        id: "tx-" + Date.now(),
        date: new Date().toISOString(),
        type: "Expense",
        category: "Bahan Baku",
        amount: finalTotal,
        description: historyDesc,
        isAuto: true,
        proofImage: state.restockProof,
      },
      ...transactions,
    ]);

    onUpdateMaterials(newMaterials);

    // Reset Form Belanja Total
    updateState({
      restockInputs: {},
      mDiscountStr: "",
      mAdminStr: "",
      mShippingStr: "",
      restockProof: "",
      selectedShopId: "",
      isProcessing: false,
    });
    alert("Belanja berhasil dicatat!");
  };

  const renderHistoryDescription = (desc: string) => {
    if (desc.includes("DISK:")) {
      const parts = desc.split(" | ");
      const mainInfo = parts[0];
      const discVal =
        parts.find((p) => p.startsWith("DISK:"))?.split(":")[1] || "0";
      const adminVal =
        parts.find((p) => p.startsWith("ADMIN:"))?.split(":")[1] || "0";
      const ongkVal =
        parts.find((p) => p.startsWith("ONGK:"))?.split(":")[1] || "0";
      const totalVal =
        parts.find((p) => p.startsWith("TOTAL:"))?.split(":")[1] || "0";

      return (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-800 leading-tight">
            {mainInfo}
          </div>
          <div className="grid grid-cols-1 gap-0.5 pt-1 border-t border-gray-100">
            <div className="flex justify-between text-[10px] font-black text-green-600">
              <span>Diskon</span>
              <span>: {formatCurrency(Number(discVal))}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-gray-400">
              <span>Admin</span>
              <span>: {formatCurrency(Number(adminVal))}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-red-500">
              <span>Ongkir</span>
              <span>: {formatCurrency(Number(ongkVal))}</span>
            </div>
            <div className="flex justify-between text-xs font-black text-blue-700 pt-1 mt-1 border-t border-dashed border-gray-200">
              <span>Total</span>
              <span>: {formatCurrency(Number(totalVal))}</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="text-xs font-bold text-gray-700 leading-relaxed">
        {desc}
      </div>
    );
  };

  // --- HPP SIMULATOR HELPERS ---
  const toggleHppComponent = (recipeKey: string, matId: string) => {
    const current = state.hppRecipes[recipeKey] || [];
    let updated;
    if (current.includes(matId)) {
      updated = current.filter((id) => id !== matId);
    } else {
      updated = [...current, matId];
    }
    updateState({
      hppRecipes: { ...state.hppRecipes, [recipeKey]: updated },
    });
  };

  const calculateHppForVariation = (recipeKey: string, is2Sisi: boolean) => {
    const selectedIds = state.hppRecipes[recipeKey] || [];
    return selectedIds.reduce((sum, id) => {
      const m: any = materials.find((x) => x.id === id);
      if (!m) return sum;
      let baseYield = Number(m.capacity_per_unit || 0);
      if (+m.is_package === 1 && safeParseArray(m.sub_components).length > 0) {
        baseYield = Math.min(
          ...safeParseArray(m.sub_components).map((s: any) =>
            Number(s.capacity_per_unit || 0)
          )
        );
      }
      if (baseYield <= 0) return sum;
      const effectiveYield =
        +m.is_affected_side === 1 && is2Sisi ? baseYield / 2 : baseYield;
      return sum + Number(m.unit_price || 0) / effectiveYield;
    }, 0);
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      {/* Category Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-fit overflow-x-auto max-w-full">
        {["id_card_with_lanyard", "Produk 2", "Produk 3"].map((cat) => (
          <button
            key={cat}
            onClick={() =>
              updateState({ activeCategory: cat, subTab: "belanja" })
            }
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition whitespace-nowrap ${state.activeCategory === cat ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Layout size={18} /> {cat?.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Sub Navigation */}
        <div className="flex border-b border-gray-200 gap-8 overflow-x-auto no-scrollbar">
          {[
            { id: "belanja", label: "Belanja & Stok", icon: ShoppingCart },
            { id: "toko", label: "Supplier", icon: Store },
            { id: "komponen", label: "Komponen Produk", icon: Layers },
            {
              id: "kapasitas",
              label: "Kapasitas & Estimasi",
              icon: Calculator,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => updateState({ subTab: tab.id as any })}
              className={`pb-4 text-sm font-bold flex items-center gap-2 transition relative whitespace-nowrap ${state.subTab === tab.id ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <tab.icon size={18} /> {tab.label}
              {state.subTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {state.activeCategory !== "id_card_with_lanyard" ? (
            <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[40px] border border-gray-200 shadow-sm text-gray-400">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Settings size={48} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                {state.activeCategory}
              </h3>
              <p className="text-sm font-bold opacity-60">
                Modul ini masih dalam tahap pengembangan.
              </p>
            </div>
          ) : (
            <>
              {/* --- TAB BELANJA --- */}
              {state.subTab === "belanja" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-blue-50/20">
                        <h3 className="font-black text-gray-800 flex items-center gap-3">
                          <ShoppingCart size={22} className="text-blue-600" />{" "}
                          FORM BELANJA BAHAN
                        </h3>
                      </div>
                      <div className="p-8 space-y-6">
                        <select
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-blue-400 outline-none"
                          value={state.selectedShopId}
                          onChange={(e) =>
                            updateState({
                              selectedShopId: e.target.value,
                              restockInputs: {},
                            })
                          }
                        >
                          <option value="">-- Pilih Toko Supplier --</option>
                          {currentShops.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.type})
                            </option>
                          ))}
                        </select>

                        {state.selectedShopId && (
                          <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 gap-4">
                              {currentMaterials
                                .filter(
                                  (m: any) =>
                                    m.supplier_id === state.selectedShopId
                                )
                                .map((m: any) => (
                                  <div
                                    key={m.id}
                                    className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"
                                  >
                                    <div className="p-4 bg-gray-100/50 flex items-center justify-between border-b border-gray-100">
                                      <div className="font-black text-gray-800 text-sm">
                                        {m.commodity_name}
                                      </div>
                                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {formatCurrency(m.unit_price)} /{" "}
                                        {m.unit}
                                      </div>
                                    </div>
                                    <div className="p-4">
                                      {m.is_package &&
                                      safeParseArray(m.sub_components).length >
                                        0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {safeParseArray(m.sub_components).map(
                                            (sub: any) => (
                                              <div
                                                key={sub.id}
                                                className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100"
                                              >
                                                <span className="text-xs font-bold text-gray-600 pl-2">
                                                  {sub.commodity_name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="number"
                                                    className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-center text-xs font-black no-spinners"
                                                    placeholder="0"
                                                    value={
                                                      state.restockInputs[
                                                        `sub:${sub.id}`
                                                      ] || ""
                                                    }
                                                    onChange={(e) =>
                                                      updateState({
                                                        restockInputs: {
                                                          ...state.restockInputs,
                                                          [`sub:${sub.id}`]:
                                                            Number(
                                                              e.target.value
                                                            ),
                                                        },
                                                      })
                                                    }
                                                  />
                                                  <span className="text-[9px] font-bold text-gray-400 uppercase pr-2">
                                                    {m.unit}
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500 font-medium">
                                            Input Jumlah Pembelian:
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              className="w-24 bg-white border border-gray-200 rounded-xl p-2 text-center text-sm font-black shadow-sm no-spinners"
                                              placeholder="0"
                                              value={
                                                state.restockInputs[m.id] || ""
                                              }
                                              onChange={(e) =>
                                                updateState({
                                                  restockInputs: {
                                                    ...state.restockInputs,
                                                    [m.id]: Number(
                                                      e.target.value
                                                    ),
                                                  },
                                                })
                                              }
                                            />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                              {m.unit}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">
                                Bukti Transaksi & Detail Pembayaran
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                                    Rp
                                  </span>
                                  <input
                                    type="text"
                                    className="w-full border-2 border-white rounded-2xl p-4 pl-12 text-sm font-black bg-white shadow-sm"
                                    value={state.mDiscountStr}
                                    onChange={(e) =>
                                      updateState({
                                        mDiscountStr: formatNumberInput(
                                          e.target.value
                                        ),
                                      })
                                    }
                                    placeholder="Diskon"
                                  />
                                </div>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                                    Rp
                                  </span>
                                  <input
                                    type="text"
                                    className="w-full border-2 border-white rounded-2xl p-4 pl-12 text-sm font-black bg-white shadow-sm"
                                    value={state.mAdminStr}
                                    onChange={(e) =>
                                      updateState({
                                        mAdminStr: formatNumberInput(
                                          e.target.value
                                        ),
                                      })
                                    }
                                    placeholder="Admin"
                                  />
                                </div>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                                    Rp
                                  </span>
                                  <input
                                    type="text"
                                    className="w-full border-2 border-white rounded-2xl p-4 pl-12 text-sm font-black bg-white shadow-sm"
                                    value={state.mShippingStr}
                                    onChange={(e) =>
                                      updateState({
                                        mShippingStr: formatNumberInput(
                                          e.target.value
                                        ),
                                      })
                                    }
                                    placeholder="Ongkir"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed transition font-black text-sm ${state.restockProof ? "border-blue-400 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-400 hover:border-blue-200"}`}
                                >
                                  {state.restockProof ? (
                                    <Check size={20} />
                                  ) : (
                                    <Upload size={20} />
                                  )}
                                  {state.restockProof
                                    ? "BUKTI TERUPLOAD"
                                    : "UPLOAD BUKTI TRANSAKSI"}
                                </button>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      const r = new FileReader();
                                      r.onload = () =>
                                        updateState({
                                          restockProof: r.result as string,
                                        });
                                      r.readAsDataURL(e.target.files[0]);
                                    }
                                  }}
                                />
                                {state.restockProof && (
                                  <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden relative group">
                                    <img
                                      src={state.restockProof}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      onClick={() =>
                                        updateState({ restockProof: "" })
                                      }
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="bg-gray-900 rounded-[32px] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                              <h4 className="text-4xl font-black">
                                {formatCurrency(
                                  (
                                    Object.entries(state.restockInputs) as [
                                      string,
                                      number,
                                    ][]
                                  ).reduce((sum, [key, qty]) => {
                                    const id = key.startsWith("sub:")
                                      ? key.replace("sub:", "")
                                      : key;
                                    const m: any = materials.find(
                                      (mat: any) =>
                                        mat.id === id ||
                                        safeParseArray(
                                          mat.sub_components
                                        )?.some((s: any) => s.id === id)
                                    );
                                    return (
                                      sum +
                                      Number(m?.unit_price || 0) * Number(qty)
                                    );
                                  }, 0) +
                                    parseCurrency(state.mAdminStr) +
                                    parseCurrency(state.mShippingStr) -
                                    parseCurrency(state.mDiscountStr)
                                )}
                              </h4>
                              <button
                                onClick={handleProcessBelanja}
                                disabled={
                                  state.isProcessing ||
                                  Object.keys(state.restockInputs).length === 0
                                }
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition"
                              >
                                <Check size={24} />{" "}
                                {state.isProcessing
                                  ? "PROSESING..."
                                  : "PROSES & CATAT"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-orange-50/20">
                        <h3 className="font-black text-gray-800 flex items-center gap-3">
                          <PlusCircle size={22} className="text-orange-500" />{" "}
                          TAMBAH BAHAN MANUAL
                        </h3>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <select
                            className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-white"
                            value={state.manualMatId}
                            onChange={(e) =>
                              updateState({
                                manualMatId: e.target.value,
                                manualSubId: "",
                              })
                            }
                          >
                            <option value="">-- Pilih Komponen --</option>
                            {currentMaterials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.commodity_name}
                              </option>
                            ))}
                          </select>
                          {+(selectedManualMat as any)?.is_package === 1 && (
                            <select
                              className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-white"
                              value={state.manualSubId}
                              onChange={(e) =>
                                updateState({ manualSubId: e.target.value })
                              }
                            >
                              <option value="">-- Warna/Isi --</option>
                              {safeParseArray(
                                (selectedManualMat as any).sub_components
                              )?.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="relative flex-1 w-full">
                            <input
                              type="number"
                              className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold no-spinners"
                              placeholder="Jumlah"
                              value={state.manualQty}
                              onChange={(e) =>
                                updateState({ manualQty: e.target.value })
                              }
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">
                              {selectedManualMat?.unit || "UNIT"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (!state.manualMatId || !state.manualQty)
                                return alert("Lengkapi data.");
                              const qtyNum = Number(state.manualQty);
                              const newMaterials = materials.map((m: any) => {
                                if (m.id === state.manualMatId) {
                                  if (m.is_package && state.manualSubId) {
                                    const subs =
                                      safeParseArray(m.sub_components)?.map(
                                        (s: any) =>
                                          s.id === state.manualSubId
                                            ? {
                                                ...s,
                                                current_stock:
                                                  Number(s.current_stock || 0) +
                                                  qtyNum,
                                              }
                                            : s
                                      ) || [];
                                    return { ...m, sub_components: subs };
                                  } else if (!m.is_package) {
                                    return {
                                      ...m,
                                      current_stock:
                                        (Number(m.current_stock) || 0) + qtyNum,
                                    };
                                  }
                                }
                                return m;
                              });
                              onUpdateTransactions([
                                {
                                  id: "man-" + Date.now(),
                                  date: new Date().toISOString(),
                                  type: "Income",
                                  category: "Bahan Baku",
                                  amount: 0,
                                  description: `Tambah Manual ${selectedManualMat?.commodity_name} ${state.manualSubId ? "[" + (safeParseArray(selectedManualMat?.sub_components as any)?.find((s: any) => s.id === state.manualSubId) as any)?.commodity_name + "]" : ""}: ${state.manualQty} ${selectedManualMat?.unit}`,
                                  isAuto: true,
                                },
                                ...transactions,
                              ]);
                              onUpdateMaterials(newMaterials);
                              updateState({
                                manualQty: "",
                                manualMatId: "",
                                manualSubId: "",
                              });
                              alert("Stok manual ditambahkan.");
                            }}
                            disabled={!state.manualMatId || !state.manualQty}
                            className="w-full md:w-auto bg-orange-500 text-white px-10 py-4 rounded-2xl font-black hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Check size={20} /> SUBMIT STOK
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-[40px] p-8 border border-gray-200 shadow-sm">
                      <h4 className="font-black text-gray-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <Box size={18} className="text-purple-600" /> Riwayat
                        Stok Terakhir
                      </h4>
                      <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 no-scrollbar">
                        {transactions
                          .filter((t) => t.category === "Bahan Baku")
                          .slice(0, 10)
                          .map((t) => (
                            <div
                              key={t.id}
                              className="p-4 border border-gray-50 rounded-2xl bg-gray-50/50 group relative"
                            >
                              <div className="text-[10px] font-black text-gray-400 uppercase mb-1">
                                {new Date(t.date).toLocaleString()}
                              </div>
                              {renderHistoryDescription(t.description)}
                              <div className="flex justify-end items-end mt-2">
                                {t.proofImage && (
                                  <button
                                    onClick={() =>
                                      updateState({
                                        zoomedImage: t.proofImage!,
                                      })
                                    }
                                    className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:scale-110 transition flex-shrink-0"
                                  >
                                    <img
                                      src={t.proofImage}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB SUPPLIER --- */}
              {state.subTab === "toko" && (
                <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-black text-gray-800 text-lg uppercase">
                      Database Supplier Terdaftar
                    </h3>
                    <button
                      onClick={() =>
                        updateState({
                          showAddShop: !state.showAddShop,
                          editingShopId: null,
                          newShop: { type: "online" },
                        })
                      }
                      className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition"
                    >
                      <Plus size={18} /> TAMBAH SUPPLIER
                    </button>
                  </div>

                  {state.showAddShop && (
                    <div className="p-8 bg-gray-50 border-b border-gray-100 animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <input
                        placeholder="Nama Toko..."
                        className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                        value={state.newShop.name || ""}
                        onChange={(e) =>
                          updateState({
                            newShop: { ...state.newShop, name: e.target.value },
                          })
                        }
                      />
                      <input
                        placeholder="Lokasi (e.g. Jakarta)"
                        className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                        value={state.newShop.location || ""}
                        onChange={(e) =>
                          updateState({
                            newShop: {
                              ...state.newShop,
                              location: e.target.value,
                            },
                          })
                        }
                      />
                      <select
                        className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                        value={state.newShop.type}
                        onChange={(e) =>
                          updateState({
                            newShop: {
                              ...state.newShop,
                              type: e.target.value as any,
                            },
                          })
                        }
                        required
                      >
                        <option value="">Pilih Tipe</option>
                        <option value="online">Online Shop</option>
                        <option value="offline">Offline / Toko Fisik</option>
                      </select>
                      <div className="flex gap-2">
                        <input
                          placeholder={
                            state.newShop.type === "online"
                              ? "Link Toko"
                              : "Nomor WhatsApp"
                          }
                          className="flex-1 border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                          value={
                            state.newShop.type === "online"
                              ? state.newShop.external_link || ""
                              : state.newShop.phone || ""
                          }
                          onChange={(e) =>
                            state.newShop.type === "online"
                              ? updateState({
                                  newShop: {
                                    ...state.newShop,
                                    external_link: e.target.value,
                                  },
                                })
                              : updateState({
                                  newShop: {
                                    ...state.newShop,
                                    phone: e.target.value,
                                  },
                                })
                          }
                        />
                        <button
                          onClick={handleSaveShop}
                          className="px-6 bg-blue-600 text-white rounded-2xl font-black transition"
                        >
                          <Check size={20} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
                    {currentShops.map((s) => (
                      <div
                        key={s.id}
                        className="p-8 border border-gray-100 rounded-[40px] hover:border-blue-400 transition bg-white shadow-sm group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-black text-gray-800 text-xl uppercase leading-tight">
                            {s.name}
                          </h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleEditShop(s)}
                              className="text-blue-400 hover:text-blue-600 p-2 bg-blue-50 rounded-xl"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: "Hapus Supplier?",
                                  text: `Yakin ingin menghapus ${s.name}?`,
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
                                    submitAction({
                                      intent: "delete_supplier",
                                      id: s.id,
                                    });
                                  }
                                });
                              }}
                              className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-xl"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3 text-xs text-gray-500 font-bold uppercase">
                          <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-gray-400" />{" "}
                            {s.location || "-"}
                          </div>
                          {s.phone && (
                            <a
                              href={`https://wa.me/${s.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              className="flex items-center gap-3 text-green-600 font-black hover:underline"
                            >
                              <Phone size={16} className="text-green-500" />{" "}
                              {s.phone}
                            </a>
                          )}
                          {s.external_link && (
                            <a
                              href={s.external_link}
                              target="_blank"
                              className="flex items-center gap-3 text-blue-500 font-black hover:underline truncate"
                            >
                              <ExternalLink
                                size={16}
                                className="text-blue-400"
                              />{" "}
                              Buka Link Toko
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAB KOMPONEN --- */}
              {state.subTab === "komponen" && (
                <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-black text-gray-800 text-lg uppercase">
                      Katalog Komponen {state.activeCategory}
                    </h3>
                    <button
                      onClick={() =>
                        updateState({
                          showAddMat: !state.showAddMat,
                          editingMatId: null,
                          newMat: {
                            unit: "pcs",
                            is_package: 0,
                            is_affected_side: 1,
                          },
                          tempSubComponents: [],
                        })
                      }
                      className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition"
                    >
                      <Plus size={18} /> TAMBAH KOMPONEN
                    </button>
                  </div>

                  {state.showAddMat && (
                    <div className="p-8 bg-white border-b border-gray-100 animate-fade-in space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <input
                            placeholder="Nama Induk Komponen"
                            className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400"
                            value={(state.newMat as any)?.commodity_name || ""}
                            onChange={(e) =>
                              updateState({
                                newMat: {
                                  ...state.newMat,
                                  name: e.target.value,
                                },
                              })
                            }
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <select
                              className="border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-white"
                              value={state.newMat.unit}
                              onChange={(e) =>
                                updateState({
                                  newMat: {
                                    ...state.newMat,
                                    unit: e.target.value as any,
                                  },
                                })
                              }
                            >
                              <option value="pcs">Pcs</option>
                              <option value="roll">Roll</option>
                              <option value="liter">Liter</option>
                              <option value="pack">Pack</option>
                              <option value="lembar">Lembar</option>
                            </select>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                Rp
                              </span>
                              <input
                                type="text"
                                placeholder={`Harga / ${state.newMat.unit?.toUpperCase() || "UNIT"}`}
                                className="w-full border-2 border-gray-100 p-4 pl-9 rounded-2xl text-sm font-bold"
                                value={formatNumberInput(
                                  +(state.newMat.unit_price?.toString() || "0")
                                )}
                                onChange={(e) =>
                                  updateState({
                                    newMat: {
                                      ...state.newMat,
                                      unit_price: parseCurrency(e.target.value),
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                          <select
                            className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-white"
                            value={state.newMat.supplier_id}
                            onChange={(e) =>
                              updateState({
                                newMat: {
                                  ...state.newMat,
                                  supplier_id: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="">-- Pilih Supplier --</option>
                            {currentShops.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 h-[60px]">
                            <input
                              id="is_package"
                              type="checkbox"
                              className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={+(state.newMat as any)?.is_package === 1}
                              onChange={(e) => {
                                updateState({
                                  newMat: {
                                    ...state.newMat,
                                    is_package: e.target.checked ? 1 : 0,
                                  },
                                });
                                if (
                                  e.target.checked &&
                                  safeParseArray(
                                    (state.newMat as any)?.sub_components
                                  )?.length === 0
                                )
                                  handleAddSubComp();
                              }}
                            />
                            <label
                              htmlFor="is_package"
                              className="text-xs font-black text-gray-600 cursor-pointer uppercase"
                            >
                              PAKET KOMPONEN
                            </label>
                          </div>
                        </div>
                      </div>

                      {state.newMat.is_package ? (
                        <div className="bg-blue-50/50 p-8 rounded-[40px] space-y-4 border border-blue-100">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">
                              PENGATURAN PAKET (SATUAN:{" "}
                              {state.newMat.unit?.toUpperCase()})
                            </h4>
                            <button
                              onClick={handleAddSubComp}
                              className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-full"
                            >
                              + TAMBAH KOMPONEN
                            </button>
                          </div>
                          {safeParseArray(state.newMat.sub_components).map(
                            (sub: any, i) => (
                              <div
                                key={sub.id}
                                className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-blue-50 shadow-sm animate-fade-in"
                              >
                                <input
                                  placeholder="Nama Komponen (e.g. Cyan)"
                                  className="md:col-span-2 border border-gray-200 p-3 rounded-xl text-sm font-bold"
                                  value={sub.commodity_name}
                                  onChange={(e) => {
                                    const n: any = [
                                      ...safeParseArray(
                                        (state.newMat as any)?.sub_components
                                      ),
                                    ];
                                    n[i].commodity_name = e.target.value;
                                    updateState({
                                      newMat: {
                                        ...state.newMat,
                                        sub_components: n,
                                      },
                                    });
                                  }}
                                />
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder="Kapasitas Produksi (Pcs)"
                                    className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold no-spinners"
                                    value={sub.capacity_per_unit || ""}
                                    onChange={(e) => {
                                      const n: any = [
                                        ...safeParseArray(
                                          (state.newMat as any)?.sub_components
                                        ),
                                      ];
                                      n[i].capacity_per_unit = Number(
                                        e.target.value
                                      );
                                      updateState({
                                        newMat: {
                                          ...state.newMat,
                                          sub_components: n,
                                        },
                                      });
                                    }}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase">
                                    Per {state.newMat.unit?.toUpperCase()}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    updateState({
                                      newMat: {
                                        ...state.newMat,
                                        sub_components: safeParseArray(
                                          (state.newMat as any)?.sub_components
                                        ).filter((_, idx) => idx !== i),
                                      },
                                    } as any)
                                  }
                                  className="text-red-400 hover:bg-red-50 rounded-xl transition flex items-center justify-center p-2"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                          <label className="text-[10px] font-black text-gray-400 block mb-3 uppercase tracking-widest">
                            Kapasitas Produksi (Pcs Jadi) Per 1{" "}
                            {state.newMat.unit?.toUpperCase()}
                          </label>
                          <div className="relative max-w-sm">
                            <input
                              type="number"
                              className="w-full border-2 border-gray-100 p-5 rounded-2xl text-lg font-black no-spinners"
                              value={state.newMat.capacity_per_unit || ""}
                              onChange={(e) =>
                                updateState({
                                  newMat: {
                                    ...state.newMat,
                                    capacity_per_unit: Number(e.target.value),
                                  },
                                })
                              }
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">
                              PCS JADI
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
                          <input
                            id="affectedSides"
                            type="checkbox"
                            className="w-6 h-6 rounded-lg border-blue-200 text-blue-600"
                            checked={
                              +(state as any).newMat.is_affected_side === 1
                            }
                            onChange={(e) =>
                              updateState({
                                newMat: {
                                  ...state.newMat,
                                  is_affected_side: e.target.checked ? 1 : 0,
                                },
                              })
                            }
                          />
                          <div className="flex-1">
                            <label
                              htmlFor="affectedSides"
                              className="text-sm font-black text-blue-800 cursor-pointer uppercase block mb-1"
                            >
                              DIPENGARUHI SISI CETAK (2 SISI)
                            </label>
                            <p className="text-[10px] text-blue-600 font-bold opacity-70">
                              Jika dicentang, hasil produksi akan terbagi 2
                              otomatis saat menghitung varian produk 2 sisi.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-end">
                          <button
                            onClick={handleSaveMat}
                            className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition"
                          >
                            {state.editingMatId
                              ? "SIMPAN PERUBAHAN"
                              : "SIMPAN KOMPONEN"}
                          </button>
                          <button
                            onClick={() =>
                              updateState({
                                showAddMat: false,
                                editingMatId: null,
                              })
                            }
                            className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition"
                          >
                            BATAL
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <tr>
                          <th className="px-8 py-5">Nama Induk & Paket</th>
                          <th className="px-8 py-5">Supplier</th>
                          <th className="px-8 py-5">Harga Beli</th>
                          <th className="px-8 py-5">Dipengaruhi Sisi Cetak</th>
                          <th className="px-8 py-5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentMaterials.map((m: any) => (
                          <tr
                            key={m.id}
                            className="hover:bg-gray-50/80 transition"
                          >
                            <td className="px-8 py-6">
                              <div className="font-black text-gray-800 text-base">
                                {m.commodity_name}
                              </div>
                              {+m.is_package === 1 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {safeParseArray(m.sub_components)?.map(
                                    (s: any) => (
                                      <span
                                        key={s.id}
                                        className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 shadow-sm"
                                      >
                                        {s.commodity_name}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">
                              {shops.find((s) => s.id === m.supplier_id)
                                ?.name || "-"}
                            </td>
                            <td className="px-8 py-6 font-black text-gray-700">
                              <div className="text-sm">
                                {formatCurrency(m.unit_price)}
                              </div>
                              <div className="text-[10px] text-gray-400 uppercase mt-0.5 font-bold tracking-widest">
                                Per {m.unit}
                              </div>
                            </td>
                            <td className="px-8 py-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">
                              {+m.is_affected_side === 1 ? "Ya" : "Tidak"}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEditMat(m)}
                                  className="text-blue-600 hover:bg-blue-100 p-2.5 bg-blue-50 rounded-2xl transition"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() =>
                                    Swal.fire({
                                      title: "Hapus Komponen?",
                                      text: `Yakin ingin menghapus ${m.commodity_name}?`,
                                      icon: "warning",
                                      showCancelButton: true,
                                      confirmButtonText: "Ya, Hapus",
                                      cancelButtonText: "Batal",
                                      customClass: {
                                        confirmButton: "bg-red-600 text-white",
                                        cancelButton:
                                          "bg-gray-200 text-gray-800",
                                      },
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        submitAction({
                                          intent: "delete_material",
                                          id: m.id,
                                        });
                                      }
                                    })
                                  }
                                  className="text-red-400 hover:bg-red-100 p-2.5 bg-red-50 rounded-2xl transition"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- TAB KAPASITAS --- */}
              {state.subTab === "kapasitas" && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2 opacity-80 tracking-[0.2em]">
                        Potensi Produksi {state.activeCategory}
                      </p>
                      <div className="space-y-4">
                        <div>
                          <div className="text-4xl font-black tracking-tighter">
                            {analysis.cap1.toLocaleString()}{" "}
                            <span className="text-sm font-bold text-gray-500 uppercase">
                              Pcs Jadi (1 Sisi)
                            </span>
                          </div>
                          <div className="text-2xl font-black tracking-tighter opacity-60 mt-1">
                            {analysis.cap2.toLocaleString()}{" "}
                            <span className="text-xs font-bold text-gray-500 uppercase">
                              Pcs Jadi (2 Sisi)
                            </span>
                          </div>
                        </div>
                      </div>
                      <Package
                        size={160}
                        className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition duration-500"
                      />
                    </div>

                    <div className="bg-white rounded-[40px] p-10 border border-gray-200 shadow-sm overflow-hidden">
                      <h4 className="text-sm font-black text-gray-400 uppercase mb-8 flex items-center gap-3 tracking-[0.1em]">
                        <Zap size={22} className="text-blue-600" /> Bottleneck
                        Bahan Baku
                      </h4>
                      <div className="space-y-10 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
                        {analysis.groupedBottlenecks.map((group) => (
                          <div key={group.id} className="space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                              <span className="text-xs font-black text-gray-800 uppercase tracking-tight">
                                {group.parentName}
                              </span>
                              {group.minCap === 0 && (
                                <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black">
                                  STOK KOSONG
                                </span>
                              )}
                            </div>
                            <div className="space-y-4 pl-4 border-l-2 border-gray-50">
                              {group.details.map((sub: any, i: number) => {
                                const isBottleneck =
                                  sub.cap1Sisi === group.minCap &&
                                  group.minCap > 0;
                                return (
                                  <div key={i} className="space-y-1">
                                    <div className="flex justify-between items-end">
                                      <div>
                                        <span
                                          className={`text-[10px] font-black uppercase ${sub.stock === 0 ? "text-red-500" : isBottleneck ? "text-orange-500" : "text-gray-400"}`}
                                        >
                                          {sub.name}
                                        </span>
                                        <div className="text-[10px] font-bold text-gray-400">
                                          Tersisa: {sub.stock.toLocaleString()}{" "}
                                          {group.unit}
                                        </div>
                                      </div>
                                      <div
                                        className={`text-xs font-black ${sub.stock === 0 ? "text-red-600" : "text-gray-600"}`}
                                      >
                                        {sub.cap1Sisi.toLocaleString()}{" "}
                                        <span className="text-[8px]">PCS</span>
                                      </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-1000 ${sub.stock === 0 ? "bg-red-500" : isBottleneck ? "bg-orange-400" : "bg-blue-400"}`}
                                        style={{
                                          width: `${Math.min(100, (sub.cap1Sisi / (analysis.cap1 || 1)) * 100)}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* --- ESTIMASI HPP VARIABEL SECTION --- */}
                  <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden mt-8">
                    <div className="p-10 border-b border-gray-100 bg-emerald-50/30 flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                          <Calculator size={28} className="text-emerald-600" />{" "}
                          KALKULATOR HPP VARIABEL
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase mt-2">
                          Pilih komponen pendukung untuk menghitung estimasi
                          modal produksi setiap varian produk.
                        </p>
                      </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        {products.map((prod: any) => (
                          <div
                            key={prod.id}
                            className="bg-gray-50 rounded-[32px] border border-gray-100 p-6 space-y-4"
                          >
                            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-200 text-emerald-600 shadow-sm">
                                <Package size={24} />
                              </div>
                              <h4 className="font-black text-gray-800 text-lg uppercase tracking-tight">
                                {prod.name}
                              </h4>
                            </div>

                            <div className="space-y-3">
                              {safeParseArray(prod.product_variants).map(
                                (vari: any, vIdx) => {
                                  const recipeKey = `${prod.id}-${vari.variant_name}`;
                                  const is2Sisi = vari.variant_name
                                    ?.toLowerCase()
                                    .includes("2 sisi");
                                  const estimatedHpp = calculateHppForVariation(
                                    recipeKey,
                                    is2Sisi
                                  );

                                  return (
                                    <div
                                      key={vIdx}
                                      className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col gap-4 transition-all hover:border-emerald-200"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
                                            Pilih Komponen Bahan:
                                          </span>
                                          <h5 className="font-black text-gray-800 text-base">
                                            {vari.variant_name}
                                          </h5>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                            Estimasi HPP
                                          </span>
                                          <div className="text-xl font-black text-emerald-600">
                                            {formatCurrency(estimatedHpp)}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="border-t border-gray-100 pt-4">
                                        <div className="flex flex-wrap gap-2">
                                          {currentMaterials.map((mat) => {
                                            const isChecked = (
                                              state.hppRecipes[recipeKey] || []
                                            ).includes(mat.id);
                                            return (
                                              <button
                                                key={mat.id}
                                                onClick={() =>
                                                  toggleHppComponent(
                                                    recipeKey,
                                                    mat.id
                                                  )
                                                }
                                                className={`px-4 py-2 rounded-full text-[10px] font-black transition flex items-center gap-2 border ${isChecked ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-400 hover:border-emerald-200 hover:text-emerald-400"}`}
                                              >
                                                {isChecked ? (
                                                  <Check size={12} />
                                                ) : (
                                                  <Plus size={12} />
                                                )}
                                                {mat.name?.toUpperCase()}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        ))}
                        {products.length === 0 && (
                          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200 text-gray-400 font-bold">
                            Belum ada produk yang terdaftar.
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl sticky top-24">
                          <h4 className="font-black text-emerald-400 text-lg mb-6 flex items-center gap-3">
                            <Info size={20} /> CATATAN PENGHITUNGAN
                          </h4>
                          <div className="space-y-6 text-sm">
                            <div className="flex gap-4">
                              <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                                1
                              </div>
                              <p className="text-gray-300 leading-relaxed">
                                HPP per pcs dihitung dari <b>Harga Beli</b>{" "}
                                dibagi <b>Kapasitas Produksi Jadi</b> komponen
                                yang Anda pilih di checklist.
                              </p>
                            </div>
                            <div className="flex gap-4">
                              <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                                2
                              </div>
                              <p className="text-gray-300 leading-relaxed">
                                Jika varian produk mengandung kata{" "}
                                <b>"2 Sisi"</b> dan komponen ditandai{" "}
                                <b>"Dipengaruhi Sisi Cetak"</b>, modal komponen
                                akan dikalikan 2 otomatis.
                              </p>
                            </div>
                            <div className="flex gap-4">
                              <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                                3
                              </div>
                              <p className="text-gray-300 leading-relaxed">
                                Untuk material <b>Paketan</b>, kalkulator
                                menggunakan kapasitas terkecil dari isi paket
                                sebagai dasar perhitungan yield.
                              </p>
                            </div>
                          </div>

                          <div className="mt-10 pt-10 border-t border-white/10">
                            <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                              Statistik Bahan Baku
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                  Total Komponen
                                </span>
                                <span className="text-2xl font-black">
                                  {currentMaterials.length}
                                </span>
                              </div>
                              <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                  Total Produk
                                </span>
                                <span className="text-2xl font-black">
                                  {products.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {state.zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in no-print"
          onClick={() => updateState({ zoomedImage: null })}
        >
          <button
            onClick={() => updateState({ zoomedImage: null })}
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition"
          >
            <X size={32} />
          </button>
          <img
            src={state.zoomedImage}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .no-spinners::-webkit-outer-spin-button, .no-spinners::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          .no-spinners { -moz-appearance: textfield; }
          .animate-spin-slow { animation: spin 8s linear infinite; }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
      `}</style>
    </div>
  );
};

export default StockPage;
