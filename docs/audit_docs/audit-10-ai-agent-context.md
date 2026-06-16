# AI Agent Context

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Prinsip Kerja untuk Agent Berikutnya

Jangan mengubah average costing, struktur journal besar, atau flow posting besar tanpa alasan kuat. Backend sudah memakai service layer yang cukup kaya; perbaikan paling aman adalah memperkuat validasi, test, dan helper terpusat tanpa mengganti alur bisnis.

Audit ini hanya dokumentasi. Kode backend saat audit berada dalam working tree yang sudah dirty dari pekerjaan sebelumnya; jangan asumsikan semua file sudah committed.

## Source of Truth

Sales operational docs:

- Header/line tables Sales adalah source operational.
- Quantity tracking di `sales_order_lines`, `delivery_order_lines`, `sales_invoice_lines`.
- Posting accounting ada di `SalesInvoiceService`, `SalesReceiptService`, `CustomerDepositService`, `SalesReturnService`.
- Stock issue/return via `InventorySalesIntegrationService`.

Purchase operational docs:

- Header/line Purchase adalah source operational.
- Quantity tracking di `purchase_order_lines`, `goods_receipt_lines`, `vendor_bill_lines`.
- Posting accounting di `VendorBillService`, `VendorPaymentService`, `VendorDepositService`, `PurchaseReturnService`.
- Stock receipt/return via `InventoryPurchaseIntegrationService`.

Stock movement:

- `StockMovementService` adalah source of truth update stock balance.
- `StockBalanceService` satu-satunya tempat apply movement ke balance.
- `AverageCostService` source of truth moving average.
- `StockMovementJournalService` source of truth journal inventory.

Journal entries:

- `journal_entries` dan `journal_entry_lines` adalah source GL.
- Reports hanya membaca posted dan non-obsolete journal.
- Manual journal validation ada di `JournalValidationService`.

AR/AP subledger:

- AR/AP report membaca operational docs plus payment/allocation/return.
- Reconciliation membandingkan subledger dengan GL account mappings dan account override.

Reports:

- GL/BS/PL memakai `app/Services/Reports/*` dan posted journal lines.
- Inventory report memakai stock balances/movements.

## Mapping Akun Kritis

Paling penting:

- `sales.accounts_receivable`
- `sales.revenue`
- `sales.tax_output`
- `sales.customer_deposit`
- `sales.return`
- `purchase.accounts_payable`
- `purchase.expense`
- `purchase.tax_input`
- `purchase.vendor_deposit`
- `purchase.inventory_interim`
- `purchase.return`
- `inventory.asset`
- `inventory.cogs`
- `inventory.adjustment_gain`
- `inventory.adjustment_loss`
- `opening_balance.equity`
- `closing.retained_earnings`
- `closing.current_year_earnings`

Jangan hardcode account id. Pakai account mapping resolver/validator.

## Workflow Penting

Sales:

1. Quotation tidak berdampak stock/GL.
2. Sales Order tidak berdampak stock/GL.
3. Delivery Order delivered membuat `sales_out`.
4. Sales Invoice dari DO tidak membuat stock movement ulang.
5. Direct Sales Invoice stock item membuat `sales_out`.
6. Receipt mengurangi AR.
7. Customer Deposit masuk liability, allocation mengurangi invoice balance.
8. Sales Return membuat journal return dan `sales_return_in`.

Purchase:

1. PR/PO tidak berdampak stock/GL.
2. Goods Receipt received membuat `purchase_in` dan GRNI/interim journal.
3. Vendor Bill dari GR membersihkan GRNI.
4. Direct Vendor Bill stock item membuat `purchase_in` tetapi stock movement journal null agar AP bill journal tidak double.
5. Vendor Payment mengurangi AP.
6. Vendor Deposit masuk asset, allocation mengurangi bill balance.
7. Purchase Return membuat journal return dan `purchase_return_out`.

Inventory:

1. Semua movement out harus cek stock cukup bila negative stock disabled.
2. Average cost hanya di `AverageCostService`.
3. Adjustment/opname post membuat movement, lalu journal inventory.
4. Void stock movement memakai reversal movement.

Accounting:

1. Manual journal tidak boleh memakai control accounts dari mapping.
2. Posted journal menjadi source report.
3. Void system journal dilakukan cascade dari source transaction, bukan manual journal endpoint.
4. Period lock efektif: fiscal year closed atau `locked_until`.

## Known Risks

- System journal builder tersebar dan tidak selalu memakai validator.
- Mixed stock adjustment/opname dapat bentrok dengan duplicate source guard.
- Monthly accounting period closed belum blocking.
- Banyak operational FK-like columns tidak punya DB FK.
- Config movement transfer tidak sinkron dengan validator.
- Beberapa mapping optional di config menjadi required saat runtime.
- Opening stock flow khusus tidak terlihat.

## Recommended Next Implementation Order

1. Tambahkan test untuk high-risk flow tanpa mengubah behavior: mixed adjustment/opname, stock movement void, direct vendor bill stock, invoice/receipt/return balance, period lock.
2. Perbaiki duplicate source guard agar adjustment/opname mixed bisa membuat movement in/out secara aman.
3. Tambahkan centralized system journal validation/assertion.
4. Selaraskan account mapping config conditional required.
5. Selaraskan movement type config vs service untuk transfer.
6. Tambahkan migration aman hanya setelah audit data existing.
7. Buat reconciliation/preflight health check untuk account mapping, stock vs GL, AR/AP vs GL.

## Jangan Diubah Sembarangan

- Formula moving average.
- Status lifecycle dokumen posted/void.
- Struktur journal entry/journal entry line.
- Pola tenant connection.
- Source_type/source_id yang sudah dipakai report/reconciliation tanpa migrasi data.
- Direct Vendor Bill stock behavior yang sengaja mencegah double debit inventory.

