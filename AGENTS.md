# AGENTS.md — Seaside Escape ERP Frontend

> Baca file ini PERTAMA sebelum melakukan apapun.
> Berlaku untuk: Codex CLI, Claude Code, dan semua AI Agent.

---

## 1. ORIENTASI PROJECT

```
Kamu bekerja di: /workspace/frontend/
Backend ada di : /workspace/laravel_backend/
```

**Produk:** Seaside Escape ERP — SPA React untuk akuntansi & operasional bisnis UKM  
**Stack:** React 18 + Vite + TypeScript + TanStack Query + Zustand + Shadcn/ui + Tailwind

---

## 2. ATURAN AKSES FILE

```
BOLEH TULIS   : /workspace/frontend/src/
                /workspace/frontend/docs/      ← update struktur_frontend.md jika ada file baru
                /workspace/laravel_backend/     ← backend boleh diperbaiki sesuai scope task
BOLEH BACA    : /workspace/frontend/
                /workspace/laravel_backend/
ABAIKAN       : node_modules/, dist/, *.sqlite, storage/logs/
```

### 2A. Aturan Perubahan Backend

- Baca `/workspace/laravel_backend/AGENTS.md` dan dokumen backend-local yang diwajibkan sebelum mengubah backend.
- Backend boleh diubah jika diperlukan untuk menutup finding Audit-13 atau menjaga kontrak end-to-end.
- Pertahankan tenant middleware, permission, journal immutability, period/date guard, transaction atomicity, serta rollback/void behavior.
- Business logic backend wajib berada di service; validasi request di FormRequest; operasi write wajib transaction-safe.
- Perubahan schema wajib melalui migration. Jangan mengedit database live, file SQLite, atau data bisnis existing secara langsung.
- Tambahkan atau perbarui feature test backend untuk happy path dan failure path utama.
- Jalankan test backend tersempit yang relevan dan `vendor/bin/pint --test` untuk file PHP yang diubah.
- Perubahan frontend dan backend dalam satu phase harus memakai satu kontrak request/response canonical yang didokumentasikan.
- Pernyataan lama di spec/prompt historis yang menyebut backend `read-only` dianggap superseded oleh aturan ini.

### 2B. Akses Runtime Audit

Gunakan deployment berikut untuk audit manual/browser frontend:

```text
URL      : https://app.finlite.my.id/
Email    : admin@example.com
Password : password
```

- Gunakan Playwright untuk audit browser dan viewport.
- Untuk pengujian create/edit/status, gunakan data uji berawalan `AUDIT-`.
- Jangan mengubah data bisnis existing milik user.
- Catat dengan jelas jika hasil berasal dari runtime live, API mock, atau source-only.

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
> Context global terbaru: `docs/praproduction_docs/spec-37-audit-13-remediation.md` + `docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md` + `docs/gap_docs/gap-10-audit-13-remediation-roadmap.md` + `docs/prompt/prompt-guardrails-audit-13-implementation.md`.

> **Mandatory phase validation:** Setelah implementasi/refactor setiap phase, jalankan validation pass Spec-37 §17.1. Phase tidak boleh ditandai selesai sebelum seluruh finding pada coverage phase diverifikasi satu per satu, jumlah checklist cocok dengan jumlah finding, dan tidak ada regression baru yang belum selesai.

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
| 18 | Reports Contract Hardening | ✅ Done | `prompt-phase-18-reports-contract-hardening.md` | A12-12/15 — adapter boundary TB/PL/BS/CF/FinSummary, runtime guard, hapus export PDF/Excel & transaction list (endpoint fiktif) |
| 19 | Stock Balance Contract Fixes | ✅ Done | `prompt-phase-19-stock-balance-contract-fixes.md` | A12-05/13/14 — product DTO, detail route, unsupported filters |
| 20 | Filter & Table Bulk Workflow | ✅ Done | `prompt-phase-20-filter-and-table-bulk-workflow.md` | A12-01/02/06/07 — multi-select, date range, row checkbox, bulk void |
| 21 | Persistent Form Drafts | ✅ Done | `prompt-phase-21-persistent-form-drafts.md` | A12-08 — localStorage draft hook + rollout awal Sales Invoice, Vendor Bill, Stock Adjustment, Bank Transfer |
| 22 | Select, Date & Edit Mode UX | ✅ Done | `prompt-phase-22-select-date-edit-mode-ux.md` | A12-09/10/11 — SearchableSelect preload, `toDateInputValue` di 12 form, edit/read-only policy (`documentEditPolicy` + `FormLayout.readOnly`) |
| 23 | Tabs, Ribbon & Lint Cleanup | ✅ Done | `prompt-phase-23-tabs-ribbon-lint-cleanup.md` | A12-03/04/16 — close-all tabs, ribbon empty diagnostic, lint debt cleanup |

