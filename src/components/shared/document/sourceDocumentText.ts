import type { SourceConvertOption } from './sourceConvert'

/** Backend membatasi daftar sumber 50 dokumen per permintaan. */
export const LIST_LIMIT = 50

export const sourceName = (source: SourceConvertOption) => source.label.replace(/^Dari /, '')

export function countText(count: number): string {
  return count >= LIST_LIMIT ? `${LIST_LIMIT}+` : String(count)
}

export function joinNatural(parts: string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} dan ${parts[parts.length - 1]}`
}
