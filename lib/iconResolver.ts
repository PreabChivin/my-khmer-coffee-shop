import {
  Cake,
  Coffee,
  Cookie,
  CupSoda,
  IceCreamCone,
  Leaf,
  Sandwich,
  type LucideIcon,
} from "lucide-react";

/**
 * 🎨 Automated Icon Resolver — the admin never has to type or look up an
 * icon path. Priority order:
 *   1. An explicit iconUrl (admin-supplied override) always wins.
 *   2. Khmer/English keyword match against iconKey (if set) or the category
 *      name itself, resolving to either a bundled local asset or a themed
 *      Lucide icon.
 *   3. A generic Coffee icon fallback (this is, after all, a coffee shop).
 */
export interface CategoryIconInput {
  name: string;
  iconKey?: string | null;
  iconUrl?: string | null;
}

export type ResolvedCategoryIcon =
  | { kind: "image"; src: string }
  | { kind: "lucide"; Icon: LucideIcon };

interface IconRule {
  keywords: string[];
  icon: LucideIcon;
  /** Optional path under public/images — used instead of the Lucide icon
   *  when this rule matches and a dedicated local asset exists. */
  localAsset?: string;
}

const ICON_RULES: IconRule[] = [
  {
    keywords: ["coffee", "espresso", "latte", "cappuccino", "mocha", "americano", "កាហ្វេ"],
    icon: Coffee,
  },
  {
    keywords: ["tea", "matcha", "green tea", "តែ"],
    icon: Leaf,
  },
  {
    keywords: ["cake", "bakery", "pastry", "dessert", "croissant", "muffin", "cheesecake", "នំ", "ខេក"],
    icon: Cake,
    localAsset: "/images/khmer-layer-cake.svg",
  },
  {
    keywords: ["ice cream", "gelato", "ការាំង"],
    icon: IceCreamCone,
  },
  {
    keywords: [
      "juice",
      "smoothie",
      "soda",
      "cold drink",
      "boba",
      "bubble tea",
      "milk tea",
      "ទឹកផ្លែឈើ",
      "ភេសជ្ជៈត្រជាក់",
      "គុជ",
      "តែទឹកដោះគោ",
    ],
    icon: CupSoda,
  },
  {
    keywords: ["sandwich", "toast", "brunch", "សាំងវិច"],
    icon: Sandwich,
  },
  {
    keywords: ["cookie", "biscuit", "ខូគី"],
    icon: Cookie,
  },
];

export function resolveCategoryIcon(category: CategoryIconInput): ResolvedCategoryIcon {
  if (category.iconUrl && category.iconUrl.trim()) {
    return { kind: "image", src: category.iconUrl.trim() };
  }

  const haystack = `${category.iconKey ?? ""} ${category.name}`.toLowerCase();
  for (const rule of ICON_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      if (rule.localAsset) return { kind: "image", src: rule.localAsset };
      return { kind: "lucide", Icon: rule.icon };
    }
  }

  return { kind: "lucide", Icon: Coffee };
}
