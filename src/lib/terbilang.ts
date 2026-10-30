const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

function eja(n: number): string {
  if (n < 12) return SATUAN[n]
  if (n < 20) return `${eja(n - 10)} belas`
  if (n < 100) return `${eja(Math.floor(n / 10))} puluh ${eja(n % 10)}`
  if (n < 200) return `seratus ${eja(n - 100)}`
  if (n < 1000) return `${eja(Math.floor(n / 100))} ratus ${eja(n % 100)}`
  if (n < 2000) return `seribu ${eja(n - 1000)}`
  if (n < 1_000_000) return `${eja(Math.floor(n / 1000))} ribu ${eja(n % 1000)}`
  if (n < 1_000_000_000) return `${eja(Math.floor(n / 1_000_000))} juta ${eja(n % 1_000_000)}`
  if (n < 1_000_000_000_000) return `${eja(Math.floor(n / 1_000_000_000))} miliar ${eja(n % 1_000_000_000)}`
  return `${eja(Math.floor(n / 1_000_000_000_000))} triliun ${eja(n % 1_000_000_000_000)}`
}

/**
 * Nominal rupiah dalam kata untuk kwitansi/bukti kas, mis. 1.250.500 ->
 * "Satu juta dua ratus lima puluh ribu lima ratus rupiah". Sen dibulatkan.
 */
export function terbilang(amount: number | string | null | undefined): string {
  const n = Math.round(Math.abs(Number(amount) || 0))
  const words = n === 0 ? 'nol' : eja(n).replace(/\s+/g, ' ').trim()
  const text = `${Number(amount) < 0 ? 'minus ' : ''}${words} rupiah`
  return text.charAt(0).toUpperCase() + text.slice(1)
}
