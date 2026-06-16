# Audit-11 — Frontend Global Contract Map

Tanggal: 16-06-26  
Scope: Frontend ERP `/workspace/frontend` vs backend Laravel `/workspace/laravel_backend`  
Status: Global audit entry point. Detail teknis berikutnya harus dipisah ke `frontend/docs/gap_docs`, `issue_docs`, `praproduction_docs`, `design_docs`, dan `prompt`.

---

## 1. Tujuan File Ini

File ini menggabungkan:

- audit lama di `frontend/docs/gap_docs/*`;
- detail issue lama di `frontend/docs/issue_docs/*`;
- spec dan prompt implementasi phase 8-13;
- temuan audit terbaru yang belum sempat disimpan;
- status aktual code saat audit ini dibuat.

Gunakan file ini sebagai peta global sebelum agent menjalankan perbaikan. Jangan mulai implementasi langsung dari chat lama.

---

## 2. Entry Point Lama yang Sudah Dibaca

Canonical routing dokumentasi saat ini ada di:

- `/workspace/frontend/docs/AGENT_ENTRY_POINT.md`
- `/workspace/frontend/docs/gap_docs/gap-00-master-index.md`
- `/workspace/frontend/docs/gap_docs/gap-01-p0-contract-fixes.md`
- `/workspace/frontend/docs/gap_docs/gap-02-settings-access-mismatch.md`
- `/workspace/frontend/docs/gap_docs/gap-03-missing-modules.md`
- `/workspace/frontend/docs/gap_docs/gap-04-setup-wizard-refactor.md`
- `/workspace/frontend/docs/gap_docs/gap-05-dashboard-no-backend.md`
- `/workspace/frontend/docs/gap_docs/gap-06-report-gaps.md`
- `/workspace/frontend/docs/issue_docs/issue-01-permission-keys.md`
- `/workspace/frontend/docs/issue_docs/issue-02-ribbon-paths.md`
- `/workspace/frontend/docs/issue_docs/issue-03-fiscal-year-http-methods.md`
- `/workspace/frontend/docs/issue_docs/issue-04-bank-recon-methods.md`
- `/workspace/frontend/docs/issue_docs/issue-05-settings-endpoints.md`
- `/workspace/frontend/docs/issue_docs/issue-06-report-endpoint-fixes.md`
- `/workspace/frontend/docs/praproduction_docs/spec-26-p0-contract-fixes.md`
- `/workspace/frontend/docs/praproduction_docs/spec-27-settings-access-refactor.md`
- `/workspace/frontend/docs/praproduction_docs/spec-28-fixed-assets-module.md`
- `/workspace/frontend/docs/praproduction_docs/spec-29-opening-balance-module.md`
- `/workspace/frontend/docs/praproduction_docs/spec-30-setup-wizard-refactor.md`
- `/workspace/frontend/docs/praproduction_docs/spec-31-period-end-module.md`
- `/workspace/frontend/docs/prompt/prompt-phase-8-p0-contract-fixes.md`
- `/workspace/frontend/docs/prompt/prompt-phase-9-settings-access-refactor.md`
- `/workspace/frontend/docs/prompt/prompt-phase-10-fixed-assets.md`
- `/workspace/frontend/docs/prompt/prompt-phase-11-opening-balance.md`
- `/workspace/frontend/docs/prompt/prompt-phase-12-setup-wizard.md`
- `/workspace/frontend/docs/prompt/prompt-phase-13-period-end.md`

Catatan: beberapa prompt lama memakai nama file/path lama. Jika konflik, source of truth adalah Laravel route list aktual dan source code frontend aktual.

---

## 3. Status Perbaikan yang Sudah Ada Saat Audit

Beberapa masalah lama sudah memiliki mitigasi parsial di code:

