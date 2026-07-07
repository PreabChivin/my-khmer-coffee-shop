"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import OrdersBoard from "@/components/admin/OrdersBoard";
import ProductManager from "@/components/admin/ProductManager";
import { useLanguage } from "@/contexts/LanguageContext";

type Tab = "orders" | "menu";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [adminName, setAdminName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setAdminName(data.name))
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  if (!adminName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 text-coffee-500 dark:bg-coffee-900 dark:text-cream-300">
        {t("adminDash.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-coffee-900">
      <AdminHeader name={adminName} />

      <div className="flex gap-2 border-b border-coffee-200 bg-cream-50 px-6 pt-4 dark:border-coffee-700 dark:bg-coffee-900">
        {(["orders", "menu"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-t-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-coffee-100 text-coffee-900 dark:bg-coffee-800 dark:text-cream-50"
                : "text-coffee-500 hover:text-coffee-800 dark:text-cream-300 dark:hover:text-cream-100"
            }`}
          >
            {tab === "orders" ? t("adminDash.tabOrders") : t("adminDash.tabMenu")}
          </button>
        ))}
      </div>

      {activeTab === "orders" ? <OrdersBoard /> : <ProductManager />}
    </div>
  );
}
