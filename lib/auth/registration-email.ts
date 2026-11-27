export const registrationEmailFetch = fetchWithDeadline(8_000)

export function fetchWithDeadline(timeoutMs: number, fetcher: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController()
    const callerSignal = init?.signal ?? (input instanceof Request ? input.signal : null)
    const signal = callerSignal ? AbortSignal.any([callerSignal, controller.signal]) : controller.signal
    const timer = setTimeout(() => controller.abort(new DOMException('Registration email request timed out', 'TimeoutError')), timeoutMs)
    try {
      return await fetcher(input, { ...init, signal })
    } finally {
      clearTimeout(timer)
    }
  }
}
