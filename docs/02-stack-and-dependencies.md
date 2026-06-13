# 02 — Stack & Dependencies

## Core Stack

```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "typescript": "^5.4.0",
  "vite": "^5.2.0",
  "react-router-dom": "^6.23.0"
}
```

## State Management

```json
{
  "@tanstack/react-query": "^5.40.0",
  "zustand": "^4.5.0"
}
```

### Pembagian Tanggung Jawab State — WAJIB DIIKUTI

| Library | Tanggung Jawab | Contoh |
|---|---|---|
| TanStack Query | Semua server state | Fetch invoice list, mutate post invoice |
| Zustand | UI state global | Auth token, active company, ribbon state |
| React Hook Form | Form state | Field values, validation errors |
| useState (lokal) | State satu komponen | Toggle dropdown, active tab lokal |

**DILARANG:**
- Fetch data di `useEffect` langsung — gunakan TanStack Query
- Simpan data API di Zustand — Zustand hanya untuk UI state
- Prop-drill lebih dari 2 level — gunakan context atau store

## UI Components

```json
{
  "shadcn/ui": "latest",
  "tailwindcss": "^3.4.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.3.0",
  "lucide-react": "^0.390.0"
}
```

### Shadcn/ui — Cara Pakai

Shadcn/ui bukan library biasa — komponen di-copy ke project:
```
src/components/ui/
├── button.tsx
├── input.tsx
├── select.tsx
├── dialog.tsx
├── table.tsx
├── toast.tsx
└── ...
```

Jangan install dari npm, gunakan CLI:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
```

**DILARANG** memodifikasi file di `src/components/ui/` secara ad-hoc — buat wrapper di `src/components/shared/` jika perlu kustomisasi.

## Form & Validation

```json
{
  "react-hook-form": "^7.51.0",
  "@hookform/resolvers": "^3.3.0",
  "zod": "^3.23.0"
}
```

### Pattern Form — WAJIB

```typescript
// Selalu gunakan pattern ini untuk form
const schema = z.object({
  customer_id: z.number({ required_error: 'Customer wajib dipilih' }),
  invoice_date: z.string().min(1, 'Tanggal wajib diisi'),
  // ...
})

type FormValues = z.infer<typeof schema>

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
})
```

## HTTP Client

```json
{
  "axios": "^1.7.0"
}
```

### Axios Instance — Sudah Dikonfigurasi di `src/services/http.ts`

```typescript
// JANGAN buat axios instance baru
// Selalu import dari:
import { http } from '@/services/http'
```

Instance sudah include:
- Base URL dari `VITE_API_BASE_URL`
- Auto-inject `Authorization: Bearer {token}`
- Auto-inject `X-Company-ID: {activeCompanyId}`
- Response interceptor: unwrap envelope, handle 401 → redirect login

## Typography

```
Font: Inter (Google Fonts)
Tabular numbers: font-variant-numeric: tabular-nums
```

Konfigurasi di `tailwind.config.ts`:
```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
```

Class untuk angka di tabel dan laporan:
```
className="tabular-nums"
```

## Environment Variables

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Seaside Escape ERP
```

**DILARANG** hardcode URL API di kode. Selalu gunakan `import.meta.env.VITE_API_BASE_URL`.

## Dependencies yang DILARANG Ditambah Tanpa Diskusi

- Moment.js (gunakan date-fns atau Intl API)
- Lodash full (gunakan lodash-es atau native JS)
- Redux / Redux Toolkit (sudah ada Zustand)
- Axios-mock-adapter di production build
- CSS-in-JS libraries (styled-components, emotion)
