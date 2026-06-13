# 04 — Design Tokens

## Color Palette — Seaside Escape

### Brand Colors

| Token | Hex | Tailwind Custom | Penggunaan |
|---|---|---|---|
| `color-sidebar` | `#326273` | `sidebar` | Sidebar/topbar background |
| `color-accent` | `#5c9ead` | `accent` | Link, active indicator, icon aktif |
| `color-primary` | `#e39774` | `primary` | CTA button, action utama |
| `color-surface` | `#ffffff` | `surface` | Card, form, table background |
| `color-soft` | `#eeeeee` | `soft` | Table header, input background |
| `color-canvas` | `#EFEFED` | `canvas` | App background/page canvas |
| `color-text` | `#24323a` | `text-base` | Body text utama |
| `color-muted` | `#64748b` | `text-muted` | Label, placeholder, secondary text |
| `color-border` | `#d9e2e5` | `border-base` | Semua border |

### Status Colors — Semantic Standard

**DILARANG** mengubah status color. Ini adalah standar yang tidak boleh dimodifikasi.

| Status | Background | Text | Tailwind Class |
|---|---|---|---|
| `draft` | `#F1F5F9` | `#475569` | `status-draft` |
| `submitted` | `#EFF6FF` | `#1D4ED8` | `status-submitted` |
| `approved` | `#FEF3C7` | `#92400E` | `status-approved` |
| `confirmed` | `#FEF3C7` | `#92400E` | `status-confirmed` |
| `posted` | `#D1FAE5` | `#065F46` | `status-posted` |
| `partially_paid` | `#ECFDF5` | `#047857` | `status-partially-paid` |
| `paid` | `#D1FAE5` | `#065F46` | `status-paid` |
| `void` | `#FEE2E2` | `#991B1B` | `status-void` |
| `cancelled` | `#FEE2E2` | `#991B1B` | `status-cancelled` |
| `rejected` | `#FEE2E2` | `#991B1B` | `status-rejected` |
| `delivered` | `#D1FAE5` | `#065F46` | `status-delivered` |
| `received` | `#D1FAE5` | `#065F46` | `status-received` |
| `converted` | `#F3E8FF` | `#6B21A8` | `status-converted` |

---

## Typography

### Font

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Tabular Numbers — WAJIB untuk Semua Angka

```css
/* Semua angka di tabel, form amount, laporan */
font-variant-numeric: tabular-nums;

/* Tailwind class */
className="tabular-nums"
```

### Type Scale

| Role | Size | Weight | Line Height | Tailwind |
|---|---|---|---|---|
| Page title | 20px | 600 | 1.3 | `text-xl font-semibold` |
| Section title | 16px | 600 | 1.4 | `text-base font-semibold` |
| Body | 14px | 400 | 1.5 | `text-sm` |
| Body compact (tablet) | 13px | 400 | 1.4 | `text-[13px]` |
| Label/Caption | 12px | 500 | 1.4 | `text-xs font-medium` |
| Table header | 11px | 700 | 1.2 | `text-[11px] font-bold uppercase tracking-wide` |
| Amount/Number | 14px | 500 | 1.4 | `text-sm font-medium tabular-nums` |

---

## Spacing & Sizing

### Layout Dimensions

| Komponen | Ukuran | Note |
|---|---|---|
| Topbar height | 52px | Fixed |
| Ribbon panel height | 64px | Collapsible |
| Filter sidebar width | 220px | Fixed, bisa disembunyikan |
| Fixed bottom bar height | 60px | Form action bar |
| Content area padding | 16px (tablet) / 24px (desktop) | |

### Responsive Breakpoints

```typescript
// Tailwind breakpoints yang dipakai
sm: '640px'   // Smartphone landscape
md: '768px'   // iPad mini 6 — TARGET MINIMUM
lg: '1024px'  // iPad Pro / small desktop
xl: '1280px'  // Desktop standard
2xl: '1440px' // Large desktop
```

### Component Sizing

| Komponen | Tablet (768px+) | Desktop (1024px+) |
|---|---|---|
| Table row height | 36px | 40px |
| Table cell padding | `8px 12px` | `10px 16px` |
| Input height | 34px | 36px |
| Button height | 32px | 36px |
| Font size body | 13px | 14px |

---

## Border Radius

```
Card / Panel    : 8px   → rounded-lg
Button          : 6px   → rounded-md
Badge / Chip    : 9999px → rounded-full
Input           : 6px   → rounded-md
Table           : 8px   → rounded-lg (wrapper only)
Modal/Dialog    : 12px  → rounded-xl
```

---

## Shadow

```
Card shadow     : 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
Topbar shadow   : 0 1px 0 #d9e2e5 (border-bottom only, no shadow)
Bottom bar      : 0 -1px 0 #d9e2e5 (border-top only)
Dropdown shadow : 0 4px 12px rgba(0,0,0,0.12)
```

**Tidak ada heavy shadow atau gradient** kecuali yang disebutkan di atas.

---

## Tailwind Config — Custom Tokens

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#326273',
        accent: {
          DEFAULT: '#5c9ead',
          foreground: '#ffffff',
        },
        primary: {
          DEFAULT: '#e39774',
          foreground: '#ffffff',
        },
        canvas: '#EFEFED',
        soft: '#eeeeee',
        'text-base': '#24323a',
        'text-muted': '#64748b',
        'border-base': '#d9e2e5',
        // Status colors
        status: {
          draft: { bg: '#F1F5F9', text: '#475569' },
          approved: { bg: '#FEF3C7', text: '#92400E' },
          posted: { bg: '#D1FAE5', text: '#065F46' },
          void: { bg: '#FEE2E2', text: '#991B1B' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.2' }],
      },
    },
  },
} satisfies Config
```

---

## CSS Global

```css
/* src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    font-variant-numeric: tabular-nums; /* Tabular numbers global */
    -webkit-font-smoothing: antialiased;
  }

  body {
    background-color: #EFEFED;
    color: #24323a;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
  }
}

@layer components {
  /* Status badges */
  .status-badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold;
  }
  .status-draft { @apply bg-[#F1F5F9] text-[#475569]; }
  .status-submitted { @apply bg-[#EFF6FF] text-[#1D4ED8]; }
  .status-approved { @apply bg-[#FEF3C7] text-[#92400E]; }
  .status-posted { @apply bg-[#D1FAE5] text-[#065F46]; }
  .status-partially-paid { @apply bg-[#ECFDF5] text-[#047857]; }
  .status-paid { @apply bg-[#D1FAE5] text-[#065F46]; }
  .status-void { @apply bg-[#FEE2E2] text-[#991B1B]; }
  .status-cancelled { @apply bg-[#FEE2E2] text-[#991B1B]; }
  .status-rejected { @apply bg-[#FEE2E2] text-[#991B1B]; }
  .status-delivered { @apply bg-[#D1FAE5] text-[#065F46]; }
  .status-received { @apply bg-[#D1FAE5] text-[#065F46]; }
  .status-converted { @apply bg-[#F3E8FF] text-[#6B21A8]; }
}
```
