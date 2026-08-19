"use client";

import StaffKitchenView from "@/components/admin/StaffKitchenView";
import AdminUserManagementPanel from "@/components/admin/AdminUserManagementPanel";

/**
 * 🔐 The Admin Dashboard shell at /admin. STAFF sees the Kitchen/Social
 * view only; ADMIN also gets User Management below it.
 */
export default function AdminDashboard({ isAdminRole }: { isAdminRole: boolean }) {
  return (
    <div>
      <StaffKitchenView isAdminRole={isAdminRole} />
      {isAdminRole && (
        <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6">
          <AdminUserManagementPanel />
        </div>
      )}
    </div>
  );
}
