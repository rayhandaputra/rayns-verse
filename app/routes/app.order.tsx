import { PlusCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  type LoaderFunction,
} from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import TableComponent from "~/components/table/Table";
import TabsComponent from "~/components/Tabs";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { API } from "~/lib/api";
import moment from "moment";
import "moment/locale/id";
import { dateFormat, formatDate } from "~/lib/dateFormatter";

export const loader: LoaderFunction = async ({ request, params }) => {
  // const session = await unsealSession(request);
  // const session = await getSession(request);
  // const url = new URL(request.url);
  // const search = url.searchParams.get("q") ?? "";

  const list = await API.orders.get({
    // session,
    session: {},
    req: {
      pagination: "true",
      page: 0,
      size: 10,
    } as any,
  });

  return {
    // search,
    // APP_CONFIG: CONFIG,
    table: {
      ...list,
      page: 0,
      size: 10,
    },
  };
};

export default function AppOrder() {
  const { table } = useLoaderData();
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

  const columns = [
    {
      name: "No",
      width: "50px",
      cell: (_: any, index: number) => index + 1,
    },
    {
      name: "Instansi",
      cell: (row: any) => (
        <div className="flex flex-col">
          <p className="text-sm font-semibold">
            {row?.institution_abbr || "-"}
          </p>
          <p className="text-[0.675rem] text-gray-600">
            {row?.institution_name || "-"}
          </p>
        </div>
      ),
    },
    {
      name: "Jenis Pesanan",
      cell: (row: any) => row?.order_type || "-",
    },
    {
      name: "Jumlah",
      cell: (row: any) => row?.quantity || 0,
    },
    {
      name: "Deadline",
      cell: (row: any) =>
        row?.deadline
          ? // ? moment(row?.deadline).locale("id").format("dddd, DD MMMM YYYY")
            formatDate(row?.deadline)
          : "-",
    },
    {
      name: "Jenis Pembayaran",
      cell: (row: any) => row?.payment_type || "-",
    },
    {
      name: "Domain",
      cell: (row: any) => row?.domain || "-",
    },
    // {
    //   name: "Peran",
    //   cell: (row: any) => (
    //     <span className="capitalize">
    //       <Badge className="">{row?.role || "-"}</Badge>
    //     </span>
    //   ),
    // },
    // {
    //   name: "Aksi",
    //   cell: (row: any, index: number) => (
    //     <div className="flex gap-2">
    //       <Button
    //         variant="outline"
    //         size="icon"
    //         className="text-blue-700 hover:text-blue-500"
    //         onClick={() =>
    //           setModal({
    //             ...modal,
    //             open: true,
    //             key: "update",
    //             data: row,
    //           })
    //         }
    //       >
    //         <PencilLineIcon className="w-4" />
    //       </Button>
    //       <Button
    //         variant="outline"
    //         size="icon"
    //         className="text-red-700 hover:text-red-500"
    //         onClick={() => handleDelete(row)}
    //       >
    //         <Trash2Icon className="w-4" />
    //       </Button>
    //     </div>
    //   ),
    // },
  ];

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
            onClick={() => navigate("/app/order-manage")}
          >
            <PlusCircleIcon className="w-4" />
            Buat Pesanan
          </Button>
        }
      />

      <TabsComponent tabs={tabs} />

      <TableComponent columns={columns} data={table} />
    </div>
  );
}
