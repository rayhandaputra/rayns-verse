import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ArrowLeft } from "lucide-react";
import ImageCropper from "./widgets/ImageCropper";
import TemplatePreview, { type SlotTransform, type ImagePosition } from "./widgets/TemplatePreview";
import TemplateCodeBased from "./widgets/TemplateCodeBased";
import { uploadFile } from "~/utils/utils";
import { toast } from "sonner";

/** Load an image from URL and return HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw image with cover-fit (crop to fill) into a rectangular area */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  drawImageCoverWithOffset(ctx, img, dx, dy, dw, dh, { x: 0, y: 0, scale: 1 });
}

/**
 * Draw image with cover-fit + user transform (pan + zoom).
 *
 * At scale=1, the image covers the slot exactly (object-cover behavior).
 * At scale>1, a smaller portion of the source image is shown (zoomed in).
 * The x/y offsets shift which portion is visible, bounded so the image always fills the slot.
 *
 * transform.x/y are pixel offsets from the preview container (~360px wide * slot%).
 * We normalize them as a fraction of the maximum possible shift.
 */
function drawImageCoverWithOffset(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  transform: { x: number; y: number; scale: number }
) {
  const imgRatio = img.width / img.height;
  const slotRatio = dw / dh;
  const scale = Math.max(1, transform.scale || 1);

  // At scale=1: determine the base crop (cover-fit)
  let baseW: number, baseH: number;
  if (imgRatio > slotRatio) {
    // Image wider than slot — crop sides
    baseH = img.height;
    baseW = baseH * slotRatio;
  } else {
    // Image taller than slot — crop top/bottom
    baseW = img.width;
    baseH = baseW / slotRatio;
  }

  // At current scale, visible portion is smaller (more zoomed in)
  const visW = baseW / scale;
  const visH = baseH / scale;

  // Center the crop
  let sx = (img.width - visW) / 2;
  let sy = (img.height - visH) / 2;

  // Apply pan offset
  // The max shift in source pixels is how far we can move before revealing empty space
  const maxShiftX = (img.width - visW) / 2;
  const maxShiftY = (img.height - visH) / 2;

  // transform.x/y are in preview-pixel space. The preview slot is approximately:
  // previewSlotW = 360 * slotWidthPercent (e.g., 360 * 0.44 = 158px)
  // At scale S, max pan in preview = previewSlotW * (S-1) / 2
  // Normalize: fraction = transform.x / maxPanPreview, then apply to maxShiftSource
  const PREVIEW_WIDTH = 360; // approximate preview container width
  const previewSlotW = PREVIEW_WIDTH * (dw / (dw + dx)); // rough estimate
  const previewSlotH = previewSlotW * (dh / dw);

  if (maxShiftX > 0 && scale > 1) {
    const maxPanPreviewX = (previewSlotW * 0.44) * (scale - 1) / 2;
    if (maxPanPreviewX > 0) {
      const fractionX = Math.max(-1, Math.min(1, transform.x / maxPanPreviewX));
      sx -= fractionX * maxShiftX;
    }
  }
  if (maxShiftY > 0 && scale > 1) {
    const maxPanPreviewY = (previewSlotH * 0.44) * (scale - 1) / 2;
    if (maxPanPreviewY > 0) {
      const fractionY = Math.max(-1, Math.min(1, transform.y / maxPanPreviewY));
      sy -= fractionY * maxShiftY;
    }
  }

  // Clamp to valid source bounds
  sx = Math.max(0, Math.min(img.width - visW, sx));
  sy = Math.max(0, Math.min(img.height - visH, sy));

  ctx.drawImage(img, sx, sy, visW, visH, dx, dy, dw, dh);
}

interface PortfolioUploadFeatureProps {
  orderId: string;
  existingImages?: string[];
  onComplete: (images: string[]) => void;
  onCancel: () => void;
}

type FlowStep = "upload" | "preview";

/**
 * Portfolio Upload Flow
 *
 * Alur:
 * 1. Upload foto 1 → Crop 9:16 → Submit
 * 2. Upload foto 2 → Crop 9:16 → Submit
 * 3. Upload foto 3 → Crop 9:16 → Submit
 * 4. Upload foto 4 → Crop 9:16 → Submit
 * 5. Preview template (4 foto) → Delete/Replace per slot → Submit final
 */
