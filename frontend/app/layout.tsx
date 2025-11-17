import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import ConditionalFooter from "@/components/ConditionalFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DB Luxury Cars - Morocco's Ultimate Driving Experience",
  description: "Premium luxury car rental in Morocco. Experience Morocco's breathtaking landscapes from behind the wheel of the world's most prestigious vehicles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`} style={{ margin: 0, padding: 0 }}>
        <Suspense fallback={<div className="h-20 bg-white" />}>
          <Header />
        </Suspense>
        <main className="min-h-screen" style={{ margin: 0, position: 'relative' }}>{children}</main>
        <ConditionalFooter />
      </body>
    </html>
  );
}
