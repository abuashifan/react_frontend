# Phase 3 — Sales Module

**Label:** `sales`
**Status:** ⏳ Belum dimulai (tunggu Phase 2 selesai)
**Verifikasi:** Full sales flow berfungsi — Quotation → SO → DO → Invoice → Receipt.
**Commit:** `feat(sales): complete phase 3 — full sales workflow`

---

## Sub-phase 3A — Sales Quotation & Order

### ISSUE-3A-01 — Sales Quotation List Page
- Kolom: nomor, tanggal, customer, total, status, expired date
- Filter sidebar: status, customer, tanggal, sales
- File: `src/modules/sales/pages/QuotationListPage.tsx`

### ISSUE-3A-02 — Sales Quotation Form Page
- Header: customer (SearchableSelect), tanggal, expired date, catatan
- Line items: produk, qty, harga, diskon, subtotal
- Actions: Simpan Draft, Submit → Approved, Void, Convert ke SO
- File: `src/modules/sales/pages/QuotationFormPage.tsx`

### ISSUE-3A-03 — Sales Order List Page
- Kolom: nomor SO, nomor quotation, tanggal, customer, total, status
- Filter sidebar: status, customer, tanggal
- File: `src/modules/sales/pages/SalesOrderListPage.tsx`

### ISSUE-3A-04 — Sales Order Form Page
- Create baru atau dari Quotation (pre-fill dari SO)
- Header: customer, tanggal, payment term, delivery address
- Line items: produk, qty, harga, diskon, subtotal
- Tracking: delivered qty, invoiced qty per baris
- Actions: Confirm, Ship, Void
- File: `src/modules/sales/pages/SalesOrderFormPage.tsx`

### ISSUE-3A-05 — Source Document Picker component
- Dialog picker untuk pilih SO/DO/Proforma sebagai sumber dokumen
- Searchable list + checkbox selection
- Preview line items yang akan di-carry over
- File: `src/modules/sales/components/SourceDocumentPicker.tsx`

---

## Sub-phase 3B — Delivery Order & Proforma

### ISSUE-3B-01 — Delivery Order List Page
- Kolom: nomor DO, nomor SO, tanggal, customer, status
- Filter sidebar: status, customer, tanggal, gudang
- File: `src/modules/sales/pages/DeliveryOrderListPage.tsx`

### ISSUE-3B-02 — Delivery Order Form Page
- Create dari SO — pre-fill produk & qty remaining
- Pilih gudang pengiriman
- Deliver confirmation dialog (konfirmasi pengiriman fisik)
- Actions: Confirm, Deliver, Void
- File: `src/modules/sales/pages/DeliveryOrderFormPage.tsx`

### ISSUE-3B-03 — Proforma Invoice List Page
- Kolom: nomor, tanggal, customer, total, status
- File: `src/modules/sales/pages/ProformaListPage.tsx`

### ISSUE-3B-04 — Proforma Invoice Form Page
- Create dari SO atau manual
- Actions: Approve, Void, Convert ke Invoice
- File: `src/modules/sales/pages/ProformaFormPage.tsx`

---

## Sub-phase 3C — Sales Invoice

### ISSUE-3C-01 — Sales Invoice List Page
- Kolom: nomor, tanggal, customer, grand total, paid, balance due, status
- Filter sidebar: status, customer, tanggal, jatuh tempo
- Highlight overdue jika balance due > 0 dan jatuh tempo terlewat
- File: `src/modules/sales/pages/SalesInvoiceListPage.tsx`

### ISSUE-3C-02 — Sales Invoice Form Page
- Create dari SO / DO / Proforma / manual
- Header: customer, tanggal invoice, due date, payment term
- Line items: produk, qty, harga, diskon, pajak, subtotal
- Summary: subtotal, diskon, pajak, grand total, paid, balance due
- Actions: Simpan Draft, Post, Void
- File: `src/modules/sales/pages/SalesInvoiceFormPage.tsx`

### ISSUE-3C-03 — Amount tracking (grand total, paid, balance due)
- Kalkulasi real-time di form
- Update saat receipt/deposit dialokasikan
- Tampil di list page (kolom paid + balance due)

### ISSUE-3C-04 — Document workflow rules sales invoice
- Edit hanya jika status draft
- Posted tidak bisa diedit langsung — harus void dulu
- Void cascade: receipt terkait otomatis ter-affect
- Banner locked jika ada receipt posted terkait

---

## Sub-phase 3D — Receipt, Deposit & Return

### ISSUE-3D-01 — Customer Deposit List Page
- Kolom: nomor, tanggal, customer, jumlah, sisa, status
- File: `src/modules/sales/pages/CustomerDepositListPage.tsx`

### ISSUE-3D-02 — Customer Deposit Form Page
- Fields: customer, tanggal, akun bank/kas, jumlah
- Alokasi deposit ke invoice: dialog picker invoice terbuka
- Actions: Post, Void
- File: `src/modules/sales/pages/CustomerDepositFormPage.tsx`

### ISSUE-3D-03 — Sales Receipt List Page
- Kolom: nomor, tanggal, customer, jumlah, invoice terkait, status
- File: `src/modules/sales/pages/SalesReceiptListPage.tsx`

### ISSUE-3D-04 — Sales Receipt Form Page
- Pilih invoice → auto-fill jumlah balance due
- Bisa partial payment
- Pilih akun kas/bank penerima
- Actions: Post, Void
- File: `src/modules/sales/pages/SalesReceiptFormPage.tsx`

### ISSUE-3D-05 — Sales Return List Page
- Kolom: nomor, tanggal, customer, total, sumber (invoice/DO), status
- File: `src/modules/sales/pages/SalesReturnListPage.tsx`

### ISSUE-3D-06 — Sales Return Form Page
- Create dari invoice atau dari DO
- Pre-fill line items dari dokumen sumber
- Actions: Approve, Post, Void
- File: `src/modules/sales/pages/SalesReturnFormPage.tsx`

---

## Sub-phase 3E — AR Summary

### ISSUE-3E-01 — AR Customer Summary Page
- Tabel per customer: total piutang, overdue, saldo deposit
- Filter: customer, tanggal per
- File: `src/modules/sales/pages/ArSummaryPage.tsx`

### ISSUE-3E-02 — AR Aging Page
- Tabel aging per customer: current, 1-30, 31-60, 61-90, >90
- File: `src/modules/sales/pages/ArAgingPage.tsx`

### ISSUE-3E-03 — AR Reconciliation Page
- Rekonsiliasi antara saldo AR di buku besar vs saldo per invoice
- File: `src/modules/sales/pages/ArReconciliationPage.tsx`

### ISSUE-3E-04 — Customer Ledger Page
- History transaksi per customer: invoice, receipt, return, deposit
- File: `src/modules/sales/pages/CustomerLedgerPage.tsx`

### ISSUE-3E-05 — Invoice Ledger Page
- History per invoice: posting, payment, void, return
- File: `src/modules/sales/pages/InvoiceLedgerPage.tsx`
