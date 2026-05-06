import React from "react";
import {
  LayoutDashboard,
  FileText,
  History,
  PlusCircle,
  Tag,
  Users2Icon,
  UserCog2Icon,
  Building,
  RecycleIcon,
  ShoppingCart,
  HardDrive,
  Mail,
} from "lucide-react";

export type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  active?: string[];
  children?: MenuItem[];
};

export const navigation = []

export const ADMIN_NAVIGATION: MenuItem[] = [
  {
    id: "dashboard",
    label: "Performa Perusahaan",
    href: "/app/overview",
    icon: LayoutDashboard,
    active: ["/app/overview"],
  },
  {
    id: "form",
    label: "Input Pesanan",
    href: "/app/order-form",
    icon: PlusCircle,
  },
  {
    id: "orders",
    label: "Daftar Pesanan",
    href: "/app/order-list",
    icon: FileText,
    active: ["/app/order-list", "/app/order-manage"],
  },
  {
    id: "products",
    label: "Daftar Produk",
    href: "/app/product-list",
    icon: Tag,
  },
  {
    id: "procurement",
    label: "Pengadaan",
    href: "/app/procurement/id_card_with_lanyard/shopping",
    icon: ShoppingCart,
  },
  {
    id: "portfolio",
    label: "Riwayat Pesanan",
    href: "/app/order-history",
    icon: History,
  },
  {
    id: "finance",
    label: "Keuangan",
    href: "/app/finance",
    icon: Users2Icon,
  },
  {
    id: "drive",
    label: "Pusat Data",
    href: "/app/drive/customer",
    icon: HardDrive,
    active: ["/app/drive", "/app/drive/internal", "/app/drive/customer"],
  },
  {
    id: "email",
    label: "Email Penawaran",
    href: "/app/email",
    icon: Mail,
  },
  {
    id: "users",
    label: "Manajemen Akun",
    href: "/app/user",
    icon: UserCog2Icon,
  },
  {
    id: "institution",
    label: "Manajemen Institusi",
    href: "/app/master/institution",
    icon: Building,
  },
  {
    id: "bin",
    label: "Recycle Bin",
    href: "/app/setting/recycle-bin",
    icon: RecycleIcon,
  },
];
