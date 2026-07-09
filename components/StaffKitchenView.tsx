"use client";

import ProductCard from "@/components/ProductCard";
import AdminAddProductCard from "@/components/AdminAddProductCard";
import OrdersBoard from "@/components/admin/OrdersBoard";
import type { ProductDTO } from "@/lib/types";

/**
 * 🧸 ផ្ទាំងគ្រប់គ្រងការកម្ម៉ង់របស់ Besties — the single unified Staff View.
 * Replaces the ENTIRE customer homepage (banners, menu grid, cart) the
 * instant a staff member logs in: order-queue Kanban up top, full menu CRUD
 * below. Nothing here is ever reachable by a logged-out customer.
 */
export default function StaffKitchenView({
  products,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
}: {
  products: ProductDTO[];
  onProductCreated: (created: ProductDTO) => void;
  onProductUpdated: (updated: ProductDTO) => void;
  onProductDeleted: (id: string) => void;
}) {
  return (
    <div className="min-h-screen bg-cream-100 dark:bg-coffee-900">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <h1 className="text-center font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50 sm:text-3xl">
          ផ្ទាំងគ្រប់គ្រងការកម្ម៉ង់របស់ Besties 🧸
        </h1>
      </div>

      {/* Order queue lifecycle: Approve → Ready → Complete / Cancel */}
      <OrdersBoard />

      {/* Menu management: add / edit / delete / stock toggle */}
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="mb-6 border-t-2 border-gold-500/40 pt-8 font-heading text-xl font-extrabold text-coffee-900 dark:text-cream-50">
          🧋 គ្រប់គ្រងមីនុយ
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AdminAddProductCard onCreated={onProductCreated} />
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showAdminControls
              onProductUpdated={onProductUpdated}
              onProductDeleted={onProductDeleted}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
