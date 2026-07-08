"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGroupCart } from "@/contexts/GroupCartContext";

/** 👯 Compact CTA shown only when NOT already in an active Bestie Cart. */
export default function StartGroupCartButton() {
  const { t } = useLanguage();
  const { groupId, startGroupSession } = useGroupCart();
  const router = useRouter();

  if (groupId) return null;

  async function handleStart() {
    const id = await startGroupSession();
    if (id) router.push(`/menu?group=${id}`);
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      className="mb-8 flex items-center gap-2 rounded-full border-2 border-dashed border-clay-400 bg-clay-50 px-5 py-2.5 text-sm font-bold text-clay-600 transition-transform hover:scale-[1.02] active:scale-95 dark:bg-coffee-800 dark:text-clay-400"
    >
      <Users size={16} />
      {t("group.start")}
    </button>
  );
}
