# Phase 1 Implementation Report
## Seaside Escape ERP Frontend

**Tanggal**: 2026-06-13  
**Cakupan**: Phase 1A–1E (Project Setup, Auth Pages, App Shell, Shared Components, Error Pages & Onboarding Wizard)

---

## Phase 1A — Project Setup

**ABU-1 s/d ABU-14 — Selesai**

### Yang Dikerjakan

Project foundation dibuat dari scaffolding Vite + React + TypeScript yang sudah ada. Sebagian besar infrastruktur (Tailwind, Shadcn/ui, path alias) sudah tersedia; yang dibuat pada phase ini adalah lapisan type, service, store, routing, dan environment contract.

### Checklist

| ID | Task | Status |
|---|---|---|
| ABU-1 | Initialize React + Vite + TypeScript | ✅ Sudah ada |
| ABU-2 | Install dependencies | ✅ Sudah ada |
| ABU-3 | Setup Tailwind CSS + design tokens | ✅ Sudah ada (`tailwind.config.ts` + `index.css`) |
| ABU-4 | Setup Shadcn/ui | ✅ Sudah ada (`src/components/ui/`) |
| ABU-5 | Setup path alias `@/` | ✅ Sudah ada (`vite.config.ts` + `tsconfig.app.json`) |
| ABU-6 | Buat struktur folder `src/` | ✅ Dibuat |
| ABU-7 | Buat file types global | ✅ Dibuat |
| ABU-8 | Buat `lib/utils.ts` | ✅ Diperluas |
| ABU-9 | Buat `lib/constants.ts` | ✅ Dibuat |
| ABU-10 | Setup Axios instance | ✅ Dibuat |
| ABU-11 | Setup Zustand stores | ✅ Dibuat |
| ABU-12 | Setup React Router v6 | ✅ Dibuat |
| ABU-13 | Setup root App | ✅ Dibuat |
| ABU-14 | Buat `.env.example` | ✅ Dibuat |

### File Utama yang Dibuat

```
src/types/
  api.types.ts        — ApiResponse<T>, PaginatedResponse<T>, ApiError, ListParams
  auth.types.ts       — User, Company, CompanySettings, LoginPayload, LoginResponse
  common.types.ts     — DocumentStatus, SortDirection, SelectOption, BreadcrumbItem

src/lib/
  utils.ts            — cn(), formatCurrency(), formatDate(), formatNumber()
  constants.ts        — APP_NAME, MODULES, PAGINATION_OPTIONS, query defaults

src/services/
  http.ts             — Axios instance dengan auth + company interceptors

src/stores/
  useAuthStore.ts     — token, user, permissions, companies, activeCompanyId (persisted)
  useCompanyStore.ts  — activeCompany, settings
  useUIStore.ts       — activeModule, activeRibbonItem, ribbon/sidebar state, isFormView

src/router/
  index.tsx           — createBrowserRouter dengan route dasar
  guards.tsx          — ProtectedRoute dengan auth + permission + requireCompany

src/main.tsx          — QueryClient + RouterProvider + Toaster
.env.example          — VITE_API_BASE_URL, VITE_APP_NAME
```

### Verifikasi

- `tsc --noEmit`: No errors
- `eslint`: No issues
- `vite build`: Success (369 KB)

### Catatan Teknis

- Versi yang terinstall lebih baru dari spesifikasi dokumen: React 19, react-router-dom v7, zod v4, zustand v5, TypeScript 6. Semua backward-compatible untuk pola yang dipakai.
- `QueryClient` dikonfigurasi dengan `staleTime: 30s`, `gcTime: 5m`, `retry: 1`, `refetchOnWindowFocus: false`.

---

## Phase 1B — Auth Pages

**ABU-15 s/d ABU-21 — Selesai**

### Yang Dikerjakan

Login flow lengkap untuk aplikasi ERP multi-company: login page, company picker, route guards, session timeout dengan warning dialog, dan permission system.

### Checklist

| ID | Task | Status |
|---|---|---|
| ABU-15 | Login Page | ✅ Split screen, form validasi, toggle password, "Ingat saya" |
| ABU-16 | Company Picker Page | ✅ Grid card, urutan last_accessed_at, logout button |
| ABU-17 | Auth flow post-login | ✅ 1 company → dashboard, 2+ company → /select-company |
| ABU-18 | Route Guards | ✅ ProtectedRoute + requireCompany flag |
| ABU-19 | Session Timeout | ✅ Idle detection, warning dialog + countdown, auto logout |
| ABU-20 | `usePermission` hook | ✅ `can()`, `canAny()`, `canAll()` |
| ABU-21 | `PermissionGuard` component | ✅ Mode any/all, fallback prop |