---

### 6B. Audit Phases

| Audit | Tanggal | Cakupan | Status | Hasil |
|---|---|---|---|---|
| Audit 01–10 | sebelum 2026-06-14 | Backend architecture, ERD, workflow, API contract, business rules | ✅ Selesai | `docs/audit_docs/audit-00..audit-10*` |
| Audit-11 | 2026-06-16 | Frontend vs Backend global contract map | ✅ Selesai, fixes ⏳ | 18 issue (A11-01..A11-18) — `audit-11-frontend-global-contract-map-16-06-26.md` |
| Audit-12 | 2026-06-16 | Frontend UX/workflow/filter/tabs/reports audit berdasarkan temuan user | ✅ Selesai, fixes ⏳ | 16 issue (A12-01..A12-16) — `audit-12-frontend-ux-workflow-audit-16-06-26.md` |
| Audit-13 | 2026-06-17–2026-06-21 | Manual frontend audit tracker + runtime/source/contract audit bertahap | ✅ Selesai, fixes ⏳ | Seluruh 105 area baseline diaudit dan 280 finding tercatat. Audit penutup Period-End live+route-mock menemukan endpoint status/checklist 500 yang disamarkan sebagai empty, blocker DTO membuat route crash, dan checklist canonical salah dirender — A13-272..280. Backlog implementasi tetap terbuka — `audit-13-manual-frontend-audit-tracker-17-06-26.md` |

---

### 6C. Build Status

```
Terakhir dicek  : 2026-06-21 (Audit-13 Period-End, perubahan dokumen saja)
npm run build   : ✅ 0 error
npm run lint    : ✅ 0 error; 35 warning RHF watch/useMemo legacy
                  di file-file yang tidak diubah pada audit ini
Playwright      : ✅ Chromium headless; Period-End live + route-mock pada 1440×900,
                  1180×708, 1024×656, dan 390×844; POST run/reopen diintersep
```

---

### 6D. Next Action

> Roadmap aktif adalah GAP-10 Phase 24–39. Tabel Audit-12 berikut hanya riwayat phase yang sudah selesai.

| Urutan | Phase | Nama | A12 | Severity |
|---|---|---|---|---|
| 1 | Phase 18 | ~~Reports Contract Hardening~~ ✅ Done | A12-12/15 | Critical |
| 2 | Phase 19 | ~~Stock Balance Contract Fixes~~ ✅ Done | A12-05/13/14 | High |
| 3 | Phase 20 | ~~Multi-select Filter + Date Range~~ ✅ Done | A12-01/02 | High |
| 4 | Phase 20 | ~~Row Checkbox + Bulk Void~~ ✅ Done | A12-06/07 | High |
| 5 | Phase 21 | ~~Persistent Unsaved Form Draft~~ ✅ Done | A12-08 | Critical |
| 6 | Phase 22 | ~~SearchableSelect Preload/Labels~~ ✅ Done | A12-09 | High |
| 7 | Phase 22 | ~~Date Input Normalization~~ ✅ Done | A12-11 | High |
| 8 | Phase 23 | ~~Close All Primary Tabs~~ ✅ Done | A12-03 | Medium |
| 9 | Phase 23 | ~~Fixed Assets Ribbon Empty Diagnostic~~ ✅ Done | A12-04 | Medium |
| 10 | Phase 22 | ~~Document Edit/View Mode Policy~~ ✅ Done | A12-10 | Medium |
| 11 | Phase 23 | ~~Lint Debt Cleanup~~ ✅ Done | A12-16 | Medium |

#### Audit-13 Critical Reference

> Daftar ini adalah referensi finding kritis. Urutan eksekusi canonical mengikuti dependency di `gap-10-audit-13-remediation-roadmap.md`, dimulai dari Phase 24.

