# Accounting and Reporting Audit

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Journal Architecture

Manual journal dikelola oleh:

- `app/Services/Journal/JournalEntryService.php`
- `JournalValidationService`
- `JournalPostingService`
- `JournalVoidService`

System generated journal dibuat oleh banyak service domain:

- Sales Invoice, Receipt, Deposit, Return.
- Vendor Bill, Payment, Deposit, Return.
- Cash Bank receipt/payment/transfer.
- Stock Movement journal.
- Fiscal closing/opening balance services.

Manual journal memakai `JournalValidationService` untuk balanced debit/credit, active account, dimension valid, dan protected control account. System journal sering dibuat langsung dengan `JournalEntry::query()->create()` dan `lines()->createMany()`.

Confidence: High.

## Journal Validation

`JournalValidationService::validateLines` memvalidasi:

- Minimal 2 lines.
- `account_id` wajib.
- Debit/credit tidak negatif.
- Debit dan credit tidak boleh sama-sama > 0.
- Debit dan credit tidak boleh sama-sama 0.
- Akun harus ada dan active bila `requireActiveAccounts=true`.
- Department active.
- Project active dan status `active`.
- Total debit harus sama dengan total credit.

`validateNoControlAccounts` melindungi manual journal dari mapping:

- `sales.accounts_receivable`
- `purchase.accounts_payable`
- `inventory.asset`
- `sales.customer_deposit`
- `purchase.vendor_deposit`
- `purchase.inventory_interim`
- `sales.tax_output`
- `purchase.tax_input`

Confidence: High.

## Journal Lifecycle

Manual journal:

- Create: draft atau auto-post sesuai company accounting setting.
- Update: system-generated journal tidak boleh diedit langsung. Posted manual journal bisa diedit bila ada `edit_reason`, revision dicatat.
- Approve/post: mengikuti `TransactionPolicyService`.
- Void: manual journal bisa void dengan reason; system-generated journal tidak bisa void langsung lewat manual journal service.

System journal:

- Cascaded void dilakukan oleh `TransactionVoidEffectService`, hanya untuk `is_system_generated=true`.
- Journal system diubah status menjadi `void`; report hanya membaca `posted`.

Confidence: High.

## Period Lock dan Fiscal Year

`TransactionDateGuardService` memeriksa:

- Fiscal year closed.
- `locked_until` pada fiscal year.
- Annual closing gate.
- Optional block outside active fiscal year.
- Backdated/future transaction settings.

`PeriodLockService` punya method `isPeriodClosed`, tetapi komentar menyatakan monthly accounting period status belum dipakai untuk blocking MVP. Blocking efektif menggunakan fiscal year closed dan `locked_until`.

Confidence: High.

## Account Mapping Kritis

Config `account_mappings.php` memuat mapping penting:

- Sales: `sales.accounts_receivable`, `sales.revenue`, `sales.discount`, `sales.return`, `sales.tax_output`, `sales.customer_deposit`, `sales.default_cash_bank`.
- Purchase: `purchase.accounts_payable`, `purchase.expense`, `purchase.default_purchase`, `purchase.inventory_interim`, `purchase.tax_input`, `purchase.discount`, `purchase.return`, `purchase.vendor_deposit`, `purchase.default_cash_bank`.
- Inventory: `inventory.asset`, `inventory.cogs`, `inventory.adjustment_gain`, `inventory.adjustment_loss`, `inventory.write_off`, `inventory.opening_stock_equity`.
- Cash bank: `cash_bank.default_cash`, `cash_bank.default_bank`, `cash_bank.bank_admin_fee`, `cash_bank.bank_interest_income`.
- Opening/closing: `opening_balance.equity`, `closing.retained_earnings`, `closing.current_year_earnings`.
- Journal: `journal.suspense`.

Gap naming: Inventory journal service memakai `opening_balance.equity`, sedangkan config juga memiliki `inventory.opening_stock_equity` optional. Pastikan hanya satu source of truth dipakai untuk opening stock.

Confidence: High.

## General Ledger

`GeneralLedgerQueryService` membaca `journal_entry_lines` join `journal_entries`, `chart_of_accounts`, department/project. Base query:

- `je.status = posted`
- `je.is_obsolete = 0`
- optional report visibility config.

Opening balance dihitung dari journal sebelum start date. Period movement dihitung dari debit/credit pada range. Normal balance dipakai oleh `LedgerBalanceCalculator`.

Confidence: High.

## Balance Sheet dan Profit Loss

Balance Sheet:

- Membaca posted, non-obsolete journal lines.
- Asset/liability/equity dari COA.
- Current year profit/loss dihitung dari revenue/expense journal sampai as-of date.
- Menghasilkan difference dan `is_balanced`.

Profit Loss:

- Membaca revenue/expense dari posted journal lines.
- Filter dimension/date dari request/report filter.

Confidence: High.

## Financial Summary dan Cash Flow

Financial Summary mengonsolidasikan laporan finansial dari service report. Cash Flow route tersedia dan service membaca GL/cash-bank style data.

Confidence: Medium karena tidak semua file report dibaca penuh.

## AR/AP Subledger

AR operational subledger membaca Sales Invoice, Sales Receipt, Sales Return, Customer Deposit Allocation. AP membaca Vendor Bill, Vendor Payment, Purchase Return, Vendor Deposit Allocation. Reconciliation membandingkan operational subledger dengan GL dari account mapping dan account override (`ar_account_id`, `ap_account_id`).

Risiko mismatch:

- Jika system journal source_id/source_type tidak konsisten dengan operational document.
- Jika account override pada invoice/bill tidak masuk dalam account list reconciliation.
- Jika journal system dibuat tidak balance atau account mapping berubah setelah posting.

Confidence: Medium to High. File report reconciliation di working tree saat audit terlihat ada tetapi sebagian file statusnya untracked dari pekerjaan sebelumnya.

## Cash Bank

Cash receipt/payment/transfer membuat journal system dengan source `cash_receipt`, `cash_payment`, `bank_transfer`. Posting/void memakai date guard. Bank reconciliation membaca journal_entry_lines untuk cash/bank account.

Confidence: Medium.

## Gap Accounting/Reporting Utama

1. System journal creation tidak terpusat lewat validator. Severity: High.
2. Monthly accounting period status belum memblokir transaksi; hanya fiscal year closed/locked_until. Severity: Medium jika user menganggap period lock bulanan sudah aktif.
3. Config mapping optional vs runtime required tidak sinkron (`purchase.inventory_interim`, returns, adjustment gain/loss pada flow tertentu). Severity: Medium.
4. Reconciliation report files berada dalam working tree yang sudah dirty/untracked saat audit; runtime belum diverifikasi. Severity: Low/Medium.
5. Manual posted journal bisa diedit dengan revision; ini behavior existing dan jangan diubah sembarangan, tetapi perlu governance permission kuat. Severity: Medium.

