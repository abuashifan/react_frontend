# API Route Map

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Middleware Umum

Mayoritas route bisnis memakai `auth:sanctum` dan `company.access`, lalu permission per endpoint. Route module dimuat dari `routes/api.php`.

Confidence: High. File: `routes/api.php`, `app/Modules/*/Routes/api.php`.

## Sales Routes

Prefix: `/sales`. Middleware: `auth:sanctum`, `company.access`, permission granular.

| Method | Endpoint | Controller Action | Permission |
| --- | --- | --- | --- |
| GET | `/sales/source-documents/availability` | `SourceDocumentPickerController@availability` | `sales.orders.view` |
| GET | `/sales/source-documents` | `SourceDocumentPickerController@index` | `sales.orders.view` |
| GET | `/sales/ar/customer-summary` | `AccountsReceivableController@customerSummary` | `sales.ar.view` |
| GET | `/sales/ar/customers/{customerId}/ledger` | `AccountsReceivableController@customerLedger` | `sales.ar.view` |
| GET | `/sales/ar/invoices/{invoiceId}/ledger` | `AccountsReceivableController@invoiceLedger` | `sales.ar.view` |
| GET | `/sales/ar/open-invoices` | `AccountsReceivableController@openInvoices` | `sales.ar.view` |
| GET | `/sales/ar/aging` | `AccountsReceivableController@aging` | `sales.ar.view` |
| GET | `/sales/ar/reconciliation` | `AccountsReceivableController@reconciliation` | `sales.ar.reconcile` |
| GET/POST | `/sales/quotations` | index/store | view/create |
| GET/PATCH | `/sales/quotations/{id}` | show/update | view/edit |
| PATCH | `/sales/quotations/{id}/send|approve|accept|reject|cancel` | quotation actions | edit/approve/cancel |
| GET/POST | `/sales/orders` | index/store | view/create |
| POST | `/sales/orders/from-quotation/{quotationId}` | `createFromQuotation` | `sales.orders.convert` |
| PATCH | `/sales/orders/{id}/approve|confirm|cancel|close` | order actions | approve/confirm/cancel |
| GET/POST | `/sales/delivery-orders` | index/store | view/create |
| POST | `/sales/delivery-orders/from-sales-order/{salesOrderId}` | `createFromSalesOrder` | create |
| PATCH | `/sales/delivery-orders/{id}/ready|ship|deliver|cancel|void` | delivery actions | ship/deliver/cancel/void |
| GET/POST | `/sales/proformas` | index/store | view/create |
| POST | `/sales/proformas/from-sales-order/{salesOrderId}` | `createFromSalesOrder` | convert |
| PATCH | `/sales/proformas/{id}/issue|accept|cancel` | proforma actions | issue/cancel |
| GET/POST | `/sales/invoices` | index/store | view/create |
| POST | `/sales/invoices/from-sales-order/{salesOrderId}` | `createFromSalesOrder` | create |
| POST | `/sales/invoices/from-delivery-order/{deliveryOrderId}` | `createFromDeliveryOrder` | create |
| POST | `/sales/invoices/from-proforma/{proformaId}` | `createFromProforma` | create |
| PATCH | `/sales/invoices/{id}/approve|post|void` | invoice actions | approve/post/void |
| GET/POST | `/sales/customer-deposits` | index/store | view/create |
| GET | `/sales/customer-deposits/available` | available | `sales.deposits.view|sales.receipts.view` |
| PATCH | `/sales/customer-deposits/{id}/post|void|refund` | deposit actions | post/void/refund |
| POST | `/sales/customer-deposits/{id}/allocate-to-invoice/{invoiceId}` | allocate | post |
| GET/POST | `/sales/receipts` | index/store | view/create |
| GET | `/sales/receipts/customer-context` | customerContext | view |
| PATCH | `/sales/receipts/{id}/post|void` | receipt actions | post/void |
| GET/POST | `/sales/returns` | index/store | view/create |
| POST | `/sales/returns/from-invoice/{invoiceId}` | `createFromSalesInvoice` | create |
| POST | `/sales/returns/from-delivery-order/{deliveryOrderId}` | `createFromDeliveryOrder` | create |
| PATCH | `/sales/returns/{id}/approve|post|void` | return actions | approve/post/void |

## Purchase Routes

Prefix: `/purchase`. Middleware sama dengan Sales.

