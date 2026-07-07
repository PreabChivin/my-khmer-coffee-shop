import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    nameEn: "Espresso",
    nameKh: "កាហ្វេអេស្ព្រេសសូ",
    descriptionEn: "A concentrated shot of our signature dark roast blend.",
    descriptionKh: "កាហ្វេចម្រាញ់ ដុតខ្មៅចាស់ រសជាតិខ្លាំង។",
    price: 2.5,
    category: "Coffee",
    image: "/images/espresso.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Americano",
    nameKh: "កាហ្វេអាមេរិកាណូ",
    descriptionEn: "Espresso diluted with hot water for a smooth, bold cup.",
    descriptionKh: "កាហ្វេអេស្ព្រេសលាយជាមួយទឹកក្តៅ រសជាតិសុភាព។",
    price: 2.75,
    category: "Coffee",
    image: "/images/americano.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Cappuccino",
    nameKh: "កាហ្វេកាពូឈីណូ",
    descriptionEn:
      "Espresso topped with steamed milk and a thick layer of foam.",
    descriptionKh: "កាហ្វេអេស្ព្រេសជាមួយទឹកដោះគោក្តៅ និងបពុរដ៏ក្រាស់។",
    price: 3.5,
    category: "Coffee",
    image: "/images/cappuccino.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Iced Latte",
    nameKh: "កាហ្វេឡាតេទឹកកក",
    descriptionEn: "Chilled espresso and milk over ice — smooth and refreshing.",
    descriptionKh: "កាហ្វេឡាតេជាមួយទឹកកក ស្រស់ស្រាយបំផុត។",
    price: 3.75,
    category: "Coffee",
    image: "/images/iced-latte.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Angkor Palm Sugar Latte",
    nameKh: "កាហ្វេត្នោតអង្គរ",
    descriptionEn:
      "Our signature latte sweetened with rich, smoky palm sugar — a tribute to the sugar palms surrounding Angkor.",
    descriptionKh:
      "កាហ្វេឡាតេពិសេស លាយជាមួយស្ករត្នោតដុតក្រអូប ជាកិត្តិយសដល់ដើមត្នោតជុំវិញប្រាសាទអង្គរ។",
    price: 3.95,
    category: "Coffee",
    image: "/images/palm-sugar-latte.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Mocha",
    nameKh: "កាហ្វេម៉ូកា",
    descriptionEn: "Espresso, steamed milk, and rich chocolate syrup.",
    descriptionKh: "កាហ្វេអេស្ព្រេស ទឹកដោះគោក្តៅ និងសុីរ៉ូសូកូឡាខ្លាញ់។",
    price: 4.0,
    category: "Coffee",
    image: "/images/mocha.jpg",
    isAvailable: false,
  },
  {
    nameEn: "Khmer Forest Green Tea",
    nameKh: "តែបៃតងព្រៃនគរ",
    descriptionEn:
      "Delicately steeped green tea leaves, echoing the ancient forests surrounding Angkor.",
    descriptionKh: "ស្លឹកតែបៃតងជ្រលក់យ៉ាងម៉ត់ចត់ ដូចព្រៃបុរាណជុំវិញអង្គរវត្ត។",
    price: 2.25,
    category: "Tea",
    image: "/images/green-tea.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Milk Tea",
    nameKh: "តែទឹកដោះគោ",
    descriptionEn: "Classic milk tea with chewy tapioca pearls.",
    descriptionKh: "តែទឹកដោះគោបុរាណ ជាមួយពែងម៉្សៅដាប់ដួច។",
    price: 3.25,
    category: "Tea",
    image: "/images/milk-tea.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Butter Croissant",
    nameKh: "នំក្រូអាសង់ប៊ឺ",
    descriptionEn: "Flaky, buttery croissant baked fresh every morning.",
    descriptionKh: "នំក្រូអាសង់ប៊ឺ ដុតថ្មីរាល់ព្រឹក ក្រែមរលាយក្នុងមាត់។",
    price: 2.0,
    category: "Bakery",
    image: "/images/croissant.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Blueberry Muffin",
    nameKh: "នំម័ហ្វិនប៊្លូបឺរី",
    descriptionEn: "Moist muffin loaded with real blueberries.",
    descriptionKh: "នំម័ហ្វិនទន់ជាមួយផ្លែប៊្លូបឺរីពិតប្រាកដ។",
    price: 2.5,
    category: "Bakery",
    image: "/images/muffin.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Classic Cheesecake",
    nameKh: "នំឈីសខេកបុរាណ",
    descriptionEn: "Rich and creamy cheesecake on a buttery graham crust.",
    descriptionKh: "នំឈីសខេកក្រែមទន់ លើសំបកនំក្រូបុរាណ។",
    price: 3.95,
    category: "Bakery",
    image: "/images/cheesecake.jpg",
    isAvailable: true,
  },
  {
    nameEn: "Traditional Khmer Layer Cake",
    nameKh: "នំស្លឹកចាកបុរាណ",
    descriptionEn:
      "A steamed pandan and coconut layer cake, chewy and lightly sweet — a beloved Khmer heirloom recipe.",
    descriptionKh:
      "នំចំណិតបៃតង-សធ្វើពីទឹកដូង និងស្លឹកតើយ ជាបន្តបន្ទាប់ស្រទាប់ រសជាតិផ្អែមស្រទន់ តាមរូបមន្តបុរាណខ្មែរ។",
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
