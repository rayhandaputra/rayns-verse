import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, Check, RotateCcw } from "lucide-react";

interface ImageCropperProps {
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  slotIndex: number;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropper({ onCropComplete, onCancel, slotIndex }: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ASPECT_RATIO = 9 / 16; // 9:16 portrait

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
  }, []);

  const getCroppedImg = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const image = imgRef.current;
      if (!image || !completedCrop) return resolve("");

      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve("");

      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve("");
          resolve(URL.createObjectURL(blob));
        },
        "image/jpeg",
        0.92
      );
    });
  }, [completedCrop]);

  const handleSubmitCrop = async () => {
    const croppedUrl = await getCroppedImg();
    if (croppedUrl) {
      onCropComplete(croppedUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--customer-primary)]">
          Upload Foto {slotIndex + 1} dari 4
        </h3>
        <button
          onClick={onCancel}
          className="text-xs text-[var(--customer-text-muted)] hover:text-[var(--customer-text)] transition-colors"
        >
          Batal
        </button>
      </div>

      {!imgSrc ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[9/16] max-h-[400px] border-2 border-dashed border-[var(--customer-border)] hover:border-[var(--customer-accent)] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all bg-[var(--customer-card-hover)] cursor-pointer"
        >
          <Upload size={32} className="text-[var(--customer-accent)]" />
          <span className="text-sm font-medium text-[var(--customer-text-muted)]">
            Pilih Gambar
          </span>
          <span className="text-[10px] text-[var(--customer-text-light)]">
            JPG, PNG — Akan di-crop ke 9:16
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-[var(--customer-border)] bg-slate-900 flex items-center justify-center max-h-[450px]">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={ASPECT_RATIO}
              className="max-h-[450px]"
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Crop"
                onLoad={onImageLoad}
                className="max-h-[450px] w-auto"
              />
            </ReactCrop>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setImgSrc(""); setCrop(undefined); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--customer-border)] text-[var(--customer-text-muted)] hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              <RotateCcw size={14} /> Ganti Foto
            </button>
            <button
              onClick={handleSubmitCrop}
              disabled={!completedCrop}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--customer-accent)] hover:bg-[var(--customer-accent-hover)] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={14} /> Crop & Simpan
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
      />
    </div>
  );
}
