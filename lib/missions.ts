import { dayKey } from "@/lib/chatDateGroups";

/** 🎯 Quests — static definitions (no admin CRUD, unlike Reward). Rewards
 *  credit `User.loyaltyPoints`; "Diamonds" is a display label for that one
 *  balance, not a second currency. */
export type MissionCadence = "DAILY" | "WEEKLY";

export interface Mission {
  key: string;
  title: string;
  titleKh: string;
  emoji: string;
  rewardPoints: number;
  /** Defaults to DAILY when omitted — keeps every pre-existing quest, and
   *  its already-stored progress rows, behaving exactly as before. */
  cadence?: MissionCadence;
  /** Occurrences needed to complete. Defaults to 1 (a plain
   *  "did it happen this period?" check, the original behaviour). */
  target?: number;
}

export const MISSIONS: Mission[] = [
  {
    key: "win_game_daily",
    title: "Win a match in the Arena",
    titleKh: "ឈ្នះការប្រកួត ១ ដងថ្ងៃនេះ",
    emoji: "🏆",
    rewardPoints: 20,
  },
  {
    key: "play_game_daily",
    title: "Play a match in Social Lounge",
    titleKh: "ចូលលេងហ្គេមក្នុង Social Lounge ១ ដង",
    emoji: "🎮",
    rewardPoints: 10,
  },
  {
    key: "open_pack_daily",
    title: "Open a booster pack",
    titleKh: "បើកកញ្ចប់កាត ១ ដងថ្ងៃនេះ",
    emoji: "🃏",
    rewardPoints: 15,
  },
  {
    key: "upgrade_creature_daily",
    title: "Power up a creature",
    titleKh: "ដំឡើងកម្រិតសត្វ ១ ក្បាល",
    emoji: "⬆️",
    rewardPoints: 15,
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
    title: "Send a message in Social Lounge",
    titleKh: "ផ្ញើសារ ១ ក្នុង Social Lounge ថ្ងៃនេះ",
    emoji: "💬",
    rewardPoints: 30,
  },
  {
    key: "open_packs_weekly",
    title: "Open 5 booster packs this week",
    titleKh: "បើកកញ្ចប់កាត ៥ ដងក្នុងសប្តាហ៍នេះ",
    emoji: "📦",
    rewardPoints: 80,
    cadence: "WEEKLY",
    target: 5,
  },
  {
    key: "upgrade_creatures_weekly",
    title: "Power up 3 creatures this week",
    titleKh: "ដំឡើងកម្រិតសត្វ ៣ ក្បាលក្នុងសប្តាហ៍នេះ",
    emoji: "🌟",
    rewardPoints: 60,
    cadence: "WEEKLY",
    target: 3,
  },
];

const MISSION_BY_KEY = new Map(MISSIONS.map((m) => [m.key, m]));

export function getMission(key: string): Mission | undefined {
  return MISSION_BY_KEY.get(key);
}

export function missionTarget(mission: Mission): number {
  return Math.max(1, mission.target ?? 1);
}

/** Today's reset boundary — a fresh key each calendar day (server-local
 *  timezone), reusing the same `dayKey` convention chat date-separators use
 *  rather than inventing a second date format. A new key IS the daily
 *  reset: no cron job needed, yesterday's progress row just isn't today's. */
export function todayPeriodKey(): string {
  return dayKey(new Date().toISOString());
}

/** ISO-8601 week key (e.g. "2026-W34"), the weekly equivalent of the above:
 *  a new week simply produces a new key, so weekly quests reset with no
 *  scheduled job either. Weeks start Monday, matching ISO. */
export function currentWeekPeriodKey(date = new Date()): string {
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Shift to the Thursday of this ISO week, which always sits in the
  // week-numbering year.
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function periodKeyForCadence(cadence: MissionCadence | undefined): string {
  return cadence === "WEEKLY" ? currentWeekPeriodKey() : todayPeriodKey();
}

/** The period key a given mission's progress rows are stored under. */
export function periodKeyForMission(missionKey: string): string {
  return periodKeyForCadence(getMission(missionKey)?.cadence);
}
