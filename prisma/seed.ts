import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 🍩 Category Menu — name is kept stable as the upsert key (same pattern as
// Product.nameEn) so re-seeding updates existing rows instead of duplicating.
const CATEGORIES = [
  { name: "Coffee", iconKey: "coffee" },
  { name: "Tea", iconKey: "tea" },
  { name: "Bakery", iconKey: "cake" },
  { name: "Frappe", iconKey: "smoothie" },
  { name: "Combo", iconKey: "combo" },
];

// Ultra-cute, playful naming (Gen-Z Khmer pop). nameEn is kept stable as the
// upsert key so re-seeding updates existing rows in place instead of creating
// duplicates; the cuteness lives in the Khmer names + bilingual descriptions.
type SeedProduct = {
  nameEn: string;
  nameKh: string;
  descriptionEn: string;
  descriptionKh: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  discountPercent?: number;
  flatDiscount?: number;
  promoTag?: string;
};

const PRODUCTS: SeedProduct[] = [
  {
    nameEn: "Espresso",
    nameKh: "អេស្ព្រេសសូ ដាស់ខួរ ⚡",
    descriptionEn: "One tiny but mighty shot to wake up your inner genius! ⚡",
    descriptionKh: "កាហ្វេមួយ Shot តូចតែខ្លាំង ដាស់ខួរក្បាលឱ្យភ្ញាក់ភ្លាម! ⚡",
    price: 2.5,
    category: "Coffee",
    image: "/images/espresso.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Americano",
    nameKh: "អាមេរិកាណូ ស្រាលចិត្ត 😎",
    descriptionEn: "Smooth, bold, and easy-going — your chill daily buddy. 😎",
    descriptionKh: "ស្រាល ស្រួលផឹក ជាមិត្តភក្តិរាល់ថ្ងៃរបស់អ្នក 😎",
    price: 2.75,
    category: "Coffee",
    image: "/images/americano.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Cappuccino",
    nameKh: "កាពូឈីណូ ពពុះ ☁️",
    descriptionEn: "A fluffy cloud of milk foam hugging your espresso. ☁️💗",
    descriptionKh: "ពពុះទឹកដោះគោទន់ ដូចពពកកំពុងឱបកាហ្វេ ☁️💗",
    price: 3.5,
    category: "Coffee",
    image: "/images/cappuccino.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Iced Latte",
    nameKh: "ឡាតេ ត្រជាក់ចិត្ត 🧊",
    descriptionEn: "Cool, creamy, and oh-so-refreshing over ice. 🧊🥛",
    descriptionKh: "ត្រជាក់ ក្រែម ស្រស់ស្រាយបំផុតលើទឹកកក 🧊🥛",
    price: 3.75,
    category: "Coffee",
    image: "/images/iced-latte.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Angkor Palm Sugar Latte",
    nameKh: "ឡាតេស្ករត្នោតអង្គរ 🌴💛",
    descriptionEn:
      "Our superstar! Smoky-sweet palm sugar straight from the sugar palms of Angkor. 🌴✨",
    descriptionKh:
      "តារាហាងរបស់យើង! ផ្អែមស្ករត្នោតដុតក្រអូប ពីដើមត្នោតជុំវិញអង្គរ 🌴✨",
    price: 3.95,
    category: "Coffee",
    image: "/images/palm-sugar-latte.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Mocha",
    nameKh: "ម៉ូកា សូកូឡា 🍫",
    descriptionEn:
      "Chocolate + espresso = the cutest power couple. 🍫💕 (Restocking soon!)",
    descriptionKh:
      "សូកូឡា + កាហ្វេ = គូស្នេហ៍ដ៏ស្រស់ស្អាត 🍫💕 (ជិតមកវិញហើយ!)",
    price: 4.0,
    category: "Coffee",
    image: "/images/mocha.jpg",
    isAvailable: false,
  },
  {
    nameEn: "Khmer Forest Green Tea",
    nameKh: "តែបៃតងព្រៃនគរ 🍵🌿",
    descriptionEn: "Fresh, leafy, and calming — a little green hug in a cup. 🍵🌿",
    descriptionKh: "ស្រស់ ក្រអូបស្លឹកតែ ស្ងប់ចិត្ត ដូចការឱបពីធម្មជាតិ 🍵🌿",
    price: 2.25,
    category: "Tea",
    image: "/images/green-tea.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Milk Tea",
    nameKh: "តែទឹកដោះគោ បុកបា 🧋",
    descriptionEn: "Classic milk tea with bouncy boba pearls — chew chew! 🧋💗",
    descriptionKh: "តែទឹកដោះគោ ជាមួយពែងបុកបាទន់ៗ ទំពាសប្បាយចិត្ត! 🧋💗",
    price: 3.25,
    category: "Tea",
    image: "/images/milk-tea.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Butter Croissant",
    nameKh: "នំគ្រ័រសាំង ប៊ឺ 🥐",
    descriptionEn: "Flaky, buttery, fresh from the oven every morning. 🥐☀️",
    descriptionKh: "ស្រួយ ក្រអូបប៊ឺ ដុតស្រស់ថ្មីរាល់ព្រឹក 🥐☀️",
    price: 2.0,
    category: "Bakery",
    image: "/images/croissant.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Blueberry Muffin",
    nameKh: "នំម៉ាហ្វិន ប៊្លូបឺរី 🫐",
    descriptionEn: "Soft, fluffy muffin bursting with real blueberries. 🫐🧁",
    descriptionKh: "នំទន់ ពោរពេញដោយផ្លែប៊្លូបឺរីពិតៗ 🫐🧁",
    price: 2.5,
    category: "Bakery",
    image: "/images/muffin.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Classic Cheesecake",
    nameKh: "នំឈីសខេក ក្រែម 🍰",
    descriptionEn: "Rich, creamy, dreamy cheesecake on a buttery crust. 🍰💛",
    descriptionKh: "ក្រែមឈីសទន់ស្រទន់ ដ៏ឆ្ងាញ់ លើសំបកនំប៊ឺ 🍰💛",
    price: 3.95,
    category: "Bakery",
    image: "/images/cheesecake.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Traditional Khmer Layer Cake",
    nameKh: "នំស្លឹកចាក បុរាណ 💚",
    descriptionEn:
      "Pandan-coconut steamed layers — chewy, dreamy, a Khmer heirloom treat. 💚🥥",
    descriptionKh:
      "នំចំណិតបៃតង-ស ធ្វើពីទឹកដូង និងស្លឹកតើយ ទន់ស្អិត តាមរូបមន្តបុរាណខ្មែរ 💚🥥",
    price: 2.75,
    category: "Bakery",
    image: "/images/khmer-layer-cake.svg",
    isAvailable: true,
  },

  // 🍧 Frappes
  {
    nameEn: "Caramel Frappe",
    nameKh: "ខារ៉ាមែល ហ្វ្រាបេ 🍮",
    descriptionEn: "Blended icy caramel dream topped with fluffy cream. 🍮❄️",
    descriptionKh: "ខារ៉ាមែលកិនទឹកកក ត្រជាក់ឆ្ងាញ់ ដាក់ក្រែមទន់ៗ 🍮❄️",
    price: 4.25,
    category: "Frappe",
    image: "/images/iced-latte.jpg",
    isAvailable: true,
    discountPercent: 20,
  },
  {
    nameEn: "Cookies & Cream Frappe",
    nameKh: "ខូឃី ក្រែម ហ្វ្រាបេ 🍪",
    descriptionEn: "Crushed cookies blended into creamy iced heaven. 🍪🤍",
    descriptionKh: "ខូឃីកិនល្អិត លាយក្រែមទឹកកក ឆ្ងាញ់ខ្លាំង 🍪🤍",
    price: 4.5,
    category: "Frappe",
    image: "/images/mocha.jpg",
    isAvailable: true,
    flatDiscount: 0.5,
  },

  // 🧋 Boba & Matcha
  {
    nameEn: "Brown Sugar Boba",
    nameKh: "តែទឹកដោះគោ ស្ករ្រ 🧋",
    descriptionEn: "Chewy brown-sugar pearls in creamy milk tea. 🧋🤎",
    descriptionKh: "គុជស្ករត្នោត ទំពាស្អិត ក្នុងតែទឹកដោះគោ 🧋🤎",
    price: 3.75,
    category: "Tea",
    image: "/images/milk-tea.jpg",
    isAvailable: true,
    promoTag: "ទិញ 1 ថែម 1",
  },
  {
    nameEn: "Iced Matcha Latte",
    nameKh: "ម៉ាចា ឡាតេ ត្រជាក់ 🍵",
    descriptionEn: "Stone-ground matcha over creamy iced milk. 🍵💚",
    descriptionKh: "ម៉ាចាកិនល្អិត លើទឹកដោះគោត្រជាក់ ស្រួយឆ្ងាញ់ 🍵💚",
    price: 3.95,
    category: "Tea",
    image: "/images/green-tea.jpg",
    isAvailable: true,
    discountPercent: 10,
  },
  {
    nameEn: "Taro Boba",
    nameKh: "តៃរ៉ូ គុជ 💜",
    descriptionEn: "Dreamy purple taro milk tea with bouncy boba. 💜🧋",
    descriptionKh: "តៃរ៉ូពណ៌ស្វាយ ផ្អែមល្មម ជាមួយគុជទន់ៗ 💜🧋",
    price: 3.75,
    category: "Tea",
    image: "/images/milk-tea.jpg",
    isAvailable: true,
    promoTag: "E-Power Deal",
  },

  // 🥐 More Pastries
  {
    nameEn: "Chocolate Donut",
    nameKh: "នំដូណាត់ សូកូឡា 🍩",
    descriptionEn: "Soft glazed donut drizzled with rich chocolate. 🍩🍫",
    descriptionKh: "នំដូណាត់ទន់ ដាក់សូកូឡាឆ្ងាញ់ 🍩🍫",
    price: 2.25,
    category: "Bakery",
    image: "/images/muffin.jpg",
    isAvailable: true,
    flatDiscount: 0.5,
  },
  {
    nameEn: "Cinnamon Roll",
    nameKh: "នំម្នាស់ ស៊ីណាមិន 🌀",
    descriptionEn: "Warm swirled roll with sweet cinnamon glaze. 🌀🍯",
    descriptionKh: "នំរមួល ក្រអូបស៊ីណាមិន ផ្អែមល្មម 🌀🍯",
    price: 2.75,
    category: "Bakery",
    image: "/images/croissant.jpg",
    isAvailable: true,
    discountPercent: 10,
  },

  // 🎁 Special Combos
  {
    nameEn: "Coffee + Croissant Combo",
    nameKh: "កាហ្វេ + នំគ្រ័រសាំង ឈុត 🎁",
    descriptionEn: "Your morning fix: hot coffee paired with a buttery croissant. ☕🥐",
    descriptionKh: "ឈុតពេលព្រឹក៖ កាហ្វេក្តៅ ជាមួយនំគ្រ័រសាំងប៊ឺ ☕🥐",
    price: 5.5,
    category: "Combo",
    image: "/images/croissant.jpg",
    isAvailable: true,
    discountPercent: 15,
    promoTag: "Special Combo",
  },
  {
    nameEn: "Boba + Cake Combo",
    nameKh: "គុជ + នំខេក ឈុត 🎁",
    descriptionEn: "Bestie combo: milk tea boba with a slice of cheesecake. 🧋🍰",
    descriptionKh: "ឈុតបេស្តី៖ តែគុជ ជាមួយនំឈីសខេកមួយចំណិត 🧋🍰",
    price: 6.5,
    category: "Combo",
    image: "/images/cheesecake.jpg",
    isAvailable: true,
    discountPercent: 20,
  },
];

// 🎩 Avatar Shop starter catalog — mirrors the hand-written INSERTs in
// prisma/migrations/20260804120000_add_avatar_shop_missions/migration.sql
// (that migration seeds prod directly since there's no local DB access to
// run this seed script against it; this copy is for local/dev-DB parity).
// slug is the upsert key, same convention as CATEGORIES/PRODUCTS above.
type Model3D = { shape: string; color: string; accentColor?: string; scale?: [number, number, number] };

type SeedShopItem = {
  slug: string;
  name: string;
  nameKh: string;
  category: "HAT" | "EYEWEAR" | "OUTFIT" | "HANDHELD" | "BASE_CHARACTER";
  tier: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  cost: number;
  emoji: string;
  model3d: Model3D;
};

// 🧊 model3d mirrors the hand-written UPDATE/INSERT statements in
// prisma/migrations/20260804130100_add_model3d_and_characters/migration.sql
// — see ShopItem.model3d's doc comment in schema.prisma for why this is a
// placeholder-geometry descriptor rather than a glbUrl.
const SHOP_ITEMS: SeedShopItem[] = [
  { slug: "coffee-bean-cap", name: "Coffee Bean Cap", nameKh: "មួកគ្រាប់កាហ្វេ", category: "HAT", tier: "COMMON", cost: 40, emoji: "🧢", model3d: { shape: "cone", color: "#3A1E05" } },
  { slug: "graduate-cap", name: "Graduate Cap", nameKh: "មួកបញ្ចប់ការសិក្សា", category: "HAT", tier: "COMMON", cost: 50, emoji: "🎓", model3d: { shape: "box", color: "#1a1a2e" } },
  { slug: "dapper-top-hat", name: "Dapper Top Hat", nameKh: "មួកអ្នកមានទឹកមុខ", category: "HAT", tier: "RARE", cost: 120, emoji: "🎩", model3d: { shape: "cylinder", color: "#111111", scale: [1, 1.4, 1] } },
  { slug: "golden-crown", name: "Golden Crown", nameKh: "មកុដមាស", category: "HAT", tier: "LEGENDARY", cost: 500, emoji: "👑", model3d: { shape: "torus", color: "#FFD45A" } },
  { slug: "nerd-glasses", name: "Nerd Glasses", nameKh: "វ៉ែនតាបញ្ញវន្ត", category: "EYEWEAR", tier: "COMMON", cost: 35, emoji: "👓", model3d: { shape: "torus", color: "#333333" } },
  { slug: "cool-sunglasses", name: "Cool Sunglasses", nameKh: "វ៉ែនតាការពារកម្ដៅ", category: "EYEWEAR", tier: "COMMON", cost: 40, emoji: "🕶️", model3d: { shape: "torus", color: "#1a1a1a" } },
  { slug: "barista-goggles", name: "Barista Goggles", nameKh: "វ៉ែនតាការពារបារីស្តា", category: "EYEWEAR", tier: "RARE", cost: 110, emoji: "🥽", model3d: { shape: "torus", color: "#8a5636" } },
  { slug: "sparkle-vision", name: "Sparkle Vision", nameKh: "ភ្នែកចែងចាំង", category: "EYEWEAR", tier: "EPIC", cost: 250, emoji: "✨", model3d: { shape: "torus", color: "#f4638a" } },
  { slug: "barista-apron", name: "Barista Apron", nameKh: "អាវការពាររបស់បារីស្តា", category: "OUTFIT", tier: "COMMON", cost: 45, emoji: "🧑‍🍳", model3d: { shape: "box", color: "#4a2c11" } },
  { slug: "cozy-hoodie", name: "Cozy Hoodie", nameKh: "អាវហ៊្គូឌីកក់ក្ដៅ", category: "OUTFIT", tier: "COMMON", cost: 45, emoji: "🧥", model3d: { shape: "box", color: "#A43F1D" } },
  { slug: "party-dress", name: "Party Dress", nameKh: "រ៉ូបពិធីជប់លៀង", category: "OUTFIT", tier: "RARE", cost: 130, emoji: "👗", model3d: { shape: "box", color: "#ff85a1" } },
  { slug: "ninja-gi", name: "Ninja Gi", nameKh: "សម្លៀកបំពាក់និនចា", category: "OUTFIT", tier: "EPIC", cost: 260, emoji: "🥋", model3d: { shape: "box", color: "#2a180b" } },
  { slug: "classic-coffee-cup", name: "Classic Coffee Cup", nameKh: "ពែងកាហ្វេបុរាណ", category: "HANDHELD", tier: "COMMON", cost: 35, emoji: "☕", model3d: { shape: "cylinder", color: "#fff7ef", accentColor: "#3A1E05" } },
  { slug: "boba-cup", name: "Boba Cup", nameKh: "ពែងតែពុះពងត្រី", category: "HANDHELD", tier: "COMMON", cost: 40, emoji: "🧋", model3d: { shape: "cylinder", color: "#f6c9ba", accentColor: "#8B0000" } },
  { slug: "baristas-wand", name: "Barista's Wand", nameKh: "ដំបងវេទមន្តរបស់បារីស្តា", category: "HANDHELD", tier: "EPIC", cost: 240, emoji: "🪄", model3d: { shape: "cylinder", color: "#9a82ea", scale: [0.6, 1.6, 0.6] } },
  { slug: "golden-mug", name: "Golden Mug", nameKh: "ពែងមាស", category: "HANDHELD", tier: "LEGENDARY", cost: 480, emoji: "🏆", model3d: { shape: "cylinder", color: "#ffc32e", accentColor: "#eca617" } },
  // 🧑‍🍳 Character Base Store — 2 free starters + Rare/Epic/Legendary.
  { slug: "default-barista-boy", name: "Default Barista", nameKh: "បារីស្តាលំនាំដើម (ប្រុស)", category: "BASE_CHARACTER", tier: "COMMON", cost: 0, emoji: "🧑‍🍳", model3d: { shape: "capsule-figure", color: "#bd8360", accentColor: "#4a2c11" } },
  { slug: "default-barista-girl", name: "Default Barista (Girl)", nameKh: "បារីស្តាលំនាំដើម (ស្រី)", category: "BASE_CHARACTER", tier: "COMMON", cost: 0, emoji: "👩‍🍳", model3d: { shape: "capsule-figure", color: "#e2ab8d", accentColor: "#8B0000" } },
  { slug: "dino-cafe-mascot", name: "Dino Cafe Mascot", nameKh: "ដាយណូស័រម៉ាស្កូតកាហ្វេ", category: "BASE_CHARACTER", tier: "RARE", cost: 150, emoji: "🦖", model3d: { shape: "dino-blocky", color: "#4c7a3f", accentColor: "#2f4d27" } },
  { slug: "cyberpunk-barista", name: "Cyberpunk Barista", nameKh: "បារីស្តាអនាគត", category: "BASE_CHARACTER", tier: "EPIC", cost: 320, emoji: "🤖", model3d: { shape: "cyber-angular", color: "#1a1a2e", accentColor: "#00e5ff" } },
  { slug: "golden-espresso-panda", name: "Golden Espresso Panda", nameKh: "ផេនដាមាសកាហ្វេ", category: "BASE_CHARACTER", tier: "LEGENDARY", cost: 600, emoji: "🐼", model3d: { shape: "panda-round", color: "#fffdf9", accentColor: "#ffc32e" } },
];

async function main() {
  const categoryIdByName = new Map<string, string>();
  for (const category of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { name: category.name },
      update: { iconKey: category.iconKey },
      create: category,
    });
    categoryIdByName.set(row.name, row.id);
  }

  for (const { category, ...product } of PRODUCTS) {
    const categoryId = categoryIdByName.get(category);
    if (!categoryId) throw new Error(`Unknown seed category: ${category}`);
    await prisma.product.upsert({
      where: { nameEn: product.nameEn },
      update: { ...product, categoryId },
      create: { ...product, categoryId },
    });
  }

  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
  }

  // 🔐 Admin accounts are now just User rows with role=ADMIN (unified login).
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@benchimin.cafe",
      passwordHash: adminPassword,
      name: "Cafe Manager",
      role: "ADMIN",
    },
  });

  console.log(
    `Seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${SHOP_ITEMS.length} shop items, and 1 admin account.`
  );
  console.log("Admin login -> username: admin / password: admin123");
  console.log("");
  console.log("ACTION REQUIRED: drop your bank-issued static KHQR image at:");
  console.log("  public/images/my-khqr.png");
  console.log(
    "Also set NEXT_PUBLIC_KHQR_ACCOUNT_NAME in .env to the real name registered on that account."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
