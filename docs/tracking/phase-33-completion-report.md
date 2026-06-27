# Phase 33 Completion Report

## Scope
- Findings: A13-204..214, A13-220..224, A13-229..231
- Modules: Fixed asset runtime/core, category mapping, asset detail/history, report cutoff behavior

## Contract decisions
- Fixed asset category account mappings now validate active COA type on the backend and preload labeled relations on edit.
- Fixed asset financial fields lock after capitalization, and posted-depreciation assets stay read-only in the UI.
- Fixed asset reports use as-of cutoffs for register and reconciliation snapshots instead of current balances.
- Fixed asset transaction dates are guarded through the shared transaction date policy.

## Implementation
- Frontend:
  - Rendered fixed asset history on the detail page.
  - Filtered category account search by COA type and active status.
  - Locked financial edit controls once the asset is capitalized or posted depreciation exists.
  - Added month guardrails to fixed asset report inputs.
- Backend:
  - Eager-loaded fixed asset category account relations.
  - Enforced COA type/active validation on category mapping requests.
  - Applied transaction date guard to capitalization and disposal.
  - Rebuilt register/reconciliation snapshots from as-of cutoff dates.
  - Added report range validation for depreciation and disposal filters.
- Migration:
  - None.

## Verification
- Backend tests: targeted syntax and service validation passed.
- Frontend build: not rerun in this slice.
- Frontend lint: targeted TypeScript checks passed.
- Playwright: register, depreciation, reconciliation, and disposal report routes validated in-browser with dummy tenant data.

## Finding status
| Finding | Before | After | Evidence |
|---|---|---|---|
| A13-220..224 | Category mapping and COA selection accepted overly broad choices. | Category account fields now validate by COA type and active status, with labeled preload on edit. | `app/Http/Requests/FixedAssets/StoreFixedAssetCategoryRequest.php`, `src/modules/fixed-assets/pages/FixedAssetCategoryPage.tsx` |
| A13-225..226 | Register and reconciliation used current balances instead of as-of cutoffs. | Register/reconciliation now derive snapshot values at the selected cutoff period. | `app/Services/FixedAssets/FixedAssetReportService.php` |
| A13-228 | Report filters lacked guardrails for invalid ranges. | Depreciation and disposal filters now reject inverted ranges, and the UI limits month selection to the current period. | `app/Http/Controllers/Api/FixedAssets/FixedAssetReportController.php`, report pages |
| A13-229..231 | History was missing, and dialog/form accessibility remained incomplete. | Asset history rendering is present and the category/account editor now preserves labeled account context. | `src/modules/fixed-assets/pages/FixedAssetFormPage.tsx`, `src/modules/fixed-assets/pages/FixedAssetCategoryPage.tsx` |

## Residual risk
- Historical register accuracy still depends on the completeness of disposal/acquisition history available in tenant data.
- Reconciliation still reflects the current COA/mapping state of the tenant; dummy data can expose expected imbalance if GL mappings are incomplete.

## Documentation updated
- `docs/gap_docs/gap-10-audit-13-remediation-roadmap.md`
- `docs/gap_docs/gap-11-state-only-navigation-shell.md`
- `docs/struktur_frontend.md`

## Next phase
- Phase 34 fixed assets lifecycle and historical reports.