# Purchase Workflow Audit

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Ringkasan Alur

Alur Purchase utama:

`Purchase Request -> Purchase Order -> Goods Receipt -> Vendor Bill -> Vendor Payment`

Cabang lain:

- `Purchase Order -> Vendor Deposit -> Vendor Deposit Allocation -> Vendor Bill`
- `Purchase Order -> Vendor Bill` langsung
- `Vendor Bill` atau `Goods Receipt -> Purchase Return`

Stock masuk dibuat saat Goods Receipt diterima, atau oleh direct Vendor Bill jika bill tidak berasal dari Goods Receipt dan policy mengizinkan. Journal AP dibuat oleh Vendor Bill, Vendor Payment, Vendor Deposit, Vendor Deposit Allocation, Purchase Return, dan stock receipt melalui StockMovementJournalService.

Confidence: High. File: `app/Services/Purchase/*`, `app/Services/Inventory/InventoryPurchaseIntegrationService.php`.

## Purchase Request

Model/tabel: `PurchaseRequest`, `PurchaseRequestLine`.

Service: `PurchaseRequestService`.

Status: `draft`, `submitted`, `approved`, `rejected`, `cancelled`, `converted`/progress inferred.

Rules:

- Line minimal dan quantity/estimated price divalidasi oleh request/service calculation.
- Product optional pada PR line, tetapi jika diisi harus valid melalui purchase concern.
- Department/project dapat diisi sebagai analytical dimension.
- Submit/approve/reject/cancel tersedia via route.
- Convert ke PO dijaga oleh service, tidak boleh dari status yang tidak valid.

Journal/stock:

- Tidak membuat journal atau stock movement.

Gap:

- Partial conversion/remaining PR perlu test karena tidak terlihat ada constraint DB yang mengunci double conversion.

Confidence: Medium.

## Purchase Order

Model/tabel: `PurchaseOrder`, `PurchaseOrderLine`.

Service: `PurchaseOrderService`.

Status: `draft`, `approved`, `confirmed`, `cancelled`, `closed`, dan progress received/billed.

Rules:

- Vendor valid.
- Create from PR memakai guard convertible.
- Update hanya draft.
- Quantity/price/discount dihitung oleh `PurchaseCalculationService`.
- Tracking line: `received_quantity`, `billed_quantity`, `returned_quantity`.
- Bisa membuat Vendor Deposit jika flow down payment dipakai.

Journal/stock:

- Tidak membuat journal atau stock movement langsung.

Gap:

- Sama seperti Sales Order, validitas lifecycle downstream dijaga service, bukan DB.

Confidence: High.

## Goods Receipt

Model/tabel: `GoodsReceipt`, `GoodsReceiptLine`.

Service: `GoodsReceiptService`.

Status: `draft`, `received`, `partially_billed`, `void`, `cancelled`.

Rules:

- Vendor valid.
- Create from PO mengambil remaining quantity.
- Receive memvalidasi tanggal via `TransactionDateGuardService`.
- Receive update `PurchaseOrderLine.received_quantity`.
- Void diblokir jika `billed_quantity > 0`.
- Void restore received quantity dan cascade void stock movement.

Stock impact:

- `InventoryPurchaseIntegrationService::createPurchaseInFromGoodsReceipt` membuat `stock_movements` type `purchase_in` dengan source `goods_receipt`.
- `StockMovementJournalService::createPurchaseInJournal` membuat journal inventory debit vs `purchase.inventory_interim` credit.

Gap:

- Mapping `purchase.inventory_interim` optional di config, tetapi wajib saat Goods Receipt stock diposting. Config perlu diselaraskan agar settings UI tidak menandai optional untuk flow GRNI.
- Source duplicate prevention belum DB-level unique.

Confidence: High.

## Vendor Bill

Model/tabel: `VendorBill`, `VendorBillLine`.

Service: `VendorBillService`.

Status: `draft`, `approved`, `posted`, `partially_paid`, `paid`, `void`.

Rules:

