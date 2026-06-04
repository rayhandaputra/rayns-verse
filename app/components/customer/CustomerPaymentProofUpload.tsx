import { Check, FileText, Loader2, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { uploadFile } from "~/utils/utils";

export type CustomerPaymentProofKind = "dp" | "paid";

type UploadState = {
  fileName?: string;
  previewUrl?: string;
  uploadedUrl?: string;
  error?: string;
};

type CustomerPaymentProofUploadProps = {
  kind: CustomerPaymentProofKind;
  amountLabel?: string;
  value?: string;
  onUploaded?: (url: string) => void;
};

const proofCopy = {
  dp: {
    title: "Upload Bukti DP",
    description: "Untuk status pembayaran uang muka.",
    fieldName: "dp_payment_proof",
  },
  paid: {
    title: "Upload Bukti Lunas",
    description: "Untuk pelunasan atau pembayaran penuh.",
    fieldName: "payment_proof",
  },
} satisfies Record<CustomerPaymentProofKind, {
  title: string;
  description: string;
  fieldName: string;
}>;

export function CustomerPaymentProofUpload({
  kind,
  amountLabel,
  value,
  onUploaded,
}: CustomerPaymentProofUploadProps) {
  const copy = proofCopy[kind];
  const [state, setState] = useState<UploadState>(() => ({
    uploadedUrl: value,
    previewUrl: value,
  }));
  const [isUploading, setIsUploading] = useState(false);

  const hasProof = Boolean(state.uploadedUrl || state.previewUrl);
  const fileLabel = useMemo(() => {
    if (state.fileName) return state.fileName;
    if (state.uploadedUrl) return "Bukti sudah tersedia";
    return "PNG, JPG, WEBP, PDF maks. 20 MB";
  }, [state.fileName, state.uploadedUrl]);

  async function handleFileChange(file?: File | null) {
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

    setState({
      fileName: file.name,
      previewUrl,
      error: undefined,
    });
    setIsUploading(true);

    try {
      const uploadedUrl = await uploadFile(file);
      setState({
        fileName: file.name,
        previewUrl: previewUrl || uploadedUrl,
        uploadedUrl,
      });
      onUploaded?.(uploadedUrl);
    } catch (error) {
      setState({
        fileName: file.name,
        previewUrl,
        error: error instanceof Error ? error.message : "Upload gagal",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function clearProof() {
    setState({});
    onUploaded?.("");
  }

  return (
    <div className="rounded-[22px] border border-[var(--customer-border)] bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-black text-[var(--customer-primary)]">
                {copy.title}
              </h3>
              <p className="mt-0.5 text-[10px] font-semibold leading-4 text-[var(--customer-text-light)]">
                {copy.description}
              </p>
            </div>
            {amountLabel ? (
              <span className="shrink-0 rounded-full bg-[var(--customer-bg)] px-2 py-1 text-[9px] font-black text-[var(--customer-primary)]">
                {amountLabel}
              </span>
            ) : null}
          </div>

          <input type="hidden" name={copy.fieldName} value={state.uploadedUrl || ""} />

          <label className="mt-3 block cursor-pointer rounded-2xl border border-dashed border-[var(--customer-border)] bg-[var(--customer-bg)] p-3 transition hover:border-[var(--customer-border-active)]">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-[var(--customer-text-light)]">
                {state.previewUrl && state.previewUrl !== state.uploadedUrl ? (
                  <img
                    src={state.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileText size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-black text-[var(--customer-primary)]">
                  {fileLabel}
                </p>
                <p className="mt-0.5 text-[9px] font-semibold text-[var(--customer-text-light)]">
                  {isUploading ? "Mengunggah bukti..." : "Ketuk untuk pilih file"}
                </p>
              </div>
              {hasProof && !isUploading ? (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--customer-accent)] text-white">
                  <Check size={14} strokeWidth={3} />
                </span>
              ) : null}
            </div>
          </label>

          {state.error ? (
            <p className="mt-2 text-[10px] font-bold text-[var(--customer-danger)]">
              {state.error}
            </p>
          ) : null}

          {hasProof && !isUploading ? (
            <button
              type="button"
              onClick={clearProof}
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-[var(--customer-danger)]"
            >
              <X size={12} /> Hapus bukti
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
