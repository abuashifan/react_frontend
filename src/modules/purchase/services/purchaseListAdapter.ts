/**
 * Adapter response list Purchase: memetakan field canonical backend ke field
 * yang dibaca UI list (A13-176). Sejajar dengan `salesListAdapter` (Phase 28):
 * http.ts hanya membuat alias `number`; date/relation per-resource dipetakan
 * eksplisit di sini, bukan sebagai alias global.
 *
 * `map` = { targetField: backendSourceField }. Target hanya diisi jika kosong,
 * sehingga tidak menimpa nilai canonical yang sudah benar.
 */
export function adaptPurchaseListRows<T>(rows: T[], map: Record<string, string>): T[] {
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
