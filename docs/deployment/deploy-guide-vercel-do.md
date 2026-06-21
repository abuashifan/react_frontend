# Deploy Guide — Frontend Vercel + Backend DigitalOcean (Opsi A)

Tanggal: 2026-06-21
Status: Panduan deploy canonical untuk produksi
Konteks: menutup open item SPA fallback Phase 24 (A13-059). Lihat
`../tracking/phase-24-completion-report.md` §5.

---

## 1. Arsitektur

```
                   ┌──────────────────────────────┐
  Browser  ──────▶ │ app.finlite.my.id  (Vercel)  │  SPA React (index.html + assets)
     │             │  SPA fallback OTOMATIS         │  HTTPS + CDN otomatis
     │             └──────────────────────────────┘
     │
     │  XHR (Bearer token + X-Company-ID)
     ▼
  ┌────────────────────────────────────┐
  │ api.finlite.my.id  (DigitalOcean)  │  Laravel API-only (nginx + php-fpm)
  │  /api/*  →  Laravel                 │  CORS allow-list ke app.finlite.my.id
  └────────────────────────────────────┘
```

- **Dua domain** (origin terpisah). Aman karena auth memakai **Bearer token**, bukan cookie.
- Tidak ada masalah cookie SameSite; cukup CORS allow-list di Laravel.
- SPA fallback (deep-link/refresh) ditangani Vercel via `vercel.json`.

> Kenapa dua domain: frontend (Vercel) dan backend (DO) adalah dua server fisik
> berbeda, jadi tidak mungkin "satu domain" tanpa proxy. Token-auth membuat
> pemisahan ini murah dan bersih.

---

## 2. Artefak di repo

| File | Repo | Fungsi |
|---|---|---|
| `vercel.json` | frontend | Build settings + SPA fallback rewrite ke `index.html` |
| `.env.production.example` | frontend | Contoh `VITE_API_BASE_URL` |
| `deploy/nginx-backend.conf.example` | frontend | Contoh nginx untuk droplet backend |
| `config/cors.php` | backend | `allowed_origins` env-driven via `CORS_ALLOWED_ORIGINS` |
| `.env.example` (`CORS_ALLOWED_ORIGINS`) | backend | Placeholder origin produksi |

---

## 3. DNS (registrar / Cloudflare)

| Record | Host | Nilai |
|---|---|---|
| Frontend | `app` | mengikuti instruksi Vercel (CNAME ke `cname.vercel-dns.com` atau A record yang diberikan Vercel) |
| Backend | `api` | A record → IP droplet DigitalOcean |

> Jika memakai Cloudflare proxy (oranye) untuk `api`, pastikan SSL mode
> "Full (strict)" dan certbot/origin cert valid. Untuk awal, boleh DNS-only (abu).

---

## 4. Deploy Backend (DigitalOcean)

1. **Provision droplet** Ubuntu, pasang: nginx, php8.3-fpm (+ ekstensi Laravel), composer, database (sesuai setup tenant).
2. **Ambil kode & dependency**
   ```bash
   git clone <repo-backend> /var/www/laravel_backend
   cd /var/www/laravel_backend
   composer install --no-dev --optimize-autoloader
   cp .env.example .env
   php artisan key:generate
   ```
3. **Set `.env` produksi** (minimal):
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.finlite.my.id
   CORS_ALLOWED_ORIGINS=https://app.finlite.my.id
   # + konfigurasi DB / tenant sesuai environment
   ```
   > `APP_DEBUG=false` WAJIB di produksi — mencegah stack trace bocor (sejalan A13-254).
4. **Migrasi** sesuai prosedur tenant (jangan menyentuh data live saat verifikasi).
5. **nginx**: pakai `deploy/nginx-backend.conf.example`, sesuaikan `root` & socket php-fpm.
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.finlite.my.id /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d api.finlite.my.id
   ```
6. **Cache config**:
   ```bash
   php artisan config:cache && php artisan route:cache
   ```
   > Setiap ubah `.env` (mis. `CORS_ALLOWED_ORIGINS`), jalankan ulang `php artisan config:cache`.

---

## 5. Deploy Frontend (Vercel)

1. **Import project** dari Git repo ke Vercel. Framework akan terdeteksi **Vite**.
   `vercel.json` sudah mengunci `buildCommand`, `outputDirectory`, dan SPA rewrite.
2. **Environment Variables** (Project → Settings → Environment Variables):
   ```
   VITE_API_BASE_URL = https://api.finlite.my.id
   ```
   > ORIGIN saja, TANPA `/api` — `src/services/http.ts` menambahkan `/api` otomatis.
3. **Custom domain**: tambahkan `app.finlite.my.id`, ikuti instruksi DNS Vercel.
4. **Deploy**. Vercel build `npm run build` lalu serve `dist/` + SPA fallback.

---

## 6. CORS (backend) — detail

`config/cors.php` kini membaca `CORS_ALLOWED_ORIGINS` (comma-separated):

```env
CORS_ALLOWED_ORIGINS=https://app.finlite.my.id
```

- Tambahkan domain preview Vercel bila perlu menguji (mis.
  `https://app.finlite.my.id,https://<project>-<hash>.vercel.app`).
- `allowed_headers` sudah `*` → header `Authorization` & `X-Company-ID` lolos.
- `supports_credentials` tetap `true` (tidak masalah untuk token; axios default
  tidak mengirim credentials). Jika kelak pindah ke Sanctum cookie-SPA, origin
  wildcard tidak boleh dipakai — gunakan daftar eksplisit seperti sekarang.

---

## 7. Verifikasi pasca-deploy (WAJIB)

### 7.1 SPA fallback / deep-link (membuktikan open item A13-059 di produksi)
```bash
# Harus 200 + mengembalikan index.html, BUKAN 404:
curl -I https://app.finlite.my.id/settings/users
curl -I https://app.finlite.my.id/master-data/products
```
Lalu di browser: buka `https://app.finlite.my.id/settings/users` langsung & tekan
refresh — halaman harus tetap, tidak 404, tidak balik ke `/`.

### 7.2 API tidak tertangkap fallback frontend
```bash
# Harus JSON dari Laravel (mis. 401/200), BUKAN index.html:
curl -I https://api.finlite.my.id/api/health
```

### 7.3 CORS
```bash
curl -i -X OPTIONS https://api.finlite.my.id/api/auth/login \
  -H "Origin: https://app.finlite.my.id" \
  -H "Access-Control-Request-Method: POST"
# Harus ada header: Access-Control-Allow-Origin: https://app.finlite.my.id
```

### 7.4 Smoke fungsional
- Login dari `app.finlite.my.id` berhasil (token tersimpan, dashboard tampil).
- Refresh di rute dalam tetap bertahan.
- Tidak ada error CORS di console browser.

---

## 8. Rollback

| Komponen | Cara rollback |
|---|---|
| Frontend | Vercel → Deployments → pilih deploy sebelumnya → "Promote to Production" (instan) |
| Backend | `git checkout <tag-stabil>` + `composer install` + `php artisan config:cache` + reload nginx |
| CORS | Set ulang `CORS_ALLOWED_ORIGINS` + `php artisan config:cache` |

---

## 9. Catatan keamanan

- `APP_DEBUG=false` di produksi (cegah stack leak — A13-254).
- HTTPS untuk kedua domain (certbot di DO; otomatis di Vercel).
- Jangan commit `.env`/`.env.production` berisi nilai nyata — set di Vercel
  dashboard & `.env` server. File `*.example` di repo hanya template.
- `CORS_ALLOWED_ORIGINS` harus daftar eksplisit, jangan `*`.