| Area | Status aktual |
|---|---|
| Response paginated Laravel | `src/services/http.ts` sudah menormalisasi `{ data: { data: [] } }` menjadi `{ data: [], meta }`. |
| `data.map is not a function` | `DataTable.tsx` sudah punya guard runtime. |
| Nomor dokumen kosong | `http.ts` sudah membuat alias `number` dari `quotation_number`, `order_number`, `bill_number`, dll. Ini workaround global, belum DTO canonical. |
| Journal approve/post/void | `journalEntryApi.ts` sudah memakai `POST` untuk action journal. |
| URL browser disembunyikan | `router/index.tsx` memakai memory router. Konsekuensi: deep link tidak bisa di-copy user. |
| Permission mismatch | `usePermission.ts` punya alias untuk beberapa permission lama. Ini mitigasi, bukan pengganti canonical permission key. |
| Ribbon/tab navigation | AppShell/PrimaryTabs/SecondaryTabs/RibbonPanel sudah sempat diubah agar navigate berdasarkan path/tab state. |

Masalah di bawah tetap harus dianggap belum selesai sampai ada audit detail + implementasi + build pass.

---

## 4. Global Issue Register

### A11-01 — Route/Ribbon Path Mismatch

Severity: Critical  
Status: sebagian masih pending  
Rujukan lama: `gap-01`, `issue-02`, `spec-26`, `prompt-phase-8`

Root cause:

- Ribbon item tidak selalu cocok dengan route frontend aktual.
- COA: ribbon `/master-data/chart-of-accounts`, route frontend `/master-data/coa`, API backend `/master-data/chart-of-accounts`.
- Cash Bank: ribbon `/cash-bank/transfers` dan `/cash-bank/reconciliations`, route frontend `/cash-bank/bank-transfers` dan `/cash-bank/bank-reconciliations`.
- Sales AR dan Purchase AP ribbon memakai parent route `/sales/ar` dan `/purchase/ap`, tetapi frontend hanya punya subroute seperti `/sales/ar/summary` dan `/purchase/ap/summary`.

Dampak:

- Klik ribbon bisa 404 walaupun backend endpoint ada.
- AppShell virtual tabs bisa gagal resolve list/detail karena `findRibbonItemByPath` tidak menemukan path canonical.

Detail berikutnya:

- Pakai/update jika route berubah: `frontend/docs/issue_docs/issue-07-route-ribbon-canonical-map.md`.
- Pakai `frontend/docs/prompt/prompt-phase-16-route-ribbon-canonical-map.md`.

---

### A11-02 — Master Data DTO Mismatch

Severity: Critical  
Status: belum selesai  
Rujukan lama: belum ada detail khusus; audit terbaru.

Root cause:

- Frontend Master Data memakai field mock/lama, backend memakai field domain aktual.

Contoh mismatch:

| Resource | Frontend saat ini | Backend aktual |
|---|---|---|
| COA | `code`, `name`, `type`, `parent_id` | `account_code`, `account_name`, `account_type`, `parent_account_id` |
| Contact | `code`, `type`, `npwp` | `contact_code`, `contact_type`, `tax_number` |
| Product | `code`, `name`, `category_id`, `sell_price`, `buy_price`, `coa_sales_id` | `product_code`, `product_name`, `product_category_id`, no sell/buy price, `sales_account_id` |
| Unit | `symbol`, `decimal_places` | `code`, `precision` |
| Warehouse | no `code` | `code` required |
| Payment Term | no `code` | `code` required |
| Product Category | `description`, `product_count` | `parent_category_id`, `is_active` |

Dampak:

- Table terlihat kosong atau field `-`.
- Form create/update menghasilkan 422.
- Product price menampilkan `NaN`.
- SearchableSelect option bisa menampilkan label kosong jika adapter salah.

Detail berikutnya:

- Buat `frontend/docs/gap_docs/gap-07-master-data-dto-contract.md`.
- Buat issue terpisah per resource jika perlu: `issue-07-coa-dto.md`, `issue-08-product-dto.md`, dst.
- Pakai `spec-32-master-data-dto-contract-fixes.md`.
- Pakai `prompt-phase-14-master-data-dto-contract-fixes.md`.

---

### A11-03 — Master Data Delete vs Activate/Deactivate

