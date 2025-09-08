import type { Icons } from "~/components/icon/asset";

export type NavItem = {
  name: string;
  href?: string;
  icon?: keyof typeof Icons;
  active?: string[];
  children?: NavItem[];
};

export const navigation: NavItem[] = [
  {
    name: "Overview",
    href: "/app/overview",
    icon: "LayoutDashboard",
    active: ["/app/overview"],
  },
  // {
  //   name: "Produk & Inventaris",
  //   icon: "Package",
  //   active: ["/manage/product", "/manage/category"],
  //   children: [
  //     {
  //       name: "Daftar Produk",
  //       href: "/manage/product",
  //       active: ["/manage/product"],
  //     },
  //     {
  //       name: "Kategori & Variasi",
  //       href: "/manage/category",
  //       active: ["/manage/category"],
  //     },
  //     {
  //       name: "Stok & Ketersediaan",
  //       href: "/users/list",
  //       active: ["/users/list"],
  //     },
  //     {
  //       name: "Harga & Biaya Produksi",
  //       href: "/users/list",
  //       active: ["/users/list"],
  //     },
  //   ],
  // },
  {
    name: "Pesanan",
    icon: "ShoppingCart",
    active: ["/users", "/users/list", "/users/roles"],
    children: [
      {
        name: "Semua Pesanan",
        href: "/app/order",
        // icon: "FileText",
        active: ["/app/order"],
      },
      // {
      //   name: "Detail Item Custom",
      //   href: "/users/roles",
      //   icon: "FileText",
      //   active: ["/users/roles"],
      // },
      // {
      //   name: "Status Produksi & Pengiriman",
      //   href: "/users/roles",
      //   icon: "FileText",
      //   active: ["/users/roles"],
      // },
      // {
      //   name: "Unggah Desain & Template",
      //   href: "/users/roles",
      //   icon: "FileText",
      //   active: ["/users/roles"],
      // },
    ],
  },
  // {
  //   name: "Manajemen Acara",
  //   icon: "CalendarCheck",
  //   active: ["/users", "/users/list", "/users/roles"],
  //   children: [
  //     {
  //       name: "Daftar Acara",
  //       href: "/users/list",
  //       icon: "FileText",
  //       active: ["/users/list"],
  //     },
  //     {
  //       name: "Info Acara",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //     {
  //       name: "Panitia Terkait",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //     {
  //       name: "Token Akses Panitia",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //   ],
  // },
  {
    name: "Produksi",
    icon: "CalendarCheck",
    active: ["/app/production/stock"],
    children: [
      {
        name: "Manajemen Stok",
        href: "/app/production/stock",
        // icon: "FileText",
        active: ["/app/production/stock"],
      },
    ],
  },
  {
    name: "Master Data",
    icon: "Layers",
    active: ["/users", "/users/list", "/users/roles"],
    children: [
      {
        name: "Institusi",
        href: "/app/master/institution",
        active: ["/app/master/institution"],
      },
      {
        name: "Customer",
        href: "/app/master/customer",
        active: ["/app/master/customer"],
      },
      {
        name: "Supplier",
        href: "/app/master/supplier",
        active: ["/app/master/supplier"],
      },
    ],
  },
  // {
  //   name: "Pelanggan / Panitia",
  //   icon: "Users",
  //   active: ["/users", "/users/list", "/users/roles"],
  //   children: [
  //     {
  //       name: "Daftar Panitia / PIC",
  //       href: "/users/list",
  //       icon: "FileText",
  //       active: ["/users/list"],
  //     },
  //     {
  //       name: "Relasi ke Acara",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //     {
  //       name: "History Pesanan per Panitia",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //   ],
  // },
  // {
  //   name: "Survei & Formulir",
  //   icon: "ClipboardList",
  //   active: ["/users", "/users/list", "/users/roles"],
  //   children: [
  //     {
  //       name: "Form Customisasi Pesanan",
  //       href: "/users/list",
  //       icon: "FileText",
  //       active: ["/users/list"],
  //     },
  //     {
  //       name: "Kuesioner Pra-Pemesanan",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //     {
  //       name: "Riwayat Respon Survei",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //   ],
  // },
  // {
  //   name: "Media & Desain",
  //   icon: "ImagePlus",
  //   active: ["/users", "/users/list", "/users/roles"],
  //   children: [
  //     {
  //       name: "Galeri Twibbon & Template",
  //       href: "/users/list",
  //       icon: "FileText",
  //       active: ["/users/list"],
  //     },
  //     {
  //       name: "Upload & Kelola Gambar Custom",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //     {
  //       name: "Preview Produk Kustomisasi",
  //       href: "/users/roles",
  //       icon: "FileText",
  //       active: ["/users/roles"],
  //     },
  //   ],
  // },
  // {
  //   name: "Keuangan & Tagihan", // Tagihan dan Pembayaran, Status Pembayaran, Download Invoice / Nota
  //   href: "/finance",
  //   icon: "Wallet",
  //   active: ["/finance"],
  // },
  // {
  //   name: "Laporan & Statistik", // Laporan Penjualan per Acara, Statistik Produk Terlaris, Riwayat Kolaborasi Panitia
  //   href: "/report",
  //   icon: "FileText",
  //   active: ["/report"],
  // },
  // {
  //   name: "Email",
  //   href: "/report",
  //   icon: "Mail",
  //   active: ["/report"],
  // },
  // {
  //   name: "Drive",
  //   // href: "/report",
  //   href: "/app/setting/account",
  //   icon: "HardDrive",
  //   active: ["/report"],
  // },
  // {
  //   name: "Aktivitas Sistem / Audit Log",
  //   href: "/report",
  //   icon: "HardDrive",
  //   active: ["/report"],
  // },
  {
    name: "Pengaturan", // Kelola Admin & Hak Akses, Template Pesanan Default, Manajemen Token Akses Panitia
    icon: "SettingsIcon",
    active: ["/users", "/users/list", "/users/roles", "/app/setting/account"],
    children: [
      // {
      //   name: "List",
      //   href: "/users/list",
      //   icon: "FileText",
      //   active: ["/users/list"],
      // },
      // {
      //   name: "Roles",
      //   href: "/users/roles",
      //   icon: "FileText",
      //   active: ["/users/roles"],
      // },
      {
        name: "Akun Pengguna",
        href: "/app/setting/account",
        icon: "Users",
        active: ["/app/setting/account"],
      },
    ],
  },
];
