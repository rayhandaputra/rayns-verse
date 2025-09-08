import { PlusCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import TabsComponent from "~/components/Tabs";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";

export default function AppOrder() {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<any>();
  const location = useLocation();

  useEffect(() => {
    setTabs([
      {
        name: "Menunggu Pembayaran",
        href: "/app/order",
        current: location.pathname === "/app/order",
      },
      {
        name: "Menunggu Konfirmasi",
        href: "/app/order",
        current: false,
      },
      {
        name: "Diproses",
        href: "/app/order",
        current: false,
      },
      {
        name: "Dalam Produksi",
        href: "/app/order",
        current: false,
      },
      {
        name: "Quality Check / Siap Dikirim",
        href: "/app/order",
        current: false,
      },
      {
        name: "Dikirim",
        href: "/app/order",
        current: false,
      },
      {
        name: "Selesai",
        href: "/app/order",
        current: false,
      },
      {
        name: "Dibatalkan / Ditolak",
        href: "/app/order",
        current: false,
      },
      {
        name: "Pending",
        href: "/app/order",
        current: false,
      },
    ]);
  }, [location]);
  return (
    <div className="space-y-3">
      <TitleHeader
        title="Pesanan"
        description="Kelola data Pesanan."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              //   { label: "Pesanan", href: "/" },
              { label: "Pesanan", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() =>
              //   setModal({
              //     ...modal,
              //     open: true,
              //     key: "create",
              //     data: null,
              //   })
              navigate(`/app/order/management`)
            }
          >
            <PlusCircleIcon className="w-4" />
            Buat Pesanan
          </Button>
        }
      />

      <TabsComponent tabs={tabs} />
    </div>
  );
}
