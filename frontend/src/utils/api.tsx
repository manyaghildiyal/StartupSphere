const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '') + '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ss_token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? data.message ?? 'Request failed')
  return data as T
}

export type AuthPayload = {
  token: string
  user: { id: string; name: string; email: string; role: 'startup' | 'investor' }
}

export type StartupProfile = {
  userId: string
  startupName: string
  industry: string
  description: string
  fundingNeeded: number
  teamSize: number
  stage: 'idea' | 'mvp' | 'growth' | 'scale'
  pitchDeckName: string
}

export type InvestorProfile = {
  userId: string
  investmentSectors: string[]
  investmentAmount: number
  preferredStage: 'idea' | 'mvp' | 'growth' | 'scale'
}

export type ContactRequest = {
  id: string
  investorUserId: string
  investorName: string
  startupUserId: string
  message: string
  createdAt: string
}

export const api = {
  register(body: { name: string; email: string; password: string; role: string }) {
    return request<AuthPayload>('/auth/register', { method: 'POST', body: JSON.stringify(body) })
  },
  login(body: { email: string; password: string }) {
    return request<AuthPayload>('/auth/login', { method: 'POST', body: JSON.stringify(body) })
  },
  me() {
    return request<{ user: AuthPayload['user'] }>('/auth/me')
  },

  getMyStartup() {
    return request<{ profile: StartupProfile | null }>('/startups/me')
  },
  saveStartup(body: Omit<StartupProfile, 'userId'>) {
    return request<{ profile: StartupProfile }>('/startups/me', { method: 'POST', body: JSON.stringify(body) })
  },
  getStartups(filters?: { industry?: string; stage?: string; maxFunding?: number }) {
    const params = new URLSearchParams()
    if (filters?.industry)  params.set('industry', filters.industry)
    if (filters?.stage)     params.set('stage', filters.stage)
    if (filters?.maxFunding) params.set('maxFunding', String(filters.maxFunding))
    const qs = params.toString()
    return request<{ startups: StartupProfile[] }>(`/startups${qs ? `?${qs}` : ''}`)
  },

  getMyInvestor() {
    return request<{ profile: InvestorProfile | null }>('/investors/me')
  },
  saveInvestor(body: Omit<InvestorProfile, 'userId'>) {
    return request<{ profile: InvestorProfile }>('/investors/me', { method: 'POST', body: JSON.stringify(body) })
  },

  sendRequest(body: { startupUserId: string; message: string }) {
    return request<{ request: ContactRequest }>('/requests', { method: 'POST', body: JSON.stringify(body) })
  },
  getInbox() {
    return request<{ requests: ContactRequest[] }>('/requests/inbox')
  },
}