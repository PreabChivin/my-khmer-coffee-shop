import { prisma } from "@/lib/prisma";
import type { TelegramSubscriberStatsDTO } from "@/lib/types";

/**
 * 🔔 Builds the admin Telegram-subscribers view. There is deliberately no
 * `User.telegramChatId`/`isTelegramConnected` column to query directly —
 * linking is tracked per-device (TelegramSession, anonymous, keyed by a
 * localStorage token — not tied to any userId) and per-order
 * (Order.customerTelegramChatId, see lib/telegram.ts's
 * resolveUserTelegramChatId, which this mirrors). A registered customer's
 * connection status is therefore DERIVED here: their most-recently-linked
 * order's chat id, if any. Scoped to role=CUSTOMER, matching
 * RegisteredCustomersPanel's convention.
 */
export async function getTelegramSubscriberStats(): Promise<TelegramSubscriberStatsDTO> {
  const [users, linkedOrders, sessions] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { userId: { not: null }, customerTelegramChatId: { not: null } },
      select: {
        userId: true,
        customerTelegramChatId: true,
        customerTelegramUsername: true,
        telegramLinkedAt: true,
        createdAt: true,
      },
    }),
    prisma.telegramSession.findMany({ select: { chatId: true } }),
  ]);

  const latestByUser = new Map<
    string,
    { chatId: string; username: string | null; linkedAt: Date }
  >();
  for (const o of linkedOrders) {
    if (!o.userId || !o.customerTelegramChatId) continue;
    const linkedAt = o.telegramLinkedAt ?? o.createdAt;
    const existing = latestByUser.get(o.userId);
    if (!existing || linkedAt > existing.linkedAt) {
      latestByUser.set(o.userId, {
        chatId: o.customerTelegramChatId,
        username: o.customerTelegramUsername,
        linkedAt,
      });
    }
  }

  const subscribers = users.map((u) => {
    const link = latestByUser.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      telegramChatId: link?.chatId ?? null,
      telegramUsername: link?.username ?? null,
      isTelegramConnected: Boolean(link),
      telegramConnectedAt: link ? link.linkedAt.toISOString() : null,
    };
  });

  const discovered = new Set<string>();
  for (const s of sessions) discovered.add(s.chatId);
  for (const o of linkedOrders) {
    if (o.customerTelegramChatId) discovered.add(o.customerTelegramChatId);
  }

  return {
    totalUsers: users.length,
    connectedCount: latestByUser.size,
    discoveredChatIdCount: discovered.size,
    subscribers,
  };
}
