import { Bookmark, LayoutGrid, Search } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Input } from '@/components/ui/input'
import { useTabFormState } from '@/hooks/useTabFormState'
import { ReportDomainPanel } from '../components/ReportDomainPanel'
import { SavedReportsPanel } from '../components/SavedReportsPanel'
import { REPORT_DOMAINS, DOMAIN_BY_PATH, filterReports } from '../constants/reportCategories'
import { DOMAIN_ICONS } from '../constants/reportDomainIcons'
import { cn } from '@/lib/utils'

/** 'saved' = laporan tersimpan, 'all' = semua kategori, selain itu = categoryPath domain. */
type SidebarKey = 'saved' | 'all' | (string & {})

interface SidebarEntry {
  key: SidebarKey
  label: string
  icon: typeof LayoutGrid
}

const SIDEBAR_ENTRIES: SidebarEntry[] = [
  { key: 'saved', label: 'Tersimpan', icon: Bookmark },
  { key: 'all', label: 'Semua Laporan', icon: LayoutGrid },
  ...REPORT_DOMAINS.map((domain) => ({
    key: domain.categoryPath,
    label: domain.label,
    icon: DOMAIN_ICONS[domain.categoryPath] ?? LayoutGrid,
  })),
]

interface ReportListState extends Record<string, unknown> {
  category: SidebarKey
  query: string
}

const DEFAULT_STATE: ReportListState = { category: 'all', query: '' }

export default function ReportListPage() {
  // Kategori & teks cari dititipkan ke tab pemiliknya supaya tidak hilang saat
  // user berpindah tab (halaman ini di-unmount oleh router outlet).
  const [{ category, query }, patchState] = useTabFormState<ReportListState>(DEFAULT_STATE)

  const activeEntry = SIDEBAR_ENTRIES.find((entry) => entry.key === category) ?? SIDEBAR_ENTRIES[1]
  const isSaved = category === 'saved'
  const isAll = category === 'all'

  const domains = isAll ? REPORT_DOMAINS : [DOMAIN_BY_PATH[category]].filter(Boolean)
  const visibleDomains = domains.filter((domain) => filterReports(domain.reports, query).length > 0)

  return (
    <WorkspaceLayout hideHeader>
      <div className="flex h-full min-h-0 gap-4">
        <aside className="w-[200px] shrink-0 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white p-1.5">
          {SIDEBAR_ENTRIES.map((entry) => {
            const Icon = entry.icon
            const isActive = entry.key === category
            return (
              <button
                key={entry.key}
                type="button"
                aria-current={isActive}
                onClick={() => patchState({ category: entry.key })}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] transition-colors',
                  isActive
                    ? 'bg-[#5c9ead] font-medium text-white'
                    : 'text-[#334155] hover:bg-[#f1f5f9]',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-[#64748b]')} />
                <span className="truncate">{entry.label}</span>
              </button>
            )
          })}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#1e293b]">{activeEntry.label}</h2>
            {!isSaved && (
              <div className="relative w-full max-w-[240px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={query}
                  onChange={(event) => patchState({ query: event.target.value })}
                  placeholder="Cari..."
                  aria-label="Cari laporan"
                  className="h-8 pl-8 text-[12px]"
                />
              </div>
            )}
          </div>

          {isSaved && <SavedReportsPanel />}

          {!isSaved && visibleDomains.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-white py-12 text-center text-[13px] text-[#94a3b8]">
              Tidak ada laporan cocok dengan "{query}".
            </div>
          )}

          {!isSaved &&
            visibleDomains.map((domain) => (
              <div key={domain.categoryPath} className="flex flex-col gap-2">
                {/* Judul per-domain hanya perlu saat semua kategori ditampilkan —
                    kalau satu kategori, judulnya sudah ada di header di atas. */}
                {isAll && (
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                    {domain.label}
                  </h3>
                )}
                <ReportDomainPanel domainId={domain.categoryPath} searchQuery={query} />
              </div>
            ))}
        </section>
      </div>
    </WorkspaceLayout>
  )
}
