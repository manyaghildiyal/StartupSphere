import type { Stage } from '../types/types'

export default function StageChip({ stage }: { stage: Stage }) {
  const labels: Record<Stage, string> = { idea: 'Idea', mvp: 'MVP', growth: 'Growth', scale: 'Scale' }
  return <span className={`meta-pill stage-${stage}`}>{labels[stage]}</span>
}