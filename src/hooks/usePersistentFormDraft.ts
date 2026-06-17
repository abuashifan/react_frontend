import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useWatch,
  type Control,
  type FieldValues,
  type UseFormGetValues,
  type UseFormReset,
} from 'react-hook-form'
import { useAuthStore } from '@/stores/useAuthStore'

interface StoredFormDraft<TFormValues extends FieldValues, TExtra> {
  version: number
  savedAt: string
  values: TFormValues
  extra?: TExtra
}

interface UsePersistentFormDraftOptions<TFormValues extends FieldValues, TExtra> {
  draftKey: string
  control: Control<TFormValues>
  getValues: UseFormGetValues<TFormValues>
  reset: UseFormReset<TFormValues>
  extra?: TExtra
  onRestoreExtra?: (extra: TExtra) => void
  enabled?: boolean
  autoRestore?: boolean
  debounceMs?: number
  version?: number
}

interface PersistentFormDraftControls {
  hasDraft: boolean
  isRestored: boolean
  storageKey: string
  restoreDraft: () => boolean
  clearDraft: () => void
  discardDraft: () => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readDraft<TFormValues extends FieldValues, TExtra>(
  storageKey: string,
  version: number,
): StoredFormDraft<TFormValues, TExtra> | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed) || parsed.version !== version || !isRecord(parsed.values)) {
      return null
    }

    return parsed as unknown as StoredFormDraft<TFormValues, TExtra>
  } catch {
    return null
  }
}

export function usePersistentFormDraft<TFormValues extends FieldValues, TExtra = unknown>({
  draftKey,
  control,
  getValues,
  reset,
  extra,
  onRestoreExtra,
  enabled = true,
  autoRestore = true,
  debounceMs = 600,
  version = 1,
}: UsePersistentFormDraftOptions<TFormValues, TExtra>): PersistentFormDraftControls {
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const watchedValues = useWatch({ control }) as TFormValues
  const isRestoringRef = useRef(false)
  const restoredKeyRef = useRef<string | null>(null)

  const storageKey = useMemo(
    () =>
      [
        'seaside-erp',
        'form-draft',
        `v${version}`,
        `company-${activeCompanyId ?? 'none'}`,
        draftKey,
      ].join(':'),
    [activeCompanyId, draftKey, version],
  )

  const [hasDraft, setHasDraft] = useState(() => readDraft<TFormValues, TExtra>(storageKey, version) !== null)
  const [isRestored, setIsRestored] = useState(false)

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(storageKey)
    setHasDraft(false)
    setIsRestored(false)
  }, [storageKey])

  const restoreDraft = useCallback(() => {
    if (!enabled) return false

    const draft = readDraft<TFormValues, TExtra>(storageKey, version)
    if (!draft) {
      setHasDraft(false)
      return false
    }

    isRestoringRef.current = true
    reset(draft.values)
    if (draft.extra !== undefined) {
      onRestoreExtra?.(draft.extra)
    }
    setHasDraft(true)
    setIsRestored(true)

    window.setTimeout(() => {
      isRestoringRef.current = false
    }, 0)
    return true
  }, [enabled, onRestoreExtra, reset, storageKey, version])

  const discardDraft = useCallback(() => {
    clearDraft()
  }, [clearDraft])

  useEffect(() => {
    if (!enabled || !autoRestore || restoredKeyRef.current === storageKey) return
    restoredKeyRef.current = storageKey
    restoreDraft()
  }, [autoRestore, enabled, restoreDraft, storageKey])

  useEffect(() => {
    if (!enabled || isRestoringRef.current || typeof window === 'undefined') return

    const timer = window.setTimeout(() => {
      const draft: StoredFormDraft<TFormValues, TExtra> = {
        version,
        savedAt: new Date().toISOString(),
        values: getValues(),
      }

      if (extra !== undefined) {
        draft.extra = extra
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(draft))
        setHasDraft(true)
      } catch {
        setHasDraft(false)
      }
    }, debounceMs)

    return () => window.clearTimeout(timer)
  }, [debounceMs, enabled, extra, getValues, storageKey, version, watchedValues])

  return {
    hasDraft,
    isRestored,
    storageKey,
    restoreDraft,
    clearDraft,
    discardDraft,
  }
}
