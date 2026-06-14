# AGENTS.md — Seaside Escape ERP Frontend

> Baca file ini PERTAMA sebelum melakukan apapun.
> Berlaku untuk: Codex CLI, Claude Code, dan semua AI Agent.

---

## 1. ORIENTASI PROJECT

```
Kamu bekerja di: /workspace/frontend/
Backend ada di : /workspace/backend/  ← READ-ONLY, jangan dimodifikasi
```

**Produk:** Seaside Escape ERP — SPA React untuk akuntansi & operasional bisnis UKM  
**Stack:** React 18 + Vite + TypeScript + TanStack Query + Zustand + Shadcn/ui + Tailwind

---

## 2. ATURAN AKSES FILE

```
BOLEH TULIS   : /workspace/frontend/src/
                /workspace/frontend/docs/      ← update struktur_frontend.md jika ada file baru
BOLEH BACA    : /workspace/backend/            ← referensi API & business rules saja
DILARANG EDIT : /workspace/backend/            ← jangan sentuh apapun di sini
ABAIKAN       : node_modules/, dist/, *.sqlite, storage/logs/
```

---

## 3. PETA DOKUMEN — BACA INI SEBELUM TAHU HARUS BACA APA

### 3.1 Navigasi File Project
```
docs/struktur_frontend.md          ← MULAI DARI SINI untuk cari lokasi file
```
Jangan `find` atau `ls` dulu. Baca `struktur_frontend.md` untuk navigasi.

### 3.2 Empat Jenis Dokumen

| Prefix | Folder | Isi | Kapan Dibaca |
|---|---|---|---|
| `spec-` | `docs/praproduction_docs/` | Spesifikasi teknis & behavior | Selalu — rules yang tidak boleh dilanggar |
| `design-` | `docs/design_docs/` | Visual spec pixel-perfect | Saat membuat/memperbaiki UI komponen |
| `prompt-` | `docs/prompt/` | Task list per phase/sub-phase | Saat memulai phase baru |
| `audit-` | `docs/audit_docs/` | Backend API contract & ERD | Saat membuat API call atau cek business rules |

### 3.3 File Global yang SELALU Relevan

Baca ini sekali di awal setiap sesi, apapun task-nya:

```
docs/praproduction_docs/CLAUDE.md          ← hard rules, jangan dilanggar
docs/praproduction_docs/spec-02-stack-and-dependencies.md   ← stack & state management rules
docs/praproduction_docs/spec-03-folder-structure.md         ← konvensi folder & naming
docs/praproduction_docs/spec-23-tablet-first-layout-rules.md ← WAJIB untuk semua halaman:
                                              height model (dvh vs vh), scroll model,
                                              compact rules viewport pendek (≤620px dvh),
                                              browser UI tax, realistic test viewports,
                                              overlay/dialog/dropdown max-height rules
                                              (data riset dari spec-25 sudah terintegrasi di sini)

docs/praproduction_docs/spec-25-viewport-list.md ← DATA SUMBER riset viewport (2026-06-14):
                                              browser priority, UI tax per device, safe visible
                                              estimates, test matrix lengkap.
                                              Rules aktifnya sudah di spec-23 — baca ini hanya
                                              jika butuh angka mentah atau konteks riset.

docs/struktur_frontend.md                  ← peta file project saat ini
```

> **Aturan height wajib (dari spec-23):**
> - Semua halaman full-screen wajib pakai `h-dvh` atau `min-h-dvh`, **bukan** `h-screen` / `min-h-screen` (vh)
> - Setiap halaman wajib punya compact mode untuk `@media(max-height:620px)` — lihat spec-23 §7.3–7.4

---

## 4. MAPPING TASK → DOKUMEN

### Sebelum menulis kode apapun, gunakan tabel ini:

