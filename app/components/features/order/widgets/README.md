# Order Feature Widgets

### Widget: OrderFilterModal
- File: `OrderFilterModal.tsx`
- Function: Modal filter pesanan dengan opsi tahun, status produksi, status pembayaran, tipe pesanan, dan institusi KKN
- Props: `open: boolean`, `onClose: () => void`, `filters: OrderFilters`, `setFilters`, `onApply`, `onReset`, `viewMode`, `kknInstitutions`, `loadingKknInstitutions`

### Widget: OrderPaymentProofModal
- File: `OrderPaymentProofModal.tsx`
- Function: Modal upload bukti pembayaran (DP/Lunas) dengan detail pesanan dan file upload
- Props: `open: boolean`, `onClose`, `modal`, `setModal`, `bankList`, `isUploadingFile`, `setIsUploadingFile`, `actionLoading`, `onSubmit`

### Widget: OrderPaymentViewModal
- File: `OrderPaymentViewModal.tsx`
- Function: Modal untuk melihat dan menghapus bukti pembayaran yang sudah diupload
- Props: `open: boolean`, `onClose`, `modal`, `setModal`, `onDeleteProof`

### Widget: OrderMobileCard
- File: `OrderMobileCard.tsx`
- Function: Card view untuk tampilan mobile — menampilkan info pesanan (instansi, items, total, status) dengan 3-dot menu untuk aksi (nota, edit, upload bukti, hapus)
- Props: `order`, `index`, `page`, `onDelete`, `onUpdateStatus`, `onViewNota`, `onUploadPayment`, `onViewPayment`, `navigate`
