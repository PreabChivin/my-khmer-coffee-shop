/** 🐻 Cute Bear Stamps loyalty program. */
export const STAMPS_PER_FREE_DRINK = 6;

/** Strips everything but digits so phone numbers key consistently regardless
 *  of spacing/dashes the customer typed (e.g. "012 345 678" === "012345678"). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
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