### File Utama yang Dibuat

```
src/modules/auth/
  pages/LoginPage.tsx              — Split screen, form zod + RHF, session expired banner
  pages/CompanyPickerPage.tsx      — Card grid sort by last_accessed_at
  services/authApi.ts              — POST /auth/login, DELETE /auth/logout, GET /auth/me
  schemas/loginSchema.ts           — Zod schema login form

src/hooks/
  usePermission.ts                 — can(), canAny(), canAll()
  useSessionTimeout.ts             — Idle timer, warning dialog state, auto logout
  useToast.ts                      — Wrapper Shadcn toast: success/error/warning/info
  useCompanySettings.ts            — Read company settings dari store

src/components/shared/
  PermissionGuard.tsx              — Wrap any child by permission
  feedback/SessionWarningDialog.tsx — Countdown dialog sebelum session expired
  layout/AppShell.tsx              — Wrapper awal (diganti total di Phase 1C)
```

### Auth Flow

```
POST /auth/login
  ├── 1 company  → setAuth + setActiveCompany → navigate /dashboard
  └── 2+ company → setAuth → navigate /select-company
                               └── pilih company → navigate /dashboard

ProtectedRoute:
  ├── token === null    → redirect /login
  ├── requireCompany + activeCompanyId === null → redirect /select-company
  └── permission check → redirect /403

Session Timeout:
  ├── (timeout - 5 menit) idle → buka SessionWarningDialog dengan countdown
  └── timeout menit idle       → logout + navigate /login?reason=session_expired
```

### Catatan Teknis

- **"Ingat saya"**: Jika tidak dicentang, session ditandai di `sessionStorage`. Saat browser ditutup dan dibuka lagi, auth store di-clear otomatis (localStorage tetap, tapi session marker hilang).
- **Zod v4 + RHF**: Jangan pakai `.default()` di zod schema untuk form field — menyebabkan divergensi tipe `input`/`output` yang merusak `Control<T>`. Gunakan `defaultValues` di `useForm` sebagai gantinya.
- **Session timeout tanpa company settings**: Fallback ke 30 menit jika `settings` belum di-load.

---

## Phase 1C — App Shell & Layout

**ABU-22 s/d ABU-27 — Selesai**

### Yang Dikerjakan

Shell utama aplikasi ERP: fixed topbar dengan module tabs, ribbon panel contextual per modul dengan filter permission, workspace layout untuk list page, form layout untuk create/edit/detail, dan fixed bottom bar untuk action buttons.

### Checklist

| ID | Task | Status |
|---|---|---|
| ABU-22 | AppShell component | ✅ Fixed topbar + ribbon + content area + session warning |
| ABU-23 | Topbar component | ✅ Module tabs, user avatar + dropdown, company name |
| ABU-24 | RibbonPanel component | ✅ Contextual per module, filter permission, collapse toggle |
| ABU-25 | WorkspaceLayout component | ✅ Sidebar slot 220px, header, title, breadcrumb, action |
| ABU-26 | FormLayout component | ✅ Full width, status badge, document number, bottom bar slot |
| ABU-27 | FixedBottomBar component | ✅ Fixed h-[60px], left info slot + right action buttons |

### File Utama yang Dibuat

```
src/router/
  moduleConfig.ts                  — Semua module tab + ribbon item + permission per modul

src/components/shared/
  layout/AppShell.tsx              — Fixed shell: Topbar + RibbonPanel + content + session warning
  layout/Topbar.tsx                — Module tabs navigation + user dropdown
  layout/RibbonPanel.tsx           — Contextual ribbon dengan permission filter + collapse
  layout/WorkspaceLayout.tsx       — List view: sidebar slot + header + content
  layout/FormLayout.tsx            — Form view: full width + signals isFormView ke UIStore
  layout/FixedBottomBar.tsx        — Fixed h-60px dengan left info + right action slots
  document/DocumentStatusBadge.tsx — Status badge semua tipe dokumen (WAJIB pakai ini)
```

### Layout Hierarchy

