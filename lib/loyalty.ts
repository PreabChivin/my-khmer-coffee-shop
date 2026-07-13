/** 🐻 Cute Bear Stamps loyalty program. */
export const STAMPS_PER_FREE_DRINK = 6;

/** Strips everything but digits so phone numbers key consistently regardless
 *  of spacing/dashes the customer typed (e.g. "012 345 678" === "012345678"). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Live input sanitizer for the phone field — keeps only ASCII 0-9, which
 *  also strips Khmer numerals (០-៩, a different Unicode range) and spaces
 *  as the customer types, rather than just rejecting them on submit. */
export function sanitizePhoneInput(raw: string): string {
  return raw.replace(/[^0-9]/g, "").slice(0, 15);
}

/** Server-side phone format check — mirrors sanitizePhoneInput's intent but
 *  re-validated on the server since client-side sanitization is trivially
 *  bypassable (a raw fetch/curl can send anything). */
export function isValidPhone(phone: string): boolean {
  return /^[0-9]{8,15}$/.test(phone.trim());
}

export function computeAvailableFreeDrinks(
  stampCount: number,
  freeDrinksRedeemed: number
): number {
  return Math.max(
    0,
    Math.floor(stampCount / STAMPS_PER_FREE_DRINK) - freeDrinksRedeemed
  );
}
