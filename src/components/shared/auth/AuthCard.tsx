import type { ReactNode } from 'react'
import { APP_NAME } from '@/lib/constants'

interface AuthCardProps {
  title: string
  description?: string
  children: ReactNode
}

/** Kartu satu kolom untuk layar di luar login: lupa/atur ulang sandi dan terima undangan. */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#EFEFED] p-6">
      <section className="w-full max-w-[400px] rounded-xl bg-white px-8 py-9 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#326273]">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="font-semibold text-[#24323a]">{APP_NAME}</span>
        </div>
        <h1 className="mb-1.5 text-[20px] font-semibold text-[#24323a]">{title}</h1>
        {description && <p className="mb-6 text-sm text-[#64748b]">{description}</p>}
        {children}
      </section>
    </main>
  )
}
