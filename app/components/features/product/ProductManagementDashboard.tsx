import React, { useState, useMemo } from "react";
import { LayoutList, FolderCog, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import ProductGrid from "./ProductGrid";
import ProductCategoryManager from "./ProductCategoryManager";
import { useModal } from "~/hooks/use-modal";
import { useLoaderData, useSearchParams, useActionData, useFetcher } from "react-router";
import SlideInModal from "~/components/shared/modal/SlideInModal";
import ProductFullFormModal from "~/components/shared/form/FormProduct";
import { ConfirmDialog } from "~/components/shared/modal/ConfirmDialog";
import { toast } from "sonner";
import { useEffect } from "react";

export const ProductManagementDashboard: React.FC = () => {
    const { table } = useLoaderData() as any;
    const actionData = useActionData() as any;
    const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
    const [modal, setModal] = useModal();
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher();

    useEffect(() => {
        if (actionData?.success) {
            setModal({ ...modal, open: false });
            toast.success(actionData.message);
        } else if (actionData?.success === false) {
            toast.error(actionData.error_message || "Gagal memproses permintaan");
        }
    }, [actionData]);

    const handleDelete = async (data: any) => {
        const result = await ConfirmDialog({
          title: "Konfirmasi Hapus",
          text: `Apakah Anda yakin ingin menghapus produk "${data.name}"?`,
          icon: "warning",
          confirmText: "Hapus",
          cancelText: "Batal",
        });
    
        if (result.isConfirmed) {
          fetcher.submit(
            { id: data?.id },
            {
              method: "delete",
            }
          );
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            {/* TABS HEADER */}
            <div className="flex border-b border-gray-200 px-4 pt-3 gap-1 bg-gray-50/50">
                <button
                    onClick={() => setActiveTab("products")}
                    className={`flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase rounded-t-lg border-b-2 transition-all ${activeTab === "products"
                        ? "border-blue-600 text-blue-600 bg-white"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    <LayoutList size={14} />
                    Daftar Produk
                </button>
                <button
                    onClick={() => setActiveTab("categories")}
                    className={`flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase rounded-t-lg border-b-2 transition-all ${activeTab === "categories"
                        ? "border-blue-600 text-blue-600 bg-white"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    <FolderCog size={14} />
                    Kategori Produk
                </button>
            </div>

            <div className="p-4 md:p-6">
                {activeTab === "products" ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Manajemen Produk</h3>
                                <p className="text-xs text-gray-500 mt-1">Kelola katalog produk dan variasi</p>
                            </div>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all h-9"
                                onClick={() =>
                                    setModal({ ...modal, open: true, key: "create", data: null })
                                }
                            >
                                <Plus size={16} className="mr-2" />
                                Produk Baru
                            </Button>
                        </div>
                        
                        <ProductGrid
                            products={table?.items || []}
                            modal={modal}
                            setModal={setModal}
                            handleDelete={handleDelete}
                        />
                    </div>
                ) : (
                    <ProductCategoryManager />
                )}
            </div>

            <SlideInModal
                isOpen={modal?.open && modal?.key === "create"}
                onClose={() => setModal({ ...modal, open: false })}
                title={modal?.data ? "Edit Produk" : "Tambah Produk Baru"}
                width="w-full max-w-4xl"
            >
                <ProductFullFormModal
                    detail={modal?.data}
                    currentItems={[]}
                    onSuccess={() => {
                        setModal({ ...modal, open: false });
                    }}
                />
            </SlideInModal>
        </div>
    );
};
