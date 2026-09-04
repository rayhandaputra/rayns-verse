import { useState, useEffect } from "react";
import { useNavigation } from "react-router";
import { motion, AnimatePresence } from "motion/react";

function NavigationProgress() {
  const navigation = useNavigation();
  const isNavigating =
    navigation.state === "loading" || navigation.state === "submitting";

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isNavigating) {
      setProgress(0);
      const raf = requestAnimationFrame(() => setProgress(30));
      const timer = setTimeout(() => setProgress(70), 300);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }

    setProgress(100);
    const timer = setTimeout(() => setProgress(0), 400);
    return () => clearTimeout(timer);
  }, [isNavigating]);

  return (
    <AnimatePresence>
      {(isNavigating || progress > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none"
          aria-hidden="true"
        >
          <motion.div
            className="h-full bg-[var(--progress)]"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.3 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { NavigationProgress };
