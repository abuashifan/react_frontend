import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronDown, Plus, Power, PowerOff } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/useToast'
import { useCoaList, useCoaMutations } from '../hooks/useCoaList'
import type { Coa, CoaType } from '../types/coa.types'
import { cn } from '@/lib/utils'

const COA_TYPE_LABELS: Record<CoaType, string> = {
  asset: 'Aset',
  liability: 'Liabilitas',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  expense: 'Beban',
}

function buildTree(flat: Coa[]): Coa[] {
  const map = new Map<number, Coa>()
  const roots: Coa[] = []

  flat.forEach((item) => map.set(item.id, { ...item, children: [] }))

  flat.forEach((item) => {
    const node = map.get(item.id)!
    if (item.parent_account_id && map.has(item.parent_account_id)) {
      map.get(item.parent_account_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

interface CoaRowProps {
  node: Coa
  level: number
  selectedIds: string[]
  onSelect: (id: string) => void
  onNavigate: (id: number) => void
  onToggleActive: (node: Coa) => void
  isTogglingId: number | null
}

function CoaRow({ node, level, selectedIds, onSelect, onNavigate, onToggleActive, isTogglingId }: CoaRowProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = (node.children?.length ?? 0) > 0
  const isSelected = selectedIds.includes(String(node.id))
  const isToggling = isTogglingId === node.id

  return (
    <>
      <tr
        className={cn(
          'h-9 border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fbfc]',
          isSelected && 'bg-[#EFF9FB]',
        )}
      >
        <td className="sticky left-0 w-8 bg-inherit px-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(String(node.id))}
          />
        </td>
        <td
          className="sticky left-8 bg-inherit px-3 py-2 font-medium text-[#5c9ead] hover:text-[#326273] hover:underline cursor-pointer"
          style={{ paddingLeft: `${12 + level * 20}px` }}
        >
          <div className="flex items-center gap-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-[#64748b] hover:text-[#326273] flex-shrink-0"
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-3.5 flex-shrink-0" />
            )}
            <span onClick={() => onNavigate(node.id)}>{node.account_code}</span>
          </div>
        </td>
        <td className="px-3 py-2 text-[13px] text-[#24323a] cursor-pointer" onClick={() => onNavigate(node.id)}>
          {node.account_name}
        </td>
        <td className="px-3 py-2 text-[13px] text-[#64748b]">
          {COA_TYPE_LABELS[node.account_type]}
        </td>
        <td className="px-3 py-2">
          <Badge
            className={cn(
              'text-[11px] px-2 py-0.5 rounded-full font-medium',
              node.is_active
                ? 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]'
                : 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
            )}
          >
            {node.is_active ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </td>
        <td className="px-3 py-2">
          <PermissionGuard permission="master-data.coa.edit">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[12px] text-[#64748b] hover:text-[#326273]"
              onClick={() => onToggleActive(node)}
              disabled={isToggling}
            >
              {node.is_active ? (
                <><PowerOff className="w-3.5 h-3.5 mr-1" />Nonaktifkan</>
              ) : (
                <><Power className="w-3.5 h-3.5 mr-1" />Aktifkan</>
              )}
            </Button>
          </PermissionGuard>
        </td>
      </tr>
      {expanded && node.children?.map((child) => (
        <CoaRow
          key={child.id}
          node={child}
          level={level + 1}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onNavigate={onNavigate}
          onToggleActive={onToggleActive}
          isTogglingId={isTogglingId}
        />
      ))}
    </>
  )
}

export default function CoaListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filterType, setFilterType] = useState<CoaType | undefined>()
  const [filterActive, setFilterActive] = useState<boolean | undefined>()
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const { data, isLoading } = useCoaList({
    page: 1,
    per_page: 100,
    account_type: filterType,
    is_active: filterActive,
  })

  const { activate, deactivate } = useCoaMutations()

  const flat = data?.data ?? []
  const tree = buildTree(flat)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleToggleActive = async (node: Coa) => {
    setTogglingId(node.id)
    try {
      if (node.is_active) {
        await deactivate.mutateAsync(node.id)
        toast.success(`Akun "${node.account_name}" dinonaktifkan.`)
      } else {
        await activate.mutateAsync(node.id)
        toast.success(`Akun "${node.account_name}" diaktifkan.`)
      }
    } catch {
      toast.error('Gagal mengubah status akun.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleBulkActivate = async () => {
    for (const id of selectedIds) {
      await activate.mutateAsync(Number(id))
    }
    toast.success(`${selectedIds.length} akun diaktifkan.`)
    setSelectedIds([])
  }

  const handleBulkDeactivate = async () => {
    for (const id of selectedIds) {
      await deactivate.mutateAsync(Number(id))
    }
    toast.success(`${selectedIds.length} akun dinonaktifkan.`)
    setSelectedIds([])
  }

  const activeFilterCount = [filterType, filterActive].filter((v) => v !== undefined).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterType(undefined); setFilterActive(undefined) }}
    >
      <FilterSection title="Tipe Akun">
        {(['asset', 'liability', 'equity', 'revenue', 'expense'] as CoaType[]).map((t) => (
          <label key={t} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filterType === t}
              onCheckedChange={(checked) => setFilterType(checked ? t : undefined)}
            />
            <span className="text-[12px] text-[#334155]">{COA_TYPE_LABELS[t]}</span>
          </label>
        ))}
      </FilterSection>
      <FilterSection title="Status">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filterActive === true}
            onCheckedChange={(checked) => setFilterActive(checked ? true : undefined)}
          />
          <span className="text-[12px] text-[#334155]">Aktif</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filterActive === false}
            onCheckedChange={(checked) => setFilterActive(checked ? false : undefined)}
          />
          <span className="text-[12px] text-[#334155]">Nonaktif</span>
        </label>
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Chart of Accounts"
      breadcrumb={[{ label: 'Master Data' }, { label: 'COA' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="master-data.coa.create">
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
            onClick={() => navigate('/master-data/coa/create')}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Akun
          </Button>
        </PermissionGuard>
      }
    >
      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-[#5c9ead] bg-[#EFF9FB] px-4 py-2">
          <span className="text-[13px] font-medium text-[#326273]">
            {selectedIds.length} item dipilih
          </span>
          <div className="flex items-center gap-2">
            <PermissionGuard permission="master-data.coa.edit">
              <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={handleBulkActivate}>
                Aktifkan
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={handleBulkDeactivate}>
                Nonaktifkan
              </Button>
            </PermissionGuard>
            <button
              type="button"
              className="text-[12px] text-[#64748b] hover:text-[#24323a]"
              onClick={() => setSelectedIds([])}
            >
              Batalkan pilihan
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[#d9e2e5] bg-[#eeeeee] h-9">
                <th className="sticky left-0 z-20 bg-[#eeeeee] w-8 px-2">
                  <Checkbox
                    checked={selectedIds.length === flat.length && flat.length > 0}
                    onCheckedChange={(v) => setSelectedIds(v ? flat.map((r) => String(r.id)) : [])}
                    disabled={flat.length === 0}
                  />
                </th>
                <th className="sticky left-8 z-20 bg-[#eeeeee] px-3 text-left text-[11px] font-bold uppercase text-[#64748b] tracking-wide min-w-[140px]">Kode</th>
                <th className="px-3 text-left text-[11px] font-bold uppercase text-[#64748b] tracking-wide min-w-[200px]">Nama Akun</th>
                <th className="px-3 text-left text-[11px] font-bold uppercase text-[#64748b] tracking-wide min-w-[120px]">Tipe</th>
                <th className="px-3 text-left text-[11px] font-bold uppercase text-[#64748b] tracking-wide min-w-[100px]">Status</th>
                <th className="px-3 text-left text-[11px] font-bold uppercase text-[#64748b] tracking-wide min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="h-9 border-b border-[#f1f5f9]">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-3 py-2">
                        <Skeleton className="h-4 w-24 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tree.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[13px] text-[#94a3b8]">
                    Belum ada akun. Klik "Tambah Akun" untuk memulai.
                  </td>
                </tr>
              ) : (
                tree.map((node) => (
                  <CoaRow
                    key={node.id}
                    node={node}
                    level={0}
                    selectedIds={selectedIds}
                    onSelect={toggleSelect}
                    onNavigate={(id) => navigate(`/master-data/coa/${id}`)}
                    onToggleActive={handleToggleActive}
                    isTogglingId={togglingId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
