# design-C4-tablet-datatable-viewport.md — Tablet DataTable Viewport

**Produk:** Seaside Escape ERP Frontend  
**Status:** Addendum untuk `design-C1-datatable.md` dan `spec-09-table-and-list.md`  
**Target utama:** DataTable tetap usable pada tablet landscape

---

## 1. Scope

Dokumen ini mendefinisikan:

- table viewport height;
- sticky header;
- sticky columns;
- pagination visibility;
- internal scroll;
- bulk action bar behavior;
- keyboard basics untuk DataTable.

Berlaku untuk semua workspace list page.

---

## 2. Design Intent

DataTable di ERP harus tetap terasa seperti spreadsheet/table desktop pada tablet landscape.

Pada width `>=1024px`, table tidak boleh berubah menjadi card list.

---

## 3. Layout Anatomy

```text
┌─────────────────────────────────────────────┐
│ Workspace Header / Filters / Chips          │ optional 40–56px
├─────────────────────────────────────────────┤
│ Bulk Action Bar                             │ optional 40px
├─────────────────────────────────────────────┤
│ Table Container                             │ flex: 1, min-h: 0
│ ┌─────────────────────────────────────────┐ │
│ │ Sticky Table Header                     │ │ 36px
│ ├─────────────────────────────────────────┤ │
│ │ Scrollable Table Body                   │ │ internal
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Pagination                                  │ 44px
└─────────────────────────────────────────────┘
```

---

## 4. Table Region Height

Workspace page content must allocate height explicitly.

Recommended wrapper:

```css
.workspace-table-frame {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-scroll-region {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
```

---

## 5. Height Budget at 1024×768

With expanded ribbon:

```text
Shell content height: 568px
Workspace header: 48px
Bulk bar optional: 40px
Pagination: 44px
Remaining table area: 436px without bulk, 396px with bulk
```

With collapsed ribbon:

```text
Shell content height: 632px
Workspace header: 48px
Pagination: 44px
Remaining table area: 540px without bulk
```

Table must remain usable in both states.

---

## 6. Sticky Header

Table header must be sticky when table body scrolls internally.

| Property | Value |
|---|---:|
| Position | sticky |
| Top | 0 |
| Z-index | 20 |
| Height tablet | 36px |
| Height desktop | 40px |
| Background | surface/background solid |
| Border bottom | 1px solid border |

Header must not be transparent.

---

## 7. Sticky Columns

Sticky columns:

1. selection checkbox column;
2. row number column;
3. optional primary identifier column for dense tables.

| Column | Width | Z-index |
|---|---:|---:|
| Checkbox | 40px | 25 |
| Row number | 48px | 25 |
| Primary ID optional | 120–160px | 24 |

Sticky columns must have solid background and right shadow/border to show separation.

---

## 8. Horizontal Scroll

Horizontal scroll is allowed inside table container.

Rules:

- root page must not horizontally scroll;
- table container owns horizontal scroll;
- sticky checkbox/number columns remain visible;
- important columns must appear before low-priority columns;
- low-priority columns may be hidden by responsive column config if business allows.

Minimum table width examples:

| Module | Min width |
|---|---:|
| Master data simple | 760px |
| Sales/Purchase list | 980px |
| Inventory movement | 1040px |
| Accounting journal | 1100px |
| Reports drilldown | 1120px |

---

## 9. Row Density

| Viewport | Row height | Font size | Cell padding X |
|---|---:|---:|---:|
| 1024–1279px | 36px | 12px | 8px |
| >=1280px | 40px | 13px | 10px |

Numbers must use `tabular-nums`.

---

## 10. Pagination

Pagination must remain reachable.

Recommended:

```css
.table-pagination {
  flex: 0 0 44px;
  height: 44px;
}
```

At 1024px:

- page size selector may compact;
- text like `Rows per page` may become `Rows`;
- page numbers may use compact window;
- next/prev icons remain visible.

Pagination may be sticky bottom inside workspace frame, but must not overlap table rows.

---

## 11. Bulk Action Bar

BulkActionBar appears above table when selection count > 0.

| Property | Value |
|---|---:|
| Height | 40px |
| Animation | slide/fade in 160ms ease-out |
| Padding X | 12px |
| Z-index | 30 |

At 1024px:

- show selection count;
- show max 3 primary bulk actions;
- overflow additional actions into dropdown;
- do not wrap to two rows.

---

## 12. Empty and Loading States

### 12.1 Loading

Skeleton rows should match final table row height.

At 1024px, show skeleton rows based on available height:

```text
visibleRows = floor((tableBodyHeight - headerHeight) / 36)
```

### 12.2 Empty

Empty state appears inside table frame, not full page, with max content width 360px.

Empty state must not push pagination out of viewport.

---

## 13. Keyboard Navigation Minimum

Minimum behavior:

| Key | Behavior |
|---|---|
| Tab | Moves between focusable table controls, row actions, pagination |
| Shift+Tab | Reverse navigation |
| Space | Toggle row checkbox when checkbox focused |
| Enter | Activate focused row primary link/action |
| Escape | Clear temporary selection/focus trap if applicable |

Optional advanced behavior:

- arrow key row navigation;
- `Ctrl+A` select visible rows where safe;
- typeahead filter focus shortcut.

Do not trap keyboard inside table unless explicitly using grid semantics.

---

## 14. Column Priority

Each table should define column priority:

| Priority | Meaning | Tablet behavior |
|---|---|---|
| P0 | Identity/status/action-critical | Always visible within initial viewport if possible |
| P1 | Key business value/date/party | Visible or near first horizontal scroll area |
| P2 | Secondary metadata | May require horizontal scroll |
| P3 | Audit/system fields | May hide in tablet or move to detail view |

No row-level action column should appear in workspace list unless explicitly approved by spec.

---

## 15. Acceptance Checklist

- [ ] Table header sticky when body scrolls.
- [ ] Pagination reachable at 1024×768.
- [ ] Body scroll internal, no root page scroll for long rows.
- [ ] Horizontal scroll contained inside table frame.
- [ ] Checkbox/number columns sticky.
- [ ] Bulk action bar does not wrap.
- [ ] Skeleton height matches real rows.
- [ ] Keyboard focus visible on checkboxes/buttons/links.
