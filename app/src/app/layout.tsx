import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-jbmono" });

export const metadata: Metadata = {
  title: "BotBadge · Learn to Earn",
  description: "Learn-to-earn soulbound badge on BOT Chain — live on BOT Chain mainnet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={mono.variable + " font-sans"}>{children}</body>
    </html>
  );
}
