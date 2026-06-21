# CLAUDE.md — Seaside Escape ERP Frontend

> Dibaca otomatis oleh Claude Code setiap sesi.
> Untuk Codex CLI dan agent lain: baca AGENTS.md.

---

## Langkah Pertama

**Baca `AGENTS.md` di folder ini sebelum melakukan apapun.**

`AGENTS.md` berisi:
- Peta semua dokumen dan kapan harus dibaca
- Mapping task → dokumen yang relevan
- Status progress per phase
- Urutan baca dokumen per phase
- Hard rules ringkasan

---

## Identitas Project

**Produk**  : Seaside Escape ERP  
**Type**    : SPA React — standalone frontend  
**Backend** : Laravel API only (Bearer token + X-Company-ID header)  
**Target**  : iPad mini 6 (768px) ke atas  
**Working directory** : `/workspace/frontend/`  
**Backend** : `/workspace/laravel_backend/` — boleh diperbaiki sesuai scope task dan aturan backend-local

---

## Hard Rules (Ringkasan)

Detail lengkap ada di `AGENTS.md` §8.

```
❌ DILARANG pakai `any` tanpa justifikasi
❌ DILARANG fetch di komponen — gunakan TanStack Query
❌ DILARANG simpan data API di Zustand
❌ DILARANG buat komponen baru jika sudah ada
❌ DILARANG styling ad-hoc di luar design token
❌ DILARANG hardcode URL API
❌ DILARANG edit src/components/ui/
❌ DILARANG render tombol aksi tanpa cek permission

✅ WAJIB semua API call di src/modules/{module}/services/
✅ WAJIB React Hook Form + Zod untuk semua form
✅ WAJIB typed props dan API response
✅ WAJIB tabular-nums untuk semua angka
✅ WAJIB update docs/struktur_frontend.md jika ada file baru
✅ WAJIB npm run build lulus 0 error sebelum selesai
✅ WAJIB baca /workspace/laravel_backend/AGENTS.md sebelum mengubah backend
✅ WAJIB test backend terkait + Pint check jika backend diubah
```

---

## Stack

```
React 18 · Vite · TypeScript · TanStack Query
Zustand · Shadcn/ui · Tailwind CSS
React Hook Form · Zod · React Router v6 · Axios
```

---

## Commit Format

```
feat(sales): add sales invoice list page
fix(shared): resolve DataTable build error
refactor(layout): extract tab state to useTabStore
```