Severity: High  
Status: belum selesai  
Rujukan lama: belum ada detail khusus; audit terbaru.

Root cause:

- Frontend simple master data services memakai `DELETE`.
- Backend MasterData routes tidak menyediakan delete; backend menyediakan `PATCH /activate` dan `PATCH /deactivate`.

Terkena:

- `kategoriProdukApi.delete`
- `satuanApi.delete`
- `gudangApi.delete`
- `paymentTermsApi.delete`
- `departemenApi.delete`
- `proyekApi.delete`

Dampak:

- Tombol hapus akan 404/405.
- Permission guard seperti `master-data.units.delete` juga tidak sesuai backend.

Detail berikutnya:

- Gabungkan ke `gap-07-master-data-dto-contract.md` atau buat `issue-09-master-data-delete-actions.md`.
- Prompt implementasi harus mengganti konsep "hapus" menjadi "nonaktifkan/aktifkan".

---

### A11-04 — Product Table/Form Broken

Severity: Critical  
Status: belum selesai  
Rujukan lama: bagian dari A11-02; user-visible bug.

Root cause:

- Product frontend schema/type/form/list tidak sesuai `Product` model dan `StoreProductRequest`.
- Backend tidak punya `sell_price`/`buy_price` di product master saat ini.
- Backend list service belum eager-load `category`/`unit`, jadi walaupun field ID benar, relation display bisa kosong.

Dampak:

- Product table kosong/`NaN`.
- Create/update product gagal validasi.
- Filter `category_id` frontend tidak cocok dengan backend `product_category_id`.

Detail berikutnya:

- Buat issue khusus `issue-08-product-dto-and-table.md`.
- Tentukan keputusan bisnis: harga jual/beli dihilangkan dari Product master atau backend ditambah price fields.

---

### A11-05 — Journal List Totals and Detail Account Labels

Severity: High  
Status: sebagian action journal sudah fixed, display belum selesai  
Rujukan lama: `issue-06` hanya mention approve; audit terbaru menambah totals/labels.

Root cause:

- `JournalEntryService::list()` backend mengirim journal header tanpa agregat line.
- Frontend `JournalListPage` membaca `total_debit`/`total_credit`, lalu fallback ke 0.
- Detail backend sudah `with('lines.account')`, tetapi `JournalFormPage` hanya menyimpan `account_id` ke line state.
- `SearchableSelect` butuh `selectedOptions` untuk menampilkan label dari value yang sudah ada.

Dampak:

- List jurnal menunjukkan Rp 0 padahal detail punya nilai.
- Akun di baris detail terlihat kosong.

Detail berikutnya:

- Buat `issue-10-journal-list-totals-and-account-labels.md`.
- Keputusan teknis: agregat totals idealnya dari backend list; selectedOptions bisa fixed di frontend.

---

### A11-06 — Settings and Access Endpoint Mismatch

Severity: Critical  
Status: belum selesai  
Rujukan lama: `gap-02`, `issue-05`, `spec-27`, `prompt-phase-9`, `design-N3`.

Root cause:

- Frontend settings masih memakai `/settings/users`, `/settings/roles`, `/settings/preferences`, `/settings/transactions`.
- Backend aktual memisahkan `/settings/company/*` dan `/access/*`.

Dampak:

- Settings users/roles/preferences/transactions 404.
- Create user langsung tidak valid; backend pakai invitation.

Detail canonical:

- Ikuti `spec-27-settings-access-refactor.md`.
- Pastikan prompt phase 9 tetap dicocokkan dengan route list backend aktual sebelum implement.

---

### A11-07 — Dashboard Endpoint Missing

Severity: Medium  
Status: belum selesai  
Rujukan lama: `gap-05`.

Root cause:

- Frontend memanggil `/dashboard/summary`, `/dashboard/pending`, `/dashboard/chart`, `/dashboard/activities`.
- Backend tidak punya route `/dashboard/*`.

Dampak:

- Dashboard awal bisa error/empty.

