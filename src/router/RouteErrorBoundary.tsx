import { useEffect } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ErrorPage, NotFoundPage } from '@/modules/errors/ErrorPage'
import { logRouteError } from './routerTelemetry'

/**
 * Production-safe route error boundary (A13-254).
 *
 * Dipasang sebagai `errorElement` pada route tree. Menggantikan default
 * "Unexpected Application Error" milik React Router yang membocorkan
 * message/stack/source path ke user.
 *
 * Aturan:
 * - 404 response tetap memakai NotFoundPage;
 * - error lain merender copy generik + recovery action (coba lagi / dashboard);
 * - raw message/stack TIDAK pernah dirender, hanya dicatat via logRouteError.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  useEffect(() => {
    logRouteError(error, { boundary: 'route', location: window.location.pathname })
  }, [error])

  // Route response 404 → not-found canonical.
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  return (
    <ErrorPage
      code="500"
      message="Terjadi kesalahan saat memuat halaman. Coba muat ulang atau kembali ke dashboard."
      actions={
        <>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e]"
            onClick={() => navigate('/', { replace: true })}
          >
            Ke Dashboard
          </Button>
        </>
      }
    />
  )
}
