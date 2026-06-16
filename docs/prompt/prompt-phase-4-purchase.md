# Phase 4 — Purchase Module

**Label:** `purchase`
**Status:** ⏳ Belum dimulai (bisa paralel dengan Phase 3 & 5 setelah Phase 2 selesai)
**Verifikasi:** Full purchase flow berfungsi — PR → PO → GR → Bill → Payment.
**Commit:** `feat(purchase): complete phase 4 — full purchase workflow`

---

## Sub-phase 4A — Purchase Request & Order

### ISSUE-4A-01 — Purchase Request List Page
- Kolom: nomor PR, tanggal, departemen, total estimasi, status
- Filter sidebar: status, departemen, tanggal, requester
- File: `src/modules/purchase/pages/PurchaseRequestListPage.tsx`

### ISSUE-4A-02 — Purchase Request Form Page
- Header: tanggal kebutuhan, departemen, catatan/alasan
- Line items: produk, qty, satuan, estimasi harga
- Actions: Submit, Approve, Reject, Void
- File: `src/modules/purchase/pages/PurchaseRequestFormPage.tsx`

### ISSUE-4A-03 — Purchase Order List Page
- Kolom: nomor PO, nomor PR, tanggal, vendor, total, status
- Filter sidebar: status, vendor, tanggal
- File: `src/modules/purchase/pages/PurchaseOrderListPage.tsx`

### ISSUE-4A-04 — Purchase Order Form Page
- Create baru atau dari PR (pre-fill line items)
- Header: vendor (SearchableSelect), tanggal PO, expected delivery date, payment term
- Line items: produk, qty, harga, diskon, subtotal
- Tracking: received qty, billed qty per baris
- Actions: Confirm, Void
- File: `src/modules/purchase/pages/PurchaseOrderFormPage.tsx`

---

## Sub-phase 4B — Goods Receipt & Vendor Bill

### ISSUE-4B-01 — Goods Receipt List Page
- Kolom: nomor GR, nomor PO, tanggal, vendor, gudang, status
- Filter sidebar: status, vendor, tanggal, gudang
- File: `src/modules/purchase/pages/GoodsReceiptListPage.tsx`

### ISSUE-4B-02 — Goods Receipt Form Page
- Create dari PO — pre-fill produk & qty remaining
- Pilih gudang tujuan penerimaan
- Receive confirmation dialog (konfirmasi barang sudah diterima fisik)
- Actions: Receive, Void
- File: `src/modules/purchase/pages/GoodsReceiptFormPage.tsx`

### ISSUE-4B-03 — Vendor Bill List Page
- Kolom: nomor bill, nomor PO/GR, tanggal, vendor, total, paid, balance, status
- Filter sidebar: status, vendor, tanggal, jatuh tempo
- Highlight overdue
- File: `src/modules/purchase/pages/VendorBillListPage.tsx`

### ISSUE-4B-04 — Vendor Bill Form Page
- Create dari PO / GR / manual
- Header: vendor, tanggal bill, due date, payment term
- Line items: produk, qty, harga, diskon, pajak, subtotal
- Summary: subtotal, diskon, pajak, grand total, paid, balance
- Actions: Simpan Draft, Post, Void
- File: `src/modules/purchase/pages/VendorBillFormPage.tsx`

---

## Sub-phase 4C — Payment, Deposit & Return

### ISSUE-4C-01 — Vendor Deposit List Page
- Kolom: nomor, tanggal, vendor, jumlah, sisa, status
- File: `src/modules/purchase/pages/VendorDepositListPage.tsx`

### ISSUE-4C-02 — Vendor Deposit Form Page
- Fields: vendor, tanggal, akun bank/kas, jumlah
- Alokasi deposit ke bill: dialog picker bill terbuka
- Actions: Post, Void
- File: `src/modules/purchase/pages/VendorDepositFormPage.tsx`

### ISSUE-4C-03 — Vendor Payment List Page
- Kolom: nomor, tanggal, vendor, jumlah, bill terkait, status
- File: `src/modules/purchase/pages/VendorPaymentListPage.tsx`

### ISSUE-4C-04 — Vendor Payment Form Page
- Pilih bill → auto-fill jumlah balance
- Bisa partial payment
- Pilih akun kas/bank sumber
- Actions: Post, Void
- File: `src/modules/purchase/pages/VendorPaymentFormPage.tsx`

### ISSUE-4C-05 — Purchase Return List Page
- Kolom: nomor, tanggal, vendor, total, sumber (bill/GR), status
- File: `src/modules/purchase/pages/PurchaseReturnListPage.tsx`

### ISSUE-4C-06 — Purchase Return Form Page
- Create dari bill atau dari GR
- Pre-fill line items dari dokumen sumber
- Actions: Approve, Post, Void
- File: `src/modules/purchase/pages/PurchaseReturnFormPage.tsx`

---

## Sub-phase 4D — AP Summary

### ISSUE-4D-01 — AP Vendor Summary Page
- Tabel per vendor: total hutang, overdue, saldo deposit
- File: `src/modules/purchase/pages/ApSummaryPage.tsx`

### ISSUE-4D-02 — AP Aging Page
- Tabel aging per vendor: current, 1-30, 31-60, 61-90, >90
- File: `src/modules/purchase/pages/ApAgingPage.tsx`

### ISSUE-4D-03 — AP Reconciliation Page
- Rekonsiliasi saldo AP buku besar vs saldo per bill
- File: `src/modules/purchase/pages/ApReconciliationPage.tsx`

### ISSUE-4D-04 — Vendor Ledger Page
- History transaksi per vendor: bill, payment, return, deposit
- File: `src/modules/purchase/pages/VendorLedgerPage.tsx`

### ISSUE-4D-05 — Bill Ledger Page
- History per bill: posting, payment, void, return
- File: `src/modules/purchase/pages/BillLedgerPage.tsx`
