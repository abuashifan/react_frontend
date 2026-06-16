import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/useToast'
import { useTransactionSettings, useTransactionSettingsMutation } from '../hooks/useSettings'
import type { TransactionSettings } from '../types/settings.types'

const schema = z.object({
  auto_post_enabled: z.boolean(),
  approval_required: z.object({
    sales_quotation: z.boolean(),
    sales_order: z.boolean(),
    sales_invoice: z.boolean(),
    purchase_request: z.boolean(),
    purchase_order: z.boolean(),
    vendor_bill: z.boolean(),
    stock_adjustment: z.boolean(),
    manual_journal: z.boolean(),
  }),
  number_formats: z.object({
    sales_invoice: z.string().min(1),
    sales_order: z.string().min(1),
    delivery_order: z.string().min(1),
    purchase_order: z.string().min(1),
    vendor_bill: z.string().min(1),
    goods_receipt: z.string().min(1),
    manual_journal: z.string().min(1),
  }),
  session_timeout_minutes: z.number().min(5).max(480),
})
type FormValues = z.infer<typeof schema>

const APPROVAL_LABELS: Record<keyof TransactionSettings['approval_required'], string> = {
  sales_quotation: 'Penawaran (Quotation)',
  sales_order: 'Sales Order',
  sales_invoice: 'Invoice Penjualan',
  purchase_request: 'Permintaan Pembelian',
  purchase_order: 'Purchase Order',
  vendor_bill: 'Tagihan Vendor',
  stock_adjustment: 'Penyesuaian Stok',
  manual_journal: 'Jurnal Manual',
}

const FORMAT_LABELS: Record<keyof TransactionSettings['number_formats'], string> = {
  sales_invoice: 'Invoice Penjualan',
  sales_order: 'Sales Order',
  delivery_order: 'Delivery Order',
  purchase_order: 'Purchase Order',
  vendor_bill: 'Tagihan Vendor',
  goods_receipt: 'Penerimaan Barang',
  manual_journal: 'Jurnal Manual',
}

const SESSION_OPTIONS = [{ value: 15, label: '15 menit' }, { value: 30, label: '30 menit' }, { value: 60, label: '1 jam' }, { value: 120, label: '2 jam' }, { value: 240, label: '4 jam' }, { value: 480, label: '8 jam' }]

export default function TransactionSettingsPage() {
  const { data, isLoading } = useTransactionSettings()
  const mutation = useTransactionSettingsMutation()
  const { toast } = useToast()
  const { register, handleSubmit, reset, control, watch, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { auto_post_enabled: false, approval_required: { sales_quotation: false, sales_order: false, sales_invoice: false, purchase_request: false, purchase_order: false, vendor_bill: false, stock_adjustment: false, manual_journal: false }, number_formats: { sales_invoice: 'INV-{YYYY}-{SEQ}', sales_order: 'SO-{YYYY}-{SEQ}', delivery_order: 'DO-{YYYY}-{SEQ}', purchase_order: 'PO-{YYYY}-{SEQ}', vendor_bill: 'BILL-{YYYY}-{SEQ}', goods_receipt: 'GR-{YYYY}-{SEQ}', manual_journal: 'JRN-{YYYY}-{SEQ}' }, session_timeout_minutes: 60 },
  })

  const autoPost = watch('auto_post_enabled')

  useEffect(() => {
    if (data?.data) reset({ ...data.data })
  }, [data, reset])

  const onSubmit = handleSubmit(async (values) => {
    try { await mutation.mutateAsync(values); toast.success('Pengaturan transaksi disimpan.') }
    catch { toast.error('Gagal menyimpan pengaturan.') }
  })

  if (isLoading) return <WorkspaceLayout title="Transaksi" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Transaksi' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></WorkspaceLayout>

  return (
    <WorkspaceLayout title="Pengaturan Transaksi" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Transaksi' }]}>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <FormSection title="Alur Kerja Dokumen">
          <div className="flex items-center gap-3 md:col-span-2">
            <Controller name="auto_post_enabled" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            <div>
              <p className="text-[13px] font-medium text-[#1e2d35]">Posting Otomatis</p>
              <p className="text-[11px] text-[#64748b]">Dokumen langsung diposting tanpa perlu approval manual</p>
            </div>
          </div>
          {!autoPost && (
            <div className="md:col-span-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Approval Diperlukan Untuk</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(APPROVAL_LABELS) as Array<keyof TransactionSettings['approval_required']>).map((key) => (
                  <label key={key} className="flex items-center gap-2 rounded-md border border-[#e2e8f0] p-2">
                    <Controller name={`approval_required.${key}`} control={control} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />} />
                    <span className="text-[12px] text-[#1e2d35]">{APPROVAL_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="Format Penomoran Dokumen">
          {(Object.keys(FORMAT_LABELS) as Array<keyof TransactionSettings['number_formats']>).map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{FORMAT_LABELS[key]}</Label>
              <Input {...register(`number_formats.${key}`)} className="h-9 font-mono text-[13px]" />
            </div>
          ))}
          <div className="md:col-span-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[11px] text-[#64748b]">
            Variabel: <code className="font-mono">{'{YYYY}'}</code> = tahun, <code className="font-mono">{'{MM}'}</code> = bulan, <code className="font-mono">{'{SEQ}'}</code> = nomor urut
          </div>
        </FormSection>

        <FormSection title="Keamanan Sesi">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Timeout Sesi</Label>
            <select {...register('session_timeout_minutes', { valueAsNumber: true })} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
              {SESSION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </FormSection>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || mutation.isPending} className="h-9 bg-[#5c9ead] px-6 text-[13px] hover:bg-[#4a8a9b]">
            {isSubmitting || mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </WorkspaceLayout>
  )
}
