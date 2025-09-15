// pages/UploadPage.tsx

import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import TabsComponent from "~/components/Tabs";
import { UploadSection } from "~/components/upload/UploadSection";

export default function UploadPage() {
  const [tabs, setTabs] = useState<any>();
  const location = useLocation();

  useEffect(() => {
    setTabs([
      {
        name: "ID Card",
        href: "/app/order/ordered",
        current: location.pathname === "/app/order/ordered",
      },
      {
        name: "Lanyard",
        href: "/app/order/confirmed",
        current: location.pathname === "/app/order/confirmed",
      },
    ]);
  }, [location]);

  return (
    <main className="static w-full bg-gray-200 text-gray-800">
      <div className="relative flex-1 w-full max-w-[480px] min-h-screen overflow-scroll no-scrollbar bg-gradient-to-b from-[#67e8f9] via-[#4da9e6] to-[#31778d] mx-auto p-3 space-y-3">
        {/* <div className="max-w-6xl mx-auto p-6 space-y-6"> */}
        {/* Header */}

        <img
          src="/kinau-logo.png"
          alt="Logo"
          className="w-36"
          onClick={() => (window.location.href = "/")}
        />
        <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold">
              Upload Desain ID Card & Lanyard
            </h1>
            <p className="text-sm text-gray-500">
              Selamat sore, <span className="font-medium">Contoh</span>. Upload
              semua desain yang akan dicetak di sini yaa.
              <br />
              Format file: <b>JPG/PNG</b>. Tekan tombol upload pada bagian yang
              sesuai.
            </p>
          </div>
          <div className="space-x-2">
            <button className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
              Petunjuk ID Card
            </button>
            <button className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
              Petunjuk Lanyard
            </button>
          </div>
        </div>

        <TabsComponent tabs={tabs} />

        {/* Sections */}
        <div className="">
          <UploadSection
            title="ID Card"
            description="Depan (wajib, multi-file) • Belakang (opsional, 1 file)"
            type="idcard"
          />
          {/* <UploadSection
            title="Lanyard"
            description="Satu file per folder (depan=belakang sama)"
            type="lanyard"
          /> */}
        </div>
      </div>
    </main>
  );
}
