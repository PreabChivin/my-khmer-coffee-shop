import { NextRequest, NextResponse } from "next/server";
import type { CreatureCard } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toCreatureCardDTO } from "@/lib/cardDto";
import { applyExp, DIAMOND_TO_EXP, feedExpValue, MAX_LEVEL } from "@/lib/cardEngine";
import { bumpMissionProgress } from "@/lib/missionProgress";
import type { UpgradeResultDTO } from "@/lib/types";

/** Cap on cards sacrificed per request — keeps the transaction short and
 *  makes a mis-click far less costly. */
type UpgradeError = "NOT_FOUND" | "MAX_LEVEL" | "FEED_MISMATCH" | "INSUFFICIENT";

/** Explicit discriminated union — without the annotation TS collapses the
 *  transaction callback returns into one object with optional props, which
 *  loses the `error` literal type. */
type UpgradeOutcome =
  | { error: UpgradeError }
  | {
      error?: undefined;
      card: CreatureCard;
      loyaltyPoints: number;
      expGained: number;
      levelsGained: number;
    };

const MAX_FEED = 20;
const MAX_DIAMONDS = 5000;

/**
 * POST /api/cards/[id]/upgrade — Body: { diamonds?, feedCardIds? }
 *
 * Two EXP sources, one atomic transaction:
 *   • Diamonds converted at DIAMOND_TO_EXP, charged with the same guarded
 *     `updateMany (loyaltyPoints >= n)` claim every other spend uses.
 *   • Duplicate cards sacrificed for EXP — read, valued, then deleted with a
 *     userId-scoped deleteMany whose row count must match exactly, so a
 *     concurrent request can never get the same card counted twice.
 *
 * EXP always rolls up through as many levels as it covers (lib/cardEngine's
 * applyExp), hard-capped at MAX_LEVEL.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const { id } = await params;

  let body: { diamonds?: unknown; feedCardIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const diamonds =
    typeof body.diamonds === "number" && Number.isFinite(body.diamonds)
      ? Math.floor(body.diamonds)
      : 0;
  const feedCardIds = Array.isArray(body.feedCardIds)
    ? Array.from(new Set(body.feedCardIds.filter((v): v is string => typeof v === "string")))
    : [];

  if (diamonds < 0 || diamonds > MAX_DIAMONDS) {
    return NextResponse.json({ error: "ចំនួនពិន្ទុមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  if (feedCardIds.length > MAX_FEED) {
    return NextResponse.json(
      { error: `អាចប្រើកាតជាចំណីបានត្រឹម ${MAX_FEED} សន្លឹកប៉ុណ្ណោះ។` },
      { status: 400 }
    );
  }
  if (feedCardIds.includes(id)) {
    return NextResponse.json({ error: "មិនអាចប្រើកាតនេះជាចំណីខ្លួនឯងបានទេ។" }, { status: 400 });
  }
  if (diamonds === 0 && feedCardIds.length === 0) {
    return NextResponse.json({ error: "សូមជ្រើសរើសពិន្ទុ ឬកាតជាចំណី។" }, { status: 400 });
  }

  try {
    const outcome = await prisma.$transaction(async (tx): Promise<UpgradeOutcome> => {
      const target = await tx.creatureCard.findFirst({
        where: { id, userId: session.id },
      });
      if (!target) return { error: "NOT_FOUND" as const };
      if (target.level >= MAX_LEVEL) return { error: "MAX_LEVEL" as const };

      let expGained = 0;

      if (feedCardIds.length > 0) {
        const fodder = await tx.creatureCard.findMany({
          where: { id: { in: feedCardIds }, userId: session.id },
        });
        if (fodder.length !== feedCardIds.length) return { error: "FEED_MISMATCH" as const };

        const deleted = await tx.creatureCard.deleteMany({
          where: { id: { in: feedCardIds }, userId: session.id },
        });
        // Someone else consumed one mid-flight — abort rather than credit
        // EXP for a card that no longer existed.
        if (deleted.count !== feedCardIds.length) return { error: "FEED_MISMATCH" as const };

        expGained += fodder.reduce((sum, c) => sum + feedExpValue(c), 0);
      }

      if (diamonds > 0) {
        const charged = await tx.user.updateMany({
          where: { id: session.id, loyaltyPoints: { gte: diamonds } },
          data: { loyaltyPoints: { decrement: diamonds } },
        });
        if (charged.count === 0) return { error: "INSUFFICIENT" as const };
        expGained += diamonds * DIAMOND_TO_EXP;
      }

      const next = applyExp(target.level, target.exp, expGained);
      const updated = await tx.creatureCard.update({
        where: { id: target.id },
        data: { level: next.level, exp: next.exp },
      });

      const user = await tx.user.findUniqueOrThrow({
        where: { id: session.id },
        select: { loyaltyPoints: true },
      });

      await bumpMissionProgress(tx, session.id, "upgrade_creature_daily");
      await bumpMissionProgress(tx, session.id, "upgrade_creatures_weekly");

      return {
        card: updated,
        loyaltyPoints: user.loyaltyPoints,
        expGained,
        levelsGained: next.levelsGained,
      };
    });

    if (outcome.error) {
      const messages = {
        NOT_FOUND: { msg: "រកមិនឃើញកាតនេះទេ។", status: 404 },
        MAX_LEVEL: { msg: "កាតនេះឡើងដល់កម្រិតអតិបរមារួចហើយ។", status: 409 },
        FEED_MISMATCH: { msg: "កាតជាចំណីមួយចំនួនលែងមានទៀតហើយ។", status: 409 },
        INSUFFICIENT: { msg: "ពិន្ទុមិនគ្រប់គ្រាន់ទេ។", status: 409 },
      } as const satisfies Record<UpgradeError, { msg: string; status: number }>;
      const m = messages[outcome.error];
      return NextResponse.json({ error: m.msg }, { status: m.status });
    }

    const result: UpgradeResultDTO = {
      card: toCreatureCardDTO(outcome.card),
      loyaltyPoints: outcome.loyaltyPoints,
      expGained: outcome.expGained,
      levelsGained: outcome.levelsGained,
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "មិនអាចធ្វើកំណើនកម្រិតបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
