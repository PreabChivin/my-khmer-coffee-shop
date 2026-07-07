export type Lang = "en" | "km";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "km", label: "KM" },
];

const dictionary = {
  en: {
    "nav.home": "Home",
    "nav.menu": "Menu",
    "cart.openAria": "Open cart",

    "appearance.openAria": "Appearance settings",
    "appearance.title": "Appearance",
    "appearance.theme": "Theme",
    "appearance.light": "Light",
    "appearance.dark": "Dark",
    "appearance.system": "System",
    "appearance.textSize": "Text Size",
    "appearance.small": "Small",
    "appearance.medium": "Medium",
    "appearance.large": "High",

    "hero.tagline": "Modern Taste, Ancient Soul",

    "cultural.label": "Ancestral Wisdom",
    "welcome.greeting": "Welcome, honoured guest",

    "home.badge": "Now Open Daily",
    "home.title": "Your Daily Ritual, Freshly Brewed",
    "home.subtitle":
      "Handcrafted coffee, tea, and bakery favorites — order ahead and pay instantly with KHQR, no cash, no waiting.",
    "home.viewFullMenu": "View Full Menu",
    "home.orderNow": "Order Now",
    "home.feature1Title": "Ethically Sourced",
    "home.feature1Desc": "Small-batch beans roasted weekly for peak freshness.",
    "home.feature2Title": "Pay with KHQR",
    "home.feature2Desc":
      "Scan and pay instantly with any Bakong-linked banking app.",
    "home.feature3Title": "Pickup or Delivery",
    "home.feature3Desc":
      "Order ahead and skip the line, or have it brought to you.",
    "home.fanFavorites": "Fan Favorites",
    "home.fanFavoritesSubtitle": "A taste of what's brewing today.",
    "home.storeHours": "Store Hours",
    "home.hoursWeekday": "Mon – Fri: 6:30 AM – 7:00 PM",
    "home.hoursWeekend": "Sat – Sun: 7:00 AM – 8:00 PM",
    "home.visitUs": "Visit Us",
    "home.address": "Street 240, Phnom Penh",

    "footer.tagline":
      "Small-batch roasted coffee, handcrafted tea, and fresh bakery treats — made for your daily ritual.",
    "footer.storeHours": "Store Hours",
    "footer.visitUs": "Visit Us",
    "footer.addressLine": "Street 240, Phnom Penh, Cambodia",
    "footer.rights": "All rights reserved.",

    "menu.title": "Our Menu",
    "menu.subtitle":
      "Freshly made coffee, tea, and bakery — order ahead, pay with KHQR.",
    "menu.categoryAll": "All",
    "menu.noItems": "No items available in this category right now.",
    "menu.addToCart": "Add to Cart",
    "menu.added": "Added!",
    "menu.outOfStock": "Out of Stock",
    "menu.searchPlaceholder": "Search our menu…",
    "menu.noResults": "No items match your search.",
    "menu.resultsWord": "results",
    "category.Coffee": "Coffee",
    "category.Tea": "Tea",
    "category.Bakery": "Bakery",

    "fulfillment.prompt": "How would you like your order?",
    "fulfillment.addressPlaceholder": "Enter your delivery address",
    "fulfillment.pickupAt": "Pick up at",

    "cart.title": "Your Order",
    "cart.empty": "Your cart is empty.",
    "cart.emptyHint": "Add something delicious from the menu.",
    "cart.subtotal": "Subtotal",
    "cart.checkout": "Proceed to Checkout",
    "cart.remove": "Remove",

    "checkout.title": "Checkout",
    "checkout.fullName": "Full Name",
    "checkout.phone": "Phone Number",
    "checkout.orderType": "Order Type",
    "checkout.pickup": "Pick Up",
    "checkout.delivery": "Delivery",
    "checkout.address": "Delivery Address",
    "checkout.note": "Order Note (optional)",
    "checkout.notePlaceholder": "Less sugar, extra ice, etc.",
    "checkout.orderSummary": "Order Summary",
    "checkout.total": "Total",
    "checkout.payButton": "Pay with KHQR",
    "checkout.processing": "Preparing your order…",
    "checkout.emptyCartTitle": "Your cart is empty",
    "checkout.emptyCartHint": "Add something delicious before checking out.",
    "checkout.browseMenu": "Browse Menu",
    "checkout.namePlaceholder": "Sokha Chan",
    "checkout.phonePlaceholder": "012 345 678",
    "checkout.addressPlaceholder": "House 12, Street 240, Phnom Penh",

    "payment.orderLabel": "Order",
    "payment.awaitingVerification": "Waiting for staff to verify your payment…",

    "success.title": "Payment Confirmed!",
    "success.message": "is now brewing. We'll have it ready shortly.",
    "success.preparing": "Your order is being prepared…",
    "success.orderSomethingElse": "Order Something Else",

    "adminLogin.title": "Staff Login",
    "adminLogin.subtitle": "BenChimin Cafe — Kitchen Dashboard",
    "adminLogin.username": "Username",
    "adminLogin.password": "Password",
    "adminLogin.signIn": "Sign In",
    "adminLogin.signingIn": "Signing in…",

    "adminDash.kitchenDashboard": "Kitchen Dashboard",
    "adminDash.signedInAs": "Signed in as",
    "adminDash.logout": "Log Out",
    "adminDash.tabOrders": "Order Queue",
    "adminDash.tabMenu": "Menu Management",
    "adminDash.loading": "Loading dashboard…",

    "adminMetrics.totalRevenue": "Total Revenue",
    "adminMetrics.activeOrders": "Active Orders",
    "adminMetrics.completed": "Completed",

    "adminCol.pending": "Pending Payment",
    "adminCol.awaitingVerification": "Awaiting Verification",
    "adminCol.preparing": "Preparing",
    "adminCol.completed": "Completed",
    "adminCol.cancelled": "Cancelled",
    "adminCol.noOrders": "No orders",

    "adminAction.approveOrder": "Approve Order",
    "adminAction.markCompleted": "Mark Completed",
    "adminAction.cancelOrder": "Cancel Order",
    "adminAction.loadingOrders": "Loading orders…",
    "adminAction.urgentBanner": "Customer says they've paid — verify in your banking app",

    "adminMenu.title": "Menu Items",
    "adminMenu.addProduct": "Add Product",
    "adminMenu.editProduct": "Edit Product",
    "adminMenu.item": "Item",
    "adminMenu.category": "Category",
    "adminMenu.price": "Price",
    "adminMenu.status": "Status",
    "adminMenu.actions": "Actions",
    "adminMenu.available": "Available",
    "adminMenu.outOfStock": "Out of Stock",
    "adminMenu.nameEn": "Name (English)",
    "adminMenu.nameKh": "Name (Khmer)",
    "adminMenu.descEn": "Description (English)",
    "adminMenu.descKh": "Description (Khmer)",
    "adminMenu.imagePath": "Image path (e.g. /images/espresso.jpg)",
    "adminMenu.availableToggle": "Available on menu",
    "adminMenu.save": "Save Product",
    "adminMenu.saving": "Saving…",
    "adminMenu.loading": "Loading menu…",
    "adminMenu.deleteConfirmPrefix": "Delete",
    "adminMenu.deleteConfirmSuffix": "? This cannot be undone.",

    "paymentStatus.PAID": "PAID",
    "paymentStatus.UNPAID": "UNPAID",
  },
  km: {
    "nav.home": "ទំព័រដើម",
    "nav.menu": "មីនុយ",
    "cart.openAria": "បើកកន្ត្រក",

    "appearance.openAria": "ការកំណត់រូបរាង",
    "appearance.title": "រូបរាង",
    "appearance.theme": "រចនាប័ទ្ម",
    "appearance.light": "ភ្លឺ",
    "appearance.dark": "ងងឹត",
    "appearance.system": "តាមប្រព័ន្ធ",
    "appearance.textSize": "ទំហំអក្សរ",
    "appearance.small": "តូច",
    "appearance.medium": "មធ្យម",
    "appearance.large": "ធំ",

    "hero.tagline": "រសជាតិសម័យថ្មី ព្រលឹងសម័យបុរាណ",

    "cultural.label": "ពាក្យពេជន៍បុរាណ",
    "welcome.greeting": "សូមស្វាគមន៍ ភ្ញៀវកិត្តិយស",

    "home.badge": "បើកប្រចាំថ្ងៃ",
    "home.title": "ទម្លាប់ប្រចាំថ្ងៃរបស់អ្នក ស្រស់ថ្មីជានិច្ច",
    "home.subtitle":
      "កាហ្វេ តែ និងនំដុតធ្វើដោយដៃ — កម្មង់ជាមុន ហើយទូទាត់ភ្លាមៗជាមួយ KHQR ដោយមិនចាំបាច់ប្រើសាច់ប្រាក់ ឬរង់ចាំ។",
    "home.viewFullMenu": "មើលមីនុយទាំងអស់",
    "home.orderNow": "កម្មង់ឥឡូវនេះ",
    "home.feature1Title": "ប្រភពប្រកបដោយក្រមសីលធម៌",
    "home.feature1Desc":
      "គ្រាប់កាហ្វេចំនួនតិចដុតរៀងរាល់សប្តាហ៍ ដើម្បីភាពស្រស់បំផុត។",
    "home.feature2Title": "ទូទាត់ជាមួយ KHQR",
    "home.feature2Desc":
      "ស្កេន ហើយទូទាត់ភ្លាមៗជាមួយកម្មវិធីធនាគារណាមួយដែលភ្ជាប់ជាមួយ Bakong។",
    "home.feature3Title": "មកយកខ្លួនឯង ឬដឹកជញ្ជូន",
    "home.feature3Desc": "កម្មង់ជាមុនដើម្បីរំលងជួរ ឬឱ្យគេដឹកមកដល់អ្នក។",
    "home.fanFavorites": "ពេញនិយមបំផុត",
    "home.fanFavoritesSubtitle": "រសជាតិនៃអ្វីដែលកំពុងស្ងោរនៅថ្ងៃនេះ។",
    "home.storeHours": "ម៉ោងបើកបម្រើ",
    "home.hoursWeekday": "ចន្ទ – សុក្រ៖ ៦:៣០ ព្រឹក – ៧:០០ល្ងាច",
    "home.hoursWeekend": "សៅរ៍ – អាទិត្យ៖ ៧:០០ ព្រឹក – ៨:០០ល្ងាច",
    "home.visitUs": "អាសយដ្ឋានហាង",
    "home.address": "ផ្លូវ២៤០ ភ្នំពេញ",

    "footer.tagline":
      "កាហ្វេដុតជាបាច់តូច តែធ្វើដោយដៃ និងនំដុតស្រស់ៗ — ធ្វើឡើងសម្រាប់ទម្លាប់ប្រចាំថ្ងៃរបស់អ្នក។",
    "footer.storeHours": "ម៉ោងបើកបម្រើ",
    "footer.visitUs": "អាសយដ្ឋាន",
    "footer.addressLine": "ផ្លូវ២៤០ ភ្នំពេញ កម្ពុជា",
    "footer.rights": "រក្សាសិទ្ធិគ្រប់យ៉ាង។",

    "menu.title": "មីនុយរបស់យើង",
    "menu.subtitle": "កាហ្វេ តែ និងនំដុតធ្វើថ្មីៗ — កម្មង់ជាមុន ទូទាត់ជាមួយ KHQR។",
    "menu.categoryAll": "ទាំងអស់",
    "menu.noItems": "មិនមានទំនិញនៅក្នុងប្រភេទនេះទេពេលនេះ។",
    "menu.addToCart": "បន្ថែមទៅកន្ត្រក",
    "menu.added": "បានបន្ថែម!",
    "menu.outOfStock": "អស់ស្តុក",
    "menu.searchPlaceholder": "ស្វែងរកមីនុយ...",
    "menu.noResults": "គ្មានទំនិញត្រូវនឹងការស្វែងរករបស់អ្នកទេ។",
    "menu.resultsWord": "លទ្ធផល",
    "category.Coffee": "កាហ្វេ",
    "category.Tea": "តែ",
    "category.Bakery": "នំដុត",

    "fulfillment.prompt": "តើអ្នកចង់ទទួលការកម្មង់ដោយរបៀបណា?",
    "fulfillment.addressPlaceholder": "បញ្ចូលអាសយដ្ឋានដឹកជញ្ជូនរបស់អ្នក",
    "fulfillment.pickupAt": "មកយកនៅ",

    "cart.title": "ការកម្មង់របស់អ្នក",
    "cart.empty": "កន្ត្រករបស់អ្នកទទេ។",
    "cart.emptyHint": "បន្ថែមអ្វីមួយឆ្ងាញ់ពីមីនុយ។",
    "cart.subtotal": "សរុបរង",
    "cart.checkout": "បន្តទៅការទូទាត់",
    "cart.remove": "លុប",

    "checkout.title": "ការទូទាត់",
    "checkout.fullName": "ឈ្មោះពេញ",
    "checkout.phone": "លេខទូរស័ព្ទ",
    "checkout.orderType": "ប្រភេទការកម្មង់",
    "checkout.pickup": "មកយកខ្លួនឯង",
    "checkout.delivery": "ដឹកជញ្ជូន",
    "checkout.address": "អាសយដ្ឋានដឹកជញ្ជូន",
    "checkout.note": "កំណត់ចំណាំបន្ថែម (មិនចាំបាច់)",
    "checkout.notePlaceholder": "តិចស្ករ បន្ថែមទឹកកក ។ល។",
    "checkout.orderSummary": "សេចក្តីសង្ខេបការកម្មង់",
    "checkout.total": "សរុប",
    "checkout.payButton": "ទូទាត់ជាមួយ KHQR",
    "checkout.processing": "កំពុងរៀបចំការកម្មង់របស់អ្នក...",
    "checkout.emptyCartTitle": "កន្ត្រករបស់អ្នកទទេ",
    "checkout.emptyCartHint": "សូមបន្ថែមអ្វីមួយឆ្ងាញ់មុននឹងទូទាត់។",
    "checkout.browseMenu": "មើលមីនុយ",
    "checkout.namePlaceholder": "សុខា ចាន់",
    "checkout.phonePlaceholder": "០១២ ៣៤៥ ៦៧៨",
    "checkout.addressPlaceholder": "ផ្ទះលេខ១២ ផ្លូវ២៤០ ភ្នំពេញ",

    "payment.orderLabel": "ការកម្មង់លេខ",
    "payment.awaitingVerification": "កំពុងរង់ចាំបុគ្គលិកផ្ទៀងផ្ទាត់ការទូទាត់របស់អ្នក...",

    "success.title": "ការទូទាត់បានជោគជ័យ!",
    "success.message": "កំពុងត្រូវបានរៀបចំ។ យើងខ្ញុំនឹងធ្វើឱ្យរួចរាល់ក្នុងពេលឆាប់ៗនេះ។",
    "success.preparing": "ការកម្មង់របស់អ្នកកំពុងត្រូវបានរៀបចំ...",
    "success.orderSomethingElse": "កម្មង់បន្ថែមទៀត",

    "adminLogin.title": "ចូលប្រើសម្រាប់បុគ្គលិក",
    "adminLogin.subtitle": "បេនជីមីន កាហ្វេ — ផ្ទាំងគ្រប់គ្រងផ្ទះបាយ",
    "adminLogin.username": "ឈ្មោះអ្នកប្រើ",
    "adminLogin.password": "ពាក្យសម្ងាត់",
    "adminLogin.signIn": "ចូល",
    "adminLogin.signingIn": "កំពុងចូល...",

    "adminDash.kitchenDashboard": "ផ្ទាំងគ្រប់គ្រងផ្ទះបាយ",
    "adminDash.signedInAs": "បានចូលក្នុងនាម",
    "adminDash.logout": "ចាកចេញ",
    "adminDash.tabOrders": "ជួរការកម្មង់",
    "adminDash.tabMenu": "គ្រប់គ្រងមីនុយ",
    "adminDash.loading": "កំពុងផ្ទុកផ្ទាំងគ្រប់គ្រង...",

    "adminMetrics.totalRevenue": "ចំណូលសរុប",
    "adminMetrics.activeOrders": "ការកម្មង់សកម្ម",
    "adminMetrics.completed": "បានបញ្ចប់",

    "adminCol.pending": "រង់ចាំទូទាត់",
    "adminCol.awaitingVerification": "កំពុងរង់ចាំផ្ទៀងផ្ទាត់",
    "adminCol.preparing": "កំពុងរៀបចំ",
    "adminCol.completed": "បានបញ្ចប់",
    "adminCol.cancelled": "បានលុបចោល",
    "adminCol.noOrders": "គ្មានការកម្មង់",

    "adminAction.approveOrder": "អនុម័តការកម្មង់",
    "adminAction.markCompleted": "សម្គាល់ថាបានបញ្ចប់",
    "adminAction.cancelOrder": "លុបចោលការកម្មង់",
    "adminAction.loadingOrders": "កំពុងផ្ទុកការកម្មង់...",
    "adminAction.urgentBanner": "អតិថិជនប្រាប់ថាបានផ្ទេរប្រាក់ — សូមផ្ទៀងផ្ទាត់ក្នុងកម្មវិធីធនាគាររបស់អ្នក",

    "adminMenu.title": "ទំនិញក្នុងមីនុយ",
    "adminMenu.addProduct": "បន្ថែមទំនិញ",
    "adminMenu.editProduct": "កែសម្រួលទំនិញ",
    "adminMenu.item": "ទំនិញ",
    "adminMenu.category": "ប្រភេទ",
    "adminMenu.price": "តម្លៃ",
    "adminMenu.status": "ស្ថានភាព",
    "adminMenu.actions": "សកម្មភាព",
    "adminMenu.available": "មានលក់",
    "adminMenu.outOfStock": "អស់ស្តុក",
    "adminMenu.nameEn": "ឈ្មោះ (អង់គ្លេស)",
    "adminMenu.nameKh": "ឈ្មោះ (ខ្មែរ)",
    "adminMenu.descEn": "ការពិពណ៌នា (អង់គ្លេស)",
    "adminMenu.descKh": "ការពិពណ៌នា (ខ្មែរ)",
    "adminMenu.imagePath": "ផ្លូវរូបភាព (ឧ. /images/espresso.jpg)",
    "adminMenu.availableToggle": "មានក្នុងមីនុយ",
    "adminMenu.save": "រក្សាទុកទំនិញ",
    "adminMenu.saving": "កំពុងរក្សាទុក...",
    "adminMenu.loading": "កំពុងផ្ទុកមីនុយ...",
    "adminMenu.deleteConfirmPrefix": "លុប",
    "adminMenu.deleteConfirmSuffix": "? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",

    "paymentStatus.PAID": "បានទូទាត់",
    "paymentStatus.UNPAID": "មិនទាន់ទូទាត់",
  },
} as const;

