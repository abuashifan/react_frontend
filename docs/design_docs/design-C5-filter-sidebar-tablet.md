# design-C5-filter-sidebar-tablet.md — Filter Sidebar Tablet

**Produk:** Seaside Escape ERP Frontend  
**Status:** Addendum untuk `design-C2-filter-sidebar.md`  
**Target utama:** filter sidebar tidak membuat workspace sempit di tablet landscape

---

## 1. Scope

Dokumen ini mendefinisikan:

- compact sidebar behavior;
- auto-collapse threshold;
- filter active state visibility;
- sidebar scroll;
- responsive width rules;
- interaction model pada tablet landscape.

---

## 2. Design Intent

Filter sidebar membantu narrowing data, tetapi tidak boleh mengorbankan table/content usability pada tablet landscape.

Aturan utama:

- desktop-like sidebar boleh ada pada `>=1024px`;
- sidebar boleh auto-collapse jika content menjadi terlalu sempit;
- filter aktif harus tetap terlihat meskipun sidebar collapsed.

---

## 3. Sidebar Width

| Viewport | Default width | Behavior |
|---|---:|---|
| 1024–1179px | 200px compact | Auto-collapse allowed |
| 1180–1279px | 212px compact | Expanded if content safe |
| >=1280px | 220px default | Expanded default |
| <768px | drawer/bottom sheet | Mobile rule |

---

## 4. Content Safety Threshold

Sidebar must not reduce main content below safe width.

| Page type | Minimum comfortable content width |
|---|---:|
| Simple master data | 760px |
| Sales/Purchase list | 820px |
| Inventory movement | 860px |
| Accounting/report tables | 900px |
| Dashboard | Sidebar normally not used |

If `viewportWidth - sidebarWidth - pagePaddingX*2 < minContentWidth`, sidebar may auto-collapse.

---

## 5. Collapse States

### 5.1 Expanded

```text
┌──────────────┬───────────────────────────────┐
│ Filter 220   │ Main content                  │
└──────────────┴───────────────────────────────┘
```

### 5.2 Compact Expanded

```text
┌────────────┬─────────────────────────────────┐
│ Filter 200 │ Main content                    │
└────────────┴─────────────────────────────────┘
```

### 5.3 Collapsed

```text
┌────┬─────────────────────────────────────────┐
│ 40 │ Main content                            │
└────┴─────────────────────────────────────────┘
```

Collapsed rail width: 40px.

---

## 6. Active Filter Visibility

When sidebar collapsed, active filters must still be visible via:

- filter count badge on collapse button;
- active filter chips in workspace header;
- clear all control if filters active.

Example:

```text
[Filter 3] [Status: Draft ×] [Date: This Month ×] [Clear]
```

---

## 7. Sidebar Internal Scroll

Sidebar owns its own vertical scroll.

```css
.filter-sidebar {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
```

The main workspace must not become taller because filter list is long.

---

## 8. Filter Control Density

At tablet compact:

| Element | Value |
|---|---:|
| Sidebar padding | 12px |
| Section gap | 12px |
| Label font | 12px |
| Input height | 34px |
| Checkbox row | 30–34px |
| Section title | 12px / 600 |

Avoid oversized filter cards.

---

## 9. Header and Footer

Sidebar header:

- height 40px;
- title 13px/600;
- collapse button 30–32px.

Sidebar footer if present:

- sticky bottom inside sidebar;
- height 44px;
- contains Apply/Clear only if filters are not live-applied.

---

## 10. Auto-Collapse Behavior

Auto-collapse may happen when:

- viewport width is 1024–1179px;
- table min content width would be violated;
- user opens dense report/workspace;
- route changes to form view.

Auto-collapse must not happen repeatedly after user manually expands within same route unless viewport changes.

User intent wins over automatic behavior during active session.

---

## 11. Animation

| Transition | Value |
|---|---:|
| Width transition | 200ms ease |
| Content fade | 120ms ease-out |
| Icon rotate | 160ms ease |

Animation must not cause layout thrash or double scroll.

---

## 12. Keyboard and Focus

- Collapse button focusable.
- `Enter`/`Space` toggles collapse.
- Active chips removable by keyboard.
- Focus should not jump into hidden collapsed content.
- If collapse occurs while focus is inside sidebar, move focus to collapse button.

---

## 13. Forbidden Outcomes

Dilarang:

- sidebar fixed 220px membuat table root overflow pada 1024px;
- active filters invisible when collapsed;
- long filter list expands page height;
- collapse animation causes content overlap;
- filter controls become smaller than usable touch/click target;
- drawer mobile behavior used at 1024px.

---

## 14. Acceptance Checklist

- [ ] 1024×768 table still usable with sidebar state.
- [ ] Sidebar can compact/collapse.
- [ ] Active filter chips visible when collapsed.
- [ ] Sidebar scrolls internally.
- [ ] Main content no root horizontal overflow.
- [ ] User manual expand/collapse state respected.
