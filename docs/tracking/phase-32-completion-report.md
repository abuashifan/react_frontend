# Phase 32 Completion Report

## Scope
- Findings: A13-186..203
- Modules: Stock balance, stock movement, stock adjustment, stock opname

## Contract decisions
- Backend list services now push key filters (date, warehouse, status) to the DB layer; in-memory pagination via `ApiResponse` trait remains unchanged.
- `withCount('lines')` replaces `with('lines')` on list endpoints so item counts don't load full line data.
- Existing stock movement drafts are read-only in the frontend — no update endpoint exists in the backend, so the Save action is suppressed for non-create routes.
- `usePersistentFormDraft` is enabled for create mode only on both movement and opname forms; adjustment form keeps it on all editable states as before.
- The `updateLine` flow in the opname form updates `lineInputs` state with a merge-preserve strategy so saving one row does not reset unsaved inputs on other rows.
- Permissions for opname routes use the singular `inventory.opname.*` prefix (matches backend route definitions).

## Implementation
- Backend:
  - `StockMovement` — added `warehouse()` BelongsTo relation for eager-loading on list.
  - `StockMovementService::list()` — eager-loads warehouse; adds DB-level filters for `warehouse_id` (header + lines via `orWhereHas`), `product_id`, `date_from`, `date_to`, multi-value `status` and `movement_type` via CSV `whereIn`.
  - `StockAdjustmentService::list()` — adds `with('warehouse')->withCount('lines')`, CSV status, date filters.
  - `StockOpnameService::list()` — adds `with('warehouse')->withCount('lines')`, CSV status, date filters.
- Frontend — list pages:
  - All three list pages (movement, adjustment, opname): `per_page` selector (25/50/100), search input, `isError`/`refetch` with `EmptyState` fallback.
  - Movement list: `LEGACY_TYPE_LABELS` map covers old enum strings (`adjustment`, `goods_receipt`, `opening`, etc.) so live data rows render readable labels.
  - Adjustment and opname lists: item count column reads `lines_count` from `withCount`, with fallback to `lines.length`.
  - Opname list: bulk void permission corrected to `inventory.opname.void`.
- Frontend — schemas:
  - `stockMovementSchema.ts`: added `stockMovementLineSchema` (Zod v4, `message` param, `.issues` iteration).
  - `stockAdjustmentSchema.ts`: added `stockAdjustmentLineSchema` with `adjustment_type` enum.
- Frontend — StockMovementFormPage:
  - Zod line validation runs before submit; per-field errors rendered inline per row.
  - `usePersistentFormDraft` active for create mode only; "Buang Draft" action exposed when draft is restored.
  - Existing movement detail is fully read-only (no Save action).
  - `ConfirmDialog` added before Post action.
- Frontend — StockAdjustmentFormPage:
  - `toDateInputValue()` used in `useEffect` reset so date field populates correctly from API format.
  - `selectedOptions` preloaded from `adj.lines` relations for product and warehouse `SearchableSelect` per row — eliminates "ID X" label on load.
  - Save action permission is `inventory.adjustments.create` for new documents, `inventory.adjustments.edit` for existing drafts.
  - Zod line validation with per-field inline errors.
  - `ConfirmDialog` added before Approve and Post actions.
- Frontend — StockOpnameFormPage:
  - `usePersistentFormDraft` for create mode only.
  - `ConfirmDialog` before Generate Lines; description warns when existing lines will be overwritten.
  - Mark Counted validates that all lines have `physical_quantity` set (either from API or unsaved `lineInputs`) before proceeding.
  - All permissions changed to singular `inventory.opname.*`.
  - `ConfirmDialog` before Finalize.
  - `useEffect` for `lineInputs` uses `prev[l.id] ?? initialValue` so saving one line does not reset unsaved inputs on other rows.
- Frontend — StockBalanceDetailPage:
  - Added stock card movement history section using `reportsApi.stockCard` via `useQuery`.
  - Renders opening balance row then per-movement rows with date, reference, description, qty in/out, running balance, and total cost.
  - Negative running balance highlighted in red; empty state shown when no movements exist.
- Migration:
  - None.

## Verification
- Backend: no new migrations; service changes are additive filters only.
- Frontend build: zero new TypeScript errors introduced; pre-existing `lucide-react` and `apApi` type errors are unrelated to this phase.
- Frontend lint: no inventory module errors from `npx tsc --noEmit`.
- `struktur_frontend.md`: no new files created; existing entries already cover all modified files.

