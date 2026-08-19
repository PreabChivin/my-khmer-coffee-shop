import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

const CONFIRM_PHRASE = "DELETE TEST ACCOUNTS";

const schema = z.object({
  // Same deliberate extra-step pattern as the single-account purge route —
  // a typed phrase, not just a confirm dialog, since this can delete many
  // accounts at once and is irreversible.
  confirmText: z.string().trim().min(1),
});

/**
 * POST /api/admin/customers/purge-test-accounts
 * Admin-only: permanently deletes every account flagged `isTestAccount`
 * (see lib/testAccount.ts — the reserved @claude-agent-test.local email
 * domain used by automated/AI-driven testing against production). Relies
 * on the same existing cascade rules the single-account purge route does;
 * ADMIN-role accounts are excluded as a defense-in-depth guard even though
 * a test account should never realistically hold that role.
 */
export async function POST(request: NextRequest) {
  const session = requireAdminRole(request);
  if (!session) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success || parsed.data.confirmText.trim() !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: `សូមវាយ "${CONFIRM_PHRASE}" ដើម្បីបញ្ជាក់។` },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.user.deleteMany({
      where: { isTestAccount: true, role: { not: "ADMIN" } },
    });
    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
