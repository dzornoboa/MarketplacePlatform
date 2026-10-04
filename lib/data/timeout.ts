/* A page must never wait for ever. If the database or a third party stops
   answering, the request that depends on it gives up after a bounded time and
   the page renders with whatever it has, instead of leaving the member looking
   at a loading skeleton that never resolves. */

export const DATA_TIMEOUT_MS = 12_000

export async function withTimeout<T>(work: PromiseLike<T>, fallback: T, label: string, ms = DATA_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const expiry = new Promise<T>(resolve => {
    timer = setTimeout(() => {
      console.error(`Timed out after ${ms}ms waiting for ${label}.`)
      resolve(fallback)
    }, ms)
  })
  try {
    return await Promise.race([work, expiry])
  } catch (error) {
    console.error(`Failed while loading ${label}:`, error instanceof Error ? error.message : error)
    return fallback
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/* The same guard for a Supabase query. A query that times out or fails comes
   back looking like an empty one, so the page still renders. */
export async function query<T>(work: PromiseLike<{ data: T | null }>, label: string, ms = DATA_TIMEOUT_MS): Promise<{ data: T | null }> {
  return withTimeout<{ data: T | null }>(work, { data: null }, label, ms)
}
