import { useLocation } from "react-router";
import Navbar from "./public/navbar";
// import AdminNavbar from "./admin/navbar";
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

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {" "}
      {/* Cegah scroll horizontal global */}
      {location.pathname === "/" ? (
        <>
          {/* <Navbar session={session} /> */}
          <main className="">{children}</main>
          {/* <Footer /> */}
        </>
      ) : (
        <div className="flex-1 flex flex-col">{children}</div>
      )}
    </div>
  );
}
