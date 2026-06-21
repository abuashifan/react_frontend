# design-A2-ribbon-overflow-tablet.md — Ribbon Overflow Tablet

**Produk:** Seaside Escape ERP Frontend  
**Status:** Addendum untuk `design-A1-topbar-ribbon.md`  
**Target utama:** ribbon tetap rapi pada tablet landscape

---

## 1. Scope

Dokumen ini mendefinisikan:

- ribbon overflow behavior;
- compact ribbon item sizing;
- horizontal scroll;
- label wrapping;
- overlay behavior;
- keyboard/focus rules untuk ribbon.

Berlaku untuk semua module ribbon pada workspace/list view.

---

## 2. Design Intent

Ribbon adalah command surface, bukan navigation stack.

Pada tablet landscape, ribbon harus:

- tetap satu baris visual;
- tidak wrap menjadi dua row;
- tetap 64px height;
- mendukung horizontal internal scroll jika item tidak muat;
- tetap readable dan touch/mouse friendly.
- tidak mengubah tinggi content karena ribbon adalah overlay.

---

## 3. Dimensions

| Property | Value |
|---|---:|
| Ribbon height | 64px |
| Group padding X | 8–12px |
| Group gap | 8px |
| Item min width | 56px |
| Item max width | 88px |
| Icon size | 18–20px |
| Label font size | 10–11px |
| Label line clamp | 2 lines |
| Item height | 56px |

Ribbon container height must never exceed 64px.

---

## 4. Overflow Model

Ribbon content uses internal horizontal scroll.

```css
.ribbon-scroll {
  height: 64px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
}
```

Rules:

- no multi-row layout;
- no page horizontal scroll;
- no clipped item without scroll affordance;
- no hidden commands without overflow menu unless command priority defines it.

---

## 5. Grouping

Ribbon groups should remain visually separated.

| Element | Value |
|---|---:|
| Group separator | 1px vertical border |
| Separator height | 40px |
| Group label | optional, 10px |
| Group max width before scroll | none, scroll container handles it |

At 1024px, avoid long group labels.

---

## 6. Item Priority

Every ribbon item should have priority:

| Priority | Meaning | Tablet behavior |
|---|---|---|
| P0 | Primary commands | Always visible before scroll if possible |
| P1 | Common commands | Visible early in ribbon order |
| P2 | Secondary commands | May appear after scroll |
| P3 | Rare commands | May move into overflow menu |

Examples:

- P0: New, Save, Submit, Post, Approve, Refresh.
- P1: Export, Import, Duplicate, Print.
- P2: Settings, Template, Advanced Filter.
- P3: Rare admin/bulk tools.

---

## 7. Label Rules

Label may wrap to 2 lines inside item, but item cannot grow taller.

```css
.ribbon-label {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 11px;
  max-height: 22px;
}
```

If label still does not fit, use shorter approved label.

---

## 8. Scroll Affordance

When ribbon overflow exists:

- show subtle fade at left/right edge;
- allow mouse wheel horizontal scroll when pointer over ribbon;
- allow touch drag on tablet;
- keep scrollbar visually minimal.

Optional scroll buttons can appear at edges if discoverability is poor.

---

## 9. Overlay Behavior

Ribbon overlay:

| State | Height | Content effect |
|---|---:|---|
| Open | 64px | Commands visible above tabs/content |
| Closed | 64px | Opacity 0, pointer-events none |

Rules:

- fixed top 52px, left 0, right 0;
- z-index 60;
- backdrop z-index 59;
- click module tab opens ribbon;
- click same module while open closes ribbon;
- click item calls `openPrimaryTab()` then `closeRibbon()`;
- click backdrop calls `closeRibbon()`;
- no collapse/expand button.

---

## 10. Compact Behavior at 1024px

At 1024×768:

- item width should prefer 60–72px;
- group gap 6–8px;
- icon 18px;
- label 10px;
- hide secondary helper text;
- keep all P0 commands visible before lower-priority commands.

---

## 11. Disabled and Loading States

Disabled item:

- opacity 50–60%;
- no hover highlight;
- tooltip may explain permission/state if helpful.

Loading item:

- spinner 14–16px;
- label remains stable to avoid layout shift.

---

## 12. Keyboard Rules

- `Tab` enters ribbon command sequence.
- `ArrowLeft` / `ArrowRight` may move between ribbon items if roving tabindex is implemented.
- `Enter` / `Space` activates command.
- Focus ring must be visible.
- Horizontal scroll should adjust to keep focused item visible.

---

## 13. Forbidden Outcomes

Dilarang:

- ribbon height >64px;
- commands wrap into second row;
- ribbon causes root horizontal scroll;
- labels overflow outside item;
- focus item hidden off-screen after tab navigation;
- P0 action buried after many P2/P3 actions.
- ribbon causes content shift downward.

---

## 14. Acceptance Checklist

- [ ] 1024px ribbon remains one visual row.
- [ ] Horizontal overflow contained inside ribbon.
- [ ] Label clamp works.
- [ ] Ribbon overlay does not change content offset.
- [ ] Backdrop closes ribbon.
- [ ] Keyboard focus visible.
- [ ] P0 commands are early/visible.
