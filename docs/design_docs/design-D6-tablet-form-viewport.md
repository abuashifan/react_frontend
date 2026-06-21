# design-D6-tablet-form-viewport.md — Tablet Form Viewport

**Produk:** Seaside Escape ERP Frontend  
**Status:** Addendum untuk `design-D1`, `design-D2`, `design-D3`, `design-D4`  
**Target utama:** form transaksi usable pada tablet landscape

---

## 1. Scope

Dokumen ini mendefinisikan:

- form viewport height;
- internal form body scroll;
- fixed bottom action bar behavior;
- line items table height;
- summary placement;
- collision safety untuk input/dropdown dekat bottom bar.

Berlaku untuk sales, purchase, inventory, accounting, cash-bank, dan form master data panjang.

---

## 2. Design Intent

Form ERP harus cepat dipakai di tablet landscape tanpa kehilangan CTA utama.

Pada viewport `>=1024px`:

- form tetap desktop compact;
- layout tidak berubah menjadi mobile wizard;
- action bar selalu fixed dan terlihat;
- konten panjang scroll di form body, bukan body page;
- line items tetap table-like.

---

## 3. Shell Assumption

Form view:

```text
Topbar: 52px
Primary tabs: 36px
Secondary tabs: 32px
Content gap: 16px
Bottom action bar: 56px
```

Available form body height at 1024×768:

```text
768 - 52 - 36 - 32 - 16 - 56 = 576px
```

---

## 4. Anatomy

```text
┌─────────────────────────────────────────────┐
│ Form Header / Document Header               │ 44–56px
├─────────────────────────────────────────────┤
│ Scrollable Form Body                         │ flex: 1
│ ┌─────────────────────────────────────────┐ │
│ │ FormSection: Header fields              │ │
│ │ FormSection: Line items                 │ │
│ │ FormSummary                             │ │
│ │ Notes / Attachments                     │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Fixed Bottom Action Bar                     │ 56px
└─────────────────────────────────────────────┘
```

---

## 5. Form Frame Rules

Recommended:

```css
.form-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.form-body-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: calc(var(--shell-bottom-bar-h) + 16px);
}
```

The bottom padding prevents content from hiding behind the action bar.

---

## 6. Fixed Bottom Action Bar

| Property | Value |
|---|---:|
| Height | 56px |
| Position | fixed or sticky in shell bottom |
| Z-index | 40 |
| Padding X tablet | 16px |
| Background | surface solid |
| Border top | 1px solid border |
| Safe area | include `env(safe-area-inset-bottom)` |

The action bar must never be below fold.

### 6.1 Button Layout

Left group:

- cancel/back;
- secondary actions;
- status hint.

Right group:

- save draft;
- submit/post/approve primary action;
- overflow menu if actions exceed width.

At 1024px:

- max 3 buttons visible on right;
- extra actions into dropdown;
- labels may shorten (`Save Draft` → `Draft`) only if documented;
- no two-line button row.

---

## 7. Header Fields Section

For transaction forms:

| Viewport | Columns | Gap |
|---|---:|---:|
| 1024–1279px | 2 or 3 columns | 12px |
| >=1280px | 3 or 4 columns | 16px |

Input height:

- tablet: 34px;
- desktop: 36px.

Labels:

- 12px;
- single-line where possible;
- helper/error text max 2 lines.

---

## 8. FormSection Density

| Property | Tablet | Desktop |
|---|---:|---:|
| Section padding | 12px | 16px |
| Section gap | 12px | 16px |
| Header height | 28–32px | 32–36px |
| Border radius | 8px | 10px |

At 1024×768, avoid large blank section headers.

---

## 9. Line Items Table

Line items must stay table-like.

### 9.1 Height

At 1024×768:

```css
.line-items-frame {
  max-height: 220px;
  min-height: 144px;
  overflow: auto;
}
```

At 1180×820 and above:

```css
max-height: 260px;
```

At desktop large:

```css
max-height: 320px;
```

### 9.2 Header and Columns

- table header sticky;
- item/name column min 220px;
- qty/price/amount use `tabular-nums`;
- row height tablet 36px;
- add row button stays visible near table footer.

---

## 10. FormSummary Placement

Default placement: below line items, aligned right.

At 1024×768:

- summary width: 280–320px;
- summary rows height: 28–32px;
- total row height: 36px;
- sticky summary is allowed only inside form body, not above bottom action bar.

If form body is too short:

- summary may collapse into compact total strip above bottom action bar;
- detailed summary remains expandable.

---

## 11. Notes, Attachments, and Secondary Fields

Secondary sections must not push primary form controls out of reach.

At 1024×768:

- notes textarea max-height 96px;
- attachment area compact list style;
- audit information collapsed by default;
- advanced options collapsed by default.

---

## 12. Dropdown Near Bottom Bar

All select/search/dropdown in form must use collision-aware positioning.

Rules:

- if not enough space below input, dropdown flips upward;
- dropdown max-height excludes bottom action bar;
- dropdown must not cover submit/post buttons;
- dropdown inside line items may open within table viewport if supported, otherwise portal to body with collision boundary.

---

## 13. Validation and Error Layout

Error messages must not cause sudden major layout shift.

- Reserve enough line-height for single error line where validation is common.
- Long error text wraps to max 2 lines.
- Section-level error summary appears at top of form body, not bottom bar.
- Bottom bar may show compact warning count but not full error list.

---

## 14. Locked / Read-only Documents

When document is locked:

- bottom bar still visible for allowed actions;
- locked banner appears inside form body top;
- read-only fields maintain same layout height;
- disabled state must still be readable.

---

## 15. Loading State

- Load skeleton uses same form section dimensions.
- Bottom action bar can show disabled buttons or skeleton button placeholders.
- Do not show full-screen spinner after shell is loaded.

---

## 16. Acceptance Checklist

- [ ] Bottom action bar visible at 1024×768.
- [ ] Form body scrolls internally.
- [ ] Last field is not hidden behind bottom bar.
- [ ] Line items table has constrained height.
- [ ] Summary is reachable without long page scroll.
- [ ] Dropdown near bottom flips or constrains height.
- [ ] No body-level double scroll.
- [ ] Button row does not wrap.
- [ ] `tabular-nums` used for all amounts and quantities.
