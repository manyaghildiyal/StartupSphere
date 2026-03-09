import type { AppData } from './types/types'

export const STORAGE_KEY = 'startusphere_data_v1'
export const SESSION_KEY = 'startusphere_session_v1'

const EMPTY: AppData = { users: [], startups: [], investors: [], requests: [] }

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const p = JSON.parse(raw) as AppData
    return {
      users:     p.users     ?? [],
      startups:  p.startups  ?? [],
      investors: p.investors ?? [],
      requests:  p.requests  ?? [],
    }
  } catch {
    return EMPTY
  }
}

export function saveData(d: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

export function getSessionUserId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function setSessionUserId(id: string) {
  localStorage.setItem(SESSION_KEY, id)
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}