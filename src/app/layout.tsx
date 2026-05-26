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
      <head>
        <link href="https://cdn.jsdelivr.net/npm/@flaticon/flaticon-uicons@3.3.1/css/all/all.min.css" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && !sessionStorage.getItem('first_reload_yay')) {
              sessionStorage.setItem('first_reload_yay', 'true');
              window.location.reload();
            }
          `
        }} />
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
