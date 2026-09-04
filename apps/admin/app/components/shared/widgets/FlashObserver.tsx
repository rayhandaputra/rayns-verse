import { useEffect } from "react";
import { toast } from "sonner";
import type { FlashMessage } from "~/lib/flash.server";

interface FlashObserverProps {
  flash: FlashMessage | null;
}

function FlashObserver({ flash }: FlashObserverProps) {
  useEffect(() => {
    if (!flash) return;

    switch (flash.type) {
      case "success":
        toast.success(flash.message, { description: flash.title });
        break;
      case "error":
        toast.error(flash.message, { description: flash.title });
        break;
      case "warning":
        toast.warning(flash.message, { description: flash.title });
        break;
      case "info":
        toast.info(flash.message, { description: flash.title });
        break;
    }
  }, [flash]);

  return null;
}

export { FlashObserver };
