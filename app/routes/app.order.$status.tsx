import {
  CheckCircle2Icon,
  CopyIcon,
  EyeIcon,
  PlusCircleIcon,
  Printer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigate,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import TableComponent from "~/components/table/Table";
import TabsComponent from "~/components/Tabs";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { API, API_KEY, API_URL } from "~/lib/api";
import moment from "moment";
import "moment/locale/id";
import { dateFormat, formatDate } from "~/lib/dateFormatter";
import { commitSession, getSession } from "~/lib/session";
import {
  getOrderLabel,
  getOrderStatusLabel,
  getPaymentLabel,
  getPaymentStatusLabel,
  toMoney,
} from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { ReceiptTemplate } from "~/components/print/order/ReceiptTemplate";
import QRCode from "qrcode";
import { useModal } from "~/hooks/use-modal";
import { Modal } from "~/components/modal/Modal";
import SelectBasic from "~/components/select/SelectBasic";
// import { useModal } from "~/provider/modal-provider";

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
    const list = await API.ORDERS.get({
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

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  let { id, state, order_number, action_for, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;
  let resMessage = "";

  try {
    if (action_for) {
      switch (action_for) {
        case "update_status":
          // Update status order
          const resUpdate = await API.ORDERS.update({
            session,
            req: {
              body: {
                id: id,
                status: payload.status,
              },
            } as any,
          });
          if (resUpdate.success) {
            resMessage = `Status Pesanan berhasil diubah menjadi "${getOrderStatusLabel(
              payload.status
            )}"`;
          } else {
            resMessage = `Gagal mengubah status Pesanan: ${resUpdate.message}`;
          }
          break;

        default:
          break;
      }
    }

    return Response.json({
      flash: {
        success: true,
        message: resMessage,
      },
    });
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error_message: "Terjadi Kesalahan",
    };
  }
};

export default function AppOrder() {
  const { table } = useLoaderData();
  const navigate = useNavigate();
  const actionData = useActionData();
  const [tabs, setTabs] = useState<any>();
  const location = useLocation();
  const printRef = useRef<HTMLDivElement>(null);
  const [PrintButton, setPrintButton] =
    useState<React.ComponentType<any> | null>(null);
  const [client, setClient] = useState<boolean>(false);
  const [modal, setModal] = useModal();

  useEffect(() => {
    if (actionData?.flash) {
      setModal({ ...modal, open: false });
      toast.success("Berhasil", { description: actionData?.flash?.message });
    }
  }, [actionData]);

  useEffect(() => {
    setClient(true);
  }, []);

  useEffect(() => {
    if (!client) return;
    import("~/components/PrintButton.client").then((mod) =>
      setPrintButton(() => mod.PrintButton)
    );
  }, [client]);

  useEffect(() => {
    setTabs([
      {
        name: "Menunggu Pembayaran",
        href: "/app/order/pending",
        current: location.pathname === "/app/order/pending",
      },
      {
        name: "Menunggu Konfirmasi",
        href: "/app/order/ordered",
        current: location.pathname === "/app/order/ordered",
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
      name: "Kode Pesanan",
      width: "180px",
      cell: (row: any) => row?.order_number ?? "-",
    },
    {
      name: "Instansi",
      width: "180px",
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
      name: "Tanggal Pesanan",
      width: "150px",
      cell: (row: any) => (row?.order_date ? formatDate(row?.order_date) : "-"),
    },
    {
      name: "Deadline",
      width: "150px",
      cell: (row: any) => (row?.deadline ? formatDate(row?.deadline) : "-"),
    },
    {
      name: "Status Pesanan",
      width: "150px",
      cell: (row: any) => (
        <Badge
          className={`text-[0.675rem] ${
            row?.status === "done"
              ? "bg-green-700"
              : row?.status === "cancelled"
                ? "bg-red-700"
                : "bg-gray-700"
          }`}
        >
          {getOrderStatusLabel(row?.status)}
        </Badge>
      ),
    },
    {
      name: "Metode Pembayaran",
      width: "150px",
      cell: (row: any) =>
        row?.payment_method ? getPaymentLabel(row?.payment_method) : "-",
    },
    {
      name: "Status Pembayaran",
      width: "150px",
      cell: (row: any) => (
        <Badge
          className={`text-[0.675rem] ${
            row?.payment_status === "paid"
              ? "bg-green-700"
              : row?.payment_status === "down_payment"
                ? "bg-yellow-600"
                : row?.payment_status === "cancelled"
                  ? "bg-red-600"
                  : "bg-gray-600"
          }`}
        >
          {getPaymentStatusLabel(row?.payment_status)}
        </Badge>
      ),
    },
    {
      name: "Jatuh Tempo",
      width: "150px",
      cell: (row: any) =>
        row?.payment_due_date ? formatDate(row?.payment_due_date) : "-",
    },
    {
      name: "Total Tagihan",
      width: "160px",
      right: true,
      cell: (row: any) =>
        `Rp ${toMoney(row?.grand_total ?? row?.total_amount ?? 0)}`,
    },
    {
      name: "Aksi",
      width: "200px",
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-gray-600 hover:bg-gray-500 text-white text-xs"
            onClick={() => navigate(`/app/order/${row?.id}/detail`)}
          >
            <EyeIcon className="w-4" />
            Detail
          </Button>
          {/* <Button
            size="sm"
            className="bg-green-600 hover:bg-green-500 text-white text-xs"
            // onClick={() => handleConfirm(row)}
            onClick={() => {}}
          >
            <CheckCircle2Icon className="w-4" />
            Konfirmasi
          </Button> */}
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-500 text-white text-xs"
            onClick={() => {
              setModal({
                ...modal,
                open: true,
                // title: `Ubah Status Pesanan ${row?.order_number}`,
                key: "order-status-update",
                data: row,
              });
            }}
          >
            Ubah Status
          </Button>
        </div>
      ),
    },
  ];

  if (!client) return null;

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

      <TableComponent
        columns={columns}
        data={table}
        expandableRows
        expandableLabel="Detail Pesanan"
        expandableRowsData={[
          {
            name: "Domain",
            cell: (row) =>
              row?.institution_domain ? (
                <div className="flex items-center gap-3">
                  <CopyIcon
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        row?.institution_domain
                      );
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
          {
            name: "Subtotal",
            cell: (row) => `Rp ${toMoney(row?.subtotal ?? 0)}`,
          },
          {
            name: "Kode Diskon",
            cell: (row) => row?.discount_code || "-",
          },
          {
            name: "Diskon",
            cell: (row) =>
              row?.discount_value > 0
                ? `- Rp ${toMoney(row?.discount_value)}`
                : "-",
          },
          {
            name: "Pajak (%)",
            cell: (row) => `${row?.tax_percent ?? 0}%`,
          },
          {
            name: "Pajak",
            cell: (row) =>
              row?.tax_value > 0
                ? `Rp ${toMoney(row?.tax_value)} (${row?.tax_percent ?? 0}%)`
                : "-",
          },
          {
            name: "Biaya Lain",
            cell: (row) => `Rp ${toMoney(row?.other_fee ?? 0)}`,
          },
          {
            name: "Grand Total",
            cell: (row) => `Rp ${toMoney(row?.grand_total ?? 0)}`,
          },
          {
            name: "Nota",
            cell: (row: any) => (
              <div className="inline-flex flex-col gap-1.5">
                {PrintButton ? (
                  <PrintButton>
                    {({ handlePrint }: any) => (
                      <Button
                        onClick={async () => {
                          try {
                            // 1️⃣ Fetch item order
                            // const res = await fetch(
                            //   `/api/order-items?order_number=${row.order_number}`
                            // );
                            // const items = await res.json();
                            const response = await fetch(API_URL, {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${API_KEY}`,
                              },
                              body: JSON.stringify({
                                action: "select",
                                table: "order_items",
                                columns: [
                                  "id",
                                  "order_number",
                                  "product_id",
                                  "product_name",
                                  "product_type",
                                  "qty",
                                  "unit_price",
                                  "discount_type",
                                  "discount_value",
                                  "tax_percent",
                                  "subtotal",
                                  "discount_total",
                                  "tax_value",
                                  "total_after_tax",
                                ],
                                where: {
                                  deleted_on: "null",
                                  order_number: row?.order_number,
                                },
                                // search,
                                // page: 0,
                                // size: 50,
                              }),
                            });
                            const items = await response.json();

                            // 2️⃣ Siapkan QR Code
                            const qrContent = `https://kinau.id/track/${row.order_number}`;
                            const qrUrl = await import("qrcode").then((qr) =>
                              qr.default.toDataURL(qrContent, {
                                width: 200,
                                margin: 1,
                              })
                            );

                            // 3️⃣ Kirim data ke print
                            handlePrint({
                              order: row,
                              items: items?.items ?? [],
                              qrCodeUrl: qrUrl,
                            });
                          } catch (err) {
                            console.error("Gagal print nota:", err);
                            toast.error("Gagal memuat data nota.");
                          }
                        }}
                        className="bg-gray-600 hover:bg-gray-500 text-white text-xs"
                      >
                        <Printer className="w-4" />
                        Cetak Nota
                      </Button>
                    )}
                  </PrintButton>
                ) : (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
                  >
                    Loading Print...
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      {modal?.key === "order-status-update" && modal.open && (
        <Modal
          open={modal.open}
          title={`Ubah Status Pesanan ${modal?.data?.order_number || ""}`}
          onClose={() => setModal({ ...modal, open: false })}
        >
          <Form method="post" className="space-y-3">
            {/* <p>Form Ubah Status Pesanan di sini</p> */}
            <SelectBasic
              options={[
                { value: "pending", label: "Menunggu Pembayaran" },
                { value: "ordered", label: "Menunggu Konfirmasi" },
                { value: "process", label: "Diproses" },
                { value: "production", label: "Dalam Produksi" },
                { value: "qc", label: "Quality Check / Siap Dikirim" },
                { value: "delivered", label: "Dikirim" },
                { value: "done", label: "Selesai" },
                { value: "rejected", label: "Dibatalkan / Ditolak" },
              ]}
              placeholder="Pilih Status Pesanan"
              value={modal?.data?.status}
              onChange={(value) => {
                setModal({
                  ...modal,
                  data: {
                    ...modal.data,
                    status: value,
                  },
                });
              }}
            />
            <input type="hidden" name="action_for" value={"update_status"} />
            <input type="hidden" name="id" value={modal?.data?.id} />
            <input type="hidden" name="status" value={modal?.data?.status} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal({ ...modal, open: false })}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-green-700 hover:bg-green-600 text-white"
              >
                Simpan
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}