| Method | Endpoint | Controller Action | Permission |
| --- | --- | --- | --- |
| GET | `/purchase/source-documents/availability` | `SourceDocumentPickerController@availability` | `purchase.orders.view` |
| GET | `/purchase/ap/vendor-summary` | `AccountsPayableController@vendorSummary` | `purchase.ap.view` |
| GET | `/purchase/ap/vendors/{vendorId}/ledger` | vendor ledger | `purchase.ap.view` |
| GET | `/purchase/ap/bills/{billId}/ledger` | bill ledger | `purchase.ap.view` |
| GET | `/purchase/ap/open-bills` | openBills | `purchase.ap.view` |
| GET | `/purchase/ap/aging` | aging | `purchase.ap.view` |
| GET | `/purchase/ap/reconciliation` | reconciliation | `purchase.ap.reconcile` |
| GET/POST | `/purchase/requests` | index/store | view/create |
| PATCH | `/purchase/requests/{id}/submit|approve|reject|cancel` | PR actions | edit/approve/cancel |
| GET/POST | `/purchase/orders` | index/store | view/create |
| POST | `/purchase/orders/from-request/{purchaseRequestId}` | `createFromPurchaseRequest` | convert |
| PATCH | `/purchase/orders/{id}/approve|confirm|cancel|close` | PO actions | approve/confirm/cancel |
| GET/POST | `/purchase/goods-receipts` | index/store | view/create |
| POST | `/purchase/goods-receipts/from-purchase-order/{purchaseOrderId}` | create from PO | create |
| PATCH | `/purchase/goods-receipts/{id}/receive|cancel|void` | GR actions | receive/cancel/void |
| GET/POST | `/purchase/bills` | index/store | view/create |
| POST | `/purchase/bills/from-purchase-order/{purchaseOrderId}` | create from PO | create |
| POST | `/purchase/bills/from-goods-receipt/{goodsReceiptId}` | create from GR | create |
| PATCH | `/purchase/bills/{id}/approve|post|void` | bill actions | approve/post/void |
| GET/POST | `/purchase/vendor-deposits` | index/store | view/create |
| GET | `/purchase/vendor-deposits/available` | available | `purchase.deposits.view|purchase.payments.view` |
| PATCH | `/purchase/vendor-deposits/{id}/post|void|refund` | deposit actions | post/void/refund |
| POST | `/purchase/vendor-deposits/{id}/allocate-to-bill/{billId}` | allocate | post |
| GET/POST | `/purchase/payments` | index/store | view/create |
| GET | `/purchase/payments/vendor-context` | vendorContext | view |
| PATCH | `/purchase/payments/{id}/post|void` | payment actions | post/void |
| GET/POST | `/purchase/returns` | index/store | view/create |
| POST | `/purchase/returns/from-bill/{billId}` atau route sejenis | create from bill | create |
| POST | `/purchase/returns/from-goods-receipt/{goodsReceiptId}` | create from GR | create |
| PATCH | `/purchase/returns/{id}/approve|post|void` | return actions | approve/post/void |

Catatan: bagian akhir route purchase sempat terpotong oleh output ringkas RTK, tetapi pola route terlihat dari file dan service/controller naming. Confidence: Medium untuk dua endpoint return spesifik, High untuk pola modul.

## Inventory Routes

Prefix: `/inventory`.

| Method | Endpoint | Controller Action | Permission |
| --- | --- | --- | --- |
| GET | `/inventory/stock-balances` | StockBalanceController index | `inventory.stock.view` |
| GET | `/inventory/stock-balances/{productId}/{warehouseId}` | show balance | `inventory.stock.view` |
| GET/POST | `/inventory/stock-movements` | index/store | movements view/create |
| PATCH | `/inventory/stock-movements/{id}/post|void` | post/void | movements post/void |
| GET/POST | `/inventory/stock-adjustments` | index/store | adjustments view/create |
| PATCH | `/inventory/stock-adjustments/{id}` | update | adjustments edit |
| PATCH | `/inventory/stock-adjustments/{id}/approve|post|void` | actions | approve/post/void |
| GET/POST | `/inventory/stock-opnames` | index/store | opname view/create |
| POST | `/inventory/stock-opnames/{id}/generate-lines` | generateLines | opname edit |
| PATCH | `/inventory/stock-opnames/{id}/lines/{lineId}` | updateLine | opname edit |
| PATCH | `/inventory/stock-opnames/{id}/counted|finalize|void` | actions | edit/finalize |
| GET | `/inventory/reports/stock-balances|stock-movements|stock-card|valuation|low-stock|negative-stock` | InventoryReportController | `inventory.reports.view` |
| GET | `/inventory/valuation`, `/valuation/as-of`, `/valuation/products/{productId}`, `/valuation/warehouses/{warehouseId}` | InventoryValuationController | `inventory.valuation.view` |

## Journal, Accounting, Reports, Cash Bank

- `/journals`: GET/POST/PATCH, approve/post/void. Permission `journal.*`.
- `/accounting/fiscal-year/status`: dashboard permission.
- `/accounting/fiscal-years/{id}/closing-preview|closing-checklist|close|reopen`: fiscal year permissions.
- `/accounting/period-locks/status`, `PATCH /accounting/period-locks`: view/lock manage.
- `/reports/general-ledger`, `/account-ledger/{account}`, `/trial-balance`, `/profit-loss`, `/balance-sheet`, `/cash-flow`, `/financial-summary`, `/reconciliation/*`: `reports.view`.
- `/cash-bank/accounts`, `/cash-receipts`, `/cash-payments`, `/bank-transfers`, `/bank-reconciliations`, `/reports/account-statement`: `cash_bank.*`.

## Master Data Routes

Prefix: `/master-data`. CRUD-like endpoints for:

- `chart-of-accounts`
- `contacts`
- `payment-terms`
- `units`
- `product-categories`
- `products`
- `warehouses`
- `departments`
- `projects`
- `account-mappings`

Most master records use activate/deactivate instead of delete. Account mapping supports index and patch by `mappingKey`.

