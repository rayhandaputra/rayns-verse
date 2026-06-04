import { Link } from "react-router";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  IdCard,
  Landmark,
  Package,
  Phone,
  Plus,
  Shirt,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { CustomerPaymentProofUpload } from "~/components/customer/CustomerPaymentProofUpload";

const steps = ["Kontak", "Produk", "Jadwal", "Bayar"];

const productTypes = [
  { label: "ID Card", icon: IdCard, price: 12000 },
  { label: "Lanyard", icon: Tag, price: 9000 },
  { label: "Paket Event", icon: Package, price: 18500 },
  { label: "Kaos", icon: Shirt, price: 85000 },
];

const deliveryOptions = [
  { label: "Standar", eta: "3-5 hari", price: 25000 },
  { label: "Prioritas", eta: "2-3 hari", price: 45000 },
  { label: "Ekspres", eta: "1-2 hari", price: 75000 },
];

const paymentMethods = [
  { label: "Transfer Bank", detail: "Virtual account Kinau", icon: Landmark },
  { label: "Kartu Debit", detail: "Visa / Mastercard", icon: CreditCard },
  { label: "DP Manual", detail: "Bayar sebagian dulu", icon: Plus },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function WizardStep({
  index,
  active,
  complete,
}: {
  index: number;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="relative z-10 flex min-w-0 flex-col items-center">
      <span
        className={[
          "grid h-6 w-6 place-items-center rounded-full text-[9px] font-black ring-4 ring-white",
          active || complete
            ? "bg-[var(--customer-accent)] text-white"
            : "bg-[var(--customer-border)] text-[var(--customer-text-light)]",
        ].join(" ")}
      >
        {complete ? <Check size={12} strokeWidth={3} /> : index + 1}
      </span>
      <span
        className={[
          "mt-2 max-w-full truncate text-[8px] font-black leading-none",
          active ? "text-[var(--customer-primary)]" : "text-[var(--customer-text-light)]",
        ].join(" ")}
      >
        {steps[index]}
      </span>
    </div>
  );
}

function Field({
  label,
  placeholder,
  icon: Icon,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  icon?: typeof User;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black text-[var(--customer-primary)]">
        {label}
      </span>
      <span className="flex min-h-12 items-center gap-2 rounded-2xl bg-white px-3 shadow-sm ring-1 ring-[var(--customer-border)] focus-within:ring-[var(--customer-border-active)]">
        {Icon ? (
          <Icon size={15} className="shrink-0 text-[var(--customer-text-light)]" />
        ) : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[var(--customer-primary)] outline-none placeholder:text-[var(--customer-text-light)]"
        />
      </span>
    </label>
  );
}

function TextArea({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black text-[var(--customer-primary)]">
        {label}
      </span>
      <textarea
        rows={4}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl bg-white px-3 py-3 text-xs font-bold leading-5 text-[var(--customer-primary)] shadow-sm outline-none ring-1 ring-[var(--customer-border)] placeholder:text-[var(--customer-text-light)] focus:ring-[var(--customer-border-active)]"
      />
    </label>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[26px] bg-white/70 p-4 shadow-[0_18px_45px_rgba(30,67,76,0.06)] ring-1 ring-white">
      {children}
    </section>
  );
}

export default function CustomerConfigure() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(productTypes[0]);
  const [selectedDelivery, setSelectedDelivery] = useState(deliveryOptions[0]);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]);
  const [quantity, setQuantity] = useState("100");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dpProofUrl, setDpProofUrl] = useState("");
  const [paidProofUrl, setPaidProofUrl] = useState("");
  const [isOrderCreated, setIsOrderCreated] = useState(false);

  const subtotal = useMemo(() => {
    const qty = Number(quantity) || 0;
    return selectedProduct.price * qty;
  }, [quantity, selectedProduct.price]);

  const total = subtotal + selectedDelivery.price;

  if (isOrderCreated) {
    return (
      <section className="relative flex min-h-[calc(100vh-1.5rem)] flex-col items-center justify-center overflow-hidden bg-white px-6 py-10 text-center">
        <div className="pointer-events-none absolute inset-0">
          {[
            "left-10 top-12 rotate-45 bg-[var(--customer-accent)]",
            "right-12 top-16 -rotate-12 bg-[var(--customer-danger)]",
            "left-20 top-28 -rotate-45 bg-[var(--customer-primary)]",
            "right-16 top-36 rotate-45 bg-[var(--customer-accent)]",
            "left-9 bottom-28 -rotate-12 bg-[var(--customer-primary)]",
            "right-9 bottom-20 rotate-45 bg-[var(--customer-danger)]",
            "left-24 bottom-16 rotate-12 bg-[var(--customer-accent)]",
          ].map((className) => (
            <span
              key={className}
              className={[
                "absolute h-1.5 w-1.5 rounded-sm opacity-75",
                className,
              ].join(" ")}
            />
          ))}
          <span className="absolute left-7 top-20 h-0.5 w-5 rotate-45 rounded-full bg-[var(--customer-primary)] opacity-75" />
          <span className="absolute right-9 top-24 h-0.5 w-5 -rotate-45 rounded-full bg-[var(--customer-primary)] opacity-75" />
          <span className="absolute left-8 bottom-20 h-0.5 w-5 -rotate-12 rounded-full bg-[var(--customer-primary)] opacity-75" />
          <span className="absolute right-12 bottom-32 h-0.5 w-5 rotate-12 rounded-full bg-[var(--customer-primary)] opacity-75" />
        </div>

        <div className="relative z-10 w-full max-w-[300px]">
          <p className="text-[10px] font-black text-[var(--customer-text-muted)]">
            ID Pesanan
          </p>
          <p className="mt-1 text-xs font-black text-[var(--customer-primary)]">
            #1190377827
          </p>

          <h1 className="mt-8 text-2xl font-black tracking-tight text-[var(--customer-primary)]">
            Selamat!
          </h1>
          <p className="mt-2 text-sm font-bold text-[var(--customer-danger)]">
            Pesanan kamu berhasil dibuat
          </p>

          <div className="mx-auto mt-9 grid h-28 w-28 place-items-center rounded-full bg-[var(--customer-primary)] text-white shadow-[0_24px_55px_rgba(30,67,76,0.22)]">
            <Check size={58} strokeWidth={3.2} />
          </div>

          <div className="mt-12 space-y-3">
            <Link
              to="/customer/orders"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--customer-primary-light)] px-4 text-xs font-black text-[var(--customer-primary)] transition hover:bg-[var(--customer-accent-light)]"
            >
              Lacak pesanan
            </Link>
            <Link
              to="/customer/dashboard"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--customer-card-hover)] px-4 text-xs font-black text-[var(--customer-primary)] transition hover:bg-[var(--customer-bg)]"
            >
              Batalkan pesanan?
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-1.5rem)] pb-4">
      <header className="flex items-center justify-between">
        <Link
          to="/customer/dashboard"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--customer-primary)] shadow-sm ring-1 ring-[var(--customer-border)]"
          aria-label="Kembali"
        >
          <ArrowLeft size={17} strokeWidth={2.4} />
        </Link>
        <h1 className="text-base font-black text-[var(--customer-primary)]">
          Pesanan Baru
        </h1>
        <span className="h-9 w-9" />
      </header>

      <div className="mt-5 rounded-[28px] bg-white px-5 pb-4 pt-4 shadow-[0_24px_60px_rgba(30,67,76,0.08)] ring-1 ring-[var(--customer-border)]">
        <div className="relative grid grid-cols-4">
          <div className="absolute left-[12.5%] right-[12.5%] top-3 h-0.5 rounded-full bg-[var(--customer-border)]" />
          <div
            className="absolute left-[12.5%] top-3 h-0.5 rounded-full bg-[var(--customer-accent)] transition-all"
            style={{ width: `${(activeStep / (steps.length - 1)) * 75}%` }}
          />
          {steps.map((step, index) => (
            <WizardStep
              key={step}
              index={index}
              active={activeStep === index}
              complete={activeStep > index}
            />
          ))}
        </div>
      </div>

      <form className="mt-5 space-y-4">
        {activeStep === 0 ? (
          <SectionCard>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                <User size={18} />
              </span>
              <div>
                <h2 className="text-sm font-black text-[var(--customer-primary)]">
                  Detail Kontak
                </h2>
                <p className="text-[10px] font-semibold text-[var(--customer-text-light)]">
                  Data pemesan dan instansi untuk invoice.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <Field
                label="Nama Pemesan"
                placeholder="Masukkan nama lengkap"
                icon={User}
                value={customerName}
                onChange={setCustomerName}
              />
              <Field
                label="Nomor WhatsApp"
                placeholder="+62 812-0000-0000"
                icon={Phone}
                value={customerPhone}
                onChange={setCustomerPhone}
              />
              <Field
                label="Nama Instansi"
                placeholder="Sekolah, kampus, komunitas, atau pribadi"
                icon={Building2}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kota" placeholder="Kota" />
                <Field label="Kode Pos" placeholder="Kode pos" />
              </div>
            </div>
          </SectionCard>
        ) : null}

        {activeStep === 1 ? (
          <SectionCard>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                <Package size={18} />
              </span>
              <div>
                <h2 className="text-sm font-black text-[var(--customer-primary)]">
                  Detail Produk
                </h2>
                <p className="text-[10px] font-semibold text-[var(--customer-text-light)]">
                  Pilih layanan cetak dan jumlah kebutuhan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {productTypes.map((product) => {
                const Icon = product.icon;
                const selected = selectedProduct.label === product.label;

                return (
                  <button
                    key={product.label}
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className={[
                      "rounded-2xl border bg-white p-3 text-left transition",
                      selected
                        ? "border-[var(--customer-border-active)] shadow-[0_14px_35px_rgba(0,151,178,0.12)]"
                        : "border-[var(--customer-border)] hover:border-[var(--customer-border-active)]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-9 w-9 place-items-center rounded-xl",
                        selected
                          ? "bg-[var(--customer-accent-light)] text-[var(--customer-accent)]"
                          : "bg-[var(--customer-bg)] text-[var(--customer-text-light)]",
                      ].join(" ")}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="mt-3 block text-xs font-black text-[var(--customer-primary)]">
                      {product.label}
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold text-[var(--customer-text-light)]">
                      mulai {formatMoney(product.price)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              <Field
                label="Jumlah"
                placeholder="100"
                type="number"
                value={quantity}
                onChange={setQuantity}
              />
              <TextArea
                label="Catatan Pesanan"
                placeholder="Tuliskan ukuran, warna, material, atau kebutuhan custom..."
              />
            </div>
          </SectionCard>
        ) : null}

        {activeStep === 2 ? (
          <SectionCard>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                <CalendarDays size={18} />
              </span>
              <div>
                <h2 className="text-sm font-black text-[var(--customer-primary)]">
                  Jadwal Produksi
                </h2>
                <p className="text-[10px] font-semibold text-[var(--customer-text-light)]">
                  Tentukan deadline dan opsi pengiriman.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Field
                label="Deadline"
                placeholder="Pilih tanggal"
                type="date"
                icon={CalendarDays}
              />
              <TextArea
                label="Alamat Pengiriman"
                placeholder="Masukkan alamat lengkap pengiriman..."
              />
            </div>

            <div className="mt-4 space-y-3">
              {deliveryOptions.map((option) => {
                const selected = selectedDelivery.label === option.label;

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedDelivery(option)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition",
                      selected ? "border-[var(--customer-border-active)]" : "border-[var(--customer-border)]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                        selected
                          ? "border-[var(--customer-accent)] bg-[var(--customer-accent)] text-white"
                          : "border-[var(--customer-border)]",
                      ].join(" ")}
                    >
                      {selected ? <Check size={12} strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-[var(--customer-primary)]">
                        {option.label}
                      </span>
                      <span className="block text-[10px] font-semibold text-[var(--customer-text-light)]">
                        {option.eta}
                      </span>
                    </span>
                    <span className="text-xs font-black text-[var(--customer-primary)]">
                      {formatMoney(option.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        ) : null}

        {activeStep === 3 ? (
          <SectionCard>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-sm font-black text-[var(--customer-primary)]">
                  Ringkasan Pesanan
                </h2>
                <p className="text-[10px] font-semibold text-[var(--customer-text-light)]">
                  Periksa estimasi sebelum dikirim ke tim Kinau.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[var(--customer-border)]">
              <div className="flex items-start justify-between gap-4 border-b border-dashed border-[var(--customer-border)] pb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-accent)]">
                    Produk
                  </p>
                  <h3 className="mt-1 text-sm font-black text-[var(--customer-primary)]">
                    {selectedProduct.label}
                  </h3>
                  <p className="mt-1 text-[10px] font-semibold text-[var(--customer-text-light)]">
                    {Number(quantity) || 0} buah x {formatMoney(selectedProduct.price)}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--customer-accent-light)] px-3 py-1 text-[10px] font-black text-[var(--customer-accent)]">
                  Draft
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs font-bold">
                <div className="flex justify-between text-[var(--customer-text-muted)]">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[var(--customer-text-muted)]">
                  <span>Pengiriman</span>
                  <span>{formatMoney(selectedDelivery.price)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--customer-border)] pt-3 text-sm font-black text-[var(--customer-primary)]">
                  <span>Total Estimasi</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[var(--customer-primary)]">
                  Metode Pembayaran
                </h3>
                <button
                  type="button"
                  className="text-[10px] font-black text-[var(--customer-accent)]"
                >
                  Kelola
                </button>
              </div>

              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const selected = selectedPayment.label === method.label;

                return (
                  <button
                    key={method.label}
                    type="button"
                    onClick={() => setSelectedPayment(method)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition",
                      selected ? "border-[var(--customer-border-active)]" : "border-[var(--customer-border)]",
                    ].join(" ")}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--customer-bg)] text-[var(--customer-accent)]">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-[var(--customer-primary)]">
                        {method.label}
                      </span>
                      <span className="block text-[10px] font-semibold text-[var(--customer-text-light)]">
                        {method.detail}
                      </span>
                    </span>
                    <span
                      className={[
                        "grid h-5 w-5 place-items-center rounded-full border",
                        selected
                          ? "border-[var(--customer-accent)] bg-[var(--customer-accent)] text-white"
                          : "border-[var(--customer-border)]",
                      ].join(" ")}
                    >
                      {selected ? <Check size={12} strokeWidth={3} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <h3 className="text-xs font-black text-[var(--customer-primary)]">
                  Bukti Pembayaran
                </h3>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-[var(--customer-text-light)]">
                  Upload salah satu atau keduanya sesuai status pembayaran pesanan.
                </p>
              </div>
              <CustomerPaymentProofUpload
                kind="dp"
                amountLabel={formatMoney(Math.ceil(total * 0.5))}
                value={dpProofUrl}
                onUploaded={setDpProofUrl}
              />
              <CustomerPaymentProofUpload
                kind="paid"
                amountLabel={formatMoney(total)}
                value={paidProofUrl}
                onUploaded={setPaidProofUrl}
              />
            </div>
          </SectionCard>
        ) : null}

        <div className="sticky bottom-4 grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
            className="min-h-12 rounded-2xl bg-white text-xs font-black text-[var(--customer-primary)] shadow-sm ring-1 ring-[var(--customer-border)] disabled:opacity-50"
            disabled={activeStep === 0}
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeStep === steps.length - 1) {
                setIsOrderCreated(true);
                return;
              }

              setActiveStep((step) => Math.min(steps.length - 1, step + 1));
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--customer-accent),var(--customer-primary))] px-4 text-xs font-black text-white shadow-[0_18px_38px_rgba(0,151,178,0.22)]"
          >
            {activeStep === steps.length - 1 ? "Kirim Pesanan" : "Lanjut"}
            <ChevronRight size={15} strokeWidth={3} />
          </button>
        </div>
      </form>
    </section>
  );
}
