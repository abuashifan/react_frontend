# design-K-mobile-bottom-navigation.md — Mobile Bottom Navigation

**Produk:** Seaside Escape ERP Frontend  
**Status:** Design doc baru untuk viewport `<768px`  
**Catatan:** Tablet landscape `>=1024px` tetap desktop shell; dokumen ini hanya untuk mobile/small portrait.

---

## 1. Scope

Dokumen ini mendefinisikan mobile bottom navigation sebagai fallback untuk viewport `<768px`, karena ribbon desktop tidak cocok pada layar mobile.

Berlaku untuk:

- mobile portrait;
- small tablet portrait jika width <768px;
- mobile browser.

Tidak berlaku untuk tablet landscape.

---

## 2. Design Intent

Mobile navigation harus memberi akses cepat ke module utama tanpa membawa ribbon desktop ke layar kecil.

Namun ERP tetap didesain tablet-first. Mobile adalah mode adaptif sekunder.

---

## 3. Breakpoint Rule

| Width | Navigation mode |
|---|---|
| >=1024px | Desktop shell + optional ribbon |
| 768–1023px | Tablet portrait compact; may use collapsed desktop nav or simplified nav |
| <768px | Mobile bottom navigation |

Do not show mobile bottom navigation on 1024px landscape.

---

## 4. Anatomy

```text
┌──────────────────────────────┐
│ Mobile content               │
│                              │
├──────────────────────────────┤
│ Bottom Navigation            │ 64px + safe area
└──────────────────────────────┘
```

---

## 5. Dimensions

| Property | Value |
|---|---:|
| Height | 64px |
| Safe area | include env(safe-area-inset-bottom) |
| Items visible | 4–5 |
| Icon size | 20–22px |
| Label font | 10–11px |
| Active indicator | top line or pill bg |
| Z-index | 45 |

---

## 6. Navigation Items

Recommended primary items:

1. Dashboard
2. Sales
3. Purchase
4. Inventory
5. More

`More` opens module sheet/list for:

- Accounting;
- Reports;
- Settings;
- Cash/Bank;
- Master Data;
- Help.

---

## 7. Active State

Active item:

- icon brand color;
- label brand/dark;
- subtle background or top border;
- accessible selected state.

Inactive item:

- muted text;
- no low contrast below accessibility minimum.

---

## 8. More Sheet

More sheet:

- slides up from bottom;
- max height `calc(100dvh - 80px)`;
- internal scroll;
- module rows height 44px;
- close button reachable.

---

## 9. Interaction with Forms

For mobile form pages:

- document bottom action bar may replace bottom navigation temporarily;
- do not show two bottom bars simultaneously;
- if bottom nav hidden, provide back/module navigation in topbar.

---

## 10. Interaction with Toast

Toast on mobile:

```css
bottom: calc(64px + 12px + env(safe-area-inset-bottom, 0px));
left: 12px;
right: 12px;
```

If document action bar visible, toast offset uses action bar height instead.

---

## 11. Keyboard / Accessibility

- Items are buttons/links with labels.
- Minimum tap target 44px.
- Focus ring visible.
- More sheet traps focus while open.
- `Escape` closes More sheet if supported.

---

## 12. Forbidden Outcomes

Dilarang:

- bottom nav appears on tablet landscape 1024px+;
- bottom nav and bottom action bar stack together;
- item label wraps to 2 lines;
- More sheet footer/actions clipped;
- content hidden behind bottom nav without padding-bottom.

---

## 13. Acceptance Checklist

- [ ] Bottom nav only appears under 768px width.
- [ ] 4–5 primary items fit.
- [ ] More sheet scrolls internally.
- [ ] Content has bottom padding.
- [ ] Toast respects bottom nav/action bar.
- [ ] Tablet landscape remains desktop shell.
