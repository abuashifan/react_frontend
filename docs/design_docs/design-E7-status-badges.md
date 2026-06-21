# design-E7-status-badges.md — Document & System Badges

**Produk:** Seaside Escape ERP Frontend  
**Status:** Visual spec untuk `DocumentStatusBadge` dan `SystemGeneratedBadge`  
**Target:** badge konsisten di table, form, detail, dan reports

---

## 1. Scope

Dokumen ini mendefinisikan:

- `DocumentStatusBadge.tsx`;
- `SystemGeneratedBadge.tsx`;
- sizing;
- colors;
- icon usage;
- table/form behavior;
- accessibility labels.

---

## 2. Badge Principles

- Badge harus ringkas dan terbaca di table row 36px.
- Status color harus konsisten dengan design tokens.
- Badge tidak boleh memakai arbitrary color di luar token.
- Badge text harus single line.
- Badge tidak boleh menjadi satu-satunya indikator status jika icon/color saja tidak cukup.

---

## 3. Size Variants

| Variant | Height | Padding X | Font | Radius | Use case |
|---|---:|---:|---:|---:|---|
| `xs` | 20px | 6px | 10px / 600 | 999px | Dense table |
| `sm` | 22px | 8px | 11px / 600 | 999px | Normal table/list |
| `md` | 26px | 10px | 12px / 600 | 999px | Form/detail header |

Default variant: `sm`.

---

## 4. Document Status Colors

Use existing status token classes where defined.

| Status | Label | Background | Text |
|---|---|---|---|
| draft | Draft | #F1F5F9 | #475569 |
| submitted | Submitted | #DBEAFE | #1D4ED8 |
| approved | Approved | #DCFCE7 | #166534 |
| confirmed | Confirmed | #E0F2FE | #0369A1 |
| posted | Posted | #ECFDF5 | #047857 |
| partially_paid | Partially Paid | #FEF3C7 | #92400E |
| paid | Paid | #DCFCE7 | #166534 |
| void | Void | #FEE2E2 | #991B1B |
| cancelled | Cancelled | #F1F5F9 | #334155 |
| rejected | Rejected | #FEE2E2 | #991B1B |
| delivered | Delivered | #E0F2FE | #0369A1 |
| received | Received | #EDE9FE | #6D28D9 |
| converted | Converted | #ECFDF5 | #047857 |

If a status is not known, fallback:

- background: `#F1F5F9`
- text: `#475569`
- label: formatted status string

---

## 5. DocumentStatusBadge Anatomy

```text
┌────────────────────┐
│ ● Approved         │
└────────────────────┘
```

Optional dot:

- size 6px for sm/md;
- size 5px for xs;
- dot color same as text or stronger token.

Do not use large icons in dense table badges.

---

## 6. SystemGeneratedBadge

### 6.1 Purpose

Marks records created by system automation, migration, posting, recurring process, or backend rule.

### 6.2 Visual

| Property | Value |
|---|---:|
| Label | `System Generated` |
| Short label | `System` for xs/tablet compact |
| Icon | wrench/gear 12px optional |
| Height sm | 22px |
| Background | #E0F2FE |
| Text | #0369A1 |
| Radius | 999px |

### 6.3 Placement

| Context | Variant |
|---|---|
| Table row | xs or sm |
| Form header | sm or md |
| Audit trail | xs |
| Report row | xs |

---

## 7. Table Usage

At row height 36px:

- use `xs` or `sm`;
- badge max-width 120px;
- text truncates with ellipsis if needed;
- status column min width 112px;
- multiple badges in one cell may wrap only if row height allows; otherwise use tooltip/overflow.

Recommended:

```text
[Approved] [System]
```

If space is limited:

```text
[Approved]
```

System badge can move to tooltip/detail.

---

## 8. Form Header Usage

In form/detail header:

- use `md` for primary document status;
- use `sm` for secondary/system badges;
- badges align center vertically with document title/meta.

Example:

```text
Sales Invoice SI-0001   [Posted] [System Generated]
```

---

## 9. Accessibility

- Badge must have readable text label.
- Do not rely on color alone.
- If short label is used, provide full `aria-label`.
- Tooltip may expose full status explanation.

Example:

```tsx
<Badge aria-label="Document status: Partially Paid">Partially Paid</Badge>
```

---

## 10. Forbidden Outcomes

Dilarang:

- status represented by color-only dot without text;
- arbitrary hex colors outside status map;
- badge height bigger than table row comfort;
- multi-line badge text in table;
- icon-only system generated badge without accessible label.

---

## 11. Acceptance Checklist

- [ ] Badge fits 36px row.
- [ ] All known statuses map to token colors.
- [ ] Unknown status has safe fallback.
- [ ] SystemGeneratedBadge has compact mode.
- [ ] Text remains readable without relying only on color.
- [ ] Table/form variants are documented.
