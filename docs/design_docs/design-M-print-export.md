# design-M-print-export.md — Print & Export Visual Spec

**Produk:** Seaside Escape ERP Frontend  
**Status:** Tambahan dari audit print/export gap  
**Referensi:** `spec-21-error-pages-and-print-export.md`, `design-I-reports.md`

---

## 1. Scope

Dokumen ini mendefinisikan visual baseline untuk:

- print invoice;
- print purchase order;
- print payment/receipt;
- print journal/report;
- export action UI;
- print preview container.

---

## 2. Design Intent

Print/export harus menghasilkan dokumen bisnis yang bersih, readable, dan konsisten.

Screen preview dan hasil print tidak harus identik 1:1, tetapi struktur informasi harus sama.

---

## 3. Print Page Baseline

| Property | Value |
|---|---|
| Paper default | A4 portrait |
| Margin | 12–16mm |
| Font | Inter / system sans-serif |
| Base font | 10–11pt |
| Title | 16–18pt / 700 |
| Table font | 9–10pt |
| Number alignment | right, tabular |

---

## 4. Print Header

Header contains:

- company name;
- company address/contact if available;
- document/report title;
- document number/period/date;
- optional logo.

Layout:

```text
Company Identity                         Document Title
Address/contact                          Number / Date / Status
```

---

## 5. Document Body

Business document body:

1. party/customer/vendor block;
2. document metadata;
3. line items table;
4. summary totals;
5. notes/terms;
6. signature/footer if applicable.

---

## 6. Table Styling

| Element | Spec |
|---|---|
| Header background | light neutral |
| Header border | 1px solid #CBD5E1 |
| Row border | 1px solid #E2E8F0 |
| Cell padding | 4–6px |
| Numeric cell | right aligned, tabular |
| Total row | bold, top border stronger |

Avoid heavy color blocks that waste ink.

---

## 7. Screen Preview

Preview container:

```css
.print-preview-shell {
  background: #f8fafc;
  overflow: auto;
  height: 100%;
}

.print-preview-page {
  background: #ffffff;
  max-width: 900px;
  margin: 0 auto;
  padding: 32px;
  border: 1px solid #e2e8f0;
}
```

At tablet landscape, preview can scale to available width.

---

## 8. Export Action UI

Export menu should include only enabled formats.

Common options:

- PDF;
- Excel/XLSX;
- CSV;
- Print.

At 1024px:

- show primary `Export` button;
- print may be icon+label if space allows;
- extra formats in dropdown.

---

## 9. Print CSS Hide Rules

Hide on print:

- app shell;
- topbar;
- ribbon;
- tabs;
- filters;
- buttons;
- toast;
- modal overlays;
- pagination controls.

Only print document/report content.

---

## 10. Pagination and Page Break

Rules:

- avoid breaking table row across pages;
- repeat table header on each page if possible;
- keep total summary together;
- signature block should not orphan alone if avoidable.

---

## 11. Status and Watermark

For void/cancelled documents:

- show status badge in header;
- optional watermark `VOID` / `CANCELLED` with low opacity;
- do not make content unreadable.

---

## 12. Acceptance Checklist

- [ ] Invoice/PO print has clear header/body/summary.
- [ ] Report print hides shell chrome.
- [ ] Numeric columns align right.
- [ ] Table rows do not break awkwardly.
- [ ] Export actions reachable in report preview.
- [ ] Preview fits tablet landscape with internal scroll.
