# Sales Workflow Audit

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Ringkasan Alur

Alur Sales terdiri dari:

`Sales Quotation -> Sales Order -> Delivery Order -> Sales Invoice -> Sales Receipt`

Cabang lain:

- `Sales Order -> Proforma Invoice -> Sales Invoice`
- `Sales Order -> Customer Deposit -> Customer Deposit Allocation -> Sales Invoice`
- `Sales Invoice` atau `Delivery Order -> Sales Return`

Stock keluar dibuat oleh Delivery Order saat deliver, atau oleh direct Sales Invoice jika invoice tidak berasal dari Delivery Order. Journal utama dibuat oleh Sales Invoice, Customer Deposit, Customer Deposit Allocation, Sales Receipt, dan Sales Return.

Confidence: High. File: `app/Services/Sales/*`, `app/Services/Inventory/InventorySalesIntegrationService.php`.

## Sales Quotation

Model/tabel: `SalesQuotation`, `SalesQuotationLine`, `sales_quotations`, `sales_quotation_lines`.

Service: `SalesQuotationService`.

Status yang terlihat: `draft`, `sent`, `approved`, `accepted`, `rejected`, `cancelled`, `converted`/flags conversion dari pola service.

Rules:

- Customer divalidasi melalui helper sales concern dan `BusinessReferenceValidator`.
- Line dihitung oleh `SalesCalculationService`.
- Convert ke Sales Order diblokir bila quotation cancelled/rejected/expired/converted.
- Tidak membuat journal dan tidak membuat stock movement.

Gap:

- Tidak semua source/downstream guard punya DB constraint; double conversion dijaga service, bukan database.

Confidence: High untuk behavior service; Medium untuk seluruh status karena tidak semua file penuh dibaca ulang.

## Sales Order

Model/tabel: `SalesOrder`, `SalesOrderLine`.

Service: `SalesOrderService`.

Status utama: `draft`, `approved`, `confirmed`, `cancelled`, `closed`, dan status progress delivery/invoice dari field tracking.

Rules:

- Customer valid.
- Update hanya saat draft.
- Create from quotation memakai guard convertible.
- `delivered_quantity`, `invoiced_quantity`, `returned_quantity` pada line menjadi source quantity tracking.
- Bisa membuat customer deposit bila flow down payment dipakai.

Downstream:

- Delivery Order dari SO.
- Sales Invoice dari SO.
- Proforma dari SO.
- Customer Deposit linked ke SO.

Journal/stock:

- Sales Order tidak langsung membuat journal/stock.

Gap:

- Close/cancel guard terhadap downstream perlu dipertahankan ketat karena DB FK tidak memaksa lifecycle.

Confidence: High.

## Delivery Order

Model/tabel: `DeliveryOrder`, `DeliveryOrderLine`.

Service: `DeliveryOrderService`.

Status: `draft`, `ready`, `shipped`, `delivered`, `partially_invoiced`, `void`, `cancelled` (berdasarkan route/service).

Rules:

- Create from Sales Order menggunakan remaining quantity dari order line.
- Deliver memvalidasi tanggal transaksi via `TransactionDateGuardService`.
- Saat deliver, service update `SalesOrderLine.delivered_quantity`.
- Untuk stock item, inventory integration membuat `sales_out`.
- Void diblokir jika ada invoice non-void terkait.
- Void melakukan cascade void stock movement dan restore delivered quantity.

Stock impact:

- `InventorySalesIntegrationService::createSalesOutFromDeliveryOrder` membuat `stock_movements` type `sales_out` dengan `source_type=delivery_order`.
- Service mengecek existing source movement untuk mencegah double stock movement.

Gap:

- Guard over-delivery kuat di service, tetapi tidak ada constraint DB untuk mencegah update manual ke tracking quantity.
- Source duplicate guard berada di `stock_movements`, bukan unique index DB.

Confidence: High.

## Proforma Invoice

Model/tabel: `ProformaInvoice`, `ProformaInvoiceLine`.

Service: `ProformaInvoiceService`.

Status: `draft`, `issued`, `accepted`, `cancelled`, `converted`.

Rules:

- Bisa dibuat dari Sales Order.
- Tidak membuat stock movement.
- Tidak tampak membuat journal utama.
- Convert ke Sales Invoice diblokir jika proforma `converted` atau `cancelled`.

Gap:

- Proforma expiry/revision rule tidak terlihat kuat di route/service yang dibaca. Jika bisnis membutuhkan expiry, perlu validasi eksplisit.

Confidence: Medium.

## Sales Invoice

Model/tabel: `SalesInvoice`, `SalesInvoiceLine`.

Service: `SalesInvoiceService`.

Status: `draft`, `approved`, `posted`, `partially_paid`, `paid`, `void`.

Rules:

