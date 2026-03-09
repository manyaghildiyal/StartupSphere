import type { Stage, StartupProfile, InvestorProfile } from './types/types'

export const stageFactor: Record<Stage, number> = {
  idea:   0.35,
  mvp:    0.60,
  growth: 0.82,
  scale:  0.93,
}

export function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v))
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function calcSuccess(s: StartupProfile): number {
  const f  = clamp(1 - s.fundingNeeded / 2_000_000)
  const t  = clamp(s.teamSize / 30)
  const d  = clamp(s.description.trim().length / 600)
  const st = stageFactor[s.stage]
  return Math.round(clamp(f * 0.2 + t * 0.22 + d * 0.18 + st * 0.4) * 100)
}

export function recScore(s: StartupProfile, inv: InvestorProfile): number {
  const sectors = inv.investmentSectors.map(x => x.toLowerCase().trim())
  const iM  = sectors.includes(s.industry.toLowerCase().trim()) ? 1 : 0.35
  const stM = s.stage === inv.preferredStage ? 1 : 0.6
  const aF  = clamp(inv.investmentAmount / Math.max(s.fundingNeeded, 1))
  return iM * 0.4 + stM * 0.2 + aF * 0.2 + (calcSuccess(s) / 100) * 0.2
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}