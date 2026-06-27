# GAP-11 — State-Only Navigation Shell

**Severity**: 🟡 Medium
**Tipe**: Navigation state vs browser URL mismatch
**Status**: Deferred until after Phase 39

---

## Ringkasan

Klik menu topbar/ribbon saat ini masih mendorong route browser dengan `navigate(item.path)`, sehingga address bar berubah dan navigasi masih bergantung pada `react-router` path.

Target yang diinginkan adalah:

- navigasi menu hanya mengubah state shell/tab;
- URL browser tetap stabil atau tidak menjadi sumber utama perpindahan view;
- view switching dilakukan dari state aplikasi, bukan dari route path.

---

## Perilaku Saat Ini

- Klik modul di topbar membuka ribbon lewat state.
- Klik item ribbon masih memanggil `navigate(item.path)`.
- `AppShell.tsx` masih menyinkronkan tab aktif dari `location.pathname`.
- `moduleConfig.ts` masih mendefinisikan path untuk ribbon items sebagai sumber navigasi utama.

---

## Dampak

- Address bar browser berubah saat user berpindah menu.
- Perpindahan view masih bergantung pada route path, bukan state shell.
- Navigasi tab/ribbon sulit dipisahkan dari routing browser.
- Pola ini menyulitkan target UX jika shell ingin benar-benar state-driven.

---

## File Terkait

- `src/components/shared/layout/Topbar.tsx`
- `src/components/shared/layout/RibbonPanel.tsx`
- `src/components/shared/layout/AppShell.tsx`
- `src/router/moduleConfig.ts`
- `src/router/index.tsx`

---

## Catatan Implementasi

Gap ini sengaja tidak dibuka sebagai bagian dari Phase 33.
Fokus saat ini tetap pada remediation Phase 33 sampai Phase 39 selesai.
Setelah itu, gap ini bisa ditelusuri lagi lebih detail untuk refactor navigasi shell/state.
