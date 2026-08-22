import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Izinkan binding hasil destructuring yang sengaja dibuang lewat rest (pola omit field),
      // dan variabel/arg berprefiks `_` sebagai penanda "sengaja tak dipakai".
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // React Compiler menganggap React Hook Form `watch()` "incompatible" karena membaca
      // ref internal RHF (bukan React state), sehingga komponen form tidak di-memoize.
      // Ini efek samping desain RHF — library form WAJIB di repo ini (AGENTS.md §8) — dan
      // hanya menyembunyikan optimasi, bukan bug runtime. Rule dimatikan agar warning permanen
      // ini tidak jadi noise. Jika suatu saat migrasi ke `useWatch`, aktifkan kembali.
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
