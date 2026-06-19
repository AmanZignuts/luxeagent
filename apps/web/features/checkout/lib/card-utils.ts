/**
 * Shared card utility functions — used by CheckoutPage and ProfilePage.
 */

/** Detect card brand from the card number string */
export function detectCardBrand(num: string): string {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(?:011|5)/.test(n)) return "Discover";
  return "Card";
}

/** Format a raw digit string as a spaced card number (e.g. "4111 1111 1111 1111") */
export function formatCardNumber(val: string): string {
  const clean = val.replace(/\D/g, "");
  const trimmed = clean.substring(0, 16);
  return trimmed.match(/.{1,4}/g)?.join(" ") || trimmed;
}

/** Format a raw digit string as MM/YY expiry */
export function formatCardExpiry(val: string): string {
  const clean = val.replace(/\D/g, "");
  const trimmed = clean.substring(0, 4);
  return trimmed.length > 2
    ? `${trimmed.substring(0, 2)}/${trimmed.substring(2)}`
    : trimmed;
}
