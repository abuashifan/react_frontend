# Spec-31 — Phase 13: Period-End Processing

**Phase**: 13  
**Tipe**: Fitur baru (halaman + service)  
**Estimasi**: 0.5 sesi  
**Referensi**: gap-03 §3C, design-N4

---

## Scope

Tambah halaman Proses Akhir Periode di modul Accounting. Satu halaman baru, service kecil, satu hook.

---

## Files yang Dibuat

```
src/modules/accounting/services/periodEndApi.ts   ← baru
src/modules/accounting/hooks/usePeriodEnd.ts      ← baru
src/modules/accounting/pages/PeriodEndPage.tsx    ← baru
```

---

## `periodEndApi.ts`

```ts
import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'

export interface PeriodEndStatus {
  period: string          // YYYY-MM
  status: 'not_run' | 'running' | 'completed' | 'reopened'
  last_run_at?: string | null
  last_run_by?: string | null
}

export interface PeriodEndChecklistItem {
  key: string
  label: string
  is_done: boolean
  is_blocker: boolean
  description?: string | null
}

export const periodEndApi = {
  getStatus: (period: string) =>
    http.get<unknown, ApiResponse<PeriodEndStatus>>(
      '/accounting/period-end/status', { params: { period } }
    ),

  getChecklist: (period: string) =>
    http.get<unknown, ApiResponse<PeriodEndChecklistItem[]>>(
      '/accounting/period-end/checklist', { params: { period } }
    ),

  run: (period: string) =>
    http.post<unknown, ApiResponse<PeriodEndStatus>>(
      '/accounting/period-end/run', { period }
    ),

  reopen: (period: string) =>
    http.post<unknown, ApiResponse<PeriodEndStatus>>(
      '/accounting/period-end/reopen', { period }
    ),
}
```

---

## `usePeriodEnd.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { periodEndApi } from '../services/periodEndApi'

export function usePeriodEndStatus(period?: string) {
  return useQuery({
    queryKey: ['period-end', 'status', period],
    queryFn: () => periodEndApi.getStatus(period!),
    enabled: !!period,
  })
}

export function usePeriodEndChecklist(period?: string) {
  return useQuery({
    queryKey: ['period-end', 'checklist', period],
    queryFn: () => periodEndApi.getChecklist(period!),
    enabled: !!period,
  })
}

export function usePeriodEndMutations() {
  const qc = useQueryClient()
  const inv = (period: string) => void qc.invalidateQueries({ queryKey: ['period-end', 'status', period] })
  return {
    run:    useMutation({ mutationFn: periodEndApi.run,    onSuccess: (_, period) => inv(period) }),
    reopen: useMutation({ mutationFn: periodEndApi.reopen, onSuccess: (_, period) => inv(period) }),
  }
}
```

---

## `PeriodEndPage.tsx` — Struktur

```tsx
export default function PeriodEndPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')  // YYYY-MM
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: statusData, isLoading: statusLoading } = usePeriodEndStatus(selectedPeriod || undefined)
  const { data: checklistData } = usePeriodEndChecklist(selectedPeriod || undefined)
  const { run, reopen } = usePeriodEndMutations()

  // Period selector: 2 select (bulan + tahun) atau input YYYY-MM
  // Status card: status badge + info terakhir dijalankan
  // Checklist: list item dengan icon ✅ ⚠️ ❌
  // Action buttons kondisional berdasarkan status
  // Konfirmasi dialog sebelum run
}
```

### Period Selector

```tsx
// Gunakan 2 select terpisah (lebih user-friendly dari input teks)
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const YEARS = [2024, 2025, 2026, 2027]  // atau generate dinamis

const [month, setMonth] = useState(new Date().getMonth() + 1)
const [year, setYear]   = useState(new Date().getFullYear())
const period = `${year}-${String(month).padStart(2, '0')}`
```

### Status Badge Colors

| Status | Warna |
|--------|-------|
| `not_run` | abu-abu |
| `running` | biru (loading indicator) |
| `completed` | hijau |
| `reopened` | amber |

### Checklist Item

```tsx
function ChecklistItem({ item }: { item: PeriodEndChecklistItem }) {
  const icon = item.is_done ? '✅' : item.is_blocker ? '❌' : '⚠️'
  return (
    <div className="flex items-start gap-3 rounded-md border border-[#e2e8f0] p-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-[13px] font-medium text-[#1e2d35]">{item.label}</p>
        {item.description && <p className="text-[11px] text-[#64748b]">{item.description}</p>}
      </div>
    </div>
  )
}
```

### Action Buttons

```tsx
<PermissionGuard permission="period_end.run" fallback={null}>
  {status === 'not_run' && (
    <Button onClick={() => setConfirmOpen(true)} disabled={hasBlockers}>
      Jalankan Proses Akhir Periode
    </Button>
  )}
</PermissionGuard>
<PermissionGuard permission="period_end.reopen" fallback={null}>
  {status === 'completed' && (
    <Button variant="outline" onClick={() => reopen.mutate(period)}>
      Buka Kembali
    </Button>
  )}
</PermissionGuard>
```

---

## Routes Update

Di `src/modules/accounting/routes.tsx`, tambah:

```tsx
{
  path: '/accounting/period-end',
  element: (
    <ProtectedRoute permission="period_end.view">
      <PeriodEndPage />
    </ProtectedRoute>
  ),
},
```

---

## moduleConfig.ts Update

Di `accounting` ribbonItems, tambah:

```ts
{ id: 'period-end', label: 'Akhir Periode', icon: CheckCircle2, path: '/accounting/period-end', permission: 'period_end.view' }
```

Import icon baru: `CheckCircle2` dari lucide-react.

---

## Build & Commit

```bash
npm run build   # harus 0 error
git commit -m "feat(accounting): phase 13 — period-end processing page"
git push
```
