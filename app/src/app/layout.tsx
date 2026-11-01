import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Inter at 100/300 stands in for te-20/te-40 — thin industrial voice.
const sans = Inter({ subsets: ["latin"], weight: ["100", "200", "300", "400", "500"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-jbmono" });

export const metadata: Metadata = {
  title: "BotBadge · Learn to Earn",
  description: "Learn-to-earn soulbound badge on BOT Chain — live on BOT Chain mainnet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={sans.variable + " " + mono.variable + " font-sans"}>{children}</body>
    </html>
  );
}