Detail berikutnya:

- Tetap gunakan `gap-05`.
- Tambah issue jika perlu: `issue-11-dashboard-graceful-fallback.md`.

---

### A11-08 — Onboarding / Setup Wizard Endpoint Lama

Severity: High  
Status: belum selesai  
Rujukan lama: `gap-04`, `spec-30`, `prompt-phase-12`.

Root cause:

- Onboarding masih memakai endpoint company/setup lama seperti `/companies/{id}/coa-template`, `/companies/{id}/complete-onboarding`, `/accounting/opening-balances`.
- Backend source of truth adalah `/setup/*` dan `/opening-balance/*`.

Dampak:

- Wizard gagal saat save/finalize.
- Current step lokal frontend bisa tidak sinkron dengan backend.

Detail canonical:

- Ikuti `spec-30`.
- Step 2 COA template masih perlu konfirmasi backend.

---

### A11-09 — Opening Balance Module Missing

Severity: High  
Status: belum selesai  
Rujukan lama: `gap-03 §3B`, `spec-29`, `design-N2`, `prompt-phase-11`.

Root cause:

- Backend sudah punya `/opening-balance/*`, frontend belum punya module/page.
- Onboarding Step5 masih mencoba handle OB inline.

Dampak:

- Setup saldo awal tidak bisa dipakai sesuai backend.

Detail canonical:

- Ikuti `spec-29`.

---

### A11-10 — Period-End Module Missing

Severity: High  
Status: belum selesai  
Rujukan lama: `gap-03 §3C`, `spec-31`, `design-N4`, `prompt-phase-13`.

Root cause:

- Backend sudah punya `/accounting/period-end/*`, frontend belum punya service/hook/page/ribbon.

Dampak:

- Proses akhir periode tidak bisa diakses dari UI.

Detail canonical:

- Ikuti `spec-31`.

---

### A11-11 — Fixed Assets Module Missing

Severity: High  
Status: belum selesai  
Rujukan lama: `gap-03 §3A`, `spec-28`, `design-N1`, `prompt-phase-10`.

Root cause:

- Backend sudah punya `/fixed-assets/*`, frontend belum punya module.
- Ada `fixedAssetCategoryApi.ts` parsial di purchase yang harus dipindahkan.

Dampak:

- Aktiva tetap tidak bisa digunakan walaupun backend ada.

Detail canonical:

- Ikuti `spec-28`.

---

### A11-12 — Cash Bank Reconciliation Method and Missing Actions

Severity: Critical  
Status: belum selesai  
Rujukan lama: `issue-04`, `spec-26`, `prompt-phase-8`.

Root cause:

- Backend route `refresh-lines` dan `mark-lines` adalah `POST`, frontend memakai `PATCH`.
- Frontend memanggil `finalize` dan `void` reconciliation, tetapi route tersebut tidak terlihat di backend route list saat audit.

Dampak:

- Workflow rekonsiliasi bank gagal setelah user masuk ke form.

Detail berikutnya:

- Update `issue-04-bank-recon-methods.md` dengan route aktual `/cash-bank/bank-reconciliations/*`.
- Jangan pakai path lama `/cash-bank/reconciliations/*`.

---

### A11-13 — Reports Endpoint Gaps

Severity: Medium  
Status: sebagian sudah benar, sebagian belum  
Rujukan lama: `gap-06`, `issue-06`, `spec-26`.

Root cause:

- Export endpoints `/reports/{type}/export/pdf|excel` tidak ada.
- `/reports/transactions` tidak ada.
- Backend punya reconciliation tambahan: GRNI, customer deposits, vendor deposits, tapi frontend belum expose.
- AR/AP aging di `reportsApi.ts` saat audit sudah mengarah ke `/sales/ar/aging` dan `/purchase/ap/aging`; bagian ini perlu ditandai sudah benar jika dicek lagi.

Dampak:

- Export dan transaction report 404.
- Laporan rekonsiliasi backend tidak lengkap di UI.

Detail berikutnya:

