import { useEffect } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Image as ImageIcon,
  PackageCheck,
  Printer,
  Share2,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  redirect,
  useLoaderData,
  useSearchParams,
  useFetcher,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { toast } from "sonner";
import { APIProviderV2 } from "~/nexus/core/api-provider-v2";
import { CustomerPaymentProofUpload } from "~/components/customer/CustomerPaymentProofUpload";
import { getOptionalUser } from "~/utils/session.server";
import {
  formatCurrency,
  getPaymentStatusLabel,
  safeParseArray,
} from "~/utils/utils";

type OrderItem = {
  id?: number | string;
  product_name?: string;
  qty?: number | string;
  subtotal?: number | string;
  product_type?: string;
  notes?: string;
};

type CustomerOrderRecord = {
  id: number | string;
  order_number?: string;
  institution_name?: string;
  institution_domain?: string;
  payment_status?: string;
  payment_proof?: string;
  dp_payment_proof?: string;
  payment_proof_uploaded_on?: string;
  dp_payment_proof_uploaded_on?: string;
  status?: string;
  status_printed?: string | number | boolean;
  images?: string | string[] | null;
  created_on?: string;
  order_date?: string;
  deadline?: string;
  pic_name?: string;
  pic_phone?: string;
  total_amount?: number | string;
  grand_total?: number | string;
  dp_amount?: number | string;
  order_items?: OrderItem[] | string | null;
  order_designs?: any;
};

type LoaderData = {
  ordersData: CustomerOrderRecord[];
  total: number;
};

const previewFallbacks = [
  "bg-[linear-gradient(135deg,var(--customer-primary)_0%,var(--customer-accent)_100%)]",
  "bg-[linear-gradient(135deg,#F3F8FC_0%,#E3EEF3_100%)]",
];

export async function loader({ request }: LoaderFunctionArgs) {
  const authData = await getOptionalUser(request);

  if (!authData?.user) {
    throw redirect("/login");
  }

  const user = typeof authData.user === "string" ? JSON.parse(authData.user) : authData.user;

  if (user?.role !== "customer") {
    throw redirect("/app/overview");
  }

  const response = await APIProviderV2({
    user: authData.user,
    token: authData.token,
  })
    .Table("orders")
    .Select({
      page: 0,
      size: 50,
      where: {
        pic_phone: user?.phone,
      },
      columns: [
        "id",
        "order_number",
        "institution_name",
        "institution_domain",
        "payment_status",
        "payment_proof",
        "dp_payment_proof",
        "payment_proof_uploaded_on",
        "dp_payment_proof_uploaded_on",
        "status",
        "status_printed",
        "images",
        "created_on",
        "order_date",
        "deadline",
        "pic_name",
        "pic_phone",
        "total_amount",
        "grand_total",
        "dp_amount",
      ],
      include: [
        {
          table: "order_items",
          alias: "order_items",
          foreign_key: "order_number",
          reference_key: "order_number",
          columns: [
            "id",
            "product_name",
            "qty",
            "subtotal",
            "product_type",
            "notes",
          ],
          where: { deleted_on: "null" },
        },
        {
          table: "order_designs",
          alias: "order_designs",
          foreign_key: "order_number",
          reference_key: "order_number",
          columns: [
            "id",
            "template_id",
            "template_name",
            "category",
            "preview_image",
          ],
        },
      ],
      orderBy: ["created_on", "DESC"],
    })
    .Result();

  return Response.json({
    ordersData: response?.items || [],
    total: response?.total_items || 0,
  } satisfies LoaderData);
}

