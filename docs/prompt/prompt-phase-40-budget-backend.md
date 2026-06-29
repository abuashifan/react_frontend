# Prompt — Phase 40: Budget Module Backend

**Phase**: 40  
**Status**: Planned  
**Konteks**: `../gap_docs/gap-12-budget-module.md` ← baca ini dulu  
**Backend**: `/workspace/laravel_backend/`

---

## 0. Guard Rails

```
⛔ JANGAN baca docs/struktur_frontend.md
⛔ JANGAN baca laravel_backend/docs/backend-directory-tree.md
⛔ JANGAN baca laravel_backend/docs/backend-modular-monolith-plan.md
✅ Daftar file yang perlu dibuat/diubah LENGKAP ada di dokumen ini
✅ Baca gap-12-budget-module.md untuk business rules, data model, dan API contract
✅ Baca laravel_backend/AGENTS.md sebelum mulai coding backend
```

---

## 1. Baca Sebelum Mulai

```
docs/gap_docs/gap-12-budget-module.md       ← business rules, data model, API, response shape
laravel_backend/AGENTS.md                   ← backend coding rules
```

Cek pola Auto Post yang sudah ada (contoh cari di `app/Services/`) untuk ikuti pola yang sama — jangan buat pola baru.

---

## 2. File yang Dibuat (Backend)

### Migrations — `laravel_backend/database/migrations/`

| File | Tabel |
|---|---|
| `YYYY_MM_DD_000001_create_budget_periods_table.php` | `budget_periods` |
| `YYYY_MM_DD_000002_create_budget_submissions_table.php` | `budget_submissions` |
| `YYYY_MM_DD_000003_create_budget_lines_table.php` | `budget_lines` |

Schema sesuai §2 gap-12. Catatan `budget_lines`: TIDAK ada unique constraint DB (NULL handling) — validasi di service.

### Models — `laravel_backend/app/Models/`

| File | Keterangan |
|---|---|
| `BudgetPeriod.php` | Relations: company, createdBy, submissions |
| `BudgetSubmission.php` | Relations: period, department, lines, submittedBy, approvedByHead, approvedByFinance, rejectedBy |
| `BudgetLine.php` | Relations: submission, account, project |

Semua model: scope `company_id` via global scope atau di service (ikuti pola model lain).

### Services — `laravel_backend/app/Services/Budget/`

| File | Tanggung Jawab |
|---|---|
| `BudgetPeriodService.php` | CRUD period, close period |
| `BudgetSubmissionService.php` | CRUD submission, submit, approve, reject, bulk lines update, auto-post logic |
| `BudgetConsolidationService.php` | Query agregasi multi-dimensi dari approved submissions |
| `BudgetWarningService.php` | Cek over-budget saat transaksi diposting (lihat §7 gap-12) |

**Auto Post logic** di `BudgetSubmissionService::submit()`:
- Cek company setting auto_post (ikuti pola yang sudah ada)
- Jika aktif: langsung set `status = approved`, isi `approved_by_finance_id` + `approved_by_finance_at` dengan auth user
- Jika tidak: set `status = submitted`

### Controllers — `laravel_backend/app/Http/Controllers/Budget/`

| File | Routes yang Ditangani |
|---|---|
| `BudgetPeriodController.php` | index, store, show, update, close |
| `BudgetSubmissionController.php` | index, store, show, update, updateLines, submit, approveHead, approveFinance, reject |
| `BudgetConsolidationController.php` | show (GET /budget-periods/{id}/consolidation) |

Tambahkan `BudgetComparisonController.php` di `laravel_backend/app/Http/Controllers/Reports/`:

| File | Route |
|---|---|
| `BudgetComparisonController.php` | GET /reports/budget/comparison |

### Requests — `laravel_backend/app/Http/Requests/Budget/`

| File | Dipakai Oleh |
|---|---|
| `StoreBudgetPeriodRequest.php` | POST /budget-periods |
| `UpdateBudgetPeriodRequest.php` | PUT /budget-periods/{id} |
| `StoreBudgetSubmissionRequest.php` | POST /budget-periods/{id}/submissions |
| `UpdateBudgetSubmissionRequest.php` | PUT /budget-submissions/{id} |
| `UpdateBudgetLinesRequest.php` | PUT /budget-submissions/{id}/lines |
| `BudgetApprovalRequest.php` | POST .../reject (butuh rejection_note) |
| `BudgetComparisonRequest.php` | GET /reports/budget/comparison |

### Resources — `laravel_backend/app/Http/Resources/Budget/`

