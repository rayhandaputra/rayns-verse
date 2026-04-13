"use client";

import { useState, type ChangeEvent } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { API } from "~/lib/api";

interface ImageUploadPreviewProps {
  label?: string;
  value?: string; // image URL (optional controlled mode)
  onChange?: (file: File | null, previewUrl: string | null) => void;
  size?: number; // pixel dimension (default 128)
  recommendedSize?: string; // display hint (e.g., "800x800px")
}

export function ImageUploadPreview({
  label = "Upload Gambar",
  value,
  onChange,
  size = 128,
  recommendedSize = "800×800px",
}: ImageUploadPreviewProps) {
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const response = await API.ASSET.upload(file);
      onChange?.(file, response?.url);
      setPreview(response?.url);
    } else {
      setPreview(null);
      onChange?.(null, null);
    }
  };

  return (
    <div className="flex items-start gap-4">
      {/* PREVIEW IMAGE */}
      <div
        className="rounded-lg border border-gray-300 bg-gray-100 overflow-hidden flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-500">Preview</span>
        )}
      </div>

      {/* INPUT FILE */}
      <div className="flex-1 space-y-2">
        <Label>{label}</Label>
        <Input type="file" accept="image/*" onChange={handleFileChange} />
        <p className="text-xs text-gray-500">
          Rekomendasi ukuran {recommendedSize} — format JPG/PNG.
        </p>
      </div>
    </div>
  );
}
