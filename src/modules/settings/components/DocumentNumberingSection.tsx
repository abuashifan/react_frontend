import { useState } from 'react'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useDocumentNumbering, useUpdateDocumentNumbering } from '../hooks/useCompanySettings'
import type { DocumentNumberingSetting, NumberingResetPeriod } from '../types/settings.types'

const RESET_OPTIONS: { value: NumberingResetPeriod; label: string }[] = [
  { value: 'fiscal_year', label: 'Tiap tahun fiskal' },
  { value: 'monthly', label: 'Tiap bulan' },
  { value: 'never', label: 'Tidak pernah' },
]

const SELECT_CLASS =
  'h-8 rounded-md border border-input bg-background px-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-ring'

function NumberingRow({ setting, canEdit }: { setting: DocumentNumberingSetting; canEdit: boolean }) {
  const { toast } = useToast()
  const update = useUpdateDocumentNumbering()
  const [draft, setDraft] = useState({
    prefix: setting.prefix,
    format: setting.format,
    padding: setting.padding,
    reset_period: setting.reset_period,
  })

  const dirty =
    draft.prefix !== setting.prefix ||
    draft.format !== setting.format ||
    draft.padding !== setting.padding ||
    draft.reset_period !== setting.reset_period

  const handleSave = async () => {
    try {
      await update.mutateAsync({ documentType: setting.document_type, payload: draft })
      toast.success(`Format nomor ${setting.name ?? setting.document_type} disimpan.`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan format nomor.'))
    }
  }

  return (
    <tr className="border-b border-[#f1f5f9] last:border-b-0">
      <td className="px-2.5 py-1.5 text-[12px] text-[#24323a]">{setting.name ?? setting.document_type}</td>
      <td className="px-2 py-1.5">
        <Input
          value={draft.prefix}
          onChange={(event) => setDraft((d) => ({ ...d, prefix: event.target.value }))}
          disabled={!canEdit}
          aria-label={`Prefiks ${setting.name ?? setting.document_type}`}
          className="h-8 w-[80px] text-[12px]"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          value={draft.format}
          onChange={(event) => setDraft((d) => ({ ...d, format: event.target.value }))}
          disabled={!canEdit}
          aria-label={`Format ${setting.name ?? setting.document_type}`}
          className="h-8 w-[200px] text-[12px]"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          type="number"
          min={1}
          max={12}
          value={draft.padding}
          onChange={(event) => setDraft((d) => ({ ...d, padding: Number(event.target.value) }))}
          disabled={!canEdit}
          aria-label={`Panjang angka ${setting.name ?? setting.document_type}`}
          className="h-8 w-[64px] text-[12px] tabular-nums"
        />
      </td>
      <td className="px-2 py-1.5">
        <select
          value={draft.reset_period}
          onChange={(event) => setDraft((d) => ({ ...d, reset_period: event.target.value as NumberingResetPeriod }))}
          disabled={!canEdit}
          aria-label={`Reset ${setting.name ?? setting.document_type}`}
          className={SELECT_CLASS}
        >
          {RESET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>
      <td className="px-2.5 py-1.5 text-[12px] tabular-nums text-[#64748b]">{setting.example}</td>
      <td className="px-2 py-1.5 text-right">
        {canEdit && (
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!dirty || update.isPending}
            className="h-7 bg-[#5c9ead] px-3 text-[12px] hover:bg-[#4a8a9b]"
          >
            Simpan
          </Button>
        )}
      </td>
    </tr>
  )
}

/**
 * Format nomor dokumen per jenis dokumen. Token yang dikenali: {PREFIX},
 * {YEAR}, {MONTH}, {NUMBER} -- {NUMBER} wajib ada. Perubahan hanya berlaku untuk
 * dokumen berikutnya; nomor yang sudah terbit tidak berubah.
 */
export function DocumentNumberingSection() {
  const { can } = usePermission()
  const { data, isLoading } = useDocumentNumbering()
  const rows = data?.data ?? []

  return (
    <FormSection title="Penomoran Dokumen">
      <div className="md:col-span-2">
        <p className="mb-2 text-[11px] text-[#94a3b8]">
          Token: {'{PREFIX}'} {'{YEAR}'} {'{MONTH}'} {'{NUMBER}'}. Perubahan berlaku untuk dokumen berikutnya.
        </p>
        {isLoading ? (
          <p className="py-4 text-center text-[13px] text-[#64748b]">Memuat...</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#e2e8f0]">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#eeeeee] text-left text-[11px] font-bold uppercase text-[#64748b]">
                  <th className="px-2.5 py-2">Dokumen</th>
                  <th className="px-2 py-2">Prefiks</th>
                  <th className="px-2 py-2">Format</th>
                  <th className="px-2 py-2">Digit</th>
                  <th className="px-2 py-2">Reset</th>
                  <th className="px-2.5 py-2">Contoh</th>
                  <th className="px-2 py-2" aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <NumberingRow key={`${row.document_type}:${row.prefix}:${row.format}:${row.padding}:${row.reset_period}`} setting={row} canEdit={can('settings.transactions.edit')} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FormSection>
  )
}
