import { useLocation } from "react-router";
import Navbar from "./public/navbar";
// import AdminNavbar from "./admin/navbar";
import { Sidebar } from "./admin/sidebar";
import { navigation } from "~/constants/navigation";
import Topbar from "./admin/topbar";
import Footer from "./public/footer";
import { useState } from "react";

export default function RootLayout({
  session,
  children,
}: {
  session: any;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isAppArea = location.pathname.startsWith("/app");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {" "}
      {/* Cegah scroll horizontal global */}
      {location.pathname === "/" || location.pathname.startsWith("/app") ? (
        isAppArea ? (
          <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar jadi fixed supaya tidak ikut layout flow */}
            <Sidebar
              // className="hidden md:block fixed left-0 top-0 h-full w-[256px] bg-[#1e1e1e]"
              navigation={navigation}
              isMobileSidebarOpen={mobileMenuOpen}
              setMobileSidebarOpen={setMobileMenuOpen}
            />
            <div className="flex-1 flex flex-col bg-white md:pl-[256px] pt-[64px] overflow-x-hidden">
              <Topbar sidebar={{ mobileMenuOpen, setMobileMenuOpen }} />
              <main
                className="overflow-y-auto bg-gray-100 text-gray-600 border border-gray-200 rounded-tl-3xl py-4 px-6"
                style={{ height: "calc(100vh - 64px)" }}
              >
                {children}
              </main>
            </div>
          </div>
        ) : (
          <>
            <Navbar />
            <main className="pt-[64px]">{children}</main>
            <Footer />
          </>
        )
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
