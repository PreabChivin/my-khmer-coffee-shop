"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import OrdersBoard from "@/components/admin/OrdersBoard";
import AdminLoginModal from "@/components/AdminLoginModal";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useLanguage } from "@/contexts/LanguageContext";

// 🔐 Kitchen / order-management console. Separate from the public homepage's
// inline product CMS: this is where staff approve payments, advance orders
// through PREPARING → READY, print receipts, and redeem gift vouchers.
export default function OrdersPage() {
  const { adminName, isChecking } = useAdminSession();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(true);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 text-coffee-500 dark:bg-coffee-900 dark:text-cream-300">
        {t("adminDash.loading")}
      </div>
    );
  }

  if (!adminName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-coffee-900 px-4">
        {showModal && <AdminLoginModal onClose={() => setShowModal(false)} />}
        {!showModal && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-full bg-gold-500 px-6 py-3 font-semibold text-coffee-900 hover:bg-gold-600"
          >
            {t("adminLogin.signIn")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-coffee-900">
      <AdminHeader name={adminName} />
      <OrdersBoard />
    </div>
  );
}