- Customer valid, payment term valid.
- Update hanya saat draft.
- Post hanya dari draft/approved.
- Period/date guard wajib sebelum post.
- Source remaining quantity divalidasi untuk SO/DO.
- Jika invoice tidak berasal dari Delivery Order, stock warehouses divalidasi untuk line stock.
- AR account: `SalesAccountResolverService` memakai invoice AR account atau fallback mapping `sales.accounts_receivable`.
- Revenue account: snapshot line/product/fallback `sales.revenue`.
- Tax output mapping wajib saat `tax_total > 0`.
- Post membuat journal AR/revenue/tax.
- Direct invoice untuk stock item membuat stock movement `sales_out`; invoice dari Delivery Order tidak membuat stock movement ulang.
- Applied customer deposit dapat membentuk allocation journal dan update deposit.
- Void diblokir jika ada receipt/return posted, lalu cascade void journal/stock movement/allocation dan restore source progress.

Balance:

- `paid_amount` diisi dari applied down payment saat post.
- `balance_due = grand_total - paid_amount`.
- Receipt/return kemudian mengubah `paid_amount`, `returned_amount`, `balance_due`.

Gap:

- Banyak journal system dibuat langsung dengan `JournalEntry::query()->create()` dan `lines()->createMany()`, tidak selalu lewat `JournalValidationService`; jika ada bug line builder, balance hanya diuji secara tidak langsung.
- Return mengurangi `balance_due`, tetapi status invoice tidak selalu direkalkulasi lengkap untuk semua kombinasi return/payment.

Confidence: High untuk journal/stock/linkage; Medium untuk semua kombinasi status invoice.

## Customer Deposit dan Allocation

Model/tabel: `CustomerDeposit`, `CustomerDepositAllocation`.

Service: `CustomerDepositService`.

Status: `draft`, `posted`, `partially_allocated`, `fully_allocated`, `refunded`, `void`.

Rules:

- Customer valid.
- Cash/bank account harus asset dan `isCashBank`.
- Amount > 0 dari request/service.
- Post membuat journal cash/bank debit vs `sales.customer_deposit` credit.
- Allocation ke invoice memvalidasi customer sama, invoice tidak void/cancelled, amount tidak melebihi remaining deposit/balance invoice.
- Refund tidak boleh melebihi remaining amount.
- Void/void allocation memakai period guard dan void generated journal.

Gap:

- Allocation journal `source_id` tampak memakai invoice id saat source_type `customer_deposit_allocation`; reconciliation perlu memastikan mapping source id ke allocation benar. Lihat `CustomerDepositService::journal`.

Confidence: Medium untuk detail source_id allocation karena output service terpotong, High untuk rules umum.

## Sales Receipt

Model/tabel: `SalesReceipt`, `SalesReceiptLine`.

Service: `SalesReceiptService`.

Rules:

- Customer valid.
- Cash/bank account valid.
- Multi-line receipt didukung.
- Total line amount harus sama dengan header amount.
- Semua invoice harus customer yang sama.
- Invoice harus posted/partially paid dan amount tidak melebihi balance due.
- Post membuat journal cash debit vs AR credit grouped.
- Void restore paid/balance dan void journal.

Gap:

- Direct header `sales_invoice_id` dan multi-line mode harus tetap sinkron; jika API mengirim kombinasi tidak biasa, perlu test.

Confidence: High.

## Sales Return

Model/tabel: `SalesReturn`, `SalesReturnLine`.

Service: `SalesReturnService`.

Rules:

- Customer valid.
- Return dari invoice memakai `SalesInvoiceLine.returned_quantity`.
- Quantity return tidak boleh melebihi quantity invoice dikurangi returned.
- Post membuat journal sales return/tax/AR dan stock movement `sales_return_in`.
- Void restore invoice returned quantity/balance dan void stock movement/journal.

Gap:

- `validateReturnedQuantities` sangat kuat untuk invoice line, tetapi return dari delivery order tanpa invoice bergantung pada path line delivery; audit melihat logic invoice lebih jelas daripada delivery-only quantity restore.
- Mapping `sales.return` optional di config tetapi service `mapping('sales.return')` mewajibkan mapping saat return journal dibuat. Ini perlu diselaraskan.

Confidence: High untuk invoice return; Medium untuk delivery-only return.

## Gap Sales Utama

1. System journal creation tersebar langsung di service, tidak semua melewati validator balanced journal. Severity: High.
2. DB FK untuk operational source/reference terbatas. Severity: High.
3. Mapping optional di config bisa required di runtime (`sales.return`). Severity: Medium.
4. Source duplicate prevention untuk stock movement belum DB-level unique. Severity: Medium.
5. Kombinasi status invoice setelah receipt+return perlu test regresi. Severity: Medium.

