# Agent Prompt — Phase 30 Completion: Purchase Transaction Contract

**Dibuat**: 2026-06-26  
**Tujuan**: Panduan mandiri untuk AI agent menyelesaikan Phase 30 tanpa perlu scan seluruh project.  
**Status Phase 30**: In Progress — Vendor Bill 5/11 langkah selesai, 6 resource lain belum dimulai.

---

## 1. Konteks Singkat

**Project**: Seaside Escape ERP — SPA React (`react_frontend/`) + Laravel API (`laravel_backend/`).  
**Backend**: multi-tenant SQLite. Header wajib tiap request: `Authorization: Bearer <token>` + `X-Company-ID: <id>`.  
**Phase 30 goal**: Perbaiki seluruh contract transaksi Purchase (7 resource) mengacu finding A13-161..179 di `docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md`.

**Dokumen wajib dibaca sebelum menulis kode apapun**:
```
docs/prompt/prompt-guardrails-audit-13-implementation.md   ← execution rules
docs/praproduction_docs/spec-37-audit-13-remediation.md   ← invariant & DoD
docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md  ← A13-161..179
docs/prompt/prompt-phase-30-purchase-transaction-contract.md        ← progress log & gap
react_frontend/AGENTS.md §8                                ← hard rules
laravel_backend/AGENTS.md                                  ← backend rules
```

---

## 2. State Aktual (per 2026-06-26)

### 2A. Yang Sudah Selesai (Vendor Bill)

| File | Isi |
|---|---|
| `src/modules/purchase/services/vendorBillAdapter.ts` | Adapter A13-161/162: `toVendorBillPayload` (UI→backend), `fromVendorBillResponse` (backend→UI) |
| `src/modules/purchase/services/vendorBillSourceApi.ts` | A13-165: cari PO/GR eligible + preview sisa qty |
| `src/modules/purchase/schemas/vendorBillSchema.ts` | A13-163: `validateVendorBillLines` (Zod, nested error per row) |
| `src/components/shared/document/ConfirmDialog.tsx` | A13-167: dialog konfirmasi lifecycle (shared) |
| `src/modules/purchase/hooks/useVendorBillList.ts` | `select` adapter aktif di list+detail |
| `src/modules/purchase/pages/VendorBillListPage.tsx` | A13-177/178/179: search/status(CSV)/date server-side, pageSize, error+retry |
| `src/modules/purchase/pages/VendorBillFormPage.tsx` | Source picker, validasi line, confirm dialog approve/post |
| `app/Traits/ApiResponse.php` | `applyListStatus` jadi CSV-aware (multi-status) |
| `tests/Feature/Purchase/VendorBillTest.php` | `test_list_filters_by_multiple_statuses_server_side` ✅ |

### 2B. Gap Runtime Ditemukan

**GAP-30-001** (A13-162 follow-up): Label produk per-line di `VendorBillFormPage.tsx` tidak preload — `SearchableSelect` kolom produk/kategori di `LineItemsTable` tidak diberi `selectedOptions`. Data sudah ada di `lines` state via adapter (field `product`), tinggal pass ke prop. Fix digabung ke Langkah 6.

### 2C. Yang Belum Dimulai

**Sisa Vendor Bill** (Langkah 6–11):
- A13-171 + GAP-30-001 — field hilang (vendor_invoice_number, warehouse per-line, dll) + preload label produk
- A13-172 — validasi cross-date (`due_date ≥ bill_date`)
- A13-174 — state error/not-found detail + map field error backend ke form
- A13-166 — permission guard
- A13-168 — vendor deposit workflow
- A13-175 — accessibility label/htmlFor

**6 resource lain (A13-161/162..179 masih open)**:
- Purchase Request, Purchase Order, Goods Receipt, Vendor Deposit, Vendor Payment, Purchase Return

---

## 3. Pola Canonical — IKUTI INI, JANGAN IMPROVISASI

### 3A. Adapter (A13-161/162) — referensi: `vendorBillAdapter.ts`

Setiap resource wajib punya file `{resource}Adapter.ts` di `services/` dengan dua fungsi:

```typescript
// 1. Request: UI form → backend payload
export function to{Resource}Payload(values, lines?): Create{Resource}Payload { ... }

// 2. Response: backend raw → UI model
export function from{Resource}Response(raw: Raw{Resource}): {Resource} { ... }
```

Cara pasang ke hook (via React Query `select`):
```typescript
// di useXxxList.ts
queryFn: () => xxxApi.list(params),
select: (res) => ({ ...res, data: res.data.map(fromXxxResponse) }),

// untuk detail
queryFn: () => xxxApi.get(id),
select: (res) => ({ ...res, data: fromXxxResponse(res.data) }),
```