export async function action({ request }: ActionFunctionArgs) {
  const authData = await getOptionalUser(request);
  if (!authData?.user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const id = formData.get("id") as string;

  if (actionType === "update_payment_proof") {
    const kind = formData.get("kind") as "dp" | "paid";
    const url = formData.get("url") as string;

    const payload: any = {};
    if (kind === "dp") {
      payload.dp_payment_proof = url;
      payload.dp_payment_method = "manual_transfer";
      payload.payment_status = "down_payment";
      payload.dp_payment_proof_uploaded_on = new Date().toISOString().replace("T", " ").substring(0, 19);
    } else {
      payload.payment_proof = url;
      payload.payment_method = "manual_transfer";
      payload.payment_status = "paid";
      payload.payment_proof_uploaded_on = new Date().toISOString().replace("T", " ").substring(0, 19);
    }

    try {
      await APIProviderV2({ user: authData.user, token: authData.token })
        .Table("orders")
        .Update({ data: payload, where: { id: Number(id) } })
        .Result();

      return Response.json({
        success: true,
        message: "Bukti pembayaran berhasil diunggah",
      });
    } catch (err: any) {
      return Response.json({
        success: false,
        error: err.message || "Gagal memperbarui bukti pembayaran",
      });
    }
  }

  if (actionType === "delete_payment_proof") {
    const kind = formData.get("kind") as "dp" | "paid";

    const payload: any = {};
    if (kind === "dp") {
      payload.dp_payment_proof = null;
      payload.dp_payment_method = null;
      payload.payment_status = "none";
      payload.dp_payment_proof_uploaded_on = null;
    } else {
      payload.payment_proof = null;
      payload.payment_method = null;
      payload.payment_status = "down_payment";
      payload.payment_proof_uploaded_on = null;
    }

    try {
      await APIProviderV2({ user: authData.user, token: authData.token })
        .Table("orders")
        .Update({ data: payload, where: { id: Number(id) } })
        .Result();

      return Response.json({
        success: true,
        message: "Bukti pembayaran berhasil dihapus",
      });
    } catch (err: any) {
      return Response.json({
        success: false,
        error: err.message || "Gagal menghapus bukti pembayaran",
      });
    }
  }

  return Response.json({ success: false, error: "Action not found" }, { status: 400 });
}

export default function CustomerOrders() {
  const { ordersData, total } = useLoaderData<typeof loader>() as LoaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const data = fetcher.data as any;
      if (data.success) {
        toast.success(data.message);
      } else if (data.error) {
        toast.error(data.error);
      }
    }
  }, [fetcher.state, fetcher.data]);

  const orders = ordersData.map(normalizeOrder);
  const selectedId = searchParams.get("detail");
  const selectedOrder = selectedId
    ? orders.find((order) => String(order.id) === selectedId) || null
    : null;

  const copyTwibbonLink = async (order: NormalizedOrder) => {
    const link = `${window.location.origin}/public/drive-link/${order.institution_domain || order.order_number}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link twibbon disalin");
  };

  const openNota = (order: NormalizedOrder) => {
    window.open(`/app/orders/${order.id}/download`, "_blank", "noopener,noreferrer");
  };

  if (selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("detail");
          setSearchParams(next);
        }}
        onCopyTwibbon={() => copyTwibbonLink(selectedOrder)}
        onOpenNota={() => openNota(selectedOrder)}
        fetcher={fetcher}
      />
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <header className="pt-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--customer-accent)]">
              Pesanan
            </p>
            <h1 className="mt-1 text-xl font-black text-[var(--customer-primary)]">
              Daftar Pesanan
            </h1>
            <p className="mt-1 text-xs font-semibold text-[var(--customer-text-light)]">
              {total} pesanan dimuat dari API.
            </p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
            <Sparkles size={18} />
          </div>
        </div>
      </header>

      <section className="rounded-[28px] border border-[var(--customer-border)] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--customer-primary-light)] text-[var(--customer-primary)]">
            <PackageCheck size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-text-light)]">
              Data aktif
            </p>
            <p className="mt-1 text-sm font-black text-[var(--customer-primary)]">
              Fokus ke order, status produksi, status pembayaran, dan preview desain.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {orders.length ? (
          orders.map((order, index) => {
            const items = safeParseArray<OrderItem>(order.order_items);
            const previewImages = normalizeImages(order.images);
            const paymentLabel = getPaymentStatusLabel(order.payment_status || "none");
            const productionLabel = getProductionStatusLabel(order.status || "pending");
            const isPrinted = Boolean(order.status_printed) && String(order.status_printed) !== "0";

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-[28px] border border-[var(--customer-border)] bg-white shadow-[0_12px_30px_rgba(30,67,76,0.06)]"
              >
                <button
                  type="button"
                  onClick={() => setSearchParams({ detail: String(order.id) })}
                  className="flex w-full flex-col gap-4 p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--customer-accent)]">
                        No. Pesanan
                      </p>
                      <h2 className="mt-1 truncate text-base font-black text-[var(--customer-primary)]">
                        {order.order_number || "-"}
                      </h2>
                      <p className="mt-1 truncate text-xs font-semibold text-[var(--customer-text-muted)]">
                        {order.institution_name || "Instansi belum diisi"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="rounded-full bg-[var(--customer-primary-light)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--customer-primary)]">
                        {productionLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--customer-accent-light)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--customer-accent)]">
                        {paymentLabel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <MetaPill icon={Clock3} label="Dibuat" value={formatShortDateTime(order.created_on)} />
                    <MetaPill icon={CalendarDays} label="Order" value={formatShortDate(order.order_date || order.created_on)} />
                    <MetaPill
                      icon={Truck}
                      label="Cetak"
                      value={isPrinted ? "Sudah" : "Belum"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-[22px] bg-[var(--customer-bg)] p-3">
                    <StatusCard
                      title="Status Produksi"
                      value={productionLabel}
                      tone="primary"
                    />
                    <StatusCard
                      title="Status Pembayaran"
                      value={paymentLabel}
                      tone="accent"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-text-light)]">
                      Gambaran desain akhir ID Card dan Lanyard
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {previewImages.slice(0, 2).map((src, previewIndex) => (
                        <div
                          key={`${order.id}-${previewIndex}`}
                          className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-[var(--customer-border)] bg-[var(--customer-bg)]"
                        >
                          {src ? (
                            <img
                              src={src}
                              alt={`Preview desain ${previewIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div
                              className={[
                                "flex h-full w-full items-center justify-center",
                                previewFallbacks[previewIndex % previewFallbacks.length],
                              ].join(" ")}
                            >
                              <ImageIcon size={18} className="text-white/80" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2 border-t border-[var(--customer-border)] p-4">
                  <button
                    type="button"
                    onClick={() => copyTwibbonLink(order)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--customer-accent-light)] px-3 text-[11px] font-black text-[var(--customer-accent)] transition hover:brightness-95"
                  >
                    <Share2 size={14} />
                    Bagikan Twibbon
                  </button>
                  <button
                    type="button"
                    onClick={() => openNota(order)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--customer-primary)] px-3 text-[11px] font-black text-white transition hover:bg-[var(--customer-primary-hover)]"
                  >
                    <Printer size={14} />
                    Cetak Nota
                  </button>
                </div>

                <div className="border-t border-dashed border-[var(--customer-border)] bg-[var(--customer-bg)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-semibold text-[var(--customer-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText size={12} /> {items.length} item
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ChevronRight size={12} /> Ketuk untuk detail
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <section className="rounded-[28px] border border-[var(--customer-border)] bg-white p-6 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
              <PackageCheck size={20} />
            </div>
            <h2 className="mt-4 text-base font-black text-[var(--customer-primary)]">
              Belum ada pesanan
            </h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-[var(--customer-text-light)]">
              Pesanan yang masuk akan tampil di sini setelah tersimpan ke sistem.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}

