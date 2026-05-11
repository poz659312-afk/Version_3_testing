import type { Metadata } from "next";
import { Inter, Roboto_Mono, Rubik, Outfit, Rock_Salt, Cairo, Noto_Sans_Arabic } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { NotificationProvider } from "@/hooks/use-notifications";
import DevToolsProtection from "@/components/DevToolsProtection";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorThemeProvider } from "@/components/color-theme-provider";
import Navigation from "@/components/navigation";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

// Inter as Geist Sans replacement
const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Roboto Mono as Geist Mono replacement
const geistMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// Rubik font
const rubik = Rubik({
  subsets: ["latin", "arabic"],
  variable: "--font-rubik",
  weight: "variable",
  display: "swap"
});

// Outfit for headers
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["latin", "arabic"],
  variable: "--font-cairo",
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
});

const rockSalt = Rock_Salt({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rock-salt" 
});

export const metadata: Metadata = {
  title: "Chameleon | Future Skills",
  description:
    "Master your future skills with Chameleon, the ultimate platform for learning and growth With a focus on technology, design, and innovation.",
  icons: {
    icon: [{ url: "/images/1212-removebg-preview.png", sizes: "any" }],
    apple: "/images/1212-removebg-preview.png",
  },
  other: {
    "google-adsense-account": "ca-pub-5932974277970825",
  },
};

// Ads toggle: Set to false to disable all ads across the site
export const ENABLE_ADS = false;

// Cache toggle: Set to true to force a refresh for all users by disabling browser caching
export const DISABLE_CACHE = false;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://lottie.host" />
        {DISABLE_CACHE && (
          <>
            <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />
          </>
        )}
        {ENABLE_ADS && (
          <Script
            async
<<<<<<< HEAD
            strategy="afterInteractive"
=======
            strategy="lazyOnload"
>>>>>>> 16d5d685 (Performance optimizations)
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5932974277970825"
            crossOrigin="anonymous"
          />
        )}
<<<<<<< HEAD
        <Script 
          src="https://cdn.jsdelivr.net/npm/@dotlottie/player-component@2.7.12/dist/dotlottie-player.js" 
          strategy="afterInteractive"
        />
=======
>>>>>>> 16d5d685 (Performance optimizations)
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} ${outfit.variable} ${cairo.variable} ${notoSansArabic.variable} ${rockSalt.variable} antialiased font-sans ${
          !ENABLE_ADS ? "hide-all-ads" : ""
        }`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ColorThemeProvider defaultTheme="default">
            <NotificationProvider>
              <ToastProvider>
                {/* <DevToolsProtection /> */}
                <SmoothScrollProvider>
                  <Navigation />
                  {children}
                </SmoothScrollProvider>
              </ToastProvider>
            </NotificationProvider>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