### 3B. Field tanggal canonical per resource

| Resource | Field backend (wajib dikirim) | Field UI form (input) |
|---|---|---|
| Vendor Bill | `bill_date` | `date` |
| Purchase Request | `request_date` | `date` |
| Purchase Order | `order_date` | `date` |
| Goods Receipt | `receipt_date` | `date` |
| Vendor Deposit | `deposit_date` | `date` |
| Vendor Payment | `payment_date` | `date` |
| Purchase Return | `return_date` | `date` |

### 3C. Field nomor dokumen (dari backend raw)

| Resource | Kolom number di DB | Kolom date di DB |
|---|---|---|
| Purchase Request | `request_number` | `request_date` |
| Purchase Order | `order_number` | `order_date` |
| Goods Receipt | `receipt_number` | `receipt_date` |
| Vendor Bill | `bill_number` | `bill_date` |
| Vendor Deposit | `deposit_number` | `deposit_date` |
| Vendor Payment | `payment_number` | `payment_date` |
| Purchase Return | `return_number` | `return_date` |

### 3D. Pattern adapter relasi (dari Vendor Bill sebagai contoh)

```typescript
// vendor: contact_code → code, name sama
vendor: raw.vendor ? { id: raw.vendor.id, code: raw.vendor.contact_code, name: raw.vendor.name } : undefined,

// product per line: product_name → name
product: line.product ? { id: line.product.id, code: line.product.product_code, name: line.product.product_name } : null,

// diskon line: discount_type + discount_value → persen UI
toDiscountPercent: line.discount_type === 'percent' ? num(line.discount_value) : 0

// pajak line: tax_rate → tax_percent
tax_percent: num(line.tax_rate)
```

### 3E. Tipe raw backend wajib didefinisikan di `{resource}.types.ts`

```typescript
export interface Raw{Resource}Line { ... }  // nama kolom DB
export interface Raw{Resource} { ... }       // nama kolom DB
export interface {Resource}LineInput { ... } // UI form input
// payload ke backend pakai discount_type/discount_value/tax_rate, BUKAN discount_percent/tax_percent
```

### 3F. List page: server-side, error/retry (A13-177/178/179)

```typescript
// kirim ke API:
search?: string          // dari input debounce 350ms
status?: string          // CSV mis "draft,posted" (backend applyListStatus sudah CSV-aware)
date_from?: string
date_to?: string
per_page: pageSize       // state 25|50|100

// error state: pakai EmptyState dari @/components/shared/feedback/EmptyState
{isError ? (
  <EmptyState icon={AlertTriangle} title="Gagal memuat ..."
    action={<Button onClick={() => void refetch()}>Coba Lagi</Button>} />
) : <DataTable ... />}
```

### 3G. Lifecycle confirmation (A13-167)

```typescript
// pakai ConfirmDialog yang sudah ada
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
// approve/post/cancel → ConfirmDialog (tanpa reason)
// void → VoidConfirmDialog (dengan reason wajib ≥10 karakter)
```

### 3H. Validasi line (A13-163)

```typescript
// tambah di {resource}Schema.ts:
export function validate{Resource}Lines(lines): {Resource}LineErrors {
  // pakai Zod superRefine, return map error per index
  // wajib: product/category, description, qty > 0, price ≥ 0
}
// di handleSave: validasi dulu sebelum mutateAsync
```

### 3I. Source picker (A13-165) — hanya untuk resources yang punya source

```typescript
// pola dari vendorBillSourceApi.ts:
// - search: GET /purchase/{orders|goods-receipts}?search=q&per_page=50
// - filter status eligible client-side: confirmed/partially_billed (PO), received/partially_billed (GR)
// - preview: GET detail → hitung remaining = quantity - billed_quantity per line
// - konversi: POST /purchase/bills/from-purchase-order/:id (backend hitung remaining, idempotent)
// - tombol "Buat dari Sumber" disabled jika !sourcePreview?.hasRemaining
```

---

## 4. Backend Contract Summary

Backend return Eloquent model langsung (kolom DB), TIDAK ada Resource/serializer. Semua pemetaan dilakukan di frontend adapter.

**Eager loads per resource** (sudah di-load, tidak perlu ubah backend):
- Vendor Bill detail: `lines.product`, `vendor`, `paymentTerm`, `purchaseOrder`, `goodsReceipt`
- Vendor Bill list: `vendor`, `paymentTerm`

