# Issue-25 — Document Edit/View Mode Policy

**Tipe**: Document workflow UX policy  
**Severity**: Medium  
**Sumber**: Audit-12 A12-10  
**Status**: ✅ Done (Phase 22, 2026-06-16)

> Resolusi: helper `documentReadOnlyReason(status)` +
> `src/components/shared/document/documentEditPolicy.ts`; `FormLayout` menerima
> prop `readOnly`/`readOnlyReason` dan merender banner alasan read-only.
> Diwire ke form transaksi tiap modul (Journal, StockMovement, StockAdjustment,
> FixedAsset, PurchaseOrder, VendorBill, SalesInvoice, Quotation, CashReceipt,
> CashPayment, BankTransfer, BankReconciliation) via `readOnly={!isEditable}`.
> Policy didokumentasikan di `spec-10-document-workflow.md`. Tombol aksi tetap
> permission-guarded lewat `DocumentActionBar`. Form transaksi lain mengadopsi
> pola satu baris `readOnly={!isEditable}` yang sama.

---

## Ringkasan

User berharap data dari list langsung masuk edit mode. Saat ini banyak form memakai `isEditable = isCreate || status === 'draft'`, sehingga dokumen posted/locked tampil read-only tanpa policy visual yang konsisten.

---

## Prinsip UX

- Create form selalu edit mode.
- Draft/editable status langsung edit mode jika user punya permission update.
- Posted/approved/void/system-generated read-only jika backend tidak mengizinkan edit.
- Read-only harus menampilkan alasan yang jelas.
- Jika backend mengizinkan reopen/edit, tombol aksi harus eksplisit dan permission guarded.

---

## File Terkena

```text
src/components/shared/document/DocumentActionBar.tsx
src/components/shared/document/DocumentLockedBanner.tsx
src/modules/**/pages/*FormPage.tsx
docs/praproduction_docs/spec-10-document-workflow.md
```

---

## Acceptance Criteria

- Mode edit/read-only konsisten antar modul.
- User dapat melihat alasan dokumen tidak bisa diedit.
- Tidak ada action button tanpa permission guard.
- Build pass.
