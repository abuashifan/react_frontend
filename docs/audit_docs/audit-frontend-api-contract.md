# Frontend API Contract

> Referensi lengkap endpoint API untuk pengembangan frontend ERP.
> Dibuat dari `02-api-route-map.md` + `01-architecture-overview.md`.
> Frontend wajib merujuk dokumen ini sebelum membuat API call baru.

---

## Setup Dasar

### Base URL & Headers

```
Base URL  : {VITE_API_BASE_URL}/api/v1
Auth      : Bearer token (Laravel Sanctum)
Company   : X-Company-ID header (wajib untuk semua endpoint bisnis)

Headers wajib di setiap request:
  Content-Type  : application/json
  Accept        : application/json
  Authorization : Bearer {token}
  X-Company-ID  : {active_company_id}
```

### Response Envelope

```typescript
// Success
{ success: true, message: string, data: T, meta?: object }

// Error
{ success: false, code: string, message: string, errors?: object, meta?: object }

// Paginated
{ success: true, data: T[], meta: { current_page, last_page, per_page, total } }
```

### HTTP Status Codes

| Code | Makna |
|---|---|
| 200 | Success (GET, PATCH action) |
| 201 | Created (POST) |
| 422 | Validation error — cek `errors` field |
| 401 | Unauthenticated — redirect ke login |
| 403 | Forbidden — user tidak punya permission |
| 404 | Resource tidak ditemukan |
| 409 | Conflict — status tidak valid untuk aksi |

---

## Auth & Session

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/login` | Login, dapat Bearer token |
| DELETE | `/auth/logout` | Logout, invalidate token |
| GET | `/auth/me` | Data user + permissions + companies |

---

## Master Data

Prefix: `/master-data`
Permission: `master-data.*`

| Method | Endpoint | Keterangan |
|---|---|---|
| GET/POST | `/master-data/chart-of-accounts` | Index / Create COA |
| GET/PATCH | `/master-data/chart-of-accounts/{id}` | Show / Update |
| PATCH | `/master-data/chart-of-accounts/{id}/activate` | Activate |
| PATCH | `/master-data/chart-of-accounts/{id}/deactivate` | Deactivate |
| GET/POST | `/master-data/contacts` | Index / Create contact |
| GET/PATCH | `/master-data/contacts/{id}` | Show / Update |
| PATCH | `/master-data/contacts/{id}/activate\|deactivate` | Toggle active |
| GET/POST | `/master-data/products` | Index / Create |
| GET/PATCH | `/master-data/products/{id}` | Show / Update |
| PATCH | `/master-data/products/{id}/activate\|deactivate` | Toggle active |
| GET/POST | `/master-data/product-categories` | Index / Create |
| GET/POST | `/master-data/units` | Index / Create |
| GET/POST | `/master-data/warehouses` | Index / Create |
| GET/POST | `/master-data/payment-terms` | Index / Create |
| GET/POST | `/master-data/departments` | Index / Create |
| GET/POST | `/master-data/projects` | Index / Create |
| GET | `/master-data/account-mappings` | Index semua mapping |
| PATCH | `/master-data/account-mappings/{mappingKey}` | Update mapping (by key, bukan ID) |

---

## Sales

Prefix: `/sales`
Permission granular: `sales.{resource}.{action}`

### Source Documents (Picker)

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/source-documents/availability` | `sales.orders.view` |
| GET | `/sales/source-documents` | `sales.orders.view` |

