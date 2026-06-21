# design-E6-focus-keyboard-accessibility.md — Focus & Keyboard Accessibility

**Produk:** Seaside Escape ERP Frontend  
**Status:** Global design spec untuk focus ring dan keyboard behavior  
**Target utama:** konsistensi keyboard navigation across desktop/tablet ERP

---

## 1. Scope

Dokumen ini mendefinisikan visual focus dan keyboard behavior minimum untuk:

- button;
- link;
- tab;
- checkbox;
- switch;
- input;
- select/dropdown;
- DataTable controls;
- ribbon command;
- sidebar controls;
- dialog/footer buttons.

---

## 2. Prinsip

1. Semua interactive element wajib punya visible focus.
2. Focus ring harus konsisten dengan brand color Seaside Escape.
3. Keyboard navigation tidak boleh trap kecuali modal dialog.
4. Disabled control tidak boleh focusable kecuali ada alasan accessibility khusus.
5. Focus order mengikuti layout visual dan workflow ERP.

---

## 3. Global Focus Ring

Default focus visible:

```css
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(92, 158, 173, 0.18);
  border-color: #5c9ead;
}
```

For components without border:

```css
.focus-ring-offset:focus-visible {
  outline: 2px solid #5c9ead;
  outline-offset: 2px;
}
```

---

## 4. Focus by Component

| Component | Focus visual |
|---|---|
| Input/Textarea | Border #5c9ead + 3px soft ring |
| Button | 3px soft ring, no layout shift |
| Icon button | 2px outline offset or 3px ring |
| Tabs | bottom/outline focus plus active state preserved |
| Checkbox | 3px ring around checkbox box |
| Switch | ring around track |
| Dropdown trigger | same as button/input type |
| Table row link | underline/outline visible |
| Ribbon item | 3px soft ring inside item bounds |
| Sidebar collapse | 3px soft ring |

---

## 5. Color Tokens

| Token | Value | Usage |
|---|---|---|
| Focus primary | `#5c9ead` | outline/border |
| Focus ring | `rgba(92,158,173,0.18)` | soft shadow |
| Error focus | `rgba(239,68,68,0.18)` | invalid fields |
| Warning focus | `rgba(245,158,11,0.18)` | warning state controls |

Do not use browser default blue focus ring unless component is not yet migrated.

---

## 6. Keyboard Behavior Minimum

| Key | General behavior |
|---|---|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Activate focused action/link |
| Space | Activate button or toggle checkbox/switch |
| Escape | Close non-destructive overlay |
| Arrow keys | Navigate menu/listbox/tablist where pattern applies |

---

## 7. Buttons and Links

Buttons:

- focusable when enabled;
- not focusable when disabled;
- `Enter` and `Space` activate;
- loading button remains focusable if action is in progress but must not trigger duplicate submit.

Links:

- `Enter` activates;
- visible underline or ring on focus;
- no focus outline removal without replacement.

---

## 8. Tabs

Primary and secondary tabs use tablist pattern if implemented semantically.

Recommended behavior:

| Key | Behavior |
|---|---|
| Tab | Enter/leave tablist |
| ArrowLeft/ArrowRight | Move active/focused tab |
| Home | First tab |
| End | Last tab |
| Enter/Space | Activate focused tab if not auto-activation |

If simpler link navigation is used, Tab may focus each tab directly, but focus must be visible.

---

## 9. DataTable Controls

Minimum:

- checkboxes keyboard-toggle with Space;
- row primary link/button reachable with Tab;
- pagination buttons reachable;
- bulk action buttons reachable;
- focus does not disappear during table scroll.

Optional advanced grid navigation must not break native Tab order.

---

## 10. SearchableSelect / Combobox

Keyboard:

| Key | Behavior |
|---|---|
| ArrowDown | Move highlight next option |
| ArrowUp | Move highlight previous option |
| Enter | Select highlighted option |
| Escape | Close dropdown |
| Tab | Commit or leave based on component behavior |

Visual:

- trigger focus visible;
- highlighted option has clear background;
- selected option has check/icon and readable contrast.

---

## 11. Dialogs

Modal dialogs must trap focus while open.

Rules:

- focus initial safe element;
- destructive dialogs should focus Cancel by default unless spec says otherwise;
- Tab loops inside dialog;
- Escape behavior follows dialog risk level;
- on close, focus returns to triggering element when possible.

---

## 12. Ribbon

Ribbon commands:

- Tab can move through commands;
- focus ring visible inside item;
- focused item auto-scrolls into view if ribbon horizontally scrolls;
- Enter/Space activates command;
- disabled command skipped or not focusable.

---

## 13. Error State Focus

Invalid form submit:

1. show section-level error summary;
2. move focus to first invalid field or error summary;
3. ensure field is not hidden behind bottom bar;
4. error focus uses error ring if field invalid.

---

## 14. Forbidden Outcomes

Dilarang:

- `outline: none` without replacement;
- focus ring clipped by overflow container;
- keyboard focus enters hidden/collapsed content;
- modal dialog allows focus behind overlay;
- row selection only works with mouse;
- tab active state indistinguishable from focus state.

---

## 15. Acceptance Checklist

- [ ] Every interactive element has visible focus.
- [ ] Keyboard can operate main navigation.
- [ ] Keyboard can operate table selection/pagination.
- [ ] Keyboard can operate form and bottom action bar.
- [ ] Overlay focus does not escape accidentally.
- [ ] Focus ring matches brand and does not shift layout.
