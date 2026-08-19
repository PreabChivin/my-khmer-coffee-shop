import type { Metadata } from "next";
import { Kantumruy_Pro, Moul } from "next/font/google";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { ChatProvider } from "@/contexts/ChatContext";
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
  title: "បេនជីមីន អាកែត | BENCHIMIN ARCADE",
  description:
    "ទីលានប្រកួតប្រជែងហ្គេមកំសាន្ត និងលេងជាមួយគ្នាយ៉ាងសប្បាយរីករាយ។ A social gaming arcade — play, compete, and hang out together.",
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
            <SessionProvider>
              <AuthModalProvider>
                <ChatProvider>{children}</ChatProvider>
              </AuthModalProvider>
            </SessionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
