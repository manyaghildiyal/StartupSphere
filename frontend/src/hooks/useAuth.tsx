import { useState, useEffect, useRef, useCallback } from 'react'
import type { User } from '../types/types'
import { api } from '../utils/api'

const TOKEN_KEY = 'ss_token'
const USER_KEY  = 'ss_user'

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch { return null }
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch { return null }
}

function loadStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const [user, setUser]     = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logout = useCallback((reason?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setStatus('unauthenticated')
    if (reason) console.info('[useAuth] logged out:', reason)
  }, [])

  const scheduleAutoLogout = useCallback((token: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const expiry = getTokenExpiry(token)
    if (!expiry) return
    const ms = expiry - Date.now()
    if (ms <= 0) { logout('token already expired'); return }
    timerRef.current = setTimeout(() => logout('token expired'), ms)
  }, [logout])

  const login = useCallback((u: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
    setStatus('authenticated')
    scheduleAutoLogout(token)
  }, [scheduleAutoLogout])

  useEffect(() => {
    const token = loadStoredToken()
    const stored = loadStoredUser()

    if (!token || !stored) {
      setStatus('unauthenticated')
      return
    }

    const expiry = getTokenExpiry(token)
    if (expiry && expiry <= Date.now()) {
      logout('token expired on load')
      return
    }

    api.me()
      .then(({ user: serverUser }) => {
        const u: User = { ...stored, id: serverUser.id, name: serverUser.name, email: serverUser.email, role: serverUser.role }
        localStorage.setItem(USER_KEY, JSON.stringify(u))
        setUser(u)
        setStatus('authenticated')
        scheduleAutoLogout(token)
      })
      .catch(() => logout('server rejected token'))
  }, [logout, scheduleAutoLogout])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return { user, status, login, logout }
}