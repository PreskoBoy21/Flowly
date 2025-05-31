import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SessionProvider from "./SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flowly - Productivity Planner",
  description: "Organize tasks, build habits, and boost focus through a clean, AI-enhanced planning interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
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