### Accounts Receivable

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/ar/customer-summary` | `sales.ar.view` |
| GET | `/sales/ar/customers/{customerId}/ledger` | `sales.ar.view` |
| GET | `/sales/ar/invoices/{invoiceId}/ledger` | `sales.ar.view` |
| GET | `/sales/ar/open-invoices` | `sales.ar.view` |
| GET | `/sales/ar/aging` | `sales.ar.view` |
| GET | `/sales/ar/reconciliation` | `sales.ar.reconcile` |

### Sales Quotation

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/quotations` | `sales.quotations.view` |
| POST | `/sales/quotations` | `sales.quotations.create` |
| GET | `/sales/quotations/{id}` | `sales.quotations.view` |
| PATCH | `/sales/quotations/{id}` | `sales.quotations.edit` |
| PATCH | `/sales/quotations/{id}/send` | `sales.quotations.edit` |
| PATCH | `/sales/quotations/{id}/approve` | `sales.quotations.approve` |
| PATCH | `/sales/quotations/{id}/accept` | `sales.quotations.edit` |
| PATCH | `/sales/quotations/{id}/reject` | `sales.quotations.edit` |
| PATCH | `/sales/quotations/{id}/cancel` | `sales.quotations.cancel` |

**Status Quotation:** `draft` → `sent` → `approved` → `accepted` / `rejected` / `cancelled` / `converted`

### Sales Order

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/orders` | `sales.orders.view` |
| POST | `/sales/orders` | `sales.orders.create` |
| POST | `/sales/orders/from-quotation/{quotationId}` | `sales.orders.convert` |
| GET | `/sales/orders/{id}` | `sales.orders.view` |
| PATCH | `/sales/orders/{id}/approve` | `sales.orders.approve` |
| PATCH | `/sales/orders/{id}/confirm` | `sales.orders.confirm` |
| PATCH | `/sales/orders/{id}/cancel` | `sales.orders.cancel` |
| PATCH | `/sales/orders/{id}/close` | `sales.orders.cancel` |

**Status Order:** `draft` → `approved` → `confirmed` → `cancelled` / `closed`

### Delivery Order

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/delivery-orders` | `sales.delivery-orders.view` |
| POST | `/sales/delivery-orders` | `sales.delivery-orders.create` |
| POST | `/sales/delivery-orders/from-sales-order/{salesOrderId}` | `sales.delivery-orders.create` |
| GET | `/sales/delivery-orders/{id}` | `sales.delivery-orders.view` |
| PATCH | `/sales/delivery-orders/{id}/ready` | `sales.delivery-orders.ship` |
| PATCH | `/sales/delivery-orders/{id}/ship` | `sales.delivery-orders.ship` |
| PATCH | `/sales/delivery-orders/{id}/deliver` | `sales.delivery-orders.deliver` |
| PATCH | `/sales/delivery-orders/{id}/cancel` | `sales.delivery-orders.cancel` |
| PATCH | `/sales/delivery-orders/{id}/void` | `sales.delivery-orders.void` |

**Status DO:** `draft` → `ready` → `shipped` → `delivered` → `void` / `cancelled`
> ⚠️ `deliver` membuat stock movement `sales_out` — tampilkan konfirmasi di UI

### Proforma Invoice

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/proformas` | `sales.proformas.view` |
| POST | `/sales/proformas` | `sales.proformas.create` |
| POST | `/sales/proformas/from-sales-order/{salesOrderId}` | `sales.proformas.convert` |
| GET | `/sales/proformas/{id}` | `sales.proformas.view` |
| PATCH | `/sales/proformas/{id}/issue` | `sales.proformas.issue` |
| PATCH | `/sales/proformas/{id}/accept` | `sales.proformas.edit` |
| PATCH | `/sales/proformas/{id}/cancel` | `sales.proformas.cancel` |

### Sales Invoice

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/invoices` | `sales.invoices.view` |
| POST | `/sales/invoices` | `sales.invoices.create` |
| POST | `/sales/invoices/from-sales-order/{salesOrderId}` | `sales.invoices.create` |
| POST | `/sales/invoices/from-delivery-order/{deliveryOrderId}` | `sales.invoices.create` |
| POST | `/sales/invoices/from-proforma/{proformaId}` | `sales.invoices.create` |
| GET | `/sales/invoices/{id}` | `sales.invoices.view` |
| PATCH | `/sales/invoices/{id}/approve` | `sales.invoices.approve` |
| PATCH | `/sales/invoices/{id}/post` | `sales.invoices.post` |
| PATCH | `/sales/invoices/{id}/void` | `sales.invoices.void` |