| File | Keterangan |
|---|---|
| `BudgetPeriodResource.php` | |
| `BudgetSubmissionResource.php` | Include lines |
| `BudgetLineResource.php` | |
| `BudgetConsolidationResource.php` | Shape lihat §8 gap-12 |
| `BudgetComparisonResource.php` | Shape lihat §8 gap-12 |

### Policy — `laravel_backend/app/Policies/`

| File | Keterangan |
|---|---|
| `BudgetPolicy.php` | Implementasi permission sesuai §6 gap-12 |

---

## 3. File yang Dimodifikasi (Backend)

| File | Perubahan |
|---|---|
| `laravel_backend/routes/api.php` | Tambah route group budget (lihat §5 gap-12) |
| `laravel_backend/app/Providers/AuthServiceProvider.php` | Daftarkan `BudgetPolicy` |
| Service yang handle posting transaksi journal | Tambah call ke `BudgetWarningService::check()` dan masukkan result ke `warnings[]` di response |

Untuk kolom terakhir: cari service yang dipakai untuk posting journal entries, tambah integrasi BudgetWarningService di sana. Jangan tebak nama filenya — cari dulu via grep `journal` atau `posting`.

---

## 4. Routes yang Didaftarkan

```php
// Di dalam middleware group: auth:sanctum + company.access

Route::prefix('budget-periods')->middleware('can:budgets.view')->group(function () {
    Route::get('/', [BudgetPeriodController::class, 'index']);
    Route::post('/', [BudgetPeriodController::class, 'store'])->middleware('can:budgets.manage');
    Route::get('/{id}', [BudgetPeriodController::class, 'show']);
    Route::put('/{id}', [BudgetPeriodController::class, 'update'])->middleware('can:budgets.manage');
    Route::post('/{id}/close', [BudgetPeriodController::class, 'close'])->middleware('can:budgets.manage');
    Route::get('/{id}/submissions', [BudgetSubmissionController::class, 'index']);
    Route::post('/{id}/submissions', [BudgetSubmissionController::class, 'store'])->middleware('can:budgets.submit');
    Route::get('/{id}/consolidation', [BudgetConsolidationController::class, 'show']);
});

Route::prefix('budget-submissions')->middleware(['auth:sanctum', 'company.access', 'can:budgets.view'])->group(function () {
    Route::get('/{id}', [BudgetSubmissionController::class, 'show']);
    Route::put('/{id}', [BudgetSubmissionController::class, 'update'])->middleware('can:budgets.submit');
    Route::put('/{id}/lines', [BudgetSubmissionController::class, 'updateLines'])->middleware('can:budgets.submit');
    Route::post('/{id}/submit', [BudgetSubmissionController::class, 'submit'])->middleware('can:budgets.submit');
    Route::post('/{id}/approve-head', [BudgetSubmissionController::class, 'approveHead'])->middleware('can:budgets.approve_head');
    Route::post('/{id}/approve-finance', [BudgetSubmissionController::class, 'approveFinance'])->middleware('can:budgets.approve_finance');
    Route::post('/{id}/reject', [BudgetSubmissionController::class, 'reject']);
});

// Di dalam group reports yang sudah ada
Route::get('/reports/budget/comparison', [BudgetComparisonController::class, 'show'])->middleware('can:budgets.view');
```

---

## 5. Business Rules Implementasi

**BudgetSubmissionService::updateLines()**:
- Terima array lines, replace semua lines existing dalam satu transaksi DB
- Validasi unik `(submission_id, account_id, project_id, period)` di service sebelum simpan
- Hanya bisa jika submission status `draft` atau `rejected`

**BudgetSubmissionService::reject()**:
- Set `status = draft`
- Increment `revision_number`
- Reset field approval (null semua `*_id` dan `*_at` kecuali submitted_by dan submitted_at — isi riwayat tetap ada)
- Simpan `rejected_by_id`, `rejected_at`, `rejection_note`

**BudgetConsolidationService::query()**:
- Hanya ambil submissions dengan `status = approved`
- Join ke budget_lines, group by dimensi yang diminta
- Ikuti §4 dan §5 gap-12

---

## 6. Verification

```bash
cd /workspace/laravel_backend
php artisan migrate
php artisan test --filter=Budget
vendor/bin/pint --test
```

Test minimal per endpoint:
- happy path
- unauthorized (wrong permission)
- cross-tenant (company_id mismatch)
- invalid lifecycle (edit approved submission)
- duplicate line (same account+project+period)
- auto-post flow (mocked setting)
- non-auto-post approval flow lengkap
