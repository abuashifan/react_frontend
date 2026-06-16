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

## 6. TRACKING PROGRESS

> **WAJIB diupdate** setiap kali phase atau audit selesai — lihat instruksi lengkap di §10C.  
> Context global terbaru: `docs/audit_docs/audit-12-frontend-ux-workflow-audit-16-06-26.md`

---

### 6A. Implementation Phases

**Legend:** ✅ Done · ⚠️ Done (ada contract mismatch) · 🔧 In Progress · ⏳ Belum dimulai

| Phase | Nama | Status | Prompt File | Keterangan |
|---|---|---|---|---|
| 1A | Project Setup | ✅ Done | `prompt-phase-1A-project-setup.md` | — |
| 1B | Auth Pages | ✅ Done | `prompt-phase-1B-auth-pages.md` | — |
| 1C | App Shell & Layout | ✅ Done | `prompt-phase-1C-app-shell-layout.md` | — |
| 1D | Shared Components | ✅ Done | `prompt-phase-1D-shared-components.md` | — |
| 1E | Error Pages & Onboarding | ✅ Done | `prompt-phase-1E-error-onboarding.md` | Endpoint lama → A11-08 |
| 2 | Master Data | ⚠️ Done | `prompt-phase-2-master-data.md` | DTO mismatch → A11-02/03/04 |
| 3 | Sales | ⚠️ Done | `prompt-phase-3-sales.md` | Route mismatch → A11-01 |
| 4 | Purchase | ⚠️ Done | `prompt-phase-4-purchase.md` | Route mismatch → A11-01 |
| 5 | Inventory | ✅ Done | `prompt-phase-5-inventory.md` | — |
| 6 | Accounting & Reports | ⚠️ Done | `prompt-phase-6-accounting-reports.md` | Journal → A11-05, Recon → A11-12 |
| 7 | Dashboard & Settings | ⚠️ Done | `prompt-phase-7-dashboard-settings.md` | Dashboard → A11-07, Settings → A11-06 |
| 8 | P0 Contract Fixes (Cash Bank Recon / A11-12) | ✅ Done | `prompt-phase-8-p0-contract-fixes.md` | Bank recon methods POST + remove finalize/void. Sisa P0 (fiscal-year issue-03, reports issue-06) → A11-13/A11-10 |
| 9 | Settings & Access Refactor | ✅ Done | `prompt-phase-9-settings-access-refactor.md` | A11-06 — /access/* + /settings/company/* endpoints, Invitations & Audit pages |
| 10 | Fixed Assets Module | ✅ Done | `prompt-phase-10-fixed-assets.md` | A11-11 — modul /fixed-assets + kategori + reports |
| 11 | Opening Balance Module | ✅ Done | `prompt-phase-11-opening-balance.md` | A11-09 — modul /opening-balance (status+batch) + fix onboarding Step5 |
| 12 | Setup Wizard Refactor | ✅ Done | `prompt-phase-12-setup-wizard.md` | A11-08 — setupApi /setup/* (finalize), buang endpoint /companies/* fiktif |
| 13 | Period-End Module | ✅ Done | `prompt-phase-13-period-end.md` | A11-10 — /accounting/period-end + checklist/run/reopen |
| 14 | Master Data DTO & Action Fixes | ✅ Done | `prompt-phase-14-master-data-dto-contract-fixes.md` | A11-02/03/04 |
| 15 | Transaction DTO & Journal Display | ✅ Done | `prompt-phase-15-transaction-dto-number-contract.md` | A11-05/14 — formatter guards, journal totals/labels, SO number adapter |
| 16 | Route/Ribbon/Virtual Tab Canonical | ✅ Done | `prompt-phase-16-route-ribbon-canonical-map.md` | A11-01 — COA, bank-transfers, bank-recon, AR/AP redirects |
| 17 | Shared Runtime Hardening | ✅ Done | `prompt-phase-17-shared-runtime-hardening.md` | A11-07/15/16/17/18 — dashboard fallback, formatter/select/error/DataTable guards |

---

### 6B. Audit Phases

| Audit | Tanggal | Cakupan | Status | Hasil |
|---|---|---|---|---|
| Audit 01–10 | sebelum 2026-06-14 | Backend architecture, ERD, workflow, API contract, business rules | ✅ Selesai | `docs/audit_docs/audit-00..audit-10*` |
| Audit-11 | 2026-06-16 | Frontend vs Backend global contract map | ✅ Selesai, fixes ⏳ | 18 issue (A11-01..A11-18) — `audit-11-frontend-global-contract-map-16-06-26.md` |
| Audit-12 | 2026-06-16 | Frontend UX/workflow/filter/tabs/reports audit berdasarkan temuan user | ✅ Selesai, fixes ⏳ | 16 issue (A12-01..A12-16) — `audit-12-frontend-ux-workflow-audit-16-06-26.md` |

---

### 6C. Build Status

```
Terakhir dicek  : 2026-06-16 (Phase 13 + 10 — Period-End + Fixed Assets)
npm run build   : ✅ 0 error
```

---

### 6D. Next Action (Urutan Audit-11 — ikuti ini, BUKAN nomor phase)

> ⚠️ Nomor phase bukan urutan prioritas. Ikuti urutan di bawah ini.

| Urutan | Phase | Nama | A11 | Severity |
|---|---|---|---|---|
| 1 | Phase 16 | Route/Ribbon Canonical Map | A11-01 | ✅ Done |
| 2 | Phase 14 | Master Data DTO & Action Fixes | A11-02/03/04 | ✅ Done |
| 3 | Phase 15 | Transaction DTO & Journal Display | A11-05/14 | ✅ Done |
| 4 | Phase 8 | Cash Bank Recon Methods | A11-12 | ✅ Done |
| 5 | Phase 9 | Settings & Access Refactor | A11-06 | ✅ Done |
| 6 | Phase 12 + 11 | Setup Wizard + Opening Balance | A11-08/09 | ✅ Done |
| 7 | Phase 17 | Shared Runtime Hardening | A11-07/15/16/17/18 | ✅ Done |
| 8 | Phase 13 + 10 | Period-End + Fixed Assets | A11-10/11 | ✅ Done |

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

## 10. WAJIB SETELAH SELESAI MENGERJAKAN TASK

### 10A. Build Check

```bash
cd /workspace/frontend
npm run build      # harus 0 TypeScript error
npm run lint       # 0 error (warning boleh)
```

### 10B. Update `docs/struktur_frontend.md`

Jika ada **file baru** yang dibuat dalam task ini → tambahkan ke `docs/struktur_frontend.md`.  
Jika ada file yang dihapus atau dipindah → update entri yang ada.  
Jangan skip — file ini adalah navigasi utama agent berikutnya.

### 10C. Update §6 AGENTS.md (file ini)

Setelah setiap **phase implementasi selesai**:
- Update kolom `Status` di §6A dari `⏳` → `✅ Done` atau `⚠️ Done`
- Tambahkan keterangan singkat jika ada contract mismatch yang diketahui
- Update §6C Build Status dengan tanggal terkini

Setelah setiap **audit baru selesai**:
- Tambahkan baris baru di §6B Audit Phases dengan tanggal, cakupan, dan hasil
- Jika audit menghasilkan issue baru → tambahkan ke §6D Next Action
- Jika prioritas berubah → update urutan di §6D

Setelah phase dijalankan dan isunya hilang:
- Update §6D — hapus atau tandai urutan yang sudah selesai

### 10D. Format Commit

```
feat(sales): add sales invoice list page with filter
fix(shared): resolve DataTable build error on generic type
refactor(layout): extract tab state to useTabStore
docs(agents): update tracking phase 16 done
```
