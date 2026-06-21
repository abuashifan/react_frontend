# design-H2-dashboard-tablet-landscape.md — Dashboard Tablet Landscape

**Produk:** Seaside Escape ERP Frontend  
**Status:** Addendum visual untuk `design-H1-dashboard.md`  
**Target utama:** dashboard tetap desktop view pada tablet landscape

---

## 1. Scope

Dokumen ini mendefinisikan layout dashboard pada viewport:

- 1024×768
- 1180×820
- 1280×800
- 1366×768
- 1440×900

Dashboard tidak memakai ribbon. Dashboard tetap menggunakan desktop dashboard layout pada width `>=1024px`.

---

## 2. Design Intent

Dashboard harus memberikan ringkasan operasional cepat tanpa scroll panjang, terutama pada tablet landscape.

Prioritas visual:

1. KPI utama terlihat di atas fold.
2. Pending actions terlihat tanpa scroll panjang.
3. Minimal satu insight chart atau recent activity terlihat pada tinggi 768px.
4. Semua widget tetap rapi, dense, dan desktop-like.

---

## 3. Shell Assumption

Dashboard uses:

```text
Topbar: 52px
Primary tabs: 36px
Content gap: 16px
Content available height on 768h: 664px
```

If secondary tabs are present:

```text
Available height: 632px
```

Dashboard content must fit its primary summary into this height.

---

## 4. Layout Grid

### 4.1 Tablet Landscape 1024–1279px

```text
┌──────────────────────────────────────────────┐
│ KPI Row: 4 cards x 1 row                     │ 84px
├──────────────────────────────────────────────┤
│ Pending Action Row: 3 cards x 1 row          │ 96px
├───────────────────────────┬──────────────────┤
│ Chart / Insight           │ Recent Activity  │ 240–280px
│ 60% width                 │ 40% width        │
└───────────────────────────┴──────────────────┘
```

Recommended columns:

```css
grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.85fr);
gap: 12px;
```

### 4.2 Desktop >=1280px

```css
grid-template-columns: minmax(0, 1.5fr) minmax(360px, 0.9fr);
gap: 16px;
```

---

## 5. Section Priority

| Priority | Section | Must be visible at 1024×768? |
|---|---|---|
| P0 | KPI Cards | Yes |
| P0 | Pending/Approval Cards | Yes |
| P1 | Revenue/Sales Chart | Yes, at least top portion/full if compact |
| P1 | Recent Activity | Yes, constrained height |
| P2 | Secondary Insight Cards | May move below fold |
| P2 | Long activity history | Scroll inside widget |

---

## 6. KPI Cards

### 6.1 Dimensions

| Viewport | Cards per row | Card height | Gap |
|---|---:|---:|---:|
| 1024–1279px | 4 | 76–84px | 12px |
| >=1280px | 4 | 88–96px | 16px |

### 6.2 Content

Each card:

- title: 11–12px, muted;
- value: 18–22px, bold, `tabular-nums`;
- delta: 11px;
- icon: 28–32px square;
- no oversized empty illustration.

### 6.3 Tablet Compact Behavior

At 1024px:

- title must truncate single line;
- value must stay single line;
- icon may become 28px;
- secondary helper text may hide.

---

## 7. Pending Action Cards

Pending cards summarize documents requiring user action.

Recommended layout:

```text
┌──────────────┬──────────────┬──────────────┐
│ Sales Due    │ Purchase Due │ Approval     │
└──────────────┴──────────────┴──────────────┘
```

| Viewport | Cards | Height |
|---|---:|---:|
| 1024–1279px | 3 columns | 88–96px |
| >=1280px | 3 or 4 columns | 96–108px |

Each card must include:

- label;
- count/value;
- status hint;
- CTA link/button compact.

No card may exceed 108px height on tablet landscape.

---

## 8. Chart Area

### 8.1 Height

| Viewport | Chart card height | Chart canvas height |
|---|---:|---:|
| 1024×768 | 220–240px | 150–170px |
| 1180×820 | 240–260px | 170–190px |
| 1280×800 | 240–280px | 180–200px |
| >=1440×900 | 300px max | 220px max |

### 8.2 Chart Header

Header height must be compact:

- title 14px/600;
- period filter height 30–32px;
- no large decorative header.

### 8.3 Chart Overflow

Chart card must not force page-level scroll just because canvas is tall. Reduce chart height first.

---

## 9. Recent Activity Widget

### 9.1 Height

At 1024×768:

```css
max-height: 240px;
overflow-y: auto;
```

At 1180×820 and above:

```css
max-height: 280px;
```

### 9.2 Row Density

| Element | Value |
|---|---:|
| Row height | 44–48px |
| Avatar/icon | 28px |
| Main text | 12–13px |
| Timestamp | 11px |

### 9.3 Content Rule

Show 4–5 latest items directly. More items scroll inside widget.

---

## 10. Secondary Widgets

Secondary widgets include:

- cash position summary;
- low stock warning;
- overdue aging mini card;
- quick links;
- announcement card.

On 1024×768:

- secondary widgets may be below primary viewport;
- do not push KPI/pending/chart out of first viewport;
- widgets may collapse to compact summary row.

---

## 11. Dashboard Scroll Model

Dashboard content region may scroll, but page must not rely on long scroll for primary context.

Recommended:

```css
.dashboard-page {
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.dashboard-grid {
  display: grid;
  gap: 12px;
}
```

No `body` scroll.

---

## 12. Tablet 1024×768 Layout Budget

Example budget:

| Section | Height |
|---|---:|
| Dashboard internal padding Y | 24px |
| KPI row | 80px |
| Gap | 12px |
| Pending row | 92px |
| Gap | 12px |
| Insight row | 240px |
| Total | 460px |
| Remaining from 664px | 204px |

Remaining height may hold extra widgets or bottom whitespace. This keeps dashboard comfortable.

---

## 13. Forbidden Behavior

Dilarang pada `>=1024px`:

- KPI berubah menjadi 1-column mobile stack;
- chart mengambil tinggi >300px pada 768h viewport;
- recent activity membuat page scroll panjang;
- pending actions berada di bawah fold;
- dashboard memakai ribbon;
- dashboard content tertutup topbar/tabs.

---

## 14. Empty / Loading States

Dashboard loading:

- skeleton cards match final card height;
- no full-screen spinner unless initial app boot;
- chart skeleton height follows compact chart height.

Empty dashboard:

- keep KPI/card structure;
- show empty state inside widgets, not full page takeover.

---

## 15. Acceptance Checklist

- [ ] At 1024×768, KPI row visible.
- [ ] Pending row visible.
- [ ] Chart or recent activity visible without long scroll.
- [ ] Dashboard still uses multi-column layout.
- [ ] No ribbon on dashboard.
- [ ] No page-level body scroll.
- [ ] Recent activity scrolls internally when long.
- [ ] Chart height adapts to short viewport.
