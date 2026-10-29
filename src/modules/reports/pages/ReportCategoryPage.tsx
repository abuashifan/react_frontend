import { useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ReportDomainPanel } from '../components/ReportDomainPanel'
import { REPORT_CATEGORIES } from '../constants/reportPermissions'
import { DOMAIN_BY_PATH } from '../constants/reportCategories'

export default function ReportCategoryPage() {
  const { categoryPath } = useParams<{ categoryPath: string }>()
  const domain = categoryPath ? DOMAIN_BY_PATH[categoryPath] : undefined

  if (!domain) {
    return (
      <WorkspaceLayout hideHeader>
        <p className="text-[13px] text-[#64748b]">Kategori tidak ditemukan.</p>
      </WorkspaceLayout>
    )
  }

  return (
    <PermissionGuard permission={`reports.${REPORT_CATEGORIES[domain.categoryPath] ?? domain.categoryPath}.view`}>
      <WorkspaceLayout hideHeader>
        <ReportDomainPanel domainId={domain.categoryPath} />
      </WorkspaceLayout>
    </PermissionGuard>
  )
}
