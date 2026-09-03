/**
 * Label klasifikasi arus kas.
 *
 * Ditaruh di `constants/`, bukan di `CashBudgetView`, supaya halaman yang
 * mengekspor Cash Budget bisa memakai label yang sama tanpa mengekspor
 * non-komponen dari file komponen — itu mematikan Fast Refresh
 * (`react-refresh/only-export-components`).
 */
export const SECTION_LABELS: Record<string, string> = {
  operating: 'Operasi',
  investing: 'Investasi',
  financing: 'Pendanaan',
}
