/**
 * 🧠 Trivia Quiz Show — static question bank, same convention as
 * lib/missions.ts's MISSIONS list (real authored content in code, no DB
 * table, no admin CRUD). Every question is real, fact-checked trivia, not
 * placeholder text — `correctIndex` is the actually-correct choice, never
 * sent to the client until it's safe to reveal (see lib/quizDto.ts).
 */
export interface QuizQuestion {
  id: string;
  category: string;
  textKm: string;
  choicesKm: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "hottest-planet",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើភពណាមួយក្ដៅជាងគេក្នុងប្រព័ន្ធព្រះអាទិត្យ? 🌡️",
    choicesKm: ["ភពពុធ (Mercury)", "ភពសុក្រ (Venus)", "ភពអង្គារ (Mars)", "ភពព្រហស្បតិ៍ (Jupiter)"],
    correctIndex: 1,
  },
  {
    id: "smallest-planet",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើភពណាតូចជាងគេក្នុងប្រព័ន្ធព្រះអាទិត្យ? 🔭",
    choicesKm: ["ភពពុធ (Mercury)", "ភពអង្គារ (Mars)", "ភពសុក្រ (Venus)", "ភពដី (Earth)"],
    correctIndex: 0,
  },
  {
    id: "coffee-foam",
    category: "វប្បធម៌កាហ្វេ",
    textKm: "តើកាហ្វេប្រភេទណាមានពពុះទឹកដោះគោក្រាស់ជាងគេ? ☕",
    choicesKm: ["ឡាតេ (Latte)", "កាពូជីណូ (Cappuccino)", "អាមេរីកាណូ (Americano)", "អេស្ព្រេសសូ (Espresso)"],
    correctIndex: 1,
  },
  {
    id: "coffee-origin",
    category: "វប្បធម៌កាហ្វេ",
    textKm: "តើកាហ្វេមានដើមកំណើតមកពីប្រទេសណា? 🌍",
    choicesKm: ["ប្រេស៊ីល (Brazil)", "កូឡុំប៊ី (Colombia)", "អេត្យូពី (Ethiopia)", "វៀតណាម (Vietnam)"],
    correctIndex: 2,
  },
  {
    id: "americano-made-of",
    category: "វប្បធម៌កាហ្វេ",
    textKm: "តើអាមេរីកាណូ (Americano) ធ្វើពីអ្វី? ☕✨",
    choicesKm: [
      "អេស្ព្រេសសូ + ទឹកក្ដៅ",
      "អេស្ព្រេសសូ + ទឹកដោះគោ",
      "ទឹកដោះគោ + សូកូឡា",
      "តែ + ទឹកកក",
    ],
    correctIndex: 0,
  },
  {
    id: "phnom-penh-capital",
    category: "កម្ពុជា 🇰🇭",
    textKm: "តើរាជធានីនៃប្រទេសកម្ពុជាមានឈ្មោះអ្វី?",
    choicesKm: ["សៀមរាប", "ភ្នំពេញ", "បាត់ដំបង", "ព្រះសីហនុ"],
    correctIndex: 1,
  },
  {
    id: "angkor-wat-location",
    category: "កម្ពុជា 🇰🇭",
    textKm: "តើប្រាសាទអង្គរវត្តស្ថិតនៅខេត្តណា? 🛕",
    choicesKm: ["ក្រចេះ", "សៀមរាប", "កំពង់ចាម", "តាកែវ"],
    correctIndex: 1,
  },
  {
    id: "cambodia-currency",
    category: "កម្ពុជា 🇰🇭",
    textKm: "តើរូបិយប័ណ្ណជាតិរបស់កម្ពុជាមានឈ្មោះអ្វី? 💵",
    choicesKm: ["បាត (Baht)", "រៀល (Riel)", "ដុង (Dong)", "គីប (Kip)"],
    correctIndex: 1,
  },
  {
    id: "cambodia-national-flower",
    category: "កម្ពុជា 🇰🇭",
    textKm: "តើផ្កាអ្វីជាផ្កាជាតិរបស់កម្ពុជា? 🌸",
    choicesKm: ["ផ្កាឈូក", "ផ្កាកុលាប", "ផ្កាស្រលាញ់ (រំដួល)", "ផ្កាចំប៉ា"],
    correctIndex: 2,
  },
  {
    id: "durian-king-of-fruits",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើផ្លែឈើអ្វីត្រូវបានគេហៅថា \"ស្តេចផ្លែឈើ\" នៅអាស៊ីអាគ្នេយ៍? 👑",
    choicesKm: ["ធុរេន (Durian)", "ម្នាស់ (Pineapple)", "ស្វាយ (Mango)", "រំបុត្តន៍ (Rambutan)"],
    correctIndex: 0,
  },
  {
    id: "boba-origin",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើតែពពុះ (Boba/Bubble Tea) មានដើមកំណើតមកពីទីណា? 🧋",
    choicesKm: ["ជប៉ុន", "ថៃវ៉ាន់", "ថៃ", "កូរ៉េខាងត្បូង"],
    correctIndex: 1,
  },
  {
    id: "spider-legs",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើពីងពាងមានប៉ុន្មានជើង? 🕷️",
    choicesKm: ["៦", "៨", "១០", "១២"],
    correctIndex: 1,
  },
  {
    id: "fastest-land-animal",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើសត្វអ្វីរត់លឿនជាងគេនៅលើគោក? 🐆",
    choicesKm: ["សិង្ហ", "សេះ", "ខ្លាដំបងឆ្មារ (Cheetah)", "ខ្លា"],
    correctIndex: 2,
  },
  {
    id: "largest-ocean",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើមហាសមុទ្រណាធំជាងគេលើពិភពលោក? 🌊",
    choicesKm: ["មហាសមុទ្រឥណ្ឌា", "មហាសមុទ្រអាត្លង់ទិក", "មហាសមុទ្រប៉ាស៊ីហ្វិក", "មហាសមុទ្រអាកទិក"],
    correctIndex: 2,
  },
  {
    id: "continents-count",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើពិភពលោកមានទ្វីបប៉ុន្មាន? 🗺️",
    choicesKm: ["៥", "៦", "៧", "៨"],
    correctIndex: 2,
  },
  {
    id: "lion-king-of-jungle",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើសត្វអ្វីត្រូវបានគេហៅថា \"ស្តេចនៃព្រៃ\"? 🦁",
    choicesKm: ["ខ្លា", "សិង្ហ", "ដំរី", "ខ្លាឃ្មុំ"],
    correctIndex: 1,
  },
  {
    id: "leap-year-days",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើឆ្នាំកកកយភ្លោះ (Leap Year) មានប៉ុន្មានថ្ងៃ? 📅",
    choicesKm: ["៣៦៤", "៣៦៥", "៣៦៦", "៣៦៧"],
    correctIndex: 2,
  },
  {
    id: "water-chemical-symbol",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តើនិមិត្តសញ្ញាគីមីរបស់ទឹកគឺជាអ្វី? 🧪",
    choicesKm: ["CO2", "H2O", "O2", "NaCl"],
    correctIndex: 1,
  },
  {
    id: "ironman-actor",
    category: "ភាពយន្ត & វប្បធម៌ពេញនិយម",
    textKm: "តើតារាសម្តែងណាដើរតួជា Iron Man ក្នុងខ្សែភាពយន្ត Marvel? 🎬",
    choicesKm: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"],
    correctIndex: 1,
  },
  {
    id: "bts-members-count",
    category: "ភាពយន្ត & វប្បធម៌ពេញនិយម",
    textKm: "តើក្រុមតន្ត្រី K-pop \"BTS\" មានសមាជិកប៉ុន្មាននាក់? 🎤",
    choicesKm: ["៥", "៦", "៧", "៨"],
    correctIndex: 2,
  },
  {
    id: "riddle-time",
    category: "ល្បិចប្រស្នា",
    textKm: "អ្វីដែលដើរជានិច្ច ប៉ុន្តែគ្មានជើងសោះ? 🤔",
    choicesKm: ["ខ្យល់", "ពេលវេលា", "ទឹក", "ភ្លើង"],
    correctIndex: 1,
  },
  {
    id: "riddle-towel",
    category: "ល្បិចប្រស្នា",
    textKm: "អ្វីដែលកាន់តែជូតកាន់តែសើម? 🤨",
    choicesKm: ["ក្រដាស", "កន្សែង", "ថ្ម", "ដី"],
    correctIndex: 1,
  },
  {
    id: "riddle-needle",
    category: "ល្បិចប្រស្នា",
    textKm: "អ្វីដែលមានភ្នែក ប៉ុន្តែមើលមិនឃើញ? 👀",
    choicesKm: ["ព្យុះ", "ម្ជុល", "ដំឡូង", "កញ្ចក់"],
    correctIndex: 1,
  },
  {
    id: "riddle-map",
    category: "ល្បិចប្រស្នា",
    textKm: "អ្វីដែលមានទីក្រុង ភ្នំ និងទន្លេ ប៉ុន្តែគ្មានផ្ទះ គ្មានដើមឈើ គ្មានទឹកសោះ? 🗺️",
    choicesKm: ["សៀវភៅ", "ផែនទី", "រូបភាព", "ទូរស័ព្ទ"],
    correctIndex: 1,
  },
  {
    id: "dolphin-smart-animal",
    category: "ចំណេះដឹងទូទៅ",
    textKm: "តាមរឿងនិយាយទូទៅ តើសត្វអ្វីត្រូវបានចាត់ទុកថាឆ្លាតបំផុតទី២ក្រោយមនុស្ស? 🐬",
    choicesKm: ["ដេលហ្វាំង", "ចាហួយ", "ស្វា", "ដំរី"],
    correctIndex: 0,
  },
];

const QUESTION_BY_ID = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]));

export function getQuizQuestion(id: string): QuizQuestion | undefined {
  return QUESTION_BY_ID.get(id);
}

/** Picks `count` distinct random question ids for a fresh match. */
export function pickRandomQuestionIds(count: number): string[] {
  const pool = [...QUIZ_QUESTIONS];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0].id);
  }
  return picked;
}
