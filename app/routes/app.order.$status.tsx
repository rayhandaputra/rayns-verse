import {
  CheckCircle2Icon,
  CopyIcon,
  EyeIcon,
  PlusCircleIcon,
} from "lucide-react";
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
import { commitSession, getSession } from "~/lib/session";
import { getOrderLabel, getPaymentLabel } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";

export const loader: LoaderFunction = async ({ request, params }) => {
  // const session = await unsealSession(request);
  // const session = await getSession(request);
  // const url = new URL(request.url);
  // const search = url.searchParams.get("q") ?? "";
  // const session = await getSession(request.headers.get("Cookie"));
  // const flash = session.get("flash");
  // session.unset("flash");
  let url = new URL(request.url);
  let { search, page = 0, size = 10 } = Object.fromEntries(url.searchParams);

  try {
    const filters = {
      pagination: "true",
      page: page || 0,
      size: size || 10,
      status: params.status || "",
    };
    const list = await API.orders.get({
      // session,
      session: {},
      req: {
        query: filters,
      } as any,
    });

    return {
      // search,
      // APP_CONFIG: CONFIG,
      table: {
        ...list,
        page: page || 0,
        size: size || 10,
        filter: filters,
      },
      // flash,
      // headers: {
      //   "Set-Cookie": await commitSession(session),
      // },
    };
  } catch (err) {
    console.log(err);
    return {
      error_message: err,
    };
  }
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
        href: "/app/order/ordered",
        current: location.pathname === "/app/order/ordered",
      },
      {
        name: "Menunggu Konfirmasi",
        href: "/app/order/confirmed",
        current: location.pathname === "/app/order/confirmed",
      },
      {
        name: "Diproses",
        href: "/app/order/process",
        current: location.pathname === "/app/order/process",
      },
      {
        name: "Dalam Produksi",
        href: "/app/order/production",
        current: location.pathname === "/app/order/production",
      },
      {
        name: "Quality Check / Siap Dikirim",
        href: "/app/order/qc",
        current: location.pathname === "/app/order/qc",
      },
      {
        name: "Dikirim",
        href: "/app/order/delivered",
        current: location.pathname === "/app/order/delivered",
      },
      {
        name: "Selesai",
        href: "/app/order/done",
        current: location.pathname === "/app/order/done",
      },
      {
        name: "Dibatalkan / Ditolak",
        href: "/app/order/rejected",
        current: location.pathname === "/app/order/rejected",
      },
      {
        name: "Pending",
        href: "/app/order/pending",
        current: location.pathname === "/app/order/pending",
      },
    ]);
  }, [location]);

  const columns = [
    {
      name: "No",
      width: "50px",
      cell: (_: any, index: number) =>
        table?.current_page * table?.size + (index + 1),
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
      cell: (row: any) => getOrderLabel(row?.order_type),
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
      cell: (row: any) => getPaymentLabel(row?.payment_type),
    },
    {
      name: "Domain",
      width: "200px",
      cell: (row: any) =>
        row?.institution_domain ? (
          <div className="flex gap-3">
            <CopyIcon
              onClick={async () => {
                await navigator.clipboard.writeText(row?.institution_domain);
                toast.success("Berhasil", {
                  description: "Berhasil menyalin Domain",
                });
              }}
              className="w-4 cursor-pointer"
            />

            <a
              href={
                row.institution_domain.startsWith("http")
                  ? row.institution_domain
                  : `https://${row.institution_domain}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {row.institution_domain}
            </a>
          </div>
        ) : (
          "-"
        ),
    },
    ...(table?.filter?.status === "ordered"
      ? [
          {
            name: "Pembayaran",
            width: "250px",
            cell: (row: any) => (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-2">
                  <p className="text-[0.675rem] text-gray-500">Status:</p>
                  <p>
                    <Badge className="text-[0.675rem] bg-orange-700">
                      Belum dibayar
                    </Badge>
                  </p>
                </div>
                <div className="flex justify-between gap-2">
                  <p className="text-[0.675rem] text-gray-500">Bukti:</p>
                  <p>
                    {row.payment_proof ? (
                      <a
                        href={row.payment_proof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Lihat
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            ),
          },
        ]
      : []),
    {
      name: "Pembayaran",
      cell: (row: any) => getPaymentLabel(row?.payment_type),
    },
    {
      name: "Aksi",
      cell: (row: any, index: number) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-gray-600 hover:bg-gray-500 text-white text-xs"
            onClick={() => {
              navigate(`/app/order/${row?.id}/detail`);
            }}
          >
            <EyeIcon className="w-4" />
            Detail
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-500 text-white text-xs"
            onClick={() => {}}
          >
            <CheckCircle2Icon className="w-4" />
            Konfirmasi
          </Button>
        </div>
      ),
    },
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
