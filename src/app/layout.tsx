import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KalfMedia Planlama",
  description: "Kreatif stüdyolar, solo editörler ve ajanslar için iş ve finans yönetim paneli",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ overflowX: 'hidden', maxWidth: '100vw' }}
    >
      <body className="min-h-full flex flex-col" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>{children}</body>
    </html>
  );
}
