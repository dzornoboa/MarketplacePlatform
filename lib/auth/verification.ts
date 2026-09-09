import type { VerificationStatus } from './access.ts'

export type ReviewDecision = 'approve' | 'changes' | 'reject'

export function reviewDecisionToStatus(value: string): VerificationStatus | null {
  switch (value) {
    case 'approve': return 'verified'
    case 'changes': return 'changes_requested'
    case 'reject': return 'rejected'
    default: return null
  }
}
