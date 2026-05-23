import { Home, CreditCard, Palette, Ribbon, LayoutDashboard } from "lucide-react";
import { motion } from "motion/react";

interface BottomNavProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  canProceed: boolean;
  hasOrder: boolean;
}

const NAV_ITEMS = [
  { step: 1, icon: Home, label: "Beranda" },
  { step: 2, icon: Palette, label: "ID Card" },
  { step: 3, icon: Ribbon, label: "Lanyard" },
  { step: 4, icon: CreditCard, label: "Checkout" },
  { step: 5, icon: LayoutDashboard, label: "Pesanan" },
];

export default function BottomNav({ currentStep, onStepChange, canProceed, hasOrder }: BottomNavProps) {
  const isStepAccessible = (step: number) => {
    if (step === 1) return true;
    if (step === 5) return hasOrder;
    if (step <= currentStep) return true;
    if (step === currentStep + 1) return canProceed;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ step, icon: Icon, label }) => {
          const isActive = currentStep === step;
          const accessible = isStepAccessible(step);

          return (
            <button
              key={step}
              onClick={() => accessible && onStepChange(step)}
              disabled={!accessible}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-accent"
                  : accessible
                  ? "text-gray-400 hover:text-gray-600"
                  : "text-gray-200 cursor-not-allowed"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-accent rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