export type TranslationKey = keyof typeof dictionary.en;

export function translate(lang: Lang, key: TranslationKey): string {
  return dictionary[lang][key] ?? dictionary.en[key];
}

export interface LocalizedName {
  nameEn: string;
  nameKh: string;
}

export interface LocalizedDescription {
  descriptionEn?: string | null;
  descriptionKh?: string | null;
}

export function localizedName(item: LocalizedName, lang: Lang): string {
  return lang === "km" ? item.nameKh : item.nameEn;
}

export function localizedDescription(
  item: LocalizedDescription,
  lang: Lang
): string {
  const value = lang === "km" ? item.descriptionKh : item.descriptionEn;
  return value ?? "";
}

export function localizedCategory(category: string, lang: Lang): string {
  const key = `category.${category}` as TranslationKey;
  const value = dictionary[lang][key as keyof (typeof dictionary)[typeof lang]];
  return (value as string | undefined) ?? category;
}

/**
 * Authentic Khmer proverbs and ancestral blessings (ពាក្យពេជន៍បុព្វបុរស).
 * The Khmer text is a fixed cultural artifact and is always shown in Khmer;
 * the meaning line adapts to the active language.
 */
export interface CulturalSaying {
  km: string;
  meaningEn: string;
  meaningKm: string;
}

