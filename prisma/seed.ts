import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Ultra-cute, playful naming (Gen-Z Khmer pop). nameEn is kept stable as the
// upsert key so re-seeding updates existing rows in place instead of creating
// duplicates; the cuteness lives in the Khmer names + bilingual descriptions.
const PRODUCTS = [
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
];

async function main() {
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { nameEn: product.nameEn },
      update: product,
      create: product,
    });
  }

  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "Cafe Manager",
    },
  });

  console.log(`Seeded ${PRODUCTS.length} products and 1 admin account.`);
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
