import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'

const WARNING_MINUTES = 5
const WARNING_SECONDS = WARNING_MINUTES * 60

function getWarningSeconds(timeoutMinutes: number): number {
  return Math.min(WARNING_SECONDS, Math.max(1, timeoutMinutes * 60))
}

export function useSessionTimeout() {
  const navigate = useNavigate()
  const { logout, token } = useAuthStore()
  const { settings } = useCompanyStore()
  const timeoutMinutes = settings?.session_timeout_minutes ?? 30
  const warningSeconds = getWarningSeconds(timeoutMinutes)

  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const warningOpenRef = useRef(false)
  const logoutDeadlineRef = useRef<number | null>(null)
  const hasLoggedOutRef = useRef(false)

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const doLogout = useCallback(() => {
    if (hasLoggedOutRef.current) return
    hasLoggedOutRef.current = true
    clearAllTimers()
    warningOpenRef.current = false
    setIsWarningOpen(false)
    logout()
    navigate('/login', { state: { reason: 'session_expired' }, replace: true })
  }, [clearAllTimers, logout, navigate])

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)

    const tick = () => {
      const deadline = logoutDeadlineRef.current
      if (!deadline) return

      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSecondsRemaining(remaining)

      if (remaining === 0) {
        doLogout()
      }
    }

    tick()
    countdownRef.current = setInterval(tick, 1000)
  }, [doLogout])

  const openWarning = useCallback(() => {
    warningOpenRef.current = true
    setIsWarningOpen(true)
    startCountdown()
  }, [startCountdown])

  const scheduleTimers = useCallback(() => {
    clearAllTimers()
    hasLoggedOutRef.current = false
    warningOpenRef.current = false
    setIsWarningOpen(false)
    setSecondsRemaining(warningSeconds)

    if (!token) return

    const timeoutSeconds = Math.max(1, timeoutMinutes * 60)
    const warningDelaySeconds = Math.max(0, timeoutSeconds - warningSeconds)
    logoutDeadlineRef.current = Date.now() + timeoutSeconds * 1000

    warningTimerRef.current = setTimeout(openWarning, warningDelaySeconds * 1000)
    idleTimerRef.current = setTimeout(doLogout, timeoutSeconds * 1000)
  }, [clearAllTimers, doLogout, openWarning, timeoutMinutes, token, warningSeconds])

  const handleActivity = useCallback(() => {
    if (warningOpenRef.current) return
    scheduleTimers()
  }, [scheduleTimers])

  const handleContinue = useCallback(() => {
    scheduleTimers()
  }, [scheduleTimers])

  useEffect(() => {
    if (!token) return

    const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const
    EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    const initialTimer = window.setTimeout(scheduleTimers, 0)

    return () => {
      window.clearTimeout(initialTimer)
      EVENTS.forEach((e) => window.removeEventListener(e, handleActivity))
      clearAllTimers()
    }
  }, [token, handleActivity, scheduleTimers, clearAllTimers])

  return { isWarningOpen, secondsRemaining, handleContinue, doLogout }
}
