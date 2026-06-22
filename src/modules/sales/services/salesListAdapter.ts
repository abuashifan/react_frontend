/**
 * Adapter response list Sales: memetakan field canonical backend ke field yang
 * dibaca UI list (A13-151). http.ts hanya membuat alias `number`; date/relation
 * per-resource dipetakan eksplisit di sini (sesuai rekomendasi http.ts: override
 * per service, bukan menambah alias global).
 *
 * `map` = { targetField: backendSourceField }. Target hanya diisi jika kosong,
 * sehingga tidak menimpa nilai canonical yang sudah benar.
 */
export function adaptSalesListRows<T>(rows: T[], map: Record<string, string>): T[] {
  return rows.map((row) => {
    const rec = row as Record<string, unknown>
    const out: Record<string, unknown> = { ...rec }
    for (const [target, source] of Object.entries(map)) {
      const current = out[target]
      if ((current === undefined || current === null || current === '') && rec[source] !== undefined) {
        out[target] = rec[source]
      }
    }
    return out as T
  })
}
