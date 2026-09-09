import { isKnownParticipantType, type ParticipantType } from './access.ts'

export type SignupInput = { fullName: string; email: string; password: string; participantType: string }
export type ValidationResult = { ok: true } | { ok: false; errors: Record<string, string> }

export function validateEmail(email: string): string | null {
  const value = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.'
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.'
  return null
}

export function validateSignupInput(input: SignupInput): ValidationResult {
  const errors: Record<string, string> = {}
  const fullName = input.fullName.trim()
  const emailError = validateEmail(input.email)
  const passwordError = validatePassword(input.password)
  if (fullName.length < 2) errors.fullName = 'Enter your full name.'
  if (emailError) errors.email = emailError
  if (passwordError) errors.password = passwordError
  if (!isKnownParticipantType(input.participantType) || input.participantType === 'staff') errors.participantType = 'Select a valid participant type.'
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true }
}

export function normalizeParticipantType(value: string): ParticipantType | null {
  return isKnownParticipantType(value) ? value : null
}
