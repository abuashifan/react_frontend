import { useEffect, useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import { paymentTermsApi } from '@/modules/master-data/services/paymentTermsApi'
import { useCompanySettings, useCompanySettingsMutations } from '../hooks/useCompanySettings'
import type { CompanyAccountingSettings, WorkflowMode } from '../types/settings.types'

const WORKFLOW_OPTIONS: { value: WorkflowMode; label: string; hint: string }[] = [
  { value: 'simple_auto_post', label: 'Sederhana — Auto Post', hint: 'Dokumen langsung diposting tanpa draft.' },
  { value: 'draft_then_post', label: 'Draft lalu Post', hint: 'Buat draft, lalu posting manual.' },
  { value: 'draft_approve_post', label: 'Draft → Approve → Post', hint: 'Butuh approval sebelum posting.' },
]

interface ToggleField { key: keyof CompanyAccountingSettings; label: string; hint?: string }

const BEHAVIOR_TOGGLES: ToggleField[] = [
  { key: 'auto_post_transactions', label: 'Posting Otomatis', hint: 'Dokumen langsung diposting tanpa approval manual.' },
  { key: 'approval_enabled', label: 'Approval Diperlukan', hint: 'Dokumen butuh approval sebelum posting.' },
  { key: 'allow_edit_transactions', label: 'Izinkan Edit Draft' },
  { key: 'allow_edit_posted_transactions', label: 'Izinkan Edit Dokumen Terposting' },
  { key: 'allow_void_transactions', label: 'Izinkan Void' },
  { key: 'require_void_reason', label: 'Wajib Alasan Void' },
  { key: 'hide_voided_transactions', label: 'Sembunyikan Dokumen Void' },
]

const DATE_TOGGLES: ToggleField[] = [
  { key: 'block_outside_current_fiscal_year', label: 'Blokir di Luar Tahun Fiskal' },
  { key: 'date_warning_enabled', label: 'Peringatan Tanggal' },
  { key: 'allow_backdated_transactions', label: 'Izinkan Tanggal Mundur' },
  { key: 'allow_future_transactions', label: 'Izinkan Tanggal Maju' },
]

export default function TransactionSettingsPage() {
  const { data, isLoading } = useCompanySettings()
  const { updateAccounting, updateTransactionDefaults } = useCompanySettingsMutations()
  const { toast } = useToast()

  const [acc, setAcc] = useState<CompanyAccountingSettings>({})
  const [paymentTermId, setPaymentTermId] = useState<number | null>(null)

  useEffect(() => {
    if (data?.data) {
      const timer = window.setTimeout(() => {
        setAcc(data.data.accounting ?? {})
        setPaymentTermId(data.data.transaction_defaults?.default_payment_term_id ?? null)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [data])

  const set = <K extends keyof CompanyAccountingSettings>(key: K, value: CompanyAccountingSettings[K]) =>
    setAcc((a) => ({ ...a, [key]: value }))

  const handleSave = async () => {
    try {
      await updateAccounting.mutateAsync({
        transaction_workflow_mode: acc.transaction_workflow_mode,
        auto_post_transactions: acc.auto_post_transactions,
        approval_enabled: acc.approval_enabled,
        allow_edit_transactions: acc.allow_edit_transactions,
        allow_edit_posted_transactions: acc.allow_edit_posted_transactions,
        allow_void_transactions: acc.allow_void_transactions,
        require_void_reason: acc.require_void_reason,
        hide_voided_transactions: acc.hide_voided_transactions,
        block_outside_current_fiscal_year: acc.block_outside_current_fiscal_year,
        date_warning_enabled: acc.date_warning_enabled,
        allow_backdated_transactions: acc.allow_backdated_transactions,
        max_backdate_days: acc.max_backdate_days,
        allow_future_transactions: acc.allow_future_transactions,
        max_future_days: acc.max_future_days,
      })
      await updateTransactionDefaults.mutateAsync({ default_payment_term_id: paymentTermId })
      toast.success('Pengaturan transaksi disimpan.')
    } catch { toast.error('Gagal menyimpan pengaturan transaksi.') }
  }

  if (isLoading) {
    return (
      <WorkspaceLayout title="Pengaturan Transaksi" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Transaksi' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
      </WorkspaceLayout>
    )
  }

  return (
    <WorkspaceLayout title="Pengaturan Transaksi" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Transaksi' }]}>
      <div className="space-y-4">
        <FormSection title="Alur Kerja Dokumen">
          <div className="flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="transaction-settings-workflow-mode" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Mode Alur Kerja</Label>
            <select id="transaction-settings-workflow-mode" value={acc.transaction_workflow_mode ?? 'draft_then_post'} onChange={(e) => set('transaction_workflow_mode', e.target.value as WorkflowMode)} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
              {WORKFLOW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="text-[11px] text-[#94a3b8]">{WORKFLOW_OPTIONS.find((o) => o.value === (acc.transaction_workflow_mode ?? 'draft_then_post'))?.hint}</p>
          </div>
        </FormSection>

        <FormSection title="Perilaku Dokumen">
          {BEHAVIOR_TOGGLES.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-[#e2e8f0] p-3">
              <div>
                <Label htmlFor={`transaction-settings-${String(key)}`} className="text-[13px] text-[#1e2d35]">{label}</Label>
                {hint && <p className="text-[11px] text-[#94a3b8]">{hint}</p>}
              </div>
              <Switch id={`transaction-settings-${String(key)}`} checked={!!acc[key]} onCheckedChange={(v) => set(key, v)} />
            </div>
          ))}
        </FormSection>

        <FormSection title="Aturan Tanggal">
          {DATE_TOGGLES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-[#e2e8f0] p-3">
              <Label htmlFor={`transaction-settings-${String(key)}`} className="text-[13px] text-[#1e2d35]">{label}</Label>
              <Switch id={`transaction-settings-${String(key)}`} checked={!!acc[key]} onCheckedChange={(v) => set(key, v)} />
            </div>
          ))}
          {acc.allow_backdated_transactions && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="transaction-settings-max-backdate-days" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Maks. Hari Mundur</Label>
              <Input id="transaction-settings-max-backdate-days" type="number" min={0} max={3650} value={acc.max_backdate_days ?? 0} onChange={(e) => set('max_backdate_days', Number(e.target.value))} className="h-9 text-[13px] tabular-nums" />
            </div>
          )}
          {acc.allow_future_transactions && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="transaction-settings-max-future-days" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Maks. Hari Maju</Label>
              <Input id="transaction-settings-max-future-days" type="number" min={0} max={3650} value={acc.max_future_days ?? 0} onChange={(e) => set('max_future_days', Number(e.target.value))} className="h-9 text-[13px] tabular-nums" />
            </div>
          )}
        </FormSection>

        <FormSection title="Default Transaksi">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran Default</Label>
            <SearchableSelect value={paymentTermId} onChange={setPaymentTermId} onSearch={paymentTermsApi.search} placeholder="Pilih syarat pembayaran..." />
          </div>
        </FormSection>

        <PermissionGuard permission="settings.company.edit" fallback={null}>
          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleSave()} disabled={updateAccounting.isPending || updateTransactionDefaults.isPending} className="h-9 bg-[#5c9ead] px-6 text-[13px] hover:bg-[#4a8a9b]">
              {updateAccounting.isPending || updateTransactionDefaults.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </PermissionGuard>
      </div>
    </WorkspaceLayout>
  )
}
