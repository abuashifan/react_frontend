import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FormSection } from '@/components/shared/form/FormSection'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { useRecordTab } from '@/hooks/useRecordTab'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency } from '@/lib/utils'
import type { SelectOption } from '@/types/common.types'
import type { SourceConvertOption } from './sourceConvert'

interface SourceConvertPanelProps {
  sources: SourceConvertOption[]
  /** Nama dokumen yang dibuat, mis. "Purchase Order". */
  targetLabel: string
  /** Rute tab buat-baru yang diganti dengan dokumen hasil konversi. */
  createPath: string
  targetPath: (id: number) => string
  /** Sumber yang langsung dipilih, mis. dari tombol "Buat PO" di halaman Permintaan. */
  initial?: { key: string; id: number } | null
  onActiveChange?: (active: boolean) => void
}

/**
 * "Ambil dari dokumen sebelumnya" di form buat-baru: pilih jenis sumber dan
 * dokumennya, lihat baris yang akan diambil, lalu backend membuat dokumen baru
 * dari sumber itu (endpoint `from-...`) dan tab dibuka ke dokumen tersebut untuk
 * diedit. Jumlah yang diambil adalah sisa yang belum diproses, dihitung backend.
 */
export function SourceConvertPanel({ sources, targetLabel, createPath, targetPath, initial, onActiveChange }: SourceConvertPanelProps) {
  const { toast } = useToast()
  const { replaceRecordTab } = useRecordTab()
  const [modeKey, setModeKey] = useState<string>(initial?.key ?? 'none')
  const [sourceId, setSourceId] = useState<number | null>(initial?.id ?? null)
  const [sourceOption, setSourceOption] = useState<SelectOption<number> | null>(null)
  const [partnerId, setPartnerId] = useState<number | null>(null)
  const [converting, setConverting] = useState(false)
  const source = sources.find((item) => item.key === modeKey) ?? null

  useEffect(() => {
    onActiveChange?.(source !== null)
  }, [source, onActiveChange])

  const { data: preview, isFetching: previewLoading } = useQuery({
    queryKey: ['source-convert-preview', modeKey, sourceId],
    queryFn: () => source!.preview!(sourceId as number),
    enabled: !!source?.preview && !!sourceId,
  })

  const choose = (key: string) => {
    setModeKey(key)
    setSourceId(null)
    setSourceOption(null)
  }

  const convert = async () => {
    if (!source || !sourceId) return
    if (source.partner?.required && !partnerId) {
      toast.error(`${source.partner.label} wajib dipilih dulu.`)
      return
    }
    setConverting(true)
    try {
      const created = await source.convert(sourceId, partnerId)
      toast.success(`${targetLabel} dibuat dari ${sourceOption?.label ?? 'dokumen sumber'}.`)
      replaceRecordTab(createPath, { label: created.number ?? targetLabel, path: targetPath(created.id) })
    } catch (convertError) {
      toast.error(getApiErrorMessage(convertError, `Gagal membuat ${targetLabel} dari dokumen sumber.`))
    } finally {
      setConverting(false)
    }
  }

  return (
    <FormSection title="Ambil dari Dokumen Sebelumnya">
      <div className="flex flex-col gap-2 md:col-span-2">
        <div className="flex flex-wrap gap-1">
          {[{ key: 'none', label: 'Isi manual' }, ...sources.map((item) => ({ key: item.key, label: item.label }))].map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => choose(mode.key)}
              className={`h-8 rounded px-3 text-[12px] font-medium transition-colors ${modeKey === mode.key ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        {source && (
          <>
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
            <SearchableSelect
              label={source.label.replace(/^Dari /, '')}
              value={sourceId}
              onChange={(value, option) => { setSourceId(value); setSourceOption(option ?? null) }}
              onSearch={(q) => source.search(q, source.partner?.filterBy ? partnerId : null)}
              placeholder={source.placeholder}
              selectedOptions={sourceOption ? [sourceOption] : []}
            />
            {sourceId && source.preview && (
              <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
                {previewLoading ? (
                  <p className="text-[#64748b]">Memuat baris dokumen...</p>
                ) : !preview || preview.length === 0 ? (
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
              {targetLabel} baru dibuat sebagai draft dari dokumen ini, lalu dibuka untuk diperiksa dan diedit. Isian manual di bawah tidak dipakai.
            </p>
            <div>
              <Button
                type="button"
                className="h-8 bg-[#5c9ead] px-3 text-[13px] hover:bg-[#4a8593]"
                disabled={!sourceId || converting || (source.preview != null && !previewLoading && (preview?.length ?? 0) === 0)}
                onClick={() => void convert()}
              >
                {converting ? 'Memproses...' : `Buat ${targetLabel} dari dokumen ini`}
              </Button>
            </div>
          </>
        )}
      </div>
    </FormSection>
  )
}
