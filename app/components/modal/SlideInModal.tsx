import { XIcon } from "lucide-react";
import React from "react";

type SlideInModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const SlideInModal: React.FC<SlideInModalProps> = ({
  open,
  onClose,
  children,
}) => {
  return (
    <>
      {/* Backdrop (opsional) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div
        className={`
          fixed top-0 right-0 h-full bg-white shadow-xl rounded-tl-2xl z-40
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Konten */}
        <div className="flex flex-col h-full">{children}</div>

        {/* Tombol Close */}
        <button
          onClick={onClose}
          className="absolute top-2 left-2 text-gray-500 hover:text-black cursor-pointer z-50"
        >
          <XIcon className="w-6 h-auto" />
        </button>
      </div>
    </>
  );
};
