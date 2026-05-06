import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { AppSidebar } from "~/components/core/AppSidebar";
import { AppNavbar } from "~/components/core/AppNavbar";
import { ADMIN_NAVIGATION } from "~/constants/navigation";

interface AppLayoutFeatureProps {
  user: any;
}

export default function AppLayoutFeature({ user }: AppLayoutFeatureProps) {
  const location = useLocation();
  const [flash, setFlash] = useState<any>(null);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  useEffect(() => {
    if (location.state?.flash) {
      setTimeout(() => {
        setFlash(location.state.flash);
      }, 0);

      window.history.replaceState({}, document.title);

      setTimeout(() => {
        setFlash(null);
      }, 3000);
    }
  }, [location.state]);

  useEffect(() => {
    if (flash) {
      if (flash.success) {
        toast.success(flash.message);
      } else {
        toast.error(flash.message);
      }
    }
  }, [flash]);

  const [client, setClient] = useState<boolean>(false);
  useEffect(() => {
    setTimeout(() => {
      setClient(true);
    }, 0);
  }, []);

  if (!client) return null;

  return (
    <div>
      <div
        className={`hidden lg:block transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? "w-64" : "w-0"}`}
      >
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isDesktopSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <AppSidebar
            navigation={ADMIN_NAVIGATION}
            currentPath={location.pathname}
          />
        </div>
      </div>

      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <AppSidebar
            navigation={ADMIN_NAVIGATION}
            currentPath={location.pathname}
            isMobile
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div
        className={`fixed top-0 right-0 z-30 transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? "left-0 lg:left-64" : "left-0"}`}
      >
        <AppNavbar
          currentUser={user}
          sidebar={{
            mobileMenuOpen: isMobileSidebarOpen,
            setMobileMenuOpen: setMobileSidebarOpen,
            desktopSidebarOpen: isDesktopSidebarOpen,
            setDesktopSidebarOpen: setDesktopSidebarOpen,
          }}
        />
      </div>

      <div
        className={`flex-1 pt-[88px] transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? "ml-0 lg:ml-64" : "ml-0"}`}
      >
        <div className="p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
