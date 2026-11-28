import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileInput } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { useRecordTab } from '@/hooks/useRecordTab'
import { getApiErrorMessage } from '@/lib/apiError'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { sourceName, countText } from './sourceDocumentText'
import type { SourceConvertOption } from './sourceConvert'

export function SourceNotification({
  summary,
  targetLabel,
  note,
  onAccept,
  onDecline,
}: {
  summary: string
  targetLabel: string
  note?: string
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-20 z-40 rounded-lg border border-[#5c9ead] bg-white p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px]"
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#eff9fb] text-[#326273]">
          <FileInput className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#24323a]">Ada dokumen sebelumnya yang bisa dipakai</p>
          <p className="mt-0.5 text-[12px] text-[#64748b]">
            {summary}. Buat {targetLabel} berdasarkan data tersebut?
          </p>
          {note && <p className="mt-1 text-[11px] text-[#94a3b8]">{note}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={onAccept} className="h-8 bg-[#5c9ead] px-3 text-[12px] hover:bg-[#4a8593]">
              Ya, pilih dokumen
            </Button>
            <Button type="button" variant="outline" onClick={onDecline} className="h-8 px-3 text-[12px]">
              Tidak, isi manual
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SourceDocumentDialog({
  sources,
  sizes,
  targetLabel,
  createPath,
  targetPath,
  initial,
  onClose,
}: {
  sources: SourceConvertOption[]
  sizes: number[]
  targetLabel: string
  createPath: string
  targetPath: (id: number) => string
  initial: { key: string; id: number } | null
  onClose: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { replaceRecordTab } = useRecordTab()

  // Buka di jenis sumber yang punya dokumen terbuka; kalau semuanya kosong, yang pertama.
  const firstWithDocs = sources.findIndex((_, index) => sizes[index] > 0)
  const [modeKey, setModeKey] = useState<string>(initial?.key ?? sources[Math.max(firstWithDocs, 0)].key)
  const [sourceId, setSourceId] = useState<number | null>(initial?.id ?? null)
  const [partnerId, setPartnerId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [converting, setConverting] = useState(false)

  const source = sources.find((item) => item.key === modeKey) ?? sources[0]
  const partnerFilter = source.partner?.filterBy ? partnerId : null

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data: documents, isFetching: listLoading, dataUpdatedAt } = useQuery({
    queryKey: ['source-docs', 'list', targetLabel, source.key, partnerFilter, search],
    queryFn: () => source.search(search, partnerFilter),
  })

  // Pratinjau dibaca setelah daftar dimuat: sebagian sumber mengisinya dari hasil pencarian.
  const { data: preview, isFetching: previewLoading } = useQuery({
    queryKey: ['source-docs', 'preview', targetLabel, source.key, sourceId, dataUpdatedAt],
    queryFn: () => source.preview!(sourceId as number),
    enabled: !!source.preview && !!sourceId && dataUpdatedAt > 0,
  })

  const choose = (key: string) => {
    setModeKey(key)
    setSourceId(null)
    setSearchInput('')
    setSearch('')
  }

  const selected = documents?.find((item) => item.value === sourceId)
  const noRemaining = source.preview != null && !!sourceId && !previewLoading && preview !== undefined && preview.length === 0

  const convert = async () => {
    if (!sourceId) return
    if (source.partner?.required && !partnerId) {
      toast.error(`${source.partner.label} wajib dipilih dulu.`)
      return
    }
    setConverting(true)
    try {
      const created = await source.convert(sourceId, partnerId)
      toast.success(`${targetLabel} dibuat dari ${selected?.label ?? 'dokumen sumber'}.`)
      // Dokumen sumber berubah (sisa jumlah) dan daftar dokumen baru perlu dimuat ulang.
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const root = String(query.queryKey[0])
          return root === 'sales' || root === 'purchase' || root === 'source-docs'
        },
      })
      replaceRecordTab(createPath, { label: created.number ?? targetLabel, path: targetPath(created.id) })
      onClose()
    } catch (convertError) {
      toast.error(getApiErrorMessage(convertError, `Gagal membuat ${targetLabel} dari dokumen sumber.`))
    } finally {
      setConverting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !converting && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[640px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-[#d9e2e5] bg-[#326273] px-4 py-2.5">
          <DialogTitle className="pr-6 text-[14px] font-semibold text-white">Buat {targetLabel} dari Dokumen Sebelumnya</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {sources.length > 1 && (
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Jenis dokumen sumber">
              {sources.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={modeKey === item.key}
                  onClick={() => choose(item.key)}
                  className={cn(
                    'h-8 rounded px-3 text-[12px] font-medium transition-colors',
                    modeKey === item.key ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]',
                  )}
                >
                  {sourceName(item)}
                  {sizes[index] > 0 && <span className="ml-1.5 opacity-80">({countText(sizes[index])})</span>}
                </button>
              ))}
            </div>
          )}

          {source.partner && (
            <SearchableSelect
              cacheKey={source.partner.cacheKey}
              label={source.partner.label + (source.partner.required ? ' *' : '')}
              value={partnerId}
              onChange={(value) => setPartnerId(value)}
              onSearch={source.partner.search}
              placeholder={`Pilih ${source.partner.label.toLowerCase()}...`}
            />
          )}

          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Cari nomor ${sourceName(source).toLowerCase()}...`}
            aria-label={`Cari ${sourceName(source)}`}
            className="h-8 text-[12px]"
          />

          <div role="radiogroup" aria-label={sourceName(source)} className="max-h-[220px] overflow-y-auto rounded-md border border-[#e2e8f0]">
            {listLoading && !documents ? (
              <p className="px-3 py-6 text-center text-[12px] text-[#64748b]">Memuat dokumen...</p>
            ) : !documents || documents.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] text-[#64748b]">
                {search ? 'Dokumen tidak ditemukan. Ubah kata kunci pencarian.' : `Tidak ada ${sourceName(source)} yang masih terbuka.`}
              </p>
            ) : (
              documents.map((item) => {
                const isSelected = item.value === sourceId
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSourceId(item.value)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-[#f1f5f9] px-3 py-2 text-left text-[12px] last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5c9ead]/40',
                      isSelected ? 'bg-[#eff9fb]' : 'hover:bg-[#f8fafc]',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn('h-3.5 w-3.5 flex-shrink-0 rounded-full border', isSelected ? 'border-[#5c9ead] bg-[#5c9ead] ring-2 ring-inset ring-white' : 'border-[#cbd5e1]')}
                    />
                    <span className="font-semibold text-[#24323a]">{item.label}</span>
                    {item.sublabel && (
                      <span className="ml-auto truncate text-[#64748b]">
                        {/^\d{4}-\d{2}-\d{2}/.test(item.sublabel) ? formatDate(item.sublabel) : item.sublabel}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {sourceId && source.preview && (
            <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
              {previewLoading || preview === undefined ? (
                <p className="text-[#64748b]">Memuat baris dokumen...</p>
              ) : preview.length === 0 ? (
                <p className="text-[#b45309]">Tidak ada jumlah tersisa yang bisa diambil dari dokumen ini.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[#94a3b8]">
                      <th className="pb-1 text-left font-semibold">Item</th>
                      <th className="pb-1 text-right font-semibold">Jumlah</th>
                      <th className="pb-1 text-right font-semibold">Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((line) => (
                      <tr key={line.id} className="border-t border-[#e2e8f0]">
                        <td className="py-1 text-[#24323a]">{line.label}</td>
                        <td className="py-1 text-right tabular-nums">{line.quantity}</td>
                        <td className="py-1 text-right tabular-nums">{line.unitPrice != null ? formatCurrency(line.unitPrice) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <p className="text-[11px] text-[#64748b]">
            {targetLabel} baru dibuat sebagai draft dari dokumen ini, lalu dibuka untuk diperiksa dan diedit.
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[#d9e2e5] px-4 py-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={converting} className="h-8 px-4 text-[13px]">
            Batal, isi manual
          </Button>
          <Button
            type="button"
            onClick={() => void convert()}
            disabled={!sourceId || converting || noRemaining}
            className="h-8 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8593]"
          >
            {converting ? 'Memproses...' : `Buat ${targetLabel}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
