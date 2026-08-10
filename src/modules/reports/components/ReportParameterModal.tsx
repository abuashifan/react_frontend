import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import type {
  ReportParams,
  DimensionFilterConfig,
  ExtraFilterConfig,
  ContextFilterConfig,
  ColumnConfig,
} from '../types/reports.types'
import type { SelectOption } from '@/types/common.types'

interface Props {
  open: boolean
  onClose: () => void
  params: ReportParams
  onChange: (p: Partial<ReportParams>) => void
  onSubmit: () => void
  mode?: 'range' | 'as_of_date'
  isLoading?: boolean
  dimensions?: DimensionFilterConfig
  extras?: ExtraFilterConfig
  contextFilters?: ContextFilterConfig
  /**
   * Label untuk nilai `contextFilters` yang sudah terpilih, dikunci nama filter
   * (mis. `{ product: { value: 1, label: 'Beras Premium 5kg' } }`).
   *
   * Diperlukan karena modal ini di-unmount setiap kali ditutup, sehingga
   * `SearchableSelect` kehilangan label pilihan sebelumnya dan jatuh ke
   * "ID 1". Pemanggil yang tahu namanya — biasanya dari respons laporan —
   * meneruskannya lewat sini.
   */
  contextOptions?: Partial<Record<keyof ContextFilterConfig, SelectOption<number> | null>>
  columns?: ColumnConfig[]
  visibleColumns?: string[]
  onColumnsChange?: (cols: string[]) => void
}

