import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency } from '@/lib/utils'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { budgetApi } from '../services/budgetApi'
import type { BudgetAllocation } from '../types/budget.types'

interface Props {
  periodId: number
}

/**
 * Tab "Pagu Departemen" di halaman detail periode. Menampilkan pagu top-down
 * (Gap A) — root (pagu perusahaan, `department_id: null`) dan anak-anaknya
 * (pagu per departemen) — dan memberi jalan menambah/menyesuaikan pagu
 * SETELAH periode dibuat, di luar form gabungan.
 *
 * Periode yang dibuat sebelum fitur ini ada tidak akan punya baris sama
 * sekali — ditangani lewat state kosong yang menawarkan bikin root dulu,
 * bukan error atau tabel kosong tanpa penjelasan.
 */
export function BudgetAllocationPanel({ periodId }: Props) {
  const { can } = usePermission()
  const { toast } = useToast()
  const qc = useQueryClient()
  const queryKey = ['budget', 'allocations', periodId]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => budgetApi.listAllocations(periodId),
  })
  const rows: BudgetAllocation[] = data?.data ?? []
  const root = rows.find((r) => r.department_id === null) ?? null
  const departmentRows = rows.filter((r) => r.department_id !== null)

  const invalidate = () => void qc.invalidateQueries({ queryKey })

  // --- Dialog "Pagu Perusahaan" (buat root kalau belum ada, atau ubah root
  //     yang sudah ada) ---
  const [rootDialogOpen, setRootDialogOpen] = useState(false)
  const [rootAmount, setRootAmount] = useState('')

  const openRootDialog = () => {
    setRootAmount(root ? root.amount : '')
    setRootDialogOpen(true)
  }

  const saveRootMut = useMutation({
    mutationFn: () =>
      root
        ? budgetApi.updateAllocation(root.id, { amount: parseFloat(rootAmount) || 0 })
        : budgetApi.createAllocation(periodId, {
            department_id: null,
            parent_allocation_id: null,
            amount: parseFloat(rootAmount) || 0,
          }),
    onSuccess: () => {
      setRootDialogOpen(false)
      invalidate()
      toast.success('Pagu perusahaan tersimpan.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Gagal menyimpan pagu perusahaan.')),
  })

  // --- Dialog "Pagu Departemen" (tambah baru / ubah baris yang sudah ada) ---
  const [deptDialogOpen, setDeptDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<BudgetAllocation | null>(null)
  const [deptId, setDeptId] = useState<number | null>(null)
  const [deptAmount, setDeptAmount] = useState('')
  const [deptNotes, setDeptNotes] = useState('')
  const searchDept = useCallback((q: string) => departemenApi.search(q), [])

  const openAddDeptDialog = () => {
    setEditingRow(null)
    setDeptId(null)
    setDeptAmount('')
    setDeptNotes('')
    setDeptDialogOpen(true)
  }

  const openEditDeptDialog = (row: BudgetAllocation) => {
    setEditingRow(row)
    setDeptId(row.department_id)
    setDeptAmount(row.amount)
    setDeptNotes(row.notes ?? '')
    setDeptDialogOpen(true)
  }

  const saveDeptMut = useMutation({
    mutationFn: () => {
      const amount = parseFloat(deptAmount) || 0

      if (editingRow) {
        return budgetApi.updateAllocation(editingRow.id, { amount, notes: deptNotes || null })
      }

      if (!root) throw new Error('Pagu perusahaan belum dibuat.')

      return budgetApi.createAllocation(periodId, {
        department_id: deptId as number,
        parent_allocation_id: root.id,
        amount,
        notes: deptNotes || undefined,
      })
    },
    onSuccess: () => {
      setDeptDialogOpen(false)
      invalidate()
      toast.success('Pagu departemen tersimpan.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Gagal menyimpan pagu departemen.')),
  })

  if (isLoading) {
    return <div className="py-8 text-center text-[13px] text-[#64748b]">Memuat pagu...</div>
  }

  return (
    <div className="space-y-3">
      {!root ? (
        <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center">
          <p className="text-[13px] text-[#64748b]">
            Periode ini belum punya pagu. Pagu biasanya diisi bersamaan saat periode dibuat — tambahkan pagu
            perusahaan di sini untuk mulai mengalokasikan ke departemen.
          </p>
          {can('budgets.manage') && (
            <Button size="sm" className="mt-3 text-[12px]" onClick={openRootDialog}>
              Buat Pagu Perusahaan
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
            <div>
              <p className="text-[11px] text-[#64748b]">Total Pagu Perusahaan</p>
              <p className="text-[16px] font-bold tabular-nums text-[#1e293b]">{formatCurrency(parseFloat(root.amount))}</p>
            </div>
            {can('budgets.manage') && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-[12px]" onClick={openRootDialog}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Ubah
                </Button>
                <Button size="sm" className="text-[12px]" onClick={openAddDeptDialog}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Pagu Departemen
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#1e293b]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Departemen</th>
                  <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Pagu</th>
                  <th className="w-16 px-3 py-2" aria-label="Aksi" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {departmentRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                      Belum ada pagu departemen.
                    </td>
                  </tr>
                )}
                {departmentRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-1.5 text-[#334155]">
                      {row.department?.name ?? `Dept #${row.department_id}`}
                      {row.department?.code && <span className="text-[#94a3b8]"> ({row.department.code})</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.amount))}</td>
                    <td className="px-3 py-1.5 text-center">
                      {can('budgets.manage') && (
                        <button
                          type="button"
                          onClick={() => openEditDeptDialog(row)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-[#94a3b8] hover:bg-[#eef2f6] hover:text-[#334155]"
                          aria-label={`Ubah pagu ${row.department?.name ?? ''}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={rootDialogOpen} onOpenChange={setRootDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{root ? 'Ubah Pagu Perusahaan' : 'Buat Pagu Perusahaan'}</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">
              Pagu ini jadi batas atas total pagu seluruh departemen di periode ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 pt-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah</Label>
            <Input type="number" min={0} value={rootAmount} onChange={(e) => setRootAmount(e.target.value)} className="tabular-nums" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => setRootDialogOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              className="h-8 text-[13px]"
              disabled={saveRootMut.isPending}
              onClick={() => saveRootMut.mutate()}
            >
              {saveRootMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingRow ? 'Ubah Pagu Departemen' : 'Tambah Pagu Departemen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Departemen</Label>
              {editingRow ? (
                <p className="text-[13px] text-[#1e293b]">{editingRow.department?.name}</p>
              ) : (
                <SearchableSelect value={deptId} onChange={setDeptId} onSearch={searchDept} placeholder="Cari departemen..." size="sm" />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah</Label>
              <Input type="number" min={0} value={deptAmount} onChange={(e) => setDeptAmount(e.target.value)} className="tabular-nums" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan (opsional)</Label>
              <Textarea value={deptNotes} onChange={(e) => setDeptNotes(e.target.value)} rows={2} className="text-[12px]" />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => setDeptDialogOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              className="h-8 text-[13px]"
              disabled={(!editingRow && deptId === null) || saveDeptMut.isPending}
              onClick={() => saveDeptMut.mutate()}
            >
              {saveDeptMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
