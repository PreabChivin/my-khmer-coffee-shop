/** 📅 Date-grouping helpers shared by every chat surface (Café Lounge room +
 *  private DM threads) — pure functions, no React/DOM, so they're safe to
 *  import from both a client component and (in principle) a server route. */

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

/** "ថ្ងៃនេះ" / "ម្សិលមិញ" / a formatted date — the label shown on the date
 *  separator between messages sent on different days. */
export function formatDateSeparator(iso: string): string {
  const target = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === today.toDateString()) return "ថ្ងៃនេះ";
  if (dayKey(iso) === yesterday.toDateString()) return "ម្សិលមិញ";
  return target.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
