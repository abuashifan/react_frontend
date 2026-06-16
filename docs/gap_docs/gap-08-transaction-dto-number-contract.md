# GAP-08 — Transaction Document Number DTO Contract

**Severity**: 🟠 High  
**Tipe**: DTO field mismatch pada nomor dokumen workspace list  
**Sumber utama**: `../audit_docs/audit-11-frontend-global-contract-map-16-06-26.md` A11-14  
**Scope**: Sales, Purchase, Cash & Bank, Inventory, Accounting transaction/workspace list.

---

## 1. Ringkasan

Banyak workspace list frontend membaca field generik:

```ts
original.number
```

Sementara backend mengirim nomor dokumen dalam field spesifik per resource:

```text
quotation_number
order_number
invoice_number
bill_number
receipt_number
transfer_number
adjustment_number
movement_number
opname_number
journal_number
```

Sebelumnya sudah ada mitigasi runtime di `src/services/http.ts` yang membuat alias `number` dari field-field tersebut. Namun itu masih workaround global, bukan kontrak DTO canonical.

---

## 2. Kenapa Ini Jadi Gap Terpisah

Gap ini tidak sama dengan:

- GAP-01: permission/path/method.
- GAP-07: Master Data DTO.
- GAP-06: Reports endpoint gaps.

GAP-08 khusus membahas pola transaction document number di workspace list, form breadcrumb, source document reference, dan search result.

---

## 3. Gejala User

- Nomor dokumen kosong di list, contoh Quotation.
- Nomor muncul di Jurnal Umum karena Journal memakai `journal_number` langsung, bukan `number`.
- Modul lain bisa tampak tidak konsisten: sebagian list menampilkan nomor, sebagian tidak.
- Link/detail row bisa tetap bekerja karena `id` ada, tetapi identitas dokumen tidak terbaca.

---

## 4. Area yang Terkena

### Sales

| UI type umum | Backend field kemungkinan |
|---|---|
| Quotation | `quotation_number` |
| Sales Order | `order_number` |
| Delivery Order | `delivery_number` |
| Proforma | `proforma_number` |
| Sales Invoice | `invoice_number` |
| Sales Receipt | `receipt_number` |
| Sales Return | `return_number` |
| Customer Deposit | `deposit_number` |

### Purchase

| UI type umum | Backend field kemungkinan |
|---|---|
| Purchase Request | `request_number` |
| Purchase Order | `order_number` |
| Goods Receipt | `receipt_number` atau `goods_receipt_number` |
| Vendor Bill | `bill_number` |
| Vendor Payment | `payment_number` |
| Purchase Return | `return_number` |
| Vendor Deposit | `deposit_number` |

### Cash & Bank

| UI type umum | Backend field kemungkinan |
|---|---|
| Cash Receipt | `receipt_number` |
| Cash Payment | `payment_number` |
| Bank Transfer | `transfer_number` |
| Bank Reconciliation | `reconciliation_number` |

### Inventory

| UI type umum | Backend field kemungkinan |
|---|---|
| Stock Adjustment | `adjustment_number` |
| Stock Movement | `movement_number` |
| Stock Opname | `opname_number` |

### Accounting

| UI type umum | Backend field |
|---|---|
| Journal Entry | `journal_number` |

---

## 5. Status Mitigasi Saat Ini

`src/services/http.ts` sudah punya alias global:

```ts
DOCUMENT_NUMBER_FIELDS = [
  'journal_number',
  'quotation_number',
  'order_number',
  ...
]
```

Mitigasi ini membuat `number` muncul jika field spesifik ada.

Risiko mitigasi:

- Menyembunyikan DTO mismatch per module.
- Semua response, termasuk nested object, ikut dinormalisasi.
- TypeScript tetap menyatakan `number`, padahal backend contract asli berbeda.
- Jika dua field number ada sekaligus, urutan alias bisa memilih field yang bukan primary number untuk konteks tertentu.

---

## 6. Opsi Strategi Fix

### Opsi A — Canonical UI DTO tetap `number`, tapi adapter per service

Setiap service list mengubah backend response menjadi UI DTO:

```ts
number: row.quotation_number
```

Kelebihan:

- List pages tetap konsisten.
- DataTable bisa reusable dengan field `number`.
- Alias global di `http.ts` bisa dikurangi nanti.

Kekurangan:

- Perlu adapter di banyak service.

### Opsi B — Frontend mengikuti field backend langsung

List pages membaca field spesifik:

```ts
original.quotation_number
original.order_number
original.bill_number
```

Kelebihan:

- Tidak ada transform.
- Kontrak backend terlihat jelas.

Kekurangan:

- Banyak page repetitive.
- Reusable list pattern kurang konsisten.

Rekomendasi:

- Gunakan Opsi A untuk workspace list, dengan adapter per service/module.
- Simpan type backend dan UI type terpisah jika resource kompleks.
- Jangan menambah mapping baru di `http.ts` kecuali sebagai safety guard sementara.

---

## 7. File Area yang Akan Terkena

```text
src/services/http.ts
src/modules/sales/types/*.types.ts
src/modules/sales/services/*Api.ts
src/modules/sales/pages/*ListPage.tsx
src/modules/purchase/types/*.types.ts
src/modules/purchase/services/*Api.ts
src/modules/purchase/pages/*ListPage.tsx
src/modules/cash-bank/types/*.types.ts
src/modules/cash-bank/services/cashBankApi.ts
src/modules/cash-bank/pages/*ListPage.tsx
src/modules/inventory/types/*.types.ts
src/modules/inventory/services/*Api.ts
src/modules/inventory/pages/*ListPage.tsx
src/modules/accounting/types/journalEntry.types.ts
src/modules/accounting/pages/JournalListPage.tsx
```

Backend reference read-only:

```text
/workspace/laravel_backend/app/Modules/Sales/Routes/api.php
/workspace/laravel_backend/app/Modules/Purchase/Routes/api.php
/workspace/laravel_backend/app/Modules/CashBank/Routes/api.php
/workspace/laravel_backend/app/Modules/Inventory/Routes/api.php
/workspace/laravel_backend/app/Modules/Journal/Routes/api.php
```

---

## 8. Acceptance Criteria

- Semua workspace list menampilkan nomor dokumen utama.
- TypeScript type tidak bohong terhadap shape yang dipakai page.
- `http.ts` tidak menjadi tempat utama business DTO mapping.
- Jika alias global tetap dipertahankan, statusnya documented sebagai fallback sementara.
- Build sukses.

---

## 9. Dokumen Lanjutan

Detail issue yang sudah tersedia:

```text
issue_docs/issue-07-route-ribbon-canonical-map.md
issue_docs/issue-10-journal-list-totals-and-account-labels.md
```

Spec implementasi sudah tersedia:

```text
praproduction_docs/spec-33-transaction-dto-number-contract.md
```

Prompt implementasi sudah tersedia:

```text
prompt/prompt-phase-15-transaction-dto-number-contract.md
```

Catatan: issue route/ribbon tetap dipisah karena nomor dokumen kosong bisa terjadi walaupun route sudah benar.