export const CULTURAL: Record<
  "welcome" | "cartEmpty" | "blessing",
  CulturalSaying
> = {
  // User-provided welcome quote on cultural stewardship.
  welcome: {
    km: "រួមថែរក្សាវប្បធម៌ ដកដង្ហើមយកចំណេះដឹង",
    meaningEn: "Together we cherish our heritage, and breathe in wisdom.",
    meaningKm: "រួមគ្នាថែរក្សាវប្បធម៌ជាតិ ហើយស្រូបយកនូវចំណេះដឹង។",
  },
  // Classic Khmer proverb: small steady effort accumulates.
  cartEmpty: {
    km: "តក់ៗ ពេញបំពង់",
    meaningEn: "Drop by drop, the bamboo fills — begin with a single choice.",
    meaningKm: "បន្តិចម្តងៗ នឹងបានពេញ — សូមចាប់ផ្តើមជ្រើសរើសម្ហូបដំបូង។",
  },
  // Traditional Buddhist four-fold blessing offered to a departing guest.
  blessing: {
    km: "សូមទទួលបាននូវពុទ្ធពរទាំងបួនប្រការ គឺ អាយុ វណ្ណៈ សុខៈ ពលៈ",
    meaningEn:
      "May you receive the four blessings: long life, grace, happiness, and strength.",
    meaningKm: "សូមឲ្យលោកអ្នកបានសិរីសួស្តី ជ័យមង្គល គ្រប់ប្រការ។",
  },
};

export function sayingMeaning(saying: CulturalSaying, lang: Lang): string {
  return lang === "km" ? saying.meaningKm : saying.meaningEn;
}
