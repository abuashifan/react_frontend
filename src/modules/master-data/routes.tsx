import React, { lazy } from 'react'
import { ProtectedRoute } from '@/router/guards'

const CoaListPage = lazy(() => import('./pages/CoaListPage'))
const CoaFormPage = lazy(() => import('./pages/CoaFormPage'))
const KontakListPage = lazy(() => import('./pages/KontakListPage'))
const KontakFormPage = lazy(() => import('./pages/KontakFormPage'))
const ProdukListPage = lazy(() => import('./pages/ProdukListPage'))
const ProdukFormPage = lazy(() => import('./pages/ProdukFormPage'))
const KategoriProdukPage = lazy(() => import('./pages/KategoriProdukPage'))
const SatuanPage = lazy(() => import('./pages/SatuanPage'))
const GudangPage = lazy(() => import('./pages/GudangPage'))
const PaymentTermsPage = lazy(() => import('./pages/PaymentTermsPage'))
const DepartemenPage = lazy(() => import('./pages/DepartemenPage'))
const ProyekPage = lazy(() => import('./pages/ProyekPage'))
const AccountMappingPage = lazy(() => import('./pages/AccountMappingPage'))

const guard = (permission: string, children: React.ReactNode) => (
  <ProtectedRoute permission={permission} requireCompany requireOnboarding>
    {children}
  </ProtectedRoute>
)

export const masterDataRoutes = [
  { path: '/master-data/coa', element: guard('master-data.coa.view', <CoaListPage />) },
  { path: '/master-data/coa/create', element: guard('master-data.coa.create', <CoaFormPage />) },
  { path: '/master-data/coa/:id', element: guard('master-data.coa.view', <CoaFormPage />) },
  { path: '/master-data/contacts', element: guard('master-data.contacts.view', <KontakListPage />) },
  { path: '/master-data/contacts/create', element: guard('master-data.contacts.create', <KontakFormPage />) },
  { path: '/master-data/contacts/:id', element: guard('master-data.contacts.view', <KontakFormPage />) },
  { path: '/master-data/products', element: guard('master-data.products.view', <ProdukListPage />) },
  { path: '/master-data/products/create', element: guard('master-data.products.create', <ProdukFormPage />) },
  { path: '/master-data/products/:id', element: guard('master-data.products.view', <ProdukFormPage />) },
  { path: '/master-data/product-categories', element: guard('master-data.product-categories.view', <KategoriProdukPage />) },
  { path: '/master-data/units', element: guard('master-data.units.view', <SatuanPage />) },
  { path: '/master-data/warehouses', element: guard('master-data.warehouses.view', <GudangPage />) },
  { path: '/master-data/payment-terms', element: guard('master-data.payment-terms.view', <PaymentTermsPage />) },
  { path: '/master-data/departments', element: guard('master-data.departments.view', <DepartemenPage />) },
  { path: '/master-data/projects', element: guard('master-data.projects.view', <ProyekPage />) },
  { path: '/master-data/account-mappings', element: guard('master-data.account-mappings.view', <AccountMappingPage />) },
]
