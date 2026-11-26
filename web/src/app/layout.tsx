import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大芯分會 · 會員資料庫",
  description: "BNI 大芯分會會員前後台與現場媒合資料庫",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
