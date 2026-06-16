# Backend Audit Index

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Ringkasan Audit

Audit ini membaca backend Laravel di `/workspace/laravel_backend` dengan fokus pada arsitektur modul, route/API, service layer, model, migration tenant, workflow Sales/Purchase/Inventory/Accounting, account mapping, stock movement, journal linkage, validasi, dan risiko konsistensi data.

Audit dilakukan pada kondisi working tree saat ini. Saat audit dimulai, repository backend sudah berisi perubahan kode dan file untracked dari pekerjaan sebelumnya. Audit ini tidak mengubah file kode backend dan hanya menulis dokumentasi di `/workspace/docs/backend-audit/`.

## File Dokumentasi

1. `00-backend-audit-index.md` - indeks dan batasan audit.
2. `01-architecture-overview.md` - struktur project, pola arsitektur, tenancy, auth, response.
3. `02-api-route-map.md` - peta route/API per modul.
4. `03-database-erd-and-models.md` - tabel, model, relasi, FK, ERD ringkas, orphan risk.
5. `04-sales-workflow-audit.md` - workflow Sales dari quotation sampai return.
6. `05-purchase-workflow-audit.md` - workflow Purchase dari PR sampai return.
7. `06-inventory-workflow-audit.md` - stock movement, average costing, stock balance, adjustment, opname.
8. `07-accounting-and-reporting-audit.md` - journal, mapping, GL, BS, PL, AR/AP, reconciliation.
9. `08-business-rules-and-validation-map.md` - peta rules, status transition, period lock, tenant isolation.
10. `09-risk-gap-and-improvement-backlog.md` - backlog gap dengan severity dan rekomendasi.
11. `10-ai-agent-context.md` - konteks praktis untuk AI agent berikutnya.

## Cara Membaca

Mulai dari `01-architecture-overview.md` untuk memahami request lifecycle dan tenant database. Lanjutkan ke `02-api-route-map.md` untuk endpoint, lalu gunakan dokumen workflow (`04`, `05`, `06`, `07`) sesuai domain yang akan dikerjakan. Untuk implementasi validasi berikutnya, gunakan `08-business-rules-and-validation-map.md` dan `09-risk-gap-and-improvement-backlog.md` sebagai checklist.

## Batasan Audit

- Tidak menjalankan test Laravel, PHPUnit, Pest, Composer test, NPM test, migration, seeder, queue worker, scheduler, atau command yang mengubah database.
- Tidak melakukan runtime verification terhadap API.
- Tidak menjalankan `php artisan route:list`; peta route dibuat dari pembacaan file route.
- Tidak mengubah file backend.
- Dokumentasi dibuat dari pembacaan kode, sehingga rule yang tidak eksplisit diberi catatan confidence.

