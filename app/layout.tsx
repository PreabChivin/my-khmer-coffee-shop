import type { Metadata } from "next";
import { Kantumruy_Pro, Moul } from "next/font/google";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FulfillmentProvider } from "@/contexts/FulfillmentContext";
import { GroupCartProvider } from "@/contexts/GroupCartContext";
import { AdminSessionProvider } from "@/contexts/AdminSessionContext";
import { CustomerSessionProvider } from "@/contexts/CustomerSessionContext";
import "./globals.css";

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600", "700"],
});

const moul = Moul({
  variable: "--font-moul",
  subsets: ["khmer", "latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "បេនជីមីន កាហ្វេ | BenChimin Cafe",
  description:
    "ហាងកាហ្វេខ្មែរប្រពៃណី — ស្រស់ថ្មីជារៀងរាល់ថ្ងៃ។ Traditional Khmer coffee house — order ahead and pay with KHQR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="km"
      suppressHydrationWarning
      className={`${kantumruyPro.variable} ${moul.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream-100 text-coffee-900 dark:bg-coffee-900 dark:text-cream-50">
        <ThemeProvider>
          <LanguageProvider>
            <AdminSessionProvider>
              <CustomerSessionProvider>
                <FulfillmentProvider>
                  <GroupCartProvider>
                    <CartProvider>{children}</CartProvider>
                  </GroupCartProvider>
                </FulfillmentProvider>
              </CustomerSessionProvider>
            </AdminSessionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
