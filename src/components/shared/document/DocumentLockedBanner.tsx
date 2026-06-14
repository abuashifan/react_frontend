import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { DocumentStatusBadge } from './DocumentStatusBadge'
import type { DocumentStatus } from '@/types/common.types'

export interface DocumentDependence {
  type: string
  number: string
  status: DocumentStatus
  path: string
}

interface DocumentLockedBannerProps {
  dependences: DocumentDependence[]
}

/** Explains downstream posted documents that lock the current document. */
export function DocumentLockedBanner({ dependences }: DocumentLockedBannerProps) {
  if (dependences.length === 0) return null

  return (
    <div className="mb-3 flex gap-2.5 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[#92400e]">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">Dokumen ini terkunci.</p>
        <p className="mt-0.5 text-[12px]">
          Void transaksi berikut terlebih dahulu (dari hilir ke hulu):
        </p>
        <div className="mt-2 flex flex-col gap-1">
          {dependences.map((dependence) => (
            <div key={`${dependence.type}-${dependence.number}`} className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <span>· {dependence.number} ({dependence.type})</span>
              <span aria-hidden="true">-</span>
              <DocumentStatusBadge status={dependence.status} size="xs" />
              <Link
                to={dependence.path}
                className="ml-1 text-[#5c9ead] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead]"
              >
                Lihat →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