```
ProtectedRoute
└── AppShell
    ├── Topbar (fixed top-0, h-[52px], bg-[#326273], z-50)
    ├── RibbonPanel (fixed top-[52px], h-[64px], bg-white, z-40)
    │   — tampil hanya jika activeModule !== null && !isFormView
    ├── main (pt-[116px] jika ribbon tampil, pt-[52px] jika tidak)
    │   ├── WorkspaceLayout    — untuk halaman list
    │   │   ├── aside (w-[220px], filter sidebar slot)
    │   │   └── content (flex-1, header + DataTable)
    │   └── FormLayout         — untuk halaman form (setFormView(true) on mount)
    │       ├── header (breadcrumb + title + status badge)
    │       ├── form content (max-w-[1200px], pb-[60px] jika ada bottom bar)
    │       └── FixedBottomBar (fixed bottom-0, h-[60px])
    └── SessionWarningDialog
```

### Ribbon Config (moduleConfig.ts)

| Module | Ribbon Items | Permission Pattern |
|---|---|---|
| Penjualan | 8 item (Penawaran→Piutang) | `sales.{resource}.view` |
| Pembelian | 7 item (Permintaan→Hutang) | `purchase.{resource}.view` |
| Persediaan | 4 item | `inventory.{resource}.view` |
| Akuntansi | 3 item | `journal.view`, `accounting.*.manage` |
| Kas & Bank | 4 item | `cash_bank.view` |
| Laporan | 7 item | `reports.view` |
| Master Data | 9 item | `master-data.view` |

### Perilaku Responsive

| Breakpoint | Topbar | Ribbon | Sidebar | Typography |
|---|---|---|---|---|
| `< 768px` | Tabs scroll, nama produk tersembunyi | Scroll horizontal | Collapsed | 14px |
| `768px+` | Compact | Tampil normal | 220px | 13px |
| `1024px+` | Nama produk muncul | Tampil normal | 220px | 14px |

### Verifikasi

- `tsc --noEmit`: No errors
- `eslint`: No issues
- `vite build`: Success (621 KB — semua Lucide icons bundled, akan berkurang dengan lazy loading per route)

### Catatan Teknis

- `moduleConfig.ts` disimpan sebagai `.ts` (bukan `.tsx`) karena tidak ada JSX — menghindari lint rule `react-refresh/only-export-components`.
- `FormLayout` menggunakan `useEffect` untuk set/unset `isFormView` di UIStore. AppShell membaca flag ini untuk hide/show RibbonPanel.
- `no-scrollbar` utility ditambahkan ke `index.css` untuk horizontal scroll ribbon dan topbar tanpa scrollbar yang terlihat.
- `DocumentStatusBadge` menggunakan CSS classes `status-*` dari `index.css` — jangan hardcode warna status di komponen manapun.

---

---

## Phase 1D — Shared Components

**ABU-28 s/d ABU-37 — Selesai**

### Yang Dikerjakan

Semua komponen shared yang diperlukan untuk halaman list, form transaksi, dan filter tersedia. Ini adalah "building block" yang akan digunakan oleh semua modul bisnis di Phase 2+.

### Checklist

| ID | Task | Status | File |
|---|---|---|---|
| ABU-28 | DocumentStatusBadge | ✅ Done (Phase 1C) | `shared/document/DocumentStatusBadge.tsx` |
| ABU-29 | DataTable | ✅ Dibuat | `shared/table/DataTable.tsx` |
| ABU-30 | TablePagination | ✅ Dibuat | `shared/table/TablePagination.tsx` |
| ABU-31 | SearchableSelect | ✅ Dibuat | `shared/form/SearchableSelect.tsx` |
| ABU-32 | FormSection | ✅ Dibuat | `shared/form/FormSection.tsx` |
| ABU-33 | Toast system | ✅ Done (Phase 1B) | `hooks/useToast.ts` |
| ABU-34 | ErrorBoundary | ✅ Dibuat | `shared/feedback/ErrorBoundary.tsx` |
| ABU-35 | EmptyState | ✅ Dibuat | `shared/feedback/EmptyState.tsx` |
| ABU-36 | FilterSidebar | ✅ Dibuat | `shared/layout/FilterSidebar.tsx` |
| ABU-37 | BulkActionBar | ✅ Dibuat | `shared/table/BulkActionBar.tsx` |

### File yang Dibuat

