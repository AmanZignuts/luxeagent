/**
 * Request-scoped image store.
 * Temporarily holds the imageBase64 for the current chat request,
 * keyed by chatId. Tools can retrieve the image using the chatId.
 * Entries are cleared after 30 seconds to avoid memory leaks.
 */

const store = new Map<string, { base64: string; expires: number }>()

// Clean up expired entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of store.entries()) {
      if (value.expires < now) {
        store.delete(key)
      }
    }
  }, 60_000)
}

export function setImageForChat(chatId: string, base64: string): void {
  store.set(chatId, { base64, expires: Date.now() + 30_000 })
}

export function getImageForChat(chatId: string): string | null {
  const entry = store.get(chatId)
  if (!entry) return null
  if (entry.expires < Date.now()) {
    store.delete(chatId)
    return null
  }
  return entry.base64
}

export function clearImageForChat(chatId: string): void {
  store.delete(chatId)
}
