# design-L-error-pages.md — Error Pages Visual Spec

**Produk:** Seaside Escape ERP Frontend  
**Status:** Tambahan dari audit missing docs  
**Referensi:** `spec-21-error-pages-and-print-export.md`

---

## 1. Scope

Dokumen ini mendefinisikan visual spec untuk:

- `ErrorPage.tsx`;
- `MaintenancePage.tsx`;
- `NetworkErrorPage.tsx`;
- permission/forbidden page if reused;
- not found page if reused.

---

## 2. Design Intent

Error pages harus jelas, tidak dramatis, dan tetap terasa seperti bagian dari ERP.

Pada tablet landscape:

- error content center dalam content region;
- tidak memakai ribbon;
- tidak menimbulkan page scroll;
- primary recovery action terlihat jelas.

---

## 3. Shell

Auth-level fatal errors may be full-screen.

App-level errors use shell:

```text
Topbar 52
Primary tabs optional
Content region center
```

Error page tidak memakai ribbon.

---

## 4. Layout

```text
┌────────────────────────────────────────────┐
│                                            │
│              [Illustration/Icon]           │
│              Error Title                   │
│              Description                   │
│              [Primary] [Secondary]         │
│                                            │
└────────────────────────────────────────────┘
```

Container:

| Property | Value |
|---|---:|
| Max width | 480px |
| Padding | 24px |
| Text align | center |
| Icon size | 56–72px |
| Card optional | yes, subtle |

---

## 5. Error Types

### 5.1 Generic Error

Title: `Terjadi Kesalahan`  
Primary action: `Coba Lagi`  
Secondary action: `Kembali ke Dashboard`

### 5.2 Network Error

Title: `Koneksi Bermasalah`  
Description should mention checking internet or backend connection.  
Primary action: `Coba Lagi`

### 5.3 Maintenance

Title: `Sistem Sedang Maintenance`  
Description may include estimated time if provided by API/config.  
Primary action: `Refresh`

### 5.4 Not Found

Title: `Halaman Tidak Ditemukan`  
Primary action: `Ke Dashboard`

### 5.5 Forbidden

Title: `Akses Tidak Diizinkan`  
Primary action: `Kembali`  
Secondary: contact admin guidance.

---

## 6. Visual Tokens

Use neutral surface and brand accent.

| Element | Spec |
|---|---|
| Title | 20px / 700 |
| Description | 13px / 400 muted |
| Primary button | default primary |
| Secondary button | outline/ghost |
| Icon color | muted/brand depending state |
| Error icon | destructive muted, not harsh full red block |

---

## 7. Tablet Behavior

At 1024×768:

- content vertically centered in available shell content;
- no page-level scroll;
- buttons stay in one row if width permits;
- if narrow, buttons stack with 8px gap.

---

## 8. Accessibility

- Error title should be heading.
- Retry button focusable.
- Use `role="alert"` only when error appears dynamically.
- Do not rely on icon/color only.

---

## 9. Acceptance Checklist

- [ ] Error page fits 1024×768.
- [ ] Primary recovery action visible.
- [ ] No ribbon.
- [ ] Text readable and concise.
- [ ] Error state accessible without color-only meaning.