```
src/components/shared/
  table/
    DataTable.tsx           — Generic table: sticky cols, skeleton, selection, pagination
    TablePagination.tsx     — Paginasi 25/50/100, first/prev/next/last navigation
    BulkActionBar.tsx       — Permission-aware bulk action bar dengan count badge
  form/
    FormSection.tsx         — 1 atau 2-column grid wrapper untuk form fields
    SearchableSelect.tsx    — Debounced async search dropdown (min 2 chars, max 10 results)
  feedback/
    EmptyState.tsx          — Icon + title + description + optional action
    ErrorBoundary.tsx       — Class component, catches render errors, reset button
  layout/
    FilterSidebar.tsx       — Collapsible filter panel + FilterSection sub-component
```

### Interface Kunci

**DataTable**
```typescript
// Dari DataTable.tsx — gunakan export ini langsung
import { DataTable, ColumnDef, PaginationState, BulkAction } from '@/components/shared/table/DataTable'

// Contoh column definition
const columns: ColumnDef<SalesInvoice>[] = [
  {
    id: 'number',
    header: 'No. Faktur',
    cell: ({ original }) => <Link to={`.../${original.id}`}>{original.number}</Link>,
    size: 140,
    meta: { sticky: true, stickyLeft: 32 }  // 32 = lebar checkbox column
  },
  // ... kolom lain
]

// Contoh usage
<DataTable
  data={invoices}
  columns={columns}
  totalRows={total}
  isLoading={isLoading}
  pagination={{ pageIndex: 0, pageSize: 25 }}
  onPaginationChange={setPagination}
  selectedRows={selectedIds}
  onRowSelect={setSelectedIds}
  bulkActions={[{ label: 'Hapus', onClick: handleBulkDelete, permission: 'sales.invoice.delete' }]}
  emptyTitle="Belum ada faktur"
/>
```

**SearchableSelect**
```typescript
<SearchableSelect
  value={customerId}
  onChange={setCustomerId}
  onSearch={async (q) => customerApi.search(q)}
  placeholder="Cari customer..."
  error={errors.customer_id?.message}
/>
```

**FilterSidebar + FilterSection**
```typescript
<FilterSidebar activeCount={activeFilterCount} onReset={handleReset}>
  <FilterSection title="Status">
    {/* checkbox filters */}
  </FilterSection>
  <FilterSection title="Tanggal" defaultOpen={false}>
    {/* date range filters */}
  </FilterSection>
</FilterSidebar>
```

**FormSection**
```typescript
<FormSection title="Informasi Pelanggan" columns={2}>
  <FormField ... />
  <FormField ... />
</FormSection>
<FormSection title="Catatan" columns={1}>
  <Textarea ... />
</FormSection>
```

### Catatan Teknis

- **DataTable tanpa TanStack Table**: Dibuat manual (tidak ada dependency baru). `ColumnDef<T>` adalah custom interface di `DataTable.tsx`. Sticky columns menggunakan inline `style={{ position: 'sticky', left: N }}` bukan class dinamis Tailwind.
- **SearchableSelect label sync**: Tidak menggunakan `useEffect` (melanggar `react-hooks/set-state-in-effect`). Gunakan pattern `setState during render` untuk detect external reset: `if (prevValue !== value) { setPrevValue(value); if (value === null) setSelectedLabel(null) }`.
- **BulkActionBar**: Actions yang punya `permission` dibungkus `<PermissionGuard>` otomatis — caller tidak perlu menambah guard manual di luar.
- **ErrorBoundary**: Class component (karena `getDerivedStateFromError` hanya tersedia di class). Hanya bisa catch render errors, bukan event handler errors.
- **FilterSidebar**: `FilterSection` diekspor dari file yang sama. Import: `import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'`.

### Verifikasi

- `tsc --noEmit`: No errors
- `eslint`: No issues
- `vite build`: Success (621 KB — sama dengan Phase 1C, expected)

---

---

## Phase 1E — Error Pages & Onboarding Wizard

**ABU-38 s/d ABU-49 — Selesai**

### Yang Dikerjakan

5 halaman error minimal + onboarding wizard 6-step untuk setup perusahaan baru. Wizard membimbing user dari informasi perusahaan hingga siap bertransaksi, tanpa bisa di-skip secara tidak valid.

### Checklist

