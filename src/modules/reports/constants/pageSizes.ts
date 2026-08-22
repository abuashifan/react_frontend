// Ukuran kertas untuk print-preview laporan Financial Statement.
// Dimensi eksplisit dalam mm (bukan CSS size keyword) supaya orientation
// dan Custom bisa dihitung dengan cara yang sama.
export type PageSizeKey = 'A4' | 'F4' | 'Letter' | 'Custom'
export type PageOrientation = 'portrait' | 'landscape'

export interface PageDimensionsMm {
  widthMm: number
  heightMm: number
}

export const PAGE_SIZE_PRESETS: Record<Exclude<PageSizeKey, 'Custom'>, PageDimensionsMm> = {
  A4: { widthMm: 210, heightMm: 297 },
  F4: { widthMm: 215, heightMm: 330 },
  Letter: { widthMm: 216, heightMm: 279 },
}

export const PAGE_SIZE_LABELS: Record<PageSizeKey, string> = {
  A4: 'A4',
  F4: 'F4 (Folio)',
  Letter: 'Letter',
  Custom: 'Custom',
}

export const DEFAULT_PAGE_MARGIN_MM = 15

/** Resolusi dimensi akhir (mengikuti orientation & Custom) untuk dipakai di CSS. */
export function resolvePageDimensionsMm(input: {
  size: PageSizeKey
  orientation: PageOrientation
  customWidthMm: number
  customHeightMm: number
}): PageDimensionsMm {
  const base = input.size === 'Custom'
    ? { widthMm: input.customWidthMm, heightMm: input.customHeightMm }
    : PAGE_SIZE_PRESETS[input.size]

  if (input.orientation === 'landscape') {
    return { widthMm: Math.max(base.widthMm, base.heightMm), heightMm: Math.min(base.widthMm, base.heightMm) }
  }
  return { widthMm: Math.min(base.widthMm, base.heightMm), heightMm: Math.max(base.widthMm, base.heightMm) }
}
