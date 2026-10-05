/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy } from 'react'
import { ProtectedRoute } from '@/router/guards'

const ImportPage = lazy(() => import('./pages/ImportPage'))

export const importsRoutes = [
  {
    path: '/master-data/import',
    // Tanpa requireOnboarding: Step Saldo Awal wizard menautkan ke sini saat setup belum selesai.
    element: (
      <ProtectedRoute permission="imports.view" requireCompany>
        <ImportPage />
      </ProtectedRoute>
    ),
  },
]
