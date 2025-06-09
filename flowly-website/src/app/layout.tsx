import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SessionProvider from "./SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Flowly - AI-Powered Productivity Planner & Task Manager",
    template: "%s | Flowly"
  },
  description: "Boost your productivity with Flowly's AI-powered planning tools. Organize tasks, build habits, track goals, and get personalized insights. Start free today!",
  keywords: [
    "productivity app",
    "task manager",
    "habit tracker", 
    "AI planner",
    "goal tracking",
    "daily planner",
    "productivity tools",
    "task organizer",
    "time management",
    "habit building"
  ],
  authors: [{ name: "Flowly Team" }],
  creator: "Flowly",
  publisher: "Flowly",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.myflowly.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Flowly - AI-Powered Productivity Planner",
    description: "Organize tasks, build habits, and achieve your goals with AI-enhanced productivity tools. Join thousands of users boosting their productivity.",
    url: "https://www.myflowly.com",
    siteName: "Flowly",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Flowly - AI-Powered Productivity Planner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowly - AI-Powered Productivity Planner",
    description: "Boost your productivity with AI-enhanced planning tools. Organize tasks, build habits, track goals.",
    images: ["/og-image.jpg"],
    creator: "@flowlyapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Flowly",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "Web Browser",
              "description": "AI-powered productivity planner for organizing tasks, building habits, and achieving goals",
              "url": "https://www.myflowly.com",
              "author": {
                "@type": "Organization",
                "name": "Flowly"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "priceValidUntil": "2025-12-31",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1247",
                "bestRating": "5"
              },
              "features": [
                "AI-powered task planning",
                "Habit tracking",
                "Goal management",
                "Daily planner",
                "Progress analytics"
              ]
            })
          }}
        />
        {/* Additional meta tags */}
        <meta name="theme-color" content="#22c55e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Flowly" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.ico" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <main className="min-h-screen bg-white">
            {children}
          </main>
          <Toaster position="bottom-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
