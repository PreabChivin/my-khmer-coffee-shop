import { redirect } from "next/navigation";

// The /admin index has no page of its own — send visitors to the dashboard,
// which verifies the session and bounces to /admin/login when not signed in.
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
