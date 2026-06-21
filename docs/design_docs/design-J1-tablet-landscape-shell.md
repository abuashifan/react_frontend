# design-J1-tablet-landscape-shell.md — Tablet Landscape Shell

**Produk:** Seaside Escape ERP Frontend  
**Status:** Visual source of truth untuk shell tablet landscape  
**Target utama:** 1024×768, 1180×820, 1280×800, 1366×768

---

## 1. Scope

Dokumen ini mendefinisikan visual shell tablet landscape untuk:

- AppShell
- Topbar
- Ribbon positioning
- Primary tabs
- Secondary tabs
- Workspace content frame
- Dashboard frame
- Form frame dengan fixed bottom action bar

Dokumen ini melengkapi `design-A1-topbar-ribbon.md` dan `spec-23-tablet-first-layout-rules.md`.

---

## 2. Design Intent

Shell harus terasa seperti desktop ERP yang dipadatkan, bukan mobile app.

Karakter visual:

- fixed chrome rapi;
- dense tapi tidak sesak;
- konten utama selalu terlihat;
- action utama tidak tenggelam di bawah fold;
- semua layout aman pada tinggi 768px.

---

## 3. Viewport Target

| Viewport | Shell mode | Catatan |
|---|---|---|
| 1024×768 | Tablet compact desktop | Minimum utama |
| 1180×820 | Tablet comfortable desktop | Preferred tablet |
| 1280×800 | Dense desktop | Small laptop/tablet large |
| 1366×768 | Short desktop | Wajib aman vertical |
| 1440×900 | Desktop expanded | Boleh lebih lapang |

Pada semua viewport `>=1024px`, shell tetap desktop shell.

---

## 4. Shell Zones

```text
┌──────────────────────────────────────────────┐
│ Zone 1: Topbar                 52px fixed    │
├──────────────────────────────────────────────┤
│ Zone 2: Primary Tabs           36px          │
├──────────────────────────────────────────────┤
│ Zone 3: Secondary Tabs         32px          │
├──────────────────────────────────────────────┤
│ Zone 4: Content Gap            16px / 12px   │
├──────────────────────────────────────────────┤
│ Zone 5: Content Region         scrollable    │
├──────────────────────────────────────────────┤
│ Zone 6: Bottom Action Bar      56px optional │
└──────────────────────────────────────────────┘

Ribbon adalah overlay 64px, fixed top 52px, z-index 60. Ribbon tidak masuk
perhitungan tinggi shell dan tidak menggeser content.
```

---

## 5. Canonical Heights

| Zone | Height | Required |
|---|---:|---|
| Topbar | 52px | Always |
| Ribbon overlay | 64px | On demand via Topbar |
| Primary tabs | 36px | App/module navigation |
| Secondary tabs | 32px | Page-level navigation |
| Content gap | 16px | Default |
| Content gap compact | 12px | height <= 768px |
| Bottom action bar | 56px | Form/document views |

---

## 6. Topbar

### 6.1 Dimensions

| Property | Value |
|---|---:|
| Height | 52px |
| Padding X tablet | 16px |
| Padding X desktop | 24px |
| Z-index | 50 |
| Border bottom | 1px solid neutral border |

### 6.2 Content Rules

Left area:

- product/company identity;
- active company switcher if available;
- module indicator optional.

Center area:

- global search optional;
- hide/compact if width insufficient.

Right area:

- notification;
- help/settings shortcut;
- user menu.

At 1024px width:

- do not show long company name without truncation;
- center search can shrink or hide;
- right actions stay icon-only if needed.

---

## 7. Ribbon Overlay

Ribbon appears as an overlay when a module tab is clicked in Topbar.

| State | Height | Behavior |
|---|---:|---|
| Open | 64px | One visual row, horizontal internal scroll allowed |
| Closed | 64px | Opacity 0, pointer-events none |

Rules:

- fixed top 52px, left 0, right 0;
- z-index 60, backdrop z-index 59;
- auto-hide after ribbon item click;
- dismiss on backdrop click;
- no collapse/expand button;
- not affected by list/form view;
- render empty 64px overlay if module has no menu.

Ribbon must never become two rows on tablet landscape and must never shift content.

---

## 8. Primary Tabs

| Property | Value |
|---|---:|
| Height | 36px |
| Padding X | 16px tablet, 24px desktop |
| Item height | 32px |
| Item padding | 12px horizontal |
| Active indicator | 2px bottom border or filled subtle bg |
| Z-index | 38 |

