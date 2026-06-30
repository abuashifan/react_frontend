import { useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ReportDomainPanel } from '../components/ReportDomainPanel'
import { DOMAIN_BY_PATH } from '../constants/reportCategories'

export default function ReportCategoryPage() {
  const { categoryPath } = useParams<{ categoryPath: string }>()
  const domain = categoryPath ? DOMAIN_BY_PATH[categoryPath] : undefined

  if (!domain) {
    return (
      <WorkspaceLayout title="Laporan" breadcrumb={[{ label: 'Laporan' }]}>
        <p className="text-[13px] text-[#64748b]">Kategori tidak ditemukan.</p>
      </WorkspaceLayout>
    )
  }

  return (
    <PermissionGuard permission="reports.view">
      <WorkspaceLayout
        title={domain.label}
        breadcrumb={[{ label: 'Laporan' }, { label: domain.label }]}
      >
        <ReportDomainPanel domainId={domain.categoryPath} />
      </WorkspaceLayout>
    </PermissionGuard>
  )
}
