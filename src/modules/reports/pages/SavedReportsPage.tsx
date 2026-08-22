import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { SavedReportsPanel } from '../components/SavedReportsPanel'

export default function SavedReportsPage() {
  return (
    <WorkspaceLayout hideHeader>
      <SavedReportsPanel />
    </WorkspaceLayout>
  )
}
