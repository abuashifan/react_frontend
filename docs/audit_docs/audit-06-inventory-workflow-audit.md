# Inventory Workflow Audit

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Arsitektur Stock Movement

Inventory memakai `StockMovementService` sebagai service utama untuk membuat draft, post, void, reversal, dan update stock balance. Source transaksi Sales/Purchase tidak langsung mengubah `stock_balances`; mereka membuat `stock_movements` melalui integration service.

Service kunci:

- `StockMovementService`
- `StockMovementValidationService`
- `StockMovementJournalService`
- `StockBalanceService`
- `AverageCostService`
- `InventorySalesIntegrationService`
- `InventoryPurchaseIntegrationService`
- `StockAdjustmentService`
- `StockOpnameService`

Confidence: High.

## Movement Type

Allowed di `StockMovementValidationService::ALLOWED_MOVEMENT_TYPES`:

- `purchase_in`
- `purchase_return_out`
- `sales_out`
- `sales_return_in`
- `adjustment_in`
- `adjustment_out`
- `opening_stock`
- `opname_in`
- `opname_out`

Config `config/inventory.php` juga mencantumkan:

- `transfer_in`
- `transfer_out`

Gap: transfer ada di config/document number/source link, tetapi tidak di allowed movement service. Ini membuat expectation route/config tidak konsisten dengan runtime validation.

Confidence: High.

## Movement In/Out

Direction ditentukan di `StockMovementValidationService::directionForType`:

- In: `purchase_in`, `sales_return_in`, `adjustment_in`, `opname_in`, `opening_stock`.
- Out: `sales_out`, `purchase_return_out`, `adjustment_out`, `opname_out`.

`StockBalanceService::applyMovementLine` menolak direction invalid, quantity <= 0, dan untuk out memanggil `assertSufficientStock` bila `config('inventory.allow_negative_stock')` false.

Confidence: High.

## Average Costing

`AverageCostService` memakai moving average:

- Incoming: `(value_before + qty_in * unit_cost) / (qty_before + qty_in)`.
- Outgoing: memakai average cost sebelum movement untuk `unit_cost` dan `total_cost`.
- Jika stock setelah outgoing menjadi 0, average cost diset 0.
- Line movement menyimpan quantity/value/average cost sebelum dan sesudah.

Tidak ditemukan perubahan average costing di audit ini. Jangan ubah formula tanpa desain akuntansi.

Confidence: High.

## Stock Balance Update

`StockBalanceService::getOrCreateBalance(product_id, warehouse_id)` membuat balance per product+warehouse bila belum ada. `applyMovementLine` memperbarui:

- `quantity_on_hand`
- `quantity_available`
- `average_cost`
- `total_value`
- `last_movement_id`
- `last_movement_at`

Negative stock default disabled di `config/inventory.php`.

Confidence: High.

## Journal Inventory

Journal inventory dibuat melalui `StockMovementJournalService::createInventoryJournalForMovement`.

Matrix:

| Movement Type | Debit | Credit | Catatan |
| --- | --- | --- | --- |
| `purchase_in` dari GR | `inventory.asset` / line inventory account | `purchase.inventory_interim` | GRNI |
| `purchase_in` dari Vendor Bill | tidak membuat journal stock | journal bill menangani inventory/AP | mencegah double debit |
| `sales_out` | `inventory.cogs` | `inventory.asset` | COGS |
| `sales_return_in` | `inventory.asset` | `inventory.cogs` | reverse COGS |
| `purchase_return_out` | `purchase.return` optional/required runtime | `inventory.asset` | return out |
| `adjustment_in` | `inventory.asset` | `inventory.adjustment_gain` | gain |
| `adjustment_out` | `inventory.adjustment_loss` | `inventory.asset` | loss |
| `opname_in/out` | sama seperti adjustment | sama seperti adjustment | opname variance |
| `opening_stock` | `inventory.asset` | `opening_balance.equity` | opening |

Confidence: High.

## Stock Adjustment

`StockAdjustmentService` membuat adjustment draft, update, approve, post, void. Saat post:

- Validasi period lock via movement validation.
- Membuat stock movement `adjustment_in` untuk quantity positif.
- Membuat stock movement `adjustment_out` untuk quantity negatif.
- Menyimpan `stock_movement_ids` di metadata.

Critical gap: bila satu adjustment punya line increase dan decrease sekaligus, service membuat dua stock movements dengan `source_type=stock_adjustment` dan `source_id` sama. `StockMovementService::createDraft` memanggil duplicate source guard yang menolak source sama dalam status draft/posted. Akibatnya movement kedua berpotensi gagal. Ini juga berlaku untuk stock opname campuran. Confidence: High dari pembacaan `StockMovementService::assertSourceNotAlreadyMoved` dan `StockOpnameService::createStockMovementsFromDifferences`; audit tidak menjalankan test.

## Stock Opname

`StockOpnameService`:

- Create opname dengan date/warehouse.
- Generate lines dari `stock_balances` untuk warehouse.
- Update physical count menghitung difference.
- `markCounted`, lalu `finalize`.
- Finalize memblokir partial count bila `inventory.opname_allow_partial_count=false`.
- No difference tidak dibuat movement.
- Difference positif menjadi `opname_in`.
- Difference negatif menjadi `opname_out`.
- Void finalized opname mencari movement ids di metadata dan void masing-masing.

Gap yang sama: mixed difference in/out dapat terkena duplicate source guard.

Confidence: High.

## Opening Stock

Movement type `opening_stock` didukung oleh stock movement dan journal service. Mapping yang dipakai oleh journal service adalah `opening_balance.equity`.

Tidak ditemukan service khusus Opening Stock dalam audit read-only ini selain movement type/config/document number. Jika ada UI/flow opening stock, kemungkinan melewati stock movement generic.

Confidence: Medium.

## Void/Reversal

`StockMovementService::void`:

- Membutuhkan reason.
- Validasi period/date guard.
- Jika draft/non-posted, status menjadi void.
- Jika posted, membuat reversal movement dengan direction kebalikan, `source_type=reversal`, lalu post reversal.
- Original movement diset void dan `reversed_by_id`.

Journal dari original tidak dibalik dengan reversal journal khusus; efek GL original dikeluarkan dari report karena status journal system yang di-void melalui cascade source transaction, atau journal reversal stock movement dibuat untuk reversal movement. Perlu verifikasi untuk direct void stock movement: `createReversal` mem-post reversal movement dan journal baru, tetapi original journal status belum terlihat otomatis di-void pada path stock movement generic. Ini area perlu test.

Confidence: Medium.

## Inventory Reports

Inventory report membaca:

- `stock_balances`
- `stock_movements`
- `stock_movement_lines`
- valuation dari stock balance/movement
- negative/low stock dari stock balance

Reconciliation inventory di Reports membandingkan stock valuation dengan GL inventory accounts.

Confidence: Medium karena service report output terpotong, tetapi route dan query terlihat.

## Gap Inventory Utama

1. Mixed adjustment/opname in-out berpotensi gagal karena duplicate source guard. Severity: High.
2. `transfer_in/out` ada di config tapi tidak allowed di service. Severity: Medium.
3. Generic stock movement void perlu test apakah original journal stock movement dikeluarkan atau dibalik sesuai desain. Severity: High.
4. No DB unique constraint untuk `(source_type, source_id, status active)` stock movement. Severity: Medium.
5. Opening Stock tidak terlihat punya service khusus yang membatasi posting berulang product+warehouse. Severity: Medium.