function OrderDetail({
  order,
  onBack,
  onCopyTwibbon,
  onOpenNota,
  fetcher,
}: {
  order: NormalizedOrder;
  onBack: () => void;
  onCopyTwibbon: () => void;
  onOpenNota: () => void;
  fetcher: any;
}) {
  const items = safeParseArray<OrderItem>(order.order_items);
  const previewImages = order.images || [];
  const paymentLabel = getPaymentStatusLabel(order.payment_status || "none");
  const productionLabel = getProductionStatusLabel(order.status || "pending");
  const isPrinted = Boolean(order.status_printed) && String(order.status_printed) !== "0";

  return (
    <div className="space-y-4 pb-2">
      <header className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--customer-border)] bg-white text-[var(--customer-primary)] shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--customer-accent)]">
            Detail Pesanan
          </p>
          <h1 className="truncate text-lg font-black text-[var(--customer-primary)]">
            {order.order_number || "-"}
          </h1>
        </div>
      </header>

      <section className="rounded-[28px] border border-[var(--customer-border)] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--customer-text-light)]">
              {order.institution_name || "Instansi belum diisi"}
            </p>
            <p className="mt-1 text-sm font-black text-[var(--customer-primary)]">
              {order.pic_name || "-"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[var(--customer-text-muted)]">
              {order.pic_phone || "-"}
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatusCard title="Status Produksi" value={productionLabel} tone="primary" />
          <StatusCard title="Status Pembayaran" value={paymentLabel} tone="accent" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MetaPill icon={CalendarDays} label="Dibuat" value={formatShortDateTime(order.created_on)} />
          <MetaPill icon={Clock3} label="Jatuh Tempo" value={formatShortDate(order.deadline)} />
          <MetaPill icon={Truck} label="Cetak" value={isPrinted ? "Sudah" : "Belum"} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCopyTwibbon}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--customer-accent-light)] px-3 text-[11px] font-black text-[var(--customer-accent)]"
          >
            <Share2 size={14} />
            Bagikan Twibbon
          </button>
          <button
            type="button"
            onClick={onOpenNota}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--customer-primary)] px-3 text-[11px] font-black text-white"
          >
            <Printer size={14} />
            Cetak Nota
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--customer-border)] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--customer-text-light)]">
              Gambaran desain akhir
            </p>
            <h2 className="mt-1 text-sm font-black text-[var(--customer-primary)]">
              ID Card dan Lanyard
            </h2>
          </div>
          <ImageIcon size={18} className="text-[var(--customer-accent)]" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {previewImages.length ? previewImages.slice(0, 2).map((src, index) => (
            <div
              key={`${order.id}-detail-${index}`}
              className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-[var(--customer-border)] bg-[var(--customer-bg)]"
            >
              <img src={src} alt={`Preview detail ${index + 1}`} className="h-full w-full object-cover" />
            </div>
          )) : (
            previewFallbacks.map((className, index) => (
              <div
                key={`${order.id}-fallback-${index}`}
                className={[
                  "relative aspect-[4/3] overflow-hidden rounded-[20px] border border-[var(--customer-border)]",
                  className,
                ].join(" ")}
              >
                <div className="flex h-full w-full items-center justify-center text-white/80">
                  <ImageIcon size={18} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--customer-border)] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--customer-text-light)]">
              Rincian item
            </p>
            <h2 className="mt-1 text-sm font-black text-[var(--customer-primary)]">
              Item pesanan
            </h2>
          </div>
          <span className="rounded-full bg-[var(--customer-bg)] px-3 py-1 text-[10px] font-black text-[var(--customer-primary)]">
            {items.length} item
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {items.length ? (
            items.map((item, index) => (
              <div
                key={`${order.id}-item-${index}`}
                className="rounded-[20px] bg-[var(--customer-bg)] px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[var(--customer-primary)]">
                      {item.product_name || "Item"}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-[var(--customer-text-muted)]">
                      {item.product_type || "-"} {item.notes ? `• ${item.notes}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[var(--customer-accent)]">
                    {item.qty || 0} pcs
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-[var(--customer-text-light)]">
                  <span>Subtotal</span>
                  <span className="font-black text-[var(--customer-primary)]">
                    {formatCurrency(Number(item.subtotal || 0))}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[20px] bg-[var(--customer-bg)] px-3 py-3 text-xs font-semibold text-[var(--customer-text-muted)]">
              Belum ada rincian item yang masuk dari API.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <CustomerPaymentProofUpload
          kind="dp"
          amountLabel={order.dp_amount ? formatCurrency(Number(order.dp_amount)) : undefined}
          value={order.dp_payment_proof || ""}
          onUploaded={(url) => {
            if (url) {
              fetcher.submit(
                { actionType: "update_payment_proof", id: String(order.id), kind: "dp", url },
                { method: "post" }
              );
            } else {
              fetcher.submit(
                { actionType: "delete_payment_proof", id: String(order.id), kind: "dp" },
                { method: "post" }
              );
            }
          }}
        />
        <CustomerPaymentProofUpload
          kind="paid"
          amountLabel={order.grand_total ? formatCurrency(Number(order.grand_total)) : undefined}
          value={order.payment_proof || ""}
          onUploaded={(url) => {
            if (url) {
              fetcher.submit(
                { actionType: "update_payment_proof", id: String(order.id), kind: "paid", url },
                { method: "post" }
              );
            } else {
              fetcher.submit(
                { actionType: "delete_payment_proof", id: String(order.id), kind: "paid" },
                { method: "post" }
              );
            }
          }}
        />
      </section>
    </div>
  );
}

function MetaPill({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[var(--customer-bg)] px-3 py-2">
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--customer-text-light)]">
        <Icon size={11} />
        {label}
      </div>
      <p className="mt-1 truncate text-[11px] font-black text-[var(--customer-primary)]">{value}</p>
    </div>
  );
}

function StatusCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "primary" | "accent";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[var(--customer-primary-light)] text-[var(--customer-primary)]"
      : "bg-[var(--customer-accent-light)] text-[var(--customer-accent)]";

  return (
    <div className={["rounded-[20px] px-3 py-3", toneClass].join(" ")}>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{title}</p>
      <p className="mt-1 text-[11px] font-black">{value}</p>
    </div>
  );
}

type NormalizedOrder = Omit<CustomerOrderRecord, "images" | "order_items" | "order_designs"> & {
  images: string[];
  order_items: OrderItem[] | string | null;
  order_designs?: any;
};

function normalizeOrder(order: CustomerOrderRecord): NormalizedOrder {
  return {
    ...order,
    images: normalizeImages(order.images, order.order_designs),
    order_items: order.order_items || [],
  };
}

function normalizeImages(images: CustomerOrderRecord["images"], orderDesigns?: any) {
  const designs = safeParseArray<any>(orderDesigns);
  if (designs && designs.length > 0) {
    const idCardDesign = designs.find((d: any) => d.category === "id_card" || d.category === "idcard")?.preview_image;
    const lanyardDesign = designs.find((d: any) => d.category === "lanyard")?.preview_image;
    const result = [idCardDesign, lanyardDesign].filter(Boolean);
    if (result.length > 0) return result;
  }

  if (Array.isArray(images)) {
    return images.filter(Boolean) as string[];
  }

  if (typeof images === "string" && images.trim()) {
    const parsed = safeParseArray<string>(images);
    if (parsed.length) return parsed.filter(Boolean);

    return images
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function formatShortDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(normalizeDateValue(value));
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value?: string) {
  if (!value) return "-";

  const date = new Date(normalizeDateValue(value));
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getProductionStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Menunggu";
    case "ordered":
      return "Dipesan";
    case "confirmed":
      return "Dikonfirmasi";
    case "in_production":
      return "Sedang Produksi";
    case "qc":
      return "QC";
    case "ready":
      return "Siap Kirim";
    case "shipped":
      return "Dikirim";
    case "delivered":
      return "Diterima";
    case "done":
      return "Selesai";
    case "rejected":
      return "Ditolak";
    case "cancelled":
      return "Dibatalkan";
    default:
      return status || "-";
  }
}

function normalizeDateValue(value: string) {
  return value.includes(" ") && !value.includes("T") ? value.replace(" ", "T") : value;
}
