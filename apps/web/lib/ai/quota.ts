/**
 * In-memory circuit breaker when Google Gemini quota is exhausted.
 * Resets when the dev server restarts or the retry window elapses.
 */
let quotaBlockedUntil = 0

export function isQuotaCircuitOpen(): boolean {
  return Date.now() < quotaBlockedUntil
}

export function markQuotaExceeded(retryAfterSeconds = 60): void {
  const retryMs = Math.max(retryAfterSeconds, 30) * 1000
  quotaBlockedUntil = Date.now() + retryMs
  console.warn(
    `[quota] Gemini unavailable until ${new Date(quotaBlockedUntil).toISOString()} — quota exceeded`
  )
}

export function isQuotaError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  const statusCode =
    err && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode?: number }).statusCode
      : undefined
  const lower = message.toLowerCase()
  return (
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('rate-limit') ||
    lower.includes('rate limit') ||
    lower.includes('credit') ||
    lower.includes('billing') ||
    statusCode === 429 ||
    statusCode === 402
  )
}

/** Parses "Please retry in 43.87s" from Google error text. */
export function parseRetryAfterSeconds(err: unknown): number {
  const message = err instanceof Error ? err.message : String(err)
  const match = message.match(/retry in ([\d.]+)s/i)
  if (match) {
    return Math.ceil(parseFloat(match[1]))
  }
  return 60
}