**Untuk resource lain**, cek eager loads di method `find()`/`list()` di `laravel_backend/app/Services/Purchase/{Resource}Service.php` sebelum membuat adapter.

**Jika backend perlu diubah** (mis. tambah eager load, fix filter):
1. Baca `laravel_backend/AGENTS.md` dulu
2. Tambah feature test + jalankan `php artisan test --filter={Resource}Test`
3. Jalankan `vendor/bin/pint {file yang diubah}` → harus pass

---

## 5. Urutan Pengerjaan yang Direkomendasikan

### Tahap 1 — Selesaikan Vendor Bill (Langkah 6–11)

1. **A13-171 + GAP-30-001**: tambah field hilang di form + fix preload label produk per-line (`selectedOptions` di SearchableSelect kolom produk/kategori)
2. **A13-172**: validasi `due_date ≥ bill_date` via Zod `.superRefine`
3. **A13-174**: state not-found (id tidak ada → render NotFound, bukan blank) + map error 422 field ke form
4. **A13-166**: audit permission guard tiap action
5. **A13-168**: vendor deposit workflow (apply, refund, available summary di form)
6. **A13-175**: `htmlFor` + accessible name semua kontrol form

### Tahap 2 — Replikasi ke 6 resource (urutan dependency)

Urutan: **Purchase Order → Purchase Request → Goods Receipt → Vendor Deposit → Vendor Payment → Purchase Return**

Per resource, kerjakan dalam urutan:
1. Buat `{resource}Adapter.ts` (A13-161/162) — pola persis vendorBillAdapter
2. Pasang `select` di hook
3. Update list page: search/status/date/pageSize server-side + error/retry
4. Validasi line schema (jika punya line items)
5. Lifecycle confirmation
6. Source picker (jika relevant: GR dari PO, Bill dari PO/GR, Return dari Bill/GR)

---

## 6. File Referensi Cepat

```
# Adapter canonical (baca ini sebelum buat adapter baru)
src/modules/purchase/services/vendorBillAdapter.ts

# Types pattern (raw + UI + payload)
src/modules/purchase/types/vendorBill.types.ts

# Schema + line validation pattern
src/modules/purchase/schemas/vendorBillSchema.ts

# Hook dengan select
src/modules/purchase/hooks/useVendorBillList.ts

# List page pattern (server-side filter, error/retry)
src/modules/purchase/pages/VendorBillListPage.tsx

# Form page pattern (source picker, line validation, confirm dialog)
src/modules/purchase/pages/VendorBillFormPage.tsx

# Source picker API (eligible filter + preview)
src/modules/purchase/services/vendorBillSourceApi.ts

# Shared components yang SUDAH ADA (jangan buat ulang)
src/components/shared/document/ConfirmDialog.tsx
src/components/shared/document/VoidConfirmDialog.tsx
src/components/shared/feedback/EmptyState.tsx
src/components/shared/form/SearchableSelect.tsx
src/components/shared/form/LineItemsTable.tsx

# Backend request contracts
laravel_backend/app/Http/Requests/Purchase/Store{Resource}Request.php
```

---

## 7. Hard Rules (ringkasan dari AGENTS.md)

```
❌ JANGAN fetch di komponen — semua API call di services/
❌ JANGAN pakai any tanpa justifikasi
❌ JANGAN buat komponen baru jika sudah ada
❌ JANGAN immediate-POST saat mount untuk konversi sumber (A13-165 anti-pattern)
❌ JANGAN hardcode discount_percent/tax_percent ke backend (backend: discount_type+value, tax_rate)

✅ WAJIB tsc 0 error non-lucide sebelum lanjut
✅ WAJIB update docs/struktur_frontend.md jika ada file baru
✅ WAJIB test backend + Pint jika backend diubah
✅ WAJIB map tiap perubahan ke finding A13-xxx yang spesifik
✅ WAJIB konfirmasi ke user sebelum lanjut ke resource/langkah berikutnya
```

---

## 8. Verification Gate (per Langkah)

```bash
# Frontend
cd react_frontend
node node_modules/typescript/bin/tsc -b 2>&1 | grep "error TS" | grep -vc "lucide-react"
# harus: 0

# Backend (jika ada perubahan)
cd laravel_backend
php artisan test --filter={Resource}Test
vendor/bin/pint {file-yang-diubah} --test
```

Playwright dijalankan sebagai checkpoint per beberapa langkah, bukan tiap langkah. Gunakan company 2 (CV Sumber Rejeki) — punya data seed lengkap. Login: `admin@example.com` / `password`.
