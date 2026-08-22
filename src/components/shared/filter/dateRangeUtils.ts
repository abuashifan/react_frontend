function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function shiftDate(base: Date, amount: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + amount)
  return next
}

function startOfWeek(base: Date): Date {
  const next = new Date(base)
  const day = next.getDay()
  const offset = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + offset)
  return next
}

function startOfMonth(base: Date): Date {
  return new Date(base.getFullYear(), base.getMonth(), 1)
}

function startOfYear(base: Date): Date {
  return new Date(base.getFullYear(), 0, 1)
}

export function getDateRangePreset(preset: 'today' | 'week' | 'month' | 'year'): { from: string; to: string } {
  const today = new Date()

  if (preset === 'today') {
    const value = toDateInputValue(today)
    return { from: value, to: value }
  }

  if (preset === 'week') {
    return { from: toDateInputValue(startOfWeek(today)), to: toDateInputValue(today) }
  }

  if (preset === 'month') {
    return { from: toDateInputValue(startOfMonth(today)), to: toDateInputValue(today) }
  }

  return { from: toDateInputValue(startOfYear(today)), to: toDateInputValue(today) }
}

export function shiftDateInputValue(value: string, amount: number): string {
  if (!value) return value
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return toDateInputValue(shiftDate(date, amount))
}
