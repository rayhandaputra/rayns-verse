# 📜 Architecture Ledger

## Project Status: Initialized
- **Date:** 2026-04-20
- **Version:** 1.0.0
- **Standard:** Holistic Equilibrium applied.

---
### Change Logs:
- [2026-04-20] Jarvis-System Integrated. Setup .ai-config completed.
- [2026-04-20] Created `app/utils/cn.ts` — clsx + tailwind-merge utility.
- [2026-04-20] Created `app/components/ui/button.tsx` — Button component (CVA, 5 variants, Digital Sanctuary palette).
- [2026-04-20] Installed `class-variance-authority`, `@radix-ui/react-slot`.
- [2026-04-20] Integrated Button into `app/routes/login.tsx` (primary submit, glass lang-selector, link auth-toggle).
- [2026-04-20] Refactored `app/routes/login.tsx`: Updated wording to "The Digital Sanctuary" standard, applied Sage Green/Creme palette, and modularized into `.hooks.ts` and `.components.tsx` (150-line rule).
- [2026-04-22] Fixed auth race condition in `app/context/auth-context.tsx` — added isMounted flag to prevent stale state updates on hard refresh. Ensures localStorage.rayns_user_id persists across Ctrl+Shift+R.
- [2026-04-22] Migrated login page to "Finance Blue" design system. Updated `login.tsx`, `login.components.tsx`, `button.tsx` — replaced Sage Green/Warm Creme palette with Deep Teal (#1E434C), Accent Cyan (#0097B2), Cool White-Blue (#F3F8FC) surface. Input fields use #E2EEF7 bg with rounded-2xl.
- [2026-04-22] Refactored `app/components/features/home/bottom-nav.tsx` — implemented NavLink routing, popover menu for "Lainnya" items, Finance Blue tokens (#0097B2 active, #1E293B inactive). Extracted NAV_ITEMS and MORE_ITEMS constants. 117 lines, under 150-line limit. Synchronized with mobile/bottom-nav.tsx standard.
- [2026-04-22] Fixed localStorage wipe on 404 routes. Enhanced `app/root.tsx` ErrorBoundary to distinguish 404 from auth errors (show Back/Home buttons instead of triggering cleanup). Added 401 handler to POST/PUT/DELETE in `app/utils/api.ts` for consistent auth failure handling across all HTTP methods. Now 404 errors preserve session.
- [2026-04-22] Implemented Mobile-First UI for home page following App-Shell pattern. Added "Mobile-First Layout Standard" to `ai-context.md`. Refactored `app/routes/home.tsx` with RouteGuard. Created `app/components/features/home/summary-card.tsx` (hero with primary gradient & glassmorphism), `activity-list.tsx` (recent transactions with tonal separators), and `app/hooks/useHomeData.ts` (shared hook). All components under 150-line limit, Finance Blue palette applied throughout.
- [2026-04-22] Fixed audit failure: Added `APIProvider` wrapper to `app/routes/home.tsx` to enable SWR context for `useHomeData` hook. Hook now correctly resolves fetcher and auth headers from `app/utils/api.ts`. Context chain: RouteGuard → APIProvider → HomeLayout → (SummaryCard, ActivityList).