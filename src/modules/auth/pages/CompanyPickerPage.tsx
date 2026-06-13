import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { useToast } from '@/hooks/useToast'
import { authApi } from '../services/authApi'
import { companyApi } from '../services/companyApi'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'
import type { Company } from '@/types/auth.types'

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (mins < 60) return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days === 1) return 'Kemarin'
  return `${days} hari lalu`
}

function sortByLastAccessed(companies: Company[]): Company[] {
  return [...companies].sort((a, b) => {
    if (!a.last_accessed_at) return 1
    if (!b.last_accessed_at) return -1
    return new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()
  })
}

interface CompanyCardProps {
  company: Company
  onClick: () => void
  isLoading: boolean
}

function CompanyCard({ company, onClick, isLoading }: CompanyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'bg-white border border-[#d9e2e5] rounded-lg p-5',
        'cursor-pointer transition-all duration-150 text-left w-full',
        'hover:border-[#5c9ead] hover:shadow-md',
        'flex flex-col items-center text-center gap-3',
        'disabled:opacity-60 disabled:cursor-not-allowed',
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-[#EFF9FB] flex items-center justify-center">
        <Building2 className="w-6 h-6 text-[#5c9ead]" />
      </div>
      <div>
        <p className="font-semibold text-[#24323a] text-sm leading-snug">{company.name}</p>
        <p className="text-[11px] text-[#64748b] mt-1">
          {company.last_accessed_at
            ? `Terakhir diakses ${formatTimeAgo(company.last_accessed_at)}`
            : 'Belum pernah diakses'}
        </p>
      </div>
    </button>
  )
}

export function CompanyPickerPage() {
  const navigate = useNavigate()
  const { user, companies, setActiveCompany, setPermissions, logout } = useAuthStore()
  const { setActiveCompany: setCompanyStore } = useCompanyStore()
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const sorted = sortByLastAccessed(companies)

  async function handleSelectCompany(company: Company) {
    setLoadingId(company.id)
    try {
      const selectResponse = await companyApi.select(company.id)
      const activeCompany = selectResponse.data.active_company

      setActiveCompany(activeCompany.id)
      setCompanyStore(activeCompany)

      const permissionsResponse = await authApi.permissions()
      setPermissions(permissionsResponse.data.permissions)

      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Gagal memilih perusahaan. Coba lagi.')
      setLoadingId(null)
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      // Ignore network errors on logout
    }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#EFEFED] flex flex-col">
      <header className="bg-[#326273] px-6 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-white font-semibold text-sm">{APP_NAME}</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold text-[#24323a] mb-1">Pilih Perusahaan</h1>
            <p className="text-[13px] text-[#64748b]">
              Masuk sebagai: <span className="font-medium text-[#24323a]">{user?.email}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {sorted.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onClick={() => handleSelectCompany(company)}
                isLoading={loadingId !== null}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 text-[13px] text-[#64748b] border-[#d9e2e5]"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