| Task yang dikerjakan | Baca spec- | Baca design- | Baca audit- |
|---|---|---|---|
| Buat komponen UI baru | `spec-04-design-tokens.md` `spec-07-component-library.md` `spec-23-tablet-first-layout-rules.md` §10 | Sesuai komponen (lihat §5) | — |
| Buat halaman list/workspace | `spec-09-table-and-list.md` `spec-13-filter-and-search.md` `spec-23-tablet-first-layout-rules.md` §5–6,§8.2,§3.3 | `design-C1-datatable.md` `design-C2-filter-sidebar.md` | — |
| Buat form transaksi | `spec-08-form-architecture.md` `spec-10-document-workflow.md` `spec-23-tablet-first-layout-rules.md` §5.3,§8.3 | `design-D1-form-layout.md` `design-D2-line-items-table.md` `design-D3-bottom-action-bar.md` `design-D4-form-summary.md` | `audit-08-business-rules-and-validation-map.md` |
| Buat API call | `spec-12-api-integration.md` | — | `audit-frontend-api-contract.md` |
| Buat permission guard | `spec-11-permission-rules.md` | — | — |
| Buat modul baru | `spec-03-folder-structure.md` `spec-15-module-patterns.md` | — | — |
| Buat layout/navigasi | `spec-05-layout-and-navigation.md` `spec-06-responsive-rules.md` `spec-23-tablet-first-layout-rules.md` §4–6 | `design-A1-topbar-ribbon.md` | — |
| Buat auth page | `spec-17-auth-and-company.md` `spec-23-tablet-first-layout-rules.md` §7.3–7.4 | `design-B-auth-pages.md` | — |
| Buat halaman standalone (error, onboarding, auth) | `spec-23-tablet-first-layout-rules.md` §7.4,§3.3 | — | — |
| Buat onboarding | `spec-18-onboarding-wizard.md` `spec-23-tablet-first-layout-rules.md` §7.4 | `design-F1-onboarding-wizard.md` | — |
| Buat dashboard | `spec-20-dashboard.md` `spec-23-tablet-first-layout-rules.md` §5.4,§8.1,§3.3 | `design-H1-dashboard.md` | — |
| Buat laporan | `spec-16-reports-module.md` `spec-23-tablet-first-layout-rules.md` §8.4 | — | `audit-07-accounting-and-reporting-audit.md` |
| Buat error page | `spec-21-error-pages-and-print-export.md` `spec-23-tablet-first-layout-rules.md` §7.4 | — | — |
| Notification/toast | `spec-14-notification-rules.md` `spec-23-tablet-first-layout-rules.md` §10 | `design-E2-toast.md` | — |
| Void dialog | `spec-10-document-workflow.md` `spec-23-tablet-first-layout-rules.md` §10 | `design-E3-void-dialog.md` | — |
| Empty state | — | `design-E4-empty-state.md` | — |
| Document locked banner | `spec-10-document-workflow.md` | `design-D5-document-locked-banner.md` | — |
| Cek business rules sales | `spec-10-document-workflow.md` | — | `audit-04-sales-workflow-audit.md` `audit-08-business-rules-and-validation-map.md` |
| Cek business rules purchase | `spec-10-document-workflow.md` | — | `audit-05-purchase-workflow-audit.md` `audit-08-business-rules-and-validation-map.md` |
| Cek business rules inventory | — | — | `audit-06-inventory-workflow-audit.md` |
| Cek business rules accounting | — | — | `audit-07-accounting-and-reporting-audit.md` |

---

## 5. MAPPING KOMPONEN → DESIGN DOC

| Komponen | Design Doc |
|---|---|
| `Topbar`, `RibbonPanel`, Primary Tabs, Secondary Tabs | `design-A1-topbar-ribbon.md` |
| `LoginPage`, `CompanyPickerPage`, Session Warning Dialog | `design-B-auth-pages.md` |
| `DataTable`, `TablePagination`, `BulkActionBar` | `design-C1-datatable.md` |
| `FilterSidebar` | `design-C2-filter-sidebar.md` |
| `SearchableSelect` | `design-C3-searchable-select.md` |
| `FormLayout`, `FormSection` | `design-D1-form-layout.md` |
| `LineItemsTable` | `design-D2-line-items-table.md` |
| `FixedBottomBar`, `DocumentActionBar` | `design-D3-bottom-action-bar.md` |
| `FormSummary` | `design-D4-form-summary.md` |
| `DocumentLockedBanner` | `design-D5-document-locked-banner.md` |
| Toast / `useToast` | `design-E2-toast.md` |
| `VoidConfirmDialog` | `design-E3-void-dialog.md` |
| `EmptyState` | `design-E4-empty-state.md` |
| `OnboardingPage`, semua Step component | `design-F1-onboarding-wizard.md` |
| `DashboardPage`, KPI Cards, Charts | `design-H1-dashboard.md` |

---

## 6. STATUS PHASE & NEXT ACTION

### Progress Saat Ini

