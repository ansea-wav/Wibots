import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { KeyboardProvider } from "@/lib/KeyboardContext";
import DynamicIsland from "@/components/DynamicIsland";
import VirtualKeyboard from "@/components/VirtualKeyboard";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YAY by netals — Virtual Machine",
  description: "Premium WhatsApp Bot Management System. Control your bot through a virtual desktop environment.",
  keywords: ["YAY", "netals", "WhatsApp Bot", "SaaS", "Bot Management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <KeyboardProvider>
          <DynamicIsland />
          <LanguageProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </LanguageProvider>
          <VirtualKeyboard />
        </KeyboardProvider>
      </body>
    </html>
  );
}
