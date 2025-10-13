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
  {
    name: "Produk",
    icon: "Package",
    active: ["/app/product", "/app/product/manage"],
    children: [
      {
        name: "Daftar Produk",
        href: "/app/product",
        active: ["/app/product"],
      },
      {
        name: "Paket Produk",
        href: "/app/product/package",
        active: ["/app/product/package"],
      },
      // {
      //   name: "Kategori & Variasi",
      //   href: "/app/product/category",
      //   active: ["/app/product/category"],
      // },
      // {
      //   name: "Stok & Ketersediaan",
      //   href: "/users/list",
      //   active: ["/users/list"],
      // },
      // {
      //   name: "Harga & Biaya Produksi",
      //   href: "/users/list",
      //   active: ["/users/list"],
      // },
    ],
  },
  {
    name: "Pesanan",
    icon: "ShoppingCart",
    active: ["/users", "/users/list", "/users/roles"],
    children: [
      {
        name: "Semua Pesanan",
        href: "/app/order/pending",
        // icon: "FileText",
        active: ["/app/order/pending"],
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
    active: [],
    // active: [
    //   "/app/production/stock",
    //   "/app/production/stock-adjustment",
    //   "/app/production/retur-order",
    //   "/app/production/purchase-order",
    // ],
    children: [
      {
        name: "Manajemen Stok",
        href: "/app/production/stock",
        // icon: "FileText",
        active: ["/app/production/stock"],
      },
      {
        name: "Penyesuaian Stok",
        href: "/app/production/adjustment-stock",
        // icon: "FileText",
        active: ["/app/production/adjustment-stock"],
      },
      // {
      //   name: "Distribusi Toko",
      //   href: "/app/production/stock",
      //   // icon: "FileText",
      //   active: ["/app/production/stock"],
      // },
      {
        name: "Retur / Rusak",
        href: "/app/production/retur-order",
        // icon: "FileText",
        active: ["/app/production/retur-order"],
      },
      {
        name: "Pembelian",
        href: "/app/production/purchase-order",
        // icon: "FileText",
        active: ["/app/production/purchase-order"],
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
      // {
      //   name: "Pelanggan",
      //   href: "/app/master/customer",
      //   active: ["/app/master/customer"],
      // },
      {
        name: "Toko",
        href: "/app/master/supplier",
        active: ["/app/master/supplier"],
      },
      {
        name: "Komponen",
        href: "/app/master/commodity",
        active: ["/app/master/commodity"],
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
  {
    name: "Keuangan",
    href: "/app/finance",
    icon: "Wallet",
    active: ["/app/finance"],
    children: [
      {
        name: "Laporan Keuangan",
        href: "/app/master/institution",
        active: ["/app/master/institution"],
      },
      {
        name: "Pajak",
        href: "/app/master/institution",
        active: ["/app/master/institution"],
      },
      {
        name: "Tagihan & Pembayaran",
        href: "/app/master/institution",
        active: ["/app/master/institution"],
      },
    ],
  },
  {
    name: "Inventaris", // Laporan Penjualan per Acara, Statistik Produk Terlaris, Riwayat Kolaborasi Panitia
    href: "/app/asset",
    icon: "FileText",
    active: ["/app/asset"],
  },
  {
    name: "Kepegawaian", // Laporan Penjualan per Acara, Statistik Produk Terlaris, Riwayat Kolaborasi Panitia
    href: "/app/employee",
    icon: "Users",
    active: ["/app/employee"],
    children: [
      {
        name: "Penggajian",
        href: "/app/employee/salary",
        active: ["/app/employee/salary"],
      },
    ],
  },
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
