import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | BenChimin Cafe",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-coffee-50 dark:bg-coffee-900">
      {children}
    </div>
  );
}
