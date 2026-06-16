# Business Rules and Validation Map

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Master Data Validation

Reusable validator: `app/Services/Validation/BusinessReferenceValidator.php`.

Rules yang ditemukan:

- Customer harus contact active dan `is_customer`.
- Vendor harus contact active dan `is_supplier`.
- Product harus active; stock movement line mewajibkan stock item.
- Unit harus active; precision dicek.
- Warehouse harus active; wajib untuk stock item yang bergerak.
- Account harus active, type sesuai, dan tidak parent/non-postable melalui account resolver yang mengecek children.
- Payment term active jika diisi.
- Department active jika diisi.
- Project active dan status usable jika diisi.
- Account mapping harus active dan punya account id.

Tenant isolation terjadi terutama karena semua query master/transaksi berjalan di tenant connection aktif.

Confidence: High.

## Status Transition

Pattern umum:

- Draft bisa diedit.
- Posted/received/delivered tidak diedit langsung; koreksi lewat void/reversal.
- Void/cancelled tidak bisa diposting lagi.
- Actions memakai method khusus: approve, confirm, ready, ship, deliver, receive, post, void, cancel, close.

Config status:

- Sales: `draft`, `approved`, `confirmed`, `issued`, `shipped`, `delivered`, `posted`, `cancelled`, `void`, `obsolete`.
- Purchase: `draft`, `submitted`, `approved`, `rejected`, `confirmed`, `received`, `posted`, `paid`, `cancelled`, `void`, `obsolete`.
- Transaction lifecycle: `draft`, `approved`, `posted`, `void`.
- Inventory movement: `draft`, `posted`, `void`.

Confidence: High.

## Posting Validation

Service posting umumnya memanggil date guard:

- Sales Invoice/Receipt/Deposit/Return.
- Delivery Order deliver.
- Vendor Bill/Payment/Deposit/Return.
- Goods Receipt receive.
- Stock Movement post/void.
- Stock Adjustment post/void.
- Stock Opname finalize/void.
- Cash Bank post/void.
- Manual Journal via transaction policy service.

`TransactionDateGuardService` memblokir fiscal year closed, locked_until, annual closing gate, optional out-of-active FY, backdated/future rules.

Confidence: High.

## Over-Delivery / Over-Receipt

Sales:

- Delivery Order from SO memakai remaining quantity dari `SalesOrderLine.quantity - delivered_quantity + returned_quantity`.
- Deliver update `delivered_quantity`.

Purchase:

- Goods Receipt from PO memakai remaining quantity dari `PurchaseOrderLine.quantity - received_quantity + returned_quantity`.
- Receive update `received_quantity`.

Confidence: High berdasarkan service logic dan tracking fields.

## Over-Invoice / Over-Billing

Sales:

- Invoice from SO/DO memakai `validateSourceRemainingQuantities`.
- Delivery order line memiliki `invoiced_quantity`.

Purchase:

- Vendor Bill from PO/GR memakai `validateSourceRemainingQuantities`.
- Goods receipt line memiliki `billed_quantity`.

Confidence: High.

## Overpayment

Sales Receipt:

- Multi-line amount harus sama header amount.
- Semua invoice customer sama.
- Amount tidak boleh melebihi invoice balance due.

Vendor Payment:

- Multi-line amount harus sama header.
- Semua bill vendor sama.
- Amount tidak boleh melebihi bill balance due.

Confidence: High.

## Deposit Allocation

Customer Deposit:

- Allocation tidak boleh melebihi remaining deposit.
- Invoice customer harus sama.
- Invoice tidak void/cancelled.
- Allocation mengurangi deposit remaining dan invoice balance.

Vendor Deposit:

- Allocation tidak boleh melebihi remaining deposit.
- Bill vendor harus sama.
- Bill tidak void/cancelled.
- Allocation mengurangi deposit remaining dan bill balance.

Confidence: High.

## Return Rules

Sales Return:

- Invoice return quantity tidak boleh melebihi invoice line quantity minus returned.
- Post update returned quantity dan balance.
- Stock item return membuat `sales_return_in`.

Purchase Return:

- Bill return quantity tidak boleh melebihi bill line quantity minus returned.
- GR return quantity tidak boleh melebihi GR line quantity minus returned.
- Stock item return membuat `purchase_return_out`.

Confidence: High untuk invoice/bill/GR; Medium untuk delivery-only sales return.

## Negative Stock

`config/inventory.php` menetapkan `allow_negative_stock=false`. `StockBalanceService::assertSufficientStock` memblokir movement out bila `quantity_available < qty`.

Confidence: High.

## Account Mapping Validation

Mapping yang required di config:

- `sales.accounts_receivable`
- `sales.revenue`
- `sales.customer_deposit`
- `purchase.accounts_payable`
- `purchase.expense`
- `purchase.vendor_deposit`
- `inventory.asset`
- `inventory.cogs`
- `opening_balance.equity`
- `closing.retained_earnings`
- `closing.current_year_earnings`
- `cash_bank.default_cash`
- `cash_bank.default_bank`

Mapping optional di config tetapi required pada flow tertentu:

- `sales.tax_output` saat taxable.
- `purchase.tax_input` saat taxable.
- `purchase.inventory_interim` untuk Goods Receipt/GRNI.
- `inventory.adjustment_gain` untuk positive adjustment/opname.
- `inventory.adjustment_loss` untuk negative adjustment/opname.
- `sales.return` saat Sales Return.
- `purchase.return` saat Purchase Return.

Confidence: High.

## Missing / Weak Validation

- Tidak semua system-generated journal melewati `JournalValidationService`.
- Tidak ada DB-level FK untuk banyak foreign-like operational reference.
- Tidak ada DB-level unique active source untuk stock movement source.
- `transfer_in/out` ada di config tetapi tidak allowed di service.
- Mixed adjustment/opname source duplicate issue.
- Monthly accounting period `status=closed` belum menjadi blocker.

Confidence: High untuk semua kecuali efek runtime mixed adjustment/opname yang perlu test.

