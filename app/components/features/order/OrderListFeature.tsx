import { useMemo } from "react";
import { useOrderListLogic } from "./use-order-list-logic";
import { useOrderColumns } from "./order-columns";
import { DataTable, TablePagination } from "~/components/ui/data-table";
import OrderShareCard from "~/components/shared/print/order/OrderShareTemplate";
import ModalShell from "~/components/modal/ModalShell";
import NotaView from "~/components/shared/NotaView";
import { Filter, X, Search, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useIsMobile } from "~/hooks/use-mobile";
import { OrderFilterModal } from "./widgets/OrderFilterModal";
import { OrderPaymentProofModal } from "./widgets/OrderPaymentProofModal";
import { OrderPaymentViewModal } from "./widgets/OrderPaymentViewModal";
import { OrderMobileCard } from "./widgets/OrderMobileCard";

export default function OrderListFeature() {
  const isMobile = useIsMobile();
  const logic = useOrderListLogic();
  const columns = useOrderColumns({
    orders: logic.orders,
    filterKknInstitution: logic.filters.kknInstitution,
    handleCopyImageQrCode: logic.handleCopyImageQrCode,
    handleShare: logic.handleShare,
    isProcessingShare: logic.isProcessingShare,
    onDelete: logic.onDelete,
    onUpdateStatus: logic.onUpdateStatus,
    onUpdateStatusPrinted: logic.onUpdateStatusPrinted,
    setModal: logic.setModal,
    modal: logic.modal,
    navigate: logic.navigate,
    copyToClipboard: logic.copyToClipboard,
  });

  // ── Tabs config ──
  const tabs = useMemo(() => [
    { label: "Reguler", value: "reguler" },
    { label: "KKN", value: "kkn" },
  ], []);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">Daftar Pesanan</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Kelola semua pesanan masuk</p>
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-semibold rounded-lg whitespace-nowrap">
            {logic.totalItems}
          </Badge>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-6 border-b border-gray-100 shrink-0">
          <div className="flex overflow-x-auto no-scrollbar gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => logic.setViewMode(tab.value)}
                className={cn(
                  "py-3 md:py-3.5 px-3 md:px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  logic.viewMode === tab.value
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between shrink-0">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari pesanan, instansi, PIC..."
              className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-lg"
              onChange={(e) => logic.handleSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={logic.openFilterModal}
              className="flex items-center gap-2 flex-1 md:flex-none justify-center"
            >
              <Filter className="w-4 h-4" />
              Filter
              {logic.activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-bold">
                  {logic.activeFilterCount}
                </span>
              )}
            </Button>
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white flex-1 md:flex-none"
              value={logic.sortBy}
              onChange={(e) => logic.setSortBy(e.target.value)}
            >
              <option value="created_on:desc">Terbaru</option>
              <option value="created_on:asc">Terlama</option>
              <option value="institution_name:asc">A-Z</option>
              <option value="institution_name:desc">Z-A</option>
              <option value="payment_status:desc">Bayar</option>
            </select>
          </div>
        </div>

        {/* Content Area — Table (desktop) / Cards (mobile) */}
        <div className="relative flex-1 min-h-0">
          {logic.ordersLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-gray-600">Memuat data...</span>
              </div>
            </div>
          )}

          {/* Desktop: Table with sticky columns + dual scrollbar */}
          {!isMobile && (
            <DataTable
              columns={columns}
              data={logic.orderItems}
              getRowKey={(order: any) => order.id}
              rowClassName={(order: any) => (order.status === "done" ? "bg-green-50/30" : "")}
              emptyMessage="Belum ada pesanan di kategori ini."
              minHeight="400px"
            />
          )}

          {/* Mobile: Card layout */}
          {isMobile && (
            <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)]">
              {logic.orderItems.length === 0 ? (
                <div className="py-16 text-center">
                  <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">Belum ada pesanan</p>
                </div>
              ) : (
                logic.orderItems.map((order: any, idx: number) => (
                  <OrderMobileCard
                    key={order.id}
                    order={order}
                    index={idx}
                    page={logic.page}
                    onDelete={logic.onDelete}
                    onUpdateStatus={logic.onUpdateStatus}
                    onViewNota={(o) => logic.setModal({ open: true, type: "view_nota", data: o })}
                    onUploadPayment={(o) => logic.setModal({ open: true, type: "upload_payment_proof", data: o })}
                    onViewPayment={(o) => logic.setModal({ open: true, type: "view_payment_proof", data: o })}
                    navigate={logic.navigate}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={(logic.page || 0) + 1}
          totalPages={logic.totalPages}
          onPageChange={(p) => logic.handlePageChange(p)}
          className="mt-auto shrink-0"
        />
      </div>

      {/* Hidden share card for QR generation */}
      <OrderShareCard order={logic.selectedOrder} qrCodeUrl={logic.tempQr} ref={logic.cardRef} />

      {/* Filter Modal */}
      <OrderFilterModal
        open={logic.filterModalOpen}
        onClose={() => logic.setFilterModalOpen(false)}
        filters={logic.tempFilters}
        setFilters={logic.setTempFilters}
        onApply={logic.applyFilters}
        onReset={logic.resetFilters}
        viewMode={logic.viewMode}
        kknInstitutions={logic.kknInstitutions}
        loadingKknInstitutions={logic.loadingKknInstitutions}
      />

      {/* Payment Proof Upload Modal */}
      <OrderPaymentProofModal
        open={logic.modal?.open && logic.modal?.type === "upload_payment_proof"}
        onClose={() => logic.setModal({ open: false })}
        modal={logic.modal}
        setModal={logic.setModal}
        bankList={logic.bankList}
        isUploadingFile={logic.isUploadingFile}
        setIsUploadingFile={logic.setIsUploadingFile}
        actionLoading={logic.actionLoading}
        onSubmit={logic.handleSubmitPaymentProof}
      />

      {/* Payment Proof View Modal */}
      <OrderPaymentViewModal
        open={logic.modal?.open && logic.modal?.type === "view_payment_proof"}
        onClose={() => logic.setModal({ open: false })}
        modal={logic.modal}
        setModal={logic.setModal}
        onDeleteProof={logic.onDeletePaymentProof}
      />

      {/* Zoom Payment Proof */}
      {logic.modal?.open && logic.modal?.type === "zoom_payment_proof" && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => logic.setModal({ open: false })}>
          <button className="absolute top-4 right-4 text-white" onClick={() => logic.setModal({ open: false })}><X size={32} /></button>
          <img src={logic.modal?.data?.payment_proof} className="max-w-full max-h-[90vh] object-contain" alt="Bukti Pembayaran" />
        </div>
      )}

      {/* Nota View Modal */}
      {logic.modal?.open && logic.modal?.type === "view_nota" && (
        <ModalShell open={logic.modal?.open} onClose={() => logic.setModal({ open: false })} title="" size="lg">
          <NotaView
            order={logic.modal?.data}
            isEditable={true}
            onReviewChange={(rating: number, review: string) => logic.onUpdateReview(logic.modal?.data.id, rating, review)}
            onPaymentProofChange={(proof: string) => logic.onUpdatePaymentProof(logic.modal?.data.id, proof)}
          />
        </ModalShell>
      )}
    </div>
  );
}
