"use client";

import React, { useRef, useState } from "react";
import { API } from "~/lib/api";

export interface MediaGalleryUploaderProps {
  value?: string[]; // array of image URLs only
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  size?: number; // square size (default 128)
}

export default function MediaGalleryUploader({
  value = [],
  onChange,
  maxFiles = 50,
  size = 128,
}: MediaGalleryUploaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<string[]>(value);
  const [uploading, setUploading] = useState<{ id: string; name: string }[]>(
    []
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // Add to loading list
      const tempId = crypto.randomUUID();
      setUploading((prev) => [...prev, { id: tempId, name: file.name }]);

      try {
        const res = await API.ASSET.upload(file); // upload ke cloud
        const url = res?.url;

        if (url) {
          const updated = [...items, url].slice(0, maxFiles);
          setItems(updated);
          onChange?.(updated);
        }
      } catch (err) {
        console.error("Upload gagal:", err);
      }

      // Remove from loading list
      setUploading((prev) => prev.filter((x) => x.id !== tempId));
    }
  };

  const removeItem = (url: string) => {
    const updated = items.filter((x) => x !== url);
    setItems(updated);
    onChange?.(updated);
  };

  const sizeClass = `h-[${size}px] w-[${size}px]`;

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4">
        {/* Upload box */}
        <div
          className={`border-2 border-dashed border-gray-400 rounded-md 
            flex flex-col items-center justify-center cursor-pointer 
            hover:bg-gray-50 select-none`}
          style={{ width: size, height: size }}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-col items-center text-gray-500 text-xs">
            <span className="text-lg">⬆⬆</span>
            <span>Drop file</span>
            <span className="mt-1 px-2 py-0.5 border rounded bg-white text-[11px]">
              Browse File
            </span>
          </div>

          <input
            type="file"
            ref={fileInput}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* UPLOADING PREVIEW (LOADING BOXES) */}
        {uploading.map((u) => (
          <div
            key={u.id}
            className="relative border bg-gray-100 rounded-md overflow-hidden flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <div className="animate-spin rounded-full border-4 border-gray-300 border-t-gray-600 w-8 h-8"></div>

            <div className="absolute bottom-1 text-[10px] text-gray-600 truncate px-1">
              {u.name}
            </div>
          </div>
        ))}

        {/* Uploaded items */}
        {items.map((url) => (
          <div key={url} className="flex flex-col" style={{ width: size }}>
            <div
              className="relative rounded-md overflow-hidden group border bg-gray-100"
              style={{ width: size, height: size }}
            >
              <img
                src={url}
                alt="media"
                className="object-cover w-full h-full"
              />

              {/* Delete (hover) */}
              <button
                onClick={() => removeItem(url)}
                className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded 
                  text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-1 text-xs text-gray-700 truncate">
              {url.split("/").pop()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
