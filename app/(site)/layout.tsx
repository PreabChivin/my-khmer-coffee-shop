import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import StaffPortalShortcut from "@/components/StaffPortalShortcut";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartSidebar />
      {/* 🔐 Hidden staff login — summoned with Ctrl+S / ⌘+S */}
      <StaffPortalShortcut />
    </div>
  );
}
