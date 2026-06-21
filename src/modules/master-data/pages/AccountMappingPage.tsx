import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { AccountMappingEditor } from '../components/AccountMappingEditor'

export default function AccountMappingPage() {
  return (
    <WorkspaceLayout
      title="Pemetaan Akun"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Pemetaan Akun' }]}
    >
      <AccountMappingEditor savePermission="settings.company.edit" saveLabel="Simpan Perubahan" />
    </WorkspaceLayout>
  )
}
