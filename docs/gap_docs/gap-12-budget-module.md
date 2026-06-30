# gap-12-budget-module.md — Budget Module Design

**Status**: Selesai  
**Dibuat**: 2026-06-29  
**Referensi phase**: `prompt/prompt-phase-40-budget-backend.md`, `prompt/prompt-phase-41-budget-frontend.md`

---

## 0. Guard Rails

```
⛔ JANGAN baca docs/struktur_frontend.md
⛔ JANGAN baca laravel_backend/docs/backend-directory-tree.md
✅ Dokumen ini adalah sumber kebenaran tunggal untuk modul Budget
✅ Daftar file lengkap ada di prompt-phase-40 (backend) dan prompt-phase-41 (frontend)
```

---

## 1. Keputusan Bisnis

| Aspek | Keputusan |
|---|---|
| Alur persetujuan | Ikut setting Auto Post company. Aktif → submission langsung `approved`. Nonaktif → atasan dept → finance. |
| Revisi | Boleh. Revisi ulang alur dari awal. `revision_number` naik tiap submit ulang setelah reject. |
| Periode | Tahunan by default. Breakdown bulanan opsional — jika user isi, disimpan per `YYYY-MM`. |
| Batas anggaran | Anggaran yang disetujui IS the ceiling. Tidak ada pagu dari finance sebelum dept mengajukan. |
| Over-budget | Warning only — transaksi tetap bisa diposting, backend tambah `warnings[]` ke response. |

---

## 2. Model Data

### 2.1 `budget_periods` — satu per tahun fiskal, scope company

| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| company_id | bigint FK companies | |
| name | varchar(255) | "Anggaran 2026" |
| fiscal_year | smallint | 2026 |
| period_from | date | 2026-01-01 |
| period_to | date | 2026-12-31 |
| status | enum(open, closed) | default open |
| created_by | bigint FK users | |
| created_at, updated_at, deleted_at | | |

### 2.2 `budget_submissions` — satu per departemen per period

| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| company_id | bigint FK companies | |
| budget_period_id | bigint FK budget_periods | |
| department_id | bigint FK departments | |
| status | enum(draft, submitted, approved_by_head, approved, rejected) | default draft |
| revision_number | tinyint unsigned | default 1 |
| submitted_by_id | bigint FK users nullable | |
| submitted_at | timestamp nullable | |
| approved_by_head_id | bigint FK users nullable | |
| approved_by_head_at | timestamp nullable | |
| approved_by_finance_id | bigint FK users nullable | |
| approved_by_finance_at | timestamp nullable | |
| rejected_by_id | bigint FK users nullable | |
| rejected_at | timestamp nullable | |
| rejection_note | text nullable | |
| notes | text nullable | |
| created_by | bigint FK users | |
| created_at, updated_at, deleted_at | | |

**Unique**: `(company_id, budget_period_id, department_id)` — satu submission aktif per dept per period.

### 2.3 `budget_lines` — rincian per akun + dimensi opsional

| Kolom | Tipe | Ket |
|---|---|---|
| id | bigint PK | |
| budget_submission_id | bigint FK budget_submissions | |
| account_id | bigint FK accounts | akun COA |
| project_id | bigint FK projects nullable | null = semua proyek |
| period | char(7) nullable | YYYY-MM; null = tahunan |
| amount | decimal(20,2) | |
| notes | text nullable | |
| created_at, updated_at | | |

**Validasi unik** `(budget_submission_id, account_id, project_id, period)` di service layer — jangan constraint DB karena NULL tidak equal di MySQL.

---

## 3. Status Lifecycle

```
                    ┌─────────────────────────────────────────────┐
                    │             Auto Post AKTIF                  │
                    │  draft ──submit──► approved                  │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │             Auto Post NONAKTIF               │
                    │                                              │
                    │  draft                                       │
                    │    │                                         │
                    │  submit                                      │
                    │    ▼                                         │
                    │  submitted ◄──reject──┐                      │
                    │    │                  │                      │
                    │  approve_head         │                      │
                    │    ▼                  │                      │
                    │  approved_by_head ────┘                      │
                    │    │                                         │
                    │  approve_finance                             │
                    │    ▼                                         │
                    │  approved                                    │
                    │                                              │
                    │  reject pada tahap apapun → status draft     │
                    │  revision_number naik saat submit ulang      │
                    └─────────────────────────────────────────────┘

Period ditutup → budget_period.status = closed (bukan per-submission)
```

---

## 4. Konsolidasi — Cara Lihat

Semua submission yang `approved` dalam satu period bisa dilihat dari berbagai sudut:

| Dimensi | Cara |
|---|---|
| Anggaran perusahaan | Jumlah semua submission |
| Per departemen | Filter submission by `department_id` |
| Per proyek (lintas dept) | Filter lines by `project_id` |
| Per dept + proyek | Filter by `department_id` + `project_id` |
| Per akun | Filter lines by `account_id` |

