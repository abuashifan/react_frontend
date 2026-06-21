import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { AccountMappingEditor } from '@/modules/master-data/components/AccountMappingEditor'

export default function AccountMappingSettingsPage() {
  return (
    <WorkspaceLayout
      title="Pemetaan Akun"
      breadcrumb={[{ label: 'Pengaturan' }, { label: 'Pemetaan Akun' }]}
    >
      <div className="space-y-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
          Perubahan pemetaan akun memengaruhi jurnal otomatis untuk transaksi baru.
          Pastikan akun yang dipilih aktif dan sesuai tipe pemetaan.
        </div>
        <AccountMappingEditor savePermission="settings.company.edit" />
      </div>
    </WorkspaceLayout>
  )
}
