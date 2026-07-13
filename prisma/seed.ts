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
    `Seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products, and 1 admin account.`
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
