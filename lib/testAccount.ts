/**
 * 🤖 Reserved, non-real email domain for automated/AI-driven account
 * creation (live-repro testing against production, e2e scripts) — never a
 * domain a real customer could plausibly sign up with. Any registration
 * using it is auto-flagged `User.isTestAccount`, so it can be bulk-purged
 * from the admin panel instead of hunted down by name.
 *
 * Convention going forward: any automated tool (including Claude's own
 * Playwright repro scripts) that needs a throwaway real account on this
 * site MUST register with an address ending in this domain.
 */
export const TEST_ACCOUNT_EMAIL_DOMAIN = "claude-agent-test.local";

export function isTestAccountEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${TEST_ACCOUNT_EMAIL_DOMAIN}`);
}
