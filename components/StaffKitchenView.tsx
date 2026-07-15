"use client";

import { useCallback, useState } from "react";
import AdminStats from "@/components/admin/AdminStats";
import OrdersBoard from "@/components/admin/OrdersBoard";
import ProductManagementPanel from "@/components/admin/ProductManagementPanel";
import RegisteredCustomersPanel from "@/components/admin/RegisteredCustomersPanel";
import RedemptionsPanel from "@/components/admin/RedemptionsPanel";
import NotificationsPanel from "@/components/admin/NotificationsPanel";
import LuckyDrawPanel from "@/components/admin/LuckyDrawPanel";
import AdminChatMonitorPanel from "@/components/admin/AdminChatMonitorPanel";
import AdminToast from "@/components/admin/AdminToast";
import type { ProductDTO } from "@/lib/types";

/**
 * 🧸 ផ្ទាំងគ្រប់គ្រងការកម្ម៉ង់របស់ Besties — the single unified Staff View.
 * Replaces the ENTIRE customer homepage (banners, menu grid, cart) the
 * instant a staff member logs in. Two-column workspace: Live Orders Control
 * on the left, Dynamic Menu & Partner CMS on the right. Nothing here is ever
 * reachable by a logged-out customer, and everything unmounts (state and
 * all) the moment the Header's "ចុចចេញ/Logout" button is clicked.
 */
export default function StaffKitchenView({
  products,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
  isAdminRole,
}: {
  products: ProductDTO[];
  onProductCreated: (created: ProductDTO) => void;
  onProductUpdated: (updated: ProductDTO) => void;
  onProductDeleted: (id: string) => void;
  isAdminRole: boolean;
}) {
  // 🚨 One shared error toast for the whole dashboard — any failed mutation
  // in either panel surfaces here instead of freezing or failing silently.
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showError = useCallback((message: string) => setToastMessage(message), []);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-coffee-900">
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6">
        <h1 className="text-center font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50 sm:text-3xl">
          ផ្ទាំងគ្រប់គ្រងការកម្ម៉ង់របស់ Besties 🧸
        </h1>
        <AdminStats />
      </div>

      {/* Compact two-column workspace: Live Orders Control | Menu & Partner CMS */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-start gap-4 px-4 pb-16 sm:px-6 xl:grid-cols-2">
        <OrdersBoard onError={showError} />
        <ProductManagementPanel
          products={products}
          onProductCreated={onProductCreated}
          onProductUpdated={onProductUpdated}
          onProductDeleted={onProductDeleted}
          onError={showError}
        />
      </div>

      {/* 🎁 Reward redemptions awaiting fulfilment */}
      <div className="px-4 sm:px-6">
        <RedemptionsPanel onError={showError} />
      </div>

      {/* 📣 Marketing: broadcast/targeted notifications + monthly lucky draw */}
      <div className="px-4 sm:px-6">
        <NotificationsPanel onError={showError} />
      </div>
      <div className="px-4 sm:px-6">
        <LuckyDrawPanel onError={showError} />
      </div>

      {/* 👥 Full registered-customer roster with generation + LTV drill-down */}
      <div className="px-4 sm:px-6">
        <RegisteredCustomersPanel onError={showError} />
      </div>

      {/* 💬 Café Lounge moderation — Staff view/flag/delete, Admin also mutes/bans */}
      <div className="px-4 pb-16 sm:px-6">
        <AdminChatMonitorPanel isAdminRole={isAdminRole} onError={showError} />
      </div>

      {toastMessage && (
        <AdminToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  );
}