- Vendor valid, payment term valid.
- Update hanya draft.
- Post hanya dari draft/approved.
- Period/date guard wajib.
- Source remaining quantity divalidasi untuk PO/GR.
- Jika bukan dari GR, warehouse wajib untuk stock item.
- AP account: prioritas bill `ap_account_id`, vendor payable account, fallback `purchase.accounts_payable`.
- Tax input mapping wajib saat tax total > 0.
- Untuk bill dari GR, debit journal memakai `purchase.inventory_interim`.
- Untuk direct stock bill, integration dapat membuat `purchase_in`; `StockMovementJournalService` tidak membuat journal tambahan untuk `source_type=vendor_bill`, sehingga tidak double debit inventory.
- Vendor deposit allocation diterapkan setelah bill posted.
- Void diblokir bila ada payment/return posted, lalu void journal, movement, allocation, dan restore source progress.

Balance:

- Saat post, service reset `paid_amount=0`, `balance_due=grand_total`, lalu apply deposit jika requested.
- Payment/deposit/return mengubah paid/returned/balance.

Gap:

- Journal system dibuat langsung, tidak semua lewat centralized journal validator.
- Bila bill direct stock menghasilkan `purchase_in` tanpa inventory journal, AP bill journal harus sudah mendebit inventory/expense dengan benar; ini perlu test rekonsiliasi karena logic tersebar antara account resolver, line stock detection, dan integration.

Confidence: High.

## Vendor Deposit dan Allocation

Model/tabel: `VendorDeposit`, `VendorDepositAllocation`.

Service: `VendorDepositService`.

Status: `draft`, `posted`, `partially_allocated`, `fully_allocated`, `refunded`, `void`.

Rules:

- Vendor valid.
- Cash/bank account harus active asset cash/bank.
- Amount > 0.
- Post membuat journal `purchase.vendor_deposit` debit vs cash/bank credit.
- Allocation ke bill memvalidasi vendor sama, bill tidak void/cancelled, amount tidak melebihi remaining deposit/bill balance.
- Refund tidak melebihi remaining amount.
- Void allocation restore deposit dan bill.

Gap:

- Sama seperti customer deposit, source_id pada allocation journal perlu dipastikan konsisten dengan reconciliation. Confidence: Medium.

## Vendor Payment

Model/tabel: `VendorPayment`, `VendorPaymentLine`.

Service: `VendorPaymentService`.

Rules:

- Vendor valid.
- Cash/bank account valid.
- Multi-line payment didukung.
- Total line amount harus sama dengan header amount.
- Semua bill harus vendor yang sama.
- Bill harus posted/partially paid dan payment tidak melebihi balance due.
- Post membuat journal AP debit vs cash/bank credit.
- Void restore bill paid/balance/status dan void journal.

Confidence: High.

## Purchase Return

Model/tabel: `PurchaseReturn`, `PurchaseReturnLine`.

Service: `PurchaseReturnService`.

Rules:

- Vendor valid.
- Return dari Vendor Bill diblokir bila bill status paid dengan pesan workflow vendor credit deferred.
- Return dari Vendor Bill memakai `VendorBillLine.returned_quantity`.
- Return dari Goods Receipt memakai `GoodsReceiptLine.returned_quantity`.
- Quantity tidak boleh melebihi billed/received minus returned.
- Post membuat journal AP/purchase return/tax dan stock movement `purchase_return_out`.
- Void restore source and void journal/movement.

Gap:

- Mapping `purchase.return` optional di config, tetapi service mewajibkan mapping saat journal purchase return. Perlu diselaraskan.
- Return dari paid bill sengaja diblokir; jika bisnis membutuhkan vendor credit note, perlu desain terpisah, bukan memaksa di return existing.

Confidence: High.

## Gap Purchase Utama

1. System journal creation tersebar langsung di purchase service. Severity: High.
2. `purchase.inventory_interim`, `purchase.return` optional di config tetapi bisa required di runtime. Severity: Medium.
3. Direct Vendor Bill stock receipt membutuhkan test rekonsiliasi inventory vs AP journal. Severity: High.
4. DB FK dan unique source movement belum cukup untuk mencegah orphan/double source di luar service. Severity: High.
5. Vendor credit workflow untuk paid bill return belum tersedia. Severity: Enhancement.

