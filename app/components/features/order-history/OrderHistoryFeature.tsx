
import React, { useMemo } from "react";
import { Form } from "react-router";
import { Star, Edit, Upload, Check, X, Plus } from "lucide-react";
import { formatFullDate } from "~/constants";
import DataTable, { type ColumnDef } from "~/components/ui/data-table";
import { Button } from "~/components/ui/button";
import TableHeader from "~/components/shared/table/TableHeader";
import ModalSecond from "~/components/shared/modal/ModalSecond";
import OrderFormComponent from "~/components/features/order/OrderForm";
import { safeParseArray, safeParseObject } from "~/utils/utils";
import { useOrderHistoryLogic } from "./use-order-history-logic";

export default function OrderHistoryFeature() {
  const {
    modal,
    setModal,
    searchTerm,
    setSearchTerm,
    orders,
    products,
    fileInputRef,
    handleImageUpload,
    removeImage,
    submit,
  } = useOrderHistoryLogic();

  const handleArchiveSubmit = (data: any) => {
    const formData = new FormData();
    formData.append("intent", "create_archive");
    formData.append("data", JSON.stringify(data));
    submit(formData, { method: "POST" });
  };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: "show",
        header: "Tampil?",
        cellClassName: "whitespace-nowrap text-xs text-gray-600 min-w-[90px] font-medium",
        cell: (row) => (
          <Form method="post" className="flex items-center">
            <input type="hidden" name="intent" value="update_portfolio" />
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="is_portfolio" value={+row?.is_portfolio ? 0 : 1} />
            <button type="submit" className={`w-10 h-6 rounded-full transition-colors relative ${+row?.is_portfolio ? "bg-blue-600" : "bg-gray-300"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${+row?.is_portfolio ? "left-5" : "left-1"}`}></div>
            </button>
          </Form>
        ),
      },
      {
        key: "institution_name",
        header: "Instansi",
        cellClassName: "whitespace-nowrap text-xs text-gray-600 min-w-[180px] font-medium",
        cell: (row) => (
          <>
            {+row?.is_kkn !== 1 ? row.institution_name : `${row?.kkn_type?.toLowerCase() === "ppm" ? `Kelompok ${safeParseObject(row?.kkn_detail)?.value}` : `Desa ${safeParseObject(row?.kkn_detail)?.value}`}`}
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{row.pic_name || "-"}</div>
          </>
        ),
      },
      {
        key: "order_date",
        header: "Tanggal Pesanan",
        cellClassName: "whitespace-nowrap text-xs text-gray-600 min-w-[150px] font-medium",
        cell: (row) => row.order_date ? formatFullDate(row.order_date) : "-",
      },
      {
        key: "product",
        header: "Produk",
        cellClassName: "max-w-[180px]",
        cell: (row) => (
          <ul className="list-disc list-inside text-[10px] text-gray-600 font-bold uppercase">
            {safeParseArray(row.order_items)?.map((item: any, idx: number) => (
              <li key={idx} className="truncate">{item.product_name} ({item.qty})</li>
            )) || "-"}
          </ul>
        ),
      },
      {
        key: "totalAmount",
        header: "Total Bayar",
        cellClassName: "whitespace-nowrap text-sm font-bold text-gray-900",
        cell: (order) => <div className="text-xs font-bold text-gray-900">{new Intl.NumberFormat("id-ID").format(order.total_amount)}</div>,
      },
      {
        key: "image",
        header: "Gambar",
        headerClassName: "text-center",
        cellClassName: "max-w-[150px]",
        cell: (row) => {
          const images: any[] = safeParseArray(row.images);
          return images.length > 0 ? (
            <div className="flex -space-x-2 justify-center">
              {images.slice(0, 3).map((img: string, i: number) => (
                <img key={i} src={img} className="w-8 h-8 rounded-full border border-white object-cover shadow-sm" alt="" />
              ))}
              {images.length > 3 && <div className="w-8 h-8 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] text-gray-500 font-black">+{images.length - 3}</div>}
            </div>
          ) : <span className="text-[10px] text-gray-400 font-black block text-center uppercase tracking-widest">No Image</span>;
        },
      },
      {
        key: "feedback",
        header: "Ulasan",
        headerClassName: "text-center",
        cellClassName: "max-w-[150px]",
        cell: (row) => row.review ? (
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="truncate">{row.review}</span>
          </div>
        ) : "-",
      },
      {
        key: "aksi",
        header: "Aksi",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (row) => (
          <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" onClick={() => setModal({ ...modal, open: true, data: { ...row, images: safeParseArray(row?.images) }, type: "update" })}>
            <Edit size={16} />
          </Button>
        ),
      },
    ],
    [modal]
  );

  return (
    <div className="space-y-6">
      {modal?.type === "add_archive" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Tambah Arsip Produksi Lama</h2>
            <button onClick={() => setModal({ ...modal, open: false, type: "" })} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full transition"><X size={20} /></button>
          </div>
          <OrderFormComponent orders={orders} products={products} onSubmit={handleArchiveSubmit} isArchive={true} />
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
          <TableHeader title="Riwayat Pesanan & Arsip" description="Kelola arsip pesanan, ulasan, dan tampilan portfolio." buttonText="Arsip Lama" onClick={() => setModal({ open: true, type: "add_archive", data: null })} buttonIcon={Plus} searchValue={searchTerm} setSearchValue={setSearchTerm} />
          <DataTable columns={columns} data={orders} getRowKey={(o) => o.id} emptyMessage="Belum ada arsip / riwayat." minHeight="400px" />
        </div>
      )}

      {modal.type === "update" && (
        <ModalSecond open={modal.open} onClose={() => setModal({ open: false, type: "" })} title="Edit Detail Portfolio" size="xl">
          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Foto Hasil Produksi</label>
              <div className="flex flex-wrap gap-4 mb-3">
                {(modal?.data?.images ?? [])?.map((img: string, idx: number) => (
                  <div key={idx} className="relative w-24 h-24 group">
                    <img src={img} className="w-full h-full object-cover rounded-2xl border-2 border-gray-100 shadow-sm" alt="Portfolio" />
                    <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition duration-300"><X size={14} /></button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300">
                  <Upload size={24} />
                  <span className="text-[10px] font-black uppercase mt-1">Upload</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Ulasan Pelanggan</label>
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setModal({ ...modal, data: { ...modal.data, rating: star } })} className={`transition-transform hover:scale-110 ${star <= (modal?.data?.rating ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}>
                    <Star size={32} />
                  </button>
                ))}
              </div>
              <textarea className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-medium focus:border-blue-400 outline-none transition" rows={4} placeholder="Ketik ulasan pelanggan..." value={modal?.data?.review} onChange={(e) => setModal({ ...modal, data: { ...modal.data, review: e.target.value } })} />
            </div>
          </div>
          <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => setModal({ ...modal, open: false })} className="px-8 py-3 text-gray-500 hover:bg-gray-200 rounded-xl text-xs font-black uppercase transition tracking-widest">Batal</button>
            <Form method="post">
              <input type="hidden" name="intent" value="update_portfolio" />
              <input type="hidden" name="id" value={modal?.data?.id} />
              <input type="hidden" name="review" value={modal?.data?.review} />
              <input type="hidden" name="rating" value={modal?.data?.rating} />
              <input type="hidden" name="images" value={JSON.stringify(modal?.data?.images)} />
              <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition tracking-widest flex items-center gap-2 shadow-xl shadow-blue-900/20">
                <Check size={18} /> Simpan Perubahan
              </button>
            </Form>
          </div>
        </ModalSecond>
      )}
    </div>
  );
}
