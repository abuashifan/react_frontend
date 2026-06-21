# design-I-reports.md — Reports Module Visual Spec

**Produk:** Seaside Escape ERP Frontend  
**Status:** Design doc baru untuk Reports Module  
**Referensi:** `spec-16-reports-module.md`, `spec-21-error-pages-and-print-export.md`, `spec-23-tablet-first-layout-rules.md`

---

## 1. Scope

Dokumen ini mendefinisikan visual layout untuk:

- report list;
- report filter page;
- report preview;
- report result table;
- export/print actions;
- print preview visual baseline;
- tablet landscape behavior.

---

## 2. Design Intent

Reports harus terasa seperti analisis desktop yang compact.

Pada tablet landscape:

- filter tetap mudah digunakan;
- preview/result table tetap readable;
- export/print action selalu reachable;
- report tidak berubah menjadi mobile card stack.

---

## 3. Report Shell

Default report shell:

```text
Topbar 52
Primary tabs 36
Secondary tabs 32 optional
Content gap 16
Content region: internal scroll
```

Reports tidak wajib memakai ribbon. Jika ada action ribbon, pakai rules dari `design-A2-ribbon-overflow-tablet.md`.

---

## 4. Report List Page

Layout:

```text
┌─────────────────────────────────────────────┐
│ Header: Reports title + search              │ 44px
├─────────────────────────────────────────────┤
│ Category tabs/chips                          │ 36px optional
├─────────────────────────────────────────────┤
│ Report cards/list                            │ scrollable
└─────────────────────────────────────────────┘
```

At 1024px:

- use 2-column report cards or compact list;
- card height 72–88px;
- no large illustrations;
- category chips horizontal scroll if needed.

---

## 5. Report Filter + Preview Layout

### 5.1 Tablet Landscape

```text
┌───────────────┬──────────────────────────────┐
│ Filter Panel  │ Report Preview/Table         │
│ 260–280px     │ flex: 1, min-width: 0        │
└───────────────┴──────────────────────────────┘
```

At 1024px:

- filter panel can collapse to top compact bar if result table needs width;
- default filter width 260px max;
- content area must not root overflow.

### 5.2 Desktop >=1280px

Filter panel can use 300–320px width if report table remains comfortable.

---

## 6. Filter Panel

| Property | Tablet |
|---|---:|
| Width | 260px |
| Padding | 12px |
| Input height | 34px |
| Section gap | 12px |
| Footer height | 44px |

Filter footer:

- Apply button primary;
- Reset secondary;
- sticky bottom inside filter panel if panel scrolls.

---

## 7. Collapsed Filter Bar

When horizontal space is tight:

```text
[Filters 4] [Date: This Month ×] [Account: Cash ×] [Apply]
```

Rules:

- filter count visible;
- active chips visible;
- panel opens as popover/drawer inside desktop shell, not mobile full-screen at >=1024px;
- result width gets priority for dense reports.

---

## 8. Report Result Table

Report result table follows DataTable viewport rules with report-specific density.

| Property | Tablet |
|---|---:|
| Header row | 36px |
| Data row | 34–36px |
| Footer/total row | 36–40px |
| Font size | 12px |
| Numeric alignment | right, tabular-nums |
| Sticky header | required |
| Sticky total row | recommended for financial reports |

Financial report totals must remain readable.

---

## 9. Report Preview Document

Some reports render as document-like preview.

Preview container:

```css
.report-preview-frame {
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: #f8fafc;
}
```

Preview page:

| Property | Value |
|---|---:|
| Width screen | responsive, max 900px |
| Padding tablet | 24px |
| Background | white |
| Border | 1px solid border |
| Shadow | subtle |

At 1024px, preview may scale width but text must remain readable.

---

## 10. Export / Print Action Bar

Action bar placement:

- top-right in report header for simple reports;
- sticky top inside preview area for long reports;
- optional bottom bar only for guided report workflow.

At 1024px:

- show primary `Export` and `Print`;
- additional formats in dropdown;
- buttons no wrap.

---

## 11. Print Visual Baseline

Printed report should use:

| Element | Value |
|---|---|
| Paper | A4 portrait default |
| Margin | 12–16mm |
| Font | Inter or system sans fallback |
| Header | company name, report title, period |
| Table | compact borders, right-aligned numbers |
| Footer | page number, generated timestamp optional |

Print should hide:

- topbar;
- ribbon;
- tabs;
- filters;
- buttons;
- toast.

---

## 12. Report States

Loading:

- filter panel remains visible;
- result area shows skeleton rows or preview skeleton.

Empty:

- show empty state inside result frame;
- keep filters visible.

Error:

- show error alert with retry;
- preserve selected filters.

No permission:

- show permission error card;
- hide export action.

---

## 13. Large Data Rules

For large report results:

- use pagination or virtualized internal scroll;
- sticky header required;
- export action should not require all rows in DOM;
- show generated timestamp / data freshness when relevant.

---

## 14. Acceptance Checklist

- [ ] Report filter + preview fits 1024×768.
- [ ] Export/print action reachable.
- [ ] Result table header sticky.
- [ ] Numeric cells use `tabular-nums`.
- [ ] Filter panel can collapse when width tight.
- [ ] Print output has visual baseline.
- [ ] No mobile card stack at >=1024px.
