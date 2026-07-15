"use client";

import { useState } from "react";
import StaffKitchenView from "@/components/StaffKitchenView";
import AdminUserManagementPanel from "@/components/admin/AdminUserManagementPanel";
import type { ProductDTO } from "@/lib/types";

/**
 * 🔐 The Admin Dashboard shell at /admin (moved out of the old inline
 * HomeContent render). Holds the product list + CRUD handlers exactly as
 * HomeContent used to, and adds the ADMIN-only User Management panel below
 * the existing Staff Kitchen View. STAFF sees Kitchen/Menu/Marketing only;
 * ADMIN also gets User Management.
 */
export default function AdminDashboard({
  initialProducts,
  isAdminRole,
}: {
  initialProducts: ProductDTO[];
  isAdminRole: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);

  function handleProductCreated(created: ProductDTO) {
    setProducts((prev) => [...prev, created]);
  }
  function handleProductUpdated(updated: ProductDTO) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }
  function handleProductDeleted(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <StaffKitchenView
        products={products}
        onProductCreated={handleProductCreated}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
        isAdminRole={isAdminRole}
      />
      {isAdminRole && (
        <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6">
          <AdminUserManagementPanel />
        </div>
      )}
    </div>
  );
}
