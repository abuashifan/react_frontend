import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/shared/table/DataTable'
import type { ColumnDef, PaginationState } from '@/components/shared/table/DataTable'
import { LineItemsTable } from '@/components/shared/form/LineItemsTable'
import type { CoaAccountType, CoaTemplateAccountInput, CoaTemplateDef } from '../types/setup.types'

interface CoaTemplateModalProps {
  open: boolean
  onClose: () => void
  template: CoaTemplateDef | undefined
  /** Draft hasil edit sebelumnya (kalau ada) -- null berarti masih apa adanya dari template. */
  customAccounts: CoaTemplateAccountInput[] | null
  /** Dipanggil saat user Simpan di mode Edit. `null` = kembalikan ke template asli (belum pernah dipakai saat ini, disediakan untuk simetri). */
  onSave: (accounts: CoaTemplateAccountInput[] | null) => void
}

const TYPE_LABELS: Record<CoaAccountType, string> = {
  asset: 'Aset',
  liability: 'Kewajiban',
  equity: 'Modal',
  revenue: 'Pendapatan',
  expense: 'Beban',
}

const PAGE_SIZE = 25
const INDENT_PX = 16

interface PreviewRow extends CoaTemplateAccountInput {
  id: string
  depth: number
}

/** Hitung kedalaman tiap baris dari rantai `parent_code` -- aman satu-pass karena draft selalu terurut induk lebih dulu. */
function withDepth(accounts: CoaTemplateAccountInput[]): PreviewRow[] {
  const depthByCode: Record<string, number> = {}
  return accounts.map((account) => {
    const depth = account.parent_code ? (depthByCode[account.parent_code] ?? 0) + 1 : 0
    depthByCode[account.code] = depth
    return { ...account, id: account.code, depth }
  })
}

/**
 * Preview + editor template COA untuk Step "Template COA" wizard.
 *
 * Mode preview: daftar lengkap akun template (bukan cuplikan), scrollable/
 * paginated lewat `DataTable` yang sama dipakai halaman daftar -- kasus
 * pemakaian pertama dengan data in-memory (bukan query-driven) karena data
 * template statis dan terbatas (~30-45 baris), beda dari `CoaListPage` yang
 * sengaja tidak memuat seluruh company COA sekaligus karena bisa ratusan baris.
 *
 * Mode edit: `LineItemsTable` (dipakai ulang, generik atas tipe apa pun) untuk
 * tambah/hapus/ubah baris. Pilihan "Induk" dibatasi ke kode yang sudah ada
 * SEBELUM baris ini di daftar, supaya urutan induk-lebih-dulu yang dibutuhkan
 * `CoaTemplateService::applyTemplate()` tetap terjaga tanpa validasi tambahan.
 */