export function ReportParameterModal({
  open, onClose, params, onChange, onSubmit, mode = 'range', isLoading,
  dimensions, extras, contextFilters, contextOptions, columns, visibleColumns, onColumnsChange,
}: Props) {
  const searchDept = useCallback((q: string) => departemenApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])
  const searchWarehouse = useCallback((q: string) => gudangApi.search(q), [])
  const searchCustomer = useCallback((q: string) => kontakApi.search(q, 'customer'), [])
  const searchSupplier = useCallback((q: string) => kontakApi.search(q, 'supplier'), [])
  const searchContact = useCallback((q: string) => kontakApi.search(q), [])
  const searchProduct = useCallback((q: string) => produkApi.search(q), [])
  const searchAccount = useCallback((q: string) => coaApi.search(q), [])

  const hasDimensions = Boolean(dimensions && (dimensions.department || dimensions.project || dimensions.warehouse))
  const hasContext = Boolean(contextFilters && (contextFilters.customer || contextFilters.supplier || contextFilters.vendor || contextFilters.product || contextFilters.account || contextFilters.contact || contextFilters.status))
  const hasExtras = Boolean(extras && (extras.include_zero_balance || extras.only_difference))
  const hasFilterSection = hasDimensions || hasContext || hasExtras
  const hasColumns = Boolean(columns && columns.length > 0)

  const toggleColumn = (key: string) => {
    if (!visibleColumns || !onColumnsChange) return
    if (visibleColumns.includes(key)) {
      // Minimal 1 kolom harus tetap tampil.
      if (visibleColumns.length <= 1) return
      onColumnsChange(visibleColumns.filter((c) => c !== key))
    } else {
      onColumnsChange([...visibleColumns, key])
    }
  }

  const handleSubmit = () => {
    onSubmit()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Parameter Laporan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* PERIODE */}
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode</p>
            <div className="flex flex-wrap items-end gap-3">
              {mode === 'range' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="rpm-start-date" className="text-[11px] font-medium text-[#64748b]">Dari Tanggal</Label>
                    <Input id="rpm-start-date" type="date" value={params.start_date ?? ''} onChange={(e) => onChange({ start_date: e.target.value })} className="h-8 w-40 text-[13px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="rpm-end-date" className="text-[11px] font-medium text-[#64748b]">Sampai Tanggal</Label>
                    <Input id="rpm-end-date" type="date" value={params.end_date ?? ''} onChange={(e) => onChange({ end_date: e.target.value })} className="h-8 w-40 text-[13px]" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="rpm-as-of-date" className="text-[11px] font-medium text-[#64748b]">Per Tanggal</Label>
                  <Input id="rpm-as-of-date" type="date" value={params.as_of_date ?? ''} onChange={(e) => onChange({ as_of_date: e.target.value })} className="h-8 w-40 text-[13px]" />
                </div>
              )}
            </div>
          </section>

          {/* FILTER DATA */}
          {hasFilterSection && (
            <section className="space-y-2 border-t border-[#f1f5f9] pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Filter Data</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {dimensions?.department && (
                  <FilterSelect label="Departemen" value={params.department_id} onChange={(v) => onChange({ department_id: v })} onSearch={searchDept} placeholder="Semua departemen" />
                )}
                {dimensions?.project && (
                  <FilterSelect label="Proyek" value={params.project_id} onChange={(v) => onChange({ project_id: v })} onSearch={searchProject} placeholder="Semua proyek" />
                )}
                {dimensions?.warehouse && (
                  <FilterSelect label="Gudang" value={params.warehouse_id} onChange={(v) => onChange({ warehouse_id: v })} onSearch={searchWarehouse} placeholder="Semua gudang" />
                )}
                {contextFilters?.customer && (
                  <FilterSelect label="Pelanggan" value={params.customer_id} onChange={(v) => onChange({ customer_id: v })} onSearch={searchCustomer} placeholder="Semua pelanggan" />
                )}
                {contextFilters?.supplier && (
                  <FilterSelect label="Pemasok" value={params.supplier_id} onChange={(v) => onChange({ supplier_id: v })} onSearch={searchSupplier} placeholder="Semua pemasok" />
                )}
                {contextFilters?.vendor && (
                  <FilterSelect label="Pemasok" value={params.vendor_id} onChange={(v) => onChange({ vendor_id: v })} onSearch={searchSupplier} placeholder="Semua pemasok" />
                )}
                {contextFilters?.contact && (
                  <FilterSelect label="Kontak" value={params.contact_id} onChange={(v) => onChange({ contact_id: v })} onSearch={searchContact} placeholder="Semua kontak" />
                )}
                {contextFilters?.product && (
                  <FilterSelect label="Produk" value={params.product_id} onChange={(v) => onChange({ product_id: v })} onSearch={searchProduct} placeholder="Semua produk" selectedOption={contextOptions?.product} />
                )}
                {contextFilters?.account && (
                  <FilterSelect label="Akun" value={params.account_id} onChange={(v) => onChange({ account_id: v })} onSearch={searchAccount} placeholder="Semua akun" />
                )}
                {contextFilters?.status && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] font-medium text-[#64748b]">Status</Label>
                    <select
                      value={params.status ?? ''}
                      onChange={(e) => onChange({ status: e.target.value || undefined })}
                      className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2 text-[13px] text-[#334155]"
                    >
                      <option value="">Semua status</option>
                      {contextFilters.status.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {hasExtras && (
                <div className="flex flex-wrap gap-4 pt-1">
                  {extras?.include_zero_balance && (
                    <label htmlFor="rpm-include-zero" className="flex cursor-pointer items-center gap-2 text-[12px] text-[#475569]">
                      <Checkbox id="rpm-include-zero" checked={Boolean(params.include_zero_balance)} onCheckedChange={(v) => onChange({ include_zero_balance: v === true ? true : undefined })} />
                      Tampilkan akun dengan saldo nol
                    </label>
                  )}
                  {extras?.only_difference && (
                    <label htmlFor="rpm-only-diff" className="flex cursor-pointer items-center gap-2 text-[12px] text-[#475569]">
                      <Checkbox id="rpm-only-diff" checked={Boolean(params.only_difference)} onCheckedChange={(v) => onChange({ only_difference: v === true ? true : undefined })} />
                      Hanya tampilkan selisih
                    </label>
                  )}
                </div>
              )}
            </section>
          )}

          {/* KOLOM */}
          {hasColumns && (
            <section className="space-y-2 border-t border-[#f1f5f9] pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kolom yang Ditampilkan</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {columns?.map((col) => {
                  const checked = visibleColumns?.includes(col.key) ?? false
                  return (
                    <label key={col.key} htmlFor={`rpm-col-${col.key}`} className="flex cursor-pointer items-center gap-2 text-[12px] text-[#475569]">
                      <Checkbox id={`rpm-col-${col.key}`} checked={checked} onCheckedChange={() => toggleColumn(col.key)} />
                      {col.label}
                    </label>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" className="text-[13px]" onClick={onClose}>Batal</Button>
          <Button type="button" size="sm" className="bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]" disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Memuat...' : 'Tampilkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FilterSelect({ label, value, onChange, onSearch, placeholder, selectedOption }: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  onSearch: (q: string) => Promise<SelectOption<number>[]>
  placeholder: string
  /** Label nilai terpilih; tanpa ini SearchableSelect menampilkan "ID 1". */
  selectedOption?: SelectOption<number> | null
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] font-medium text-[#64748b]">{label}</Label>
      <SearchableSelect
        value={value ?? null}
        onChange={(v) => onChange(v ?? undefined)}
        onSearch={onSearch}
        placeholder={placeholder}
        size="sm"
        selectedOptions={selectedOption && selectedOption.value === value ? [selectedOption] : []}
      />
    </div>
  )
}