- Update `issue-06-report-endpoint-fixes.md` agar status AR/AP aging tidak lagi dianggap belum tentu salah jika code sudah benar.

---

### A11-14 — Document Number Generic Mapping

Severity: High  
Status: workaround ada, canonical belum  
Rujukan lama: tracking local `frontend/docs/tracking/2026-06-16-workspace-document-number-alias-fix.md`; audit terbaru.

Root cause:

- Banyak list membaca `original.number`.
- Backend mengirim field spesifik: `quotation_number`, `order_number`, `invoice_number`, `bill_number`, dll.

Dampak:

- Nomor dokumen kosong di banyak workspace list.
- Workaround global di transport layer bisa menyembunyikan DTO mismatch lain.

Detail berikutnya:

- Buat `gap-08-transaction-dto-number-contract.md`.
- Tentukan apakah canonical frontend tetap memakai `number` via adapter per service, atau type mengikuti backend field asli.

---

### A11-15 — SearchableSelect Selected Label Missing

Severity: Medium  
Status: belum selesai  
Rujukan lama: design-C3; audit terbaru.

Root cause:

- `SearchableSelect` tidak bisa resolve label hanya dari ID.
- Form detail harus memberi `selectedOptions` dari relation backend.
- Banyak form sudah memberi selectedOptions, JournalForm belum.

Dampak:

- Field select terlihat kosong saat edit/detail padahal value ada.

Detail berikutnya:

- Buat `issue-12-searchable-select-selected-options-audit.md`.
- Audit semua form detail yang memakai `SearchableSelect`.

---

### A11-16 — Number/Date Formatter Guards

Severity: Medium  
Status: belum selesai  
Rujukan lama: audit terbaru.

Root cause:

- `formatCurrency`, `formatNumber`, `formatDate` tidak guard `undefined`, `null`, atau invalid date.
- Product list memakai `Number(original.sell_price)` langsung.

Dampak:

- `NaN`, `Invalid Date`, atau misleading fallback bisa muncul.

Detail berikutnya:

- Buat `issue-13-formatters-null-invalid-guard.md`.
- Terapkan guard di formatter shared dan hilangkan parsing ad-hoc di pages.

---

### A11-17 — Error Handling Drops Laravel Validation Detail

Severity: Medium  
Status: belum selesai  
Rujukan lama: audit terbaru.

Root cause:

- Banyak page memakai `catch { toast.error('Gagal ...') }`.
- `ApiError.message` dan `errors` dari Laravel tidak ditampilkan.

Dampak:

- 422 validasi field terlihat sebagai error umum.
- Debug UI lebih lambat karena user tidak tahu field mana yang salah.

Detail berikutnya:

- Buat `issue-14-api-error-display-and-form-errors.md`.
- Buat helper shared untuk extract error message + optionally set RHF field errors.

---

### A11-18 — DataTable Reuse Not Consistent

Severity: Medium  
Status: belum selesai  
Rujukan lama: `design-C4`, `spec-23`; audit terbaru.

Root cause:

- Mayoritas workspace list memakai `DataTable`, tetapi COA masih custom table.
- Sticky offsets manual berbeda-beda (`stickyLeft: 0`, `32`).
- Selection checkbox muncul saat `onRowSelect` ada, meskipun tidak selalu ada bulk action.

Dampak:

- Tablet behavior dan pagination tidak konsisten.
- Some pages risk sticky overlap/poor horizontal scroll.

Detail berikutnya:

- Buat `issue-15-datatable-reuse-and-sticky-column-audit.md`.
- Jangan ubah design besar sebelum DTO/API contract stabil.

---

## 5. Prioritas Implementasi Baru

Urutan disarankan setelah audit-11:

