# design-E5-overlay-collision-rules.md — Overlay Collision Rules

**Produk:** Seaside Escape ERP Frontend  
**Status:** Global visual/behavior spec untuk dropdown, popover, dialog, toast  
**Target utama:** viewport pendek dan tablet landscape

---

## 1. Scope

Dokumen ini berlaku untuk:

- SearchableSelect dropdown;
- select/popover/calendar;
- command menu;
- dialog/modal;
- void confirmation dialog;
- session warning dialog;
- toast container;
- dropdown menu.

Tujuannya memastikan overlay tidak tertutup fixed bars dan tidak keluar dari viewport pada tablet landscape.

---

## 2. Collision Boundaries

Semua overlay harus menghormati boundary berikut:

```text
Top boundary    = topbar + tabs/ribbon if overlay is inside content
Bottom boundary = viewport bottom - bottom action bar if visible - safe area
Side boundary   = viewport left/right with 12px minimum margin
```

Minimum viewport margin:

| Viewport | Margin |
|---|---:|
| 1024–1279px | 12px |
| >=1280px | 16px |
| <768px | 12px |

---

## 3. Z-Index

| Overlay | Z-index |
|---|---:|
| Dropdown menu | 60 |
| Select dropdown | 60 |
| Popover/calendar | 60 |
| Command menu overlay | 80 |
| Dialog overlay | 80 |
| Dialog content | 90 |
| Toast | 100 |

Overlay must appear above topbar/ribbon/bottom bar when active, except toast must not block primary CTA.

---

## 4. Dropdown / Select Rules

### 4.1 Positioning

Dropdown must be collision-aware:

- open downward by default;
- flip upward when bottom space is insufficient;
- align start with trigger unless it would overflow;
- never exceed viewport side boundary.

### 4.2 Height

Default max-height:

```css
max-height: min(280px, calc(100dvh - 96px));
```

If bottom action bar visible:

```css
max-height: calc(100dvh - var(--shell-bottom-bar-h) - 96px);
```

### 4.3 SearchableSelect Specific

- Input inside dropdown stays sticky top if options scroll.
- Option row height tablet: 34–36px.
- Empty/no-result state max height: 120px.
- Keyboard: ArrowDown/ArrowUp, Enter select, Escape close.

---

## 5. Popover / Calendar Rules

Popover max width:

| Component | Width |
|---|---:|
| Calendar single month | 280–320px |
| Filter popover | 320–360px |
| Help popover | 280px |
| Account/menu popover | 240–280px |

Popover max height:

```css
max-height: calc(100dvh - 48px);
overflow-y: auto;
```

If launched near bottom bar, popover must flip upward.

---

## 6. Dialog Rules

### 6.1 Standard Dialog

| Property | Value |
|---|---:|
| Max width small | 400px |
| Max width medium | 560px |
| Max width large | 720px |
| Max height | `calc(100dvh - 48px)` |
| Tablet margin | 24px |
| Overlay z-index | 80 |
| Content z-index | 90 |

Dialog must use internal scroll if content exceeds max height.

### 6.2 Dialog Anatomy

```text
┌────────────────────────────┐
│ Header                     │ fixed inside dialog
├────────────────────────────┤
│ Body                       │ scrollable if needed
├────────────────────────────┤
│ Footer                     │ sticky/reachable
└────────────────────────────┘
```

Footer must always be reachable.

---

## 7. Void Dialog Specific

Void dialog is destructive and must be extra safe.

| Property | Value |
|---|---:|
| Width | 400px |
| Max height | `calc(100dvh - 48px)` |
| Body overflow | auto |
| Footer | sticky bottom inside dialog |
| Textarea height | 88–120px |

Dismiss behavior:

- backdrop click: disabled for destructive confirmation;
- Escape: disabled unless explicitly allowed by product decision;
- Cancel button is the intended safe exit.

---

## 8. Session Warning Dialog

Session warning dialog must not be dismissible accidentally.

- Overlay z-index: 80.
- Content z-index: 90.
- Countdown uses `tabular-nums`.
- Optional progress visual should fit inside dialog body without increasing height excessively.
- Footer remains visible on 768px height.

---

## 9. Toast Rules

Toast position depends on bottom bar presence.

### 9.1 No Bottom Bar

```css
bottom: 16px;
right: 16px;
```

### 9.2 Bottom Bar Visible

```css
bottom: calc(var(--shell-bottom-bar-h) + 16px + env(safe-area-inset-bottom, 0px));
right: 16px;
```

### 9.3 Toast Dimensions

| Viewport | Width | Max visible |
|---|---:|---:|
| 1024–1279px | 320px | 3 |
| >=1280px | 360px | 4 |
| <768px | calc(100vw - 24px) | 2 |

Toast must not overlap primary CTA in bottom action bar.

---

## 10. Command Menu

Command menu:

- max width: 640px;
- tablet width: min(640px, calc(100vw - 48px));
- max height: calc(100dvh - 96px);
- body scroll internal;
- z-index dialog layer.

---

## 11. Focus and Keyboard

Overlay keyboard minimum:

| Key | Behavior |
|---|---|
| Escape | Close non-destructive overlay |
| Tab | Stay inside modal dialog focus trap |
| Shift+Tab | Reverse focus trap |
| Enter | Activate focused item/button |
| Arrow keys | Navigate menu/select options |

Destructive dialogs may disable Escape/backdrop dismiss when specified.

---

## 12. Forbidden Outcomes

Dilarang:

- dropdown terpotong bottom bar;
- dialog footer keluar viewport;
- toast menutup submit/post/approve button;
- popover melebar keluar viewport;
- transparent sticky overlay header;
- overlay muncul di bawah topbar karena z-index salah;
- body scroll aktif saat modal terbuka.

---

## 13. Acceptance Checklist

- [ ] Dropdown near bottom flips upward.
- [ ] Dialog max-height works at 1024×768.
- [ ] Dialog footer always reachable.
- [ ] Toast offset respects bottom action bar.
- [ ] Popover does not overflow viewport side.
- [ ] Overlay z-index above shell.
- [ ] Keyboard close/focus behavior works.
