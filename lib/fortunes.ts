/**
 * 🔮 The Destiny Cup (ប្រព័ន្ធទាយជោគជតាតាមកែវកាហ្វេ) — a pool of playful,
 * encouraging "coffee fortunes" blending modern Gen-Z humor with ancestral
 * blessings. These are intentionally light-hearted and wholesome (NOT sacred
 * proverbs), authored for fun.
 */
export interface Fortune {
  km: string;
  en: string;
  emoji: string;
}

export const FORTUNES: Fortune[] = [
  {
    km: "ថ្ងៃនេះប្រូ/ស៊ីស នឹងត្រូវប៉ាន់លុយហូរចូលដូចទឹកឆុងកាហ្វេ! ☕️✨",
    en: "Today, bestie, money's gonna flow in like a fresh coffee pour! ☕✨",
    emoji: "💸",
  },
  {
    km: "ញ៉ាំកែវនេះហើយ នឹងមានអ្នក Crush មកសារភាពស្នេហ៍ភ្លាម លង់ស្តូក! 💖",
    en: "Sip this cup and your crush will slide into your DMs fr fr! 💖",
    emoji: "💖",
  },
  {
    km: "ហុងស៊ុយល្អណាស់ថ្ងៃនេះ ធ្វើអ្វីក៏សមប្រកប មុខឡើង Bright ហ្មងហា៎! 🌟",
    en: "Feng shui is immaculate today — everything goes your way and your face is glowing! 🌟",
    emoji: "🌟",
  },
  {
    km: "Vibe ថ្ងៃនេះ = ពេញ ១០០! ធ្វើអ្វីក៏ម៉ៅដាច់ អ្នកគឺ main character ស្តូក! 🌟",
    en: "Today's vibe = 100! You're literally the main character, bestie. 🌟",
    emoji: "🌟",
  },
  {
    km: "កែវនេះនាំសំណាង! សំណាងកំពុងតាមប្រូ/ស៊ីស ដូច notification មិនឈប់! 🍀",
    en: "Lucky cup unlocked! Good luck is blowing up your phone rn. 🍀",
    emoji: "🍀",
  },
  {
    km: "ថ្ងៃនេះ glow-up ខ្លាំង! អ្នកណាឃើញក៏ថា 'ស្អាតម៉ៅដាច់'! ✨",
    en: "Major glow-up energy today — everyone's gonna be like 'slayyy'! ✨",
    emoji: "💅",
  },
  {
    km: "ចិត្តរឹងមាំ no cap! ឧបសគ្គណាក៏ចាញ់ប្រូ/ស៊ីសដែរ 💪",
    en: "Your mindset is built different, no cap. Obstacles? Never heard of her. 💪",
    emoji: "💪",
  },
  {
    km: "សុំ manifest ៖ ថ្ងៃនេះសុំអ្វីក៏បាន សូម្បីតែ boba ឥតគិតថ្លៃ! 🧋",
    en: "Manifesting mode ON — today the universe says yes, even to free boba! 🧋",
    emoji: "🧋",
  },
  {
    km: "នរណាម្នាក់កំពុងគិតដល់ប្រូ/ស៊ីសឥឡូវនេះ… ពេញចិត្តស្តូក! 💭",
    en: "Someone's thinking about you rn… you're totally somebody's vibe. 💭",
    emoji: "💭",
  },
  {
    km: "ថ្ងៃនេះ energy ត្រជាក់ស្រួល ដូចទឹកកកបន្ថែម — chill ស្តូក! 🧊",
    en: "Cool, calm, iced-latte energy today — stay chill, bestie. 🧊",
    emoji: "🧊",
  },
  {
    km: "គ្រាន់តែញញឹម ក៏ធ្វើឱ្យថ្ងៃនរណាម្នាក់ភ្លឺ! អ្នកគឺ sunshine ស្តូក ☀️",
    en: "Your smile is somebody's whole day — you're pure sunshine, bestie. ☀️",
    emoji: "☀️",
  },
  {
    km: "Plot twist៖ ថ្ងៃនេះនឹងមានដំណឹងល្អ surprise មកដល់ភ្លាម! 🎉",
    en: "Plot twist: some good news is about to surprise-drop today! 🎉",
    emoji: "🎉",
  },
  {
    km: "ដូនតា bless ✋៖ ចេះស៊ូ ចេះញញឹម នោះ success តាមប្រូ/ស៊ីសមិនឈប់! 🧸",
    en: "Ancestor-approved blessing: stay strong, stay smiling — success is coming for you. 🧸",
    emoji: "🧸",
  },
];

/**
 * Picks a random fortune. Call inside an effect / event handler (not during
 * render) to avoid an SSR/client hydration mismatch.
 */
export function randomFortune(): Fortune {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
}
