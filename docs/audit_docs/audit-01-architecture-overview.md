# Architecture Overview

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Struktur Project

Backend adalah Laravel API dengan route modular di `app/Modules/*/Routes/api.php`, controller di `app/Http/Controllers/Api/*`, request validation di `app/Http/Requests/*`, model tenant di `app/Models/Tenant/*`, dan service layer dominan di `app/Services/*`.

Modul utama yang ditemukan:

- Auth, Access, Companies, Settings, Tenant context.
- Master Data: contacts, COA, account mappings, products, product categories, units, warehouses, departments, projects, payment terms.
- Sales: quotation, order, delivery order, proforma, invoice, receipt, customer deposit, return, AR.
- Purchase: purchase request, purchase order, goods receipt, vendor bill, vendor payment, vendor deposit, return, AP.
- Inventory: stock balance, stock movement, adjustment, opname, valuation, reports.
- Journal: manual journal entry.
- Accounting: fiscal year, period lock, closing.
- Reports: GL, trial balance, balance sheet, profit loss, cash flow, financial summary, reconciliation.
- Cash Bank: cash receipt/payment, transfer, reconciliation.

Confidence: High. File utama: `routes/api.php`, `app/Modules/*/Routes/api.php`, `app/Services/*`, `app/Models/Tenant/*`.

## Request Lifecycle

`routes/api.php` memuat route module dari `app/Modules`. Hampir semua route bisnis memakai middleware:

- `auth:sanctum`
- `company.access`
- route-level `permission:*`

`EnsureCompanyAccess` membaca header `X-Company-ID`, memastikan user punya akses ke company aktif, mencari tenant database aktif, menyetel `TenantContext`, lalu mengonfigurasi koneksi database `tenant` melalui `TenantConnectionManager`.

Model tenant memakai `protected $connection = 'tenant'`. Data pusat seperti company, user, fiscal year/accounting period berada di koneksi pusat, sedangkan transaksi bisnis berada di tenant database.

Confidence: High. File: `app/Http/Middleware/EnsureCompanyAccess.php`, `app/Services/Tenant/TenantContext.php`, `app/Services/Tenant/TenantConnectionManager.php`.

## Service Layer

Business logic utama berada di service:

- Sales: `app/Services/Sales/*Service.php`
- Purchase: `app/Services/Purchase/*Service.php`
- Inventory: `app/Services/Inventory/*Service.php`
- Journal: `app/Services/Journal/*Service.php`
- Transactions guard/effect: `app/Services/Transactions/*`
- Reports: `app/Services/Reports/*`

Controller umumnya tipis: menerima FormRequest, mencari model, lalu memanggil service. Pattern ini cukup konsisten.

Confidence: High.

## Request Validation

FormRequest tersedia untuk modul Sales, Purchase, Inventory, Journal, MasterData, Accounting, Reports, CashBank. Request validation menangani bentuk payload dasar, tetapi validasi domain penting juga ada di service. Service validation yang reusable ditemukan di `app/Services/Validation/BusinessReferenceValidator.php`.

Validator reusable saat ini mencakup active customer/vendor/product/unit/warehouse/account/payment term/department/project, unit precision, stock movement line, stock item warehouse, dan account mapping.

Confidence: High untuk keberadaan validator. Runtime coverage per endpoint tetap perlu test manual karena audit tidak menjalankan test.

## Response Format dan Exception

Response API memakai envelope:

- Success: `success`, `message`, `data`, `meta`.
- Error: `success=false`, `code`, `message`, `errors`, `meta`.

Exception domain menggunakan `App\Exceptions\ApiException` dan `App\Support\Api\ApiResponseBuilder`.

Confidence: High. File: `app/Support/Api/ApiResponseBuilder.php`, `app/Exceptions/ApiException.php`.

## Authorization

Permission dikontrol dengan middleware `permission:*`. Middleware mendukung alternatif permission dengan pipe, contoh `permission:sales.deposits.view|sales.receipts.view`.

Tidak ditemukan folder `app/Policies`, `app/Events`, `app/Listeners`, `app/Jobs`, atau `app/Observers` pada audit read-only ini. Authorization tampak route/middleware-centric, bukan policy model-centric.

Confidence: High untuk route middleware; High untuk "tidak ditemukan" berdasarkan `rtk ls`.

## Multi-Tenancy

Tenant isolation terutama dilakukan dengan pemilihan koneksi database tenant per company. Karena setiap tenant memakai database sendiri, banyak unique constraint tidak perlu menyertakan `tenant_id`. Di level service, lookup model tenant otomatis berada pada koneksi tenant aktif.

Risiko tersisa: bila koneksi tenant salah disetel atau proses CLI menjalankan logic tanpa `TenantContext`, query tenant dapat gagal atau memakai koneksi yang tidak diharapkan. Banyak foreign-like reference di tenant DB juga tidak dipaksa FK, sehingga import/manual DB write bisa membuat orphan.

Confidence: High untuk mekanisme koneksi; Medium untuk risiko CLI karena tidak semua command diaudit penuh.

## Config Penting

- `config/account_mappings.php`: daftar mapping akun kritis.
- `config/inventory.php`: moving average, negative stock disabled, movement type config.
- `config/sales_workflow.php`: status/reportable sales.
- `config/purchase_workflow.php`: status/reportable purchase.
- `config/transaction_lifecycle.php`: status transaksi/journal.
- `config/source_links.php`: source type/module.
- `config/report_visibility.php`: journal posted sebagai sumber laporan.
- `config/document_numbers.php`: prefix dokumen.

Catatan penting: `config/inventory.php` masih mencantumkan `transfer_in` dan `transfer_out`, sementara `StockMovementValidationService::ALLOWED_MOVEMENT_TYPES` tidak mengizinkan transfer. Ini gap konsistensi config vs service.

Confidence: High.

