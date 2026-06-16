import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import DynamicIsland from "@/components/DynamicIsland";
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

export const viewport: Viewport = {
  themeColor: "#111113",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "YAY by netals — Virtual Machine",
  description: "Premium WhatsApp Bot Management System. Control your bot through a virtual desktop environment.",
  keywords: ["YAY", "netals", "WhatsApp Bot", "SaaS", "Bot Management"],
  appleWebApp: {
    capable: true,
    title: "YAY Bot",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased bg-black`}
      style={{ backgroundColor: '#000000', color: '#ffffff' }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link href="https://cdn.jsdelivr.net/npm/@flaticon/flaticon-uicons@3.3.1/css/all/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <link rel="preload" href="/logo-color.png" as="image" />
        <link rel="preload" href="/logo-white.png" as="image" />
      </head>
      <body className="min-h-full flex flex-col bg-black" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && !sessionStorage.getItem('first_reload_yay')) {
              sessionStorage.setItem('first_reload_yay', 'true');
              window.location.reload();
            }
          `
        }} />
        <DynamicIsland />
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
