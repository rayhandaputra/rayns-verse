// Data akses backstage PT Kinau Digital Kreatif.
//
// CATATAN KEAMANAN: file ini menyimpan kredensial plaintext dan ikut
// terbaca siapa pun yang punya akses repo. Halaman /akses sendiri sudah
// di balik guard login, tapi untuk jangka panjang pindahkan password ke
// secret vault / backend (jangan permanen di repo).

export interface AccessLink {
  label: string;
  href: string;
}

export interface AccessEntry {
  id: string;
  label: string;
  category: string;
  url: string;
  urlLabel: string;
  extraLinks?: AccessLink[];
  username?: string;
  usernameLabel?: string;
  password?: string;
  authNote?: string;
  notes: string;
}

export const ACCESS_ENTRIES: AccessEntry[] = [
  {
    id: "hosting",
    label: "Hosting Manager",
    category: "Hosting",
    url: "https://data.kinau.web.id/cpanel",
    urlLabel: "data.kinau.web.id/cpanel",
    username: "ceo@kinau.web.id",
    usernameLabel: "Username cPanel",
    password: "Kinaudigitalkreatif2026",
    notes: "Kelola file, domain, SSL, dan backup via cPanel.",
  },
  {
    id: "database",
    label: "Database",
    category: "Database",
    url: "https://data.kinau.web.id",
    urlLabel: "data.kinau.web.id",
    username: "developer@kinau.id",
    usernameLabel: "Username",
    password: "Kinaudev123*",
    notes: "Akses instan ke database.",
  },
  {
    id: "email",
    label: "Google Mail",
    category: "Email",
    url: "https://mail.google.com",
    urlLabel: "mail.google.com",
    username: "business.kinauid@gmail.com",
    usernameLabel: "Email",
    password: "Kinaudigitalkreatif2026",
    notes: "Email operasional bisnis.",
  },
  {
    id: "github",
    label: "GitHub",
    category: "Repository",
    url: "https://github.com",
    urlLabel: "github.com",
    authNote: "Login via Gmail",
    notes: "Autentikasi memakai akun Gmail, tanpa password tersimpan.",
  },
  {
    id: "vercel",
    label: "Vercel",
    category: "Deploy",
    url: "https://vercel.com",
    urlLabel: "vercel.com",
    extraLinks: [
      { label: "kinauid-chi.vercel.app", href: "https://kinauid-chi.vercel.app" },
    ],
    authNote: "Login via Gmail",
    notes: "Dashboard deploy + URL production.",
  },
];