## Finding status
| Finding | Before | After | Evidence |
|---|---|---|---|
| A13-186 | List endpoints loaded all lines for counts; no DB-level date/warehouse filters. | `withCount('lines')`, eager warehouse relation, and DB-level filters added to all three list services. | `StockMovementService.php`, `StockAdjustmentService.php`, `StockOpnameService.php`, `StockMovement.php` |
| A13-187/188 | In-memory filter and pagination only; no per_page control; no search on movement list. | Search input and per_page selector added to all three list pages; DB-level filters reduce in-memory work. | `StockMovementListPage.tsx`, `StockAdjustmentListPage.tsx`, `StockOpnameListPage.tsx` |
| A13-189 | API error state showed blank table with no feedback or retry. | `EmptyState` with retry button shown on `isError`. | All three list pages |
| A13-190 | StockBalanceDetailPage showed product info and stock position only; no movement history. | Stock card history section added using `/inventory/reports/stock-card` endpoint. | `StockBalanceDetailPage.tsx` |
| A13-191 | Legacy movement type strings (`adjustment`, `goods_receipt`, `opening`) rendered raw in the movement list. | `LEGACY_TYPE_LABELS` map added; `getMovementTypeLabel()` resolves both old and new enum strings. | `StockMovementListPage.tsx` |
| A13-192 | No Zod validation on line items; invalid rows could be submitted silently. | `stockMovementLineSchema` and `stockAdjustmentLineSchema` added; validated before submit with per-field inline errors. | `stockMovementSchema.ts`, `stockAdjustmentSchema.ts`, `StockMovementFormPage.tsx`, `StockAdjustmentFormPage.tsx` |
| A13-193 | Movement and opname create forms had no persistent draft. | `usePersistentFormDraft` added to both; "Buang Draft" action shown when draft is restored. | `StockMovementFormPage.tsx`, `StockOpnameFormPage.tsx` |
| A13-194 | Existing movement draft showed Save action despite no backend update endpoint. | Save action suppressed for non-create movement routes; form is read-only. | `StockMovementFormPage.tsx` |
| A13-195 | Adjustment form reset used raw `adj.adjustment_date` (datetime string); product/warehouse SearchableSelects showed "ID X" for existing lines. | `toDateInputValue()` used in reset; `selectedOptions` preloaded from relation data. | `StockAdjustmentFormPage.tsx` |
| A13-196 | Save action on existing adjustment draft gated on `inventory.adjustments.create` instead of `.edit`. | Permission split: `create` for new, `edit` for existing drafts. | `StockAdjustmentFormPage.tsx` |
| A13-198 | Generate Lines ran immediately without warning when existing counts would be lost. | `ConfirmDialog` shown before generating; count of existing lines shown in description. | `StockOpnameFormPage.tsx` |
| A13-199 | Mark Counted could be triggered before all lines had physical qty entered. | Validation checks all lines before allowing Mark Counted; toast error lists uncounted item count. | `StockOpnameFormPage.tsx` |
| A13-201 | Frontend used plural `inventory.opnames.*` permissions; backend routes use singular `inventory.opname.*`. | All opname permission checks corrected to singular prefix. | `StockOpnameFormPage.tsx`, `StockOpnameListPage.tsx` |
| A13-202 | Approve, Post, and Finalize triggered immediately with no confirmation step. | `ConfirmDialog` added for Approve and Post in adjustment form; Finalize in opname form. | `StockAdjustmentFormPage.tsx`, `StockOpnameFormPage.tsx` |
| A13-203 | Saving one opname line invalidated the full detail query, resetting all unsaved line inputs. | `lineInputs` `useEffect` uses merge-preserve strategy (`prev[l.id] ?? initial`) to keep unsaved inputs intact. | `StockOpnameFormPage.tsx` |

## Residual risk
- `ApiResponse` in-memory pagination still applies after DB filtering; very large datasets with narrow filters may still load all matching rows into PHP before slicing. True cursor/keyset pagination is out of scope for this phase.
- Stock card history has no date-range filter; the endpoint returns all movements. A future filter control would improve usability for high-volume products.

## Documentation updated
- `docs/tracking/phase-32-completion-report.md` (this file)

## Next phase
- Phase 33 or as directed by audit roadmap.
