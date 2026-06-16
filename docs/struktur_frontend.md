# Struktur Frontend

Peta ringkas untuk AI agent di `/workspace/frontend`.

Gunakan file ini dulu saat mencari lokasi file. Fokus ke file yang ditulis di bawah; jangan buang token untuk menelusuri `node_modules/` atau asset build kecuali memang sedang debug build.

## Root

```text
.
|____.claude/
| |____settings.local.json
|____.env.example
|____.gitignore
|____AGENTS.md
|____CLAUDE.md
|____README.md
|____components.json
|____praproductions-docs/
| |____frontend-backend-gap-audit-2026-06-15.md
|____docs/
| |____AGENT_ENTRY_POINT.md
| |____audit-design-spec-2026-06-14.md
| |____audit_docs/
| | |____audit-00-backend-audit-index.md
| | |____audit-01-architecture-overview.md
| | |____audit-02-api-route-map.md
| | |____audit-03-database-erd-and-models.md
| | |____audit-04-sales-workflow-audit.md
| | |____audit-05-purchase-workflow-audit.md
| | |____audit-06-inventory-workflow-audit.md
| | |____audit-07-accounting-and-reporting-audit.md
| | |____audit-08-business-rules-and-validation-map.md
| | |____audit-09-risk-gap-and-improvement-backlog.md
| | |____audit-design-tablet-first.md
| | |____audit-10-ai-agent-context.md
| | |____audit-ar-account-mapping-erd.md
| | |____audit-coding-standards.md
| | |____audit-frontend-api-contract.md
| | |____audit-gap-completion-tracker.md
| | |____audit-tech-stack.md
| | |____audit-11-frontend-global-contract-map-16-06-26.md
| |____design_docs/
| | |____design-A1-topbar-ribbon.md
| | |____design-A2-ribbon-overflow-tablet.md
| | |____design-B-auth-pages.md
| | |____design-C1-datatable.md
| | |____design-C2-filter-sidebar.md
| | |____design-C3-searchable-select.md
| | |____design-C4-tablet-datatable-viewport.md
| | |____design-C5-filter-sidebar-tablet.md
| | |____design-D1-form-layout.md
| | |____design-D2-line-items-table.md
| | |____design-D3-bottom-action-bar.md
| | |____design-D4-form-summary.md
| | |____design-D5-document-locked-banner.md
| | |____design-D6-tablet-form-viewport.md
| | |____design-E2-toast.md
| | |____design-E3-void-dialog.md
| | |____design-E4-empty-state.md
| | |____design-E5-overlay-collision-rules.md
| | |____design-E6-focus-keyboard-accessibility.md
| | |____design-E7-status-badges.md
| | |____design-F1-onboarding-wizard.md
| | |____design-G-settings.md
| | |____design-H1-dashboard.md
| | |____design-H2-dashboard-tablet-landscape.md
| | |____design-I-reports.md
| | |____design-J1-tablet-landscape-shell.md
| | |____design-K-mobile-bottom-navigation.md
| | |____design-L-error-pages.md
| | |____design-M-print-export.md
| |____gap_docs/
| | |____gap-00-master-index.md
| | |____gap-01-p0-contract-fixes.md
| | |____gap-02-settings-access-mismatch.md
| | |____gap-03-missing-modules.md
| | |____gap-04-setup-wizard-refactor.md
| | |____gap-05-dashboard-no-backend.md
| | |____gap-06-report-gaps.md
| | |____gap-07-master-data-dto-contract.md
| | |____gap-08-transaction-dto-number-contract.md
| |____issue_docs/
| | |____issue-01-permission-keys.md
| | |____issue-02-ribbon-paths.md
| | |____issue-03-fiscal-year-http-methods.md
| | |____issue-04-bank-recon-methods.md
| | |____issue-05-settings-endpoints.md
| | |____issue-06-report-endpoint-fixes.md
| | |____issue-07-route-ribbon-canonical-map.md
| | |____issue-08-product-dto-and-table.md
| | |____issue-09-master-data-delete-actions.md
| | |____issue-10-journal-list-totals-and-account-labels.md
| | |____issue-11-dashboard-graceful-fallback.md
| | |____issue-12-searchable-select-selected-options-audit.md
| | |____issue-13-formatters-null-invalid-guard.md
| | |____issue-14-api-error-display-and-form-errors.md
| | |____issue-15-datatable-reuse-and-sticky-column-audit.md
| |____praproduction_docs/
| | |____CLAUDE.md
| | |____spec-01-project-context.md
| | |____spec-02-stack-and-dependencies.md
| | |____spec-03-folder-structure.md
| | |____spec-04-design-tokens.md
| | |____spec-05-layout-and-navigation.md
| | |____spec-06-responsive-rules.md
| | |____spec-07-component-library.md
| | |____spec-08-form-architecture.md
| | |____spec-09-table-and-list.md
| | |____spec-10-document-workflow.md
| | |____spec-11-permission-rules.md
| | |____spec-12-api-integration.md
| | |____spec-13-filter-and-search.md
| | |____spec-14-notification-rules.md
| | |____spec-15-module-patterns.md
| | |____spec-16-reports-module.md
| | |____spec-17-auth-and-company.md
| | |____spec-18-onboarding-wizard.md
| | |____spec-19-settings-module.md
| | |____spec-20-dashboard.md
| | |____spec-21-error-pages-and-print-export.md
| | |____spec-22-implementation-roadmap.md
| | |____spec-23-tablet-first-layout-rules.md
| | |____spec-24-auth-session-contract-clarifications.md
| | |____spec-25-viewport-list.md
| | |____spec-26-p0-contract-fixes.md
| | |____spec-27-settings-access-refactor.md
| | |____spec-28-fixed-assets-module.md
| | |____spec-29-opening-balance-module.md
| | |____spec-30-setup-wizard-refactor.md
| | |____spec-31-period-end-module.md
| | |____spec-32-master-data-dto-contract-fixes.md
| | |____spec-33-transaction-dto-number-contract.md
| | |____spec-34-route-ribbon-canonical-map.md
| | |____spec-35-shared-runtime-hardening.md
| |____prompt/
| | |____prompt-00-master-index.md
| | |____prompt-guardrails-audit-11-implementation.md
| | |____prompt-phase-1A-project-setup.md
| | |____prompt-phase-1B-auth-pages.md
| | |____prompt-phase-1C-app-shell-layout.md
| | |____prompt-phase-1C-section-state-connection.md
| | |____prompt-phase-1D-shared-components.md
| | |____prompt-phase-1E-error-onboarding.md
| | |____prompt-phase-2-master-data.md
| | |____prompt-phase-3-sales.md
| | |____prompt-phase-4-purchase.md
| | |____prompt-phase-5-inventory.md
| | |____prompt-phase-6-accounting-reports.md
| | |____prompt-phase-7-dashboard-settings.md
| | |____prompt-phase-8-p0-contract-fixes.md
| | |____prompt-phase-9-settings-access-refactor.md
| | |____prompt-phase-10-fixed-assets.md
| | |____prompt-phase-11-opening-balance.md
| | |____prompt-phase-12-setup-wizard.md
| | |____prompt-phase-13-period-end.md
| | |____prompt-phase-14-master-data-dto-contract-fixes.md
| | |____prompt-phase-15-transaction-dto-number-contract.md
| | |____prompt-phase-16-route-ribbon-canonical-map.md
| | |____prompt-phase-17-shared-runtime-hardening.md
| |____tracking/
| | |____2026-06-16-route-tabs-datatable-fixes.md
| | |____2026-06-16-workspace-document-number-alias-fix.md
| |____struktur_frontend.md
|____eslint.config.js
|____index.html
|____package-lock.json
|____package.json
|____postcss.config.js
|____public/
| |____favicon.svg
| |____icons.svg
|____src/
| |____App.css
| |____App.tsx
| |____assets/
| | |____hero.png
| | |____react.svg
| | |____vite.svg
| | |____illustrations/
| | | |____login-illustration.svg
| |____components/
| | |____shared/
| | | |____PermissionGuard.tsx
| | | |____document/
| | | | |____DocumentActionBar.tsx
| | | | |____DocumentLockedBanner.tsx
| | | | |____DocumentStatusBadge.tsx
| | | | |____SystemGeneratedBadge.tsx
| | | | |____VoidConfirmDialog.tsx
| | | |____feedback/
| | | | |____EmptyState.tsx
| | | | |____ErrorBoundary.tsx
| | | | |____SessionWarningDialog.tsx
| | | |____form/
| | | | |____FormSection.tsx
| | | | |____FormSummary.tsx
| | | | |____LineItemsTable.tsx
| | | | |____SearchableSelect.tsx
| | | |____layout/
| | | | |____AppShell.tsx
| | | | |____FilterSidebar.tsx
| | | | |____FixedBottomBar.tsx
| | | | |____FormLayout.tsx
| | | | |____PrimaryTabs.tsx
| | | | |____RibbonPanel.tsx
| | | | |____SecondaryTabs.tsx
| | | | |____Topbar.tsx
| | | | |____WorkspaceLayout.tsx
| | | |____table/
| | | | |____BulkActionBar.tsx
| | | | |____DataTable.tsx
| | | | |____TablePagination.tsx
| | |____ui/
| | | |____alert-dialog.tsx
| | | |____alert.tsx
| | | |____badge.tsx
| | | |____button.tsx
| | | |____calendar.tsx
| | | |____checkbox.tsx
| | | |____dialog.tsx
| | | |____dropdown-menu.tsx
| | | |____form.tsx
| | | |____input.tsx
| | | |____label.tsx
| | | |____popover.tsx
| | | |____scroll-area.tsx
| | | |____select.tsx
| | | |____separator.tsx
| | | |____skeleton.tsx
| | | |____switch.tsx
| | | |____table.tsx
| | | |____tabs.tsx
| | | |____textarea.tsx
| | | |____toast.tsx
| | | |____toaster.tsx
| | | |____tooltip.tsx
| |____hooks/
| | |____use-toast.ts
| | |____useCompanySettings.ts
| | |____useDocumentActions.ts
| | |____usePermission.ts
| | |____useSessionTimeout.ts
| | |____useToast.ts
| | |____useViewMode.ts
| |____index.css
| |____lib/
| | |____constants.ts
| | |____utils.ts
| |____main.tsx
| |____modules/
| | |____accounting/
| | | |____hooks/
| | | | |____useFiscalYear.ts
| | | | |____useJournalEntryList.ts
| | | |____pages/
| | | | |____FiscalYearPage.tsx
| | | | |____JournalFormPage.tsx
| | | | |____JournalListPage.tsx
| | | | |____PeriodLockPage.tsx
| | | |____routes.tsx
| | | |____schemas/
| | | | |____journalEntrySchema.ts
| | | |____services/
| | | | |____fiscalYearApi.ts
| | | | |____journalEntryApi.ts
| | | | |____periodLockApi.ts
| | | |____types/
| | | | |____fiscalYear.types.ts
| | | | |____journalEntry.types.ts
| | |____auth/
| | | |____pages/
| | | | |____CompanyPickerPage.tsx
| | | | |____LoginPage.tsx
| | | |____schemas/
| | | | |____loginSchema.ts
| | | |____services/
| | | | |____authApi.ts
| | | | |____companyApi.ts
| | |____cash-bank/
| | | |____hooks/
| | | | |____useCashBankList.ts
| | | |____pages/
| | | | |____BankReconciliationFormPage.tsx
| | | | |____BankReconciliationListPage.tsx
| | | | |____BankTransferFormPage.tsx
| | | | |____BankTransferListPage.tsx
| | | | |____CashPaymentFormPage.tsx
| | | | |____CashPaymentListPage.tsx
| | | | |____CashReceiptFormPage.tsx
| | | | |____CashReceiptListPage.tsx
| | | |____routes.tsx
| | | |____schemas/
| | | | |____cashBankSchemas.ts
| | | |____services/
| | | | |____cashBankApi.ts
| | | |____types/
| | | | |____cashBank.types.ts
| | |____dashboard/
| | | |____components/
| | | | |____CashFlowChart.tsx
| | | | |____KpiCards.tsx
| | | | |____PendingDocumentAlerts.tsx
| | | | |____RecentActivity.tsx
| | | | |____SalesPurchaseChart.tsx
| | | |____hooks/
| | | | |____useDashboardData.ts
| | | |____pages/
| | | | |____DashboardPage.tsx
| | | |____services/
| | | | |____dashboardApi.ts
| | | |____types/
| | | | |____dashboard.types.ts
| | |____errors/
| | | |____ErrorPage.tsx
| | | |____MaintenancePage.tsx
| | | |____NetworkErrorPage.tsx
| | |____inventory/
| | | |____components/
| | | |____hooks/
| | | | |____useStockAdjustmentList.ts
| | | | |____useStockBalanceList.ts
| | | | |____useStockMovementList.ts
| | | | |____useStockOpnameList.ts
| | | |____pages/
| | | | |____StockAdjustmentFormPage.tsx
| | | | |____StockAdjustmentListPage.tsx
| | | | |____StockBalanceDetailPage.tsx
| | | | |____StockBalanceListPage.tsx
| | | | |____StockMovementFormPage.tsx
| | | | |____StockMovementListPage.tsx
| | | | |____StockOpnameFormPage.tsx
| | | | |____StockOpnameListPage.tsx
| | | |____routes.tsx
| | | |____schemas/
| | | | |____stockAdjustmentSchema.ts
| | | | |____stockMovementSchema.ts
| | | | |____stockOpnameSchema.ts
| | | |____services/
| | | | |____stockAdjustmentApi.ts
| | | | |____stockBalanceApi.ts
| | | | |____stockMovementApi.ts
| | | | |____stockOpnameApi.ts
| | | |____types/
| | | | |____stockAdjustment.types.ts
| | | | |____stockBalance.types.ts
| | | | |____stockMovement.types.ts
| | | | |____stockOpname.types.ts
| | |____master-data/
| | | |____hooks/
| | | | |____useAccountMappings.ts
| | | | |____useCoaList.ts
| | | | |____useKontakList.ts
| | | | |____useProdukList.ts
| | | | |____useSimpleLists.ts
| | | |____pages/
| | | | |____AccountMappingPage.tsx
| | | | |____CoaFormPage.tsx
| | | | |____CoaListPage.tsx
| | | | |____DepartemenPage.tsx
| | | | |____GudangPage.tsx
| | | | |____KategoriProdukPage.tsx
| | | | |____KontakFormPage.tsx
| | | | |____KontakListPage.tsx
| | | | |____PaymentTermsPage.tsx
| | | | |____ProdukFormPage.tsx
| | | | |____ProdukListPage.tsx
| | | | |____ProyekPage.tsx
| | | | |____SatuanPage.tsx
| | | |____routes.tsx
| | | |____schemas/
| | | | |____coaSchema.ts
| | | | |____departemenSchema.ts
| | | | |____gudangSchema.ts
| | | | |____kategoriProdukSchema.ts
| | | | |____kontakSchema.ts
| | | | |____paymentTermsSchema.ts
| | | | |____produkSchema.ts
| | | | |____proyekSchema.ts
| | | | |____satuanSchema.ts
| | | |____services/
| | | | |____accountMappingApi.ts
| | | | |____coaApi.ts
| | | | |____departemenApi.ts
| | | | |____gudangApi.ts
| | | | |____kategoriProdukApi.ts
| | | | |____kontakApi.ts
| | | | |____paymentTermsApi.ts
| | | | |____produkApi.ts
| | | | |____proyekApi.ts
| | | | |____satuanApi.ts
| | | |____types/
| | | | |____accountMapping.types.ts
| | | | |____coa.types.ts
| | | | |____departemen.types.ts
| | | | |____gudang.types.ts
| | | | |____kategoriProduk.types.ts
| | | | |____kontak.types.ts
| | | | |____paymentTerms.types.ts
| | | | |____produk.types.ts
| | | | |____proyek.types.ts
| | | | |____satuan.types.ts
| | |____onboarding/
| | | |____components/
| | | | |____MasterDataQuickAdd.tsx
| | | | |____WizardSidebar.tsx
| | | | |____steps/
| | | | | |____Step1CompanyInfo.tsx
| | | | | |____Step2TemplateCOA.tsx
| | | | | |____Step3AccountMapping.tsx
| | | | | |____Step4MasterData.tsx
| | | | | |____Step5OpeningBalance.tsx
| | | | | |____Step6Complete.tsx
| | | |____constants.ts
| | | |____pages/
| | | | |____OnboardingPage.tsx
| | | |____schemas/
| | | | |____companyInfoSchema.ts
| | | |____services/
| | | | |____onboardingApi.ts
| | |____purchase/
| | | |____hooks/
| | | | |____useApData.ts
| | | | |____useGoodsReceiptList.ts
| | | | |____usePurchaseOrderList.ts
| | | | |____usePurchaseRequestList.ts
| | | | |____usePurchaseReturnList.ts
| | | | |____useVendorBillList.ts
| | | | |____useVendorDepositList.ts
| | | | |____useVendorPaymentList.ts
| | | |____pages/
| | | | |____ApAgingPage.tsx
| | | | |____ApReconciliationPage.tsx
| | | | |____ApSummaryPage.tsx
| | | | |____BillLedgerPage.tsx
| | | | |____GoodsReceiptFormPage.tsx
| | | | |____GoodsReceiptListPage.tsx
| | | | |____PurchaseOrderFormPage.tsx
| | | | |____PurchaseOrderListPage.tsx
| | | | |____PurchaseRequestFormPage.tsx
| | | | |____PurchaseRequestListPage.tsx
| | | | |____PurchaseReturnFormPage.tsx
| | | | |____PurchaseReturnListPage.tsx
| | | | |____VendorBillFormPage.tsx
| | | | |____VendorBillListPage.tsx
| | | | |____VendorDepositFormPage.tsx
| | | | |____VendorDepositListPage.tsx
| | | | |____VendorLedgerPage.tsx
| | | | |____VendorPaymentFormPage.tsx
| | | | |____VendorPaymentListPage.tsx
| | | |____routes.tsx
| | | |____schemas/
| | | | |____goodsReceiptSchema.ts
| | | | |____purchaseOrderSchema.ts
| | | | |____purchaseRequestSchema.ts
| | | | |____purchaseReturnSchema.ts
| | | | |____vendorBillSchema.ts
| | | | |____vendorDepositSchema.ts
| | | | |____vendorPaymentSchema.ts
| | | |____services/
| | | | |____apApi.ts
| | | | |____fixedAssetCategoryApi.ts
| | | | |____goodsReceiptApi.ts
| | | | |____purchaseOrderApi.ts
| | | | |____purchaseRequestApi.ts
| | | | |____purchaseReturnApi.ts
| | | | |____vendorBillApi.ts
| | | | |____vendorDepositApi.ts
| | | | |____vendorPaymentApi.ts
| | | |____types/
| | | | |____ap.types.ts
| | | | |____goodsReceipt.types.ts
| | | | |____purchaseOrder.types.ts
| | | | |____purchaseRequest.types.ts
| | | | |____purchaseReturn.types.ts
| | | | |____vendorBill.types.ts
| | | | |____vendorDeposit.types.ts
| | | | |____vendorPayment.types.ts
| | |____reports/
| | | |____components/
| | | | |____ReportCompactBar.tsx
| | | | |____ReportFilterParameter.tsx
| | | |____hooks/
| | | | |____useReportExport.ts
| | | |____pages/
| | | | |____ApAgingReportPage.tsx
| | | | |____ArAgingReportPage.tsx
| | | | |____BalanceSheetPage.tsx
| | | | |____CashFlowPage.tsx
| | | | |____FinancialSummaryPage.tsx
| | | | |____GeneralLedgerPage.tsx
| | | | |____InventoryAnalysisPage.tsx
| | | | |____ProfitLossPage.tsx
| | | | |____ReconciliationPage.tsx
| | | | |____ReportIndexPage.tsx
| | | | |____StockReportPage.tsx
| | | | |____TransactionListPage.tsx
| | | | |____TrialBalancePage.tsx
| | | |____routes.tsx
| | | |____services/
| | | | |____reportsApi.ts
| | | |____types/
| | | | |____reports.types.ts
| | |____sales/
| | | |____components/
| | | | |____SourceDocumentPicker.tsx
| | | |____hooks/
| | | | |____useArData.ts
| | | | |____useCustomerDepositList.ts
| | | | |____useDeliveryOrderList.ts
| | | | |____useProformaList.ts
| | | | |____useQuotationList.ts
| | | | |____useSalesInvoiceList.ts
| | | | |____useSalesOrderList.ts
| | | | |____useSalesReceiptList.ts
| | | | |____useSalesReturnList.ts
| | | |____pages/
| | | | |____ArAgingPage.tsx
| | | | |____ArReconciliationPage.tsx
| | | | |____ArSummaryPage.tsx
| | | | |____CustomerDepositFormPage.tsx
| | | | |____CustomerDepositListPage.tsx
| | | | |____CustomerLedgerPage.tsx
| | | | |____DeliveryOrderFormPage.tsx
| | | | |____DeliveryOrderListPage.tsx
| | | | |____InvoiceLedgerPage.tsx
| | | | |____ProformaFormPage.tsx
| | | | |____ProformaListPage.tsx
| | | | |____QuotationFormPage.tsx
| | | | |____QuotationListPage.tsx
| | | | |____SalesInvoiceFormPage.tsx
| | | | |____SalesInvoiceListPage.tsx
| | | | |____SalesOrderFormPage.tsx
| | | | |____SalesOrderListPage.tsx
| | | | |____SalesReceiptFormPage.tsx
| | | | |____SalesReceiptListPage.tsx
| | | | |____SalesReturnFormPage.tsx
| | | | |____SalesReturnListPage.tsx
| | | |____routes.tsx
| | | |____schemas/
| | | | |____customerDepositSchema.ts
| | | | |____deliveryOrderSchema.ts
| | | | |____proformaSchema.ts
| | | | |____quotationSchema.ts
| | | | |____salesInvoiceSchema.ts
| | | | |____salesOrderSchema.ts
| | | | |____salesReceiptSchema.ts
| | | | |____salesReturnSchema.ts
| | | |____services/
| | | | |____arApi.ts
| | | | |____customerDepositApi.ts
| | | | |____deliveryOrderApi.ts
| | | | |____proformaApi.ts
| | | | |____quotationApi.ts
| | | | |____salesInvoiceApi.ts
| | | | |____salesOrderApi.ts
| | | | |____salesReceiptApi.ts
| | | | |____salesReturnApi.ts
| | | | |____sourceDocumentApi.ts
| | | |____types/
| | | | |____ar.types.ts
| | | | |____customerDeposit.types.ts
| | | | |____deliveryOrder.types.ts
| | | | |____proforma.types.ts
| | | | |____quotation.types.ts
| | | | |____salesInvoice.types.ts
| | | | |____salesOrder.types.ts
| | | | |____salesReceipt.types.ts
| | | | |____salesReturn.types.ts
| | |____settings/
| | | |____hooks/
| | | | |____useSettings.ts
| | | |____pages/
| | | | |____AccountingPeriodPage.tsx
| | | | |____AccountMappingSettingsPage.tsx
| | | | |____CompanySettingsPage.tsx
| | | | |____MyPreferencesPage.tsx
| | | | |____RolesPage.tsx
| | | | |____TransactionSettingsPage.tsx
| | | | |____UsersPage.tsx
| | | |____routes.tsx
| | | |____services/
| | | | |____settingsApi.ts
| | | |____types/
| | | | |____settings.types.ts
| |____router/
| | |____guards.tsx
| | |____index.tsx
| | |____moduleConfig.ts
| | |____placeholders.tsx
| |____services/
| | |____http.ts
| |____stores/
| | |____useAuthStore.ts
| | |____useCompanyStore.ts
| | |____useTabStore.ts
| |____types/
| | |____api.types.ts
| | |____auth.types.ts
| | |____common.types.ts
|____tailwind.config.ts
|____tsconfig.app.json
|____tsconfig.json
|____tsconfig.node.json
|____vite.config.ts
|____dist/  # generated build output, ignore for normal navigation
|____node_modules/  # dependency tree, ignore for normal navigation
```

## Catatan

- Tree ini mengikuti isi folder frontend saat ini.
- `dist/` dan `node_modules/` memang ada, tetapi tidak perlu dibuka saat mencari source.
- Jika ada file baru, update peta ini dulu supaya agent lain bisa baca satu file ini saja.