1. A11-01 Route/Ribbon canonical map.
2. A11-02/A11-03/A11-04 Master Data DTO + actions.
3. A11-05 Journal totals + account labels.
4. A11-12 Cash Bank reconciliation methods/actions.
5. A11-06 Settings & Access refactor.
6. A11-08/A11-09 Setup Wizard + Opening Balance.
7. A11-13 Reports gaps.
8. A11-07 Dashboard fallback.
9. A11-14/A11-15/A11-16 shared DTO/select/formatter hardening.
10. A11-18 DataTable consistency.
11. A11-10/A11-11 missing modules if business priority says proceed.

---

## 6. Status Dokumen Detail

Status dokumen lanjutan di `/workspace/frontend/docs`:

| File target | Status | Isi |
|---|---|---|
| `gap_docs/gap-07-master-data-dto-contract.md` | Tersedia | COA, Contact, Product, Unit, Warehouse, Payment Term, Product Category DTO mismatch. |
| `gap_docs/gap-08-transaction-dto-number-contract.md` | Tersedia | Standard document number mapping untuk Sales/Purchase/CashBank/Inventory. |
| `issue_docs/issue-07-route-ribbon-canonical-map.md` | Tersedia | Semua path ribbon vs route frontend vs backend endpoint. |
| `issue_docs/issue-08-product-dto-and-table.md` | Tersedia | Product table/form/root cause NaN. |
| `issue_docs/issue-09-master-data-delete-actions.md` | Tersedia | Delete action menjadi activate/deactivate. |
| `issue_docs/issue-10-journal-list-totals-and-account-labels.md` | Tersedia | Journal totals backend/frontend + selectedOptions. |
| `issue_docs/issue-11-dashboard-graceful-fallback.md` | Tersedia | Dashboard tanpa backend endpoint. |
| `issue_docs/issue-12-searchable-select-selected-options-audit.md` | Tersedia | Audit selectedOptions semua form detail. |
| `issue_docs/issue-13-formatters-null-invalid-guard.md` | Tersedia | Formatter guards. |
| `issue_docs/issue-14-api-error-display-and-form-errors.md` | Tersedia | Laravel ApiError display and RHF field errors. |
| `issue_docs/issue-15-datatable-reuse-and-sticky-column-audit.md` | Tersedia | DataTable consistency. |
| `praproduction_docs/spec-32-master-data-dto-contract-fixes.md` | Tersedia | Spec implementasi Master Data DTO/action. |
| `praproduction_docs/spec-33-transaction-dto-number-contract.md` | Tersedia | Spec transaction document number + journal display. |
| `praproduction_docs/spec-34-route-ribbon-canonical-map.md` | Tersedia | Spec route/ribbon/virtual tab canonical map. |
| `praproduction_docs/spec-35-shared-runtime-hardening.md` | Tersedia | Spec formatter, error, select, dashboard, DataTable hardening. |
| `prompt/prompt-guardrails-audit-11-implementation.md` | Tersedia | Guardrails viewport, topbar, ribbon, virtual tabs, sessionStorage, hidden URL. |
| `prompt/prompt-phase-14-master-data-dto-contract-fixes.md` | Tersedia | Prompt eksekusi Master Data DTO/action. |
| `prompt/prompt-phase-15-transaction-dto-number-contract.md` | Tersedia | Prompt eksekusi transaction document number + journal display. |
| `prompt/prompt-phase-16-route-ribbon-canonical-map.md` | Tersedia | Prompt eksekusi route/ribbon/virtual tab canonical map. |
| `prompt/prompt-phase-17-shared-runtime-hardening.md` | Tersedia | Prompt eksekusi shared runtime hardening. |

---

## 7. Catatan untuk Agent Berikutnya

- Selalu baca `/workspace/frontend/AGENTS.md` lalu `/workspace/frontend/docs/AGENT_ENTRY_POINT.md`.
- Setelah itu baca file audit ini sebagai global map terbaru.
- Jangan menganggap dokumen lama final jika bertentangan dengan source code aktual atau Laravel route list.
- Jangan memperbaiki semua sekaligus. Pecah berdasarkan A11 issue ID.
- Untuk setiap fix, update `frontend/docs/struktur_frontend.md` jika menambah file baru.
- Jalankan `npm run build` setelah implementasi frontend.