Primary tabs may horizontal-scroll internally if total tab width exceeds viewport.

No multi-row tabs.

---

## 9. Secondary Tabs

| Property | Value |
|---|---:|
| Height | 32px |
| Item height | 28px |
| Font size | 12px |
| Padding X | 12px |
| Z-index | 37 |

Secondary tabs are optional. If absent, content gap begins after primary tabs.

---

## 10. Content Region

### 10.1 Default Frame

```css
.shell-root {
  height: 100dvh;
  overflow: hidden;
}

.shell-content {
  min-width: 0;
  overflow: hidden;
}
```

### 10.2 Padding

| Viewport | Padding X | Padding Y |
|---|---:|---:|
| 1024–1279px | 16px | 12px |
| 1280–1439px | 20px | 16px |
| >=1440px | 24px | 16px |

### 10.3 Scroll

The content region owns scroll, not `body`.

Default:

```css
.content-scroll-region {
  height: 100%;
  overflow: auto;
  min-height: 0;
}
```

For table/form, the page may split content into internal scroll regions; see dedicated docs.

---

## 11. Workspace Shell Template

### 11.1 Workspace With Ribbon Overlay

```text
Topbar 52
Primary Tabs 36
Secondary Tabs 32
Gap 16
Content 632 on 768h
```

At 1024×768, available content height = 632px.

---

## 12. Dashboard Shell Template

Dashboard uses the same virtual tab shell and may show an empty ribbon overlay
when Dashboard is clicked in Topbar.

```text
Topbar 52
Primary Tabs 36
Secondary Tabs 32
Gap 16
Content 632 on 768h
```

Dashboard must still look like dashboard desktop at 1024px width.

---

## 13. Form Shell Template

Form view may still open ribbon overlay from Topbar. Bottom action bar is fixed.

```text
Topbar 52
Primary Tabs 36
Secondary Tabs 32
Gap 16
Form content 576 on 768h
Bottom action bar 56
```

The bottom action bar must always be visible. Form body scrolls internally.

---

## 14. Z-Index Stack

| Layer | Z-index |
|---|---:|
| Content cards | 0 |
| Sticky table header | 20 |
| Sticky table columns | 25 |
| Secondary tabs | 37 |
| Primary tabs | 38 |
| Bottom action bar | 40 |
| Topbar | 50 |
| Ribbon backdrop | 59 |
| Ribbon overlay | 60 |
| Dropdown/popover | 70 |
| Dialog overlay | 80 |
| Dialog content | 90 |
| Toast | 100 |

Use `z-[45]`, not `z-45`, unless custom Tailwind config exists.

---

## 15. Compact Shell Rules at 1024px

At 1024×768:

- use 16px horizontal page padding;
- use 12px vertical gap if needed;
- truncate long labels;
- topbar center search may collapse;
- ribbon items may horizontal-scroll;
- filter sidebar may auto-collapse;
- dashboard chart height should be 160–180px;
- table body should be constrained;
- form body should be constrained.

---

## 16. Forbidden Visual Outcomes

Dilarang:

- root page horizontal scroll;
- ribbon wrap menjadi dua baris;
- dashboard berubah menjadi card stack mobile pada 1024px;
- bottom action bar menutup field terakhir;
- toast menutup tombol submit/post;
- dialog footer keluar viewport;
- table pagination unreachable;
- topbar user menu clipped oleh viewport.

---

## 17. Implementation Notes

Recommended shell class structure:

```tsx
<div className="h-dvh overflow-hidden bg-background text-foreground">
  <Topbar />
  <RibbonPanel />
  <PrimaryTabs />
  <SecondaryTabs />
  <main className="min-h-0 overflow-hidden px-4 py-3">
    <Outlet />
  </main>
</div>
```

Page-level components must receive or compute `availableHeight` from shell tokens, not hardcode arbitrary offsets.

---

## 18. QA Checklist

- [ ] 1024×768 shell has no body scroll.
- [ ] Topbar/ribbon/tabs are not clipped.
- [ ] Content region height matches formula.
- [ ] Ribbon overlay does not change content height.
- [ ] Dashboard remains desktop-like.
- [ ] Workspace table fits visible frame.
- [ ] Form bottom bar remains visible.
- [ ] Overlay layers appear above shell layers.
