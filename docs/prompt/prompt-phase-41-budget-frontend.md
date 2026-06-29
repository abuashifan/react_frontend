# Prompt — Phase 41: Budget Module Frontend

**Phase**: 41  
**Dependency**: Phase 40 (backend) harus selesai dan verified  
**Status**: Planned  
**Konteks**: `../gap_docs/gap-12-budget-module.md` ← baca ini dulu  
**Frontend**: `/workspace/frontend/` (alias `/home/user/react_frontend/`)

---

## 0. Guard Rails

```
⛔ JANGAN baca docs/struktur_frontend.md — daftar file ada di dokumen ini
⛔ JANGAN baca laravel_backend/docs/backend-directory-tree.md
✅ Baca gap-12-budget-module.md untuk business rules, data model, API, response shape
✅ Baca AGENTS.md di root frontend sebelum mulai
✅ UPDATE docs/struktur_frontend.md SETELAH implementasi selesai (jangan baca sebelumnya)
```

---

## 1. Baca Sebelum Mulai

```
docs/gap_docs/gap-12-budget-module.md       ← sumber kebenaran (rules, API, shape)
AGENTS.md                                   ← frontend coding rules
```

---

## 2. Module Baru: `src/modules/budget/`

### 2.1 Types — `src/modules/budget/types/budget.types.ts`

Definisikan:

```typescript
export type BudgetPeriodStatus = 'open' | 'closed'
export type BudgetSubmissionStatus = 'draft' | 'submitted' | 'approved_by_head' | 'approved' | 'rejected'

export interface BudgetPeriod { ... }
export interface BudgetSubmission { ... }   // include lines: BudgetLine[]
export interface BudgetLine { ... }
export interface BudgetConsolidationRow { ... }
export interface BudgetConsolidation { ... }
export interface BudgetComparisonRow { ... }
export interface BudgetComparison { ... }
export interface BudgetParams { budget_period_id?: number; department_id?: number; project_id?: number; ... }
```

Shape sesuai §8 gap-12. Semua field dari API contract §5 gap-12 harus typed — jangan `any`.

### 2.2 Service — `src/modules/budget/services/budgetApi.ts`

Satu file, semua API call modul budget. Ikuti pola `reportsApi.ts` yang sudah ada (axios + typed return).

```typescript
export const budgetApi = {
  // Periods
  listPeriods: (params?) => ...,
  createPeriod: (data) => ...,
  getPeriod: (id) => ...,
  updatePeriod: (id, data) => ...,
  closePeriod: (id) => ...,

  // Submissions
  listSubmissions: (periodId, params?) => ...,
  createSubmission: (periodId, data) => ...,
  getSubmission: (id) => ...,
  updateSubmission: (id, data) => ...,
  updateLines: (id, lines) => ...,
  submit: (id) => ...,
  approveHead: (id) => ...,
  approveFinance: (id) => ...,
  reject: (id, note) => ...,

  // Consolidation
  getConsolidation: (periodId, params?) => ...,

  // Reports
  getComparison: (params) => ...,
}
```

### 2.3 Routes — `src/modules/budget/routes.tsx`

```typescript
export const budgetRoutes = [
  { path: '/budget', element: wrap(<BudgetPeriodListPage />) },
  { path: '/budget/periods/new', element: wrap(<BudgetPeriodFormPage />) },
  { path: '/budget/periods/:id', element: wrap(<BudgetPeriodDetailPage />) },
  { path: '/budget/submissions/:id', element: wrap(<BudgetSubmissionPage />) },
]
```

`wrap()` = `ProtectedRoute` dengan permission `budgets.view` minimum. Action-specific permission dicek di dalam komponen.

---

## 3. Pages — `src/modules/budget/pages/`

### `BudgetPeriodListPage.tsx`
- WorkspaceLayout title "Anggaran"
- Tabel: Name, Fiscal Year, Status, Jumlah Submission, Aksi
- Tombol "Buat Period" hanya jika `budgets.manage`
- TanStack Query: `budgetApi.listPeriods()`
- Query key: `['budget', 'periods']`

### `BudgetPeriodFormPage.tsx`
- Form: Name, Fiscal Year, Period From, Period To
- React Hook Form + Zod
- Submit → `budgetApi.createPeriod()` → invalidate `['budget', 'periods']`
- Hanya accessible jika `budgets.manage`

### `BudgetPeriodDetailPage.tsx`
- Tab 1: **Submissions** — list semua submission dept dengan status badge + aksi
  - Finance: lihat semua dept; Dept: hanya milik sendiri
  - Tombol "Ajukan Anggaran" → `/budget/submissions/new?period_id={id}` atau langsung buat
- Tab 2: **Konsolidasi** — `BudgetConsolidationTable` dengan filter dimensi
  - Hanya tampil jika ada minimal satu submission `approved`
