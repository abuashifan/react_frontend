# Prompt — Phase 13: Period-End Processing

**Phase**: 13  
**Estimasi**: 0.5 sesi  
**Dependencies**: Phase 12 harus selesai  
**Referensi**: `docs/praproduction_docs/spec-31-period-end-module.md`

---

## Tugas

Tambah halaman Proses Akhir Periode di modul Accounting. Satu halaman baru dengan service + hook kecil.

**Baca dulu sebelum mulai:**
1. `docs/gap_docs/gap-03-missing-modules.md` §3C — Period-End gap
2. `docs/design_docs/design-N4-period-end.md` — desain halaman
3. `docs/praproduction_docs/spec-31-period-end-module.md` — full spec

---

## Context

Backend sudah ada endpoint `/accounting/period-end/*` tapi frontend belum ada halaman. Ini adalah halaman sederhana dengan period selector + checklist + action buttons.

---

## File yang Dibuat Baru

```
src/modules/accounting/services/periodEndApi.ts
src/modules/accounting/hooks/usePeriodEnd.ts
src/modules/accounting/pages/PeriodEndPage.tsx
```

---

## File yang Diubah

```
src/modules/accounting/routes.tsx    ← tambah route /accounting/period-end
src/router/moduleConfig.ts           ← tambah ribbon item ke accounting
```

---

## Urutan Pekerjaan

### Step 1 — `periodEndApi.ts`

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

### Step 2 — `usePeriodEnd.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { periodEndApi } from '../services/periodEndApi'

export function usePeriodEndStatus(period?: string) {
  return useQuery({
    queryKey: ['period-end', 'status', period],
    queryFn:  () => periodEndApi.getStatus(period!),
    enabled:  !!period,
  })
}

export function usePeriodEndChecklist(period?: string) {
  return useQuery({
    queryKey: ['period-end', 'checklist', period],
    queryFn:  () => periodEndApi.getChecklist(period!),
    enabled:  !!period,
  })
}

export function usePeriodEndMutations() {
  const qc = useQueryClient()
  const inv = (period: string) =>
    void qc.invalidateQueries({ queryKey: ['period-end', 'status', period] })
  return {
    run:    useMutation({ mutationFn: periodEndApi.run,    onSuccess: (_, p) => inv(p) }),
    reopen: useMutation({ mutationFn: periodEndApi.reopen, onSuccess: (_, p) => inv(p) }),
  }
}
```

### Step 3 — `PeriodEndPage.tsx`

**Layout**: `WorkspaceLayout` dengan judul "Proses Akhir Periode"

**Period Selector** — 2 select: bulan + tahun → combine ke YYYY-MM:
```tsx
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember']
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i)

const [month, setMonth] = useState(new Date().getMonth() + 1)
const [year, setYear]   = useState(new Date().getFullYear())
const period = `${year}-${String(month).padStart(2, '0')}`
```

**Status Card** — ditampilkan hanya jika `period` sudah dipilih:

| Status | Badge | Tampilan tambahan |
|--------|-------|-------------------|
| `not_run` | abu-abu "Belum Dijalankan" | — |
| `running` | biru "Sedang Berjalan" | loading indicator |
| `completed` | hijau "Selesai" | waktu + user terakhir |
| `reopened` | amber "Dibuka Kembali" | waktu + user terakhir |

**Checklist** — ditampilkan di bawah status card:
```tsx
function ChecklistItem({ item }: { item: PeriodEndChecklistItem }) {
  const icon = item.is_done ? '✅' : item.is_blocker ? '❌' : '⚠️'
  return (
    <div className="flex items-start gap-3 rounded-md border border-[#e2e8f0] p-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-[13px] font-medium text-[#1e2d35]">{item.label}</p>
        {item.description && (
          <p className="text-[11px] text-[#64748b]">{item.description}</p>
        )}
        {item.is_blocker && !item.is_done && (
          <p className="text-[11px] text-red-500 font-medium mt-0.5">Wajib diselesaikan sebelum proses</p>
        )}
      </div>
    </div>
  )
}
```

**Action Buttons**:
```tsx
// Hitung apakah ada blocker yang belum selesai:
const hasBlockers = checklist?.some(i => i.is_blocker && !i.is_done) ?? false

// Run button: tampil jika status === 'not_run' atau 'reopened'
<PermissionGuard permission="period_end.run" fallback={null}>
  {(status === 'not_run' || status === 'reopened') && (
    <Button
      onClick={() => setConfirmOpen(true)}
      disabled={hasBlockers || run.isPending}
    >
      Jalankan Proses Akhir Periode
    </Button>
  )}
</PermissionGuard>

// Reopen button: tampil jika status === 'completed'
<PermissionGuard permission="period_end.reopen" fallback={null}>
  {status === 'completed' && (
    <Button
      variant="outline"
      onClick={() => reopen.mutate(period)}
      disabled={reopen.isPending}
    >
      Buka Kembali
    </Button>
  )}
</PermissionGuard>
```

**Confirm Dialog** sebelum run:
```tsx
<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Konfirmasi Proses Akhir Periode</DialogTitle>
    </DialogHeader>
    <p>Proses akhir periode {month}/{year} akan dijalankan. Apakah Anda yakin?</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
      <Button
        onClick={() => { run.mutate(period); setConfirmOpen(false) }}
        disabled={run.isPending}
      >
        Jalankan
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Step 4 — Routes Update

Di `src/modules/accounting/routes.tsx`, tambahkan:
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

Import `PeriodEndPage` dari `'./pages/PeriodEndPage'`.

### Step 5 — ModuleConfig Update

Di `src/router/moduleConfig.ts`, accounting ribbonItems tambahkan:
```ts
{
  id: 'period-end',
  label: 'Akhir Periode',
  icon: CheckCircle2,
  path: '/accounting/period-end',
  permission: 'period_end.view'
}
```

Pastikan import `CheckCircle2` dari lucide-react ditambahkan.

### Step 6 — Verify Build & Commit

```bash
cd /workspace/frontend
npm run build   # harus 0 error

# Update docs/struktur_frontend.md dengan 3 file baru

rtk git add src/modules/accounting/services/periodEndApi.ts
rtk git add src/modules/accounting/hooks/usePeriodEnd.ts
rtk git add src/modules/accounting/pages/PeriodEndPage.tsx
rtk git add src/modules/accounting/routes.tsx
rtk git add src/router/moduleConfig.ts
rtk git add docs/struktur_frontend.md
rtk git commit -m "feat(accounting): phase 13 — period-end processing page"
rtk git push
```

---

## Hal yang Harus Diperhatikan

1. **`period` selalu berbentuk YYYY-MM** — pad month dengan `padStart(2, '0')`
2. **enabled: !!period** di kedua queries — jangan fetch saat period belum dipilih
3. **PermissionGuard** — kedua action button harus dibungkus permission guard
4. **Tidak ada tombol Export** — period-end tidak punya halaman export
5. **Update `docs/struktur_frontend.md`** setelah membuat file baru
