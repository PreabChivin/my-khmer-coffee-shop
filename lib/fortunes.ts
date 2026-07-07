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
    km: "ថ្ងៃនេះទេវតានឹងប្រទានលាភជ័យ កាហ្វេមួយកែវនេះនឹងដាស់សតិឱ្យរៀនពូកែ រកស៊ីមានបាន!",
    en: "The gods smile on you today — this one cup will sharpen your mind and fatten your luck!",
    emoji: "🌟",
  },
  {
    km: "អ្នកនឹងជួបមនុស្សផ្អែមល្ហែមដូចស្ករត្នោត នៅពេលដែលអ្នកមិនរំពឹងទុក!",
    en: "You'll meet someone as sweet as palm sugar when you least expect it!",
    emoji: "🍮",
  },
  {
    km: "កែវនេះនាំសំណាង! ថ្ងៃនេះធ្វើអ្វីក៏រលូន ដូចកាហ្វេហៀរចេញពីម៉ាស៊ីន។",
    en: "Lucky cup! Everything flows smoothly today, like espresso from the machine.",
    emoji: "☕",
  },
  {
    km: "ចិត្តអ្នករឹងមាំដូចគ្រាប់កាហ្វេដុត — ឧបសគ្គណាក៏ចាញ់អ្នកដែរ!",
    en: "Your spirit is as strong as a roasted bean — no obstacle stands a chance!",
    emoji: "💪",
  },
  {
    km: "ថ្ងៃនេះញញឹមឱ្យបានច្រើន បេះដូងនរណាម្នាក់នឹងលោតញាប់ព្រោះអ្នក!",
    en: "Smile a lot today — someone's heart will race just because of you!",
    emoji: "💗",
  },
  {
    km: "លុយនឹងចូលដូចទឹកភ្លៀងខែវស្សា ត្រូវសន្សំទុកខ្លះណា៎!",
    en: "Money will pour in like monsoon rain — just remember to save some!",
    emoji: "💰",
  },
  {
    km: "ថ្ងៃនេះជាថ្ងៃរបស់អ្នក! ក្លាហានឡើង ក្តីសុបិនកំពុងរង់ចាំ។",
    en: "Today is your day! Be brave — your dreams are waiting.",
    emoji: "✨",
  },
  {
    km: "កុំភ្លេចខ្លួនឯងណា៎ — សម្រាកបន្តិច ផឹកកាហ្វេ ហើយបន្តទៅមុខ!",
    en: "Don't forget yourself — rest a little, sip your coffee, and keep going!",
    emoji: "🌸",
  },
  {
    km: "ថាមពលថ្ងៃនេះពេញ ១០០%! ត្រជាក់ស្រួល ស្រស់ស្រាយ ដូចទឹកកកបន្ថែមក្នុងកែវ។",
    en: "Your energy is at 100% today — cool and refreshing like extra ice in the cup!",
    emoji: "🧊",
  },
  {
    km: "នរណាម្នាក់កំពុងគិតដល់អ្នកឥឡូវនេះ… ប្រហែលជាអ្នកលក់កាហ្វេ 😹",
    en: "Someone is thinking of you right now… probably the barista 😹",
    emoji: "😹",
  },
  {
    km: "ជោគជតារាសីល្អ! ថ្ងៃនេះសួរអ្វីក៏បានចម្លើយ 'បាទ/ចាស'។",
    en: "The stars align! Today, whatever you ask, the answer is 'yes'.",
    emoji: "🔮",
  },
  {
    km: "ដូនតាប្រទានពរ៖ ចេះស៊ូ ចេះញញឹម នោះជោគជ័យនឹងតាមអ្នកមិនឈប់!",
    en: "Ancestral blessing: endure and smile, and success will chase you endlessly!",
    emoji: "🙏",
  },
];

/**
 * Picks a random fortune. Call inside an effect / event handler (not during
 * render) to avoid an SSR/client hydration mismatch.
 */
export function randomFortune(): Fortune {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
}
