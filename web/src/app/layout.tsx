import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const noto = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BhuRaksha — One Nation, One Land Ledger",
  description:
    "Blockchain land registry for tamper-evident ownership verification, multi-party transfers, and AI document integrity checks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${noto.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
