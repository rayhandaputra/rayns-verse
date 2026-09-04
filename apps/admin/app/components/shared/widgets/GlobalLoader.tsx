import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUIStore } from "~/components/shared/store/ui";

function GlobalLoader() {
  const loading = useUIStore((s) => s.loading);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)]"
          >
            <Loader2 size={18} className="text-[var(--accent)] animate-spin" />
            <p className="text-xs font-semibold text-[var(--foreground)]">
              Memproses...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { GlobalLoader };