---

## 5. API Contract

### Budget Periods

| Method | Endpoint | Permission | Ket |
|---|---|---|---|
| GET | `/budget-periods` | `budgets.view` | List (company scope) |
| POST | `/budget-periods` | `budgets.manage` | Buat period |
| GET | `/budget-periods/{id}` | `budgets.view` | Detail |
| PUT | `/budget-periods/{id}` | `budgets.manage` | Update (hanya jika open) |
| POST | `/budget-periods/{id}/close` | `budgets.manage` | Tutup period |

### Budget Submissions

| Method | Endpoint | Permission | Ket |
|---|---|---|---|
| GET | `/budget-periods/{id}/submissions` | `budgets.view` | Finance: semua; Dept: milik sendiri |
| POST | `/budget-periods/{id}/submissions` | `budgets.submit` | Buat submission (dept sendiri) |
| GET | `/budget-submissions/{id}` | `budgets.view` | Detail + lines |
| PUT | `/budget-submissions/{id}` | `budgets.submit` | Update header (draft/rejected only) |
| PUT | `/budget-submissions/{id}/lines` | `budgets.submit` | Bulk replace lines |
| POST | `/budget-submissions/{id}/submit` | `budgets.submit` | Ajukan ke approval |
| POST | `/budget-submissions/{id}/approve-head` | `budgets.approve_head` | Setujui sebagai dept head |
| POST | `/budget-submissions/{id}/approve-finance` | `budgets.approve_finance` | Setujui sebagai finance |
| POST | `/budget-submissions/{id}/reject` | `budgets.approve_head` atau `budgets.approve_finance` | Tolak → kembali draft |

### Konsolidasi

| Method | Endpoint | Ket |
|---|---|---|
| GET | `/budget-periods/{id}/consolidation` | Agregasi approved submissions |
| | `?by=department\|project\|project_department` | Dimensi breakdown |
| | `&department_id=&project_id=&account_id=` | Filter opsional |

### Laporan Realisasi vs Anggaran

| Method | Endpoint | Ket |
|---|---|---|
| GET | `/reports/budget/comparison` | Actual vs Budget |
| | `?budget_period_id=` | Wajib |
| | `&department_id=&project_id=&period_from=&period_to=` | Opsional |

---

## 6. Permissions

| Key | Deskripsi |
|---|---|
| `budgets.view` | Lihat budget (semua authenticated user) |
| `budgets.submit` | Buat dan edit submission dept sendiri |
| `budgets.approve_head` | Setujui/tolak sebagai dept head |
| `budgets.approve_finance` | Setujui/tolak sebagai finance |
| `budgets.manage` | Buat/tutup budget period |

---

## 7. Over-Budget Warning

Dipanggil saat transaksi diposting:

```
BudgetWarningService::check(
  company_id, account_id, department_id, project_id, period (YYYY-MM)
) → WarningResult|null
```

Logika:
1. Cari approved budget_line yang match (account, dept, project, period atau annual)
2. Hitung total journal entries yang sudah diposting untuk kombinasi yang sama
3. Jika total + amount_baru > budget → return warning
4. Warning ditambah ke `response.warnings[]` — TIDAK memblokir posting

---

## 8. Response Shape Referensi

### BudgetSubmission detail
```json
{
  "data": {
    "id": 1,
    "budget_period_id": 1,
    "department_id": 3,
    "department_name": "Marketing",
    "status": "draft",
    "revision_number": 1,
    "notes": null,
    "submitted_at": null,
    "lines": [
      {
        "id": 1,
        "account_id": 5,
        "account_code": "6-1001",
        "account_name": "Gaji & Upah",
        "project_id": 2,
        "project_name": "Wedding Package",
        "period": null,
        "amount": "10000000.00",
        "notes": null
      }
    ]
  }
}
```

### Consolidation
```json
{
  "data": {
    "budget_period": { "id": 1, "name": "Anggaran 2026", "fiscal_year": 2026 },
    "breakdown_by": "department",
    "rows": [
      {
        "department_id": 3,
        "department_name": "Marketing",
        "accounts": [
          { "account_id": 5, "account_name": "Gaji & Upah", "total_amount": "18000000.00" }
        ],
        "total_amount": "18000000.00"
      }
    ],
    "grand_total": "50000000.00"
  }
}
```

### Budget Comparison (Actual vs Budget)
```json
{
  "data": {
    "period": { "budget_period_id": 1, "name": "Anggaran 2026" },
    "rows": [
      {
        "account_id": 5,
        "account_name": "Gaji & Upah",
        "budget_amount": "18000000.00",
        "actual_amount": "15000000.00",
        "variance": "3000000.00",
        "variance_pct": 16.67,
        "over_budget": false
      }
    ],
    "totals": {
      "budget_amount": "50000000.00",
      "actual_amount": "42000000.00",
      "variance": "8000000.00"
    }
  }
}
```
