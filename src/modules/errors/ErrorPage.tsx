import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  code: string
  message: string
  actions?: React.ReactNode
}

export function ErrorPage({ code, message, actions }: ErrorPageProps) {
  return (
    <div className="min-h-dvh bg-[#EFEFED] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-[80px] font-bold text-[#d9e2e5] leading-none mb-4 tabular-nums select-none">
          {code}
        </div>
        <p className="text-sm text-[#64748b] mb-8">{message}</p>
        {actions && <div className="flex gap-3 justify-center">{actions}</div>}
      </div>
    </div>
  )
}

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <ErrorPage
      code="403"
      message="Anda tidak memiliki akses ke halaman ini."
      actions={
        <>
          <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
          <Button className="bg-[#e39774] hover:bg-[#d4845e]" onClick={() => navigate('/')}>Ke Dashboard</Button>
        </>
      }
    />
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <ErrorPage
      code="404"
      message="Halaman tidak ditemukan."
      actions={
        <>
          <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
          <Button className="bg-[#e39774] hover:bg-[#d4845e]" onClick={() => navigate('/')}>Ke Dashboard</Button>
        </>
      }
    />
  )
}

export function ServerErrorPage() {
  const navigate = useNavigate()
  return (
    <ErrorPage
      code="500"
      message="Terjadi kesalahan pada server. Coba lagi."
      actions={
        <>
          <Button variant="outline" onClick={() => window.location.reload()}>Coba Lagi</Button>
          <Button className="bg-[#e39774] hover:bg-[#d4845e]" onClick={() => navigate('/')}>Ke Dashboard</Button>
        </>
      }
    />
  )
}
