export function safeNextPath(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return fallback
  // WHATWG URL parsing treats backslashes as separators and strips control characters.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback
  return value
}
