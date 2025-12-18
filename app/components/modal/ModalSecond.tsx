import { X, Plus, Upload, Layers, Trash2 } from "lucide-react";
import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ModalSecond: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = "md",
  children,
  footer,
}) => {
  if (!open) return null;

  const sizeClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden max-h-[90vh] flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 rounded-full p-1 hover:bg-red-50 transition"
          >
            <X />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalSecond;
