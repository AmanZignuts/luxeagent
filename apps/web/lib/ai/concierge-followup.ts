/** User messages that should not re-run catalog/outfit tools (bag confirm, sizing, etc.). */
export function isConciergeFollowUpMessage(text: string): boolean {
  const q = text.trim().toLowerCase()
  if (!q) return false

  return (
    /\b(i\s+)?added\b/.test(q) ||
    q.includes('added to my bag') ||
    q.includes('added the complete') ||
    q.includes('added to curation bag') ||
    q.includes('choose another piece') ||
    q.startsWith('check inventory for sku') ||
    q.includes('closest to my budget') ||
    (q.includes('more ') && q.includes(' picks'))
  )
}
