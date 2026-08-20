import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { battleMatchInclude, toBattleMatchDetailDTO } from "@/lib/battleDto";
import { grantBattleRewards } from "@/lib/battleRewards";
import {
  DECK_SIZE,
  nextAliveIndex,
  resolveAttack,
  type BattleRosterCard,
} from "@/lib/battleEngine";
import type { BattleActionDTO } from "@/lib/types";

type ActionOutcome =
  | { error: "NOT_FOUND" | "NOT_ACTIVE" | "NOT_YOUR_TURN" | "INVALID" | "TURN_RACE" }
  | { error?: undefined };

/**
 * POST /api/battle/[id]/action -- Body: { type: "ATTACK" } | { type:
 * "SWITCH", index }.
 *
 * The turn itself is claimed with a guarded `updateMany
 * (turnUserId: session.id)` -- the same atomic-claim idiom every other
 * write path in this app uses (accept/answer/start routes) -- BEFORE any
 * roster row is mutated, so a double-submitted click or a genuine race can
 * only ever apply one action per turn. Damage, the elemental multiplier,
 * and knock-out/auto-promote are all resolved server-side from
 * lib/battleEngine; a client only ever reports its chosen action type, not
 * an outcome.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  const { id } = await params;

  let body: { type?: unknown; index?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const actionType = body.type === "SWITCH" ? "SWITCH" : body.type === "ATTACK" ? "ATTACK" : null;
  if (!actionType) {
    return NextResponse.json({ error: "សកម្មភាពមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  try {
    const outcome = await prisma.$transaction(async (tx): Promise<ActionOutcome> => {
      const match = await tx.battleMatch.findUnique({ where: { id }, include: battleMatchInclude });
      if (!match) return { error: "NOT_FOUND" };
      if (match.status !== "ACTIVE") return { error: "NOT_ACTIVE" };

      const me = match.players.find((p) => p.userId === session.id);
      const opp = match.players.find((p) => p.userId !== session.id);
      if (!me || !opp) return { error: "NOT_FOUND" };
      if (match.turnUserId !== session.id) return { error: "NOT_YOUR_TURN" };

      const myRoster = me.roster as unknown as BattleRosterCard[];
      const oppRoster = opp.roster as unknown as BattleRosterCard[];

      if (actionType === "SWITCH") {
        const index = body.index;
        if (
          typeof index !== "number" ||
          !Number.isInteger(index) ||
          index < 0 ||
          index >= DECK_SIZE ||
          index === me.activeIndex ||
          myRoster[index]?.fainted
        ) {
          return { error: "INVALID" };
        }

        const action: BattleActionDTO = { type: "SWITCH", userId: session.id, activeIndex: index };
        const claim = await tx.battleMatch.updateMany({
          where: { id, status: "ACTIVE", turnUserId: session.id },
          data: {
            turnUserId: opp.userId,
            lastAction: action as unknown as Prisma.InputJsonValue,
          },
        });
        if (claim.count === 0) return { error: "TURN_RACE" };

        await tx.battlePlayer.update({ where: { id: me.id }, data: { activeIndex: index } });
        return {};
      }

      // ATTACK
      const myActive = myRoster[me.activeIndex];
      const oppActive = oppRoster[opp.activeIndex];
      if (!myActive || myActive.fainted || !oppActive) return { error: "INVALID" };

      const result = resolveAttack(myActive.power, myActive.element, oppActive);
      const newOppRoster = [...oppRoster];
      newOppRoster[opp.activeIndex] = {
        ...oppActive,
        hp: Math.max(0, oppActive.hp - result.damage),
        fainted: result.defenderFainted,
      };

      let newOppActiveIndex = opp.activeIndex;
      let iWon = false;
      if (result.defenderFainted) {
        const next = nextAliveIndex(newOppRoster, opp.activeIndex);
        if (next === -1) iWon = true;
        else newOppActiveIndex = next;
      }

      const action: BattleActionDTO = {
        type: "ATTACK",
        attackerUserId: session.id,
        damage: result.damage,
        multiplier: result.multiplier,
        label: result.label,
        defenderFainted: result.defenderFainted,
      };

      const claim = await tx.battleMatch.updateMany({
        where: { id, status: "ACTIVE", turnUserId: session.id },
        data: iWon
          ? {
              status: "COMPLETED",
              winnerUserId: session.id,
              turnUserId: null,
              lastAction: action as unknown as Prisma.InputJsonValue,
            }
          : {
              turnUserId: opp.userId,
              lastAction: action as unknown as Prisma.InputJsonValue,
            },
      });
      if (claim.count === 0) return { error: "TURN_RACE" };

      await tx.battlePlayer.update({
        where: { id: opp.id },
        data: {
          roster: newOppRoster as unknown as Prisma.InputJsonValue,
          activeIndex: newOppActiveIndex,
        },
      });

      if (iWon) {
        const fresh = await tx.battleMatch.findUniqueOrThrow({ where: { id } });
        if (!fresh.rewardsGranted) {
          await grantBattleRewards(
            tx,
            session.id,
            myRoster.map((c) => c.cardId),
            opp.userId,
            oppRoster.map((c) => c.cardId)
          );
          await tx.battleMatch.update({ where: { id }, data: { rewardsGranted: true } });
        }
      }

      return {};
    }, { timeout: 20000 });

    if (outcome.error) {
      const messages = {
        NOT_FOUND: { msg: "រកមិនឃើញការប្រកួតនេះទេ។", status: 404 },
        NOT_ACTIVE: { msg: "ការប្រកួតនេះមិនកំពុងសកម្មទេ។", status: 409 },
        NOT_YOUR_TURN: { msg: "មិនទាន់ដល់វេនរបស់អ្នកទេ។", status: 409 },
        INVALID: { msg: "សកម្មភាពមិនត្រឹមត្រូវទេ។", status: 400 },
        TURN_RACE: { msg: "វេននេះត្រូវបានប្រើរួចហើយ។", status: 409 },
      } as const satisfies Record<string, { msg: string; status: number }>;
      const m = messages[outcome.error];
      return NextResponse.json({ error: m.msg }, { status: m.status });
    }

    const fresh = await prisma.battleMatch.findUniqueOrThrow({
      where: { id },
      include: battleMatchInclude,
    });
    return NextResponse.json(toBattleMatchDetailDTO(fresh, session.id));
  } catch {
    return NextResponse.json(
      { error: "មិនអាចធ្វើសកម្មភាពបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
