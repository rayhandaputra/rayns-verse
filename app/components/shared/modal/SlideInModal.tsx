import { X } from "lucide-react";
import React from "react";

interface SlideInModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: string; // Desktop width only (e.g. "w-1/3 max-w-md")
  children: React.ReactNode;
  showOverlay?: boolean;
}

export default function SlideInModal({
  isOpen,
  onClose,
  title = "",
  width = "w-1/3 max-w-md", // Desktop width
  children,
  showOverlay = true,
}: SlideInModalProps) {
  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          className={`fixed inset-0 bg-black/40 h-screen transition-opacity duration-300 z-50 ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
      )}

      {/* Slide-in Modal */}
      <div
        className={`
        fixed top-0 right-0 h-full bg-white shadow-xl z-50 
        transition-transform duration-300 p-6

        /* ✅ RESPONSIVE WIDTH */
        w-full              /* Mobile default */
        sm:w-full           /* Small screens */
        md:w-1/2            /* Medium screens */
        lg:${width}         /* Desktop uses custom width */

        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>

          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto h-[calc(100%-4rem)]">{children}</div>
      </div>
    </>
  );
}