- Query key: `['budget', 'period', id]`, `['budget', 'submissions', periodId]`

### `BudgetSubmissionPage.tsx`
- WorkspaceLayout title "Pengajuan Anggaran — {dept name}"
- Header: info period, dept, status, revision number
- `BudgetLineEditor` untuk input/edit lines (hanya jika status `draft` atau `rejected`)
- `BudgetApprovalActions` untuk tombol submit/approve/reject
- Query key: `['budget', 'submission', id]`

---

## 4. Components — `src/modules/budget/components/`

### `BudgetStatusBadge.tsx`
Props: `status: BudgetSubmissionStatus`

| Status | Warna |
|---|---|
| draft | abu (slate) |
| submitted | kuning (amber) |
| approved_by_head | biru |
| approved | hijau |
| rejected | merah |

Ikuti pola `StatusBadge` yang sudah ada di shared components.

### `BudgetLineEditor.tsx`
Props: `submissionId: number`, `lines: BudgetLine[]`, `readonly?: boolean`

- Tabel dengan baris per line: Akun (searchable select), Proyek (searchable select, nullable), Periode (nullable), Nominal
- Tombol tambah baris, hapus baris
- Save: call `budgetApi.updateLines()` (bulk replace)
- `readonly=true` jika status bukan draft/rejected
- Angka pakai `tabular-nums`

### `BudgetApprovalActions.tsx`
Props: `submission: BudgetSubmission`, `onActionSuccess: () => void`

Tampilkan tombol berdasarkan kombinasi `status` + permission user:

| Status | Permission | Tombol Tampil |
|---|---|---|
| draft | budgets.submit | Submit |
| submitted | budgets.approve_head | Setujui (Head), Tolak |
| approved_by_head | budgets.approve_finance | Setujui (Finance), Tolak |
| rejected | budgets.submit | (hint revisi, edit form aktif) |
| approved | — | (read-only badge saja) |

### `BudgetConsolidationTable.tsx`
Props: `periodId: number`

- Filter: breakdown by (`department` | `project` | `project_department`)
- Filter: department, project, account (opsional)
- Tabel: kolom sesuai breakdown, amount kanan, `tabular-nums`
- TanStack Query: `budgetApi.getConsolidation(periodId, params)`
- Query key: `['budget', 'consolidation', periodId, params]`

---

## 5. Laporan: Realisasi vs Anggaran

### Page — `src/modules/budget/pages/BudgetComparisonPage.tsx`
- WorkspaceLayout title "Realisasi vs Anggaran"
- Breadcrumb: `[Laporan, Realisasi vs Anggaran]`
- Filter: Budget Period (select), Dept (opsional), Proyek (opsional), Rentang bulan
- Tabel: Akun | Anggaran | Realisasi | Selisih | % | Over?
  - Baris dengan `over_budget: true` → highlight merah ringan
  - Semua angka `tabular-nums`
- Baris total di bawah

Route: `/reports/budget/comparison`
Query key: `['reports', 'budget-comparison', params]`
Service: tambahkan method `getComparison()` ke `budgetApi.ts` (bukan `reportsApi.ts`)

---

## 6. File yang Dimodifikasi (Frontend)

| File | Perubahan |
|---|---|
| `src/router.tsx` (atau file router utama) | Import dan spread `budgetRoutes` |
| `src/modules/reports/routes.tsx` | Tambah route `/reports/budget/comparison` → `BudgetComparisonPage` |
| `src/modules/reports/pages/ReportIndexPage.tsx` | Tambah card "Realisasi vs Anggaran" ke seksi yang sesuai |
| `docs/struktur_frontend.md` | Update setelah semua file dibuat |

Untuk file router utama — cari via grep `createBrowserRouter` atau `createHashRouter` di `src/`, jangan baca direktori.

---

## 7. TanStack Query Keys — Standar Modul Budget

```typescript
['budget', 'periods']                            // list periods
['budget', 'period', id]                         // single period
['budget', 'submissions', periodId]              // list submissions for period
['budget', 'submission', id]                     // single submission + lines
['budget', 'consolidation', periodId, params]    // consolidation view
['reports', 'budget-comparison', params]         // actual vs budget
```

---

## 8. Verification

```bash
cd /workspace/frontend
npm run build    # wajib 0 error
npm run lint
```

Manual checks:
- Finance bisa lihat semua submission di BudgetPeriodDetailPage
- Dept hanya lihat submission milik sendiri
- BudgetLineEditor disabled ketika status bukan draft/rejected
- BudgetApprovalActions tampilkan tombol yang tepat per status + permission
- Tombol "Buat Period" tidak muncul jika tidak punya `budgets.manage`
- BudgetComparisonPage baris over-budget ter-highlight
- Semua angka pakai tabular-nums
- Tidak ada `any` tanpa justifikasi