export function CoaTemplateModal({ open, onClose, template, customAccounts, onSave }: CoaTemplateModalProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const [draft, setDraft] = useState<CoaTemplateAccountInput[]>([])
  const [page, setPage] = useState(0)

  // Reset draft/mode/page saat dialog dibuka -- pola render-phase adjust-state
  // (bukan useEffect) supaya tidak ada render "basi" sebelum reset diterapkan.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setDraft(customAccounts ?? template?.accounts ?? [])
      setMode('preview')
      setPage(0)
    }
  }

  const previewRows = withDepth(draft)
  const pagedRows = previewRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleClose = () => {
    onClose()
  }

  const handleCancelEdit = () => {
    setDraft(customAccounts ?? template?.accounts ?? [])
    setMode('preview')
  }

  const handleSaveEdit = () => {
    onSave(draft)
    setMode('preview')
  }

  const previewColumns: ColumnDef<PreviewRow>[] = [
    {
      id: 'code',
      header: 'Kode',
      size: 110,
      meta: { className: 'px-2 tabular-nums font-mono', headerClassName: 'px-2' },
      cell: ({ original }) => (
        <span style={{ paddingLeft: `${original.depth * INDENT_PX}px` }}>{original.code}</span>
      ),
    },
    {
      id: 'name',
      header: 'Nama Akun',
      size: 260,
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => original.name,
    },
    {
      id: 'type',
      header: 'Tipe',
      size: 110,
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => TYPE_LABELS[original.type],
    },
  ]

  const pagination: PaginationState = { pageIndex: page, pageSize: PAGE_SIZE }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[720px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-[#d9e2e5] bg-[#326273] px-4 py-2.5">
          <DialogTitle className="text-[14px] font-semibold text-white">
            {mode === 'preview' ? 'Preview COA' : 'Edit COA'} — {template?.label ?? ''}
          </DialogTitle>
        </DialogHeader>

        {mode === 'preview' ? (
          <div className="min-h-0 flex-1 px-4 py-3">
            <div className="h-[360px] [@media(max-height:620px)]:h-[220px]">
              <DataTable
                data={pagedRows}
                columns={previewColumns}
                totalRows={previewRows.length}
                pagination={pagination}
                onPaginationChange={(next) => setPage(next.pageIndex)}
                emptyTitle="Template ini belum punya akun"
                emptyDescription="Klik Edit untuk menambah akun secara manual."
              />
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <LineItemsTable<CoaTemplateAccountInput>
              items={draft}
              onAdd={() => setDraft((prev) => [...prev, { code: '', name: '', type: 'asset', parent_code: null }])}
              onRemove={(index) => setDraft((prev) => prev.filter((_, i) => i !== index))}
              onUpdate={(index, field, value) =>
                setDraft((prev) =>
                  prev.map((row, i) => {
                    if (i !== index) return row
                    const next = { ...row, [field]: value }
                    if (field === 'type' && value !== 'asset') next.is_cash_bank = false
                    return next
                  }),
                )
              }
              addLabel="+ Tambah Akun"
              emptyLabel="Belum ada akun -- klik + Tambah Akun"
              columns={[
                {
                  id: 'code',
                  header: 'Kode',
                  width: 90,
                  render: ({ item, onUpdate }) => (
                    <Input
                      value={item.code}
                      onChange={(e) => onUpdate('code', e.target.value)}
                      className="h-8 text-[12px]"
                      placeholder="1100"
                    />
                  ),
                },
                {
                  id: 'name',
                  header: 'Nama Akun',
                  width: 220,
                  render: ({ item, onUpdate }) => (
                    <Input
                      value={item.name}
                      onChange={(e) => onUpdate('name', e.target.value)}
                      className="h-8 text-[12px]"
                      placeholder="Nama akun"
                    />
                  ),
                },
                {
                  id: 'type',
                  header: 'Tipe',
                  width: 140,
                  render: ({ item, onUpdate }) => (
                    <Select value={item.type} onValueChange={(value) => onUpdate('type', value)}>
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(TYPE_LABELS) as [CoaAccountType, string][]).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-[12px]">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ),
                },
                {
                  id: 'parent_code',
                  header: 'Induk',
                  width: 160,
                  render: ({ item, index, onUpdate }) => {
                    const availableParents = draft.slice(0, index).filter((row) => row.code !== '')
                    return (
                      <Select
                        value={item.parent_code ?? '__none__'}
                        onValueChange={(value) => onUpdate('parent_code', value === '__none__' ? null : value)}
                      >
                        <SelectTrigger className="h-8 text-[12px]">
                          <SelectValue placeholder="Tanpa induk" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-[12px]">Tanpa induk</SelectItem>
                          {availableParents.map((row) => (
                            <SelectItem key={row.code} value={row.code} className="text-[12px]">
                              {row.code} — {row.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  },
                },
                {
                  id: 'is_cash_bank',
                  header: 'Kas/Bank',
                  width: 70,
                  align: 'center',
                  render: ({ item, onUpdate }) => (
                    <Checkbox
                      checked={!!item.is_cash_bank}
                      disabled={item.type !== 'asset'}
                      onCheckedChange={(checked) => onUpdate('is_cash_bank', checked === true)}
                      aria-label="Tandai sebagai akun kas/bank"
                    />
                  ),
                },
              ]}
            />
          </div>
        )}

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-[#d9e2e5] px-4 py-2.5">
          <span className="text-[12px] text-[#64748b]">
            {mode === 'preview' ? `${draft.length} akun` : 'Kode Induk harus sudah ada di baris sebelumnya.'}
          </span>
          <div className="flex items-center gap-2">
            {mode === 'preview' ? (
              <>
                <Button type="button" variant="outline" onClick={handleClose} className="h-8 px-4 text-[13px]">
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="h-8 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
                >
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="h-8 px-4 text-[13px]">
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  className="h-8 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
                >
                  Simpan
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