**Status Invoice:** `draft` → `approved` → `posted` → `partially_paid` / `paid` → `void`
> ⚠️ `post` membuat journal AR/revenue/tax. `void` diblokir jika ada receipt/return posted.

### Customer Deposit

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/customer-deposits` | `sales.deposits.view` |
| POST | `/sales/customer-deposits` | `sales.deposits.create` |
| GET | `/sales/customer-deposits/available` | `sales.deposits.view\|sales.receipts.view` |
| GET | `/sales/customer-deposits/{id}` | `sales.deposits.view` |
| PATCH | `/sales/customer-deposits/{id}/post` | `sales.deposits.post` |
| PATCH | `/sales/customer-deposits/{id}/void` | `sales.deposits.void` |
| PATCH | `/sales/customer-deposits/{id}/refund` | `sales.deposits.refund` |
| POST | `/sales/customer-deposits/{id}/allocate-to-invoice/{invoiceId}` | `sales.deposits.post` |

### Sales Receipt

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/receipts` | `sales.receipts.view` |
| POST | `/sales/receipts` | `sales.receipts.create` |
| GET | `/sales/receipts/customer-context` | `sales.receipts.view` |
| GET | `/sales/receipts/{id}` | `sales.receipts.view` |
| PATCH | `/sales/receipts/{id}/post` | `sales.receipts.post` |
| PATCH | `/sales/receipts/{id}/void` | `sales.receipts.void` |

### Sales Return

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/sales/returns` | `sales.returns.view` |
| POST | `/sales/returns` | `sales.returns.create` |
| POST | `/sales/returns/from-invoice/{invoiceId}` | `sales.returns.create` |
| POST | `/sales/returns/from-delivery-order/{deliveryOrderId}` | `sales.returns.create` |
| GET | `/sales/returns/{id}` | `sales.returns.view` |
| PATCH | `/sales/returns/{id}/approve` | `sales.returns.approve` |
| PATCH | `/sales/returns/{id}/post` | `sales.returns.post` |
| PATCH | `/sales/returns/{id}/void` | `sales.returns.void` |

---

## Purchase

Prefix: `/purchase`
Permission granular: `purchase.{resource}.{action}`

### Accounts Payable

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/purchase/ap/vendor-summary` | `purchase.ap.view` |
| GET | `/purchase/ap/vendors/{vendorId}/ledger` | `purchase.ap.view` |
| GET | `/purchase/ap/bills/{billId}/ledger` | `purchase.ap.view` |
| GET | `/purchase/ap/open-bills` | `purchase.ap.view` |
| GET | `/purchase/ap/aging` | `purchase.ap.view` |
| GET | `/purchase/ap/reconciliation` | `purchase.ap.reconcile` |

### Purchase Request

| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/purchase/requests` | `purchase.requests.view/create` |
| GET/PATCH | `/purchase/requests/{id}` | view/edit |
| PATCH | `/purchase/requests/{id}/submit\|approve\|reject\|cancel` | edit/approve/cancel |

**Status PR:** `draft` → `submitted` → `approved` / `rejected` / `cancelled` / `converted`

### Purchase Order

| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/purchase/orders` | `purchase.orders.view/create` |
| POST | `/purchase/orders/from-request/{purchaseRequestId}` | `purchase.orders.convert` |
| GET | `/purchase/orders/{id}` | `purchase.orders.view` |
| PATCH | `/purchase/orders/{id}/approve\|confirm\|cancel\|close` | approve/confirm/cancel |

### Goods Receipt

| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/purchase/goods-receipts` | `purchase.goods-receipts.view/create` |
| POST | `/purchase/goods-receipts/from-purchase-order/{purchaseOrderId}` | create |
| GET | `/purchase/goods-receipts/{id}` | view |
| PATCH | `/purchase/goods-receipts/{id}/receive` | `purchase.goods-receipts.receive` |
| PATCH | `/purchase/goods-receipts/{id}/cancel\|void` | cancel/void |

> ⚠️ `receive` membuat stock movement `purchase_in` + GRNI journal

### Vendor Bill

| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/purchase/bills` | `purchase.bills.view/create` |
| POST | `/purchase/bills/from-purchase-order/{purchaseOrderId}` | create |
| POST | `/purchase/bills/from-goods-receipt/{goodsReceiptId}` | create |
| GET | `/purchase/bills/{id}` | view |
| PATCH | `/purchase/bills/{id}/approve\|post\|void` | approve/post/void |

**Status Bill:** `draft` → `approved` → `posted` → `partially_paid` / `paid` → `void`

### Vendor Deposit & Payment

| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/purchase/vendor-deposits` | `purchase.deposits.view/create` |
| GET | `/purchase/vendor-deposits/available` | `purchase.deposits.view\|purchase.payments.view` |
| PATCH | `/purchase/vendor-deposits/{id}/post\|void\|refund` | post/void/refund |
| POST | `/purchase/vendor-deposits/{id}/allocate-to-bill/{billId}` | post |
| GET/POST | `/purchase/payments` | `purchase.payments.view/create` |
| GET | `/purchase/payments/vendor-context` | view |
| PATCH | `/purchase/payments/{id}/post\|void` | post/void |

### Purchase Return

| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/purchase/returns` | `purchase.returns.view/create` |
| POST | `/purchase/returns/from-bill/{billId}` | create |
| POST | `/purchase/returns/from-goods-receipt/{goodsReceiptId}` | create |
| GET | `/purchase/returns/{id}` | view |
| PATCH | `/purchase/returns/{id}/approve\|post\|void` | approve/post/void |

> ⚠️ Return dari bill yang sudah `paid` diblokir backend — tampilkan pesan yang jelas di UI

---

## Inventory

Prefix: `/inventory`
Permission: `inventory.*`

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/inventory/stock-balances` | Semua stock balance |
| GET | `/inventory/stock-balances/{productId}/{warehouseId}` | Balance per product+warehouse |
| GET/POST | `/inventory/stock-movements` | Index / Create manual movement |
| PATCH | `/inventory/stock-movements/{id}/post\|void` | Post / Void movement |
| GET/POST | `/inventory/stock-adjustments` | Index / Create adjustment |
| PATCH | `/inventory/stock-adjustments/{id}` | Update (draft only) |
| PATCH | `/inventory/stock-adjustments/{id}/approve\|post\|void` | Workflow adjustment |
| GET/POST | `/inventory/stock-opnames` | Index / Create opname |
| POST | `/inventory/stock-opnames/{id}/generate-lines` | Generate lines dari stock balance |
| PATCH | `/inventory/stock-opnames/{id}/lines/{lineId}` | Update physical count |
| PATCH | `/inventory/stock-opnames/{id}/counted\|finalize\|void` | Workflow opname |

### Inventory Reports

| Method | Endpoint |
|---|---|
| GET | `/inventory/reports/stock-balances` |
| GET | `/inventory/reports/stock-movements` |
| GET | `/inventory/reports/stock-card` |
| GET | `/inventory/reports/valuation` |
| GET | `/inventory/reports/low-stock` |
| GET | `/inventory/reports/negative-stock` |
| GET | `/inventory/valuation` |
| GET | `/inventory/valuation/as-of` |
| GET | `/inventory/valuation/products/{productId}` |
| GET | `/inventory/valuation/warehouses/{warehouseId}` |

---

## Journal & Accounting

### Manual Journal

| Method | Endpoint | Permission |
|---|---|---|
| GET/POST | `/journals` | `journal.view/create` |
| GET | `/journals/{id}` | view |
| PATCH | `/journals/{id}/approve\|post\|void` | approve/post/void |

> ⚠️ Manual journal tidak boleh memakai control accounts (AR, AP, Inventory Asset, dll.)
> UI wajib filter/disable akun-akun tersebut di form manual journal

### Accounting Period

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/accounting/fiscal-year/status` | dashboard |
| PATCH | `/accounting/fiscal-years/{id}/closing-preview` | fiscal year permission |
| PATCH | `/accounting/fiscal-years/{id}/closing-checklist` | fiscal year permission |
| PATCH | `/accounting/fiscal-years/{id}/close` | fiscal year permission |
| PATCH | `/accounting/fiscal-years/{id}/reopen` | fiscal year permission |
| GET | `/accounting/period-locks/status` | view |
| PATCH | `/accounting/period-locks` | `accounting.period-locks.manage` |

