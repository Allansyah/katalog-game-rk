import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Accounts Interactive Catalog - Game Account Marketplace",
  description:
    "B2B platform for buying and selling game accounts. Secure transactions with tiered pricing for resellers.",
  keywords: [
    "game accounts",
    "Wuthering Waves",
    "Genshin Impact",
    "HSR",
    "ZZZ",
    "marketplace",
    "B2B",
  ],
  authors: [{ name: "Rikkastore Team" }],
  icons: {
    icon: "/rikkastore-removebg-preview.png",
  },
  openGraph: {
    title: "Rikkastore.id - Game Account Marketplace",
    description: "B2B platform for buying and selling game accounts",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-zinc-950 text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