| Urutan | Finding | Nama | Modul | Severity |
|---|---|---|---|---|
| 1 | A13-155 | Perbaiki adapter AR Aging | Sales / AR | Critical |
| 2 | A13-156 | Perbaiki renderer AR Reconciliation | Sales / AR | Critical |
| 3 | A13-157 | Perbaiki adapter Customer/Invoice Ledger | Sales / AR | Critical |
| 4 | A13-180 | Perbaiki adapter AP Aging | Purchase / AP | Critical |
| 5 | A13-181 | Perbaiki renderer AP Reconciliation | Purchase / AP | Critical |
| 6 | A13-182 | Perbaiki adapter Vendor/Bill Ledger | Purchase / AP | Critical |
| 7 | A13-136 | Tambahkan request adapter semua form Sales | Sales | Critical |
| 8 | A13-137 | Tambahkan response adapter detail Sales | Sales | Critical |
| 9 | A13-161 | Tambahkan request adapter semua form Purchase | Purchase | Critical |
| 10 | A13-162 | Tambahkan response adapter detail Purchase | Purchase | Critical |
| 11 | A13-145 | Wajibkan source Retur Penjualan | Sales / Return | Critical |
| 12 | A13-170 | Wajibkan source Retur Pembelian | Purchase / Return | Critical |
| 13 | A13-139 | Persist draft tujuh form Sales | Sales | Critical |
| 14 | A13-164 | Persist draft enam form Purchase | Purchase | Critical |
| 15 | A13-127 | Adaptasi DTO line Rekonsiliasi Bank | Cash & Bank / Rekonsiliasi Bank | Critical |
| 16 | A13-204 | Pulihkan seluruh API Fixed Assets | Fixed Assets | Critical |
| 17 | A13-210 | Kunci/revisi field finansial capitalized | Fixed Assets | Critical |
| 18 | A13-212 | Perbaiki partial capitalization | Fixed Assets | Critical |
| 19 | A13-214 | Terapkan period/date guards Fixed Assets | Fixed Assets | Critical |
| 20 | A13-217 | Hentikan depresiasi setelah disposal | Fixed Assets | Critical |
| 21 | A13-220 | Validasi account mapping kategori | Fixed Assets | Critical |
| 22 | A13-225 | Perbaiki register as-of | Fixed Assets / Reports | Critical |
| 23 | A13-226 | Perbaiki reconciliation cutoff | Fixed Assets / Reports | Critical |
| 24 | A13-232 | Perbaiki contract Buku Besar | Reports | Critical |
| 25 | A13-233 | Canonical-kan filter periode report | Reports | Critical |
| 26 | A13-234 | Perbaiki filter Ringkasan Keuangan | Reports | Critical |
| 27 | A13-235 | Perbaiki adapter AR/AP Aging | Reports | Critical |
| 28 | A13-236 | Perbaiki adapter Rekonsiliasi | Reports | Critical |
| 29 | A13-237 | Perbaiki adapter Laporan Stok | Reports | Critical |
| 30 | A13-238 | Perbaiki adapter Analisis Inventori | Reports | Critical |
| 31 | A13-255 | Perbaiki kontrak Pemetaan Akun settings (save ke `/undefined`) | Settings / Pemetaan Akun | Critical |
| 32 | A13-263 | Cegah self/last-owner deactivate-remove | Settings / Pengguna | High |
| 33 | A13-271 | Pulihkan deep-link/refresh rute (memory router) | Settings / Global Router | High |
| 34 | A13-272 | Pulihkan endpoint live Period-End | Accounting / Period-End | Critical |
| 35 | A13-273 | Perbaiki renderer blocker/warning Period-End | Accounting / Period-End | Critical |
| 36 | A13-274 | Adaptasi checklist canonical Period-End | Accounting / Period-End | High |
| 37 | A13-276 | Tampilkan error/retry Period-End | Accounting / Period-End | High |

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

# Jika backend diubah:
cd /workspace/laravel_backend
php artisan test --filter=<test terkait>
vendor/bin/pint --test
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

Sebelum status phase diubah menjadi `✅ Done`:
- Jalankan mandatory phase validation gate di `spec-37-audit-13-remediation.md` §17.1
- Rekonsiliasi `total finding phase = total validation checklist = total verified`
- Pastikan tidak ada finding scope yang masih `open`, `triaged`, `in-progress`, atau hanya `fixed`
- Jika retest gagal atau regression baru ditemukan, pertahankan status `🔧 In Progress`

### 10D. Format Commit

```
feat(sales): add sales invoice list page with filter
fix(shared): resolve DataTable build error on generic type
refactor(layout): extract tab state to useTabStore
docs(agents): update tracking phase 16 done
```
