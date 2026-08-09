import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/table/DataTable'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { coaApi } from '../services/coaApi'
import type { Coa } from '../types/coa.types'

interface AccountPickerDialogProps {
  open: boolean
  onClose: () => void
  /** Dipanggil saat Simpan, berisi akun terpilih sesuai urutan pemilihan. */
  onConfirm: (accounts: Coa[]) => void
  title?: string
}

const PAGE_SIZE = 25

/**
 * Dialog pemilih akun dengan filter No Akun / Nama Akun terpisah.
 *
 * Menggantikan dropdown pencarian di dalam sel tabel untuk kasus pemilihan
 * akun: dropdown sempit selebar sel sulit dibaca (kode dan nama akun berdesakan
 * di satu baris) dan hanya bisa memilih satu akun per interaksi. Dialog ini
 * memakai `DataTable` yang sama dengan halaman daftar, jadi checkbox,
 * paginasi, empty state, dan gaya tabelnya konsisten.
 *
 * Seleksi bertahan lintas halaman: yang dikirim `DataTable` hanya seleksi
 * halaman aktif, jadi id dari halaman lain digabung kembali di sini — tanpa itu
 * "pilih semua" di halaman 2 akan menghapus pilihan di halaman 1.
 */
export function AccountPickerDialog({
  open,
  onClose,
  onConfirm,
  title = 'Data Akun',
}: AccountPickerDialogProps) {
  const [codeInput, setCodeInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [applied, setApplied] = useState({ code: '', name: '' })
  const [page, setPage] = useState(0)
  // Akun terpilih disimpan utuh (bukan hanya id) supaya baris yang dipilih di
  // halaman lain tetap bisa dikembalikan saat Simpan walau sudah tidak ada di
  // data halaman aktif.
  const [selected, setSelected] = useState<Coa[]>([])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['master-data', 'chart-of-accounts', 'picker', applied, page],
    queryFn: () =>
      coaApi.list({
        page: page + 1,
        per_page: PAGE_SIZE,
        account_code: applied.code || undefined,
        account_name: applied.name || undefined,
        is_active: true,
      }),
    enabled: open,
  })

  const rows = useMemo(() => data?.data ?? [], [data])

  const pageIds = rows.map((account) => String(account.id))
  const selectedOnPage = selected
    .map((account) => String(account.id))
    .filter((id) => pageIds.includes(id))

  const resetAll = () => {
    setCodeInput('')
    setNameInput('')
    setApplied({ code: '', name: '' })
    setPage(0)
    setSelected([])
  }

  const handleSearch = () => {
    setApplied({ code: codeInput.trim(), name: nameInput.trim() })
    setPage(0)
  }

  const handleRowSelect = (nextOnPage: string[]) => {
    const fromOtherPages = selected.filter((account) => !pageIds.includes(String(account.id)))
    const pickedOnPage = nextOnPage
      .map((id) => rows.find((account) => String(account.id) === id))
      .filter((account): account is Coa => Boolean(account))

    setSelected([...fromOtherPages, ...pickedOnPage])
  }

  const handleConfirm = () => {
    onConfirm(selected)
    handleClose()
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const columns: ColumnDef<Coa>[] = [
    {
      id: 'account_code',
      header: 'No Akun',
      size: 130,
      meta: { className: 'px-2 tabular-nums', headerClassName: 'px-2' },
      cell: ({ original }) => original.account_code,
    },
    {
      id: 'account_name',
      header: 'Nama Akun',
      size: 260,
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => original.account_name,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[640px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-[#d9e2e5] bg-[#326273] px-4 py-2.5">
          <DialogTitle className="text-[14px] font-semibold text-white">{title}</DialogTitle>
        </DialogHeader>

        {/* Filter — dua kolom terpisah, dikirim ke server sebagai AND */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-2.5">
          <Input
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            placeholder="No Akun"
            aria-label="Filter nomor akun"
            className="h-8 w-[150px] text-[12px]"
          />
          <Input
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            placeholder="Nama Akun"
            aria-label="Filter nama akun"
            className="h-8 w-[190px] text-[12px]"
          />
          <Button type="button" onClick={handleSearch} className="h-8 bg-[#5c9ead] px-4 text-[12px] hover:bg-[#4a8a9b]">
            Cari
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCodeInput('')
              setNameInput('')
              setApplied({ code: '', name: '' })
              setPage(0)
            }}
            className="h-8 px-4 text-[12px]"
          >
            Reset
          </Button>
        </div>

        <div className="min-h-0 flex-1 px-4 py-3">
          <div className="h-[320px] [@media(max-height:620px)]:h-[220px]">
            <DataTable
              data={rows}
              columns={columns}
              totalRows={data?.meta.total ?? 0}
              isLoading={isLoading}
              isFetching={isFetching}
              pagination={{ pageIndex: page, pageSize: PAGE_SIZE }}
              onPaginationChange={(next) => setPage(next.pageIndex)}
              selectedRows={selectedOnPage}
              onRowSelect={handleRowSelect}
              emptyTitle="Akun tidak ditemukan"
              emptyDescription="Ubah filter No Akun atau Nama Akun."
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-[#d9e2e5] px-4 py-2.5">
          <span className="text-[12px] text-[#64748b]">
            {selected.length > 0 ? `${selected.length} akun dipilih` : 'Belum ada akun dipilih'}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="h-8 px-4 text-[13px]">
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="h-8 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
            >
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