export default function PortfolioUploadFeature({
  orderId,
  existingImages = [],
  onComplete,
  onCancel,
}: PortfolioUploadFeatureProps) {
  const [images, setImages] = useState<(string | null)[]>(() => {
    const initial: (string | null)[] = [null, null, null, null];
    existingImages.forEach((img, i) => {
      if (i < 4) initial[i] = img;
    });
    return initial;
  });
  const [currentSlot, setCurrentSlot] = useState<number>(
    existingImages.length < 4 ? existingImages.length : -1
  );
  const [step, setStep] = useState<FlowStep>(
    existingImages.length >= 4 ? "preview" : "upload"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replaceSlot, setReplaceSlot] = useState<number | null>(null);
  const [positions, setPositions] = useState<SlotTransform[]>([
    { x: 0, y: 0, scale: 1 },
    { x: 0, y: 0, scale: 1 },
    { x: 0, y: 0, scale: 1 },
    { x: 0, y: 0, scale: 1 },
  ]);
  const [templateMode, setTemplateMode] = useState<"code" | "png">("code");
  const codeTemplateRef = useRef<HTMLDivElement>(null);

  const filledCount = images.filter(Boolean).length;

  const handleCropComplete = useCallback(
    (croppedUrl: string) => {
      const targetSlot = replaceSlot !== null ? replaceSlot : currentSlot;
      const newImages = [...images];
      newImages[targetSlot] = croppedUrl;
      setImages(newImages);
      setReplaceSlot(null);

      const nextEmpty = newImages.findIndex((img) => img === null);
      if (nextEmpty === -1) {
        setStep("preview");
        setCurrentSlot(-1);
      } else {
        setCurrentSlot(nextEmpty);
      }
    },
    [currentSlot, images, replaceSlot]
  );

  const handleDelete = useCallback(
    (index: number) => {
      const newImages = [...images];
      newImages[index] = null;
      setImages(newImages);
    },
    [images]
  );

  const handleReplace = useCallback((index: number) => {
    setReplaceSlot(index);
    setCurrentSlot(index);
    setStep("upload");
  }, []);

  const handleCancelCrop = useCallback(() => {
    if (replaceSlot !== null) {
      setReplaceSlot(null);
      setStep("preview");
    } else {
      onCancel();
    }
  }, [replaceSlot, onCancel]);

  const handleFinalSubmit = async () => {
    const validImages = images.filter(Boolean) as string[];
    if (validImages.length < 4) {
      toast.error("Lengkapi 4 foto terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    try {
      let compositeUrl: string;

      if (templateMode === "png") {
        // Option 1: PNG overlay mode
        const compositeBlob = await generateCompositeImage(validImages);
        const compositeFile = new File([compositeBlob], `portfolio-composite-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        compositeUrl = await uploadFile(compositeFile);
      } else {
        // Option 2: Code-based template — capture via html-to-image
        const { toPng } = await import("html-to-image");
        const templateEl = document.querySelector("[data-template-capture]") as HTMLElement;
        if (!templateEl) throw new Error("Template element tidak ditemukan");

        const dataUrl = await toPng(templateEl, { pixelRatio: 3, cacheBust: true, skipFonts: true });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `portfolio-template-${Date.now()}.png`, { type: "image/png" });
        compositeUrl = await uploadFile(file);
      }

      // Upload individual photos as well
      const uploadedUrls: string[] = [compositeUrl];
      for (const blobUrl of validImages) {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        const file = new File([blob], `portfolio-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`, {
          type: "image/jpeg",
        });
        const url = await uploadFile(file);
        uploadedUrls.push(url);
      }

      onComplete(uploadedUrls);
      toast.success("Portfolio berhasil disimpan");
    } catch (error: any) {
      toast.error("Gagal upload: " + (error.message || "Terjadi kesalahan"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Generate composite image: 4 photos placed on LayoutCanva.png frame
   * Output: 2500x3125 (4:5, matches LayoutCanva.png) JPEG blob
   * Respects user-defined transforms (pan + zoom) for each photo
   */
  const generateCompositeImage = async (photoUrls: string[]): Promise<Blob> => {
    const CANVAS_W = 2500;
    const CANVAS_H = 3125;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;

    // Slot coordinates matching the template PNG exactly
    // Slot 0: top-left (landscape, short) — left=4%, top=7.5%, width=44%, height=27%
    // Slot 1: top-right (portrait, tall) — left=52%, top=7.5%, width=44%, height=50%
    // Slot 2: bottom-left (portrait, tall) — left=4%, top=37%, width=44%, height=50%
    // Slot 3: bottom-right (landscape, short) — left=52%, top=60%, width=44%, height=27%
    const slots = [
      { x: 0.04, y: 0.075, w: 0.44, h: 0.27 },
      { x: 0.52, y: 0.075, w: 0.44, h: 0.50 },
      { x: 0.04, y: 0.37,  w: 0.44, h: 0.50 },
      { x: 0.52, y: 0.60,  w: 0.44, h: 0.27 },
    ];

    for (let i = 0; i < 4; i++) {
      const img = await loadImage(photoUrls[i]);
      const slot = slots[i];
      const dx = slot.x * CANVAS_W;
      const dy = slot.y * CANVAS_H;
      const dw = slot.w * CANVAS_W;
      const dh = slot.h * CANVAS_H;

      drawImageCoverWithOffset(ctx, img, dx, dy, dw, dh, positions[i]);
    }

    // Draw frame overlay on top
    const frame = await loadImage("/LayoutCanva.png");
    ctx.drawImage(frame, 0, 0, CANVAS_W, CANVAS_H);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        0.92
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              images[i]
                ? "bg-[var(--customer-accent)]"
                : i === currentSlot
                ? "bg-[var(--customer-accent)]/40 animate-pulse"
                : "bg-[var(--customer-border)]"
            }`}
          />
        ))}
      </div>

      <p className="text-[11px] text-[var(--customer-text-muted)]">
        {step === "upload"
          ? `Foto ${(replaceSlot ?? currentSlot) + 1} dari 4 — Crop ke rasio 9:16`
          : `${filledCount}/4 foto siap — Preview template`}
      </p>

      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key={`crop-${replaceSlot ?? currentSlot}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ImageCropper
              slotIndex={replaceSlot ?? currentSlot}
              onCropComplete={handleCropComplete}
              onCancel={handleCancelCrop}
            />
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Template Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--customer-border)]/50 rounded-lg w-fit">
              <button
                onClick={() => setTemplateMode("code")}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  templateMode === "code"
                    ? "bg-white text-[var(--customer-primary)] shadow-sm"
                    : "text-[var(--customer-text-muted)] hover:text-[var(--customer-text)]"
                }`}
              >
                Template Otomatis
              </button>
              <button
                onClick={() => setTemplateMode("png")}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  templateMode === "png"
                    ? "bg-white text-[var(--customer-primary)] shadow-sm"
                    : "text-[var(--customer-text-muted)] hover:text-[var(--customer-text)]"
                }`}
              >
                Template PNG
              </button>
            </div>

            {/* Template Preview */}
            {templateMode === "code" ? (
              <TemplateCodeBased
                images={images}
                onDelete={handleDelete}
                onReplace={handleReplace}
              />
            ) : (
              <TemplatePreview
                images={images}
                onDelete={handleDelete}
                onReplace={handleReplace}
                positions={positions}
                onPositionChange={(index, pos) => {
                  setPositions((prev) => {
                    const next = [...prev];
                    next[index] = pos;
                    return next;
                  });
                }}
              />
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--customer-border)] text-[var(--customer-text-muted)] hover:bg-slate-50 text-xs font-semibold transition-all"
              >
                <ArrowLeft size={14} /> Batal
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={filledCount < 4 || isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--customer-accent)] hover:bg-[var(--customer-accent-hover)] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <Check size={14} />
                )}
                {isSubmitting ? "Mengupload..." : "Simpan Portfolio"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
