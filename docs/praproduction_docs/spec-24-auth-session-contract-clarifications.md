# spec-24-auth-session-contract-clarifications.md

> Addendum untuk menutup kontradiksi P1 antara `design-B-auth-pages.md` dan `spec-17-auth-and-company.md`.
> Dokumen ini menjadi source of truth sampai kedua dokumen asli disinkronkan.

---

## 1. Tujuan

Dokumen ini menetapkan keputusan final untuk tiga kontradiksi auth yang ditemukan audit:

| ID Audit | Area | Keputusan Canonical |
|---|---|---|
| C-02 | Login wrong credentials HTTP code | `401 Unauthorized` adalah canonical untuk kredensial salah. `422 Unprocessable Entity` hanya untuk validation error request. |
| C-03 | `remember_me` login schema | `remember_me` wajib ada di frontend schema dengan default `false`. Field ini bersifat optional pada payload sesuai kontrak backend. |
| C-04 | Session warning dialog dismiss behavior | Dialog session warning wajib non-dismissible melalui Escape/backdrop/close icon. User hanya bisa memilih action eksplisit atau timeout. |

---

## 2. Scope

Berlaku untuk:

```text
src/modules/auth/pages/LoginPage.tsx
src/modules/auth/schemas/loginSchema.ts
src/modules/auth/services/authApi.ts
src/components/shared/feedback/SessionWarningDialog.tsx
src/hooks/useSessionTimeout.ts
src/stores/useAuthStore.ts
```

Dokumen yang harus disinkronkan setelah addendum ini:

```text
docs/design_docs/design-B-auth-pages.md
docs/praproduction_docs/spec-17-auth-and-company.md
docs/struktur_frontend.md
```

---

## 3. C-02 — Login Error Code Canonical Rule

### 3.1 Keputusan

Untuk login dengan email/password yang formatnya valid tetapi kombinasi kredensial salah:

```text
HTTP status: 401 Unauthorized
Error semantic: AUTH_INVALID_CREDENTIALS
UI behavior: field-level error + toast
```

Untuk input yang gagal validasi request, misalnya email kosong, format email salah, password kosong, atau payload tidak sesuai schema:

```text
HTTP status: 422 Unprocessable Entity
Error semantic: VALIDATION_ERROR
UI behavior: field-level error pada field terkait; toast hanya bila error perlu ringkasan global
```

### 3.2 Alasan

`401` lebih tepat untuk kegagalan autentikasi. `422` dipakai untuk request yang secara struktur/validasi tidak dapat diproses. Dengan rule ini, `spec-17` benar pada status code, tetapi `design-B` tetap benar pada kebutuhan UX field highlight.

### 3.3 UI Behavior untuk `401 AUTH_INVALID_CREDENTIALS`

Saat backend mengembalikan `401` untuk kredensial salah:

- Email dan password field tetap berada pada form.
- Password tidak boleh di-clear otomatis kecuali security policy backend/frontend secara eksplisit mengharuskan.
- Tampilkan field-level error di area password atau di form-level auth error block.
- Tampilkan toast error singkat.
- Fokus keyboard harus kembali ke password field.
- Jangan redirect user.
- Jangan membuat session partial.

Recommended message:

```text
Email atau password tidak sesuai.
```

Toast title:

```text
Login gagal
```

Toast description:

```text
Periksa kembali email dan password Anda.
```

### 3.4 UI Behavior untuk `422 VALIDATION_ERROR`

Saat backend mengembalikan `422`:

- Map error ke field terkait jika response menyediakan field errors.
- Jika response tidak menyediakan field errors, tampilkan form-level error.
- Fokus keyboard pindah ke field error pertama.
- Toast tidak wajib bila field-level error sudah jelas.

Example field errors:

```json
{
  "email": "Format email tidak valid.",
  "password": "Password wajib diisi."
}
```

### 3.5 Frontend Normalization Rule

`authApi.ts` harus menormalkan error backend menjadi semantic error yang stabil untuk UI.

```ts
type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'VALIDATION_ERROR'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';
```

Mapping minimum:

| HTTP Status | Backend Meaning | Frontend Error Code |
|---|---|---|
| 401 | Wrong credentials / unauthenticated | `AUTH_INVALID_CREDENTIALS` for login; `SESSION_EXPIRED` for authenticated routes |
| 422 | Request validation failed | `VALIDATION_ERROR` |
| 0 / network failed | No response | `NETWORK_ERROR` |
| Other | Unexpected | `UNKNOWN_ERROR` |

### 3.6 Compatibility Rule

Jika backend legacy sementara masih mengirim `422` untuk kredensial salah, frontend boleh memetakan response tersebut ke `AUTH_INVALID_CREDENTIALS` bila message/error code backend jelas menunjukkan kredensial salah.

Namun dokumentasi canonical tetap:

```text
Wrong credentials = 401
Validation error = 422
```

---

## 4. C-03 — `remember_me` Schema Canonical Rule

### 4.1 Keputusan

`remember_me` wajib ada pada frontend login schema.

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
  remember_me: z.boolean().default(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

### 4.2 UI Rule

Login page boleh menampilkan checkbox:

```text
Ingat saya
```

Default state:

```text
unchecked / false
```

Checkbox behavior:

- Tinggi touch target mengikuti global interactive target.
- Label klik harus toggle checkbox.
- State checkbox harus masuk React Hook Form state.
- Tidak boleh disimpan manual di Zustand sebagai source of truth form.

### 4.3 API Payload Rule

`remember_me` adalah field optional pada request payload.

Canonical payload type:

```ts
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}
```

Jika `audit-frontend-api-contract.md` menyatakan backend menerima `remember_me`, maka `authApi.login()` mengirim field tersebut.

Jika backend belum menerima `remember_me`, maka `authApi.login()` wajib omit field tersebut dari payload dan meninggalkan field hanya sebagai UI preference sampai backend contract diperbarui.

```ts
const payload = backendSupportsRememberMe
  ? values
  : { email: values.email, password: values.password };
```

> Jangan hardcode flag `backendSupportsRememberMe` di komponen. Keputusan ini harus berada di service/contract layer atau mengikuti contract backend yang terdokumentasi.

### 4.4 Security Rule

`remember_me` tidak boleh membuat frontend menyimpan password, raw token, atau credential secret.

Allowed behavior:

- Meminta backend menerbitkan session/refresh token dengan expiry lebih panjang.
- Menyimpan preference non-sensitive seperti email terakhir hanya jika product decision mengizinkan.

Forbidden behavior:

- Menyimpan password di localStorage/sessionStorage.
- Menyimpan raw access token di Zustand persisted store tanpa security decision eksplisit.
- Mengubah session expiry murni di frontend tanpa dukungan backend.

### 4.5 Documentation Sync Rule

`spec-17-auth-and-company.md` harus ditambahkan schema `remember_me` agar konsisten dengan `design-B-auth-pages.md`.

---

## 5. C-04 — Session Warning Dialog Dismiss Canonical Rule

### 5.1 Keputusan

Session warning dialog wajib non-dismissible.

User tidak boleh menutup dialog melalui:

- Escape key.
- Backdrop click.
- Close icon.
- Browser focus loss.
- Klik area di luar dialog.

User hanya boleh keluar dari dialog melalui:

| Action | Behavior |
|---|---|
| `Tetap Masuk` | Panggil refresh/extend session, tutup dialog jika berhasil. |
| `Keluar` | Logout eksplisit dan redirect ke login. |
| Countdown habis | Auto logout dan redirect ke login. |

### 5.2 Visual Requirement

Dialog harus mengikuti `design-B-auth-pages.md` untuk visual auth/session warning, dengan tambahan canonical behavior berikut:

- Dialog berada di atas semua shell/app content.
- Backdrop visible dan mengunci interaksi di belakang.
- Countdown memakai `tabular-nums`.
- Countdown format: `MM:SS`.
- Primary action: `Tetap Masuk`.
- Secondary/destructive action: `Keluar`.
- Tidak ada tombol `X`.

### 5.3 Keyboard Accessibility

Karena dialog non-dismissible, keyboard behavior wajib eksplisit:

- Fokus awal berada pada tombol `Tetap Masuk`.
- `Tab` dan `Shift+Tab` trap focus di dalam dialog.
- `Enter` pada `Tetap Masuk` menjalankan extend session.
- `Enter` pada `Keluar` menjalankan logout.
- `Escape` tidak menutup dialog, tetapi boleh memberi micro feedback ringan seperti shake/subtle focus return bila sudah ada pattern global.

### 5.4 Timer Behavior

Countdown dimulai ketika idle/session warning threshold tercapai.

Rules:

- Timer harus dihitung dari timestamp, bukan hanya decrement interval, agar akurat saat tab inactive.
- Saat countdown habis, logout dijalankan satu kali.
- Jika extend session sukses, timer reset dan dialog ditutup.
- Jika extend session gagal karena token expired, logout langsung dijalankan.
- Jika network error saat extend session, dialog tetap tampil dan user diberi error message singkat selama masih ada waktu.

### 5.5 Recommended Copy

Title:

```text
Sesi hampir berakhir
```

Description:

```text
Karena tidak ada aktivitas, Anda akan keluar otomatis demi keamanan.
```

Countdown label:

```text
Waktu tersisa
```

Primary button:

```text
Tetap Masuk
```

Secondary button:

```text
Keluar
```

Network error while extending:

```text
Gagal memperpanjang sesi. Coba lagi sebelum waktu habis.
```

Expired message after redirect:

```text
Sesi Anda telah berakhir. Silakan login kembali.
```

---

## 6. Implementation Guardrails

### 6.1 React Hook Form + Zod

Login form tetap wajib memakai React Hook Form + Zod.

### 6.2 TanStack Query / Service Layer

Login API call harus berada di:

```text
src/modules/auth/services/authApi.ts
```

Komponen tidak boleh melakukan fetch langsung.

### 6.3 Zustand

Zustand hanya menyimpan auth/session state yang memang dibutuhkan aplikasi, bukan data API mentah dan bukan form state.

Allowed:

```text
user, company context, session status, permission summary
```

Forbidden:

```text
password, raw validation response, temporary form field state
```

---

## 7. Patch Instruction untuk Dokumen Existing

### 7.1 Patch `spec-17-auth-and-company.md`

Tambahkan section:

```md
## Login Error and Session Dialog Canonical Rules

- Wrong credentials MUST be represented as 401 Unauthorized.
- Validation failure MUST be represented as 422 Unprocessable Entity.
- Frontend MAY normalize legacy backend 422 credential errors into AUTH_INVALID_CREDENTIALS only for compatibility.
- Login schema MUST include remember_me: z.boolean().default(false).
- remember_me MUST NOT store password or raw token in frontend storage.
- Session warning dialog MUST be non-dismissible by Escape/backdrop/close icon.
- Session warning dialog can only resolve through Tetap Masuk, Keluar, or countdown expiry.
```

### 7.2 Patch `design-B-auth-pages.md`

Ubah login error behavior menjadi:

```md
Wrong credentials:
- HTTP canonical: 401 Unauthorized.
- UI tetap menampilkan field-level auth error dan toast.
- 422 hanya untuk validation error.
```

Pastikan session warning dialog menyebut:

```md
Dialog tidak bisa ditutup via Esc, backdrop click, atau close icon. Tidak ada tombol X.
```

---

## 8. Acceptance Checklist

Selesai jika semua item berikut benar:

- [ ] `spec-17` dan `design-B` sama-sama menyebut wrong credentials = `401`.
- [ ] `422` hanya dipakai untuk validation error.
- [ ] UI wrong credentials tetap punya toast dan field/form-level error.
- [ ] `loginSchema` punya `remember_me: z.boolean().default(false)`.
- [ ] `LoginRequest` memperlakukan `remember_me` sebagai optional sesuai backend contract.
- [ ] Session warning dialog tidak bisa ditutup lewat Escape/backdrop/close icon.
- [ ] Countdown `MM:SS` memakai `tabular-nums`.
- [ ] `Tetap Masuk`, `Keluar`, dan auto logout timeout terdefinisi.
- [ ] `docs/struktur_frontend.md` diupdate bila file addendum ini dimasukkan ke repo.

---

## 9. Final Canonical Decision

```text
C-02: Resolve ke 401 untuk wrong credentials, 422 untuk validation error.
C-03: Resolve dengan menambahkan remember_me ke frontend schema, default false.
C-04: Resolve dengan session warning dialog non-dismissible.
```
