-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTestAccount" BOOLEAN NOT NULL DEFAULT false;

-- Retroactively flag the throwaway accounts created earlier in this same
-- session while live-reproducing the Quick Match lobby bug (before this
-- flag/convention existed) — a precise, known email-prefix match, not a
-- name-pattern guess. Any other pre-existing test-looking accounts
-- (e.g. "Chibi Tester", "E2E Tester") are deliberately left untouched.
UPDATE "User" SET "isTestAccount" = true
WHERE email LIKE 'claude-bugrepro%@example.com'
   OR email LIKE 'claude-fixverify%@example.com';