| Phase | Sub-phase | Status | Blocker |
|---|---|---|---|
| 1A — Project Setup | `prompt-phase-1A-project-setup.md` | ✅ Done | — |
| 1B — Auth Pages | `prompt-phase-1B-auth-pages.md` | ✅ Done | — |
| 1C — App Shell & Layout | `prompt-phase-1C-app-shell-layout.md` | ✅ Done | — |
| 1D — Shared Components | `prompt-phase-1D-shared-components.md` | ⚠️ Error | `DataTable.tsx` build error |
| 1E — Error Pages & Onboarding | `prompt-phase-1E-error-onboarding.md` | ⚠️ Error | `Step4MasterData.tsx` + `onboardingApi.ts` build error |
| 2 — Master Data | `prompt-phase-2-master-data.md` | ⏳ Belum dimulai | Tunggu Phase 1 bersih |
| 3 — Sales | `prompt-phase-3-sales.md` | ⏳ Belum dimulai | Tunggu Phase 2 |
| 4 — Purchase | `prompt-phase-4-purchase.md` | ⏳ Belum dimulai | Tunggu Phase 2 |
| 5 — Inventory | `prompt-phase-5-inventory.md` | ⏳ Belum dimulai | Tunggu Phase 2 |
| 6 — Accounting & Reports | `prompt-phase-6-accounting-reports.md` | ⏳ Belum dimulai | Tunggu Phase 3,4,5 |
| 7 — Dashboard & Settings | `prompt-phase-7-dashboard-settings.md` | ⏳ Belum dimulai | Tunggu semua phase |

### Yang Harus Diselesaikan Sekarang (Blocker)

```
1. Fix DataTable.tsx          → src/components/shared/table/DataTable.tsx
2. Fix Step4MasterData.tsx    → src/modules/onboarding/components/steps/Step4MasterData.tsx
3. Fix onboardingApi.ts       → src/modules/onboarding/services/onboardingApi.ts
4. Jalankan: npm run build    → harus 0 error sebelum lanjut ke Phase 2
```

---

## 7. URUTAN MEMBACA DOKUMEN PER PHASE

Urutan baca per phase sudah tersedia lengkap di:

**→ `docs/AGENT_ENTRY_POINT.md`**

Baca file itu sebelum memulai task coding apapun.
File tersebut mencakup urutan baca per phase termasuk
dokumen tablet-first dan gap-fill terbaru.

---

## 8. HARD RULES RINGKASAN

Rules lengkap ada di `docs/praproduction_docs/CLAUDE.md`. Ini versi ringkasnya:

```
❌ DILARANG menggunakan `any` tanpa komentar justifikasi
❌ DILARANG fetch data langsung di komponen — selalu via TanStack Query
❌ DILARANG simpan data API di Zustand — Zustand hanya untuk UI state
❌ DILARANG membuat komponen baru jika sudah ada yang bisa dipakai
❌ DILARANG styling inline atau Tailwind ad-hoc di luar design token
❌ DILARANG hardcode URL API — selalu gunakan VITE_API_BASE_URL
❌ DILARANG edit file di src/components/ui/ — buat wrapper di shared/ jika perlu
❌ DILARANG menampilkan tombol aksi tanpa cek permission

✅ WAJIB semua API call ada di src/modules/{module}/services/
✅ WAJIB semua form pakai React Hook Form + Zod
✅ WAJIB semua props komponen typed dengan interface TypeScript
✅ WAJIB semua angka pakai tabular-nums
✅ WAJIB cek design doc sebelum buat UI — ikuti spec pixel-perfect
✅ WAJIB cek audit-frontend-api-contract.md sebelum buat API call baru
✅ WAJIB update docs/struktur_frontend.md jika ada file baru
```

---

## 9. KONVENSI PENAMAAN CEPAT

```
Page component    : PascalCase + Page      → SalesInvoiceListPage.tsx
Feature component : PascalCase             → SalesInvoiceForm.tsx
Custom hook       : camelCase + use        → usePermission.ts
API service       : camelCase + Api        → salesInvoiceApi.ts
Zustand store     : camelCase + Store      → useAuthStore.ts
Type/Interface    : PascalCase             → SalesInvoice, ApiResponse<T>
Zod schema        : camelCase + Schema     → salesInvoiceSchema
```

---

## 10. CEK SEBELUM COMMIT

```bash
# Harus lulus sebelum selesai mengerjakan task apapun:
cd /workspace/frontend
npm run build      # 0 TypeScript error
npm run lint       # 0 error (warning boleh)
```

Format commit:
```
feat(sales): add sales invoice list page with filter
fix(shared): resolve DataTable build error on generic type
refactor(layout): extract tab state to useTabStore
```
