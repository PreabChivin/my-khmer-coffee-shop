import { dayKey } from "@/lib/chatDateGroups";

/** 🎯 Daily Missions — static definitions (all DAILY cadence for now; no
 *  admin CRUD, unlike Reward). Rewards credit the SAME `User.loyaltyPoints`
 *  balance the Reward store spends — "Cafe Points" is a display label for
 *  that one balance, not a second currency. Values are scaled ~10x down
 *  from the original brief (which assumed $1 = 100 pts) to stay
 *  proportionate to the real $1 = 10 pts rate (lib/loyaltyPoints.ts) and
 *  the existing 500/1500/3000 tier thresholds. */
export interface Mission {
  key: string;
  title: string;
  titleKh: string;
  emoji: string;
  rewardPoints: number;
}

export const MISSIONS: Mission[] = [
  {
    key: "buy_coffee_daily",
    title: "Buy a coffee or pastry today",
    titleKh: "ទិញកាហ្វេ/បង្អែម ១ ដងថ្ងៃនេះ",
    emoji: "☕",
    rewardPoints: 20,
  },
  {
    key: "play_game_daily",
    title: "Play a match in Café Lounge",
    titleKh: "ចូលលេងហ្គេមក្នុង Café Lounge ១ ដង",
    emoji: "🎮",
    rewardPoints: 10,
  },
  {
    key: "equip_avatar_item_daily",
    title: "Equip a new avatar item",
    titleKh: "ស្លៀកពាក់វត្ថុតុបតែងតួអង្គថ្មី",
    emoji: "🧢",
    rewardPoints: 15,
  },
  {
    key: "send_message_daily",
    title: "Send a message in Café Lounge",
    titleKh: "ផ្ញើសារ ១ ក្នុង Café Lounge ថ្ងៃនេះ",
    emoji: "💬",
    rewardPoints: 30,
  },
];

const MISSION_BY_KEY = new Map(MISSIONS.map((m) => [m.key, m]));

export function getMission(key: string): Mission | undefined {
  return MISSION_BY_KEY.get(key);
}

/** Today's reset boundary — a fresh key each calendar day (server-local
 *  timezone), reusing the same `dayKey` convention chat date-separators use
 *  rather than inventing a second date format. A new key IS the daily
 *  reset: no cron job needed, yesterday's progress row just isn't today's. */
export function todayPeriodKey(): string {
  return dayKey(new Date().toISOString());
}
