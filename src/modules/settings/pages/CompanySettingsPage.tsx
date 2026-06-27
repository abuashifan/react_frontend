import { useEffect, useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanySettings, useCompanySettingsMutations } from '../hooks/useCompanySettings'
import type { CompanyAccountingSettings, CompanyModuleSettings, RoundingMethod } from '../types/settings.types'

const ROUNDING_OPTIONS: { value: RoundingMethod; label: string }[] = [
  { value: 'half_up', label: 'Half Up (pembulatan ke atas)' },
  { value: 'half_down', label: 'Half Down (pembulatan ke bawah)' },
  { value: 'bankers', label: "Banker's Rounding" },
  { value: 'floor', label: 'Floor (dibulatkan turun)' },
  { value: 'ceil', label: 'Ceil (dibulatkan naik)' },
]

const MODULE_LABELS: { key: keyof CompanyModuleSettings; label: string }[] = [
  { key: 'sales_enabled', label: 'Penjualan' },
  { key: 'purchase_enabled', label: 'Pembelian' },
  { key: 'cash_bank_enabled', label: 'Kas & Bank' },
  { key: 'inventory_enabled', label: 'Persediaan' },
  { key: 'warehouse_enabled', label: 'Gudang' },
  { key: 'fixed_asset_enabled', label: 'Aktiva Tetap' },
  { key: 'approval_enabled', label: 'Approval' },
  { key: 'tax_enabled', label: 'Pajak' },
  { key: 'reports_enabled', label: 'Laporan' },
]

export default function CompanySettingsPage() {
  const { data, isLoading } = useCompanySettings()
  const { updateAccounting, updateModules } = useCompanySettingsMutations()
  const { toast } = useToast()

  const companies = useAuthStore((s) => s.companies)
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const company = companies.find((c) => c.id === activeCompanyId)

  const [accounting, setAccounting] = useState<CompanyAccountingSettings>({})
  const [modules, setModules] = useState<CompanyModuleSettings>({})

  useEffect(() => {
    if (data?.data) {
      const timer = window.setTimeout(() => {
        setAccounting(data.data.accounting ?? {})
        setModules(data.data.modules ?? {})
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [data])

  const handleSaveAccounting = async () => {
    try {
      await updateAccounting.mutateAsync({
        base_currency: accounting.base_currency,
        amount_precision: accounting.amount_precision,
        quantity_precision: accounting.quantity_precision,
        rounding_method: accounting.rounding_method,
      })
      toast.success('Pengaturan akuntansi disimpan.')
    } catch { toast.error('Gagal menyimpan pengaturan akuntansi.') }
  }

  const handleToggleModule = async (key: keyof CompanyModuleSettings, value: boolean) => {
    const next = { ...modules, [key]: value }
    setModules(next)
    try {
      await updateModules.mutateAsync({ [key]: value })
      toast.success('Pengaturan modul disimpan.')
    } catch {
      setModules(modules)
      toast.error('Gagal menyimpan pengaturan modul.')
    }
  }

  if (isLoading) {
    return (
      <WorkspaceLayout title="Pengaturan Perusahaan" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Perusahaan' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
      </WorkspaceLayout>
    )
  }

  return (
    <WorkspaceLayout title="Pengaturan Perusahaan" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Perusahaan' }]}>
      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="akuntansi">Akuntansi</TabsTrigger>
          <TabsTrigger value="modul">Modul</TabsTrigger>
        </TabsList>

        {/* Profil — read-only (data dari konteks company aktif) */}
        <TabsContent value="profil">
          <FormSection title="Identitas Perusahaan">
            <div className="flex flex-col gap-1">
              <Label htmlFor="company-settings-name" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama Perusahaan</Label>
              <Input id="company-settings-name" value={company?.name ?? '-'} readOnly className="h-9 bg-[#f8fafc] text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="company-settings-legal-name" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama Legal</Label>
              <Input id="company-settings-legal-name" value={company?.legal_name ?? '-'} readOnly className="h-9 bg-[#f8fafc] text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="company-settings-code" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</Label>
              <Input id="company-settings-code" value={company?.code ?? '-'} readOnly className="h-9 bg-[#f8fafc] text-[13px]" />
            </div>
            <div className="md:col-span-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[11px] text-[#64748b]">
              Profil perusahaan dikelola di level akun. Hubungi administrator untuk mengubah identitas perusahaan.
            </div>
          </FormSection>
        </TabsContent>

        {/* Akuntansi */}
        <TabsContent value="akuntansi">
          <FormSection title="Pengaturan Akuntansi">
            <div className="flex flex-col gap-1">
              <Label htmlFor="company-settings-base-currency" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Mata Uang Dasar</Label>
              <select id="company-settings-base-currency" value={accounting.base_currency ?? 'IDR'} onChange={(e) => setAccounting((a) => ({ ...a, base_currency: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="IDR">IDR — Rupiah</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="SGD">SGD — Singapore Dollar</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="company-settings-rounding-method" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Metode Pembulatan</Label>
              <select id="company-settings-rounding-method" value={accounting.rounding_method ?? 'half_up'} onChange={(e) => setAccounting((a) => ({ ...a, rounding_method: e.target.value as RoundingMethod }))} className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
                {ROUNDING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="company-settings-amount-precision" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Presisi Nilai (desimal)</Label>
              <Input id="company-settings-amount-precision" type="number" min={0} max={6} value={accounting.amount_precision ?? 0} onChange={(e) => setAccounting((a) => ({ ...a, amount_precision: Number(e.target.value) }))} className="h-9 text-[13px] tabular-nums" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="company-settings-quantity-precision" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Presisi Kuantitas (desimal)</Label>
              <Input id="company-settings-quantity-precision" type="number" min={0} max={8} value={accounting.quantity_precision ?? 0} onChange={(e) => setAccounting((a) => ({ ...a, quantity_precision: Number(e.target.value) }))} className="h-9 text-[13px] tabular-nums" />
            </div>
          </FormSection>
          <PermissionGuard permission="settings.company.edit" fallback={null}>
            <div className="flex justify-end">
              <Button type="button" onClick={() => void handleSaveAccounting()} disabled={updateAccounting.isPending} className="h-9 bg-[#5c9ead] px-6 text-[13px] hover:bg-[#4a8a9b]">
                {updateAccounting.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </PermissionGuard>
        </TabsContent>

        {/* Modul */}
        <TabsContent value="modul">
          <FormSection title="Modul Aktif">
            {MODULE_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-md border border-[#e2e8f0] p-3 md:col-span-1">
                <span className="text-[13px] text-[#1e2d35]">{label}</span>
                <PermissionGuard permission="settings.company.edit" fallback={<Switch checked={!!modules[key]} disabled />}>
                  <Switch checked={!!modules[key]} onCheckedChange={(v) => void handleToggleModule(key, v)} disabled={updateModules.isPending} />
                </PermissionGuard>
              </div>
            ))}
          </FormSection>
        </TabsContent>
      </Tabs>
    </WorkspaceLayout>
  )
}
