# design-G-settings.md — Settings Module Visual Spec

**Produk:** Seaside Escape ERP Frontend  
**Status:** Design doc baru untuk Settings Module  
**Referensi:** `spec-19-settings-module.md`, `spec-23-tablet-first-layout-rules.md`

---

## 1. Scope

Dokumen ini mendefinisikan visual layout untuk Settings Module:

- company profile settings;
- numbering settings;
- tax/accounting settings;
- user/role settings;
- preferences;
- integration settings;
- save/reset behavior.

---

## 2. Design Intent

Settings harus terasa seperti control panel ERP yang compact, jelas, dan aman untuk tablet landscape.

Target:

- two-pane desktop layout pada `>=1024px`;
- side navigation compact;
- settings form scroll internal;
- save action visible;
- no mobile stack pada tablet landscape.

---

## 3. Shell

Settings default shell:

```text
Topbar 52
Primary tabs 36
Secondary tabs 32 optional
Content gap 16
Content region scrollable
```

Settings tidak memakai ribbon kecuali page tertentu membutuhkan command group.

---

## 4. Layout Anatomy

```text
┌───────────────────────────────────────────────┐
│ Settings Header                               │ 44px
├───────────────┬───────────────────────────────┤
│ Side Nav      │ Settings Content              │
│ 220px         │ Form sections / cards         │
│ internal      │ internal scroll               │
│ scroll        │                               │
└───────────────┴───────────────────────────────┘
```

---

## 5. Tablet Layout

| Viewport | Side nav width | Content columns |
|---|---:|---:|
| 1024–1179px | 200px | 1 column dense |
| 1180–1279px | 212px | 1 column / 2 small columns |
| >=1280px | 220px | 2 columns where appropriate |

At 1024px, side nav may collapse to 48px rail if content requires width.

---

## 6. Settings Header

| Property | Value |
|---|---:|
| Height | 44px |
| Title font | 16px / 600 |
| Description font | 12px muted |
| Padding X | 16px tablet, 24px desktop |
| Actions | Save/Reset/Help compact |

If title + description too tall, description may be hidden at 1024×768.

---

## 7. Side Navigation

### 7.1 Item

| Property | Value |
|---|---:|
| Item height | 34–36px |
| Padding X | 10px |
| Icon | 16px |
| Label | 12–13px |
| Radius | 6px |

### 7.2 Active State

- subtle brand background;
- text brand/dark;
- left accent 2px optional.

### 7.3 Collapsed Rail

Width: 48px.

- icon centered;
- tooltip on hover/focus;
- active indicator visible;
- settings category label hidden.

---

## 8. Content Area

Recommended:

```css
.settings-content {
  height: 100%;
  min-height: 0;
  overflow: auto;
}
```

Content card max width:

| Viewport | Max width |
|---|---:|
| 1024–1279px | none, fill available |
| >=1280px | 960px or 1100px depending page |

---

## 9. Settings Section Card

| Property | Tablet | Desktop |
|---|---:|---:|
| Padding | 12px | 16px |
| Gap | 12px | 16px |
| Radius | 10px | 10px |
| Border | 1px solid border | same |
| Header title | 14px/600 | 15px/600 |
| Header description | 12px muted | 12px muted |

---

## 10. Form Controls

| Element | Tablet |
|---|---:|
| Input height | 34px |
| Select height | 34px |
| Switch row | 36–40px |
| Checkbox row | 32–36px |
| Textarea min height | 84px |

Use 2-column field grid only when each field gets at least 260px width.

---

## 11. Save Behavior

Settings may use one of these patterns:

### 11.1 Sticky Section Footer

For long settings page:

```text
Section content scrolls
Footer: Cancel / Save Changes sticky bottom of content card
```

### 11.2 Page Header Action

For short settings page:

- Save button in page header;
- dirty state indicator near title;
- disabled save if unchanged.

### 11.3 Bottom Bar

Use fixed bottom bar only for heavy settings workflows requiring form-like behavior. Height remains 56px.

---

## 12. Dirty State

Dirty state indicators:

- small badge `Unsaved changes` in header;
- Save button enabled;
- navigation warning if leaving with unsaved changes.

Badge uses warning subtle color.

---

## 13. Permission States

If user lacks permission:

- show fields read-only;
- hide or disable save action based on permission spec;
- show explanation text in section header;
- do not show enabled action without permission guard.

---

## 14. Empty / Loading / Error

Loading:

- skeleton section cards;
- no full page spinner after shell loaded.

Error:

- inline alert inside content area;
- retry button;
- side nav remains visible.

Empty:

- section-level empty state, not full page takeover.

---

## 15. Tablet 1024×768 Acceptance

- [ ] Side nav + content fit without root horizontal overflow.
- [ ] Save action visible or sticky.
- [ ] Content scrolls internally.
- [ ] Side nav can compact/collapse.
- [ ] Forms remain readable at 34px input height.
- [ ] No mobile card stack at 1024px.
- [ ] Permission/dirty states visible.
