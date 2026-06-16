# Issue-09 — Master Data Delete Actions

**Tipe**: Action contract mismatch  
**Severity**: High  
**Sumber**: Audit-11 A11-03, GAP-07  
**Status**: Belum selesai

---

## Ringkasan

Beberapa simple master data frontend menyediakan aksi `delete`, tetapi backend Master Data tidak memakai hard delete untuk resource tersebut. Backend memakai `activate` dan `deactivate`.

---

## Resource Terkena

```text
kategoriProdukApi.delete
satuanApi.delete
gudangApi.delete
paymentTermsApi.delete
departemenApi.delete
proyekApi.delete
```

Endpoint frontend lama biasanya berupa:

```text
DELETE /master-data/{resource}/{id}
```

Endpoint backend canonical:

```text
PATCH /master-data/{resource}/{id}/deactivate
PATCH /master-data/{resource}/{id}/activate
```

---

## Dampak

- Tombol hapus akan 404/405.
- User mengira data benar-benar dihapus, padahal domain ERP biasanya butuh nonaktifkan untuk menjaga histori transaksi.
- Permission guard `*.delete` bisa tidak cocok dengan permission backend `*.deactivate` atau `*.activate`.

---

## Prinsip Fix

- Ubah wording UI dari "Hapus" menjadi "Nonaktifkan".
- Tampilkan "Aktifkan" untuk item inactive jika backend route tersedia.
- Jangan hard delete master data dari frontend.
- Pastikan invalidasi query tetap sama seperti delete lama.
- Permission key harus mengikuti backend, bukan istilah lama frontend.

---

## Acceptance Criteria

- Tidak ada service Master Data yang memanggil `DELETE` untuk resource yang hanya punya activate/deactivate.
- Tombol dan dialog memakai copy "Nonaktifkan" atau "Aktifkan".
- Item inactive tetap bisa dikenali di table/filter.
- Permission guard sesuai permission backend aktual.
- Build sukses setelah implementasi.
