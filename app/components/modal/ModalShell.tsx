import React, { type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full m-4",
};

const ModalShell: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  size = "md",
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Overlay */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>

            {/* Content */}
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              >
                <div
                  className={`w-full ${sizeClasses[size]} max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl bg-white text-left shadow-xl my-auto`}
                >
                  {/* Header */}
                  {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                      <DialogPrimitive.Title className="text-lg font-medium leading-6 text-gray-900">
                        {title}
                      </DialogPrimitive.Title>
                      <DialogPrimitive.Close asChild>
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          <span className="sr-only">Tutup</span>
                          <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </DialogPrimitive.Close>
                    </div>
                  )}

                  {/* Content — scrollable when exceeds viewport */}
                  <div className="px-6 py-4 relative overflow-y-auto flex-1">
                    {!title && (
                      <DialogPrimitive.Close asChild>
                        <button
                          type="button"
                          className="absolute top-4 right-4 rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none z-10"
                        >
                          <span className="sr-only">Tutup</span>
                          <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </DialogPrimitive.Close>
                    )}
                    {children}
                  </div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};

export default ModalShell;
