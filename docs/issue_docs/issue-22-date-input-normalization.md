# Issue-22 — Date Input Normalization

**Tipe**: Form data normalization  
**Severity**: High  
**Sumber**: Audit-12 A12-11  
**Status**: ✅ Done (Phase 22, 2026-06-16)

> Resolusi: `toDateInputValue()` ditambahkan di `src/lib/utils.ts` (normalisasi
> apa pun → `YYYY-MM-DD`, `''` untuk invalid). Diterapkan ke reset/default edit
> tanggal di form: Journal, StockMovement, StockAdjustment, FixedAsset,
> VendorBill, PurchaseOrder, CashReceipt, CashPayment, BankTransfer,
> BankReconciliation, Quotation, SalesInvoice. Default create tetap memakai
> `new Date().toISOString().slice(0,10)`. `formatDate()` tetap display-only.

---

## Ringkasan

Banyak form melakukan `reset()` dengan tanggal backend mentah. HTML `input type="date"` membutuhkan `YYYY-MM-DD`; jika backend mengirim datetime/ISO timezone/display format, input bisa kosong atau salah.

---

## File Terkena

```text
src/lib/utils.ts
src/modules/accounting/pages/JournalFormPage.tsx
src/modules/cash-bank/pages/*FormPage.tsx
src/modules/sales/pages/*FormPage.tsx
src/modules/purchase/pages/*FormPage.tsx
src/modules/inventory/pages/*FormPage.tsx
```

---

## Prinsip Fix

- Tambahkan helper shared:

```text
toDateInputValue(value): string
```

- `formatDate()` hanya untuk display, bukan value input.
- Default create form tetap boleh memakai tanggal hari ini dalam `YYYY-MM-DD`.
- Reset edit/detail wajib melalui helper.

---

## Acceptance Criteria

- Semua date input edit menampilkan tanggal valid.
- Tidak ada `Invalid Date` atau localized display date masuk ke value input.
- Build pass.