---

## Reports

Prefix: `/reports`
Permission: `reports.view`

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/reports/general-ledger` | GL dengan filter date/account |
| GET | `/reports/account-ledger/{account}` | Ledger per account |
| GET | `/reports/trial-balance` | Trial balance |
| GET | `/reports/profit-loss` | P&L dengan filter period |
| GET | `/reports/balance-sheet` | Neraca per tanggal |
| GET | `/reports/cash-flow` | Arus kas |
| GET | `/reports/financial-summary` | Ringkasan finansial |
| GET | `/reports/reconciliation/*` | Rekonsiliasi AR/AP/Inventory |

---

## Cash & Bank

Prefix: `/cash-bank`
Permission: `cash_bank.*`

| Method | Endpoint | Keterangan |
|---|---|---|
| GET/POST | `/cash-bank/accounts` | Cash/bank accounts |
| GET/POST | `/cash-bank/cash-receipts` | Penerimaan kas |
| GET/POST | `/cash-bank/cash-payments` | Pengeluaran kas |
| GET/POST | `/cash-bank/bank-transfers` | Transfer antar rekening |
| GET/POST | `/cash-bank/bank-reconciliations` | Rekonsiliasi bank |
| GET | `/cash-bank/reports/account-statement` | Laporan mutasi rekening |

---

## Catatan Penting untuk Frontend Developer

### Status Dokumen yang Tidak Bisa Diedit

Dokumen dengan status berikut **tidak bisa diedit** — form harus read-only:

| Dokumen | Status read-only |
|---|---|
| Semua dokumen | `posted`, `void`, `cancelled` |
| Sales Invoice | `partially_paid`, `paid` |
| Vendor Bill | `partially_paid`, `paid` |
| Delivery Order | `shipped`, `delivered` |
| Goods Receipt | `received`, `partially_billed` |

### Aksi yang Perlu Konfirmasi Dialog

Tampilkan konfirmasi dengan penjelasan dampak sebelum memanggil:
- `/deliver` — akan membuat stock movement keluar
- `/receive` — akan membuat stock movement masuk + GRNI journal
- `/post` (invoice/bill) — akan membuat journal akuntansi
- `/void` — akan membatalkan journal + stock movement
- `/close` (fiscal year) — tidak bisa dibuka kembali tanpa reopen

### Quantity Tracking di UI

Tampilkan progress quantity untuk dokumen yang punya tracking:

| Dokumen | Field tracking |
|---|---|
| Sales Order Lines | `delivered_quantity`, `invoiced_quantity`, `returned_quantity` |
| Delivery Order Lines | `invoiced_quantity`, `returned_quantity` |
| Purchase Order Lines | `received_quantity`, `billed_quantity`, `returned_quantity` |
| Goods Receipt Lines | `billed_quantity`, `returned_quantity` |

### Amount Tracking di UI

| Dokumen | Field tracking |
|---|---|
| Sales Invoice | `grand_total`, `paid_amount`, `returned_amount`, `balance_due` |
| Vendor Bill | `grand_total`, `paid_amount`, `returned_amount`, `balance_due` |
| Customer Deposit | `amount`, `allocated_amount`, `remaining_amount` |
| Vendor Deposit | `amount`, `allocated_amount`, `remaining_amount` |
