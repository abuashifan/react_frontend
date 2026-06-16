# Phase 1A — Project Setup

**Label:** `setup`
**Status:** ✅ Done
**Verifikasi:** `npm run dev` berjalan tanpa error, halaman kosong tampil.
**Commit:** `feat(setup): initialize project — vite, react, typescript, tailwind, shadcn`

---

## Issues

### ISSUE-1A-01 — Initialize React + Vite + TypeScript
- Scaffold project dengan Vite template React + TypeScript
- Pastikan `npm run dev` dan `npm run build` berjalan bersih

### ISSUE-1A-02 — Install semua dependencies
- Core: `react`, `react-dom`, `react-router-dom`
- State: `zustand`, `@tanstack/react-query`
- Form: `react-hook-form`, `@hookform/resolvers`, `zod`
- HTTP: `axios`
- UI: `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`

### ISSUE-1A-03 — Setup Tailwind CSS + design tokens
- Install dan konfigurasi Tailwind
- Definisikan design tokens di `tailwind.config.ts`: warna brand, spacing, font Inter
- Setup `font-variant-numeric: tabular-nums` untuk angka

### ISSUE-1A-04 — Setup Shadcn/ui + install semua komponen
- Init Shadcn/ui dengan CLI
- Install: button, input, select, dialog, toast, checkbox, dropdown-menu, separator, badge, skeleton, tooltip, popover, calendar, table, form, label, textarea, scroll-area, alert

### ISSUE-1A-05 — Setup path alias @/
- Konfigurasi `vite.config.ts` dan `tsconfig.json` untuk alias `@/` → `src/`

### ISSUE-1A-06 — Buat struktur folder src/
- Buat folder: `modules/`, `components/ui/`, `components/shared/`, `stores/`, `services/`, `hooks/`, `types/`, `lib/`, `router/`

### ISSUE-1A-07 — Buat file types global
- `src/types/api.types.ts` — `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`
- `src/types/auth.types.ts` — `User`, `Company`, `LoginResponse`
- `src/types/common.types.ts` — `DocumentStatus`, `SelectOption`, dll.

### ISSUE-1A-08 — Buat lib/utils.ts
- `cn()` — class merger
- `formatCurrency()` — format Rupiah
- `formatDate()` — format tanggal Indonesia
- `formatTimeAgo()` — relative time

### ISSUE-1A-09 — Buat lib/constants.ts
- `PAGE_SIZES` — [25, 50, 100]
- `STATUS_LABELS` — map status ke label Indonesia
- `MODULE_ROUTES` — map module ke base path

### ISSUE-1A-10 — Setup Axios instance (http.ts)
- Base URL dari `VITE_API_BASE_URL`
- Auto-inject `Authorization: Bearer {token}`
- Auto-inject `X-Company-ID: {activeCompanyId}`
- Response interceptor: unwrap envelope, handle 401 → redirect login

### ISSUE-1A-11 — Setup Zustand stores
- `useAuthStore.ts` — token, user, permissions
- `useCompanyStore.ts` — active company, settings
- `useUIStore.ts` — ribbon state, sidebar state

### ISSUE-1A-12 — Setup React Router v6
- Root router di `src/router/index.tsx`
- Struktur route dasar: `/login`, `/select-company`, `/onboarding`, `/` (protected)
- Redirect setelah login → `navigate('/')`, bukan `navigate('/dashboard')`
- Dashboard dirender via primary tab pinned di AppShell; tidak ada route `/dashboard`

### ISSUE-1A-13 — Setup root App (main.tsx)
- Wrap dengan `QueryClientProvider`
- Wrap dengan `ToastProvider`
- Wrap dengan `ErrorBoundary`
- Setup global `QueryClient` config

### ISSUE-1A-14 — Buat .env.example
- `VITE_API_BASE_URL`
- `VITE_APP_NAME`