| ID | Task | Status |
|---|---|---|
| ABU-38 | Halaman 403 | ✅ Dibuat |
| ABU-39 | Halaman 404 | ✅ Dibuat |
| ABU-40 | Halaman 500 | ✅ Dibuat |
| ABU-41 | Halaman Network Error | ✅ Dibuat |
| ABU-42 | Halaman Maintenance | ✅ Dibuat |
| ABU-43 | Onboarding Wizard layout | ✅ Dibuat |
| ABU-44 | Step 1 — Informasi Perusahaan | ✅ Dibuat |
| ABU-45 | Step 2 — Pilih Template COA | ✅ Dibuat |
| ABU-46 | Step 3 — Account Mapping | ✅ Dibuat |
| ABU-47 | Step 4 — Master Data Dasar | ✅ Dibuat |
| ABU-48 | Step 5 — Opening Balance | ✅ Dibuat (skippable) |
| ABU-49 | Step 6 — Selesai | ✅ Dibuat |

### File Utama yang Dibuat

```
src/modules/errors/
  ErrorPage.tsx         — Base + ForbiddenPage (403) + NotFoundPage (404) + ServerErrorPage (500)
  NetworkErrorPage.tsx  — Halaman network error (WifiOff icon, no code number)
  MaintenancePage.tsx   — Halaman maintenance (Settings icon, animate-spin-slow)

src/modules/onboarding/
  constants.ts          — COA_TEMPLATES + MAPPING_SECTIONS (non-JSX exports)
  services/onboardingApi.ts
  schemas/companyInfoSchema.ts
  components/
    WizardSidebar.tsx         — Sidebar 6-step dengan status indicator
    MasterDataQuickAdd.tsx    — Reusable inline add form untuk master data
    steps/
      Step1CompanyInfo.tsx
      Step2TemplateCOA.tsx
      Step3AccountMapping.tsx
      Step4MasterData.tsx
      Step5OpeningBalance.tsx
      Step6Complete.tsx
  pages/OnboardingPage.tsx    — Main wizard container

src/types/auth.types.ts       — Ditambah: CompanySettings.onboarding_completed?: boolean
tailwind.config.ts            — Ditambah: keyframes spin-slow + animation animate-spin-slow
```

### Router & Guard Updates

```
/403              → ForbiddenPage (real design, bukan placeholder)
/404 (*)          → NotFoundPage (real design)
/500              → ServerErrorPage (baru)
/network-error    → NetworkErrorPage (baru)
/maintenance      → MaintenancePage (baru)
/onboarding       → OnboardingGuard + OnboardingPage
```

**ProtectedRoute** mendapat prop `requireOnboarding?: boolean`. Jika true dan `company.settings.onboarding_completed === false`, redirect ke `/onboarding`.

**OnboardingGuard** — guard ringan: hanya cek token + activeCompanyId, tidak wrap AppShell, tidak cek onboarding status.

**http interceptor** — ditambah:
- `503` → redirect `/maintenance`
- `X-Maintenance-Mode: true` header → redirect `/maintenance`
- No response (network error) → redirect `/network-error`

### Onboarding Flow

```
/onboarding
  ├── Step 1: Informasi Perusahaan (PATCH /companies/{id})
  ├── Step 2: Pilih Template COA   (POST /companies/{id}/coa-template) [assumed endpoint]
  │   └── Warning dialog jika ganti template setelah step 3 selesai
  ├── Step 3: Account Mapping       (PATCH /master-data/account-mappings/{key} × N)
  │   └── Required fields must be filled; optional can be left blank
  ├── Step 4: Master Data Dasar
  │   ├── Gudang: min 1           (POST /master-data/warehouses)
  │   ├── Satuan: min 1           (POST /master-data/units)
  │   └── Syarat Bayar: min 1    (POST /master-data/payment-terms)
  ├── Step 5: Opening Balance       (POST /accounting/opening-balances) [assumed endpoint]
  │   └── Skippable dengan "Lewati, isi nanti →"
  └── Step 6: Selesai              (PATCH /companies/{id}/complete-onboarding) [assumed endpoint]
      └── Update auth store → navigate('/dashboard')
```

**Navigasi**: User bisa kembali ke step yang pernah dikunjungi tapi tidak bisa skip maju. Step berstatus `completed` (✅), `active` (▶), `pending` (○), atau `incomplete` (⚠️).

### Asumsi API (perlu dikonfirmasi ke backend)

