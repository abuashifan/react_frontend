import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'

const WARNING_MINUTES = 5
const WARNING_SECONDS = WARNING_MINUTES * 60

export function useSessionTimeout() {
  const navigate = useNavigate()
  const { logout, token } = useAuthStore()
  const { settings } = useCompanyStore()
  const timeoutMinutes = settings?.session_timeout_minutes ?? 30

  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_SECONDS)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const doLogout = useCallback(() => {
    clearAllTimers()
    logout()
    navigate('/login', { state: { reason: 'session_expired' } })
  }, [clearAllTimers, logout, navigate])

  // Called from event listeners (async callbacks) — setState is allowed here
  const resetTimer = useCallback(() => {
    clearAllTimers()
    setIsWarningOpen(false)
    setSecondsRemaining(WARNING_SECONDS)

    if (!token) return

    const warningMs = (timeoutMinutes - WARNING_MINUTES) * 60 * 1000
    const logoutMs = timeoutMinutes * 60 * 1000

    warningTimerRef.current = setTimeout(() => {
      setIsWarningOpen(true)
      setSecondsRemaining(WARNING_SECONDS)
      countdownRef.current = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1))
      }, 1000)
    }, warningMs)

    idleTimerRef.current = setTimeout(doLogout, logoutMs)
  }, [token, timeoutMinutes, clearAllTimers, doLogout])

  const handleContinue = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (!token) return

    const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const
    EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }))

    // Initialize timers — only scheduling, no setState called synchronously here
    const warningMs = (timeoutMinutes - WARNING_MINUTES) * 60 * 1000
    const logoutMs = timeoutMinutes * 60 * 1000

    warningTimerRef.current = setTimeout(() => {
      setIsWarningOpen(true)
      setSecondsRemaining(WARNING_SECONDS)
      countdownRef.current = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1))
      }, 1000)
    }, warningMs)

    idleTimerRef.current = setTimeout(doLogout, logoutMs)

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimer))
      clearAllTimers()
    }
  }, [token, timeoutMinutes, resetTimer, clearAllTimers, doLogout])

  return { isWarningOpen, secondsRemaining, handleContinue, doLogout }
}
