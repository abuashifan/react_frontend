import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BookmarkPlus } from 'lucide-react'
import { useCreateSavedReport, useShareableUsers } from '../hooks/useSavedReports'
import { reportKeyLabel } from '../constants/reportKeyRoutes'
import type { ReportParams } from '../types/reports.types'

interface Props {
  reportKey: string
  /** Params laporan aktif; null bila laporan belum dijalankan (tombol disabled). */
  params: ReportParams | null
}

export function SaveReportButton({ reportKey, params }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [shareIds, setShareIds] = useState<number[]>([])
  const create = useCreateSavedReport()
  const { data: users, isLoading: usersLoading } = useShareableUsers(open)

  const openDialog = () => {
    setName(reportKeyLabel(reportKey))
    setShareIds([])
    create.reset()
    setOpen(true)
  }

  const toggleShare = (id: number) => {
    setShareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSave = () => {
    if (!params || name.trim() === '') return
    create.mutate(
      { report_key: reportKey, name: name.trim(), params, shared_user_ids: shareIds },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" className="text-[12px]" disabled={!params} onClick={openDialog}>
        <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
        Simpan Laporan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[15px]">Simpan Laporan Ini</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="saved-report-name" className="text-[12px] font-medium text-[#64748b]">Nama Laporan</Label>
              <Input id="saved-report-name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" placeholder="mis. Neraca Saldo Juni" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-medium text-[#64748b]">Bagikan ke (opsional)</Label>
              {usersLoading && <p className="text-[12px] text-[#94a3b8]">Memuat pengguna...</p>}
              {!usersLoading && (users?.length ?? 0) === 0 && <p className="text-[12px] text-[#94a3b8]">Tidak ada pengguna lain untuk dibagikan.</p>}
              {!usersLoading && (users?.length ?? 0) > 0 && (
                <div className="max-h-40 space-y-1.5 overflow-auto rounded-md border border-[#e2e8f0] p-2">
                  {users?.map((u) => (
                    <label key={u.id} htmlFor={`share-${u.id}`} className="flex cursor-pointer items-center gap-2 text-[12px] text-[#475569]">
                      <Checkbox id={`share-${u.id}`} checked={shareIds.includes(u.id)} onCheckedChange={() => toggleShare(u.id)} />
                      <span className="font-medium text-[#334155]">{u.name || u.email}</span>
                      {u.name && u.email && <span className="text-[#94a3b8]">{u.email}</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {create.isError && <p className="text-[12px] text-red-600">Gagal menyimpan laporan. Coba lagi.</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" className="text-[13px]" onClick={() => setOpen(false)}>Batal</Button>
            <Button size="sm" className="bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]" disabled={create.isPending || name.trim() === ''} onClick={handleSave}>
              {create.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