| Endpoint | Status | Keterangan |
|---|---|---|
| `PATCH /companies/{id}` | Asumsi | Update company info (step 1) |
| `POST /companies/{id}/coa-template` | Asumsi | Apply template COA (step 2) |
| `POST /accounting/opening-balances` | Asumsi | Save opening balance (step 5) |
| `PATCH /companies/{id}/complete-onboarding` | Asumsi | Mark onboarding selesai (step 6) |
| `GET /master-data/chart-of-accounts` | Confirmed | Dipakai untuk search di step 3 |
| `POST /master-data/warehouses` | Confirmed | Dipakai step 4 |
| `POST /master-data/units` | Confirmed | Dipakai step 4 |
| `POST /master-data/payment-terms` | Confirmed | Dipakai step 4 |

### Verifikasi

- `tsc --noEmit`: No errors
- `eslint`: No issues (MAPPING_SECTIONS dipindahkan ke `constants.ts` untuk menghindari `react-refresh/only-export-components`)
- `vite build`: Success (690 KB)

### Catatan Teknis

- `ErrorPage.tsx` mengekspor 4 named components dari satu file — diizinkan karena tidak ada non-component export.
- `constants.ts` menggunakan `.ts` extension karena mengekspor data + types, tidak ada JSX.
- Step 5 (Opening Balance) menggunakan static account rows (bukan dynamic dari COA template). Account ID belum di-map — placeholder `account_id: 0`. Implementasi lengkap perlu load akun dari COA + mapping ke balance row.
- Wizard state disimpan di local state `OnboardingPage` — tidak persisted ke localStorage. Jika user refresh, wizard restart dari step 1 (kecuali backend sudah menyimpan progress).

---

## Pekerjaan Selanjutnya (Phase 2+)

| Area | Keterangan |
|---|---|
| **FilterSidebar** | ✅ Selesai Phase 1D — sudah ada |
| **DataTable** | ✅ Selesai Phase 1D — sudah ada |
| **Error Pages (403/404/500/network/maintenance)** | ✅ Selesai Phase 1E — sudah ada |
| **Onboarding Wizard** | ✅ Selesai Phase 1E — sudah ada |
| **DocumentActionBar** | Spesific action bar dengan permission guard per tombol — perlu `shared/document/DocumentActionBar.tsx` |
| **VoidConfirmDialog** | Confirmation dialog untuk void — perlu `shared/document/VoidConfirmDialog.tsx` |
| **Code splitting** | Bundle 621KB — implementasi lazy import per route untuk reduce initial load |
| **Dashboard page** | Placeholder di `/dashboard` perlu diganti dengan halaman sesungguhnya |
| **Module routes** | Semua route bisnis (`/sales/*`, `/purchase/*`, dst.) belum ada — ditambahkan per phase modul |
| **Proforma permission** | `sales.proformas.view` dipakai di ribbon tapi belum ada di doc 11 — perlu konfirmasi backend |

---

## Dependency Antar Phase

```
Phase 1A (Foundation)
  └── Phase 1B (Auth)         — butuh useAuthStore, useCompanyStore, types
       └── Phase 1C (Layout)  — butuh auth flow, UIStore, router
            └── Phase 2+ (Modules) — butuh WorkspaceLayout, FormLayout, FixedBottomBar
```

Phase 1A–1E sekarang menyediakan fondasi penuh. Semua phase modul bisnis berikutnya dapat menggunakan:
- `<WorkspaceLayout>` untuk halaman list
- `<FormLayout>` untuk halaman form
- `<PermissionGuard permission="...">` untuk wrap action
- `usePermission().can(...)` untuk conditional render
- `useToast().toast.success/error/warning/info(...)` untuk notifikasi
- `<DocumentStatusBadge status={...} />` untuk status dokumen
- `<DataTable>` dengan `ColumnDef<T>`, `PaginationState`, `BulkAction` dari `shared/table/DataTable`
- `<FilterSidebar>` + `<FilterSection>` dari `shared/layout/FilterSidebar`
- `<SearchableSelect>` untuk async dropdown dari `shared/form/SearchableSelect`
- `<FormSection>` untuk layout form fields dari `shared/form/FormSection`
- `<EmptyState>` untuk halaman/section kosong
- `<ErrorBoundary>` untuk wrapping komponen yang bisa error
- `http` dari `@/services/http` untuk Axios instance (sudah ada auth interceptor)
