/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '@/router/guards'

const FixedAssetListPage = lazy(() => import('./pages/FixedAssetListPage'))
const FixedAssetFormPage = lazy(() => import('./pages/FixedAssetFormPage'))
const FixedAssetCategoryPage = lazy(() => import('./pages/FixedAssetCategoryPage'))
const FixedAssetRegisterReportPage = lazy(() => import('./pages/reports/FixedAssetRegisterReportPage'))
const FixedAssetDepreciationReportPage = lazy(() => import('./pages/reports/FixedAssetDepreciationReportPage'))
const FixedAssetDisposalsReportPage = lazy(() => import('./pages/reports/FixedAssetDisposalsReportPage'))
const FixedAssetReconciliationReportPage = lazy(() => import('./pages/reports/FixedAssetReconciliationReportPage'))

export const fixedAssetRoutes: RouteObject[] = [
  { path: '/fixed-assets', element: <ProtectedRoute permission="fixed_assets.view"><FixedAssetListPage /></ProtectedRoute> },
  { path: '/fixed-assets/create', element: <ProtectedRoute permission="fixed_assets.create"><FixedAssetFormPage /></ProtectedRoute> },
  { path: '/fixed-assets/categories', element: <ProtectedRoute permission="fixed_assets.settings.view"><FixedAssetCategoryPage /></ProtectedRoute> },
  { path: '/fixed-assets/reports/register', element: <ProtectedRoute permission="fixed_assets.reports.view"><FixedAssetRegisterReportPage /></ProtectedRoute> },
  { path: '/fixed-assets/reports/depreciation', element: <ProtectedRoute permission="fixed_assets.reports.view"><FixedAssetDepreciationReportPage /></ProtectedRoute> },
  { path: '/fixed-assets/reports/disposals', element: <ProtectedRoute permission="fixed_assets.reports.view"><FixedAssetDisposalsReportPage /></ProtectedRoute> },
  { path: '/fixed-assets/reports/reconciliation', element: <ProtectedRoute permission="fixed_assets.reports.view"><FixedAssetReconciliationReportPage /></ProtectedRoute> },
  { path: '/fixed-assets/:id', element: <ProtectedRoute permission="fixed_assets.view"><FixedAssetFormPage /></ProtectedRoute> },
]
