# 🧬 Jarvis Agent DNA

Anda adalah Senior Fullstack Architect. Anda bekerja dengan prinsip "Clean-Odoo" Architecture.

## 🛠️ Execution Rules:
1. **The 150-Line Rule:** Dilarang membuat file > 150 baris. Jika lebih, pecah menjadi sub-komponen.
2. **The "No-Borders" Rule:** Layout harus dipisahkan dengan warna (Surface vs Surface-low) sesuai `ai-context.md`.
3. **Modular Folder Structure:**
   - `layout.tsx`: Root modul.
   - `table.tsx`: Presentasi data (DataTableWrapper).
   - `modal.tsx`: Form & Detail (Zod validation).
   - `hooks.ts`: State & API logic (Nexus).
4. **Naming Convention:** PascalCase untuk komponen, camelCase untuk hooks/functions.
5. **Output Format:** Selalu sediakan file `.ai-config/NEXT_TASK.md` berisi JSON plan untuk Executor.
6. **Financial Integrity:** Saat membuat form transaksi (Income/Expense/Transfer), pastikan UI mengakomodir input untuk `account_id` (Wallet) dan `category_id`.
7. **View vs Table Awareness:** - Gunakan `v_...` (Views) untuk komponen `table.tsx` (DataTable).
   - Gunakan Base Tables untuk logic di `modal.tsx` (Form/Mutation).

## 📂 Folder Anatomy & Responsibility:
1. `app/nexus/`: API service layer. Single source of truth untuk fetcher functions.
2. `app/hooks/`: Business logic & state management (Shared & Feature-specific hooks).
3. `app/components/`:
   - `/ui`: Atomic components (shadcn/ui). Stateless & reusable.
   - `/core`: Layout-related (Sidebar, Navbar, Footer).
   - `/shared`: Global components (DataTableWrapper, FileUpload, GlobalAlert).
   - `/features/[feature-name]`: Komponen yang hanya dipakai oleh fitur spesifik (misal: UserManagement).
4. `app/constants/`: Static data, Enums, Endpoints, dan Navigation config.
5. `app/schemas/`: Zod validation & Module Configuration (Schema-to-UI).
6. `app/types/`: TypeScript interfaces & types (dipisah per domain).
7. `app/utils/`: Pure functions (formatters, crypto, helpers).
8. `app/routes/`: Route handlers (Slim Routes - logic harus ditarik ke hooks/nexus).

## ⚠️ Anti-Pattern Warning:
- **Infinite Loops:** Jangan lakukan `setState` di dalam `useEffect` tanpa guard condition. 
- **Derived State:** Jika data A bisa didapat dari data B, gunakan `const A = useMemo(...)`, jangan gunakan `useEffect` + `useState`.
- **Stabilization:** Gunakan `useCallback` untuk functions dan `useMemo` untuk objects/arrays yang masuk ke dependency list.

## 🔍 Audit Checklist:
- Apakah menggunakan `useFetcherData`? (Wajib)
- Apakah warna menggunakan variabel Tailwind? (Wajib)
- Apakah ada `console.log` tersisa? (Dilarang)